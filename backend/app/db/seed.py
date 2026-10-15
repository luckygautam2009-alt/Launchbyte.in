"""
Development / demo seed data.

    python -m app.db.seed                     # random passwords, printed once
    python -m app.db.seed --admin-password 'S0me-long-pass'

Safe to run repeatedly: every record is looked up by its natural key
(email / slug / name) and only created when missing. Refuses to run when
ENV=production.

It creates a small but realistic slice of the product: one admin, one
student, verified / unverified / flagged organizations, opportunities in every
lifecycle state, a tracked-application timeline, a verification request with
its checks, a scam report and a notification — enough to exercise every table
and every list/detail screen while developing.
"""
from __future__ import annotations

import argparse
import secrets
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password
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
    ApplicationEventType,
    ApplicationStatus,
    CompensationType,
    LocationType,
    NotificationType,
    OpportunityStatus,
    OpportunityType,
    OrganizationType,
    ReportReason,
    UserRole,
    VerificationCheckResult,
    VerificationCheckType,
    VerificationRequestStatus,
    VerificationStatus,
)

ADMIN_EMAIL = "admin@example.com"
STUDENT_EMAIL = "student@example.com"


def _get_or_create(db: Session, model, lookup: dict, defaults: dict | None = None):
    obj = db.scalar(select(model).filter_by(**lookup))
    if obj is not None:
        return obj, False
    obj = model(**lookup, **(defaults or {}))
    db.add(obj)
    db.flush()
    return obj, True


def seed(
    db: Session,
    admin_password: str | None = None,
    student_password: str | None = None,
) -> dict[str, str]:
    """Populate the database. Returns {email: password} for users created this run."""
    now = datetime.now(timezone.utc)
    credentials: dict[str, str] = {}

    # ---------------------------------------------------------------- users
    def make_user(email, role, full_name, password, verified=True):
        password = password or secrets.token_urlsafe(12)
        user, created = _get_or_create(
            db,
            User,
            {"email": email},
            {
                "hashed_password": hash_password(password),
                "full_name": full_name,
                "role": role,
                "is_email_verified": verified,
            },
        )
        if created:
            credentials[email] = password
        return user

    admin = make_user(ADMIN_EMAIL, UserRole.ADMIN, "Ada Admin", admin_password)
    student = make_user(STUDENT_EMAIL, UserRole.USER, "Sam Student", student_password)

    _get_or_create(
        db,
        UserProfile,
        {"user_id": student.id},
        {
            "headline": "CS undergrad looking for a summer internship",
            "institution": "State University",
            "field_of_study": "Computer Science",
            "graduation_year": 2027,
            "country_code": "IN",
            "skills": ["python", "sql", "react"],
            "interests": ["ai", "open-source"],
            "preferred_opportunity_types": ["internship", "hackathon"],
            "github_url": "https://github.com/example-student",
        },
    )

    # ----------------------------------------------------------------- tags
    tags = {}
    for name in ["AI", "Web", "Data Science", "Design", "Remote", "Open Source", "Climate", "Women in Tech"]:
        tags[name], _ = _get_or_create(
            db, Tag, {"slug": name.lower().replace(" ", "-")}, {"name": name}
        )

    # -------------------------------------------------------- organizations
    def make_org(slug, name, type_, domain, status, **extra):
        org, created = _get_or_create(
            db,
            Organization,
            {"slug": slug},
            {
                "name": name,
                "type": type_,
                "domain": domain,
                "website_url": f"https://{domain}" if domain else None,
                "verification_status": status,
                "verified_at": now if status == VerificationStatus.VERIFIED else None,
                "created_by_id": admin.id,
                **extra,
            },
        )
        return org

    acme = make_org("acme-robotics", "Acme Robotics", OrganizationType.COMPANY, "acme-robotics.com",
                    VerificationStatus.VERIFIED, country_code="US", contact_email="careers@acme-robotics.com")
    uni = make_org("state-university", "State University", OrganizationType.UNIVERSITY, "stateuniversity.edu",
                   VerificationStatus.VERIFIED, country_code="IN")
    found = make_org("bright-futures", "Bright Futures Foundation", OrganizationType.NONPROFIT, "brightfutures.org",
                     VerificationStatus.UNVERIFIED, country_code="GB")
    shady = make_org("quickhire-global", "QuickHire Global", OrganizationType.COMPANY, None,
                     VerificationStatus.FLAGGED, contact_email="hr.quickhire@gmail.com")

    # -------------------------------------------------------- opportunities
    def make_opp(slug, org, title, type_, status, tag_names, **extra):
        opp, created = _get_or_create(
            db,
            Opportunity,
            {"slug": slug},
            {
                "organization_id": org.id,
                "posted_by_id": admin.id,
                "title": title,
                "type": type_,
                "status": status,
                "published_at": now - timedelta(days=3) if status in (
                    OpportunityStatus.PUBLISHED, OpportunityStatus.CLOSED) else None,
                **extra,
            },
        )
        if created:
            opp.tags = [tags[t] for t in tag_names]
        return opp

    intern = make_opp(
        "acme-ml-intern-summer", acme, "Machine Learning Intern (Summer)", OpportunityType.INTERNSHIP,
        OpportunityStatus.PUBLISHED, ["AI", "Remote"],
        summary="12-week paid ML internship on the perception team.",
        description="Work with senior engineers on production perception models.",
        requirements=["Python", "PyTorch basics", "Available May-Aug"],
        location_type=LocationType.REMOTE, country_code="US",
        application_url="https://acme-robotics.com/careers/ml-intern",
        deadline_at=now + timedelta(days=21),
        compensation_type=CompensationType.PAID, compensation_min=Decimal("4000"),
        compensation_max=Decimal("5500"), compensation_currency="USD", compensation_note="per month",
        verification_status=VerificationStatus.VERIFIED, trust_score=92, verified_at=now, is_featured=True,
    )
    hack = make_opp(
        "state-uni-hackathon-2026", uni, "State University Open Hackathon", OpportunityType.HACKATHON,
        OpportunityStatus.PUBLISHED, ["Web", "Open Source"],
        summary="48-hour hackathon open to all students.",
        location_type=LocationType.ONSITE, location_text="Main Campus, Delhi", country_code="IN",
        application_url="https://stateuniversity.edu/hack",
        deadline_at=now + timedelta(days=9), starts_at=now + timedelta(days=30),
        ends_at=now + timedelta(days=32),
        compensation_type=CompensationType.PRIZE, compensation_note="Prize pool for top 3 teams",
        verification_status=VerificationStatus.VERIFIED, trust_score=88, verified_at=now,
    )
    make_opp(
        "bright-futures-scholarship", found, "Bright Futures STEM Scholarship", OpportunityType.SCHOLARSHIP,
        OpportunityStatus.PUBLISHED, ["Women in Tech", "Climate"],
        summary="Full tuition support for women pursuing STEM degrees.",
        is_rolling=True, location_type=LocationType.REMOTE, country_code="GB",
        compensation_type=CompensationType.FUNDED,
        verification_status=VerificationStatus.PENDING,
    )
    scam = make_opp(
        "quickhire-earn-5k-weekly", shady, "Earn $5,000 weekly — no experience needed", OpportunityType.JOB,
        OpportunityStatus.PUBLISHED, ["Remote"],
        summary="Guaranteed income. Pay a small onboarding fee to begin.",
        location_type=LocationType.REMOTE,
        application_url="https://bit.ly/quick-hire-now",
        verification_status=VerificationStatus.FLAGGED, trust_score=8,
    )
    make_opp(
        "acme-data-fellowship", acme, "Data Science Fellowship", OpportunityType.FELLOWSHIP,
        OpportunityStatus.PENDING_REVIEW, ["Data Science", "AI"],
        summary="Awaiting moderator review.",
        deadline_at=now + timedelta(days=45),
    )
    make_opp(
        "state-uni-design-workshop", uni, "Product Design Workshop", OpportunityType.EVENT,
        OpportunityStatus.DRAFT, ["Design"],
    )
    make_opp(
        "acme-2025-winter-intern", acme, "Winter Robotics Intern (2025)", OpportunityType.INTERNSHIP,
        OpportunityStatus.CLOSED, ["AI"],
        deadline_at=now - timedelta(days=120), verification_status=VerificationStatus.VERIFIED, trust_score=90,
    )

    # ----------------------------------------------------------- bookmarks
    for opp in (hack, intern):
        _get_or_create(db, SavedOpportunity, {"user_id": student.id, "opportunity_id": opp.id})

    # ---------------------------------------------- application tracker
    app1, created = _get_or_create(
        db, Application, {"user_id": student.id, "opportunity_id": intern.id},
        {"status": ApplicationStatus.INTERVIEWING, "priority": 1, "applied_at": now - timedelta(days=5),
         "deadline_at": intern.deadline_at, "reminder_at": now + timedelta(days=2),
         "notes": "Referred by a senior; prep system design + PyTorch."},
    )
    if created:
        db.add_all([
            ApplicationEvent(application_id=app1.id, event_type=ApplicationEventType.STATUS_CHANGE,
                             from_status=ApplicationStatus.INTERESTED, to_status=ApplicationStatus.APPLIED,
                             occurred_at=now - timedelta(days=5)),
            ApplicationEvent(application_id=app1.id, event_type=ApplicationEventType.STATUS_CHANGE,
                             from_status=ApplicationStatus.APPLIED, to_status=ApplicationStatus.INTERVIEWING,
                             note="Recruiter screen booked", occurred_at=now - timedelta(days=1)),
        ])
    _get_or_create(  # tracked from outside the platform
        db, Application, {"user_id": student.id, "custom_title": "Google STEP Internship"},
        {"custom_organization": "Google", "custom_url": "https://careers.google.com/",
         "status": ApplicationStatus.PREPARING, "priority": 2},
    )
    _get_or_create(
        db, Application, {"user_id": student.id, "opportunity_id": hack.id},
        {"status": ApplicationStatus.INTERESTED, "priority": 3},
    )

    # ------------------------------------------------------- trust layer
    vr, created = _get_or_create(
        db, VerificationRequest, {"organization_id": acme.id},
        {"requested_by_id": admin.id, "reviewer_id": admin.id, "status": VerificationRequestStatus.APPROVED,
         "reviewed_at": now, "reviewer_notes": "Domain + registry confirmed.",
         "evidence": {"website": "https://acme-robotics.com"}},
    )
    if created:
        db.add_all([
            VerificationCheck(request_id=vr.id, check_type=VerificationCheckType.DOMAIN_MATCH,
                              result=VerificationCheckResult.PASSED, score=95,
                              details={"application_url_host": "acme-robotics.com"}),
            VerificationCheck(request_id=vr.id, check_type=VerificationCheckType.WEBSITE_REACHABLE,
                              result=VerificationCheckResult.PASSED, score=90),
            VerificationCheck(request_id=vr.id, check_type=VerificationCheckType.MANUAL_REVIEW,
                              result=VerificationCheckResult.PASSED, score=100, performed_by_id=admin.id),
        ])
        db.add(AuditLog(actor_id=admin.id, action="verification.approve", entity_type="organization",
                        entity_id=str(acme.id), changes={"verification_status": ["pending", "verified"]}))

    vr2, created = _get_or_create(
        db, VerificationRequest, {"opportunity_id": scam.id},
        {"status": VerificationRequestStatus.IN_REVIEW, "reviewer_id": admin.id},
    )
    if created:
        db.add_all([
            VerificationCheck(request_id=vr2.id, check_type=VerificationCheckType.DOMAIN_MATCH,
                              result=VerificationCheckResult.FAILED, score=0,
                              details={"reason": "shortened link, no organization domain"}),
            VerificationCheck(request_id=vr2.id, check_type=VerificationCheckType.CONTACT_EMAIL,
                              result=VerificationCheckResult.FAILED, score=10,
                              details={"reason": "free-mail address"}),
        ])

    _get_or_create(
        db, OpportunityReport,
        {"opportunity_id": scam.id, "reporter_id": student.id, "reason": ReportReason.SCAM},
        {"details": "Asked me to pay an onboarding fee."},
    )

    # ------------------------------------------------------ notifications
    _get_or_create(
        db, Notification, {"user_id": student.id, "title": "Deadline in 9 days: State University Open Hackathon"},
        {"type": NotificationType.DEADLINE_REMINDER, "body": "Register before the deadline.",
         "data": {"opportunity_id": str(hack.id)}},
    )

    db.commit()
    return credentials


def main() -> None:
    settings = get_settings()
    if settings.ENV.lower() == "production":
        raise SystemExit("Refusing to seed demo data when ENV=production.")

    parser = argparse.ArgumentParser(description="Seed development data.")
    parser.add_argument("--admin-password", help="Default: random, printed once.")
    parser.add_argument("--student-password", help="Default: random, printed once.")
    args = parser.parse_args()

    from app.db.session import SessionLocal

    with SessionLocal() as db:
        creds = seed(db, args.admin_password, args.student_password)

    print("Seed complete.")
    if creds:
        print("Accounts created (passwords are shown once):")
        for email, password in creds.items():
            print(f"  {email}  /  {password}")
    else:
        print("Accounts already existed — passwords unchanged.")


if __name__ == "__main__":
    main()
