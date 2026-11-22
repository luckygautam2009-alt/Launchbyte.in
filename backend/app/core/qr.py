"""
Cryptographic QR Pass Token generation, verification, and QR Code PNG rendering.
"""
from __future__ import annotations

import io
import time
import uuid
from typing import Any

from jose import JWTError, jwt
import qrcode
from qrcode.constants import ERROR_CORRECT_Q

from app.core.config import get_settings

ALGORITHM = "HS256"


def create_pass_token(
    registration_id: uuid.UUID,
    event_id: uuid.UUID,
    qr_nonce: str,
    exp_timestamp: int,
) -> str:
    """Creates a cryptographically signed pass token containing NO personal information."""
    settings = get_settings()
    payload = {
        "rid": str(registration_id),
        "eid": str(event_id),
        "nonce": qr_nonce,
        "exp": exp_timestamp,
    }
    return jwt.encode(payload, settings.QR_SIGNING_KEY, algorithm=ALGORITHM)


def decode_and_verify_pass_token(token: str) -> dict[str, Any] | None:
    """Verifies HMAC signature and expiration; returns parsed payload or None if invalid."""
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.QR_SIGNING_KEY, algorithms=[ALGORITHM])
        if "rid" not in payload or "eid" not in payload or "nonce" not in payload:
            return None
        return payload
    except JWTError:
        return None


def generate_qr_png_bytes(data: str) -> bytes:
    """Renders data into a PNG byte stream using error correction level Q."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=ERROR_CORRECT_Q,
        box_size=10,
        border=3,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

