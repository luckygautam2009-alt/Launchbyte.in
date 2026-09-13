# Verification (rule-based)

Rule-based verification, distinct from the AI-assisted signals in
`ai/verification/`.

- `rules/` — declarative rule definitions (e.g. required fields, source
  allowlist, deadline sanity checks).
- `validators/` — code that applies the rules to an opportunity record.
- `reports/` — output of verification runs (what passed/failed and why).

Status: Planned.
