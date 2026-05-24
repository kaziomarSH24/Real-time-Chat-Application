# Docker Setup Guide (Boilerplate)

This guide documents the Docker setup for the Boilerplate stack using the files under `deployment/` and the backend build from `backend/`. It covers how services are wired, what you must change, and how to run in development and production. For HTTPS/Nginx details, see `deployment/Readme.md`.

---

## Split Repository Architecture

This boilerplate is designed to maintain **separate Git repositories** for deployment and backend:

- **Deployment Repo** (`deployment/` folder): Contains `docker-compose.yml`, `docker-compose.override.yml`, Nginx configs, `.env.example`, and this documentation. This repo manages infrastructure and orchestration.
- **Backend Repo** (`backend/` folder): Contains Laravel application code, `Dockerfile`, and `entrypoint.sh`. This is your application codebase.

### Why Split Repos?

- **Separation of Concerns**: Infrastructure (deployment) and application code (backend) evolve independently.
- **Team Collaboration**: DevOps can manage deployment configs without touching application code.
- **Flexibility**: Easily swap backend implementations or deploy same backend with different infrastructure setups.

### How to Apply to New Projects

1. **Initialize two separate Git repositories:**

   ```powershell
   # Backend repository
   cd your-project/backend
   git init
   git remote add origin <your-backend-repo-url>

   # Deployment repository
   cd ../deployment
   git init
   git remote add origin <your-deployment-repo-url>
   ```

2. **Update `docker-compose.override.yml`:**

   - Change the build context path `../backend` to point to your backend repository location
   - If backend is cloned elsewhere, update volume mount paths accordingly

3. **Maintain separate `.gitignore`:**
   - Backend repo: Standard Laravel `.gitignore` (vendor, node_modules, .env, etc.)
   - Deployment repo: Already includes `.env`, `docker-compose.override.yml`, `certbot_conf/`

---

## Overview

- Compose layers (in `deployment/`):

  - `docker-compose.yml`: Complete production-ready service definitions including MySQL, Redis, Nginx TLS proxy, Certbot, and all Laravel services. Uses the image `my-boilerplate-app` without build instructions.
  - `docker-compose.override.yml`: Local development overrides. Adds `build` for backend image, mounts source code as volumes, exposes Vite dev server (5173), and Reverb debug mode. This file is gitignored by design.

- Backend build artifacts (in separate `backend/` repository):
  - `backend/Dockerfile`: PHP 8.4 FPM Alpine image with PHP extensions, Composer 2.8.12, Node.js, and an `INSTALL_DEV` build arg to toggle dev dependencies.
  - `backend/entrypoint.sh`: Waits for DB, sets permissions, clears/caches Laravel, runs migrations in prod, and supports roles: default `php-fpm`, `queue`, and `scheduler`.

---

## Service Catalog (deployment/\*)

- `boilerplate-app`: Laravel PHP-FPM container (port 9000 internal). Healthcheck probes FPM using `cgi-fcgi`.
- `queue-worker`: Runs Laravel queue worker via entrypoint role `queue` with Redis driver.
- `scheduler`: Runs `artisan schedule:run` every 60 seconds via entrypoint role `scheduler`.
- `boilerplate-db`: MySQL 8.0, persistent volume `db_data`, healthcheck via `mysqladmin ping`.
- `boilerplate-redis`: Redis 7 Alpine, persistent volume `redis_data`, healthcheck via `redis-cli ping`.
- `nginx-proxy-2`: Nginx Alpine reverse proxy. Terminates TLS (80/443), serves ACME webroot, auto-reloads every 6h.
- `certbot`: Certbot renewer, runs `certbot renew` every 12h, persists to `./certbot_conf` and `certbot_www`.
- `boilerplate-reverb`: Laravel Reverb WebSocket server (port 8080 internal). In dev, published on host `8089` with debug mode.
- `boilerplate-node` (dev only): Node 22 Alpine container running `npm run dev -- --host` (Vite on `5173`).

---

## Networks & Volumes

- Network: `boilerplate_newtork` (typo in original, but kept for compatibility).
- Persistent volumes:
  - `storage_volume` (app storage, bind-mounted into Nginx for serving `/storage` routes)
  - `db_data` (MySQL 8.0 data)
  - `redis_data` (Redis persistence)
  - `certbot_www` (Let's Encrypt ACME challenge webroot)
  - `./certbot_conf` (bind mount for certificates/keys)

---

## Environment (.env)

Copy `deployment/.env.example` to `deployment/.env` and adjust:

- App/URL: `APP_URL`, `APP_ENV`, `APP_DEBUG` (dev vs prod)
- DB: `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD`

## Split Repos & Production Model (Key)

- Redis: `REDIS_HOST`, `REDIS_PORT`
- Sessions/domains (if using nip.io or custom domains): `SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS`

Note: `deployment/.env` is in `.gitignore`. Do not commit secrets.

---

## Backend Image Build (backend/Dockerfile)

- Base: `php:8.4-fpm-alpine` with Node.js, npm, Python3, netcat-openbsd, fcgi
- PHP Extensions: gd (with freetype, jpeg, webp), pdo, pdo_mysql, pdo_pgsql, mbstring, exif, pcntl, bcmath, zip, intl, and `redis` via PECL
- Composer: `2.8.12` copied from official image; global process-timeout set to 2000
- Custom PHP config: `php/custom.ini` copied to PHP conf.d
- **Build arg**: `INSTALL_DEV` (default false)
  - **Dev** (`INSTALL_DEV=true`):
    - `composer install` (includes dev dependencies, no scripts first)
    - `npm install`
    - `composer dump-autoload` after code copy
  - **Prod** (`INSTALL_DEV=false`):
    - `composer install --no-dev --no-scripts`
    - `npm install && npm run build`
    - `composer dump-autoload --optimize`
    - (Optional: remove node_modules to save space)
- **Cache Optimization**: Dependencies (`composer.json`, `composer.lock`, `package.json`, `package-lock.json`) copied first, then full code copy to leverage Docker layer caching
- Entrypoint: `/usr/local/bin/entrypoint.sh` (executable)
- Exposes port 9000 (PHP-FPM)

### Entrypoint (backend/entrypoint.sh)

- **Database Wait**: Polls `${DB_HOST:-boilerplate-db}:${DB_PORT:-3306}` using `nc -z` with 2-second intervals until connection succeeds.
- **Permissions**: Sets `chown -R www-data:www-data` and `chmod -R 775` on `/var/www/storage` and `/var/www/bootstrap/cache` at every startup.
- **Cache Strategy**:
  - Always clears caches first: `config:clear`, `route:clear`, `view:clear`
  - **Production mode** (when `INSTALL_DEV` != "true"):
    - `config:cache`, `route:cache`, `view:cache`
    - `composer dump-autoload --optimize`
    - **Auto-migrations**: `php artisan migrate --force`
  - **Development mode**: Skips optimizations and migrations (run manually)
- **Roles** (first argument):
  - Default (no arg or `php-fpm`): Executes `php-fpm`
  - `queue`: Executes `php artisan` with remaining arguments (e.g., `queue:work redis --timeout=90 --sleep=3 --tries=3`)
  - `scheduler`: Executes the command passed after `scheduler` (e.g., `sh -c 'while true; do php artisan schedule:run; sleep 60; done'`)

---

## Image Strategy (Important)

`deployment/docker-compose.yml` references `image: my-boilerplate-app` without a build section. This allows flexibility in how you build and deploy:

### Option A: Local Build then Deploy

1. Build using override file (dev mode with source mounts):
   ```powershell
   cd deployment
   docker compose -f docker-compose.yml -f docker-compose.override.yml build
   ```
2. For production, rebuild with `INSTALL_DEV=false`:
   ```powershell
   docker compose build --build-arg INSTALL_DEV=false
   ```
3. Deploy without override (production mode):
   ```powershell
   docker compose up -d --pull=never
   ```

### Option B: Registry-Based (Recommended for Production)

1. Build and tag production image:
   ```powershell
   cd ../backend
   docker build -t your-registry/boilerplate-app:v1.0 --build-arg INSTALL_DEV=false .
   docker push your-registry/boilerplate-app:v1.0
   ```
2. Update `docker-compose.yml` image references:
   ```yaml
   services:
     boilerplate-app:
       image: your-registry/boilerplate-app:v1.0
     queue-worker:
       image: your-registry/boilerplate-app:v1.0
     scheduler:
       image: your-registry/boilerplate-app:v1.0
     boilerplate-reverb:
       image: your-registry/boilerplate-app:v1.0
   ```
3. Pull and deploy on server:
   ```powershell
   docker compose pull
   docker compose up -d
   ```

---

## Development Workflow (Local)

### Prerequisites

1. Create `deployment/.env` from `.env.example` and configure:
   - Database credentials (DB_DATABASE, DB_USERNAME, DB_PASSWORD)
   - Redis settings (REDIS_HOST=boilerplate-redis)
   - APP_URL and other Laravel configs
2. Ensure backend code is at `../backend` relative to `deployment/` folder (or adjust paths in `docker-compose.override.yml`)

### Solving the "Chicken and Egg" Problem

When you first clone the backend repository, the `vendor` folder doesn't exist (it's in `.gitignore`). The Docker container's entrypoint script requires this folder to run properly, creating a catch-22 situation: the container needs `vendor` to start, but you need the container running to install dependencies.

**Solution:** Run Composer install BEFORE starting the full stack:

```powershell
cd deployment
docker compose run --rm --entrypoint "" boilerplate-app composer install
```

**What this does:**

- `run` - Executes a one-time command in a new container
- `--rm` - Automatically removes the container after execution
- `--entrypoint ""` - Bypasses the default entrypoint script (which expects vendor to exist)
- `boilerplate-app` - The service name from docker-compose.yml
- `composer install` - Installs all PHP dependencies into the `vendor` folder

**Why this works:** By bypassing the entrypoint, we can run Composer directly without triggering the startup checks that depend on `vendor` existing. Once dependencies are installed, the normal entrypoint will work on subsequent starts.

> **Note:** Replace `boilerplate-app` with your actual service name if you've changed it in `docker-compose.yml`

### Start Dev Stack

```powershell
cd deployment
docker compose up -d --build
```

_(Note: `docker-compose.override.yml` is automatically merged when present)_

### Endpoints (Dev Mode)

- **Backend via Nginx**: `http://localhost` (port 80)
- **Vite Dev Server**: `http://localhost:5173` (hot reload)
- **Reverb WebSocket**: `ws://localhost:8089` (debug mode)
- **Database**: `localhost:3306` (if `FORWARD_DB_PORT` mapped in .env)

### Common Dev Commands

```powershell
# View logs
docker compose logs -f boilerplate-app

# Run migrations
docker compose exec boilerplate-app php artisan migrate

# Clear caches manually
docker compose exec boilerplate-app php artisan config:clear

# Install PHP dependencies
docker compose exec boilerplate-app composer install

# Install/update npm packages (via dedicated node container)
docker compose exec boilerplate-node npm install
docker compose exec boilerplate-node npm run build

# Access MySQL
docker compose exec boilerplate-db mysql -u root -p
```

### Stop Dev Stack

```powershell
docker compose down
# Or keep volumes:
docker compose down -v
```

---

## Production Workflow

### 1) Prepare Environment

- Create `deployment/.env` with production values:
  - Set `APP_ENV=production`, `APP_DEBUG=false`
  - Strong `DB_PASSWORD` and `MYSQL_ROOT_PASSWORD`
  - Configure `APP_URL`, `SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS`
- Point DNS records (`boilerplate.com`, `api.boilerplate.com`) to server IP
- Open firewall ports: 80 (HTTP) and 443 (HTTPS)

### 2) First-Time TLS Certificate Issuance

**Critical**: Follow the certificate generation workflow in `deployment/README.md`:

1. Comment out all `listen 443 ssl` blocks in Nginx configs
2. Start with HTTP-only configuration
3. Run Certbot to generate certificates
4. Uncomment HTTPS blocks and reload Nginx

### 3) Build Production Image

Option A - Build locally:

```powershell
cd ../backend
docker build -t my-boilerplate-app --build-arg INSTALL_DEV=false .
```

Option B - Use registry image (recommended):

```powershell
# Pull pre-built image
docker pull your-registry/boilerplate-app:latest
# Tag locally
docker tag your-registry/boilerplate-app:latest my-boilerplate-app
```

### 4) Deploy Production Stack

```powershell
cd deployment
docker compose up -d --pull=never
```

_(No override file in production - only `docker-compose.yml` is used)_

### 5) Verify Deployment

```powershell
# Check service health
docker compose ps

# Verify migrations ran (auto-executed by entrypoint)
docker compose logs boilerplate-app | grep "migrate"

# Test Laravel caching
docker compose exec boilerplate-app php artisan config:clear
docker compose exec boilerplate-app php artisan route:list
```

### Production Endpoints

- **HTTPS Frontend**: `https://boilerplate.com`
- **HTTPS API**: `https://api.boilerplate.com`
- **WebSocket (Reverb)**: `wss://api.boilerplate.com/app` (proxied by Nginx)
- **HTTP (redirect only)**: Port 80 → 301 to HTTPS

---

## Nginx & TLS Configuration

### Nginx Container (`nginx-proxy-2`)

- **Image**: `nginx:alpine`
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Mounts**:
  - `./nginx:/etc/nginx/conf.d` - Place your `.conf` files here
  - `storage_volume:/var/www/storage:ro` - Read-only access to Laravel storage
  - `./certbot_conf:/etc/letsencrypt` - SSL certificates (bind mount)
  - `certbot_www:/var/www/certbot` - ACME challenge webroot
- **Auto-reload**: Reloads Nginx every 6 hours to pick up renewed certificates
- **Command**: Runs Nginx in foreground with background reload loop

### Certbot Container

- **Image**: `certbot/certbot`
- **Schedule**: Runs `certbot renew` every 12 hours
- **Persistence**: Certificates stored in `./certbot_conf` (bind mount)
- **Webroot**: Uses `/var/www/certbot` for ACME challenges (shared with Nginx)

### Important Configuration Notes

1. **Upstream Service Names** in Nginx configs must match Docker Compose service names:
   - PHP-FPM: `boilerplate-app:9000`
   - Reverb WebSocket: `boilerplate-reverb:8080`
   - Frontend (if applicable): `frontend:3000`
2. **Domain Names**: Update all `server_name` directives in `./nginx/*.conf` to your actual domains
3. **SSL Certificate Paths**: Must match your domain names in Let's Encrypt paths
4. See `deployment/README.md` for complete Nginx configuration examples and first-time TLS setup workflow

---

## What You Must Change for Your Project

### 1. Repository Setup

- Initialize separate Git repos for `deployment/` and `backend/` folders
- Update `.git` remotes to point to your repositories
- Adjust `docker-compose.override.yml` build context if backend is in different location

### 2. Environment Configuration (`deployment/.env`)

- **Database**: `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD`
- **App Settings**: `APP_NAME`, `APP_URL`, `APP_ENV`, `APP_KEY` (generate with `php artisan key:generate`)
- **Redis**: `REDIS_HOST=boilerplate-redis` (or your service name)
- **Domains**: `SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS` (for production)
- **Ports**: `FORWARD_DB_PORT` (if you want to expose MySQL locally)

### 3. Nginx Configuration (`deployment/nginx/*.conf`)

- **Domains**: Replace `boilerplate.com`, `api.boilerplate.com` with your domains in all `server_name` directives
- **SSL Certificates**: Update paths in `ssl_certificate` and `ssl_certificate_key` to match your domain names
- **Upstream Services**: Verify service names match your `docker-compose.yml`:
  - `boilerplate-app:9000` (PHP-FPM)
  - `boilerplate-reverb:8080` (WebSocket)
  - `frontend:3000` (if using separate frontend container)

### 4. Service Names (Optional)

If you want to rename services from "boilerplate-\*" to your project name:

- Update service names in `docker-compose.yml`
- Update network name `boilerplate_newtork` (note: fix typo to `boilerplate_network`)
- Update container names
- Update all references in Nginx configs and `.env` file (DB_HOST, REDIS_HOST, etc.)

### 5. Image Registry (Production)

- Change `image: my-boilerplate-app` to your registry path (e.g., `your-registry/your-app:tag`)
- Update for all services: `boilerplate-app`, `queue-worker`, `scheduler`, `boilerplate-reverb`

---

## Why Certain Files Are Git-Ignored

`deployment/.gitignore` excludes:

- **`.env`**: Contains secrets (DB passwords, API keys)
- **`docker-compose.override.yml`**: Local development settings with host-specific paths (e.g., `../backend` mount point)
- **`certbot_conf/`**: Stores SSL certificates and private keys

### Rationale

- **`.env`**: Never commit credentials. Each environment (local, staging, prod) has different values.
- **`docker-compose.override.yml`**: Developer-specific. Your backend may be at `../backend`, another dev's might be `~/projects/backend`. This file is auto-merged by Docker Compose when present.
- **`certbot_conf/`**: Contains production SSL private keys - must never be in version control.

### Best Practice

- Commit `.env.example` with placeholder values as a template
- For shared dev configs, create `docker-compose.dev.yml` (tracked) with generic settings
- Document any manual setup steps in this README

---

## Troubleshooting

### App Container Exits Immediately

- **Database Wait Failure**: Entrypoint waits for `${DB_HOST}:${DB_PORT}`
  - Check `.env` has `DB_HOST=boilerplate-db` (or your MySQL service name)
  - Verify MySQL healthcheck is passing: `docker compose ps`
  - Check MySQL logs: `docker compose logs boilerplate-db`
- **Permission Issues**: Entrypoint tries to `chown www-data:www-data` on storage
  - Ensure storage volumes are properly mounted
  - Check container logs: `docker compose logs boilerplate-app`

### 502 Bad Gateway from Nginx

- **Wrong Upstream**: Verify `fastcgi_pass boilerplate-app:9000` matches service name
- **Network Mismatch**: Ensure Nginx and app are on same network (`boilerplate_newtork`)
- **FPM Not Ready**: Check app healthcheck: `docker compose exec boilerplate-app cgi-fcgi -bind -connect 127.0.0.1:9000`

### Certbot Cannot Validate Domain

- **Port 80 Not Open**: Ensure firewall allows inbound connections on port 80
- **DNS Not Propagated**: Verify domain resolves to your server: `nslookup yourdomain.com`
- **Nginx Config**: Confirm `location /.well-known/acme-challenge/` points to `/var/www/certbot`
- **Webroot Volume**: Check `certbot_www` volume is shared between Certbot and Nginx

### Reverb/WebSocket Not Connecting

- **Redis Down**: Reverb requires Redis - check: `docker compose exec boilerplate-redis redis-cli ping`
- **Port Mismatch**: Reverb runs on `8080` - verify Nginx proxy_pass targets `boilerplate-reverb:8080`
- **WebSocket Upgrade**: Ensure Nginx has `proxy_http_version 1.1` and `Upgrade`/`Connection` headers
- **Debug Mode**: In dev, check logs: `docker compose logs boilerplate-reverb`

### Vite Dev Server (CORS Issues)

- **Host Binding**: Ensure `npm run dev -- --host` is set in `boilerplate-node` command
- **CORS Headers**: Backend must allow origin `http://localhost:5173` in CORS config

### Production Optimizations Not Applied

- **INSTALL_DEV Still True**: Check image was built with `--build-arg INSTALL_DEV=false`
- **Caching Disabled**: Verify entrypoint logs show "PRODUCTION MODE: Running optimizations..."
- **No Migrations**: If auto-migrations fail, check DB connection and run manually:
  ```powershell
  docker compose exec boilerplate-app php artisan migrate --force
  ```

---

## Quick Command Reference (Windows PowerShell)

```powershell
# === DEVELOPMENT ===

# Start dev stack (override automatically merged)
cd deployment
docker compose up -d --build

# Stop dev stack
docker compose down

# View logs (follow)
docker compose logs -f boilerplate-app
docker compose logs -f boilerplate-reverb

# Run artisan commands
docker compose exec boilerplate-app php artisan migrate
docker compose exec boilerplate-app php artisan config:clear
docker compose exec boilerplate-app php artisan queue:restart

# Composer / NPM
docker compose exec boilerplate-app composer install
docker compose exec boilerplate-node npm install
docker compose exec boilerplate-node npm run build

# Database access
docker compose exec boilerplate-db mysql -u root -p${DB_PASSWORD}

# Redis CLI
docker compose exec boilerplate-redis redis-cli

# === PRODUCTION ===

# Build production image (from backend folder)
cd ../backend
docker build -t my-boilerplate-app --build-arg INSTALL_DEV=false .

# Deploy production stack (no override file)
cd ../deployment
docker compose up -d --pull=never

# Generate SSL certificates (first time only)
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d yourdomain.com -d www.yourdomain.com

# Reload Nginx (after cert renewal or config change)
docker compose exec nginx-proxy-2 nginx -s reload

# Force migrations in production
docker compose exec boilerplate-app php artisan migrate --force

# === MAINTENANCE ===

# Restart single service
docker compose restart boilerplate-app

# View all service status
docker compose ps

# Clean up everything (including volumes - CAREFUL!)
docker compose down -v

# Prune unused Docker resources
docker system prune -a --volumes
```
