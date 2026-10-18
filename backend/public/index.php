<?php
declare(strict_types=1);

/**
 * Gulf Taxis Dispatch Cloud - API Front Controller
 * PHP 8.2+ REST API Router for Hostinger Shared Hosting
 */

// Autoloader for application classes
spl_autoload_register(function ($class) {
    $prefix = 'GulfTaxis\\';
    $baseDir = dirname(__DIR__) . '/src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        if ($class === 'GulfTaxis\\Config\\Database') {
            require_once dirname(__DIR__) . '/config/database.php';
            return;
        }
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

use GulfTaxis\Config\Database;
use GulfTaxis\Controllers\AuthController;
use GulfTaxis\Controllers\BookingsController;
use GulfTaxis\Controllers\DriversController;
use GulfTaxis\Controllers\VehiclesController;
use GulfTaxis\Controllers\ReportsController;
use GulfTaxis\Controllers\BackupController;
use GulfTaxis\Controllers\UsersController;
use GulfTaxis\Controllers\MigrationController;
use GulfTaxis\Utils\Response;

// Global Headers & Security
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
$method = $_SERVER['REQUEST_METHOD'];

// Standardize path by stripping subfolders (e.g. Hostinger subdirectory or /public_html)
$uri = preg_replace('#^/.*?(api/v1)#', '/api/v1', $uri);

// Route: Health check (safe, reveals no credentials)
if ($uri === '/api/v1/health' && $method === 'GET') {
    $dbOk = false;
    try {
        $db = Database::getConnection();
        $dbOk = ($db->query('SELECT 1')->fetchColumn() === 1);
    } catch (\Throwable $t) {
        $dbOk = false;
    }

    Response::json([
        'status' => $dbOk ? 'healthy' : 'degraded',
        'system' => 'Gulf Taxis Dispatch Cloud API',
        'version' => '1.0.0',
        'database' => $dbOk ? 'connected' : 'error',
        'timestamp' => date('c')
    ]);
}

// Route: Auth
$auth = new AuthController();
if ($uri === '/api/v1/auth/login' && $method === 'POST') {
    $auth->login();
}
if ($uri === '/api/v1/auth/logout' && $method === 'POST') {
    $auth->logout();
}
if ($uri === '/api/v1/auth/me' && $method === 'GET') {
    $auth->me();
}
if ($uri === '/api/v1/auth/forgot-password' && $method === 'POST') {
    $auth->forgotPassword();
}
if ($uri === '/api/v1/auth/reset-password' && $method === 'POST') {
    $auth->resetPassword();
}

// Route: Bookings
$bookings = new BookingsController();
if ($uri === '/api/v1/bookings' && $method === 'GET') {
    $bookings->index();
}
if ($uri === '/api/v1/bookings' && $method === 'POST') {
    $bookings->store();
}
if (preg_match('#^/api/v1/bookings/(\d+)$#', $uri, $m)) {
    $id = (int)$m[1];
    if ($method === 'GET') $bookings->show($id);
    if ($method === 'PATCH' || $method === 'PUT') $bookings->update($id);
}
if (preg_match('#^/api/v1/bookings/(\d+)/assign$#', $uri, $m) && $method === 'POST') {
    $bookings->assign((int)$m[1]);
}
if (preg_match('#^/api/v1/bookings/(\d+)/status$#', $uri, $m) && $method === 'POST') {
    $bookings->updateStatus((int)$m[1]);
}

// Route: Drivers
$drivers = new DriversController();
if ($uri === '/api/v1/drivers' && $method === 'GET') {
    $drivers->index();
}
if ($uri === '/api/v1/drivers' && $method === 'POST') {
    $drivers->store();
}
if (preg_match('#^/api/v1/drivers/(\d+)$#', $uri, $m) && ($method === 'PATCH' || $method === 'PUT')) {
    $drivers->update((int)$m[1]);
}

// Route: Vehicles
$vehicles = new VehiclesController();
if ($uri === '/api/v1/vehicles' && $method === 'GET') {
    $vehicles->index();
}
if ($uri === '/api/v1/vehicles' && $method === 'POST') {
    $vehicles->store();
}
if (preg_match('#^/api/v1/vehicles/(\d+)$#', $uri, $m) && ($method === 'PATCH' || $method === 'PUT')) {
    $vehicles->update((int)$m[1]);
}

// Route: Reports
$reports = new ReportsController();
if ($uri === '/api/v1/reports/daily' && $method === 'GET') {
    $reports->daily();
}
if ($uri === '/api/v1/reports/drivers' && $method === 'GET') {
    $reports->driverReport();
}
if ($uri === '/api/v1/reports/vehicles' && $method === 'GET') {
    $reports->vehicleUtilization();
}

// Route: Backups
$backup = new BackupController();
if ($uri === '/api/v1/admin/backups' && $method === 'GET') {
    $backup->index();
}
if ($uri === '/api/v1/admin/backups' && $method === 'POST') {
    $backup->create();
}
if ($uri === '/api/v1/admin/backups/download' && $method === 'GET') {
    $backup->download();
}

// Route: Users & Audit Logs
$users = new UsersController();
if ($uri === '/api/v1/admin/users' && $method === 'GET') {
    $users->index();
}
if ($uri === '/api/v1/admin/users' && $method === 'POST') {
    $users->store();
}
if (preg_match('#^/api/v1/admin/users/(\d+)$#', $uri, $m) && ($method === 'PATCH' || $method === 'PUT')) {
    $users->update((int)$m[1]);
}
if ($uri === '/api/v1/admin/audit-logs' && $method === 'GET') {
    $users->auditLogs();
}

// Route: Automated & Controlled Database Migrations
$migration = new MigrationController();
if ($uri === '/api/v1/admin/migrate' && $method === 'POST') {
    $migration->migrate();
}

// If no route matched
Response::error("Endpoint not found: {$method} {$uri}", 404);
