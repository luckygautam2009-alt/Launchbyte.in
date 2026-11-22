import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    false,
    func,
    text,
    true,
)
from sqlalchemy import Uuid as SAUuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.types import JSONType, TimestampMixin, UUIDPrimaryKeyMixin, enum_type

if TYPE_CHECKING:
    from app.models.users import User


# ==========================================
# ENUMS
# ==========================================


class ConnectionStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    CANCELLED = "cancelled"


class ConversationType(str, enum.Enum):
    DIRECT = "direct"
    TEAM = "team"


class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    DISMISSED = "dismissed"
    ACTIONED = "actioned"


class ProjectStatus(str, enum.Enum):
    IDEA = "idea"
    BUILDING = "building"
    SHIPPED = "shipped"
    ARCHIVED = "archived"


class ProjectVisibility(str, enum.Enum):
    PUBLIC = "public"
    CONNECTIONS = "connections"
    PRIVATE = "private"


class ProjectMemberRole(str, enum.Enum):
    OWNER = "owner"
    COLLABORATOR = "collaborator"


class CollabRequestStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class TeamMemberRole(str, enum.Enum):
    LEADER = "leader"
    MEMBER = "member"


class TeamVisibility(str, enum.Enum):
    PUBLIC = "public"
    PRIVATE = "private"


class TeamStatus(str, enum.Enum):
    ACTIVE = "active"
    DISBANDED = "disbanded"


class TeamInviteStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    REVOKED = "revoked"
    EXPIRED = "expired"


class TeamJoinRequestStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


# ==========================================
# CONNECTIONS & BLOCKS
# ==========================================


class Connection(TimestampMixin, UUIDPrimaryKeyMixin, Base):
    """
    Connections between two developers.
    Enforces canonical ordering (min, max) so reverse duplicates cannot exist.
    """

    __tablename__ = "connections"
    __table_args__ = (
        CheckConstraint("requester_id <> addressee_id", name="ck_connection_no_self"),
        Index(
            "uq_connections_canonical_pair",
            sa.text("(CASE WHEN requester_id < addressee_id THEN requester_id ELSE addressee_id END)"),
            sa.text("(CASE WHEN requester_id < addressee_id THEN addressee_id ELSE requester_id END)"),
            unique=True,
        ),
    )

    requester_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    addressee_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[ConnectionStatus] = mapped_column(
        enum_type(ConnectionStatus, "status"),
        default=ConnectionStatus.PENDING,
        nullable=False,
        index=True,
    )
    message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    requester: Mapped["User"] = relationship("User", foreign_keys=[requester_id])
    addressee: Mapped["User"] = relationship("User", foreign_keys=[addressee_id])


class UserBlock(UUIDPrimaryKeyMixin, Base):
    """
    Records when one user blocks another.
    """

    __tablename__ = "user_blocks"
    __table_args__ = (
        CheckConstraint("blocker_id <> blocked_id", name="ck_block_no_self"),
        UniqueConstraint("blocker_id", "blocked_id", name="uq_blocker_blocked"),
    )

    blocker_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    blocked_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    blocker: Mapped["User"] = relationship("User", foreign_keys=[blocker_id])
    blocked: Mapped["User"] = relationship("User", foreign_keys=[blocked_id])


# ==========================================
# TEAMS
# ==========================================


class Team(TimestampMixin, UUIDPrimaryKeyMixin, Base):
    """
    Developer / Hackathon team.
    """

    __tablename__ = "teams"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    event_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("events.id", ondelete="SET NULL"), nullable=True, index=True
    )
    owner_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    visibility: Mapped[TeamVisibility] = mapped_column(
        enum_type(TeamVisibility, "visibility"),
        default=TeamVisibility.PUBLIC,
        server_default=text("'public'"),
        nullable=False,
    )
    accepting_requests: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default=true(), nullable=False
    )
    max_size: Mapped[int] = mapped_column(
        Integer, default=4, server_default=text("4"), nullable=False
    )
    looking_for_skills: Mapped[list | None] = mapped_column(JSONType, nullable=True)
    status: Mapped[TeamStatus] = mapped_column(
        enum_type(TeamStatus, "status"),
        default=TeamStatus.ACTIVE,
        server_default=text("'active'"),
        nullable=False,
        index=True,
    )
    is_locked: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=false(), nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    members: Mapped[list["TeamMember"]] = relationship(
        "TeamMember", back_populates="team", cascade="all, delete-orphan", passive_deletes=True
    )
    conversation: Mapped["Conversation | None"] = relationship(
        "Conversation", back_populates="team", uselist=False, cascade="all, delete-orphan"
    )
    invites: Mapped[list["TeamInvite"]] = relationship(
        "TeamInvite", back_populates="team", cascade="all, delete-orphan", passive_deletes=True
    )
    join_requests: Mapped[list["TeamJoinRequest"]] = relationship(
        "TeamJoinRequest", back_populates="team", cascade="all, delete-orphan", passive_deletes=True
    )


class TeamMember(Base):
    __tablename__ = "team_members"
    __table_args__ = (
        UniqueConstraint("team_id", "user_id", name="uq_team_user"),
        Index(
            "uq_team_members_event_user",
            "event_id",
            "user_id",
            unique=True,
            postgresql_where=sa.text("event_id IS NOT NULL"),
            sqlite_where=sa.text("event_id IS NOT NULL"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    team_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("events.id", ondelete="SET NULL"), nullable=True, index=True
    )
    role: Mapped[TeamMemberRole] = mapped_column(
        enum_type(TeamMemberRole, "role"),
        default=TeamMemberRole.MEMBER,
        nullable=False,
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    team: Mapped["Team"] = relationship("Team", back_populates="members")
    user: Mapped["User"] = relationship("User")


class TeamInvite(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "team_invites"
    __table_args__ = (
        Index(
            "uq_team_invite_pending",
            "team_id",
            "invited_user_id",
            unique=True,
            postgresql_where=sa.text("status = 'pending' AND invited_user_id IS NOT NULL"),
            sqlite_where=sa.text("status = 'pending' AND invited_user_id IS NOT NULL"),
        ),
    )

    team_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True
    )
    invited_user_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    invited_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    invited_by_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    message: Mapped[str | None] = mapped_column(String(280), nullable=True)
    status: Mapped[TeamInviteStatus] = mapped_column(
        enum_type(TeamInviteStatus, "status"),
        default=TeamInviteStatus.PENDING,
        server_default=text("'pending'"),
        nullable=False,
        index=True,
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    team: Mapped["Team"] = relationship("Team", back_populates="invites")
    invited_user: Mapped["User | None"] = relationship("User", foreign_keys=[invited_user_id])
    invited_by: Mapped["User"] = relationship("User", foreign_keys=[invited_by_id])


class TeamJoinRequest(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "team_join_requests"
    __table_args__ = (
        Index(
            "uq_team_join_request_pending",
            "team_id",
            "user_id",
            unique=True,
            postgresql_where=sa.text("status = 'pending'"),
            sqlite_where=sa.text("status = 'pending'"),
        ),
    )

    team_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    message: Mapped[str | None] = mapped_column(String(280), nullable=True)
    status: Mapped[TeamJoinRequestStatus] = mapped_column(
        enum_type(TeamJoinRequestStatus, "status"),
        default=TeamJoinRequestStatus.PENDING,
        server_default=text("'pending'"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    team: Mapped["Team"] = relationship("Team", back_populates="join_requests")
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])


# ==========================================
# CONVERSATIONS & MESSAGING
# ==========================================


class Conversation(TimestampMixin, UUIDPrimaryKeyMixin, Base):
    """
    Chat conversation: direct (1-on-1 between connected/team users) or team.
    Direct conversations enforce canonical uniqueness via (user_a_id, user_b_id).
    """

    __tablename__ = "conversations"
    __table_args__ = (
        UniqueConstraint("user_a_id", "user_b_id", name="uq_direct_conversation_pair"),
    )

    type: Mapped[ConversationType] = mapped_column(
        enum_type(ConversationType, "type"),
        default=ConversationType.DIRECT,
        nullable=False,
        index=True,
    )
    team_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=True, unique=True
    )
    user_a_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    user_b_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    title: Mapped[str | None] = mapped_column(String(120), nullable=True)

    team: Mapped["Team | None"] = relationship("Team", back_populates="conversation")
    participants: Mapped[list["ConversationParticipant"]] = relationship(
        "ConversationParticipant", back_populates="conversation", cascade="all, delete-orphan", passive_deletes=True
    )
    messages: Mapped[list["Message"]] = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan", passive_deletes=True
    )


class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"
    __table_args__ = (
        UniqueConstraint("conversation_id", "user_id", name="uq_conv_participant"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    last_read_message_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), nullable=True
    )
    muted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    left_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="participants")
    user: Mapped["User"] = relationship("User")


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (
        Index("ix_messages_conv_created", "conversation_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sender_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    client_msg_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    body: Mapped[str] = mapped_column(String(2000), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    edited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")
    sender: Mapped["User | None"] = relationship("User")


class MessageReport(Base):
    __tablename__ = "message_reports"
    __table_args__ = (
        UniqueConstraint("message_id", "reporter_id", name="uq_message_reporter"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    message_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reporter_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[ReportStatus] = mapped_column(
        enum_type(ReportStatus, "status"),
        default=ReportStatus.PENDING,
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    message: Mapped["Message"] = relationship("Message")
    reporter: Mapped["User"] = relationship("User", foreign_keys=[reporter_id])
    resolved_by: Mapped["User | None"] = relationship("User", foreign_keys=[resolved_by_id])


# ==========================================
# PROJECTS (COLLABORATION)
# ==========================================


class Project(TimestampMixin, UUIDPrimaryKeyMixin, Base):
    """
    Developer collaboration project.
    """

    __tablename__ = "projects"

    title: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True, nullable=False)
    summary: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    repo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    demo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tech_stack: Mapped[list | None] = mapped_column(JSONType, nullable=True)
    looking_for: Mapped[list | None] = mapped_column(JSONType, nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(
        enum_type(ProjectStatus, "status"),
        default=ProjectStatus.IDEA,
        nullable=False,
        index=True,
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    team_id: Mapped[uuid.UUID | None] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("teams.id", ondelete="SET NULL"), nullable=True
    )
    visibility: Mapped[ProjectVisibility] = mapped_column(
        enum_type(ProjectVisibility, "visibility"),
        default=ProjectVisibility.PUBLIC,
        nullable=False,
        index=True,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    owner: Mapped["User"] = relationship("User", foreign_keys=[owner_id])
    team: Mapped["Team | None"] = relationship("Team")
    members: Mapped[list["ProjectMember"]] = relationship(
        "ProjectMember", back_populates="project", cascade="all, delete-orphan", passive_deletes=True
    )
    collab_requests: Mapped[list["ProjectCollabRequest"]] = relationship(
        "ProjectCollabRequest", back_populates="project", cascade="all, delete-orphan", passive_deletes=True
    )


class ProjectMember(Base):
    __tablename__ = "project_members"
    __table_args__ = (
        UniqueConstraint("project_id", "user_id", name="uq_project_user"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[ProjectMemberRole] = mapped_column(
        enum_type(ProjectMemberRole, "role"),
        default=ProjectMemberRole.COLLABORATOR,
        nullable=False,
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    project: Mapped["Project"] = relationship("Project", back_populates="members")
    user: Mapped["User"] = relationship("User")


class ProjectCollabRequest(Base):
    __tablename__ = "project_collab_requests"
    __table_args__ = (
        Index(
            "uq_pending_collab_request",
            "project_id",
            "user_id",
            unique=True,
            sqlite_where=sa.column("status") == "pending",
            postgresql_where=sa.text("status = 'pending'"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        SAUuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[CollabRequestStatus] = mapped_column(
        enum_type(CollabRequestStatus, "status"),
        default=CollabRequestStatus.PENDING,
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    project: Mapped["Project"] = relationship("Project", back_populates="collab_requests")
    user: Mapped["User"] = relationship("User")
