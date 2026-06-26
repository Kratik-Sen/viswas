<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

function uploaded_files(string $field): array
{
    if (!isset($_FILES[$field])) {
        return [];
    }

    $files = $_FILES[$field];
    if (!is_array($files['name'])) {
        if (($files['name'] ?? '') === '' || ($files['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            return [];
        }

        return [$files];
    }

    $normalized = [];
    foreach ($files['name'] as $index => $name) {
        if ($name === '') {
            continue;
        }

        $normalized[] = [
            'name' => $name,
            'type' => $files['type'][$index],
            'tmp_name' => $files['tmp_name'][$index],
            'error' => $files['error'][$index],
            'size' => $files['size'][$index],
        ];
    }

    return $normalized;
}

function uploaded_file_map(string $field): array
{
    if (!isset($_FILES[$field])) {
        return [];
    }

    $files = $_FILES[$field];
    if (!is_array($files['name'])) {
        if (($files['name'] ?? '') === '') {
            return [];
        }

        return ['0' => $files];
    }

    $normalized = [];
    foreach ($files['name'] as $key => $name) {
        if (is_array($name) || $name === '') {
            continue;
        }

        $normalized[(string) $key] = [
            'name' => $name,
            'type' => $files['type'][$key],
            'tmp_name' => $files['tmp_name'][$key],
            'error' => $files['error'][$key],
            'size' => $files['size'][$key],
        ];
    }

    return $normalized;
}

function product_variant_payload(array $post): array
{
    $rawVariants = $post['variants'] ?? [];
    if (!is_array($rawVariants)) {
        $rawVariants = [];
    }

    $variants = [];
    foreach ($rawVariants as $key => $variant) {
        if (!is_array($variant)) {
            continue;
        }

        $size = trim((string) ($variant['size'] ?? ''));
        $price = trim((string) ($variant['price'] ?? ''));
        $discountPrice = trim((string) ($variant['discount_price'] ?? ''));
        $stock = trim((string) ($variant['stock'] ?? ''));

        if ($size === '' && $price === '' && $discountPrice === '' && $stock === '') {
            continue;
        }
        if ($size === '' || !preg_match("/^[A-Za-z0-9 .,'()\/#&+\-]+$/", $size)) {
            fail('Each size must have a valid size label.', 422);
        }
        if (!preg_match('/^[0-9]+(\.[0-9]{1,2})?$/', $price)) {
            fail('Each size price must contain numbers only, with up to two decimals.', 422);
        }
        if ($discountPrice !== '' && !preg_match('/^[0-9]+(\.[0-9]{1,2})?$/', $discountPrice)) {
            fail('Each discount price must contain numbers only, with up to two decimals.', 422);
        }
        if (!preg_match('/^[0-9]+$/', $stock)) {
            fail('Each size quantity must contain numbers only.', 422);
        }

        $priceValue = (float) $price;
        $discountPriceValue = $discountPrice === '' ? null : (float) $discountPrice;
        if ($priceValue <= 0) {
            fail('Each size price must be greater than zero.', 422);
        }
        if ($discountPriceValue !== null && $discountPriceValue <= 0) {
            fail('Discount price must be greater than zero.', 422);
        }
        if ($discountPriceValue !== null && $discountPriceValue >= $priceValue) {
            fail('Discount price must be lower than the original price.', 422);
        }

        $variants[] = [
            'key' => (string) $key,
            'existing_id' => ctype_digit((string) $key) ? (int) $key : null,
            'size' => $size,
            'price' => $priceValue,
            'discount_price' => $discountPriceValue,
            'stock' => (int) $stock,
        ];
    }

    if ($variants === []) {
        fail('Add at least one product size.', 422);
    }

    return $variants;
}

if (method_is('GET')) {
    if (isset($_GET['categories'])) {
        respond(['categories' => PRODUCT_CATEGORIES]);
    }

    ensure_product_banner_columns();
    ensure_category_faq_table();

    if (isset($_GET['id'])) {
        $stmt = pdo()->prepare('SELECT * FROM products WHERE id = ? AND active = 1');
        $stmt->execute([(int) $_GET['id']]);
        $row = $stmt->fetch();
        if (!$row) {
            fail('Product not found.', 404);
        }
        respond(['product' => normalize_product($row)]);
    }

    $params = [];
    $sql = 'SELECT * FROM products WHERE active = 1';
    if (!empty($_GET['category'])) {
        $sql .= ' AND category = ?';
        $params[] = $_GET['category'];
    }

    $orderCases = [];
    foreach (PRODUCT_CATEGORIES as $index => $orderedCategory) {
        $orderCases[] = 'WHEN ? THEN ' . ($index + 1);
        $params[] = $orderedCategory;
    }
    $sql .= ' ORDER BY CASE category ' . implode(' ', $orderCases) . ' ELSE 999 END, created_at DESC, id DESC';

    $stmt = pdo()->prepare($sql);
    $stmt->execute($params);
    $products = array_map('normalize_product', $stmt->fetchAll());
    respond(['products' => $products, 'categories' => PRODUCT_CATEGORIES, 'category_faqs' => category_faqs()]);
}

if (!method_is('POST')) {
    fail('Method not allowed.', 405);
}

require_admin();

$action = $_POST['action'] ?? $_GET['action'] ?? 'create';

if ($action === 'delete') {
    $id = (int) ($_POST['id'] ?? 0);
    if ($id <= 0) {
        fail('Product id is required.', 422);
    }

    $stmt = pdo()->prepare('UPDATE products SET active = 0 WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() !== 1) {
        fail('Product not found.', 404);
    }

    respond(['message' => 'Product deleted.']);
}

if ($action === 'delete_image') {
    $imageId = (int) ($_POST['image_id'] ?? 0);
    if ($imageId <= 0) {
        fail('Image id is required.', 422);
    }

    $stmt = pdo()->prepare(
        'DELETE product_images
         FROM product_images
         JOIN products ON products.id = product_images.product_id
         WHERE product_images.id = ?'
    );
    $stmt->execute([$imageId]);
    if ($stmt->rowCount() !== 1) {
        fail('Product image not found.', 404);
    }

    respond(['message' => 'Product image removed.']);
}

if ($action === 'save_faqs') {
    $category = trim((string) ($_POST['category'] ?? ''));
    if (!in_array($category, PRODUCT_CATEGORIES, true)) {
        fail('Invalid FAQ category.', 422);
    }

    ensure_category_faq_table();
    $rawFaqs = $_POST['faqs'] ?? [];
    if (!is_array($rawFaqs)) {
        $rawFaqs = [];
    }

    $faqs = [];
    foreach ($rawFaqs as $faq) {
        if (!is_array($faq)) {
            continue;
        }

        $question = trim((string) ($faq['question'] ?? ''));
        $answer = trim((string) ($faq['answer'] ?? ''));

        if ($question === '' && $answer === '') {
            continue;
        }
        if ($question === '' || $answer === '') {
            fail('Each FAQ needs both a question and an answer.', 422);
        }
        if (strlen($question) > 255) {
            fail('FAQ questions must be 255 characters or less.', 422);
        }
        if (strlen($answer) > 2000) {
            fail('FAQ answers must be 2000 characters or less.', 422);
        }

        $faqs[] = [
            'question' => $question,
            'answer' => $answer,
        ];
    }

    $db = pdo();
    $db->beginTransaction();
    try {
        $delete = $db->prepare('DELETE FROM category_faqs WHERE category = ?');
        $delete->execute([$category]);

        $insert = $db->prepare(
            'INSERT INTO category_faqs (category, question, answer, sort_order, active)
             VALUES (?, ?, ?, ?, 1)'
        );
        foreach ($faqs as $index => $faq) {
            $insert->execute([$category, $faq['question'], $faq['answer'], $index + 1]);
        }

        $db->commit();
    } catch (Throwable $exception) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        fail($exception->getMessage(), 500);
    }

    respond([
        'message' => 'Category FAQs saved.',
        'category' => $category,
        'faqs' => category_faqs($category),
    ]);
}

validate_required($_POST, ['name', 'category']);

if (!preg_match("/^[A-Za-z0-9 .,'()\/#&+\-]+$/", trim((string) $_POST['name']))) {
    fail('Product name can contain letters, numbers, spaces, and basic punctuation only.', 422);
}

$category = trim((string) $_POST['category']);
if (!in_array($category, PRODUCT_CATEGORIES, true)) {
    fail('Invalid product category.', 422);
}

ensure_variant_image_columns();
ensure_product_banner_columns();
$variants = product_variant_payload($_POST);
$variantImageFiles = uploaded_file_map('variant_images');
$bannerFile = uploaded_files('banner_image')[0] ?? null;
$price = (float) $variants[0]['price'];
$stock = array_sum(array_map(static fn(array $variant): int => (int) $variant['stock'], $variants));
$description = trim((string) ($_POST['description'] ?? ''));
$productBenefits = trim((string) ($_POST['product_benefits'] ?? ''));
if ($price <= 0) {
    fail('Price must be greater than zero.', 422);
}
if ($stock < 0) {
    fail('Quantity cannot be negative.', 422);
}

$db = pdo();
$db->beginTransaction();

try {
    $bannerUrl = null;
    $bannerPublicId = null;

    if ($action === 'update') {
        $productId = (int) ($_POST['id'] ?? 0);
        if ($productId <= 0) {
            fail('Product id is required.', 422);
        }

        $productLookup = $db->prepare('SELECT banner_image_url, banner_image_public_id FROM products WHERE id = ?');
        $productLookup->execute([$productId]);
        $existingProduct = $productLookup->fetch();
        if (!$existingProduct) {
            fail('Product not found.', 404);
        }

        $bannerUrl = $existingProduct['banner_image_url'] ?: null;
        $bannerPublicId = $existingProduct['banner_image_public_id'] ?: null;
    }

    if ($bannerFile) {
        $uploadedBanner = upload_product_image($bannerFile);
        $bannerUrl = $uploadedBanner['url'];
        $bannerPublicId = $uploadedBanner['public_id'];
    }

    if ($action === 'update') {
        $update = $db->prepare(
            'UPDATE products
             SET name = ?, category = ?, description = ?, product_benefits = ?, banner_image_url = ?, banner_image_public_id = ?, price = ?, stock = ?, active = 1
             WHERE id = ?'
        );
        $update->execute([
            trim((string) $_POST['name']),
            $category,
            $description,
            $productBenefits,
            $bannerUrl,
            $bannerPublicId,
            $price,
            $stock,
            $productId,
        ]);

        if ($update->rowCount() === 0) {
            $exists = $db->prepare('SELECT id FROM products WHERE id = ?');
            $exists->execute([$productId]);
            if (!$exists->fetch()) {
                fail('Product not found.', 404);
            }
        }
    } else {
        $insert = $db->prepare(
            'INSERT INTO products (name, category, description, product_benefits, banner_image_url, banner_image_public_id, price, stock, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)'
        );
        $insert->execute([
            trim((string) $_POST['name']),
            $category,
            $description,
            $productBenefits,
            $bannerUrl,
            $bannerPublicId,
            $price,
            $stock,
        ]);

        $productId = (int) $db->lastInsertId();
    }

    $imageInsert = $db->prepare('INSERT INTO product_images (product_id, url, public_id) VALUES (?, ?, ?)');
    $files = uploaded_files('images');
    $existingVariantImagesById = [];
    $existingVariantImagesBySize = [];
    if ($action === 'update') {
        $variantImageLookup = $db->prepare(
            'SELECT id, size_label, image_url, image_public_id
             FROM product_variants
             WHERE product_id = ?'
        );
        $variantImageLookup->execute([$productId]);
        foreach ($variantImageLookup->fetchAll() as $existingVariant) {
            $image = [
                'url' => $existingVariant['image_url'] ?: null,
                'public_id' => $existingVariant['image_public_id'] ?: null,
            ];
            $existingVariantImagesById[(int) $existingVariant['id']] = $image;
            $existingVariantImagesBySize[strtolower((string) $existingVariant['size_label'])] = $image;
        }
    }

    $deleteVariants = $db->prepare('DELETE FROM product_variants WHERE product_id = ?');
    $deleteVariants->execute([$productId]);

    $variantInsert = $db->prepare(
        'INSERT INTO product_variants (product_id, size_label, price, discount_price, stock, image_url, image_public_id, active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
    );
    foreach ($variants as $variant) {
        $imageUrl = null;
        $imagePublicId = null;
        $variantKey = $variant['key'];

        if (isset($variantImageFiles[$variantKey])) {
            $uploaded = upload_product_image($variantImageFiles[$variantKey]);
            $imageUrl = $uploaded['url'];
            $imagePublicId = $uploaded['public_id'];
        } elseif ($variant['existing_id'] && isset($existingVariantImagesById[$variant['existing_id']])) {
            $imageUrl = $existingVariantImagesById[$variant['existing_id']]['url'];
            $imagePublicId = $existingVariantImagesById[$variant['existing_id']]['public_id'];
        } else {
            $existingImage = $existingVariantImagesBySize[strtolower($variant['size'])] ?? null;
            if ($existingImage) {
                $imageUrl = $existingImage['url'];
                $imagePublicId = $existingImage['public_id'];
            }
        }

        $variantInsert->execute([
            $productId,
            $variant['size'],
            $variant['price'],
            $variant['discount_price'],
            $variant['stock'],
            $imageUrl,
            $imagePublicId,
        ]);
    }

    foreach ($files as $file) {
        $uploaded = upload_product_image($file);
        $imageInsert->execute([$productId, $uploaded['url'], $uploaded['public_id']]);
    }

    $db->commit();

    $stmt = $db->prepare('SELECT * FROM products WHERE id = ?');
    $stmt->execute([$productId]);
    respond([
        'message' => $action === 'update' ? 'Product updated.' : 'Product added.',
        'product' => normalize_product($stmt->fetch()),
    ], $action === 'update' ? 200 : 201);
} catch (Throwable $exception) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    fail($exception->getMessage(), 500);
}
