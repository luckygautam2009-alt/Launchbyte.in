"""
Signed, expiring, single-purpose tokens for one-click actions from emails
(e.g. "Approve / Reject this event submission").

Token format:  base64url(payload) . base64url(HMAC-SHA256(payload))
payload     :  "<kind>:<subject_id>:<expires_unix>"

The token only authorises the single `kind` on the single `subject_id` until it
expires. Replays are harmless because the action handlers are idempotent and only
act on submissions that are still 'pending'.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import time

from app.core.config import get_settings

DEFAULT_TTL_SECONDS = 7 * 24 * 3600


def _b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _b64d(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def _sign(payload: bytes) -> bytes:
    key = get_settings().SECRET_KEY.encode()
    return hmac.new(key, payload, hashlib.sha256).digest()


def create_action_token(kind: str, subject_id: str, ttl_seconds: int = DEFAULT_TTL_SECONDS) -> str:
    expires = int(time.time()) + ttl_seconds
    payload = f"{kind}:{subject_id}:{expires}".encode()
    return f"{_b64e(payload)}.{_b64e(_sign(payload))}"


def verify_action_token(token: str, kind: str) -> str | None:
    """Return the subject_id if the token is valid, unexpired and of the right kind, else None."""
    try:
        payload_b64, sig_b64 = token.split(".", 1)
        payload = _b64d(payload_b64)
        if not hmac.compare_digest(_sign(payload), _b64d(sig_b64)):
            return None
        token_kind, subject_id, expires = payload.decode().split(":", 2)
        if token_kind != kind or int(expires) < time.time():
            return None
        return subject_id
    except Exception:
        return None
