# Production Deployment & Infrastructure Guide

This guide details the complete deployment architecture, infrastructure configuration, and operational lifecycle for the **Smart Internship Management & Monitoring System (SIMMS)**.

---

## 1. Architecture Overview

```mermaid
graph TD
    Client["User Browser (Student / Mentor / Admin)"] -->|HTTPS (Port 443)| ReverseProxy["Nginx / Cloudflare / AWS ALB (TLS Termination)"]
    
    subgraph Frontend Tier
        ReverseProxy -->|Proxy Pass /| NextServer["Next.js 14 SSR Node Server (Port 3000)"]
    end

    subgraph Backend Tier
        ReverseProxy -->|Proxy Pass /api & /health| ASGI["Uvicorn / Gunicorn ASGI Workers (Port 8000)"]
        ASGI --> FastAPIEngine["FastAPI Core Engine"]
        FastAPIEngine --> AuthModule["PyJWT + Bcrypt Auth"]
        FastAPIEngine --> IntelligenceModule["Deterministic Analytics Engine"]
    end

    subgraph Database Tier
        FastAPIEngine -->|Connection Pool (Pre-ping)| Postgres["Managed PostgreSQL 15+ (Port 5432)"]
        Postgres --> DailySnapshots["Daily Automated pg_dump Backups"]
    end
```

---

## 2. Infrastructure Prerequisites

| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **OS** | Ubuntu 22.04 LTS / Debian 12 / Alpine Linux | Ubuntu 24.04 LTS |
| **Python** | 3.11+ | 3.12+ |
| **Node.js** | 18.17+ | 20.x LTS |
| **Database** | PostgreSQL 14+ | AWS RDS PostgreSQL 15 / Supabase / Managed PG |
| **RAM** | 2 GB | 4 GB - 8 GB |
| **vCPU** | 1 vCPU | 2 - 4 vCPUs |

---

## 3. PostgreSQL Database Setup

### 3.1 Provisioning the Database
Connect to PostgreSQL server as the `postgres` superuser:

```bash
sudo -u postgres psql
```

Execute SQL initialization:
```sql
-- Create database user with encrypted password
CREATE USER simms_user WITH ENCRYPTED PASSWORD 'YOUR_STRONG_DB_PASSWORD_HERE';

-- Create dedicated application database
CREATE DATABASE smart_internship_db OWNER simms_user;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE smart_internship_db TO simms_user;

-- Connect to database and set schema privileges
\c smart_internship_db
GRANT ALL ON SCHEMA public TO simms_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO simms_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO simms_user;
```

### 3.2 Connection Pooling Behavior
The application automatically configures SQLAlchemy 2.0 connection pooling via `backend/app/core/database.py`:
- `pool_size`: 20 persistent connections.
- `max_overflow`: 10 burst connections.
- `pool_pre_ping`: `True` (issues `SELECT 1` to prune stale/disconnected pool members before dispatching queries).
- `pool_recycle`: 300 seconds (prevents firewall/NAT connection drops).

### 3.3 Database Migrations & Schema Initialization
- On initial startup, FastAPI's `lifespan` handler automatically invokes `Base.metadata.create_all(bind=engine)` to create all tables, indexes, and constraints.
- For ongoing production schema evolutions, Alembic is recommended:
  ```bash
  alembic init migrations
  alembic revision --autogenerate -m "schema update"
  alembic upgrade head
  ```

---

## 4. Environment Variables Configuration

Copy `.env.example` to `.env` in the repository root:

```bash
cp .env.example .env
```

Populate the required environment variables:

```ini
# Production Environment Flag
ENVIRONMENT=production

# 64-Character Hex JWT Secret (Generate via: openssl rand -hex 32)
SECRET_KEY=9f8e7d6c5b4a39281726354859607182a1b2c3d4e5f60718293a4b5c6d7e8f90

# Token Expiration (24 hours)
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# PostgreSQL Connection String
DATABASE_URL=postgresql://simms_user:YOUR_STRONG_DB_PASSWORD_HERE@127.0.0.1:5432/smart_internship_db

# CORS Allowed Public Origins (Exact hostnames, no trailing slash, comma-separated)
CORS_ORIGINS=https://internship.university.edu,https://simms.university.edu

# Frontend API URL (Passed to Next.js build)
NEXT_PUBLIC_API_URL=https://internship.university.edu/api
```

---

## 5. Backend Deployment (FastAPI + Uvicorn)

### 5.1 Installation
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
```

### 5.2 Systemd Service Configuration
Create `/etc/systemd/system/simms-backend.service`:

```ini
[Unit]
Description=SIMMS FastAPI Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/smart-internship-management
EnvironmentFile=/var/www/smart-internship-management/.env
ExecStart=/var/www/smart-internship-management/.venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --workers 4 --proxy-headers --forwarded-allow-ips='*'
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable simms-backend
sudo systemctl start simms-backend
sudo systemctl status simms-backend
```

---

## 6. Frontend Deployment (Next.js 14)

### 6.1 Installation & Build
```bash
cd frontend
export NEXT_PUBLIC_API_URL=https://internship.university.edu/api
npm ci
npm run lint
npm run build
```

### 6.2 Systemd Service Configuration
Create `/etc/systemd/system/simms-frontend.service`:

```ini
[Unit]
Description=SIMMS Next.js Frontend Service
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/smart-internship-management/frontend
EnvironmentFile=/var/www/smart-internship-management/.env
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start -- -p 3000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable simms-frontend
sudo systemctl start simms-frontend
```

---

## 7. Reverse Proxy & SSL/TLS Configuration (Nginx)

### 7.1 Nginx Virtual Host Configuration
Create `/etc/nginx/sites-available/simms.conf`:

```nginx
server {
    listen 80;
    server_name internship.university.edu;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name internship.university.edu;

    ssl_certificate /etc/letsencrypt/live/internship.university.edu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/internship.university.edu/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Backend API Routing
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health Check Routing
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Next.js Frontend Routing
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/simms.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7.2 SSL Certificate via Certbot
```bash
sudo certbot --nginx -d internship.university.edu
```

---

## 8. Health Monitoring

The application provides a lightweight, unauthenticated health endpoint:

```http
GET /health
```

### Healthy Response (200 OK):
```json
{
  "status": "healthy",
  "service": "Smart Internship Management API",
  "database": "connected",
  "intelligence_engine": "online",
  "environment": "production"
}
```

### Degraded Response (200 OK with degraded status):
```json
{
  "status": "degraded",
  "service": "Smart Internship Management API",
  "database": "disconnected",
  "intelligence_engine": "online",
  "environment": "production"
}
```

Integrate with UptimeRobot, Datadog, or AWS Route 53 health checkers targeting `https://internship.university.edu/health`.

---

## 9. Database Backup & Disaster Recovery Strategy

### 9.1 Automated Daily Backups (`pg_dump`)
Create `/opt/scripts/backup_postgres.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/simms"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/simms_db_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"
pg_dump -U simms_user -h localhost smart_internship_db | gzip > "$FILENAME"

# Prune backups older than 30 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -delete

echo "Backup created at $FILENAME"
```

Schedule daily at 02:00 UTC via cron (`crontab -e`):
```cron
0 2 * * * /opt/scripts/backup_postgres.sh >> /var/log/simms_backup.log 2>&1
```

### 9.2 Database Restoration Procedure
In the event of data corruption or disaster recovery:
```bash
# Decompress and restore
gunzip < /var/backups/simms/simms_db_YYYYMMDD_HHMMSS.sql.gz | psql -U simms_user -h localhost -d smart_internship_db
```

---

## 10. Rollback Strategy

1. **Backend Rollback:**
   ```bash
   cd /var/www/smart-internship-management
   git checkout <PREVIOUS_STABLE_COMMIT_HASH>
   source .venv/bin/activate
   pip install -r backend/requirements.txt
   sudo systemctl restart simms-backend
   ```

2. **Frontend Rollback:**
   ```bash
   cd /var/www/smart-internship-management/frontend
   git checkout <PREVIOUS_STABLE_COMMIT_HASH>
   npm ci
   npm run build
   sudo systemctl restart simms-frontend
   ```

3. **Verify Health:**
   ```bash
   curl -s https://internship.university.edu/health | jq
   ```
