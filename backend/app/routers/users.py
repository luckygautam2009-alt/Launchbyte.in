from fastapi import APIRouter, HTTPException, status

from app.dependencies.auth import CurrentUser
from app.dependencies.db import DBSession
from app.schemas.users import UserCreate, UserRead
from app.services.users import service as users_service

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
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
