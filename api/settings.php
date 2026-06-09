<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_admin();

$razorpayCredentials = razorpay_credentials();
$cloudinaryConfigured = env_value('CLOUDINARY_CLOUD_NAME', '') !== ''
    && env_value('CLOUDINARY_API_KEY', '') !== ''
    && env_value('CLOUDINARY_API_SECRET', '') !== '';

if (method_is('GET')) {
    respond([
        'razorpay_configured' => $razorpayCredentials['key_id'] !== '' && $razorpayCredentials['key_secret'] !== '',
        'cloudinary_configured' => $cloudinaryConfigured,
    ]);
}

fail('Method not allowed.', 405);
