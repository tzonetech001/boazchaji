<?php
declare(strict_types=1);

// Headers za CORS (Ruhusu kila kitu kwa sasa kwa ajili ya majaribio)
header('Access-Control-Allow-Origin: *');
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
    // Tumeongeza $error->getMessage() ili uone kosa halisi kama database imegoma
    echo json_encode(['error' => 'Internal server error: ' . $error->getMessage()]);
}