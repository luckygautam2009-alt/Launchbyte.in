import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.dependencies.auth import AdminUser
from app.dependencies.db import DBSession
from app.models.team import SiteTeamMember
from app.schemas.team import (
    TeamMemberCreate,
    TeamMemberRead,
    TeamMemberReorderRequest,
    TeamMemberUpdate,
)

router = APIRouter(tags=["about & team"])


# ---------- Public ----------

@router.get("/about/team", response_model=list[TeamMemberRead])
def get_public_team(db: DBSession) -> list[TeamMemberRead]:
    """Public list of active team members ordered by display order."""
    members = db.scalars(
        select(SiteTeamMember)
        .where(SiteTeamMember.is_active.is_(True))
        .order_by(SiteTeamMember.display_order.asc(), SiteTeamMember.created_at.asc())
    ).all()
    return list(members)


# ---------- Admin ----------

@router.post("/admin/about/team", response_model=TeamMemberRead, status_code=status.HTTP_201_CREATED)
def create_team_member(
    db: DBSession,
    admin: AdminUser,
    data: TeamMemberCreate,
) -> TeamMemberRead:
    member = SiteTeamMember(**data.model_dump())
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.patch("/admin/about/team/{member_id}", response_model=TeamMemberRead)
def update_team_member(
    db: DBSession,
    admin: AdminUser,
    member_id: uuid.UUID,
    data: TeamMemberUpdate,
) -> TeamMemberRead:
    member = db.get(SiteTeamMember, member_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")

    payload = data.model_dump(exclude_unset=True)
    for field, val in payload.items():
        setattr(member, field, val)

    db.commit()
    db.refresh(member)
    return member


@router.delete("/admin/about/team/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team_member(
    db: DBSession,
    admin: AdminUser,
    member_id: uuid.UUID,
):
    member = db.get(SiteTeamMember, member_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")

    db.delete(member)
    db.commit()


@router.put("/admin/about/team/reorder", response_model=list[TeamMemberRead])
def reorder_team_members(
    db: DBSession,
    admin: AdminUser,
    data: TeamMemberReorderRequest,
) -> list[TeamMemberRead]:
    for item in data.orders:
        member = db.get(SiteTeamMember, item.id)
        if member is not None:
            member.display_order = item.display_order

    db.commit()
    all_members = db.scalars(
        select(SiteTeamMember).order_by(SiteTeamMember.display_order.asc(), SiteTeamMember.created_at.asc())
    ).all()
    return list(all_members)
