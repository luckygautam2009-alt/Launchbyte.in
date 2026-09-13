# Components

Reusable, presentational building blocks — not tied to a specific feature.

- `ui/` — low-level primitives (buttons, inputs, cards). Prefer shadcn/ui
  conventions here once introduced.
- `layout/` — page shell, nav, footer, containers.
- `opportunity/` — presentational pieces specific to opportunity cards/lists
  (but reusable across features), e.g. `OpportunityCard`.
- `common/` — small shared pieces that don't fit the above (loading spinner,
  empty state, error boundary).

Nothing implemented yet beyond the folder structure.
