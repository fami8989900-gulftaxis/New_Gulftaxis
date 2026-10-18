<?php
declare(strict_types=1);

namespace GulfTaxis\Middleware;

use GulfTaxis\Utils\Response;

class RoleMiddleware
{
    /**
     * Enforces required roles on the authenticated user.
     * Roles: ADMINISTRATOR, DISPATCHER, BOOKING_AGENT
     *
     * @param array $user Authenticated user array
     * @param array $allowedRoles Array of permitted roles (e.g. ['ADMINISTRATOR', 'DISPATCHER'])
     */
    public static function authorize(array $user, array $allowedRoles): void
    {
        if (!in_array($user['role'], $allowedRoles, true)) {
            Response::error('Forbidden: Your user role (' . htmlspecialchars($user['role']) . ') does not have permission to perform this action.', 403);
            exit;
        }
    }

    public static function requireAdmin(array $user): void
    {
        self::authorize($user, ['ADMINISTRATOR']);
    }

    public static function requireDispatcherOrAdmin(array $user): void
    {
        self::authorize($user, ['ADMINISTRATOR', 'DISPATCHER']);
    }
}
