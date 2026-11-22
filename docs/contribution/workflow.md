# Workflow

## Day-to-Day Flow

1. Pick up or create an issue (use the templates in `.github/ISSUE_TEMPLATE/`).
2. Create a branch following the naming convention in
   [`branching.md`](./branching.md).
3. Do the work, scoped to one focused task.
4. Open a PR using the auto-populated template; fill in what changed, why,
   related issue, and testing performed.
5. Request review from the relevant module owner.
6. Address feedback, get approval, merge.
7. Update `PROJECT_STATUS.md` if the change moves a tracked item between
   phases.

## Cross-Module Changes

If your change touches a module you don't own (e.g. a frontend change that
also needs a new backend field), loop in that module's owner early — ideally
before writing code, and definitely before opening the PR — rather than
surprising them in review.

## Decision Escalation

If reviewers disagree, or a decision affects architecture/roadmap, the
founder/product lead makes the final call.

## Environment Variables

New environment variable → add it to the relevant `.env.example` (root,
`frontend/.env.local.example`, or `backend/.env.example`) with a placeholder
value and a short comment on what it's for.
