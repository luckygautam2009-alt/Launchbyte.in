# Branching & Commit Naming

## Branches

Never develop directly on `main`.

Pattern: `<type>/<module>-<short-description>`

```text
feature/frontend-dashboard
feature/backend-opportunity-api
feature/ai-recommendation
feature/data-verification
fix/frontend-navbar
fix/backend-auth
```

`<type>` is one of: `feature`, `fix`, `chore`, `docs`.

`<module>` is one of: `frontend`, `backend`, `ai`, `data`, `docs`, or a
cross-cutting label if it doesn't fit one module.

## Commits

Use a short, conventional-style prefix:

```text
feat(backend): add opportunity list endpoint
fix(frontend): correct navbar overflow on mobile
docs(ai): add recommendation module README
chore(data): scaffold scraper folder structure
```

Keep the first line under ~72 characters. Add a body if the "why" isn't
obvious from the diff.
