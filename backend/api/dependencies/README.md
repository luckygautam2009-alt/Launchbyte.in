# API Dependencies

FastAPI `Depends()` providers shared across routes — e.g. `get_db`
(re-exported from `backend/core/database/session.py`), and, once auth
exists, `get_current_user`.

Keep dependencies small and composable. Nothing implemented here yet beyond
the database session dependency.
