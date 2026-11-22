# Contributing to LaunchByte

Thanks for working on LaunchByte. This guide covers how the team
collaborates day to day. For deeper detail, see
[`docs/contribution/`](./docs/contribution/).

## 1. Ownership

Ownership is by module, not by person:

| Module      | Owner                          |
|-------------|----------------------------------|
| `frontend/` | Frontend Developer                |
| `backend/`  | Backend Developer                  |
| `ai/`       | AI Developer                        |
| `data/`     | Data / Verification Developer      |

The Founder / Product Lead handles architecture decisions, integration,
code review, roadmap, and final merge decisions across all modules.

If you need to touch a module you don't own, loop in its owner via the PR
review — don't merge cross-module changes without their sign-off.

## 2. Branching

Never develop directly on `main`.

Branch naming convention:

```text
feature/frontend-dashboard
feature/backend-opportunity-api
feature/ai-recommendation
feature/data-verification
fix/frontend-navbar
fix/backend-auth
```

Pattern: `<type>/<module>-<short-description>`, where `<type>` is `feature`,
`fix`, `chore`, or `docs`.

## 3. Commits

Keep commits focused and descriptive:

```text
feat(backend): add opportunity list endpoint
fix(frontend): correct navbar overflow on mobile
docs(ai): add recommendation module README
chore(data): scaffold scraper folder structure
```

## 4. Pull Requests

- One PR = one focused task. Don't bundle unrelated changes.
- Use the PR template (auto-populated from `.github/PULL_REQUEST_TEMPLATE.md`).
- Fill out what changed, why, related issue, and testing performed.
- Request review from the relevant module owner (or the founder for
  cross-cutting changes).
- Do not merge your own PR without at least one approval.

## 5. Code Review

- Review for correctness, clarity, and alignment with the architecture in
  `docs/architecture/`.
- Leave actionable comments; approve once addressed.
- The founder/product lead has final say on merge decisions when reviewers
  disagree.

## 6. Issues

Use the templates in `.github/ISSUE_TEMPLATE/`:

- `feature.md` — new functionality
- `bug.md` — something broken
- `improvement.md` — refinement of existing functionality

Tag issues with the relevant module label when possible.

## 7. Testing

- Backend: add/extend tests under `backend/tests/` for new services or
  routes. Run with `pytest`.
- Frontend: colocate tests with components/features as the project adopts a
  test runner (see `frontend/README.md` for current status).
- A PR that changes behavior should explain what testing was performed, even
  if it's manual verification.

## 8. Environment Variables & Secrets

- Never commit `.env` files or real secrets. `.gitignore` already excludes
  `.env*` (except `.env.example`).
- Add any new required variable to the relevant `.env.example` file with a
  placeholder value and a short comment.
- If you accidentally commit a secret, rotate it immediately and notify the
  founder/product lead — don't just delete it in a follow-up commit.

## 9. Keeping Things Clean

- Don't add files/folders outside the established structure without a
  discussion — see the architecture docs first.
- Don't add dependencies "just in case" — justify new packages in the PR
  description.
- Update `PROJECT_STATUS.md` when a tracked item changes phase.
