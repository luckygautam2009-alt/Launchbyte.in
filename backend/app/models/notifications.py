import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func, text
from sqlalchemy import Uuid as SAUuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import NotificationType
from app.models.types import JSONType, UUIDPrimaryKeyMixin, enum_type

if TYPE_CHECKING:
    from app.models.users import User


class Notification(UUIDPrimaryKeyMixin, Base):
    """In-app notification (deadline reminders, application/verification updates)."""

    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_user_read", "user_id", "read_at"),
        Index("ix_notifications_user_created", "user_id", "created_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[NotificationType] = mapped_column(
        enum_type(NotificationType, "type"),
        default=NotificationType.SYSTEM,
        server_default=text("'system'"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str | None] = mapped_column(Text)
    data: Mapped[dict | None] = mapped_column(JSONType)  # deep-link payload, e.g. {"application_id": "..."}
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))  # NULL = unread
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="notifications")
