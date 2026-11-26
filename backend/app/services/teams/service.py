import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import String, and_, cast, func, or_, select
from sqlalchemy.orm import Session

from app.core.websocket import ws_manager
from app.models.audit import AuditLog
from app.models.enums import NotificationType
from app.models.events import Event, EventRegistration, EventStatus, RegistrationStatus
from app.models.networking import (
    Conversation,
    ConversationParticipant,
    ConversationType,
    Team,
    TeamInvite,
    TeamInviteStatus,
    TeamJoinRequest,
    TeamJoinRequestStatus,
    TeamMember,
    TeamMemberRole,
    TeamStatus,
    TeamVisibility,
)
from app.models.notifications import Notification
from app.models.profiles import UserProfile
from app.models.users import User
from app.schemas.teams import (
    TeamCreate,
    TeamDetail,
    TeamInviteCreate,
    TeamInviteRead,
    TeamJoinRequestCreate,
    TeamJoinRequestRead,
    TeamMemberBrief,
    TeamUpdate,
    TeammateCandidateRead,
)


class TeamError(Exception):
    def __init__(self, message: str, code: str = "TEAM_ERROR", status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


def _to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


def _slugify(name: str) -> str:
    s = name.strip().lower()
    s = "".join(c if c.isalnum() or c in "-_" else "-" for c in s)
    s = "-".join(filter(None, s.split("-")))
    return s[:50] or f"team-{secrets.token_hex(4)}"


def _notify(db: Session, user_id: uuid.UUID, title: str, body: str, data: dict):
    notif = Notification(
        user_id=user_id,
        type=NotificationType.SYSTEM,
        title=title,
        body=body,
        data=data,
    )
    db.add(notif)


def _hydrate_teams(
    db: Session,
    teams: list[Team],
    current_user: Optional[User] = None,
) -> list[TeamDetail]:
    """Batch-hydrate a list of Team models into TeamDetail objects in O(1) queries (no N+1)."""
    if not teams:
        return []

    team_ids = [t.id for t in teams]
    event_ids = list({t.event_id for t in teams if t.event_id is not None})

    # 1. Batch-load all members + users + profiles
    member_rows = (
        db.query(TeamMember, User, UserProfile)
        .join(User, TeamMember.user_id == User.id)
        .outerjoin(UserProfile, User.id == UserProfile.user_id)
        .filter(TeamMember.team_id.in_(team_ids))
        .order_by(TeamMember.joined_at.asc())
        .all()
    )
    members_by_team: dict[uuid.UUID, list[TeamMemberBrief]] = {tid: [] for tid in team_ids}
    for tm, u, prof in member_rows:
        members_by_team[tm.team_id].append(
            TeamMemberBrief(
                id=tm.id,
                user_id=tm.user_id,
                handle=u.handle,
                full_name=u.full_name,
                avatar_url=prof.avatar_url if prof else None,
                role=tm.role,
                joined_at=tm.joined_at,
            )
        )

    # 2. Batch-load team conversations
    conv_rows = (
        db.query(Conversation.team_id, Conversation.id)
        .filter(Conversation.team_id.in_(team_ids))
        .all()
    )
    conv_by_team: dict[uuid.UUID, uuid.UUID] = {tid: cid for tid, cid in conv_rows if tid is not None}

    # 3. Batch-load event titles
    event_titles: dict[uuid.UUID, str] = {}
    if event_ids:
        ev_rows = db.query(Event.id, Event.title).filter(Event.id.in_(event_ids)).all()
        event_titles = {eid: title for eid, title in ev_rows}

    # 4. Batch-load pending join requests for current_user
    pending_team_ids: set[uuid.UUID] = set()
    if current_user:
        pending_rows = (
            db.query(TeamJoinRequest.team_id)
            .filter(
                TeamJoinRequest.team_id.in_(team_ids),
                TeamJoinRequest.user_id == current_user.id,
                TeamJoinRequest.status == TeamJoinRequestStatus.PENDING,
            )
            .all()
        )
        pending_team_ids = {tid for (tid,) in pending_rows}

    details: list[TeamDetail] = []
    for team in teams:
        brief_members = members_by_team.get(team.id, [])
        is_leader = False
        is_member = False
        if current_user:
            for m in brief_members:
                if m.user_id == current_user.id:
                    is_member = True
                    if m.role == TeamMemberRole.LEADER:
                        is_leader = True
                    break

        has_pending = (team.id in pending_team_ids) if (current_user and not is_member) else False

        details.append(
            TeamDetail(
                id=team.id,
                name=team.name,
                slug=team.slug,
                description=team.description,
                avatar_url=team.avatar_url,
                event_id=team.event_id,
                event_title=event_titles.get(team.event_id) if team.event_id else None,
                owner_id=team.owner_id,
                visibility=team.visibility,
                accepting_requests=team.accepting_requests,
                max_size=team.max_size,
                looking_for_skills=team.looking_for_skills or [],
                status=team.status,
                is_locked=team.is_locked,
                created_at=team.created_at,
                members=brief_members,
                conversation_id=conv_by_team.get(team.id),
                is_leader=is_leader,
                is_member=is_member,
                has_pending_join_request=has_pending,
                open_spots=max(0, team.max_size - len(brief_members)),
            )
        )
    return details


def _to_team_detail(db: Session, team: Team, current_user: Optional[User] = None) -> TeamDetail:
    return _hydrate_teams(db, [team], current_user)[0]


# ==========================================
# 1. TEAM CREATION & LISTING
# ==========================================


def create_team(db: Session, current_user: User, data: TeamCreate) -> TeamDetail:
    if not current_user.is_email_verified:
        raise TeamError("Email verification required to create teams", "EMAIL_NOT_VERIFIED", 400)

    # Active teams limit (max 5)
    active_count = (
        db.query(Team)
        .filter(
            Team.owner_id == current_user.id,
            Team.status == TeamStatus.ACTIVE,
            Team.deleted_at.is_(None),
        )
        .count()
    )
    if active_count >= 5:
        raise TeamError("You can own at most 5 active teams.", "TEAM_LIMIT_REACHED", 400)

    final_max_size = data.max_size

    # Event-scoped team validations
    event_title: Optional[str] = None
    if data.event_id:
        event = db.get(Event, data.event_id)
        if not event or event.deleted_at is not None or event.status != EventStatus.PUBLISHED:
            raise TeamError("Event not found or not published", "EVENT_NOT_FOUND", 404)
        event_title = event.title

        ends_at = _to_utc(event.ends_at)
        if ends_at and ends_at < datetime.now(timezone.utc):
            raise TeamError("Event has already ended", "EVENT_ENDED", 400)

        # Active registration check
        reg = (
            db.query(EventRegistration)
            .filter(
                EventRegistration.event_id == data.event_id,
                EventRegistration.user_id == current_user.id,
                EventRegistration.status.in_([RegistrationStatus.REGISTERED, RegistrationStatus.CHECKED_IN]),
            )
            .first()
        )
        if not reg:
            raise TeamError("You must be registered for this event to create an event team.", "REGISTRATION_REQUIRED", 400)

        # User cannot be in another team for this event
        existing_event_member = (
            db.query(TeamMember)
            .filter(TeamMember.event_id == data.event_id, TeamMember.user_id == current_user.id)
            .first()
        )
        if existing_event_member:
            raise TeamError("You are already in a team for this event.", "ALREADY_IN_EVENT_TEAM", 409)

        if event.team_max_size:
            final_max_size = min(final_max_size, event.team_max_size)

    final_slug = _slugify(data.slug or data.name)
    existing_slug = db.query(Team).filter(Team.slug == final_slug).first()
    if existing_slug:
        final_slug = f"{final_slug[:40]}-{secrets.token_hex(3)}"

    team = Team(
        name=data.name.strip(),
        slug=final_slug,
        description=data.description.strip() if data.description else None,
        avatar_url=data.avatar_url,
        event_id=data.event_id,
        owner_id=current_user.id,
        created_by_id=current_user.id,
        visibility=data.visibility,
        accepting_requests=data.accepting_requests,
        max_size=final_max_size,
        looking_for_skills=data.looking_for_skills,
        status=TeamStatus.ACTIVE,
        is_locked=False,
    )
    db.add(team)
    db.flush()

    # Leader member
    member = TeamMember(
        team_id=team.id,
        user_id=current_user.id,
        event_id=data.event_id,
        role=TeamMemberRole.LEADER,
    )
    db.add(member)

    # Team conversation
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
    db.refresh(member)

    leader_profile = db.get(UserProfile, current_user.id)
    brief_leader = TeamMemberBrief(
        id=member.id,
        user_id=current_user.id,
        handle=current_user.handle,
        full_name=current_user.full_name,
        avatar_url=leader_profile.avatar_url if leader_profile else None,
        role=member.role,
        joined_at=member.joined_at,
    )

    return TeamDetail(
        id=team.id,
        name=team.name,
        slug=team.slug,
        description=team.description,
        avatar_url=team.avatar_url,
        event_id=team.event_id,
        event_title=event_title,
        owner_id=team.owner_id,
        visibility=team.visibility,
        accepting_requests=team.accepting_requests,
        max_size=team.max_size,
        looking_for_skills=team.looking_for_skills or [],
        status=team.status,
        is_locked=team.is_locked,
        created_at=team.created_at,
        members=[brief_leader],
        conversation_id=conv.id,
        is_leader=True,
        is_member=True,
        has_pending_join_request=False,
        open_spots=max(0, team.max_size - 1),
    )


def list_teams(
    db: Session,
    current_user: Optional[User] = None,
    event_id: Optional[uuid.UUID] = None,
    skills: Optional[list[str]] = None,
    has_open_spots: Optional[bool] = None,
    q: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
) -> tuple[list[TeamDetail], int]:
    query = db.query(Team).filter(
        Team.status == TeamStatus.ACTIVE,
        Team.deleted_at.is_(None),
    )

    # Visibility filter: public, OR viewer is member
    if current_user:
        my_team_ids = db.query(TeamMember.team_id).filter(TeamMember.user_id == current_user.id)
        query = query.filter(
            or_(
                Team.visibility == TeamVisibility.PUBLIC,
                Team.id.in_(my_team_ids),
            )
        )
    else:
        query = query.filter(Team.visibility == TeamVisibility.PUBLIC)

    if event_id:
        query = query.filter(Team.event_id == event_id)

    if q and q.strip():
        q_clean = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Team.name).ilike(q_clean),
                func.coalesce(func.lower(Team.description), "").ilike(q_clean),
                cast(Team.looking_for_skills, String).ilike(q_clean),
            )
        )

    parsed_skills: list[str] = []
    if skills:
        for item in skills:
            for part in str(item).split(","):
                part_clean = part.strip().lower()
                if part_clean:
                    parsed_skills.append(part_clean)

    if parsed_skills:
        skill_filters = [
            cast(Team.looking_for_skills, String).ilike(f"%{s}%")
            for s in parsed_skills
        ]
        query = query.filter(or_(*skill_filters))

    # Subquery for open spots filtering
    if has_open_spots:
        member_counts = (
            db.query(TeamMember.team_id, func.count(TeamMember.id).label("cnt"))
            .group_by(TeamMember.team_id)
            .subquery()
        )
        query = query.outerjoin(member_counts, Team.id == member_counts.c.team_id).filter(
            func.coalesce(member_counts.c.cnt, 0) < Team.max_size
        )

    total = query.count()
    teams = (
        query.order_by(Team.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    details = _hydrate_teams(db, teams, current_user)

    # In-memory filter/scoring by skill overlap if requested
    if parsed_skills:
        target_skills = set(parsed_skills)
        details.sort(
            key=lambda d: len(
                target_skills.intersection(
                    set(s.lower() for s in (d.looking_for_skills or []) if isinstance(s, str))
                )
            ),
            reverse=True,
        )

    return details, total


def list_my_teams(db: Session, current_user: User) -> list[TeamDetail]:
    my_teams = (
        db.query(Team)
        .join(TeamMember, Team.id == TeamMember.team_id)
        .filter(
            TeamMember.user_id == current_user.id,
            Team.status == TeamStatus.ACTIVE,
            Team.deleted_at.is_(None),
        )
        .order_by(Team.created_at.desc())
        .all()
    )
    return _hydrate_teams(db, my_teams, current_user)


def get_team_by_slug(db: Session, slug: str, current_user: Optional[User] = None) -> TeamDetail:
    team = (
        db.query(Team)
        .filter(Team.slug == slug.strip(), Team.deleted_at.is_(None))
        .first()
    )
    if not team:
        raise TeamError("Team not found", "NOT_FOUND", 404)

    # Private check
    if team.visibility == TeamVisibility.PRIVATE:
        if not current_user:
            raise TeamError("Team not found", "NOT_FOUND", 404)
        is_member = (
            db.query(TeamMember)
            .filter(TeamMember.team_id == team.id, TeamMember.user_id == current_user.id)
            .first()
            is not None
        )
        if not is_member:
            raise TeamError("Team not found", "NOT_FOUND", 404)

    return _to_team_detail(db, team, current_user)


# ==========================================
# 2. TEAM MANAGEMENT & LIFECYCLE
# ==========================================


def update_team(db: Session, current_user: User, team_id: uuid.UUID, data: TeamUpdate) -> TeamDetail:
    team = db.get(Team, team_id)
    if not team or team.deleted_at is not None:
        raise TeamError("Team not found", "NOT_FOUND", 404)

    # Leader check
    leader = (
        db.query(TeamMember)
        .filter(
            TeamMember.team_id == team.id,
            TeamMember.user_id == current_user.id,
            TeamMember.role == TeamMemberRole.LEADER,
        )
        .first()
    )
    if not leader:
        raise TeamError("Only the team leader can edit team settings", "FORBIDDEN", 403)

    if data.name is not None:
        team.name = data.name.strip()
    if data.description is not None:
        team.description = data.description.strip() if data.description else None
    if data.avatar_url is not None:
        team.avatar_url = data.avatar_url
    if data.visibility is not None:
        team.visibility = data.visibility
    if data.accepting_requests is not None:
        team.accepting_requests = data.accepting_requests
    if data.looking_for_skills is not None:
        team.looking_for_skills = data.looking_for_skills

    if data.max_size is not None:
        current_members = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
        if data.max_size < current_members:
            raise TeamError(f"Cannot reduce max size below current member count ({current_members})", "INVALID_MAX_SIZE", 400)
        team.max_size = data.max_size

    db.commit()
    db.refresh(team)
    return _to_team_detail(db, team, current_user)


def disband_team(db: Session, current_user: User, team_id: uuid.UUID) -> None:
    team = db.get(Team, team_id)
    if not team or team.deleted_at is not None:
        raise TeamError("Team not found", "NOT_FOUND", 404)

    leader = (
        db.query(TeamMember)
        .filter(
            TeamMember.team_id == team.id,
            TeamMember.user_id == current_user.id,
            TeamMember.role == TeamMemberRole.LEADER,
        )
        .first()
    )
    if not leader:
        raise TeamError("Only the team leader can disband the team", "FORBIDDEN", 403)

    team.status = TeamStatus.DISBANDED
    team.deleted_at = datetime.now(timezone.utc)

    # Cancel open invites
    db.query(TeamInvite).filter(
        TeamInvite.team_id == team.id, TeamInvite.status == TeamInviteStatus.PENDING
    ).update({"status": TeamInviteStatus.REVOKED})

    # Cancel open requests
    db.query(TeamJoinRequest).filter(
        TeamJoinRequest.team_id == team.id, TeamJoinRequest.status == TeamJoinRequestStatus.PENDING
    ).update({"status": TeamJoinRequestStatus.REJECTED})

    # Notify members
    members = db.query(TeamMember.user_id).filter(TeamMember.team_id == team.id).all()
    for (m_uid,) in members:
        if m_uid != current_user.id:
            _notify(db, m_uid, f"Team '{team.name}' Disbanded", f"The leader has disbanded {team.name}.", {"team_id": str(team.id)})

    db.commit()


def leave_team(db: Session, current_user: User, team_id: uuid.UUID) -> None:
    team = db.get(Team, team_id)
    if not team or team.deleted_at is not None:
        raise TeamError("Team not found", "NOT_FOUND", 404)

    member = (
        db.query(TeamMember)
        .filter(TeamMember.team_id == team.id, TeamMember.user_id == current_user.id)
        .first()
    )
    if not member:
        raise TeamError("You are not a member of this team", "NOT_A_MEMBER", 400)

    # If leader, cannot leave unless they transfer leadership or disband
    if member.role == TeamMemberRole.LEADER:
        other_members_count = (
            db.query(TeamMember)
            .filter(TeamMember.team_id == team.id, TeamMember.user_id != current_user.id)
            .count()
        )
        if other_members_count > 0:
            raise TeamError(
                "You are the team leader. Please transfer leadership or disband the team before leaving.",
                "LEADER_CANNOT_LEAVE",
                400,
            )
        else:
            # Last member leaving disbands
            team.status = TeamStatus.DISBANDED
            team.deleted_at = datetime.now(timezone.utc)

    db.delete(member)

    # Revoke conversation participant
    conv = db.query(Conversation).filter(Conversation.team_id == team.id).first()
    if conv:
        part = (
            db.query(ConversationParticipant)
            .filter(
                ConversationParticipant.conversation_id == conv.id,
                ConversationParticipant.user_id == current_user.id,
            )
            .first()
        )
        if part:
            part.left_at = datetime.now(timezone.utc)

    db.commit()


def transfer_leadership(
    db: Session, current_user: User, team_id: uuid.UUID, new_leader_id: uuid.UUID
) -> TeamDetail:
    team = db.get(Team, team_id)
    if not team or team.deleted_at is not None:
        raise TeamError("Team not found", "NOT_FOUND", 404)

    current_leader = (
        db.query(TeamMember)
        .filter(
            TeamMember.team_id == team.id,
            TeamMember.user_id == current_user.id,
            TeamMember.role == TeamMemberRole.LEADER,
        )
        .first()
    )
    if not current_leader:
        raise TeamError("Only the current leader can transfer leadership", "FORBIDDEN", 403)

    target_member = (
        db.query(TeamMember)
        .filter(TeamMember.team_id == team.id, TeamMember.user_id == new_leader_id)
        .first()
    )
    if not target_member:
        raise TeamError("Target user is not a member of this team", "NOT_A_MEMBER", 400)

    current_leader.role = TeamMemberRole.MEMBER
    target_member.role = TeamMemberRole.LEADER
    team.owner_id = new_leader_id

    _notify(
        db,
        new_leader_id,
        "Team Leadership Transferred",
        f"You are now the leader of team '{team.name}'.",
        {"team_id": str(team.id)},
    )

    db.commit()
    db.refresh(team)
    return _to_team_detail(db, team, current_user)


def remove_member(
    db: Session, current_user: User, team_id: uuid.UUID, member_id: uuid.UUID
) -> TeamDetail:
    team = db.get(Team, team_id)
    if not team or team.deleted_at is not None:
        raise TeamError("Team not found", "NOT_FOUND", 404)

    leader = (
        db.query(TeamMember)
        .filter(
            TeamMember.team_id == team.id,
            TeamMember.user_id == current_user.id,
            TeamMember.role == TeamMemberRole.LEADER,
        )
        .first()
    )
    if not leader:
        raise TeamError("Only the leader can remove team members", "FORBIDDEN", 403)

    if member_id == current_user.id:
        raise TeamError("Cannot remove yourself. Use leave or disband.", "CANNOT_REMOVE_SELF", 400)

    target = (
        db.query(TeamMember)
        .filter(TeamMember.team_id == team.id, TeamMember.user_id == member_id)
        .first()
    )
    if not target:
        raise TeamError("Member not found in this team", "NOT_FOUND", 404)

    db.delete(target)

    # Revoke chat access
    conv = db.query(Conversation).filter(Conversation.team_id == team.id).first()
    if conv:
        part = (
            db.query(ConversationParticipant)
            .filter(
                ConversationParticipant.conversation_id == conv.id,
                ConversationParticipant.user_id == member_id,
            )
            .first()
        )
        if part:
            part.left_at = datetime.now(timezone.utc)

    _notify(
        db,
        member_id,
        f"Removed from {team.name}",
        f"You have been removed from {team.name}.",
        {"team_id": str(team.id)},
    )

    db.commit()
    db.refresh(team)
    return _to_team_detail(db, team, current_user)


# ==========================================
# 3. INVITES & JOIN REQUESTS (WITH RACES CLOSED)
# ==========================================


def create_invite(
    db: Session, current_user: User, team_id: uuid.UUID, data: TeamInviteCreate
) -> TeamInviteRead:
    team = db.get(Team, team_id)
    if not team or team.deleted_at is not None or team.status != TeamStatus.ACTIVE:
        raise TeamError("Team not found", "NOT_FOUND", 404)

    leader = (
        db.query(TeamMember)
        .filter(
            TeamMember.team_id == team.id,
            TeamMember.user_id == current_user.id,
            TeamMember.role == TeamMemberRole.LEADER,
        )
        .first()
    )
    if not leader:
        raise TeamError("Only the leader can invite members", "FORBIDDEN", 403)

    if team.is_locked:
        raise TeamError("Team is locked for changes", "TEAM_LOCKED", 400)

    # Check capacity
    cur_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
    if cur_count >= team.max_size:
        raise TeamError("Team is already full", "TEAM_FULL", 400)

    # Max 20 pending invites
    pending_count = (
        db.query(TeamInvite)
        .filter(TeamInvite.team_id == team.id, TeamInvite.status == TeamInviteStatus.PENDING)
        .count()
    )
    if pending_count >= 20:
        raise TeamError("Maximum 20 pending invites allowed at a time", "MAX_INVITES_REACHED", 400)

    invited_user: Optional[User] = None
    if data.handle:
        invited_user = (
            db.query(User)
            .filter(User.handle == data.handle.strip().lower(), User.is_active.is_(True))
            .first()
        )
        if not invited_user:
            raise TeamError("User handle not found", "USER_NOT_FOUND", 404)
    elif data.email:
        invited_user = (
            db.query(User)
            .filter(User.email == data.email.strip().lower(), User.is_active.is_(True))
            .first()
        )

    # If user exists: check not already member and not in another team for this event
    if invited_user:
        if invited_user.id == current_user.id:
            raise TeamError("Cannot invite yourself", "CANNOT_INVITE_SELF", 400)

        existing_member = (
            db.query(TeamMember)
            .filter(TeamMember.team_id == team.id, TeamMember.user_id == invited_user.id)
            .first()
        )
        if existing_member:
            raise TeamError("User is already in this team", "ALREADY_MEMBER", 409)

        if team.event_id:
            existing_event = (
                db.query(TeamMember)
                .filter(TeamMember.event_id == team.event_id, TeamMember.user_id == invited_user.id)
                .first()
            )
            if existing_event:
                raise TeamError("User is already in another team for this event", "ALREADY_IN_EVENT_TEAM", 409)

        # Existing pending invite
        existing_inv = (
            db.query(TeamInvite)
            .filter(
                TeamInvite.team_id == team.id,
                TeamInvite.invited_user_id == invited_user.id,
                TeamInvite.status == TeamInviteStatus.PENDING,
            )
            .first()
        )
        if existing_inv:
            raise TeamError("User already has a pending invite to this team", "INVITE_ALREADY_EXISTS", 409)

    invite = TeamInvite(
        team_id=team.id,
        invited_user_id=invited_user.id if invited_user else None,
        invited_email=data.email.strip().lower() if data.email else None,
        invited_by_id=current_user.id,
        token=secrets.token_urlsafe(32),
        message=data.message.strip() if data.message else None,
        status=TeamInviteStatus.PENDING,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    if invited_user:
        _notify(
            db,
            invited_user.id,
            f"Team Invite: {team.name}",
            f"{current_user.full_name or current_user.handle} invited you to join team '{team.name}'.",
            {"team_id": str(team.id), "invite_id": str(invite.id)},
        )
        db.commit()

    return TeamInviteRead(
        id=invite.id,
        team_id=team.id,
        team_name=team.name,
        team_slug=team.slug,
        invited_user_id=invite.invited_user_id,
        invited_handle=invited_user.handle if invited_user else None,
        invited_email=invite.invited_email,
        invited_by_name=current_user.full_name or current_user.handle,
        message=invite.message,
        status=invite.status,
        expires_at=invite.expires_at,
        created_at=invite.created_at,
    )


def list_my_invites(db: Session, current_user: User) -> list[TeamInviteRead]:
    invites = (
        db.query(TeamInvite, Team, User)
        .join(Team, TeamInvite.team_id == Team.id)
        .join(User, TeamInvite.invited_by_id == User.id)
        .filter(
            or_(
                TeamInvite.invited_user_id == current_user.id,
                TeamInvite.invited_email == current_user.email,
            ),
            TeamInvite.status == TeamInviteStatus.PENDING,
            Team.status == TeamStatus.ACTIVE,
            Team.deleted_at.is_(None),
        )
        .order_by(TeamInvite.created_at.desc())
        .all()
    )

    now = datetime.now(timezone.utc)
    res = []
    for inv, t, sender in invites:
        # Check expired
        exp = _to_utc(inv.expires_at)
        if exp and exp < now:
            inv.status = TeamInviteStatus.EXPIRED
            db.commit()
            continue

        res.append(
            TeamInviteRead(
                id=inv.id,
                team_id=t.id,
                team_name=t.name,
                team_slug=t.slug,
                invited_user_id=inv.invited_user_id,
                invited_handle=current_user.handle,
                invited_email=inv.invited_email,
                invited_by_name=sender.full_name or sender.handle,
                message=inv.message,
                status=inv.status,
                expires_at=inv.expires_at,
                created_at=inv.created_at,
            )
        )
    return res


def list_team_invites(db: Session, current_user: User, team_id: uuid.UUID) -> list[TeamInviteRead]:
    team = db.get(Team, team_id)
    if not team or team.deleted_at is not None:
        raise TeamError("Team not found", "NOT_FOUND", 404)

    leader = (
        db.query(TeamMember)
        .filter(
            TeamMember.team_id == team.id,
            TeamMember.user_id == current_user.id,
            TeamMember.role == TeamMemberRole.LEADER,
        )
        .first()
    )
    if not leader:
        raise TeamError("Only the leader can view team invites", "FORBIDDEN", 403)

    invites = (
        db.query(TeamInvite, User)
        .outerjoin(User, TeamInvite.invited_user_id == User.id)
        .filter(
            TeamInvite.team_id == team.id,
            TeamInvite.status == TeamInviteStatus.PENDING,
        )
        .order_by(TeamInvite.created_at.desc())
        .all()
    )

    return [
        TeamInviteRead(
            id=inv.id,
            team_id=team.id,
            team_name=team.name,
            team_slug=team.slug,
            invited_user_id=inv.invited_user_id,
            invited_handle=u.handle if u else None,
            invited_email=inv.invited_email,
            invited_by_name=current_user.full_name or current_user.handle,
            message=inv.message,
            status=inv.status,
            expires_at=inv.expires_at,
            created_at=inv.created_at,
        )
        for inv, u in invites
    ]


def accept_invite(db: Session, current_user: User, invite_id: uuid.UUID) -> TeamDetail:
    """
    Accept invite with SELECT ... FOR UPDATE on the team row to prevent capacity oversell.
    """
    invite = db.get(TeamInvite, invite_id)
    if not invite:
        raise TeamError("Invite not found", "NOT_FOUND", 404)

    if invite.invited_user_id != current_user.id and invite.invited_email != current_user.email:
        raise TeamError("Invite does not belong to you", "FORBIDDEN", 403)

    if invite.status != TeamInviteStatus.PENDING:
        raise TeamError(f"Invite is no longer pending (status: {invite.status})", "INVALID_STATUS", 409)

    exp = _to_utc(invite.expires_at)
    if exp and exp < datetime.now(timezone.utc):
        invite.status = TeamInviteStatus.EXPIRED
        db.commit()
        raise TeamError("Invite has expired", "INVITE_EXPIRED", 409)

    # SELECT FOR UPDATE on Team row
    team = (
        db.query(Team)
        .filter(Team.id == invite.team_id)
        .with_for_update()
        .first()
    )
    if not team or team.deleted_at is not None or team.status != TeamStatus.ACTIVE:
        raise TeamError("Team is no longer active", "TEAM_INACTIVE", 409)

    if team.is_locked:
        raise TeamError("Team is locked for event", "TEAM_LOCKED", 409)

    # Check capacity limit
    current_members = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
    if current_members >= team.max_size:
        raise TeamError("Team is full", "TEAM_FULL", 409)

    # Check event uniqueness: user cannot be in another team for this event
    if team.event_id:
        existing_event_member = (
            db.query(TeamMember)
            .filter(TeamMember.event_id == team.event_id, TeamMember.user_id == current_user.id)
            .first()
        )
        if existing_event_member:
            raise TeamError("You are already in another team for this event.", "ALREADY_IN_EVENT_TEAM", 409)

        # User must have an active registration for event-scoped team
        reg = (
            db.query(EventRegistration)
            .filter(
                EventRegistration.event_id == team.event_id,
                EventRegistration.user_id == current_user.id,
                EventRegistration.status.in_([RegistrationStatus.REGISTERED, RegistrationStatus.CHECKED_IN]),
            )
            .first()
        )
        if not reg:
            raise TeamError("Active registration required for event team", "REGISTRATION_REQUIRED", 409)

    # Add member
    new_member = TeamMember(
        team_id=team.id,
        user_id=current_user.id,
        event_id=team.event_id,
        role=TeamMemberRole.MEMBER,
    )
    db.add(new_member)
    invite.status = TeamInviteStatus.ACCEPTED

    # Sync into team conversation
    conv = db.query(Conversation).filter(Conversation.team_id == team.id).first()
    if conv:
        part = (
            db.query(ConversationParticipant)
            .filter(
                ConversationParticipant.conversation_id == conv.id,
                ConversationParticipant.user_id == current_user.id,
            )
            .first()
        )
        if part:
            part.left_at = None
        else:
            db.add(ConversationParticipant(conversation_id=conv.id, user_id=current_user.id))

    # Close any other pending join requests user had for this team
    db.query(TeamJoinRequest).filter(
        TeamJoinRequest.team_id == team.id,
        TeamJoinRequest.user_id == current_user.id,
        TeamJoinRequest.status == TeamJoinRequestStatus.PENDING,
    ).update({"status": TeamJoinRequestStatus.ACCEPTED})

    # If team is now full, auto-close remaining pending invites and join requests!
    if current_members + 1 >= team.max_size:
        # Auto-expire remaining invites
        db.query(TeamInvite).filter(
            TeamInvite.team_id == team.id, TeamInvite.status == TeamInviteStatus.PENDING
        ).update({"status": TeamInviteStatus.REVOKED})

        # Auto-reject remaining join requests
        pending_reqs = (
            db.query(TeamJoinRequest)
            .filter(
                TeamJoinRequest.team_id == team.id,
                TeamJoinRequest.status == TeamJoinRequestStatus.PENDING,
            )
            .all()
        )
        for pr in pending_reqs:
            pr.status = TeamJoinRequestStatus.REJECTED
            _notify(
                db,
                pr.user_id,
                f"Team Full: {team.name}",
                f"{team.name} has reached maximum capacity and can no longer accept new members.",
                {"team_id": str(team.id)},
            )

    _notify(
        db,
        team.owner_id,
        f"{current_user.full_name or current_user.handle} Joined Team",
        f"{current_user.full_name or current_user.handle} accepted your invite to {team.name}.",
        {"team_id": str(team.id)},
    )

    db.commit()
    db.refresh(team)
    return _to_team_detail(db, team, current_user)


def decline_invite(db: Session, current_user: User, invite_id: uuid.UUID) -> None:
    invite = db.get(TeamInvite, invite_id)
    if not invite:
        raise TeamError("Invite not found", "NOT_FOUND", 404)

    if invite.invited_user_id != current_user.id and invite.invited_email != current_user.email:
        raise TeamError("Invite does not belong to you", "FORBIDDEN", 403)

    invite.status = TeamInviteStatus.DECLINED
    db.commit()


def revoke_invite(db: Session, current_user: User, invite_id: uuid.UUID) -> None:
    invite = db.get(TeamInvite, invite_id)
    if not invite:
        raise TeamError("Invite not found", "NOT_FOUND", 404)

    team = db.get(Team, invite.team_id)
    if not team:
        raise TeamError("Team not found", "NOT_FOUND", 404)

    leader = (
        db.query(TeamMember)
        .filter(
            TeamMember.team_id == team.id,
            TeamMember.user_id == current_user.id,
            TeamMember.role == TeamMemberRole.LEADER,
        )
        .first()
    )
    if not leader:
        raise TeamError("Only the leader can revoke invites", "FORBIDDEN", 403)

    invite.status = TeamInviteStatus.REVOKED
    db.commit()


# ==========================================
# 4. JOIN REQUESTS (WITH RACES CLOSED)
# ==========================================


def create_join_request(
    db: Session, current_user: User, team_id: uuid.UUID, data: TeamJoinRequestCreate
) -> TeamJoinRequestRead:
    if not current_user.is_email_verified:
        raise TeamError("Email verification required to request to join teams", "EMAIL_NOT_VERIFIED", 400)

    team = db.get(Team, team_id)
    if not team or team.deleted_at is not None or team.status != TeamStatus.ACTIVE:
        raise TeamError("Team not found", "NOT_FOUND", 404)

    if team.is_locked:
        raise TeamError("Team is locked for changes", "TEAM_LOCKED", 400)

    if not team.accepting_requests:
        raise TeamError("Team is not currently accepting join requests", "NOT_ACCEPTING", 400)

    current_members = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
    if current_members >= team.max_size:
        raise TeamError("Team is already full", "TEAM_FULL", 400)

    # Check not already member
    existing_member = (
        db.query(TeamMember)
        .filter(TeamMember.team_id == team.id, TeamMember.user_id == current_user.id)
        .first()
    )
    if existing_member:
        raise TeamError("You are already a member of this team", "ALREADY_MEMBER", 409)

    # Check event uniqueness & active registration
    if team.event_id:
        existing_event_member = (
            db.query(TeamMember)
            .filter(TeamMember.event_id == team.event_id, TeamMember.user_id == current_user.id)
            .first()
        )
        if existing_event_member:
            raise TeamError("You are already in another team for this event.", "ALREADY_IN_EVENT_TEAM", 409)

        reg = (
            db.query(EventRegistration)
            .filter(
                EventRegistration.event_id == team.event_id,
                EventRegistration.user_id == current_user.id,
                EventRegistration.status.in_([RegistrationStatus.REGISTERED, RegistrationStatus.CHECKED_IN]),
            )
            .first()
        )
        if not reg:
            raise TeamError("Active event registration required to join event team", "REGISTRATION_REQUIRED", 400)

    # Existing pending request check
    existing_req = (
        db.query(TeamJoinRequest)
        .filter(
            TeamJoinRequest.team_id == team.id,
            TeamJoinRequest.user_id == current_user.id,
            TeamJoinRequest.status == TeamJoinRequestStatus.PENDING,
        )
        .first()
    )
    if existing_req:
        raise TeamError("You already have a pending join request for this team", "REQUEST_ALREADY_EXISTS", 409)

    req = TeamJoinRequest(
        team_id=team.id,
        user_id=current_user.id,
        message=data.message.strip() if data.message else None,
        status=TeamJoinRequestStatus.PENDING,
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    # Notify team leader
    _notify(
        db,
        team.owner_id,
        f"Join Request for {team.name}",
        f"{current_user.full_name or current_user.handle} requested to join {team.name}.",
        {"team_id": str(team.id), "request_id": str(req.id)},
    )
    db.commit()

    prof = db.get(UserProfile, current_user.id)
    return TeamJoinRequestRead(
        id=req.id,
        team_id=team.id,
        user_id=current_user.id,
        user_handle=current_user.handle,
        user_name=current_user.full_name,
        user_avatar=prof.avatar_url if prof else None,
        user_skills=prof.skills or [] if prof else [],
        message=req.message,
        status=req.status,
        created_at=req.created_at,
    )


def list_team_join_requests(
    db: Session, current_user: User, team_id: uuid.UUID
) -> list[TeamJoinRequestRead]:
    team = db.get(Team, team_id)
    if not team or team.deleted_at is not None:
        raise TeamError("Team not found", "NOT_FOUND", 404)

    leader = (
        db.query(TeamMember)
        .filter(
            TeamMember.team_id == team.id,
            TeamMember.user_id == current_user.id,
            TeamMember.role == TeamMemberRole.LEADER,
        )
        .first()
    )
    if not leader:
        raise TeamError("Only the leader can view join requests", "FORBIDDEN", 403)

    reqs = (
        db.query(TeamJoinRequest, User, UserProfile)
        .join(User, TeamJoinRequest.user_id == User.id)
        .outerjoin(UserProfile, User.id == UserProfile.user_id)
        .filter(
            TeamJoinRequest.team_id == team.id,
            TeamJoinRequest.status == TeamJoinRequestStatus.PENDING,
        )
        .order_by(TeamJoinRequest.created_at.desc())
        .all()
    )

    return [
        TeamJoinRequestRead(
            id=r.id,
            team_id=team.id,
            user_id=u.id,
            user_handle=u.handle,
            user_name=u.full_name,
            user_avatar=prof.avatar_url if prof else None,
            user_skills=prof.skills or [] if prof else [],
            message=r.message,
            status=r.status,
            created_at=r.created_at,
        )
        for r, u, prof in reqs
    ]


def accept_join_request(db: Session, current_user: User, request_id: uuid.UUID) -> TeamDetail:
    """
    Accept join request with SELECT ... FOR UPDATE to close races on last seat.
    """
    req = db.get(TeamJoinRequest, request_id)
    if not req:
        raise TeamError("Join request not found", "NOT_FOUND", 404)

    if req.status != TeamJoinRequestStatus.PENDING:
        raise TeamError(f"Request is no longer pending (status: {req.status})", "INVALID_STATUS", 409)

    # SELECT FOR UPDATE on Team row
    team = (
        db.query(Team)
        .filter(Team.id == req.team_id)
        .with_for_update()
        .first()
    )
    if not team or team.deleted_at is not None or team.status != TeamStatus.ACTIVE:
        raise TeamError("Team is no longer active", "TEAM_INACTIVE", 409)

    leader = (
        db.query(TeamMember)
        .filter(
            TeamMember.team_id == team.id,
            TeamMember.user_id == current_user.id,
            TeamMember.role == TeamMemberRole.LEADER,
        )
        .first()
    )
    if not leader:
        raise TeamError("Only the leader can accept join requests", "FORBIDDEN", 403)

    if team.is_locked:
        raise TeamError("Team is locked for event", "TEAM_LOCKED", 409)

    current_members = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
    if current_members >= team.max_size:
        raise TeamError("Team is full", "TEAM_FULL", 409)

    # Check target user not in another team for this event
    if team.event_id:
        existing_event_member = (
            db.query(TeamMember)
            .filter(TeamMember.event_id == team.event_id, TeamMember.user_id == req.user_id)
            .first()
        )
        if existing_event_member:
            req.status = TeamJoinRequestStatus.REJECTED
            db.commit()
            raise TeamError("Applicant is already in another team for this event.", "ALREADY_IN_EVENT_TEAM", 409)

    # Add member
    new_member = TeamMember(
        team_id=team.id,
        user_id=req.user_id,
        event_id=team.event_id,
        role=TeamMemberRole.MEMBER,
    )
    db.add(new_member)
    req.status = TeamJoinRequestStatus.ACCEPTED

    # Sync into team conversation
    conv = db.query(Conversation).filter(Conversation.team_id == team.id).first()
    if conv:
        part = (
            db.query(ConversationParticipant)
            .filter(
                ConversationParticipant.conversation_id == conv.id,
                ConversationParticipant.user_id == req.user_id,
            )
            .first()
        )
        if part:
            part.left_at = None
        else:
            db.add(ConversationParticipant(conversation_id=conv.id, user_id=req.user_id))

    # Also accept any pending invite that was out for this user
    db.query(TeamInvite).filter(
        TeamInvite.team_id == team.id,
        TeamInvite.invited_user_id == req.user_id,
        TeamInvite.status == TeamInviteStatus.PENDING,
    ).update({"status": TeamInviteStatus.ACCEPTED})

    # If team full: auto-close remaining pending invites & requests
    if current_members + 1 >= team.max_size:
        db.query(TeamInvite).filter(
            TeamInvite.team_id == team.id, TeamInvite.status == TeamInviteStatus.PENDING
        ).update({"status": TeamInviteStatus.REVOKED})

        pending_reqs = (
            db.query(TeamJoinRequest)
            .filter(
                TeamJoinRequest.team_id == team.id,
                TeamJoinRequest.status == TeamJoinRequestStatus.PENDING,
            )
            .all()
        )
        for pr in pending_reqs:
            pr.status = TeamJoinRequestStatus.REJECTED
            _notify(
                db,
                pr.user_id,
                f"Team Full: {team.name}",
                f"{team.name} has reached maximum capacity.",
                {"team_id": str(team.id)},
            )

    _notify(
        db,
        req.user_id,
        f"Join Request Accepted: {team.name}",
        f"You have been accepted into {team.name}!",
        {"team_id": str(team.id)},
    )

    db.commit()
    db.refresh(team)
    return _to_team_detail(db, team, current_user)


def reject_join_request(db: Session, current_user: User, request_id: uuid.UUID) -> None:
    req = db.get(TeamJoinRequest, request_id)
    if not req:
        raise TeamError("Join request not found", "NOT_FOUND", 404)

    team = db.get(Team, req.team_id)
    if not team:
        raise TeamError("Team not found", "NOT_FOUND", 404)

    leader = (
        db.query(TeamMember)
        .filter(
            TeamMember.team_id == team.id,
            TeamMember.user_id == current_user.id,
            TeamMember.role == TeamMemberRole.LEADER,
        )
        .first()
    )
    if not leader:
        raise TeamError("Only the leader can reject join requests", "FORBIDDEN", 403)

    req.status = TeamJoinRequestStatus.REJECTED
    _notify(
        db,
        req.user_id,
        f"Join Request Update",
        f"Your request to join {team.name} was declined.",
        {"team_id": str(team.id)},
    )
    db.commit()


def withdraw_join_request(db: Session, current_user: User, request_id: uuid.UUID) -> None:
    req = db.get(TeamJoinRequest, request_id)
    if not req:
        raise TeamError("Join request not found", "NOT_FOUND", 404)

    if req.user_id != current_user.id:
        raise TeamError("Request does not belong to you", "FORBIDDEN", 403)

    req.status = TeamJoinRequestStatus.WITHDRAWN
    db.commit()


# ==========================================
# 5. SUGGESTIONS & ORGANIZER CONTROLS
# ==========================================


def get_team_suggestions(
    db: Session, current_user: User, team_id: uuid.UUID
) -> list[TeammateCandidateRead]:
    team = db.get(Team, team_id)
    if not team or team.deleted_at is not None:
        raise TeamError("Team not found", "NOT_FOUND", 404)

    leader = (
        db.query(TeamMember)
        .filter(
            TeamMember.team_id == team.id,
            TeamMember.user_id == current_user.id,
            TeamMember.role == TeamMemberRole.LEADER,
        )
        .first()
    )
    if not leader:
        raise TeamError("Only the leader can view teammate suggestions", "FORBIDDEN", 403)

    from app.services.users.profile import discover_teammates

    return discover_teammates(
        db=db,
        current_user=current_user,
        event_id=team.event_id,
        skills=team.looking_for_skills,
        limit=20,
    )


def lock_teams_for_event(db: Session, event_id: uuid.UUID, organizer: User) -> int:
    event = db.get(Event, event_id)
    if not event:
        raise TeamError("Event not found", "NOT_FOUND", 404)

    updated_count = (
        db.query(Team)
        .filter(Team.event_id == event_id, Team.status == TeamStatus.ACTIVE)
        .update({"is_locked": True})
    )

    db.add(
        AuditLog(
            actor_id=organizer.id,
            action="lock_teams",
            entity_type="event",
            entity_id=str(event_id),
            changes={"locked_teams_count": updated_count},
        )
    )
    db.commit()
    return updated_count


def list_event_teams(db: Session, event_id: uuid.UUID) -> list[TeamDetail]:
    teams = (
        db.query(Team)
        .filter(Team.event_id == event_id, Team.deleted_at.is_(None))
        .all()
    )
    return [_to_team_detail(db, t) for t in teams]


def admin_remove_team(db: Session, team_id: uuid.UUID, admin_user: User, reason: str) -> None:
    team = db.get(Team, team_id)
    if not team or team.deleted_at is not None:
        raise TeamError("Team not found", "NOT_FOUND", 404)

    team.status = TeamStatus.DISBANDED
    team.deleted_at = datetime.now(timezone.utc)

    db.add(
        AuditLog(
            actor_id=admin_user.id,
            action="admin_remove_team",
            entity_type="team",
            entity_id=str(team_id),
            changes={"team_name": team.name, "reason": reason},
        )
    )
    db.commit()
