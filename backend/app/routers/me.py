from fastapi import APIRouter, Query

from sqlalchemy import func, select

from app.dependencies.auth import CurrentUser, OrganizerUser
from app.dependencies.db import DBSession
from app.models.events import EventRegistration
from app.schemas.common import Page
from app.schemas.events import EventRegistrationRead
from app.schemas.opportunities import OpportunityDetail, OpportunityListItem
from app.services.opportunities import service as opp_svc

router = APIRouter(prefix="/me", tags=["me"])


@router.get("/saved", response_model=Page[OpportunityListItem])
def get_my_saved_opportunities(
    db: DBSession,
    current_user: CurrentUser,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    items, total = opp_svc.list_saved(db, current_user.id, limit=limit, offset=offset)
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/opportunities", response_model=Page[OpportunityDetail])
def get_my_opportunities(
    db: DBSession,
    user: OrganizerUser,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    items, total = opp_svc.list_organizer_opportunities(db, user, limit=limit, offset=offset)
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/registrations", response_model=Page[EventRegistrationRead])
def get_my_registrations(
    db: DBSession,
    current_user: CurrentUser,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    stmt = (
        select(EventRegistration)
        .where(EventRegistration.user_id == current_user.id)
        .order_by(EventRegistration.registered_at.desc())
    )
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(stmt.limit(limit).offset(offset)).all()

    res_items = [
        EventRegistrationRead(
            id=r.id,
            event_id=r.event_id,
            user_id=r.user_id,
            status=r.status,
            registration_code=r.registration_code,
            waitlist_position=r.waitlist_position,
            registered_at=r.registered_at,
            cancelled_at=r.cancelled_at,
            checked_in_at=r.checked_in_at,
            attendee={"id": current_user.id, "email": current_user.email, "full_name": current_user.full_name},
            event_title=r.event.title if r.event else None,
            event_slug=r.event.slug if r.event else None,
            starts_at=r.event.starts_at if r.event else None,
        )
        for r in items
    ]
    return {"items": res_items, "total": total, "limit": limit, "offset": offset}
