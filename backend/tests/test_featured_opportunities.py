import uuid
from datetime import datetime, timezone, timedelta
import pytest
from starlette.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.users import User
from app.models.organizations import Organization
from app.models.enums import UserRole, OpportunityType, OpportunityStatus, LocationType, VerificationStatus, CompensationType
from app.models.opportunities import Opportunity
from app.core.security import create_access_token


def _make_org(db: Session, name: str, slug: str) -> Organization:
    org = Organization(name=name, slug=slug)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


def _make_user(db: Session, email: str, handle: str, role: UserRole) -> User:
    u = User(
        email=email,
        handle=handle,
        full_name=handle.capitalize(),
        hashed_password="fakehashpw",
        role=role,
        is_active=True,
        is_email_verified=True,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def _auth_headers(user: User) -> dict[str, str]:
    token = create_access_token(subject=str(user.id), role=user.role.value, token_version=user.token_version)
    return {"Authorization": f"Bearer {token}"}


def test_public_access_to_featured_opportunities(client: TestClient, db_session: Session):
    # Create featured and non-featured opportunities in DB
    org = _make_org(db_session, "Delhi NCR Tech Guild", "delhi-ncr-tech-guild")
    now = datetime.now(timezone.utc)
    future = now + timedelta(days=30)

    opp_feat = Opportunity(
        title="Delhi NCR AI Hackathon",
        slug="delhi-ncr-ai-hackathon",
        organization_id=org.id,
        type=OpportunityType.HACKATHON,
        status=OpportunityStatus.PUBLISHED,
        location_type=LocationType.HYBRID,
        location_text="Delhi NCR, India",
        starts_at=future,
        ends_at=future + timedelta(days=2),
        deadline_at=future - timedelta(days=2),
        is_featured=True,
        verification_status=VerificationStatus.VERIFIED,
        compensation_type=CompensationType.UNPAID,
    )
    opp_regular = Opportunity(
        title="Regular Dev Sprint",
        slug="regular-dev-sprint",
        organization_id=org.id,
        type=OpportunityType.HACKATHON,
        status=OpportunityStatus.PUBLISHED,
        location_type=LocationType.REMOTE,
        starts_at=future,
        deadline_at=future,
        is_featured=False,
        verification_status=VerificationStatus.UNVERIFIED,
        compensation_type=CompensationType.UNPAID,
    )
    db_session.add_all([opp_feat, opp_regular])
    db_session.commit()

    # Public unauthenticated request with is_featured=true
    resp = client.get("/api/v1/opportunities?is_featured=true")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data

    slugs = [item["slug"] for item in data["items"]]
    assert "delhi-ncr-ai-hackathon" in slugs
    assert "regular-dev-sprint" not in slugs


def test_admin_permissions_to_modify_featured_status(client: TestClient, db_session: Session):
    admin = _make_user(db_session, "admin_opp@example.com", "adminopp", UserRole.ADMIN)
    member = _make_user(db_session, "member_opp@example.com", "memberopp", UserRole.USER)
    org = _make_org(db_session, "Protected Org", "protected-org")

    now = datetime.now(timezone.utc)
    opp = Opportunity(
        title="Hackathon Protected",
        slug="hackathon-protected",
        organization_id=org.id,
        type=OpportunityType.HACKATHON,
        status=OpportunityStatus.PUBLISHED,
        location_type=LocationType.REMOTE,
        is_featured=False,
        verification_status=VerificationStatus.UNVERIFIED,
        compensation_type=CompensationType.UNPAID,
    )
    db_session.add(opp)
    db_session.commit()
    db_session.refresh(opp)

    # 1. Unauthenticated request to admin endpoint -> 401
    r_unauth = client.patch(
        f"/api/v1/admin/opportunities/{opp.id}",
        json={"is_featured": True},
    )
    assert r_unauth.status_code == 401

    # 2. Regular member request -> 403 Forbidden
    r_forbidden = client.patch(
        f"/api/v1/admin/opportunities/{opp.id}",
        json={"is_featured": True},
        headers=_auth_headers(member),
    )
    assert r_forbidden.status_code == 403

    # 3. Admin request -> 200 OK
    r_ok = client.patch(
        f"/api/v1/admin/opportunities/{opp.id}",
        json={"is_featured": True},
        headers=_auth_headers(admin),
    )
    assert r_ok.status_code == 200
    assert r_ok.json()["is_featured"] is True
