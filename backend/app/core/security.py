"""
Auth primitives: password hashing and JWT access tokens.

Kept framework-agnostic (no FastAPI imports here) so it can be unit tested
in isolation. The FastAPI-facing piece — extracting/validating the bearer
token on a request — lives in app/dependencies/auth.py.
"""
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import get_settings

ALGORITHM = "HS256"

# bcrypt has a hard 72-byte input limit; truncate deterministically rather
# than letting long passwords raise or silently behave oddly.
_BCRYPT_MAX_BYTES = 72


def hash_password(plain: str) -> str:
    plain_bytes = plain.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    hashed = bcrypt.hashpw(plain_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    plain_bytes = plain.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    return bcrypt.checkpw(plain_bytes, hashed.encode("utf-8"))


def create_access_token(
    subject: str,
    role: str = "user",
    token_version: int = 1,
    expires_delta: timedelta | None = None,
) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode = {
        "sub": subject,
        "role": role,
        "token_version": token_version,
        "exp": expire,
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Raises ValueError on any invalid/expired token."""
    settings = get_settings()
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc
