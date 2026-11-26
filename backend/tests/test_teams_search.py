import uuid
import pytest
from starlette.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.enums import UserRole
from app.models.users import User
from app.models.networking import Team, TeamMember, TeamMemberRole, TeamStatus, TeamVisibility
from app.core.security import create_access_token


def _create_verified_user(db: Session, email: str, handle: str) -> User:
    u = User(
        email=email,
        handle=handle,
        full_name=handle.capitalize(),
        hashed_password="fakehash",
        role=UserRole.USER,
        is_active=True,
        is_email_verified=True,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def _auth_headers(user: User) -> dict[str, str]:
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"Authorization": f"Bearer {token}"}


def test_team_search_by_name_description_and_skills(client: TestClient, db_session: Session):
    owner = _create_verified_user(db_session, "search_owner@example.com", "searchowner")

    # Team 1: Quantum AI Team, looking for Python, PyTorch
    t1 = Team(
        name="Quantum AI Hackers",
        slug="quantum-ai-hackers",
        description="Building next gen neural quantum models",
        owner_id=owner.id,
        created_by_id=owner.id,
        visibility=TeamVisibility.PUBLIC,
        status=TeamStatus.ACTIVE,
        max_size=4,
        looking_for_skills=["Python", "PyTorch", "FastAPI"],
    )
    # Team 2: Cyber Shield Team, looking for Rust, WebAssembly
    t2 = Team(
        name="CyberShield Security",
        slug="cybershield-security",
        description="Hardening distributed ledger nodes against sybil attacks",
        owner_id=owner.id,
        created_by_id=owner.id,
        visibility=TeamVisibility.PUBLIC,
        status=TeamStatus.ACTIVE,
        max_size=3,
        looking_for_skills=["Rust", "WebAssembly", "Cryptography"],
    )
    # Team 3: Web3 Fullstack, looking for React, TypeScript
    t3 = Team(
        name="Frontend Ninjas",
        slug="frontend-ninjas",
        description="Crafting responsive glassmorphic UI dashboards",
        owner_id=owner.id,
        created_by_id=owner.id,
        visibility=TeamVisibility.PUBLIC,
        status=TeamStatus.ACTIVE,
        max_size=2,
        looking_for_skills=["React", "TypeScript", "TailwindCSS"],
    )
    db_session.add_all([t1, t2, t3])
    db_session.commit()

    # Add owner as member to t1, t2, t3
    for t in [t1, t2, t3]:
        tm = TeamMember(team_id=t.id, user_id=owner.id, role=TeamMemberRole.LEADER)
        db_session.add(tm)
    db_session.commit()

    # 1. Search by name with `q`
    r_name = client.get("/api/v1/teams?q=quantum")
    assert r_name.status_code == 200
    data_name = r_name.json()
    slugs_name = [item["slug"] for item in data_name["items"]]
    assert "quantum-ai-hackers" in slugs_name
    assert "cybershield-security" not in slugs_name

    # 2. Search by description with `q`
    r_desc = client.get("/api/v1/teams?q=sybil")
    assert r_desc.status_code == 200
    data_desc = r_desc.json()
    slugs_desc = [item["slug"] for item in data_desc["items"]]
    assert "cybershield-security" in slugs_desc
    assert "quantum-ai-hackers" not in slugs_desc

    # 3. Search by skill with `q`
    r_q_skill = client.get("/api/v1/teams?q=rust")
    assert r_q_skill.status_code == 200
    data_q_skill = r_q_skill.json()
    slugs_q_skill = [item["slug"] for item in data_q_skill["items"]]
    assert "cybershield-security" in slugs_q_skill
    assert "frontend-ninjas" not in slugs_q_skill

    # 4. Filter by `skills` query parameter
    r_skills = client.get("/api/v1/teams?skills=React")
    assert r_skills.status_code == 200
    data_skills = r_skills.json()
    slugs_skills = [item["slug"] for item in data_skills["items"]]
    assert "frontend-ninjas" in slugs_skills
    assert "cybershield-security" not in slugs_skills

    # 5. Filter by comma-separated `skills`
    r_multi_skills = client.get("/api/v1/teams?skills=React,PyTorch")
    assert r_multi_skills.status_code == 200
    data_multi = r_multi_skills.json()
    slugs_multi = [item["slug"] for item in data_multi["items"]]
    assert "frontend-ninjas" in slugs_multi
    assert "quantum-ai-hackers" in slugs_multi
    assert "cybershield-security" not in slugs_multi


def test_team_search_has_open_spots_filter(client: TestClient, db_session: Session):
    owner = _create_verified_user(db_session, "spot_owner@example.com", "spotowner")
    member2 = _create_verified_user(db_session, "member2@example.com", "member2")

    # Team Full: max_size = 2, has 2 members
    t_full = Team(
        name="Full Team Maxed",
        slug="full-team-maxed",
        description="We are already completely full",
        owner_id=owner.id,
        created_by_id=owner.id,
        visibility=TeamVisibility.PUBLIC,
        status=TeamStatus.ACTIVE,
        max_size=2,
    )
    # Team Open: max_size = 3, has 1 member
    t_open = Team(
        name="Open Spots Available",
        slug="open-spots-available",
        description="We need 2 more developers",
        owner_id=owner.id,
        created_by_id=owner.id,
        visibility=TeamVisibility.PUBLIC,
        status=TeamStatus.ACTIVE,
        max_size=3,
    )
    db_session.add_all([t_full, t_open])
    db_session.commit()

    db_session.add(TeamMember(team_id=t_full.id, user_id=owner.id, role=TeamMemberRole.LEADER))
    db_session.add(TeamMember(team_id=t_full.id, user_id=member2.id, role=TeamMemberRole.MEMBER))
    db_session.add(TeamMember(team_id=t_open.id, user_id=owner.id, role=TeamMemberRole.LEADER))
    db_session.commit()

    # Query without filter: both present
    r_all = client.get("/api/v1/teams")
    assert r_all.status_code == 200
    slugs_all = [item["slug"] for item in r_all.json()["items"]]
    assert "full-team-maxed" in slugs_all
    assert "open-spots-available" in slugs_all

    # Query with has_open_spots=true: only open team present
    r_open = client.get("/api/v1/teams?has_open_spots=true")
    assert r_open.status_code == 200
    slugs_open = [item["slug"] for item in r_open.json()["items"]]
    assert "open-spots-available" in slugs_open
    assert "full-team-maxed" not in slugs_open
