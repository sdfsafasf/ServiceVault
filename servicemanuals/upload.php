<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

if (empty($_POST['brand_code']) || empty($_POST['model_code']) || empty($_FILES['manual_files'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required data (brand, model, or files).']);
    exit;
}

// Sanitize inputs
$brand_code = preg_replace('/[^a-z0-9]/', '', strtolower($_POST['brand_code']));
$model_code = preg_replace('/[^a-zA-Z0-9]/', '', $_POST['model_code']);

if (empty($brand_code) || empty($model_code)) {
    echo json_encode(['success' => false, 'message' => 'Invalid brand or model code format.']);
    exit;
}

$target_dir = __DIR__ . "/../data/brands/{$brand_code}/{$model_code}/manual/";

if (!is_dir($target_dir) && !mkdir($target_dir, 0755, true)) {
    echo json_encode(['success' => false, 'message' => "Error: Failed to create directory at '{$target_dir}'. Check server permissions."]);
    exit;
}

$files = $_FILES['manual_files'];
$errors = [];
$success_count = 0;

for ($i = 0; $i < count($files['name']); $i++) {
    $filename = basename($files['name'][$i]);
    $tmp_name = $files['tmp_name'][$i];
    $error = $files['error'][$i];

    if ($error !== UPLOAD_ERR_OK) {
        $errors[] = "Error uploading {$filename}: Code {$error}";
        continue;
    }

    $destination = $target_dir . $filename;
    if (move_uploaded_file($tmp_name, $destination)) {
        $success_count++;
    } else {
        $errors[] = "Failed to move uploaded file: {$filename}";
    }
}

if ($success_count > 0 && empty($errors)) {
    echo json_encode(['success' => true, 'message' => "Successfully uploaded {$success_count} files."]);
} else {
    $error_message = "{$success_count} files uploaded. Errors encountered: " . implode(', ', $errors);
    echo json_encode(['success' => false, 'message' => $error_message]);
}
?>