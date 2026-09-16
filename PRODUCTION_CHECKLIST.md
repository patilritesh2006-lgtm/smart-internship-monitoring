# Production Deployment Checklist

This checklist defines the mandatory operational, security, and infrastructure verification gates that must be satisfied before public production deployment of the **Smart Internship Management & Monitoring System (SIMMS)**.

---

## 1. Security & Configuration Gate

| Check | Requirement | Status / Action |
| :--- | :--- | :--- |
| **No Committed Secrets** | Verify no `.env`, passwords, or private keys exist in git history. | `[x] Verified` (Checked via git status and ignore rules) |
| **High-Entropy JWT Secret** | `SECRET_KEY` set via environment variable with $\ge 32$ random characters. | `[ ] Pending Ops Env Setup` (Generate via `openssl rand -hex 32`) |
| **Environment Variable** | `ENVIRONMENT=production` configured. | `[ ] Pending Ops Env Setup` |
| **CORS Origins** | `CORS_ORIGINS` explicitly set to production frontend URL(s). No wildcard `*` or localhost. | `[ ] Pending Ops Env Setup` |
| **No Demo Credentials in Production** | Default demo logins (`student.alex@...`) restricted or passwords rotated for institutional release. | `[ ] Mandatory Pre-Launch Step` |
| **HTTPS Only** | Enforce TLS 1.2+ for all public API and web traffic. Disable plain HTTP. | `[ ] Reverse Proxy / ALB Setup` |
| **Secure Cookies & Headers** | Set `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy`. | `[ ] Nginx / Cloudflare Config` |

---

## 2. Database & Data Integrity Gate

| Check | Requirement | Status / Action |
| :--- | :--- | :--- |
| **PostgreSQL 15+ Provisioned** | Dedicated database user and isolated database instance created. | `[ ] Managed DB Setup` |
| **Connection Pooling** | `pool_size=20`, `max_overflow=10`, `pool_pre_ping=True`, `pool_recycle=300` active. | `[x] Implemented in database.py` |
| **Dialect Normalization** | Supports standard `postgresql://` and legacy `postgres://` URLs. | `[x] Implemented in database.py` |
| **Automated Backups** | Daily `pg_dump` snapshot script scheduled with 30-day retention. | `[ ] Documented in DEPLOYMENT.md` |
| **Database Unavailable Handling** | API returns degraded status on `/health` without crashing when DB is offline. | `[x] Verified in main.py` |

---

## 3. Server-Side Authorization & Privacy Gate

| Check | Requirement | Status / Action |
| :--- | :--- | :--- |
| **Student $\to$ Admin Isolation** | Student token receives `403 Forbidden` on `/api/admin/*`. | `[x] Verified by automated tests` |
| **Student $\to$ Mentor Isolation** | Student token receives `403 Forbidden` on `/api/mentors/*`. | `[x] Verified by automated tests` |
| **Mentor $\to$ Admin Isolation** | Mentor token receives `403 Forbidden` on `/api/admin/*`. | `[x] Verified by automated tests` |
| **Cross-Student Resource Access** | Student A cannot access Student B's attention score or toggle Student B's tasks. | `[x] Verified by automated tests` |
| **Cross-Mentor Review Access** | Mentor A cannot review reports belonging to Mentor B's assigned interns. | `[x] Verified in mentors.py` |
| **Unauthenticated Request Blocking** | Requests without valid `Bearer <token>` return `401 Unauthorized`. | `[x] Verified by automated tests` |

---

## 4. API Error Handling & Logging Gate

| Check | Requirement | Status / Action |
| :--- | :--- | :--- |
| **Stack Trace Redaction** | Global exception handler catches unhandled errors and returns generic 500 JSON. | `[x] Verified in main.py` |
| **SQL & Path Redaction** | No raw SQL queries, file paths, or ORM internal tracebacks exposed to clients. | `[x] Verified in main.py` |
| **Server-Side Logging** | Full tracebacks logged internally with `logger.error(..., exc_info=True)`. | `[x] Verified in main.py` |
| **Password Exclusion** | User schemas never serialize `hashed_password` or plaintext credentials. | `[x] Verified in schemas/__init__.py` |

---

## 5. Rate Limiting & Abuse Protection Gate

| Check | Requirement | Status / Action |
| :--- | :--- | :--- |
| **Login Endpoint Protection** | Prevent brute-force password guessing on `/api/auth/login`. | `[!] Remaining Hardening Item` (Recommended: Nginx `limit_req` or Redis SlowAPI) |
| **Registration Protection** | Prevent automated bulk user spam on `/api/auth/register`. | `[!] Remaining Hardening Item` (Recommended: Turnstile/hCaptcha or Nginx rate limiting) |
| **Report Submission Limiting** | Prevent rapid flood of weekly report submissions. | `[!] Remaining Hardening Item` |
| **Admin Mutation Protection** | Rate limit high-impact actions like bulk allocation. | `[!] Remaining Hardening Item` |

> [!IMPORTANT]
> **Production Hardening Note**: Application-layer rate limiting is not bundled in the core application code. In public production, deployers MUST enable reverse-proxy rate limiting (e.g. Nginx `limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;`) or an API Gateway (Cloudflare / AWS WAF) to protect authentication endpoints.

---

## 6. Build, Startup & Health Gate

| Check | Requirement | Status / Action |
| :--- | :--- | :--- |
| **Backend Test Suite** | All automated tests pass (`python -m pytest -v`). | `[x] 61/61 Tests Passing` |
| **Frontend Linter** | ESLint passes without errors (`npm run lint`). | `[x] Zero Warnings/Errors` |
| **Frontend Build** | Next.js production build passes (`npm run build`). | `[x] 10 Static Routes Compiled` |
| **Production ASGI Startup** | Uvicorn starts in production mode without `--reload`. | `[x] Verified` |
| **Production Next.js Start** | Next.js runs via `npm run start` (`next start`). | `[x] Verified` |
| **Health Check Endpoint** | `/health` responds with `200 OK` and safe component status. | `[x] Verified` |

---

## 7. Pre-Launch Verification Sequence

Before switching public DNS traffic:
1. `curl -f https://internship.university.edu/health` returns `healthy`.
2. Login as Admin and confirm institutional analytics dashboard loads.
3. Login as Faculty Mentor and confirm intern triage list displays real attention status.
4. Login as Student and verify milestone task toggle and attention card calculations.
5. Attempt access to `/api/admin/analytics` with a Student token and confirm `403 Forbidden`.
6. Verify database daily snapshot script executes cleanly and writes to backup storage.
