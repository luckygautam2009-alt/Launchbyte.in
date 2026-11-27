"""Regression tests for: chat crash (missing `participants`), message paging alias, one-click event review."""
import re
import uuid
from datetime import datetime, timedelta, timezone

from app.core.action_tokens import create_action_token, verify_action_token
from app.core.security import create_access_token
from app.models.enums import UserRole
from app.models.networking import Conversation, ConversationParticipant, ConversationType, Message
from app.models.submissions import PublicEventSubmission
from app.models.users import User


def _user(db, email, handle, name):
    u = User(
        email=email, handle=handle, full_name=name, hashed_password="x",
        role=UserRole.USER, is_email_verified=True, is_active=True,
    )
    db.add(u)
    db.flush()
    return u


def _auth(u):
    t = create_access_token(str(u.id), role=u.role.value, token_version=u.token_version)
    return {"Authorization": f"Bearer {t}"}


def test_conversations_include_participants_and_paging_cursor(client, db_session):
    a = _user(db_session, "a@example.com", "alice", "Alice")
    b = _user(db_session, "b@example.com", "bob", "Bob")
    u1, u2 = sorted([a.id, b.id])
    conv = Conversation(type=ConversationType.DIRECT, user_a_id=u1, user_b_id=u2)
    db_session.add(conv)
    db_session.flush()
    db_session.add_all([
        ConversationParticipant(conversation_id=conv.id, user_id=a.id),
        ConversationParticipant(conversation_id=conv.id, user_id=b.id),
    ])
    base = datetime.now(timezone.utc) - timedelta(minutes=5)
    for i in range(5):
        db_session.add(Message(conversation_id=conv.id, sender_id=b.id, body=f"m{i}", created_at=base + timedelta(seconds=i)))
    db_session.commit()

    r = client.get("/api/v1/conversations", headers=_auth(a))
    assert r.status_code == 200
    item = r.json()[0]
    # The UI does `conv.participants.length` / `.find(...)` - it must always be a list.
    assert isinstance(item["participants"], list) and len(item["participants"]) == 2
    assert {p["user_handle"] for p in item["participants"]} == {"alice", "bob"}
    assert item["title"] == "Bob"
    assert item["unread_count"] == 5
    assert item["last_message"]["body"] == "m4"

    page1 = client.get(f"/api/v1/conversations/{conv.id}/messages?limit=2", headers=_auth(a)).json()
    assert page1["has_more"] is True and page1["next_cursor"]
    # frontend sends the cursor as `before`; `cursor` is accepted as an alias
    for key in ("before", "cursor"):
        page2 = client.get(
            f"/api/v1/conversations/{conv.id}/messages",
            params={"limit": 2, key: page1["next_cursor"]},
            headers=_auth(a),
        ).json()
        assert [m["body"] for m in page2["items"]] == ["m1", "m2"]


def test_action_token_roundtrip_and_tamper():
    sid = str(uuid.uuid4())
    tok = create_action_token("host_event_review", sid)
    assert verify_action_token(tok, "host_event_review") == sid
    assert verify_action_token(tok, "something_else") is None
    assert verify_action_token(tok[:-3] + "AAA", "host_event_review") is None
    assert verify_action_token(create_action_token("host_event_review", sid, ttl_seconds=-1), "host_event_review") is None


def _submission(db):
    sub = PublicEventSubmission(
        event_name="Review Me", organizer_name="Org", organizer_email="org@example.com",
        organizer_organization="Org Inc", description="desc " * 10, category="Hackathon",
        event_format="online", event_date=datetime.now(timezone.utc) + timedelta(days=10),
        registration_url="https://example.com/r", contact_info="org@example.com", status="pending",
    )
    db.add(sub)
    db.commit()
    return sub


def test_email_review_link_get_is_read_only_and_post_decides(client, db_session, monkeypatch):
    sent = []
    from app.services.email.dispatcher import EmailDeliveryResult
    monkeypatch.setattr(
        "app.routers.public_submissions.send_user_notification",
        lambda **kw: sent.append(kw) or EmailDeliveryResult(sent=True),
    )
    sub = _submission(db_session)
    token = create_action_token("host_event_review", str(sub.id))
    url = f"/api/v1/public/host-event/review/{token}"

    page = client.get(url)
    assert page.status_code == 200 and "Approve" in page.text and "Reject" in page.text
    db_session.refresh(sub)
    assert sub.status == "pending"  # a GET (e.g. email link scanner) must never change state

    done = client.post(url, data={"decision": "approve"})
    assert done.status_code == 200
    db_session.refresh(sub)
    assert sub.status == "approved"
    assert sent and sent[0]["to_email"] == "org@example.com"

    again = client.post(url, data={"decision": "reject"})
    db_session.refresh(sub)
    assert sub.status == "approved"  # already decided: second click is a no-op
    assert "already" in again.text.lower()


def test_email_review_link_rejects_bad_token(client):
    r = client.get("/api/v1/public/host-event/review/not-a-real-token")
    assert r.status_code == 400
