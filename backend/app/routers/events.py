"""
Public Events, Registration, QR Pass, and Check-in router.
"""
from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.core.qr import generate_qr_png_bytes
from app.core.rate_limit import limiter
from app.dependencies.auth import CurrentUser, ExploreGate, OptionalUser
from app.dependencies.db import DBSession
from app.models.events import CheckInResult, EventMode
from app.schemas.common import Page
from app.schemas.events import (
    CheckInRequest,
    CheckInResponse,
    EventDetailPublic,
    EventListItem,
    EventRegisterRequest,
    EventRegistrationRead,
    PassTokenRead,
)
from app.services.events import service as event_svc

router = APIRouter(tags=["events"])


@router.get("/events", response_model=Page[EventListItem], dependencies=[ExploreGate])
def list_events(
    db: DBSession,
    response: Response,
    upcoming: bool = Query(True, description="Filter for upcoming vs past events"),
    mode: EventMode | None = Query(None),
    q: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    items, total = event_svc.list_public_events(
        db, upcoming=upcoming, mode=mode, q=q, limit=limit, offset=offset
    )

    result_items = []
    for evt in items:
        active_count = getattr(evt, "active_registration_count", 0)
        cap_rem = max(0, evt.capacity - active_count) if evt.capacity is not None else None
        is_full = evt.capacity is not None and active_count >= evt.capacity
        result_items.append(
            EventListItem(
                id=evt.id,
                slug=evt.slug,
                title=evt.title,
                tagline=evt.tagline,
                banner_url=evt.banner_url,
                thumbnail_url=evt.thumbnail_url,
                starts_at=evt.starts_at,
                ends_at=evt.ends_at,
                timezone=evt.timezone,
                mode=evt.mode,
                venue_city=evt.venue_text.split(",")[0] if evt.venue_text else "Online",
                capacity=evt.capacity,
                capacity_remaining=cap_rem,
                is_full=is_full,
                status=evt.status,
                organization=evt.organization,
            )
        )

    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    return {"items": result_items, "total": total, "limit": limit, "offset": offset}


@router.get("/events/{slug}", response_model=EventDetailPublic, dependencies=[ExploreGate])
def get_event_by_slug(
    slug: str,
    db: DBSession,
    current_user: OptionalUser,
    response: Response,
):
    try:
        event, meta = event_svc.get_public_event_by_slug(db, slug, caller=current_user)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Event not found")

    if current_user:
        response.headers["Cache-Control"] = "private, no-cache"
    else:
        response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"

    # Reveal detailed venue / online_url ONLY if registered or manager
    is_registered = meta.get("registration_state") in ["registered", "checked_in"]
    if is_registered:
        venue_display = event.venue_text
    elif event.venue_text:
        parts = [p.strip() for p in event.venue_text.split(",") if p.strip()]
        venue_display = parts[-1] if len(parts) > 1 else parts[0]
    else:
        venue_display = None
    online_display = event.online_url if is_registered else None

    return EventDetailPublic(
        id=event.id,
        slug=event.slug,
        title=event.title,
        tagline=event.tagline,
        banner_url=event.banner_url,
        thumbnail_url=event.thumbnail_url,
        description=event.description,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        timezone=event.timezone,
        mode=event.mode,
        venue_text=venue_display,
        venue_map_url=event.venue_map_url,
        online_url=online_display,
        capacity=event.capacity,
        capacity_remaining=meta["capacity_remaining"],
        registration_opens_at=event.registration_opens_at,
        registration_closes_at=event.registration_closes_at,
        requires_approval=event.requires_approval,
        waitlist_enabled=event.waitlist_enabled,
        team_min_size=event.team_min_size,
        team_max_size=event.team_max_size,
        sections=event.sections,
        custom_questions=event.custom_questions,
        theme_accent=event.theme_accent,
        status=event.status,
        published_at=event.published_at,
        organization=event.organization,
        registration_state=meta["registration_state"],
        user_registration=meta["user_registration"],
    )


@router.post("/events/{id}/register", response_model=EventRegistrationRead, status_code=status.HTTP_201_CREATED)
def register_for_event(
    id: uuid.UUID,
    payload: EventRegisterRequest,
    db: DBSession,
    current_user: CurrentUser,
    request: Request,
):
    limiter.check_rate_limit(request, key=f"register_{current_user.id}")
    try:
        reg = event_svc.register_for_event(db, id, current_user, payload.answers)
        return EventRegistrationRead(
            id=reg.id,
            event_id=reg.event_id,
            user_id=reg.user_id,
            status=reg.status,
            registration_code=reg.registration_code,
            waitlist_position=reg.waitlist_position,
            registered_at=reg.registered_at,
            cancelled_at=reg.cancelled_at,
            checked_in_at=reg.checked_in_at,
            attendee={"id": current_user.id, "email": current_user.email, "full_name": current_user.full_name},
            event_title=reg.event.title if reg.event else None,
            event_slug=reg.event.slug if reg.event else None,
            starts_at=reg.event.starts_at if reg.event else None,
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Event not found")
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.post("/events/{id}/cancel-registration", response_model=EventRegistrationRead)
def cancel_registration(
    id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        reg = event_svc.cancel_registration(db, id, current_user)
        return EventRegistrationRead(
            id=reg.id,
            event_id=reg.event_id,
            user_id=reg.user_id,
            status=reg.status,
            registration_code=reg.registration_code,
            waitlist_position=reg.waitlist_position,
            registered_at=reg.registered_at,
            cancelled_at=reg.cancelled_at,
            checked_in_at=reg.checked_in_at,
            attendee={"id": current_user.id, "email": current_user.email, "full_name": current_user.full_name},
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Active registration not found")


@router.get("/registrations/{id}", response_model=EventRegistrationRead)
def get_registration(
    id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    reg = db.get(event_svc.EventRegistration, id)
    if not reg or (reg.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=404, detail="Registration not found")

    return EventRegistrationRead(
        id=reg.id,
        event_id=reg.event_id,
        user_id=reg.user_id,
        status=reg.status,
        registration_code=reg.registration_code,
        waitlist_position=reg.waitlist_position,
        registered_at=reg.registered_at,
        cancelled_at=reg.cancelled_at,
        checked_in_at=reg.checked_in_at,
        attendee={"id": reg.user.id, "email": reg.user.email, "full_name": reg.user.full_name} if reg.user else None,
        event_title=reg.event.title if reg.event else None,
        event_slug=reg.event.slug if reg.event else None,
        starts_at=reg.event.starts_at if reg.event else None,
    )


@router.get("/registrations/{id}/pass", response_model=PassTokenRead)
def get_registration_pass(
    id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        data = event_svc.get_pass_data(db, id, current_user)
        return PassTokenRead(**data)
    except PermissionError:
        raise HTTPException(status_code=403, detail="Access denied")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Registration not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/registrations/{id}/pass.png")
def get_registration_pass_png(
    id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        data = event_svc.get_pass_data(db, id, current_user)
        token = data["token"]
        png_bytes = generate_qr_png_bytes(token)
        return Response(content=png_bytes, media_type="image/png")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Access denied")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Registration not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/registrations/{id}/pass/rotate", response_model=EventRegistrationRead)
def rotate_pass(
    id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        reg = event_svc.rotate_pass_nonce(db, id, current_user)
        return EventRegistrationRead(
            id=reg.id,
            event_id=reg.event_id,
            user_id=reg.user_id,
            status=reg.status,
            registration_code=reg.registration_code,
            waitlist_position=reg.waitlist_position,
            registered_at=reg.registered_at,
            cancelled_at=reg.cancelled_at,
            checked_in_at=reg.checked_in_at,
        )
    except PermissionError:
        raise HTTPException(status_code=403, detail="Access denied")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Registration not found")


@router.post("/events/{id}/check-in", response_model=CheckInResponse)
def check_in(
    id: uuid.UUID,
    payload: CheckInRequest,
    db: DBSession,
    current_user: CurrentUser,
    request: Request,
):
    ip = request.client.host if request.client else None
    try:
        res = event_svc.check_in_attendee(
            db,
            id,
            token=payload.token,
            registration_code=payload.registration_code,
            scanner=current_user,
            ip=ip,
        )
        # If duplicate check-in, return 409 according to requirements
        if res.get("result") == CheckInResult.DUPLICATE:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=res.get("message", "Already checked in"),
            )
        return CheckInResponse(**res)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Event not found")
