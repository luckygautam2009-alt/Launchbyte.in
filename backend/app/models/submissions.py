"""
Models for Contributor Access Requests, Public Host-an-Event Submissions,
and General Contact Inquiries.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy import Uuid as SAUuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.types import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.events import Event
    from app.models.users import User


class ContributorAccessRequest(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Core team member request for opportunity-contributor listing access."""

    __tablename__ = "contributor_access_requests"

    user_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    team_role: Mapped[str] = mapped_column(String(120), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)

    # pending | approved | rejected | revoked
    status: Mapped[str] = mapped_column(
        String(32), default="pending", server_default="pending", nullable=False, index=True
    )
    reviewed_by_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(foreign_keys=[user_id])
    reviewed_by: Mapped["User | None"] = relationship(foreign_keys=[reviewed_by_id])


class PublicEventSubmission(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Publicly submitted Host-an-Event request awaiting admin moderation."""

    __tablename__ = "public_event_submissions"

    submitted_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    event_name: Mapped[str] = mapped_column(String(255), nullable=False)
    organizer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    organizer_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    organizer_organization: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    event_format: Mapped[str] = mapped_column(String(32), nullable=False)  # online | offline | hybrid
    venue_location: Mapped[str | None] = mapped_column(String(300), nullable=True)

    event_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    registration_deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    registration_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    official_website: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    expected_audience: Mapped[str | None] = mapped_column(String(200), nullable=True)
    contact_info: Mapped[str] = mapped_column(String(300), nullable=False)
    additional_details: Mapped[str | None] = mapped_column(Text, nullable=True)

    # pending | needs_info | approved | rejected | published
    status: Mapped[str] = mapped_column(
        String(32), default="pending", server_default="pending", nullable=False, index=True
    )
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    published_event_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("events.id", ondelete="SET NULL"), nullable=True
    )

    reviewed_by: Mapped["User | None"] = relationship(foreign_keys=[reviewed_by_id])
    published_event: Mapped["Event | None"] = relationship(foreign_keys=[published_event_id])


class ContactInquiry(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """General website contact or partnership inquiry routed to LaunchByte inbox."""

    __tablename__ = "contact_inquiries"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    organization: Mapped[str | None] = mapped_column(String(255), nullable=True)
    inquiry_type: Mapped[str] = mapped_column(String(64), default="general", nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    email_sent: Mapped[bool] = mapped_column(default=False, nullable=False)
