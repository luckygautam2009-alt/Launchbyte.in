"""Pydantic schemas for Contributor Access, Public Host-an-Event, Contact, and Public Metrics."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator, model_validator


def _validate_safe_media_url(v: str | None) -> str | None:
    if not v:
        return None
    cleaned = v.strip()
    if not cleaned.startswith(("http://", "https://", "/uploads/")):
        raise ValueError("URL must start with http://, https://, or /uploads/")
    return cleaned


# ---------- Contributor Access Requests ----------

class ContributorAccessRequestCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    team_role: str = Field(min_length=2, max_length=120)
    reason: str = Field(min_length=10, max_length=2000)


class ContributorAccessReviewAction(BaseModel):
    review_note: str | None = Field(default=None, max_length=1000)


class ContributorAccessRequestRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    full_name: str
    email: str
    team_role: str
    reason: str
    status: str
    review_note: str | None = None
    reviewed_by_id: uuid.UUID | None = None
    reviewed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ContributorAccessStatusResponse(BaseModel):
    has_access: bool
    role: str
    latest_request: ContributorAccessRequestRead | None = None


# ---------- Public Host an Event ----------

class PublicEventSubmissionCreate(BaseModel):
    event_name: str = Field(min_length=3, max_length=255)
    organizer_name: str = Field(min_length=2, max_length=255)
    organizer_email: EmailStr
    organizer_organization: str = Field(min_length=2, max_length=255)
    description: str = Field(min_length=20, max_length=8000)
    category: str = Field(min_length=2, max_length=80)
    event_format: Literal["online", "offline", "hybrid"]
    venue_location: str | None = Field(default=None, max_length=300)
    event_date: datetime
    end_date: datetime | None = None
    registration_deadline: datetime | None = None
    registration_url: HttpUrl
    official_website: HttpUrl | None = None
    thumbnail_url: str | None = Field(default=None, max_length=500)
    expected_audience: str | None = Field(default=None, max_length=200)
    contact_info: str = Field(min_length=3, max_length=300)
    additional_details: str | None = Field(default=None, max_length=4000)
    # Anti-spam honeypot (must stay empty)
    website_honeypot: str | None = Field(default="", max_length=100)

    @field_validator("thumbnail_url")
    @classmethod
    def validate_thumbnail_url(cls, v: str | None) -> str | None:
        return _validate_safe_media_url(v)

    @model_validator(mode="after")
    def validate_dates_and_venue(self) -> "PublicEventSubmissionCreate":
        if self.end_date and self.end_date < self.event_date:
            raise ValueError("end_date cannot be earlier than event_date")
        if self.registration_deadline and self.registration_deadline > self.event_date:
            raise ValueError("registration_deadline cannot be after event_date")
        if self.event_format in {"offline", "hybrid"} and not (self.venue_location and self.venue_location.strip()):
            raise ValueError("venue_location is required for offline or hybrid events")
        return self


class PublicEventSubmissionRead(BaseModel):
    id: uuid.UUID
    event_name: str
    organizer_name: str
    organizer_email: str
    organizer_organization: str
    description: str
    category: str
    event_format: str
    venue_location: str | None = None
    event_date: datetime
    end_date: datetime | None = None
    registration_deadline: datetime | None = None
    registration_url: str
    official_website: str | None = None
    thumbnail_url: str | None = None
    expected_audience: str | None = None
    contact_info: str
    additional_details: str | None = None
    status: str
    admin_notes: str | None = None
    reviewed_by_id: uuid.UUID | None = None
    reviewed_at: datetime | None = None
    published_event_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PublicEventSubmissionAck(BaseModel):
    id: uuid.UUID
    status: str
    email_sent: bool
    message: str


class PublicEventModerationAction(BaseModel):
    admin_notes: str | None = Field(default=None, max_length=2000)


# ---------- Contact Inquiries ----------

class ContactInquiryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    organization: str | None = Field(default=None, max_length=255)
    inquiry_type: str = Field(default="general", max_length=64)
    message: str = Field(min_length=10, max_length=5000)
    website_honeypot: str | None = Field(default="", max_length=100)


class ContactInquiryResponse(BaseModel):
    id: uuid.UUID
    email_sent: bool
    message: str


# ---------- Public Real Metrics ----------

class PublicMetricsRead(BaseModel):
    active_opportunities: int
    featured_hackathons: int
    core_team_members: int
    approved_projects: int
