"""
Database-level behaviour: defaults, constraints, cascades, uniqueness.

These run against in-memory SQLite with foreign keys switched on (see
conftest.py). They assert what the *database* guarantees, independent of any
API route — so a future service can't accidentally rely on rules that aren't
actually enforced.
"""
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError, StatementError

from app.models import (
    Application,
    ApplicationEvent,
    AuditLog,
    Notification,
    Opportunity,
    OpportunityReport,
    Organization,
    SavedOpportunity,
    Tag,
    User,
    UserProfile,
    VerificationCheck,
    VerificationRequest,
)
from app.models.enums import (
    ApplicationStatus,
    CompensationType,
    OpportunityStatus,
    OpportunityType,
    ReportReason,
    UserRole,
    VerificationCheckResult,
    VerificationCheckType,
    VerificationRequestStatus,
    VerificationStatus,
)

NOW = datetime.now(timezone.utc)


# ------------------------------------------------------------------ helpers
def make_user(db, email="u@example.com", **kw):
    user = User(email=email, hashed_password="x", **kw)
    db.add(user)
    db.commit()
    return user


def make_org(db, slug="acme", **kw):
    org = Organization(name=kw.pop("name", slug.title()), slug=slug, **kw)
    db.add(org)
    db.commit()
    return org


def make_opp(db, org, slug="opp-1", **kw):
    opp = Opportunity(
        organization_id=org.id,
        title=kw.pop("title", "An opportunity"),
        slug=slug,
        type=kw.pop("type", OpportunityType.INTERNSHIP),
        **kw,
    )
    db.add(opp)
    db.commit()
    return opp


def count(db, model) -> int:
    return len(db.scalars(select(model)).all())


def rejects(db, obj):
    """Assert the DB refuses to persist `obj`, and leave the session usable."""
    db.add(obj)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


# -------------------------------------------------------------------- users
def test_user_defaults(db_session):
    user = make_user(db_session)
    assert user.role == UserRole.USER
    assert user.is_email_verified is False
    assert user.is_active is True
    assert user.last_login_at is None
    assert user.created_at is not None and user.updated_at is not None
    assert user.is_admin is False and user.is_staff is False


def test_user_role_helpers(db_session):
    admin = make_user(db_session, "a@example.com", role=UserRole.ADMIN)
    mod = make_user(db_session, "m@example.com", role=UserRole.MODERATOR)
    assert admin.is_admin and admin.is_staff
    assert mod.is_staff and not mod.is_admin


def test_user_email_is_unique(db_session):
    make_user(db_session, "dupe@example.com")
    rejects(db_session, User(email="dupe@example.com", hashed_password="x"))


def test_invalid_enum_value_rejected_by_orm(db_session):
    with pytest.raises((LookupError, StatementError)):
        db_session.add(User(email="bad@example.com", hashed_password="x", role="superhero"))
        db_session.commit()
    db_session.rollback()


def test_invalid_enum_value_rejected_by_database_check(db_session):
    """Bypass the ORM entirely — the CHECK constraint itself must hold."""
    with pytest.raises(IntegrityError):
        db_session.execute(
            text(
                "INSERT INTO users (id, email, hashed_password, is_active, role, is_email_verified) "
                "VALUES ('00000000000000000000000000000001', 'raw@example.com', 'x', 1, 'superhero', 0)"
            )
        )
    db_session.rollback()


# ----------------------------------------------------------------- profiles
@pytest.mark.filterwarnings("ignore::sqlalchemy.exc.SAWarning")
def test_profile_is_one_to_one_and_stores_json(db_session):
    user = make_user(db_session)
    db_session.add(UserProfile(user_id=user.id, skills=["python", "sql"], graduation_year=2027))
    db_session.commit()
    db_session.refresh(user)
    assert user.profile.skills == ["python", "sql"]

    rejects(db_session, UserProfile(user_id=user.id))  # PK = user_id → one per user


def test_profile_graduation_year_check(db_session):
    user = make_user(db_session)
    rejects(db_session, UserProfile(user_id=user.id, graduation_year=1800))


# ------------------------------------------------------------ organizations
def test_organization_defaults_and_unique_slug(db_session):
    org = make_org(db_session, "acme")
    assert org.verification_status == VerificationStatus.UNVERIFIED
    assert org.deleted_at is None
    rejects(db_session, Organization(name="Other", slug="acme"))


# ------------------------------------------------------------ opportunities
def test_opportunity_defaults(db_session):
    opp = make_opp(db_session, make_org(db_session))
    assert opp.status == OpportunityStatus.DRAFT
    assert opp.compensation_type == CompensationType.UNSPECIFIED
    assert opp.verification_status == VerificationStatus.UNVERIFIED
    assert opp.view_count == 0
    assert opp.is_rolling is False and opp.is_featured is False
    assert opp.trust_score is None


def test_opportunity_slug_unique(db_session):
    org = make_org(db_session)
    make_opp(db_session, org, "same-slug")
    rejects(
        db_session,
        Opportunity(organization_id=org.id, title="t", slug="same-slug", type=OpportunityType.JOB),
    )


@pytest.mark.parametrize(
    "bad",
    [
        {"compensation_min": Decimal("500"), "compensation_max": Decimal("100")},
        {"starts_at": NOW + timedelta(days=5), "ends_at": NOW},
        {"trust_score": 101},
        {"trust_score": -1},
    ],
    ids=["comp-range", "date-range", "trust>100", "trust<0"],
)
def test_opportunity_check_constraints(db_session, bad):
    org = make_org(db_session)
    rejects(
        db_session,
        Opportunity(organization_id=org.id, title="t", slug="bad", type=OpportunityType.JOB, **bad),
    )


def test_organization_with_opportunities_cannot_be_hard_deleted(db_session):
    org = make_org(db_session)
    make_opp(db_session, org)
    db_session.delete(org)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
    assert count(db_session, Organization) == 1


def test_deleting_poster_keeps_the_opportunity(db_session):
    poster = make_user(db_session, "poster@example.com")
    opp = make_opp(db_session, make_org(db_session), posted_by_id=poster.id)
    db_session.delete(poster)
    db_session.commit()
    db_session.refresh(opp)
    assert opp.posted_by_id is None


def test_tags_many_to_many_and_cascade(db_session):
    org = make_org(db_session)
    opp = make_opp(db_session, org)
    ai, web = Tag(name="AI", slug="ai"), Tag(name="Web", slug="web")
    opp.tags = [ai, web]
    db_session.commit()
    assert {t.slug for t in opp.tags} == {"ai", "web"}
    assert [o.slug for o in ai.opportunities] == ["opp-1"]

    db_session.delete(opp)
    db_session.commit()
    assert count(db_session, Tag) == 2  # tags survive
    assert db_session.execute(text("SELECT COUNT(*) FROM opportunity_tags")).scalar() == 0


def test_saved_opportunity_is_unique_per_user_and_cascades(db_session):
    user = make_user(db_session)
    opp = make_opp(db_session, make_org(db_session))
    db_session.add(SavedOpportunity(user_id=user.id, opportunity_id=opp.id))
    db_session.commit()
    rejects(db_session, SavedOpportunity(user_id=user.id, opportunity_id=opp.id))

    db_session.delete(user)
    db_session.commit()
    assert count(db_session, SavedOpportunity) == 0
    assert count(db_session, Opportunity) == 1


# ------------------------------------------------------------- applications
def test_application_defaults_and_timeline(db_session):
    user = make_user(db_session)
    opp = make_opp(db_session, make_org(db_session))
    app_ = Application(user_id=user.id, opportunity_id=opp.id)
    db_session.add(app_)
    db_session.commit()
    assert app_.status == ApplicationStatus.INTERESTED
    assert app_.priority == 2

    db_session.add_all(
        [
            ApplicationEvent(
                application_id=app_.id,
                event_type="status_change",
                from_status=ApplicationStatus.INTERESTED,
                to_status=ApplicationStatus.APPLIED,
                occurred_at=NOW,
            ),
            ApplicationEvent(application_id=app_.id, note="Emailed recruiter", occurred_at=NOW - timedelta(days=1)),
        ]
    )
    db_session.commit()
    db_session.refresh(app_)
    assert [e.note for e in app_.events][0] == "Emailed recruiter"  # ordered by occurred_at
    assert len(app_.events) == 2


def test_one_application_per_user_per_opportunity(db_session):
    user = make_user(db_session)
    opp = make_opp(db_session, make_org(db_session))
    db_session.add(Application(user_id=user.id, opportunity_id=opp.id))
    db_session.commit()
    rejects(db_session, Application(user_id=user.id, opportunity_id=opp.id))


def test_external_applications_do_not_collide(db_session):
    user = make_user(db_session)
    db_session.add_all(
        [
            Application(user_id=user.id, custom_title="Google STEP"),
            Application(user_id=user.id, custom_title="Microsoft Explore"),
        ]
    )
    db_session.commit()
    assert count(db_session, Application) == 2


def test_application_needs_a_target(db_session):
    user = make_user(db_session)
    rejects(db_session, Application(user_id=user.id))  # no opportunity, no custom_title


def test_application_priority_range(db_session):
    user = make_user(db_session)
    rejects(db_session, Application(user_id=user.id, custom_title="x", priority=9))


def test_user_delete_cascades_to_applications_and_events(db_session):
    user = make_user(db_session)
    opp = make_opp(db_session, make_org(db_session))
    app_ = Application(user_id=user.id, opportunity_id=opp.id)
    db_session.add(app_)
    db_session.commit()
    db_session.add(ApplicationEvent(application_id=app_.id, note="hi"))
    db_session.commit()

    db_session.delete(user)
    db_session.commit()
    assert count(db_session, Application) == 0
    assert count(db_session, ApplicationEvent) == 0
    assert count(db_session, Opportunity) == 1


def test_opportunity_with_applications_cannot_be_deleted(db_session):
    user = make_user(db_session)
    opp = make_opp(db_session, make_org(db_session))
    db_session.add(Application(user_id=user.id, opportunity_id=opp.id))
    db_session.commit()

    db_session.delete(opp)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
    assert count(db_session, Application) == 1  # was NOT silently detached


# ------------------------------------------------------------- verification
def test_verification_request_needs_exactly_one_subject(db_session):
    org = make_org(db_session)
    opp = make_opp(db_session, org)
    rejects(db_session, VerificationRequest())  # neither
    rejects(db_session, VerificationRequest(organization_id=org.id, opportunity_id=opp.id))  # both

    db_session.add(VerificationRequest(opportunity_id=opp.id))
    db_session.commit()
    assert count(db_session, VerificationRequest) == 1


def test_verification_checks_belong_to_request_and_cascade(db_session):
    org = make_org(db_session)
    req = VerificationRequest(organization_id=org.id)
    db_session.add(req)
    db_session.commit()
    assert req.status == VerificationRequestStatus.PENDING

    db_session.add(
        VerificationCheck(
            request_id=req.id,
            check_type=VerificationCheckType.DOMAIN_MATCH,
            result=VerificationCheckResult.PASSED,
            score=95,
            details={"host": "acme.com"},
        )
    )
    db_session.commit()
    db_session.refresh(req)
    assert req.checks[0].details == {"host": "acme.com"}

    rejects(
        db_session,
        VerificationCheck(
            request_id=req.id,
            check_type=VerificationCheckType.MANUAL_REVIEW,
            result=VerificationCheckResult.PASSED,
            score=250,
        ),
    )

    db_session.delete(req)
    db_session.commit()
    assert count(db_session, VerificationCheck) == 0


def test_report_once_per_reporter_and_reason_and_survives_reporter_deletion(db_session):
    reporter = make_user(db_session, "r@example.com")
    opp = make_opp(db_session, make_org(db_session))
    db_session.add(OpportunityReport(opportunity_id=opp.id, reporter_id=reporter.id, reason=ReportReason.SCAM))
    db_session.commit()
    rejects(db_session, OpportunityReport(opportunity_id=opp.id, reporter_id=reporter.id, reason=ReportReason.SCAM))
    # a different reason from the same user is fine
    db_session.add(OpportunityReport(opportunity_id=opp.id, reporter_id=reporter.id, reason=ReportReason.EXPIRED))
    db_session.commit()

    db_session.delete(reporter)
    db_session.commit()
    reports = db_session.scalars(select(OpportunityReport)).all()
    assert len(reports) == 2 and all(r.reporter_id is None for r in reports)


# --------------------------------------------------------- notifications/audit
def test_notification_unread_by_default_and_cascades(db_session):
    user = make_user(db_session)
    db_session.add(Notification(user_id=user.id, title="Deadline soon", data={"opportunity_id": "abc"}))
    db_session.commit()
    n = db_session.scalars(select(Notification)).one()
    assert n.read_at is None and n.type.value == "system"

    db_session.delete(user)
    db_session.commit()
    assert count(db_session, Notification) == 0


def test_audit_log_survives_actor_deletion(db_session):
    admin = make_user(db_session, "admin@example.com", role=UserRole.ADMIN)
    db_session.add(
        AuditLog(actor_id=admin.id, action="verification.approve", entity_type="opportunity", entity_id="123")
    )
    db_session.commit()
    db_session.delete(admin)
    db_session.commit()
    log = db_session.scalars(select(AuditLog)).one()
    assert log.actor_id is None and log.action == "verification.approve"
