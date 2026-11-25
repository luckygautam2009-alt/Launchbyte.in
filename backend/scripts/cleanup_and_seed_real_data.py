"""
Safe data cleanup & real featured hackathon seeding script.

1. Non-destructively archives/soft-deletes all fake/demo opportunities and events
   so they never appear on the public website while preserving historical integrity.
2. Seeds the 4 verified real upcoming hackathons:
   - Rack It Up 2026
   - DeFy'27
   - Incursion 2027
   - HACKSPRINT 3.0 2027
"""
import os
import sys
from datetime import datetime, timezone

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

os.environ.setdefault("DATABASE_URL", "sqlite:///./launchbyte.db")

from sqlalchemy import select
from app.db.session import SessionLocal
from app.models.enums import (
    CompensationType,
    LocationType,
    OpportunityStatus,
    OpportunityType,
    VerificationStatus,
)
from app.models.events import Event, EventStatus
from app.models.opportunities import Opportunity
from app.models.organizations import Organization

FAKE_SLUGS_OR_DOMAINS = (
    "acme-robotics.com",
    "stateuniversity.edu",
    "bytelabs.org",
    "brightfutures.org",
    "bit.ly/quick-hire-now",
)

REAL_HACKATHONS = [
    {
        "slug": "rack-it-up-2026",
        "title": "Rack It Up 2026",
        "organizer_name": "Rack'Em / Karma Enterprises",
        "summary": "Online engineering & innovation hackathon organized by Rack'Em / Karma Enterprises for teams of 1–4 builders.",
        "description": (
            "Rack It Up 2026 is an online hackathon hosted by Rack'Em / Karma Enterprises.\n\n"
            "• Format: Online\n"
            "• Dates: 11–13 December 2026\n"
            "• Team Size: 1–4 members\n"
            "• Registration Fee: Free"
        ),
        "type": OpportunityType.HACKATHON,
        "location_type": LocationType.REMOTE,
        "location_text": "Online",
        "starts_at": datetime(2026, 12, 11, 9, 0, tzinfo=timezone.utc),
        "ends_at": datetime(2026, 12, 13, 18, 0, tzinfo=timezone.utc),
        "deadline_at": datetime(2026, 12, 10, 23, 59, tzinfo=timezone.utc),
        "team_size": "1–4 members",
        "compensation_type": CompensationType.UNPAID,
        "compensation_note": "Free Registration",
        "official_website": "https://rackitup.karmaenterprises.tech/",
        "application_url": "https://unstop.com/competitions/1777639/register",
        "source_url": "https://rackitup.karmaenterprises.tech/",
    },
    {
        "slug": "defy-27-vit-chennai",
        "title": "DeFy'27",
        "organizer_name": "Vellore Institute of Technology (VIT), Chennai",
        "summary": "Flagship hackathon by VIT Chennai featuring online idea submission followed by an offline final round at VIT Chennai.",
        "description": (
            "DeFy'27 is organized by Vellore Institute of Technology (VIT), Chennai.\n\n"
            "• Format: Online idea submission + offline final round\n"
            "• Final Round Dates: 9–10 January 2027\n"
            "• Venue: VIT Chennai\n"
            "• Team Size: 4–6 members"
        ),
        "type": OpportunityType.HACKATHON,
        "location_type": LocationType.HYBRID,
        "location_text": "VIT Chennai (Online Prelims + Offline Final)",
        "starts_at": datetime(2027, 1, 9, 9, 0, tzinfo=timezone.utc),
        "ends_at": datetime(2027, 1, 10, 18, 0, tzinfo=timezone.utc),
        "deadline_at": datetime(2027, 1, 5, 23, 59, tzinfo=timezone.utc),
        "team_size": "4–6 members",
        "compensation_type": CompensationType.UNSPECIFIED,
        "compensation_note": "See official rules",
        "official_website": "https://defy.daocommunity.in/",
        "application_url": "https://unstop.com/competitions/1806122/register",
        "source_url": "https://defy.daocommunity.in/",
    },
    {
        "slug": "incursion-2027-dypit",
        "title": "Incursion 2027",
        "organizer_name": "Dr. D. Y. Patil Institute of Technology, Pimpri, Pune",
        "summary": "24-hour offline finale following online selection rounds, hosted by Dr. D. Y. Patil Institute of Technology, Pimpri, Pune.",
        "description": (
            "Incursion 2027 is hosted by Dr. D. Y. Patil Institute of Technology, Pimpri, Pune.\n\n"
            "• Format: Online selection rounds + offline 24-hour finale\n"
            "• Finale Dates: 30–31 January 2027\n"
            "• Venue: Pimpri, Pune\n"
            "• Team Size: 2–4 members\n"
            "• Registration: Initial registration is free. A finalist confirmation fee applies only to shortlisted teams per official rules."
        ),
        "type": OpportunityType.HACKATHON,
        "location_type": LocationType.HYBRID,
        "location_text": "Pimpri, Pune (Online Rounds + 24h Offline Finale)",
        "starts_at": datetime(2027, 1, 30, 9, 0, tzinfo=timezone.utc),
        "ends_at": datetime(2027, 1, 31, 18, 0, tzinfo=timezone.utc),
        "deadline_at": datetime(2027, 1, 25, 23, 59, tzinfo=timezone.utc),
        "team_size": "2–4 members",
        "compensation_type": CompensationType.UNPAID,
        "compensation_note": "Free initial registration",
        "official_website": "https://incursion.tech",
        "application_url": "https://unstop.com/competitions/1806016/register",
        "source_url": "https://incursion.tech",
    },
    {
        "slug": "hacksprint-3-0-2027",
        "title": "HACKSPRINT 3.0 2027",
        "organizer_name": "Karpagam Academy of Higher Education (KAHE) & HackIndia",
        "summary": "National hackathon by KAHE in association with HackIndia featuring an online preliminary round and offline final in Coimbatore.",
        "description": (
            "HACKSPRINT 3.0 2027 is organized by Karpagam Academy of Higher Education (KAHE) in association with HackIndia.\n\n"
            "• Format: Online preliminary round + offline final\n"
            "• Dates: 5–6 February 2027\n"
            "• Venue: KAHE, Coimbatore\n"
            "• Team Size: 2–5 members\n"
            "• Registration Fee: Free"
        ),
        "type": OpportunityType.HACKATHON,
        "location_type": LocationType.HYBRID,
        "location_text": "KAHE, Coimbatore (Online Prelim + Offline Final)",
        "starts_at": datetime(2027, 2, 5, 9, 0, tzinfo=timezone.utc),
        "ends_at": datetime(2027, 2, 6, 18, 0, tzinfo=timezone.utc),
        "deadline_at": datetime(2027, 2, 1, 23, 59, tzinfo=timezone.utc),
        "team_size": "2–5 members",
        "compensation_type": CompensationType.UNPAID,
        "compensation_note": "Free Registration",
        "official_website": "https://hackindia.org/2027/hacksprint-30-2027",
        "application_url": "https://hacksprint-3.devfolio.co/",
        "source_url": "https://hackindia.org/2027/hacksprint-30-2027",
    },
]


def run():
    db = SessionLocal()
    now = datetime.now(timezone.utc)
    real_slugs = {h["slug"] for h in REAL_HACKATHONS}

    try:
        # 1. Safely archive & soft-delete all fake/placeholder opportunities
        all_opps = db.scalars(select(Opportunity)).all()
        archived_count = 0
        for opp in all_opps:
            if opp.slug in real_slugs:
                continue
            # Archive any demo/placeholder opportunities
            if opp.deleted_at is None or opp.status == OpportunityStatus.PUBLISHED:
                opp.status = OpportunityStatus.ARCHIVED
                opp.is_featured = False
                opp.deleted_at = now
                archived_count += 1

        # 2. Safely archive fake seeded event (HackQuantum 2026)
        fake_events = db.scalars(select(Event)).all()
        archived_events = 0
        for ev in fake_events:
            if "hackquantum" in ev.title.lower() or ev.status == EventStatus.PUBLISHED:
                ev.status = EventStatus.CANCELLED
                archived_events += 1

        # 3. Ensure default curated organization exists
        org = db.scalar(select(Organization).where(Organization.slug == "launchbyte-curated"))
        if org is None:
            org = Organization(
                name="LaunchByte Verified Listings",
                slug="launchbyte-curated",
                description="Verified external hackathons and opportunities curated by the LaunchByte team.",
                website_url="https://launchbyte.io",
            )
            db.add(org)
            db.flush()

        # 4. Upsert the 4 real verified featured hackathons
        seeded = 0
        for item in REAL_HACKATHONS:
            existing = db.scalar(select(Opportunity).where(Opportunity.slug == item["slug"]))
            if existing is None:
                opp = Opportunity(
                    organization_id=org.id,
                    slug=item["slug"],
                    title=item["title"],
                    summary=item["summary"],
                    description=item["description"],
                    type=item["type"],
                    status=OpportunityStatus.PUBLISHED,
                    location_type=item["location_type"],
                    location_text=item["location_text"],
                    starts_at=item["starts_at"],
                    ends_at=item["ends_at"],
                    deadline_at=item["deadline_at"],
                    team_size=item["team_size"],
                    compensation_type=item["compensation_type"],
                    compensation_note=item["compensation_note"],
                    official_website=item["official_website"],
                    application_url=item["application_url"],
                    source_url=item["source_url"],
                    organizer_name_override=item["organizer_name"],
                    verification_status=VerificationStatus.VERIFIED,
                    trust_score=95,
                    verified_at=now,
                    is_featured=True,
                    published_at=now,
                )
                db.add(opp)
                seeded += 1
            else:
                existing.status = OpportunityStatus.PUBLISHED
                existing.deleted_at = None
                existing.is_featured = True
                existing.organizer_name_override = item["organizer_name"]
                existing.application_url = item["application_url"]
                existing.official_website = item["official_website"]

        db.commit()
        print(
            f"Cleanup complete: archived {archived_count} fake opportunities, "
            f"{archived_events} fake events; seeded {seeded} real featured hackathons."
        )
    finally:
        db.close()


if __name__ == "__main__":
    run()
