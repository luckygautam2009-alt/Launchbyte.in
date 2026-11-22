import io
from PIL import Image

from app.db.seed import ADMIN_EMAIL, STUDENT_EMAIL, seed


def _get_token(client, email, password):
    resp = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    return resp.json()["access_token"]


def _make_image_bytes(format="PNG", size=(100, 100), color="blue"):
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=format)
    return buf.getvalue()


def test_upload_permissions(client, db_session):
    seed(db_session, admin_password="admin-pass-123", student_password="student-pass-123")
    student_token = _get_token(client, STUDENT_EMAIL, "student-pass-123")
    admin_token = _get_token(client, ADMIN_EMAIL, "admin-pass-123")

    img_bytes = _make_image_bytes("PNG")

    # Unauthenticated -> 401
    resp = client.post("/api/v1/uploads/images", files={"file": ("test.png", img_bytes, "image/png")})
    assert resp.status_code == 401

    # Student (role user) -> 403
    resp = client.post(
        "/api/v1/uploads/images",
        headers={"Authorization": f"Bearer {student_token}"},
        files={"file": ("test.png", img_bytes, "image/png")},
    )
    assert resp.status_code == 403

    # Admin -> 201
    resp = client.post(
        "/api/v1/uploads/images",
        headers={"Authorization": f"Bearer {admin_token}"},
        files={"file": ("test.png", img_bytes, "image/png")},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "url" in data
    assert data["width"] == 100
    assert data["height"] == 100


def test_upload_rejects_svg(client, db_session):
    seed(db_session, admin_password="admin-pass-123")
    admin_token = _get_token(client, ADMIN_EMAIL, "admin-pass-123")

    svg_content = b"<svg xmlns='http://www.w3.org/2000/svg'><circle r='50'/></svg>"
    resp = client.post(
        "/api/v1/uploads/images",
        headers={"Authorization": f"Bearer {admin_token}"},
        files={"file": ("malicious.svg", svg_content, "image/svg+xml")},
    )
    assert resp.status_code == 422
    assert "SVG and non-images are rejected" in resp.json()["detail"]


def test_upload_rejects_fake_extension(client, db_session):
    seed(db_session, admin_password="admin-pass-123")
    admin_token = _get_token(client, ADMIN_EMAIL, "admin-pass-123")

    fake_content = b"This is a text file renamed to .png"
    resp = client.post(
        "/api/v1/uploads/images",
        headers={"Authorization": f"Bearer {admin_token}"},
        files={"file": ("fake.png", fake_content, "image/png")},
    )
    assert resp.status_code == 422


def test_upload_rejects_oversized_file(client, db_session):
    seed(db_session, admin_password="admin-pass-123")
    admin_token = _get_token(client, ADMIN_EMAIL, "admin-pass-123")

    # 5.1 MB dummy content
    oversized = b"\x89PNG\r\n\x1a\n" + b"0" * (5 * 1024 * 1024 + 100)
    resp = client.post(
        "/api/v1/uploads/images",
        headers={"Authorization": f"Bearer {admin_token}"},
        files={"file": ("huge.png", oversized, "image/png")},
    )
    assert resp.status_code == 422
    assert "exceeds maximum size" in resp.json()["detail"]
