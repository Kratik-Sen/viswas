<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if (!method_is('GET')) {
    fail('Method not allowed.', 405);
}

$user = require_user();
$orderId = (int) ($_GET['id'] ?? 0);
if ($orderId <= 0) {
    fail('Order id is required.', 422);
}

$sql = 'SELECT orders.*, users.name AS customer_name, users.email AS customer_email
        FROM orders
        JOIN users ON users.id = orders.user_id
        WHERE orders.id = ?';
$params = [$orderId];

if (($user['role'] ?? '') !== 'admin') {
    $sql .= ' AND orders.user_id = ?';
    $params[] = (int) $user['id'];
}

$stmt = pdo()->prepare($sql);
$stmt->execute($params);
$order = $stmt->fetch();
if (!$order) {
    fail('Order not found.', 404);
}

if (!in_array($order['payment_status'], ['paid', 'cod_pending'], true)) {
    fail('Invoice is available after payment or COD order confirmation.', 422);
}

$itemStmt = pdo()->prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC');
$itemStmt->execute([$orderId]);
$items = $itemStmt->fetchAll();

function pdf_clean(string $value): string
{
    $value = str_replace(["\r", "\n", "\t"], ' ', $value);
    $value = preg_replace('/[^\x20-\x7E]/', '', $value) ?? '';
    return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], trim($value));
}

function pdf_text(array &$lines, int $x, int $y, int $size, string $text): void
{
    $lines[] = "BT /F1 {$size} Tf {$x} {$y} Td (" . pdf_clean($text) . ") Tj ET";
}

function pdf_line(array &$lines, int $x1, int $y1, int $x2, int $y2): void
{
    $lines[] = "{$x1} {$y1} m {$x2} {$y2} l S";
}

function build_pdf(string $content): string
{
    $objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        "<< /Length " . strlen($content) . " >>\nstream\n{$content}\nendstream",
    ];

    $pdf = "%PDF-1.4\n";
    $offsets = [0];

    foreach ($objects as $index => $object) {
        $offsets[] = strlen($pdf);
        $number = $index + 1;
        $pdf .= "{$number} 0 obj\n{$object}\nendobj\n";
    }

    $xref = strlen($pdf);
    $pdf .= "xref\n0 " . (count($objects) + 1) . "\n";
    $pdf .= "0000000000 65535 f \n";
    for ($i = 1; $i <= count($objects); $i++) {
        $pdf .= str_pad((string) $offsets[$i], 10, '0', STR_PAD_LEFT) . " 00000 n \n";
    }
    $pdf .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\n";
    $pdf .= "startxref\n{$xref}\n%%EOF";

    return $pdf;
}

$paymentLabel = $order['payment_method'] === 'cod' ? 'Cash on Delivery' : 'Razorpay';
$lines = ['0.09 0.42 0.31 RG', '1.4 w'];

pdf_text($lines, 48, 790, 24, 'Viswas Oils');
pdf_text($lines, 48, 768, 11, 'Cold Pressed Oils');
pdf_text($lines, 390, 790, 18, 'Invoice #' . (int) $order['id']);
pdf_text($lines, 390, 770, 10, 'Date: ' . date('d M Y, h:i A', strtotime($order['created_at'])));
pdf_text($lines, 390, 754, 10, 'Payment: ' . $paymentLabel . ' (' . $order['payment_status'] . ')');
pdf_line($lines, 48, 735, 548, 735);

$y = 710;
pdf_text($lines, 48, $y, 14, 'Bill To');
$y -= 20;
$billingLines = [
    $order['shipping_name'],
    $order['customer_email'] ?? '',
    $order['shipping_phone'],
    $order['shipping_address'] . ', ' . $order['shipping_city'],
    $order['shipping_state'] . ' - ' . $order['shipping_pincode'],
];
foreach ($billingLines as $line) {
    foreach (explode("\n", wordwrap((string) $line, 72)) as $wrapped) {
        pdf_text($lines, 48, $y, 10, $wrapped);
        $y -= 14;
    }
}

$y -= 16;
pdf_text($lines, 48, $y, 11, 'Product');
pdf_text($lines, 330, $y, 11, 'Qty');
pdf_text($lines, 390, $y, 11, 'Price');
pdf_text($lines, 470, $y, 11, 'Total');
$y -= 8;
pdf_line($lines, 48, $y, 548, $y);
$y -= 18;

foreach ($items as $item) {
    if ($y < 95) {
        pdf_text($lines, 48, $y, 10, 'More items are available in the order record.');
        break;
    }

    $lineTotal = (float) $item['price'] * (int) $item['quantity'];
    $size = trim((string) ($item['product_size'] ?? ''));
    $productName = $item['product_name'] . ($size !== '' ? ' (' . $size . ')' : '') . ' - ' . $item['category'];
    pdf_text($lines, 48, $y, 10, substr($productName, 0, 48));
    pdf_text($lines, 330, $y, 10, (string) (int) $item['quantity']);
    pdf_text($lines, 390, $y, 10, 'Rs. ' . number_format((float) $item['price'], 2));
    pdf_text($lines, 470, $y, 10, 'Rs. ' . number_format($lineTotal, 2));
    $y -= 22;
}

$y -= 4;
pdf_line($lines, 330, $y, 548, $y);
$y -= 26;
pdf_text($lines, 350, $y, 16, 'Grand Total: Rs. ' . number_format((float) $order['total'], 2));
pdf_text($lines, 48, 52, 9, 'Thank you for shopping with Viswas Oils.');

$pdf = build_pdf(implode("\n", $lines));

header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="invoice-order-' . (int) $order['id'] . '.pdf"');
header('Content-Length: ' . strlen($pdf));
echo $pdf;
exit;
