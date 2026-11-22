"""
Tests for the applications API (Step 5).

Covers:
  - Successful platform application submission
  - Successful external application submission
  - Duplicate submission → 409
  - Unauthenticated access → 401
  - Unauthorized (wrong user) access → 404 (same as not-found, avoids ID leak)
  - Invalid input (missing target, bad URL, priority out of range) → 422
  - Applying to a non-published / deleted / nonexistent opportunity → 422
  - Pagination and status filter on list
  - Status transition → event appended
  - Delete removes the application and its events
  - Staff can list all applications for an opportunity
  - Staff can retrieve any application by ID
  - Non-staff cannot reach admin routes → 403
"""
import uuid
from datetime import datetime, timedelta, timezone

import pytest

from app.models.applications import Application, ApplicationEvent
from app.models.enums import ApplicationStatus, OpportunityStatus, OpportunityType, UserRole
from app.models.opportunities import Opportunity
from app.models.organizations import Organization
from app.models.users import User

API = "/api/v1"
PW = "supersecret"
NOW = datetime.now(timezone.utc)


# ─────────────────────────────── helpers ───────────────────────────────


def make_org(db, name="Acme"):
    org = Organization(name=name, slug=name.lower().replace(" ", "-"))
    db.add(org)
    db.commit()
    return org


def make_opp(db, org, title="Summer Internship", **kw):
    kw.setdefault("status", OpportunityStatus.PUBLISHED)
    kw.setdefault("type", OpportunityType.INTERNSHIP)
    kw.setdefault("deadline_at", NOW + timedelta(days=30))
    slug = kw.pop("slug", title.lower().replace(" ", "-"))
    opp = Opportunity(organization_id=org.id, title=title, slug=slug, **kw)
    db.add(opp)
    db.commit()
    return opp


def register_and_login(client, email, role=UserRole.USER, db=None):
    """Register, optionally elevate role, return auth header dict."""
    client.post(f"{API}/users", json={"email": email, "password": PW})
    if db is not None and role != UserRole.USER:
        user = db.query(User).filter_by(email=email).one()
        user.role = role
        db.commit()
    token = client.post(
        f"{API}/auth/login", data={"username": email, "password": PW}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ─────────────────────────────── unauthenticated ───────────────────────────────


def test_submit_requires_auth(client):
    r = client.post(f"{API}/applications", json={"custom_title": "Acme Job"})
    assert r.status_code == 401


def test_list_requires_auth(client):
    assert client.get(f"{API}/applications").status_code == 401


def test_get_requires_auth(client):
    assert client.get(f"{API}/applications/{uuid.uuid4()}").status_code == 401


def test_patch_requires_auth(client):
    assert client.patch(f"{API}/applications/{uuid.uuid4()}", json={}).status_code == 401


def test_delete_requires_auth(client):
    assert client.delete(f"{API}/applications/{uuid.uuid4()}").status_code == 401


# ─────────────────────────────── successful submission ────────────────────────


def test_submit_platform_application(client, db_session):
    """Happy path: apply to a published platform opportunity."""
    org = make_org(db_session)
    opp = make_opp(db_session, org)
    h = register_and_login(client, "alice@example.com")

    r = client.post(
        f"{API}/applications",
        headers=h,
        json={"opportunity_id": str(opp.id), "priority": 1, "notes": "Excited!"},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["opportunity_id"] == str(opp.id)
    assert body["status"] == ApplicationStatus.INTERESTED.value
    assert body["priority"] == 1
    assert body["notes"] == "Excited!"
    # Initial event is created
    assert len(body["events"]) == 1
    evt = body["events"][0]
    assert evt["event_type"] == "status_change"
    assert evt["from_status"] is None
    assert evt["to_status"] == ApplicationStatus.INTERESTED.value


def test_submit_external_application(client, db_session):
    """Happy path: track an external (off-platform) opportunity."""
    h = register_and_login(client, "bob@example.com")

    r = client.post(
        f"{API}/applications",
        headers=h,
        json={
            "custom_title": "Data Intern",
            "custom_organization": "Acme Corp",
            "custom_url": "https://acme.com/jobs/data-intern",
            "status": "preparing",
        },
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["opportunity_id"] is None
    assert body["custom_title"] == "Data Intern"
    assert body["status"] == "preparing"


# ─────────────────────────────── duplicate ────────────────────────────────────


def test_duplicate_platform_application_returns_409(client, db_session):
    """The DB UniqueConstraint fires; service maps it to DuplicateApplicationError → 409."""
    org = make_org(db_session)
    opp = make_opp(db_session, org)
    h = register_and_login(client, "carol@example.com")
    payload = {"opportunity_id": str(opp.id)}

    first = client.post(f"{API}/applications", headers=h, json=payload)
    assert first.status_code == 201

    second = client.post(f"{API}/applications", headers=h, json=payload)
    assert second.status_code == 409


def test_two_users_can_apply_to_same_opportunity(client, db_session):
    """No conflict when different users apply to the same opportunity."""
    org = make_org(db_session)
    opp = make_opp(db_session, org)
    h1 = register_and_login(client, "dave@example.com")
    h2 = register_and_login(client, "eve@example.com")

    assert client.post(f"{API}/applications", headers=h1, json={"opportunity_id": str(opp.id)}).status_code == 201
    assert client.post(f"{API}/applications", headers=h2, json={"opportunity_id": str(opp.id)}).status_code == 201


# ─────────────────────────────── invalid input ────────────────────────────────


def test_submit_requires_opportunity_or_custom_title(client, db_session):
    """Neither opportunity_id nor custom_title → 422."""
    h = register_and_login(client, "frank@example.com")
    r = client.post(f"{API}/applications", headers=h, json={"priority": 2})
    assert r.status_code == 422


def test_submit_priority_out_of_range(client, db_session):
    h = register_and_login(client, "grace@example.com")
    for bad_priority in (0, 4):
        r = client.post(
            f"{API}/applications",
            headers=h,
            json={"custom_title": "Job", "priority": bad_priority},
        )
        assert r.status_code == 422, f"Expected 422 for priority={bad_priority}"


def test_submit_bad_url_scheme(client, db_session):
    h = register_and_login(client, "henry@example.com")
    r = client.post(
        f"{API}/applications",
        headers=h,
        json={"custom_title": "Job", "custom_url": "ftp://bad.example.com"},
    )
    assert r.status_code == 422


def test_submit_nonexistent_opportunity_returns_422(client, db_session):
    h = register_and_login(client, "ivan@example.com")
    r = client.post(
        f"{API}/applications",
        headers=h,
        json={"opportunity_id": str(uuid.uuid4())},
    )
    assert r.status_code == 422


def test_submit_draft_opportunity_returns_422(client, db_session):
    """Only published opportunities may be applied to."""
    org = make_org(db_session)
    opp = make_opp(db_session, org, status=OpportunityStatus.DRAFT)
    h = register_and_login(client, "jane@example.com")
    r = client.post(
        f"{API}/applications",
        headers=h,
        json={"opportunity_id": str(opp.id)},
    )
    assert r.status_code == 422


def test_submit_deleted_opportunity_returns_422(client, db_session):
    org = make_org(db_session)
    opp = make_opp(db_session, org, deleted_at=NOW)
    h = register_and_login(client, "kate@example.com")
    r = client.post(
        f"{API}/applications",
        headers=h,
        json={"opportunity_id": str(opp.id)},
    )
    assert r.status_code == 422


# ─────────────────────────────── ownership ────────────────────────────────────


def test_user_cannot_see_another_users_application(client, db_session):
    """GET with the wrong user returns 404 (not 403) to avoid ID enumeration."""
    org = make_org(db_session)
    opp = make_opp(db_session, org)
    h_alice = register_and_login(client, "alice2@example.com")
    h_bob = register_and_login(client, "bob2@example.com")

    app_id = client.post(
        f"{API}/applications", headers=h_alice, json={"opportunity_id": str(opp.id)}
    ).json()["id"]

    r = client.get(f"{API}/applications/{app_id}", headers=h_bob)
    assert r.status_code == 404


def test_user_cannot_patch_another_users_application(client, db_session):
    org = make_org(db_session)
    opp = make_opp(db_session, org)
    h_alice = register_and_login(client, "alice3@example.com")
    h_bob = register_and_login(client, "bob3@example.com")

    app_id = client.post(
        f"{API}/applications", headers=h_alice, json={"opportunity_id": str(opp.id)}
    ).json()["id"]

    r = client.patch(f"{API}/applications/{app_id}", headers=h_bob, json={"notes": "hacked"})
    assert r.status_code == 404


def test_user_cannot_delete_another_users_application(client, db_session):
    org = make_org(db_session)
    opp = make_opp(db_session, org)
    h_alice = register_and_login(client, "alice4@example.com")
    h_bob = register_and_login(client, "bob4@example.com")

    app_id = client.post(
        f"{API}/applications", headers=h_alice, json={"opportunity_id": str(opp.id)}
    ).json()["id"]

    r = client.delete(f"{API}/applications/{app_id}", headers=h_bob)
    assert r.status_code == 404


# ─────────────────────────────── pagination ───────────────────────────────────


def test_list_pagination_and_total(client, db_session):
    """Creates 3 external apps, checks pagination: limit=2 → 2 items, total=3."""
    h = register_and_login(client, "paginate@example.com")

    for i in range(3):
        client.post(
            f"{API}/applications",
            headers=h,
            json={"custom_title": f"Job {i}"},
        )

    r = client.get(f"{API}/applications", headers=h, params={"limit": 2})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["total"] == 3
    assert len(body["items"]) == 2
    assert body["limit"] == 2
    assert body["offset"] == 0

    r2 = client.get(f"{API}/applications", headers=h, params={"limit": 2, "offset": 2})
    assert len(r2.json()["items"]) == 1


def test_list_status_filter(client, db_session):
    """Status filter only returns matching applications."""
    h = register_and_login(client, "filter@example.com")

    client.post(f"{API}/applications", headers=h, json={"custom_title": "Interested", "status": "interested"})
    client.post(f"{API}/applications", headers=h, json={"custom_title": "Applied", "status": "applied"})

    r = client.get(f"{API}/applications", headers=h, params={"status": "applied"})
    body = r.json()
    assert body["total"] == 1
    assert body["items"][0]["status"] == "applied"


def test_list_only_shows_own_applications(client, db_session):
    """Each user only sees their own applications."""
    h_a = register_and_login(client, "own_a@example.com")
    h_b = register_and_login(client, "own_b@example.com")

    client.post(f"{API}/applications", headers=h_a, json={"custom_title": "A's job"})
    client.post(f"{API}/applications", headers=h_b, json={"custom_title": "B's job"})

    assert client.get(f"{API}/applications", headers=h_a).json()["total"] == 1
    assert client.get(f"{API}/applications", headers=h_b).json()["total"] == 1


# ─────────────────────────────── status transitions ───────────────────────────


def test_status_change_appends_event(client, db_session):
    """Updating status → a status_change event is appended."""
    h = register_and_login(client, "status@example.com")

    created = client.post(
        f"{API}/applications", headers=h, json={"custom_title": "My Job"}
    ).json()
    app_id = created["id"]
    assert len(created["events"]) == 1  # initial creation event

    r = client.patch(
        f"{API}/applications/{app_id}", headers=h, json={"status": "applied"}
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "applied"
    assert len(body["events"]) == 2
    last_evt = body["events"][-1]
    assert last_evt["event_type"] == "status_change"
    assert last_evt["from_status"] == "interested"
    assert last_evt["to_status"] == "applied"


def test_patch_without_status_change_does_not_add_event(client, db_session):
    """Updating a non-status field leaves event count unchanged."""
    h = register_and_login(client, "nostatus@example.com")

    app_id = client.post(
        f"{API}/applications", headers=h, json={"custom_title": "My Job"}
    ).json()["id"]

    r = client.patch(
        f"{API}/applications/{app_id}", headers=h, json={"notes": "updated notes"}
    )
    assert r.status_code == 200
    assert len(r.json()["events"]) == 1  # only the creation event


def test_patch_same_status_does_not_add_event(client, db_session):
    """Patching with the same status value is a no-op for events."""
    h = register_and_login(client, "samestatus@example.com")
    app_id = client.post(
        f"{API}/applications", headers=h, json={"custom_title": "My Job"}
    ).json()["id"]

    r = client.patch(
        f"{API}/applications/{app_id}", headers=h, json={"status": "interested"}
    )
    assert len(r.json()["events"]) == 1


# ─────────────────────────────── delete ───────────────────────────────────────


def test_delete_removes_application_and_events(client, db_session):
    """DELETE hard-removes the application; the DB cascades to application_events."""
    h = register_and_login(client, "del@example.com")

    app_id = client.post(
        f"{API}/applications", headers=h, json={"custom_title": "Temp Job"}
    ).json()["id"]

    r = client.delete(f"{API}/applications/{app_id}", headers=h)
    assert r.status_code == 204

    # Gone from the API
    assert client.get(f"{API}/applications/{app_id}", headers=h).status_code == 404

    # Gone from the DB (including cascaded events)
    app_uuid = uuid.UUID(app_id)
    assert db_session.get(Application, app_uuid) is None
    remaining_events = db_session.query(ApplicationEvent).filter_by(application_id=app_uuid).all()
    assert remaining_events == []


def test_delete_nonexistent_application_returns_404(client, db_session):
    h = register_and_login(client, "del404@example.com")
    r = client.delete(f"{API}/applications/{uuid.uuid4()}", headers=h)
    assert r.status_code == 404


# ─────────────────────────────── admin routes ─────────────────────────────────


def test_admin_list_applications_for_opportunity(client, db_session):
    """Staff can see all applications for a given opportunity."""
    org = make_org(db_session)
    opp = make_opp(db_session, org)

    h_user1 = register_and_login(client, "app1@example.com")
    h_user2 = register_and_login(client, "app2@example.com")
    h_staff = register_and_login(client, "staff@example.com", role=UserRole.MODERATOR, db=db_session)

    client.post(f"{API}/applications", headers=h_user1, json={"opportunity_id": str(opp.id)})
    client.post(f"{API}/applications", headers=h_user2, json={"opportunity_id": str(opp.id)})

    url = f"{API}/admin/opportunities/{opp.id}/applications"
    r = client.get(url, headers=h_staff)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["total"] == 2
    assert len(body["items"]) == 2


def test_admin_get_any_application(client, db_session):
    """Staff can retrieve any application by ID."""
    org = make_org(db_session)
    opp = make_opp(db_session, org)
    h_user = register_and_login(client, "applicant@example.com")
    h_admin = register_and_login(client, "admin@example.com", role=UserRole.ADMIN, db=db_session)

    app_id = client.post(
        f"{API}/applications", headers=h_user, json={"opportunity_id": str(opp.id)}
    ).json()["id"]

    r = client.get(f"{API}/admin/applications/{app_id}", headers=h_admin)
    assert r.status_code == 200, r.text
    assert r.json()["id"] == app_id


def test_admin_routes_require_staff_role(client, db_session):
    """Regular users cannot access admin application endpoints."""
    org = make_org(db_session)
    opp = make_opp(db_session, org)
    h_user = register_and_login(client, "plain@example.com")

    # unauthenticated
    assert client.get(f"{API}/admin/opportunities/{opp.id}/applications").status_code == 401
    assert client.get(f"{API}/admin/applications/{uuid.uuid4()}").status_code == 401

    # authenticated but plain user
    assert client.get(f"{API}/admin/opportunities/{opp.id}/applications", headers=h_user).status_code == 403
    assert client.get(f"{API}/admin/applications/{uuid.uuid4()}", headers=h_user).status_code == 403


def test_admin_list_status_filter(client, db_session):
    """Admin list endpoint supports status filter."""
    org = make_org(db_session)
    opp = make_opp(db_session, org)
    h_user = register_and_login(client, "filtered_user@example.com")
    h_admin = register_and_login(client, "filter_admin@example.com", role=UserRole.ADMIN, db=db_session)

    app_id = client.post(
        f"{API}/applications", headers=h_user, json={"opportunity_id": str(opp.id)}
    ).json()["id"]
    # Move to "applied"
    client.patch(f"{API}/applications/{app_id}", headers=h_user, json={"status": "applied"})

    url = f"{API}/admin/opportunities/{opp.id}/applications"
    assert client.get(url, headers=h_admin, params={"status": "interested"}).json()["total"] == 0
    assert client.get(url, headers=h_admin, params={"status": "applied"}).json()["total"] == 1


def test_admin_get_nonexistent_returns_404(client, db_session):
    h_admin = register_and_login(client, "admin404@example.com", role=UserRole.ADMIN, db=db_session)
    r = client.get(f"{API}/admin/applications/{uuid.uuid4()}", headers=h_admin)
    assert r.status_code == 404


def test_admin_list_pagination(client, db_session):
    """Admin list is properly paginated."""
    org = make_org(db_session, "PaginOrg")
    opp = make_opp(db_session, org, "Pagin Internship", slug="pagin-internship")
    h_admin = register_and_login(client, "pagin_admin@example.com", role=UserRole.ADMIN, db=db_session)

    for i in range(5):
        h = register_and_login(client, f"pagin_user{i}@example.com")
        client.post(f"{API}/applications", headers=h, json={"opportunity_id": str(opp.id)})

    url = f"{API}/admin/opportunities/{opp.id}/applications"
    r = client.get(url, headers=h_admin, params={"limit": 3})
    body = r.json()
    assert body["total"] == 5
    assert len(body["items"]) == 3

    r2 = client.get(url, headers=h_admin, params={"limit": 3, "offset": 3})
    assert len(r2.json()["items"]) == 2
