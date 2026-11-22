# Security

Placeholder for authentication/authorization primitives:

- Password hashing
- JWT issuance & verification
- Auth dependencies (`get_current_user`, etc.)

Not implemented yet — see `backend/services/auth/` for where auth business
logic will live, and `PROJECT_STATUS.md` for sequencing. This module should
stay a thin, well-tested layer since every protected route depends on it.
