"""
Event, Registration, Event Staff, and Check-in Log models.
"""
from __future__ import annotations

import enum
import secrets
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.opportunities import Opportunity
    from app.models.organizations import Organization
    from app.models.users import User

# Use JSONB on PostgreSQL, standard JSON on SQLite
JSONType = JSON().with_variant(JSONB, "postgresql")


class EventMode(str, enum.Enum):
    ONLINE = "online"
    ONSITE = "onsite"
    HYBRID = "hybrid"


class EventStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class RegistrationStatus(str, enum.Enum):
    REGISTERED = "registered"
    WAITLISTED = "waitlisted"
    PENDING_APPROVAL = "pending_approval"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    CHECKED_IN = "checked_in"


class EventStaffRole(str, enum.Enum):
    SCANNER = "scanner"
    MANAGER = "manager"


class CheckInResult(str, enum.Enum):
    SUCCESS = "success"
    DUPLICATE = "duplicate"
    INVALID_TOKEN = "invalid_token"
    WRONG_EVENT = "wrong_event"
    NOT_REGISTERED = "not_registered"
    CANCELLED = "cancelled"
    FORBIDDEN = "forbidden"


class Event(Base):
    """An organized event/hackathon with landing page, capacity, and ticketing."""

    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    opportunity_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("opportunities.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
        index=True,
    )
    slug: Mapped[str] = mapped_column(String(160), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    tagline: Mapped[str | None] = mapped_column(String(300), nullable=True)
    banner_url: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_url: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), nullable=False, default="UTC")

    mode: Mapped[EventMode] = mapped_column(
        Enum(EventMode, name="event_mode_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=EventMode.ONLINE,
    )
    venue_text: Mapped[str | None] = mapped_column(String(300), nullable=True)
    venue_map_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    online_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)  # None = unlimited
    registration_opens_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    registration_closes_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    requires_approval: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    waitlist_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    team_min_size: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    team_max_size: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Documented shape: {"schedule": [], "prizes": [], "tracks": [], "faqs": [], "sponsors": [], "rules": ""}
    sections: Mapped[dict[str, Any]] = mapped_column(JSONType, nullable=False, default=dict)

    # Custom questions schema: [{"id": "...", "label": "...", "type": "text|select|checkbox", "options": [], "required": bool}]
    custom_questions: Mapped[list[dict[str, Any]]] = mapped_column(JSONType, nullable=False, default=list)

    theme_accent: Mapped[str] = mapped_column(String(20), nullable=False, default="#6366f1")

    status: Mapped[EventStatus] = mapped_column(
        Enum(EventStatus, name="event_status_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=EventStatus.DRAFT,
        index=True,
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", lazy="joined")
    opportunity: Mapped["Opportunity | None"] = relationship("Opportunity", lazy="joined")
    created_by: Mapped["User | None"] = relationship("User", foreign_keys=[created_by_id], lazy="select")
    registrations: Mapped[list["EventRegistration"]] = relationship(
        "EventRegistration",
        back_populates="event",
        cascade="all, delete-orphan",
    )
    staff: Mapped[list["EventStaff"]] = relationship(
        "EventStaff",
        back_populates="event",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint("starts_at < ends_at", name="chk_event_starts_before_ends"),
        CheckConstraint(
            "registration_closes_at IS NULL OR registration_closes_at <= ends_at",
            name="chk_event_reg_closes_before_ends",
        ),
        CheckConstraint(
            "capacity IS NULL OR capacity >= 0",
            name="chk_event_capacity_non_negative",
        ),
        Index("ix_events_status_starts", "status", "starts_at"),
    )


class EventRegistration(Base):
    """Attendee ticket / registration for an event."""

    __tablename__ = "event_registrations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[RegistrationStatus] = mapped_column(
        Enum(
            RegistrationStatus,
            name="event_reg_status_enum",
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
        default=RegistrationStatus.REGISTERED,
        index=True,
    )
    answers: Mapped[dict[str, Any] | None] = mapped_column(JSONType, nullable=True)

    # Human-readable short code (e.g. LB-7K4Q9)
    registration_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)

    # Rotatable nonce for QR code validation
    qr_nonce: Mapped[str] = mapped_column(String(64), nullable=False, default=lambda: secrets.token_hex(16))

    waitlist_position: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)

    registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    checked_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    checked_in_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    event: Mapped["Event"] = relationship("Event", back_populates="registrations", lazy="joined")
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], lazy="joined")
    checked_in_by: Mapped["User | None"] = relationship("User", foreign_keys=[checked_in_by_id], lazy="select")

    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_user_registration"),
        Index("ix_event_reg_event_status", "event_id", "status"),
    )


class EventStaff(Base):
    """Staff permissions granted for an event (check-in scanner or event manager)."""

    __tablename__ = "event_staff"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[EventStaffRole] = mapped_column(
        Enum(
            EventStaffRole,
            name="event_staff_role_enum",
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
        default=EventStaffRole.SCANNER,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # Relationships
    event: Mapped["Event"] = relationship("Event", back_populates="staff", lazy="joined")
    user: Mapped["User"] = relationship("User", lazy="joined")

    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_staff_user"),
    )


class CheckInLog(Base):
    """Append-only audit trail for all check-in attempts (success and failure)."""

    __tablename__ = "check_in_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    registration_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("event_registrations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    scanned_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    result: Mapped[CheckInResult] = mapped_column(
        Enum(
            CheckInResult,
            name="check_in_result_enum",
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    ip: Mapped[str | None] = mapped_column(String(45), nullable=True)

    # Relationships
    event: Mapped["Event"] = relationship("Event", lazy="select")
    registration: Mapped["EventRegistration | None"] = relationship("EventRegistration", lazy="select")
    scanned_by: Mapped["User | None"] = relationship("User", lazy="select")

