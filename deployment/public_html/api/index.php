<?php
declare(strict_types=1);

/**
 * GULF TAXIS DISPATCH CLOUD - API ENTRY POINT FOR HOSTINGER
 * Mounted at /api/index.php or /api/v1/...
 */

// Route to main backend front controller
$mainBackend = dirname(__DIR__, 2) . '/backend/public/index.php';
if (file_exists($mainBackend)) {
    require_once $mainBackend;
} else {
    // If backend folder was packaged directly alongside api/
    $siblingBackend = __DIR__ . '/backend/public/index.php';
    if (file_exists($siblingBackend)) {
        require_once $siblingBackend;
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Gulf Taxis Backend files not found. Ensure backend/ folder is uploaded to your hosting account.'
        ]);
    }
}
