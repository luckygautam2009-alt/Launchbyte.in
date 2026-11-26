import hashlib
import html
import json
import logging
import uuid

import httpx

from app.core.config import get_settings
from app.services.email.base import EmailBackend

logger = logging.getLogger(__name__)

BREVO_EMAIL_API_URL = "https://api.brevo.com/v3/smtp/email"
BREVO_SENDERS_API_URL = "https://api.brevo.com/v3/senders"
_CHECKED_SENDERS: set[str] = set()


class BrevoEmailBackend(EmailBackend):
    def __init__(self) -> None:
        settings = get_settings()
        self.api_key = settings.BREVO_API_KEY.strip()
        env = getattr(settings, "ENV", "local").lower().strip()
        if env not in {"local", "test"}:
            self.sender_email = settings.EMAIL_FROM.strip()
        else:
            self.sender_email = (settings.EMAIL_FROM or settings.SMTP_FROM).strip()
        self.frontend_url = settings.FRONTEND_URL.rstrip("/")

    def _check_sender_verified_once(self, client: httpx.Client, headers: dict[str, str]) -> None:
        cache_key = f"{hashlib.sha256(self.api_key.encode()).hexdigest()[:12]}:{self.sender_email.lower()}"
        if cache_key in _CHECKED_SENDERS:
            return
        try:
            resp = client.get(BREVO_SENDERS_API_URL, headers=headers)
        except httpx.HTTPError as exc:
            logger.warning("Brevo sender verification lookup failed: %s", exc)
            return

        if resp.status_code != 200:
            return

        try:
            data = resp.json()
        except Exception:
            return
        senders = data.get("senders") if isinstance(data, dict) else None
        if not isinstance(senders, list):
            return

        active_emails = {
            str(s.get("email", "")).strip().lower()
            for s in senders
            if isinstance(s, dict) and s.get("active") is True
        }
        if self.sender_email.lower() not in active_emails:
            msg = (
                f"EMAIL_FROM={self.sender_email} is not an active verified sender in Brevo. "
                "Validate the sender or authenticate your domain in Brevo."
            )
            logger.error(msg)
            raise RuntimeError(msg)
        _CHECKED_SENDERS.add(cache_key)

    def _send(
        self,
        to_email: str,
        subject: str,
        text_content: str,
        html_content: str | None = None,
    ) -> None:
        if not self.api_key:
            raise RuntimeError("BREVO_API_KEY is not configured.")
        if not self.sender_email:
            raise RuntimeError("EMAIL_FROM is not configured.")

        if html_content is None:
            safe_html = html.escape(text_content).replace("\n", "<br/>")
            html_content = f"<div style='font-family:sans-serif;line-height:1.5'>{safe_html}</div>"

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
            "htmlContent": html_content,
        }

        try:
            with httpx.Client(timeout=15.0) as client:
                self._check_sender_verified_once(client, headers)
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

        message_id = None
        try:
            parsed = resp.json()
            if isinstance(parsed, dict):
                message_id = parsed.get("messageId")
        except Exception:
            parsed = None
        if not message_id and isinstance(getattr(resp, "text", None), str):
            try:
                parsed_text = json.loads(resp.text)
                if isinstance(parsed_text, dict):
                    message_id = parsed_text.get("messageId")
            except Exception:
                pass
        logger.info(
            "Brevo email accepted for %s | subject=%r | messageId=%s",
            to_email,
            subject,
            message_id or "unknown",
        )

    def send_verification_email(self, email: str, token: str, user_id: uuid.UUID) -> None:
        if len(token) == 6 and token.isdigit():
            subject = "Your LaunchByte verification code"
            body = (
                "Welcome to LaunchByte!\n\n"
                f"Your 6-digit email verification code is: {token}\n\n"
                "This code expires in 10 minutes.\n"
                "If you did not create an account, you can ignore this email."
            )
            body_html = (
                "<div style='font-family:sans-serif;line-height:1.6'>"
                "<p>Welcome to LaunchByte!</p>"
                f"<p>Your 6-digit email verification code is: <strong style='font-size:20px;letter-spacing:3px'>{html.escape(token)}</strong></p>"
                "<p>This code expires in 10 minutes.</p>"
                "<p>If you did not create an account, you can ignore this email.</p>"
                "</div>"
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
            body_html = (
                "<div style='font-family:sans-serif;line-height:1.6'>"
                "<p>Welcome to LaunchByte!</p>"
                f"<p>Click <a href='{html.escape(verify_url)}'>here</a> to verify your email address.</p>"
                "<p>If you did not create an account, you can ignore this email.</p>"
                "</div>"
            )
        self._send(email, subject, body, body_html)

    def send_password_reset_email(self, email: str, token: str, user_id: uuid.UUID) -> None:
        reset_url = f"{self.frontend_url}/reset-password?token={token}"
        subject = "Reset your LaunchByte password"
        body = (
            "We received a request to reset your LaunchByte password.\n\n"
            f"Reset link: {reset_url}\n\n"
            "If you did not request this, you can safely ignore this email."
        )
        body_html = (
            "<div style='font-family:sans-serif;line-height:1.6'>"
            "<p>We received a request to reset your LaunchByte password.</p>"
            f"<p><a href='{html.escape(reset_url)}'>Reset Password</a></p>"
            "<p>If you did not request this, you can safely ignore this email.</p>"
            "</div>"
        )
        self._send(email, subject, body, body_html)

    def send_notification_email(self, email: str, subject: str, message: str) -> None:
        self._send(email, subject, message)
