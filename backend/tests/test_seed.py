from sqlalchemy import func, select

from app.db.seed import ADMIN_EMAIL, ORGANIZER_EMAIL, STUDENT_EMAIL, seed
from app.models import (
    Application,
    ApplicationEvent,
    Opportunity,
    Organization,
    User,
    VerificationCheck,
)
from app.models.enums import OpportunityStatus, UserRole, VerificationStatus


def _counts(db):
    return {
        m.__name__: db.scalar(select(func.count()).select_from(m))
        for m in (User, Organization, Opportunity, Application, ApplicationEvent, VerificationCheck)
    }


def test_seed_populates_every_domain(db_session):
    creds = seed(
        db_session,
        admin_password="admin-pass-123",
        student_password="student-pass-123",
        organizer_password="organizer-pass-123",
    )
    assert creds == {
        ADMIN_EMAIL: "admin-pass-123",
        STUDENT_EMAIL: "student-pass-123",
        ORGANIZER_EMAIL: "organizer-pass-123",
    }

    admin = db_session.scalar(select(User).where(User.email == ADMIN_EMAIL))
    assert admin.role == UserRole.ADMIN

    organizer = db_session.scalar(select(User).where(User.email == ORGANIZER_EMAIL))
    assert organizer.role == UserRole.ORGANIZER

    statuses = {o.status for o in db_session.scalars(select(Opportunity))}
    assert statuses == set(OpportunityStatus) - {OpportunityStatus.ARCHIVED, OpportunityStatus.REJECTED}
    flagged = db_session.scalars(
        select(Opportunity).where(Opportunity.verification_status == VerificationStatus.FLAGGED)
    ).all()
    assert len(flagged) == 1 and flagged[0].trust_score < 20


def test_seed_is_idempotent(db_session):
    seed(db_session)
    first = _counts(db_session)
    creds_second_run = seed(db_session)
    assert creds_second_run == {}          # nothing new created → no new passwords
    assert _counts(db_session) == first    # and no duplicate rows


def test_seeded_student_can_log_in_through_the_api(client, db_session):
    seed(db_session, student_password="student-pass-123")
    resp = client.post("/api/v1/auth/login", data={"username": STUDENT_EMAIL, "password": "student-pass-123"})
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    me = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"}).json()
    assert me["email"] == STUDENT_EMAIL and me["role"] == "user"
