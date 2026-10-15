import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, func
from sqlalchemy import Uuid as SAUuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.types import JSONType, UUIDPrimaryKeyMixin


class AuditLog(UUIDPrimaryKeyMixin, Base):
    """
    Append-only record of staff/sensitive actions (verification decisions,
    moderation, role changes). Deliberately has NO cascade from users: when an
    actor is deleted the row is kept and `actor_id` becomes NULL.
    """

    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_entity", "entity_type", "entity_id"),
        Index("ix_audit_logs_actor_created", "actor_id", "created_at"),
    )

    actor_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)       # "verification.approve"
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)   # "opportunity"
    entity_id: Mapped[str | None] = mapped_column(String(64))              # str(uuid)
    changes: Mapped[dict | None] = mapped_column(JSONType)                 # {"status": ["pending","verified"]}
    ip_address: Mapped[str | None] = mapped_column(String(45))             # fits IPv6
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
