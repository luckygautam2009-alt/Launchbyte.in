import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.config import get_settings
from app.core.security import decode_access_token
from app.dependencies.db import DBSession
from app.models.enums import UserRole
from app.models.users import User
from app.services.users.service import get_user_by_id

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{get_settings().API_V1_PREFIX}/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl=f"{get_settings().API_V1_PREFIX}/auth/login", auto_error=False)


def get_current_user(db: DBSession, token: Annotated[str, Depends(oauth2_scheme)]) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        raw_sub = payload.get("sub")
        if raw_sub is None:
            raise credentials_exception
        user_id = uuid.UUID(raw_sub)
    except ValueError as exc:
        raise credentials_exception from exc

    user = get_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")

    # Require and validate token_version so password resets invalidate all prior tokens
    token_version = payload.get("token_version")
    if not isinstance(token_version, int) or token_version != user.token_version:
        raise credentials_exception

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(*roles: UserRole):
    """Dependency factory: `Depends(require_role(UserRole.ADMIN))`."""

    def checker(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
        return user

    return checker


def require_verified_email(user: CurrentUser) -> User:
    """Requires the current user to have verified their email."""
    if not user.is_email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email verification required")
    return user


AdminUser = Annotated[User, Depends(require_role(UserRole.ADMIN))]
StaffUser = Annotated[User, Depends(require_role(UserRole.MODERATOR, UserRole.ADMIN))]
OrganizerUser = Annotated[User, Depends(require_role(UserRole.ORGANIZER, UserRole.MODERATOR, UserRole.ADMIN))]
ContributorUser = Annotated[
    User,
    Depends(require_role(UserRole.CONTRIBUTOR, UserRole.ORGANIZER, UserRole.MODERATOR, UserRole.ADMIN)),
]
VerifiedUser = Annotated[User, Depends(require_verified_email)]


def get_optional_user(db: DBSession, token: Annotated[str | None, Depends(oauth2_scheme_optional)]) -> User | None:
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        raw_sub = payload.get("sub")
        if not raw_sub:
            return None
        user_id = uuid.UUID(raw_sub)
        user = get_user_by_id(db, user_id)
        if not user or not user.is_active:
            return None
        token_version = payload.get("token_version")
        if not isinstance(token_version, int) or token_version != user.token_version:
            return None
        return user
    except Exception:
        return None


OptionalUser = Annotated[User | None, Depends(get_optional_user)]
