"""
Business logic for the opportunities domain.

Public side: only published, non-deleted postings (expired hidden unless asked).
Admin side: full CRUD; every change writes an audit_logs row in the same transaction.
"""
import re
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.audit import AuditLog
from app.models.enums import LocationType, OpportunityStatus, OpportunityType, VerificationStatus
from app.models.opportunities import Opportunity, Tag
from app.models.organizations import Organization
from app.models.users import User
from app.schemas.opportunities import OpportunityCreate, OpportunityUpdate

_LOAD = (selectinload(Opportunity.organization), selectinload(Opportunity.tags))
_ORDER = {
    "deadline": (Opportunity.deadline_at.asc().nulls_last(), Opportunity.id),
    "newest": (Opportunity.published_at.desc().nulls_last(), Opportunity.id),
}


class OrganizationNotFoundError(Exception):
    """organization_id does not point at a live organization."""


class InvalidOpportunityError(Exception):
    """Cross-field rule broken (e.g. min > max compensation)."""


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


def _page(db: Session, stmt, order, limit: int, offset: int):
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(stmt.options(*_LOAD).order_by(*order).limit(limit).offset(offset)).all()
    return list(items), total


# ---------- public ----------
def list_public(
    db: Session,
    *,
    limit: int,
    offset: int,
    opp_type: OpportunityType | None = None,
    location_type: LocationType | None = None,
    country_code: str | None = None,
    verification_status: VerificationStatus | None = None,
    tag: str | None = None,
    q: str | None = None,
    include_expired: bool = False,
    sort: str = "deadline",
):
    stmt = select(Opportunity).where(
        Opportunity.deleted_at.is_(None), Opportunity.status == OpportunityStatus.PUBLISHED
    )
    if not include_expired:
        stmt = stmt.where(
            or_(
                Opportunity.is_rolling.is_(True),
                Opportunity.deadline_at.is_(None),
                Opportunity.deadline_at > _now(),
            )
        )
    if opp_type is not None:
        stmt = stmt.where(Opportunity.type == opp_type)
    if location_type is not None:
        stmt = stmt.where(Opportunity.location_type == location_type)
    if verification_status is not None:
        stmt = stmt.where(Opportunity.verification_status == verification_status)
    if country_code:
        stmt = stmt.where(Opportunity.country_code == country_code.upper())
    if tag:
        stmt = stmt.where(Opportunity.tags.any(Tag.slug == slugify(tag)))
    if q:
        stmt = stmt.where(
            or_(
                Opportunity.title.icontains(q, autoescape=True),
                Opportunity.summary.icontains(q, autoescape=True),
            )
        )
    return _page(db, stmt, _ORDER.get(sort, _ORDER["deadline"]), limit, offset)


def get_public_by_slug(db: Session, slug: str) -> Opportunity | None:
    return db.scalar(
        select(Opportunity)
        .where(
            Opportunity.slug == slug,
            Opportunity.deleted_at.is_(None),
            Opportunity.status == OpportunityStatus.PUBLISHED,
        )
        .options(*_LOAD)
    )


# ---------- admin ----------
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
        stmt = stmt.where(Opportunity.title.icontains(q, autoescape=True))
    return _page(db, stmt, (Opportunity.created_at.desc(), Opportunity.id), limit, offset)


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


def soft_delete(db: Session, opp: Opportunity, actor: User, ip: str | None = None) -> None:
    opp.deleted_at = _now()
    _audit(db, actor, "opportunity.delete", opp, {"title": opp.title}, ip)
    db.commit()
