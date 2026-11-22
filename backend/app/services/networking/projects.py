import re
import secrets
import uuid
from datetime import datetime, timezone

import nh3
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.enums import NotificationType
from app.models.networking import (
    CollabRequestStatus,
    Connection,
    ConnectionStatus,
    Conversation,
    ConversationParticipant,
    Project,
    ProjectCollabRequest,
    ProjectMember,
    ProjectMemberRole,
    ProjectStatus,
    ProjectVisibility,
    Team,
    TeamMember,
    TeamMemberRole,
)
from app.models.notifications import Notification
from app.models.users import User
from app.schemas.networking import (
    ConnectionUserBrief,
    ProjectCollabRequestRead,
    ProjectCreate,
    ProjectDetail,
    ProjectListItem,
    ProjectMemberRead,
    ProjectUpdate,
)
from app.services.networking.connections import get_blocked_user_ids


class ProjectError(Exception):
    def __init__(self, message: str, code: str = "PROJECT_ERROR", status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return slug[:120] or f"project-{secrets.token_hex(4)}"


def _sanitize_markdown(text: str | None) -> str | None:
    if not text:
        return None
    # Sanitize markdown/HTML
    allowed_tags = {
        "p", "b", "i", "strong", "em", "code", "pre", "h1", "h2", "h3", "h4",
        "ul", "ol", "li", "a", "blockquote", "hr", "br", "table", "thead", "tbody", "tr", "th", "td",
    }
    allowed_attrs = {"a": {"href", "title", "target"}}
    return nh3.clean(text, tags=allowed_tags, attributes=allowed_attrs, link_rel="noopener noreferrer")


def create_project(db: Session, current_user: User, data: ProjectCreate) -> ProjectDetail:
    final_slug = _slugify(data.slug or data.title)
    existing = db.query(Project).filter(Project.slug == final_slug).first()
    if existing:
        final_slug = f"{final_slug[:100]}-{secrets.token_hex(3)}"

    project = Project(
        title=data.title,
        slug=final_slug,
        summary=data.summary,
        description=_sanitize_markdown(data.description),
        repo_url=data.repo_url,
        demo_url=data.demo_url,
        tech_stack=data.tech_stack,
        looking_for=data.looking_for,
        status=data.status,
        visibility=data.visibility,
        owner_id=current_user.id,
        team_id=data.team_id,
    )
    db.add(project)
    db.flush()

    # Add owner to project_members
    owner_member = ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role=ProjectMemberRole.OWNER,
    )
    db.add(owner_member)
    db.commit()
    db.refresh(project)

    return get_project_by_id(db, current_user, project.id)


def update_project(db: Session, current_user: User, project_id: uuid.UUID, data: ProjectUpdate) -> ProjectDetail:
    project = db.get(Project, project_id)
    if not project or project.deleted_at is not None:
        raise ProjectError("Project not found", "NOT_FOUND", 404)

    if project.owner_id != current_user.id and not current_user.is_staff:
        raise ProjectError("Only the project owner can update this project", "FORBIDDEN", 403)

    if data.title is not None:
        project.title = data.title
    if data.summary is not None:
        project.summary = data.summary
    if data.description is not None:
        project.description = _sanitize_markdown(data.description)
    if data.repo_url is not None:
        project.repo_url = data.repo_url
    if data.demo_url is not None:
        project.demo_url = data.demo_url
    if data.tech_stack is not None:
        project.tech_stack = data.tech_stack
    if data.looking_for is not None:
        project.looking_for = data.looking_for
    if data.status is not None:
        project.status = data.status
    if data.visibility is not None:
        project.visibility = data.visibility

    project.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(project)

    return get_project_by_id(db, current_user, project.id)


def delete_project(db: Session, current_user: User, project_id: uuid.UUID) -> None:
    project = db.get(Project, project_id)
    if not project or project.deleted_at is not None:
        raise ProjectError("Project not found", "NOT_FOUND", 404)

    if project.owner_id != current_user.id and not current_user.is_staff:
        raise ProjectError("Only the project owner can delete this project", "FORBIDDEN", 403)

    project.deleted_at = datetime.now(timezone.utc)
    db.commit()


def _is_visible(db: Session, current_user: User | None, project: Project) -> bool:
    if project.visibility == ProjectVisibility.PUBLIC:
        return True

    if not current_user:
        return False

    if project.owner_id == current_user.id or current_user.is_staff:
        return True

    # Member check
    is_member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project.id,
        ProjectMember.user_id == current_user.id,
    ).first() is not None
    if is_member:
        return True

    if project.visibility == ProjectVisibility.CONNECTIONS:
        # Check connection with owner
        is_conn = db.query(Connection).filter(
            Connection.status == ConnectionStatus.ACCEPTED,
            or_(
                (Connection.requester_id == current_user.id) & (Connection.addressee_id == project.owner_id),
                (Connection.requester_id == project.owner_id) & (Connection.addressee_id == current_user.id),
            ),
        ).first() is not None
        return is_conn

    return False


def get_project_by_slug(db: Session, current_user: User | None, slug: str) -> ProjectDetail:
    project = db.query(Project).filter(
        Project.slug == slug,
        Project.deleted_at.is_(None),
    ).first()
    if not project or not _is_visible(db, current_user, project):
        raise ProjectError("Project not found", "NOT_FOUND", 404)

    return _build_project_detail(db, project)


def get_project_by_id(db: Session, current_user: User | None, project_id: uuid.UUID) -> ProjectDetail:
    project = db.get(Project, project_id)
    if not project or project.deleted_at is not None or not _is_visible(db, current_user, project):
        raise ProjectError("Project not found", "NOT_FOUND", 404)

    return _build_project_detail(db, project)


def _build_project_detail(db: Session, project: Project) -> ProjectDetail:
    owner = db.get(User, project.owner_id)
    members_raw = db.query(ProjectMember).filter(ProjectMember.project_id == project.id).all()
    members = []
    for m in members_raw:
        u = db.get(User, m.user_id)
        members.append(
            ProjectMemberRead(
                id=m.id,
                project_id=m.project_id,
                user_id=m.user_id,
                role=m.role,
                joined_at=m.joined_at,
                user=ConnectionUserBrief.model_validate(u) if u else None,
            )
        )

    collabs_raw = db.query(ProjectCollabRequest).filter(ProjectCollabRequest.project_id == project.id).all()
    collabs = []
    for c in collabs_raw:
        u = db.get(User, c.user_id)
        collabs.append(
            ProjectCollabRequestRead(
                id=c.id,
                project_id=c.project_id,
                user_id=c.user_id,
                message=c.message,
                status=c.status,
                created_at=c.created_at,
                responded_at=c.responded_at,
                user=ConnectionUserBrief.model_validate(u) if u else None,
            )
        )

    return ProjectDetail(
        id=project.id,
        title=project.title,
        slug=project.slug,
        summary=project.summary,
        description=project.description,
        repo_url=project.repo_url,
        demo_url=project.demo_url,
        tech_stack=project.tech_stack or [],
        looking_for=project.looking_for or [],
        status=project.status,
        visibility=project.visibility,
        owner_id=project.owner_id,
        team_id=project.team_id,
        created_at=project.created_at,
        owner=ConnectionUserBrief.model_validate(owner) if owner else None,
        members_count=len(members),
        members=members,
        collab_requests=collabs,
    )


def list_projects(
    db: Session,
    current_user: User | None = None,
    tech: str | None = None,
    looking_for: str | None = None,
    status: ProjectStatus | None = None,
    q: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[ProjectListItem], int]:
    query = db.query(Project).filter(Project.deleted_at.is_(None))

    if status:
        query = query.filter(Project.status == status)

    projects = query.order_by(Project.created_at.desc()).all()

    # Filter by visibility, tech, looking_for, search term
    items: list[ProjectListItem] = []
    for p in projects:
        if not _is_visible(db, current_user, p):
            continue

        if tech and p.tech_stack:
            tech_lower = [t.lower() for t in p.tech_stack]
            if tech.lower() not in tech_lower:
                continue
        elif tech and not p.tech_stack:
            continue

        if looking_for and p.looking_for:
            lf_lower = [lf.lower() for lf in p.looking_for]
            if looking_for.lower() not in lf_lower:
                continue
        elif looking_for and not p.looking_for:
            continue

        if q:
            term = q.strip().lower()
            t_match = term in p.title.lower()
            s_match = p.summary and term in p.summary.lower()
            if not (t_match or s_match):
                continue

        owner = db.get(User, p.owner_id)
        m_count = db.query(func.count(ProjectMember.id)).filter(ProjectMember.project_id == p.id).scalar() or 1

        items.append(
            ProjectListItem(
                id=p.id,
                title=p.title,
                slug=p.slug,
                summary=p.summary,
                repo_url=p.repo_url,
                demo_url=p.demo_url,
                tech_stack=p.tech_stack or [],
                looking_for=p.looking_for or [],
                status=p.status,
                visibility=p.visibility,
                owner_id=p.owner_id,
                created_at=p.created_at,
                owner=ConnectionUserBrief.model_validate(owner) if owner else None,
                members_count=m_count,
            )
        )

    total = len(items)
    paged = items[offset : offset + limit]
    return paged, total


def request_collab(
    db: Session, current_user: User, project_id: uuid.UUID, message: str | None = None
) -> ProjectCollabRequestRead:
    project = db.get(Project, project_id)
    if not project or project.deleted_at is not None or not _is_visible(db, current_user, project):
        raise ProjectError("Project not found", "NOT_FOUND", 404)

    if project.owner_id == current_user.id:
        raise ProjectError("You are already the owner of this project", "CANNOT_COLLAB_OWNER", 400)

    # Check if already a member
    is_member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == current_user.id,
    ).first()
    if is_member:
        raise ProjectError("You are already a collaborator on this project", "ALREADY_MEMBER", 409)

    # Check pending request
    pending = db.query(ProjectCollabRequest).filter(
        ProjectCollabRequest.project_id == project_id,
        ProjectCollabRequest.user_id == current_user.id,
        ProjectCollabRequest.status == CollabRequestStatus.PENDING,
    ).first()
    if pending:
        raise ProjectError("You already have a pending collaboration request", "REQUEST_ALREADY_PENDING", 409)

    req = ProjectCollabRequest(
        project_id=project_id,
        user_id=current_user.id,
        message=message,
        status=CollabRequestStatus.PENDING,
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    # Notify project owner
    notif = Notification(
        user_id=project.owner_id,
        type=NotificationType.SYSTEM,
        title=f"Collaboration request for {project.title}",
        body=f"{current_user.full_name or current_user.handle} requested to join {project.title}.",
        data={"event": "project_collab_request", "project_id": str(project.id), "request_id": str(req.id)},
    )
    db.add(notif)
    db.commit()

    return ProjectCollabRequestRead(
        id=req.id,
        project_id=req.project_id,
        user_id=req.user_id,
        message=req.message,
        status=req.status,
        created_at=req.created_at,
        responded_at=req.responded_at,
        user=ConnectionUserBrief.model_validate(current_user),
    )


def accept_collab(
    db: Session, current_user: User, project_id: uuid.UUID, request_id: uuid.UUID
) -> ProjectMemberRead:
    project = db.get(Project, project_id)
    if not project or project.deleted_at is not None:
        raise ProjectError("Project not found", "NOT_FOUND", 404)

    if project.owner_id != current_user.id and not current_user.is_staff:
        raise ProjectError("Only the project owner can accept collaborators", "FORBIDDEN", 403)

    req = db.get(ProjectCollabRequest, request_id)
    if not req or req.project_id != project_id:
        raise ProjectError("Collaboration request not found", "NOT_FOUND", 404)

    if req.status != CollabRequestStatus.PENDING:
        raise ProjectError("Request is not pending", "INVALID_STATUS", 400)

    req.status = CollabRequestStatus.ACCEPTED
    req.responded_at = datetime.now(timezone.utc)

    # Add to project_members
    member = ProjectMember(
        project_id=project_id,
        user_id=req.user_id,
        role=ProjectMemberRole.COLLABORATOR,
    )
    db.add(member)

    # If project is linked to a team, also add to team & team chat
    if project.team_id:
        existing_tm = db.query(TeamMember).filter(
            TeamMember.team_id == project.team_id,
            TeamMember.user_id == req.user_id,
        ).first()
        if not existing_tm:
            tm = TeamMember(team_id=project.team_id, user_id=req.user_id, role=TeamMemberRole.MEMBER)
            db.add(tm)
            # Add to team chat conversation
            conv = db.query(Conversation).filter(Conversation.team_id == project.team_id).first()
            if conv:
                part = db.query(ConversationParticipant).filter(
                    ConversationParticipant.conversation_id == conv.id,
                    ConversationParticipant.user_id == req.user_id,
                ).first()
                if part:
                    part.left_at = None
                else:
                    db.add(ConversationParticipant(conversation_id=conv.id, user_id=req.user_id))

    # Notify applicant
    notif = Notification(
        user_id=req.user_id,
        type=NotificationType.SYSTEM,
        title=f"Collaboration accepted for {project.title}",
        body=f"{current_user.full_name or current_user.handle} accepted you as a collaborator on {project.title}!",
        data={"event": "project_collab_accepted", "project_id": str(project.id)},
    )
    db.add(notif)
    db.commit()
    db.refresh(member)

    u = db.get(User, req.user_id)
    return ProjectMemberRead(
        id=member.id,
        project_id=member.project_id,
        user_id=member.user_id,
        role=member.role,
        joined_at=member.joined_at,
        user=ConnectionUserBrief.model_validate(u) if u else None,
    )


def reject_collab(
    db: Session, current_user: User, project_id: uuid.UUID, request_id: uuid.UUID
) -> None:
    project = db.get(Project, project_id)
    if not project or project.deleted_at is not None:
        raise ProjectError("Project not found", "NOT_FOUND", 404)

    if project.owner_id != current_user.id and not current_user.is_staff:
        raise ProjectError("Only the project owner can reject collaborators", "FORBIDDEN", 403)

    req = db.get(ProjectCollabRequest, request_id)
    if not req or req.project_id != project_id:
        raise ProjectError("Collaboration request not found", "NOT_FOUND", 404)

    req.status = CollabRequestStatus.REJECTED
    req.responded_at = datetime.now(timezone.utc)
    db.commit()


def withdraw_collab(
    db: Session, current_user: User, project_id: uuid.UUID, request_id: uuid.UUID
) -> None:
    req = db.get(ProjectCollabRequest, request_id)
    if not req or req.project_id != project_id or req.user_id != current_user.id:
        raise ProjectError("Collaboration request not found", "NOT_FOUND", 404)

    if req.status != CollabRequestStatus.PENDING:
        raise ProjectError("Only pending requests can be withdrawn", "INVALID_STATUS", 400)

    req.status = CollabRequestStatus.WITHDRAWN
    req.responded_at = datetime.now(timezone.utc)
    db.commit()


def remove_member(
    db: Session, current_user: User, project_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    project = db.get(Project, project_id)
    if not project or project.deleted_at is not None:
        raise ProjectError("Project not found", "NOT_FOUND", 404)

    if project.owner_id != current_user.id and not current_user.is_staff:
        raise ProjectError("Only project owner can remove members", "FORBIDDEN", 403)

    if user_id == project.owner_id:
        raise ProjectError("Cannot remove the project owner", "CANNOT_REMOVE_OWNER", 400)

    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id,
    ).first()
    if not member:
        raise ProjectError("Member not found in project", "NOT_FOUND", 404)

    db.delete(member)
    db.commit()


def leave_project(db: Session, current_user: User, project_id: uuid.UUID) -> None:
    project = db.get(Project, project_id)
    if not project or project.deleted_at is not None:
        raise ProjectError("Project not found", "NOT_FOUND", 404)

    if project.owner_id == current_user.id:
        raise ProjectError("Project owner cannot leave; transfer ownership or delete project", "OWNER_CANNOT_LEAVE", 400)

    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == current_user.id,
    ).first()
    if not member:
        raise ProjectError("You are not a member of this project", "NOT_FOUND", 404)

    db.delete(member)
    db.commit()


def list_user_projects(db: Session, current_user: User | None, handle: str) -> list[ProjectListItem]:
    target = db.query(User).filter(func.lower(User.handle) == handle.strip().lower()).first()
    if not target or not target.is_active:
        raise ProjectError("User not found", "USER_NOT_FOUND", 404)

    # Check if target blocked current_user or vice versa
    if current_user and _is_blocked(db, current_user.id, target.id):
        return []

    # Get projects where target is owner
    projects = db.query(Project).filter(
        Project.owner_id == target.id,
        Project.deleted_at.is_(None),
    ).order_by(Project.created_at.desc()).all()

    items = []
    for p in projects:
        if _is_visible(db, current_user, p):
            m_count = db.query(func.count(ProjectMember.id)).filter(ProjectMember.project_id == p.id).scalar() or 1
            items.append(
                ProjectListItem(
                    id=p.id,
                    title=p.title,
                    slug=p.slug,
                    summary=p.summary,
                    repo_url=p.repo_url,
                    demo_url=p.demo_url,
                    tech_stack=p.tech_stack or [],
                    looking_for=p.looking_for or [],
                    status=p.status,
                    visibility=p.visibility,
                    owner_id=p.owner_id,
                    created_at=p.created_at,
                    owner=ConnectionUserBrief.model_validate(target),
                    members_count=m_count,
                )
            )
    return items
