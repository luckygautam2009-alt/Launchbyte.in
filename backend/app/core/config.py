"""
Application settings, driven entirely by environment variables.

Any new env var the app needs should be added here as a typed field,
AND documented with a placeholder value in `.env.example`.
"""
from functools import lru_cache

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_PLACEHOLDER_SECRETS = {"change-me-in-env", "replace-with-a-long-random-string"}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- App ---
    APP_NAME: str = "LaunchByte Backend"
    ENV: str = Field(default="local", description="local | staging | production")
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    FRONTEND_URL: str = "http://localhost:3000"

    # --- Logging ---
    LOG_LEVEL: str = "INFO"

    # --- Database (PostgreSQL / Supabase via SQLAlchemy) ---
    DATABASE_URL: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5432/launchbyte",
        description="SQLAlchemy connection string for Postgres/Supabase.",
    )
    DB_ECHO: bool = False

    # --- Auth (JWT signing, see core/security.py) ---
    SECRET_KEY: str = Field(
        default="change-me-in-env",
        description="Signs JWT access tokens. Must be overridden (32+ chars) outside local dev.",
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    QR_SIGNING_KEY: str = Field(
        default="dev-qr-signing-key-minimum-32-chars-long",
        description="Signs QR pass tokens. Separate from SECRET_KEY.",
    )

    # --- Rate Limiting ---
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_AUTH_PER_MINUTE: int = 10

    # --- Email Service ---
    EMAIL_BACKEND: str = "console"  # console | smtp
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@launchbyte.io"
    SMTP_TLS: bool = True

    # --- Storage Service ---
    STORAGE_BACKEND: str = "local"  # local | supabase
    STORAGE_LOCAL_DIR: str = "uploads"
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_STORAGE_BUCKET: str = "media"

    # --- Moderation & Reports ---
    OPPORTUNITY_REPORT_FLAG_THRESHOLD: int = 3

    # --- CORS ---
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    @field_validator("DEBUG", mode="before")
    @classmethod
    def _parse_debug(cls, v):
        if isinstance(v, str):
            if v.lower() in {"release", "prod", "production", "false", "0", "no", "off"}:
                return False
            if v.lower() in {"debug", "dev", "development", "true", "1", "yes", "on"}:
                return True
        return v

    @model_validator(mode="after")
    def _require_real_secret_outside_local(self) -> "Settings":
        """Fail fast at startup instead of silently signing tokens with a public default."""
        if self.ENV.lower() not in {"local", "test"}:
            if self.SECRET_KEY in _PLACEHOLDER_SECRETS or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "SECRET_KEY must be set to a random string of at least 32 characters "
                    f"when ENV={self.ENV!r}. Generate one with: python -c "
                    '"import secrets; print(secrets.token_urlsafe(48))"'
                )
            if self.DEBUG:
                raise ValueError(
                    f"Refusing to start: DEBUG must be false in non-local environments (ENV={self.ENV!r})"
                )
        return self


@lru_cache
def get_settings() -> Settings:
    """Cached settings accessor — import this, not Settings() directly."""
    return Settings()
