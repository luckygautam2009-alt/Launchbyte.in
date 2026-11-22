import re
import secrets
import uuid
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.websocket import ws_manager
from app.models.enums import NotificationType
from app.models.networking import (
    Conversation,
    ConversationParticipant,
    ConversationType,
    Team,
    TeamMember,
    TeamMemberRole,
)
from app.models.notifications import Notification
from app.models.users import User
from app.schemas.networking import ConnectionUserBrief, TeamMemberRead, TeamRead


class TeamError(Exception):
    def __init__(self, message: str, code: str = "TEAM_ERROR", status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return slug[:100] or f"team-{secrets.token_hex(4)}"


def create_team(
    db: Session,
    current_user: User,
    name: str,
    slug: str | None = None,
    description: str | None = None,
    avatar_url: str | None = None,
) -> TeamRead:
    final_slug = _slugify(slug or name)

    # Check slug collision
    existing = db.query(Team).filter(Team.slug == final_slug).first()
    if existing:
        final_slug = f"{final_slug[:90]}-{secrets.token_hex(3)}"

    team = Team(
        name=name,
        slug=final_slug,
        description=description,
        avatar_url=avatar_url,
        created_by_id=current_user.id,
    )
    db.add(team)
    db.flush()

    # Add creator as LEADER
    member = TeamMember(
        team_id=team.id,
        user_id=current_user.id,
        role=TeamMemberRole.LEADER,
    )
    db.add(member)

    # Automatically create team conversation and sync participant
    conv = Conversation(
        type=ConversationType.TEAM,
        team_id=team.id,
        title=team.name,
    )
    db.add(conv)
    db.flush()

    part = ConversationParticipant(
        conversation_id=conv.id,
        user_id=current_user.id,
    )
    db.add(part)
    db.commit()
    db.refresh(team)

    return get_team_by_id(db, team.id)


def get_team_by_slug(db: Session, slug: str) -> TeamRead:
    team = db.query(Team).filter(Team.slug == slug).first()
    if not team:
        raise TeamError("Team not found", "NOT_FOUND", 404)
    return get_team_by_id(db, team.id)


def get_team_by_id(db: Session, team_id: uuid.UUID) -> TeamRead:
    team = db.get(Team, team_id)
    if not team:
        raise TeamError("Team not found", "NOT_FOUND", 404)

    members_raw = db.query(TeamMember).filter(TeamMember.team_id == team.id).all()
    members: list[TeamMemberRead] = []
    for m in members_raw:
        u = db.get(User, m.user_id)
        members.append(
            TeamMemberRead(
                id=m.id,
                user_id=m.user_id,
                role=m.role,
                joined_at=m.joined_at,
                user=ConnectionUserBrief.model_validate(u) if u else None,
            )
        )

    conv = db.query(Conversation).filter(Conversation.team_id == team.id).first()

    return TeamRead(
        id=team.id,
        name=team.name,
        slug=team.slug,
        description=team.description,
        avatar_url=team.avatar_url,
        created_by_id=team.created_by_id,
        created_at=team.created_at,
        conversation_id=conv.id if conv else None,
        members=members,
    )


def add_team_member(
    db: Session,
    current_user: User,
    team_id: uuid.UUID,
    user_id: uuid.UUID,
    role: TeamMemberRole = TeamMemberRole.MEMBER,
) -> TeamMemberRead:
    team = db.get(Team, team_id)
    if not team:
        raise TeamError("Team not found", "NOT_FOUND", 404)

    # Permission: must be leader or admin
    caller_member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id,
        TeamMember.role == TeamMemberRole.LEADER,
    ).first()
    if not caller_member and not current_user.is_staff:
        raise TeamError("Only team leaders can add members", "FORBIDDEN", 403)

    target_user = db.get(User, user_id)
    if not target_user or not target_user.is_active:
        raise TeamError("User not found", "USER_NOT_FOUND", 404)

    existing = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user_id,
    ).first()
    if existing:
        raise TeamError("User is already a member of this team", "ALREADY_MEMBER", 409)

    m = TeamMember(team_id=team_id, user_id=user_id, role=role)
    db.add(m)

    # Sync conversation: add to conversation_participants or reactivate left_at
    conv = db.query(Conversation).filter(Conversation.team_id == team_id).first()
    if conv:
        existing_part = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conv.id,
            ConversationParticipant.user_id == user_id,
        ).first()
        if existing_part:
            existing_part.left_at = None
        else:
            part = ConversationParticipant(conversation_id=conv.id, user_id=user_id)
            db.add(part)

    # Notification
    notif = Notification(
        user_id=user_id,
        type=NotificationType.SYSTEM,
        title=f"You were added to team {team.name}",
        body=f"{current_user.full_name or current_user.handle} added you to {team.name}.",
        data={"event": "team_joined", "team_id": str(team.id), "team_slug": team.slug},
    )
    db.add(notif)
    db.commit()
    db.refresh(m)

    return TeamMemberRead(
        id=m.id,
        user_id=m.user_id,
        role=m.role,
        joined_at=m.joined_at,
        user=ConnectionUserBrief.model_validate(target_user),
    )


def remove_team_member(db: Session, current_user: User, team_id: uuid.UUID, user_id: uuid.UUID) -> None:
    team = db.get(Team, team_id)
    if not team:
        raise TeamError("Team not found", "NOT_FOUND", 404)

    caller_leader = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id,
        TeamMember.role == TeamMemberRole.LEADER,
    ).first()
    if not caller_leader and not current_user.is_staff:
        raise TeamError("Only team leaders can remove members", "FORBIDDEN", 403)

    target_member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user_id,
    ).first()
    if not target_member:
        raise TeamError("Member not found in team", "NOT_FOUND", 404)

    db.delete(target_member)

    # Sync conversation: mark left_at and revoke live socket access immediately
    conv = db.query(Conversation).filter(Conversation.team_id == team_id).first()
    if conv:
        part = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conv.id,
            ConversationParticipant.user_id == user_id,
        ).first()
        if part:
            part.left_at = datetime.now(timezone.utc)
            # Revoke over websocket
            try:
                import asyncio
                loop = asyncio.get_running_loop()
                loop.create_task(ws_manager.revoke_user_from_conversation(user_id, conv.id))
            except RuntimeError:
                pass

    db.commit()


def leave_team(db: Session, current_user: User, team_id: uuid.UUID) -> None:
    target_member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id,
    ).first()
    if not target_member:
        raise TeamError("You are not a member of this team", "NOT_FOUND", 404)

    db.delete(target_member)

    conv = db.query(Conversation).filter(Conversation.team_id == team_id).first()
    if conv:
        part = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conv.id,
            ConversationParticipant.user_id == current_user.id,
        ).first()
        if part:
            part.left_at = datetime.now(timezone.utc)
            try:
                import asyncio
                loop = asyncio.get_running_loop()
                loop.create_task(ws_manager.revoke_user_from_conversation(current_user.id, conv.id))
            except RuntimeError:
                pass

    db.commit()
