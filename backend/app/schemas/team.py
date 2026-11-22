import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class TeamMemberBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    designation: str = Field(min_length=1, max_length=255)
    photo_url: str | None = Field(default=None, max_length=1000)
    bio: str | None = None
    linkedin_url: str | None = Field(default=None, max_length=500)
    github_url: str | None = Field(default=None, max_length=500)
    display_order: int = 0
    is_active: bool = True

    @field_validator("photo_url", "linkedin_url", "github_url", mode="before")
    @classmethod
    def _validate_urls(cls, v):
        if v is not None and v != "":
            v = str(v).strip()
            if not (v.startswith("http://") or v.startswith("https://") or v.startswith("/uploads/")):
                raise ValueError("URL must start with http:// or https://")
        return v or None


class TeamMemberCreate(TeamMemberBase):
    pass


class TeamMemberUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    designation: str | None = Field(default=None, min_length=1, max_length=255)
    photo_url: str | None = Field(default=None, max_length=1000)
    bio: str | None = None
    linkedin_url: str | None = Field(default=None, max_length=500)
    github_url: str | None = Field(default=None, max_length=500)
    display_order: int | None = None
    is_active: bool | None = None

    @field_validator("photo_url", "linkedin_url", "github_url", mode="before")
    @classmethod
    def _validate_urls(cls, v):
        if v is not None and v != "":
            v = str(v).strip()
            if not (v.startswith("http://") or v.startswith("https://") or v.startswith("/uploads/")):
                raise ValueError("URL must start with http:// or https://")
        return v or None


class TeamMemberRead(TeamMemberBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class TeamMemberReorderItem(BaseModel):
    id: uuid.UUID
    display_order: int


class TeamMemberReorderRequest(BaseModel):
    orders: list[TeamMemberReorderItem]
