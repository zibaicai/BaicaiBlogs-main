# Configuration

This document describes how to configure BaicaiBlogs locally and in production.

The repository contains a **template** at
[`my-blog-backend/src/main/resources/application.yml.example`](../my-blog-backend/src/main/resources/application.yml.example).
The real `application.yml` is intentionally ignored by Git because it contains
local credentials.

## 1. Configuration files

| File | Committed | Purpose |
|---|---|---|
| `application.yml.example` | Yes | Safe template with `${ENV}` placeholders |
| `application.yml` | No | Local/runtime configuration, contains real secrets |
| `application-dev.yml` | Yes | Local development defaults and CORS |
| `application-prod.yml` | Yes | Production profile; DB password comes from env |
| `deploy/backend.env.example` | Yes | Safe server environment template |
| `/etc/baicai/backend.env` | No | Real server secrets, loaded by systemd |

Never commit a real `application.yml`, `application-local.yml`, or
`backend.env`. If a credential was ever committed or shared, rotate it instead
of trying to delete only the file.

## 2. Local development

From the repository root:

```bash
cp my-blog-backend/src/main/resources/application.yml.example \
   my-blog-backend/src/main/resources/application.yml
```

Then set local values in `application.yml` or export them before starting:

```bash
export JWT_SECRET="$(openssl rand -base64 48)"
export OSS_ACCESS_KEY_ID=""
export OSS_ACCESS_KEY_SECRET=""
export OSS_BUCKET=""
export OSS_PUBLIC_URL_PREFIX=""
```

For the database, the tracked `application-dev.yml` provides a local MySQL
default. Override it with `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` if needed.
The application starts with `dev` by default.

```bash
cd my-blog-backend
mvn spring-boot:run
```

Do not use production OSS keys for local development.

## 3. Production environment

The backend service uses:

```ini
EnvironmentFile=/etc/baicai/backend.env
ExecStart=/usr/bin/java -jar /opt/my-blog-backend-1.0.0.jar --spring.profiles.active=prod
```

Create the file from the template:

```bash
install -m 600 -o root -g root \
  deploy/backend.env.example /etc/baicai/backend.env
```

Edit `/etc/baicai/backend.env` and replace every `change-me` value.

```bash
chmod 600 /etc/baicai/backend.env
chown root:root /etc/baicai/backend.env
systemctl restart baicai-backend
systemctl status baicai-backend
```

The file must not be readable by other users and must never be committed.

## 4. Environment variables

### Database

| Variable | Required | Description |
|---|---|---|
| `DB_URL` | Yes | JDBC URL, for example `jdbc:mysql://localhost:3306/blogs?...` |
| `DB_USERNAME` | Yes | MySQL user |
| `DB_PASSWORD` | Yes | MySQL password |
| `SPRING_PROFILES_ACTIVE` | Yes in production | `prod` |

`application-prod.yml` reads `DB_PASSWORD` as `${DB_PASSWORD}`.

### JWT

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | JWT signing secret |
| `JWT_EXPIRATION` | No | Token lifetime in milliseconds, default `86400000` |

Generate a secret:

```bash
openssl rand -base64 48
```

Changing `JWT_SECRET` invalidates all existing login sessions. That is expected
after a rotation.

### Turnstile

| Variable | Required | Description |
|---|---|---|
| `TURNSTILE_SITE_KEY` | No | Public Cloudflare Turnstile site key |
| `TURNSTILE_SECRET` | No | Cloudflare Turnstile secret |

When either value is empty, public registration verification is deliberately
closed. See [`deploy/security/README.md`](../deploy/security/README.md).

### OSS

| Variable | Required | Description |
|---|---|---|
| `OSS_ENDPOINT` | Yes | OSS endpoint, for example `oss-cn-shanghai.aliyuncs.com` |
| `OSS_ACCESS_KEY_ID` | Yes | RAM AccessKey ID for the OSS bucket |
| `OSS_ACCESS_KEY_SECRET` | Yes | RAM AccessKey secret |
| `OSS_BUCKET` | Yes | Public bucket for covers, avatars, backgrounds, etc. |
| `OSS_PUBLIC_URL_PREFIX` | Yes | Public domain prefix for `OSS_BUCKET` |
| `OSS_DIR` | No | Public object prefix, default `posts/` |
| `OSS_ARCHIVE_BUCKET` | No | Private bucket for internal archive raw snapshots |
| `OSS_ARCHIVE_DIR` | No | Private archive prefix, default `archive-snapshots/` |

Create a RAM user with access only to the required bucket. Do not use the
Alibaba Cloud root account AccessKey.

The public bucket and the private archive bucket should be separate. The private
bucket must not have public-read access.

If `OSS_ARCHIVE_BUCKET` is empty, internal archive snapshots fall back to the
database `raw_snapshot` column. The feature continues to work, but large
snapshots consume database storage.

### Frontend API address

The Next.js server uses:

| Variable | Required | Description |
|---|---|---|
| `API_INTERNAL` | Production | Backend base URL, usually `http://127.0.0.1:8080` |
| `NEXT_PUBLIC_API_INTERNAL` | No | Public fallback used by client-side code |

Do not expose backend credentials through any `NEXT_PUBLIC_*` variable.

## 5. Secret storage and backup

Recommended storage:

```text
Git                 -> application.yml.example, backend.env.example only
Password manager    -> real DB password, JWT secret, OSS keys, Turnstile secret
Server              -> /etc/baicai/backend.env (mode 600, root ownership)
Offline/encrypted   -> encrypted backup of backend.env
```

Do not store real credentials in:

```text
Git history
Chat messages
Screenshots
Plain cloud notes
Email
```

If `application.yml` is lost, recreate it from
`application.yml.example`, then retrieve the values from the password manager or
the server environment file. If a value is unavailable, rotate it:

```text
OSS AccessKey -> create a new RAM AccessKey and revoke the old one
JWT_SECRET    -> generate a new value; users must log in again
DB_PASSWORD   -> reset the MySQL user password, then update backend.env
Turnstile     -> regenerate the widget/secret in Cloudflare
```

## 6. Troubleshooting

| Symptom | Likely cause |
|---|---|
| App fails on startup with a missing JWT property | `JWT_SECRET` is empty |
| Database connection refused | `DB_URL`, `DB_USERNAME`, or `DB_PASSWORD` is wrong |
| Image upload fails | OSS variables are missing or the RAM policy is too narrow |
| Registration is closed | Turnstile keys are empty |
| Archive snapshots are missing from OSS | `OSS_ARCHIVE_BUCKET` is empty; DB fallback is active |
| `403` when opening archive images | The ADMIN has no active grant |

## 7. Git safety rules

The following files must stay ignored:

```text
application.yml
application-local.yml
backend.env
.env
.env.*
```

Allowed templates:

```text
application.yml.example
deploy/backend.env.example
```

If a secret is accidentally committed, rotate the credential first, then clean
the Git history and notify collaborators.
