"""
Auth primitives: password hashing and JWT access tokens.

Kept framework-agnostic (no FastAPI imports here) so it can be unit tested
in isolation. The FastAPI-facing piece — extracting/validating the bearer
token on a request — lives in app/dependencies/auth.py.
"""
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import get_settings

ALGORITHM = "HS256"
ALLOWED_ALGORITHMS = [ALGORITHM]

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
    now = datetime.now(timezone.utc)
    expire = now + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode = {
        "sub": subject,
        "role": role,
        "token_version": token_version,
        "token_type": "access",
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "iat": now,
        "jti": uuid.uuid4().hex,
        "exp": expire,
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Raises ValueError on any invalid/expired/tampered token."""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=ALLOWED_ALGORITHMS,
            audience=settings.JWT_AUDIENCE,
            issuer=settings.JWT_ISSUER,
            options={
                "require_exp": True,
                "require_sub": True,
                "verify_aud": True,
                "verify_iss": True,
            },
        )
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc

    if payload.get("token_type") != "access":
        raise ValueError("Invalid token purpose")
    if not isinstance(payload.get("token_version"), int):
        raise ValueError("Missing token version")
    return payload
