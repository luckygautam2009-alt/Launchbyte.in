"""
Admin & Organizer Event Management, Staff, Stats, and Registrations moderation router.
"""
from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select

from app.dependencies.auth import CurrentUser, OrganizerUser
from app.dependencies.db import DBSession
from app.models.events import Event, EventRegistration, EventStaffRole, EventStatus, RegistrationStatus
from app.schemas.common import Page
from app.schemas.events import (
    AddStaffRequest,
    EventDetailPublic,
    EventQuickCreate,
    EventRegistrationAdminRead,
    EventStats,
    EventUpdate,
    StaffRead,
)
from app.services.events import service as event_svc

router = APIRouter(prefix="/admin/events", tags=["admin-events"])


@router.post("", response_model=EventDetailPublic, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventQuickCreate,
    db: DBSession,
    current_user: OrganizerUser,
):
    try:
        data = payload.model_dump()
        event = event_svc.create_event(db, data, current_user)
        # If admin, publish immediately
        if current_user.role == "admin":
            event = event_svc.publish_event(db, event.id, current_user)

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
            venue_text=event.venue_text,
            venue_map_url=event.venue_map_url,
            online_url=event.online_url,
            capacity=event.capacity,
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
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=Page[EventDetailPublic])
def list_admin_events(
    db: DBSession,
    current_user: OrganizerUser,
    status_filter: EventStatus | None = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    stmt = select(Event).where(Event.deleted_at.is_(None))
    if current_user.role != "admin":
        stmt = stmt.where(
            or_(
                Event.created_by_id == current_user.id,
                Event.organization.has(
                    event_svc.Organization.members.any(event_svc.OrganizationMember.user_id == current_user.id)
                ),
            )
        )
    if status_filter:
        stmt = stmt.where(Event.status == status_filter)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(stmt.order_by(Event.created_at.desc()).limit(limit).offset(offset)).all()

    res_items = [
        EventDetailPublic(
            id=e.id,
            slug=e.slug,
            title=e.title,
            tagline=e.tagline,
            banner_url=e.banner_url,
            thumbnail_url=e.thumbnail_url,
            description=e.description,
            starts_at=e.starts_at,
            ends_at=e.ends_at,
            timezone=e.timezone,
            mode=e.mode,
            venue_text=e.venue_text,
            venue_map_url=e.venue_map_url,
            online_url=e.online_url,
            capacity=e.capacity,
            registration_opens_at=e.registration_opens_at,
            registration_closes_at=e.registration_closes_at,
            requires_approval=e.requires_approval,
            waitlist_enabled=e.waitlist_enabled,
            team_min_size=e.team_min_size,
            team_max_size=e.team_max_size,
            sections=e.sections,
            custom_questions=e.custom_questions,
            theme_accent=e.theme_accent,
            status=e.status,
            published_at=e.published_at,
            organization=e.organization,
        )
        for e in items
    ]
    return {"items": res_items, "total": total, "limit": limit, "offset": offset}


@router.get("/{id}", response_model=EventDetailPublic)
def get_admin_event(
    id: uuid.UUID,
    db: DBSession,
    current_user: OrganizerUser,
):
    event = db.get(Event, id)
    if not event or event.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Event not found")
    try:
        event_svc._require_event_manager(db, event, current_user)
    except PermissionError:
        raise HTTPException(status_code=403, detail="Access denied")

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
        venue_text=event.venue_text,
        venue_map_url=event.venue_map_url,
        online_url=event.online_url,
        capacity=event.capacity,
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
    )


@router.patch("/{id}", response_model=EventDetailPublic)
def update_event(
    id: uuid.UUID,
    payload: EventUpdate,
    db: DBSession,
    current_user: OrganizerUser,
):
    try:
        event = event_svc.update_event(db, id, payload.model_dump(exclude_unset=True), current_user)
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
            venue_text=event.venue_text,
            venue_map_url=event.venue_map_url,
            online_url=event.online_url,
            capacity=event.capacity,
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
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Event not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{id}/publish", response_model=EventDetailPublic)
def publish_event(
    id: uuid.UUID,
    db: DBSession,
    current_user: OrganizerUser,
):
    try:
        event = event_svc.publish_event(db, id, current_user)
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
            venue_text=event.venue_text,
            venue_map_url=event.venue_map_url,
            online_url=event.online_url,
            capacity=event.capacity,
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
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Event not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{id}/unpublish", response_model=EventDetailPublic)
def unpublish_event(
    id: uuid.UUID,
    db: DBSession,
    current_user: OrganizerUser,
):
    try:
        event = event_svc.unpublish_event(db, id, current_user)
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
            venue_text=event.venue_text,
            venue_map_url=event.venue_map_url,
            online_url=event.online_url,
            capacity=event.capacity,
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
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Event not found")


@router.post("/{id}/close-registration", response_model=EventDetailPublic)
def close_registration(
    id: uuid.UUID,
    db: DBSession,
    current_user: OrganizerUser,
):
    try:
        event = event_svc.close_registration(db, id, current_user)
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
            venue_text=event.venue_text,
            venue_map_url=event.venue_map_url,
            online_url=event.online_url,
            capacity=event.capacity,
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
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Event not found")


@router.post("/{id}/cancel", response_model=EventDetailPublic)
def cancel_event(
    id: uuid.UUID,
    db: DBSession,
    current_user: OrganizerUser,
):
    try:
        event = event_svc.cancel_event(db, id, current_user)
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
            venue_text=event.venue_text,
            venue_map_url=event.venue_map_url,
            online_url=event.online_url,
            capacity=event.capacity,
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
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Event not found")


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    id: uuid.UUID,
    db: DBSession,
    current_user: OrganizerUser,
):
    try:
        event_svc.delete_event(db, id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Event not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- Registrations Moderation ---

@router.get("/{id}/registrations", response_model=Page[EventRegistrationAdminRead])
def list_event_registrations(
    id: uuid.UUID,
    db: DBSession,
    current_user: OrganizerUser,
    status_filter: RegistrationStatus | None = Query(None, alias="status"),
    q: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    event = db.get(Event, id)
    if not event or event.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Event not found")
    try:
        event_svc._require_event_manager(db, event, current_user)
    except PermissionError:
        raise HTTPException(status_code=403, detail="Access denied")

    stmt = select(EventRegistration).where(EventRegistration.event_id == id)
    if status_filter:
        stmt = stmt.where(EventRegistration.status == status_filter)
    if q:
        safe_q = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                EventRegistration.registration_code.ilike(safe_q),
                EventRegistration.user.has(event_svc.User.email.ilike(safe_q)),
                EventRegistration.user.has(event_svc.User.full_name.ilike(safe_q)),
            )
        )

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(
        stmt.order_by(EventRegistration.registered_at.asc()).limit(limit).offset(offset)
    ).all()

    res_items = [
        EventRegistrationAdminRead(
            id=r.id,
            event_id=r.event_id,
            user_id=r.user_id,
            status=r.status,
            registration_code=r.registration_code,
            waitlist_position=r.waitlist_position,
            registered_at=r.registered_at,
            cancelled_at=r.cancelled_at,
            checked_in_at=r.checked_in_at,
            answers=r.answers,
            checked_in_by_id=r.checked_in_by_id,
            attendee={"id": r.user.id, "email": r.user.email, "full_name": r.user.full_name} if r.user else None,
        )
        for r in items
    ]
    return {"items": res_items, "total": total, "limit": limit, "offset": offset}


@router.post("/{id}/registrations/{rid}/approve", response_model=EventRegistrationAdminRead)
def approve_registration(
    id: uuid.UUID,
    rid: uuid.UUID,
    db: DBSession,
    current_user: OrganizerUser,
):
    try:
        reg = event_svc.approve_registration(db, id, rid, current_user)
        return EventRegistrationAdminRead(
            id=reg.id,
            event_id=reg.event_id,
            user_id=reg.user_id,
            status=reg.status,
            registration_code=reg.registration_code,
            waitlist_position=reg.waitlist_position,
            registered_at=reg.registered_at,
            cancelled_at=reg.cancelled_at,
            checked_in_at=reg.checked_in_at,
            answers=reg.answers,
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Registration not found")


@router.post("/{id}/registrations/{rid}/reject", response_model=EventRegistrationAdminRead)
def reject_registration(
    id: uuid.UUID,
    rid: uuid.UUID,
    db: DBSession,
    current_user: OrganizerUser,
):
    try:
        reg = event_svc.reject_registration(db, id, rid, current_user)
        return EventRegistrationAdminRead(
            id=reg.id,
            event_id=reg.event_id,
            user_id=reg.user_id,
            status=reg.status,
            registration_code=reg.registration_code,
            waitlist_position=reg.waitlist_position,
            registered_at=reg.registered_at,
            cancelled_at=reg.cancelled_at,
            checked_in_at=reg.checked_in_at,
            answers=reg.answers,
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Registration not found")


@router.post("/{id}/registrations/{rid}/undo-check-in", response_model=EventRegistrationAdminRead)
def undo_check_in(
    id: uuid.UUID,
    rid: uuid.UUID,
    db: DBSession,
    current_user: OrganizerUser,
):
    try:
        reg = event_svc.undo_check_in(db, id, rid, current_user)
        return EventRegistrationAdminRead(
            id=reg.id,
            event_id=reg.event_id,
            user_id=reg.user_id,
            status=reg.status,
            registration_code=reg.registration_code,
            waitlist_position=reg.waitlist_position,
            registered_at=reg.registered_at,
            cancelled_at=reg.cancelled_at,
            checked_in_at=reg.checked_in_at,
            answers=reg.answers,
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Registration not found")


# --- Stats & CSV ---

@router.get("/{id}/stats", response_model=EventStats)
def get_event_stats(
    id: uuid.UUID,
    db: DBSession,
    current_user: OrganizerUser,
):
    try:
        data = event_svc.get_event_stats(db, id, current_user)
        return EventStats(**data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Event not found")


@router.get("/{id}/registrations.csv")
def export_registrations_csv(
    id: uuid.UUID,
    db: DBSession,
    current_user: OrganizerUser,
):
    try:
        csv_data = event_svc.export_registrations_csv(db, id, current_user)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=event_{id}_attendees.csv"},
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Event not found")


# --- Staff Management ---

@router.post("/{id}/staff", response_model=StaffRead, status_code=status.HTTP_201_CREATED)
def add_staff(
    id: uuid.UUID,
    payload: AddStaffRequest,
    db: DBSession,
    current_user: OrganizerUser,
):
    try:
        staff = event_svc.add_event_staff(db, id, payload.email, payload.role, current_user)
        return StaffRead(
            id=staff.id,
            user_id=staff.user_id,
            email=staff.user.email if staff.user else payload.email,
            name=staff.user.full_name if staff.user else None,
            role=staff.role,
            created_at=staff.created_at,
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Event not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{id}/staff", response_model=list[StaffRead])
def list_staff(
    id: uuid.UUID,
    db: DBSession,
    current_user: OrganizerUser,
):
    try:
        staff_list = event_svc.list_event_staff(db, id, current_user)
        return [
            StaffRead(
                id=s.id,
                user_id=s.user_id,
                email=s.user.email if s.user else "",
                name=s.user.full_name if s.user else None,
                role=s.role,
                created_at=s.created_at,
            )
            for s in staff_list
        ]
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Event not found")


@router.delete("/{id}/staff/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_staff(
    id: uuid.UUID,
    user_id: uuid.UUID,
    db: DBSession,
    current_user: OrganizerUser,
):
    try:
        event_svc.remove_event_staff(db, id, user_id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Event not found")

