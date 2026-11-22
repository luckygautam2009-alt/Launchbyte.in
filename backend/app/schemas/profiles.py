import re
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, HttpUrl

HANDLE_REGEX = re.compile(r"^[a-z0-9_-]{3,30}$")
RESERVED_HANDLES = {
    "admin",
    "administrator",
    "mod",
    "moderator",
    "support",
    "help",
    "system",
    "launchbyte",
    "api",
    "auth",
    "teams",
    "events",
    "projects",
    "root",
    "users",
    "me",
    "network",
    "messages",
    "dashboard",
    "settings",
    "null",
    "undefined",
}


class ProfileUpdate(BaseModel):
    handle: Optional[str] = None
    headline: Optional[str] = Field(None, max_length=160)
    bio: Optional[str] = Field(None, max_length=2000)
    location: Optional[str] = Field(None, max_length=255)
    institution: Optional[str] = Field(None, max_length=255)
    field_of_study: Optional[str] = Field(None, max_length=255)
    graduation_year: Optional[int] = Field(None, ge=1950, le=2100)
    skills: Optional[list[str]] = None
    interests: Optional[list[str]] = None
    open_to_teams: Optional[bool] = None
    looking_for_roles: Optional[list[str]] = None
    availability_note: Optional[str] = Field(None, max_length=280)
    is_public: Optional[bool] = None
    show_linkedin: Optional[bool] = None
    show_github: Optional[bool] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    resume_url: Optional[str] = None

    @field_validator("handle")
    @classmethod
    def validate_handle(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v_clean = v.strip().lower()
        if not HANDLE_REGEX.match(v_clean):
            raise ValueError("Handle must be 3-30 characters of lowercase letters, numbers, hyphens, or underscores.")
        if v_clean in RESERVED_HANDLES:
            raise ValueError(f"Handle '{v_clean}' is reserved and cannot be chosen.")
        return v_clean

    @field_validator("skills", "interests", "looking_for_roles")
    @classmethod
    def validate_tags(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is None:
            return None
        if len(v) > 30:
            raise ValueError("Maximum 30 items allowed.")
        cleaned = []
        for item in v:
            c = item.strip().lower()
            if 1 <= len(c) <= 40 and c not in cleaned:
                cleaned.append(c)
        return cleaned

    @field_validator("linkedin_url", "github_url", "portfolio_url", "resume_url")
    @classmethod
    def validate_urls(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        v = v.strip()
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class MyProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    email: str
    handle: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    country_code: Optional[str] = None
    institution: Optional[str] = None
    field_of_study: Optional[str] = None
    graduation_year: Optional[int] = None
    skills: list[str] = []
    interests: list[str] = []
    open_to_teams: bool = False
    looking_for_roles: list[str] = []
    availability_note: Optional[str] = None
    is_public: bool = True
    show_linkedin: bool = True
    show_github: bool = True
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    resume_url: Optional[str] = None
    handle_updated_at: Optional[datetime] = None


class PublicProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    handle: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    institution: Optional[str] = None
    field_of_study: Optional[str] = None
    graduation_year: Optional[int] = None
    skills: list[str] = []
    interests: list[str] = []
    open_to_teams: bool = False
    looking_for_roles: list[str] = []
    availability_note: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
