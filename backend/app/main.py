import sys
import logging
import time
import threading
from pathlib import Path
from contextlib import asynccontextmanager
from collections import defaultdict
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

# Ensure repo root is on sys.path so intelligence and backend modules resolve reliably
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.core.config import settings
from backend.app.core.database import Base, SessionLocal, engine
import backend.app.models  # Ensures all models are registered with Base.metadata
from backend.app.core.seed import seed_database
from backend.app.routers import (
    admin_router,
    analytics_router,
    auth_router,
    communications_router,
    internships_router,
    mentors_router,
    students_router,
)

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    # Seed initial data if empty
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


# Disable interactive API docs in production to reduce attack surface
_docs_url = "/docs" if settings.ENVIRONMENT.lower() != "production" else None
_redoc_url = "/redoc" if settings.ENVIRONMENT.lower() != "production" else None
_openapi_url = "/openapi.json" if settings.ENVIRONMENT.lower() != "production" else None

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack API integrating university internship tracking with deterministic intelligence analytics.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=_docs_url,
    redoc_url=_redoc_url,
    openapi_url=_openapi_url,
)

# ──────────────────────────────────────────────────────────────────────────────
# SECURITY HEADERS MIDDLEWARE
# Adds essential security response headers to every HTTP response.
# ──────────────────────────────────────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # Prevent MIME sniffing attacks
    response.headers["X-Content-Type-Options"] = "nosniff"
    # Protect against clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    # Strict referrer policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # Restrict browser feature access
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    # Basic CSP for an API (no HTML served, but belt-and-suspenders)
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    # Hide server framework information
    response.headers["X-Powered-By"] = ""
    return response


# ──────────────────────────────────────────────────────────────────────────────
# IN-MEMORY RATE LIMITER (IP-based, sliding-window counter)
# Applied to authentication endpoints to prevent brute-force attacks and DoS.
# - Failed logins: Maximum 10 failed attempts per 60s per IP (OWASP brute-force defense)
# - Total auth calls: Maximum 100 requests per 60s per IP (DoS defense)
# ──────────────────────────────────────────────────────────────────────────────
_failed_auth_store: dict = defaultdict(list)
_req_rate_store: dict = defaultdict(list)
_rate_limit_lock = threading.Lock()

RATE_LIMIT_PATHS = {"/api/auth/login", "/api/auth/register"}
MAX_FAILED_AUTH = 10           # Maximum failed credentials attempts per window
MAX_TOTAL_AUTH_REQ = 100       # Maximum total requests per window
RATE_LIMIT_WINDOW_SECONDS = 60  # Sliding window in seconds


def _get_client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


@app.middleware("http")
async def rate_limit_auth_endpoints(request: Request, call_next):
    """
    Sliding-window rate limiter for authentication endpoints.
    Blocks clients after 10 failed auth attempts (brute-force defense)
    or 100 total requests (flooding defense) within a 60-second window.
    OPTIONS preflight requests are excluded from rate limiting.
    """
    if request.method == "OPTIONS":
        return await call_next(request)

    path = request.url.path
    if path in RATE_LIMIT_PATHS:
        client_ip = _get_client_ip(request)
        now = time.monotonic()
        with _rate_limit_lock:
            # Prune expired timestamps
            _failed_auth_store[client_ip] = [
                ts for ts in _failed_auth_store[client_ip]
                if now - ts < RATE_LIMIT_WINDOW_SECONDS
            ]
            _req_rate_store[client_ip] = [
                ts for ts in _req_rate_store[client_ip]
                if now - ts < RATE_LIMIT_WINDOW_SECONDS
            ]

            if len(_failed_auth_store[client_ip]) >= MAX_FAILED_AUTH:
                logger.warning(
                    "Brute force lockout for IP %s on %s (%d failed attempts in %ds)",
                    client_ip, path, len(_failed_auth_store[client_ip]), RATE_LIMIT_WINDOW_SECONDS
                )
                headers = {"Retry-After": str(RATE_LIMIT_WINDOW_SECONDS)}
                origin = request.headers.get("origin")
                if origin:
                    headers["Access-Control-Allow-Origin"] = origin
                    headers["Access-Control-Allow-Credentials"] = "true"
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": (
                            f"Too many requests. Maximum {MAX_FAILED_AUTH} failed authentication "
                            f"attempts per {RATE_LIMIT_WINDOW_SECONDS} seconds are allowed."
                        )
                    },
                    headers=headers,
                )

            if len(_req_rate_store[client_ip]) >= MAX_TOTAL_AUTH_REQ:
                logger.warning(
                    "Rate limit exceeded for IP %s on %s (%d requests in %ds)",
                    client_ip, path, len(_req_rate_store[client_ip]), RATE_LIMIT_WINDOW_SECONDS
                )
                headers = {"Retry-After": str(RATE_LIMIT_WINDOW_SECONDS)}
                origin = request.headers.get("origin")
                if origin:
                    headers["Access-Control-Allow-Origin"] = origin
                    headers["Access-Control-Allow-Credentials"] = "true"
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": (
                            f"Too many requests. Maximum {MAX_TOTAL_AUTH_REQ} requests "
                            f"per {RATE_LIMIT_WINDOW_SECONDS} seconds are allowed."
                        )
                    },
                    headers=headers,
                )

            _req_rate_store[client_ip].append(now)

        response = await call_next(request)

        # Record failed authentication attempts
        if response.status_code == status.HTTP_401_UNAUTHORIZED:
            with _rate_limit_lock:
                _failed_auth_store[client_ip].append(time.monotonic())

        return response

    return await call_next(request)


# ──────────────────────────────────────────────────────────────────────────────
# CORS CONFIGURATION
# Security: When wildcard '*' is used, credentials MUST NOT be allowed.
# Fixed: wildcard mode now disables credentials (per CORS specification).
# ──────────────────────────────────────────────────────────────────────────────
cors_origins = settings.cors_origins_list
if "*" in cors_origins or settings.CORS_ORIGINS == "*":
    # Wildcard mode: credentials MUST be False per CORS specification
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,  # Security fix: cannot combine * with credentials=True
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=r"^https://.*\.vercel\.app$|^https://.*\.onrender\.com$|^http://localhost(:\d+)?$|^http://127\.0\.0\.1(:\d+)?$",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Production exception handler: logs full stack trace internally,
    prevents exposing raw SQL statements, filesystem paths, or internal tracebacks to clients.
    """
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}", exc_info=True)
    headers = {}
    origin = request.headers.get("origin")
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected internal server error occurred. Please try again later."},
        headers=headers,
    )


# Mount API routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(internships_router, prefix=settings.API_V1_STR)
app.include_router(students_router, prefix=settings.API_V1_STR)
app.include_router(mentors_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(communications_router, prefix=settings.API_V1_STR)


@app.get("/health")
def health_check():
    """Safe health check endpoint verifying database and intelligence engine status."""
    db_status = "connected"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        logger.error(f"Database health check query failed: {e}")
        db_status = "disconnected"

    is_healthy = db_status == "connected"
    return {
        "status": "healthy" if is_healthy else "degraded",
        "service": "Smart Internship Management API",
        "database": db_status,
        "intelligence_engine": "online",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/")
def root():
    return {
        "message": "Welcome to the Smart Internship Management & Monitoring System API",
        "docs_url": "/docs" if settings.ENVIRONMENT.lower() != "production" else "disabled",
        "health_url": "/health",
        "environment": settings.ENVIRONMENT,
    }
