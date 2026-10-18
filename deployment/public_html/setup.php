<?php
declare(strict_types=1);

/**
 * GULF TAXIS DISPATCH CLOUD - FIRST-TIME HOSTINGER SETUP WIZARD
 * Allows non-technical business owners to configure their Hostinger MySQL database,
 * apply migrations, and create the first master administrator securely.
 * Automatically locks itself upon completion.
 */

$lockFile = __DIR__ . '/setup.lock';
if (file_exists($lockFile)) {
    http_response_code(403);
    die('<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Setup is Locked</h2><p>Gulf Taxis Dispatch Cloud has already been installed. For security, setup.php has been locked. To re-run, remove setup.lock or delete setup.php from public_html.</p></body></html>');
}

$message = '';
$error = '';
$step = isset($_POST['action']) ? $_POST['action'] : 'form';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $step === 'install') {
    $dbHost = trim($_POST['db_host'] ?? 'localhost');
    $dbPort = trim($_POST['db_port'] ?? '3306');
    $dbName = trim($_POST['db_name'] ?? '');
    $dbUser = trim($_POST['db_user'] ?? '');
    $dbPass = $_POST['db_pass'] ?? '';

    $adminUser = trim($_POST['admin_username'] ?? 'admin');
    $adminEmail = trim($_POST['admin_email'] ?? '');
    $adminName = trim($_POST['admin_name'] ?? 'Gulf Taxis Administrator');
    $adminPass = $_POST['admin_password'] ?? '';
    $adminPassConfirm = $_POST['admin_password_confirm'] ?? '';

    if (empty($dbName) || empty($dbUser)) {
        $error = 'Database Name and Database Username are required.';
    } elseif (empty($adminEmail) || !filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) {
        $error = 'A valid Administrator Email is required.';
    } elseif (strlen($adminPass) < 8) {
        $error = 'Administrator Password must be at least 8 characters long.';
    } elseif ($adminPass !== $adminPassConfirm) {
        $error = 'Administrator passwords do not match.';
    } else {
        try {
            // 1. Test PDO MySQL connection
            $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
            $pdo = new PDO($dsn, $dbUser, $dbPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);

            // 2. Read and apply 001_initial_schema.sql
            $schemaFile = dirname(__DIR__, 2) . '/database/migrations/001_initial_schema.sql';
            if (!file_exists($schemaFile)) {
                $schemaFile = __DIR__ . '/database/migrations/001_initial_schema.sql';
            }
            if (file_exists($schemaFile)) {
                $sql = file_get_contents($schemaFile);
                $pdo->exec($sql);
            }

            // 3. Read and apply 002_seed_data.sql if exists
            $seedFile = dirname(__DIR__, 2) . '/database/migrations/002_seed_data.sql';
            if (!file_exists($seedFile)) {
                $seedFile = __DIR__ . '/database/migrations/002_seed_data.sql';
            }
            if (file_exists($seedFile)) {
                $seedSql = file_get_contents($seedFile);
                $pdo->exec($seedSql);
            }

            // 4. Create the First Administrator Account
            $adminHash = password_hash($adminPass, PASSWORD_DEFAULT);
            $userStmt = $pdo->prepare('
                INSERT INTO users (uuid, username, email, password_hash, full_name, role, status, created_at)
                VALUES (UUID(), :u, :e, :p, :fn, "ADMINISTRATOR", "active", NOW())
                ON DUPLICATE KEY UPDATE 
                    password_hash = VALUES(password_hash),
                    full_name = VALUES(full_name),
                    role = "ADMINISTRATOR",
                    status = "active"
            ');
            $userStmt->execute([
                'u'  => $adminUser,
                'e'  => $adminEmail,
                'p'  => $adminHash,
                'fn' => $adminName
            ]);

            // 5. Write secure db_credentials.php
            $credDir = dirname(__DIR__, 2) . '/backend/config';
            if (!is_dir($credDir)) {
                $credDir = __DIR__ . '/api/config';
                if (!is_dir($credDir)) {
                    mkdir($credDir, 0750, true);
                }
            }
            $credContent = "<?php\n// Gulf Taxis Dispatch Cloud - Production DB Credentials\nreturn [\n"
                . "    'host' => " . var_export($dbHost, true) . ",\n"
                . "    'port' => " . var_export($dbPort, true) . ",\n"
                . "    'dbname' => " . var_export($dbName, true) . ",\n"
                . "    'user' => " . var_export($dbUser, true) . ",\n"
                . "    'pass' => " . var_export($dbPass, true) . ",\n"
                . "];\n";
            file_put_contents($credDir . '/db_credentials.php', $credContent);

            // 6. Write lock file
            file_put_contents($lockFile, "Installed on " . date('Y-m-d H:i:s') . " by " . $adminEmail);

            $step = 'completed';
            $message = 'Gulf Taxis Dispatch Cloud has been successfully installed and configured!';
        } catch (\PDOException $e) {
            $error = 'Database Error: ' . $e->getMessage() . '. Please double check your Hostinger MySQL credentials in hPanel.';
        } catch (\Throwable $t) {
            $error = 'Installation Error: ' . $t->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Setup - Gulf Taxis Dispatch Cloud</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-xl w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-8">
        <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-xl">
                GT
            </div>
            <div>
                <h1 class="text-xl font-bold tracking-tight text-white">Gulf Taxis Dispatch Cloud</h1>
                <p class="text-xs text-slate-400">Hostinger One-Click Setup & Migration Wizard</p>
            </div>
        </div>

        <?php if (!empty($error)): ?>
            <div class="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                <?php echo htmlspecialchars($error); ?>
            </div>
        <?php endif; ?>

        <?php if ($step === 'completed'): ?>
            <div class="p-6 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-center space-y-4">
                <svg class="w-12 h-12 mx-auto text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <h2 class="text-lg font-bold text-white"><?php echo htmlspecialchars($message); ?></h2>
                <p class="text-xs text-slate-300 leading-relaxed">
                    The MySQL schema and seed fleet data were applied. The master administrator account has been created.
                    A security lock has been placed on this setup script.
                </p>
                <div class="pt-4">
                    <a href="/" class="inline-block px-6 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm transition">
                        Open Gulf Taxis Login
                    </a>
                </div>
                <p class="text-[11px] text-slate-400">Recommendation: Delete <code>setup.php</code> from your Hostinger File Manager for maximum security.</p>
            </div>
        <?php else: ?>
            <form method="POST" action="setup.php" class="space-y-6">
                <input type="hidden" name="action" value="install">

                <div class="space-y-4">
                    <h3 class="text-sm font-semibold text-teal-400 border-b border-slate-700 pb-2">1. Hostinger MySQL Database</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-medium text-slate-300 mb-1">Database Host</label>
                            <input type="text" name="db_host" value="localhost" required class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-slate-300 mb-1">Port</label>
                            <input type="text" name="db_port" value="3306" required class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-300 mb-1">Database Name (from hPanel)</label>
                        <input type="text" name="db_name" placeholder="u123456789_dispatch" required class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-medium text-slate-300 mb-1">Database Username</label>
                            <input type="text" name="db_user" placeholder="u123456789_admin" required class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-slate-300 mb-1">Database Password</label>
                            <input type="password" name="db_pass" placeholder="••••••••" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400">
                        </div>
                    </div>
                </div>

                <div class="space-y-4">
                    <h3 class="text-sm font-semibold text-teal-400 border-b border-slate-700 pb-2">2. Master Administrator Setup</h3>
                    <div>
                        <label class="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                        <input type="text" name="admin_name" value="Managing Director" required class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-medium text-slate-300 mb-1">Admin Username</label>
                            <input type="text" name="admin_username" value="admin" required class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-slate-300 mb-1">Admin Email</label>
                            <input type="email" name="admin_email" placeholder="admin@gulftaxis.com" required class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-medium text-slate-300 mb-1">Admin Password (min 8 chars)</label>
                            <input type="password" name="admin_password" required minlength="8" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
                            <input type="password" name="admin_password_confirm" required minlength="8" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400">
                        </div>
                    </div>
                </div>

                <button type="submit" class="w-full py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm tracking-wide transition shadow-lg shadow-teal-500/20">
                    Initialize Database & Create Administrator
                </button>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>
