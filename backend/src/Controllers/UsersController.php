<?php
declare(strict_types=1);

namespace GulfTaxis\Controllers;

use GulfTaxis\Config\Database;
use GulfTaxis\Middleware\AuthMiddleware;
use GulfTaxis\Middleware\RoleMiddleware;
use GulfTaxis\Utils\Response;
use PDO;

class UsersController
{
    public function index(): void
    {
        $user = AuthMiddleware::authenticate();
        RoleMiddleware::requireAdmin($user);
        $db = Database::getConnection();

        $stmt = $db->query('
            SELECT id, uuid, username, email, full_name, role, phone, status, last_login_at, created_at, updated_at
            FROM users
            ORDER BY created_at DESC
        ');
        $users = $stmt->fetchAll();

        Response::success($users);
    }

    public function store(): void
    {
        $currentUser = AuthMiddleware::authenticate();
        RoleMiddleware::requireAdmin($currentUser);
        $db = Database::getConnection();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $username = trim($input['username'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');
        $fullName = trim($input['full_name'] ?? '');
        $role = trim($input['role'] ?? 'BOOKING_AGENT');

        if (empty($username) || empty($email) || empty($password) || empty($fullName)) {
            Response::error('All fields (Username, Email, Full Name, Password) are required.', 422);
            return;
        }

        if (!in_array($role, ['ADMINISTRATOR', 'DISPATCHER', 'BOOKING_AGENT'], true)) {
            Response::error('Invalid user role selected.', 422);
            return;
        }

        // Check unique username and email
        $checkStmt = $db->prepare('SELECT id FROM users WHERE username = :u OR email = :e LIMIT 1');
        $checkStmt->execute(['u' => $username, 'e' => $email]);
        if ($checkStmt->fetch()) {
            Response::error('A user with this username or email already exists.', 409);
            return;
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $db->prepare('
            INSERT INTO users (uuid, username, email, password_hash, full_name, role, phone, status)
            VALUES (UUID(), :u, :e, :p, :fn, :r, :ph, :s)
        ');
        $stmt->execute([
            'u'  => $username,
            'e'  => $email,
            'p'  => $passwordHash,
            'fn' => $fullName,
            'r'  => $role,
            'ph' => $input['phone'] ?? null,
            's'  => $input['status'] ?? 'active'
        ]);

        $newUserId = (int)$db->lastInsertId();

        // Audit Log
        $auditStmt = $db->prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, details_json) VALUES (:uid, "USER_CREATED", "users", :eid, :ip, :det)');
        $auditStmt->execute([
            'uid' => $currentUser['id'],
            'eid' => $newUserId,
            'ip'  => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
            'det' => json_encode(['username' => $username, 'role' => $role])
        ]);

        Response::success(['id' => $newUserId], 'User account created successfully.', 201);
    }

    public function update(int $id): void
    {
        $currentUser = AuthMiddleware::authenticate();
        RoleMiddleware::requireAdmin($currentUser);
        $db = Database::getConnection();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $fields = [];
        $params = ['id' => $id];

        if (!empty($input['full_name'])) {
            $fields[] = 'full_name = :fn';
            $params['fn'] = trim($input['full_name']);
        }
        if (!empty($input['email'])) {
            $fields[] = 'email = :em';
            $params['em'] = trim($input['email']);
        }
        if (!empty($input['phone'])) {
            $fields[] = 'phone = :ph';
            $params['ph'] = trim($input['phone']);
        }
        if (!empty($input['role']) && in_array($input['role'], ['ADMINISTRATOR', 'DISPATCHER', 'BOOKING_AGENT'], true)) {
            $fields[] = 'role = :r';
            $params['r'] = $input['role'];
        }
        if (!empty($input['status']) && in_array($input['status'], ['active', 'inactive'], true)) {
            $fields[] = 'status = :st';
            $params['st'] = $input['status'];
        }
        if (!empty($input['password'])) {
            $fields[] = 'password_hash = :phash';
            $params['phash'] = password_hash(trim($input['password']), PASSWORD_DEFAULT);
        }

        if (empty($fields)) {
            Response::error('No update parameters provided.', 422);
            return;
        }

        $fields[] = 'updated_at = NOW()';
        $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        Response::success(null, 'User updated successfully.');
    }

    public function auditLogs(): void
    {
        $currentUser = AuthMiddleware::authenticate();
        RoleMiddleware::requireAdmin($currentUser);
        $db = Database::getConnection();

        $stmt = $db->query('
            SELECT a.*, u.username, u.full_name, u.role
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
            LIMIT 100
        ');
        $logs = $stmt->fetchAll();

        Response::success($logs);
    }
}
