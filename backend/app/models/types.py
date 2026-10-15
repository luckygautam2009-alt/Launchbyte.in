"""
Shared column types and mixins for models.

Everything here is dialect-portable: production is PostgreSQL/Supabase, the
test-suite runs on in-memory SQLite. Postgres-only features are added through
`with_variant` so the same model works on both.
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Enum, func
from sqlalchemy import Uuid as SAUuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

# JSONB on Postgres (indexable, binary), plain JSON elsewhere.
JSONType = JSON().with_variant(JSONB(), "postgresql")

ENUM_LENGTH = 32


def enum_type(enum_cls: type[enum.Enum], name: str) -> Enum:
    """
    A VARCHAR column that stores the enum *value* and is guarded by a named
    CHECK constraint (`ck_<table>_<name>` via the metadata naming convention).

    `name` must be unique within a table — use the column name.
    """
    return Enum(
        enum_cls,
        name=name,
        native_enum=False,
        create_constraint=True,
        length=ENUM_LENGTH,
        validate_strings=True,
        values_callable=lambda members: [m.value for m in members],
    )


def enum_values(enum_cls: type[enum.Enum]) -> list[str]:
    return [m.value for m in enum_cls]


class UUIDPrimaryKeyMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SoftDeleteMixin:
    """Rows are hidden, not removed, so history (applications, reports) stays intact."""

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
