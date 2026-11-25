"""
Pydantic schemas for Events, Registrations, QR Passes, and Check-ins.
"""
from __future__ import annotations

import re
import uuid
from datetime import datetime
from typing import Any, Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import nh3
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.events import (
    CheckInResult,
    EventMode,
    EventStaffRole,
    EventStatus,
    RegistrationStatus,
)
from app.schemas.opportunities import OrganizationBrief


def _sanitize_html(text: str | None) -> str | None:
    if not text:
        return text
    # Clean text with nh3 allowing safe markdown elements and enforcing noopener noreferrer on links
    return nh3.clean(
        text,
        tags={
            "p", "b", "i", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6",
            "ul", "ol", "li", "a", "code", "pre", "blockquote", "hr", "br", "span", "table", "thead", "tbody", "tr", "th", "td"
        },
        attributes={
            "a": {"href", "title"},
            "span": {"class"},
            "code": {"class"},
        },
        url_schemes={"http", "https", "mailto"},
        link_rel="noopener noreferrer",
    )


def _validate_url(url: str | None) -> str | None:
    if not url:
        return url
    url = url.strip()
    if not (url.startswith("http://") or url.startswith("https://") or url.startswith("/uploads/")):
        raise ValueError("URL must start with http://, https://, or /uploads/")
    return url


class ScheduleItem(BaseModel):
    time: str = Field(..., max_length=50)
    title: str = Field(..., max_length=150)
    description: str | None = Field(None, max_length=500)


class PrizeItem(BaseModel):
    place: str = Field(..., max_length=100)
    amount: str = Field(..., max_length=100)
    description: str | None = Field(None, max_length=500)


class TrackItem(BaseModel):
    name: str = Field(..., max_length=150)
    description: str = Field(..., max_length=800)
    prize: str | None = Field(None, max_length=150)


class FaqItem(BaseModel):
    question: str = Field(..., max_length=250)
    answer: str = Field(..., max_length=1500)

    @field_validator("answer")
    @classmethod
    def _sanitize_faq(cls, v: str) -> str:
        return _sanitize_html(v) or v


class SponsorItem(BaseModel):
    name: str = Field(..., max_length=150)
    logo_url: str = Field(..., max_length=500)
    link: str | None = Field(None, max_length=500)

    @field_validator("logo_url", "link")
    @classmethod
    def _val_url(cls, v: str | None) -> str | None:
        return _validate_url(v)


class EventSections(BaseModel):
    schedule: list[ScheduleItem] = Field(default_factory=list)
    prizes: list[PrizeItem] = Field(default_factory=list)
    tracks: list[TrackItem] = Field(default_factory=list)
    faqs: list[FaqItem] = Field(default_factory=list)
    sponsors: list[SponsorItem] = Field(default_factory=list)
    rules: str | None = Field(None, max_length=5000)

    @field_validator("rules")
    @classmethod
    def _sanitize_rules(cls, v: str | None) -> str | None:
        return _sanitize_html(v)


class CustomQuestion(BaseModel):
    id: str = Field(..., max_length=50)
    label: str = Field(..., max_length=200)
    type: Literal["text", "select", "checkbox"] = "text"
    options: list[str] = Field(default_factory=list, max_length=20)
    required: bool = False


# --- Request Schemas ---

class EventQuickCreate(BaseModel):
    organization_id: uuid.UUID | None = None
    title: str = Field(..., min_length=3, max_length=200)
    tagline: str | None = Field(None, max_length=300)
    banner_url: str = Field(..., max_length=500)
    thumbnail_url: str = Field(..., max_length=500)
    description: str = Field(..., min_length=10, max_length=20000)

    starts_at: datetime
    ends_at: datetime
    timezone: str = "UTC"

    mode: EventMode = EventMode.ONLINE
    venue_text: str | None = Field(None, max_length=300)
    venue_map_url: str | None = Field(None, max_length=500)
    online_url: str | None = Field(None, max_length=500)

    capacity: int | None = Field(None, ge=0)
    registration_opens_at: datetime | None = None
    registration_closes_at: datetime | None = None

    requires_approval: bool = False
    waitlist_enabled: bool = True

    team_min_size: int = Field(1, ge=1, le=50)
    team_max_size: int | None = Field(None, ge=1, le=50)

    sections: EventSections | dict[str, Any] = Field(default_factory=dict)
    custom_questions: list[CustomQuestion] = Field(default_factory=list)
    theme_accent: str = Field("#6366f1", max_length=20)

    @field_validator("timezone")
    @classmethod
    def _val_tz(cls, v: str) -> str:
        try:
            ZoneInfo(v)
            return v
        except ZoneInfoNotFoundError:
            raise ValueError(f"Invalid IANA timezone: {v}")

    @field_validator("banner_url", "thumbnail_url", "venue_map_url", "online_url")
    @classmethod
    def _val_urls(cls, v: str | None) -> str | None:
        return _validate_url(v)

    @field_validator("description")
    @classmethod
    def _clean_desc(cls, v: str) -> str:
        cleaned = _sanitize_html(v)
        if not cleaned or len(cleaned.strip()) < 10:
            raise ValueError("Description is too short or contains invalid content")
        return cleaned

    @field_validator("sections", mode="before")
    @classmethod
    def _val_sections(cls, v: Any) -> Any:
        if v is None:
            return {}
        if isinstance(v, dict):
            return EventSections.model_validate(v).model_dump()
        return v

    @field_validator("custom_questions")
    @classmethod
    def _val_questions(cls, v: list[CustomQuestion]) -> list[CustomQuestion]:
        if len(v) > 8:
            raise ValueError("Maximum 8 custom questions allowed")
        return v

    @model_validator(mode="after")
    def _val_dates(self) -> "EventQuickCreate":
        if self.starts_at >= self.ends_at:
            raise ValueError("starts_at must be before ends_at")
        if self.registration_closes_at and self.registration_closes_at > self.ends_at:
            raise ValueError("registration_closes_at cannot be after ends_at")
        if (
            self.registration_opens_at
            and self.registration_closes_at
            and self.registration_opens_at >= self.registration_closes_at
        ):
            raise ValueError("registration_opens_at must be before registration_closes_at")
        if self.team_max_size and self.team_max_size < self.team_min_size:
            raise ValueError("team_max_size must be >= team_min_size")
        return self


class EventUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=200)
    tagline: str | None = Field(None, max_length=300)
    banner_url: str | None = Field(None, max_length=500)
    thumbnail_url: str | None = Field(None, max_length=500)
    description: str | None = Field(None, min_length=10, max_length=20000)

    starts_at: datetime | None = None
    ends_at: datetime | None = None
    timezone: str | None = None

    mode: EventMode | None = None
    venue_text: str | None = Field(None, max_length=300)
    venue_map_url: str | None = Field(None, max_length=500)
    online_url: str | None = Field(None, max_length=500)

    capacity: int | None = Field(None, ge=0)
    registration_opens_at: datetime | None = None
    registration_closes_at: datetime | None = None

    requires_approval: bool | None = None
    waitlist_enabled: bool | None = None

    team_min_size: int | None = Field(None, ge=1, le=50)
    team_max_size: int | None = Field(None, ge=1, le=50)

    sections: EventSections | dict[str, Any] | None = None
    custom_questions: list[CustomQuestion] | None = None
    theme_accent: str | None = Field(None, max_length=20)

    @field_validator("timezone")
    @classmethod
    def _val_tz(cls, v: str | None) -> str | None:
        if v is None:
            return v
        try:
            ZoneInfo(v)
            return v
        except ZoneInfoNotFoundError:
            raise ValueError(f"Invalid IANA timezone: {v}")

    @field_validator("banner_url", "thumbnail_url", "venue_map_url", "online_url")
    @classmethod
    def _val_urls(cls, v: str | None) -> str | None:
        return _validate_url(v)

    @field_validator("description")
    @classmethod
    def _clean_desc(cls, v: str | None) -> str | None:
        if v is None:
            return v
        cleaned = _sanitize_html(v)
        if not cleaned or len(cleaned.strip()) < 10:
            raise ValueError("Description is too short or invalid")
        return cleaned

    @field_validator("sections", mode="before")
    @classmethod
    def _val_sections(cls, v: Any) -> Any:
        if v is None:
            return {}
        if isinstance(v, dict):
            return EventSections.model_validate(v).model_dump()
        return v

    @field_validator("custom_questions")
    @classmethod
    def _val_questions(cls, v: list[CustomQuestion] | None) -> list[CustomQuestion] | None:
        if v is not None and len(v) > 8:
            raise ValueError("Maximum 8 custom questions allowed")
        return v


# --- Read Schemas ---

class EventListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    title: str
    tagline: str | None
    banner_url: str
    thumbnail_url: str
    starts_at: datetime
    ends_at: datetime
    timezone: str
    mode: EventMode
    venue_city: str | None = None
    capacity: int | None
    capacity_remaining: int | None = None
    is_full: bool = False
    status: EventStatus
    organization: OrganizationBrief


class EventDetailPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    title: str
    tagline: str | None
    banner_url: str
    thumbnail_url: str
    description: str
    starts_at: datetime
    ends_at: datetime
    timezone: str
    mode: EventMode

    # Public venue reveals general location; detailed venue text or online_url is revealed only if registered/staff
    venue_text: str | None = None
    venue_map_url: str | None = None
    online_url: str | None = None

    capacity: int | None
    capacity_remaining: int | None = None
    registration_opens_at: datetime | None
    registration_closes_at: datetime | None
    requires_approval: bool
    waitlist_enabled: bool
    team_min_size: int
    team_max_size: int | None

    sections: dict[str, Any]
    custom_questions: list[dict[str, Any]]
    theme_accent: str
    status: EventStatus
    published_at: datetime | None
    organization: OrganizationBrief

    # Computed state for the caller
    registration_state: str = "open"  # login_required | unverified_email | open | waitlist | pending_approval | registered | waitlisted | closed | ended
    user_registration: dict[str, Any] | None = None


# --- Registrations Schemas ---

class EventRegisterRequest(BaseModel):
    answers: dict[str, Any] = Field(default_factory=dict)


class RegistrationAttendee(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str | None = None


class EventRegistrationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    user_id: uuid.UUID
    status: RegistrationStatus
    registration_code: str
    waitlist_position: int | None
    registered_at: datetime
    cancelled_at: datetime | None
    checked_in_at: datetime | None
    attendee: RegistrationAttendee | None = None
    event_title: str | None = None
    event_slug: str | None = None
    starts_at: datetime | None = None


class EventRegistrationAdminRead(EventRegistrationRead):
    answers: dict[str, Any] | None = None
    checked_in_by_id: uuid.UUID | None = None


# --- QR Pass & Check-In Schemas ---

class PassTokenRead(BaseModel):
    token: str
    registration_code: str
    qr_nonce: str
    status: RegistrationStatus
    event_title: str
    starts_at: datetime
    ends_at: datetime
    venue_text: str | None = None
    online_url: str | None = None
    attendee_name: str | None = None


class CheckInRequest(BaseModel):
    token: str | None = None
    registration_code: str | None = None

    @model_validator(mode="after")
    def _check_at_least_one(self) -> "CheckInRequest":
        if not self.token and not self.registration_code:
            raise ValueError("Either 'token' or 'registration_code' must be provided")
        return self


class CheckInResponse(BaseModel):
    result: CheckInResult
    message: str
    attendee_name: str | None = None
    attendee_email: str | None = None
    registration_code: str | None = None
    status: RegistrationStatus | None = None
    checked_in_at: datetime | None = None
    answers: dict[str, Any] | None = None


# --- Staff & Stats Schemas ---

class AddStaffRequest(BaseModel):
    email: str
    role: EventStaffRole = EventStaffRole.SCANNER


class StaffRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    email: str
    name: str | None = None
    role: EventStaffRole
    created_at: datetime


class EventStats(BaseModel):
    total_registered: int
    total_waitlisted: int
    total_checked_in: int
    total_pending: int
    total_cancelled: int
    capacity: int | None
    capacity_remaining: int | None
    checkins_by_hour: dict[str, int]
