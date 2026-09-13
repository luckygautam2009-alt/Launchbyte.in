# Database Schema

**Status: draft target schema — not yet implemented as models/migrations.**

This is the authoritative target shape for the `opportunity` entity. Update
here first before reflecting changes in `backend/models/` or
`data/README.md`.

## `opportunity`

| Field                | Type      | Notes                                    |
|----------------------|-----------|-------------------------------------------|
| id                   | UUID      | Primary key                                |
| source               | string    | Where it was ingested from                 |
| source_url           | string    | Link to the original listing               |
| title                | string    | Opportunity title                          |
| category             | enum      | hackathon / internship / event / course    |
| organizer            | string    | Hosting org/company                        |
| description          | text      | Full description                           |
| eligibility          | text      | Who can apply                              |
| location             | string    | City/region, or "remote"                   |
| mode                 | enum      | online / offline / hybrid                  |
| deadline             | timestamp | Application deadline                       |
| start_date           | timestamp | When the opportunity starts                |
| verification_status  | enum      | unverified / verified / flagged            |
| freshness_timestamp  | timestamp | Last confirmed still current               |
| tags                 | string[]  | Free-form tags                             |
| skills               | string[]  | Relevant skills                            |
| application_url      | string    | Where to apply                             |

## Planned Related Entities (not yet detailed)

- `user` — profile, preferences, skills
- `application` — links a user to an opportunity with a status
  (interested/applied/accepted/rejected)
- `saved_opportunity` — a user's saved/bookmarked opportunities

## Notes

- This schema must be finalized before `backend/models/`,
  `ai/embeddings/`, and `data/opportunity-data/normalized/` can be
  meaningfully implemented — treat schema changes here as high-impact.
- Refer to the separately maintained product blueprint for any additional
  field-level requirements not yet reflected here.
