<?php
declare(strict_types=1);

final class Jwt
{
    public static function issue(array $claims): string
    {
        $config = require __DIR__ . '/../config.php';
        if (strlen($config['jwt_secret']) < 32) {
            throw new RuntimeException('BOAZCHAJI_JWT_SECRET must contain at least 32 characters.');
        }

        $now = time();
        $header = self::encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = self::encode($claims + ['iat' => $now, 'exp' => $now + 8 * 60 * 60]);
        $content = $header . '.' . $payload;
        $signature = hash_hmac('sha256', $content, $config['jwt_secret'], true);

        return $content . '.' . self::base64UrlEncode($signature);
    }

    public static function verify(string $token): array
    {
        $config = require __DIR__ . '/../config.php';
        if (strlen($config['jwt_secret']) < 32) {
            throw new RuntimeException('BOAZCHAJI_JWT_SECRET must contain at least 32 characters.');
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new UnexpectedValueException('Invalid token.');
        }
        [$header, $payload, $signature] = $parts;
        $decodedHeader = json_decode(self::base64UrlDecode($header), true, 512, JSON_THROW_ON_ERROR);
        if (($decodedHeader['alg'] ?? null) !== 'HS256') {
            throw new UnexpectedValueException('Unsupported token algorithm.');
        }
        $expected = self::base64UrlEncode(hash_hmac('sha256', $header . '.' . $payload, $config['jwt_secret'], true));
        if (!hash_equals($expected, $signature)) {
            throw new UnexpectedValueException('Invalid token signature.');
        }
        $claims = json_decode(self::base64UrlDecode($payload), true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($claims) || !isset($claims['exp']) || $claims['exp'] < time()) {
            throw new UnexpectedValueException('Token expired.');
        }

        return $claims;
    }

    private static function encode(array $value): string
    {
        return self::base64UrlEncode(json_encode($value, JSON_THROW_ON_ERROR));
    }

    private static function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $value): string
    {
        $decoded = base64_decode(strtr($value, '-_', '+/'), true);
        if ($decoded === false) {
            throw new UnexpectedValueException('Malformed token.');
        }

        return $decoded;
    }
}
