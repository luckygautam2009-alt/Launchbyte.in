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
