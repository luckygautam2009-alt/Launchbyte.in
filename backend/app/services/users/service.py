"""
Business logic for the users domain.

Per convention: routers stay thin (parse input, call a service, return a
schema) — this is where the actual work happens.
"""
import hashlib
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.auth_tokens import EmailVerificationToken, PasswordResetToken
from app.models.enums import UserRole
from app.models.users import User
from app.schemas.users import UserCreate
from app.services.email import get_email_backend

_DUMMY_HASH = hash_password("timing-equalizer-not-a-real-password")


class EmailAlreadyRegisteredError(Exception):
    """Raised when registering an email that already has an account."""


class HandleAlreadyTakenError(Exception):
    """Raised when registering or setting a handle that is already taken."""


class InvalidOrExpiredTokenError(Exception):
    """Raised when an email verification or password reset token is invalid or expired."""


class VerificationCooldownError(Exception):
    """Raised when requesting verification too quickly."""


def normalize_email(email: str) -> str:
    """Emails are stored and compared lowercase so `A@x.com` and `a@x.com` are one account."""
    return email.strip().lower()


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _generate_handle(db: Session, base: str) -> str:
    clean = re.sub(r"[^a-zA-Z0-9_]", "", base).lower()[:20]
    if len(clean) < 3:
        clean = f"user_{secrets.token_hex(4)}"
    candidate = clean
    for _ in range(10):
        if db.query(User).filter(User.handle == candidate).first() is None:
            return candidate
        candidate = f"{clean[:15]}_{secrets.token_hex(2)}"
    return f"u_{secrets.token_hex(6)}"


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(func.lower(User.email) == normalize_email(email)).first()


def get_user_by_handle(db: Session, handle: str) -> User | None:
    return db.query(User).filter(func.lower(User.handle) == handle.strip().lower()).first()


def get_user_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)


def create_user(db: Session, user_in: UserCreate) -> User:
    if get_user_by_email(db, user_in.email) is not None:
        raise EmailAlreadyRegisteredError(user_in.email)

    handle = user_in.handle
    if handle:
        if get_user_by_handle(db, handle) is not None:
            raise HandleAlreadyTakenError(handle)
    else:
        handle = _generate_handle(db, user_in.email.split("@")[0])

    user = User(
        email=normalize_email(user_in.email),
        handle=handle,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=UserRole.USER,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise EmailAlreadyRegisteredError(user_in.email) from exc
    db.refresh(user)

    # Automatically generate and send email verification token
    try:
        raw_token = secrets.token_urlsafe(32)
        token_hash = _hash_token(raw_token)
        now = datetime.now(timezone.utc)
        record = EmailVerificationToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=now + timedelta(hours=24),
        )
        db.add(record)
        db.commit()
        get_email_backend().send_verification_email(user.email, raw_token, user.id)
    except Exception:
        # Don't fail registration if email dispatch encounters an issue in dev
        pass

    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None:
        verify_password(password, _DUMMY_HASH)
        return None
    if not verify_password(password, user.hashed_password) or not user.is_active:
        return None
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    return user


def request_email_verification(db: Session, user: User) -> None:
    """Generate and send a new 24h single-use email verification token."""
    now = datetime.now(timezone.utc)
    # Check for recent active token to prevent spam
    recent = db.scalar(
        select(EmailVerificationToken)
        .where(
            EmailVerificationToken.user_id == user.id,
            EmailVerificationToken.used_at.is_(None),
            EmailVerificationToken.created_at > now - timedelta(seconds=60),
        )
    )
    if recent is not None:
        raise VerificationCooldownError("Please wait at least 60 seconds before requesting another email.")

    raw_token = secrets.token_urlsafe(32)
    token_hash = _hash_token(raw_token)
    record = EmailVerificationToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=now + timedelta(hours=24),
    )
    db.add(record)
    db.commit()
    get_email_backend().send_verification_email(user.email, raw_token, user.id)


def confirm_email_verification(db: Session, token: str) -> User:
    """Verify email using single-use token."""
    now = datetime.now(timezone.utc)
    token_hash = _hash_token(token)
    record = db.scalar(
        select(EmailVerificationToken)
        .where(
            EmailVerificationToken.token_hash == token_hash,
            EmailVerificationToken.used_at.is_(None),
            EmailVerificationToken.expires_at > now,
        )
    )
    if record is None:
        raise InvalidOrExpiredTokenError("Invalid or expired verification token.")

    record.used_at = now
    user = db.get(User, record.user_id)
    if user is None or not user.is_active:
        raise InvalidOrExpiredTokenError("Invalid or expired verification token.")

    user.is_email_verified = True
    db.commit()
    db.refresh(user)
    return user


def request_password_reset(db: Session, email: str) -> None:
    """
    Request a password reset link.
    Always succeeds without error to prevent user enumeration.
    """
    user = get_user_by_email(db, email)
    if user is None or not user.is_active:
        return

    now = datetime.now(timezone.utc)
    # Invalidate older unused reset tokens
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
    ).update({"used_at": now})

    raw_token = secrets.token_urlsafe(32)
    token_hash = _hash_token(raw_token)
    record = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=now + timedelta(hours=1),
    )
    db.add(record)
    db.commit()
    get_email_backend().send_password_reset_email(user.email, raw_token, user.id)


def confirm_password_reset(db: Session, token: str, new_password: str) -> User:
    """Confirm password reset: updates password, marks token used, increments token_version."""
    now = datetime.now(timezone.utc)
    token_hash = _hash_token(token)
    record = db.scalar(
        select(PasswordResetToken)
        .where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > now,
        )
    )
    if record is None:
        raise InvalidOrExpiredTokenError("Invalid or expired reset token.")

    record.used_at = now
    user = db.get(User, record.user_id)
    if user is None or not user.is_active:
        raise InvalidOrExpiredTokenError("Invalid or expired reset token.")

    user.hashed_password = hash_password(new_password)
    user.token_version += 1  # Invalidate all existing JWT tokens
    # Invalidate any other tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
    ).update({"used_at": now})

    db.commit()
    db.refresh(user)
    return user
