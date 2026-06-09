<?php
declare(strict_types=1);

session_start();

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
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
    'Coconut Oil',
    'Sunflower Oil',
    'Black Mustard Oil',
    'Yellow Mustard Oil',
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

    $host = env_value('DB_HOST', '127.0.0.1');
    $port = env_value('DB_PORT', '3306');
    $db = env_value('DB_NAME', 'viswas_oils');
    $user = env_value('DB_USER', 'root');
    $pass = env_value('DB_PASS', '');

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

function product_variants(int $productId): array
{
    $stmt = pdo()->prepare(
        'SELECT id, product_id, size_label, price, stock, active
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
    }

    return $variants;
}

function normalize_product(array $row): array
{
    $row['id'] = (int) $row['id'];
    $row['price'] = (float) $row['price'];
    $row['stock'] = (int) $row['stock'];
    $row['active'] = (int) $row['active'] === 1;
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
