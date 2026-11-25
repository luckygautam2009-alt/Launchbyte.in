"""Controlled local security & penetration test suite for LaunchByte."""
from __future__ import annotations

import base64
import io
import json
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt
from PIL import Image
from starlette.websockets import WebSocketDisconnect

from app.core.config import get_settings
from app.core.security import ALGORITHM, create_access_token
from app.models.auth_tokens import PasswordResetToken
from app.models.enums import UserRole
from app.models.organizations import Organization, OrganizationMember
from app.models.users import User
from app.services.email.console import get_dev_token
from app.services.email.smtp import _safe_header_value
from app.services.users.service import _hash_token


def _make_png_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (8, 8), color=(99, 102, 241)).save(buf, format="PNG")
    return buf.getvalue()


def _verify_user_email(db_session, email: str):
    user = db_session.query(User).filter(User.email == email.lower()).one()
    user.is_email_verified = True
    db_session.commit()


def _create_test_org(db_session, user: User) -> uuid.UUID:
    org = Organization(
        name="Test Org",
        slug=f"test-org-{uuid.uuid4().hex[:8]}",
        description="Test Organization",
    )
    db_session.add(org)
    db_session.flush()
    mem = OrganizationMember(
        organization_id=org.id,
        user_id=user.id,
        role="owner",
    )
    db_session.add(mem)
    db_session.commit()
    return org.id


def _register_and_login(
    client,
    email: str,
    password: str = "StrongPass!123",
    full_name: str = "Security Tester",
    extra_json: dict | None = None,
) -> tuple[dict, str]:
    payload = {"email": email, "password": password, "full_name": full_name}
    if extra_json:
        payload.update(extra_json)
    reg = client.post("/api/v1/users", json=payload)
    assert reg.status_code == 201, reg.text

    login = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    assert login.status_code == 200, login.text
    return reg.json(), login.json()["access_token"]


def _set_role(db_session, email: str, role: UserRole) -> User:
    user = db_session.query(User).filter(User.email == email.lower()).one()
    user.role = role
    db_session.commit()
    db_session.refresh(user)
    return user


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_signup_privilege_escalation_ignored(client):
    user_data, token = _register_and_login(
        client,
        "privesc@example.com",
        extra_json={"role": "admin", "is_email_verified": True, "is_active": False},
    )
    assert user_data["role"] == "user"
    assert user_data["is_email_verified"] is False
    assert user_data["is_active"] is True

    admin_probe = client.get("/api/v1/admin/opportunities", headers=_auth_headers(token))
    assert admin_probe.status_code == 403


def test_jwt_forged_expired_wrong_claims_missing_token_version_and_revoked(client, db_session):
    user_data, valid_token = _register_and_login(client, "jwtcheck@example.com")
    settings = get_settings()
    now = datetime.now(timezone.utc)

    # 1. Forged signing secret
    forged = jwt.encode(
        {
            "sub": user_data["id"],
            "role": "admin",
            "token_version": 1,
            "token_type": "access",
            "iss": settings.JWT_ISSUER,
            "aud": settings.JWT_AUDIENCE,
            "exp": now + timedelta(minutes=15),
        },
        "completely-wrong-secret-key",
        algorithm=ALGORITHM,
    )
    assert client.get("/api/v1/users/me", headers=_auth_headers(forged)).status_code == 401

    # 2. Expired token
    expired = jwt.encode(
        {
            "sub": user_data["id"],
            "role": "user",
            "token_version": 1,
            "token_type": "access",
            "iss": settings.JWT_ISSUER,
            "aud": settings.JWT_AUDIENCE,
            "exp": now - timedelta(minutes=5),
        },
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )
    assert client.get("/api/v1/users/me", headers=_auth_headers(expired)).status_code == 401

    # 3. Wrong issuer / wrong audience
    wrong_iss = jwt.encode(
        {
            "sub": user_data["id"],
            "token_version": 1,
            "token_type": "access",
            "iss": "evil.issuer",
            "aud": settings.JWT_AUDIENCE,
            "exp": now + timedelta(minutes=15),
        },
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )
    assert client.get("/api/v1/users/me", headers=_auth_headers(wrong_iss)).status_code == 401

    wrong_aud = jwt.encode(
        {
            "sub": user_data["id"],
            "token_version": 1,
            "token_type": "access",
            "iss": settings.JWT_ISSUER,
            "aud": "wrong-audience",
            "exp": now + timedelta(minutes=15),
        },
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )
    assert client.get("/api/v1/users/me", headers=_auth_headers(wrong_aud)).status_code == 401

    # 4. Unsigned alg: none token
    header_b64 = base64.urlsafe_b64encode(json.dumps({"alg": "none", "typ": "JWT"}).encode()).rstrip(b"=").decode()
    payload_b64 = base64.urlsafe_b64encode(
        json.dumps(
            {
                "sub": user_data["id"],
                "token_version": 1,
                "token_type": "access",
                "iss": settings.JWT_ISSUER,
                "aud": settings.JWT_AUDIENCE,
                "exp": int((now + timedelta(minutes=15)).timestamp()),
            }
        ).encode()
    ).rstrip(b"=").decode()
    unsigned = f"{header_b64}.{payload_b64}."
    assert client.get("/api/v1/users/me", headers=_auth_headers(unsigned)).status_code == 401

    # 5. Missing token_version claim even with valid signature
    no_tv = jwt.encode(
        {
            "sub": user_data["id"],
            "token_type": "access",
            "iss": settings.JWT_ISSUER,
            "aud": settings.JWT_AUDIENCE,
            "exp": now + timedelta(minutes=15),
        },
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )
    assert client.get("/api/v1/users/me", headers=_auth_headers(no_tv)).status_code == 401

    # 6. Revoked token after token_version bump
    assert client.get("/api/v1/users/me", headers=_auth_headers(valid_token)).status_code == 200
    user = db_session.query(User).filter(User.email == "jwtcheck@example.com").one()
    user.token_version += 1
    db_session.commit()
    assert client.get("/api/v1/users/me", headers=_auth_headers(valid_token)).status_code == 401


def test_idor_profile_privacy(client):
    _, token_a = _register_and_login(client, "priv_a@example.com")
    _, token_b = _register_and_login(client, "priv_b@example.com")

    upd = client.put(
        "/api/v1/me/profile",
        headers=_auth_headers(token_a),
        json={"handle": "hiddenbuilder", "is_public": False, "bio": "Private notes"},
    )
    assert upd.status_code == 200, upd.text

    other_read = client.get("/api/v1/profiles/hiddenbuilder", headers=_auth_headers(token_b))
    assert other_read.status_code in (403, 404)

    anon_read = client.get("/api/v1/profiles/hiddenbuilder")
    assert anon_read.status_code in (403, 404)

    owner_read = client.get("/api/v1/profiles/hiddenbuilder", headers=_auth_headers(token_a))
    assert owner_read.status_code == 200
    assert owner_read.json()["handle"] == "hiddenbuilder"


def test_idor_applications(client):
    _, token_a = _register_and_login(client, "app_owner@example.com")
    _, token_b = _register_and_login(client, "app_attacker@example.com")

    create_resp = client.post(
        "/api/v1/applications",
        headers=_auth_headers(token_a),
        json={"custom_title": "Private Fellowship", "custom_organization": "Org", "notes": "Secret cover letter"},
    )
    assert create_resp.status_code == 201, create_resp.text
    app_id = create_resp.json()["id"]

    assert client.get(f"/api/v1/applications/{app_id}", headers=_auth_headers(token_b)).status_code in (403, 404)
    assert (
        client.patch(
            f"/api/v1/applications/{app_id}",
            headers=_auth_headers(token_b),
            json={"notes": "Tampered"},
        ).status_code
        in (403, 404)
    )
    assert client.delete(f"/api/v1/applications/{app_id}", headers=_auth_headers(token_b)).status_code in (403, 404)


def test_idor_conversations(client, db_session):
    _, token_a = _register_and_login(client, "chat_a@example.com")
    user_b, token_b = _register_and_login(client, "chat_b@example.com")
    _, token_c = _register_and_login(client, "chat_c@example.com")
    _verify_user_email(db_session, "chat_a@example.com")
    _verify_user_email(db_session, "chat_b@example.com")
    _verify_user_email(db_session, "chat_c@example.com")

    req = client.post(
        "/api/v1/connections/requests",
        headers=_auth_headers(token_a),
        json={"user_id": user_b["id"], "message": "Let's team up"},
    )
    assert req.status_code == 201, req.text
    conn_id = req.json()["id"]

    acc = client.post(f"/api/v1/connections/requests/{conn_id}/accept", headers=_auth_headers(token_b))
    assert acc.status_code == 200, acc.text

    conv = client.post(
        "/api/v1/conversations/direct",
        headers=_auth_headers(token_a),
        json={"user_id": user_b["id"]},
    )
    assert conv.status_code == 201, conv.text
    conv_id = conv.json()["id"]

    # Non-participant C cannot read or post in A<->B conversation
    assert client.get(f"/api/v1/conversations/{conv_id}/messages", headers=_auth_headers(token_c)).status_code in (403, 404)
    assert (
        client.post(
            f"/api/v1/conversations/{conv_id}/messages",
            headers=_auth_headers(token_c),
            json={"body": "Eavesdropping attempt"},
        ).status_code
        in (403, 404)
    )


def test_idor_event_pass(client, db_session):
    _, admin_token = _register_and_login(client, "evt_admin@example.com")
    admin_user = _set_role(db_session, "evt_admin@example.com", UserRole.ADMIN)
    org_id = _create_test_org(db_session, admin_user)

    now = datetime.now(timezone.utc)
    evt_resp = client.post(
        "/api/v1/admin/events",
        headers=_auth_headers(admin_token),
        json={
            "organization_id": str(org_id),
            "title": "LaunchByte Security Summit",
            "banner_url": "https://example.com/banner.png",
            "thumbnail_url": "https://example.com/thumb.png",
            "description": "<p>Join our annual security summit and hackathon event.</p>",
            "starts_at": (now + timedelta(days=5)).isoformat(),
            "ends_at": (now + timedelta(days=6)).isoformat(),
            "mode": "online",
            "online_url": "https://meet.example.com/security",
        },
    )
    assert evt_resp.status_code == 201, evt_resp.text
    event_id = evt_resp.json()["id"]

    _, token_a = _register_and_login(client, "pass_a@example.com")
    _, token_b = _register_and_login(client, "pass_b@example.com")
    _verify_user_email(db_session, "pass_a@example.com")
    _verify_user_email(db_session, "pass_b@example.com")

    reg = client.post(f"/api/v1/events/{event_id}/register", headers=_auth_headers(token_a), json={"answers": {}})
    assert reg.status_code == 201, reg.text
    reg_id = reg.json()["id"]

    assert client.get(f"/api/v1/registrations/{reg_id}/pass", headers=_auth_headers(token_a)).status_code == 200
    assert client.get(f"/api/v1/registrations/{reg_id}/pass", headers=_auth_headers(token_b)).status_code == 403
    assert client.get(f"/api/v1/registrations/{reg_id}/pass.png", headers=_auth_headers(token_b)).status_code == 403
    assert client.post(f"/api/v1/registrations/{reg_id}/pass/rotate", headers=_auth_headers(token_b)).status_code == 403


def test_idor_contributor_drafts_and_status_guard(client, db_session):
    _, token_a = _register_and_login(client, "contrib_a@example.com")
    _, token_b = _register_and_login(client, "contrib_b@example.com")
    _set_role(db_session, "contrib_a@example.com", UserRole.CONTRIBUTOR)
    _set_role(db_session, "contrib_b@example.com", UserRole.CONTRIBUTOR)

    create_resp = client.post(
        "/api/v1/contributor/opportunities",
        headers=_auth_headers(token_a),
        json={
            "title": "Contributor Security Hackathon",
            "type": "hackathon",
            "organizer_name": "LaunchByte Labs",
            "summary": "A real community-sourced hackathon opportunity.",
            "description": "Long enough description detailing eligibility, prizes, and timeline.",
            "application_url": "https://example.com/apply",
            "submit_for_review": False,
            "status": "published",  # Should be ignored; server sets draft
        },
    )
    assert create_resp.status_code == 201, create_resp.text
    opp = create_resp.json()
    assert opp["status"] == "draft"
    opp_id = opp["id"]

    assert (
        client.patch(
            f"/api/v1/contributor/opportunities/{opp_id}",
            headers=_auth_headers(token_b),
            json={"title": "Hijacked Draft Title"},
        ).status_code
        == 403
    )
    assert (
        client.post(f"/api/v1/contributor/opportunities/{opp_id}/submit", headers=_auth_headers(token_b)).status_code
        == 403
    )


def test_stored_xss_and_url_scheme_sanitization(client, db_session):
    _, admin_token = _register_and_login(client, "xss_admin@example.com")
    admin_user = _set_role(db_session, "xss_admin@example.com", UserRole.ADMIN)
    org_id = _create_test_org(db_session, admin_user)

    now = datetime.now(timezone.utc)
    evt_resp = client.post(
        "/api/v1/admin/events",
        headers=_auth_headers(admin_token),
        json={
            "organization_id": str(org_id),
            "title": "XSS Defense Check",
            "banner_url": "https://example.com/banner.png",
            "thumbnail_url": "https://example.com/thumb.png",
            "description": (
                '<p onclick="alert(1)">Hello builders</p>'
                "<script>alert('xss')</script>"
                '<img src=x onerror=alert(1)>'
                '<a href="javascript:alert(1)">bad</a> '
                '<a href="https://launchbyte.io" target="_blank">good</a>'
            ),
            "sections": {
                "faqs": [{"question": "Is HTML safe?", "answer": '<p>Yes <script>evil()</script><b onmouseover="x()">now</b></p>'}]
            },
            "starts_at": (now + timedelta(days=3)).isoformat(),
            "ends_at": (now + timedelta(days=4)).isoformat(),
            "mode": "online",
        },
    )
    assert evt_resp.status_code == 201, evt_resp.text
    body = evt_resp.json()
    desc = body["description"]
    assert "<script" not in desc.lower()
    assert "onerror" not in desc.lower()
    assert "onclick" not in desc.lower()
    assert "javascript:" not in desc.lower()
    assert 'rel="noopener noreferrer"' in desc

    faq_ans = body["sections"]["faqs"][0]["answer"]
    assert "<script" not in faq_ans.lower()
    assert "onmouseover" not in faq_ans.lower()

    # Profile javascript: URL blocked
    _, user_token = _register_and_login(client, "profile_xss@example.com")
    bad_profile = client.put(
        "/api/v1/me/profile",
        headers=_auth_headers(user_token),
        json={"portfolio_url": "javascript:alert(1)"},
    )
    assert bad_profile.status_code == 422

    # Public event hosting javascript: URL blocked
    bad_host = client.post(
        "/api/v1/public/host-event",
        json={
            "event_name": "Evil Hack",
            "organizer_name": "Attacker",
            "organizer_email": "att@example.com",
            "organizer_organization": "Attacker Org",
            "category": "Hackathon",
            "event_format": "online",
            "event_date": (now + timedelta(days=10)).isoformat(),
            "registration_url": "javascript:alert(1)",
            "contact_info": "attacker@example.com",
            "description": "Valid length description exceeding twenty characters cleanly.",
        },
    )
    assert bad_host.status_code == 422

    # SMTP header injection sanitizer
    cleaned_hdr = _safe_header_value("Subject\r\nBcc: attacker@evil.com\nX-Injected: 1")
    assert "\r" not in cleaned_hdr
    assert "\n" not in cleaned_hdr


def test_upload_rejects_svg_disguised_images_and_executables_accepts_png(client, db_session):
    _, admin_token = _register_and_login(client, "upload_admin@example.com")
    _set_role(db_session, "upload_admin@example.com", UserRole.ADMIN)
    _, user_token = _register_and_login(client, "upload_user@example.com")

    bad_files = [
        ("xss.svg", b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', "image/svg+xml"),
        ("disguised.png", b'<?xml version="1.0"?><svg onload="alert(1)"></svg>', "image/png"),
        ("fake_magic.png", b"\x89PNG\r\n\x1a\n<script>alert(1)</script>", "image/png"),
        ("payload.exe", b"MZ\x90\x00\x03\x00\x00\x00notanimage", "application/octet-stream"),
    ]

    for fname, content, ctype in bad_files:
        r_admin = client.post(
            "/api/v1/uploads/images",
            headers=_auth_headers(admin_token),
            files={"file": (fname, content, ctype)},
        )
        assert r_admin.status_code == 422, f"{fname} unexpectedly accepted on /uploads/images: {r_admin.status_code}"

        r_avatar = client.post(
            "/api/v1/me/profile/avatar",
            headers=_auth_headers(user_token),
            files={"file": (fname, content, ctype)},
        )
        assert r_avatar.status_code == 422, f"{fname} unexpectedly accepted on /me/profile/avatar: {r_avatar.status_code}"

    # Regular user cannot access organizer-only /uploads/images
    png_bytes = _make_png_bytes()
    assert (
        client.post(
            "/api/v1/uploads/images",
            headers=_auth_headers(user_token),
            files={"file": ("ok.png", png_bytes, "image/png")},
        ).status_code
        == 403
    )

    # Legitimate PNG works for authorized roles
    ok_admin = client.post(
        "/api/v1/uploads/images",
        headers=_auth_headers(admin_token),
        files={"file": ("ok.png", png_bytes, "image/png")},
    )
    assert ok_admin.status_code == 201, ok_admin.text

    ok_avatar = client.post(
        "/api/v1/me/profile/avatar",
        headers=_auth_headers(user_token),
        files={"file": ("avatar.png", png_bytes, "image/png")},
    )
    assert ok_avatar.status_code == 200, ok_avatar.text


def test_password_reset_enumeration_reuse_expiry_and_inactive_user(client, db_session):
    _register_and_login(client, "reset_audit@example.com", password="OldPassword123!")

    r_real = client.post("/api/v1/auth/password-reset/request", json={"email": "reset_audit@example.com"})
    r_fake = client.post("/api/v1/auth/password-reset/request", json={"email": "nonexistent_audit@example.com"})
    assert r_real.status_code == 202
    assert r_fake.status_code == 202
    assert r_real.json() == r_fake.json()

    token = get_dev_token("reset_audit@example.com", "reset")
    assert token is not None

    # Confirm reset once -> succeeds
    c1 = client.post("/api/v1/auth/password-reset/confirm", json={"token": token, "new_password": "NewPassword456!"})
    assert c1.status_code == 200

    # Reuse -> rejected
    c2 = client.post("/api/v1/auth/password-reset/confirm", json={"token": token, "new_password": "AnotherPassword789!"})
    assert c2.status_code == 400

    # Request again & expire token in DB
    token2 = "expired-audit-token-sample"
    user = db_session.query(User).filter(User.email == "reset_audit@example.com").one()

    db_session.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=_hash_token(token2),
            expires_at=datetime.now(timezone.utc) - timedelta(minutes=10),
        )
    )
    db_session.commit()
    assert (
        client.post(
            "/api/v1/auth/password-reset/confirm",
            json={"token": token2, "new_password": "ValidPassword999!"},
        ).status_code
        == 400
    )

    # Valid fresh token for inactive user -> blocked
    token3 = "inactive-user-reset-token"
    db_session.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=_hash_token(token3),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        )
    )
    user.is_active = False
    db_session.commit()

    res_inactive = client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"token": token3, "new_password": "StillShouldFail999!"},
    )
    assert res_inactive.status_code in (400, 403)


def test_websocket_cswsh_origin_check(client):
    _, token = _register_and_login(client, "ws_audit@example.com")

    # 1. Malicious cross-site Origin rejected with 4003
    t1 = client.post("/api/v1/ws/ticket", headers=_auth_headers(token))
    assert t1.status_code == 200
    ticket1 = t1.json()["ticket"]

    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(
            f"/api/v1/ws?ticket={ticket1}",
            headers={"Origin": "https://evil-attacker.example"},
        ):
            pass
    assert exc_info.value.code == 4003

    # 2. Allowed origin connects cleanly
    t2 = client.post("/api/v1/ws/ticket", headers=_auth_headers(token))
    assert t2.status_code == 200
    ticket2 = t2.json()["ticket"]

    with client.websocket_connect(
        f"/api/v1/ws?ticket={ticket2}",
        headers={"Origin": "http://localhost:3000"},
    ) as ws:
        hello = json.loads(ws.receive_text())
        assert hello["event"] == "connected"


def test_rate_limit_enforces_429_retry_after_and_ignores_spoofed_xff(client):
    contact_payload = {
        "name": "Tester",
        "email": "tester@example.com",
        "inquiry_type": "general",
        "message": "Testing rate limiting without proxy header spoofing bypass.",
    }
    for i in range(5):
        resp = client.post(
            "/api/v1/public/contact",
            json=contact_payload,
            headers={"X-Forwarded-For": f"203.0.113.{i + 10}"},
        )
        assert resp.status_code == 201, resp.text

    blocked = client.post(
        "/api/v1/public/contact",
        json=contact_payload,
        headers={"X-Forwarded-For": "198.51.100.99"},
    )
    assert blocked.status_code == 429
    assert "Retry-After" in blocked.headers
