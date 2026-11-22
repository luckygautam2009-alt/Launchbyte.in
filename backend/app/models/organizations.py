import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy import Uuid as SAUuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import OrganizationType, VerificationStatus
from app.models.types import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin, enum_type

if TYPE_CHECKING:
    from app.models.opportunities import Opportunity
    from app.models.users import User
    from app.models.verification import VerificationRequest


class Organization(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Whoever is offering opportunities: a company, university, NGO, club..."""

    __tablename__ = "organizations"
    __table_args__ = (Index("ix_organizations_verification_status", "verification_status"),)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    type: Mapped[OrganizationType] = mapped_column(
        enum_type(OrganizationType, "type"),
        default=OrganizationType.OTHER,
        server_default=text("'other'"),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text)
    website_url: Mapped[str | None] = mapped_column(String(500))
    # Normalized host of website_url (e.g. "acme.com"). Used by the domain-match
    # verification check and for spotting duplicate organizations.
    domain: Mapped[str | None] = mapped_column(String(255), index=True)
    logo_url: Mapped[str | None] = mapped_column(String(1000))
    contact_email: Mapped[str | None] = mapped_column(String(255))
    country_code: Mapped[str | None] = mapped_column(String(2))
    location: Mapped[str | None] = mapped_column(String(255))

    verification_status: Mapped[VerificationStatus] = mapped_column(
        enum_type(VerificationStatus, "verification_status"),
        default=VerificationStatus.UNVERIFIED,
        server_default=text("'unverified'"),
        nullable=False,
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True
    )

    # passive_deletes="all": never let the ORM null out children on delete —
    # the ON DELETE RESTRICT rule in the database must be what decides.
    opportunities: Mapped[list["Opportunity"]] = relationship(
        back_populates="organization", passive_deletes="all"
    )
    verification_requests: Mapped[list["VerificationRequest"]] = relationship(
        back_populates="organization", cascade="all, delete-orphan", passive_deletes=True
    )
    members: Mapped[list["OrganizationMember"]] = relationship(
        back_populates="organization", cascade="all, delete-orphan", passive_deletes=True
    )


class OrganizationMember(UUIDPrimaryKeyMixin, Base):
    """Membership of users in an organization (owners, editors)."""

    __tablename__ = "organization_members"
    __table_args__ = (
        UniqueConstraint("organization_id", "user_id", name="uq_organization_members_org_user"),
        CheckConstraint("role IN ('owner', 'editor')", name="ck_organization_members_role"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    role: Mapped[str] = mapped_column(
        String(32), default="editor", server_default=text("'editor'"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    organization: Mapped["Organization"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship()
