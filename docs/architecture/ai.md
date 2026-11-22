# AI Architecture

## Independence from the Frontend

The AI layer (`ai/`) is never imported directly by the frontend. All AI
functionality is exposed to users through the backend, which calls into
`ai/` through a defined service interface.

## Modules

- **`recommendation/`** — matching, ranking, and personalization of
  opportunities for a given user.
- **`verification/`** — AI-assisted signals that supplement (not replace)
  the rule-based checks in `data/verification/`: source credibility,
  semantic duplicate detection, freshness inference.
- **`copilot/`** — conversational assistant for opportunity guidance and
  application support.
- **`embeddings/`** — shared embedding generation/storage used by matching
  and semantic duplicate detection.
- **`prompts/`** — versioned prompt templates, kept out of application code
  so they can be reviewed and iterated on independently.
- **`evaluation/`** — eval harnesses to measure AI quality over time
  (recommendation relevance, duplicate-detection precision/recall, copilot
  response quality).

## Backend ↔ AI Interface

The backend should treat `ai/` as a service boundary: call a defined
function/endpoint per capability (e.g. "rank these opportunities for this
user"), rather than reaching into AI internals. This keeps the AI
implementation free to change (models, approaches, providers) without
backend or frontend changes.

## Build Sequencing

AI features should not be built ahead of:

1. A stable basic architecture (frontend/backend booting, core routes
   working).
2. A finalized opportunity schema (`docs/database/schema.md`) and real
   normalized data flowing from `data/`.

Building `recommendation/` or `copilot/` against fake/placeholder data
produces AI logic that has to be redone once real data exists — sequencing
matters here more than usual.
