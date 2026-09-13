# Features

Status is tracked precisely in [`PROJECT_STATUS.md`](../../PROJECT_STATUS.md)
at the repo root — this doc describes what each feature *is*, not its
current build status.

## Opportunity Discovery

A feed/search experience for hackathons, internships, events, and courses.
Backed by `backend/services/opportunities/` and the data pipeline in
`data/`.

## Verification

Every opportunity carries a verification status, computed from rule-based
checks (`data/verification/`) and AI-assisted signals
(`ai/verification/`) — source credibility, duplicate detection, and
freshness.

## Personalization / Recommendation

Opportunities are ranked and matched to a student's profile using
`ai/recommendation/` (matching, ranking, personalization).

## Application Tracker

Lets a student record and track the status of opportunities they're
pursuing — implemented via `backend/services/applications/` and the
`applications` frontend feature.

## AI Copilot

A conversational assistant (`ai/copilot/`) that helps a student understand
an opportunity and get support drafting application materials.

## Team Finder

Helps students find teammates for collaborative opportunities (e.g.
hackathons) — the `team-finder` frontend feature.

## Notifications

Alerts for upcoming deadlines and new matching opportunities — the
`notifications` frontend feature.

---

For the authoritative, detailed spec of each feature, refer to the
separately maintained product blueprint document.
