from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.security import create_access_token
from app.dependencies.db import DBSession
from app.schemas.users import Token
from app.services.users import service as users_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(
    db: DBSession,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    # OAuth2PasswordRequestForm's field is called "username" but we treat it
    # as the user's email — that's what /users registers with.
    user = users_service.authenticate_user(db, form_data.username, form_data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=str(user.id))
    return Token(access_token=access_token)
