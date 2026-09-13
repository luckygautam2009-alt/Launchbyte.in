# API Routes

Each resource gets its own route module, registered in `backend/main.py`.

## Implemented

- `health.py` — `GET /health`, used for uptime/CI checks.

## Planned (do not implement until schema/services are ready)

- `auth.py` — signup, login, session/token refresh
- `opportunities.py` — list, search, filter, retrieve opportunity detail
- `users.py` — profile CRUD
- `applications.py` — application tracker endpoints
- `recommendations.py` — thin proxy to `ai/recommendation/` service

Keep route handlers thin: parse input, call a service in
`backend/services/<domain>/`, return a schema from `backend/schemas/`. Business
logic belongs in services, not in route handlers.
