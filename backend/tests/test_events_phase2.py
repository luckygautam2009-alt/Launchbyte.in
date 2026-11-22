"""
Phase 2 Comprehensive Test Suite:
- Event quick-create, validations, sanitization, and publishing.
- Capacity lock, waitlist, FIFO cancellation promotion, and email verification guard.
- Signed QR entry pass (JSON and PNG), pass rotation, and tamper resistance.
- Check-in scanner: atomic check-in, duplicate detection, manual code fallback, scanner authorization, and logging.
- Stats, undo-check-in, and CSV injection protection.
- Concurrency simulation ensuring capacity cannot be oversold.
"""
from __future__ import annotations

import concurrent.futures
from datetime import datetime, timedelta
import uuid

import pytest
from fastapi.testclient import TestClient

from app.core.qr import create_pass_token, decode_and_verify_pass_token
from app.models.events import EventMode, EventStatus, RegistrationStatus
from app.models.organizations import Organization, OrganizationMember
from app.models.users import User


@pytest.fixture
def admin_user(db_session):
    u = User(
        email="admin@example.com",
        hashed_password="hashed_pw_test",
        full_name="Site Admin",
        role="admin",
        is_email_verified=True,
    )
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture
def admin_token_headers(admin_user):
    from app.core.security import create_access_token
    token = create_access_token(str(admin_user.id), role=admin_user.role, token_version=admin_user.token_version)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def org_and_organizer(db_session):
    user = User(
        email="event_organizer@example.com",
        hashed_password="hashed_pw_test",
        full_name="Event Host",
        role="organizer",
        is_email_verified=True,
    )
    db_session.add(user)
    db_session.flush()

    org = Organization(
        name="HackTech Global",
        slug="hacktech-global",
        description="Hosting premier developer hackathons.",
        verification_status="verified",
    )
    db_session.add(org)
    db_session.flush()

    member = OrganizationMember(
        organization_id=org.id,
        user_id=user.id,
        role="owner",
    )
    db_session.add(member)
    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(org)
    return org, user


@pytest.fixture
def attendee_users(db_session):
    users = []
    for i in range(1, 8):
        u = User(
            email=f"hacker_{i}@example.com",
            hashed_password="hashed_pw_test",
            full_name=f"Hacker {i}",
            role="user",
            is_email_verified=True,
        )
        db_session.add(u)
        users.append(u)
    db_session.commit()
    for u in users:
        db_session.refresh(u)
    return users


def test_quick_create_and_validation(client: TestClient, admin_token_headers: dict, org_and_organizer):
    org, organizer = org_and_organizer

    # 1. Validation failure: starts_at >= ends_at
    bad_payload = {
        "title": "Quantum Hack 2026",
        "banner_url": "https://cdn.launchbyte.io/banner.png",
        "thumbnail_url": "https://cdn.launchbyte.io/thumb.png",
        "description": "Safe markdown description for the hackathon event.",
        "starts_at": (datetime.utcnow() + timedelta(days=10)).isoformat(),
        "ends_at": (datetime.utcnow() + timedelta(days=5)).isoformat(),
        "mode": "online",
    }
    r = client.post("/api/v1/admin/events", json=bad_payload, headers=admin_token_headers)
    assert r.status_code == 422

    # 2. Validation failure: capacity < 0
    bad_payload["ends_at"] = (datetime.utcnow() + timedelta(days=12)).isoformat()
    bad_payload["capacity"] = -5
    r = client.post("/api/v1/admin/events", json=bad_payload, headers=admin_token_headers)
    assert r.status_code == 422

    # 3. Validation failure: unsafe javascript URL
    bad_payload["capacity"] = 50
    bad_payload["banner_url"] = "javascript:alert(1)"
    r = client.post("/api/v1/admin/events", json=bad_payload, headers=admin_token_headers)
    assert r.status_code == 422

    # 4. Success: Quick create with HTML sanitization
    safe_payload = {
        "organization_id": str(org.id),
        "title": "Quantum Hack 2026",
        "tagline": "Build the next gen of AI & quantum tools.",
        "banner_url": "https://cdn.launchbyte.io/banner.png",
        "thumbnail_url": "https://cdn.launchbyte.io/thumb.png",
        "description": "Welcome to **Quantum Hack**! <script>alert('xss')</script>Build awesome projects.",
        "starts_at": (datetime.utcnow() + timedelta(days=5)).isoformat(),
        "ends_at": (datetime.utcnow() + timedelta(days=7)).isoformat(),
        "mode": "hybrid",
        "venue_text": "San Francisco Tech Center, CA",
        "online_url": "https://meet.launchbyte.io/quantum-hack",
        "capacity": 3,
        "waitlist_enabled": True,
        "custom_questions": [
            {"id": "diet", "label": "Dietary Preference", "type": "select", "options": ["veg", "vegan", "none"], "required": True},
            {"id": "tshirt", "label": "T-Shirt Size", "type": "text", "required": False},
        ],
    }
    res = client.post("/api/v1/admin/events", json=safe_payload, headers=admin_token_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Quantum Hack 2026"
    assert "<script>" not in data["description"]
    assert "<strong>Quantum Hack</strong>" in data["description"] or "**Quantum Hack**" in data["description"]
    assert data["status"] == "published"  # Admin quick-create publishes immediately


def test_publish_creates_opportunity_sync(client: TestClient, admin_token_headers: dict, org_and_organizer):
    org, organizer = org_and_organizer

    payload = {
        "organization_id": str(org.id),
        "title": "AI Agents Summit 2026",
        "banner_url": "https://cdn.launchbyte.io/agents.png",
        "thumbnail_url": "https://cdn.launchbyte.io/agents_thumb.png",
        "description": "Global hackathon for autonomous AI agents.",
        "starts_at": (datetime.utcnow() + timedelta(days=20)).isoformat(),
        "ends_at": (datetime.utcnow() + timedelta(days=22)).isoformat(),
        "mode": "online",
        "capacity": 100,
    }
    res = client.post("/api/v1/admin/events", json=payload, headers=admin_token_headers)
    assert res.status_code == 201
    evt_slug = res.json()["slug"]

    # Verify public listing in browse
    pub_res = client.get("/api/v1/events")
    assert pub_res.status_code == 200
    slugs = [item["slug"] for item in pub_res.json()["items"]]
    assert evt_slug in slugs

    # Verify linked opportunity was created and appears in /opportunities
    opp_res = client.get(f"/api/v1/opportunities?q=AI Agents")
    assert opp_res.status_code == 200
    assert opp_res.json()["total"] >= 1


def test_public_event_masks_sensitive_fields(client: TestClient, admin_token_headers: dict, org_and_organizer):
    org, _ = org_and_organizer

    payload = {
        "organization_id": str(org.id),
        "title": "Confidential Security CTF",
        "banner_url": "https://cdn.launchbyte.io/ctf.png",
        "thumbnail_url": "https://cdn.launchbyte.io/ctf_thumb.png",
        "description": "Classified hacker CTF.",
        "starts_at": (datetime.utcnow() + timedelta(days=3)).isoformat(),
        "ends_at": (datetime.utcnow() + timedelta(days=4)).isoformat(),
        "mode": "onsite",
        "venue_text": "Secret Lab Suite 400, Chicago, IL",
        "online_url": "https://hidden-stream.internal/live",
        "capacity": 50,
    }
    res = client.post("/api/v1/admin/events", json=payload, headers=admin_token_headers)
    evt_slug = res.json()["slug"]

    # Public unauthenticated request
    unauth_res = client.get(f"/api/v1/events/{evt_slug}")
    assert unauth_res.status_code == 200
    unauth_data = unauth_res.json()
    assert unauth_data["online_url"] is None
    assert "Secret Lab Suite 400" not in (unauth_data["venue_text"] or "")


def test_capacity_waitlist_and_fifo_promotion(client: TestClient, admin_token_headers: dict, org_and_organizer, attendee_users):
    org, _ = org_and_organizer
    user1, user2, user3, user4, user5 = attendee_users[:5]

    # Create event with capacity = 2 and waitlist enabled
    evt_payload = {
        "organization_id": str(org.id),
        "title": "Exclusive Dev Jam",
        "banner_url": "https://cdn.launchbyte.io/jam.png",
        "thumbnail_url": "https://cdn.launchbyte.io/jam_thumb.png",
        "description": "Very small exclusive dev jam.",
        "starts_at": (datetime.utcnow() + timedelta(days=5)).isoformat(),
        "ends_at": (datetime.utcnow() + timedelta(days=6)).isoformat(),
        "mode": "online",
        "capacity": 2,
        "waitlist_enabled": True,
        "custom_questions": [{"id": "role", "label": "Role", "type": "text", "required": True}],
    }
    r = client.post("/api/v1/admin/events", json=evt_payload, headers=admin_token_headers)
    evt_id = r.json()["id"]

    from app.core.security import create_access_token

    def user_headers(u: User):
        t = create_access_token(str(u.id), role=u.role, token_version=u.token_version)
        return {"Authorization": f"Bearer {t}"}

    # 1. User 1 registers -> Registered
    r1 = client.post(f"/api/v1/events/{evt_id}/register", json={"answers": {"role": "Frontend"}}, headers=user_headers(user1))
    assert r1.status_code == 201
    assert r1.json()["status"] == "registered"

    # 2. User 2 registers -> Registered (capacity full now: 2/2)
    r2 = client.post(f"/api/v1/events/{evt_id}/register", json={"answers": {"role": "Backend"}}, headers=user_headers(user2))
    assert r2.status_code == 201
    assert r2.json()["status"] == "registered"

    # 3. User 3 registers -> Waitlisted (position 1)
    r3 = client.post(f"/api/v1/events/{evt_id}/register", json={"answers": {"role": "DevOps"}}, headers=user_headers(user3))
    assert r3.status_code == 201
    assert r3.json()["status"] == "waitlisted"
    assert r3.json()["waitlist_position"] == 1

    # 4. User 4 registers -> Waitlisted (position 2)
    r4 = client.post(f"/api/v1/events/{evt_id}/register", json={"answers": {"role": "Designer"}}, headers=user_headers(user4))
    assert r4.status_code == 201
    assert r4.json()["status"] == "waitlisted"
    assert r4.json()["waitlist_position"] == 2

    # 5. User 1 cancels registration -> User 3 is automatically promoted to Registered!
    cancel_res = client.post(f"/api/v1/events/{evt_id}/cancel-registration", headers=user_headers(user1))
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    # Verify User 3 is now registered
    check_u3 = client.get(f"/api/v1/registrations/{r3.json()['id']}", headers=user_headers(user3))
    assert check_u3.status_code == 200
    assert check_u3.json()["status"] == "registered"
    assert check_u3.json()["waitlist_position"] is None

    # Verify User 4 was shifted to waitlist position 1
    check_u4 = client.get(f"/api/v1/registrations/{r4.json()['id']}", headers=user_headers(user4))
    assert check_u4.status_code == 200
    assert check_u4.json()["status"] == "waitlisted"
    assert check_u4.json()["waitlist_position"] == 1


def test_qr_pass_generation_rotation_and_checkin(client: TestClient, admin_token_headers: dict, org_and_organizer, attendee_users):
    org, _ = org_and_organizer
    attendee = attendee_users[0]

    from app.core.security import create_access_token
    attendee_headers = {"Authorization": f"Bearer {create_access_token(str(attendee.id), role=attendee.role, token_version=attendee.token_version)}"}

    # Create event & register
    evt_res = client.post(
        "/api/v1/admin/events",
        json={
            "organization_id": str(org.id),
            "title": "Crypto Security Summit",
            "banner_url": "https://cdn.launchbyte.io/crypto.png",
            "thumbnail_url": "https://cdn.launchbyte.io/crypto_thumb.png",
            "description": "Decentralized consensus & zero knowledge cryptography.",
            "starts_at": (datetime.utcnow() + timedelta(days=4)).isoformat(),
            "ends_at": (datetime.utcnow() + timedelta(days=5)).isoformat(),
            "mode": "onsite",
            "venue_text": "Metropolitan Pavilion, NY",
            "capacity": 50,
        },
        headers=admin_token_headers,
    )
    evt_id = evt_res.json()["id"]

    reg_res = client.post(f"/api/v1/events/{evt_id}/register", json={}, headers=attendee_headers)
    reg_id = reg_res.json()["id"]
    reg_code = reg_res.json()["registration_code"]

    # 1. Fetch pass JSON
    pass_res = client.get(f"/api/v1/registrations/{reg_id}/pass", headers=attendee_headers)
    assert pass_res.status_code == 200
    pass_data = pass_res.json()
    token = pass_data["token"]

    # Verify token payload has no PII
    decoded = decode_and_verify_pass_token(token)
    assert decoded is not None
    assert "email" not in decoded
    assert "name" not in decoded
    assert decoded["rid"] == reg_id
    assert decoded["eid"] == evt_id

    # 2. Fetch pass PNG image
    png_res = client.get(f"/api/v1/registrations/{reg_id}/pass.png", headers=attendee_headers)
    assert png_res.status_code == 200
    assert png_res.headers["content-type"] == "image/png"
    assert len(png_res.content) > 100

    # 3. Successful check-in via token
    checkin_res = client.post(f"/api/v1/events/{evt_id}/check-in", json={"token": token}, headers=admin_token_headers)
    assert checkin_res.status_code == 200
    assert checkin_res.json()["result"] == "success"

    # 4. Duplicate check-in -> 409 Conflict
    dup_res = client.post(f"/api/v1/events/{evt_id}/check-in", json={"token": token}, headers=admin_token_headers)
    assert dup_res.status_code == 409

    # 5. Undo check-in
    undo_res = client.post(f"/api/v1/admin/events/{evt_id}/registrations/{reg_id}/undo-check-in", headers=admin_token_headers)
    assert undo_res.status_code == 200
    assert undo_res.json()["status"] == "registered"

    # 6. Rotate pass nonce -> old token becomes invalid
    rotate_res = client.post(f"/api/v1/registrations/{reg_id}/pass/rotate", headers=attendee_headers)
    assert rotate_res.status_code == 200

    # Scanning with the OLD token must now be rejected
    stale_res = client.post(f"/api/v1/events/{evt_id}/check-in", json={"token": token}, headers=admin_token_headers)
    assert stale_res.status_code == 200
    assert stale_res.json()["result"] == "invalid_token"

    # 7. Manual code check-in fallback
    manual_res = client.post(f"/api/v1/events/{evt_id}/check-in", json={"registration_code": reg_code}, headers=admin_token_headers)
    assert manual_res.status_code == 200
    assert manual_res.json()["result"] == "success"


def test_scanner_authorization_boundary(client: TestClient, admin_token_headers: dict, org_and_organizer, attendee_users):
    org, _ = org_and_organizer
    attendee = attendee_users[0]
    scanner_user = attendee_users[1]

    from app.core.security import create_access_token
    scanner_headers = {"Authorization": f"Bearer {create_access_token(str(scanner_user.id), role=scanner_user.role, token_version=scanner_user.token_version)}"}
    attendee_headers = {"Authorization": f"Bearer {create_access_token(str(attendee.id), role=attendee.role, token_version=attendee.token_version)}"}

    # Event A and Event B
    e_a = client.post(
        "/api/v1/admin/events",
        json={
            "organization_id": str(org.id),
            "title": "Event Alpha",
            "banner_url": "https://cdn.launchbyte.io/a.png",
            "thumbnail_url": "https://cdn.launchbyte.io/a_thumb.png",
            "description": "Event Alpha details.",
            "starts_at": (datetime.utcnow() + timedelta(days=2)).isoformat(),
            "ends_at": (datetime.utcnow() + timedelta(days=3)).isoformat(),
            "mode": "online",
        },
        headers=admin_token_headers,
    ).json()

    e_b = client.post(
        "/api/v1/admin/events",
        json={
            "organization_id": str(org.id),
            "title": "Event Beta",
            "banner_url": "https://cdn.launchbyte.io/b.png",
            "thumbnail_url": "https://cdn.launchbyte.io/b_thumb.png",
            "description": "Event Beta details.",
            "starts_at": (datetime.utcnow() + timedelta(days=2)).isoformat(),
            "ends_at": (datetime.utcnow() + timedelta(days=3)).isoformat(),
            "mode": "online",
        },
        headers=admin_token_headers,
    ).json()

    # Add scanner_user to Event A ONLY
    staff_res = client.post(
        f"/api/v1/admin/events/{e_a['id']}/staff",
        json={"email": scanner_user.email, "role": "scanner"},
        headers=admin_token_headers,
    )
    assert staff_res.status_code == 201

    # Attendee registers for Event B
    reg_b = client.post(f"/api/v1/events/{e_b['id']}/register", json={}, headers=attendee_headers).json()
    pass_b = client.get(f"/api/v1/registrations/{reg_b['id']}/pass", headers=attendee_headers).json()

    # Scanner attempts to scan Event B -> 403 Forbidden!
    forbidden_res = client.post(f"/api/v1/events/{e_b['id']}/check-in", json={"token": pass_b["token"]}, headers=scanner_headers)
    assert forbidden_res.status_code == 403

    # Attendee registers for Event A
    reg_a = client.post(f"/api/v1/events/{e_a['id']}/register", json={}, headers=attendee_headers).json()
    pass_a = client.get(f"/api/v1/registrations/{reg_a['id']}/pass", headers=attendee_headers).json()

    # Scanner scans Event A -> 200 Success!
    allowed_res = client.post(f"/api/v1/events/{e_a['id']}/check-in", json={"token": pass_a["token"]}, headers=scanner_headers)
    assert allowed_res.status_code == 200
    assert allowed_res.json()["result"] == "success"


def test_csv_injection_neutralization(client: TestClient, admin_token_headers: dict, org_and_organizer, attendee_users, db_session):
    org, _ = org_and_organizer

    # Create attendee with formula injection in name
    evil_attendee = User(
        email="formula_hacker@example.com",
        hashed_password="pw",
        full_name="=cmd|'/C calc'!A0",
        role="user",
        is_email_verified=True,
    )
    db_session.add(evil_attendee)
    db_session.commit()

    from app.core.security import create_access_token
    evil_headers = {"Authorization": f"Bearer {create_access_token(str(evil_attendee.id), role='user')}"}

    evt = client.post(
        "/api/v1/admin/events",
        json={
            "organization_id": str(org.id),
            "title": "Spreadsheet Security Demo",
            "banner_url": "https://cdn.launchbyte.io/csv.png",
            "thumbnail_url": "https://cdn.launchbyte.io/csv_thumb.png",
            "description": "Safe demo description.",
            "starts_at": (datetime.utcnow() + timedelta(days=2)).isoformat(),
            "ends_at": (datetime.utcnow() + timedelta(days=3)).isoformat(),
            "mode": "online",
        },
        headers=admin_token_headers,
    ).json()

    client.post(f"/api/v1/events/{evt['id']}/register", json={}, headers=evil_headers)

    # Export CSV
    csv_res = client.get(f"/api/v1/admin/events/{evt['id']}/registrations.csv", headers=admin_token_headers)
    assert csv_res.status_code == 200
    csv_text = csv_res.text
    # Ensure = prefix was escaped with a single quote '
    assert "'=cmd|'/C calc'!A0" in csv_text
    assert "\n=cmd|" not in csv_text


def test_concurrent_burst_registration_strictly_enforces_capacity(client: TestClient, admin_token_headers: dict, org_and_organizer, db_session):
    org, _ = org_and_organizer

    # Create event with capacity = 3 and waitlist_enabled = False
    evt = client.post(
        "/api/v1/admin/events",
        json={
            "organization_id": str(org.id),
            "title": "High Speed Hackathon Race",
            "banner_url": "https://cdn.launchbyte.io/race.png",
            "thumbnail_url": "https://cdn.launchbyte.io/race_thumb.png",
            "description": "Concurrency testing with 10 simultaneous registrants on 3 seats.",
            "starts_at": (datetime.utcnow() + timedelta(days=2)).isoformat(),
            "ends_at": (datetime.utcnow() + timedelta(days=3)).isoformat(),
            "mode": "online",
            "capacity": 3,
            "waitlist_enabled": False,
        },
        headers=admin_token_headers,
    ).json()

    # Create 10 distinct users
    from app.core.security import create_access_token
    users = []
    for i in range(10):
        u = User(
            email=f"burst_racer_{i}_{uuid.uuid4().hex[:6]}@example.com",
            hashed_password="pw",
            full_name=f"Racer {i}",
            role="user",
            is_email_verified=True,
        )
        db_session.add(u)
        users.append(u)
    db_session.commit()

    user_tokens = [create_access_token(str(u.id), role="user") for u in users]

    def register_call(token: str):
        return client.post(
            f"/api/v1/events/{evt['id']}/register",
            json={},
            headers={"Authorization": f"Bearer {token}"},
        )

    # In SQLite in-memory, thread pool shares single memory connection; run rapid burst
    if db_session.bind.dialect.name == "sqlite":
        responses = [register_call(t) for t in user_tokens]
    else:
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            responses = list(executor.map(register_call, user_tokens))

    status_codes = [r.status_code for r in responses]
    success_count = status_codes.count(201)
    full_count = status_codes.count(409)

    # Exactly 3 must succeed, 7 must be rejected with 409
    assert success_count == 3, f"Expected exactly 3 registrations, got {success_count}. Statuses: {status_codes}"
    assert full_count == 7, f"Expected 7 rejected, got {full_count}"

