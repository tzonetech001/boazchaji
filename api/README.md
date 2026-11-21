# BOAZCHAJI Phone Charging Shop API

## Requirements

PHP 8.1+ with PDO MySQL, Fileinfo, JSON, and mbstring extensions; MySQL 8.0+; and Apache `mod_rewrite`/`.htaccess` enabled.

1. Import `api/schema.sql` into MySQL.
2. Set `BOAZCHAJI_DB_HOST`, `BOAZCHAJI_DB_PORT`, `BOAZCHAJI_DB_NAME`, `BOAZCHAJI_DB_USER`, `BOAZCHAJI_DB_PASSWORD`, and a random `BOAZCHAJI_JWT_SECRET` of at least 32 characters in the PHP environment.
3. Set `BOAZCHAJI_APP_URL` to the exact Angular origin (for example `http://localhost:4200`).
4. Configure PHP outbound email (`BOAZCHAJI_MAIL_FROM` and the server's `mail()` transport) so reset links can be delivered.
5. Create the first admin by setting `BOAZCHAJI_ADMIN_PHONE` and `BOAZCHAJI_ADMIN_PASSWORD`, then run `php api/bin/create-admin.php`. The password must be at least 8 characters and contain letters and digits.
6. Configure the Angular `apiBaseUrl` in `src/app/core/api.ts` to the deployed API base path.

All routes other than login require `Authorization: Bearer <JWT>`. Tokens expire after eight hours. Admin-created agent accounts use `/auth/register` or `POST /users`; registration cannot create another admin. The super-admin flag is reserved for bootstrap/recovery and no user deletion or core-action mutation endpoint is exposed.

Images are limited to 5 MB and JPG, PNG, or WebP. The uploads directory denies PHP execution; for production, store uploads outside the public web root and serve them through an authenticated controller. Use HTTPS, a strong secret manager, database backups, and a production CORS origin.

## Routes

`POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/register`, `GET|POST /users`, `PATCH /users/{id}/preferences`, `POST /users/{id}/profile-image`, `GET|POST /customers`, `GET|POST /device_types`, `GET|POST /services`, `PUT /services/{id}/pay`, `GET /dashboard`, and admin-only `GET /activity`.

Agents can access only their own services and customers. Admins can view all services and optionally filter with `agent_id`. Service status changes are audited; admin-created services record the assigned agent while the activity log records the acting admin.

Password reset links are random, hashed in the database, single-use, expire after 30 minutes, and are limited to three requests per account each hour. The email endpoint intentionally returns the same response for known and unknown addresses. Password reset increments the user's auth version to invalidate existing JWTs. Users without an email address cannot use email recovery.

Profile photos are limited to 5 MB and JPG, PNG, or WebP. The new schema adds `users.profile_image_path`, `users.auth_version`, and `password_reset_tokens`; re-import the schema for a new deployment, or add equivalent columns/table before deploying this update to an existing database.
