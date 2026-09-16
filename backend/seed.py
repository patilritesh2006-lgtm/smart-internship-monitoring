import sys
from pathlib import Path

# Add project root to sys.path so backend and intelligence modules can be resolved
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.core.database import Base, SessionLocal, engine
from backend.app.core.seed import seed_database
import backend.app.models  # Register all models with Base.metadata


def run_seed():
    """Initializes tables and populates database with realistic hackathon demo data."""
    print("Connecting to database and creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Seeding demo data (students, mentors, companies, internships, tasks, reports)...")
    db = SessionLocal()
    try:
        seed_database(db)
        print("Database successfully initialized and seeded into internship.db!")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
