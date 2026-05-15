<?php
/**
 * AI Studio — Shared Hosting Upload Script
 *
 * Deploy this file to your shared hosting account at:
 *   /public_html/ai-uploads/upload.php   (or wherever your web root is)
 *
 * Create these sibling directories and set permissions to 755:
 *   /public_html/ai-uploads/uploads/     (original images)
 *   /public_html/ai-uploads/results/     (processed outputs)
 *
 * Set the SECRET environment variable in your hosting control panel,
 * or hardcode it here (make sure .htaccess restricts direct access to this file).
 *
 * Two auth modes:
 *   Server-to-server: Header X-Secret: <STORAGE_SECRET_TOKEN>
 *   Direct browser upload: Header X-Upload-Token: <expiresAt>:<hmac>
 *     Token is issued by /api/upload-token and expires after 5 minutes.
 *
 * File data accepted as:
 *   file  = multipart file field (direct browser upload, preferred)
 *   data  = base64-encoded bytes (server-to-server legacy path)
 */

// ── Config ────────────────────────────────────────────────────────────────
$secret   = getenv('AI_STUDIO_SECRET') ?: 'CHANGE_ME_IN_HOSTING_ENV';
$base_dir = __DIR__;

// ── CORS (browser uploads need cross-origin access) ───────────────────────
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Secret, X-Upload-Token, Content-Type');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Auth ──────────────────────────────────────────────────────────────────
$provided_secret = $_SERVER['HTTP_X_SECRET']       ?? '';
$provided_token  = $_SERVER['HTTP_X_UPLOAD_TOKEN'] ?? '';

if (!empty($provided_secret)) {
    if (!hash_equals($secret, $provided_secret)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
} elseif (!empty($provided_token)) {
    $parts   = explode(':', $provided_token, 2);
    $expires = isset($parts[0]) ? (int)$parts[0] : 0;
    $hmac    = $parts[1] ?? '';
    if (time() > $expires) {
        http_response_code(403);
        echo json_encode(['error' => 'Token expired']);
        exit;
    }
    $expected = hash_hmac('sha256', 'upload:' . $expires, $secret);
    if (!hash_equals($expected, $hmac)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
} else {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

// ── Validate method ───────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ── Delete action ─────────────────────────────────────────────────────────
if (($_POST['action'] ?? '') === 'delete') {
    $folder   = $_POST['folder']   ?? '';
    $filename = $_POST['filename'] ?? '';

    if (!in_array($folder, ['uploads', 'results'], true)) {
        http_response_code(400); echo json_encode(['error' => 'Invalid folder']); exit;
    }

    $filename = preg_replace('/[^a-zA-Z0-9_\-\.]/', '', $filename);
    if (!$filename || strlen($filename) > 200) {
        http_response_code(400); echo json_encode(['error' => 'Invalid filename']); exit;
    }

    $path = $base_dir . '/' . $folder . '/' . $filename;
    if (!file_exists($path)) {
        http_response_code(404); echo json_encode(['error' => 'File not found']); exit;
    }

    if (!unlink($path)) {
        http_response_code(500); echo json_encode(['error' => 'Failed to delete file']); exit;
    }

    header('Content-Type: application/json');
    echo json_encode(['ok' => true]);
    exit;
}

// ── Upload action ─────────────────────────────────────────────────────────
$folder   = $_POST['folder']   ?? '';
$filename = $_POST['filename'] ?? '';

if (!in_array($folder, ['uploads', 'results'], true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid folder']);
    exit;
}

$filename = preg_replace('/[^a-zA-Z0-9_\-\.]/', '', $filename);
if (!$filename || strlen($filename) > 200) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid filename']);
    exit;
}

// Accept either a multipart file (browser) or base64 POST field (server)
if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $bytes = file_get_contents($_FILES['file']['tmp_name']);
} else {
    $data  = $_POST['data'] ?? '';
    $bytes = base64_decode($data, true);
    if ($bytes === false) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid base64 data']);
        exit;
    }
}

// Max 25 MB
if (strlen($bytes) > 25 * 1024 * 1024) {
    http_response_code(413);
    echo json_encode(['error' => 'File too large (max 25 MB)']);
    exit;
}

// ── Save file ────────────────────────────────────────────────────────────
$dir  = $base_dir . '/' . $folder . '/';
$path = $dir . $filename;

if (!is_dir($dir)) {
    http_response_code(500);
    echo json_encode(['error' => 'Target directory does not exist']);
    exit;
}

if (file_put_contents($path, $bytes) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to write file']);
    exit;
}

// ── Return public URL ────────────────────────────────────────────────────
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host     = $_SERVER['HTTP_HOST'];
$script   = dirname($_SERVER['SCRIPT_NAME']);
$url      = $protocol . '://' . $host . $script . '/' . $folder . '/' . rawurlencode($filename);

header('Content-Type: application/json');
echo json_encode(['url' => $url]);
