"""Integration tests for Contributor Access, Contributor Opportunities, Public Host-an-Event, Contact, and Public Metrics."""
import uuid
from datetime import datetime, timedelta, timezone

from app.core.security import create_access_token, hash_password
from app.models.enums import OpportunityStatus, OpportunityType, UserRole
from app.models.users import User


def _create_user(db, email: str, role: UserRole = UserRole.USER, verified: bool = True) -> tuple[User, dict]:
    user = User(
        email=email,
        hashed_password=hash_password("StrongPass123!"),
        full_name="Test User",
        role=role,
        is_active=True,
        is_email_verified=verified,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id), role=user.role.value, token_version=user.token_version)
    return user, {"Authorization": f"Bearer {token}"}


def test_contributor_access_workflow_and_revocation(client, db_session):
    db = db_session
    # 1. Unauthenticated cannot request access or view admin routes
    r = client.post("/api/v1/contributor-access/request", json={})
    assert r.status_code == 401

    r_admin = client.get("/api/v1/admin/contributor-access")
    assert r_admin.status_code == 401

    # 2. Unverified user cannot request access
    _, unverified_headers = _create_user(db, "unverified@launchbyte.io", verified=False)
    r_unv = client.post(
        "/api/v1/contributor-access/request",
        headers=unverified_headers,
        json={
            "full_name": "Shobhit Srivastava",
            "email": "unverified@launchbyte.io",
            "team_role": "Co-Founder",
            "reason": "Need to list verified partner hackathons.",
        },
    )
    assert r_unv.status_code == 403

    # 3. Verified user submits request; does NOT auto-grant role
    shobhit, shobhit_headers = _create_user(db, "shobhit@launchbyte.io", verified=True)
    r_req = client.post(
        "/api/v1/contributor-access/request",
        headers=shobhit_headers,
        json={
            "full_name": "Shobhit Srivastava",
            "email": "shobhit@launchbyte.io",
            "team_role": "Co-Founder",
            "reason": "Listing upcoming verified hackathons on LaunchByte.",
        },
    )
    assert r_req.status_code == 201
    req_id = r_req.json()["id"]
    assert r_req.json()["status"] == "pending"

    # Still cannot create contributor opportunity before admin approval
    r_denied = client.get("/api/v1/contributor/opportunities", headers=shobhit_headers)
    assert r_denied.status_code == 403

    # 4. Non-admin cannot approve
    r_forbid = client.post(f"/api/v1/admin/contributor-access/{req_id}/approve", headers=shobhit_headers)
    assert r_forbid.status_code == 403

    # 5. Admin approves -> role becomes contributor
    _, admin_headers = _create_user(db, "yash.admin@launchbyte.io", role=UserRole.ADMIN, verified=True)
    r_app = client.post(f"/api/v1/admin/contributor-access/{req_id}/approve", headers=admin_headers)
    assert r_app.status_code == 200
    assert r_app.json()["status"] == "approved"

    # Shobhit can now create a draft and submit for review
    r_draft = client.post(
        "/api/v1/contributor/opportunities",
        headers=shobhit_headers,
        json={
            "title": "National Systems Hackathon 2027",
            "type": "hackathon",
            "organizer_name": "Tech Institute",
            "summary": "A national systems engineering hackathon.",
            "description": "Detailed description of the national systems engineering hackathon.",
            "location_type": "remote",
            "application_url": "https://example.org/register",
            "submit_for_review": True,
        },
    )
    assert r_draft.status_code == 201
    assert r_draft.json()["status"] == "pending_review"  # Never directly published

    # 6. Admin revokes -> immediately loses access
    r_rev = client.post(f"/api/v1/admin/contributor-access/{req_id}/revoke", headers=admin_headers)
    assert r_rev.status_code == 200
    assert r_rev.json()["status"] == "revoked"

    r_after = client.get("/api/v1/contributor/opportunities", headers=shobhit_headers)
    assert r_after.status_code == 403


def test_public_host_event_validation_and_moderation(client, db_session):
    db = db_session
    # Empty body returns validation error
    r_empty = client.post("/api/v1/public/host-event", json={})
    assert r_empty.status_code == 422

    # Valid submission goes to pending (never instant publish)
    start = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    end = (datetime.now(timezone.utc) + timedelta(days=31)).isoformat()
    r_ok = client.post(
        "/api/v1/public/host-event",
        json={
            "event_name": "Campus AI Buildathon",
            "organizer_name": "Rohan Sharma",
            "organizer_email": "rohan@college.edu",
            "organizer_organization": "Campus Tech Club",
            "description": "A 24-hour student AI buildathon focused on developer tools.",
            "category": "Hackathon",
            "event_format": "online",
            "event_date": start,
            "end_date": end,
            "registration_url": "https://unstop.com/example-event",
            "contact_info": "rohan@college.edu",
        },
    )
    assert r_ok.status_code == 201
    data = r_ok.json()
    assert data["status"] == "pending"

    # Admin routes require auth
    assert client.get("/api/v1/admin/host-events").status_code == 401

    # Admin can approve
    _, admin_headers = _create_user(db, "admin2@launchbyte.io", role=UserRole.ADMIN, verified=True)
    r_app = client.post(f"/api/v1/admin/host-events/{data['id']}/approve", headers=admin_headers)
    assert r_app.status_code == 200
    assert r_app.json()["status"] == "approved"


def test_public_contact_and_metrics(client):
    r_contact = client.post(
        "/api/v1/public/contact",
        json={
            "name": "Dev Organizer",
            "email": "dev@org.com",
            "organization": "OpenSource Club",
            "inquiry_type": "community",
            "message": "We would love to collaborate on a student workshop.",
        },
    )
    assert r_contact.status_code == 201

    r_metrics = client.get("/api/v1/metrics/public")
    assert r_metrics.status_code == 200
    body = r_metrics.json()
    assert body["core_team_members"] == 5
    assert isinstance(body["active_opportunities"], int)
    assert isinstance(body["featured_hackathons"], int)
