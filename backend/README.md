# LaunchByte Backend

FastAPI application providing the LaunchByte API.

**Owner:** Backend Developer

## Stack

- FastAPI
- Python 3.11+
- PostgreSQL / Supabase (via SQLAlchemy)

## Structure

```
backend/
├── app/
│   ├── routers/       # Route modules, registered on main.py
│   ├── dependencies/  # Shared FastAPI dependencies
│   ├── models/        # SQLAlchemy ORM models (14 tables, see docs/database.md)
│   ├── schemas/       # Pydantic request/response schemas
│   ├── core/
│   │   ├── config.py    # Settings (env driven)
│   │   ├── security.py  # Password hashing + JWT access tokens
│   │   └── logging.py   # Structured logging setup
│   ├── db/             # Engine/session, declarative base, dev seed data
│   ├── services/
│   │   ├── users/
│   │   ├── opportunities/
│   │   ├── applications/
│   │   └── verification/
│   └── main.py         # App entry point
├── alembic/             # DB migrations
├── docs/                # database.md (ER diagram, rules), supabase_rls.sql
└── tests/
```

## Local Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env           # then fill in real values
alembic upgrade head           # creates the users table
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000, with interactive docs at
http://localhost:8000/docs.

## Running Tests

```bash
cd backend
pytest
```

## Status

**Implemented:** app boots, `/health` and `/` routes, config loading, users +
authentication (`POST /users`, `POST /auth/login`, `GET /users/me`), and the
**complete database layer** — 14 tables, migrations, seed data, tests.

**Planned:** opportunity API, application tracker API, verification/report API,
notifications. The tables for all of them already exist. See `PROJECT_STATUS.md`
at the repo root.

## Conventions

- Routes stay thin — parse input, call a service, return a schema.
- Business logic lives in `services/<domain>.py` — not in routes or models.
- New env vars go in `.env.example` with a placeholder value.
- Database rules, ER diagram and migration workflow: `docs/database.md`.
