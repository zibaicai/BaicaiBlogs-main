# 🥬 BaicaiBlogs (白菜博客)

A self-hosted personal blogging system: Next.js public site + Vite admin console + Spring Boot backend, with one-command local startup and one-command deployment.

- Blog: <https://www.zibaicai.cn>
- Admin: <https://admin.zibaicai.cn>

---

## Language

[![English](https://img.shields.io/badge/Language-English-blue.svg)](README_en.md)
[![中文](https://img.shields.io/badge/语言-中文-red.svg)](README.md)

## Architecture

```
Browser
  │
  ▼
Nginx (80/443, zibaicai.cn)
  ├── www.zibaicai.cn   → baicai-public   (Next.js, 127.0.0.1:3001)
  ├── admin.zibaicai.cn → /var/www/admin  (Vite static SPA)
  └── /api/*            → baicai-backend  (Spring Boot, 127.0.0.1:8080)
                              │
                              ▼
                          MySQL (database: blogs)
```

| Module | Directory | Stack | Notes |
|--------|-----------|-------|-------|
| Public blog | `apps/web` | Next.js (standalone output) | Read-only site: posts / moments / albums / timeline / friends |
| Admin console | `apps/admin` | Vite + React + React Router | Login, writing, site settings; builds to static files |
| Backend | `my-blog-backend` | Spring Boot (Java 17) + MySQL | REST API, JWT auth, port 8080 |

## Repository Layout

```
BaicaiBlogs-main/
├── apps/
│   ├── web/               # Public blog frontend (Next.js)
│   └── admin/             # Admin console (Vite + React)
├── my-blog-backend/       # Spring Boot backend
│   ├── sql/init.sql       # Database initialization script
│   └── target/*.jar       # Maven build artifact
├── deploy/                # Production configs (Nginx / systemd) and cutover guide
├── deploy.config.json     # ★ Single source of truth: server / paths / services / domains / ports
├── deploy.mjs             # ★ One-command deployment
└── start.mjs              # ★ One-command local startup
```

## Requirements

- Node.js 18+ (both local machine and deploy server)
- JDK 17+ and Maven (backend development; you can package from IDEA if Maven is not installed)
- MySQL 8+
- Git and SSH (passwordless SSH from the deploy machine to the server)

## Local Development

```bash
node start.mjs
```

The script performs environment checks (node / npm / java / MySQL 3306), starts the backend (prefers `mvn spring-boot:run`, falls back to the packaged jar in `target`), then opens two terminal windows:

- Public site → <http://localhost:3001>
- Admin console → <http://localhost:5173>

Ports already in use are skipped automatically; first run installs npm dependencies.

Manual startup (equivalent):

```bash
cd my-blog-backend && mvn spring-boot:run   # or run MyBlogApplication from IDEA
cd apps/web   && npm run dev                # 3001
cd apps/admin && npm run dev                # 5173
```

First-time setup: create the `blogs` database and import `my-blog-backend/sql/init.sql`. The seed file keeps a bootstrap administrator account, but its credentials are intentionally not published here; change the password immediately after deployment and create a separate single super-admin for sensitive settings.

## Deployment

Run from the repository root. All server facts live in [deploy.config.json](deploy.config.json).

```bash
node deploy.mjs setup            # one-time: clone the repo on the server + env checks
node deploy.mjs status           # read-only view of the live release state
node deploy.mjs web              # publish the public site
node deploy.mjs admin            # publish the admin console
node deploy.mjs backend          # publish the backend jar
node deploy.mjs all              # publish everything (web → admin → backend)
node deploy.mjs rollback web     # roll the public site back (use --to to pick a release)
node deploy.mjs rollback admin   # restore the latest admin backup
```

### How releases work

- **web / admin**: local push → server `git pull` → build on the server (`npm ci && npm run build`) → timestamped release + `current` symlink switch (web) or atomic static-dir replacement (admin) → service restart → health checks
- **backend**: upload `my-blog-backend/target/*.jar` (package from IDEA if no local Maven) → old jar backed up to `/root/backup/` → service restart → API health check
- Publishing is refused when local changes are uncommitted (use `--allow-dirty` to override)

### Rollback

- The public site uses a **releases directory + `current` symlink**; all historical releases are kept and rollback is a symlink switch
- The admin console is backed up to `/var/www/admin.bak.<timestamp>` before every publish
- Backend jars are backed up under `/root/backup/` on the server

## Production Configuration

### Configuration and secrets

The backend template is
[`my-blog-backend/src/main/resources/application.yml.example`](my-blog-backend/src/main/resources/application.yml.example),
and the server environment template is
[`deploy/backend.env.example`](deploy/backend.env.example).

Never commit real credentials. See
[docs/configuration.md](docs/configuration.md) for local and production setup,
database/JWT/OSS/Turnstile variables, public vs. private OSS buckets, and secret
rotation/backup guidance.

Server facts are centralized in [deploy.config.json](deploy.config.json) — change servers or paths in one place:

| Item | Current value |
|------|---------------|
| Server | `root@8.153.164.215` (SSH key auth) |
| Server repo | `/opt/BaicaiBlogs-main` |
| Public releases | `/opt/baicai-public/releases/<timestamp>` + `current` symlink |
| Admin static dir | `/var/www/admin` |
| Backend jar | `/opt/my-blog-backend-1.0.0.jar` |
| systemd services | `baicai-public` / `baicai-backend` |
| Nginx / systemd references | `deploy/nginx/`, `deploy/systemd/` |

The full manual cutover and rollback procedure is archived in [deploy/README.md](deploy/README.md).

### Handy ops commands (on the server)

```bash
systemctl status baicai-public     # public site process
systemctl status baicai-backend    # backend process
journalctl -u baicai-backend -f    # backend logs
tail -f /var/log/nginx/*.log       # Nginx logs
```

## Default Static Assets

The following default assets ship with the repository under `apps/web/public/`, served via `https://www.zibaicai.cn/`:

| File | Purpose |
|------|---------|
| `favicon.ico` | Site favicon (browser tab icon) |
| `avatar.jpg` | Default user avatar / avatar in the friend-link application template |
| `bg-1.webp` `bg-2.webp` `bg-3.webp` `bg-5.webp` | Site-wide background images (random rotation) |
| `bg-2.webp` | Default music-player song cover |
| `bg-3.webp` | Default post cover |
| `bg-4.webp` | Homepage photo-wall cover |

To use your own images, either:

1. **Recommended**: log in to the admin console at `admin.zibaicai.cn` → Settings, edit the corresponding fields (external image-hosting URLs work), save, and it takes effect site-wide
2. **Change the code defaults**: replace the same-named files under `apps/web/public/`, or edit the default URLs in
   - `apps/web/lib/site-config.ts` (DEFAULT_SITE_INFO / DEFAULT_BACKGROUND / DEFAULT_MISC)
   - `apps/web/components/MusicProvider.tsx` (music default cover)
   - `apps/admin/src/hooks/useSiteConfig.ts` (the three default groups)

## Changelog

See [UpdateLog.md](UpdateLog.md).

## Acknowledgments

This project referenced XingHuiSama's XHBlogs template architecture during project initiation and architecture planning, and used some of its shared components and page structures in early versions. The project has since evolved according to its own needs; the current code is maintained by this project's author. Thanks to the original author for open-sourcing the template.

## License

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

Licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/): free to learn, share, and adapt with attribution — **no commercial use**.
