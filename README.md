# LaunchByte

A student-first opportunity discovery and action platform.

> **Core philosophy:** Discover → Verify → Personalize → Track → Act

LaunchByte aims to transform opportunity discovery from passive browsing into
an active, personalized opportunity-delivery experience for students —
surfacing hackathons, internships, events, and courses that are verified,
relevant, and actionable.

> **Note:** This document describes the intended product direction. Anything
> not explicitly marked **Implemented** below is either planned or in
> progress — see [Status legend](#status-legend).

---

## Table of Contents

- [What is LaunchByte?](#what-is-launchbyte)
- [Problem](#problem)
- [Vision](#vision)
- [Core Features](#core-features)
- [Product Direction](#product-direction)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Team Ownership](#team-ownership)
- [Development Workflow](#development-workflow)
- [Local Setup](#local-setup)
- [Contribution](#contribution)
- [Roadmap](#roadmap)
- [Status Legend](#status-legend)

---

## What is LaunchByte?

LaunchByte is a platform that helps students find, evaluate, and act on
opportunities — hackathons, internships, events, and courses — without
wading through scattered, unverified, or stale listings.

## Problem

Students today rely on scattered sources (WhatsApp forwards, random
Instagram pages, outdated listing sites) to discover opportunities. Much of
this information is duplicated, unverified, or expired by the time it
reaches a student. There is no single trustworthy, personalized place to
discover *and* act on opportunities.

## Vision

A single platform where every opportunity a student sees is verified,
relevant to them, and easy to act on — turning discovery into a guided
pipeline rather than a scavenger hunt.

## Core Features

*(Status of each feature is tracked in [`PROJECT_STATUS.md`](./PROJECT_STATUS.md))*

- Opportunity discovery feed (hackathons, internships, events, courses)
- Source verification and freshness checks
- Personalized recommendations
- Application tracking
- AI Copilot for guidance and application support
- Team finder for collaborative opportunities
- Notifications for deadlines and new matches

## Product Direction

Refer to the separately maintained product blueprint document for full
positioning, target users, and detailed feature specs. This repository
implements that direction incrementally, starting from a clean architectural
foundation rather than a feature-complete product.

## Tech Stack

| Layer     | Technology                                  |
|-----------|----------------------------------------------|
| Frontend  | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend   | FastAPI (Python), PostgreSQL/Supabase        |
| AI        | Modular Python services (recommendation, copilot, verification) |
| Data      | Python pipelines for ingestion & normalization |

## Repository Structure

```text
launchbyte/
├── frontend/    # Next.js/React application
├── backend/     # FastAPI application & APIs
├── ai/          # Recommendation, verification intelligence, copilot
├── data/        # Ingestion pipelines, scrapers, verification rules
├── docs/        # Product, architecture, API, and contribution docs
└── .github/     # Issue/PR templates, CI workflows
```

See each top-level folder's own `README.md` for details.

## Team Ownership

LaunchByte is built by a 4-person core team plus a founder/product lead.
Ownership is by **module**, not by person:

| Module      | Owner                     |
|-------------|----------------------------|
| `frontend/` | Frontend Developer          |
| `backend/`  | Backend Developer            |
| `ai/`       | AI Developer                 |
| `data/`     | Data / Verification Developer|
| Cross-cutting (architecture, integration, review, roadmap) | Founder / Product Lead |

See [`docs/contribution/workflow.md`](./docs/contribution/workflow.md) for
details on how modules interact.

## Development Workflow

- Never commit directly to `main`.
- Branch per feature: `feature/<module>-<short-description>`.
- Open a PR using the provided template; at least one review required.
- See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for full guidelines.

## Local Setup

See [Commands](#commands-quick-reference) below, and each module's README
for module-specific setup.

### Commands (quick reference)

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Backend tests
cd backend
pytest
```

## Contribution

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Roadmap

See [`docs/product/roadmap.md`](./docs/product/roadmap.md) and
[`PROJECT_STATUS.md`](./PROJECT_STATUS.md) for current phase and priorities.

## Status Legend

| Label | Meaning |
|-------|---------|
| **Implemented** | Working in the current codebase |
| **In Development** | Actively being built |
| **Planned** | Designed but not yet started |
