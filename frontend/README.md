# LaunchByte Frontend

Next.js + React + TypeScript application for the LaunchByte platform.

**Owner:** Frontend Developer

## Stack

- Next.js (Pages Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui (to be introduced as components are built)

## Structure

```text
frontend/
├── components/     # Reusable, presentational components
│   ├── ui/
│   ├── layout/
│   ├── opportunity/
│   └── common/
├── pages/           # Next.js routes
├── features/        # Feature-based modules (auth, opportunities, dashboard, ...)
├── hooks/            # Shared React hooks
├── lib/               # API client / third-party setup
├── services/          # API call wrappers
├── types/              # Shared TypeScript types
├── utils/               # Shared pure helpers
└── public/               # Static assets
```

## Local Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # then fill in real values
npm run dev
```

App runs at `http://localhost:3000`. It expects the backend at
`http://localhost:8000` by default (see `NEXT_PUBLIC_API_BASE_URL`).

## Status

- **Implemented:** app boots, base layout via `_app.tsx`, placeholder home
  page, Tailwind configured.
- **In Development:** none yet — this is the starting point.
- **Planned:** everything under `features/` — see each feature's own README.

## Conventions

- Use the `@/` path aliases (e.g. `@/components/ui/Button`) configured in
  `tsconfig.json`.
- Keep feature-specific code inside its `features/<name>/` folder; only
  promote something to `components/` when a second feature needs it.
- Call the backend through `services/`, not directly from components.
- See `docs/architecture/frontend.md` for more detail.
