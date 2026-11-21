<?php
declare(strict_types=1);

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Jwt.php';

final class Api
{
    private PDO $db;
    private ?array $actor = null;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    public function dispatch(string $method, string $path): void
    {
        $path = '/' . trim($path, '/');

        if ($method === 'POST' && $path === '/auth/login') {
            $this->login();
        }
        if ($method === 'POST' && $path === '/auth/forgot-password') {
            $this->forgotPassword();
        }
        if ($method === 'POST' && $path === '/auth/reset-password') {
            $this->resetPassword();
        }

        if ($method === 'POST' && $path === '/auth/register') {
            $this->requireRole('admin');
            $this->createUser();
        }
        if ($path === '/users' && $method === 'GET') {
            $this->requireRole('admin');
            $this->users();
        }
        if ($path === '/users' && $method === 'POST') {
            $this->requireRole('admin');
            $this->createUser();
        }
        if (preg_match('#^/users/(\d+)/preferences$#', $path, $match) && $method === 'PATCH') {
            $this->preferences((int) $match[1]);
        }
        if (preg_match('#^/users/(\d+)/profile-image$#', $path, $match) && $method === 'POST') {
            $this->profileImage((int) $match[1]);
        }
        if ($path === '/customers' && $method === 'GET') {
            $this->customers();
        }
        if ($path === '/customers' && $method === 'POST') {
            $this->createCustomer();
        }
        if ($path === '/device_types' && $method === 'GET') {
            $this->deviceTypes();
        }
        if ($path === '/device_types' && $method === 'POST') {
            $this->createDeviceType();
        }
        if ($path === '/services' && $method === 'GET') {
            $this->services();
        }
        if ($path === '/services' && $method === 'POST') {
            $this->createService();
        }
        if (preg_match('#^/services/(\d+)/pay$#', $path, $match) && $method === 'PUT') {
            $this->payService((int) $match[1]);
        }
        if ($path === '/dashboard' && $method === 'GET') {
            $this->dashboard();
        }
        if ($path === '/activity' && $method === 'GET') {
            $this->activity();
        }

        self::respond(['error' => 'Not found.'], 404);
    }

    private function login(): void
    {
        $input = self::jsonBody();
        $phone = self::phone($input['phone'] ?? '');
        $statement = $this->db->prepare('SELECT * FROM users WHERE phone = ? LIMIT 1');
        $statement->execute([$phone]);
        $user = $statement->fetch();
        if (!$user || !password_verify((string) ($input['password'] ?? ''), $user['password'])) {
            self::respond(['error' => 'Invalid phone number or password.'], 401);
        }

        $publicUser = $this->publicUser($user);
        self::respond([
            'token' => Jwt::issue([
                'sub' => (int) $user['id'],
                'role' => $user['role'],
                'is_super_admin' => (bool) $user['is_super_admin'],
                'ver' => (int) $user['auth_version'],
            ]),
            'user' => $publicUser,
        ]);
    }

    private function forgotPassword(): void
    {
        $input = self::jsonBody();
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            self::respond(['error' => 'Enter a valid email address.'], 422);
        }

        $genericResponse = ['message' => 'If an account exists for that email, reset instructions will be sent shortly.'];
        $statement = $this->db->prepare('SELECT id, email, first_name FROM users WHERE email = ? LIMIT 1');
        $statement->execute([$email]);
        $user = $statement->fetch();
        if (!$user) {
            self::respond($genericResponse);
        }

        $rateLimit = $this->db->prepare(
            'SELECT COUNT(*) FROM password_reset_tokens WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)'
        );
        $rateLimit->execute([$user['id']]);
        if ((int) $rateLimit->fetchColumn() >= 3) {
            self::respond($genericResponse);
        }

        $token = bin2hex(random_bytes(32));
        $this->db->beginTransaction();
        $invalidate = $this->db->prepare('UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL');
        $invalidate->execute([$user['id']]);
        $insert = $this->db->prepare(
            'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))'
        );
        $insert->execute([$user['id'], hash('sha256', $token)]);
        $this->db->commit();

        $config = require __DIR__ . '/../config.php';
        $resetUrl = $config['app_url'] . '/reset-password#token=' . rawurlencode($token);
        $subject = 'Reset your BOAZCHAJI password';
        $message = "Hello {$user['first_name']},\n\nUse this link within 30 minutes to set a new password:\n{$resetUrl}\n\nIf you did not request this, you can ignore this email.";
        $from = filter_var($config['mail_from'], FILTER_VALIDATE_EMAIL);
        if ($from === false) {
            error_log('[boazchaji-api] BOAZCHAJI_MAIL_FROM is not a valid email address.');
        } elseif (!mail($user['email'], $subject, $message, "From: {$from}\r\nContent-Type: text/plain; charset=UTF-8")) {
            error_log('[boazchaji-api] Password reset email could not be sent.');
        }

        self::respond($genericResponse);
    }

    private function resetPassword(): void
    {
        $input = self::jsonBody();
        $token = (string) ($input['token'] ?? '');
        $password = (string) ($input['password'] ?? '');
        $confirmation = (string) ($input['confirm_password'] ?? '');
        if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
            self::respond(['error' => 'This reset link is invalid or expired. Request a new one.'], 400);
        }
        if (!preg_match('/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&._-]{8,}$/', $password)) {
            self::respond(['error' => 'Password must be at least 8 characters and contain letters and numbers.'], 422);
        }
        if (!hash_equals($password, $confirmation)) {
            self::respond(['error' => 'Passwords do not match.'], 422);
        }

        $this->db->beginTransaction();
        $statement = $this->db->prepare(
            'SELECT id, user_id FROM password_reset_tokens
             WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1 FOR UPDATE'
        );
        $statement->execute([hash('sha256', $token)]);
        $reset = $statement->fetch();
        if (!$reset) {
            $this->db->rollBack();
            self::respond(['error' => 'This reset link is invalid or expired. Request a new one.'], 400);
        }

        $updateUser = $this->db->prepare('UPDATE users SET password = ?, auth_version = auth_version + 1 WHERE id = ?');
        $updateUser->execute([password_hash($password, PASSWORD_DEFAULT), $reset['user_id']]);
        $useToken = $this->db->prepare('UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL');
        $useToken->execute([$reset['user_id']]);
        $this->db->commit();
        self::respond(['message' => 'Password updated. You can now sign in.']);
    }

    private function createUser(): void
    {
        $input = self::jsonBody();
        $phone = self::phone($input['phone'] ?? '');
        $password = (string) ($input['password'] ?? '');
        if (!preg_match('/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&._-]{8,}$/', $password)) {
            self::respond(['error' => 'Password must be at least 8 characters and contain letters and numbers.'], 422);
        }
        $role = $this->actor['role'] === 'admin' ? 'agent' : ($input['role'] ?? 'agent');
        if (!in_array($role, ['admin', 'agent'], true)) {
            self::respond(['error' => 'Invalid role.'], 422);
        }
        $statement = $this->db->prepare(
            'INSERT INTO users (first_name, second_name, last_name, phone, email, sex, password, role)
             VALUES (:first_name, :second_name, :last_name, :phone, :email, :sex, :password, :role)'
        );
        try {
            $statement->execute([
                'first_name' => self::requiredText($input, 'first_name', 80),
                'second_name' => self::optionalText($input, 'second_name', 80),
                'last_name' => self::requiredText($input, 'last_name', 80),
                'phone' => $phone,
                'email' => self::optionalText($input, 'email', 190),
                'sex' => in_array($input['sex'] ?? null, ['male', 'female', 'other'], true) ? $input['sex'] : null,
                'password' => password_hash($password, PASSWORD_DEFAULT),
                'role' => $role,
            ]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                self::respond(['error' => 'That phone number or email is already in use.'], 409);
            }
            throw $error;
        }
        $id = (int) $this->db->lastInsertId();
        $this->log('user.created', $id);
        self::respond(['user' => $this->findUser($id)], 201);
    }

    private function users(): void
    {
        $statement = $this->db->query(
            "SELECT id, first_name, second_name, last_name, phone, email, sex, role, language, theme, profile_image_path, created_at
             FROM users WHERE role = 'agent' ORDER BY created_at DESC"
        );
        self::respond(['items' => $statement->fetchAll()]);
    }

    private function preferences(int $id): void
    {
        $actor = $this->requireUserManagementAccess($id);

        $input = self::jsonBody();
        $language = $input['language'] ?? null;
        $theme = $input['theme'] ?? null;
        if (!in_array($language, ['sw', 'en'], true) || !in_array($theme, ['light', 'dark'], true)) {
            self::respond(['error' => 'Language or theme is invalid.'], 422);
        }
        $statement = $this->db->prepare('UPDATE users SET language = ?, theme = ? WHERE id = ?');
        $statement->execute([$language, $theme, $id]);
        self::respond(['ok' => true]);
    }

    private function profileImage(int $id): void
    {
        $actor = $this->requireUserManagementAccess($id);
        $imagePath = $this->saveImage($_FILES['image'] ?? null);
        if ($imagePath === null) {
            self::respond(['error' => 'Choose an image to upload.'], 422);
        }
        $update = $this->db->prepare('UPDATE users SET profile_image_path = ? WHERE id = ?');
        $update->execute([$imagePath, $id]);
        $this->log('user.profile_image_updated', $id);
        self::respond(['profile_image_path' => $imagePath]);
    }

    private function customers(): void
    {
        $actor = $this->requireAuth();
        $search = trim((string) ($_GET['search'] ?? ''));
        $sql = 'SELECT id, name, phone, created_by_agent_id FROM customers WHERE name LIKE ?';
        $params = ['%' . $search . '%'];
        if ($actor['role'] !== 'admin') {
            $sql .= ' AND created_by_agent_id = ?';
            $params[] = $actor['id'];
        }
        $sql .= ' ORDER BY name LIMIT 20';
        $statement = $this->db->prepare($sql);
        $statement->execute($params);
        self::respond(['items' => $statement->fetchAll()]);
    }

    private function createCustomer(): void
    {
        $actor = $this->requireAuth();
        $input = self::jsonBody();
        $name = self::requiredText($input, 'name', 160);
        $phone = isset($input['phone']) && $input['phone'] !== '' ? self::phone($input['phone']) : null;
        $statement = $this->db->prepare(
            'INSERT INTO customers (name, phone, created_by_agent_id) VALUES (?, ?, ?)'
        );
        $statement->execute([$name, $phone, $actor['id']]);
        $id = (int) $this->db->lastInsertId();
        $this->log('customer.created', $id);
        self::respond(['customer' => ['id' => $id, 'name' => $name, 'phone' => $phone]], 201);
    }

    private function deviceTypes(): void
    {
        $this->requireAuth();
        self::respond(['items' => $this->db->query('SELECT id, name FROM device_types ORDER BY name')->fetchAll()]);
    }

    private function createDeviceType(): void
    {
        $actor = $this->requireAuth();
        $input = self::jsonBody();
        $name = self::requiredText($input, 'name', 80);
        try {
            $statement = $this->db->prepare('INSERT INTO device_types (name, created_by_user_id) VALUES (?, ?)');
            $statement->execute([$name, $actor['id']]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                self::respond(['error' => 'That device type already exists.'], 409);
            }
            throw $error;
        }
        $id = (int) $this->db->lastInsertId();
        $this->log('device_type.created', $id);
        self::respond(['device_type' => ['id' => $id, 'name' => $name]], 201);
    }

    private function services(): void
    {
        $actor = $this->requireAuth();
        $where = [];
        $params = [];
        if ($actor['role'] !== 'admin') {
            $where[] = 's.agent_id = ?';
            $params[] = $actor['id'];
        } elseif (isset($_GET['agent_id']) && ctype_digit((string) $_GET['agent_id'])) {
            $where[] = 's.agent_id = ?';
            $params[] = (int) $_GET['agent_id'];
        }
        if (isset($_GET['status']) && in_array($_GET['status'], ['pending', 'paid'], true)) {
            $where[] = 's.status = ?';
            $params[] = $_GET['status'];
        }
        $sql = 'SELECT s.id, s.agent_id, s.customer_id, c.name AS customer_name, c.phone AS customer_phone,
                       s.device_type_id, d.name AS device_type, s.device_name, s.quantity, s.amount,
                       s.status, s.image_path, s.created_at, s.updated_at, u.first_name AS agent_first_name,
                       u.last_name AS agent_last_name
                FROM services s
                JOIN customers c ON c.id = s.customer_id
                JOIN device_types d ON d.id = s.device_type_id
                JOIN users u ON u.id = s.agent_id';
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY s.created_at DESC LIMIT 200';
        $statement = $this->db->prepare($sql);
        $statement->execute($params);
        self::respond(['items' => $statement->fetchAll()]);
    }

    private function createService(): void
    {
        $actor = $this->requireAuth();
        $agentId = $actor['id'];
        if ($actor['role'] === 'admin' && !isset($_POST['agent_id'])) {
            self::respond(['error' => 'Select an agent for this service.'], 422);
        }
        if ($actor['role'] === 'admin' && isset($_POST['agent_id'])) {
            if (!ctype_digit((string) $_POST['agent_id'])) {
                self::respond(['error' => 'Invalid agent.'], 422);
            }
            $agentId = (int) $_POST['agent_id'];
            $check = $this->db->prepare("SELECT id FROM users WHERE id = ? AND role = 'agent'");
            $check->execute([$agentId]);
            if (!$check->fetch()) {
                self::respond(['error' => 'Selected agent was not found.'], 422);
            }
        }
        $customerId = filter_var($_POST['customer_id'] ?? null, FILTER_VALIDATE_INT);
        $typeId = filter_var($_POST['device_type_id'] ?? null, FILTER_VALIDATE_INT);
        $quantity = filter_var($_POST['quantity'] ?? 1, FILTER_VALIDATE_INT);
        $amount = filter_var($_POST['amount'] ?? 300, FILTER_VALIDATE_FLOAT);
        if (!$typeId || !$quantity || $quantity < 1 || $amount === false || $amount < 0) {
            self::respond(['error' => 'Device type, quantity, or amount is invalid.'], 422);
        }
        $deviceName = self::requiredText($_POST, 'device_name', 160);
        $typeCheck = $this->db->prepare('SELECT id FROM device_types WHERE id = ?');
        $typeCheck->execute([$typeId]);
        if (!$typeCheck->fetch()) {
            self::respond(['error' => 'Device type was not found.'], 422);
        }
        if (!$customerId) {
            $customerName = self::requiredText($_POST, 'customer_name', 160);
            $phone = trim((string) ($_POST['customer_phone'] ?? ''));
            $phone = $phone === '' ? null : self::phone($phone);
            $insert = $this->db->prepare('INSERT INTO customers (name, phone, created_by_agent_id) VALUES (?, ?, ?)');
            $insert->execute([$customerName, $phone, $agentId]);
            $customerId = (int) $this->db->lastInsertId();
            $this->log('customer.created', $customerId);
        }
        $customerCheck = $this->db->prepare(
            'SELECT id FROM customers WHERE id = ?' . ($actor['role'] === 'admin' ? '' : ' AND created_by_agent_id = ?')
        );
        $customerCheck->execute($actor['role'] === 'admin' ? [$customerId] : [$customerId, $actor['id']]);
        if (!$customerCheck->fetch()) {
            self::respond(['error' => 'Choose a customer you are allowed to use.'], 422);
        }
        $imagePath = $this->saveImage($_FILES['image'] ?? null);
        $statement = $this->db->prepare(
            "INSERT INTO services (agent_id, customer_id, device_type_id, device_name, quantity, amount, image_path)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        $statement->execute([
            $agentId,
            $customerId,
            $typeId,
            $deviceName,
            $quantity,
            number_format((float) $amount, 2, '.', ''),
            $imagePath,
        ]);
        $id = (int) $this->db->lastInsertId();
        $this->log('service.created', $id, ['agent_id' => $agentId]);
        self::respond(['id' => $id, 'message' => 'Service recorded.'], 201);
    }

    private function payService(int $id): void
    {
        $actor = $this->requireAuth();
        $select = $this->db->prepare('SELECT id, agent_id, status FROM services WHERE id = ?');
        $select->execute([$id]);
        $service = $select->fetch();
        if (!$service) {
            self::respond(['error' => 'Service not found.'], 404);
        }
        if ($actor['role'] !== 'admin' && (int) $service['agent_id'] !== (int) $actor['id']) {
            self::respond(['error' => 'Forbidden.'], 403);
        }
        if ($service['status'] === 'paid') {
            self::respond(['message' => 'Service is already paid.']);
        }
        $statement = $this->db->prepare("UPDATE services SET status = 'paid' WHERE id = ?");
        $statement->execute([$id]);
        $this->log('service.paid', $id);
        self::respond(['message' => 'Service marked as paid.']);
    }

    private function dashboard(): void
    {
        $actor = $this->requireAuth();
        $agentFilter = $actor['role'] === 'admin' && isset($_GET['agent_id'])
            ? filter_var($_GET['agent_id'], FILTER_VALIDATE_INT)
            : ($actor['role'] === 'agent' ? (int) $actor['id'] : null);
        $where = $agentFilter ? ' WHERE agent_id = ?' : '';
        $params = $agentFilter ? [$agentFilter] : [];
        $statement = $this->db->prepare(
            "SELECT
               COALESCE(SUM(CASE WHEN status = 'pending' THEN quantity * amount ELSE 0 END), 0) AS pending_amount,
               COALESCE(SUM(CASE WHEN status = 'paid' AND DATE(updated_at) = CURRENT_DATE THEN quantity * amount ELSE 0 END), 0) AS paid_today,
               COUNT(*) AS total_services,
               SUM(status = 'pending') AS pending_count
             FROM services" . $where
        );
        $statement->execute($params);
        $stats = $statement->fetch();
        $recentStatement = $this->db->prepare(
            'SELECT s.id, c.name AS customer_name, d.name AS device_type, s.device_name, s.quantity,
                    s.amount, s.status, s.created_at, u.first_name AS agent_first_name, u.last_name AS agent_last_name
             FROM services s JOIN customers c ON c.id = s.customer_id
             JOIN device_types d ON d.id = s.device_type_id JOIN users u ON u.id = s.agent_id' .
             ($agentFilter ? ' WHERE s.agent_id = ?' : '') . ' ORDER BY s.created_at DESC LIMIT 6'
        );
        $recentStatement->execute($params);
        $result = ['stats' => $stats, 'recent' => $recentStatement->fetchAll()];
        if ($actor['role'] === 'admin' && !$agentFilter) {
            $result['agents'] = $this->db->query(
                "SELECT u.id, u.first_name, u.last_name, u.phone,
                        COUNT(s.id) AS service_count,
                        COALESCE(SUM(CASE WHEN s.status = 'paid' THEN s.quantity * s.amount ELSE 0 END), 0) AS paid_total
                 FROM users u LEFT JOIN services s ON s.agent_id = u.id
                 WHERE u.role = 'agent' GROUP BY u.id ORDER BY service_count DESC"
            )->fetchAll();
        }
        self::respond($result);
    }

    private function activity(): void
    {
        $this->requireRole('admin');
        $statement = $this->db->query(
            'SELECT a.id, a.action_taken, a.target_record_id, a.details, a.timestamp,
                    u.id AS user_id, u.first_name, u.last_name, u.role
             FROM activity_logs a JOIN users u ON u.id = a.user_id
             ORDER BY a.timestamp DESC LIMIT 100'
        );
        self::respond(['items' => $statement->fetchAll()]);
    }

    private function saveImage(?array $file): ?string
    {
        if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            return null;
        }
        if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK || $file['size'] > 5 * 1024 * 1024) {
            self::respond(['error' => 'Image upload failed or exceeds 5 MB.'], 422);
        }
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
        if (!isset($extensions[$mime])) {
            self::respond(['error' => 'Only JPG, PNG, and WebP images are supported.'], 422);
        }
        $config = require __DIR__ . '/../config.php';
        $directory = $config['upload_dir'];
        if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) {
            throw new RuntimeException('Could not create image upload directory.');
        }
        $fileName = bin2hex(random_bytes(20)) . '.' . $extensions[$mime];
        if (!move_uploaded_file($file['tmp_name'], $directory . DIRECTORY_SEPARATOR . $fileName)) {
            throw new RuntimeException('Could not store uploaded image.');
        }

        return $config['upload_url'] . '/' . $fileName;
    }

    private function requireRole(string $role): array
    {
        $actor = $this->requireAuth();
        if ($actor['role'] !== $role) {
            self::respond(['error' => 'Forbidden.'], 403);
        }

        return $actor;
    }

    private function requireUserManagementAccess(int $id): array
    {
        $actor = $this->requireAuth();
        if ($id === (int) $actor['id']) {
            return $actor;
        }
        if ($actor['role'] !== 'admin') {
            self::respond(['error' => 'Forbidden.'], 403);
        }
        $statement = $this->db->prepare('SELECT role FROM users WHERE id = ?');
        $statement->execute([$id]);
        $target = $statement->fetch();
        if (!$target) {
            self::respond(['error' => 'User not found.'], 404);
        }
        if ($target['role'] === 'admin' && !(bool) $actor['is_super_admin']) {
            self::respond(['error' => 'Only the super-admin can manage another administrator.'], 403);
        }

        return $actor;
    }

    private function requireAuth(): array
    {
        if ($this->actor !== null) {
            return $this->actor;
        }
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/^Bearer\s+(.+)$/i', $header, $match)) {
            self::respond(['error' => 'Authentication required.'], 401);
        }
        try {
            $claims = Jwt::verify($match[1]);
        } catch (Throwable $error) {
            self::respond(['error' => 'Invalid or expired token.'], 401);
        }
        $statement = $this->db->prepare(
            'SELECT id, first_name, second_name, last_name, phone, email, sex, role, is_super_admin, language, theme,
                    profile_image_path, auth_version
             FROM users WHERE id = ?'
        );
        $statement->execute([(int) ($claims['sub'] ?? 0)]);
        $this->actor = $statement->fetch() ?: null;
        if (!$this->actor || (int) ($claims['ver'] ?? -1) !== (int) $this->actor['auth_version']) {
            self::respond(['error' => 'Account is no longer available.'], 401);
        }

        return $this->actor;
    }

    private function findUser(int $id): array
    {
        $statement = $this->db->prepare(
            'SELECT id, first_name, second_name, last_name, phone, email, sex, role, language, theme,
                    profile_image_path, created_at
             FROM users WHERE id = ?'
        );
        $statement->execute([$id]);

        return $statement->fetch();
    }

    private function publicUser(array $user): array
    {
        unset($user['password']);
        unset($user['auth_version']);
        $user['id'] = (int) $user['id'];
        $user['is_super_admin'] = (bool) $user['is_super_admin'];

        return $user;
    }

    private function log(string $action, ?int $targetId, array $details = []): void
    {
        $statement = $this->db->prepare(
            'INSERT INTO activity_logs (user_id, action_taken, target_record_id, details) VALUES (?, ?, ?, ?)'
        );
        $statement->execute([
            $this->actor['id'],
            $action,
            $targetId,
            $details ? json_encode($details, JSON_THROW_ON_ERROR) : null,
        ]);
    }

    private static function jsonBody(): array
    {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!is_array($input)) {
            self::respond(['error' => 'Request body must be valid JSON.'], 400);
        }

        return $input;
    }

    private static function phone(mixed $value): string
    {
        $value = trim((string) $value);
        if (!preg_match('/^(07|06)[0-9]{8}$/', $value)) {
            self::respond(['error' => 'Phone number must be 10 digits and start with 06 or 07.'], 422);
        }

        return $value;
    }

    private static function requiredText(array $input, string $key, int $maxLength): string
    {
        $value = trim((string) ($input[$key] ?? ''));
        if ($value === '' || mb_strlen($value) > $maxLength) {
            self::respond(['error' => ucfirst(str_replace('_', ' ', $key)) . ' is required and must be at most ' . $maxLength . ' characters.'], 422);
        }

        return $value;
    }

    private static function optionalText(array $input, string $key, int $maxLength): ?string
    {
        $value = trim((string) ($input[$key] ?? ''));

        return $value === '' ? null : (mb_strlen($value) <= $maxLength ? $value : self::respond(['error' => 'Input is too long.'], 422));
    }

    private static function respond(array $body, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
