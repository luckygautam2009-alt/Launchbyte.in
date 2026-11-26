"""
Business logic for the users domain.

Per convention: routers stay thin (parse input, call a service, return a
schema) — this is where the actual work happens.
"""
import hashlib
import logging
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

logger = logging.getLogger(__name__)
_DUMMY_HASH = hash_password("timing-equalizer-not-a-real-password")


class EmailAlreadyRegisteredError(Exception):
    """Raised when registering an email that already has an account."""


class HandleAlreadyTakenError(Exception):
    """Raised when registering or setting a handle that is already taken."""


class InvalidOrExpiredTokenError(Exception):
    """Raised when a verification or password-reset token is invalid or expired."""


class VerificationCooldownError(Exception):
    """Raised when an OTP resend is requested before the 60s cooldown expires."""


class EmailDeliveryError(Exception):
    """Raised when the configured email backend fails to deliver an email."""


def normalize_email(email: str) -> str:
    """Emails are stored and compared lowercase so `A@x.com` and `a@x.com` are one account."""
    return email.strip().lower()


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _hash_otp(user_id: uuid.UUID, code: str) -> str:
    return hashlib.sha256(f"{user_id}:{code.strip()}".encode("utf-8")).hexdigest()


def _as_utc(dt: datetime) -> datetime:
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


OTP_EXPIRE_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60


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

    # Automatically generate and send 6-digit email verification OTP
    try:
        _issue_verification_otp(db, user, respect_cooldown=False)
        user.verification_email_sent = True  # type: ignore[attr-defined]
        user.verification_email_error = None  # type: ignore[attr-defined]
    except EmailDeliveryError as exc:
        logger.error("Verification OTP dispatch failed on registration for %s: %s", user.email, exc)
        user.verification_email_sent = False  # type: ignore[attr-defined]
        user.verification_email_error = str(exc)  # type: ignore[attr-defined]

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


def _issue_verification_otp(db: Session, user: User, respect_cooldown: bool = True) -> str:
    """Issue a new 6-digit OTP (stored hashed, 10m expiry, 60s cooldown) and send via email."""
    now = datetime.now(timezone.utc)
    if respect_cooldown:
        latest = db.scalar(
            select(EmailVerificationToken)
            .where(EmailVerificationToken.user_id == user.id)
            .order_by(EmailVerificationToken.created_at.desc())
            .limit(1)
        )
        if latest is not None and _as_utc(latest.created_at) > now - timedelta(seconds=OTP_RESEND_COOLDOWN_SECONDS):
            raise VerificationCooldownError(
                f"Please wait at least {OTP_RESEND_COOLDOWN_SECONDS} seconds before requesting another code."
            )

    code = _generate_otp()

    # Dispatch email BEFORE invalidating prior tokens or committing the new token,
    # so a transient send failure never consumes the 60s cooldown.
    try:
        get_email_backend().send_verification_email(user.email, code, user.id)
    except Exception as exc:
        logger.error("Failed to send verification OTP to %s: %s", user.email, exc)
        raise EmailDeliveryError(f"Failed to send verification email: {exc}") from exc

    # Invalidate prior unused OTPs/tokens for this user
    db.query(EmailVerificationToken).filter(
        EmailVerificationToken.user_id == user.id,
        EmailVerificationToken.used_at.is_(None),
    ).update({"used_at": now})

    record = EmailVerificationToken(
        user_id=user.id,
        token_hash=_hash_otp(user.id, code),
        attempts=0,
        expires_at=now + timedelta(minutes=OTP_EXPIRE_MINUTES),
    )
    db.add(record)
    db.commit()
    return code


def send_login_verification_otp_if_needed(db: Session, user: User) -> tuple[bool, str | None]:
    """On login for unverified users, send a fresh OTP if outside the 60s cooldown."""
    if user.is_email_verified:
        return True, None
    try:
        _issue_verification_otp(db, user, respect_cooldown=True)
        return True, None
    except VerificationCooldownError:
        return True, None
    except EmailDeliveryError as exc:
        logger.error("Verification OTP dispatch failed on login for %s: %s", user.email, exc)
        return False, str(exc)


def request_email_verification(db: Session, user: User) -> None:
    """Generate and send a new 10-minute single-use 6-digit email verification OTP."""
    _issue_verification_otp(db, user, respect_cooldown=True)


def confirm_email_verification_otp(db: Session, user: User, code: str) -> User:
    """Verify email using the user's latest active 6-digit OTP (max 5 attempts)."""
    now = datetime.now(timezone.utc)
    record = db.scalar(
        select(EmailVerificationToken)
        .where(
            EmailVerificationToken.user_id == user.id,
            EmailVerificationToken.used_at.is_(None),
            EmailVerificationToken.expires_at > now,
        )
        .order_by(EmailVerificationToken.created_at.desc())
        .limit(1)
    )
    if record is None:
        raise InvalidOrExpiredTokenError("Verification code expired or not found. Please request a new code.")

    if record.attempts >= OTP_MAX_ATTEMPTS:
        record.used_at = now
        db.commit()
        raise InvalidOrExpiredTokenError("Too many failed attempts. Please request a new code.")

    expected_hash = _hash_otp(user.id, code)
    if not secrets.compare_digest(record.token_hash, expected_hash):
        record.attempts += 1
        if record.attempts >= OTP_MAX_ATTEMPTS:
            record.used_at = now
            db.commit()
            raise InvalidOrExpiredTokenError("Too many failed attempts. Please request a new code.")
        db.commit()
        remaining = OTP_MAX_ATTEMPTS - record.attempts
        raise InvalidOrExpiredTokenError(f"Invalid verification code. {remaining} attempt(s) remaining.")

    record.used_at = now
    user.is_email_verified = True
    db.commit()
    db.refresh(user)
    return user


def confirm_email_verification(db: Session, token: str) -> User:
    """Verify email using single-use legacy token."""
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
