import uuid
from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status

from app.core.rate_limit import rate_limit
from app.dependencies.auth import CurrentUser, ExploreGate, OrganizerUser
from app.dependencies.db import DBSession
from app.models.enums import (
    CompensationType,
    LocationType,
    OpportunityStatus,
    OpportunityType,
    VerificationStatus,
)
from app.models.opportunities import Opportunity
from app.schemas.common import Page
from app.schemas.opportunities import (
    OpportunityDetail,
    OpportunityListItem,
    OpportunityOrganizerCreate,
    OpportunityOrganizerUpdate,
    ReportCreate,
    ReportRead,
    TagWithCount,
    TypeWithCount,
)
from app.services.opportunities import service as svc

router = APIRouter(tags=["opportunities"])


def _ip(request: Request) -> str | None:
    return request.client.host if request.client else None


# ---------- Public endpoints ----------

@router.get("/opportunities", response_model=Page[OpportunityListItem], dependencies=[ExploreGate])
def list_opportunities(
    db: DBSession,
    response: Response,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    page: int | None = Query(None, ge=1),
    page_size: int | None = Query(None, ge=1, le=100),
    opp_type: list[OpportunityType] | None = Query(None, alias="type"),
    location_type: LocationType | None = None,
    country_code: str | None = Query(None, min_length=2, max_length=2),
    compensation_type: CompensationType | None = None,
    verification_status: VerificationStatus | None = None,
    is_featured: bool | None = None,
    tag: list[str] | None = Query(None),
    q: str | None = Query(None, min_length=1, max_length=100),
    open_only: bool = False,
    include_expired: bool = False,
    deadline_after: datetime | None = None,
    deadline_before: datetime | None = None,
    sort: Literal["deadline", "deadline_soon", "newest", "trust_score", "popular"] = "deadline",
):
    if page is not None:
        effective_limit = page_size or limit
        effective_offset = (page - 1) * effective_limit
    else:
        effective_limit = page_size or limit
        effective_offset = offset

    items, total = svc.list_public(
        db,
        limit=effective_limit,
        offset=effective_offset,
        opp_types=opp_type,
        location_type=location_type,
        country_code=country_code,
        compensation_type=compensation_type,
        verification_status=verification_status,
        is_featured=is_featured,
        tags=tag,
        q=q,
        open_only=open_only,
        include_expired=include_expired,
        deadline_after=deadline_after,
        deadline_before=deadline_before,
        sort=sort,
    )
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    return {"items": items, "total": total, "limit": effective_limit, "offset": effective_offset}


@router.get("/opportunities/types", response_model=list[TypeWithCount], dependencies=[ExploreGate])
def get_opportunity_types(db: DBSession, response: Response):
    """Returns opportunity types with counts of published listings."""
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    return svc.get_types_with_counts(db)


@router.get("/tags", response_model=list[TagWithCount], dependencies=[ExploreGate])
def get_tags(db: DBSession, response: Response):
    """Returns tags with counts of published listings."""
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    return svc.get_tags_with_counts(db)


@router.get("/opportunities/{slug}", response_model=OpportunityDetail, dependencies=[ExploreGate])
def get_opportunity(db: DBSession, slug: str, response: Response):
    opp = svc.get_public_by_slug(db, slug)
    if opp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    return opp


# ---------- User actions (Save / Unsave / Report) ----------

@router.post("/opportunities/{opp_id}/save", status_code=status.HTTP_200_OK)
def save_opportunity(
    db: DBSession,
    current_user: CurrentUser,
    opp_id: uuid.UUID,
):
    ok = svc.save_opportunity(db, current_user.id, opp_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
    return {"message": "Opportunity saved"}


@router.delete("/opportunities/{opp_id}/save", status_code=status.HTTP_204_NO_CONTENT)
def unsave_opportunity(
    db: DBSession,
    current_user: CurrentUser,
    opp_id: uuid.UUID,
):
    svc.unsave_opportunity(db, current_user.id, opp_id)


@router.post(
    "/opportunities/{opp_id}/report",
    response_model=ReportRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(max_requests=10, window_seconds=60))],
)
def report_opportunity(
    db: DBSession,
    current_user: CurrentUser,
    request: Request,
    opp_id: uuid.UUID,
    data: ReportCreate,
):
    try:
        return svc.report_opportunity(
            db, current_user, opp_id, data.reason, data.details, _ip(request)
        )
    except svc.CannotReportOwnPostingError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except svc.DuplicateReportError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except svc.InvalidOpportunityError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


# ---------- Organizer endpoints ----------

@router.post("/organizations/{org_id}/opportunities", response_model=OpportunityDetail, status_code=status.HTTP_201_CREATED)
def organizer_create_opportunity(
    db: DBSession,
    user: OrganizerUser,
    request: Request,
    org_id: uuid.UUID,
    data: OpportunityOrganizerCreate,
):
    try:
        return svc.create_organizer_opportunity(db, org_id, data, user, _ip(request))
    except svc.OrganizationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found") from exc
    except svc.PermissionDeniedError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except svc.InvalidOpportunityError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.patch("/opportunities/{opp_id}", response_model=OpportunityDetail)
def organizer_update_opportunity(
    db: DBSession,
    user: OrganizerUser,
    request: Request,
    opp_id: uuid.UUID,
    data: OpportunityOrganizerUpdate,
):
    opp = db.get(Opportunity, opp_id)
    if opp is None or opp.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
    try:
        return svc.update_organizer_opportunity(db, opp, data, user, _ip(request))
    except svc.PermissionDeniedError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except svc.InvalidOpportunityError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.delete("/opportunities/{opp_id}", status_code=status.HTTP_204_NO_CONTENT)
def organizer_delete_opportunity(
    db: DBSession,
    user: OrganizerUser,
    request: Request,
    opp_id: uuid.UUID,
):
    opp = db.get(Opportunity, opp_id)
    if opp is None or opp.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
    try:
        svc.delete_organizer_opportunity(db, opp, user, _ip(request))
    except svc.PermissionDeniedError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except svc.CannotDeleteWithApplicationsError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/opportunities/{opp_id}/submit", response_model=OpportunityDetail)
def organizer_submit_opportunity(
    db: DBSession,
    user: OrganizerUser,
    request: Request,
    opp_id: uuid.UUID,
):
    opp = db.get(Opportunity, opp_id)
    if opp is None or opp.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
    try:
        return svc.submit_organizer_opportunity(db, opp, user, _ip(request))
    except svc.PermissionDeniedError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except svc.InvalidOpportunityError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
