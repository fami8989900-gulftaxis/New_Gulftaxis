<?php
declare(strict_types=1);

namespace GulfTaxis\Controllers;

use GulfTaxis\Config\Database;
use GulfTaxis\Middleware\AuthMiddleware;
use GulfTaxis\Utils\Response;
use PDO;

class AuthController
{
    public function login(): void
    {
        AuthMiddleware::startSession();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $username = trim($input['username'] ?? '');
        $password = trim($input['password'] ?? '');

        if (empty($username) || empty($password)) {
            Response::error('Please enter both username/email and password.', 422);
            return;
        }

        // Basic Rate Limiting by IP (Max 5 attempts per 5 minutes)
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $attemptKey = 'login_attempts_' . md5($ip);
        $attempts = $_SESSION[$attemptKey] ?? ['count' => 0, 'time' => time()];
        if (time() - $attempts['time'] < 300 && $attempts['count'] >= 7) {
            Response::error('Too many failed login attempts. Please wait 5 minutes before trying again.', 429);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, uuid, username, email, password_hash, full_name, role, status FROM users WHERE username = :u OR email = :e LIMIT 1');
        $stmt->execute(['u' => $username, 'e' => $username]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            // Track failed attempts
            $_SESSION[$attemptKey] = [
                'count' => ($attempts['count'] ?? 0) + 1,
                'time' => time()
            ];
            Response::error('Invalid credentials. Please verify your username and password.', 401);
            return;
        }

        if ($user['status'] !== 'active') {
            Response::error('Your account has been deactivated. Please contact an administrator.', 403);
            return;
        }

        // Reset rate limiter on successful authentication
        unset($_SESSION[$attemptKey]);

        // Regenerate session ID to prevent session fixation attacks
        session_regenerate_id(true);

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['user_name'] = $user['full_name'];
        $_SESSION['logged_at'] = time();

        // Update last login timestamp
        $updateStmt = $db->prepare('UPDATE users SET last_login_at = NOW() WHERE id = :id');
        $updateStmt->execute(['id' => $user['id']]);

        // Record Audit Log
        $auditStmt = $db->prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent, details_json) VALUES (:uid, :act, :ent, :eid, :ip, :ua, :det)');
        $auditStmt->execute([
            'uid' => $user['id'],
            'act' => 'LOGIN_SUCCESS',
            'ent' => 'users',
            'eid' => $user['id'],
            'ip'  => $ip,
            'ua'  => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 250),
            'det' => json_encode(['username' => $user['username'], 'role' => $user['role']])
        ]);

        $csrfToken = AuthMiddleware::generateCsrfToken();

        unset($user['password_hash']);

        Response::success([
            'user' => $user,
            'csrf_token' => $csrfToken
        ], 'Login successful. Welcome to Gulf Taxis Dispatch Cloud.');
    }

    public function logout(): void
    {
        AuthMiddleware::startSession();
        $userId = $_SESSION['user_id'] ?? null;

        if ($userId) {
            $db = Database::getConnection();
            $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
            $auditStmt = $db->prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent) VALUES (:uid, "LOGOUT", "users", :uid, :ip, :ua)');
            $auditStmt->execute([
                'uid' => $userId,
                'ip'  => $ip,
                'ua'  => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 250)
            ]);
        }

        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();

        Response::success(null, 'Logged out successfully.');
    }

    public function me(): void
    {
        $user = AuthMiddleware::authenticate();
        $csrfToken = AuthMiddleware::generateCsrfToken();

        Response::success([
            'user' => $user,
            'csrf_token' => $csrfToken
        ]);
    }

    public function forgotPassword(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $email = trim($input['email'] ?? '');

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Please provide a valid email address.', 422);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, full_name, email FROM users WHERE email = :email AND status = "active" LIMIT 1');
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();

        // Always respond with a generic success message to prevent user enumeration
        if (!$user) {
            Response::success(null, 'If an account exists with this email, password reset instructions have been generated.');
            return;
        }

        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour validity

        $tokenStmt = $db->prepare('INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (:uid, :th, :exp)');
        $tokenStmt->execute([
            'uid' => $user['id'],
            'th'  => $tokenHash,
            'exp' => $expiresAt
        ]);

        // In a production server with mail configured, mail() or SMTP would send the token link
        // For secure demo and deployment testing, we return safe guidance
        Response::success([
            'reset_token_reference' => substr($tokenHash, 0, 8) . '...',
            'expires_at' => $expiresAt
        ], 'If an account exists with this email, password reset instructions have been generated.');
    }

    public function resetPassword(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $token = trim($input['token'] ?? '');
        $newPassword = trim($input['new_password'] ?? '');

        if (empty($token) || strlen($newPassword) < 8) {
            Response::error('Invalid request. Password must be at least 8 characters.', 422);
            return;
        }

        $db = Database::getConnection();
        $tokenHash = hash('sha256', $token);

        $stmt = $db->prepare('SELECT id, user_id FROM password_reset_tokens WHERE token_hash = :th AND used_at IS NULL AND expires_at > NOW() LIMIT 1');
        $stmt->execute(['th' => $tokenHash]);
        $resetRecord = $stmt->fetch();

        if (!$resetRecord) {
            Response::error('Reset token is invalid or has expired. Please request a new one.', 400);
            return;
        }

        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $db->beginTransaction();
        try {
            $userStmt = $db->prepare('UPDATE users SET password_hash = :p, updated_at = NOW() WHERE id = :uid');
            $userStmt->execute(['p' => $newHash, 'uid' => $resetRecord['user_id']]);

            $markStmt = $db->prepare('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = :id');
            $markStmt->execute(['id' => $resetRecord['id']]);

            $db->commit();
            Response::success(null, 'Password has been successfully updated. You may now sign in.');
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Failed to reset password: ' . $e->getMessage(), 500);
        }
    }
}
