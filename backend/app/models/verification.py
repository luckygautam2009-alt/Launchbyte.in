"""
Trust layer: verification of organizations/opportunities, the individual
checks behind a decision, and user reports.

Data flow ("verification surfacing"):
    VerificationRequest  --has many-->  VerificationCheck   (evidence)
            |
            v  reviewer decision
    organizations.verification_status / opportunities.verification_status
    + opportunities.trust_score           <- what the API shows to seekers
    OpportunityReport (open reports can flip status to FLAGGED)
"""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    SmallInteger,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy import Uuid as SAUuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import (
    ReportReason,
    ReportStatus,
    VerificationCheckResult,
    VerificationCheckType,
    VerificationRequestStatus,
)
from app.models.types import JSONType, TimestampMixin, UUIDPrimaryKeyMixin, enum_type

if TYPE_CHECKING:
    from app.models.opportunities import Opportunity
    from app.models.organizations import Organization


class VerificationRequest(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A request to verify EITHER an organization OR an opportunity (never both)."""

    __tablename__ = "verification_requests"
    __table_args__ = (
        CheckConstraint(
            "(opportunity_id IS NOT NULL AND organization_id IS NULL) "
            "OR (opportunity_id IS NULL AND organization_id IS NOT NULL)",
            name="exactly_one_subject",
        ),
        Index("ix_verification_requests_status", "status"),
    )

    opportunity_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True),
        ForeignKey("opportunities.id", ondelete="CASCADE"),
        index=True,
    )
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        index=True,
    )
    requested_by_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    reviewer_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True
    )

    status: Mapped[VerificationRequestStatus] = mapped_column(
        enum_type(VerificationRequestStatus, "status"),
        default=VerificationRequestStatus.PENDING,
        server_default=text("'pending'"),
        nullable=False,
    )
    evidence: Mapped[dict | None] = mapped_column(JSONType)  # links/documents submitted
    submitter_notes: Mapped[str | None] = mapped_column(Text)
    reviewer_notes: Mapped[str | None] = mapped_column(Text)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))  # re-verify after

    opportunity: Mapped["Opportunity | None"] = relationship(back_populates="verification_requests")
    organization: Mapped["Organization | None"] = relationship(back_populates="verification_requests")
    checks: Mapped[list["VerificationCheck"]] = relationship(
        back_populates="request", cascade="all, delete-orphan", passive_deletes=True
    )


class VerificationCheck(UUIDPrimaryKeyMixin, Base):
    """One signal behind a verification decision (automated or by a human)."""

    __tablename__ = "verification_checks"
    __table_args__ = (
        CheckConstraint("score IS NULL OR (score BETWEEN 0 AND 100)", name="score_range"),
    )

    request_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True),
        ForeignKey("verification_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    check_type: Mapped[VerificationCheckType] = mapped_column(
        enum_type(VerificationCheckType, "check_type"), nullable=False
    )
    result: Mapped[VerificationCheckResult] = mapped_column(
        enum_type(VerificationCheckResult, "result"), nullable=False
    )
    score: Mapped[int | None] = mapped_column(SmallInteger)  # contribution to trust score, 0-100
    details: Mapped[dict | None] = mapped_column(JSONType)
    # NULL = performed automatically by the system
    performed_by_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    checked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    request: Mapped[VerificationRequest] = relationship(back_populates="checks")


class OpportunityReport(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A seeker flagging a posting (scam, expired, misleading, ...)."""

    __tablename__ = "opportunity_reports"
    __table_args__ = (
        # A user can report the same posting for the same reason only once.
        UniqueConstraint(
            "opportunity_id", "reporter_id", "reason", name="uq_opportunity_reports_once"
        ),
        Index("ix_opportunity_reports_status", "status"),
    )

    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True),
        ForeignKey("opportunities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reporter_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    reason: Mapped[ReportReason] = mapped_column(enum_type(ReportReason, "reason"), nullable=False)
    details: Mapped[str | None] = mapped_column(Text)
    status: Mapped[ReportStatus] = mapped_column(
        enum_type(ReportStatus, "status"),
        default=ReportStatus.OPEN,
        server_default=text("'open'"),
        nullable=False,
    )
    resolved_by_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    resolution_note: Mapped[str | None] = mapped_column(Text)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    opportunity: Mapped["Opportunity"] = relationship(back_populates="reports")
