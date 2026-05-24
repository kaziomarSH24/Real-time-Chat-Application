# Nginx Deployment Guide (Boilerplate)

This document describes the Nginx configuration and deployment process for the boilerplate stack: a frontend (e.g., Next.js) and a backend API (Laravel/PHP-FPM) behind HTTPS with Let's Encrypt certificates via Certbot.

The examples below assume the following domains:

- boilerplate.com and www.boilerplate.com for the frontend
- api.boilerplate.com for the backend API

---

## ⚠️ Critical First-Time Deployment Note

READ BEFORE STARTING: On a fresh server, SSL certificates do not exist yet. Nginx will fail to start if the configuration references `ssl_certificate` files that are missing.

Workflow for first-time deployment:

1. Comment out all `server { listen 443 ssl ... }` blocks in your Nginx config.
2. Start Nginx with only the HTTP (port 80) block active.
3. Run Certbot to generate the certificates.
4. Uncomment the HTTPS blocks.
5. Reload Nginx.

---

## 1) HTTP Redirect and ACME Challenge (Always Active)

Purpose: Serve Let's Encrypt ACME challenges on HTTP and redirect all other traffic to HTTPS.

```nginx
server {
    listen 80;
    server_name boilerplate.com www.boilerplate.com api.boilerplate.com;

    # Allow Certbot to verify domain ownership
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect everything else to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}
```

---

## 2) HTTPS Server — Frontend (Target Config)

Note: Keep this block COMMENTED OUT until certificates are generated.

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name boilerplate.com www.boilerplate.com;

    # Certbot-managed certificates
    ssl_certificate /etc/letsencrypt/live/boilerplate.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/boilerplate.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Proxy to frontend app
    location / {
        proxy_pass http://boilerplate-frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Compression
    gzip on;
    gzip_types text/plain text/css application/javascript application/json application/xml;
    gzip_min_length 256;
}
```

---

## 3) HTTPS Server — Backend API (Target Config)

Note: Keep this block COMMENTED OUT until certificates are generated.

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name api.boilerplate.com;

    # Certbot-managed certificates
    ssl_certificate /etc/letsencrypt/live/api.boilerplate.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.boilerplate.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Laravel document root
    root /var/www/public;
    index index.php;
    client_max_body_size 50M;

    # Public storage files
    location /storage {
        alias /var/www/storage/app/public;
        try_files $uri $uri/ =404;
    }

    # Front controller routing
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM upstream
    location ~ \.php$ {
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass boilerplate-app:9000;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param PATH_INFO $fastcgi_path_info;
        fastcgi_param HTTPS on;
    }

    # WebSocket (Reverb) Proxy
    location /app {
        proxy_pass http://reverb:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Block dotfiles
    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Compression & caching
    gzip on;
    gzip_types text/plain text/css application/javascript application/json application/xml;

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        expires 30d;
        access_log off;
    }
}
```

---

## Deployment Steps (Step-by-Step)

### Phase 1: Preparation

- DNS: Point `boilerplate.com` and `api.boilerplate.com` to your server IP.
- Firewall: Ensure ports 80 (HTTP) and 443 (HTTPS) are open.
- Config: In your Nginx configuration file (e.g., `default.conf`), ensure all `server { listen 443 ... }` blocks are COMMENTED OUT. Only the `listen 80` block should be active.

### Phase 2: Initial Boot & Certificate Generation

Start Docker (production - no override file needed):

```powershell
docker compose up -d --build
```

_Note: In production, only `docker-compose.yml` is used. The `docker-compose.override.yml` is for local development only and should not exist on production servers._

Nginx will start successfully on port 80 because it is not looking for missing SSL certificates.

Generate certificates (webroot method):

```powershell
# Frontend
docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d boilerplate.com -d www.boilerplate.com

# Backend API
docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d api.boilerplate.com
```

If successful, Certbot will save keys to `/etc/letsencrypt/live/...`.

### Phase 3: Enabling HTTPS

- Update Config: Uncomment the HTTPS server blocks (Frontend and Backend) that you commented out in Phase 1.
- Reload Nginx without downtime:

```powershell
docker compose exec nginx-proxy nginx -s reload
```

### Phase 4: Verification & Maintenance

- Test: Visit `https://boilerplate.com` (Frontend) and `https://api.boilerplate.com` (API), and verify WebSocket connectivity (Reverb).
- Auto-Renewal: Ensure your `certbot` container runs on a schedule (commonly every 12 hours) and reload Nginx after renewal.

---

Notes

- Update upstream service names (`boilerplate-frontend`, `boilerplate-app`, `boilerplate-reverb`) to match your Docker Compose services.
- PHP-FPM should expose port `9000` on the Docker network (no need to publish on host).
- Persist Certbot volumes so renewals keep working between deploys.
