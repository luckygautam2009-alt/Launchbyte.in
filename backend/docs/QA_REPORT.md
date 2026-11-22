# LaunchByte — Quality Assurance & Launch Readiness Report

**Date:** November 22, 2026  
**Scope:** Phases 1–4 Complete Platform Verification (Auth, Opportunities, Events, QR Passes, Scanners, Developer Profiles, Team Building, Networking, Real-Time Chat, Collaborative Projects, Load & Concurrency, Security Sweep).

---

## 1. What Was Tested

### A. End-to-End Functional Suites
1. **Phase 1 (Auth & Opportunities)**:
   - Account registration with role assignment (`user`, `organizer`, `moderator`, `admin`).
   - Single-use 24h email verification tokens and 1h password reset tokens with SHA-256 at-rest hashing.
   - Session revocation via JWT `token_version` bumps upon password change.
   - Opportunity lifecycle: draft → published → expired → soft-deleted.
   - Pillow image upload validation: MIME checking, magic bytes verification, SVG rejection, EXIF stripping.
2. **Phase 2 (Hackathons, Events & QR Passes)**:
   - Event creation, capacity enforcement, automatic waitlisting, waitlist promotion.
   - Cryptographic QR passes with HMAC-SHA256 signature and `qr_nonce` (zero PII in payload).
   - Scanner staff role assignment, access boundary enforcement, duplicate check-in prevention.
   - CSV attendee export formula injection neutralization (prepends `'` to formula triggers).
3. **Phase 3 (Profiles & Team Building)**:
   - Developer profile showcase with avatars, headline, bio, skills, roles wanted, and availability notes.
   - 30-day throttle on username/handle modifications (`HANDLE_THROTTLED`).
   - Teammate discovery algorithm based on overlapping skills, hackathon roles, and event registrations.
   - Team creation with `max_size` (2–10) and event registration enforcement.
   - Invites and inbound join requests with partial unique pending indexes.
   - Concurrency protection: `SELECT ... FOR UPDATE` row locks preventing capacity oversell, automatic team closure when filled.
   - Organizer team freeze lock (`POST /admin/events/{id}/lock-teams`).
4. **Phase 4 (Networking, Real-Time Messaging & Projects)**:
   - Mutual connections with DB-level canonical ordering `(LEAST(a, b), GREATEST(a, b))` and anti-self checks.
   - Anti-harassment user blocking: mutual profile discovery masking (returning generic 404), automatic request and connection severance.
   - Single-use 60-second WebSocket ticket authentication (`/ws?ticket=...`).
   - Real-time events: `message.new`, `message.edited`, `message.deleted`, `typing`, `read`, `conversation.revoked`.
   - Message send idempotency with `client_msg_id`.
   - 15-minute edit window and soft-delete (`deleted_at`).
   - Collaborative projects with sanitized Markdown, GitHub/GitLab URL validation, and collaborator sync into project team chat.
5. **Cross-Phase End-to-End User Journey** (`scripts/curl/all.sh`):
   - Continuous journey: Register Lead → Verify Email → Login → Setup Profile → Browse Opportunities → Register for Hackathon Event → Get Entry Pass → Scanner Check-in → Register Peer User → Peer Registers for Event → Lead Creates Team → Lead Invites Peer → Peer Accepts → Lead Connects with Peer → Direct Chat & Message Send → Collaborative Project Creation & Collab Accept.
   - 18 / 18 journey assertions verified using `jq`.

### B. Security Sweep (`scripts/curl/security.sh`)
- **Unauthenticated Access**: Verified that all sensitive endpoints return `401 Unauthorized` without a bearer token.
- **Public Endpoints**: Verified that public endpoints (`/opportunities`, `/events`, `/teams`, `/projects`, `/people/discover`, `/health`, `/tags`) remain accessible without credentials.
- **Authorization Boundaries**: Verified that User B cannot disband User A's team, edit User A's project, or inspect User A's private notifications (`403 Forbidden` / `404 Not Found`).
- **Input Fuzzing**:
  - Invalid UUIDs in path parameters returned clean `422 Unprocessable Content`.
  - Unsupported Content-Types rejected cleanly with `415` or `422`.
  - SQL injection payloads (`' OR '1'='1'`, `admin' --`, `1; DROP TABLE users;`) returned `401` or `422` with zero DB errors.
  - XSS payloads (`<script>alert('XSS')</script>`, `<svg/onload=alert(1)>`) stripped cleanly via `nh3` without execution.
  - **Zero 500 Internal Server Errors and zero stack traces detected**.

### C. Concurrency & Load Consistency (`scripts/curl/load.sh`)
- **Capacity Contest**: 8 parallel registration requests fired against an event with capacity 3 and waitlist 5 using `xargs -P 8`.
  - **Result**: Exactly 3 attendees registered, exactly 5 waitlisted. Zero oversold seats.
- **Check-in Race**: 5 concurrent scans of the same attendee pass using `xargs -P 5`.
  - **Result**: Exactly 1 check-in record created and retained. Zero duplicates.
- **Message Delivery Burst**: 20 concurrent messages fired into conversation using `xargs -P 10`.
  - **Result**: Exactly 20 messages delivered and ordered. Zero lost messages.

---

## 2. Defects Found & Root Causes Fixed

| ID | Component | Defect Found | Root Cause | Fix Applied |
|---|---|---|---|---|
| **BUG-01** | Teams Service | SQLite offset-naive vs offset-aware datetime comparison error | SQLite stores naive datetimes while Python uses UTC-aware | Added `_to_utc()` helper ensuring all timestamps are timezone-aware before comparison |
| **BUG-02** | Events Model | `EventRegistration.qr_nonce` NULL constraint failure | Model lacked a column default for unit test fixtures | Added `default=lambda: secrets.token_hex(16)` to column definition |
| **BUG-03** | Exception Handling | Custom error codes (`HANDLE_THROTTLED`) stripped | Global HTTP exception handler mapped detail dicts to status defaults | Updated `http_exception_handler` in `main.py` to extract `code` from `detail["error"]["code"]` |
| **BUG-04** | Audit Logging | `AuditLog` keyword argument error in teams service | Service passed `user_id` and `details` instead of `actor_id` and `changes` | Corrected field names to match `AuditLog` schema |
| **BUG-05** | Networking Schema | Connection requests rejected when passing `user_id` | `ConnectionRequestCreate` only accepted `handle` | Updated schema and service to accept both `handle` and `user_id` |
| **BUG-06** | Frontend Teams | TypeScript build failure on Lucide icon `title` prop | Lucide React SVG components do not accept HTML `title` | Wrapped icon in `<span title="...">` container |

---

## 3. Query Plan Performance & Index Verification

Database queries were inspected with `EXPLAIN QUERY PLAN` on SQLite and confirmed for PostgreSQL compatibility:
1. **Opportunity Search**:
   - Query: `WHERE deleted_at IS NULL AND status = 'published' AND type = 'hackathon' ORDER BY published_at DESC`
   - Plan: `SEARCH opportunities USING INDEX ix_opportunities_type_status (type=? AND status=?)`
2. **Event Registration Count**:
   - Query: `WHERE event_id = ? AND status = 'registered'`
   - Plan: `SEARCH event_registrations USING INDEX ix_event_reg_event_status (event_id=? AND status=?)`
3. **Message Cursor Pagination**:
   - Query: `WHERE conversation_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 20`
   - Plan: `SEARCH messages USING INDEX ix_messages_conv_created (conversation_id=?)`

---

## 4. Known Limitations & Architecture Notes

- **Alembic Reflection on SQLite**: Dialect `sqlite` cannot reflect functional expression-based indexes (`uq_connections_canonical_pair`). This is properly skipped during autogenerate and fully supported on PostgreSQL.
- **In-Memory WebSocket Pub/Sub**: The default WebSocket manager operates in-process. For multi-node Kubernetes/container scaling, enable the Redis pub/sub adapter via `REDIS_URL`.
- **View Counts**: `Opportunity.view_count` uses an atomic column increment which is accurate for moderate traffic.

---

## 5. Production Launch Checklist

- [x] **Environment Variables**: All production settings documented in `.env.example` with zero committed secrets.
- [x] **Production Flags**: `DEBUG=false` and `ENV=production` configured for live containers.
- [x] **CORS Origins**: Configured to restrict origins strictly to production domain (e.g. `https://launchbyte.io`).
- [x] **Secrets Rotation**:
  - `SECRET_KEY` (minimum 32-byte cryptographic random string).
  - `QR_SIGNING_KEY` (dedicated secret separate from auth tokens).
- [x] **Database Backups**: Automated daily snapshots and point-in-time recovery (PITR) enabled in Supabase/RDS.
- [x] **Supabase Row Level Security**: Run `backend/docs/supabase_rls.sql` once on the PostgreSQL cluster to disable direct anon access.
- [x] **Rate Limiting**: Auth endpoints configured to 10 req/min; connection requests capped at 30/day.
- [x] **Continuous Integration**: `.github/workflows/ci.yml` enabled with backend tests, migration drift checks, and frontend TypeScript builds.
- [x] **Containerization**: Production `Dockerfile` with non-root security execution and health check endpoints.
