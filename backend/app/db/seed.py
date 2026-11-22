"""
Development / demo seed data.

    python -m app.db.seed                     # random passwords, printed once
    python -m app.db.seed --admin-password 'S0me-long-pass'

Safe to run repeatedly: every record is looked up by its natural key
(email / slug / name) and only created when missing. Refuses to run when
ENV=production.
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
    Event,
    EventMode,
    EventRegistration,
    EventStaff,
    EventStaffRole,
    EventStatus,
    Notification,
    Opportunity,
    OpportunityReport,
    Organization,
    OrganizationMember,
    RegistrationStatus,
    SavedOpportunity,
    SiteTeamMember,
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
ORGANIZER_EMAIL = "organizer@example.com"


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
    organizer_password: str | None = None,
) -> dict[str, str]:
    """Populate the database. Returns {email: password} for users created this run."""
    now = datetime.now(timezone.utc)
    credentials: dict[str, str] = {}

    # ---------------------------------------------------------------- users
    def make_user(email, role, full_name, password, verified=True, handle=None):
        password = password or secrets.token_urlsafe(12)
        handle = handle or email.split("@")[0].lower()
        user, created = _get_or_create(
            db,
            User,
            {"email": email},
            {
                "handle": handle,
                "hashed_password": hash_password(password),
                "full_name": full_name,
                "role": role,
                "is_email_verified": verified,
            },
        )
        if created and email in {ADMIN_EMAIL, STUDENT_EMAIL, ORGANIZER_EMAIL}:
            credentials[email] = password
        return user

    admin = make_user(ADMIN_EMAIL, UserRole.ADMIN, "Ada Admin", admin_password)
    student = make_user(STUDENT_EMAIL, UserRole.USER, "Sam Student", student_password)
    organizer = make_user(ORGANIZER_EMAIL, UserRole.ORGANIZER, "Olivia Organizer", organizer_password)

    # LaunchByte verification suite seed accounts
    lb_admin = make_user("admin@launchbyte.io", UserRole.ADMIN, "LaunchByte Admin", "adminpassword123", handle="lbadmin")
    lb_mod = make_user("moderator@launchbyte.io", UserRole.MODERATOR, "LaunchByte Moderator", "moderatorpassword123", handle="lbmod")
    lb_student = make_user("student@launchbyte.io", UserRole.USER, "LaunchByte Student", "studentpassword123", handle="lbstudent")

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
    tag_names = [
        "AI", "Web", "Data Science", "Design", "Remote", "Open Source",
        "Climate", "Women in Tech", "Web3", "Cybersecurity", "Cloud", "Founders"
    ]
    for name in tag_names:
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

    acme = make_org(
        "acme-robotics", "Acme Robotics", OrganizationType.COMPANY, "acme-robotics.com",
        VerificationStatus.VERIFIED, country_code="US", contact_email="careers@acme-robotics.com",
        logo_url="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&h=128&fit=crop"
    )
    uni = make_org(
        "state-university", "State University", OrganizationType.UNIVERSITY, "stateuniversity.edu",
        VerificationStatus.VERIFIED, country_code="IN",
        logo_url="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=128&h=128&fit=crop"
    )
    byte_org = make_org(
        "byte-foundation", "Byte Innovation Labs", OrganizationType.COMMUNITY, "bytelabs.org",
        VerificationStatus.VERIFIED, country_code="US",
        logo_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&h=128&fit=crop"
    )
    found = make_org(
        "bright-futures", "Bright Futures Foundation", OrganizationType.NONPROFIT, "brightfutures.org",
        VerificationStatus.UNVERIFIED, country_code="GB",
        logo_url="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=128&h=128&fit=crop"
    )
    shady = make_org(
        "quickhire-global", "QuickHire Global", OrganizationType.COMPANY, None,
        VerificationStatus.FLAGGED, contact_email="hr.quickhire@gmail.com"
    )

    # Org memberships
    _get_or_create(
        db, OrganizationMember,
        {"organization_id": acme.id, "user_id": organizer.id},
        {"role": "owner"}
    )
    _get_or_create(
        db, OrganizationMember,
        {"organization_id": uni.id, "user_id": organizer.id},
        {"role": "editor"}
    )
    _get_or_create(
        db, OrganizationMember,
        {"organization_id": byte_org.id, "user_id": organizer.id},
        {"role": "owner"}
    )

    # -------------------------------------------------------- opportunities
    def make_opp(slug, org, title, type_, status, tag_list, **extra):
        opp, created = _get_or_create(
            db,
            Opportunity,
            {"slug": slug},
            {
                "organization_id": org.id,
                "posted_by_id": organizer.id if org == byte_org else admin.id,
                "title": title,
                "type": type_,
                "status": status,
                "published_at": now - timedelta(days=3) if status in (
                    OpportunityStatus.PUBLISHED, OpportunityStatus.CLOSED) else None,
                **extra,
            },
        )
        if created:
            opp.tags = [tags[t] for t in tag_list if t in tags]
        return opp

    # 1. Internship
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

    # 2. Hackathon 1
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

    # 3. Hackathon 2
    make_opp(
        "bytehacks-global-2026", byte_org, "ByteHacks Global Virtual Hackathon", OpportunityType.HACKATHON,
        OpportunityStatus.PUBLISHED, ["AI", "Web", "Remote"],
        summary="Join 3,000+ developers worldwide building next-gen developer tooling and AI agents.",
        description="LaunchByte's flagship annual virtual hackathon with mentors from Google, OpenAI, and Stripe.",
        requirements=["Any skill level", "Solo or teams up to 4"],
        location_type=LocationType.REMOTE,
        application_url="https://bytelabs.org/bytehacks-2026",
        deadline_at=now + timedelta(days=14), starts_at=now + timedelta(days=16),
        ends_at=now + timedelta(days=18),
        compensation_type=CompensationType.PRIZE, compensation_min=Decimal("25000"),
        compensation_currency="USD", compensation_note="$25k cash prize pool",
        verification_status=VerificationStatus.VERIFIED, trust_score=95, verified_at=now, is_featured=True,
    )

    # 4. Hackathon 3
    make_opp(
        "ai-agents-autonomous-hack", acme, "Autonomous AI Agents Sprint", OpportunityType.HACKATHON,
        OpportunityStatus.PUBLISHED, ["AI", "Open Source", "Remote"],
        summary="Build autonomous agents that interact with APIs and browser environments.",
        location_type=LocationType.REMOTE, country_code="US",
        application_url="https://acme-robotics.com/agents-sprint",
        deadline_at=now + timedelta(days=7), starts_at=now + timedelta(days=10),
        ends_at=now + timedelta(days=12),
        compensation_type=CompensationType.PRIZE, compensation_min=Decimal("10000"),
        compensation_currency="USD", compensation_note="$10,000 top prize",
        verification_status=VerificationStatus.VERIFIED, trust_score=91, verified_at=now,
    )

    # 5. Hackathon 4
    make_opp(
        "web3-zero-knowledge-hack", byte_org, "ZK Proofs & Privacy Hackathon", OpportunityType.HACKATHON,
        OpportunityStatus.PUBLISHED, ["Web3", "Remote"],
        summary="Explore cryptography and zero-knowledge identity protocols in a 3-day challenge.",
        location_type=LocationType.REMOTE,
        application_url="https://bytelabs.org/zk-hack",
        deadline_at=now + timedelta(days=25),
        compensation_type=CompensationType.PRIZE, compensation_min=Decimal("15000"),
        compensation_currency="USD",
        verification_status=VerificationStatus.VERIFIED, trust_score=85, verified_at=now,
    )

    # 6. Hackathon 5
    make_opp(
        "clean-energy-climate-hack", found, "Global Climate Tech Challenge", OpportunityType.HACKATHON,
        OpportunityStatus.PUBLISHED, ["Climate", "Open Source"],
        summary="Design software to accelerate decarbonization, clean grid scheduling, and carbon tracking.",
        location_type=LocationType.HYBRID, location_text="London, UK & Virtual", country_code="GB",
        application_url="https://brightfutures.org/climate-tech",
        deadline_at=now + timedelta(days=35),
        compensation_type=CompensationType.PRIZE, compensation_min=Decimal("20000"),
        compensation_currency="GBP",
        verification_status=VerificationStatus.VERIFIED, trust_score=89, verified_at=now,
    )

    # 7. Internship 2
    make_opp(
        "fullstack-swe-intern", acme, "Full-Stack Software Engineering Intern", OpportunityType.INTERNSHIP,
        OpportunityStatus.PUBLISHED, ["Web", "Cloud"],
        summary="Build scalable telemetry and cloud control planes for robotics hardware.",
        location_type=LocationType.HYBRID, location_text="Boston, MA", country_code="US",
        application_url="https://acme-robotics.com/careers/fullstack",
        deadline_at=now + timedelta(days=40),
        compensation_type=CompensationType.PAID, compensation_min=Decimal("3500"),
        compensation_max=Decimal("4500"), compensation_currency="USD",
        verification_status=VerificationStatus.VERIFIED, trust_score=87, verified_at=now,
    )

    # 8. Internship 3
    make_opp(
        "product-design-intern", found, "Product Design & UX Research Intern", OpportunityType.INTERNSHIP,
        OpportunityStatus.PUBLISHED, ["Design", "Remote"],
        summary="Join our team creating accessible educational portals for underprivileged youth.",
        location_type=LocationType.REMOTE, country_code="GB",
        application_url="https://brightfutures.org/careers/ux-intern",
        deadline_at=now + timedelta(days=18),
        compensation_type=CompensationType.STIPEND, compensation_min=Decimal("2000"),
        compensation_currency="GBP",
        verification_status=VerificationStatus.UNVERIFIED, trust_score=75,
    )

    # 9. Workshop 1
    make_opp(
        "distributed-systems-workshop", uni, "Hands-on Distributed Systems & Consensus Workshop", OpportunityType.EVENT,
        OpportunityStatus.PUBLISHED, ["Cloud", "Open Source"],
        summary="A 4-part masterclass on Raft consensus, distributed logs, and fault-tolerant storage.",
        location_type=LocationType.REMOTE, country_code="IN",
        application_url="https://stateuniversity.edu/workshops/dist-sys",
        deadline_at=now + timedelta(days=5), starts_at=now + timedelta(days=8),
        compensation_type=CompensationType.UNPAID,
        verification_status=VerificationStatus.VERIFIED, trust_score=90, verified_at=now,
    )

    # 10. Workshop 2
    make_opp(
        "cloud-native-k8s-workshop", acme, "Cloud-Native Microservices on Kubernetes", OpportunityType.EVENT,
        OpportunityStatus.PUBLISHED, ["Cloud", "Remote"],
        summary="Learn container orchestration, service meshes, and observability hands-on.",
        location_type=LocationType.REMOTE, country_code="US",
        application_url="https://acme-robotics.com/k8s-workshop",
        deadline_at=now + timedelta(days=12),
        compensation_type=CompensationType.UNPAID,
        verification_status=VerificationStatus.VERIFIED, trust_score=86, verified_at=now,
    )

    # 11. Workshop 3
    make_opp(
        "production-llm-workshop", byte_org, "Building Production LLM Applications & Eval Systems", OpportunityType.EVENT,
        OpportunityStatus.PUBLISHED, ["AI", "Web"],
        summary="Deep dive into prompt optimization, RAG retrieval caching, and LLM evaluation pipelines.",
        location_type=LocationType.ONSITE, location_text="San Francisco, CA", country_code="US",
        application_url="https://bytelabs.org/llm-workshop",
        deadline_at=now + timedelta(days=15), starts_at=now + timedelta(days=20),
        compensation_type=CompensationType.UNPAID,
        verification_status=VerificationStatus.VERIFIED, trust_score=93, verified_at=now, is_featured=True,
    )

    # 12. Fellowship
    make_opp(
        "emerging-founders-fellowship", byte_org, "Emerging Founders Venture Fellowship", OpportunityType.FELLOWSHIP,
        OpportunityStatus.PUBLISHED, ["Founders", "AI", "Cloud"],
        summary="Equity-free $50,000 grant and 6 months of mentorship for student and early-career founders.",
        description="Backing exceptional technical builders solving hard problems with cutting-edge software.",
        location_type=LocationType.REMOTE,
        application_url="https://bytelabs.org/founders",
        deadline_at=now + timedelta(days=60),
        compensation_type=CompensationType.FUNDED, compensation_min=Decimal("50000"),
        compensation_currency="USD", compensation_note="$50,000 equity-free grant",
        verification_status=VerificationStatus.VERIFIED, trust_score=96, verified_at=now, is_featured=True,
    )

    # 13. Scholarship (pending)
    make_opp(
        "bright-futures-scholarship", found, "Bright Futures STEM Scholarship", OpportunityType.SCHOLARSHIP,
        OpportunityStatus.PUBLISHED, ["Women in Tech", "Climate"],
        summary="Full tuition support for women pursuing STEM degrees.",
        is_rolling=True, location_type=LocationType.REMOTE, country_code="GB",
        compensation_type=CompensationType.FUNDED,
        verification_status=VerificationStatus.PENDING,
    )

    # 14. Scam (flagged)
    scam = make_opp(
        "quickhire-earn-5k-weekly", shady, "Earn $5,000 weekly — no experience needed", OpportunityType.JOB,
        OpportunityStatus.PUBLISHED, ["Remote"],
        summary="Guaranteed income. Pay a small onboarding fee to begin.",
        location_type=LocationType.REMOTE,
        application_url="https://bit.ly/quick-hire-now",
        verification_status=VerificationStatus.FLAGGED, trust_score=8,
    )

    # 15. Pending review
    make_opp(
        "acme-data-fellowship", acme, "Data Science Fellowship", OpportunityType.FELLOWSHIP,
        OpportunityStatus.PENDING_REVIEW, ["Data Science", "AI"],
        summary="Awaiting moderator review.",
        deadline_at=now + timedelta(days=45),
    )

    # 16. Draft
    make_opp(
        "state-uni-design-workshop", uni, "Product Design Workshop", OpportunityType.EVENT,
        OpportunityStatus.DRAFT, ["Design"],
    )

    # 17. Closed
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
    _get_or_create(
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

    # ------------------------------------------------------ site team members
    team_members = [
        {
            "name": "Sarah Chen",
            "designation": "Founder & Chief Executive Officer",
            "bio": "Former hackathon organizer and MIT alum passionate about unlocking global tech opportunities.",
            "photo_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
            "linkedin_url": "https://linkedin.com/in/sarahchen-example",
            "github_url": "https://github.com/sarahchen",
            "display_order": 1,
        },
        {
            "name": "David Kalu",
            "designation": "Co-Founder & Chief Technology Officer",
            "bio": "Distributed systems engineer building lightning-fast, high-trust developer infrastructure.",
            "photo_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
            "linkedin_url": "https://linkedin.com/in/davidkalu-example",
            "github_url": "https://github.com/davidkalu",
            "display_order": 2,
        },
        {
            "name": "Maya Patel",
            "designation": "Head of Community & Student Growth",
            "bio": "Empowering 50,000+ student builders through hackathons, fellowships, and workshop cohorts.",
            "photo_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
            "linkedin_url": "https://linkedin.com/in/mayapatel-example",
            "github_url": "https://github.com/mayapatel",
            "display_order": 3,
        },
        {
            "name": "Alex Rivera",
            "designation": "Lead Product Designer",
            "bio": "Obsessed with clean, accessible interfaces and lightning-fast developer experience.",
            "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
            "linkedin_url": "https://linkedin.com/in/alexrivera-example",
            "github_url": "https://github.com/alexrivera",
            "display_order": 4,
        },
    ]
    for tm in team_members:
        lookup = {"name": tm["name"]}
        defaults = {k: v for k, v in tm.items() if k != "name"}
        _get_or_create(db, SiteTeamMember, lookup, defaults)

    # --- Phase 2: Seed Events & Registrations ---
    org_for_events = db.scalar(select(Organization).where(Organization.slug == "hack-the-future"))
    if not org_for_events:
        org_for_events = db.scalar(select(Organization).limit(1))

    organizer_user = db.scalar(select(User).where(User.email == ORGANIZER_EMAIL))
    student_user = db.scalar(select(User).where(User.email == STUDENT_EMAIL))

    now = datetime.now(timezone.utc)
    if org_for_events and organizer_user:
        evt1_lookup = {"slug": "hackquantum-2026"}
        evt1_defaults = {
            "organization_id": org_for_events.id,
            "title": "HackQuantum 2026: Global AI & Quantum Hackathon",
            "tagline": "Build the future of quantum-resistant cryptography, AI agents, and quantum algorithms.",
            "banner_url": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=400&fit=crop",
            "thumbnail_url": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop",
            "description": "Join 1,000+ top hackers, researchers, and engineers worldwide at **HackQuantum 2026**.\n\n### Tracks\n- Quantum-Resistant Cryptography\n- Agentic AI & QML\n- Hybrid High Performance Computing\n\nCompete for over **$50,000** in bounties, cloud credits, and direct interview fast-tracks.",
            "starts_at": now + timedelta(days=14),
            "ends_at": now + timedelta(days=16),
            "timezone": "America/Los_Angeles",
            "mode": EventMode.HYBRID,
            "venue_text": "San Francisco Convention Center, CA",
            "venue_map_url": "https://maps.google.com/?q=Moscone+Center+San+Francisco",
            "online_url": "https://discord.gg/hackquantum",
            "capacity": 250,
            "registration_opens_at": now - timedelta(days=2),
            "registration_closes_at": now + timedelta(days=13),
            "requires_approval": False,
            "waitlist_enabled": True,
            "team_min_size": 1,
            "team_max_size": 4,
            "sections": {
                "schedule": [
                    {"time": "Day 1, 9:00 AM", "title": "Opening Ceremony & Keynote", "description": "Welcome address and keynote by quantum research leads."},
                    {"time": "Day 1, 11:00 AM", "title": "Hacking Begins & Team Mixer", "description": "Start building or find team partners in Discord."},
                    {"time": "Day 2, 2:00 PM", "title": "Mentor Office Hours", "description": "1:1 project review with engineers."},
                    {"time": "Day 3, 12:00 PM", "title": "Submissions Close & Demos", "description": "Final video presentations and live judging."},
                ],
                "prizes": [
                    {"place": "1st Place Grand Prize", "amount": "$20,000", "description": "Direct fast track to seed funding & hardware grants."},
                    {"place": "2nd Place", "amount": "$10,000", "description": "Cash prize plus cloud quantum compute credits."},
                    {"place": "Best AI Agent Track", "amount": "$7,500", "description": "Sponsored by Anthropic & DeepMind research fellows."},
                    {"place": "Best Beginner Hack", "amount": "$2,500", "description": "For first-time hackathon attendees."},
                ],
                "tracks": [
                    {"name": "Quantum Machine Learning", "description": "Algorithms that accelerate neural training on quantum simulators.", "prize": "$10,000"},
                    {"name": "Agentic Security", "description": "Autonomous agents for smart contract auditing and automated penetration testing.", "prize": "$10,000"},
                    {"name": "Open Innovation", "description": "Wildcard category for breakthrough developer tooling.", "prize": "$5,000"},
                ],
                "faqs": [
                    {"question": "Who can participate?", "answer": "Anyone passionate about tech! Students, professionals, and hobbyists worldwide are welcome."},
                    {"question": "Is attendance free?", "answer": "Yes, 100% free! Meals, swag, and hardware kits are provided for in-person attendees."},
                    {"question": "How are teams formed?", "answer": "Teams can have 1 to 4 members. You can find teammates on our Discord server before or during the event."},
                ],
                "sponsors": [
                    {"name": "Google Cloud", "logo_url": "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=100&h=100&fit=crop", "link": "https://cloud.google.com"},
                    {"name": "Supabase", "logo_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop", "link": "https://supabase.com"},
                ],
                "rules": "1. All code must be written during the hackathon.\n2. Respect code of conduct.\n3. Third-party open source libraries and APIs are permitted.",
            },
            "custom_questions": [
                {"id": "diet", "label": "Dietary Preference", "type": "select", "options": ["Vegetarian", "Vegan", "Halal", "Kosher", "No Restrictions"], "required": True},
                {"id": "tshirt", "label": "T-Shirt Size", "type": "select", "options": ["S", "M", "L", "XL", "2XL"], "required": True},
                {"id": "github", "label": "GitHub Profile URL", "type": "text", "required": False},
            ],
            "theme_accent": "#6366f1",
            "status": EventStatus.PUBLISHED,
            "published_at": now - timedelta(days=1),
            "created_by_id": organizer_user.id,
        }
        event1, _ = _get_or_create(db, Event, evt1_lookup, evt1_defaults)

        # Staff manager
        staff_lookup = {"event_id": event1.id, "user_id": organizer_user.id}
        staff_defaults = {"role": EventStaffRole.MANAGER}
        _get_or_create(db, EventStaff, staff_lookup, staff_defaults)

        # Seed registration for student user
        if student_user:
            reg_lookup = {"event_id": event1.id, "user_id": student_user.id}
            reg_defaults = {
                "status": RegistrationStatus.REGISTERED,
                "registration_code": "LB-QK749",
                "qr_nonce": secrets.token_hex(16),
                "answers": {"diet": "Vegetarian", "tshirt": "L", "github": "https://github.com/student"},
                "registered_at": now - timedelta(hours=6),
            }
            _get_or_create(db, EventRegistration, reg_lookup, reg_defaults)

    db.commit()
    return credentials


def main() -> None:
    settings = get_settings()
    if settings.ENV.lower() == "production":
        raise SystemExit("Refusing to seed demo data when ENV=production.")

    parser = argparse.ArgumentParser(description="Seed development data.")
    parser.add_argument("--admin-password", help="Default: random, printed once.")
    parser.add_argument("--student-password", help="Default: random, printed once.")
    parser.add_argument("--organizer-password", help="Default: random, printed once.")
    args = parser.parse_args()

    from app.db.session import SessionLocal

    with SessionLocal() as db:
        creds = seed(db, args.admin_password, args.student_password, args.organizer_password)

    print("Seed complete.")
    if creds:
        print("Accounts created (passwords are shown once):")
        for email, password in creds.items():
            print(f"  {email}  /  {password}")
    else:
        print("Accounts already existed — passwords unchanged.")


if __name__ == "__main__":
    main()
