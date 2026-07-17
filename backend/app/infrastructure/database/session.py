from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings

# Determine engine arguments based on dialect
engine_kwargs = {
    "echo": False,
    "pool_pre_ping": True,
    "pool_recycle": 3600,
}
if not settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

# Create the sync engine
engine = create_engine(
    settings.DATABASE_URL,
    **engine_kwargs
)

# Create the session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides an SQLAlchemy Session.
    Usage:
        @app.get("/")
        def endpoint(session: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
