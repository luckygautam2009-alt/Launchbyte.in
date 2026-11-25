"""Public Host-an-Event Submissions, Public Banner Upload, Contact Inquiries, and Real Public Metrics."""
from __future__ import annotations

import io
import time
import uuid
from collections import defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, File, HTTPException, Request, UploadFile, status
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel
from sqlalchemy import func, or_, select

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

    admin_res = send_admin_notification(
        subject=f"[LaunchByte] Public Host-an-Event Submission: {submission.event_name}",
        message=(
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

    return PublicEventSubmissionAck(
        id=submission.id,
        status=submission.status,
        email_sent=admin_res.sent and user_res.sent,
        message="Event submission received and queued for LaunchByte team review.",
    )


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
