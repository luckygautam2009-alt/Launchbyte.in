# LaunchByte — Project Status

**Phase 1, Phase 2, Phase 3, and Phase 4 Completed: Developer Profiles, Teammate Discovery & Event Team Building, Developer Networking, Direct & Team Chat (REST + WebSocket), Collaborative Projects, Moderation & Audit Logging**

---

## 1. Phase 3 Implemented: Developer Profiles, Teammate Discovery & Event Team Building

### Part A: Database Models & Migration
- **Alembic Migration** (`backend/alembic/versions/0006_phase3_team_building_profiles.py`):
  - `users.handle_updated_at`: 30-day throttle tracking column.
  - `user_profiles`: Extended with `avatar_url`, `open_to_teams`, `looking_for_roles`, `availability_note`, `is_public`, `show_linkedin`, `show_github`.
  - `teams`: Extended with `owner_id`, `event_id`, `visibility` (`public`, `unlisted`, `private`), `accepting_requests`, `max_size` (2..10), `looking_for_skills`, `status` (`active`, `disbanded`, `archived`), `is_locked`, `deleted_at`.
  - `team_members`: Added `event_id` and partial unique constraint `uq_team_members_event_user` (`UNIQUE(event_id, user_id) WHERE event_id IS NOT NULL`), preventing a hacker from belonging to multiple teams in the same event.
  - `team_invites`: Team invitation lifecycle with partial unique index `uq_team_invite_pending` on `(team_id, invited_user_id) WHERE status = 'pending'`.
  - `team_join_requests`: Inbound candidate requests with partial unique index `uq_team_join_request_pending` on `(team_id, user_id) WHERE status = 'pending'`.
  - Zero schema drift verified by `test_migrations.py`.

### Part B: Service Layer & Business Logic
- **Profile Service** (`backend/app/services/users/profile.py`):
  - `get_my_profile` & `update_my_profile`: 30-day handle change throttle enforcement (`HANDLE_THROTTLED`).
  - `get_public_profile`: Respects privacy settings (`is_public`, `show_github`, `show_linkedin`) and returns generic 404 to prevent user enumeration.
  - `discover_teammates`: Smart matching ranking candidates based on matching target skills, desired hackathon roles, availability notes, and event registrations.
- **Team Service** (`backend/app/services/teams/service.py`):
  - Full lifecycle: create, update, transfer leadership, leave, disband.
  - Capacity & race protection: `SELECT ... FOR UPDATE` row locks on team during member additions, preventing double-clicks and concurrent race conditions.
  - Auto-closure: Automatically sets `accepting_requests = False` when a team reaches `max_size`.
  - Event registration enforcement: If team is tied to an `event_id`, all creators, invitees, and applicants must have a valid registration for that event.
  - Event organizer team freeze: `lock_teams_for_event` allows organizers to lock all teams before judging or deadline.
  - Soft-delete and audit logging on admin deletions.

### Part C: Next.js Frontend Application
- **Pages Added & Fully Functional**:
  - `/teams`: Public team discovery catalog with keyword search, skill filtering, open-spots filter, and pagination.
  - `/teams/new`: Team creation wizard with event selector, max capacity, skill tags, and privacy toggles.
  - `/teams/[slug]`: Team dashboard with Members roster, pending Invites, inbound Join Requests, leadership transfer modal, disband team modal, and leave team action.
  - `/people`: Teammate discovery directory with skill filtering, search, match score badge, roles wanted, and instant invite modal.
  - `/profile/edit`: Developer profile editor with avatar upload, handle with 30-day throttle warning, headline, bio, skills/interests, and privacy toggles.
  - `/u/[handle]`: Public developer profile showcase with avatar, headline, bio, education, skills chips, and social links.
  - `/me/invites`: Team invitations inbox with Accept and Decline actions.
  - `/me/teams`: My teams management page displaying owned and joined teams.
  - `Navbar`: Added "Teams" navigation item, with dropdown shortcuts for Edit Profile, My Teams, Invites, and Find Teammates.

---

## 2. Phase 4 Implemented: Developer Networking & Real-Time Collaboration

### Part A: Database Models & Migration
- **Alembic Migration** (`backend/alembic/versions/0005_phase4_networking_messaging_projects.py`):
  - `connections`: mutual connections with state (`pending`, `accepted`, `declined`, `cancelled`), anti-self CHECK constraint, and unique expression index on canonical pair `(LEAST(a, b), GREATEST(a, b))` preventing duplicate/reverse requests.
  - `user_blocks`: privacy and anti-harassment user blocking with anti-self CHECK constraint and pair uniqueness.
  - `teams` and `team_members`: team units with roles (`leader`, `member`).
  - `conversations`: direct and team chat rooms with canonical direct pair index and team constraint.
  - `conversation_participants`: member subscriptions with `last_read_message_id` and mute toggle.
  - `messages`: message history with soft delete (`deleted_at`), 15-minute edit window, and `client_msg_id` for idempotency and retry deduplication.
  - `message_reports`: reporting workflow for spam/harassment with status tracking (`pending`, `actioned`, `dismissed`).
  - `projects`, `project_members`, `project_collab_requests`: collaborative project catalog with sanitized markdown descriptions, https URL validation, tech stack & looking-for tags, and visibility rules (`public`, `connections`, `private`).
  - `users.handle`: added unique handle field to user model and auth responses.
  - Zero schema drift verified by `test_migrations.py`.

### Part B: Real-Time WebSocket Infrastructure
- **WebSocket Gateway** (`backend/app/core/websocket.py` & `backend/app/routers/conversations.py`):
  - **Ticket Authentication**: Single-use tokens obtained via `POST /api/v1/ws/ticket` (`TICKET_TTL = 60s`). Tokens are destroyed upon consumption, preventing URL credential leakage.
  - **Connection Limits**: Max 5 concurrent sockets per user; frame size hard limit of 64 KB; connection sliding window rate limiting (max 30 msgs/min).
  - **Heartbeat**: Ping/pong keep-alive loop.
  - **Real-Time Events**: `message.new`, `message.edited`, `message.deleted`, `typing`, `message.read`, and `conversation.revoked`.
  - **Thread-Safe Cross-Thread Broadcasting**: `ConnectionManager.broadcast_sync` allows synchronous services to dispatch events safely to the main event loop.

### Part C: Service Layer & Business Logic
- **Connections & Discovery** (`backend/app/services/networking/connections.py`):
  - Strict daily limits (30 requests/day, 200 pending cap).
  - Smart teammate suggestions matching shared skills, mutual hackathon events, and institutions with match score percentages and reason chips.
  - Privacy-preserving block checks returning generic 404/403 to prevent user existence probing.
- **Messaging** (`backend/app/services/networking/messaging.py`):
  - Direct conversation creation permitted only between approved connections or co-members of a team.
  - Cursor-based message pagination (`GET /conversations/{id}/messages`).
  - 15-minute message edit window; soft delete with masked message body.
  - Moderator actioning with automatic entry in `audit_logs`.
- **Projects & Teams** (`backend/app/services/networking/projects.py` & `teams.py`):
  - Project creation automatically creates a linked Team and provisions a team conversation.
  - Inbound collaboration requests; owner acceptance synchronizes collaborators directly into the team and team chat.
  - HTML/markdown sanitization via `nh3`.

### Part D: Next.js Frontend Application
- **Pages Added & Fully Functional**:
  - `/network`: Full developer networking hub. Tabs for Connections (with remove and profile summary), Requests (Incoming with Accept/Decline, Outgoing with Cancel), Suggestions (smart recommendations with reason chips and match score), and Blocked Users (with Unblock action). Quick connect by `@handle`.
  - `/messages`: Two-pane instant messaging layout. Conversation list with unread badges and last message preview. Active chat pane with reverse cursor scrolling, live WebSocket connection, auto-scroll, optimistic sending, typing indicator ("Alice is typing..."), message edit modal, delete, and flag/report dialog.
  - `/projects`: Public collaborative projects discovery grid. Search bar, tech stack filters, looking-for role chips, and project cards with member counts.
  - `/projects/new`: Project creator wizard with Markdown description, interactive tech stack and looking-for tag inputs, repository URL, demo URL, and visibility selection.
  - `/projects/[slug]`: Project details page with Markdown description, member list, looking-for section, direct "Team Chat" button, "Request to Collaborate" modal, and owner view for managing inbound applicant requests.
  - `Navbar`: Added direct navigation for Network, Projects, and quick-access Messages icon with unread indicator.

---

## 4. Phase 5: Premium Polish, Design System, UX, Performance & A11y

### Part A: Unified Design System & Tokens
- **Tokens & CSS Variables** (`frontend/tailwind.config.js` & `frontend/app/globals.css`):
  - Brand Indigo palette (`brand-50` to `brand-950`), Accent Cyan (`accent-50` to `accent-900`), and dark surfaces (`surface-800` to `surface-1000`).
  - True dark-mode native palette with glassmorphism overlays (`backdrop-blur-xl`), glow shadows (`shadow-glow`, `shadow-glow-accent`, `shadow-glow-emerald`), and visible `:focus-visible` accessibility rings.
  - Performance-safe keyframes (`shimmer`, `pulseSubtle`, `bellWiggle`, `scanLine`).

### Part B: Reusable UI Component Library (`frontend/components/ui/`)
- `Button`: Multiple variants, sizes, loading spinner, min 44px touch target, Framer Motion tap micro-interactions.
- `Input`: Left/right icon adornments, helper & error texts, associated labels, visible focus rings.
- `TrustBadge`: Visual trust score badge (0-100), verification rings (verified/pending/unverified/flagged/rejected), and hover/focus signal tooltip.
- `Badge`: Pill badges across 7 semantic palettes (`brand`, `accent`, `emerald`, `amber`, `rose`, `slate`, `purple`).
- `Card`: Glassmorphic container with spring hover elevation.
- `Tabs`: Accessible tab navigation with Framer Motion `layoutId="activeTabPill"` floating highlight.
- `Dialog` & `Drawer`: Accessible modal and mobile bottom sheet with body scroll locking, focus trap, and Escape listener.
- `Countdown`: Monospace tabular digit flip countdown with zero layout shift.
- `ProgressBar`: Animated gradient capacity indicator with percentage and slot count.
- `Confetti`: Multi-burst particle explosion triggered on event registration respecting reduced motion.
- `CommandPalette`: Global `Cmd+K` / `Ctrl+K` modal search across actions, hackathons, teams, and builders.
- `MobileBottomNav`: 5 thumb-friendly items (Home, Explore, Events, Teams, Profile) with active state indicators.

### Part C: Signature Micro-Interactions & Experience Upgrades
- **Homepage (`/`)**: Animated gradient mesh hero, real-time platform statistics counter, TrustBadge-enabled verified event grid, competitor comparison breakdown, and mobile bottom navigation.
- **Event Detail (`/events/[slug]`)**: Integrated `Countdown`, `ProgressBar`, and `triggerConfetti()` upon registration confirmation.
- **Passes (`/passes/[id]`)**: Holographic cyber-pass design, animated laser scanline sweep (`animate-scan-line`), high-brightness toggle for easy QR scanning, and pass rotation.
- **Scanner (`/admin/events/[id]/scan`)**: Viewfinder with laser scanline sweep, spring animation banners (`SPRING.bouncy`) for check-in confirmation and error states, and haptic feedback.

### Part D: Performance, SEO & Accessibility
- **Bundle Optimization**: Shared First Load JS of **87.3 kB** across all 32 pre-rendered routes.
- **Metadata Routes**: `robots.ts` and `sitemap.ts` configured for clean crawling and indexing.
- **Automated Verification**:
  - **Backend Pytest**: **143 passed, 0 failed** (zero backend drift, zero regressions).
  - **TypeScript**: **0 errors** across all frontend source files (`npx tsc --noEmit`).
  - **Next.js Production Build**: **32/32 routes compiled successfully** (`npm run build`).
  - **Playwright Suite**: **30 passed, 0 failed** (`smoke.spec.ts`, `a11y.spec.ts`, `reduced-motion.spec.ts`) across desktop and mobile viewports (360, 390, 768, 1024, 1440).


- **Backend Pytest**: **143 passing tests** (134 previous + 9 Phase 3 comprehensive tests in `test_phase3_teams.py`), zero failures:
  - `test_profile_crud_and_handle_rules` — tests profile creation, 30-day handle throttle, and regex validation.
  - `test_avatar_upload` — tests MIME validation, size limits, and storage.
  - `test_public_profile_privacy_masking` — verifies 404 response on private profiles and masked fields.
  - `test_teammate_discovery` — tests smart candidate matching and skill relevance.
  - `test_team_creation_rules` — tests event registration requirement and max size limits.
  - `test_invites_and_join_requests_lifecycle` — tests invites, join requests, accept/decline flows, and pending uniqueness.
  - `test_capacity_overflow_and_auto_close` — tests auto-closing team when capacity is reached and rejecting excess members.
  - `test_leave_transfer_leadership_disband` — tests leadership transfer before leave, and team disbanding.
  - `test_organizer_lock_teams_and_admin_delete` — tests event organizer freeze and admin soft-delete.
- **Frontend Build**: `npm run build` succeeds cleanly generating **30/30 static and dynamic routes** with zero TypeScript errors.
- **Automated Verification Scripts**:
  - `scripts/curl/phase1.sh`: Auth, Opportunities, Uploads, Team
  - `scripts/curl/phase2.sh`: Events, Waitlist, QR Passes, Scanners, Admin
  - `scripts/curl/phase3.sh`: Developer Profiles, Teammate Discovery & Event Team Building
  - `scripts/curl/phase4.sh`: Networking, Messaging, Projects, WebSockets
- **Documentation**:
  - `backend/docs/database.md`: All tables, foreign keys, unique constraints, and partial indexes documented.
  - `backend/docs/api.md`: Complete API specification for all 46 endpoints.
