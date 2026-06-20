<?php
declare(strict_types=1);

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && cors_origin_allowed($origin)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Vary: Origin');
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

const PRODUCT_CATEGORIES = [
    'Groundnut Oil',
    'Sunflower Oil',
    'Black Mustard Oil',
    'Yellow Mustard Oil',
    'Coconut Oil',
    'White Sesame Oil',
    'Black Sesame Oil',
    'Almond Oil',
    'Flaxseed Oil',
];

function base_path(string $path = ''): string
{
    $base = dirname(__DIR__);
    return $path === '' ? $base : $base . DIRECTORY_SEPARATOR . ltrim($path, DIRECTORY_SEPARATOR);
}

function env_file_path(): string
{
    return base_path('.env');
}

function load_env(): array
{
    static $values = null;
    if ($values !== null) {
        return $values;
    }

    $values = [];
    $path = env_file_path();
    if (!is_file($path)) {
        return $values;
    }

    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);

        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
            (str_starts_with($value, "'") && str_ends_with($value, "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        $values[$key] = $value;
        $_ENV[$key] = $value;
    }

    return $values;
}

function env_value(string $key, ?string $default = null): ?string
{
    $env = load_env();
    return $env[$key] ?? getenv($key) ?: $default;
}

function origin_from_url(?string $url): ?string
{
    if ($url === null || trim($url) === '') {
        return null;
    }

    $parts = parse_url($url);
    if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
        return null;
    }

    $origin = strtolower((string) $parts['scheme']) . '://' . strtolower((string) $parts['host']);
    if (isset($parts['port'])) {
        $origin .= ':' . $parts['port'];
    }

    return $origin;
}

function cors_origin_allowed(string $origin): bool
{
    $origin = rtrim($origin, '/');
    $allowed = [
        'http://localhost',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        origin_from_url(env_value('APP_URL')),
        origin_from_url(env_value('FRONTEND_URL')),
    ];

    $extraOrigins = env_value('ALLOWED_ORIGINS', '');
    foreach (explode(',', (string) $extraOrigins) as $extraOrigin) {
        $normalized = origin_from_url(trim($extraOrigin)) ?? rtrim(trim($extraOrigin), '/');
        if ($normalized !== '') {
            $allowed[] = $normalized;
        }
    }

    return in_array($origin, array_filter($allowed), true);
}

function first_env_value(array $keys, ?string $default = null): ?string
{
    foreach ($keys as $key) {
        $value = env_value($key);
        if ($value !== null && $value !== '') {
            return $value;
        }
    }

    return $default;
}

function railway_mysql_url_config(): array
{
    $urlKeys = getenv('RAILWAY_ENVIRONMENT') ? ['MYSQL_URL', 'MYSQL_PUBLIC_URL'] : ['MYSQL_PUBLIC_URL', 'MYSQL_URL'];
    $url = first_env_value($urlKeys);
    if ($url === null || $url === '') {
        return [];
    }

    $parts = parse_url($url);
    if (!is_array($parts)) {
        return [];
    }

    $path = isset($parts['path']) ? trim((string) $parts['path'], '/') : '';

    return array_filter([
        'host' => $parts['host'] ?? null,
        'port' => isset($parts['port']) ? (string) $parts['port'] : null,
        'db' => $path !== '' ? $path : null,
        'user' => isset($parts['user']) ? rawurldecode((string) $parts['user']) : null,
        'pass' => isset($parts['pass']) ? rawurldecode((string) $parts['pass']) : null,
    ], static fn($value): bool => $value !== null && $value !== '');
}

final class DatabaseSessionHandler implements SessionHandlerInterface
{
    private bool $tableReady = false;

    public function open(string $path, string $name): bool
    {
        return true;
    }

    public function close(): bool
    {
        return true;
    }

    public function read(string $id): string|false
    {
        $this->ensureTable();
        $stmt = pdo()->prepare('SELECT data FROM app_sessions WHERE id = ? AND last_activity >= ?');
        $stmt->execute([$id, time() - app_session_lifetime()]);
        $data = $stmt->fetchColumn();

        return is_string($data) ? $data : '';
    }

    public function write(string $id, string $data): bool
    {
        $this->ensureTable();
        $stmt = pdo()->prepare(
            'REPLACE INTO app_sessions (id, data, last_activity) VALUES (?, ?, ?)'
        );

        return $stmt->execute([$id, $data, time()]);
    }

    public function destroy(string $id): bool
    {
        $this->ensureTable();
        $stmt = pdo()->prepare('DELETE FROM app_sessions WHERE id = ?');

        return $stmt->execute([$id]);
    }

    public function gc(int $max_lifetime): int|false
    {
        $this->ensureTable();
        $stmt = pdo()->prepare('DELETE FROM app_sessions WHERE last_activity < ?');
        $stmt->execute([time() - max(1, $max_lifetime)]);

        return $stmt->rowCount();
    }

    private function ensureTable(): void
    {
        if ($this->tableReady) {
            return;
        }

        pdo()->exec(
            'CREATE TABLE IF NOT EXISTS app_sessions (
                id VARCHAR(128) NOT NULL PRIMARY KEY,
                data MEDIUMBLOB NOT NULL,
                last_activity INT UNSIGNED NOT NULL,
                INDEX idx_app_sessions_last_activity (last_activity)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
        );
        $this->tableReady = true;
    }
}

function app_session_lifetime(): int
{
    return max(3600, (int) env_value('SESSION_LIFETIME', '1209600'));
}

function request_is_secure(): bool
{
    if (strtolower((string) ($_SERVER['HTTPS'] ?? '')) === 'on') {
        return true;
    }

    if (strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https') {
        return true;
    }

    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    if ($host === 'localhost' || str_starts_with($host, 'localhost:') || str_starts_with($host, '127.0.0.1')) {
        return false;
    }

    return str_starts_with((string) env_value('APP_URL', ''), 'https://');
}

function start_app_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $secure = request_is_secure();
    $sameSite = env_value('SESSION_SAMESITE', $secure ? 'None' : 'Lax');
    if ($sameSite === 'None' && !$secure) {
        $sameSite = 'Lax';
    }

    session_name(env_value('SESSION_NAME', 'viswas_session') ?: 'viswas_session');
    session_set_cookie_params([
        'lifetime' => app_session_lifetime(),
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => $sameSite,
    ]);

    ini_set('session.use_strict_mode', '1');
    ini_set('session.gc_maxlifetime', (string) app_session_lifetime());

    $script = basename((string) ($_SERVER['SCRIPT_NAME'] ?? ''));
    $defaultDriver = getenv('VERCEL') || env_value('APP_ENV') === 'production' ? 'database' : 'file';
    $driver = strtolower((string) env_value('SESSION_DRIVER', $defaultDriver));
    if ($driver === 'database' && $script !== 'install.php') {
        session_set_save_handler(new DatabaseSessionHandler(), true);
    }

    session_start();
}

start_app_session();

function env_quote(string $value): string
{
    if ($value === '' || preg_match('/^[A-Za-z0-9_:\\/\\.\\-@]+$/', $value)) {
        return $value;
    }

    return '"' . str_replace(['\\', '"'], ['\\\\', '\\"'], $value) . '"';
}

function write_env_values(array $updates): void
{
    $path = env_file_path();
    $current = is_file($path) ? file($path, FILE_IGNORE_NEW_LINES) : [];
    $seen = [];
    $next = [];

    foreach ($current as $line) {
        if (trim($line) === '' || str_starts_with(trim($line), '#') || !str_contains($line, '=')) {
            $next[] = $line;
            continue;
        }

        [$key] = explode('=', $line, 2);
        $key = trim($key);
        if (array_key_exists($key, $updates)) {
            $next[] = $key . '=' . env_quote((string) $updates[$key]);
            $seen[$key] = true;
        } else {
            $next[] = $line;
        }
    }

    foreach ($updates as $key => $value) {
        if (!isset($seen[$key])) {
            $next[] = $key . '=' . env_quote((string) $value);
        }
    }

    if (file_put_contents($path, implode(PHP_EOL, $next) . PHP_EOL, LOCK_EX) === false) {
        fail('Could not write the .env file. Check folder permissions.', 500);
    }
}

function razorpay_credentials(): array
{
    return [
        'key_id' => trim((string) env_value('RAZORPAY_KEY_ID', '')),
        'key_secret' => trim((string) env_value('RAZORPAY_KEY_SECRET', '')),
    ];
}

function pdo(bool $withDatabase = true): PDO
{
    static $connections = [];
    $key = $withDatabase ? 'db' : 'server';
    if (isset($connections[$key])) {
        return $connections[$key];
    }

    $urlConfig = railway_mysql_url_config();
    $host = first_env_value(['DB_HOST'], $urlConfig['host'] ?? first_env_value(['MYSQLHOST', 'MYSQL_HOST'], '127.0.0.1'));
    $port = first_env_value(['DB_PORT'], $urlConfig['port'] ?? first_env_value(['MYSQLPORT', 'MYSQL_PORT'], '3306'));
    $db = first_env_value(['DB_NAME'], $urlConfig['db'] ?? first_env_value(['MYSQLDATABASE', 'MYSQL_DATABASE'], 'viswas_oils'));
    $user = first_env_value(['DB_USER'], $urlConfig['user'] ?? first_env_value(['MYSQLUSER', 'MYSQL_USER'], 'root'));
    $pass = first_env_value(['DB_PASS'], $urlConfig['pass'] ?? first_env_value(['MYSQLPASSWORD', 'MYSQL_ROOT_PASSWORD', 'MYSQL_PASSWORD'], ''));

    $dsn = "mysql:host={$host};port={$port};charset=utf8mb4";
    if ($withDatabase) {
        $dsn .= ";dbname={$db}";
    }

    try {
        $connections[$key] = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $exception) {
        fail('Database connection failed: ' . $exception->getMessage(), 500);
    }

    return $connections[$key];
}

function json_input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        fail('Invalid JSON request body.', 400);
    }

    return $decoded;
}

function respond(array $payload = [], int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $status = 400, array $extra = []): void
{
    respond(array_merge(['error' => $message], $extra), $status);
}

function current_user(): ?array
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }

    $stmt = pdo()->prepare('SELECT id, name, email, phone, address, city, state, pincode, role, created_at FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();

    return $user ?: null;
}

function require_user(): array
{
    $user = current_user();
    if (!$user) {
        fail('Please sign up or log in to continue.', 401);
    }

    return $user;
}

function require_admin(): array
{
    $user = require_user();
    if (($user['role'] ?? '') !== 'admin') {
        fail('Admin access required.', 403);
    }

    return $user;
}

function method_is(string $method): bool
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === strtoupper($method);
}

function validate_required(array $data, array $fields): void
{
    foreach ($fields as $field) {
        if (!isset($data[$field]) || trim((string) $data[$field]) === '') {
            fail(ucwords(str_replace('_', ' ', $field)) . ' is required.', 422);
        }
    }
}

function product_images(int $productId): array
{
    $stmt = pdo()->prepare('SELECT id, url, public_id FROM product_images WHERE product_id = ? ORDER BY id ASC');
    $stmt->execute([$productId]);
    return $stmt->fetchAll();
}

function table_column_exists(string $table, string $column): bool
{
    $stmt = pdo()->prepare(
        'SELECT COUNT(*)
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
    );
    $stmt->execute([$table, $column]);

    return (int) $stmt->fetchColumn() > 0;
}

function ensure_variant_image_columns(): void
{
    static $ready = false;
    if ($ready) {
        return;
    }

    if (!table_column_exists('product_variants', 'image_url')) {
        pdo()->exec('ALTER TABLE product_variants ADD COLUMN image_url TEXT NULL AFTER stock');
    }

    if (!table_column_exists('product_variants', 'image_public_id')) {
        pdo()->exec('ALTER TABLE product_variants ADD COLUMN image_public_id VARCHAR(255) NULL AFTER image_url');
    }

    $ready = true;
}

function ensure_product_banner_columns(): void
{
    static $ready = false;
    if ($ready) {
        return;
    }

    if (!table_column_exists('products', 'banner_image_url')) {
        pdo()->exec('ALTER TABLE products ADD COLUMN banner_image_url TEXT NULL AFTER description');
    }

    if (!table_column_exists('products', 'product_benefits')) {
        pdo()->exec('ALTER TABLE products ADD COLUMN product_benefits TEXT NULL AFTER description');
    }

    if (!table_column_exists('products', 'banner_image_public_id')) {
        pdo()->exec('ALTER TABLE products ADD COLUMN banner_image_public_id VARCHAR(255) NULL AFTER banner_image_url');
    }

    $ready = true;
}

function product_variants(int $productId): array
{
    ensure_variant_image_columns();

    $stmt = pdo()->prepare(
        'SELECT id, product_id, size_label, price, stock, image_url, image_public_id, active
         FROM product_variants
         WHERE product_id = ? AND active = 1
         ORDER BY id ASC'
    );
    $stmt->execute([$productId]);
    $variants = $stmt->fetchAll();

    foreach ($variants as &$variant) {
        $variant['id'] = (int) $variant['id'];
        $variant['product_id'] = (int) $variant['product_id'];
        $variant['price'] = (float) $variant['price'];
        $variant['stock'] = (int) $variant['stock'];
        $variant['active'] = (int) $variant['active'] === 1;
        $variant['image_url'] = $variant['image_url'] ?: null;
        $variant['image_public_id'] = $variant['image_public_id'] ?: null;
    }

    return $variants;
}

function normalize_product(array $row): array
{
    ensure_product_banner_columns();

    $row['id'] = (int) $row['id'];
    $row['price'] = (float) $row['price'];
    $row['stock'] = (int) $row['stock'];
    $row['active'] = (int) $row['active'] === 1;
    $row['product_benefits'] = $row['product_benefits'] ?? null;
    $row['banner_image_url'] = $row['banner_image_url'] ?? null;
    $row['banner_image_public_id'] = $row['banner_image_public_id'] ?? null;
    $row['images'] = product_images((int) $row['id']);
    $row['variants'] = product_variants((int) $row['id']);

    if ($row['variants'] !== []) {
        $row['price'] = (float) $row['variants'][0]['price'];
        $row['stock'] = array_sum(array_map(static fn(array $variant): int => (int) $variant['stock'], $row['variants']));
    }

    return $row;
}

function upload_product_image(array $file): array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        fail('Image upload failed.', 422);
    }

    $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    $mime = mime_content_type($file['tmp_name']);
    if (!in_array($mime, $allowed, true)) {
        fail('Only JPG, PNG, WEBP, and GIF images are allowed.', 422);
    }

    $cloud = env_value('CLOUDINARY_CLOUD_NAME', '');
    $apiKey = env_value('CLOUDINARY_API_KEY', '');
    $apiSecret = env_value('CLOUDINARY_API_SECRET', '');
    $folder = env_value('CLOUDINARY_UPLOAD_FOLDER', 'viswas-oils');

    if ($cloud !== '' && $apiKey !== '' && $apiSecret !== '') {
        $timestamp = time();
        $signatureBase = 'folder=' . $folder . '&timestamp=' . $timestamp . $apiSecret;
        $signature = sha1($signatureBase);
        $endpoint = "https://api.cloudinary.com/v1_1/{$cloud}/image/upload";

        $curl = curl_init($endpoint);
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POSTFIELDS => [
                'file' => new CURLFile($file['tmp_name'], $mime, $file['name']),
                'api_key' => $apiKey,
                'timestamp' => $timestamp,
                'folder' => $folder,
                'signature' => $signature,
            ],
        ]);

        $body = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        curl_close($curl);

        if ($body === false || $status < 200 || $status >= 300) {
            fail('Cloudinary upload failed: ' . ($error ?: $body), 502);
        }

        $decoded = json_decode($body, true);
        return [
            'url' => $decoded['secure_url'] ?? $decoded['url'],
            'public_id' => $decoded['public_id'] ?? null,
        ];
    }

    $uploadDir = base_path('uploads');
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
        fail('Could not create local upload folder.', 500);
    }

    $extension = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
    $filename = uniqid('oil_', true) . '.' . strtolower($extension);
    $destination = $uploadDir . DIRECTORY_SEPARATOR . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        fail('Could not save uploaded image.', 500);
    }

    return [
        'url' => 'uploads/' . $filename,
        'public_id' => 'local/' . $filename,
    ];
}

function create_razorpay_order(float $amountRupees, int $orderId): array
{
    $credentials = razorpay_credentials();
    $keyId = $credentials['key_id'];
    $secret = $credentials['key_secret'];
    if ($keyId === '' || $secret === '') {
        throw new RuntimeException('Razorpay keys are missing. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the .env file.');
    }

    $payload = json_encode([
        'amount' => (int) round($amountRupees * 100),
        'currency' => 'INR',
        'receipt' => 'viswas_' . $orderId,
        'payment_capture' => 1,
    ]);

    $curl = curl_init('https://api.razorpay.com/v1/orders');
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERPWD => $keyId . ':' . $secret,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => $payload,
    ]);

    $body = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    curl_close($curl);

    if ($body === false || $status < 200 || $status >= 300) {
        $decodedError = is_string($body) ? json_decode($body, true) : null;
        $description = is_array($decodedError)
            ? (string) ($decodedError['error']['description'] ?? '')
            : '';

        if ($status === 401 || str_contains(strtolower($description), 'authentication failed')) {
            throw new RuntimeException('Razorpay authentication failed. Check that RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env are a matching test or live key pair.');
        }

        throw new RuntimeException('Razorpay order creation failed: ' . ($description ?: $error ?: 'Unknown Razorpay error.'));
    }

    $decoded = json_decode($body, true);
    if (!isset($decoded['id'])) {
        throw new RuntimeException('Razorpay returned an invalid order response.');
    }

    return $decoded;
}
