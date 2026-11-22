from app.db.seed import ADMIN_EMAIL, STUDENT_EMAIL, seed


def _get_token(client, email, password):
    resp = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    return resp.json()["access_token"]


def test_public_team_members(client, db_session):
    seed(db_session)
    resp = client.get("/api/v1/about/team")
    assert resp.status_code == 200
    members = resp.json()
    assert len(members) >= 4
    # Ensure ordered by display_order
    orders = [m["display_order"] for m in members]
    assert orders == sorted(orders)
    # Check fields
    first = members[0]
    assert "name" in first
    assert "designation" in first
    assert "bio" in first


def test_admin_team_management(client, db_session):
    seed(db_session, admin_password="admin-pass-123", student_password="student-pass-123")
    admin_token = _get_token(client, ADMIN_EMAIL, "admin-pass-123")
    student_token = _get_token(client, STUDENT_EMAIL, "student-pass-123")

    # 1. Non-admin forbidden
    resp = client.post(
        "/api/v1/admin/about/team",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"name": "Attacker", "designation": "Hacker"},
    )
    assert resp.status_code == 403

    # 2. Admin creates member
    resp = client.post(
        "/api/v1/admin/about/team",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "name": "Jane Engineer",
            "designation": "Staff Infrastructure Architect",
            "bio": "Building reliable distributed systems.",
            "linkedin_url": "https://linkedin.com/in/jane",
            "display_order": 99,
            "is_active": True,
        },
    )
    assert resp.status_code == 201
    member_id = resp.json()["id"]

    # 3. Admin updates member
    patch_resp = client.patch(
        f"/api/v1/admin/about/team/{member_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"designation": "Principal Architect"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["designation"] == "Principal Architect"

    # 4. Admin reorders members
    reorder_resp = client.put(
        "/api/v1/admin/about/team/reorder",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"orders": [{"id": member_id, "display_order": 0}]},
    )
    assert reorder_resp.status_code == 200

    # 5. Admin deletes member
    del_resp = client.delete(
        f"/api/v1/admin/about/team/{member_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert del_resp.status_code == 204
