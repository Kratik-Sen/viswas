<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$user = require_user();
$input = json_input();
$action = $_GET['action'] ?? $input['action'] ?? '';

if (!method_is('POST')) {
    fail('Method not allowed.', 405);
}

function collect_order_items(array $items): array
{
    $db = pdo();
    ensure_variant_image_columns();
    $productStmt = $db->prepare('SELECT * FROM products WHERE id = ? AND active = 1');
    $variantStmt = $db->prepare('SELECT * FROM product_variants WHERE id = ? AND product_id = ? AND active = 1');
    $defaultVariantStmt = $db->prepare('SELECT * FROM product_variants WHERE product_id = ? AND active = 1 ORDER BY id ASC LIMIT 1');
    $imageStmt = $db->prepare('SELECT url FROM product_images WHERE product_id = ? ORDER BY id ASC LIMIT 1');

    $orderItems = [];
    $total = 0.0;

    foreach ($items as $item) {
        $productId = (int) ($item['product_id'] ?? 0);
        $variantId = (int) ($item['variant_id'] ?? 0);
        $quantity = max(0, (int) ($item['quantity'] ?? 0));
        if ($productId <= 0 || $quantity <= 0) {
            fail('Invalid cart item.', 422);
        }

        $productStmt->execute([$productId]);
        $product = $productStmt->fetch();
        if (!$product) {
            fail('One of the products in your cart is no longer available.', 422);
        }

        if ($variantId > 0) {
            $variantStmt->execute([$variantId, $productId]);
            $variant = $variantStmt->fetch();
        } else {
            $defaultVariantStmt->execute([$productId]);
            $variant = $defaultVariantStmt->fetch();
        }

        if (!$variant) {
            fail($product['name'] . ' does not have a valid size selected.', 422);
        }
        if ((int) $variant['stock'] < $quantity) {
            fail($product['name'] . ' ' . $variant['size_label'] . ' has only ' . $variant['stock'] . ' item(s) available.', 422);
        }

        $image = $variant['image_url'] ?: null;
        if ($image === null) {
            $imageStmt->execute([$productId]);
            $image = $imageStmt->fetchColumn() ?: null;
        }
        $total += (float) $variant['price'] * $quantity;
        $orderItems[] = [
            'product' => $product,
            'variant' => $variant,
            'quantity' => $quantity,
            'image_url' => $image,
        ];
    }

    if ($total <= 0) {
        fail('Order total is invalid.', 422);
    }

    return ['items' => $orderItems, 'total' => $total];
}

function create_local_order(array $user, array $orderItems, float $total, string $method, string $status, string $paymentStatus): int
{
    $db = pdo();
    $orderInsert = $db->prepare(
        'INSERT INTO orders
         (user_id, total, status, payment_status, payment_method, shipping_name, shipping_phone, shipping_address, shipping_city, shipping_state, shipping_pincode)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $orderInsert->execute([
        (int) $user['id'],
        $total,
        $status,
        $paymentStatus,
        $method,
        $user['name'],
        $user['phone'],
        $user['address'],
        $user['city'],
        $user['state'],
        $user['pincode'],
    ]);

    $orderId = (int) $db->lastInsertId();
    $itemInsert = $db->prepare(
        'INSERT INTO order_items (order_id, product_id, variant_id, product_name, product_size, category, price, quantity, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    foreach ($orderItems as $orderItem) {
        $product = $orderItem['product'];
        $variant = $orderItem['variant'];
        $itemInsert->execute([
            $orderId,
            (int) $product['id'],
            (int) $variant['id'],
            $product['name'],
            $variant['size_label'],
            $product['category'],
            (float) $variant['price'],
            (int) $orderItem['quantity'],
            $orderItem['image_url'],
        ]);
    }

    return $orderId;
}

function reduce_stock_for_items(array $orderItems): void
{
    $db = pdo();
    $variantStockUpdate = $db->prepare('UPDATE product_variants SET stock = stock - ? WHERE id = ? AND product_id = ? AND stock >= ?');
    $productStockUpdate = $db->prepare('UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?');

    foreach ($orderItems as $orderItem) {
        $quantity = (int) ($orderItem['quantity'] ?? 0);
        $productId = (int) ($orderItem['product_id'] ?? $orderItem['product']['id'] ?? 0);
        $variantId = (int) ($orderItem['variant_id'] ?? $orderItem['variant']['id'] ?? 0);

        if ($variantId > 0) {
            $variantStockUpdate->execute([$quantity, $variantId, $productId, $quantity]);
            if ($variantStockUpdate->rowCount() !== 1) {
                throw new RuntimeException('A product size in this order no longer has enough stock.');
            }
        }

        $productStockUpdate->execute([$quantity, $productId]);
    }
}

if ($action === 'create') {
    $items = $input['items'] ?? [];
    if (!is_array($items) || $items === []) {
        fail('Your cart is empty.', 422);
    }
    $method = strtolower((string) ($input['payment_method'] ?? 'razorpay'));
    if (!in_array($method, ['razorpay', 'cod'], true)) {
        fail('Invalid payment method.', 422);
    }
    $db = pdo();
    $collected = collect_order_items($items);
    $orderItems = $collected['items'];
    $total = $collected['total'];
    $razorpay = null;

    if ($method === 'razorpay') {
        $credentials = razorpay_credentials();
        if ($credentials['key_id'] === '' || $credentials['key_secret'] === '') {
            fail('Razorpay keys are missing. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the .env file.', 422);
        }
    }

    $db->beginTransaction();
    try {
        if ($method === 'cod') {
            $orderId = create_local_order($user, $orderItems, $total, 'cod', 'confirmed', 'cod_pending');
            reduce_stock_for_items($orderItems);
        } else {
            $orderId = create_local_order($user, $orderItems, $total, 'razorpay', 'pending', 'created');
            $razorpay = create_razorpay_order($total, $orderId);
            $update = $db->prepare('UPDATE orders SET razorpay_order_id = ? WHERE id = ?');
            $update->execute([$razorpay['id'], $orderId]);
        }

        $db->commit();
    } catch (Throwable $exception) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        if ($method === 'razorpay') {
            $message = $exception->getMessage();
            $status = str_contains($message, 'keys are missing') || str_contains($message, 'authentication failed') ? 422 : 502;
            fail('Could not start Razorpay payment: ' . $exception->getMessage(), $status);
        }
        fail('Could not create order: ' . $exception->getMessage(), 500);
    }

    if ($method === 'cod') {
        respond([
            'message' => 'COD order placed.',
            'order_id' => $orderId,
            'display_total' => $total,
            'payment_method' => 'cod',
        ], 201);
    }

    respond([
        'order_id' => $orderId,
        'amount' => (int) round($total * 100),
        'display_total' => $total,
        'razorpay_key_id' => razorpay_credentials()['key_id'],
        'razorpay_order_id' => $razorpay['id'],
        'currency' => 'INR',
        'payment_method' => 'razorpay',
    ], 201);
}

if ($action === 'fail') {
    validate_required($input, ['app_order_id']);

    $paymentStatus = strtolower((string) ($input['payment_status'] ?? 'failed'));
    if (!in_array($paymentStatus, ['failed', 'cancelled'], true)) {
        $paymentStatus = 'failed';
    }

    $sql = 'UPDATE orders
            SET status = ?, payment_status = ?
            WHERE id = ?
              AND user_id = ?
              AND payment_method = ?
              AND payment_status <> ?';
    $params = [
        'cancelled',
        $paymentStatus,
        (int) $input['app_order_id'],
        (int) $user['id'],
        'razorpay',
        'paid',
    ];

    if (!empty($input['razorpay_order_id'])) {
        $sql .= ' AND razorpay_order_id = ?';
        $params[] = (string) $input['razorpay_order_id'];
    }

    $stmt = pdo()->prepare($sql);
    $stmt->execute($params);

    respond(['message' => 'Payment attempt updated.']);
}

if ($action === 'verify') {
    validate_required($input, ['app_order_id', 'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature']);

    $secret = razorpay_credentials()['key_secret'];
    if ($secret === '') {
        fail('Razorpay secret is missing.', 422);
    }

    $expected = hash_hmac(
        'sha256',
        $input['razorpay_order_id'] . '|' . $input['razorpay_payment_id'],
        $secret
    );

    if (!hash_equals($expected, (string) $input['razorpay_signature'])) {
        fail('Payment signature verification failed.', 400);
    }

    $db = pdo();
    $orderStmt = $db->prepare('SELECT * FROM orders WHERE id = ? AND user_id = ? AND razorpay_order_id = ?');
    $orderStmt->execute([(int) $input['app_order_id'], (int) $user['id'], $input['razorpay_order_id']]);
    $order = $orderStmt->fetch();
    if (!$order) {
        fail('Order not found.', 404);
    }

    if ($order['payment_status'] === 'paid') {
        respond(['message' => 'Payment already verified.']);
    }

    $itemsStmt = $db->prepare('SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?');
    $itemsStmt->execute([(int) $order['id']]);
    $items = $itemsStmt->fetchAll();

    $db->beginTransaction();
    try {
        reduce_stock_for_items($items);

        $paidUpdate = $db->prepare(
            'UPDATE orders
             SET status = ?, payment_status = ?, razorpay_payment_id = ?, razorpay_signature = ?
             WHERE id = ?'
        );
        $paidUpdate->execute([
            'confirmed',
            'paid',
            $input['razorpay_payment_id'],
            $input['razorpay_signature'],
            (int) $order['id'],
        ]);

        $db->commit();
    } catch (Throwable $exception) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        fail($exception->getMessage(), 422);
    }

    respond(['message' => 'Payment verified.', 'order_id' => (int) $order['id']]);
}

fail('Unknown payment action.', 404);
