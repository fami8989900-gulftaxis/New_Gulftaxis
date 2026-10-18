<?php
declare(strict_types=1);

namespace GulfTaxis\Middleware;

use GulfTaxis\Config\Database;
use GulfTaxis\Utils\Response;
use PDO;

class AuthMiddleware
{
    public static function startSession(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
            session_set_cookie_params([
                'lifetime' => 86400, // 24 hours
                'path'     => '/',
                'domain'   => '',
                'secure'   => $isHttps,
                'httponly' => true,
                'samesite' => 'Lax'
            ]);
            session_name('GULF_TAXIS_SESSID');
            session_start();
        }
    }

    public static function authenticate(): array
    {
        self::startSession();

        // 1. Check server-side PHP session
        if (!empty($_SESSION['user_id'])) {
            $db = Database::getConnection();
            $stmt = $db->prepare('SELECT id, uuid, username, email, full_name, role, status FROM users WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $_SESSION['user_id']]);
            $user = $stmt->fetch();

            if ($user && $user['status'] === 'active') {
                return $user;
            }
        }

        // 2. Alternatively check Bearer token if session header provided
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
            $token = trim($matches[1]);
            // Can be used for mobile app integration
            if (isset($_SESSION['bearer_token']) && hash_equals($_SESSION['bearer_token'], $token)) {
                if (!empty($_SESSION['user_id'])) {
                    $db = Database::getConnection();
                    $stmt = $db->prepare('SELECT id, uuid, username, email, full_name, role, status FROM users WHERE id = :id LIMIT 1');
                    $stmt->execute(['id' => $_SESSION['user_id']]);
                    $user = $stmt->fetch();
                    if ($user && $user['status'] === 'active') {
                        return $user;
                    }
                }
            }
        }

        Response::error('Unauthenticated. Please log in to access Gulf Taxis Dispatch Cloud.', 401);
        exit;
    }

    public static function generateCsrfToken(): string
    {
        self::startSession();
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    public static function validateCsrfToken(): void
    {
        self::startSession();
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['csrf_token'] ?? '';
        if (empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
            Response::error('Invalid or expired CSRF token.', 403);
            exit;
        }
    }
}
