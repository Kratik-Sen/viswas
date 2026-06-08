<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$input = json_input();
$action = $_GET['action'] ?? $input['action'] ?? '';

if (method_is('GET') || $action === 'me') {
    respond(['user' => current_user()]);
}

if (!method_is('POST')) {
    fail('Method not allowed.', 405);
}

if ($action === 'register') {
    validate_required($input, ['name', 'email', 'phone', 'address', 'city', 'state', 'pincode', 'password']);

    foreach (['name', 'city', 'state'] as $field) {
        if (!preg_match("/^[A-Za-z0-9 .,'()\/#&+\-]+$/", trim((string) $input[$field]))) {
            fail(ucwords($field) . ' can contain letters, numbers, spaces, and basic punctuation only.', 422);
        }
    }
    foreach (['phone', 'pincode'] as $field) {
        if (!preg_match('/^[0-9]+$/', trim((string) $input[$field]))) {
            fail(ucwords($field) . ' can contain numbers only.', 422);
        }
    }

    $email = strtolower(trim((string) $input['email']));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fail('Please enter a valid email address.', 422);
    }
    if (strlen((string) $input['password']) < 6) {
        fail('Password must be at least 6 characters.', 422);
    }

    $stmt = pdo()->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        fail('An account already exists with this email.', 409);
    }

    $insert = pdo()->prepare(
        'INSERT INTO users (name, email, phone, address, city, state, pincode, password_hash, role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $insert->execute([
        trim((string) $input['name']),
        $email,
        trim((string) $input['phone']),
        trim((string) $input['address']),
        trim((string) $input['city']),
        trim((string) $input['state']),
        trim((string) $input['pincode']),
        password_hash((string) $input['password'], PASSWORD_DEFAULT),
        'user',
    ]);

    $_SESSION['user_id'] = (int) pdo()->lastInsertId();
    respond(['message' => 'Account created.', 'user' => current_user()], 201);
}

if ($action === 'login') {
    validate_required($input, ['email', 'password']);

    $email = strtolower(trim((string) $input['email']));
    $stmt = pdo()->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify((string) $input['password'], (string) $user['password_hash'])) {
        fail('Invalid email or password.', 401);
    }

    $_SESSION['user_id'] = (int) $user['id'];
    respond(['message' => 'Logged in.', 'user' => current_user()]);
}

if ($action === 'logout') {
    $_SESSION = [];
    session_destroy();
    respond(['message' => 'Logged out.']);
}

fail('Unknown auth action.', 404);
