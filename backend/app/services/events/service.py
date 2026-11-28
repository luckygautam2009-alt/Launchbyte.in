"""
Event, Registration, QR Pass, and Check-In Service layer.
"""
from __future__ import annotations

import csv
import io
import re
import secrets
import string
import time
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.core.qr import create_pass_token, decode_and_verify_pass_token
from app.models.audit import AuditLog
from app.models.events import (
    CheckInLog,
    CheckInResult,
    Event,
    EventMode,
    EventRegistration,
    EventStaff,
    EventStaffRole,
    EventStatus,
    RegistrationStatus,
)
from app.models.notifications import Notification
from app.models.opportunities import Opportunity, OpportunityStatus, OpportunityType, VerificationStatus
from app.models.organizations import Organization, OrganizationMember
from app.models.users import User
from app.services.email import get_email_backend


def _generate_slug(title: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", title.lower())
    slug = re.sub(r"[\s_-]+", "-", cleaned).strip("-")
    return slug[:140] or "event"


def _generate_unique_slug(db: Session, title: str, exclude_id: uuid.UUID | None = None) -> str:
    base = _generate_slug(title)
    slug = base
    counter = 1
    while True:
        stmt = select(Event.id).where(Event.slug == slug)
        if exclude_id is not None:
            stmt = stmt.where(Event.id != exclude_id)
        if db.scalar(stmt) is None:
            return slug
        slug = f"{base}-{counter}"
        counter += 1


def _generate_registration_code() -> str:
    chars = string.ascii_uppercase + string.digits
    # Exclude ambiguous chars (O, 0, I, 1)
    safe_chars = [c for c in chars if c not in "O0I1"]
    suffix = "".join(secrets.choice(safe_chars) for _ in range(5))
    return f"LB-{suffix}"


def _validate_custom_answers(custom_questions: list[dict[str, Any]], answers: dict[str, Any]) -> None:
    for q in custom_questions:
        qid = q.get("id")
        label = q.get("label", qid)
        is_required = q.get("required", False)
        val = answers.get(qid)

        if is_required:
            if val is None or (isinstance(val, str) and not val.strip()):
                raise ValueError(f"Missing required answer for: {label}")

        if val is not None and q.get("type") == "select":
            options = q.get("options", [])
            if options and val not in options:
                raise ValueError(f"Invalid option for {label}: {val}")


# --- Event Lifecycle ---

def create_event(
    db: Session,
    data: dict[str, Any],
    creator: User,
) -> Event:
    org_id = data.get("organization_id")
    if not org_id:
        # Default to first organization the user is a member of
        membership = db.scalar(
            select(OrganizationMember.organization_id).where(OrganizationMember.user_id == creator.id)
        )
        if not membership and creator.role != "admin":
            raise ValueError("You must be an organization member to host events.")
        org_id = membership or uuid.uuid4()

    # Permission check: must be owner/editor or admin
    if creator.role != "admin":
        is_member = db.scalar(
            select(OrganizationMember.id).where(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == creator.id,
            )
        )
        if not is_member:
            raise PermissionError("You do not have permission to host events for this organization.")

    title = data["title"]
    slug = _generate_unique_slug(db, title)

    event = Event(
        organization_id=org_id,
        slug=slug,
        title=title,
        tagline=data.get("tagline"),
        banner_url=data["banner_url"],
        thumbnail_url=data["thumbnail_url"],
        description=data["description"],
        starts_at=data["starts_at"],
        ends_at=data["ends_at"],
        timezone=data.get("timezone", "UTC"),
        mode=data.get("mode", EventMode.ONLINE),
        venue_text=data.get("venue_text"),
        venue_map_url=data.get("venue_map_url"),
        online_url=data.get("online_url"),
        capacity=data.get("capacity"),
        registration_opens_at=data.get("registration_opens_at"),
        registration_closes_at=data.get("registration_closes_at"),
        requires_approval=data.get("requires_approval", False),
        waitlist_enabled=data.get("waitlist_enabled", True),
        team_min_size=data.get("team_min_size", 1),
        team_max_size=data.get("team_max_size"),
        sections=data.get("sections") or {},
        custom_questions=data.get("custom_questions") or [],
        theme_accent=data.get("theme_accent", "#6366f1"),
        status=EventStatus.DRAFT,
        created_by_id=creator.id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Automatically add creator as manager in event_staff
    staff = EventStaff(
        event_id=event.id,
        user_id=creator.id,
        role=EventStaffRole.MANAGER,
    )
    db.add(staff)
    db.commit()
    return event


def update_event(
    db: Session,
    event_id: uuid.UUID,
    data: dict[str, Any],
    caller: User,
) -> Event:
    event = db.get(Event, event_id)
    if not event or event.deleted_at is not None:
        raise FileNotFoundError("Event not found")

    _require_event_manager(db, event, caller)

    # Check if title changed to update slug
    if "title" in data and data["title"] and data["title"] != event.title:
        event.slug = _generate_unique_slug(db, data["title"], exclude_id=event.id)

    # Check capacity changes: cannot lower capacity below current active registrations
    if "capacity" in data and data["capacity"] is not None:
        new_cap = data["capacity"]
        active_count = db.scalar(
            select(func.count(EventRegistration.id)).where(
                EventRegistration.event_id == event.id,
                EventRegistration.status.in_([RegistrationStatus.REGISTERED, RegistrationStatus.CHECKED_IN]),
            )
        ) or 0
        if new_cap < active_count:
            raise ValueError(f"Cannot reduce capacity to {new_cap}; {active_count} attendees are already registered.")

    for k, v in data.items():
        if hasattr(event, k) and v is not None:
            setattr(event, k, v)

    event.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(event)

    # Keep linked Opportunity in sync if published
    if event.opportunity_id:
        _sync_linked_opportunity(db, event)

    return event


def publish_event(
    db: Session,
    event_id: uuid.UUID,
    caller: User,
) -> Event:
    event = db.get(Event, event_id)
    if not event or event.deleted_at is not None:
        raise FileNotFoundError("Event not found")

    _require_event_manager(db, event, caller)

    # Validate completeness
    if not event.title or not event.banner_url or not event.thumbnail_url or not event.description:
        raise ValueError("Cannot publish: missing title, banner, thumbnail, or description.")

    event.status = EventStatus.PUBLISHED
    event.published_at = datetime.utcnow()
    event.updated_at = datetime.utcnow()

    # Synchronize linked opportunity so it appears in standard browse
    _sync_linked_opportunity(db, event)

    # Audit log
    audit = AuditLog(
        actor_id=caller.id,
        action="event.published",
        entity_type="event",
        entity_id=str(event.id),
        changes={"title": event.title, "slug": event.slug},
    )
    db.add(audit)
    db.commit()
    db.refresh(event)
    return event


def _sync_linked_opportunity(db: Session, event: Event) -> None:
    opp = None
    if event.opportunity_id:
        opp = db.get(Opportunity, event.opportunity_id)

    org = db.get(Organization, event.organization_id)
    verification_status = org.verification_status if org else VerificationStatus.UNVERIFIED

    if opp is None:
        opp = Opportunity(
            organization_id=event.organization_id,
            posted_by_id=event.created_by_id,
            title=event.title,
            slug=f"evt-{event.slug}",
            type=OpportunityType.HACKATHON if "hack" in event.title.lower() else OpportunityType.EVENT,
            location_type="remote" if event.mode == EventMode.ONLINE else ("onsite" if event.mode == EventMode.ONSITE else "hybrid"),
            location_text=event.venue_text or "Online",
            summary=event.tagline or event.title,
            description=event.description,
            starts_at=event.starts_at,
            ends_at=event.ends_at,
            deadline_at=event.registration_closes_at or event.starts_at,
            application_url=f"/events/{event.slug}",
            status=OpportunityStatus.PUBLISHED if event.status == EventStatus.PUBLISHED else OpportunityStatus.ARCHIVED,
            published_at=event.published_at or datetime.utcnow(),
            verification_status=verification_status,
        )
        db.add(opp)
        db.flush()
        event.opportunity_id = opp.id
    else:
        opp.title = event.title
        opp.summary = event.tagline or event.title
        opp.description = event.description
        opp.starts_at = event.starts_at
        opp.ends_at = event.ends_at
        opp.deadline_at = event.registration_closes_at or event.starts_at
        opp.application_url = f"/events/{event.slug}"
        opp.status = OpportunityStatus.PUBLISHED if event.status == EventStatus.PUBLISHED else OpportunityStatus.ARCHIVED
        opp.updated_at = datetime.utcnow()
    db.commit()


def unpublish_event(db: Session, event_id: uuid.UUID, caller: User) -> Event:
    event = db.get(Event, event_id)
    if not event or event.deleted_at is not None:
        raise FileNotFoundError("Event not found")
    _require_event_manager(db, event, caller)

    event.status = EventStatus.DRAFT
    event.updated_at = datetime.utcnow()
    if event.opportunity_id:
        _sync_linked_opportunity(db, event)
    db.commit()
    return event


def close_registration(db: Session, event_id: uuid.UUID, caller: User) -> Event:
    event = db.get(Event, event_id)
    if not event or event.deleted_at is not None:
        raise FileNotFoundError("Event not found")
    _require_event_manager(db, event, caller)

    event.registration_closes_at = datetime.utcnow()
    event.updated_at = datetime.utcnow()
    db.commit()
    return event


def cancel_event(db: Session, event_id: uuid.UUID, caller: User) -> Event:
    event = db.get(Event, event_id)
    if not event or event.deleted_at is not None:
        raise FileNotFoundError("Event not found")
    _require_event_manager(db, event, caller)

    event.status = EventStatus.CANCELLED
    event.updated_at = datetime.utcnow()

    # Notify all attendees
    registrations = db.scalars(
        select(EventRegistration).where(
            EventRegistration.event_id == event.id,
            EventRegistration.status.in_([RegistrationStatus.REGISTERED, RegistrationStatus.WAITLISTED]),
        )
    ).all()

    email_backend = get_email_backend()
    for reg in registrations:
        notif = Notification(
            user_id=reg.user_id,
            title=f"Event Cancelled: {event.title}",
            body=f"We regret to inform you that '{event.title}' has been cancelled by the organizer.",
            data={"link": f"/events/{event.slug}"},
        )
        db.add(notif)
        if reg.user:
            email_backend.send_notification_email(
                reg.user.email,
                f"Event Cancelled: {event.title}",
                f"The event '{event.title}' scheduled for {event.starts_at} has been cancelled.",
            )

    if event.opportunity_id:
        _sync_linked_opportunity(db, event)

    db.commit()
    return event


def delete_event(db: Session, event_id: uuid.UUID, caller: User) -> None:
    event = db.get(Event, event_id)
    if not event or event.deleted_at is not None:
        raise FileNotFoundError("Event not found")
    _require_event_manager(db, event, caller)

    # Block if registrations exist
    reg_count = db.scalar(
        select(func.count(EventRegistration.id)).where(EventRegistration.event_id == event.id)
    ) or 0
    if reg_count > 0:
        raise ValueError("Cannot delete event with existing registrations. Cancel the event instead.")

    event.deleted_at = datetime.utcnow()
    if event.opportunity_id:
        opp = db.get(Opportunity, event.opportunity_id)
        if opp:
            opp.deleted_at = datetime.utcnow()
    db.commit()


# --- Event Queries ---

def list_public_events(
    db: Session,
    upcoming: bool = True,
    mode: EventMode | None = None,
    q: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[Event], int]:
    now = datetime.utcnow()
    stmt = select(Event).where(
        Event.deleted_at.is_(None),
        Event.status == EventStatus.PUBLISHED,
    )

    if upcoming:
        stmt = stmt.where(Event.ends_at >= now)
        order = Event.starts_at.asc()
    else:
        stmt = stmt.where(Event.ends_at < now)
        order = Event.ends_at.desc()

    if mode:
        stmt = stmt.where(Event.mode == mode)

    if q:
        escaped = q.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        safe_q = f"%{escaped}%"
        stmt = stmt.where(
            or_(Event.title.ilike(safe_q, escape="\\"), Event.tagline.ilike(safe_q, escape="\\"))
        )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.scalar(count_stmt) or 0

    items = db.scalars(
        stmt.options(selectinload(Event.organization))
        .order_by(order)
        .limit(limit)
        .offset(offset)
    ).all()

    # One grouped COUNT for the page instead of loading every registration row of every event.
    counts: dict[uuid.UUID, int] = {}
    if items:
        rows = db.execute(
            select(EventRegistration.event_id, func.count(EventRegistration.id))
            .where(
                EventRegistration.event_id.in_([e.id for e in items]),
                EventRegistration.status.in_([RegistrationStatus.REGISTERED, RegistrationStatus.CHECKED_IN]),
            )
            .group_by(EventRegistration.event_id)
        ).all()
        counts = {event_id: cnt for event_id, cnt in rows}
    for e in items:
        e.active_registration_count = counts.get(e.id, 0)  # transient attribute for the router
    return items, total


def get_public_event_by_slug(
    db: Session,
    slug: str,
    caller: User | None = None,
) -> tuple[Event, dict[str, Any]]:
    event = db.scalar(
        select(Event).where(
            Event.slug == slug,
            Event.deleted_at.is_(None),
            Event.status == EventStatus.PUBLISHED,
        )
    )
    if not event:
        raise FileNotFoundError("Event not found")

    now = datetime.utcnow()
    active_count = db.scalar(
        select(func.count(EventRegistration.id)).where(
            EventRegistration.event_id == event.id,
            EventRegistration.status.in_([RegistrationStatus.REGISTERED, RegistrationStatus.CHECKED_IN]),
        )
    ) or 0

    capacity_remaining = None
    is_full = False
    if event.capacity is not None:
        capacity_remaining = max(0, event.capacity - active_count)
        is_full = active_count >= event.capacity

    # Compute registration state
    user_reg_data = None
    if not caller:
        reg_state = "login_required"
    elif not caller.is_email_verified:
        reg_state = "unverified_email"
    else:
        # Check if caller has registration
        reg = db.scalar(
            select(EventRegistration).where(
                EventRegistration.event_id == event.id,
                EventRegistration.user_id == caller.id,
            )
        )
        if reg:
            reg_state = reg.status.value
            user_reg_data = {
                "id": str(reg.id),
                "status": reg.status.value,
                "registration_code": reg.registration_code,
                "waitlist_position": reg.waitlist_position,
            }
        elif event.status != EventStatus.PUBLISHED or event.ends_at < now:
            reg_state = "ended"
        elif event.registration_opens_at and event.registration_opens_at > now:
            reg_state = "not_open_yet"
        elif event.registration_closes_at and event.registration_closes_at < now:
            reg_state = "closed"
        elif is_full:
            reg_state = "waitlist" if event.waitlist_enabled else "event_full"
        else:
            reg_state = "open"

    meta = {
        "capacity_remaining": capacity_remaining,
        "is_full": is_full,
        "active_count": active_count,
        "registration_state": reg_state,
        "user_registration": user_reg_data,
    }
    return event, meta


# --- Registration & Waitlist ---

def register_for_event(
    db: Session,
    event_id: uuid.UUID,
    user: User,
    answers: dict[str, Any],
) -> EventRegistration:
    if not user.is_email_verified:
        raise PermissionError("Email verification required before registering for events.")

    # Concurrency Lock on event row
    event = db.execute(
        select(Event).where(Event.id == event_id, Event.deleted_at.is_(None)).with_for_update()
    ).scalar_one_or_none()

    if not event:
        raise FileNotFoundError("Event not found")

    if event.status != EventStatus.PUBLISHED:
        raise ValueError(f"Registration is not available (event status: {event.status})")

    now = datetime.utcnow()
    if event.ends_at < now:
        raise ValueError("This event has already ended.")
    if event.registration_opens_at and event.registration_opens_at > now:
        raise ValueError("Registration has not opened yet.")
    if event.registration_closes_at and event.registration_closes_at < now:
        raise ValueError("Registration for this event is closed.")

    # Validate answers against custom questions
    if event.custom_questions:
        _validate_custom_answers(event.custom_questions, answers)

    # Check existing registration
    existing_reg = db.scalar(
        select(EventRegistration).where(
            EventRegistration.event_id == event.id,
            EventRegistration.user_id == user.id,
        )
    )

    if existing_reg:
        if existing_reg.status in [
            RegistrationStatus.REGISTERED,
            RegistrationStatus.WAITLISTED,
            RegistrationStatus.PENDING_APPROVAL,
            RegistrationStatus.CHECKED_IN,
        ]:
            # Idempotent return
            return existing_reg
        # If previously cancelled or rejected, reuse row!
        existing_reg.registration_code = _generate_registration_code()
        existing_reg.qr_nonce = secrets.token_hex(16)
        existing_reg.registered_at = datetime.utcnow()
        existing_reg.cancelled_at = None
        existing_reg.answers = answers
        reg = existing_reg
    else:
        reg = EventRegistration(
            event_id=event.id,
            user_id=user.id,
            registration_code=_generate_registration_code(),
            qr_nonce=secrets.token_hex(16),
            answers=answers,
            registered_at=datetime.utcnow(),
        )
        db.add(reg)

    # Determine status based on capacity & approvals
    if event.requires_approval:
        reg.status = RegistrationStatus.PENDING_APPROVAL
        reg.waitlist_position = None
    elif event.capacity is not None:
        active_count = db.scalar(
            select(func.count(EventRegistration.id)).where(
                EventRegistration.event_id == event.id,
                EventRegistration.status.in_([RegistrationStatus.REGISTERED, RegistrationStatus.CHECKED_IN]),
            )
        ) or 0

        if active_count >= event.capacity:
            if not event.waitlist_enabled:
                raise ValueError("Event is full and waitlist is disabled.")
            # Assign next waitlist position
            max_pos = db.scalar(
                select(func.coalesce(func.max(EventRegistration.waitlist_position), 0)).where(
                    EventRegistration.event_id == event.id,
                    EventRegistration.status == RegistrationStatus.WAITLISTED,
                )
            ) or 0
            reg.status = RegistrationStatus.WAITLISTED
            reg.waitlist_position = max_pos + 1
        else:
            reg.status = RegistrationStatus.REGISTERED
            reg.waitlist_position = None
    else:
        reg.status = RegistrationStatus.REGISTERED
        reg.waitlist_position = None

    db.commit()
    db.refresh(reg)

    # Send confirmation email
    email_backend = get_email_backend()
    settings = get_settings()
    pass_url = f"{settings.FRONTEND_URL}/passes/{reg.id}"
    if reg.status == RegistrationStatus.REGISTERED:
        email_backend.send_notification_email(
            user.email,
            f"Registration Confirmed: {event.title}",
            f"You are confirmed for {event.title}! Access your entry QR pass here: {pass_url}",
        )
    elif reg.status == RegistrationStatus.WAITLISTED:
        email_backend.send_notification_email(
            user.email,
            f"Waitlisted: {event.title}",
            f"You are #{reg.waitlist_position} on the waitlist for {event.title}. We'll notify you automatically if a seat opens up.",
        )

    return reg


def cancel_registration(
    db: Session,
    event_id: uuid.UUID,
    user: User,
) -> EventRegistration:
    # Lock registration and event
    reg = db.execute(
        select(EventRegistration)
        .where(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == user.id,
        )
        .with_for_update()
    ).scalar_one_or_none()

    if not reg or reg.status == RegistrationStatus.CANCELLED:
        raise FileNotFoundError("Active registration not found")

    old_status = reg.status
    reg.status = RegistrationStatus.CANCELLED
    reg.cancelled_at = datetime.utcnow()
    reg.waitlist_position = None

    # If seat was active, promote next waitlisted attendee (FIFO) in the same transaction!
    if old_status in [RegistrationStatus.REGISTERED, RegistrationStatus.CHECKED_IN]:
        first_waitlisted = db.execute(
            select(EventRegistration)
            .where(
                EventRegistration.event_id == event_id,
                EventRegistration.status == RegistrationStatus.WAITLISTED,
            )
            .order_by(EventRegistration.waitlist_position.asc(), EventRegistration.registered_at.asc())
            .limit(1)
            .with_for_update()
        ).scalar_one_or_none()

        if first_waitlisted:
            first_waitlisted.status = RegistrationStatus.REGISTERED
            first_waitlisted.waitlist_position = None
            db.flush()

            # Re-index remaining waitlisted users
            remaining_waitlist = db.scalars(
                select(EventRegistration)
                .where(
                    EventRegistration.event_id == event_id,
                    EventRegistration.id != first_waitlisted.id,
                    EventRegistration.status == RegistrationStatus.WAITLISTED,
                )
                .order_by(EventRegistration.waitlist_position.asc())
            ).all()
            for idx, r in enumerate(remaining_waitlist, start=1):
                r.waitlist_position = idx

            # Notify promoted user
            event = db.get(Event, event_id)
            promoted_user = db.get(User, first_waitlisted.user_id)
            notif = Notification(
                user_id=first_waitlisted.user_id,
                title=f"Promoted to Registered: {event.title}",
                body=f"Great news! A seat opened up and you are now registered for '{event.title}'.",
                data={"link": f"/passes/{first_waitlisted.id}"},
            )
            db.add(notif)
            if promoted_user:
                settings = get_settings()
                pass_url = f"{settings.FRONTEND_URL}/passes/{first_waitlisted.id}"
                get_email_backend().send_notification_email(
                    promoted_user.email,
                    f"Promoted from Waitlist: {event.title}",
                    f"A seat opened up! You are now confirmed for '{event.title}'. Your QR pass is ready: {pass_url}",
                )

    db.commit()
    db.refresh(reg)
    return reg


def approve_registration(db: Session, event_id: uuid.UUID, reg_id: uuid.UUID, caller: User) -> EventRegistration:
    event = db.get(Event, event_id)
    if not event:
        raise FileNotFoundError("Event not found")
    _require_event_manager(db, event, caller)

    reg = db.get(EventRegistration, reg_id)
    if not reg or reg.event_id != event_id:
        raise FileNotFoundError("Registration not found")

    reg.status = RegistrationStatus.REGISTERED
    reg.waitlist_position = None
    db.commit()

    # Notify attendee
    notif = Notification(
        user_id=reg.user_id,
        title=f"Registration Approved: {event.title}",
        body=f"Your registration for '{event.title}' has been approved by the organizer!",
        data={"link": f"/passes/{reg.id}"},
    )
    db.add(notif)
    db.commit()
    return reg


def reject_registration(db: Session, event_id: uuid.UUID, reg_id: uuid.UUID, caller: User) -> EventRegistration:
    event = db.get(Event, event_id)
    if not event:
        raise FileNotFoundError("Event not found")
    _require_event_manager(db, event, caller)

    reg = db.get(EventRegistration, reg_id)
    if not reg or reg.event_id != event_id:
        raise FileNotFoundError("Registration not found")

    reg.status = RegistrationStatus.REJECTED
    reg.waitlist_position = None
    db.commit()
    return reg


# --- QR Pass Operations ---

def get_pass_data(db: Session, reg_id: uuid.UUID, caller: User) -> dict[str, Any]:
    reg = db.get(EventRegistration, reg_id)
    if not reg:
        raise FileNotFoundError("Registration not found")

    # Access control: only attendee or staff
    if reg.user_id != caller.id and caller.role != "admin":
        is_staff = db.scalar(
            select(EventStaff.id).where(
                EventStaff.event_id == reg.event_id,
                EventStaff.user_id == caller.id,
            )
        )
        if not is_staff:
            raise PermissionError("Access denied to this pass")

    # Pass is only valid for registered or checked_in
    if reg.status not in [RegistrationStatus.REGISTERED, RegistrationStatus.CHECKED_IN]:
        raise ValueError(f"Pass is not available for registrations in status '{reg.status.value}'")

    event = db.get(Event, reg.event_id)
    # Token expiration: event ends_at + 24 hours
    exp_ts = int(event.ends_at.timestamp()) + 86400
    token = create_pass_token(reg.id, event.id, reg.qr_nonce, exp_ts)

    attendee_name = reg.user.full_name or reg.user.email if reg.user else "Attendee"

    return {
        "token": token,
        "registration_code": reg.registration_code,
        "qr_nonce": reg.qr_nonce,
        "status": reg.status,
        "event_title": event.title,
        "starts_at": event.starts_at,
        "ends_at": event.ends_at,
        "venue_text": event.venue_text,
        "online_url": event.online_url,
        "attendee_name": attendee_name,
    }


def rotate_pass_nonce(db: Session, reg_id: uuid.UUID, caller: User) -> EventRegistration:
    reg = db.get(EventRegistration, reg_id)
    if not reg:
        raise FileNotFoundError("Registration not found")
    if reg.user_id != caller.id and caller.role != "admin":
        raise PermissionError("Access denied")

    reg.qr_nonce = secrets.token_hex(16)
    db.commit()
    db.refresh(reg)
    return reg


# --- Check-In & Scanner ---

def check_in_attendee(
    db: Session,
    event_id: uuid.UUID,
    token: str | None,
    registration_code: str | None,
    scanner: User,
    ip: str | None = None,
) -> dict[str, Any]:
    event = db.get(Event, event_id)
    if not event:
        raise FileNotFoundError("Event not found")

    # Authorization: scanner must be event_staff, org member, or admin
    _require_checkin_permission(db, event, scanner)

    # 1. Resolve registration ID and validate token or manual code
    reg: EventRegistration | None = None
    if token:
        payload = decode_and_verify_pass_token(token)
        if not payload:
            _log_checkin(db, event_id, None, scanner.id, CheckInResult.INVALID_TOKEN, ip)
            return {
                "result": CheckInResult.INVALID_TOKEN,
                "message": "Invalid or tampered QR pass signature",
            }

        # Check event match
        if payload["eid"] != str(event_id):
            _log_checkin(db, event_id, None, scanner.id, CheckInResult.WRONG_EVENT, ip)
            return {
                "result": CheckInResult.WRONG_EVENT,
                "message": "This QR pass belongs to a different event",
            }

        reg_id = uuid.UUID(payload["rid"])
        reg = db.get(EventRegistration, reg_id)
        if not reg or reg.event_id != event_id:
            _log_checkin(db, event_id, None, scanner.id, CheckInResult.NOT_REGISTERED, ip)
            return {
                "result": CheckInResult.NOT_REGISTERED,
                "message": "Registration record not found",
            }

        # Check nonce rotation
        if reg.qr_nonce != payload["nonce"]:
            _log_checkin(db, event_id, reg.id, scanner.id, CheckInResult.INVALID_TOKEN, ip)
            return {
                "result": CheckInResult.INVALID_TOKEN,
                "message": "This pass was rotated and has been invalidated. Please show the updated pass.",
            }
    elif registration_code:
        code = registration_code.strip().upper()
        reg = db.scalar(
            select(EventRegistration).where(
                EventRegistration.event_id == event_id,
                EventRegistration.registration_code == code,
            )
        )
        if not reg:
            _log_checkin(db, event_id, None, scanner.id, CheckInResult.NOT_REGISTERED, ip)
            return {
                "result": CheckInResult.NOT_REGISTERED,
                "message": f"No attendee found with code {code}",
            }

    # At this point, reg is found. Check status & attempt ATOMIC check-in
    attendee_name = reg.user.full_name if reg.user else "Attendee"
    attendee_email = reg.user.email if reg.user else ""

    if reg.status == RegistrationStatus.CANCELLED:
        _log_checkin(db, event_id, reg.id, scanner.id, CheckInResult.CANCELLED, ip)
        return {
            "result": CheckInResult.CANCELLED,
            "message": "This registration was cancelled.",
            "attendee_name": attendee_name,
            "attendee_email": attendee_email,
            "registration_code": reg.registration_code,
        }

    if reg.status == RegistrationStatus.WAITLISTED:
        _log_checkin(db, event_id, reg.id, scanner.id, CheckInResult.NOT_REGISTERED, ip)
        return {
            "result": CheckInResult.NOT_REGISTERED,
            "message": f"Attendee is on the waitlist (#{reg.waitlist_position}), not registered.",
            "attendee_name": attendee_name,
            "attendee_email": attendee_email,
            "registration_code": reg.registration_code,
        }

    # ATOMIC check-in with UPDATE ... WHERE status='registered'
    now = datetime.utcnow()
    stmt = (
        update(EventRegistration)
        .where(
            EventRegistration.id == reg.id,
            EventRegistration.status == RegistrationStatus.REGISTERED,
        )
        .values(
            status=RegistrationStatus.CHECKED_IN,
            checked_in_at=now,
            checked_in_by_id=scanner.id,
        )
        .returning(EventRegistration.id)
    )
    res = db.execute(stmt).fetchone()

    if res is None:
        # 0 rows updated: duplicate check-in!
        db.refresh(reg)
        _log_checkin(db, event_id, reg.id, scanner.id, CheckInResult.DUPLICATE, ip)
        return {
            "result": CheckInResult.DUPLICATE,
            "message": f"Already checked in at {reg.checked_in_at.strftime('%H:%M:%S UTC') if reg.checked_in_at else 'earlier'}",
            "attendee_name": attendee_name,
            "attendee_email": attendee_email,
            "registration_code": reg.registration_code,
            "status": reg.status,
            "checked_in_at": reg.checked_in_at,
            "answers": reg.answers,
        }

    db.commit()
    db.refresh(reg)
    _log_checkin(db, event_id, reg.id, scanner.id, CheckInResult.SUCCESS, ip)
    return {
        "result": CheckInResult.SUCCESS,
        "message": "Check-in successful! Welcome.",
        "attendee_name": attendee_name,
        "attendee_email": attendee_email,
        "registration_code": reg.registration_code,
        "status": RegistrationStatus.CHECKED_IN,
        "checked_in_at": reg.checked_in_at,
        "answers": reg.answers,
    }


def undo_check_in(db: Session, event_id: uuid.UUID, reg_id: uuid.UUID, caller: User) -> EventRegistration:
    event = db.get(Event, event_id)
    if not event:
        raise FileNotFoundError("Event not found")
    _require_event_manager(db, event, caller)

    reg = db.get(EventRegistration, reg_id)
    if not reg or reg.event_id != event_id:
        raise FileNotFoundError("Registration not found")

    reg.status = RegistrationStatus.REGISTERED
    reg.checked_in_at = None
    reg.checked_in_by_id = None

    audit = AuditLog(
        actor_id=caller.id,
        action="event.check_in_undone",
        entity_type="event_registration",
        entity_id=str(reg.id),
        changes={"event_id": str(event_id)},
    )
    db.add(audit)
    db.commit()
    db.refresh(reg)
    return reg


def _log_checkin(
    db: Session,
    event_id: uuid.UUID,
    reg_id: uuid.UUID | None,
    scanner_id: uuid.UUID,
    result: CheckInResult,
    ip: str | None,
) -> None:
    log = CheckInLog(
        event_id=event_id,
        registration_id=reg_id,
        scanned_by_id=scanner_id,
        result=result,
        ip=ip,
    )
    db.add(log)
    db.commit()


# --- Event Staff & Organizer Tools ---

def add_event_staff(db: Session, event_id: uuid.UUID, email: str, role: EventStaffRole, caller: User) -> EventStaff:
    event = db.get(Event, event_id)
    if not event:
        raise FileNotFoundError("Event not found")
    _require_event_manager(db, event, caller)

    target_user = db.scalar(select(User).where(User.email == email.strip().lower()))
    if not target_user:
        raise ValueError(f"No user registered with email {email}")

    existing = db.scalar(
        select(EventStaff).where(EventStaff.event_id == event_id, EventStaff.user_id == target_user.id)
    )
    if existing:
        existing.role = role
        db.commit()
        return existing

    staff = EventStaff(event_id=event_id, user_id=target_user.id, role=role)
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff


def list_event_staff(db: Session, event_id: uuid.UUID, caller: User) -> list[EventStaff]:
    event = db.get(Event, event_id)
    if not event:
        raise FileNotFoundError("Event not found")
    _require_event_manager(db, event, caller)

    return db.scalars(select(EventStaff).where(EventStaff.event_id == event_id)).all()


def remove_event_staff(db: Session, event_id: uuid.UUID, user_id: uuid.UUID, caller: User) -> None:
    event = db.get(Event, event_id)
    if not event:
        raise FileNotFoundError("Event not found")
    _require_event_manager(db, event, caller)

    db.execute(
        delete(EventStaff).where(EventStaff.event_id == event_id, EventStaff.user_id == user_id)
    )
    db.commit()


def get_event_stats(db: Session, event_id: uuid.UUID, caller: User) -> dict[str, Any]:
    event = db.get(Event, event_id)
    if not event:
        raise FileNotFoundError("Event not found")
    _require_event_manager(db, event, caller)

    counts = dict(
        db.execute(
            select(EventRegistration.status, func.count(EventRegistration.id))
            .where(EventRegistration.event_id == event_id)
            .group_by(EventRegistration.status)
        ).all()
    )

    total_reg = counts.get(RegistrationStatus.REGISTERED, 0)
    total_checked = counts.get(RegistrationStatus.CHECKED_IN, 0)
    total_wait = counts.get(RegistrationStatus.WAITLISTED, 0)
    total_pending = counts.get(RegistrationStatus.PENDING_APPROVAL, 0)
    total_cancelled = counts.get(RegistrationStatus.CANCELLED, 0)

    active_count = total_reg + total_checked
    capacity_remaining = max(0, event.capacity - active_count) if event.capacity is not None else None

    # Checkins by hour (last 24 hours)
    checkins_hourly: dict[str, int] = {}
    logs = db.scalars(
        select(CheckInLog.created_at)
        .where(
            CheckInLog.event_id == event_id,
            CheckInLog.result == CheckInResult.SUCCESS,
        )
        .order_by(CheckInLog.created_at.asc())
    ).all()

    for dt in logs:
        hr_str = dt.strftime("%Y-%m-%d %H:00")
        checkins_hourly[hr_str] = checkins_hourly.get(hr_str, 0) + 1

    return {
        "total_registered": active_count,
        "total_waitlisted": total_wait,
        "total_checked_in": total_checked,
        "total_pending": total_pending,
        "total_cancelled": total_cancelled,
        "capacity": event.capacity,
        "capacity_remaining": capacity_remaining,
        "checkins_by_hour": checkins_hourly,
    }


def export_registrations_csv(db: Session, event_id: uuid.UUID, caller: User) -> str:
    event = db.get(Event, event_id)
    if not event:
        raise FileNotFoundError("Event not found")
    _require_event_manager(db, event, caller)

    regs = db.scalars(
        select(EventRegistration)
        .where(EventRegistration.event_id == event_id)
        .order_by(EventRegistration.registered_at.asc())
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Registration Code",
        "Attendee Name",
        "Attendee Email",
        "Status",
        "Waitlist Position",
        "Registered At",
        "Checked In At",
    ])

    # Neutralize CSV injection: prefix values starting with =, +, -, @ with a single quote '
    def _safe_csv(val: Any) -> str:
        s = str(val or "")
        if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
            return f"'{s}"
        return s

    for r in regs:
        name = r.user.full_name or "" if r.user else ""
        email = r.user.email if r.user else ""
        writer.writerow([
            _safe_csv(r.registration_code),
            _safe_csv(name),
            _safe_csv(email),
            _safe_csv(r.status.value),
            _safe_csv(r.waitlist_position if r.waitlist_position else ""),
            _safe_csv(r.registered_at.isoformat() if r.registered_at else ""),
            _safe_csv(r.checked_in_at.isoformat() if r.checked_in_at else ""),
        ])

    return output.getvalue()


# --- Permissions Helpers ---

def _require_event_manager(db: Session, event: Event, caller: User) -> None:
    if caller.role == "admin":
        return

    # Check organization membership
    is_org_owner_or_editor = db.scalar(
        select(OrganizationMember.id).where(
            OrganizationMember.organization_id == event.organization_id,
            OrganizationMember.user_id == caller.id,
            OrganizationMember.role.in_(["owner", "editor"]),
        )
    )
    if is_org_owner_or_editor:
        return

    # Check event manager staff role
    is_mgr = db.scalar(
        select(EventStaff.id).where(
            EventStaff.event_id == event.id,
            EventStaff.user_id == caller.id,
            EventStaff.role == EventStaffRole.MANAGER,
        )
    )
    if not is_mgr:
        raise PermissionError("Event manager permissions required")


def _require_checkin_permission(db: Session, event: Event, caller: User) -> None:
    if caller.role == "admin":
        return

    # Check organization membership
    is_org_member = db.scalar(
        select(OrganizationMember.id).where(
            OrganizationMember.organization_id == event.organization_id,
            OrganizationMember.user_id == caller.id,
        )
    )
    if is_org_member:
        return

    # Check event staff (scanner or manager) for THIS specific event
    is_staff = db.scalar(
        select(EventStaff.id).where(
            EventStaff.event_id == event.id,
            EventStaff.user_id == caller.id,
        )
    )
    if not is_staff:
        raise PermissionError("Scanner authorization required for this event")
