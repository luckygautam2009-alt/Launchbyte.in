"""Contributor Opportunity Submission & Draft Management Routes."""
from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field, HttpUrl, field_validator
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.dependencies.auth import ContributorUser
from app.dependencies.db import DBSession
from app.models.audit import AuditLog
from app.models.enums import (
    CompensationType,
    LocationType,
    OpportunityStatus,
    OpportunityType,
)
from app.models.opportunities import Opportunity
from app.models.organizations import Organization
from app.schemas.opportunities import OpportunityAdminRead
from app.services.email.dispatcher import send_admin_notification
from app.services.opportunities.service import _unique_slug

router = APIRouter(prefix="/contributor/opportunities", tags=["contributor: opportunities"])


def _safe_media_or_web_url(v: str | None, allow_mailto: bool = False) -> str | None:
    if not v:
        return None
    cleaned = v.strip()
    prefixes = ("http://", "https://", "/uploads/", "mailto:") if allow_mailto else ("http://", "https://", "/uploads/")
    if not cleaned.startswith(prefixes):
        raise ValueError("Invalid URL scheme.")
    return cleaned


class ContributorOpportunityCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    type: OpportunityType
    organizer_name: str = Field(min_length=2, max_length=255)
    summary: str = Field(min_length=5, max_length=500)
    description: str = Field(min_length=20, max_length=15000)
    eligibility: str | None = Field(default=None, max_length=4000)
    location_type: LocationType = LocationType.REMOTE
    location_text: str | None = Field(default=None, max_length=255)
    thumbnail_url: str | None = Field(default=None, max_length=500)

    registration_opens_at: datetime | None = None
    deadline_at: datetime | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None

    team_size: str | None = Field(default=None, max_length=100)
    compensation_type: CompensationType = CompensationType.UNPAID
    compensation_min: Decimal | None = None
    compensation_max: Decimal | None = None
    compensation_currency: str | None = Field(default="INR", max_length=3)
    compensation_note: str | None = Field(default=None, max_length=255)
    benefits: str | None = Field(default=None, max_length=4000)
    tracks: str | None = Field(default=None, max_length=4000)
    requirements: list[str] | None = None
    additional_instructions: str | None = Field(default=None, max_length=4000)

    official_website: HttpUrl | None = None
    application_url: HttpUrl
    source_url: HttpUrl | None = None
    organizer_contact_url: str | None = Field(default=None, max_length=1000)

    submit_for_review: bool = False

    @field_validator("thumbnail_url")
    @classmethod
    def _val_thumb(cls, v: str | None) -> str | None:
        return _safe_media_or_web_url(v, allow_mailto=False)

    @field_validator("organizer_contact_url")
    @classmethod
    def _val_contact(cls, v: str | None) -> str | None:
        return _safe_media_or_web_url(v, allow_mailto=True)


class ContributorOpportunityUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=255)
    type: OpportunityType | None = None
    organizer_name: str | None = Field(default=None, min_length=2, max_length=255)
    summary: str | None = Field(default=None, min_length=5, max_length=500)
    description: str | None = Field(default=None, min_length=20, max_length=15000)
    eligibility: str | None = Field(default=None, max_length=4000)
    location_type: LocationType | None = None
    location_text: str | None = Field(default=None, max_length=255)
    thumbnail_url: str | None = Field(default=None, max_length=500)
    registration_opens_at: datetime | None = None
    deadline_at: datetime | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    team_size: str | None = Field(default=None, max_length=100)
    compensation_type: CompensationType | None = None
    compensation_note: str | None = Field(default=None, max_length=255)
    benefits: str | None = Field(default=None, max_length=4000)
    tracks: str | None = Field(default=None, max_length=4000)
    requirements: list[str] | None = None
    additional_instructions: str | None = Field(default=None, max_length=4000)
    official_website: HttpUrl | None = None
    application_url: HttpUrl | None = None
    source_url: HttpUrl | None = None
    organizer_contact_url: str | None = Field(default=None, max_length=1000)

    @field_validator("thumbnail_url")
    @classmethod
    def _val_thumb_upd(cls, v: str | None) -> str | None:
        return _safe_media_or_web_url(v, allow_mailto=False)

    @field_validator("organizer_contact_url")
    @classmethod
    def _val_contact_upd(cls, v: str | None) -> str | None:
        return _safe_media_or_web_url(v, allow_mailto=True)


def _get_or_create_default_org(db: DBSession) -> Organization:
    org = db.scalar(select(Organization).where(Organization.slug == "launchbyte-curated"))
    if org is None:
        org = Organization(
            name="LaunchByte Curated",
            slug="launchbyte-curated",
            description="Verified opportunities curated by LaunchByte contributors and admins.",
            website_url="https://launchbyte.io",
        )
        db.add(org)
        db.flush()
    return org


@router.get("", response_model=list[OpportunityAdminRead])
def list_my_submissions(db: DBSession, user: ContributorUser):
    stmt = (
        select(Opportunity)
        .options(selectinload(Opportunity.organization), selectinload(Opportunity.tags))
        .where(Opportunity.posted_by_id == user.id, Opportunity.deleted_at.is_(None))
        .order_by(Opportunity.updated_at.desc())
    )
    return list(db.scalars(stmt).all())


@router.post("", response_model=OpportunityAdminRead, status_code=status.HTTP_201_CREATED)
def create_contributor_opportunity(
    db: DBSession,
    user: ContributorUser,
    request: Request,
    payload: ContributorOpportunityCreate,
):
    """
    Create a draft or submit an opportunity for admin review.
    Contributors CANNOT directly set status to `published`.
    """
    if payload.starts_at and payload.ends_at and payload.ends_at < payload.starts_at:
        raise HTTPException(status_code=422, detail="Event end date cannot be earlier than start date.")

    org = _get_or_create_default_org(db)
    initial_status = (
        OpportunityStatus.PENDING_REVIEW if payload.submit_for_review else OpportunityStatus.DRAFT
    )

    opp = Opportunity(
        organization_id=org.id,
        posted_by_id=user.id,
        title=payload.title.strip(),
        slug=_unique_slug(db, payload.title),
        summary=payload.summary.strip(),
        description=payload.description.strip(),
        eligibility=payload.eligibility,
        requirements=payload.requirements,
        type=payload.type,
        status=initial_status,
        location_type=payload.location_type,
        location_text=payload.location_text,
        application_url=str(payload.application_url),
        official_website=str(payload.official_website) if payload.official_website else None,
        source_url=str(payload.source_url) if payload.source_url else None,
        organizer_contact_url=payload.organizer_contact_url,
        organizer_name_override=payload.organizer_name.strip(),
        thumbnail_url=payload.thumbnail_url,
        registration_opens_at=payload.registration_opens_at,
        deadline_at=payload.deadline_at,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        team_size=payload.team_size,
        compensation_type=payload.compensation_type,
        compensation_min=payload.compensation_min,
        compensation_max=payload.compensation_max,
        compensation_currency=payload.compensation_currency,
        compensation_note=payload.compensation_note,
        benefits=payload.benefits,
        tracks=payload.tracks,
        additional_instructions=payload.additional_instructions,
    )
    db.add(opp)
    db.flush()
    db.add(
        AuditLog(
            actor_id=user.id,
            action="contributor_opportunity.created",
            entity_type="opportunity",
            entity_id=str(opp.id),
            changes={"status": initial_status.value, "title": opp.title},
            ip_address=request.client.host if request.client else None,
        )
    )
    db.commit()

    loaded = db.scalar(
        select(Opportunity)
        .options(selectinload(Opportunity.organization), selectinload(Opportunity.tags))
        .where(Opportunity.id == opp.id)
    )

    if payload.submit_for_review:
        send_admin_notification(
            subject=f"[LaunchByte] New Opportunity Submitted for Review: {opp.title}",
            message=(
                f"Submitted by: {user.full_name or user.email} ({user.email})\n"
                f"Title: {opp.title}\n"
                f"Type: {opp.type.value}\n"
                f"Organizer: {opp.organizer_name_override}\n"
                f"Registration URL: {opp.application_url}\n"
                f"Opportunity ID: {opp.id}\n\n"
                "Please review and approve/publish in Admin Moderation."
            ),
        )

    return loaded


@router.patch("/{opportunity_id}", response_model=OpportunityAdminRead)
def update_contributor_opportunity(
    db: DBSession,
    user: ContributorUser,
    opportunity_id: uuid.UUID,
    payload: ContributorOpportunityUpdate,
):
    opp = db.scalar(
        select(Opportunity)
        .options(selectinload(Opportunity.organization), selectinload(Opportunity.tags))
        .where(Opportunity.id == opportunity_id, Opportunity.deleted_at.is_(None))
    )
    if opp is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    if opp.posted_by_id != user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own submissions")
    if opp.status == OpportunityStatus.PUBLISHED:
        raise HTTPException(
            status_code=403,
            detail="Published opportunities cannot be directly modified by contributors; contact an admin.",
        )

    data = payload.model_dump(exclude_unset=True)
    if "organizer_name" in data:
        opp.organizer_name_override = data.pop("organizer_name")
    for url_field in ("application_url", "official_website", "source_url"):
        if url_field in data and data[url_field] is not None:
            data[url_field] = str(data[url_field])

    for k, v in data.items():
        setattr(opp, k, v)

    db.commit()
    db.refresh(opp)
    return opp


@router.post("/{opportunity_id}/submit", response_model=OpportunityAdminRead)
def submit_contributor_opportunity(
    db: DBSession,
    user: ContributorUser,
    request: Request,
    opportunity_id: uuid.UUID,
):
    opp = db.scalar(
        select(Opportunity)
        .options(selectinload(Opportunity.organization), selectinload(Opportunity.tags))
        .where(Opportunity.id == opportunity_id, Opportunity.deleted_at.is_(None))
    )
    if opp is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    if opp.posted_by_id != user.id:
        raise HTTPException(status_code=403, detail="You can only submit your own drafts")
    if opp.status not in (OpportunityStatus.DRAFT, OpportunityStatus.REJECTED):
        raise HTTPException(status_code=400, detail=f"Cannot submit opportunity in status '{opp.status.value}'")

    opp.status = OpportunityStatus.PENDING_REVIEW
    opp.rejection_reason = None
    db.add(
        AuditLog(
            actor_id=user.id,
            action="contributor_opportunity.submitted",
            entity_type="opportunity",
            entity_id=str(opp.id),
            changes={"title": opp.title},
            ip_address=request.client.host if request.client else None,
        )
    )
    db.commit()
    db.refresh(opp)

    send_admin_notification(
        subject=f"[LaunchByte] Opportunity Submitted for Review: {opp.title}",
        message=(
            f"Submitted by: {user.full_name or user.email} ({user.email})\n"
            f"Title: {opp.title}\n"
            f"Registration URL: {opp.application_url}\n"
            f"Opportunity ID: {opp.id}"
        ),
    )
    return opp
