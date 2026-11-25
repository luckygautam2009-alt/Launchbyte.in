"""
Applications router.

User-facing routes (require CurrentUser):
  POST   /applications                       — submit a new application
  GET    /applications                       — list the caller's applications
  GET    /applications/{id}                  — get one (with event timeline)
  PATCH  /applications/{id}                 — partial update
  DELETE /applications/{id}                 — delete

Staff/admin routes (require StaffUser):
  GET    /admin/opportunities/{opp_id}/applications   — all applicants for an opportunity
  GET    /admin/applications/{id}                      — any application detail
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.rate_limit import rate_limit

from app.dependencies.auth import CurrentUser, StaffUser
from app.dependencies.db import DBSession
from app.models.enums import ApplicationStatus
from app.schemas.applications import (
    ApplicationCreate,
    ApplicationListItem,
    ApplicationRead,
    ApplicationUpdate,
)
from app.schemas.common import Page
from app.services.applications import service as svc

router = APIRouter(tags=["applications"])


# ─────────────────────────── user routes ───────────────────────────


@router.post(
    "/applications",
    response_model=ApplicationRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60))],
)
def submit_application(
    db: DBSession,
    current_user: CurrentUser,
    data: ApplicationCreate,
):
    """
    Submit a new application.

    * Platform application: supply ``opportunity_id`` (must be published).
    * External application: omit ``opportunity_id``; supply ``custom_title`` instead.

    Returns 409 if the user already has an application for the same platform opportunity.
    """
    try:
        return svc.submit(db, user_id=current_user.id, data=data)
    except svc.OpportunityNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="opportunity_id does not reference a live published opportunity",
        )
    except svc.DuplicateApplicationError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have an application for this opportunity",
        )


@router.get("/applications", response_model=Page[ApplicationListItem])
def list_my_applications(
    db: DBSession,
    current_user: CurrentUser,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status_filter: ApplicationStatus | None = Query(None, alias="status"),
):
    """List the authenticated user's applications, newest first."""
    items, total = svc.list_mine(
        db,
        user_id=current_user.id,
        limit=limit,
        offset=offset,
        status_filter=status_filter,
    )
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/applications/{application_id}", response_model=ApplicationRead)
def get_application(
    db: DBSession,
    current_user: CurrentUser,
    application_id: uuid.UUID,
):
    """Fetch one application with its event timeline. 404 if not owned by caller."""
    try:
        return svc.get_mine(db, application_id=application_id, user_id=current_user.id)
    except svc.ApplicationNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")


@router.patch("/applications/{application_id}", response_model=ApplicationRead)
def update_application(
    db: DBSession,
    current_user: CurrentUser,
    application_id: uuid.UUID,
    data: ApplicationUpdate,
):
    """Partially update an application. Emits a status_change event when status changes."""
    try:
        return svc.update_mine(
            db, application_id=application_id, user_id=current_user.id, data=data
        )
    except svc.ApplicationNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")


@router.delete("/applications/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    db: DBSession,
    current_user: CurrentUser,
    application_id: uuid.UUID,
):
    """Hard-delete an application (cascade removes its event history)."""
    try:
        svc.delete_mine(db, application_id=application_id, user_id=current_user.id)
    except svc.ApplicationNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")


# ─────────────────────────── staff/admin routes ────────────────────


@router.get(
    "/admin/opportunities/{opportunity_id}/applications",
    response_model=Page[ApplicationListItem],
    tags=["admin: applications"],
)
def list_applications_for_opportunity(
    db: DBSession,
    staff: StaffUser,
    opportunity_id: uuid.UUID,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status_filter: ApplicationStatus | None = Query(None, alias="status"),
):
    """Staff: list all applications for a platform opportunity."""
    items, total = svc.list_admin_for_opportunity(
        db,
        opportunity_id=opportunity_id,
        limit=limit,
        offset=offset,
        status_filter=status_filter,
    )
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.get(
    "/admin/applications/{application_id}",
    response_model=ApplicationRead,
    tags=["admin: applications"],
)
def get_application_admin(
    db: DBSession,
    staff: StaffUser,
    application_id: uuid.UUID,
):
    """Staff: fetch any application by ID."""
    app = svc.get_admin(db, application_id=application_id)
    if app is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return app
