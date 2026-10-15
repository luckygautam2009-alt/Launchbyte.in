"""
Guards that the Alembic migrations and the SQLAlchemy models never drift apart.

Runs the real migration chain (base -> head) on a throwaway in-memory SQLite
database and compares the result with `Base.metadata`. If someone edits a model
and forgets to generate a migration, `test_migrations_match_models` fails and
prints exactly what is missing.

For the authoritative check against Postgres/Supabase, run against a scratch
database:   alembic upgrade head && alembic check
"""
from pathlib import Path

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, inspect
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app import models  # noqa: F401

BACKEND_DIR = Path(__file__).resolve().parents[1]


def alembic_config(connection=None) -> Config:
    cfg = Config()  # no .ini: avoids fileConfig() clobbering pytest's logging
    cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    if connection is not None:
        cfg.attributes["connection"] = connection
    return cfg


@pytest.fixture()
def sqlite_conn():
    engine = create_engine("sqlite:///:memory:", poolclass=StaticPool, connect_args={"check_same_thread": False})
    with engine.connect() as conn:
        yield conn
    engine.dispose()


def test_there_is_a_single_migration_head():
    heads = ScriptDirectory.from_config(alembic_config()).get_heads()
    assert len(heads) == 1, f"Multiple Alembic heads (branching): {heads}"


def test_upgrade_creates_every_model_table(sqlite_conn):
    command.upgrade(alembic_config(sqlite_conn), "head")
    tables = set(inspect(sqlite_conn).get_table_names())
    assert set(Base.metadata.tables) <= tables


def test_migrations_match_models(sqlite_conn):
    command.upgrade(alembic_config(sqlite_conn), "head")
    ctx = MigrationContext.configure(sqlite_conn, opts={"compare_type": True})
    diff = compare_metadata(ctx, Base.metadata)
    assert diff == [], f"Models and migrations have drifted — generate a migration:\n{diff}"


def test_downgrade_to_base_removes_everything(sqlite_conn):
    cfg = alembic_config(sqlite_conn)
    command.upgrade(cfg, "head")
    command.downgrade(cfg, "base")
    assert set(inspect(sqlite_conn).get_table_names()) <= {"alembic_version"}
