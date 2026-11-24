#!/usr/bin/env python3
"""
Cleanup Script for Sample & Demo Seed Data.

By default, runs in DRY-RUN mode and lists all detected sample records.
Pass --apply to permanently delete the detected sample records.

Usage:
    python scripts/cleanup_sample_data.py          # Dry-run inspection
    python scripts/cleanup_sample_data.py --apply  # Execute deletion
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Add backend to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sqlalchemy import delete, or_, select
from app.db.session import SessionLocal
from app.models import (
    Application,
    ApplicationEvent,
    AuditLog,
    Event,
    EventRegistration,
    EventStaff,
    Opportunity,
    OpportunityReport,
    Organization,
    OrganizationMember,
    SavedOpportunity,
    VerificationCheck,
    VerificationRequest,
)

SAMPLE_OPP_SLUGS = [
    "acme-ml-intern-summer",
    "state-uni-hackathon-2026",
    "bytehacks-global-2026",
    "ai-agents-autonomous-hack",
    "web3-zero-knowledge-hack",
    "clean-energy-climate-hack",
    "fullstack-swe-intern",
    "product-design-intern",
    "distributed-systems-workshop",
    "cloud-native-k8s-workshop",
    "production-llm-workshop",
    "emerging-founders-fellowship",
    "climate-fellowship-2026",
    "student-ai-residency",
    "bright-futures-scholarship",
    "quickhire-earn-5k-weekly",
    "acme-data-fellowship",
    "state-uni-design-workshop",
    "acme-2025-winter-intern",
    "sample-emerging-fellowship",
]

SAMPLE_EVENT_SLUGS = [
    "hackquantum-2026",
    "sample-hackquantum-2026",
    "sample-devops-summit-2026",
]

SAMPLE_ORG_SLUGS = [
    "shady-corp",
    "bright-futures",
]


def cleanup(apply_changes: bool = False) -> None:
    try:
        db = SessionLocal()
        # Test connection
        db.execute(select(1))
    except Exception as exc:
        print(f"Could not connect to database: {exc}")
        print("Please ensure your PostgreSQL database is running (e.g., via docker-compose or local service).")
        return
    try:
        # Detect Opportunities
        opp_stmt = select(Opportunity).where(
            or_(
                Opportunity.slug.in_(SAMPLE_OPP_SLUGS),
                Opportunity.title.like("Sample %"),
                Opportunity.slug.like("sample-%"),
            )
        )
        sample_opps = db.scalars(opp_stmt).all()

        # Detect Events
        evt_stmt = select(Event).where(
            or_(
                Event.slug.in_(SAMPLE_EVENT_SLUGS),
                Event.title.like("Sample %"),
                Event.slug.like("sample-%"),
            )
        )
        sample_events = db.scalars(evt_stmt).all()

        # Detect fake test orgs
        org_stmt = select(Organization).where(Organization.slug.in_(SAMPLE_ORG_SLUGS))
        sample_orgs = db.scalars(org_stmt).all()

        print("=" * 60)
        print(f"SAMPLE DATA SCAN: {'APPLY MODE' if apply_changes else 'DRY-RUN MODE'}")
        print("=" * 60)
        print(f"Detected Sample Opportunities: {len(sample_opps)}")
        for o in sample_opps:
            print(f"  - [{o.type}] {o.title} (slug: {o.slug})")

        print(f"\nDetected Sample Events: {len(sample_events)}")
        for e in sample_events:
            print(f"  - [{e.mode}] {e.title} (slug: {e.slug})")

        print(f"\nDetected Sample Organizations: {len(sample_orgs)}")
        for org in sample_orgs:
            print(f"  - {org.name} (slug: {org.slug})")

        if not apply_changes:
            print("\n" + "=" * 60)
            print("DRY-RUN complete. Zero records were modified or deleted.")
            print("To delete detected sample records, run with: python scripts/cleanup_sample_data.py --apply")
            print("=" * 60)
            return

        print("\nApplying deletion safely with dependency cleanup...")
        opp_ids = [o.id for o in sample_opps]
        evt_ids = [e.id for e in sample_events]
        org_ids = [org.id for org in sample_orgs]

        # 1. Clean Applications and Application Events
        if opp_ids:
            app_ids = db.scalars(select(Application.id).where(Application.opportunity_id.in_(opp_ids))).all()
            if app_ids:
                db.execute(delete(ApplicationEvent).where(ApplicationEvent.application_id.in_(app_ids)))
                db.execute(delete(Application).where(Application.id.in_(app_ids)))

            # Clean Saved Opportunities, Reports, Verification Checks
            db.execute(delete(SavedOpportunity).where(SavedOpportunity.opportunity_id.in_(opp_ids)))
            db.execute(delete(OpportunityReport).where(OpportunityReport.opportunity_id.in_(opp_ids)))

            vr_ids = db.scalars(select(VerificationRequest.id).where(VerificationRequest.opportunity_id.in_(opp_ids))).all()
            if vr_ids:
                db.execute(delete(VerificationCheck).where(VerificationCheck.request_id.in_(vr_ids)))
                db.execute(delete(VerificationRequest).where(VerificationRequest.id.in_(vr_ids)))

            db.execute(delete(Opportunity).where(Opportunity.id.in_(opp_ids)))

        # 2. Clean Event Staff and Registrations
        if evt_ids:
            db.execute(delete(EventRegistration).where(EventRegistration.event_id.in_(evt_ids)))
            db.execute(delete(EventStaff).where(EventStaff.event_id.in_(evt_ids)))
            db.execute(delete(Event).where(Event.id.in_(evt_ids)))

        # 3. Clean Sample Orgs
        if org_ids:
            db.execute(delete(OrganizationMember).where(OrganizationMember.organization_id.in_(org_ids)))
            vr_org_ids = db.scalars(select(VerificationRequest.id).where(VerificationRequest.organization_id.in_(org_ids))).all()
            if vr_org_ids:
                db.execute(delete(VerificationCheck).where(VerificationCheck.request_id.in_(vr_org_ids)))
                db.execute(delete(VerificationRequest).where(VerificationRequest.id.in_(vr_org_ids)))
            db.execute(delete(Organization).where(Organization.id.in_(org_ids)))

        db.commit()
        print("Cleanup completed successfully.")

    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Cleanup sample and demo data.")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Execute deletion of sample records (defaults to dry-run).",
    )
    args = parser.parse_args()
    cleanup(apply_changes=args.apply)


if __name__ == "__main__":
    main()
