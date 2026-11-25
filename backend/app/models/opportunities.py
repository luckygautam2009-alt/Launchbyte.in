import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Table,
    Text,
    false,
    func,
    text,
)
from sqlalchemy import Uuid as SAUuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import (
    CompensationType,
    LocationType,
    OpportunityStatus,
    OpportunityType,
    VerificationStatus,
)
from app.models.types import (
    JSONType,
    SoftDeleteMixin,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
    enum_type,
)

if TYPE_CHECKING:
    from app.models.applications import Application
    from app.models.organizations import Organization
    from app.models.users import User
    from app.models.verification import OpportunityReport, VerificationRequest


# Many-to-many: opportunities <-> tags. Pure link table, no extra columns.
opportunity_tags = Table(
    "opportunity_tags",
    Base.metadata,
    Column(
        "opportunity_id",
        SAUuid(as_uuid=True),
        ForeignKey("opportunities.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        SAUuid(as_uuid=True),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    ),
)


class Tag(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "tags"

    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)

    opportunities: Mapped[list["Opportunity"]] = relationship(
        secondary=opportunity_tags, back_populates="tags"
    )


class Opportunity(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "opportunities"
    __table_args__ = (
        CheckConstraint(
            "compensation_min IS NULL OR compensation_max IS NULL "
            "OR compensation_min <= compensation_max",
            name="compensation_range",
        ),
        CheckConstraint(
            "starts_at IS NULL OR ends_at IS NULL OR starts_at <= ends_at",
            name="date_range",
        ),
        CheckConstraint(
            "trust_score IS NULL OR (trust_score BETWEEN 0 AND 100)",
            name="trust_score_range",
        ),
        # Main browse query: "published, not yet expired, soonest deadline first".
        Index("ix_opportunities_status_deadline", "status", "deadline_at"),
        Index("ix_opportunities_type_status", "type", "status"),
        Index("ix_opportunities_verification_status", "verification_status"),
        Index("ix_opportunities_published_at", "published_at"),
    )

    # --- ownership ---
    # RESTRICT: an organization with postings can't be hard-deleted (soft-delete it).
    organization_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    posted_by_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True
    )

    # --- content ---
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(300), unique=True, index=True, nullable=False)
    summary: Mapped[str | None] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text)
    eligibility: Mapped[str | None] = mapped_column(Text)
    requirements: Mapped[list | None] = mapped_column(JSONType)  # ["Python", "2nd year+"]

    type: Mapped[OpportunityType] = mapped_column(
        enum_type(OpportunityType, "type"), nullable=False
    )
    status: Mapped[OpportunityStatus] = mapped_column(
        enum_type(OpportunityStatus, "status"),
        default=OpportunityStatus.DRAFT,
        server_default=text("'draft'"),
        nullable=False,
    )

    # --- where / when ---
    location_type: Mapped[LocationType | None] = mapped_column(
        enum_type(LocationType, "location_type")
    )
    location_text: Mapped[str | None] = mapped_column(String(255))
    country_code: Mapped[str | None] = mapped_column(String(2), index=True)
    application_url: Mapped[str | None] = mapped_column(String(1000))
    deadline_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_rolling: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=false(), nullable=False
    )
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # --- compensation ---
    compensation_type: Mapped[CompensationType] = mapped_column(
        enum_type(CompensationType, "compensation_type"),
        default=CompensationType.UNSPECIFIED,
        server_default=text("'unspecified'"),
        nullable=False,
    )
    compensation_min: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    compensation_max: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    compensation_currency: Mapped[str | None] = mapped_column(String(3))  # ISO 4217
    compensation_note: Mapped[str | None] = mapped_column(String(255))    # "per month", "one-time prize"

    # --- trust (denormalized from verification_requests / checks / reports) ---
    verification_status: Mapped[VerificationStatus] = mapped_column(
        enum_type(VerificationStatus, "verification_status"),
        default=VerificationStatus.UNVERIFIED,
        server_default=text("'unverified'"),
        nullable=False,
    )
    trust_score: Mapped[int | None] = mapped_column(SmallInteger)  # 0-100, NULL = not scored yet
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # --- display / lifecycle ---
    is_featured: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=false(), nullable=False
    )
    view_count: Mapped[int] = mapped_column(
        Integer, default=0, server_default=text("0"), nullable=False
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # --- extended contributor listing & moderation fields ---
    thumbnail_url: Mapped[str | None] = mapped_column(String(500))
    official_website: Mapped[str | None] = mapped_column(String(1000))
    source_url: Mapped[str | None] = mapped_column(String(1000))
    organizer_contact_url: Mapped[str | None] = mapped_column(String(1000))
    organizer_name_override: Mapped[str | None] = mapped_column(String(255))
    registration_opens_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    team_size: Mapped[str | None] = mapped_column(String(100))
    tracks: Mapped[str | None] = mapped_column(Text)
    benefits: Mapped[str | None] = mapped_column(Text)
    additional_instructions: Mapped[str | None] = mapped_column(Text)
    approved_by_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rejection_reason: Mapped[str | None] = mapped_column(Text)

    # --- relationships ---
    organization: Mapped["Organization"] = relationship(back_populates="opportunities")
    posted_by: Mapped["User | None"] = relationship(foreign_keys=[posted_by_id])
    tags: Mapped[list[Tag]] = relationship(secondary=opportunity_tags, back_populates="opportunities")
    saved_by: Mapped[list["SavedOpportunity"]] = relationship(
        back_populates="opportunity", cascade="all, delete-orphan", passive_deletes=True
    )
    # passive_deletes="all": applications must block deletion (ON DELETE RESTRICT),
    # not be silently detached by the ORM.
    applications: Mapped[list["Application"]] = relationship(
        back_populates="opportunity", passive_deletes="all"
    )
    verification_requests: Mapped[list["VerificationRequest"]] = relationship(
        back_populates="opportunity", cascade="all, delete-orphan", passive_deletes=True
    )
    reports: Mapped[list["OpportunityReport"]] = relationship(
        back_populates="opportunity", cascade="all, delete-orphan", passive_deletes=True
    )


class SavedOpportunity(Base):
    """A user's bookmark. Lighter than an Application — no status, no history."""

    __tablename__ = "saved_opportunities"

    user_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True),
        ForeignKey("opportunities.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="saved_opportunities")
    opportunity: Mapped[Opportunity] = relationship(back_populates="saved_by")
