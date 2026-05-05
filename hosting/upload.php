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
 * The Vercel app calls this script with:
 *   POST with multipart form fields:
 *     folder   = 'uploads' | 'results'
 *     filename = safe filename string
 *     data     = base64-encoded file bytes
 *   Header: X-Secret: <STORAGE_SECRET_TOKEN>
 */

// ── Config ────────────────────────────────────────────────────────────────
$secret = getenv('AI_STUDIO_SECRET') ?: 'CHANGE_ME_IN_HOSTING_ENV';
$base_dir = __DIR__;  // same directory as this script

// ── Auth ──────────────────────────────────────────────────────────────────
$provided = $_SERVER['HTTP_X_SECRET'] ?? '';
if (!hash_equals($secret, $provided)) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

// ── Validate input ────────────────────────────────────────────────────────
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

$folder   = $_POST['folder']   ?? '';
$filename = $_POST['filename'] ?? '';
$data     = $_POST['data']     ?? '';

if (!in_array($folder, ['uploads', 'results'], true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid folder']);
    exit;
}

// Sanitise filename — allow only alphanumeric, dash, underscore, dot.
$filename = preg_replace('/[^a-zA-Z0-9_\-\.]/', '', $filename);
if (!$filename || strlen($filename) > 200) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid filename']);
    exit;
}

$bytes = base64_decode($data, true);
if ($bytes === false) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid base64 data']);
    exit;
}

// Max 25 MB
if (strlen($bytes) > 25 * 1024 * 1024) {
    http_response_code(413);
    echo json_encode(['error' => 'File too large']);
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
