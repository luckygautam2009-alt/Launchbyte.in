import logging
import uuid

import httpx

from app.core.config import get_settings
from app.services.email.base import EmailBackend

logger = logging.getLogger(__name__)

BREVO_EMAIL_API_URL = "https://api.brevo.com/v3/smtp/email"


class BrevoEmailBackend(EmailBackend):
    def __init__(self) -> None:
        settings = get_settings()
        self.api_key = settings.BREVO_API_KEY.strip()
        self.sender_email = (settings.EMAIL_FROM or settings.SMTP_FROM).strip()
        self.frontend_url = settings.FRONTEND_URL.rstrip("/")

    def _send(self, to_email: str, subject: str, text_content: str) -> None:
        if not self.api_key:
            raise RuntimeError("BREVO_API_KEY is not configured.")
        if not self.sender_email:
            raise RuntimeError("EMAIL_FROM is not configured.")

        headers = {
            "api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        payload = {
            "sender": {"name": "LaunchByte", "email": self.sender_email},
            "to": [{"email": to_email}],
            "subject": subject,
            "textContent": text_content,
        }

        try:
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(BREVO_EMAIL_API_URL, json=payload, headers=headers)
        except httpx.HTTPError as exc:
            logger.error("Brevo email network error sending to %s: %s", to_email, exc)
            raise RuntimeError(f"Brevo network error: {exc}") from exc

        if resp.status_code not in (200, 201, 202):
            logger.error(
                "Brevo email API error (%s) sending to %s: %s",
                resp.status_code,
                to_email,
                resp.text[:500],
            )
            raise RuntimeError(f"Brevo API error ({resp.status_code}): {resp.text[:300]}")

    def send_verification_email(self, email: str, token: str, user_id: uuid.UUID) -> None:
        if len(token) == 6 and token.isdigit():
            subject = "Your LaunchByte verification code"
            body = (
                "Welcome to LaunchByte!\n\n"
                f"Your 6-digit email verification code is: {token}\n\n"
                "This code expires in 10 minutes.\n"
                "If you did not create an account, you can ignore this email."
            )
        else:
            verify_url = f"{self.frontend_url}/verify-email?token={token}"
            subject = "Verify your LaunchByte email address"
            body = (
                "Welcome to LaunchByte!\n\n"
                f"Your verification token: {token}\n"
                f"Or open this link: {verify_url}\n\n"
                "If you did not create an account, you can ignore this email."
            )
        self._send(email, subject, body)

    def send_password_reset_email(self, email: str, token: str, user_id: uuid.UUID) -> None:
        reset_url = f"{self.frontend_url}/reset-password?token={token}"
        subject = "Reset your LaunchByte password"
        body = (
            "We received a request to reset your LaunchByte password.\n\n"
            f"Reset link: {reset_url}\n\n"
            "If you did not request this, you can safely ignore this email."
        )
        self._send(email, subject, body)

    def send_notification_email(self, email: str, subject: str, message: str) -> None:
        self._send(email, subject, message)
