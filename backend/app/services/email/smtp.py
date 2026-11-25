import html
import logging
import smtplib
import uuid
from email.message import EmailMessage

from app.core.config import get_settings
from app.services.email.base import EmailBackend

logger = logging.getLogger(__name__)


def _safe_header_value(value: str) -> str:
    """Strip CR/LF characters to prevent SMTP header injection."""
    return value.replace("\r", " ").replace("\n", " ").strip()


class SMTPEmailBackend(EmailBackend):
    def _send(self, to_email: str, subject: str, body_text: str, body_html: str) -> None:
        settings = get_settings()
        msg = EmailMessage()
        msg["Subject"] = _safe_header_value(subject)
        msg["From"] = settings.SMTP_FROM
        msg["To"] = _safe_header_value(to_email)
        msg.set_content(body_text)
        msg.add_alternative(body_html, subtype="html")

        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                if settings.SMTP_TLS:
                    server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
        except Exception as exc:
            logger.error("Failed to send email to %s: %s", to_email, exc)
            raise

    def send_verification_email(self, email: str, token: str, user_id: uuid.UUID) -> None:
        settings = get_settings()
        link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        subject = "Verify your LaunchByte email"
        body_text = f"Welcome to LaunchByte! Please verify your email by opening:\n{link}\nThis link expires in 24 hours."
        body_html = f"<p>Welcome to LaunchByte!</p><p>Please verify your email by clicking <a href='{link}'>here</a>.</p><p>Expires in 24 hours.</p>"
        self._send(email, subject, body_text, body_html)

    def send_password_reset_email(self, email: str, token: str, user_id: uuid.UUID) -> None:
        settings = get_settings()
        link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        subject = "Reset your LaunchByte password"
        body_text = f"You requested a password reset. Reset your password here:\n{link}\nThis link expires in 1 hour."
        body_html = f"<p>You requested a password reset.</p><p>Click <a href='{link}'>here</a> to choose a new password.</p><p>Expires in 1 hour.</p>"
        self._send(email, subject, body_text, body_html)

    def send_notification_email(self, email: str, subject: str, message: str) -> None:
        safe_html_body = html.escape(message).replace("\n", "<br/>")
        body_html = f"<p>{safe_html_body}</p>"
        self._send(email, subject, message, body_html)
