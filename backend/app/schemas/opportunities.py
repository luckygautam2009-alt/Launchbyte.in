import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.enums import (
    CompensationType,
    LocationType,
    OpportunityStatus,
    OpportunityType,
    VerificationStatus,
)


class OrganizationBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    slug: str
    verification_status: VerificationStatus


class TagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: str
    slug: str


class OpportunityListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    slug: str
    title: str
    summary: str | None
    type: OpportunityType
    location_type: LocationType | None
    location_text: str | None
    country_code: str | None
    deadline_at: datetime | None
    is_rolling: bool
    compensation_type: CompensationType
    compensation_min: Decimal | None
    compensation_max: Decimal | None
    compensation_currency: str | None
    compensation_note: str | None
    verification_status: VerificationStatus
    trust_score: int | None
    is_featured: bool
    published_at: datetime | None
    organization: OrganizationBrief
    tags: list[TagRead]


class OpportunityDetail(OpportunityListItem):
    description: str | None
    eligibility: str | None
    requirements: list | None
    application_url: str | None
    starts_at: datetime | None
    ends_at: datetime | None
    view_count: int


class OpportunityAdminRead(OpportunityDetail):
    status: OpportunityStatus
    organization_id: uuid.UUID
    posted_by_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None


class _Checks(BaseModel):
    @field_validator("country_code", check_fields=False)
    @classmethod
    def _country(cls, v):
        if v is None:
            return v
        v = v.strip().upper()
        if len(v) != 2 or not v.isalpha():
            raise ValueError("must be a 2-letter ISO country code")
        return v

    @field_validator("compensation_currency", check_fields=False)
    @classmethod
    def _currency(cls, v):
        if v is None:
            return v
        v = v.strip().upper()
        if len(v) != 3 or not v.isalpha():
            raise ValueError("must be a 3-letter ISO currency code")
        return v

    @field_validator("application_url", check_fields=False)
    @classmethod
    def _url(cls, v):
        if v is None:
            return v
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            raise ValueError("must start with http:// or https://")
        return v


class OpportunityCreate(_Checks):
    organization_id: uuid.UUID
    title: str = Field(min_length=3, max_length=255)
    type: OpportunityType
    summary: str | None = Field(None, max_length=500)
    description: str | None = None
    eligibility: str | None = None
    requirements: list[str] | None = None
    location_type: LocationType | None = None
    location_text: str | None = Field(None, max_length=255)
    country_code: str | None = None
    application_url: str | None = Field(None, max_length=1000)
    deadline_at: datetime | None = None
    is_rolling: bool = False
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    compensation_type: CompensationType = CompensationType.UNSPECIFIED
    compensation_min: Decimal | None = Field(None, ge=0)
    compensation_max: Decimal | None = Field(None, ge=0)
    compensation_currency: str | None = None
    compensation_note: str | None = Field(None, max_length=255)
    is_featured: bool = False
    tags: list[str] = Field(default_factory=list, max_length=15)
    publish: bool = False


class OpportunityUpdate(_Checks):
    organization_id: uuid.UUID | None = None
    title: str | None = Field(None, min_length=3, max_length=255)
    type: OpportunityType | None = None
    summary: str | None = Field(None, max_length=500)
    description: str | None = None
    eligibility: str | None = None
    requirements: list[str] | None = None
    location_type: LocationType | None = None
    location_text: str | None = Field(None, max_length=255)
    country_code: str | None = None
    application_url: str | None = Field(None, max_length=1000)
    deadline_at: datetime | None = None
    is_rolling: bool | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    compensation_type: CompensationType | None = None
    compensation_min: Decimal | None = Field(None, ge=0)
    compensation_max: Decimal | None = Field(None, ge=0)
    compensation_currency: str | None = None
    compensation_note: str | None = Field(None, max_length=255)
    is_featured: bool | None = None
    tags: list[str] | None = Field(None, max_length=15)

    @model_validator(mode="after")
    def _no_null_required(self):
        for f in ("organization_id", "title", "type", "is_rolling", "compensation_type", "is_featured"):
            if f in self.model_fields_set and getattr(self, f) is None:
                raise ValueError(f"{f} cannot be null")
        return self


class OpportunityStatusUpdate(BaseModel):
    status: OpportunityStatus
