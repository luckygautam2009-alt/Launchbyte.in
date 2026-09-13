# LaunchByte Backend

FastAPI application providing the LaunchByte API.

**Owner:** Backend Developer

## Stack

- FastAPI
- Python 3.11+
- PostgreSQL / Supabase (via SQLAlchemy)

## Structure

```text
backend/
├── api/
│   ├── routes/         # Route modules, registered in main.py
│   └── dependencies/   # Shared FastAPI Depends() providers
├── models/              # SQLAlchemy ORM models
├── schemas/              # Pydantic request/response schemas
├── services/             # Business logic, one folder per domain
│   ├── auth/
│   ├── opportunities/
│   ├── users/
│   ├── applications/
│   └── verification/
├── core/
│   ├── config/           # Settings (env-driven)
│   ├── security/         # Auth primitives (hashing, JWT)
│   └── database/         # Engine/session setup
├── utils/                 # Small shared helpers
├── tests/                  # Pytest suite
└── main.py                 # App entry point
```

## Local Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # then fill in real values
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`, with interactive docs
at `http://localhost:8000/docs`.

## Running Tests

```bash
cd backend
pytest
```

## Status

- **Implemented:** app boots, `/health` and `/` routes, config loading,
  DB session scaffolding (not yet connected to real models).
- **Planned:** auth, opportunity models/schema, opportunity API, application
  tracker, verification surfacing. See `PROJECT_STATUS.md` at the repo root.

## Conventions

- Routes stay thin — parse input, call a service, return a schema.
- Business logic lives in `services/<domain>/`, not in routes or models.
- New env vars go in `.env.example` with a placeholder value.
- See `docs/architecture/backend.md` for more detail.
