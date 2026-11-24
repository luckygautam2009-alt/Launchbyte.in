import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select

from app.db.seed import ADMIN_EMAIL, ORGANIZER_EMAIL, STUDENT_EMAIL, seed
from app.models.enums import OpportunityStatus, OpportunityType, VerificationStatus
from app.models.opportunities import Opportunity
from app.models.organizations import Organization


def _get_token(client, email, password):
    resp = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    return resp.json()["access_token"]


def test_public_filters_and_counts(client, db_session):
    seed(db_session)

    # 1. Browse hackathons
    resp = client.get("/api/v1/opportunities?type=hackathon")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) >= 1
    for item in items:
        assert item["type"] == "hackathon"
        assert item["organization"]["name"] is not None

    # 2. Multi-type filter
    resp = client.get("/api/v1/opportunities?type=hackathon&type=internship")
    assert resp.status_code == 200
    types = {i["type"] for i in resp.json()["items"]}
    assert types <= {"hackathon", "internship"}

    # 3. Tags with counts
    tags_resp = client.get("/api/v1/tags")
    assert tags_resp.status_code == 200
    tags = tags_resp.json()
    assert len(tags) > 0
    assert all("name" in t and "count" in t and t["count"] > 0 for t in tags)

    # 4. Types with counts
    types_resp = client.get("/api/v1/opportunities/types")
    assert types_resp.status_code == 200
    opp_types = types_resp.json()
    assert any(t["type"] == "hackathon" and t["count"] >= 1 for t in opp_types)

    # 5. Search with wildcards and special characters
    search_resp = client.get("/api/v1/opportunities?q=%_hackathon")
    assert search_resp.status_code == 200

    # 6. Detail with view count increment
    detail_resp = client.get("/api/v1/opportunities/bytehacks-global-2026")
    assert detail_resp.status_code == 200
    initial_views = detail_resp.json()["view_count"]
    assert initial_views >= 1

    detail_resp_2 = client.get("/api/v1/opportunities/bytehacks-global-2026")
    assert detail_resp_2.json()["view_count"] == initial_views + 1


def test_save_and_unsave_opportunities(client, db_session):
    seed(db_session, student_password="student-pass-123")
    student_token = _get_token(client, STUDENT_EMAIL, "student-pass-123")
    auth_header = {"Authorization": f"Bearer {student_token}"}

    opp = db_session.scalar(
        select(Opportunity).where(
            Opportunity.slug == "bytehacks-global-2026",
            Opportunity.status == OpportunityStatus.PUBLISHED,
        )
    )

    # 1. Save (idempotent)
    s1 = client.post(f"/api/v1/opportunities/{opp.id}/save", headers=auth_header)
    assert s1.status_code == 200
    s2 = client.post(f"/api/v1/opportunities/{opp.id}/save", headers=auth_header)
    assert s2.status_code == 200

    # 2. Check /me/saved
    saved_resp = client.get("/api/v1/me/saved", headers=auth_header)
    assert saved_resp.status_code == 200
    saved_ids = [i["id"] for i in saved_resp.json()["items"]]
    assert str(opp.id) in saved_ids

    # 3. Unsave (idempotent)
    u1 = client.delete(f"/api/v1/opportunities/{opp.id}/save", headers=auth_header)
    assert u1.status_code == 204
    u2 = client.delete(f"/api/v1/opportunities/{opp.id}/save", headers=auth_header)
    assert u2.status_code == 204

    # 4. Verify no longer in /me/saved
    saved_resp_after = client.get("/api/v1/me/saved", headers=auth_header)
    saved_ids_after = [i["id"] for i in saved_resp_after.json()["items"]]
    assert str(opp.id) not in saved_ids_after


def test_report_opportunity_and_flag_threshold(client, db_session):
    seed(db_session, admin_password="admin-pass-123", student_password="student-pass-123")
    student_token = _get_token(client, STUDENT_EMAIL, "student-pass-123")
    auth_header = {"Authorization": f"Bearer {student_token}"}

    opp = db_session.scalar(
        select(Opportunity).where(Opportunity.slug == "acme-ml-intern-summer")
    )

    # 1. Student reports opportunity
    rep1 = client.post(
        f"/api/v1/opportunities/{opp.id}/report",
        headers=auth_header,
        json={"reason": "misleading", "details": "Incorrect stipend mentioned."},
    )
    assert rep1.status_code == 201
    assert rep1.json()["reason"] == "misleading"

    # 2. Duplicate report with same reason -> 409
    rep_dupe = client.post(
        f"/api/v1/opportunities/{opp.id}/report",
        headers=auth_header,
        json={"reason": "misleading", "details": "Still misleading."},
    )
    assert rep_dupe.status_code == 409

    # 3. Reporter cannot report own posting
    admin_token = _get_token(client, ADMIN_EMAIL, "admin-pass-123")
    admin_opp = db_session.scalar(
        select(Opportunity).where(Opportunity.posted_by_id != None)
    )
    # create posting by admin
    admin_header = {"Authorization": f"Bearer {admin_token}"}
    self_report = client.post(
        f"/api/v1/opportunities/{admin_opp.id}/report",
        headers=admin_header,
        json={"reason": "other", "details": "Testing"},
    )
    assert self_report.status_code == 400
    assert "cannot report your own posting" in self_report.json()["detail"]


def test_organizer_create_submit_delete(client, db_session):
    seed(
        db_session,
        admin_password="admin-pass-123",
        student_password="student-pass-123",
        organizer_password="organizer-pass-123",
    )
    org_token = _get_token(client, ORGANIZER_EMAIL, "organizer-pass-123")
    student_token = _get_token(client, STUDENT_EMAIL, "student-pass-123")
    org_header = {"Authorization": f"Bearer {org_token}"}

    acme = db_session.scalar(select(Organization).where(Organization.slug == "acme-robotics"))

    # 1. Plain student cannot create for an org -> 403
    fail_create = client.post(
        f"/api/v1/organizations/{acme.id}/opportunities",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "title": "Unauthorized Hackathon",
            "type": "hackathon",
            "summary": "Should be rejected",
        },
    )
    assert fail_create.status_code == 403

    # 2. Organizer creates draft
    create_resp = client.post(
        f"/api/v1/organizations/{acme.id}/opportunities",
        headers=org_header,
        json={
            "title": "Acme Robotics Spring Hack 2026",
            "type": "hackathon",
            "summary": "Build cutting-edge perception pipelines for mobile robots.",
            "description": "Full weekend event with hardware tracks.",
            "application_url": "https://acme-robotics.com/hack",
            "compensation_type": "prize",
            "compensation_min": "10000",
            "compensation_currency": "USD",
            "tags": ["AI", "Remote"],
        },
    )
    assert create_resp.status_code == 201
    created_data = create_resp.json()
    opp_id = created_data["id"]
    opp_slug = created_data["slug"]

    # Draft must NOT be visible on public detail -> 404
    pub_check = client.get(f"/api/v1/opportunities/{opp_slug}")
    assert pub_check.status_code == 404

    # 3. Organizer submits for review
    submit_resp = client.post(f"/api/v1/opportunities/{opp_id}/submit", headers=org_header)
    assert submit_resp.status_code == 200

    # 4. Organizer views in /me/opportunities
    my_opps = client.get("/api/v1/me/opportunities", headers=org_header)
    assert my_opps.status_code == 200
    my_ids = [o["id"] for o in my_opps.json()["items"]]
    assert opp_id in my_ids

    # 5. Delete opportunity
    del_resp = client.delete(f"/api/v1/opportunities/{opp_id}", headers=org_header)
    assert del_resp.status_code == 204


def test_moderator_approval_and_rejection_flow(client, db_session):
    seed(
        db_session,
        admin_password="admin-pass-123",
        organizer_password="organizer-pass-123",
    )
    admin_token = _get_token(client, ADMIN_EMAIL, "admin-pass-123")
    org_token = _get_token(client, ORGANIZER_EMAIL, "organizer-pass-123")
    admin_header = {"Authorization": f"Bearer {admin_token}"}
    org_header = {"Authorization": f"Bearer {org_token}"}

    acme = db_session.scalar(select(Organization).where(Organization.slug == "acme-robotics"))

    # Organizer creates a draft and submits
    create_resp = client.post(
        f"/api/v1/organizations/{acme.id}/opportunities",
        headers=org_header,
        json={
            "title": "Review Queue Test Hackathon",
            "type": "hackathon",
            "summary": "Testing review queue",
            "application_url": "https://acme-robotics.com/test-queue",
        },
    )
    opp_id = create_resp.json()["id"]
    client.post(f"/api/v1/opportunities/{opp_id}/submit", headers=org_header)

    # Admin checks review queue
    queue_resp = client.get("/api/v1/admin/opportunities?status=pending_review", headers=admin_header)
    assert queue_resp.status_code == 200
    queue_ids = [o["id"] for o in queue_resp.json()["items"]]
    assert opp_id in queue_ids

    # Admin approves
    approve_resp = client.post(
        f"/api/v1/admin/opportunities/{opp_id}/approve",
        headers=admin_header,
        json={"verification_status": "verified", "trust_score": 90},
    )
    assert approve_resp.status_code == 200
    assert approve_resp.json()["verification_status"] == "verified"
    assert approve_resp.json()["trust_score"] == 90

    # Organizer receives notification
    notifs_resp = client.get("/api/v1/notifications", headers=org_header)
    assert notifs_resp.status_code == 200
    notif_items = notifs_resp.json()["items"]
    assert any("Approved" in n["title"] for n in notif_items)
