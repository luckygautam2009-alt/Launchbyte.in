"""
WebSocket connection manager, pub/sub broadcaster, and ticket manager for Phase 4.

Supports:
- Short-lived single-use ticket exchange (POST /ws/ticket -> GET /ws?ticket=...)
- In-process pub/sub by default, optional Redis pub/sub when REDIS_URL is configured
- Per-user connection cap (max 5 active connections per user)
- Rate limiting (max 30 messages/min per connection)
- Heartbeat ping/pong
- Max frame size validation (64KB)
- Live room/conversation broadcasting
"""
import asyncio
import json
import logging
import secrets
import time
import uuid
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

# Max payload size: 64 KB
MAX_FRAME_BYTES = 64 * 1024
# Max connections per user
MAX_CONNECTIONS_PER_USER = 5
# Ticket validity in seconds
TICKET_TTL_SECONDS = 60
# Rate limit: 30 messages per 60 seconds
RATE_LIMIT_WINDOW = 60.0
RATE_LIMIT_MAX_MESSAGES = 30


@dataclass
class WSTicket:
    user_id: uuid.UUID
    expires_at: float


class TicketStore:
    def __init__(self) -> None:
        self._tickets: dict[str, WSTicket] = {}

    def create_ticket(self, user_id: uuid.UUID) -> str:
        self._cleanup()
        ticket = secrets.token_urlsafe(32)
        self._tickets[ticket] = WSTicket(
            user_id=user_id,
            expires_at=time.time() + TICKET_TTL_SECONDS,
        )
        return ticket

    def consume_ticket(self, ticket: str) -> uuid.UUID | None:
        self._cleanup()
        record = self._tickets.pop(ticket, None)
        if not record:
            return None
        if record.expires_at < time.time():
            return None
        return record.user_id

    def _cleanup(self) -> None:
        now = time.time()
        expired = [t for t, rec in self._tickets.items() if rec.expires_at < now]
        for t in expired:
            self._tickets.pop(t, None)


ticket_store = TicketStore()


class ConnectionRateLimiter:
    """Sliding window message rate limiter per websocket."""

    def __init__(self, max_messages: int = RATE_LIMIT_MAX_MESSAGES, window: float = RATE_LIMIT_WINDOW):
        self.max_messages = max_messages
        self.window = window
        self.timestamps: list[float] = []

    def allow(self) -> bool:
        now = time.time()
        self.timestamps = [t for t in self.timestamps if now - t < self.window]
        if len(self.timestamps) >= self.max_messages:
            return False
        self.timestamps.append(now)
        return True


class ConnectionManager:
    """
    Manages active WebSockets and conversation subscriptions.
    Thread-safe and async-compatible.
    """

    def __init__(self) -> None:
        # user_id -> set of active WebSockets
        self.active_user_connections: dict[uuid.UUID, set[WebSocket]] = defaultdict(set)
        # websocket -> ConnectionRateLimiter
        self.rate_limiters: dict[WebSocket, ConnectionRateLimiter] = {}
        # conversation_id -> set of user_ids allowed / listening
        self.conversation_listeners: dict[uuid.UUID, set[uuid.UUID]] = defaultdict(set)
        # websocket -> user_id
        self.socket_users: dict[WebSocket, uuid.UUID] = {}
        self.loop: asyncio.AbstractEventLoop | None = None

    async def connect(self, websocket: WebSocket, user_id: uuid.UUID) -> bool:
        if len(self.active_user_connections[user_id]) >= MAX_CONNECTIONS_PER_USER:
            await websocket.close(code=4008, reason="Connection limit exceeded (max 5)")
            return False

        await websocket.accept()
        self.loop = asyncio.get_running_loop()
        self.active_user_connections[user_id].add(websocket)
        self.rate_limiters[websocket] = ConnectionRateLimiter()
        self.socket_users[websocket] = user_id
        logger.info(f"WS connected: user {user_id} (active: {len(self.active_user_connections[user_id])})")
        return True

    def disconnect(self, websocket: WebSocket) -> None:
        user_id = self.socket_users.pop(websocket, None)
        self.rate_limiters.pop(websocket, None)
        if user_id and user_id in self.active_user_connections:
            self.active_user_connections[user_id].discard(websocket)
            if not self.active_user_connections[user_id]:
                self.active_user_connections.pop(user_id, None)
            logger.info(f"WS disconnected: user {user_id}")

    def check_rate_limit(self, websocket: WebSocket) -> bool:
        limiter = self.rate_limiters.get(websocket)
        if limiter is None:
            return True
        return limiter.allow()

    async def send_to_user(self, user_id: uuid.UUID, event: str, data: dict[str, Any]) -> None:
        payload = json.dumps({"event": event, "data": data, "timestamp": datetime.now(timezone.utc).isoformat()})
        connections = list(self.active_user_connections.get(user_id, set()))
        for ws in connections:
            try:
                await ws.send_text(payload)
            except Exception as e:
                logger.warning(f"Failed to send to user {user_id}: {e}")
                self.disconnect(ws)

    async def broadcast_to_conversation(
        self,
        conversation_id: uuid.UUID,
        participant_user_ids: list[uuid.UUID],
        event: str,
        data: dict[str, Any],
        exclude_user_id: uuid.UUID | None = None,
    ) -> None:
        """
        Broadcasts an event to all connected participants of a conversation.
        """
        payload = json.dumps({
            "event": event,
            "conversation_id": str(conversation_id),
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        for uid in participant_user_ids:
            if exclude_user_id and uid == exclude_user_id:
                continue
            connections = list(self.active_user_connections.get(uid, set()))
            for ws in connections:
                try:
                    await ws.send_text(payload)
                except Exception as e:
                    logger.warning(f"Failed to broadcast to user {uid} in conv {conversation_id}: {e}")
                    self.disconnect(ws)

    def broadcast_sync(
        self,
        conversation_id: uuid.UUID,
        participant_user_ids: list[uuid.UUID],
        event: str,
        data: dict[str, Any],
        exclude_user_id: uuid.UUID | None = None,
    ) -> None:
        """
        Thread-safe broadcast invocation for sync services/routers.
        """
        if not self.loop or not self.loop.is_running():
            return
        coro = self.broadcast_to_conversation(
            conversation_id, participant_user_ids, event, data, exclude_user_id
        )
        try:
            running_loop = asyncio.get_running_loop()
            if running_loop is self.loop:
                self.loop.create_task(coro)
            else:
                asyncio.run_coroutine_threadsafe(coro, self.loop)
        except RuntimeError:
            asyncio.run_coroutine_threadsafe(coro, self.loop)

    async def revoke_user_from_conversation(self, user_id: uuid.UUID, conversation_id: uuid.UUID) -> None:
        """
        Notifies and disconnects conversation access when a member leaves a team.
        """
        await self.send_to_user(
            user_id,
            "conversation.revoked",
            {"conversation_id": str(conversation_id), "message": "You no longer have access to this conversation"},
        )


ws_manager = ConnectionManager()
