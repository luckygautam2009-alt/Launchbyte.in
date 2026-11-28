from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import get_settings
from app.core.rate_limit import rate_limit
from app.core.security import create_access_token
from app.dependencies.auth import CurrentUser, OptionalUser
from app.dependencies.db import DBSession
from app.schemas.users import (
    EmailVerificationConfirm,
    MessageResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    Token,
)
from app.services.email.console import get_dev_token
from app.services.users import service as users_service

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _login_ip_and_user_key(request: Request) -> str:
    host = request.client.host if request.client else "127.0.0.1"
    return host


@router.post(
    "/login",
    response_model=Token,
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AUTH_PER_MINUTE, window_seconds=60))],
)
def login(
    db: DBSession,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    user = users_service.authenticate_user(db, form_data.username, form_data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    verification_email_sent: bool | None = None
    verification_email_error: str | None = None
    if not user.is_email_verified:
        verification_email_sent, verification_email_error = users_service.send_login_verification_otp_if_needed(
            db, user
        )

    access_token = create_access_token(
        subject=str(user.id),
        role=user.role.value,
        token_version=user.token_version,
    )
    return Token(
        access_token=access_token,
        verification_email_sent=verification_email_sent,
        verification_email_error=verification_email_error,
    )


@router.post(
    "/refresh",
    response_model=Token,
    dependencies=[Depends(rate_limit(max_requests=30, window_seconds=60))],
)
def refresh_access_token(current_user: CurrentUser) -> Token:
    """Sliding session: trade a still-valid access token for a fresh one.

    Without this every user was silently logged out exactly ACCESS_TOKEN_EXPIRE_MINUTES after login
    (all calls started failing with 401 while the UI still looked signed-in).
    """
    return Token(
        access_token=create_access_token(
            subject=str(current_user.id),
            role=current_user.role.value,
            token_version=current_user.token_version,
        )
    )


@router.post(
    "/verify-email/request",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit(max_requests=5, window_seconds=60))],
)
def request_email_verification(
    db: DBSession,
    current_user: CurrentUser,
) -> MessageResponse:
    if current_user.is_email_verified:
        return MessageResponse(message="Email is already verified.")
    try:
        users_service.request_email_verification(db, current_user)
    except users_service.VerificationCooldownError as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc)) from exc
    except users_service.EmailDeliveryError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return MessageResponse(message="6-digit verification code sent. Please check your inbox.")


@router.post(
    "/verify-email/confirm",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit(max_requests=10, window_seconds=60))],
)
def confirm_email_verification(
    db: DBSession,
    body: EmailVerificationConfirm,
    current_user: OptionalUser = None,
) -> MessageResponse:
    try:
        if body.code:
            if current_user is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required to verify with 6-digit code.",
                )
            users_service.confirm_email_verification_otp(db, current_user, body.code)
            return MessageResponse(message="Email verified successfully.")
        assert body.token is not None
        users_service.confirm_email_verification(db, body.token)
        return MessageResponse(message="Email verified successfully.")
    except users_service.InvalidOrExpiredTokenError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post(
    "/password-reset/request",
    response_model=MessageResponse,
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(rate_limit(max_requests=5, window_seconds=60))],
)
def request_password_reset(
    db: DBSession,
    body: PasswordResetRequest,
) -> MessageResponse:
    users_service.request_password_reset(db, body.email)
    # Always return 202 with identical body to prevent user enumeration
    return MessageResponse(message="If that email is registered, a password reset link has been sent.")


@router.post(
    "/password-reset/confirm",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit(max_requests=10, window_seconds=60))],
)
def confirm_password_reset(
    db: DBSession,
    body: PasswordResetConfirm,
) -> MessageResponse:
    try:
        users_service.confirm_password_reset(db, body.token, body.new_password)
        return MessageResponse(message="Password reset successfully. Please log in with your new password.")
    except users_service.InvalidOrExpiredTokenError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/test-token", include_in_schema=False)
def get_test_token(email: str = Query(...), type: str = Query("verify")):
    """Dev/test-only route to inspect tokens when ENV=local or test."""
    if settings.ENV not in {"local", "test"}:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    token = get_dev_token(email, type)
    if not token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No token found")
    return {"token": token}
