from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import get_settings
from app.core.rate_limit import rate_limit
from app.dependencies.auth import CurrentUser
from app.dependencies.db import DBSession
from app.schemas.users import UserCreate, UserRead
from app.services.users import service as users_service

router = APIRouter(prefix="/users", tags=["users"])
settings = get_settings()


@router.post(
    "",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AUTH_PER_MINUTE, window_seconds=60))],
)
def register_user(db: DBSession, user_in: UserCreate) -> UserRead:
    try:
        return users_service.create_user(db, user_in)
    except users_service.EmailAlreadyRegisteredError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        ) from exc


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: CurrentUser) -> UserRead:
    return current_user
