# System Architecture

## High-Level Overview

```text
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Frontend    │ ───▶ │  Backend    │ ───▶ │  Database   │
│  (Next.js)   │ ◀─── │  (FastAPI)  │ ◀─── │ (Postgres)  │
└─────────────┘      └─────┬───────┘      └─────────────┘
                             │
                             ▼
                      ┌─────────────┐
                      │     AI       │
                      │ (recommend., │
                      │ verify,      │
                      │ copilot)     │
                      └─────┬───────┘
                             ▲
                             │
                      ┌─────────────┐
                      │    Data      │
                      │ (ingestion,  │
                      │ pipelines)   │
                      └─────────────┘
```

## Module Responsibilities

- **Frontend** — presentation and user interaction only. Talks to the
  backend via `services/`; never talks to the database or AI layer
  directly.
- **Backend** — the single source of truth for API contracts, auth, and
  business logic orchestration. Talks to the database directly and to the
  AI layer through a defined service interface.
- **AI** — recommendation, verification intelligence, and the copilot.
  Consumed by the backend, not by the frontend directly.
- **Data** — ingestion and normalization of opportunity data, landing in
  the database that the backend reads from. Verification rules here feed
  the "verification status" field surfaced by the backend.

## Why This Shape

This separation lets each of the four developers work independently:

- Frontend and backend only need to agree on the API contract (see
  `docs/api/`).
- AI and backend only need to agree on a service interface, so AI logic can
  evolve (including swapping models/approaches) without frontend or backend
  changes.
- Data feeds the database, which both backend and AI read from — data
  quality issues surface in one place, not scattered across the stack.

## Data Flow (target)

1. `data/scrapers/` ingest raw opportunities → `data/opportunity-data/raw/`
2. `data/pipelines/` normalize → `data/opportunity-data/normalized/`
3. `data/verification/` + `ai/verification/` assign a verification status
4. Verified, normalized opportunities land in the database
5. `backend/services/opportunities/` serves them, optionally reordered by
   `ai/recommendation/`
6. `frontend/features/opportunities/` renders them

See the module-specific docs for more detail:
[`frontend.md`](./frontend.md), [`backend.md`](./backend.md),
[`ai.md`](./ai.md).
