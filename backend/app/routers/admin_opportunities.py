import uuid

from fastapi import APIRouter, HTTPException, Query, Request, status

from app.dependencies.auth import AdminUser
from app.dependencies.db import DBSession
from app.models.enums import OpportunityStatus
from app.schemas.common import Page
from app.schemas.opportunities import (
    OpportunityAdminRead,
    OpportunityCreate,
    OpportunityStatusUpdate,
    OpportunityUpdate,
)
from app.services.opportunities import service as svc

router = APIRouter(prefix="/admin/opportunities", tags=["admin: opportunities"])


def _ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def _get_or_404(db, opportunity_id: uuid.UUID):
    opp = svc.get_admin(db, opportunity_id)
    if opp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
    return opp


@router.get("", response_model=Page[OpportunityAdminRead])
def list_opportunities(
    db: DBSession,
    admin: AdminUser,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status_filter: OpportunityStatus | None = Query(None, alias="status"),
    q: str | None = Query(None, min_length=1, max_length=100),
    include_deleted: bool = False,
):
    items, total = svc.list_admin(
        db, limit=limit, offset=offset, status=status_filter, q=q, include_deleted=include_deleted
    )
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.post("", response_model=OpportunityAdminRead, status_code=status.HTTP_201_CREATED)
def create_opportunity(db: DBSession, admin: AdminUser, request: Request, data: OpportunityCreate):
    try:
        return svc.create_opportunity(db, data, admin, _ip(request))
    except svc.OrganizationNotFoundError as exc:
        raise HTTPException(422, "organization_id does not match an existing organization") from exc
    except svc.InvalidOpportunityError as exc:
        raise HTTPException(422, str(exc)) from exc


@router.get("/{opportunity_id}", response_model=OpportunityAdminRead)
def get_opportunity(db: DBSession, admin: AdminUser, opportunity_id: uuid.UUID):
    return _get_or_404(db, opportunity_id)


@router.patch("/{opportunity_id}", response_model=OpportunityAdminRead)
def update_opportunity(
    db: DBSession, admin: AdminUser, request: Request, opportunity_id: uuid.UUID, data: OpportunityUpdate
):
    opp = _get_or_404(db, opportunity_id)
    try:
        return svc.update_opportunity(db, opp, data, admin, _ip(request))
    except svc.OrganizationNotFoundError as exc:
        raise HTTPException(422, "organization_id does not match an existing organization") from exc
    except svc.InvalidOpportunityError as exc:
        raise HTTPException(422, str(exc)) from exc


@router.post("/{opportunity_id}/status", response_model=OpportunityAdminRead)
def change_status(
    db: DBSession, admin: AdminUser, request: Request, opportunity_id: uuid.UUID, body: OpportunityStatusUpdate
):
    opp = _get_or_404(db, opportunity_id)
    return svc.set_status(db, opp, body.status, admin, _ip(request))


@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_opportunity(db: DBSession, admin: AdminUser, request: Request, opportunity_id: uuid.UUID):
    opp = _get_or_404(db, opportunity_id)
    svc.soft_delete(db, opp, admin, _ip(request))
