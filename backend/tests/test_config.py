import pytest
from pydantic import ValidationError

from app.core.config import Settings


@pytest.fixture(autouse=True)
def _clean_env(monkeypatch):
    # Tests must not depend on the developer's shell env or local .env file.
    for key in ("ENV", "SECRET_KEY"):
        monkeypatch.delenv(key, raising=False)


def make(**kw) -> Settings:
    return Settings(_env_file=None, **kw)


def test_local_env_allows_default_secret():
    assert make(ENV="local").SECRET_KEY == "change-me-in-env"


@pytest.mark.parametrize("env", ["staging", "production"])
def test_non_local_env_rejects_default_secret(env):
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        make(ENV=env)


def test_non_local_env_rejects_short_secret():
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        make(ENV="production", SECRET_KEY="too-short")


def test_env_example_placeholder_is_rejected_in_production():
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        make(ENV="production", SECRET_KEY="replace-with-a-long-random-string")


def test_non_local_env_accepts_strong_secret():
    assert (
        make(
            ENV="production",
            SECRET_KEY="x" * 40,
            QR_SIGNING_KEY="y" * 40,
            EMAIL_BACKEND="smtp",
        ).ENV
        == "production"
    )
