# LaunchByte Backend

FastAPI application providing the LaunchByte API.

**Owner:** Backend Developer

## Stack

- FastAPI
- Python 3.11+
- PostgreSQL / Supabase (via SQLAlchemy 2.0)
- Alembic
- Pillow (image processing and sanitization)

## Structure

```
backend/
├── app/
│   ├── routers/       # auth, users, opportunities, admin_opportunities, me, notifications, uploads, team
│   ├── dependencies/  # auth (CurrentUser, OrganizerUser, StaffUser), db, rate_limit
│   ├── models/        # SQLAlchemy ORM models (17 tables, see docs/database.md)
│   ├── schemas/       # Pydantic request/response schemas
│   ├── core/
│   │   ├── config.py      # Settings (env driven with DEBUG guard)
│   │   ├── security.py    # Password hashing + JWT claims (role, token_version)
│   │   ├── rate_limit.py  # In-memory sliding window rate limiter
│   │   └── logging.py     # Structured logging setup
│   ├── db/             # Engine/session, declarative base, dev seed data (12+ opportunities)
│   ├── services/
│   │   ├── users/
│   │   ├── opportunities/
│   │   ├── email/        # EmailBackend interface (Console & SMTP)
│   │   ├── storage/      # StorageBackend interface (LocalDisk & Supabase)
│   │   ├── applications/
│   │   └── verification/
│   └── main.py         # App entry point, security headers, request-id, uploads mount
├── alembic/             # DB migrations (0001, 0002, 0003)
├── docs/                # database.md (ER rules), api.md (complete endpoint reference), supabase_rls.sql
└── tests/               # 118 passing pytest tests
```

## Local Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload --port 8000
```

The API is available at `http://localhost:8000`, with interactive docs at `http://localhost:8000/docs`.

## Running Tests

```bash
cd backend
pytest
```

## End-to-End Curl Test

```bash
bash ../scripts/curl/phase1.sh
```

## Conventions

- Routes stay thin — parse input, call a service, return a schema.
- Business logic lives in `services/<domain>/` — not in routes or models.
- Consistent error envelope: `{"error": {"code": "...", "message": "..."}}`.
- Database schema and migration rules: `docs/database.md`.
- Complete API schema reference: `docs/api.md`.
