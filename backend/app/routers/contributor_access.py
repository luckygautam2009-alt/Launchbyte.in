"""Contributor Access Request & Admin Review Routes."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy import select

from app.dependencies.auth import AdminUser, CurrentUser, VerifiedUser
from app.dependencies.db import DBSession
from app.models.audit import AuditLog
from app.models.enums import UserRole
from app.models.submissions import ContributorAccessRequest
from app.models.users import User
from app.schemas.submissions import (
    ContributorAccessRequestCreate,
    ContributorAccessRequestRead,
    ContributorAccessReviewAction,
    ContributorAccessStatusResponse,
)
from app.services.email.dispatcher import send_admin_notification, send_user_notification

router = APIRouter(tags=["contributor access"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _ip(request: Request) -> str | None:
    return request.client.host if request.client else None


@router.get("/contributor-access/me", response_model=ContributorAccessStatusResponse)
def get_my_contributor_access(db: DBSession, user: CurrentUser) -> ContributorAccessStatusResponse:
    """Return current user's contributor role status and latest access request."""
    latest = db.scalar(
        select(ContributorAccessRequest)
        .where(ContributorAccessRequest.user_id == user.id)
        .order_by(ContributorAccessRequest.created_at.desc())
    )
    has_access = user.role in (
        UserRole.CONTRIBUTOR,
        UserRole.ORGANIZER,
        UserRole.MODERATOR,
        UserRole.ADMIN,
    )
    return ContributorAccessStatusResponse(
        has_access=has_access,
        role=user.role.value,
        latest_request=latest,
    )


@router.post(
    "/contributor-access/request",
    response_model=ContributorAccessRequestRead,
    status_code=status.HTTP_201_CREATED,
)
def request_contributor_access(
    db: DBSession,
    user: VerifiedUser,
    request: Request,
    payload: ContributorAccessRequestCreate,
) -> ContributorAccessRequestRead:
    """
    Core team member requests opportunity-contributor listing access.
    Requires authenticated user with a verified email.
    Does NOT automatically grant permissions.
    """
    if payload.email.lower().strip() != user.email.lower().strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submitted email must match your authenticated verified account email.",
        )

    existing_pending = db.scalar(
        select(ContributorAccessRequest).where(
            ContributorAccessRequest.user_id == user.id,
            ContributorAccessRequest.status == "pending",
        )
    )
    if existing_pending is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a pending opportunity listing access request.",
        )

    req = ContributorAccessRequest(
        user_id=user.id,
        full_name=payload.full_name.strip(),
        email=user.email,
        team_role=payload.team_role.strip(),
        reason=payload.reason.strip(),
        status="pending",
    )
    db.add(req)
    db.add(
        AuditLog(
            actor_id=user.id,
            action="contributor_access.requested",
            entity_type="contributor_access_request",
            entity_id=str(req.id),
            changes={"team_role": req.team_role, "email": req.email},
            ip_address=_ip(request),
        )
    )
    db.commit()
    db.refresh(req)

    send_admin_notification(
        subject=f"[LaunchByte] Opportunity Access Request from {req.full_name}",
        message=(
            f"Request ID: {req.id}\n"
            f"Name: {req.full_name}\n"
            f"Email: {req.email}\n"
            f"Team Role: {req.team_role}\n"
            f"Reason:\n{req.reason}\n\n"
            f"Review in LaunchByte Admin Portal."
        ),
    )
    return req


# ---------- Admin Review Routes (Admin Only) ----------

@router.get("/admin/contributor-access", response_model=list[ContributorAccessRequestRead])
def list_contributor_access_requests(
    db: DBSession,
    admin: AdminUser,
    status_filter: str | None = None,
) -> list[ContributorAccessRequestRead]:
    stmt = select(ContributorAccessRequest).order_by(ContributorAccessRequest.created_at.desc())
    if status_filter:
        stmt = stmt.where(ContributorAccessRequest.status == status_filter)
    return list(db.scalars(stmt).all())


@router.post("/admin/contributor-access/{request_id}/approve", response_model=ContributorAccessRequestRead)
def approve_contributor_access(
    db: DBSession,
    admin: AdminUser,
    request: Request,
    request_id: uuid.UUID,
    body: ContributorAccessReviewAction = ContributorAccessReviewAction(),
) -> ContributorAccessRequestRead:
    req = db.get(ContributorAccessRequest, request_id)
    if req is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access request not found")

    target_user = db.get(User, req.user_id)
    if target_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requesting user not found")

    req.status = "approved"
    req.reviewed_by_id = admin.id
    req.review_note = body.review_note
    req.reviewed_at = _now()

    if target_user.role == UserRole.USER:
        target_user.role = UserRole.CONTRIBUTOR

    db.add(
        AuditLog(
            actor_id=admin.id,
            action="contributor_access.approved",
            entity_type="contributor_access_request",
            entity_id=str(req.id),
            changes={"target_user_id": str(target_user.id), "note": body.review_note},
            ip_address=_ip(request),
        )
    )
    db.commit()
    db.refresh(req)

    send_user_notification(
        to_email=target_user.email,
        subject="LaunchByte Opportunity Listing Access Approved",
        message=(
            f"Hi {req.full_name},\n\n"
            "Your request for LaunchByte opportunity listing access has been approved. "
            "You can now access the Contributor Opportunity Dashboard to draft and submit opportunities for review."
        ),
    )
    return req


@router.post("/admin/contributor-access/{request_id}/reject", response_model=ContributorAccessRequestRead)
def reject_contributor_access(
    db: DBSession,
    admin: AdminUser,
    request: Request,
    request_id: uuid.UUID,
    body: ContributorAccessReviewAction = ContributorAccessReviewAction(),
) -> ContributorAccessRequestRead:
    req = db.get(ContributorAccessRequest, request_id)
    if req is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access request not found")

    req.status = "rejected"
    req.reviewed_by_id = admin.id
    req.review_note = body.review_note
    req.reviewed_at = _now()

    db.add(
        AuditLog(
            actor_id=admin.id,
            action="contributor_access.rejected",
            entity_type="contributor_access_request",
            entity_id=str(req.id),
            changes={"note": body.review_note},
            ip_address=_ip(request),
        )
    )
    db.commit()
    db.refresh(req)

    send_user_notification(
        to_email=req.email,
        subject="LaunchByte Opportunity Access Request Update",
        message=(
            f"Hi {req.full_name},\n\n"
            "Your request for opportunity listing access was not approved at this time."
            + (f"\nNote: {body.review_note}" if body.review_note else "")
        ),
    )
    return req


@router.post("/admin/contributor-access/{request_id}/revoke", response_model=ContributorAccessRequestRead)
def revoke_contributor_access(
    db: DBSession,
    admin: AdminUser,
    request: Request,
    request_id: uuid.UUID,
    body: ContributorAccessReviewAction = ContributorAccessReviewAction(),
) -> ContributorAccessRequestRead:
    """
    Revokes contributor submission access immediately while leaving
    existing published opportunities intact.
    """
    req = db.get(ContributorAccessRequest, request_id)
    if req is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access request not found")

    target_user = db.get(User, req.user_id)
    if target_user is not None and target_user.role == UserRole.CONTRIBUTOR:
        target_user.role = UserRole.USER

    req.status = "revoked"
    req.reviewed_by_id = admin.id
    req.review_note = body.review_note
    req.reviewed_at = _now()

    db.add(
        AuditLog(
            actor_id=admin.id,
            action="contributor_access.revoked",
            entity_type="contributor_access_request",
            entity_id=str(req.id),
            changes={"target_user_id": str(req.user_id), "note": body.review_note},
            ip_address=_ip(request),
        )
    )
    db.commit()
    db.refresh(req)

    send_admin_notification(
        subject=f"[LaunchByte] Contributor Access Revoked: {req.full_name}",
        message=f"Access for {req.full_name} ({req.email}) was revoked by {admin.email}.",
    )
    return req
