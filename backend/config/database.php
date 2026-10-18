<?php
declare(strict_types=1);

/**
 * Gulf Taxis Dispatch Cloud - Database Configuration
 * Hostinger-compatible PDO MySQL / MariaDB connection handler.
 * Uses strict prepared statements, utf8mb4 encoding, and safe error handling.
 */

namespace GulfTaxis\Config;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $instance = null;

    public static function getConnection(): PDO
    {
        if (self::$instance !== null) {
            return self::$instance;
        }

        // Hostinger database credentials - can be set via env vars or credentials file
        $configFile = __DIR__ . '/db_credentials.php';
        $config = [];
        if (file_exists($configFile)) {
            $config = require $configFile;
        }

        $host = getenv('DB_HOST') ?: ($config['host'] ?? 'localhost');
        $port = getenv('DB_PORT') ?: ($config['port'] ?? '3306');
        $dbname = getenv('DB_NAME') ?: ($config['dbname'] ?? 'gulftaxis_dispatch');
        $username = getenv('DB_USER') ?: ($config['user'] ?? 'root');
        $password = getenv('DB_PASS') ?: ($config['pass'] ?? '');

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ];

        try {
            self::$instance = new PDO($dsn, $username, $password, $options);
            return self::$instance;
        } catch (PDOException $e) {
            // Log privately on server; never expose DB credentials or stack trace to client
            error_log("Gulf Taxis DB Connection Error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Database connection failed. Please check Hostinger database configuration or run setup.php.'
            ]);
            exit;
        }
    }
}
