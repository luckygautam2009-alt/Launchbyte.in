from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.core.config import Settings
from app.db.base import Base
from app.models.enums import (
    CompensationType,
    LocationType,
    OpportunityStatus,
    OpportunityType,
    VerificationStatus,
)
from app.models.opportunities import Opportunity
from app.models.organizations import Organization
from app.services.email import get_email_backend
from app.services.email.dispatcher import EmailDeliveryResult


def test_production_settings_reject_console_email_and_missing_brevo_or_supabase():
    base_kwargs = dict(
        ENV="production",
        DEBUG=False,
        SECRET_KEY="a-very-long-random-production-secret-key-at-least-32-chars",
        QR_SIGNING_KEY="b-very-long-random-production-qr-signing-key-32-chars",
        CORS_ORIGINS=["https://launchbyte.vercel.app"],
    )

    # 1. Production cannot silently use console email backend
    with pytest.raises(ValueError, match="EMAIL_BACKEND"):
        Settings(**base_kwargs, EMAIL_BACKEND="console")

    # 2. Brevo requires BREVO_API_KEY and EMAIL_FROM
    with pytest.raises(ValueError, match="BREVO_API_KEY"):
        Settings(**base_kwargs, EMAIL_BACKEND="brevo", BREVO_API_KEY="", EMAIL_FROM="noreply@launchbyte.io")

    with pytest.raises(ValueError, match="EMAIL_FROM"):
        Settings(**base_kwargs, EMAIL_BACKEND="brevo", BREVO_API_KEY="xkeysib-123", EMAIL_FROM="")

    # 3. Outside local/test, STORAGE_BACKEND must be 'supabase' and requires URL, key, and bucket
    with pytest.raises(ValueError, match="STORAGE_BACKEND"):
        Settings(
            **base_kwargs,
            EMAIL_BACKEND="brevo",
            BREVO_API_KEY="xkeysib-123",
            EMAIL_FROM="noreply@launchbyte.io",
            STORAGE_BACKEND="local",
        )

    with pytest.raises(ValueError, match="SUPABASE_URL"):
        Settings(
            **base_kwargs,
            EMAIL_BACKEND="brevo",
            BREVO_API_KEY="xkeysib-123",
            EMAIL_FROM="noreply@launchbyte.io",
            STORAGE_BACKEND="supabase",
            SUPABASE_URL="",
            SUPABASE_SERVICE_ROLE_KEY="sb_secret_123",
        )

    # 4. Valid production config passes
    ok = Settings(
        **base_kwargs,
        EMAIL_BACKEND="brevo",
        BREVO_API_KEY="xkeysib-123",
        EMAIL_FROM="noreply@launchbyte.io",
        STORAGE_BACKEND="supabase",
        SUPABASE_URL="https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY="sb_secret_123",
        SUPABASE_STORAGE_BUCKET="media",
    )
    assert ok.EMAIL_BACKEND == "brevo"
    assert ok.STORAGE_BACKEND == "supabase"


def test_get_email_backend_refuses_console_fallback_in_production(monkeypatch):
    fake_settings = SimpleNamespace(ENV="production", EMAIL_BACKEND="console")
    monkeypatch.setattr("app.services.email.get_settings", lambda: fake_settings)

    with pytest.raises(RuntimeError, match="not allowed"):
        get_email_backend()


def test_otp_failure_returns_502_and_does_not_consume_cooldown(client, monkeypatch):
    email = "otp_fail_retry@example.com"
    password = "StrongPassword123!"

    # Simulate Brevo failing during registration
    failing_email = MagicMock()
    failing_email.send_verification_email.side_effect = RuntimeError("Brevo 401 unauthorized")
    monkeypatch.setattr("app.services.users.service.get_email_backend", lambda: failing_email)

    reg_resp = client.post(
        "/api/v1/users",
        json={"email": email, "password": password, "full_name": "OTP Retry User"},
    )
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert reg_data["verification_email_sent"] is False
    assert "Brevo 401 unauthorized" in (reg_data["verification_email_error"] or "")

    # Login while Brevo is still failing -> token indicates verification_email_sent=False
    login_resp = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data["verification_email_sent"] is False
    headers = {"Authorization": f"Bearer {login_data['access_token']}"}

    # Explicit OTP request while Brevo fails -> 502 (not 200, and does NOT consume 60s cooldown)
    fail_req = client.post("/api/v1/auth/verify-email/request", headers=headers)
    assert fail_req.status_code == 502
    assert "Brevo 401 unauthorized" in fail_req.text

    # Now Brevo recovers -> immediate retry MUST succeed (not blocked by 429 cooldown!)
    sent_codes: list[str] = []
    ok_email = MagicMock()
    ok_email.send_verification_email.side_effect = lambda to, code, uid: sent_codes.append(code)
    monkeypatch.setattr("app.services.users.service.get_email_backend", lambda: ok_email)

    retry_req = client.post("/api/v1/auth/verify-email/request", headers=headers)
    assert retry_req.status_code == 200
    assert len(sent_codes) == 1

    # Confirm OTP works
    confirm_resp = client.post(
        "/api/v1/auth/verify-email/confirm",
        json={"code": sent_codes[0]},
        headers=headers,
    )
    assert confirm_resp.status_code == 200


def test_migration_0009_restores_4_curated_hackathons_idempotently_preserving_others(monkeypatch):
    import importlib.util
    from pathlib import Path

    mig_path = (
        Path(__file__).resolve().parent.parent
        / "alembic"
        / "versions"
        / "0009_restore_curated_featured_hackathons.py"
    )
    spec = importlib.util.spec_from_file_location("mig_0009", mig_path)
    assert spec and spec.loader
    mig_0009 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mig_0009)

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)

    with SessionLocal() as db:
        other_org = Organization(name="Other Org", slug="other-org")
        db.add(other_org)
        db.flush()

        # Existing unrelated opportunity + an archived curated hackathon
        unrelated = Opportunity(
            organization_id=other_org.id,
            title="Existing Internship",
            slug="existing-internship",
            type=OpportunityType.INTERNSHIP,
            status=OpportunityStatus.PUBLISHED,
            location_type=LocationType.REMOTE,
            is_featured=False,
            verification_status=VerificationStatus.VERIFIED,
            compensation_type=CompensationType.PAID,
        )
        archived_curated = Opportunity(
            organization_id=other_org.id,
            title="Old HackSmart",
            slug="hacksmart-2-0",
            type=OpportunityType.HACKATHON,
            status=OpportunityStatus.ARCHIVED,
            deleted_at=datetime.now(timezone.utc),
            location_type=LocationType.ONSITE,
            is_featured=False,
            verification_status=VerificationStatus.UNVERIFIED,
            compensation_type=CompensationType.UNPAID,
        )
        db.add_all([unrelated, archived_curated])
        db.commit()

    # Run upgrade() twice against the connection to prove idempotency
    with engine.begin() as conn:
        monkeypatch.setattr(mig_0009.op, "get_bind", lambda: conn)
        mig_0009.upgrade()
        mig_0009.upgrade()

    with SessionLocal() as db:
        featured_slugs = set(
            db.scalars(
                select(Opportunity.slug).where(
                    Opportunity.is_featured.is_(True),
                    Opportunity.status == OpportunityStatus.PUBLISHED,
                    Opportunity.deleted_at.is_(None),
                )
            ).all()
        )
        assert featured_slugs == {
            "hacksmart-2-0",
            "ai-vibeathon-1-0",
            "tcu-hack-day",
            "sustainx-the-sustainability-hackathon-track-2",
        }

        # Unrelated opportunity was untouched
        other = db.scalar(select(Opportunity).where(Opportunity.slug == "existing-internship"))
        assert other is not None
        assert other.status == OpportunityStatus.PUBLISHED
        assert other.deleted_at is None
        assert other.is_featured is False


def test_host_event_truthful_email_delivery_statuses(client, monkeypatch):
    payload = {
        "event_name": "Delhi Cloud Summit 2027",
        "organizer_name": "Yash",
        "organizer_email": "organizer@example.com",
        "organizer_organization": "LaunchByte Guild",
        "description": "A comprehensive hands-on cloud architecture and AI systems hackathon.",
        "category": "Hackathon",
        "event_format": "hybrid",
        "venue_location": "New Delhi, India",
        "event_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        "registration_url": "https://launchbyte.io/events/delhi-cloud",
        "contact_info": "organizer@example.com",
    }

    # 1. Both admin & organizer emails succeed
    monkeypatch.setattr(
        "app.routers.public_submissions.send_admin_notification",
        lambda **kwargs: EmailDeliveryResult(sent=True),
    )
    monkeypatch.setattr(
        "app.routers.public_submissions.send_user_notification",
        lambda **kwargs: EmailDeliveryResult(sent=True),
    )
    ok_resp = client.post("/api/v1/public/host-event", json=payload)
    assert ok_resp.status_code == 201
    ok_data = ok_resp.json()
    assert ok_data["email_sent"] is True
    assert ok_data["admin_email_sent"] is True
    assert ok_data["organizer_email_sent"] is True
    assert ok_data["email_error"] is None

    # 2. Admin succeeds, organizer fails -> email_sent=False, truthful message
    monkeypatch.setattr(
        "app.routers.public_submissions.send_admin_notification",
        lambda **kwargs: EmailDeliveryResult(sent=True),
    )
    monkeypatch.setattr(
        "app.routers.public_submissions.send_user_notification",
        lambda **kwargs: EmailDeliveryResult(sent=False, error="Brevo 400 invalid recipient"),
    )
    partial_resp = client.post("/api/v1/public/host-event", json=payload)
    assert partial_resp.status_code == 201
    partial_data = partial_resp.json()
    assert partial_data["email_sent"] is False
    assert partial_data["admin_email_sent"] is True
    assert partial_data["organizer_email_sent"] is False
    assert "Brevo 400 invalid recipient" in partial_data["email_error"]
    assert "could not be delivered" in partial_data["message"]
