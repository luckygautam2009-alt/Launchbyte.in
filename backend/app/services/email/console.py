import logging
import uuid
from app.core.config import get_settings
from app.services.email.base import EmailBackend

logger = logging.getLogger(__name__)

# In-memory store for dev/testing token inspection
# email -> {"verify": token, "reset": token}
_DEV_TOKENS: dict[str, dict[str, str]] = {}


class ConsoleEmailBackend(EmailBackend):
    def send_verification_email(self, email: str, token: str, user_id: uuid.UUID) -> None:
        settings = get_settings()
        link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        if email not in _DEV_TOKENS:
            _DEV_TOKENS[email] = {}
        _DEV_TOKENS[email]["verify"] = token

        if settings.ENV in {"local", "test"}:
            if len(token) == 6 and token.isdigit():
                banner = (
                    "\n"
                    "============================================================\n"
                    f"  LAUNCHBYTE EMAIL VERIFICATION OTP\n"
                    f"  To:   {email}\n"
                    f"  User: {user_id}\n"
                    f"  OTP:  {token}\n"
                    "============================================================"
                )
                print(banner)
                logger.info("[EMAIL:VERIFY_OTP] To: %s | User: %s | OTP: %s%s", email, user_id, token, banner)
            else:
                logger.info("[EMAIL:VERIFY] To: %s | User: %s | Verification Link: %s", email, user_id, link)
        else:
            logger.info("[EMAIL:VERIFY] To: %s | Verification email dispatched", email)

    def send_password_reset_email(self, email: str, token: str, user_id: uuid.UUID) -> None:
        settings = get_settings()
        link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        if email not in _DEV_TOKENS:
            _DEV_TOKENS[email] = {}
        _DEV_TOKENS[email]["reset"] = token

        if settings.ENV in {"local", "test"}:
            logger.info("[EMAIL:RESET] To: %s | User: %s | Reset Link: %s", email, user_id, link)
        else:
            logger.info("[EMAIL:RESET] To: %s | Password reset email dispatched", email)

    def send_notification_email(self, email: str, subject: str, message: str) -> None:
        logger.info("[EMAIL:NOTIF] To: %s | Subject: %s | Body: %s", email, subject, message)


def get_dev_token(email: str, token_type: str) -> str | None:
    """Helper for testing/local dev curl scripts to get the latest token."""
    return _DEV_TOKENS.get(email, {}).get(token_type)
