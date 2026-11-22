# Schemas

Pydantic request/response schemas go here (one file per resource, e.g.
`opportunity.py`, `user.py`). Keep these separate from `models/` — schemas
are the API's public shape, models are the DB's internal shape. They will
often look similar but shouldn't be assumed identical.

Not implemented yet — add schemas alongside the route that needs them.
