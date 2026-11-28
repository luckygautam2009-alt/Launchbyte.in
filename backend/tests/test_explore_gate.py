"""Browsing the catalogue must need a signed-in user when REQUIRE_LOGIN_TO_EXPLORE is on."""
from app.core.config import get_settings

_PATHS = [
    "/opportunities",
    "/opportunities/types",
    "/tags",
    "/events",
    "/projects",
    "/teams",
    "/people/discover",
]


def _url(path: str) -> str:
    return f"{get_settings().API_V1_PREFIX}{path}"


def test_explore_requires_login_when_enabled(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "REQUIRE_LOGIN_TO_EXPLORE", True)
    for path in _PATHS:
        resp = client.get(_url(path))
        assert resp.status_code == 401, f"{path} leaked to an anonymous caller"


def test_explore_stays_open_when_disabled(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "REQUIRE_LOGIN_TO_EXPLORE", False)
    for path in _PATHS:
        assert client.get(_url(path)).status_code != 401, path


def test_about_team_stays_public_when_gated(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "REQUIRE_LOGIN_TO_EXPLORE", True)
    assert client.get(_url("/about/team")).status_code == 200
