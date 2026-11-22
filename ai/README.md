# AI

Modular AI system for LaunchByte: recommendation, verification intelligence,
and the AI Copilot.

**Owner:** AI Developer

## Structure

```text
ai/
├── recommendation/    # Opportunity matching, ranking, personalization
│   ├── matching/
│   ├── ranking/
│   └── personalization/
├── verification/        # AI-assisted verification signals
│   ├── source_check/
│   ├── duplicate_detection/
│   └── freshness/
├── copilot/               # Conversational assistant
│   ├── chat/
│   ├── opportunity_guidance/
│   └── application_support/
├── embeddings/             # Embedding generation/storage helpers
├── prompts/                 # Versioned prompt templates
└── evaluation/                # Eval harnesses for AI quality
```

## Design Principles

- **Independent from the frontend.** No AI logic should be embedded
  directly in React components — the frontend talks to the backend, and the
  backend talks to `ai/` (see `docs/architecture/ai.md`).
- **Communicates through defined services/APIs.** The backend should call
  into this layer through a clear service interface, not by importing
  internal AI modules ad hoc.
- **Stable before smart.** AI features should not be built ahead of a
  stable basic architecture and a finalized opportunity schema (see
  `data/README.md` and `docs/database/schema.md`).

## Status

Everything in this module is **Planned**. No AI logic is implemented yet —
only the folder structure and this documentation.

## Next Steps (when this module starts)

1. Finalize the opportunity schema (blocks recommendation & verification).
2. Stand up `embeddings/` basics once there's real opportunity data to embed.
3. Build `recommendation/matching/` as the first working slice.
4. Build `verification/` signals once `data/verification/rules` exist.
5. Build `copilot/` last — it depends on the above being stable.
