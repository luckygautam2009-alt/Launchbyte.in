# Coding Standards

## General

- Keep PRs focused on one task — don't mix refactors with feature work.
- Don't add dependencies without justifying them in the PR description.
- Don't create new top-level folders without discussing with the founder
  first — see the architecture docs before restructuring anything.
- Prefer clarity over cleverness — this codebase is worked on by student
  developers across skill levels; optimize for the next reader.

## Frontend (TypeScript/React)

- Use the `@/` path aliases configured in `tsconfig.json`.
- Keep components presentational where possible; put data-fetching in
  `services/`, not inline in components.
- New shared UI primitives go in `components/ui/`; feature-specific pieces
  stay inside their `features/<name>/` folder until a second feature needs
  them.

## Backend (Python/FastAPI)

- Keep route handlers thin: parse → call a service → return a schema.
- Business logic lives in `services/<domain>/`, not in routes or models.
- Add type hints; prefer Pydantic schemas over raw dicts at API boundaries.
- Add/extend tests under `backend/tests/` for new services or routes.

## AI

- No AI logic directly in frontend components — always go through the
  backend.
- Keep prompts in `ai/prompts/`, not inline in application code.
- Add an eval (or extend an existing one) in `ai/evaluation/` for any
  change that could affect output quality.

## Data

- Never commit real scraped data — `raw/` and `archived/` are gitignored
  for a reason.
- Respect source terms of service and rate limits in any scraper.
- Normalize before anything downstream depends on the data.

## Documentation

- Update the relevant doc in `docs/` in the same PR as the code change it
  describes, not as a follow-up.
- Mark features clearly as Planned / In Development / Implemented — don't
  describe unbuilt functionality as if it exists.
