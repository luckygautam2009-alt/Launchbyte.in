"""
Health and root routes.

Deliberately dependency-free (no DB hit) so `/health` can be used as a
liveness probe even if the database is unreachable. Routes stay thin per
convention — this one is simple enough that there's no service to call.
"""
from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.health import HealthResponse, RootResponse

router = APIRouter(tags=["health"])


@router.get("/", response_model=RootResponse)
def read_root() -> RootResponse:
    settings = get_settings()
    return RootResponse(name=settings.APP_NAME, env=settings.ENV)


@router.get("/health", response_model=HealthResponse)
@router.get("/api/v1/health", response_model=HealthResponse)
def read_health() -> HealthResponse:
    return HealthResponse(status="ok")
