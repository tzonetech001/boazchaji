<?php
declare(strict_types=1);

$config = require __DIR__ . '/config.php';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === $config['app_url']) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/src/Api.php';

try {
    $requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $basePath = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/\\');
    $path = preg_replace('#^' . preg_quote($basePath, '#') . '#', '', $requestPath);
    (new Api())->dispatch($_SERVER['REQUEST_METHOD'], $path);
} catch (Throwable $error) {
    error_log('[boazchaji-api] ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error. Check the PHP error log.']);
}
