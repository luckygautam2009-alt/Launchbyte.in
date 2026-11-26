from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.models.auth_tokens import EmailVerificationToken
from app.models.users import User
from app.services.email.console import get_dev_token


def test_register_and_login_issue_hashed_6digit_otp_and_confirm_verifies(client, db_session):
    email = "otp_user@example.com"
    password = "StrongPassword123!"

    reg = client.post(
        "/api/v1/users",
        json={"email": email, "password": password, "full_name": "OTP User", "handle": "otp_user"},
    )
    assert reg.status_code == 201
    assert reg.json()["is_email_verified"] is False

    otp = get_dev_token(email, "verify")
    assert otp is not None
    assert len(otp) == 6
    assert otp.isdigit()

    # Stored hashed, never plaintext
    user = db_session.scalar(select(User).where(User.email == email))
    record = db_session.scalar(
        select(EmailVerificationToken).where(EmailVerificationToken.user_id == user.id)
    )
    assert record is not None
    assert record.token_hash != otp
    assert len(record.token_hash) == 64

    login_resp = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    assert login_resp.status_code == 200
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    # Wrong code increments attempts
    bad = client.post("/api/v1/auth/verify-email/confirm", json={"code": "999999"}, headers=headers)
    if otp != "999999":
        assert bad.status_code == 400
        db_session.refresh(record)
        assert record.attempts == 1

    # Correct code verifies user
    ok = client.post("/api/v1/auth/verify-email/confirm", json={"code": otp}, headers=headers)
    assert ok.status_code == 200
    db_session.refresh(user)
    assert user.is_email_verified is True


def test_otp_lockout_after_5_attempts_and_60s_cooldown(client, db_session):
    email = "otp_lockout@example.com"
    password = "StrongPassword123!"

    client.post(
        "/api/v1/users",
        json={"email": email, "password": password, "full_name": "Lockout User", "handle": "otp_lockout"},
    )
    login_resp = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    # Cooldown: immediate re-request should return 429
    resend_fast = client.post("/api/v1/auth/verify-email/request", headers=headers)
    assert resend_fast.status_code == 429

    otp = get_dev_token(email, "verify")
    wrong_otp = "000000" if otp != "000000" else "111111"

    for _ in range(5):
        r = client.post("/api/v1/auth/verify-email/confirm", json={"code": wrong_otp}, headers=headers)
        assert r.status_code == 400

    # Even the real OTP is now rejected because max attempts invalidated it
    after_lock = client.post("/api/v1/auth/verify-email/confirm", json={"code": otp}, headers=headers)
    assert after_lock.status_code == 400
    assert "request a new code" in after_lock.json()["detail"].lower()


def test_otp_expires_after_10_minutes(client, db_session):
    email = "otp_expiry@example.com"
    password = "StrongPassword123!"

    client.post(
        "/api/v1/users",
        json={"email": email, "password": password, "full_name": "Expiry User", "handle": "otp_expiry"},
    )
    login_resp = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    otp = get_dev_token(email, "verify")
    user = db_session.scalar(select(User).where(User.email == email))
    record = db_session.scalar(
        select(EmailVerificationToken).where(EmailVerificationToken.user_id == user.id)
    )
    record.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db_session.commit()

    resp = client.post("/api/v1/auth/verify-email/confirm", json={"code": otp}, headers=headers)
    assert resp.status_code == 400
