from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_timing_middleware_adds_process_time_header():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert "X-Process-Time" in resp.headers
    assert resp.headers["X-Process-Time"].endswith("s")


def test_public_get_endpoints_have_cache_control_headers():
    resp = client.get("/api/v1/opportunities")
    assert resp.status_code == 200
    assert resp.headers.get("Cache-Control") == "public, max-age=60, stale-while-revalidate=300"

    resp_events = client.get("/api/v1/events")
    assert resp_events.status_code == 200
    assert resp_events.headers.get("Cache-Control") == "public, max-age=60, stale-while-revalidate=300"
