from app.models.networking import Project, ProjectStatus, ProjectVisibility
from app.models.users import User


def _create_verified_user_headers(client, db_session, email: str = "proj_owner@example.com"):
    password = "StrongPassword123!"
    client.post(
        "/api/v1/users",
        json={"email": email, "password": password, "full_name": "Proj Owner", "handle": "proj_owner"},
    )
    user = db_session.query(User).filter(User.email == email).first()
    user.is_email_verified = True
    db_session.commit()
    login = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    return user, {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_project_requires_valid_github_repo_url_and_cannot_be_cleared(client, db_session):
    user, headers = _create_verified_user_headers(client, db_session)

    # Missing repo_url -> 422
    r_missing = client.post("/api/v1/projects", json={"title": "No Repo Project"}, headers=headers)
    assert r_missing.status_code == 422

    # Non-GitHub or incomplete GitHub URL -> 422
    for bad in [
        "https://gitlab.com/org/repo",
        "https://github.com/onlyowner",
        "http://github.com/owner/repo",
        "not-a-url",
    ]:
        r_bad = client.post(
            "/api/v1/projects",
            json={"title": "Bad Repo", "repo_url": bad},
            headers=headers,
        )
        assert r_bad.status_code == 422

    # Valid GitHub URL -> 201
    r_ok = client.post(
        "/api/v1/projects",
        json={"title": "Valid Repo Project", "repo_url": "https://github.com/launchbyte/core/"},
        headers=headers,
    )
    assert r_ok.status_code == 201
    proj = r_ok.json()
    assert proj["repo_url"] == "https://github.com/launchbyte/core"

    # Cannot clear repo_url via PATCH
    r_clear_null = client.patch(
        f"/api/v1/projects/{proj['id']}",
        json={"repo_url": None},
        headers=headers,
    )
    assert r_clear_null.status_code == 422

    r_clear_empty = client.patch(
        f"/api/v1/projects/{proj['id']}",
        json={"repo_url": ""},
        headers=headers,
    )
    assert r_clear_empty.status_code == 422

    # Legacy DB row with null repo_url still reads cleanly without breaking
    legacy = Project(
        title="Legacy Null Repo",
        slug="legacy-null-repo",
        repo_url=None,
        status=ProjectStatus.IDEA,
        visibility=ProjectVisibility.PUBLIC,
        owner_id=user.id,
    )
    db_session.add(legacy)
    db_session.commit()

    r_list = client.get("/api/v1/projects")
    assert r_list.status_code == 200
    assert any(p["slug"] == "legacy-null-repo" and p["repo_url"] is None for p in r_list.json()["items"])

    r_detail = client.get("/api/v1/projects/legacy-null-repo")
    assert r_detail.status_code == 200
    assert r_detail.json()["repo_url"] is None
