import re
import uuid
from datetime import datetime

import nh3
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator

from app.models.networking import (
    CollabRequestStatus,
    ConnectionStatus,
    ConversationType,
    ProjectMemberRole,
    ProjectStatus,
    ProjectVisibility,
    ReportStatus,
    TeamMemberRole,
)

GITHUB_REPO_REGEX = re.compile(r"^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/?$")


def _validate_github_repo_url(val: str) -> str:
    cleaned = str(val).strip()
    if not GITHUB_REPO_REGEX.match(cleaned):
        raise ValueError("A valid public GitHub repository URL is required (e.g., https://github.com/org/repo)")
    return cleaned.rstrip("/")


def _sanitize_text(val: str | None) -> str | None:
    if val is None:
        return None
    # Strip HTML tags completely from plain text
    return nh3.clean(val.strip(), tags=set())


# ==========================================
# USER & CONNECTION SCHEMAS
# ==========================================


class ConnectionUserBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str | None = None
    handle: str | None = None


class ConnectionRequestCreate(BaseModel):
    handle: str | None = Field(default=None, max_length=50)
    user_id: uuid.UUID | None = None
    message: str | None = Field(default=None, max_length=500)

    @field_validator("message")
    @classmethod
    def clean_message(cls, v: str | None) -> str | None:
        return _sanitize_text(v)


class ConnectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    requester_id: uuid.UUID
    addressee_id: uuid.UUID
    status: ConnectionStatus
    message: str | None = None
    created_at: datetime
    responded_at: datetime | None = None
    other_user: ConnectionUserBrief | None = None


class NetworkSuggestion(BaseModel):
    user: ConnectionUserBrief
    reason: str
    headline: str | None = None
    institution: str | None = None
    skills: list[str] = []


class UserBlockRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    blocker_id: uuid.UUID
    blocked_id: uuid.UUID
    created_at: datetime
    blocked_user: ConnectionUserBrief | None = None


# ==========================================
# CONVERSATIONS & MESSAGING SCHEMAS
# ==========================================


class DirectConversationCreate(BaseModel):
    user_id: uuid.UUID


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)
    client_msg_id: str | None = Field(default=None, max_length=100)

    @field_validator("body")
    @classmethod
    def clean_body(cls, v: str) -> str:
        # Strip dangerous HTML injection; render as plain text
        cleaned = nh3.clean(v.strip(), tags=set())
        if not cleaned:
            raise ValueError("Message body cannot be empty")
        return cleaned


class MessageUpdate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)

    @field_validator("body")
    @classmethod
    def clean_body(cls, v: str) -> str:
        cleaned = nh3.clean(v.strip(), tags=set())
        if not cleaned:
            raise ValueError("Message body cannot be empty")
        return cleaned


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_id: uuid.UUID | None = None
    client_msg_id: str | None = None
    body: str
    created_at: datetime
    edited_at: datetime | None = None
    is_deleted: bool = False
    sender_name: str | None = None
    sender_handle: str | None = None


class ConversationMessagesPage(BaseModel):
    items: list[MessageRead]
    has_more: bool
    next_cursor: str | None = None


class ConversationParticipantRead(BaseModel):
    """Participant shape consumed by the chat UI (frontend `ConversationParticipantRead`)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    user_name: str | None = None
    user_handle: str | None = None
    joined_at: datetime
    muted: bool = False


class ConversationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: ConversationType
    title: str | None = None
    team_id: uuid.UUID | None = None
    team_slug: str | None = None
    created_at: datetime
    updated_at: datetime
    last_message: MessageRead | None = None
    unread_count: int = 0
    other_user: ConnectionUserBrief | None = None
    participants_count: int = 2
    # The chat UI reads `participants` directly; it must always be a list (never missing).
    participants: list[ConversationParticipantRead] = Field(default_factory=list)


class MessageReportCreate(BaseModel):
    reason: str = Field(min_length=3, max_length=500)

    @field_validator("reason")
    @classmethod
    def clean_reason(cls, v: str) -> str:
        return _sanitize_text(v) or v


class MessageReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    message_id: uuid.UUID
    reporter_id: uuid.UUID
    reason: str
    status: ReportStatus
    created_at: datetime
    message_body: str | None = None
    reporter_email: str | None = None


class WSTicketResponse(BaseModel):
    ticket: str
    expires_in: int = 60


# ==========================================
# TEAMS SCHEMAS
# ==========================================


class TeamCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    slug: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    avatar_url: str | None = None

    @field_validator("name", "description")
    @classmethod
    def sanitize(cls, v: str | None) -> str | None:
        return _sanitize_text(v)


class TeamMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    role: TeamMemberRole
    joined_at: datetime
    user: ConnectionUserBrief | None = None


class TeamRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    description: str | None = None
    avatar_url: str | None = None
    created_by_id: uuid.UUID | None = None
    created_at: datetime
    conversation_id: uuid.UUID | None = None
    members: list[TeamMemberRead] = []


# ==========================================
# PROJECTS SCHEMAS
# ==========================================


class ProjectCreate(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    slug: str | None = Field(default=None, max_length=140)
    summary: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=10000)
    repo_url: str = Field(min_length=1, max_length=500)
    demo_url: str | None = Field(default=None, max_length=500)
    tech_stack: list[str] = Field(default_factory=list)
    looking_for: list[str] = Field(default_factory=list)
    status: ProjectStatus = ProjectStatus.IDEA
    visibility: ProjectVisibility = ProjectVisibility.PUBLIC
    team_id: uuid.UUID | None = None

    @field_validator("repo_url")
    @classmethod
    def validate_repo_url(cls, v: str) -> str:
        return _validate_github_repo_url(v)

    @field_validator("demo_url")
    @classmethod
    def validate_demo_url(cls, v: str | None) -> str | None:
        if v:
            v_str = str(v).strip()
            if not (v_str.startswith("http://") or v_str.startswith("https://")):
                raise ValueError("URL must start with http:// or https://")
            return v_str
        return None

    @field_validator("title", "summary")
    @classmethod
    def sanitize(cls, v: str | None) -> str | None:
        return _sanitize_text(v)


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=120)
    summary: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=10000)
    repo_url: str | None = Field(default=None, max_length=500)
    demo_url: str | None = Field(default=None, max_length=500)
    tech_stack: list[str] | None = None
    looking_for: list[str] | None = None
    status: ProjectStatus | None = None
    visibility: ProjectVisibility | None = None

    @field_validator("repo_url")
    @classmethod
    def validate_repo_url(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return _validate_github_repo_url(v)

    @field_validator("demo_url")
    @classmethod
    def validate_demo_url(cls, v: str | None) -> str | None:
        if v:
            v_str = str(v).strip()
            if not (v_str.startswith("http://") or v_str.startswith("https://")):
                raise ValueError("URL must start with http:// or https://")
            return v_str
        return None

    @model_validator(mode="after")
    def prevent_clearing_repo_url(self) -> "ProjectUpdate":
        if "repo_url" in self.model_fields_set and not self.repo_url:
            raise ValueError("repo_url is required and cannot be cleared.")
        return self


class ProjectMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    user_id: uuid.UUID
    role: ProjectMemberRole
    joined_at: datetime
    user: ConnectionUserBrief | None = None


class ProjectCollabRequestCreate(BaseModel):
    message: str | None = Field(default=None, max_length=500)

    @field_validator("message")
    @classmethod
    def sanitize(cls, v: str | None) -> str | None:
        return _sanitize_text(v)


class ProjectCollabRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    user_id: uuid.UUID
    message: str | None = None
    status: CollabRequestStatus
    created_at: datetime
    responded_at: datetime | None = None
    user: ConnectionUserBrief | None = None


class ProjectListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    slug: str
    summary: str | None = None
    repo_url: str | None = None
    demo_url: str | None = None
    tech_stack: list[str] = []
    looking_for: list[str] = []
    status: ProjectStatus
    visibility: ProjectVisibility
    owner_id: uuid.UUID
    created_at: datetime
    owner: ConnectionUserBrief | None = None
    members_count: int = 1


class ProjectDetail(ProjectListItem):
    description: str | None = None
    team_id: uuid.UUID | None = None
    members: list[ProjectMemberRead] = []
    collab_requests: list[ProjectCollabRequestRead] = []
