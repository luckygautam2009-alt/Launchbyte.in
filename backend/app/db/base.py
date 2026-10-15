"""
Shared SQLAlchemy declarative base.

Every model in app/models/ inherits from `Base` so Alembic autogenerate can
discover it. New model modules must be imported in `app/models/__init__.py`
(alembic/env.py and the test fixtures import that package, so registering a
model there is the only step needed).

The naming convention below gives every index / constraint a deterministic
name. That matters for migrations: Alembic can only drop or alter a
constraint it can name, and Postgres auto-generated names are not stable
across environments.
"""
from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)
