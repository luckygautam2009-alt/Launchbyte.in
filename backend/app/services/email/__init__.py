from app.core.config import get_settings
from app.services.email.base import EmailBackend
from app.services.email.brevo import BrevoEmailBackend
from app.services.email.console import ConsoleEmailBackend
from app.services.email.smtp import SMTPEmailBackend


def get_email_backend() -> EmailBackend:
    settings = get_settings()
    backend = settings.EMAIL_BACKEND.lower().strip()
    if backend == "smtp":
        return SMTPEmailBackend()
    if backend == "brevo":
        return BrevoEmailBackend()
    return ConsoleEmailBackend()
