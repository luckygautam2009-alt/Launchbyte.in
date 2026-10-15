import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy import Uuid as SAUuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ApplicationEventType, ApplicationStatus
from app.models.types import TimestampMixin, UUIDPrimaryKeyMixin, enum_type

if TYPE_CHECKING:
    from app.models.opportunities import Opportunity
    from app.models.users import User


class Application(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    One user's tracked application. Owned by `user_id` — every query in the
    applications service must filter on it (ownership check).

    Two shapes:
      * platform opportunity  -> `opportunity_id` set
      * external opportunity  -> `opportunity_id` NULL, `custom_*` fields set
        (people track things they found elsewhere too)
    """

    __tablename__ = "applications"
    __table_args__ = (
        # One tracked application per user per platform opportunity. NULL
        # opportunity_ids (external ones) never collide with each other.
        UniqueConstraint("user_id", "opportunity_id", name="uq_applications_user_opportunity"),
        CheckConstraint(
            "opportunity_id IS NOT NULL OR custom_title IS NOT NULL",
            name="has_target",
        ),
        CheckConstraint("priority BETWEEN 1 AND 3", name="priority_range"),
        Index("ix_applications_user_status", "user_id", "status"),
        Index("ix_applications_user_reminder", "user_id", "reminder_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # RESTRICT: opportunities are soft-deleted, never hard-deleted while applications reference them.
    opportunity_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True),
        ForeignKey("opportunities.id", ondelete="RESTRICT"),
        index=True,
    )

    # external-opportunity fallback
    custom_title: Mapped[str | None] = mapped_column(String(255))
    custom_organization: Mapped[str | None] = mapped_column(String(255))
    custom_url: Mapped[str | None] = mapped_column(String(1000))

    status: Mapped[ApplicationStatus] = mapped_column(
        enum_type(ApplicationStatus, "status"),
        default=ApplicationStatus.INTERESTED,
        server_default=text("'interested'"),
        nullable=False,
    )
    priority: Mapped[int] = mapped_column(
        SmallInteger, default=2, server_default=text("2"), nullable=False
    )  # 1 = high, 2 = normal, 3 = low

    applied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deadline_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reminder_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    decision_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resume_url: Mapped[str | None] = mapped_column(String(1000))
    notes: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship(back_populates="applications")
    opportunity: Mapped["Opportunity | None"] = relationship(back_populates="applications")
    events: Mapped[list["ApplicationEvent"]] = relationship(
        back_populates="application",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ApplicationEvent.occurred_at",
    )


class ApplicationEvent(UUIDPrimaryKeyMixin, Base):
    """Append-only timeline for an application: status changes, notes, interviews."""

    __tablename__ = "application_events"
    __table_args__ = (Index("ix_application_events_app_time", "application_id", "occurred_at"),)

    application_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_type: Mapped[ApplicationEventType] = mapped_column(
        enum_type(ApplicationEventType, "event_type"),
        default=ApplicationEventType.NOTE,
        server_default=text("'note'"),
        nullable=False,
    )
    from_status: Mapped[ApplicationStatus | None] = mapped_column(
        enum_type(ApplicationStatus, "from_status")
    )
    to_status: Mapped[ApplicationStatus | None] = mapped_column(
        enum_type(ApplicationStatus, "to_status")
    )
    note: Mapped[str | None] = mapped_column(Text)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    application: Mapped[Application] = relationship(back_populates="events")
