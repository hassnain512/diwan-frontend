# Diwan Supabase backend setup

The production architecture is:

```text
Expo mobile app -> HTTPS Diwan API -> Supabase PostgreSQL
                                |-> Supabase Storage
                                `-> SMTP email provider
```

The Expo app receives only the public API address. The Supabase secret key, JWT secret, OTP pepper, and SMTP credentials remain on the API server.

## 1. Create and migrate Supabase

1. Create a Supabase project and keep its database password in a password manager.
2. Install the Supabase CLI, authenticate, and link this directory to the project:

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Apply the checked-in migrations:

   ```bash
   npx supabase db push --include-seed
   ```

   If you are not using the CLI, open **Supabase Dashboard → SQL Editor** and run these files one at a time in filename order:

   1. `202609120001_initial_schema.sql`
   2. `202609120002_transaction_functions.sql`
   3. `202609120003_security_hardening.sql`
   4. `202609120004_device_binding_semantics.sql`

The migrations create constrained author, book, writing, reader, OTP, session, synchronization, and audit tables. The idempotent `supabase/seed.sql` then creates the active administrator and singleton author profile; it never stores an admin password because administrator access uses OTP. They enable RLS, revoke direct client access, install transaction-safe database functions, and create the `diwan-media` Storage bucket.

Do not edit the production schema manually in the dashboard. Add another timestamped file under `supabase/migrations/` and use `supabase db push`.

## 2. Configure the API

Copy `backend/.env.example` to `backend/.env`. In the Supabase dashboard, obtain the project URL and a server-only secret key from Project Settings -> API.

Generate independent secrets, for example:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Set the API environment:

```env
NODE_ENV=production
PORT=5003
TRUST_PROXY=1
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_REPLACE_ME
SUPABASE_STORAGE_BUCKET=diwan-media
JWT_SECRET=FIRST_GENERATED_SECRET
OTP_PEPPER=SECOND_GENERATED_SECRET
ADMIN_EMAIL=your-real-admin@example.com
OTP_TTL_MINUTES=10
OTP_DEV_EXPOSE=false
CORS_ORIGINS=https://your-web-origin.example
SMTP_HOST=smtp.your-provider.example
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=Diwan <no-reply@your-domain.example>
```

`SUPABASE_SECRET_KEY` bypasses RLS and must never be copied into the Expo environment, committed, logged, or shipped to a device.

SUPABASE_URL must be the HTTPS Project URL from Project Settings -> API. Do not place a postgresql:// database connection string in this variable.

## 3. Bootstrap the administrator

From the backend directory:

```bash
npm ci
npm run bootstrap
```

This idempotently creates the active admin account from `ADMIN_EMAIL` and the singleton author profile. It does not create demo readers or plaintext credentials.

For local resets, `supabase/seed.sql` creates the default administrator and author profile automatically. To seed a fresh linked development project together with its migrations, run:

```bash
npx supabase db push --include-seed
```

The SQL seed contains no password; administrator access still uses the email OTP flow.

## 4. Run the API

Development:

```bash
cd backend
npm run dev
```

Production build:

```bash
cd backend
npm run typecheck
npm run build
npm start
```

Health check:

```bash
curl http://localhost:5003/health
```

The response should contain `"ok":true` and `"database":"connected"`.

For container deployment:

```bash
docker build -t diwan-api ./backend
docker run --env-file backend/.env -p 5003:5003 diwan-api
```

Terminate TLS at the hosting platform or reverse proxy. Production mobile builds must use an `https://` API URL.

## 5. Configure the Expo app

Create `.env` in the project root:

```env
EXPO_PUBLIC_API_URL=https://api.your-domain.example
```

For a phone on the same network during development, use the computer's LAN address rather than `localhost`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.20:5003
```

Restart Metro after changing the environment:

```bash
npx expo start --clear
```

When the API URL is empty, the application intentionally remains in local SQLite demo mode. When it is present, demo data is not seeded.

## 6. First production verification

1. Request an admin OTP and verify that it is delivered by SMTP and is never returned in the production response.
2. Create a reader with at least an eight-character password.
3. Log in from one device, then verify that a different device receives `DEVICE_LOCKED`.
4. Reset the device from the admin reader screen and verify that the old access and refresh sessions stop working.
5. Create draft and published content. Confirm that a reader receives only published books/writings and cannot call admin routes.
6. Upload a cover and profile photo and confirm the stored URLs work on another device.
7. Edit content offline, reconnect, and confirm the outbox is pushed and the server cursor is pulled.
8. Export and restore a backup. Authentication secrets are intentionally excluded from backup files.
9. Check `audit_logs`, database backups, API logs, rate-limit behavior, and the `/health` monitor before launch.

## Operational requirements

- Enable Supabase database backups and point-in-time recovery appropriate to the project plan.
- Run `npm audit --omit=dev` and both typechecks in CI.
- Run migrations before deploying a server version that depends on them.
- Rotate the Supabase secret, JWT secret, OTP pepper, and SMTP password if any is exposed.
- Place the API behind HTTPS, request-size limits, platform-level rate limiting, and centralized logs.
- Periodically delete expired `otp_challenges`, expired/revoked `auth_sessions`, old `sync_changes`, and old `audit_logs` according to the retention policy.




