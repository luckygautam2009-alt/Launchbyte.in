import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.rate_limit import limiter
from app.db.base import Base
from app.db.session import get_db
from app.main import app

# Registers every model on Base.metadata (see app/models/__init__.py).
from app import models  # noqa: F401

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, _):
    # SQLite ignores FOREIGN KEY / ON DELETE rules unless told otherwise;
    # Postgres always enforces them, so tests should too.
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    limiter.reset()


@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session, monkeypatch) -> TestClient:
    # WebSocket handlers open short-lived sessions via SessionLocal (instead of pinning a pooled
    # connection for the socket's lifetime); point them at the test database.
    monkeypatch.setattr("app.routers.conversations.SessionLocal", TestingSessionLocal)

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
