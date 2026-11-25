"""
Centralized email notification dispatcher for LaunchByte.

Routes admin notifications to `settings.ADMIN_INBOX_EMAIL` (launchbyte.in26@gmail.com)
and returns honest delivery status `(sent, error)` without swallowing failures silently.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

from app.core.config import get_settings
from app.services.email import get_email_backend

logger = logging.getLogger(__name__)


@dataclass
class EmailDeliveryResult:
    sent: bool
    error: str | None = None


def send_admin_notification(subject: str, message: str) -> EmailDeliveryResult:
    """Send an operational/submission alert to the centralized LaunchByte inbox."""
    settings = get_settings()
    target = settings.ADMIN_INBOX_EMAIL
    backend = get_email_backend()
    try:
        backend.send_notification_email(target, subject, message)
        return EmailDeliveryResult(sent=True)
    except Exception as exc:
        logger.error("Admin notification failed (%s) to %s: %s", subject, target, exc)
        return EmailDeliveryResult(sent=False, error=str(exc))


def send_user_notification(to_email: str, subject: str, message: str) -> EmailDeliveryResult:
    """Send a confirmation or moderation status update to a user/organizer."""
    backend = get_email_backend()
    try:
        backend.send_notification_email(to_email, subject, message)
        return EmailDeliveryResult(sent=True)
    except Exception as exc:
        logger.error("User notification failed (%s) to %s: %s", subject, to_email, exc)
        return EmailDeliveryResult(sent=False, error=str(exc))
