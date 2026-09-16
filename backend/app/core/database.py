import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings

logger = logging.getLogger("uvicorn")

db_url = settings.DATABASE_URL
# Normalization: Heroku/Render/AWS often export postgres://, which SQLAlchemy 2.0 requires as postgresql://
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine_kwargs = {"echo": False}

if db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production PostgreSQL connection pool configuration
    engine_kwargs.update({
        "pool_size": 20,
        "max_overflow": 10,
        "pool_pre_ping": True,  # Actively tests connections before issuing queries
        "pool_recycle": 300,    # Prevents stale dropped connections from network firewalls
    })

try:
    engine = create_engine(db_url, **engine_kwargs)
except Exception as e:
    logger.error(f"Failed to create database engine for {db_url}: {e}")
    raise e

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
