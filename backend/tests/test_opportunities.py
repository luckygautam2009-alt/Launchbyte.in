import uuid
from datetime import datetime, timedelta, timezone

from app.models import AuditLog, Opportunity, Organization
from app.models.enums import LocationType, OpportunityStatus, OpportunityType, UserRole
from app.models.users import User

API = "/api/v1"
PW = "supersecret"
NOW = datetime.now(timezone.utc)


def make_org(db, name="Acme"):
    org = Organization(name=name, slug=name.lower())
    db.add(org)
    db.commit()
    return org


def make_opp(db, org, title, **kw):
    kw.setdefault("status", OpportunityStatus.PUBLISHED)
    kw.setdefault("type", OpportunityType.INTERNSHIP)
    kw.setdefault("deadline_at", NOW + timedelta(days=10))
    opp = Opportunity(organization_id=org.id, title=title, slug=title.lower().replace(" ", "-"), **kw)
    db.add(opp)
    db.commit()
    return opp


def auth_header(client, db, email="admin@example.com", role=UserRole.ADMIN):
    client.post(f"{API}/users", json={"email": email, "password": PW})
    user = db.query(User).filter_by(email=email).one()
    user.role = role
    db.commit()
    token = client.post(f"{API}/auth/login", data={"username": email, "password": PW}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def payload(org, **kw):
    base = {"organization_id": str(org.id), "title": "Summer Internship", "type": "internship"}
    base.update(kw)
    return base


def titles(resp):
    return [i["title"] for i in resp.json()["items"]]


# ---------------- public ----------------
def test_public_list_shows_only_live_published(client, db_session):
    org = make_org(db_session)
    make_opp(db_session, org, "Live One")
    make_opp(db_session, org, "Draft One", status=OpportunityStatus.DRAFT)
    make_opp(db_session, org, "Deleted One", deleted_at=NOW)
    make_opp(db_session, org, "Expired One", deadline_at=NOW - timedelta(days=1))
    make_opp(db_session, org, "Rolling One", deadline_at=NOW - timedelta(days=1), is_rolling=True)
    r = client.get(f"{API}/opportunities")
    assert set(titles(r)) == {"Live One", "Rolling One"}
    assert r.json()["total"] == 2
    r = client.get(f"{API}/opportunities", params={"include_expired": True})
    assert set(titles(r)) == {"Live One", "Rolling One", "Expired One"}


def test_public_filters_and_search(client, db_session):
    org = make_org(db_session)
    make_opp(db_session, org, "Python Intern", location_type=LocationType.REMOTE, country_code="IN")
    make_opp(db_session, org, "Hack Night", type=OpportunityType.HACKATHON, country_code="US")
    get = lambda **p: client.get(f"{API}/opportunities", params=p)  # noqa: E731
    assert titles(get(type="hackathon")) == ["Hack Night"]
    assert titles(get(q="PYTHON")) == ["Python Intern"]
    assert titles(get(country_code="in")) == ["Python Intern"]
    assert titles(get(location_type="remote")) == ["Python Intern"]
    assert get(q="%").json()["total"] == 0
    assert get(type="bogus").status_code == 422


def test_public_pagination_and_deadline_sort(client, db_session):
    org = make_org(db_session)
    make_opp(db_session, org, "Three", deadline_at=NOW + timedelta(days=3))
    make_opp(db_session, org, "One", deadline_at=NOW + timedelta(days=1))
    make_opp(db_session, org, "Two", deadline_at=NOW + timedelta(days=2))
    r = client.get(f"{API}/opportunities", params={"limit": 2})
    assert titles(r) == ["One", "Two"] and r.json()["total"] == 3
    r = client.get(f"{API}/opportunities", params={"limit": 2, "offset": 2})
    assert titles(r) == ["Three"]


def test_public_detail_by_slug(client, db_session):
    org = make_org(db_session)
    make_opp(db_session, org, "Live One", description="Details here")
    make_opp(db_session, org, "Draft One", status=OpportunityStatus.DRAFT)
    make_opp(db_session, org, "Deleted One", deleted_at=NOW)
    ok = client.get(f"{API}/opportunities/live-one")
    assert ok.status_code == 200 and ok.json()["description"] == "Details here"
    for slug in ("draft-one", "deleted-one", "nope"):
        assert client.get(f"{API}/opportunities/{slug}").status_code == 404


# ---------------- admin ----------------
def test_admin_endpoints_require_admin_role(client, db_session):
    url = f"{API}/admin/opportunities"
    assert client.get(url).status_code == 401
    user_h = auth_header(client, db_session, "u@example.com", UserRole.USER)
    org_h = auth_header(client, db_session, "o@example.com", UserRole.ORGANIZER)
    assert client.get(url, headers=user_h).status_code == 403
    assert client.get(url, headers=org_h).status_code == 403
    assert client.get(url, headers=auth_header(client, db_session)).status_code == 200


def test_admin_create_publishes_tags_and_writes_audit(client, db_session):
    org, h = make_org(db_session), None
    h = auth_header(client, db_session)
    r = client.post(
        f"{API}/admin/opportunities",
        headers=h,
        json=payload(org, publish=True, country_code="in", tags=["Python", "AI", "python"]),
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["slug"] == "summer-internship"
    assert body["status"] == "published" and body["published_at"]
    assert body["country_code"] == "IN"
    assert sorted(t["slug"] for t in body["tags"]) == ["ai", "python"]
    assert client.get(f"{API}/opportunities/summer-internship").status_code == 200
    log = db_session.query(AuditLog).filter_by(action="opportunity.create").one()
    assert log.entity_id == body["id"] and log.actor_id is not None


def test_admin_create_generates_unique_slugs(client, db_session):
    org, h = make_org(db_session), auth_header(client, db_session)
    url = f"{API}/admin/opportunities"
    s1 = client.post(url, headers=h, json=payload(org)).json()["slug"]
    s2 = client.post(url, headers=h, json=payload(org)).json()["slug"]
    assert (s1, s2) == ("summer-internship", "summer-internship-2")


def test_admin_create_validation(client, db_session):
    org, h = make_org(db_session), auth_header(client, db_session)
    url = f"{API}/admin/opportunities"
    assert client.post(url, headers=h, json=payload(org, organization_id=str(uuid.uuid4()))).status_code == 422
    assert client.post(url, headers=h, json=payload(org, compensation_min=500, compensation_max=100)).status_code == 422
    assert client.post(url, headers=h, json=payload(org, country_code="india")).status_code == 422
    assert client.post(url, headers=h, json=payload(org, title="x")).status_code == 422
    assert client.post(url, headers=h, json=payload(org, application_url="ftp://x")).status_code == 422
    assert db_session.query(Opportunity).count() == 0


def test_admin_update_logs_diff_and_replaces_tags(client, db_session):
    org, h = make_org(db_session), auth_header(client, db_session)
    url = f"{API}/admin/opportunities"
    created = client.post(url, headers=h, json=payload(org, tags=["old"])).json()
    one = f"{url}/{created['id']}"
    r = client.patch(one, headers=h, json={"title": "New Title", "tags": ["go"]})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["title"] == "New Title" and body["slug"] == "summer-internship"
    assert [t["slug"] for t in body["tags"]] == ["go"]
    log = db_session.query(AuditLog).filter_by(action="opportunity.update").one()
    assert log.changes["title"] == ["Summer Internship", "New Title"]
    assert client.patch(one, headers=h, json={"title": None}).status_code == 422
    assert client.patch(one, headers=h, json={"compensation_min": 9, "compensation_max": 1}).status_code == 422
    assert client.get(one, headers=h).json()["compensation_min"] is None


def test_admin_status_change_and_soft_delete(client, db_session):
    org, h = make_org(db_session), auth_header(client, db_session)
    url = f"{API}/admin/opportunities"
    created = client.post(url, headers=h, json=payload(org)).json()
    one, pub = f"{url}/{created['id']}", f"{API}/opportunities/{created['slug']}"
    assert client.get(pub).status_code == 404
    r = client.post(f"{one}/status", headers=h, json={"status": "published"})
    assert r.status_code == 200 and r.json()["published_at"] is not None
    assert client.get(pub).status_code == 200
    assert client.delete(one, headers=h).status_code == 204
    assert client.get(pub).status_code == 404
    assert client.get(one, headers=h).status_code == 404
    assert db_session.get(Opportunity, uuid.UUID(created["id"])).deleted_at is not None
