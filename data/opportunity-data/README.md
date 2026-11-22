# Opportunity Data

Pipeline stages for opportunity data:

- `raw/` — exactly as ingested from a source. Gitignored — never commit
  real scraped data.
- `normalized/` — cleaned and conformant to the schema in
  `docs/database/schema.md`. This is what downstream systems (backend, AI)
  should read from.
- `archived/` — expired or removed opportunities, kept for reference.
  Gitignored.

Status: Planned.
