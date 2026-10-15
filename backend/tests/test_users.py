def test_register_user(client):
    resp = client.post(
        "/api/v1/users",
        json={"email": "ada@example.com", "password": "supersecret", "full_name": "Ada"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "ada@example.com"
    assert body["full_name"] == "Ada"
    assert body["is_active"] is True
    assert "id" in body
    assert "password" not in body
    assert "hashed_password" not in body


def test_register_duplicate_email_rejected(client):
    payload = {"email": "dupe@example.com", "password": "supersecret"}
    first = client.post("/api/v1/users", json=payload)
    assert first.status_code == 201

    second = client.post("/api/v1/users", json=payload)
    assert second.status_code == 409


def test_login_success_returns_bearer_token(client):
    client.post("/api/v1/users", json={"email": "grace@example.com", "password": "hopperpass"})

    resp = client.post(
        "/api/v1/auth/login",
        data={"username": "grace@example.com", "password": "hopperpass"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_wrong_password_rejected(client):
    client.post("/api/v1/users", json={"email": "alan@example.com", "password": "correcthorse"})

    resp = client.post(
        "/api/v1/auth/login",
        data={"username": "alan@example.com", "password": "wrongpass"},
    )
    assert resp.status_code == 401


def test_me_requires_token(client):
    resp = client.get("/api/v1/users/me")
    assert resp.status_code == 401


def test_me_returns_current_user_with_valid_token(client):
    client.post(
        "/api/v1/users",
        json={"email": "margaret@example.com", "password": "hamilton1", "full_name": "Margaret"},
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "margaret@example.com", "password": "hamilton1"},
    )
    token = login_resp.json()["access_token"]

    resp = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "margaret@example.com"


def test_me_rejects_garbage_token(client):
    resp = client.get("/api/v1/users/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert resp.status_code == 401


# --- behaviour added with the extended users table -------------------------
def test_register_response_includes_role_and_verification_flag(client):
    body = client.post("/api/v1/users", json={"email": "role@example.com", "password": "supersecret"}).json()
    assert body["role"] == "user"
    assert body["is_email_verified"] is False


def test_email_is_stored_lowercase_and_duplicates_ignore_case(client):
    first = client.post("/api/v1/users", json={"email": "Mixed.Case@Example.com", "password": "supersecret"})
    assert first.status_code == 201
    assert first.json()["email"] == "mixed.case@example.com"

    again = client.post("/api/v1/users", json={"email": "MIXED.CASE@example.com", "password": "supersecret"})
    assert again.status_code == 409


def test_login_is_case_insensitive_on_email(client):
    client.post("/api/v1/users", json={"email": "login@example.com", "password": "supersecret"})
    resp = client.post("/api/v1/auth/login", data={"username": "LOGIN@Example.com", "password": "supersecret"})
    assert resp.status_code == 200


def test_login_records_last_login_at(client, db_session):
    from app.models.users import User

    client.post("/api/v1/users", json={"email": "seen@example.com", "password": "supersecret"})
    user = db_session.query(User).filter_by(email="seen@example.com").one()
    assert user.last_login_at is None

    client.post("/api/v1/auth/login", data={"username": "seen@example.com", "password": "supersecret"})
    db_session.refresh(user)
    assert user.last_login_at is not None


def test_password_must_be_at_least_8_characters(client):
    for bad in ("", "short"):
        resp = client.post("/api/v1/users", json={"email": "pw@example.com", "password": bad})
        assert resp.status_code == 422


def test_inactive_user_cannot_login(client, db_session):
    from app.models.users import User

    client.post("/api/v1/users", json={"email": "off@example.com", "password": "password123"})
    user = db_session.query(User).filter_by(email="off@example.com").one()
    user.is_active = False
    db_session.commit()
    r = client.post("/api/v1/auth/login", data={"username": "off@example.com", "password": "password123"})
    assert r.status_code == 401
