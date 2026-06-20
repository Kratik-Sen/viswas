<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$dbName = env_value('DB_NAME', 'viswas_oils');
if (!preg_match('/^[A-Za-z0-9_]+$/', $dbName)) {
    fail('DB_NAME may only contain letters, numbers, and underscores.', 422);
}

$server = pdo(false);
$server->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

$db = pdo(true);
$schema = file_get_contents(base_path('database/schema.sql'));
if ($schema === false) {
    fail('Could not read database schema.', 500);
}
$db->exec($schema);

$columnCheck = $db->prepare(
    'SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
);
$columnCheck->execute(['orders', 'payment_method']);
if ((int) $columnCheck->fetchColumn() === 0) {
    $db->exec("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(40) NOT NULL DEFAULT 'razorpay' AFTER payment_status");
}
$columnCheck->execute(['order_items', 'variant_id']);
if ((int) $columnCheck->fetchColumn() === 0) {
    $db->exec('ALTER TABLE order_items ADD COLUMN variant_id INT NULL AFTER product_id');
}
$columnCheck->execute(['order_items', 'product_size']);
if ((int) $columnCheck->fetchColumn() === 0) {
    $db->exec('ALTER TABLE order_items ADD COLUMN product_size VARCHAR(60) NULL AFTER product_name');
}
$columnCheck->execute(['product_variants', 'image_url']);
if ((int) $columnCheck->fetchColumn() === 0) {
    $db->exec('ALTER TABLE product_variants ADD COLUMN image_url TEXT NULL AFTER stock');
}
$columnCheck->execute(['product_variants', 'image_public_id']);
if ((int) $columnCheck->fetchColumn() === 0) {
    $db->exec('ALTER TABLE product_variants ADD COLUMN image_public_id VARCHAR(255) NULL AFTER image_url');
}
$columnCheck->execute(['products', 'product_benefits']);
if ((int) $columnCheck->fetchColumn() === 0) {
    $db->exec('ALTER TABLE products ADD COLUMN product_benefits TEXT NULL AFTER description');
}
$columnCheck->execute(['products', 'banner_image_url']);
if ((int) $columnCheck->fetchColumn() === 0) {
    $db->exec('ALTER TABLE products ADD COLUMN banner_image_url TEXT NULL AFTER product_benefits');
}
$columnCheck->execute(['products', 'banner_image_public_id']);
if ((int) $columnCheck->fetchColumn() === 0) {
    $db->exec('ALTER TABLE products ADD COLUMN banner_image_public_id VARCHAR(255) NULL AFTER banner_image_url');
}

$adminEmail = env_value('ADMIN_EMAIL', 'admin@viswas.test');
$adminPassword = env_value('ADMIN_PASSWORD', 'admin123');

$stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$adminEmail]);
if (!$stmt->fetch()) {
    $insert = $db->prepare(
        'INSERT INTO users (name, email, phone, address, city, state, pincode, password_hash, role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $insert->execute([
        'Viswas Admin',
        $adminEmail,
        '9999999999',
        'Admin Office',
        'Local',
        'State',
        '000000',
        password_hash((string) $adminPassword, PASSWORD_DEFAULT),
        'admin',
    ]);
}

$samples = [
    ['Groundnut Oil', 'Groundnut Oil', 'Wood pressed/Cold pressed groundnut oil with a deep nutty finish.', 260, 40, 'public/images/groundnut-oil.png'],
    ['Sunflower Oil', 'Sunflower Oil', 'Light everyday sunflower oil for frying and family cooking.', 180, 50, 'public/images/sunflower-oil.png'],
    ['Black Mustard Oil', 'Black Mustard Oil', 'Bold black mustard oil for pickles and regional dishes.', 240, 28, 'public/images/black-mustard-oil.png'],
    ['Yellow Mustard Oil', 'Yellow Mustard Oil', 'Aromatic yellow mustard oil with a clean pungent taste.', 230, 32, 'public/images/yellow-mustard-oil.png'],
    ['Coconut Oil', 'Coconut Oil', 'Fresh coconut oil for cooking, hair care, and traditional recipes.', 220, 35, 'public/images/coconut-oil.png'],
    ['White Sesame Oil', 'White Sesame Oil', 'Mild sesame oil for dressings, sweets, and light sauteing.', 310, 26, 'public/images/white-sesame-oil.png'],
    ['Black Sesame Oil', 'Black Sesame Oil', 'Rich black sesame oil for finishing and traditional foods.', 340, 18, 'public/images/black-sesame-oil.png'],
    ['Almond Oil', 'Almond Oil', 'Premium almond oil for food, massage, and wellness routines.', 520, 16, 'public/images/almond-oil.png'],
    ['Flaxseed Oil', 'Flaxseed Oil', 'Fresh flaxseed oil for salads, smoothies, and health-focused meals.', 390, 22, 'public/images/flaxseed-oil.png'],
];

$count = (int) $db->query('SELECT COUNT(*) FROM products')->fetchColumn();
if ($count === 0) {
    $productInsert = $db->prepare(
        'INSERT INTO products (name, category, description, price, stock, active) VALUES (?, ?, ?, ?, ?, 1)'
    );
    $imageInsert = $db->prepare('INSERT INTO product_images (product_id, url, public_id) VALUES (?, ?, ?)');
    $variantInsert = $db->prepare('INSERT INTO product_variants (product_id, size_label, price, stock, image_url, image_public_id, active) VALUES (?, ?, ?, ?, ?, ?, 1)');

    foreach ($samples as $sample) {
        $productInsert->execute([$sample[0], $sample[1], $sample[2], $sample[3], $sample[4]]);
        $productId = (int) $db->lastInsertId();
        $imageInsert->execute([$productId, $sample[5], 'seed']);
        $variantInsert->execute([$productId, '200ml', round((float) $sample[3] * 0.28, 2), max(1, (int) floor((int) $sample[4] / 3)), $sample[5], 'seed']);
        $variantInsert->execute([$productId, '500ml', round((float) $sample[3] * 0.58, 2), max(1, (int) floor((int) $sample[4] / 3)), $sample[5], 'seed']);
        $variantInsert->execute([$productId, '1L', (float) $sample[3], max(1, (int) ceil((int) $sample[4] / 3)), $sample[5], 'seed']);
    }
} else {
    $seedImageUpdate = $db->prepare(
        'UPDATE product_images
         JOIN products ON products.id = product_images.product_id
         SET product_images.url = ?
         WHERE products.name = ? AND product_images.public_id = ?'
    );

    foreach ($samples as $sample) {
        $seedImageUpdate->execute([$sample[5], $sample[0], 'seed']);
    }
}

$variantCount = (int) $db->query('SELECT COUNT(*) FROM product_variants')->fetchColumn();
if ($variantCount === 0) {
    $products = $db->query('SELECT id, price, stock FROM products WHERE active = 1')->fetchAll();
    $variantInsert = $db->prepare('INSERT INTO product_variants (product_id, size_label, price, stock, active) VALUES (?, ?, ?, ?, 1)');
    foreach ($products as $product) {
        $stock = max(0, (int) $product['stock']);
        $price = (float) $product['price'];
        $variantInsert->execute([(int) $product['id'], '200ml', round($price * 0.28, 2), max(1, (int) floor($stock / 3))]);
        $variantInsert->execute([(int) $product['id'], '500ml', round($price * 0.58, 2), max(1, (int) floor($stock / 3))]);
        $variantInsert->execute([(int) $product['id'], '1L', $price, max(1, (int) ceil($stock / 3))]);
    }
}

respond([
    'message' => 'Viswas Oils database is ready.',
    'database' => $dbName,
    'admin_email' => $adminEmail,
    'next' => env_value('APP_URL', 'http://localhost/viswas'),
]);
