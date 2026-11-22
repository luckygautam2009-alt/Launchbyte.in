# Backend Architecture

## Stack

FastAPI, Python, PostgreSQL/Supabase, REST APIs.

## Layering

```text
api/routes/         → parse request, call a service, return a schema
api/dependencies/    → shared FastAPI Depends() providers (db session, auth)
services/<domain>/    → business logic, one folder per domain
models/                → SQLAlchemy ORM models (DB shape)
schemas/                → Pydantic request/response models (API shape)
core/config/              → environment-driven settings
core/security/              → auth primitives (hashing, JWT)
core/database/                → engine/session setup
```

Routes stay thin. All non-trivial logic belongs in `services/`, so it can
be tested independently of the HTTP layer and reused (e.g. by a background
job) if needed.

## Why Models and Schemas Are Separate

`models/` describes what's stored in Postgres. `schemas/` describes what
the API accepts/returns. They will often look similar, especially early on,
but keeping them separate avoids accidentally leaking internal fields (like
raw verification scoring) into API responses, and avoids coupling the API
contract to database migrations.

## AI Integration

The backend is the only module that talks to `ai/` directly. Routes that
need AI-driven behavior (e.g. recommendation ordering) call a service in
`backend/services/`, which in turn calls into the AI layer through a
defined interface — not by importing AI internals ad hoc into a route.

## Data Integration

The backend reads opportunities from the database, which is populated by
`data/pipelines/`. The backend does not run scrapers or ingestion — it only
serves already-normalized, already-verified data (plus surfacing
verification status).

## Auth (planned)

JWT-based, with primitives in `core/security/` and business logic (signup,
login, refresh) in `services/auth/`. Not implemented yet.

## Testing

Tests live in `backend/tests/`, run with `pytest`. Aim to test services
directly (not just through the HTTP layer) so business logic coverage
doesn't depend on route wiring.
