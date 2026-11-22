import uuid
from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.core.rate_limit import limiter
from app.db.seed import seed
from app.models.auth_tokens import EmailVerificationToken, PasswordResetToken
from app.models.users import User
from app.services.email.console import get_dev_token


@pytest.fixture(autouse=True)
def _reset_limiter():
    limiter.reset()


def test_security_headers_and_request_id(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert "X-Request-ID" in resp.headers
    assert resp.headers["X-Content-Type-Options"] == "nosniff"
    assert resp.headers["X-Frame-Options"] == "DENY"
    assert resp.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"


def test_non_local_env_rejects_debug_true():
    with pytest.raises(ValidationError, match="DEBUG must be false"):
        Settings(_env_file=None, ENV="production", SECRET_KEY="a" * 40, DEBUG=True)


def test_rate_limiting_on_auth_login(client, db_session):
    client.post("/api/v1/users", json={"email": "rl_test@example.com", "password": "password123"})

    # Rapid attempts
    for _ in range(10):
        resp = client.post("/api/v1/auth/login", data={"username": "rl_test@example.com", "password": "wrongpassword"})
        assert resp.status_code == 401

    # 11th attempt should hit rate limit (429)
    resp = client.post("/api/v1/auth/login", data={"username": "rl_test@example.com", "password": "wrongpassword"})
    assert resp.status_code == 429
    assert "Retry-After" in resp.headers
    body = resp.json()
    assert body["error"]["code"] == "TOO_MANY_REQUESTS"


def test_email_verification_flow(client, db_session):
    # 1. Register user
    reg = client.post("/api/v1/users", json={"email": "verify_me@example.com", "password": "password123"})
    assert reg.status_code == 201

    token = get_dev_token("verify_me@example.com", "verify")
    assert token is not None

    # 2. Confirm verification
    confirm = client.post("/api/v1/auth/verify-email/confirm", json={"token": token})
    assert confirm.status_code == 200
    assert "verified successfully" in confirm.json()["message"]

    # 3. Re-using same token should fail
    confirm_again = client.post("/api/v1/auth/verify-email/confirm", json={"token": token})
    assert confirm_again.status_code == 400

    # 4. User is verified
    login = client.post("/api/v1/auth/login", data={"username": "verify_me@example.com", "password": "password123"})
    access_token = login.json()["access_token"]
    me = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me.json()["is_email_verified"] is True


def test_email_verification_cooldown(client, db_session):
    client.post("/api/v1/users", json={"email": "cooldown@example.com", "password": "password123"})
    login = client.post("/api/v1/auth/login", data={"username": "cooldown@example.com", "password": "password123"})
    token = login.json()["access_token"]

    # First request should fail with cooldown because registration already issued a token within 60s
    req = client.post("/api/v1/auth/verify-email/request", headers={"Authorization": f"Bearer {token}"})
    assert req.status_code == 429
    assert "wait at least 60 seconds" in req.json()["detail"]


def test_password_reset_flow(client, db_session):
    client.post("/api/v1/users", json={"email": "reset_user@example.com", "password": "oldpassword123"})
    login = client.post("/api/v1/auth/login", data={"username": "reset_user@example.com", "password": "oldpassword123"})
    old_access_token = login.json()["access_token"]

    # 1. Password reset request
    req = client.post("/api/v1/auth/password-reset/request", json={"email": "reset_user@example.com"})
    assert req.status_code == 202

    # Non-existent user also gets 202 (no enumeration)
    ghost_req = client.post("/api/v1/auth/password-reset/request", json={"email": "nobody@example.com"})
    assert ghost_req.status_code == 202
    assert ghost_req.json() == req.json()

    # 2. Get reset token
    reset_token = get_dev_token("reset_user@example.com", "reset")
    assert reset_token is not None

    # 3. Confirm password reset
    confirm = client.post("/api/v1/auth/password-reset/confirm", json={"token": reset_token, "new_password": "newpassword123"})
    assert confirm.status_code == 200

    # 4. Old access token must be rejected because token_version was incremented
    me_old = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {old_access_token}"})
    assert me_old.status_code == 401

    # 5. Old password rejected, new password accepted
    fail_login = client.post("/api/v1/auth/login", data={"username": "reset_user@example.com", "password": "oldpassword123"})
    assert fail_login.status_code == 401

    success_login = client.post("/api/v1/auth/login", data={"username": "reset_user@example.com", "password": "newpassword123"})
    assert success_login.status_code == 200
