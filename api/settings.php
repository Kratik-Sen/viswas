<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_admin();

if (method_is('GET')) {
    respond([
        'razorpay_key_id' => env_value('RAZORPAY_KEY_ID', ''),
        'razorpay_secret_set' => env_value('RAZORPAY_KEY_SECRET', '') !== '',
        'cloudinary_configured' => env_value('CLOUDINARY_CLOUD_NAME', '') !== ''
            && env_value('CLOUDINARY_API_KEY', '') !== ''
            && env_value('CLOUDINARY_API_SECRET', '') !== '',
    ]);
}

if (!method_is('POST')) {
    fail('Method not allowed.', 405);
}

$input = json_input();
$existingSecretSet = env_value('RAZORPAY_KEY_SECRET', '') !== '';
$updates = [];
if (array_key_exists('razorpay_key_id', $input)) {
    $updates['RAZORPAY_KEY_ID'] = trim((string) $input['razorpay_key_id']);
}
if (array_key_exists('razorpay_key_secret', $input) && trim((string) $input['razorpay_key_secret']) !== '') {
    $updates['RAZORPAY_KEY_SECRET'] = trim((string) $input['razorpay_key_secret']);
}

if ($updates === []) {
    fail('Nothing to update.', 422);
}

write_env_values($updates);

respond([
    'message' => 'Payment settings saved.',
    'razorpay_key_id' => $updates['RAZORPAY_KEY_ID'] ?? env_value('RAZORPAY_KEY_ID', ''),
    'razorpay_secret_set' => array_key_exists('RAZORPAY_KEY_SECRET', $updates) || $existingSecretSet,
    'cloudinary_configured' => env_value('CLOUDINARY_CLOUD_NAME', '') !== ''
        && env_value('CLOUDINARY_API_KEY', '') !== ''
        && env_value('CLOUDINARY_API_SECRET', '') !== '',
]);
