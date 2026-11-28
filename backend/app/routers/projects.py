import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies.auth import CurrentUser, ExploreGate, OptionalUser
from app.dependencies.db import DBSession
from app.models.networking import ProjectStatus
from app.schemas.networking import (
    ProjectCollabRequestCreate,
    ProjectCollabRequestRead,
    ProjectCreate,
    ProjectDetail,
    ProjectListItem,
    ProjectMemberRead,
    ProjectUpdate,
)
from app.schemas.common import Page
from app.services.networking.projects import (
    ProjectError,
    accept_collab,
    create_project,
    delete_project,
    get_project_by_slug,
    leave_project,
    list_projects,
    list_user_projects,
    reject_collab,
    remove_member,
    request_collab,
    update_project,
    withdraw_collab,
)

router = APIRouter(tags=["projects"])


@router.get("/projects", response_model=Page[ProjectListItem], dependencies=[ExploreGate])
def get_projects(
    db: DBSession,
    current_user: OptionalUser,
    tech: str | None = Query(default=None),
    looking_for: str | None = Query(default=None),
    status: ProjectStatus | None = Query(default=None),
    q: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    items, total = list_projects(
        db,
        current_user=current_user,
        tech=tech,
        looking_for=looking_for,
        status=status,
        q=q,
        limit=limit,
        offset=offset,
    )
    return Page[ProjectListItem](items=items, total=total, limit=limit, offset=offset)


@router.get("/projects/{slug}", response_model=ProjectDetail, dependencies=[ExploreGate])
def get_project(
    slug: str,
    db: DBSession,
    current_user: OptionalUser,
):
    try:
        return get_project_by_slug(db, current_user, slug)
    except ProjectError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.post("/projects", response_model=ProjectDetail, status_code=status.HTTP_201_CREATED)
def post_project(
    payload: ProjectCreate,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return create_project(db, current_user, payload)
    except ProjectError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.patch("/projects/{project_id}", response_model=ProjectDetail)
def patch_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return update_project(db, current_user, project_id, payload)
    except ProjectError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_project(
    project_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        delete_project(db, current_user, project_id)
    except ProjectError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.post("/projects/{project_id}/collab-requests", response_model=ProjectCollabRequestRead, status_code=status.HTTP_201_CREATED)
def post_collab_request(
    project_id: uuid.UUID,
    payload: ProjectCollabRequestCreate,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return request_collab(db, current_user, project_id, message=payload.message)
    except ProjectError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.post("/projects/{project_id}/collab-requests/{req_id}/accept", response_model=ProjectMemberRead)
def post_accept_collab(
    project_id: uuid.UUID,
    req_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return accept_collab(db, current_user, project_id, req_id)
    except ProjectError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.post("/projects/{project_id}/collab-requests/{req_id}/reject", status_code=status.HTTP_200_OK)
def post_reject_collab(
    project_id: uuid.UUID,
    req_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        reject_collab(db, current_user, project_id, req_id)
        return {"status": "rejected"}
    except ProjectError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.post("/projects/{project_id}/collab-requests/{req_id}/withdraw", status_code=status.HTTP_200_OK)
def post_withdraw_collab(
    project_id: uuid.UUID,
    req_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        withdraw_collab(db, current_user, project_id, req_id)
        return {"status": "withdrawn"}
    except ProjectError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.delete("/projects/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        remove_member(db, current_user, project_id, user_id)
    except ProjectError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.post("/projects/{project_id}/leave", status_code=status.HTTP_200_OK)
def post_leave_project(
    project_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        leave_project(db, current_user, project_id)
        return {"status": "left"}
    except ProjectError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.get("/profiles/{handle}/projects", response_model=list[ProjectListItem], dependencies=[ExploreGate])
def get_user_projects(
    handle: str,
    db: DBSession,
    current_user: OptionalUser,
):
    try:
        return list_user_projects(db, current_user, handle)
    except ProjectError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )
