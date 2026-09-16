import os
import logging
from typing import List
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

logger = logging.getLogger("uvicorn")


class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Internship Management & Monitoring System"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Cryptographic Secret: In production, MUST be set via environment variable
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", "university-smart-internship-secure-jwt-secret-key-32-chars-min"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database: SQLite for local zero-config, PostgreSQL for production
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./internship.db")

    # CORS origins: configured via comma-separated string in env or default list
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000",
    )

    model_config = ConfigDict(case_sensitive=True)

    @property
    def cors_origins_list(self) -> List[str]:
        """Parses comma-separated origins, stripping whitespace and trailing slashes."""
        if not self.CORS_ORIGINS:
            return ["http://localhost:3000"]
        return [origin.strip().rstrip("/") for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()

# Validate production security at startup
if settings.ENVIRONMENT.lower() == "production":
    if "university-smart-internship-secure-jwt-secret" in settings.SECRET_KEY or len(settings.SECRET_KEY) < 32:
        raise ValueError(
            "CRITICAL SECURITY CONFIGURATION ERROR: Production environment detected with default or weak SECRET_KEY! "
            "You MUST set a strong, cryptographically random SECRET_KEY (min 32 chars) via environment variable before deploying."
        )
    if settings.DATABASE_URL.startswith("sqlite"):
        logger.warning(
            "PRODUCTION DATABASE WARNING: Running SQLite in production. "
            "PostgreSQL (DATABASE_URL=postgresql://user:pass@host/dbname) is strongly recommended for concurrent institutional usage."
        )
    if any("localhost" in o or "127.0.0.1" in o for o in settings.cors_origins_list):
        logger.warning(
            "PRODUCTION CORS WARNING: CORS_ORIGINS contains localhost/127.0.0.1 in production mode. "
            "Set CORS_ORIGINS to your exact public domain(s)."
        )
