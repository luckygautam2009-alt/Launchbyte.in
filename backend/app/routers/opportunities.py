from typing import Literal

from fastapi import APIRouter, HTTPException, Query, status

from app.dependencies.db import DBSession
from app.models.enums import LocationType, OpportunityType, VerificationStatus
from app.schemas.common import Page
from app.schemas.opportunities import OpportunityDetail, OpportunityListItem
from app.services.opportunities import service as svc

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


@router.get("", response_model=Page[OpportunityListItem])
def list_opportunities(
    db: DBSession,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    opp_type: OpportunityType | None = Query(None, alias="type"),
    location_type: LocationType | None = None,
    country_code: str | None = Query(None, min_length=2, max_length=2),
    verification_status: VerificationStatus | None = None,
    tag: str | None = Query(None, max_length=64),
    q: str | None = Query(None, min_length=1, max_length=100),
    include_expired: bool = False,
    sort: Literal["deadline", "newest"] = "deadline",
):
    items, total = svc.list_public(
        db,
        limit=limit,
        offset=offset,
        opp_type=opp_type,
        location_type=location_type,
        country_code=country_code,
        verification_status=verification_status,
        tag=tag,
        q=q,
        include_expired=include_expired,
        sort=sort,
    )
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/{slug}", response_model=OpportunityDetail)
def get_opportunity(db: DBSession, slug: str):
    opp = svc.get_public_by_slug(db, slug)
    if opp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
    return opp
