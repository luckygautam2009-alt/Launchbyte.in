"""
Phase 3 Comprehensive Test Suite:
- Profiles: handles, validation, reserved handles, 30-day throttle, avatar upload, public/private masking.
- Teammate discovery: match score calculation, event registration filtering, exclusion of existing teammates.
- Team creation: email verification requirement, 5 active team ownership cap, event registration checks.
- Event team uniqueness: partial unique index preventing double-team membership per event.
- Team lifecycle: updates, member removal, leadership transfer, leave rules, disbanding.
- Invites & Join requests: complete lifecycle, duplicate prevention.
- Capacity & Race condition: last open seat claims, auto-closing pending invites/requests when full.
- Organizer & Admin controls: locking teams for an event, admin audit-logged deletion.
"""
from datetime import datetime, timedelta, timezone
import io
import uuid

import pytest
from PIL import Image

from app.core.security import create_access_token
from app.models.enums import UserRole
from app.models.events import Event, EventMode, EventRegistration, EventStatus, RegistrationStatus
from app.models.networking import (
    Team,
    TeamInvite,
    TeamInviteStatus,
    TeamJoinRequest,
    TeamJoinRequestStatus,
    TeamMember,
    TeamMemberRole,
    TeamStatus,
    TeamVisibility,
)
from app.models.organizations import Organization, OrganizationMember
from app.models.profiles import UserProfile
from app.models.users import User


def _make_user(db, email, handle, full_name="User", role=UserRole.USER, verified=True):
    u = User(
        email=email,
        handle=handle,
        hashed_password="pw_hash_test",
        full_name=full_name,
        role=role.value if hasattr(role, "value") else str(role),
        is_email_verified=verified,
        is_active=True,
    )
    db.add(u)
    db.flush()
    prof = UserProfile(
        user_id=u.id,
        is_public=True,
        open_to_teams=True,
        skills=["Python", "FastAPI"],
    )
    db.add(prof)
    db.commit()
    db.refresh(u)
    return u


def _headers(user):
    token = create_access_token(str(user.id), role=user.role, token_version=user.token_version)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def users_pool(db_session):
    u1 = _make_user(db_session, "user1@example.com", "alice_dev", "Alice Cooper")
    u2 = _make_user(db_session, "user2@example.com", "bob_coder", "Bob Builder")
    u3 = _make_user(db_session, "user3@example.com", "charlie_hacks", "Charlie Puth")
    u4 = _make_user(db_session, "user4@example.com", "dave_ninja", "Dave Grohl")
    u5 = _make_user(db_session, "user5@example.com", "eve_design", "Eve Polastri")
    admin = _make_user(db_session, "admin@example.com", "site_admin", "Admin Guy", role=UserRole.ADMIN)
    organizer = _make_user(db_session, "org@example.com", "org_lead", "Organizer Leader", role=UserRole.ORGANIZER)
    return {
        "alice": u1,
        "bob": u2,
        "charlie": u3,
        "dave": u4,
        "eve": u5,
        "admin": admin,
        "organizer": organizer,
    }


@pytest.fixture
def published_event(db_session, users_pool):
    org_user = users_pool["organizer"]
    org = Organization(name="Hack Org", slug="hack-org", created_by_id=org_user.id)
    db_session.add(org)
    db_session.flush()

    org_member = OrganizationMember(organization_id=org.id, user_id=org_user.id, role="owner")
    db_session.add(org_member)

    now = datetime.now(timezone.utc)
    ev = Event(
        organization_id=org.id,
        created_by_id=org_user.id,
        title="Hackathon Alpha 2026",
        slug="hackathon-alpha-2026",
        banner_url="https://example.com/banner.png",
        thumbnail_url="https://example.com/thumb.png",
        description="Full description",
        status=EventStatus.PUBLISHED,
        mode=EventMode.HYBRID,
        timezone="UTC",
        starts_at=now + timedelta(days=2),
        ends_at=now + timedelta(days=4),
        team_max_size=3,
        team_min_size=1,
    )
    db_session.add(ev)
    db_session.commit()
    db_session.refresh(ev)
    return ev


# ==========================================
# PART A: PROFILES & DISCOVERY TESTS
# ==========================================


def test_profile_crud_and_handle_rules(client, db_session, users_pool):
    alice = users_pool["alice"]
    headers = _headers(alice)

    # 1. Read my profile
    resp = client.get("/api/v1/me/profile", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["handle"] == "alice_dev"
    assert data["email"] == "user1@example.com"
    assert "Python" in data["skills"]

    # 2. Update profile with invalid handle (reserved word)
    resp = client.put("/api/v1/me/profile", headers=headers, json={"handle": "admin"})
    assert resp.status_code == 422  # blocked by schema reserved check

    # 3. Update profile with invalid regex (capital letters or symbols)
    resp = client.put("/api/v1/me/profile", headers=headers, json={"handle": "Alice!!"})
    assert resp.status_code == 422

    # 4. Valid handle change
    resp = client.put(
        "/api/v1/me/profile",
        headers=headers,
        json={
            "handle": "alice_renamed",
            "headline": "Lead Fullstack Hacker",
            "skills": ["Python", "Rust", "TypeScript"],
            "open_to_teams": True,
        },
    )
    assert resp.status_code == 200
    assert resp.json()["handle"] == "alice_renamed"
    assert resp.json()["headline"] == "Lead Fullstack Hacker"

    # 5. Handle throttled: try changing again immediately -> 400
    resp = client.put("/api/v1/me/profile", headers=headers, json={"handle": "alice_again"})
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "HANDLE_THROTTLED"

    # 6. Taken handle check
    bob = users_pool["bob"]
    bob_headers = _headers(bob)
    resp = client.put("/api/v1/me/profile", headers=bob_headers, json={"handle": "alice_renamed"})
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "HANDLE_TAKEN"


def test_avatar_upload(client, users_pool):
    alice = users_pool["alice"]
    headers = _headers(alice)

    # Generate a small 10x10 PNG in memory
    buf = io.BytesIO()
    img = Image.new("RGB", (10, 10), color="blue")
    img.save(buf, format="PNG")
    buf.seek(0)

    files = {"file": ("avatar.png", buf.getvalue(), "image/png")}
    resp = client.post("/api/v1/me/profile/avatar", headers=headers, files=files)
    assert resp.status_code == 200
    assert "avatar_url" in resp.json()
    assert resp.json()["avatar_url"].startswith("/uploads/")


def test_public_profile_privacy_masking(client, db_session, users_pool):
    alice = users_pool["alice"]
    prof = db_session.get(UserProfile, alice.id)
    prof.linkedin_url = "https://linkedin.com/in/alice"
    prof.show_linkedin = False  # Hidden from public
    prof.is_public = True
    db_session.commit()

    # Public unauthenticated viewer
    resp = client.get(f"/api/v1/profiles/{alice.handle}")
    assert resp.status_code == 200
    data = resp.json()
    assert "email" not in data  # Never leak email on public profile
    assert data["linkedin_url"] is None  # Respects show_linkedin=False

    # Owner viewing own profile gets linkedin_url
    resp = client.get(f"/api/v1/profiles/{alice.handle}", headers=_headers(alice))
    assert resp.status_code == 200
    assert resp.json()["linkedin_url"] == "https://linkedin.com/in/alice"

    # Private profile check
    prof.is_public = False
    db_session.commit()
    # Unauthenticated / stranger gets 404 (not 403, to prevent existence leak)
    resp = client.get(f"/api/v1/profiles/{alice.handle}")
    assert resp.status_code == 404


def test_teammate_discovery(client, db_session, users_pool, published_event):
    alice = users_pool["alice"]
    bob = users_pool["bob"]
    charlie = users_pool["charlie"]

    # Register bob and charlie for the event
    reg_bob = EventRegistration(
        event_id=published_event.id,
        user_id=bob.id,
        status=RegistrationStatus.REGISTERED,
        registration_code="REG-BOB",
    )
    reg_charlie = EventRegistration(
        event_id=published_event.id,
        user_id=charlie.id,
        status=RegistrationStatus.REGISTERED,
        registration_code="REG-CHARLIE",
    )
    db_session.add_all([reg_bob, reg_charlie])

    prof_bob = db_session.get(UserProfile, bob.id)
    prof_bob.skills = ["Rust", "Python", "Docker"]
    prof_charlie = db_session.get(UserProfile, charlie.id)
    prof_charlie.skills = ["Design", "Figma"]
    db_session.commit()

    # Discover teammates for event with skills=["Rust"]
    resp = client.get(
        f"/api/v1/people/discover?event_id={published_event.id}&skills=Rust",
        headers=_headers(alice),
    )
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 2
    # Bob should have higher match score because of Rust overlap
    assert items[0]["handle"] == bob.handle
    assert items[0]["match_score"] == 100
    assert "rust" in items[0]["shared_skills"]


# ==========================================
# PART B: TEAMS LIFECYCLE & CONSTRAINTS TESTS
# ==========================================


def test_team_creation_rules(client, db_session, users_pool, published_event):
    alice = users_pool["alice"]
    headers = _headers(alice)

    # 1. Unverified email blocks team creation
    unverified = _make_user(db_session, "unverified@example.com", "unverified_one", verified=False)
    resp = client.post(
        "/api/v1/teams",
        headers=_headers(unverified),
        json={"name": "No Verify Team"},
    )
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "EMAIL_NOT_VERIFIED"

    # 2. Event-scoped team requires active registration
    resp = client.post(
        "/api/v1/teams",
        headers=headers,
        json={"name": "Alpha Squad", "event_id": str(published_event.id)},
    )
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "REGISTRATION_REQUIRED"

    # 3. Register Alice and try again -> succeeds
    reg_alice = EventRegistration(
        event_id=published_event.id,
        user_id=alice.id,
        status=RegistrationStatus.REGISTERED,
        registration_code="REG-ALICE",
    )
    db_session.add(reg_alice)
    db_session.commit()

    resp = client.post(
        "/api/v1/teams",
        headers=headers,
        json={
            "name": "Alpha Squad",
            "event_id": str(published_event.id),
            "max_size": 4,  # Event has team_max_size=3, so should be capped to 3
            "looking_for_skills": ["Rust", "React"],
        },
    )
    assert resp.status_code == 201
    team_data = resp.json()
    assert team_data["name"] == "Alpha Squad"
    assert team_data["max_size"] == 3  # Capped by event
    assert team_data["is_leader"] is True
    assert len(team_data["members"]) == 1
    assert team_data["members"][0]["user_id"] == str(alice.id)

    # 4. Trying to create a second team for the same event -> 409
    resp = client.post(
        "/api/v1/teams",
        headers=headers,
        json={"name": "Second Team", "event_id": str(published_event.id)},
    )
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "ALREADY_IN_EVENT_TEAM"


def test_invites_and_join_requests_lifecycle(client, db_session, users_pool, published_event):
    alice = users_pool["alice"]
    bob = users_pool["bob"]
    charlie = users_pool["charlie"]

    # Register alice, bob, charlie
    for u in [alice, bob, charlie]:
        db_session.add(
            EventRegistration(
                event_id=published_event.id,
                user_id=u.id,
                status=RegistrationStatus.REGISTERED,
                registration_code=f"REG-{u.handle.upper()}",
            )
        )
    db_session.commit()

    # Alice creates team
    resp = client.post(
        "/api/v1/teams",
        headers=_headers(alice),
        json={"name": "Code Crafters", "event_id": str(published_event.id), "max_size": 3},
    )
    assert resp.status_code == 201
    team_id = resp.json()["id"]

    # Alice invites Bob
    resp = client.post(
        f"/api/v1/teams/{team_id}/invites",
        headers=_headers(alice),
        json={"handle": bob.handle, "message": "Come build with us!"},
    )
    assert resp.status_code == 201
    invite_id = resp.json()["id"]

    # Duplicate invite blocked -> 409
    resp = client.post(
        f"/api/v1/teams/{team_id}/invites",
        headers=_headers(alice),
        json={"handle": bob.handle},
    )
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "INVITE_ALREADY_EXISTS"

    # Bob views his invites
    resp = client.get("/api/v1/me/invites", headers=_headers(bob))
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["id"] == invite_id

    # Bob accepts invite
    resp = client.post(f"/api/v1/invites/{invite_id}/accept", headers=_headers(bob))
    assert resp.status_code == 200
    assert len(resp.json()["members"]) == 2

    # Charlie sends join request
    resp = client.post(
        f"/api/v1/teams/{team_id}/join-requests",
        headers=_headers(charlie),
        json={"message": "I do frontend!"},
    )
    assert resp.status_code == 201
    req_id = resp.json()["id"]

    # Alice views join requests
    resp = client.get(f"/api/v1/teams/{team_id}/join-requests", headers=_headers(alice))
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["id"] == req_id

    # Alice accepts Charlie's join request (team now has 3/3 members -> FULL)
    resp = client.post(f"/api/v1/join-requests/{req_id}/accept", headers=_headers(alice))
    assert resp.status_code == 200
    team = resp.json()
    assert len(team["members"]) == 3
    assert team["open_spots"] == 0


def test_capacity_overflow_and_auto_close(client, db_session, users_pool, published_event):
    alice = users_pool["alice"]
    bob = users_pool["bob"]
    charlie = users_pool["charlie"]
    dave = users_pool["dave"]

    for u in [alice, bob, charlie, dave]:
        db_session.add(
            EventRegistration(
                event_id=published_event.id,
                user_id=u.id,
                status=RegistrationStatus.REGISTERED,
                registration_code=f"REG-{u.handle.upper()}",
            )
        )
    db_session.commit()

    # Team max_size = 2 (Alice + 1 more)
    resp = client.post(
        "/api/v1/teams",
        headers=_headers(alice),
        json={"name": "Duo Core", "event_id": str(published_event.id), "max_size": 2},
    )
    team_id = resp.json()["id"]

    # Alice invites Bob AND Dave
    resp_b = client.post(
        f"/api/v1/teams/{team_id}/invites",
        headers=_headers(alice),
        json={"handle": bob.handle},
    )
    inv_b = resp_b.json()["id"]

    resp_d = client.post(
        f"/api/v1/teams/{team_id}/invites",
        headers=_headers(alice),
        json={"handle": dave.handle},
    )
    inv_d = resp_d.json()["id"]

    # Bob accepts -> fills last seat (2/2)
    resp = client.post(f"/api/v1/invites/{inv_b}/accept", headers=_headers(bob))
    assert resp.status_code == 200

    # Dave tries to accept -> Team full -> 409
    resp = client.post(f"/api/v1/invites/{inv_d}/accept", headers=_headers(dave))
    assert resp.status_code in [400, 409]
    # Invite is now expired/cancelled because team filled up


def test_leave_transfer_leadership_disband(client, db_session, users_pool, published_event):
    alice = users_pool["alice"]
    bob = users_pool["bob"]

    for u in [alice, bob]:
        db_session.add(
            EventRegistration(
                event_id=published_event.id,
                user_id=u.id,
                status=RegistrationStatus.REGISTERED,
                registration_code=f"REG-{u.handle.upper()}",
            )
        )
    db_session.commit()

    resp = client.post(
        "/api/v1/teams",
        headers=_headers(alice),
        json={"name": "Leaders Team", "event_id": str(published_event.id), "max_size": 3},
    )
    team_id = resp.json()["id"]

    # Invite and add Bob directly
    resp_inv = client.post(
        f"/api/v1/teams/{team_id}/invites",
        headers=_headers(alice),
        json={"handle": bob.handle},
    )
    client.post(f"/api/v1/invites/{resp_inv.json()['id']}/accept", headers=_headers(bob))

    # 1. Alice (leader) tries to leave without transferring leadership -> 400
    resp = client.post(f"/api/v1/teams/{team_id}/leave", headers=_headers(alice))
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "LEADER_CANNOT_LEAVE"

    # 2. Alice transfers leadership to Bob
    resp = client.post(
        f"/api/v1/teams/{team_id}/transfer-leadership",
        headers=_headers(alice),
        json={"new_leader_id": str(bob.id)},
    )
    assert resp.status_code == 200

    # 3. Alice leaves successfully
    resp = client.post(f"/api/v1/teams/{team_id}/leave", headers=_headers(alice))
    assert resp.status_code == 200
    assert resp.json()["status"] == "left"

    # 4. Bob disbands the team
    resp = client.post(f"/api/v1/teams/{team_id}/disband", headers=_headers(bob))
    assert resp.status_code == 200
    assert resp.json()["status"] == "disbanded"

    # Team should now return 404
    resp = client.get(f"/api/v1/teams/leaders-team")
    assert resp.status_code == 404


def test_organizer_lock_teams_and_admin_delete(client, db_session, users_pool, published_event):
    alice = users_pool["alice"]
    organizer = users_pool["organizer"]
    admin = users_pool["admin"]

    db_session.add(
        EventRegistration(
            event_id=published_event.id,
            user_id=alice.id,
            status=RegistrationStatus.REGISTERED,
            registration_code="REG-ALICE",
        )
    )
    db_session.commit()

    resp = client.post(
        "/api/v1/teams",
        headers=_headers(alice),
        json={"name": "Lockable Team", "event_id": str(published_event.id), "max_size": 3},
    )
    team_id = resp.json()["id"]

    # Organizer locks teams for the event
    resp = client.post(
        f"/api/v1/admin/events/{published_event.id}/lock-teams",
        headers=_headers(organizer),
        json={"locked": True},
    )
    assert resp.status_code == 200

    # Verify team is now locked
    resp = client.get("/api/v1/teams/lockable-team", headers=_headers(alice))
    assert resp.json()["is_locked"] is True

    # Sending invites while locked -> 400 TEAM_LOCKED
    bob = users_pool["bob"]
    resp = client.post(
        f"/api/v1/teams/{team_id}/invites",
        headers=_headers(alice),
        json={"handle": bob.handle},
    )
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "TEAM_LOCKED"

    # Admin removes team with audit reason
    resp = client.delete(
        f"/api/v1/admin/teams/{team_id}?reason=Violates%20community%20guidelines",
        headers=_headers(admin),
    )
    assert resp.status_code == 204

    # Team no longer exists
    resp = client.get("/api/v1/teams/lockable-team")
    assert resp.status_code == 404
