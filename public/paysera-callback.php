<?php
declare(strict_types=1);

$upstream = 'https://qhcgchqflvyihhccgxjh.supabase.co/functions/v1/paysera-callback';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method !== 'GET' && $method !== 'POST') {
    http_response_code(405);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Method not allowed';
    exit;
}

$url = $upstream;
$body = null;

if ($method === 'GET') {
    $query = $_SERVER['QUERY_STRING'] ?? '';
    if ($query !== '') {
        $url .= '?' . $query;
    }
} else {
    $body = file_get_contents('php://input');
    if ($body === false) {
        http_response_code(400);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Invalid request';
        exit;
    }
}

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_TIMEOUT, 25);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: text/plain']);

if ($method === 'POST') {
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: text/plain',
        'Content-Type: application/x-www-form-urlencoded',
    ]);
}

$response = curl_exec($ch);
$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

header('Content-Type: text/plain; charset=utf-8');

if ($response === false || $status === 0) {
    http_response_code(502);
    echo 'Callback proxy unavailable';
    exit;
}

http_response_code($status);
echo $response;
