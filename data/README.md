# Data

Opportunity ingestion, normalization, and verification pipelines. This
module is foundational — opportunities are the core product, so data
quality here directly determines product quality everywhere else.

**Owner:** Data / Verification Developer

## Structure

```text
data/
├── scrapers/               # Source-specific ingestion (where legally/technically appropriate)
│   ├── hackathons/
│   ├── internships/
│   ├── events/
│   └── courses/
├── opportunity-data/         # Opportunity data at each pipeline stage
│   ├── raw/                     # As ingested, untouched (gitignored)
│   ├── normalized/              # Cleaned, schema-conformant
│   └── archived/                 # Expired/removed opportunities (gitignored)
├── verification/                    # Rule-based verification
│   ├── rules/                          # Verification rule definitions
│   ├── validators/                       # Code that applies the rules
│   └── reports/                            # Verification run outputs
└── pipelines/                                # Orchestration: ingest → normalize → verify → publish
```

`raw/` and `archived/` are excluded from version control (see root
`.gitignore`) — real opportunity data should never be committed to the repo.

## Opportunity Schema (target)

Every opportunity should eventually have:

- source
- source URL
- title
- category
- organizer
- description
- eligibility
- location
- mode
- deadline
- start date
- verification status
- freshness timestamp
- tags
- skills
- application URL

The authoritative version of this schema lives in
[`docs/database/schema.md`](../docs/database/schema.md) — update there
first, then reflect changes here if needed.

## Design Principles

- **No aggressive scraping yet.** Build the pipeline architecture so
  sources can be added later; don't stand up broad scraping infrastructure
  before the schema is finalized.
- **Legally/technically appropriate sources only.** Respect robots.txt,
  terms of service, and rate limits for any source added under `scrapers/`.
- **Normalize before anything downstream depends on it.** `ai/` and
  `backend/` should read from `normalized/` (via the database), never from
  `raw/` directly.

## Status

Everything in this module is **Planned**. No ingestion or verification
logic is implemented yet — only the folder structure and this
documentation.

## Next Steps (when this module starts)

1. Finalize the opportunity schema (`docs/database/schema.md`).
2. Build one scraper end-to-end for a single source/category as a template.
3. Build the normalization step against the finalized schema.
4. Build basic verification rules (source allowlist, required fields present).
5. Wire `pipelines/` to run ingest → normalize → verify in sequence.
