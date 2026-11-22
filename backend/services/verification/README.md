# Verification Service (backend-side)

Thin backend layer that exposes verification status to the API, backed by
the actual verification logic in `ai/verification/` and `data/verification/`.
This module should not duplicate verification rules — it reads and surfaces
results computed upstream. Not implemented yet.
