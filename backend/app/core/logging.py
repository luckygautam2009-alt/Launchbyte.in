"""
Logging configuration.

Kept deliberately simple (stdlib logging, structured-ish format) so it has
zero extra dependencies. Swap in structlog/loguru later if needed — this is
the single place that would change.
"""
import logging
import sys

from app.core.config import get_settings


def configure_logging() -> None:
    settings = get_settings()

    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    )
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.setLevel(settings.LOG_LEVEL.upper())
    root.handlers = [handler]

    # Quiet down noisy third-party loggers by default.
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
