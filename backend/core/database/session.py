"""
Database session setup.

This is a minimal SQLAlchemy engine/session placeholder. It intentionally
does not assume a finalized schema — models will be added under
backend/models/ as the opportunity schema is finalized (see
docs/database/schema.md).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from core.config.settings import get_settings

settings = get_settings()

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency that yields a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
