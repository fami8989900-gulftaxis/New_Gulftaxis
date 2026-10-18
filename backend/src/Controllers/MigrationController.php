<?php
declare(strict_types=1);

namespace GulfTaxis\Controllers;

use GulfTaxis\Config\Database;
use GulfTaxis\Middleware\AuthMiddleware;
use GulfTaxis\Utils\Response;
use PDO;
use Throwable;

class MigrationController
{
    /**
     * Executes pending database migrations.
     * Accessible via CI/CD using X-Deploy-Token or via authenticated Administrator session.
     */
    public function migrate(): void
    {
        // 1. Authorize: Check deployment token or admin session
        $authorized = false;
        $authHeader = $_SERVER['HTTP_X_DEPLOY_TOKEN'] ?? $_SERVER['HTTP_X_MIGRATION_TOKEN'] ?? '';

        $configFile = dirname(__DIR__, 2) . '/config/db_credentials.php';
        $config = file_exists($configFile) ? require $configFile : [];
        $expectedToken = getenv('DEPLOY_MIGRATION_TOKEN') ?: ($config['deploy_migration_token'] ?? null);

        if (!empty($authHeader) && !empty($expectedToken) && hash_equals($expectedToken, $authHeader)) {
            $authorized = true;
        } else {
            // Check if logged in as administrator
            AuthMiddleware::startSession();
            if (!empty($_SESSION['user_id']) && ($_SESSION['user_role'] ?? '') === 'ADMINISTRATOR') {
                $authorized = true;
            }
        }

        if (!$authorized) {
            Response::error('Unauthorized migration request. Valid X-Deploy-Token header or Administrator session required.', 403);
            return;
        }

        $db = Database::getConnection();

        // 2. Ensure schema_migrations table exists
        $db->exec('
            CREATE TABLE IF NOT EXISTS `schema_migrations` (
                `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                `version` VARCHAR(50) NOT NULL UNIQUE,
                `description` VARCHAR(255) NOT NULL,
                `applied_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ');

        // 3. Get list of already applied migrations
        $stmt = $db->query('SELECT `version` FROM `schema_migrations`');
        $applied = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // 4. Locate migrations directory
        $migrationsDir = dirname(__DIR__, 2) . '/database/migrations';
        if (!is_dir($migrationsDir)) {
            $migrationsDir = dirname(__DIR__, 3) . '/database/migrations';
        }

        if (!is_dir($migrationsDir)) {
            Response::error("Migrations directory not found on server at {$migrationsDir}", 500);
            return;
        }

        $migrationFiles = glob($migrationsDir . '/*.sql');
        sort($migrationFiles);

        $executed = [];
        $skipped = [];

        foreach ($migrationFiles as $filePath) {
            $filename = basename($filePath);
            $version = pathinfo($filename, PATHINFO_FILENAME);

            if (in_array($version, $applied, true)) {
                $skipped[] = $version;
                continue;
            }

            $sqlContent = file_get_contents($filePath);
            if (empty(trim($sqlContent))) {
                continue;
            }

            // Execute migration statements
            try {
                $db->beginTransaction();

                // Strip comments and split by semicolon for multiple queries if needed
                $db->exec($sqlContent);

                // Record in schema_migrations
                $ins = $db->prepare('INSERT INTO `schema_migrations` (`version`, `description`) VALUES (:v, :d)');
                $ins->execute([
                    'v' => $version,
                    'd' => 'Applied via Gulf Taxis CI/CD deploy runner'
                ]);

                $db->commit();
                $executed[] = $version;
            } catch (Throwable $e) {
                if ($db->inTransaction()) {
                    $db->rollBack();
                }
                Response::error("Migration failed at {$version}: " . $e->getMessage(), 500, [
                    'failed_migration' => $version,
                    'file' => $filename,
                    'previously_executed' => $executed
                ]);
                return;
            }
        }

        Response::success([
            'status' => 'completed',
            'executed_migrations' => $executed,
            'skipped_count' => count($skipped),
            'latest_version' => !empty($executed) ? end($executed) : (!empty($skipped) ? end($skipped) : 'none'),
            'timestamp' => date('c')
        ], !empty($executed) ? 'New database migrations applied successfully.' : 'Database is already up to date.');
    }
}
