"""
Business logic for the users domain.

Per convention: routers stay thin (parse input, call a service, return a
schema) — this is where the actual work happens.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.users import User
from app.schemas.users import UserCreate


_DUMMY_HASH = hash_password("timing-equalizer-not-a-real-password")


class EmailAlreadyRegisteredError(Exception):
    """Raised when registering an email that already has an account."""


def normalize_email(email: str) -> str:
    """Emails are stored and compared lowercase so `A@x.com` and `a@x.com` are one account."""
    return email.strip().lower()


def get_user_by_email(db: Session, email: str) -> User | None:
    # Compare case-insensitively so accounts created before normalization
    # was introduced (possibly mixed-case) can still log in.
    return db.query(User).filter(func.lower(User.email) == normalize_email(email)).first()


def get_user_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)


def create_user(db: Session, user_in: UserCreate) -> User:
    if get_user_by_email(db, user_in.email) is not None:
        raise EmailAlreadyRegisteredError(user_in.email)

    user = User(
        email=normalize_email(user_in.email),
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        # Two simultaneous registrations passed the check above; the unique
        # index on users.email caught the loser.
        db.rollback()
        raise EmailAlreadyRegisteredError(user_in.email) from exc
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None:
        # Same bcrypt cost as a real check, so timing doesn't reveal which emails exist.
        verify_password(password, _DUMMY_HASH)
        return None
    if not verify_password(password, user.hashed_password) or not user.is_active:
        return None
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    return user
