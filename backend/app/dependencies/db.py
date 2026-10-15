"""
Re-exports the DB session dependency so routers do:

    from app.dependencies.db import DBSession

instead of reaching into app.db.session directly. Keeps the import surface
for routers small and stable if the session implementation changes later.
"""
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db

DBSession = Annotated[Session, Depends(get_db)]
