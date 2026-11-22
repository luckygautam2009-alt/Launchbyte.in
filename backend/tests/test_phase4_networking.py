import json
import time
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.models.enums import UserRole
from app.models.networking import (
    Connection,
    ConnectionStatus,
    Conversation,
    ConversationParticipant,
    ConversationType,
    Message,
    Project,
    ProjectStatus,
    ProjectVisibility,
    Team,
    TeamMember,
    TeamMemberRole,
    UserBlock,
)
from app.models.profiles import UserProfile
from app.models.users import User


@pytest.fixture
def users_a_b_c_d(db_session):
    """Create 4 verified users: Alice, Bob, Charlie, and Dave."""
    def _create(email, name, handle):
        u = User(
            email=email,
            handle=handle,
            full_name=name,
            hashed_password="hashed_dummy_pw",
            role=UserRole.USER,
            is_email_verified=True,
            is_active=True,
        )
        db_session.add(u)
        db_session.flush()
        # Add profile
        prof = UserProfile(
            user_id=u.id,
            institution="BITS Pilani",
            skills=["python", "fastapi", "react"],
        )
        db_session.add(prof)
        return u

    a = _create("alice@example.com", "Alice", "alice")
    b = _create("bob@example.com", "Bob", "bob")
    c = _create("charlie@example.com", "Charlie", "charlie")
    d = _create("dave@example.com", "Dave", "dave")
    db_session.commit()
    return a, b, c, d


def auth_headers(user: User) -> dict:
    token = create_access_token(str(user.id), role=user.role.value, token_version=user.token_version)
    return {"Authorization": f"Bearer {token}"}


# ==========================================
# 1. CONNECTIONS TESTS
# ==========================================


def test_connection_request_and_canonical_pair(client: TestClient, db_session, users_a_b_c_d):
    alice, bob, charlie, dave = users_a_b_c_d

    # Alice requests Bob
    resp = client.post(
        "/api/v1/connections/requests",
        json={"handle": "bob", "message": "Hey Bob let's connect!"},
        headers=auth_headers(alice),
    )
    assert resp.status_code == 201
    conn_id = resp.json()["id"]

    # Duplicate request Alice -> Bob should be rejected with 409
    resp_dupe = client.post(
        "/api/v1/connections/requests",
        json={"handle": "bob"},
        headers=auth_headers(alice),
    )
    assert resp_dupe.status_code == 409

    # Reverse duplicate Bob -> Alice should be rejected with 409 (canonical index / existing request)
    resp_rev = client.post(
        "/api/v1/connections/requests",
        json={"handle": "alice"},
        headers=auth_headers(bob),
    )
    assert resp_rev.status_code == 409

    # Bob views incoming requests
    resp_inc = client.get("/api/v1/connections/requests?direction=incoming", headers=auth_headers(bob))
    assert resp_inc.status_code == 200
    assert len(resp_inc.json()) == 1
    assert resp_inc.json()[0]["requester_id"] == str(alice.id)

    # Bob accepts connection
    resp_acc = client.post(f"/api/v1/connections/requests/{conn_id}/accept", headers=auth_headers(bob))
    assert resp_acc.status_code == 200
    assert resp_acc.json()["status"] == "accepted"

    # Both Alice and Bob see each other in connections
    resp_alice_conns = client.get("/api/v1/connections", headers=auth_headers(alice))
    assert resp_alice_conns.status_code == 200
    assert resp_alice_conns.json()["total"] == 1
    assert resp_alice_conns.json()["items"][0]["other_user"]["handle"] == "bob"

    resp_bob_conns = client.get("/api/v1/connections", headers=auth_headers(bob))
    assert resp_bob_conns.status_code == 200
    assert resp_bob_conns.json()["total"] == 1
    assert resp_bob_conns.json()["items"][0]["other_user"]["handle"] == "alice"


def test_cannot_connect_self_or_unverified(client: TestClient, db_session, users_a_b_c_d):
    alice, _, _, _ = users_a_b_c_d

    # Self connection
    resp = client.post(
        "/api/v1/connections/requests",
        json={"handle": "alice"},
        headers=auth_headers(alice),
    )
    assert resp.status_code == 400

    # Unverified email
    alice.is_email_verified = False
    db_session.commit()
    resp_unver = client.post(
        "/api/v1/connections/requests",
        json={"handle": "bob"},
        headers=auth_headers(alice),
    )
    assert resp_unver.status_code == 400


# ==========================================
# 2. BLOCKING & PRIVACY TESTS
# ==========================================


def test_blocking_hides_profiles_and_prevents_messaging(client: TestClient, db_session, users_a_b_c_d):
    alice, bob, _, _ = users_a_b_c_d

    # Connect first
    client.post("/api/v1/connections/requests", json={"handle": "bob"}, headers=auth_headers(alice))
    inc = client.get("/api/v1/connections/requests?direction=incoming", headers=auth_headers(bob)).json()
    client.post(f"/api/v1/connections/requests/{inc[0]['id']}/accept", headers=auth_headers(bob))

    # Bob blocks Alice
    resp_block = client.post(f"/api/v1/blocks/{alice.id}", headers=auth_headers(bob))
    assert resp_block.status_code == 201

    # Connection must be removed automatically
    resp_bob_conns = client.get("/api/v1/connections", headers=auth_headers(bob))
    assert resp_bob_conns.json()["total"] == 0

    resp_alice_conns = client.get("/api/v1/connections", headers=auth_headers(alice))
    assert resp_alice_conns.json()["total"] == 0

    # Alice tries to request connection with Bob: returns generic pending without revealing block
    resp_req = client.post("/api/v1/connections/requests", json={"handle": "bob"}, headers=auth_headers(alice))
    assert resp_req.status_code == 201
    # But Bob does NOT actually receive any incoming request!
    inc_after = client.get("/api/v1/connections/requests?direction=incoming", headers=auth_headers(bob)).json()
    assert len(inc_after) == 0

    # Direct conversation between blocked users is forbidden
    resp_dm = client.post("/api/v1/conversations/direct", json={"user_id": str(bob.id)}, headers=auth_headers(alice))
    assert resp_dm.status_code == 403


# ==========================================
# 3. MESSAGING, IDEMPOTENCY & REST CHAT
# ==========================================


def test_direct_messaging_lifecycle_and_idempotency(client: TestClient, db_session, users_a_b_c_d):
    alice, bob, charlie, _ = users_a_b_c_d

    # Alice and Bob connect
    client.post("/api/v1/connections/requests", json={"handle": "bob"}, headers=auth_headers(alice))
    inc = client.get("/api/v1/connections/requests?direction=incoming", headers=auth_headers(bob)).json()
    client.post(f"/api/v1/connections/requests/{inc[0]['id']}/accept", headers=auth_headers(bob))

    # Alice tries to message Charlie (not connected): forbidden
    resp_forbidden = client.post("/api/v1/conversations/direct", json={"user_id": str(charlie.id)}, headers=auth_headers(alice))
    assert resp_forbidden.status_code == 403

    # Alice starts direct conversation with Bob
    resp_conv = client.post("/api/v1/conversations/direct", json={"user_id": str(bob.id)}, headers=auth_headers(alice))
    assert resp_conv.status_code == 201
    conv_id = resp_conv.json()["id"]

    # Charlie (not participant) cannot view or post in conversation
    resp_eavesdrop = client.get(f"/api/v1/conversations/{conv_id}/messages", headers=auth_headers(charlie))
    assert resp_eavesdrop.status_code == 404

    resp_trespass = client.post(f"/api/v1/conversations/{conv_id}/messages", json={"body": "I am eavesdropping"}, headers=auth_headers(charlie))
    assert resp_trespass.status_code == 404

    # Alice sends message with client_msg_id
    client_id = "test-uuid-12345"
    resp_msg1 = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"body": "Hello Bob! <script>alert(1)</script>", "client_msg_id": client_id},
        headers=auth_headers(alice),
    )
    assert resp_msg1.status_code == 201
    msg1 = resp_msg1.json()
    # Check XSS stripped
    assert "<script>" not in msg1["body"]
    assert "Hello Bob!" in msg1["body"]

    # Retry sending with SAME client_msg_id (idempotency)
    resp_retry = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"body": "Hello Bob! <script>alert(1)</script>", "client_msg_id": client_id},
        headers=auth_headers(alice),
    )
    assert resp_retry.status_code == 201
    assert resp_retry.json()["id"] == msg1["id"]  # Returns existing message, no duplicate!

    # Alice edits message
    resp_edit = client.patch(
        f"/api/v1/messages/{msg1['id']}",
        json={"body": "Hello Bob! (edited)"},
        headers=auth_headers(alice),
    )
    assert resp_edit.status_code == 200
    assert resp_edit.json()["body"] == "Hello Bob! (edited)"

    # Bob cannot edit Alice's message
    resp_edit_unauth = client.patch(
        f"/api/v1/messages/{msg1['id']}",
        json={"body": "Hacked body"},
        headers=auth_headers(bob),
    )
    assert resp_edit_unauth.status_code == 403

    # Bob marks conversation as read
    resp_read = client.post(f"/api/v1/conversations/{conv_id}/read", headers=auth_headers(bob))
    assert resp_read.status_code == 200

    # Bob reports message
    resp_rep = client.post(
        f"/api/v1/messages/{msg1['id']}/report",
        json={"reason": "Spam / inappropriate"},
        headers=auth_headers(bob),
    )
    assert resp_rep.status_code == 201

    # Alice deletes message
    resp_del = client.delete(f"/api/v1/messages/{msg1['id']}", headers=auth_headers(alice))
    assert resp_del.status_code == 204

    # Message shows deleted text
    resp_msgs = client.get(f"/api/v1/conversations/{conv_id}/messages", headers=auth_headers(bob))
    assert resp_msgs.status_code == 200
    assert resp_msgs.json()["items"][0]["body"] == "This message was deleted"
    assert resp_msgs.json()["items"][0]["is_deleted"] is True


# ==========================================
# 4. TEAMS & TEAM CHAT SYNC
# ==========================================


def test_team_creation_and_chat_sync(client: TestClient, db_session, users_a_b_c_d):
    alice, bob, charlie, _ = users_a_b_c_d

    # Alice creates a team
    resp_team = client.post(
        "/api/v1/teams",
        json={"name": "Quantum Hackers", "description": "Winning hackathons together"},
        headers=auth_headers(alice),
    )
    assert resp_team.status_code == 201
    team = resp_team.json()
    team_id = team["id"]
    conv_id = team["conversation_id"]
    assert conv_id is not None

    # Alice is automatically in the conversation
    resp_convs = client.get("/api/v1/conversations", headers=auth_headers(alice)).json()
    assert any(c["id"] == conv_id for c in resp_convs)

    # Bob is not yet in team or conversation
    resp_bob_convs = client.get("/api/v1/conversations", headers=auth_headers(bob)).json()
    assert not any(c["id"] == conv_id for c in resp_bob_convs)

    # Alice adds Bob to team
    resp_add = client.post(
        f"/api/v1/teams/{team_id}/members",
        json={"user_id": str(bob.id), "role": "member"},
        headers=auth_headers(alice),
    )
    assert resp_add.status_code == 201

    # Now Bob automatically has access to team conversation!
    resp_bob_msgs = client.get(f"/api/v1/conversations/{conv_id}/messages", headers=auth_headers(bob))
    assert resp_bob_msgs.status_code == 200

    # Bob posts in team chat
    resp_post = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"body": "Hello team Quantum!"},
        headers=auth_headers(bob),
    )
    assert resp_post.status_code == 201

    # Alice removes Bob from team
    resp_rem = client.delete(f"/api/v1/teams/{team_id}/members/{bob.id}", headers=auth_headers(alice))
    assert resp_rem.status_code == 204

    # Bob immediately loses access to team conversation!
    resp_bob_revoked = client.get(f"/api/v1/conversations/{conv_id}/messages", headers=auth_headers(bob))
    assert resp_bob_revoked.status_code == 404


# ==========================================
# 5. WEBSOCKET & TICKET TESTS
# ==========================================


def test_websocket_ticket_exchange_and_messaging(client: TestClient, db_session, users_a_b_c_d):
    alice, bob, _, _ = users_a_b_c_d

    # Alice and Bob connect
    client.post("/api/v1/connections/requests", json={"handle": "bob"}, headers=auth_headers(alice))
    inc = client.get("/api/v1/connections/requests?direction=incoming", headers=auth_headers(bob)).json()
    client.post(f"/api/v1/connections/requests/{inc[0]['id']}/accept", headers=auth_headers(bob))

    resp_conv = client.post("/api/v1/conversations/direct", json={"user_id": str(bob.id)}, headers=auth_headers(alice))
    conv_id = resp_conv.json()["id"]

    # 1. Request Ticket
    resp_ticket = client.post("/api/v1/ws/ticket", headers=auth_headers(alice))
    assert resp_ticket.status_code == 200
    ticket = resp_ticket.json()["ticket"]
    assert ticket

    # 2. Reusing or invalid ticket rejected
    with pytest.raises(Exception):
        with client.websocket_connect("/ws?ticket=invalid_ticket") as ws:
            pass

    # 3. Connect Alice via WS using valid ticket
    with client.websocket_connect(f"/ws?ticket={ticket}") as ws:
        init_data = json.loads(ws.receive_text())
        assert init_data["event"] == "connected"

        # Ping / Pong
        ws.send_text(json.dumps({"action": "ping"}))
        pong = json.loads(ws.receive_text())
        assert pong["event"] == "pong"

        # Send message via WebSocket
        ws.send_text(json.dumps({
            "action": "send_message",
            "conversation_id": conv_id,
            "body": "Hello over WebSocket!",
            "client_msg_id": "ws-client-1",
        }))

        # Message is delivered and broadcasts
        msg_event = json.loads(ws.receive_text())
        assert msg_event["event"] == "message.new"
        assert msg_event["data"]["body"] == "Hello over WebSocket!"


# ==========================================
# 6. PROJECTS & COLLABORATION TESTS
# ==========================================


def test_projects_crud_visibility_and_collaboration(client: TestClient, db_session, users_a_b_c_d):
    alice, bob, charlie, _ = users_a_b_c_d

    # Alice creates a project
    resp_proj = client.post(
        "/api/v1/projects",
        json={
            "title": "Decentralized AI Agents",
            "summary": "Autonomous AI agents on web3",
            "description": "## Overview\nBuilding autonomous agents.",
            "repo_url": "https://github.com/alice/decentralized-ai",
            "tech_stack": ["python", "solidity", "fastapi"],
            "looking_for": ["Frontend Dev", "Smart Contract Auditor"],
            "visibility": "public",
        },
        headers=auth_headers(alice),
    )
    assert resp_proj.status_code == 201
    proj = resp_proj.json()
    proj_id = proj["id"]
    slug = proj["slug"]

    # Non-https URLs must be rejected
    resp_bad_url = client.post(
        "/api/v1/projects",
        json={"title": "Bad URL", "repo_url": "ftp://badurl.com"},
        headers=auth_headers(alice),
    )
    assert resp_bad_url.status_code in (400, 422)

    # Bob views public project
    resp_view = client.get(f"/api/v1/projects/{slug}")
    assert resp_view.status_code == 200
    assert resp_view.json()["title"] == "Decentralized AI Agents"

    # Bob requests to collaborate
    resp_collab = client.post(
        f"/api/v1/projects/{proj_id}/collab-requests",
        json={"message": "I have 3 years of Solidity experience!"},
        headers=auth_headers(bob),
    )
    assert resp_collab.status_code == 201
    req_id = resp_collab.json()["id"]

    # Duplicate collab request rejected
    resp_dupe = client.post(
        f"/api/v1/projects/{proj_id}/collab-requests",
        json={"message": "Second attempt"},
        headers=auth_headers(bob),
    )
    assert resp_dupe.status_code == 409

    # Alice accepts Bob as collaborator
    resp_acc = client.post(
        f"/api/v1/projects/{proj_id}/collab-requests/{req_id}/accept",
        headers=auth_headers(alice),
    )
    assert resp_acc.status_code == 200

    # Project detail shows Bob in members
    resp_detail = client.get(f"/api/v1/projects/{slug}").json()
    assert any(m["user_id"] == str(bob.id) for m in resp_detail["members"])

    # Private project visibility test
    resp_priv = client.post(
        "/api/v1/projects",
        json={"title": "Super Secret Project", "visibility": "private"},
        headers=auth_headers(alice),
    )
    priv_slug = resp_priv.json()["slug"]

    # Charlie (not member) cannot find or see private project
    resp_charlie_priv = client.get(f"/api/v1/projects/{priv_slug}", headers=auth_headers(charlie))
    assert resp_charlie_priv.status_code == 404

    # Search list also does NOT leak private project to Charlie
    resp_search = client.get("/api/v1/projects?q=Super+Secret", headers=auth_headers(charlie)).json()
    assert resp_search["total"] == 0


# ==========================================
# 7. NETWORK SUGGESTIONS TEST
# ==========================================


def test_network_suggestions_with_reason_chips(client: TestClient, db_session, users_a_b_c_d):
    alice, bob, charlie, dave = users_a_b_c_d

    # Fetch suggestions for Alice (Charlie and Dave share 'BITS Pilani' institution and 'python' skill)
    resp = client.get("/api/v1/network/suggestions", headers=auth_headers(alice))
    assert resp.status_code == 200
    suggestions = resp.json()
    assert len(suggestions) > 0
    # Verify reason chip is present
    first_sug = suggestions[0]
    assert "reason" in first_sug
    assert len(first_sug["reason"]) > 0
