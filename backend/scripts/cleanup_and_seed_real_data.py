"""
Safe data cleanup & real featured hackathon seeding script.

1. Non-destructively archives/soft-deletes all previous out-of-NCR and placeholder hackathons
   (including Chennai/Tamil Nadu and Pune listings: DeFy'27, HACKSPRINT 3.0, Rack It Up, Incursion)
   so they no longer appear on active public feeds, searches, or featured lists.
2. Seeds the 4 researched, verified Delhi NCR hackathons:
   - HackSmart 2.0 (Battery Smart × Geek Room, Gurugram, Haryana)
   - AI Vibeathon 1.0 (Echo Engineers, Delhi, India)
   - TCU Hack Day (Technical Community Universe, Delhi NCR)
   - SustainX — The Sustainability Hackathon, Track 2 (Great Lakes Institute of Management, Gurgaon, Haryana)
"""
import os
import sys
from datetime import datetime, timezone
from decimal import Decimal

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
from app.models.opportunities import Opportunity, Tag
from app.models.organizations import Organization
from app.services.opportunities.service import slugify


def get_or_create_tag(db, tag_cache: dict[str, Tag], name: str) -> Tag | None:
    name = name.strip()
    slug = slugify(name)[:64].strip("-")
    if not slug:
        return None
    if slug in tag_cache:
        return tag_cache[slug]
    existing = db.scalar(select(Tag).where(Tag.slug == slug))
    if existing:
        tag_cache[slug] = existing
        return existing
    new_tag = Tag(name=name[:64], slug=slug)
    db.add(new_tag)
    db.flush()
    tag_cache[slug] = new_tag
    return new_tag

REAL_HACKATHONS = [
    {
        "slug": "hacksmart-2-0",
        "title": "HackSmart 2.0",
        "organizer_name": "Battery Smart × Geek Room",
        "summary": "An industry-focused hackathon centered around electric mobility, battery swapping, automation, operational efficiency and practical technology solutions.",
        "description": (
            "HackSmart 2.0 is an industry-focused hackathon organized by Battery Smart × Geek Room.\n\n"
            "Centered around electric mobility, battery swapping, automation, operational efficiency and practical technology solutions.\n\n"
            "• Location: Gurugram, Haryana, India\n"
            "• Mode: Offline\n"
            "• Category: Electric Mobility / Software / Innovation\n"
            "• Team Size: 1–4 members\n"
            "• Registration Deadline: 15 December 2026\n"
            "• Hackathon Dates: 6–7 February 2027"
        ),
        "type": OpportunityType.HACKATHON,
        "location_type": LocationType.ONSITE,
        "location_text": "Gurugram, Haryana, India",
        "starts_at": datetime(2027, 2, 6, 9, 0, tzinfo=timezone.utc),
        "ends_at": datetime(2027, 2, 7, 18, 0, tzinfo=timezone.utc),
        "deadline_at": datetime(2026, 12, 15, 23, 59, tzinfo=timezone.utc),
        "team_size": "1–4 members",
        "compensation_type": CompensationType.UNPAID,
        "compensation_note": "Free Registration",
        "official_website": "https://unstop.com/hackathons/hacksmart-20-geek-room-1799091",
        "application_url": "https://unstop.com/hackathons/hacksmart-20-geek-room-1799091",
        "source_url": "https://unstop.com/hackathons/hacksmart-20-geek-room-1799091",
        "tags": ["Electric Mobility", "Software", "Innovation", "Delhi NCR"],
    },
    {
        "slug": "ai-vibeathon-1-0",
        "title": "AI Vibeathon 1.0",
        "organizer_name": "Echo Engineers",
        "summary": "An open innovation AI hackathon where students and developers can build AI-powered solutions across different domains with an online preliminary round and an offline finale in Delhi.",
        "description": (
            "AI Vibeathon 1.0 is an open innovation AI hackathon hosted by Echo Engineers where students and developers can build AI-powered solutions across different domains.\n\n"
            "Participants first compete in an online preliminary round, with shortlisted teams invited to an offline finale in Delhi.\n\n"
            "• Location: Delhi, India\n"
            "• Mode: Online Preliminary + Offline Finale\n"
            "• Category: Artificial Intelligence / Open Innovation\n"
            "• Team Size: 1–4 members\n"
            "• Online Round: 17 December 2026\n"
            "• Offline Finale: 19 December 2026\n"
            "• Registration Deadline: 17 December 2026"
        ),
        "type": OpportunityType.HACKATHON,
        "location_type": LocationType.HYBRID,
        "location_text": "Delhi, India",
        "starts_at": datetime(2026, 12, 17, 9, 0, tzinfo=timezone.utc),
        "ends_at": datetime(2026, 12, 19, 18, 0, tzinfo=timezone.utc),
        "deadline_at": datetime(2026, 12, 17, 23, 59, tzinfo=timezone.utc),
        "team_size": "1–4 members",
        "compensation_type": CompensationType.UNPAID,
        "compensation_note": "Free Registration",
        "official_website": "https://unstop.com/hackathons/ai-vibeathon-2026-promptwars-echo-engineers-echo-engineers-1799092",
        "application_url": "https://unstop.com/hackathons/ai-vibeathon-2026-promptwars-echo-engineers-echo-engineers-1799092",
        "source_url": "https://unstop.com/hackathons/ai-vibeathon-2026-promptwars-echo-engineers-echo-engineers-1799092",
        "tags": ["Artificial Intelligence", "Open Innovation", "AI", "Delhi NCR"],
    },
    {
        "slug": "tcu-hack-day",
        "title": "TCU Hack Day",
        "organizer_name": "Technical Community Universe",
        "summary": "An intensive build sprint where student developers, designers and founders collaborate to turn ideas into working products. Includes online qualification and an offline final hackathon.",
        "description": (
            "TCU Hack Day is an intensive build sprint organized by Technical Community Universe where student developers, designers and founders collaborate to turn ideas into working products.\n\n"
            "Includes online qualification and an offline final hackathon in Delhi NCR.\n\n"
            "• Location: Delhi NCR, India\n"
            "• Mode: Online qualifying round + Offline finale\n"
            "• Category: Hackathon / Product Building / Innovation\n"
            "• Team Size: 2–4 members\n"
            "• Online Round: 10 January 2027\n"
            "• Offline Grand Finale: 23 January 2027\n"
            "• Registration Deadline: 31 December 2026"
        ),
        "type": OpportunityType.HACKATHON,
        "location_type": LocationType.HYBRID,
        "location_text": "Delhi NCR, India",
        "starts_at": datetime(2027, 1, 10, 9, 0, tzinfo=timezone.utc),
        "ends_at": datetime(2027, 1, 23, 18, 0, tzinfo=timezone.utc),
        "deadline_at": datetime(2026, 12, 31, 23, 59, tzinfo=timezone.utc),
        "team_size": "2–4 members",
        "compensation_type": CompensationType.UNPAID,
        "compensation_note": "Free Registration",
        "official_website": "https://unstop.com/hackathons/tcu-hack-day-technical-community-universe-1763620",
        "application_url": "https://unstop.com/hackathons/tcu-hack-day-technical-community-universe-1763620",
        "source_url": "https://unstop.com/hackathons/tcu-hack-day-technical-community-universe-1763620",
        "tags": ["Product Building", "Innovation", "Hackathon", "Delhi NCR"],
    },
    {
        "slug": "sustainx-the-sustainability-hackathon-track-2",
        "title": "SustainX — The Sustainability Hackathon, Track 2",
        "organizer_name": "Great Lakes Institute of Management, Gurgaon",
        "summary": "Build an AI-powered Smog Response System for Delhi NCR to forecast air pollution, identify contributing sources, and recommend practical actions to civic authorities.",
        "description": (
            "SustainX — The Sustainability Hackathon, Track 2 is organized by Great Lakes Institute of Management, Gurgaon.\n\n"
            "Challenge: Build an AI-powered Smog Response System for Delhi NCR. Participants must design a solution capable of forecasting local air pollution, identifying contributing sources, and recommending practical actions to civic authorities.\n\n"
            "• Location: Gurgaon, Haryana, India\n"
            "• Mode: Hackathon submission + on-campus final presentation\n"
            "• Category: AI / Sustainability / Climate Tech / Social Impact\n"
            "• Team Size: 2–4 members\n"
            "• Submission Deadline: 30 November 2026, 11:59 PM IST\n"
            "• Final Presentation: 8 December 2026\n\n"
            "Prizes:\n"
            "• Winner: ₹25,000\n"
            "• 1st Runner-up: ₹15,000\n"
            "• 2nd Runner-up: ₹10,000"
        ),
        "type": OpportunityType.HACKATHON,
        "location_type": LocationType.HYBRID,
        "location_text": "Gurgaon, Haryana, India",
        "starts_at": datetime(2026, 11, 20, 9, 0, tzinfo=timezone.utc),
        "ends_at": datetime(2026, 12, 8, 18, 0, tzinfo=timezone.utc),
        "deadline_at": datetime(2026, 11, 30, 18, 29, tzinfo=timezone.utc),
        "team_size": "2–4 members",
        "compensation_type": CompensationType.PRIZE,
        "compensation_min": Decimal("10000"),
        "compensation_max": Decimal("25000"),
        "compensation_currency": "INR",
        "compensation_note": "Winner ₹25k | 1st Runner-up ₹15k | 2nd Runner-up ₹10k",
        "benefits": "Total Prize Pool: ₹50,000\nWinner: ₹25,000\n1st Runner-up: ₹15,000\n2nd Runner-up: ₹10,000",
        "official_website": "https://unstop.com/competitions/sustainx-the-sustainability-hackathon-track-2-great-lakes-institute-of-management-glim-gurgaon-1820702/amp",
        "application_url": "https://unstop.com/competitions/sustainx-the-sustainability-hackathon-track-2-great-lakes-institute-of-management-glim-gurgaon-1820702/amp",
        "source_url": "https://unstop.com/competitions/sustainx-the-sustainability-hackathon-track-2-great-lakes-institute-of-management-glim-gurgaon-1820702/amp",
        "tags": ["AI", "Sustainability", "Climate Tech", "Social Impact", "Delhi NCR"],
    },
]

OLD_OUT_OF_NCR_HACKATHON_SLUGS = (
    "defy-27-vit-chennai",
    "hacksprint-3-0-2027",
    "rack-it-up-2026",
    "incursion-2027-dypit",
)


def run():
    db = SessionLocal()
    now = datetime.now(timezone.utc)
    real_slugs = {h["slug"] for h in REAL_HACKATHONS}

    try:
        # 1. Safely archive & soft-delete all old out-of-NCR hackathons and placeholder hackathons
        all_opps = db.scalars(select(Opportunity)).all()
        archived_count = 0
        for opp in all_opps:
            if opp.slug in real_slugs:
                continue
            if opp.slug in OLD_OUT_OF_NCR_HACKATHON_SLUGS or opp.type == OpportunityType.HACKATHON:
                # Archive the hackathon so it never shows in active listings
                opp.status = OpportunityStatus.ARCHIVED
                opp.is_featured = False
                opp.deleted_at = now
                archived_count += 1

        # 2. Ensure default curated organization exists
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

        # 3. Upsert the 4 real verified Delhi NCR featured hackathons
        seeded = 0
        tag_cache: dict[str, Tag] = {}
        for item in REAL_HACKATHONS:
            existing = db.scalar(select(Opportunity).where(Opportunity.slug == item["slug"]))
            opp_tags = [t for t in (get_or_create_tag(db, tag_cache, tag_name) for tag_name in item.get("tags", [])) if t is not None]
            
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
                    compensation_min=item.get("compensation_min"),
                    compensation_max=item.get("compensation_max"),
                    compensation_currency=item.get("compensation_currency"),
                    compensation_note=item.get("compensation_note"),
                    benefits=item.get("benefits"),
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
                opp.tags = opp_tags
                db.add(opp)
                seeded += 1
            else:
                existing.title = item["title"]
                existing.summary = item["summary"]
                existing.description = item["description"]
                existing.type = item["type"]
                existing.status = OpportunityStatus.PUBLISHED
                existing.deleted_at = None
                existing.is_featured = True
                existing.location_type = item["location_type"]
                existing.location_text = item["location_text"]
                existing.starts_at = item["starts_at"]
                existing.ends_at = item["ends_at"]
                existing.deadline_at = item["deadline_at"]
                existing.team_size = item["team_size"]
                existing.compensation_type = item["compensation_type"]
                existing.compensation_min = item.get("compensation_min")
                existing.compensation_max = item.get("compensation_max")
                existing.compensation_currency = item.get("compensation_currency")
                existing.compensation_note = item.get("compensation_note")
                existing.benefits = item.get("benefits")
                existing.organizer_name_override = item["organizer_name"]
                existing.application_url = item["application_url"]
                existing.official_website = item["official_website"]
                existing.source_url = item["source_url"]
                existing.verification_status = VerificationStatus.VERIFIED
                existing.trust_score = 95
                existing.tags = opp_tags

        db.commit()
        print(
            f"Cleanup complete: archived {archived_count} old/non-NCR hackathons; "
            f"seeded/updated {seeded} verified Delhi NCR hackathons."
        )
    finally:
        db.close()


if __name__ == "__main__":
    run()
