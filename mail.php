<?php
/**
 * Wysyłka formularza kontaktowego — nawazanie.pl
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'ok' => false,
        'message' => 'Dozwolona jest tylko metoda POST.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/** Adres odbiorcy zgłoszeń */
const MAIL_TO = 'biuro@spolex.com';

/** Nadawca techniczny (musi być domeną hostingu) */
const MAIL_FROM = 'noreply@spolex.com';

function respond(bool $ok, string $message, int $code = 200): void
{
    http_response_code($code);
    echo json_encode([
        'ok' => $ok,
        'message' => $message,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function clean(string $value): string
{
    $value = strip_tags($value);
    $value = str_replace(["\r", "\n", "\0"], ' ', $value);
    return trim($value);
}

// Honeypot — boty wypełniają ukryte pole
$honeypot = isset($_POST['website']) ? trim((string) $_POST['website']) : '';
if ($honeypot !== '') {
    respond(true, 'Dziękujemy. Wiadomość została wysłana.');
}

$name = isset($_POST['name']) ? clean((string) $_POST['name']) : '';
$company = isset($_POST['company']) ? clean((string) $_POST['company']) : '';
$email = isset($_POST['email']) ? trim((string) $_POST['email']) : '';
$phone = isset($_POST['phone']) ? clean((string) $_POST['phone']) : '';
$message = isset($_POST['message']) ? trim(strip_tags((string) $_POST['message'])) : '';

$errors = [];

if ($name === '' || mb_strlen($name) < 2) {
    $errors[] = 'Podaj imię i nazwisko.';
}
if ($company === '' || mb_strlen($company) < 2) {
    $errors[] = 'Podaj nazwę firmy.';
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Podaj poprawny adres e-mail.';
}
if ($message === '' || mb_strlen($message) < 10) {
    $errors[] = 'Opisz krótko potrzebę (min. 10 znaków).';
}
if (mb_strlen($name) > 120 || mb_strlen($company) > 160 || mb_strlen($phone) > 40 || mb_strlen($message) > 5000) {
    $errors[] = 'Jedno z pól jest zbyt długie.';
}

if ($errors) {
    respond(false, implode(' ', $errors), 422);
}

$subject = 'Zapytanie o naważanie — ' . $company;
$subjectHeader = '=?UTF-8?B?' . base64_encode($subject) . '?=';

$bodyLines = [
    'Nowe zapytanie z formularza nawazanie.pl',
    str_repeat('-', 48),
    'Imię i nazwisko: ' . $name,
    'Firma:           ' . $company,
    'E-mail:          ' . $email,
    'Telefon:         ' . ($phone !== '' ? $phone : '—'),
    '',
    'Opis potrzeby:',
    $message,
    '',
    str_repeat('-', 48),
    'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'nieznany'),
    'Data: ' . date('Y-m-d H:i:s'),
];

$body = implode("\n", $bodyLines);

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: nawazanie.pl <' . MAIL_FROM . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'X-Mailer: PHP/' . phpversion(),
];

$sent = @mail(MAIL_TO, $subjectHeader, $body, implode("\r\n", $headers));

if (!$sent) {
    respond(false, 'Nie udało się wysłać wiadomości. Napisz na biuro@spolex.com lub zadzwoń: 22 351 71 91.', 500);
}

respond(true, 'Dziękujemy. Wiadomość została wysłana — odezwiemy się wkrótce.');
