# Frontend Architecture

## Stack

Next.js (Pages Router), React, TypeScript, Tailwind CSS, shadcn/ui (as
introduced).

## Organizing Principle: Feature-Based

Code is organized primarily by **feature**, not by technical layer. Each
folder under `frontend/features/` (auth, opportunities, dashboard, profile,
saved, applications, team-finder, notifications) owns its own
components, hooks, and page-level logic.

Shared, feature-agnostic pieces live in the top-level `components/`,
`hooks/`, `lib/`, `services/`, `types/`, and `utils/` folders — promote code
there only once a second feature needs it, rather than up front.

## Layering

```text
pages/            → routes only; compose features, no business logic
features/<name>/  → feature-specific components, hooks, logic
components/       → shared presentational components
services/          → API calls (talks to backend/)
hooks/              → shared React hooks
lib/                 → API client / third-party setup
types/                → shared TypeScript types (mirror backend schemas)
utils/                 → shared pure helper functions
```

## API Communication

All backend calls go through `services/` (or a feature-local service file),
never directly from a component with a raw `fetch`. This keeps API contract
changes contained to one layer.

## Styling

Tailwind CSS utility classes; shadcn/ui components for common UI primitives
as they're introduced, kept under `components/ui/`.

## What's Not Decided Yet

- State management approach beyond React state/context (to be decided when
  a feature actually needs it — don't add a library speculatively).
- Testing framework (to be added alongside the first feature that needs
  meaningful test coverage).
