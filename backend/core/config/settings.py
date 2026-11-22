"""
Application configuration.

Loads settings from environment variables (via a .env file in development).
Add new settings here rather than reading os.environ directly elsewhere in
the codebase, so all configuration stays discoverable in one place.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: str = "development"

    database_url: str = "postgresql://user:password@localhost:5432/launchbyte"

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    jwt_secret: str = "change-me-in-env"

    cors_origins: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — import this, not Settings() directly."""
    return Settings()
