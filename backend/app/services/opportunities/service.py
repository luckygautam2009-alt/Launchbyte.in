"""
Business logic for the opportunities domain.

Public side: only published, non-deleted postings.
Organizer side: draft, submit, update, delete (only if no applications).
Moderator/Admin side: review queue, approve, reject with reason and audit logs.
"""
import re
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum

from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.models.applications import Application
from app.models.audit import AuditLog
from app.models.enums import (
    CompensationType,
    LocationType,
    NotificationType,
    OpportunityStatus,
    OpportunityType,
    ReportReason,
    UserRole,
    VerificationStatus,
)
from app.models.notifications import Notification
from app.models.opportunities import Opportunity, SavedOpportunity, Tag
from app.models.organizations import Organization, OrganizationMember
from app.models.users import User
from app.models.verification import OpportunityReport
from app.schemas.opportunities import (
    OpportunityCreate,
    OpportunityOrganizerCreate,
    OpportunityOrganizerUpdate,
    OpportunityUpdate,
)

_LOAD = (selectinload(Opportunity.organization), selectinload(Opportunity.tags))
_ORDER = {
    "deadline": (Opportunity.deadline_at.asc().nulls_last(), Opportunity.id),
    "deadline_soon": (Opportunity.deadline_at.asc().nulls_last(), Opportunity.id),
    "newest": (Opportunity.published_at.desc().nulls_last(), Opportunity.id),
    "trust_score": (Opportunity.trust_score.desc().nulls_last(), Opportunity.id),
    "popular": (Opportunity.view_count.desc(), Opportunity.id),
}


class OrganizationNotFoundError(Exception):
    """organization_id does not point at a live organization."""


class InvalidOpportunityError(Exception):
    """Cross-field rule broken (e.g. min > max compensation)."""


class PermissionDeniedError(Exception):
    """User does not have permission to manage this organization or opportunity."""


class CannotDeleteWithApplicationsError(Exception):
    """Cannot delete opportunity with existing applications."""


class CannotReportOwnPostingError(Exception):
    """Users cannot report their own posting."""


class DuplicateReportError(Exception):
    """User has already reported this posting for this reason."""


class CannotApproveOwnPostingError(Exception):
    """Moderators cannot approve their own postings."""


# ---------- helpers ----------
def _now() -> datetime:
    return datetime.now(timezone.utc)


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:80].strip("-")


def _unique_slug(db: Session, title: str) -> str:
    base = slugify(title) or "opportunity"
    slug, n = base, 2
    while db.scalar(select(Opportunity.id).where(Opportunity.slug == slug)) is not None:
        slug = f"{base}-{n}"
        n += 1
    return slug


def _resolve_tags(db: Session, names: list[str]) -> list[Tag]:
    tags, seen = [], set()
    for name in names:
        name = name.strip()
        slug = slugify(name)[:64].strip("-")
        if not slug or slug in seen:
            continue
        seen.add(slug)
        tag = db.scalar(select(Tag).where(Tag.slug == slug))
        tags.append(tag or Tag(name=name[:64], slug=slug))
    return tags


def _check_ranges(opp: Opportunity) -> None:
    try:
        if (
            opp.compensation_min is not None
            and opp.compensation_max is not None
            and opp.compensation_min > opp.compensation_max
        ):
            raise InvalidOpportunityError("compensation_min cannot be greater than compensation_max")
        if opp.starts_at and opp.ends_at and opp.starts_at > opp.ends_at:
            raise InvalidOpportunityError("starts_at cannot be after ends_at")
    except TypeError as exc:
        raise InvalidOpportunityError("use timezone-aware datetimes consistently") from exc


def _jsonable(v):
    if isinstance(v, Enum):
        return v.value
    if isinstance(v, datetime):
        return v.isoformat()
    if isinstance(v, (Decimal, uuid.UUID)):
        return str(v)
    return v


def _audit(db: Session, actor: User, action: str, opp: Opportunity, changes: dict, ip: str | None) -> None:
    db.add(
        AuditLog(
            actor_id=actor.id,
            action=action,
            entity_type="opportunity",
            entity_id=str(opp.id),
            changes=changes,
            ip_address=ip,
        )
    )


def _page(db: Session, stmt, order, limit: int, offset: int, options=None):
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    query = stmt
    if options:
        query = query.options(*options)
    items = db.scalars(query.order_by(*order).limit(limit).offset(offset)).all()
    return list(items), total


def check_organizer_membership(db: Session, org_id: uuid.UUID, user: User) -> bool:
    """Returns True if the user is an owner/editor of the org or an admin."""
    if user.role == UserRole.ADMIN:
        return True
    member = db.scalar(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == user.id,
        )
    )
    return member is not None


# ---------- public endpoints ----------
def list_public(
    db: Session,
    *,
    limit: int,
    offset: int,
    opp_types: list[OpportunityType] | None = None,
    location_type: LocationType | None = None,
    country_code: str | None = None,
    compensation_type: CompensationType | None = None,
    verification_status: VerificationStatus | None = None,
    is_featured: bool | None = None,
    tags: list[str] | None = None,
    q: str | None = None,
    include_expired: bool = False,
    open_only: bool = False,
    deadline_after: datetime | None = None,
    deadline_before: datetime | None = None,
    sort: str = "newest",
):
    stmt = select(Opportunity).where(
        Opportunity.deleted_at.is_(None), Opportunity.status == OpportunityStatus.PUBLISHED
    )
    if open_only or not include_expired:
        stmt = stmt.where(
            or_(
                Opportunity.is_rolling.is_(True),
                Opportunity.deadline_at.is_(None),
                Opportunity.deadline_at > _now(),
            )
        )
    if opp_types:
        stmt = stmt.where(Opportunity.type.in_(opp_types))
    if location_type is not None:
        stmt = stmt.where(Opportunity.location_type == location_type)
    if country_code:
        stmt = stmt.where(Opportunity.country_code == country_code.upper())
    if compensation_type is not None:
        stmt = stmt.where(Opportunity.compensation_type == compensation_type)
    if verification_status is not None:
        stmt = stmt.where(Opportunity.verification_status == verification_status)
    if is_featured is not None:
        stmt = stmt.where(Opportunity.is_featured == is_featured)
    if deadline_after is not None:
        stmt = stmt.where(Opportunity.deadline_at >= deadline_after)
    if deadline_before is not None:
        stmt = stmt.where(Opportunity.deadline_at <= deadline_before)
    if tags:
        for t in tags:
            tag_slug = slugify(t)
            if tag_slug:
                stmt = stmt.where(Opportunity.tags.any(Tag.slug == tag_slug))
    if q:
        # Sanitize SQL wildcard characters to avoid regex/wildcard injection
        safe_q = q.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        stmt = stmt.where(
            or_(
                Opportunity.title.ilike(f"%{safe_q}%", escape="\\"),
                Opportunity.summary.ilike(f"%{safe_q}%", escape="\\"),
            )
        )

    order_criteria = _ORDER.get(sort, _ORDER["newest"])
    return _page(db, stmt, order_criteria, limit, offset, options=_LOAD)


def get_public_by_slug(db: Session, slug: str) -> Opportunity | None:
    opp = db.scalar(
        select(Opportunity)
        .where(
            Opportunity.slug == slug,
            Opportunity.deleted_at.is_(None),
            Opportunity.status == OpportunityStatus.PUBLISHED,
        )
        .options(*_LOAD)
    )
    if opp is None:
        return None

    # Atomic increment of view_count
    db.execute(
        update(Opportunity)
        .where(Opportunity.id == opp.id)
        .values(view_count=Opportunity.view_count + 1)
    )
    db.commit()
    db.refresh(opp)
    return opp


def get_tags_with_counts(db: Session) -> list[dict]:
    """Return all tags with count of published non-deleted opportunities."""
    from app.models.opportunities import opportunity_tags
    stmt = (
        select(Tag.name, Tag.slug, func.count(opportunity_tags.c.opportunity_id).label("count"))
        .join(opportunity_tags, Tag.id == opportunity_tags.c.tag_id)
        .join(Opportunity, Opportunity.id == opportunity_tags.c.opportunity_id)
        .where(
            Opportunity.deleted_at.is_(None),
            Opportunity.status == OpportunityStatus.PUBLISHED,
        )
        .group_by(Tag.id, Tag.name, Tag.slug)
        .order_by(func.count(opportunity_tags.c.opportunity_id).desc(), Tag.name.asc())
    )
    results = db.execute(stmt).all()
    return [{"name": r[0], "slug": r[1], "count": r[2]} for r in results]


def get_types_with_counts(db: Session) -> list[dict]:
    """Return opportunity types with count of published non-deleted opportunities."""
    stmt = (
        select(Opportunity.type, func.count(Opportunity.id).label("count"))
        .where(
            Opportunity.deleted_at.is_(None),
            Opportunity.status == OpportunityStatus.PUBLISHED,
        )
        .group_by(Opportunity.type)
        .order_by(func.count(Opportunity.id).desc())
    )
    results = db.execute(stmt).all()
    return [{"type": r[0], "count": r[1]} for r in results]


# ---------- saved opportunities ----------
def save_opportunity(db: Session, user_id: uuid.UUID, opp_id: uuid.UUID) -> bool:
    """Save an opportunity for a user. Idempotent."""
    opp = db.get(Opportunity, opp_id)
    if opp is None or opp.deleted_at is not None or opp.status != OpportunityStatus.PUBLISHED:
        return False

    existing = db.scalar(
        select(SavedOpportunity).where(
            SavedOpportunity.user_id == user_id,
            SavedOpportunity.opportunity_id == opp_id,
        )
    )
    if existing is None:
        db.add(SavedOpportunity(user_id=user_id, opportunity_id=opp_id))
        db.commit()
    return True


def unsave_opportunity(db: Session, user_id: uuid.UUID, opp_id: uuid.UUID) -> bool:
    """Unsave an opportunity for a user. Idempotent."""
    existing = db.scalar(
        select(SavedOpportunity).where(
            SavedOpportunity.user_id == user_id,
            SavedOpportunity.opportunity_id == opp_id,
        )
    )
    if existing is not None:
        db.delete(existing)
        db.commit()
    return True


def list_saved(db: Session, user_id: uuid.UUID, limit: int, offset: int):
    """List opportunities saved by user."""
    stmt = (
        select(Opportunity)
        .join(SavedOpportunity, Opportunity.id == SavedOpportunity.opportunity_id)
        .where(
            SavedOpportunity.user_id == user_id,
            Opportunity.deleted_at.is_(None),
        )
    )
    return _page(db, stmt, (SavedOpportunity.created_at.desc(), Opportunity.id), limit, offset, options=_LOAD)


# ---------- reports ----------
def report_opportunity(
    db: Session,
    reporter: User,
    opp_id: uuid.UUID,
    reason: ReportReason,
    details: str | None,
    ip: str | None,
) -> OpportunityReport:
    opp = db.get(Opportunity, opp_id)
    if opp is None or opp.deleted_at is not None:
        raise InvalidOpportunityError("Opportunity not found.")

    if opp.posted_by_id == reporter.id:
        raise CannotReportOwnPostingError("You cannot report your own posting.")

    existing = db.scalar(
        select(OpportunityReport).where(
            OpportunityReport.opportunity_id == opp_id,
            OpportunityReport.reporter_id == reporter.id,
            OpportunityReport.reason == reason,
        )
    )
    if existing is not None:
        raise DuplicateReportError("You have already reported this opportunity for this reason.")

    report = OpportunityReport(
        opportunity_id=opp_id,
        reporter_id=reporter.id,
        reason=reason,
        details=details,
        status="open",
    )
    db.add(report)
    db.flush()

    # Check threshold for open reports
    settings = get_settings()
    open_count = db.scalar(
        select(func.count(OpportunityReport.id)).where(
            OpportunityReport.opportunity_id == opp_id,
            OpportunityReport.status == "open",
        )
    ) or 0

    if open_count >= settings.OPPORTUNITY_REPORT_FLAG_THRESHOLD:
        old_vs = opp.verification_status
        opp.verification_status = VerificationStatus.FLAGGED
        _audit(
            db,
            reporter,
            "opportunity.auto_flagged",
            opp,
            {"open_reports": open_count, "verification_status": [_jsonable(old_vs), _jsonable(opp.verification_status)]},
            ip,
        )

    db.commit()
    db.refresh(report)
    return report


# ---------- organizer endpoints ----------
def create_organizer_opportunity(
    db: Session,
    org_id: uuid.UUID,
    data: OpportunityOrganizerCreate,
    actor: User,
    ip: str | None = None,
) -> Opportunity:
    org = db.get(Organization, org_id)
    if org is None or org.deleted_at is not None:
        raise OrganizationNotFoundError(str(org_id))

    if not check_organizer_membership(db, org_id, actor):
        raise PermissionDeniedError("You are not a member of this organization.")

    if data.deadline_at and data.deadline_at < _now():
        raise InvalidOpportunityError("deadline_at cannot be in the past.")

    values = data.model_dump(exclude={"tags"})
    opp = Opportunity(
        **values,
        organization_id=org_id,
        slug=_unique_slug(db, data.title),
        posted_by_id=actor.id,
        status=OpportunityStatus.DRAFT,
    )
    _check_ranges(opp)
    opp.tags = _resolve_tags(db, data.tags)
    db.add(opp)
    db.flush()
    _audit(db, actor, "opportunity.organizer_create", opp, {"title": opp.title, "status": "draft"}, ip)
    db.commit()
    db.refresh(opp)
    return opp


def update_organizer_opportunity(
    db: Session,
    opp: Opportunity,
    data: OpportunityOrganizerUpdate,
    actor: User,
    ip: str | None = None,
) -> Opportunity:
    if not check_organizer_membership(db, opp.organization_id, actor):
        raise PermissionDeniedError("You are not a member of this opportunity's organization.")

    payload = data.model_dump(exclude_unset=True)
    tag_names = payload.pop("tags", None)

    changes: dict = {}
    for field, new in payload.items():
        old = getattr(opp, field)
        if old != new:
            changes[field] = [_jsonable(old), _jsonable(new)]
            setattr(opp, field, new)

    if tag_names is not None:
        new_tags = _resolve_tags(db, tag_names)
        old_slugs = sorted(t.slug for t in opp.tags)
        new_slugs = sorted(t.slug for t in new_tags)
        if old_slugs != new_slugs:
            changes["tags"] = [old_slugs, new_slugs]
            opp.tags = new_tags

    if not changes:
        return opp

    try:
        _check_ranges(opp)
    except InvalidOpportunityError:
        db.rollback()
        raise

    _audit(db, actor, "opportunity.organizer_update", opp, changes, ip)
    db.commit()
    db.refresh(opp)
    return opp


def delete_organizer_opportunity(
    db: Session,
    opp: Opportunity,
    actor: User,
    ip: str | None = None,
) -> None:
    if not check_organizer_membership(db, opp.organization_id, actor):
        raise PermissionDeniedError("You are not a member of this opportunity's organization.")

    # Block delete if applications exist
    app_count = db.scalar(
        select(func.count(Application.id)).where(Application.opportunity_id == opp.id)
    ) or 0
    if app_count > 0:
        raise CannotDeleteWithApplicationsError(
            f"Cannot delete opportunity with {app_count} existing application(s). You can close or archive it instead."
        )

    opp.deleted_at = _now()
    _audit(db, actor, "opportunity.organizer_delete", opp, {"title": opp.title}, ip)
    db.commit()


def submit_organizer_opportunity(
    db: Session,
    opp: Opportunity,
    actor: User,
    ip: str | None = None,
) -> Opportunity:
    if not check_organizer_membership(db, opp.organization_id, actor):
        raise PermissionDeniedError("You are not a member of this opportunity's organization.")

    if opp.status not in (OpportunityStatus.DRAFT, OpportunityStatus.REJECTED):
        raise InvalidOpportunityError(f"Cannot submit an opportunity with status {opp.status.value}")

    old_status = opp.status
    opp.status = OpportunityStatus.PENDING_REVIEW
    _audit(
        db,
        actor,
        "opportunity.submit_for_review",
        opp,
        {"status": [_jsonable(old_status), "pending_review"]},
        ip,
    )
    db.commit()
    db.refresh(opp)
    return opp


def list_organizer_opportunities(db: Session, actor: User, limit: int, offset: int):
    """List all opportunities for organizations the user belongs to or posted by the user."""
    # Find org IDs user belongs to
    org_ids = db.scalars(
        select(OrganizationMember.organization_id).where(OrganizationMember.user_id == actor.id)
    ).all()

    stmt = select(Opportunity).where(
        Opportunity.deleted_at.is_(None),
        or_(
            Opportunity.posted_by_id == actor.id,
            Opportunity.organization_id.in_(org_ids),
        ),
    )
    return _page(db, stmt, (Opportunity.updated_at.desc(), Opportunity.id), limit, offset, options=_LOAD)


# ---------- admin & moderation endpoints ----------
def list_admin(
    db: Session,
    *,
    limit: int,
    offset: int,
    status: OpportunityStatus | None = None,
    q: str | None = None,
    include_deleted: bool = False,
):
    stmt = select(Opportunity)
    if not include_deleted:
        stmt = stmt.where(Opportunity.deleted_at.is_(None))
    if status is not None:
        stmt = stmt.where(Opportunity.status == status)
    if q:
        safe_q = q.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        stmt = stmt.where(Opportunity.title.ilike(f"%{safe_q}%", escape="\\"))
    return _page(db, stmt, (Opportunity.created_at.desc(), Opportunity.id), limit, offset, options=_LOAD)


def get_admin(db: Session, opportunity_id: uuid.UUID) -> Opportunity | None:
    return db.scalar(
        select(Opportunity)
        .where(Opportunity.id == opportunity_id, Opportunity.deleted_at.is_(None))
        .options(*_LOAD)
    )


def create_opportunity(db: Session, data: OpportunityCreate, actor: User, ip: str | None = None) -> Opportunity:
    org = db.get(Organization, data.organization_id)
    if org is None or org.deleted_at is not None:
        raise OrganizationNotFoundError(str(data.organization_id))
    values = data.model_dump(exclude={"tags", "publish"})
    opp = Opportunity(**values, slug=_unique_slug(db, data.title), posted_by_id=actor.id)
    _check_ranges(opp)
    opp.tags = _resolve_tags(db, data.tags)
    if data.publish:
        opp.status = OpportunityStatus.PUBLISHED
        opp.published_at = _now()
    db.add(opp)
    db.flush()
    _audit(db, actor, "opportunity.create", opp, {"title": opp.title, "status": _jsonable(opp.status)}, ip)
    db.commit()
    db.refresh(opp)
    return opp


def update_opportunity(
    db: Session, opp: Opportunity, data: OpportunityUpdate, actor: User, ip: str | None = None
) -> Opportunity:
    payload = data.model_dump(exclude_unset=True)
    tag_names = payload.pop("tags", None)
    if "organization_id" in payload:
        org = db.get(Organization, payload["organization_id"])
        if org is None or org.deleted_at is not None:
            raise OrganizationNotFoundError(str(payload["organization_id"]))
    changes: dict = {}
    for field, new in payload.items():
        old = getattr(opp, field)
        if old != new:
            changes[field] = [_jsonable(old), _jsonable(new)]
            setattr(opp, field, new)
    if tag_names is not None:
        new_tags = _resolve_tags(db, tag_names)
        old_slugs = sorted(t.slug for t in opp.tags)
        new_slugs = sorted(t.slug for t in new_tags)
        if old_slugs != new_slugs:
            changes["tags"] = [old_slugs, new_slugs]
            opp.tags = new_tags
    if not changes:
        return opp
    try:
        _check_ranges(opp)
    except InvalidOpportunityError:
        db.rollback()
        raise
    _audit(db, actor, "opportunity.update", opp, changes, ip)
    db.commit()
    db.refresh(opp)
    return opp


def set_status(
    db: Session, opp: Opportunity, new_status: OpportunityStatus, actor: User, ip: str | None = None
) -> Opportunity:
    old = opp.status
    if old == new_status:
        return opp
    opp.status = new_status
    if new_status == OpportunityStatus.PUBLISHED and opp.published_at is None:
        opp.published_at = _now()
    _audit(db, actor, "opportunity.status", opp, {"status": [_jsonable(old), _jsonable(new_status)]}, ip)
    db.commit()
    db.refresh(opp)
    return opp


def approve_opportunity(
    db: Session,
    opp: Opportunity,
    actor: User,
    verification_status: VerificationStatus | None = None,
    trust_score: int | None = None,
    ip: str | None = None,
) -> Opportunity:
    if opp.posted_by_id == actor.id and actor.role != UserRole.ADMIN:
        raise CannotApproveOwnPostingError("Moderators cannot approve their own postings.")

    old_status = opp.status
    opp.status = OpportunityStatus.PUBLISHED
    opp.published_at = _now()
    if verification_status is not None:
        opp.verification_status = verification_status
    if trust_score is not None:
        opp.trust_score = trust_score

    _audit(
        db,
        actor,
        "opportunity.approve",
        opp,
        {
            "status": [_jsonable(old_status), "published"],
            "verification_status": _jsonable(opp.verification_status),
            "trust_score": opp.trust_score,
        },
        ip,
    )

    if opp.posted_by_id:
        db.add(
            Notification(
                user_id=opp.posted_by_id,
                type=NotificationType.SYSTEM,
                title="Opportunity Approved!",
                body=f"Your posting '{opp.title}' has been approved and published.",
                data={"opportunity_id": str(opp.id), "slug": opp.slug},
            )
        )

    db.commit()
    db.refresh(opp)
    return opp


def reject_opportunity(
    db: Session,
    opp: Opportunity,
    reason: str,
    actor: User,
    ip: str | None = None,
) -> Opportunity:
    old_status = opp.status
    opp.status = OpportunityStatus.REJECTED
    _audit(
        db,
        actor,
        "opportunity.reject",
        opp,
        {"status": [_jsonable(old_status), "rejected"], "reason": reason},
        ip,
    )

    if opp.posted_by_id:
        db.add(
            Notification(
                user_id=opp.posted_by_id,
                type=NotificationType.SYSTEM,
                title="Opportunity Rejected",
                body=f"Your posting '{opp.title}' was rejected: {reason}",
                data={"opportunity_id": str(opp.id), "reason": reason},
            )
        )

    db.commit()
    db.refresh(opp)
    return opp


def soft_delete(db: Session, opp: Opportunity, actor: User, ip: str | None = None) -> None:
    opp.deleted_at = _now()
    _audit(db, actor, "opportunity.delete", opp, {"title": opp.title}, ip)
    db.commit()


# ---------- notifications ----------
def list_notifications(db: Session, user_id: uuid.UUID, limit: int, offset: int):
    stmt = select(Notification).where(Notification.user_id == user_id)
    return _page(db, stmt, (Notification.created_at.desc(), Notification.id), limit, offset)


def count_unread_notifications(db: Session, user_id: uuid.UUID) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user_id, Notification.read_at.is_(None))
        )
        or 0
    )


def mark_notification_read(db: Session, user_id: uuid.UUID, notification_id: uuid.UUID) -> Notification | None:
    notif = db.scalar(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
    )
    if notif is None:
        return None
    notif.read_at = _now()
    db.commit()
    db.refresh(notif)
    return notif


def mark_all_notifications_read(db: Session, user_id: uuid.UUID) -> int:
    result = db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.read_at.is_(None))
        .values(read_at=_now())
    )
    db.commit()
    return result.rowcount
