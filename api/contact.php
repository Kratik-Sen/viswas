<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if (method_is('GET')) {
    require_admin();
    $stmt = pdo()->query('SELECT * FROM contact_messages ORDER BY created_at DESC, id DESC');
    $messages = $stmt->fetchAll();
    foreach ($messages as &$message) {
        $message['id'] = (int) $message['id'];
    }
    respond(['messages' => $messages]);
}

if (!method_is('POST')) {
    fail('Method not allowed.', 405);
}

$input = json_input();
validate_required($input, ['name', 'email', 'message']);

if (!preg_match("/^[A-Za-z0-9 .,'()\/#&+\-]+$/", trim((string) $input['name']))) {
    fail('Name can contain letters, numbers, spaces, and basic punctuation only.', 422);
}
if (!empty($input['phone']) && !preg_match('/^[0-9]+$/', trim((string) $input['phone']))) {
    fail('Phone number can contain numbers only.', 422);
}
if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    fail('Please enter a valid email address.', 422);
}

$stmt = pdo()->prepare('INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)');
$stmt->execute([
    trim((string) $input['name']),
    strtolower(trim((string) $input['email'])),
    trim((string) ($input['phone'] ?? '')),
    trim((string) $input['message']),
]);

respond(['message' => 'Message received.'], 201);
