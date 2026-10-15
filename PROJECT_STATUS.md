# LaunchByte — Project Status

## Implemented

- FastAPI app boots (`app/main.py`)
- `GET /` and `GET /health` routes
- Env-driven config (`app/core/config.py`, `pydantic-settings`)
- Structured logging setup (`app/core/logging.py`)
- DB engine/session scaffolding (`app/db/session.py`, `app/db/base.py`)
- **Users domain, end to end:**
  - `User` model (`app/models/users.py`) + Alembic migration
    (`alembic/versions/1ed4211f50f2_create_users_table.py`)
  - Password hashing via `bcrypt` and JWT access tokens via `python-jose`
    (`app/core/security.py`)
  - `POST /users` — register (409 on duplicate email)
  - `POST /auth/login` — OAuth2 password flow, returns a bearer token
  - `GET /users/me` — protected route, backed by
    `app/dependencies/auth.py::get_current_user` (`CurrentUser` dependency
    for reuse in future routers)
  - Tests cover register, duplicate email, login success/failure, and
    accessing `/users/me` with/without/invalid token, run against an
    in-memory SQLite DB (`tests/conftest.py`) — no Postgres needed to test
- **Full database layer** (`app/models/`, migration `0002_core_domain_schema`,
  see `backend/docs/database.md`):
  - 14 tables: `users` (+ role, email-verified flag, last login), `user_profiles`,
    `organizations`, `opportunities`, `tags`/`opportunity_tags`,
    `saved_opportunities`, `applications` (+ `application_events` timeline),
    `verification_requests`, `verification_checks`, `opportunity_reports`,
    `notifications`, `audit_logs`
  - Integrity enforced in the database: enum CHECKs, uniqueness, ranges,
    RESTRICT / CASCADE / SET NULL rules (all verified on real PostgreSQL 16)
  - Idempotent dev seed data: `python -m app.db.seed`
  - `backend/docs/supabase_rls.sql` — locks Supabase's public REST API
- Hardening: emails normalized to lowercase, duplicate-registration race returns
  409, 8+ char password rule, app refuses to start outside `local` with the
  default `SECRET_KEY`
- Tests: 56 passing (`pytest`) — auth, model constraints/cascades, seed data,
  config guard, and a migrations-vs-models drift check. No Postgres needed.

## Planned (not started)

The **database is ready for all of these** — what's missing is the API layer
(schemas → service → router, with tests).

- **Opportunity API** — read-only browse/detail first (filter by type, status,
  deadline, verification; must filter `deleted_at IS NULL` and
  `status = 'published'`), then organizer create/edit.
  `services/opportunities/service.py` is still a `TODO` stub.
- **Application tracker API** — CRUD scoped to `CurrentUser` (ownership check on
  every query), status changes that also write an `application_events` row.
  `services/applications/service.py` is a stub.
- **Verification surfacing API** — expose `verification_status` / `trust_score`
  on opportunities, request verification, report a posting, staff review
  endpoints writing `audit_logs`. `services/verification/service.py` is a stub.
- **Notifications** — list / mark-read endpoints; a scheduled job to create
  deadline reminders from `applications.reminder_at`.

## Before real users (beyond a closed test group)

- Rate limiting on `POST /auth/login` and `POST /users`
- Email verification + password reset (schema flag `is_email_verified` exists; no flow yet)
- Set `DEBUG=false` and real `CORS_ORIGINS` in any deployed environment
- Run `docs/supabase_rls.sql` on the Supabase project
- CI running `pytest` and `alembic check`; a Dockerfile / deploy config

## Suggested build order

1. ~~`users` model + Alembic migration + auth~~ — done
2. ~~Database schema for all domains~~ — done
3. Opportunities read-only API (+ seed data makes it testable immediately)
4. Applications API (uses `CurrentUser`)
5. Verification + reports API
6. Notifications

Each domain lands as: schema → service → router, with tests alongside the
router (see `tests/test_users.py` for the pattern).
