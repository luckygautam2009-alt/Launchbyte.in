import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.networking import (
    TeamInviteStatus,
    TeamJoinRequestStatus,
    TeamMemberRole,
    TeamStatus,
    TeamVisibility,
)


class TeamCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=60)
    slug: Optional[str] = Field(None, min_length=2, max_length=60)
    description: Optional[str] = Field(None, max_length=2000)
    avatar_url: Optional[str] = None
    event_id: Optional[uuid.UUID] = None
    visibility: TeamVisibility = TeamVisibility.PUBLIC
    accepting_requests: bool = True
    max_size: int = Field(4, ge=2, le=10)
    looking_for_skills: list[str] = []

    @field_validator("looking_for_skills")
    @classmethod
    def clean_skills(cls, v: list[str]) -> list[str]:
        cleaned = []
        for s in v:
            c = s.strip().lower()
            if 1 <= len(c) <= 40 and c not in cleaned:
                cleaned.append(c)
        return cleaned[:20]


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=60)
    description: Optional[str] = Field(None, max_length=2000)
    avatar_url: Optional[str] = None
    visibility: Optional[TeamVisibility] = None
    accepting_requests: Optional[bool] = None
    max_size: Optional[int] = Field(None, ge=2, le=10)
    looking_for_skills: Optional[list[str]] = None

    @field_validator("looking_for_skills")
    @classmethod
    def clean_skills(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is None:
            return None
        cleaned = []
        for s in v:
            c = s.strip().lower()
            if 1 <= len(c) <= 40 and c not in cleaned:
                cleaned.append(c)
        return cleaned[:20]


class TeamMemberBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    handle: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: TeamMemberRole
    joined_at: datetime


class TeamDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    event_id: Optional[uuid.UUID] = None
    event_title: Optional[str] = None
    owner_id: Optional[uuid.UUID] = None
    visibility: TeamVisibility
    accepting_requests: bool
    max_size: int
    looking_for_skills: list[str] = []
    status: TeamStatus
    is_locked: bool
    created_at: datetime
    members: list[TeamMemberBrief] = []
    conversation_id: Optional[uuid.UUID] = None
    is_leader: bool = False
    is_member: bool = False
    has_pending_join_request: bool = False
    open_spots: int = 0


class TeamInviteCreate(BaseModel):
    handle: Optional[str] = None
    email: Optional[EmailStr] = None
    message: Optional[str] = Field(None, max_length=280)


class TeamInviteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    team_id: uuid.UUID
    team_name: str
    team_slug: str
    invited_user_id: Optional[uuid.UUID] = None
    invited_handle: Optional[str] = None
    invited_email: Optional[str] = None
    invited_by_name: Optional[str] = None
    message: Optional[str] = None
    status: TeamInviteStatus
    expires_at: datetime
    created_at: datetime


class TeamJoinRequestCreate(BaseModel):
    message: Optional[str] = Field(None, max_length=280)


class TeamJoinRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    team_id: uuid.UUID
    user_id: uuid.UUID
    user_handle: Optional[str] = None
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    user_skills: list[str] = []
    message: Optional[str] = None
    status: TeamJoinRequestStatus
    created_at: datetime


class TeammateCandidateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    handle: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    headline: Optional[str] = None
    institution: Optional[str] = None
    skills: list[str] = []
    looking_for_roles: list[str] = []
    availability_note: Optional[str] = None
    match_score: int = 0
    shared_skills: list[str] = []
