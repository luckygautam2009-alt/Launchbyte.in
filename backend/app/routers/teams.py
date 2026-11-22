import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.dependencies.auth import AdminUser, CurrentUser, OptionalUser, OrganizerUser
from app.dependencies.db import DBSession
from app.models.networking import TeamMemberRole
from app.schemas.networking import TeamMemberRead
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
from app.services.networking.teams import add_team_member
from app.services.teams import service as team_svc
from app.services.teams.service import TeamError

router = APIRouter(tags=["teams"])


class AddMemberPayload(BaseModel):
    user_id: uuid.UUID
    role: TeamMemberRole = TeamMemberRole.MEMBER


class TransferLeadershipPayload(BaseModel):
    new_leader_id: uuid.UUID


class LockTeamsPayload(BaseModel):
    locked: bool = True


# ==========================================
# TEAMS CRUD & DISCOVERY
# ==========================================


@router.post("/teams", response_model=TeamDetail, status_code=status.HTTP_201_CREATED)
def post_team(
    payload: TeamCreate,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return team_svc.create_team(db, current_user, payload)
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.get("/teams", response_model=dict)
def get_teams(
    db: DBSession,
    current_user: OptionalUser = None,
    event_id: Optional[uuid.UUID] = Query(None),
    skills: Optional[list[str]] = Query(None),
    has_open_spots: Optional[bool] = Query(None),
    q: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    try:
        items, total = team_svc.list_teams(
            db,
            current_user=current_user,
            event_id=event_id,
            skills=skills,
            has_open_spots=has_open_spots,
            q=q,
            page=page,
            per_page=per_page,
        )
        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
        }
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.get("/me/teams", response_model=list[TeamDetail])
def get_my_teams(
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return team_svc.list_my_teams(db, current_user)
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.get("/teams/{slug}", response_model=TeamDetail)
def get_team(
    slug: str,
    db: DBSession,
    current_user: OptionalUser = None,
):
    try:
        return team_svc.get_team_by_slug(db, slug, current_user)
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.patch("/teams/{team_id}", response_model=TeamDetail)
def patch_team(
    team_id: uuid.UUID,
    payload: TeamUpdate,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return team_svc.update_team(db, current_user, team_id, payload)
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.post("/teams/{team_id}/disband", status_code=status.HTTP_200_OK)
def disband_team(
    team_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        team_svc.disband_team(db, current_user, team_id)
        return {"status": "disbanded"}
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.post("/teams/{team_id}/leave", status_code=status.HTTP_200_OK)
def leave_team(
    team_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        team_svc.leave_team(db, current_user, team_id)
        return {"status": "left"}
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.post("/teams/{team_id}/transfer-leadership", response_model=TeamDetail)
def transfer_leadership(
    team_id: uuid.UUID,
    payload: TransferLeadershipPayload,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return team_svc.transfer_leadership(db, current_user, team_id, payload.new_leader_id)
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.delete("/teams/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def kick_member(
    team_id: uuid.UUID,
    user_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        team_svc.remove_member(db, current_user, team_id, user_id)
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.post("/teams/{team_id}/members", response_model=TeamMemberRead, status_code=status.HTTP_201_CREATED)
def post_member(
    team_id: uuid.UUID,
    payload: AddMemberPayload,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return add_team_member(db, current_user, team_id, payload.user_id, role=payload.role)
    except Exception as e:
        code = getattr(e, "code", "TEAM_ERROR")
        status_code = getattr(e, "status_code", 400)
        message = getattr(e, "message", str(e))
        raise HTTPException(
            status_code=status_code,
            detail={"error": {"code": code, "message": message}},
        )


# ==========================================
# INVITES LIFECYCLE
# ==========================================


@router.post("/teams/{team_id}/invites", response_model=TeamInviteRead, status_code=status.HTTP_201_CREATED)
def invite_user(
    team_id: uuid.UUID,
    payload: TeamInviteCreate,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return team_svc.create_invite(db, current_user, team_id, payload)
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.get("/me/invites", response_model=list[TeamInviteRead])
def get_my_invites(
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return team_svc.list_my_invites(db, current_user)
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.get("/teams/{team_id}/invites", response_model=list[TeamInviteRead])
def get_team_invites(
    team_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return team_svc.list_team_invites(db, current_user, team_id)
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.post("/invites/{invite_id}/accept", response_model=TeamDetail)
def accept_invite(
    invite_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return team_svc.accept_invite(db, current_user, invite_id)
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.post("/invites/{invite_id}/decline", status_code=status.HTTP_200_OK)
def decline_invite(
    invite_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        team_svc.decline_invite(db, current_user, invite_id)
        return {"status": "declined"}
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.delete("/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_invite(
    invite_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        team_svc.revoke_invite(db, current_user, invite_id)
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


# ==========================================
# JOIN REQUESTS LIFECYCLE
# ==========================================


@router.post("/teams/{team_id}/join-requests", response_model=TeamJoinRequestRead, status_code=status.HTTP_201_CREATED)
def request_to_join(
    team_id: uuid.UUID,
    payload: TeamJoinRequestCreate,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return team_svc.create_join_request(db, current_user, team_id, payload)
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.get("/teams/{team_id}/join-requests", response_model=list[TeamJoinRequestRead])
def get_team_join_requests(
    team_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return team_svc.list_team_join_requests(db, current_user, team_id)
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.post("/join-requests/{request_id}/accept", response_model=TeamDetail)
def accept_join_request(
    request_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return team_svc.accept_join_request(db, current_user, request_id)
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.post("/join-requests/{request_id}/reject", status_code=status.HTTP_200_OK)
def reject_join_request(
    request_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        team_svc.reject_join_request(db, current_user, request_id)
        return {"status": "rejected"}
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.delete("/join-requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def withdraw_join_request(
    request_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        team_svc.withdraw_join_request(db, current_user, request_id)
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


# ==========================================
# SUGGESTIONS
# ==========================================


@router.get("/teams/{team_id}/suggestions", response_model=list[TeammateCandidateRead])
def get_team_suggestions(
    team_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return team_svc.get_team_suggestions(db, current_user, team_id)
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


# ==========================================
# ORGANIZER & ADMIN CONTROLS
# ==========================================


@router.post("/admin/events/{event_id}/lock-teams", status_code=status.HTTP_200_OK)
def lock_event_teams(
    event_id: uuid.UUID,
    payload: LockTeamsPayload,
    db: DBSession,
    user: OrganizerUser,
):
    try:
        count = team_svc.lock_teams_for_event(db, event_id, user)
        return {"locked_teams_count": count}
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.get("/admin/events/{event_id}/teams", response_model=list[TeamDetail])
def list_admin_event_teams(
    event_id: uuid.UUID,
    db: DBSession,
    user: OrganizerUser,
):
    try:
        return team_svc.list_event_teams(db, event_id)
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.delete("/admin/teams/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_remove_team(
    team_id: uuid.UUID,
    db: DBSession,
    user: AdminUser,
    reason: str = Query(..., min_length=3, max_length=500),
):
    try:
        team_svc.admin_remove_team(db, team_id, user, reason)
    except TeamError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )
