"""
Pydantic schemas for the applications domain.

Two submission shapes (both validated here):
  * Platform application  — opportunity_id is set
  * External application  — opportunity_id is NULL; custom_title required

Status transitions and event timeline are managed by the service layer;
schemas just define the wire format.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import ApplicationEventType, ApplicationStatus


# ---------- event timeline ----------

class ApplicationEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_type: ApplicationEventType
    from_status: ApplicationStatus | None
    to_status: ApplicationStatus | None
    note: str | None
    occurred_at: datetime


# ---------- list vs detail ----------

class ApplicationListItem(BaseModel):
    """Lightweight row returned by the paginated list — no event history."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    opportunity_id: uuid.UUID | None
    custom_title: str | None
    custom_organization: str | None
    custom_url: str | None
    status: ApplicationStatus
    priority: int
    applied_at: datetime | None
    deadline_at: datetime | None
    reminder_at: datetime | None
    decision_at: datetime | None
    resume_url: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class ApplicationRead(ApplicationListItem):
    """Full detail — includes the event timeline."""

    events: list[ApplicationEventRead]


# ---------- create ----------

class ApplicationCreate(BaseModel):
    """
    Either ``opportunity_id`` (platform) **or** ``custom_title`` (external)
    must be supplied; the model-level CHECK enforces the same rule in the DB.
    """

    opportunity_id: uuid.UUID | None = None

    # External-opportunity fields (ignored when opportunity_id is set)
    custom_title: str | None = Field(None, max_length=255)
    custom_organization: str | None = Field(None, max_length=255)
    custom_url: str | None = Field(None, max_length=1000)

    status: ApplicationStatus = ApplicationStatus.INTERESTED
    priority: int = Field(2, ge=1, le=3)

    applied_at: datetime | None = None
    deadline_at: datetime | None = None
    reminder_at: datetime | None = None
    decision_at: datetime | None = None
    resume_url: str | None = Field(None, max_length=1000)
    notes: str | None = None

    @model_validator(mode="after")
    def _has_target(self):
        if self.opportunity_id is None and not self.custom_title:
            raise ValueError("Either opportunity_id or custom_title must be supplied")
        return self

    @model_validator(mode="after")
    def _url_scheme(self):
        for field in ("custom_url", "resume_url"):
            v = getattr(self, field)
            if v is not None and not v.startswith(("http://", "https://")):
                raise ValueError(f"{field} must start with http:// or https://")
        return self


# ---------- update (partial) ----------

class ApplicationUpdate(BaseModel):
    """
    All fields optional — only supplied fields are changed.
    ``opportunity_id`` and ``user_id`` cannot be reassigned.
    """

    custom_title: str | None = Field(None, max_length=255)
    custom_organization: str | None = Field(None, max_length=255)
    custom_url: str | None = Field(None, max_length=1000)

    status: ApplicationStatus | None = None
    priority: int | None = Field(None, ge=1, le=3)

    applied_at: datetime | None = None
    deadline_at: datetime | None = None
    reminder_at: datetime | None = None
    decision_at: datetime | None = None
    resume_url: str | None = Field(None, max_length=1000)
    notes: str | None = None

    @model_validator(mode="after")
    def _url_scheme(self):
        for field in ("custom_url", "resume_url"):
            v = getattr(self, field)
            if v is not None and not v.startswith(("http://", "https://")):
                raise ValueError(f"{field} must start with http:// or https://")
        return self
