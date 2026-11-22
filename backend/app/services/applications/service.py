"""
Business logic for the applications domain.

Ownership rule: every user-facing function receives ``user_id`` and filters
on it — the router must never skip that argument.

Transaction ownership: callers pass an open Session; this service calls
``db.commit()`` (and ``db.rollback()`` on error) before returning.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models.applications import Application, ApplicationEvent
from app.models.enums import ApplicationEventType, ApplicationStatus
from app.models.opportunities import Opportunity, OpportunityStatus
from app.schemas.applications import ApplicationCreate, ApplicationUpdate


# ---------- custom exceptions ----------

class DuplicateApplicationError(Exception):
    """The user already has an application for this platform opportunity."""


class ApplicationNotFoundError(Exception):
    """Application does not exist or is not owned by the requesting user."""


class OpportunityNotFoundError(Exception):
    """opportunity_id does not reference a live, published opportunity."""


# ---------- helpers ----------

def _now() -> datetime:
    return datetime.now(timezone.utc)


def _load_events():
    """selectinload option for the events relationship."""
    return selectinload(Application.events)


# ---------- user-facing operations ----------

def submit(
    db: Session,
    *,
    user_id: uuid.UUID,
    data: ApplicationCreate,
) -> Application:
    """
    Create a new application (platform or external).

    Raises:
        OpportunityNotFoundError  — opportunity_id doesn't point at a live published opportunity.
        DuplicateApplicationError — user already applied to this platform opportunity.
    """
    if data.opportunity_id is not None:
        opp = db.get(Opportunity, data.opportunity_id)
        if opp is None or opp.deleted_at is not None or opp.status != OpportunityStatus.PUBLISHED:
            raise OpportunityNotFoundError(str(data.opportunity_id))

    app = Application(
        user_id=user_id,
        opportunity_id=data.opportunity_id,
        custom_title=data.custom_title,
        custom_organization=data.custom_organization,
        custom_url=data.custom_url,
        status=data.status,
        priority=data.priority,
        applied_at=data.applied_at,
        deadline_at=data.deadline_at,
        reminder_at=data.reminder_at,
        decision_at=data.decision_at,
        resume_url=data.resume_url,
        notes=data.notes,
    )
    db.add(app)
    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        # The UniqueConstraint("user_id", "opportunity_id") fired.
        raise DuplicateApplicationError(
            "You already have an application for this opportunity."
        ) from exc

    # Append the initial status-change event.
    db.add(
        ApplicationEvent(
            application_id=app.id,
            event_type=ApplicationEventType.STATUS_CHANGE,
            from_status=None,
            to_status=app.status,
            note="Application created",
        )
    )
    db.commit()
    db.refresh(app)
    # eager-load events so the response schema can serialise them
    db.scalars(
        select(Application)
        .where(Application.id == app.id)
        .options(_load_events())
    ).first()
    return app


def list_mine(
    db: Session,
    *,
    user_id: uuid.UUID,
    limit: int,
    offset: int,
    status_filter: ApplicationStatus | None = None,
) -> tuple[list[Application], int]:
    """Paginated list of applications owned by ``user_id``."""
    stmt = select(Application).where(Application.user_id == user_id)
    if status_filter is not None:
        stmt = stmt.where(Application.status == status_filter)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(
        stmt.order_by(Application.created_at.desc(), Application.id)
        .limit(limit)
        .offset(offset)
    ).all()
    return list(items), total


def get_mine(
    db: Session,
    *,
    application_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Application:
    """
    Fetch one application with its event timeline.

    Raises ApplicationNotFoundError if the row doesn't exist or isn't owned by
    ``user_id`` (same 404, to avoid leaking IDs).
    """
    app = db.scalar(
        select(Application)
        .where(Application.id == application_id, Application.user_id == user_id)
        .options(_load_events())
    )
    if app is None:
        raise ApplicationNotFoundError(str(application_id))
    return app


def update_mine(
    db: Session,
    *,
    application_id: uuid.UUID,
    user_id: uuid.UUID,
    data: ApplicationUpdate,
) -> Application:
    """
    Partial update. Emits a status_change event if ``status`` is changing.

    Raises ApplicationNotFoundError on missing / unowned row.
    """
    app = get_mine(db, application_id=application_id, user_id=user_id)

    payload = data.model_dump(exclude_unset=True)
    old_status = app.status

    for field, value in payload.items():
        setattr(app, field, value)

    new_status: ApplicationStatus | None = payload.get("status")
    if new_status is not None and new_status != old_status:
        db.add(
            ApplicationEvent(
                application_id=app.id,
                event_type=ApplicationEventType.STATUS_CHANGE,
                from_status=old_status,
                to_status=new_status,
                note=None,
            )
        )

    db.commit()
    db.refresh(app)
    # Re-query with events eager-loaded.
    return db.scalar(
        select(Application)
        .where(Application.id == app.id)
        .options(_load_events())
    )


def delete_mine(
    db: Session,
    *,
    application_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    """
    Hard-delete the application (cascade removes events).

    Raises ApplicationNotFoundError on missing / unowned row.
    """
    app = get_mine(db, application_id=application_id, user_id=user_id)
    db.delete(app)
    db.commit()


# ---------- admin / staff operations ----------

def list_admin_for_opportunity(
    db: Session,
    *,
    opportunity_id: uuid.UUID,
    limit: int,
    offset: int,
    status_filter: ApplicationStatus | None = None,
) -> tuple[list[Application], int]:
    """All applications for a given opportunity (staff only)."""
    stmt = select(Application).where(Application.opportunity_id == opportunity_id)
    if status_filter is not None:
        stmt = stmt.where(Application.status == status_filter)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(
        stmt.order_by(Application.created_at.desc(), Application.id)
        .limit(limit)
        .offset(offset)
    ).all()
    return list(items), total


def get_admin(
    db: Session,
    *,
    application_id: uuid.UUID,
) -> Application | None:
    """Fetch any application by ID for staff review (no ownership filter)."""
    return db.scalar(
        select(Application)
        .where(Application.id == application_id)
        .options(_load_events())
    )
