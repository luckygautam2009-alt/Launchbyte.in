import io
import logging
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import httpx
import pytest
from PIL import Image

from app.services.storage.local import LocalDiskBackend
from app.services.storage.supabase import SupabaseStorageBackend


def _make_png_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (32, 32), color=(99, 102, 241)).save(buf, format="PNG")
    return buf.getvalue()


def test_supabase_storage_sb_secret_key_uses_apikey_only_no_bearer(monkeypatch):
    fake_settings = SimpleNamespace(
        SUPABASE_URL="https://example.supabase.co/",
        SUPABASE_SERVICE_ROLE_KEY="sb_secret_test_key_123",
        SUPABASE_STORAGE_BUCKET="avatars",
    )
    monkeypatch.setattr(
        "app.services.storage.supabase.get_settings",
        lambda: fake_settings,
    )

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.text = '{"Key":"avatars/test.png"}'

    mock_client = MagicMock()
    mock_client.__enter__.return_value = mock_client
    mock_client.__exit__.return_value = False
    mock_client.post.return_value = mock_resp
    mock_client.head.return_value = mock_resp

    with patch("app.services.storage.supabase.httpx.Client", return_value=mock_client):
        backend = SupabaseStorageBackend()
        url = backend.save(b"png-bytes", "avatar.png", "image/png")

    assert url == "https://example.supabase.co/storage/v1/object/public/avatars/avatar.png"
    call_args = mock_client.post.call_args
    assert call_args[0][0] == "https://example.supabase.co/storage/v1/object/avatars/avatar.png"
    headers = call_args.kwargs["headers"]
    assert headers["apikey"] == "sb_secret_test_key_123"
    assert "Authorization" not in headers
    assert headers["x-upsert"] == "true"
    assert headers["Content-Type"] == "image/png"
    mock_client.head.assert_called_once_with(
        "https://example.supabase.co/storage/v1/object/public/avatars/avatar.png",
        follow_redirects=True,
    )


def test_supabase_storage_legacy_jwt_key_sends_apikey_and_bearer(monkeypatch):
    legacy_jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.sig"
    fake_settings = SimpleNamespace(
        SUPABASE_URL="https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY=legacy_jwt,
        SUPABASE_STORAGE_BUCKET="media",
    )
    monkeypatch.setattr(
        "app.services.storage.supabase.get_settings",
        lambda: fake_settings,
    )

    mock_resp = MagicMock()
    mock_resp.status_code = 201
    mock_resp.text = '{"Key":"media/avatar.png"}'

    mock_head_resp = MagicMock()
    mock_head_resp.status_code = 200

    mock_client = MagicMock()
    mock_client.__enter__.return_value = mock_client
    mock_client.__exit__.return_value = False
    mock_client.post.return_value = mock_resp
    mock_client.head.return_value = mock_head_resp

    with patch("app.services.storage.supabase.httpx.Client", return_value=mock_client):
        backend = SupabaseStorageBackend()
        url = backend.save(b"png-bytes", "avatar.png", "image/png")

    assert url == "https://example.supabase.co/storage/v1/object/public/media/avatar.png"
    headers = mock_client.post.call_args.kwargs["headers"]
    assert headers["apikey"] == legacy_jwt
    assert headers["Authorization"] == f"Bearer {legacy_jwt}"
    assert headers["x-upsert"] == "true"


def test_supabase_storage_head_check_failure_raises_runtime_error(monkeypatch):
    fake_settings = SimpleNamespace(
        SUPABASE_URL="https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY="sb_secret_test_key_123",
        SUPABASE_STORAGE_BUCKET="avatars",
    )
    monkeypatch.setattr(
        "app.services.storage.supabase.get_settings",
        lambda: fake_settings,
    )

    mock_upload_resp = MagicMock()
    mock_upload_resp.status_code = 200
    mock_upload_resp.text = '{"Key":"avatars/test.png"}'

    # Public HEAD fails with 400 / 403 when bucket is private or object unreachable
    mock_head_resp = MagicMock()
    mock_head_resp.status_code = 400

    mock_client = MagicMock()
    mock_client.__enter__.return_value = mock_client
    mock_client.__exit__.return_value = False
    mock_client.post.return_value = mock_upload_resp
    mock_client.head.return_value = mock_head_resp

    with patch("app.services.storage.supabase.httpx.Client", return_value=mock_client):
        backend = SupabaseStorageBackend()
        with pytest.raises(RuntimeError, match="Supabase bucket 'avatars' is not public or URL unreachable \\(status 400\\)"):
            backend.save(b"png-bytes", "test.png", "image/png")

    # Network error during HEAD also raises RuntimeError
    mock_client.head.side_effect = httpx.ConnectError("DNS failure")
    with patch("app.services.storage.supabase.httpx.Client", return_value=mock_client):
        backend = SupabaseStorageBackend()
        with pytest.raises(RuntimeError, match="Supabase bucket 'avatars' is not public or URL unreachable"):
            backend.save(b"png-bytes", "test.png", "image/png")


def test_local_storage_returns_absolute_url_when_backend_public_url_set(monkeypatch, tmp_path):
    monkeypatch.setattr(
        "app.services.storage.local.get_settings",
        lambda: SimpleNamespace(
            STORAGE_LOCAL_DIR=str(tmp_path),
            BACKEND_PUBLIC_URL="http://localhost:8000/",
        ),
    )
    backend = LocalDiskBackend()
    url = backend.save(b"png-bytes", "avatar.png", "image/png")
    assert url == "http://localhost:8000/uploads/avatar.png"
    assert (tmp_path / "avatar.png").read_bytes() == b"png-bytes"

    monkeypatch.setattr(
        "app.services.storage.local.get_settings",
        lambda: SimpleNamespace(
            STORAGE_LOCAL_DIR=str(tmp_path),
            BACKEND_PUBLIC_URL="",
        ),
    )
    rel_backend = LocalDiskBackend()
    assert rel_backend.save(b"png-bytes", "avatar2.png", "image/png") == "/uploads/avatar2.png"


def test_supabase_storage_logs_real_error_and_raises_runtime_error(monkeypatch, caplog):
    fake_settings = SimpleNamespace(
        SUPABASE_URL="https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY="sb_secret_test_key_123",
        SUPABASE_STORAGE_BUCKET="avatars",
    )
    monkeypatch.setattr(
        "app.services.storage.supabase.get_settings",
        lambda: fake_settings,
    )

    mock_resp = MagicMock()
    mock_resp.status_code = 403
    mock_resp.text = '{"error":"Invalid Compact JWS"}'

    mock_client = MagicMock()
    mock_client.__enter__.return_value = mock_client
    mock_client.__exit__.return_value = False
    mock_client.post.return_value = mock_resp

    with caplog.at_level(logging.ERROR):
        with patch("app.services.storage.supabase.httpx.Client", return_value=mock_client):
            backend = SupabaseStorageBackend()
            with pytest.raises(RuntimeError, match="403"):
                backend.save(b"png-bytes", "avatar.png", "image/png")

    assert "Invalid Compact JWS" in caplog.text


def test_avatar_upload_endpoint_returns_clean_json_on_storage_failure_and_saves_on_success(
    client, monkeypatch
):
    email = "avatar_tester@example.com"
    password = "StrongPassword123!"
    client.post(
        "/api/v1/users",
        json={"email": email, "password": password, "full_name": "Avatar Tester", "handle": "avatar_tester"},
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert login_resp.status_code == 200
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}
    png = _make_png_bytes()

    # 1. Storage failure returns clean 502 JSON error (never unhandled 500)
    failing_backend = MagicMock()
    failing_backend.save.side_effect = RuntimeError("Supabase bucket unreachable")
    monkeypatch.setattr("app.routers.profiles.get_storage_backend", lambda: failing_backend)

    fail_resp = client.post(
        "/api/v1/me/profile/avatar",
        files={"file": ("avatar.png", png, "image/png")},
        headers=headers,
    )
    assert fail_resp.status_code == 502
    body = fail_resp.json()
    assert body["error"]["code"] == "STORAGE_UPLOAD_FAILED"
    assert "Supabase bucket unreachable" in body["error"]["message"]

    # 2. Successful upload saves avatar_url and exposes it in /users/me, /me/profile, and /profiles/{handle}
    ok_backend = MagicMock()
    ok_backend.save.return_value = "https://example.supabase.co/storage/v1/object/public/avatars/ok.png"
    monkeypatch.setattr("app.routers.profiles.get_storage_backend", lambda: ok_backend)

    ok_resp = client.post(
        "/api/v1/me/profile/avatar",
        files={"file": ("avatar.png", png, "image/png")},
        headers=headers,
    )
    assert ok_resp.status_code == 200
    assert ok_resp.json()["avatar_url"].endswith("/ok.png")

    me_resp = client.get("/api/v1/users/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["avatar_url"].endswith("/ok.png")

    prof_resp = client.get("/api/v1/me/profile", headers=headers)
    assert prof_resp.status_code == 200
    assert prof_resp.json()["avatar_url"].endswith("/ok.png")
    handle = prof_resp.json()["handle"]
    if handle:
        pub_resp = client.get(f"/api/v1/profiles/{handle}")
        assert pub_resp.status_code == 200
        assert pub_resp.json()["avatar_url"].endswith("/ok.png")
