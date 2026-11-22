# WebSocket Architecture & Real-Time Messaging Protocol

LaunchByte uses WebSocket connections (`/ws`) for instant messaging, team chat updates, read receipts, and typing indicators.

---

## 1. Authentication: Single-Use Ticket Flow

To protect against token leakage in WebSocket query parameters or proxy access logs, LaunchByte enforces **single-use tickets**:

1. The client requests a short-lived ticket via an authenticated HTTP request:
   ```http
   POST /api/v1/ws/ticket
   Authorization: Bearer <access_token>
   ```
   **Response (200 OK):**
   ```json
   {
     "ticket": "wst_63b9f48512b9a7810ec5a0bd192934",
     "expires_in": 60
   }
   ```
2. The client connects to the WebSocket endpoint within 60 seconds:
   ```
   ws://localhost:8000/ws?ticket=wst_63b9f48512b9a7810ec5a0bd192934
   ```
3. The server immediately consumes the ticket (tickets are strictly single-use and expire after 60 seconds). If the ticket is invalid or expired, the connection is rejected with close code `4003 (Invalid or expired ticket)`.
4. Upon successful handshake, the server sends a welcome event:
   ```json
   {
     "event": "connected",
     "user_id": "00000000-0000-0000-0000-000000000001"
   }
   ```

---

## 2. Security Boundaries & Rate Limiting

- **Max Frame Size:** Messages exceeding **64 KB** (`65,536 bytes`) are discarded with an error event:
  ```json
  {"event": "error", "message": "Frame size exceeds 64KB limit"}
  ```
- **Connection Rate Limit:** A sliding window restricts connections to a maximum of **30 messages per minute**. Excess messages receive:
  ```json
  {"event": "error", "message": "Message rate limit exceeded (max 30/min)"}
  ```
- **Max Connections per User:** A single user account can hold at most **5 concurrent WebSockets** across devices/tabs. Excess connection attempts are closed with code `4008 (Connection limit exceeded)`.
- **Heartbeat & Keep-Alive:** The client sends `{"action": "ping"}` every 25 seconds; the server responds with `{"event": "pong"}`.
- **Revocation:** When a user leaves or is removed from a team, their team conversation access is revoked with `conversation.revoked`.

---

## 3. Client Action Schemas (Client -> Server)

### A. Ping
```json
{
  "action": "ping"
}
```

### B. Send Message
```json
{
  "action": "send_message",
  "conversation_id": "c1f75d3e-8b91-49b0-9519-c73abf1b8f52",
  "body": "Hello team, let's start the hackathon submission!",
  "client_msg_id": "client-uuid-or-nonce-1"
}
```

### C. Typing Indicator
```json
{
  "action": "typing",
  "conversation_id": "c1f75d3e-8b91-49b0-9519-c73abf1b8f52",
  "is_typing": true
}
```

### D. Read Receipt
```json
{
  "action": "read",
  "conversation_id": "c1f75d3e-8b91-49b0-9519-c73abf1b8f52",
  "message_id": "m9a1c234-789a-4123-b123-abcdef012345"
}
```

---

## 4. Server Event Schemas (Server -> Client)

### A. Pong
```json
{
  "event": "pong"
}
```

### B. New Message Broadcast (`message.new`)
Broadcasted to all active participants in the conversation.
```json
{
  "event": "message.new",
  "conversation_id": "c1f75d3e-8b91-49b0-9519-c73abf1b8f52",
  "data": {
    "id": "m9a1c234-789a-4123-b123-abcdef012345",
    "conversation_id": "c1f75d3e-8b91-49b0-9519-c73abf1b8f52",
    "sender_id": "00000000-0000-0000-0000-000000000001",
    "client_msg_id": "client-uuid-or-nonce-1",
    "body": "Hello team, let's start the hackathon submission!",
    "created_at": "2026-11-22T10:00:00Z",
    "edited_at": null,
    "is_deleted": false,
    "sender_name": "Alice Smith",
    "sender_handle": "alice"
  },
  "timestamp": "2026-11-22T10:00:00.123456Z"
}
```

### C. Message Edited (`message.edited`)
```json
{
  "event": "message.edited",
  "conversation_id": "c1f75d3e-8b91-49b0-9519-c73abf1b8f52",
  "data": {
    "id": "m9a1c234-789a-4123-b123-abcdef012345",
    "body": "Updated message content",
    "edited_at": "2026-11-22T10:05:00Z"
  }
}
```

### D. Message Deleted (`message.deleted`)
```json
{
  "event": "message.deleted",
  "conversation_id": "c1f75d3e-8b91-49b0-9519-c73abf1b8f52",
  "data": {
    "message_id": "m9a1c234-789a-4123-b123-abcdef012345"
  }
}
```

### E. Typing Broadcast (`typing`)
```json
{
  "event": "typing",
  "conversation_id": "c1f75d3e-8b91-49b0-9519-c73abf1b8f52",
  "data": {
    "conversation_id": "c1f75d3e-8b91-49b0-9519-c73abf1b8f52",
    "user_id": "00000000-0000-0000-0000-000000000001",
    "user_name": "Alice Smith",
    "is_typing": true
  }
}
```

### F. Conversation Revoked (`conversation.revoked`)
Sent specifically to a removed member so their client closes or hides the conversation view.
```json
{
  "event": "conversation.revoked",
  "data": {
    "conversation_id": "c1f75d3e-8b91-49b0-9519-c73abf1b8f52",
    "message": "You no longer have access to this conversation"
  }
}
```
