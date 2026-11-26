import logging
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.services.email import get_email_backend
from app.services.email.brevo import BrevoEmailBackend


def test_get_email_backend_returns_brevo(monkeypatch):
    fake_settings = SimpleNamespace(
        ENV="test",
        EMAIL_BACKEND="brevo",
        BREVO_API_KEY="xkeysib-test-secret",
        EMAIL_FROM="noreply@launchbyte.io",
        SMTP_FROM="noreply@launchbyte.io",
        FRONTEND_URL="https://launchbyte.io",
    )
    monkeypatch.setattr("app.services.email.get_settings", lambda: fake_settings)
    monkeypatch.setattr("app.services.email.brevo.get_settings", lambda: fake_settings)

    backend = get_email_backend()
    assert isinstance(backend, BrevoEmailBackend)


def test_brevo_send_and_host_event_truthful_email_sent(client, monkeypatch, caplog):
    fake_settings = SimpleNamespace(
        ENV="test",
        EMAIL_BACKEND="brevo",
        BREVO_API_KEY="xkeysib-super-secret-value",
        EMAIL_FROM="noreply@launchbyte.io",
        SMTP_FROM="noreply@launchbyte.io",
        FRONTEND_URL="https://launchbyte.io",
        ADMIN_INBOX_EMAIL="launchbyte.in26@gmail.com",
    )
    monkeypatch.setattr("app.services.email.get_settings", lambda: fake_settings)
    monkeypatch.setattr("app.services.email.brevo.get_settings", lambda: fake_settings)
    monkeypatch.setattr("app.services.email.dispatcher.get_settings", lambda: fake_settings)

    # 1. Success case
    ok_resp = MagicMock()
    ok_resp.status_code = 201
    ok_resp.text = '{"messageId":"<abc@brevo>"}'

    ok_client = MagicMock()
    ok_client.__enter__.return_value = ok_client
    ok_client.__exit__.return_value = False
    ok_client.post.return_value = ok_resp

    payload = {
        "event_name": "Delhi NCR AI Sprint",
        "organizer_name": "Ada",
        "organizer_email": "ada@example.com",
        "organizer_organization": "LaunchByte Builders",
        "description": "A verified hackathon in Delhi NCR for student engineers.",
        "category": "Hackathon",
        "event_format": "hybrid",
        "venue_location": "Delhi NCR",
        "event_date": datetime(2027, 1, 15, 9, 0, tzinfo=timezone.utc).isoformat(),
        "registration_url": "https://unstop.com/hackathons/test-123",
        "contact_info": "ada@example.com",
    }

    with patch("app.services.email.brevo.httpx.Client", return_value=ok_client):
        resp = client.post("/api/v1/public/host-event", json=payload)

    assert resp.status_code == 201
    assert resp.json()["email_sent"] is True
    assert ok_client.post.call_count == 2  # admin alert + organizer confirmation
    sent_headers = ok_client.post.call_args.kwargs["headers"]
    assert sent_headers["api-key"] == "xkeysib-super-secret-value"

    # 2. Failure case: submission still saved, email_sent=False, provider error logged without secret
    fail_resp = MagicMock()
    fail_resp.status_code = 401
    fail_resp.text = '{"message":"Key not found"}'

    fail_client = MagicMock()
    fail_client.__enter__.return_value = fail_client
    fail_client.__exit__.return_value = False
    fail_client.post.return_value = fail_resp

    with caplog.at_level(logging.ERROR):
        with patch("app.services.email.brevo.httpx.Client", return_value=fail_client):
            resp2 = client.post("/api/v1/public/host-event", json=payload)

    assert resp2.status_code == 201
    assert resp2.json()["email_sent"] is False
    assert "Key not found" in caplog.text
    assert "xkeysib-super-secret-value" not in caplog.text


def test_brevo_logs_message_id_includes_html_and_warns_unverified_sender(monkeypatch, caplog):
    import uuid
    from app.services.email import brevo as brevo_mod

    brevo_mod._CHECKED_SENDERS.clear()
    fake_settings = SimpleNamespace(
        ENV="production",
        EMAIL_BACKEND="brevo",
        BREVO_API_KEY="xkeysib-verify-check-key",
        EMAIL_FROM="unverified@launchbyte.io",
        SMTP_FROM="unverified@launchbyte.io",
        FRONTEND_URL="https://launchbyte.io",
    )
    monkeypatch.setattr("app.services.email.brevo.get_settings", lambda: fake_settings)

    senders_resp = MagicMock()
    senders_resp.status_code = 200
    senders_resp.json.return_value = {
        "senders": [{"email": "other@launchbyte.io", "active": True}]
    }

    send_resp = MagicMock()
    send_resp.status_code = 201
    send_resp.json.return_value = {"messageId": "<msg-12345@brevo>"}

    mock_client = MagicMock()
    mock_client.__enter__.return_value = mock_client
    mock_client.__exit__.return_value = False
    mock_client.get.return_value = senders_resp
    mock_client.post.return_value = send_resp

    with caplog.at_level(logging.INFO):
        with patch("app.services.email.brevo.httpx.Client", return_value=mock_client):
            backend = BrevoEmailBackend()
            backend.send_verification_email("user@example.com", "123456", uuid.uuid4())

    mock_client.get.assert_called_once()
    sent_payload = mock_client.post.call_args.kwargs["json"]
    assert "textContent" in sent_payload
    assert "htmlContent" in sent_payload
    assert "123456" in sent_payload["htmlContent"]
    assert "<msg-12345@brevo>" in caplog.text
    assert "is not an active verified sender" in caplog.text


def test_smtp_backend_uses_ssl_on_465_with_timeout_15(monkeypatch, caplog):
    import uuid
    from app.services.email.smtp import SMTPEmailBackend

    fake_settings = SimpleNamespace(
        SMTP_HOST="smtp.gmail.com",
        SMTP_PORT=465,
        SMTP_USER="sender@gmail.com",
        SMTP_PASSWORD="app-password",
        SMTP_FROM="sender@gmail.com",
        SMTP_TLS=True,
        FRONTEND_URL="https://launchbyte.io",
    )
    monkeypatch.setattr("app.services.email.smtp.get_settings", lambda: fake_settings)

    mock_server = MagicMock()
    mock_server.__enter__.return_value = mock_server
    mock_server.__exit__.return_value = False

    with caplog.at_level(logging.INFO):
        with patch("app.services.email.smtp.smtplib.SMTP_SSL", return_value=mock_server) as ssl_cls:
            backend = SMTPEmailBackend()
            backend.send_verification_email("to@example.com", "654321", uuid.uuid4())

    ssl_cls.assert_called_once_with("smtp.gmail.com", 465, timeout=15)
    mock_server.login.assert_called_once_with("sender@gmail.com", "app-password")
    mock_server.send_message.assert_called_once()
    assert "SMTP email sent" in caplog.text
