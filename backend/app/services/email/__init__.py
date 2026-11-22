from app.core.config import get_settings
from app.services.email.base import EmailBackend
from app.services.email.console import ConsoleEmailBackend
from app.services.email.smtp import SMTPEmailBackend


def get_email_backend() -> EmailBackend:
    settings = get_settings()
    if settings.EMAIL_BACKEND.lower() == "smtp":
        return SMTPEmailBackend()
    return ConsoleEmailBackend()
