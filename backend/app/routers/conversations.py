import asyncio
import json
import logging
import uuid
from datetime import datetime
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
)

from app.core.config import get_settings
from app.core.rate_limit import rate_limit
from app.core.websocket import ticket_store, ws_manager
from app.db.session import SessionLocal
from app.dependencies.auth import CurrentUser
from app.dependencies.db import DBSession
from app.models.networking import ConversationParticipant
from app.models.users import User
from app.schemas.networking import (
    ConversationMessagesPage,
    ConversationRead,
    DirectConversationCreate,
    MessageCreate,
    MessageRead,
    MessageReportCreate,
    MessageReportRead,
    MessageUpdate,
    WSTicketResponse,
)
from app.services.networking.messaging import (
    MessagingError,
    create_or_get_direct_conversation,
    delete_message,
    edit_message,
    get_conversation_messages,
    list_conversations,
    mark_conversation_read,
    report_message,
    send_message,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["messaging"])


@router.get("/conversations", response_model=list[ConversationRead])
def get_user_conversations(
    db: DBSession,
    current_user: CurrentUser,
):
    return list_conversations(db, current_user)


@router.post("/conversations/direct", response_model=ConversationRead, status_code=status.HTTP_201_CREATED)
def start_direct_conversation(
    payload: DirectConversationCreate,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        conv = create_or_get_direct_conversation(db, current_user, payload.user_id)
        # Fetch formatted conversation
        all_convs = list_conversations(db, current_user)
        for c in all_convs:
            if c.id == conv.id:
                return c
        return ConversationRead(
            id=conv.id,
            type=conv.type,
            title=conv.title,
            team_id=conv.team_id,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
        )
    except MessagingError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.get("/conversations/{conversation_id}/messages", response_model=ConversationMessagesPage)
def get_messages(
    conversation_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
    before: datetime | None = Query(default=None),
    cursor: datetime | None = Query(default=None, description="Alias of `before` (ISO timestamp from next_cursor)"),
    limit: int = Query(default=50, ge=1, le=100),
):
    try:
        return get_conversation_messages(
            db, current_user, conversation_id, before=before or cursor, limit=limit
        )
    except MessagingError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(max_requests=40, window_seconds=60))],
)
def post_message(
    conversation_id: uuid.UUID,
    payload: MessageCreate,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return send_message(
            db,
            current_user,
            conversation_id,
            payload.body,
            client_msg_id=payload.client_msg_id,
        )
    except MessagingError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.patch("/messages/{message_id}", response_model=MessageRead)
def patch_message(
    message_id: uuid.UUID,
    payload: MessageUpdate,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        return edit_message(db, current_user, message_id, payload.body)
    except MessagingError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_message(
    message_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        delete_message(db, current_user, message_id)
    except MessagingError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.post("/conversations/{conversation_id}/read", status_code=status.HTTP_200_OK)
def read_conversation(
    conversation_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
    message_id: uuid.UUID | None = None,
):
    try:
        mark_conversation_read(db, current_user, conversation_id, message_id=message_id)
        return {"status": "ok"}
    except MessagingError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


@router.post("/messages/{message_id}/report", response_model=MessageReportRead, status_code=status.HTTP_201_CREATED)
def report(
    message_id: uuid.UUID,
    payload: MessageReportCreate,
    db: DBSession,
    current_user: CurrentUser,
):
    try:
        rep = report_message(db, current_user, message_id, payload.reason)
        return MessageReportRead(
            id=rep.id,
            message_id=rep.message_id,
            reporter_id=rep.reporter_id,
            reason=rep.reason,
            status=rep.status,
            created_at=rep.created_at,
            reporter_email=current_user.email,
        )
    except MessagingError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}},
        )


# ==========================================
# WEBSOCKET & TICKETS
# ==========================================


@router.post(
    "/ws/ticket",
    response_model=WSTicketResponse,
    dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60))],
)
def get_ws_ticket(
    current_user: CurrentUser,
):
    ticket = ticket_store.create_ticket(current_user.id)
    return WSTicketResponse(ticket=ticket, expires_in=60)


def _ws_send_message(user_id: uuid.UUID, conv_id: uuid.UUID, body: str, client_msg_id: str | None) -> str | None:
    """Runs in a worker thread. Returns an error message or None."""
    with SessionLocal() as db:
        user = db.get(User, user_id)
        if not user or not user.is_active:
            return "User inactive"
        try:
            send_message(db, user, conv_id, body, client_msg_id=client_msg_id)
        except MessagingError as me:
            db.rollback()
            return me.message
        except Exception:
            db.rollback()
            logger.exception("WS send_message failed")
            return "Unable to send message"
    return None


def _ws_typing_audience(user_id: uuid.UUID, conv_id: uuid.UUID) -> tuple[list[uuid.UUID], str] | None:
    with SessionLocal() as db:
        part = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conv_id,
            ConversationParticipant.user_id == user_id,
            ConversationParticipant.left_at.is_(None),
        ).first()
        if not part:
            return None
        user = db.get(User, user_id)
        name = (user.full_name or user.handle or "Someone") if user else "Someone"
        rows = db.query(ConversationParticipant.user_id).filter(
            ConversationParticipant.conversation_id == conv_id,
            ConversationParticipant.left_at.is_(None),
        ).all()
        return [r[0] for r in rows], name


def _ws_mark_read(user_id: uuid.UUID, conv_id: uuid.UUID, msg_id: uuid.UUID | None) -> None:
    with SessionLocal() as db:
        user = db.get(User, user_id)
        if not user:
            return
        try:
            mark_conversation_read(db, user, conv_id, message_id=msg_id)
        except MessagingError:
            db.rollback()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    ticket: str | None = Query(default=None),
):
    # NOTE: no `db: DBSession` dependency here on purpose. A FastAPI dependency lives as long as the
    # request, i.e. for the whole websocket connection. That pinned one pooled DB connection per open
    # chat tab (pool_size=5, max_overflow=10) and starved every REST endpoint ("app is super slow").

    # Enforce WebSocket Origin check when Origin header is present (CSWSH protection)
    origin = websocket.headers.get("origin")
    if origin:
        allowed_origins = get_settings().CORS_ORIGINS
        if "*" not in allowed_origins and origin not in allowed_origins:
            await websocket.close(code=4003, reason="Origin not allowed")
            return

    if not ticket:
        await websocket.close(code=4001, reason="Authentication ticket required")
        return

    user_id = ticket_store.consume_ticket(ticket)
    if not user_id:
        await websocket.close(code=4003, reason="Invalid or expired ticket")
        return

    connected = await ws_manager.connect(websocket, user_id)
    if not connected:
        return

    # Send initial connected presence acknowledgment
    await websocket.send_text(json.dumps({"event": "connected", "user_id": str(user_id)}))

    try:
        while True:
            raw = await websocket.receive_text()

            # Enforce max frame size
            if len(raw.encode("utf-8")) > 64 * 1024:
                await websocket.send_text(json.dumps({"event": "error", "message": "Frame size exceeds 64KB limit"}))
                continue

            # Per-connection rate limit check
            if not ws_manager.check_rate_limit(websocket):
                await websocket.send_text(json.dumps({"event": "error", "message": "Message rate limit exceeded (max 30/min)"}))
                continue

            try:
                data = json.loads(raw)
            except Exception:
                continue

            action = data.get("action") or data.get("event")

            # 1. Ping / Pong Heartbeat
            if action == "ping":
                await websocket.send_text(json.dumps({"event": "pong"}))
                continue

            try:
                # 2. send_message action
                if action == "send_message":
                    conv_id_str = data.get("conversation_id")
                    body = data.get("body")
                    if not conv_id_str or not body:
                        await websocket.send_text(json.dumps({"event": "error", "message": "Missing conversation_id or body"}))
                        continue
                    err = await asyncio.to_thread(
                        _ws_send_message, user_id, uuid.UUID(conv_id_str), body, data.get("client_msg_id")
                    )
                    if err:
                        await websocket.send_text(json.dumps({"event": "error", "message": err}))
                        if err == "User inactive":
                            await websocket.close(code=4003, reason="User inactive")
                            break

                # 3. typing indicator action
                elif action == "typing":
                    conv_id_str = data.get("conversation_id")
                    if conv_id_str:
                        conv_id = uuid.UUID(conv_id_str)
                        audience = await asyncio.to_thread(_ws_typing_audience, user_id, conv_id)
                        if audience:
                            participant_ids, name = audience
                            await ws_manager.broadcast_to_conversation(
                                conv_id,
                                participant_ids,
                                "typing",
                                {
                                    "conversation_id": conv_id_str,
                                    "user_id": str(user_id),
                                    "user_name": name,
                                    "is_typing": bool(data.get("is_typing", True)),
                                },
                                exclude_user_id=user_id,
                            )

                # 4. read action
                elif action == "read":
                    conv_id_str = data.get("conversation_id")
                    msg_id_str = data.get("message_id")
                    if conv_id_str:
                        await asyncio.to_thread(
                            _ws_mark_read,
                            user_id,
                            uuid.UUID(conv_id_str),
                            uuid.UUID(msg_id_str) if msg_id_str else None,
                        )
            except Exception as e:
                logger.warning(f"Error handling WebSocket action {action}: {e}")

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
    finally:
        ws_manager.disconnect(websocket)
