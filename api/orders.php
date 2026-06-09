<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if (!method_is('GET')) {
    fail('Method not allowed.', 405);
}

$user = require_user();
$adminView = ($user['role'] ?? '') === 'admin' && ($_GET['all'] ?? '') === '1';

if ($adminView) {
    $stmt = pdo()->query(
        'SELECT orders.*, users.name AS customer_name, users.email AS customer_email
         FROM orders
         JOIN users ON users.id = orders.user_id
         WHERE orders.payment_status IN (\'paid\', \'cod_pending\')
         ORDER BY orders.created_at DESC'
    );
    $orders = $stmt->fetchAll();
} else {
    $stmt = pdo()->prepare(
        'SELECT *
         FROM orders
         WHERE user_id = ?
           AND payment_status IN (\'paid\', \'cod_pending\')
         ORDER BY created_at DESC'
    );
    $stmt->execute([(int) $user['id']]);
    $orders = $stmt->fetchAll();
}

$itemStmt = pdo()->prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC');
foreach ($orders as &$order) {
    $order['id'] = (int) $order['id'];
    $order['total'] = (float) $order['total'];
    $itemStmt->execute([(int) $order['id']]);
    $items = $itemStmt->fetchAll();
    foreach ($items as &$item) {
        $item['id'] = (int) $item['id'];
        $item['product_id'] = (int) $item['product_id'];
        $item['variant_id'] = isset($item['variant_id']) ? (int) $item['variant_id'] : null;
        $item['price'] = (float) $item['price'];
        $item['quantity'] = (int) $item['quantity'];
    }
    $order['items'] = $items;
}

respond(['orders' => $orders]);
