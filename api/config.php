<?php
declare(strict_types=1);

return [
    'db' => [
        'host' => getenv('BOAZCHAJI_DB_HOST') ?: '127.0.0.1',
        'port' => getenv('BOAZCHAJI_DB_PORT') ?: '3306',
        'name' => getenv('BOAZCHAJI_DB_NAME') ?: 'boazchaji',
        'user' => getenv('BOAZCHAJI_DB_USER') ?: 'root',
        'password' => getenv('BOAZCHAJI_DB_PASSWORD') ?: '',
    ],
    'jwt_secret' => getenv('BOAZCHAJI_JWT_SECRET') ?: '',
    'app_url' => rtrim(getenv('BOAZCHAJI_APP_URL') ?: 'http://localhost:4200', '/'),
    'mail_from' => getenv('BOAZCHAJI_MAIL_FROM') ?: 'no-reply@localhost',
    'upload_dir' => __DIR__ . '/uploads',
    'upload_url' => '/boazchaji/api/uploads',
];
