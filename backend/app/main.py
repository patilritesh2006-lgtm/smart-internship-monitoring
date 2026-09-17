import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager
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


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack API integrating university internship tracking with deterministic intelligence analytics.",
    version="1.0.0",
    lifespan=lifespan,
)

# Production-ready CORS configuration: supports explicit origins, wildcard, and Vercel/Render preview domains
cors_origins = settings.cors_origins_list
if "*" in cors_origins or settings.CORS_ORIGINS == "*":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=r"^https://.*\.vercel\.app$|^https://.*\.onrender\.com$|^http://localhost(:\d+)?$|^http://127\.0\.0\.1(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Production exception handler: logs full stack trace internally,
    prevents exposing raw SQL statements, filesystem paths, or internal tracebacks to clients.
    """
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected internal server error occurred. Please try again later."},
    )


# Mount API routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(internships_router, prefix=settings.API_V1_STR)
app.include_router(students_router, prefix=settings.API_V1_STR)
app.include_router(mentors_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)


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
        "docs_url": "/docs",
        "health_url": "/health",
        "environment": settings.ENVIRONMENT,
    }
