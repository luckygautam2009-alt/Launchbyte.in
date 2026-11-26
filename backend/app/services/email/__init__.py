from app.core.config import get_settings
from app.services.email.base import EmailBackend
from app.services.email.brevo import BrevoEmailBackend
from app.services.email.console import ConsoleEmailBackend
from app.services.email.smtp import SMTPEmailBackend


def get_email_backend() -> EmailBackend:
    settings = get_settings()
    backend = getattr(settings, "EMAIL_BACKEND", "console").lower().strip()
    env = getattr(settings, "ENV", "local").lower().strip()
    if backend == "smtp":
        return SMTPEmailBackend()
    if backend == "brevo":
        return BrevoEmailBackend()
    if env not in {"local", "test"}:
        raise RuntimeError(
            f"EMAIL_BACKEND={backend!r} is not allowed when ENV={env!r}. "
            "Configure EMAIL_BACKEND='brevo' or 'smtp'."
        )
    return ConsoleEmailBackend()
