from app.db.seed import STUDENT_EMAIL, seed


def test_unread_count_requires_login_and_counts(client, db_session):
    seed(db_session, admin_password="admin-pass-123", student_password="student-pass-123", organizer_password="organizer-pass-123")
    assert client.get("/api/v1/notifications/unread-count").status_code == 401

    resp = client.post("/api/v1/auth/login", data={"username": STUDENT_EMAIL, "password": "student-pass-123"})
    headers = {"Authorization": f"Bearer {resp.json()['access_token']}"}

    before = client.get("/api/v1/notifications/unread-count", headers=headers)
    assert before.status_code == 200
    assert isinstance(before.json()["unread"], int)

    client.post("/api/v1/notifications/read-all", headers=headers)
    after = client.get("/api/v1/notifications/unread-count", headers=headers)
    assert after.json()["unread"] == 0


def test_clear_all_notifications(client, db_session):
    seed(db_session, admin_password="admin-pass-123", student_password="student-pass-123", organizer_password="organizer-pass-123")
    assert client.delete("/api/v1/notifications").status_code == 401

    resp = client.post("/api/v1/auth/login", data={"username": STUDENT_EMAIL, "password": "student-pass-123"})
    headers = {"Authorization": f"Bearer {resp.json()['access_token']}"}

    assert client.delete("/api/v1/notifications", headers=headers).status_code == 200
    listing = client.get("/api/v1/notifications", headers=headers).json()
    assert listing["total"] == 0
    assert client.get("/api/v1/notifications/unread-count", headers=headers).json()["unread"] == 0
