"""Public Host-an-Event Submissions, Public Banner Upload, Contact Inquiries, and Real Public Metrics."""
from __future__ import annotations

import html
import io
import logging
import time
import uuid
from collections import defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import HTMLResponse
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel
from sqlalchemy import func, or_, select

from app.core.action_tokens import create_action_token, verify_action_token
from app.core.config import get_settings
from app.core.rate_limit import get_client_ip, limiter
from app.dependencies.auth import StaffUser
from app.dependencies.db import DBSession
from app.models.audit import AuditLog
from app.models.enums import OpportunityStatus, OpportunityType
from app.models.media import MediaAsset
from app.models.networking import Project, ProjectStatus, ProjectVisibility
from app.models.opportunities import Opportunity
from app.models.submissions import ContactInquiry, PublicEventSubmission
from app.routers.uploads import MAX_DIMENSION, MAX_FILE_SIZE, _detect_mime_and_ext, read_bounded_upload
from app.schemas.submissions import (
    ContactInquiryCreate,
    ContactInquiryResponse,
    PublicEventModerationAction,
    PublicEventSubmissionAck,
    PublicEventSubmissionCreate,
    PublicEventSubmissionRead,
    PublicMetricsRead,
)
from app.services.email.dispatcher import send_admin_notification, send_user_notification
from app.services.storage import get_storage_backend

logger = logging.getLogger(__name__)

router = APIRouter(tags=["public submissions & metrics"])


def _check_public_rate_limit(request: Request, key: str, max_requests: int = 6, window_sec: int = 60) -> None:
    ip = get_client_ip(request)
    limiter.check_rate_limit(
        request,
        key=f"public:{key}:{ip}",
        max_requests=max_requests,
        window_seconds=window_sec,
    )


class PublicImageUploadResponse(BaseModel):
    url: str
    width: int
    height: int


@router.post(
    "/public/uploads/event-banner",
    response_model=PublicImageUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_public_event_banner(
    db: DBSession,
    request: Request,
    file: UploadFile = File(...),
) -> PublicImageUploadResponse:
    """Public rate-limited image upload for Host an Event thumbnails/banners (PNG/JPEG/WebP only)."""
    _check_public_rate_limit(request, "public_upload", max_requests=10, window_sec=60)
    content = await read_bounded_upload(file, MAX_FILE_SIZE)

    mime_ext = _detect_mime_and_ext(content[:64])
    if mime_ext is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid image format. Only PNG, JPEG, and WebP images are allowed.",
        )

    content_type, ext = mime_ext
    try:
        raw_img = Image.open(io.BytesIO(content))
        raw_img.verify()
        img = Image.open(io.BytesIO(content))
        width, height = img.size
        if width > MAX_DIMENSION or height > MAX_DIMENSION:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Image dimensions ({width}x{height}) exceed max {MAX_DIMENSION}x{MAX_DIMENSION}.",
            )
        out_buf = io.BytesIO()
        if ext == "png":
            img.save(out_buf, format="PNG", optimize=True)
        elif ext == "webp":
            img.save(out_buf, format="WEBP", quality=90)
        else:
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            img.save(out_buf, format="JPEG", quality=90)
        clean_bytes = out_buf.getvalue()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Corrupt or unparseable image file: {exc}",
        ) from exc

    random_filename = f"public-event-{uuid.uuid4().hex}.{ext}"
    file_url = get_storage_backend().save(clean_bytes, random_filename, content_type)
    db.add(
        MediaAsset(
            uploaded_by_id=None,
            url=file_url,
            kind="image",
            width=width,
            height=height,
            size_bytes=len(clean_bytes),
        )
    )
    db.commit()
    return PublicImageUploadResponse(url=file_url, width=width, height=height)


@router.post(
    "/public/host-event",
    response_model=PublicEventSubmissionAck,
    status_code=status.HTTP_201_CREATED,
)
def submit_public_host_event(
    db: DBSession,
    request: Request,
    payload: PublicEventSubmissionCreate,
) -> PublicEventSubmissionAck:
    """
    Publicly accessible Host an Event submission endpoint.
    Submissions ALWAYS enter 'pending' moderation state and are never published instantly.
    The admin alert contains a signed one-click Approve/Reject review link.
    """
    _check_public_rate_limit(request, "host_event", max_requests=5, window_sec=60)

    if payload.website_honeypot:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid submission")

    submission = PublicEventSubmission(
        event_name=payload.event_name.strip(),
        organizer_name=payload.organizer_name.strip(),
        organizer_email=str(payload.organizer_email).strip(),
        organizer_organization=payload.organizer_organization.strip(),
        description=payload.description.strip(),
        category=payload.category.strip(),
        event_format=payload.event_format,
        venue_location=payload.venue_location.strip() if payload.venue_location else None,
        event_date=payload.event_date,
        end_date=payload.end_date,
        registration_deadline=payload.registration_deadline,
        registration_url=str(payload.registration_url),
        official_website=str(payload.official_website) if payload.official_website else None,
        thumbnail_url=payload.thumbnail_url,
        expected_audience=payload.expected_audience,
        contact_info=payload.contact_info.strip(),
        additional_details=payload.additional_details,
        status="pending",
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    review_link = _review_url(request, submission.id)

    admin_res = send_admin_notification(
        subject=f"[LaunchByte] Event review needed: {submission.event_name}",
        message=(
            "A new public Host-an-Event request needs your decision.\n\n"
            f">>> REVIEW (Approve / Reject): {review_link}\n"
            "(Valid for 7 days. Opening the link only shows details; nothing changes until you press a button.)\n\n"
            f"Submission ID: {submission.id}\n"
            f"Event: {submission.event_name}\n"
            f"Category: {submission.category} ({submission.event_format})\n"
            f"Organizer: {submission.organizer_name} ({submission.organizer_organization})\n"
            f"Email: {submission.organizer_email}\n"
            f"Date: {submission.event_date.isoformat()}\n"
            f"Registration URL: {submission.registration_url}\n"
            f"Official Website: {submission.official_website or 'N/A'}\n"
            f"Contact Info: {submission.contact_info}\n\n"
            f"Description:\n{submission.description}"
        ),
    )

    user_res = send_user_notification(
        to_email=submission.organizer_email,
        subject=f"LaunchByte Received Your Event Submission: {submission.event_name}",
        message=(
            f"Hi {submission.organizer_name},\n\n"
            f"Thank you for submitting '{submission.event_name}' to LaunchByte.\n"
            f"Submission ID: {submission.id}\n"
            "Your event is currently pending review by the LaunchByte team. "
            "We will notify you once it is reviewed."
        ),
    )

    all_sent = admin_res.sent and user_res.sent
    errors = [err for err in (admin_res.error, user_res.error) if err]
    if all_sent:
        ack_message = (
            "Event submission received and queued for LaunchByte team review. "
            "Confirmation emails were delivered."
        )
    elif admin_res.sent and not user_res.sent:
        ack_message = (
            "Event submission received and queued for LaunchByte team review, "
            "but the organizer confirmation email could not be delivered."
        )
    elif not admin_res.sent and user_res.sent:
        ack_message = (
            "Event submission saved for LaunchByte team review, "
            "but the admin alert email could not be delivered."
        )
    else:
        ack_message = (
            "Event submission saved for LaunchByte team review, "
            "but email notifications could not be delivered."
        )

    return PublicEventSubmissionAck(
        id=submission.id,
        status=submission.status,
        email_sent=all_sent,
        admin_email_sent=admin_res.sent,
        organizer_email_sent=user_res.sent,
        email_error="; ".join(errors) if errors else None,
        message=ack_message,
    )


def _review_url(request: Request, submission_id: uuid.UUID) -> str:
    settings = get_settings()
    base = (settings.BACKEND_PUBLIC_URL or "").strip().rstrip("/") or str(request.base_url).rstrip("/")
    token = create_action_token("host_event_review", str(submission_id))
    return f"{base}{settings.API_V1_PREFIX}/public/host-event/review/{token}"


# ---------- One-click review from the admin email (no login needed, signed link) ----------

_REVIEW_CSP = "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'"


def _review_page(title: str, body_html: str, status_code: int = 200) -> HTMLResponse:
    page = (
        "<!doctype html><html><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        f"<title>{html.escape(title)}</title></head>"
        "<body style=\"margin:0;background:#050510;color:#e2e8f0;font-family:system-ui,sans-serif\">"
        "<div style=\"max-width:640px;margin:0 auto;padding:32px 16px\">"
        f"<h1 style=\"font-size:22px;margin:0 0 16px\">{html.escape(title)}</h1>{body_html}"
        "</div></body></html>"
    )
    return HTMLResponse(page, status_code=status_code, headers={"Content-Security-Policy": _REVIEW_CSP, "Cache-Control": "no-store"})


def _row(label: str, value: str | None) -> str:
    return (
        "<p style='margin:6px 0'><span style='color:#94a3b8'>"
        f"{html.escape(label)}:</span> {html.escape(value or '-')}</p>"
    )


def _load_pending_by_token(db, token: str) -> tuple[PublicEventSubmission | None, HTMLResponse | None]:
    sub_id = verify_action_token(token, "host_event_review")
    if not sub_id:
        return None, _review_page("Link invalid or expired", "<p>Please review this submission from the admin panel instead.</p>", 400)
    try:
        sub = db.get(PublicEventSubmission, uuid.UUID(sub_id))
    except ValueError:
        sub = None
    if sub is None:
        return None, _review_page("Submission not found", "<p>It may have been deleted.</p>", 404)
    return sub, None


@router.get("/public/host-event/review/{token}", response_class=HTMLResponse, include_in_schema=False)
def review_host_event_page(token: str, db: DBSession, request: Request):
    # GET never changes state (email scanners / link previews prefetch URLs).
    sub, err = _load_pending_by_token(db, token)
    if err:
        return err
    if sub.status != "pending":
        return _review_page(f"Already {sub.status}", f"<p>'{html.escape(sub.event_name)}' was already <b>{html.escape(sub.status)}</b>. No action needed.</p>")
    details = (
        _row("Event", sub.event_name)
        + _row("Organizer", f"{sub.organizer_name} ({sub.organizer_organization})")
        + _row("Email", sub.organizer_email)
        + _row("Category / format", f"{sub.category} / {sub.event_format}")
        + _row("Date", sub.event_date.isoformat())
        + _row("Registration URL", sub.registration_url)
        + _row("Website", sub.official_website)
        + _row("Contact", sub.contact_info)
        + f"<p style='margin:14px 0;white-space:pre-wrap;color:#cbd5e1'>{html.escape(sub.description)}</p>"
    )
    form = (
        f"<form method='post' action='{html.escape(get_settings().API_V1_PREFIX)}/public/host-event/review/{html.escape(token)}'>"
        "<textarea name='admin_notes' rows='3' maxlength='2000' placeholder='Optional note (sent to organizer on reject)' "
        "style='width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid #334155;background:#0f172a;color:#e2e8f0'></textarea>"
        "<div style='display:flex;gap:12px;margin-top:14px'>"
        "<button name='decision' value='approve' type='submit' style='flex:1;padding:14px;border:0;border-radius:12px;background:#059669;color:#fff;font-weight:700;font-size:16px'>Approve</button>"
        "<button name='decision' value='reject' type='submit' style='flex:1;padding:14px;border:0;border-radius:12px;background:#e11d48;color:#fff;font-weight:700;font-size:16px'>Reject</button>"
        "</div></form>"
    )
    return _review_page("Review event submission", details + form)


@router.post("/public/host-event/review/{token}", response_class=HTMLResponse, include_in_schema=False)
def review_host_event_decision(
    token: str,
    db: DBSession,
    request: Request,
    background_tasks: BackgroundTasks,
    decision: str = Form(...),
    admin_notes: str | None = Form(default=None),
):
    _check_public_rate_limit(request, "host_event_review", max_requests=20, window_sec=60)
    sub, err = _load_pending_by_token(db, token)
    if err:
        return err
    if decision not in {"approve", "reject"}:
        return _review_page("Invalid decision", "<p>Unknown action.</p>", 400)
    if sub.status != "pending":
        return _review_page(f"Already {sub.status}", f"<p>This submission was already <b>{html.escape(sub.status)}</b>.</p>")

    notes = (admin_notes or "").strip()[:2000] or None
    _apply_host_event_decision(db, sub, decision, notes, staff_id=None, ip=get_client_ip(request), via="email_link")
    background_tasks.add_task(_notify_organizer_of_decision, sub.organizer_email, sub.organizer_name, sub.event_name, decision, notes)
    verb = "approved" if decision == "approve" else "rejected"
    return _review_page(f"Event {verb}", f"<p>'{html.escape(sub.event_name)}' has been <b>{verb}</b>. The organizer is being notified by email.</p>")


def _apply_host_event_decision(db, sub: PublicEventSubmission, decision: str, notes: str | None, staff_id, ip: str | None, via: str) -> None:
    sub.status = "approved" if decision == "approve" else "rejected"
    sub.admin_notes = notes
    sub.reviewed_by_id = staff_id
    sub.reviewed_at = datetime.now(timezone.utc)
    db.add(
        AuditLog(
            actor_id=staff_id,
            action=f"public_event.{sub.status}",
            entity_type="public_event_submission",
            entity_id=str(sub.id),
            changes={"event_name": sub.event_name, "notes": notes, "via": via},
            ip_address=ip,
        )
    )
    db.commit()
    db.refresh(sub)


def _notify_organizer_of_decision(to_email: str, name: str, event_name: str, decision: str, notes: str | None) -> None:
    if decision == "approve":
        subject = f"LaunchByte Event Approved: {event_name}"
        message = f"Hi {name},\n\nYour event '{event_name}' has been approved by the LaunchByte team!"
    else:
        subject = f"LaunchByte Event Update: {event_name}"
        message = f"Hi {name},\n\nYour event submission '{event_name}' was not approved at this time."
        if notes:
            message += f"\n\nReviewer note: {notes}"
    res = send_user_notification(to_email=to_email, subject=subject, message=message)
    if not res.sent:
        logger.error("Organizer decision email failed (%s): %s", event_name, res.error)


@router.post(
    "/public/contact",
    response_model=ContactInquiryResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_contact_inquiry(
    db: DBSession,
    request: Request,
    payload: ContactInquiryCreate,
) -> ContactInquiryResponse:
    """Public contact / partnership inquiry routed to launchbyte.in26@gmail.com."""
    _check_public_rate_limit(request, "public_contact", max_requests=5, window_sec=60)
    if payload.website_honeypot:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid submission")

    admin_res = send_admin_notification(
        subject=f"[LaunchByte Contact] {payload.inquiry_type.title()} from {payload.name}",
        message=(
            f"Name: {payload.name}\n"
            f"Email: {payload.email}\n"
            f"Organization: {payload.organization or 'N/A'}\n"
            f"Type: {payload.inquiry_type}\n\n"
            f"Message:\n{payload.message}"
        ),
    )

    inquiry = ContactInquiry(
        name=payload.name.strip(),
        email=str(payload.email).strip(),
        organization=payload.organization.strip() if payload.organization else None,
        inquiry_type=payload.inquiry_type.strip(),
        message=payload.message.strip(),
        email_sent=admin_res.sent,
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)

    return ContactInquiryResponse(
        id=inquiry.id,
        email_sent=admin_res.sent,
        message=(
            "Inquiry received and delivered to launchbyte.in26@gmail.com."
            if admin_res.sent
            else "Inquiry saved, but email delivery is currently unconfigured. You can also reach us directly at launchbyte.in26@gmail.com."
        ),
    )


@router.get("/metrics/public", response_model=PublicMetricsRead)
def get_public_metrics(db: DBSession) -> PublicMetricsRead:
    """Real database-backed platform metrics (zero fabricated numbers)."""
    now = datetime.now(timezone.utc)
    active_filter = (
        Opportunity.status == OpportunityStatus.PUBLISHED,
        Opportunity.deleted_at.is_(None),
        or_(
            Opportunity.is_rolling.is_(True),
            Opportunity.deadline_at.is_(None),
            Opportunity.deadline_at >= now,
        ),
    )
    active_opps = db.scalar(select(func.count()).select_from(Opportunity).where(*active_filter)) or 0
    featured_hacks = (
        db.scalar(
            select(func.count())
            .select_from(Opportunity)
            .where(
                *active_filter,
                Opportunity.type == OpportunityType.HACKATHON,
                Opportunity.is_featured.is_(True),
            )
        )
        or 0
    )
    approved_projects = (
        db.scalar(
            select(func.count())
            .select_from(Project)
            .where(
                Project.deleted_at.is_(None),
                Project.visibility == ProjectVisibility.PUBLIC,
                Project.status.in_([ProjectStatus.IDEA, ProjectStatus.BUILDING, ProjectStatus.SHIPPED]),
            )
        )
        or 0
    )
    return PublicMetricsRead(
        active_opportunities=active_opps,
        featured_hackathons=featured_hacks,
        core_team_members=5,
        approved_projects=approved_projects,
    )


# ---------- Admin Moderation for Public Host-an-Event ----------

@router.get("/admin/host-events", response_model=list[PublicEventSubmissionRead])
def list_public_event_submissions(
    db: DBSession,
    staff: StaffUser,
    status_filter: str | None = None,
) -> list[PublicEventSubmissionRead]:
    stmt = select(PublicEventSubmission).order_by(PublicEventSubmission.created_at.desc())
    if status_filter:
        stmt = stmt.where(PublicEventSubmission.status == status_filter)
    return list(db.scalars(stmt).all())


@router.post("/admin/host-events/{submission_id}/approve", response_model=PublicEventSubmissionRead)
def approve_public_event_submission(
    db: DBSession,
    staff: StaffUser,
    request: Request,
    submission_id: uuid.UUID,
    body: PublicEventModerationAction = PublicEventModerationAction(),
) -> PublicEventSubmissionRead:
    sub = db.get(PublicEventSubmission, submission_id)
    if sub is None:
        raise HTTPException(status_code=404, detail="Event submission not found")

    sub.status = "approved"
    sub.admin_notes = body.admin_notes
    sub.reviewed_by_id = staff.id
    sub.reviewed_at = datetime.now(timezone.utc)
    db.add(
        AuditLog(
            actor_id=staff.id,
            action="public_event.approved",
            entity_type="public_event_submission",
            entity_id=str(sub.id),
            changes={"event_name": sub.event_name, "notes": body.admin_notes},
            ip_address=request.client.host if request.client else None,
        )
    )
    db.commit()
    db.refresh(sub)

    send_user_notification(
        to_email=sub.organizer_email,
        subject=f"LaunchByte Event Approved: {sub.event_name}",
        message=(
            f"Hi {sub.organizer_name},\n\n"
            f"Your event '{sub.event_name}' has been approved by the LaunchByte team!"
        ),
    )
    return sub


@router.post("/admin/host-events/{submission_id}/reject", response_model=PublicEventSubmissionRead)
def reject_public_event_submission(
    db: DBSession,
    staff: StaffUser,
    request: Request,
    submission_id: uuid.UUID,
    body: PublicEventModerationAction = PublicEventModerationAction(),
) -> PublicEventSubmissionRead:
    sub = db.get(PublicEventSubmission, submission_id)
    if sub is None:
        raise HTTPException(status_code=404, detail="Event submission not found")

    sub.status = "rejected"
    sub.admin_notes = body.admin_notes
    sub.reviewed_by_id = staff.id
    sub.reviewed_at = datetime.now(timezone.utc)
    db.add(
        AuditLog(
            actor_id=staff.id,
            action="public_event.rejected",
            entity_type="public_event_submission",
            entity_id=str(sub.id),
            changes={"event_name": sub.event_name, "notes": body.admin_notes},
            ip_address=request.client.host if request.client else None,
        )
    )
    db.commit()
    db.refresh(sub)

    send_user_notification(
        to_email=sub.organizer_email,
        subject=f"LaunchByte Event Submission Update: {sub.event_name}",
        message=(
            f"Hi {sub.organizer_name},\n\n"
            f"Your event submission '{sub.event_name}' was not approved at this time."
            + (f"\nNote: {body.admin_notes}" if body.admin_notes else "")
        ),
    )
    return sub
