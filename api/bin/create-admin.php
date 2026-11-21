<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/Database.php';

$phone = getenv('BOAZCHAJI_ADMIN_PHONE') ?: '';
$password = getenv('BOAZCHAJI_ADMIN_PASSWORD') ?: '';
if (!preg_match('/^(07|06)[0-9]{8}$/', $phone) ||
    !preg_match('/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&._-]{8,}$/', $password)) {
    fwrite(STDERR, "Set BOAZCHAJI_ADMIN_PHONE (10 digits starting 06/07) and BOAZCHAJI_ADMIN_PASSWORD (8+ alphanumeric) first.\n");
    exit(1);
}

$db = Database::connection();
$statement = $db->prepare(
    "INSERT INTO users (first_name, last_name, phone, password, role, is_super_admin)
     VALUES (?, ?, ?, ?, 'admin', 1)"
);
$statement->execute([
    getenv('BOAZCHAJI_ADMIN_FIRST_NAME') ?: 'System',
    getenv('BOAZCHAJI_ADMIN_LAST_NAME') ?: 'Administrator',
    $phone,
    password_hash($password, PASSWORD_DEFAULT),
]);
fwrite(STDOUT, "Super-admin created for phone {$phone}.\n");
