# LaunchByte

> The modern platform for hackathons and opportunities (internships, fellowships, workshops, and grants) engineered to beat legacy portals on **trust**, **speed of hosting**, and **teammate discovery**.

---

## Architecture Overview

- **Backend**: FastAPI + SQLAlchemy 2.0 (100% typed declarative models) + Alembic migrations + PostgreSQL (Supabase ready, SQLite in-memory for ultra-fast local testing) in [`/backend`](./backend).
- **Frontend**: Next.js 14 App Router + TypeScript + Tailwind CSS + Framer Motion in [`/frontend`](./frontend).
- **Security & Integrity**:
  - Cryptographic token hashing with SHA-256 for single-use email verification and password resets.
  - Token versioning (`token_version`) embedded in JWT claims to revoke stale sessions upon password updates.
  - Dedicated `QR_SIGNING_KEY` for HMAC-SHA256 event entry passes (no PII inside QR payload).
  - Sliding-window rate limiter with `Retry-After` headers.
  - Multi-layer image sanitization via Pillow: strict magic-byte MIME validation (PNG, JPEG, WEBP; rejecting SVG), stripping EXIF and malicious payloads, re-encoding before storage.
  - Concurrency safety: `SELECT ... FOR UPDATE` row locks preventing capacity overselling and duplicate check-in races.
  - CSV export formula injection neutralization (prefixing formula characters with `'`).
  - Zero schema drift enforced via Alembic autogenerate comparison tests.
  - Consistent error contract across all endpoints: `{"error": {"code": "...", "message": "..."}}`.

---

## Quickstart

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt

# Run database migrations
alembic upgrade head

# Seed initial opportunities, events, staff, and team members
python -m app.db.seed

# Start backend server
uvicorn app.main:app --reload --port 8000
```
Interactive Swagger docs: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev -- -p 3000
```
Frontend web app: `http://localhost:3000`

---

## Test & Verification Suites

### Pytest (Backend)
All 143 tests passing covering Auth hardening, Image uploads, Opportunities lifecycle, Events management, QR passes, Waitlist promotion, Scanners, Developer Profiles, Team Building, Developer Networking, Messaging, and Collaborative Projects:
```bash
cd backend
source .venv/bin/activate
pytest
```

### End-to-End Curl Verification
Automated test scripts exercising every endpoint with live assertions:
```bash
# Phase 1: Auth, Opportunities, Uploads, Team
./scripts/curl/phase1.sh

# Phase 2: Events, Waitlist, QR Passes, Scanners, Admin
./scripts/curl/phase2.sh

# Phase 3: Developer Profiles, Teammate Discovery & Event Team Building
./scripts/curl/phase3.sh

# Phase 4: Networking, Messaging, Projects, WebSockets
./scripts/curl/phase4.sh
```

### Frontend Build
Compile check across all 30 static and dynamic routes:
```bash
cd frontend
npm run build
```

---

## Features Implemented

### Phase 1: Foundation Hardening & Opportunities
- Email verification (single-use SHA-256 tokens, 24h expiration)
- Password reset flow with non-enumerating responses
- Sliding-window rate limiting on sensitive endpoints
- Pillow image upload sanitization (EXIF stripping, MIME byte checking)
- Opportunities catalog with multifaceted search, filters, and bookmarks
- Organizer submission flow & Admin moderation queue
- About & Meet the Team page

### Phase 2: Events, QR Passes & Admin Portal
- **One-Click Event Landing Pages**: Custom sections (schedule, prizes, tracks, FAQs, sponsors), markdown descriptions, countdowns, `.ics` calendar download.
- **Capacity & Automatic FIFO Waitlist**: Database row locking prevents overselling; cancelling an attendee automatically promotes the next waitlisted user and sends an email.
- **Signed QR Entry Passes**: Cryptographic pass generation, QR PNG rendering at level Q, pass rotation (invalidates leaked tokens), and bright-mode scanning screen.
- **Check-in Scanner**: Camera scanning with BarcodeDetector and fallback manual code entry, sound/vibration feedback, duplicate 409 prevention, and per-event scanner authorization.
- **Admin Portal**: 2-minute event wizard, real-time stats cards, attendee moderation, CSV export, and scanner staff assignment.

### Phase 4: Developer Networking, Real-Time Messaging & Collaborative Projects
- **Developer Connections**: Mutual connection model with canonical pair uniqueness index preventing race/reverse duplicates, daily limits (30/day), and `@handle` search.
- **Smart Teammate Suggestions**: Recommender matching shared skills, mutual hackathon event participation, and institutions with match score percentages and reason chips.
- **Privacy & Anti-Harassment**: Bidirectional user blocking with generic 404/403 responses to prevent existence probing.
- **Real-Time WebSocket Gateway (`/ws`)**: Single-use ticket authentication (`POST /api/v1/ws/ticket`), max 5 concurrent sockets, 64 KB frame limit, 30 msgs/min rate limiter, heartbeat ping/pong.
- **Chat & Messaging**: Direct messaging and Team chats with cursor pagination, 15-minute edit window, soft delete, read receipts, and idempotent message delivery (`client_msg_id`).
- **Collaborative Projects**: Public/connections/private project showcase with markdown description, tech stack tags, looking-for roles, repository and live demo links.
- **Inbound Collaboration Recruiting**: Owner approval flow that automatically synchronizes accepted collaborators directly into the team and provisions real-time team chat.
- **Moderation Workflow**: Flagging/reporting for spam, harassment, or scam messages with moderator actioning logged to `audit_logs`.
