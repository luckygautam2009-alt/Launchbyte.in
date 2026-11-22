# LaunchByte — Phase 1 API Documentation

Base URL prefix: `/api/v1`
Error format: `{"detail": ..., "error": {"code": "...", "message": "..."}}`

---

## 1. Authentication & Users

### `POST /api/v1/users`
- **Auth**: None (Public)
- **Rate Limit**: 10 req/min per IP
- **Request**:
  ```json
  {
    "email": "user@example.com",
    "password": "supersecretpassword",
    "full_name": "John Doe"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "is_active": true,
    "role": "user",
    "is_email_verified": false
  }
  ```
- **Errors**: `409 Conflict` (Email already registered), `422 Unprocessable Content` (Validation error), `429 Too Many Requests`.

### `POST /api/v1/auth/login`
- **Auth**: None
- **Rate Limit**: 10 req/min per IP
- **Request (OAuth2 form)**: `username=user@example.com&password=supersecretpassword`
- **Response (200 OK)**:
  ```json
  {
    "access_token": "jwt-token",
    "token_type": "bearer"
  }
  ```
- **Errors**: `401 Unauthorized` (Incorrect credentials), `429 Too Many Requests`.

### `GET /api/v1/users/me`
- **Auth**: Bearer Token
- **Response (200 OK)**: `UserRead` schema.

### `POST /api/v1/auth/verify-email/request`
- **Auth**: Bearer Token
- **Rate Limit**: 5 req/min, 60s cooldown
- **Response (200 OK)**: `{"message": "Verification email sent. Please check your inbox."}`
- **Errors**: `429 Too Many Requests` (Cooldown active).

### `POST /api/v1/auth/verify-email/confirm`
- **Auth**: None
- **Request**: `{"token": "string"}`
- **Response (200 OK)**: `{"message": "Email verified successfully."}`
- **Errors**: `400 Bad Request` (Invalid or expired token).

### `POST /api/v1/auth/password-reset/request`
- **Auth**: None
- **Rate Limit**: 5 req/min
- **Request**: `{"email": "user@example.com"}`
- **Response (202 Accepted)**: Always returns `{"message": "If that email is registered, a password reset link has been sent."}` (No enumeration).

### `POST /api/v1/auth/password-reset/confirm`
- **Auth**: None
- **Request**: `{"token": "string", "new_password": "newpassword123"}`
- **Response (200 OK)**: `{"message": "Password reset successfully. Please log in with your new password."}`
- **Errors**: `400 Bad Request` (Invalid/expired token), `422 Unprocessable Content` (Password < 8 chars).

---

## 2. Image Uploads

### `POST /api/v1/uploads/images`
- **Auth**: Bearer Token (Roles: `organizer`, `moderator`, `admin`)
- **Request**: `multipart/form-data` with field `file` (PNG, JPEG, WebP only; <= 5 MB)
- **Response (201 Created)**:
  ```json
  {
    "url": "/uploads/<random-uuid>.webp",
    "width": 1200,
    "height": 630
  }
  ```
- **Errors**: `401 Unauthorized`, `403 Forbidden`, `422 Unprocessable Content` (SVG rejected, non-image, size > 5MB, corrupt).

---

## 3. Opportunities

### `GET /api/v1/opportunities`
- **Auth**: None (Public)
- **Filters**:
  - `type` (multi): `hackathon`, `internship`, `fellowship`, etc.
  - `tag` (multi): tag slugs
  - `location_type`: `remote`, `onsite`, `hybrid`
  - `country_code`: 2-letter ISO code
  - `compensation_type`: `paid`, `stipend`, `prize`, `funded`, `unpaid`, `unspecified`
  - `verification_status`: `verified`, `unverified`, `pending`, `flagged`
  - `is_featured`: bool
  - `open_only`: bool
  - `deadline_after`, `deadline_before`: ISO datetime
  - `q`: search keyword
  - `sort`: `deadline`, `deadline_soon`, `newest`, `trust_score`, `popular`
  - `limit`: 1-100 (default 20), `offset`: int (default 0), or `page` & `page_size`
- **Response (200 OK)**: `{"items": [OpportunityListItem], "total": int, "limit": int, "offset": int}`
- Note: Always filters `deleted_at IS NULL` and `status = 'published'`.

### `GET /api/v1/opportunities/{slug}`
- **Auth**: None (Public)
- **Response (200 OK)**: `OpportunityDetail` schema. Increments `view_count` atomically.
- **Errors**: `404 Not Found` (draft, pending, rejected, archived, deleted, or nonexistent).

### `GET /api/v1/tags`
- **Auth**: None
- **Response (200 OK)**: List of `{"name": str, "slug": str, "count": int}` for published listings.

### `GET /api/v1/opportunities/types`
- **Auth**: None
- **Response (200 OK)**: List of `{"type": str, "count": int}` for published listings.

### `POST /api/v1/opportunities/{id}/save` & `DELETE /api/v1/opportunities/{id}/save`
- **Auth**: Bearer Token
- **Response**: `200 OK` (Save) / `204 No Content` (Unsave). Both are idempotent.

### `GET /api/v1/me/saved`
- **Auth**: Bearer Token
- **Response (200 OK)**: Paginated `OpportunityListItem` bookmarked by the current user.

### `POST /api/v1/opportunities/{id}/report`
- **Auth**: Bearer Token
- **Rate Limit**: 10 req/min
- **Request**: `{"reason": "scam"|"expired"|"misleading"|"duplicate"|"inappropriate"|"other", "details": "string"}`
- **Response (201 Created)**: `ReportRead`
- **Errors**: `400 Bad Request` (Cannot report own posting), `409 Conflict` (Already reported for this reason), `404 Not Found`.

---

## 4. Organizer Operations

### `POST /api/v1/organizations/{org_id}/opportunities`
- **Auth**: Bearer Token (Roles: `organizer`, `moderator`, `admin` AND member of the org)
- **Request**: `OpportunityOrganizerCreate`
- **Response (201 Created)**: `OpportunityDetail` (Created in `draft` status)
- **Errors**: `403 Forbidden` (Not an org member), `404 Not Found` (Org doesn't exist), `422 Unprocessable Content`.

### `PATCH /api/v1/opportunities/{id}`
- **Auth**: Bearer Token (Organizer member of opportunity's org)
- **Request**: `OpportunityOrganizerUpdate`
- **Response (200 OK)**: `OpportunityDetail`

### `DELETE /api/v1/opportunities/{id}`
- **Auth**: Bearer Token (Organizer member of opportunity's org)
- **Response (204 No Content)**
- **Errors**: `400 Bad Request` (Blocked if active applications exist), `403 Forbidden`, `404 Not Found`.

### `POST /api/v1/opportunities/{id}/submit`
- **Auth**: Bearer Token (Organizer member of opportunity's org)
- **Response (200 OK)**: `OpportunityDetail` (Status changes to `pending_review`)

### `GET /api/v1/me/opportunities`
- **Auth**: Bearer Token (Organizer)
- **Response (200 OK)**: Paginated listings owned or associated with the organizer.

---

## 5. Moderation & Admin

### `GET /api/v1/admin/opportunities`
- **Auth**: Staff (Moderator or Admin)
- **Query**: `status=pending_review`, `q`, `limit`, `offset`
- **Response (200 OK)**: `Page[OpportunityAdminRead]`

### `POST /api/v1/admin/opportunities/{id}/approve`
- **Auth**: Staff (Moderator or Admin)
- **Request**: `{"verification_status": "verified", "trust_score": 90}` (both optional)
- **Response (200 OK)**: `OpportunityAdminRead`
- **Errors**: `403 Forbidden` (Moderator cannot approve own posting), `404 Not Found`.

### `POST /api/v1/admin/opportunities/{id}/reject`
- **Auth**: Staff (Moderator or Admin)
- **Request**: `{"reason": "Explanation of rejection"}`
- **Response (200 OK)**: `OpportunityAdminRead`. Sends system notification to the organizer.

---

## 6. Notifications

### `GET /api/v1/notifications`
- **Auth**: Bearer Token
- **Response (200 OK)**: `Page[NotificationRead]`

### `POST /api/v1/notifications/{id}/read`
- **Auth**: Bearer Token
- **Response (200 OK)**: `NotificationRead` (404 if unowned).

### `POST /api/v1/notifications/read-all`
- **Auth**: Bearer Token
- **Response (200 OK)**: `{"message": "X notifications marked as read."}`

---

## 7. About & Team

### `GET /api/v1/about/team`
- **Auth**: None (Public)
- **Response (200 OK)**: Active team members sorted by `display_order asc, created_at asc`.

### `POST /api/v1/admin/about/team`
- **Auth**: Admin only
- **Request**: `TeamMemberCreate`
- **Response (201 Created)**: `TeamMemberRead`

### `PATCH /api/v1/admin/about/team/{id}`
- **Auth**: Admin only
- **Response (200 OK)**: `TeamMemberRead`

### `DELETE /api/v1/admin/about/team/{id}`
- **Auth**: Admin only
- **Response**: `204 No Content`

### `PUT /api/v1/admin/about/team/reorder`
- **Auth**: Admin only
- **Request**: `{"orders": [{"id": "uuid", "display_order": 1}]}`
- **Response (200 OK)**: Reordered list of team members.


---

# Phase 2: Events, QR Passes & Admin Portal

## Public Events Endpoints

### 1. `GET /api/v1/events`
List published events with optional filtering and pagination.
- **Auth**: Public (OptionalUser)
- **Query Params**:
  - `upcoming`: `bool` (default `true`) — filter events starting now or later
  - `mode`: `online | onsite | hybrid`
  - `q`: `string` — title/tagline search
  - `limit`: `int` (1-100, default 20)
  - `offset`: `int` (default 0)
- **Response (200 OK)**:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "slug": "hackquantum-2026",
        "title": "HackQuantum 2026",
        "tagline": "Quantum computing hackathon",
        "banner_url": "https://...",
        "thumbnail_url": "https://...",
        "starts_at": "2026-10-15T09:00:00Z",
        "ends_at": "2026-10-17T18:00:00Z",
        "timezone": "Asia/Kolkata",
        "mode": "hybrid",
        "venue_city": "Pilani",
        "capacity": 500,
        "capacity_remaining": 498,
        "is_full": false,
        "status": "published",
        "organization": { "id": "uuid", "name": "LaunchByte Org", "slug": "launchbyte", "logo_url": null }
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
  ```

### 2. `GET /api/v1/events/{slug}`
Get full event landing page data.
- **Auth**: Public (OptionalUser)
- **Response (200 OK)**: Full `EventDetailPublic` schema. Masks `online_url` and `venue_text` if user is unauthenticated or not registered. Returns `registration_state` (`open`, `closed`, `ended`, `event_full`, `registered`, `waitlisted`, `unverified_email`, `login_required`).

### 3. `POST /api/v1/events/{id}/register`
Register for an event with concurrency safety and automatic waitlisting.
- **Auth**: Authenticated User (verified email required)
- **Request Body**:
  ```json
  {
    "answers": { "track": "AI", "tshirt_size": "L" }
  }
  ```
- **Response (201 Created / 200 OK)**: `EventRegistrationRead` (id, status, registration_code, waitlist_position, registered_at).
- **Errors**: 400 (unverified email, closed), 404 (event not found), 409 (full and waitlist disabled).

### 4. `POST /api/v1/events/{id}/cancel-registration`
Cancel registration and automatically promote the next waitlisted user (FIFO).
- **Auth**: Authenticated User (must own registration)
- **Response (200 OK)**: Updated `EventRegistrationRead` (`status = "cancelled"`).

### 5. `GET /api/v1/registrations/{id}/pass`
Fetch signed QR pass metadata.
- **Auth**: Authenticated User (owner or event staff)
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJ...",
    "registration_code": "HQ26-A1B2C3D4",
    "qr_nonce": "random16",
    "status": "registered",
    "event_title": "HackQuantum 2026",
    "starts_at": "2026-10-15T09:00:00Z",
    "ends_at": "2026-10-17T18:00:00Z",
    "venue_text": "BITS Pilani",
    "online_url": "https://meet.launchbyte.io/hq26",
    "attendee_name": "Attendee Name"
  }
  ```

### 6. `GET /api/v1/registrations/{id}/pass.png`
Render QR code image at error correction level Q.
- **Auth**: Authenticated User (owner or event staff)
- **Response (200 OK)**: `image/png` binary.

### 7. `POST /api/v1/registrations/{id}/pass/rotate`
Rotate pass nonce and invalidate previous QR code tokens.
- **Auth**: Authenticated User (owner or event manager)
- **Response (200 OK)**: `PassTokenRead` with new token and nonce.

### 8. `POST /api/v1/events/{id}/check-in`
Check in attendee via signed QR token or manual registration code.
- **Auth**: Event Staff (role in `organizer`, `scanner`, `volunteer`) or Admin/Moderator
- **Request Body**:
  ```json
  { "token": "eyJ..." } // OR { "registration_code": "HQ26-A1B2C3D4" }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Checked in successfully",
    "attendee_name": "Attendee Name",
    "registration_code": "HQ26-A1B2C3D4"
  }
  ```
- **Errors**: 400 (invalid signature/expired/nonce mismatch), 403 (unauthorized scanner), 404 (not found), 409 (already checked in).

### 9. `GET /api/v1/me/registrations`
Get all event registrations for current user.
- **Auth**: Authenticated User
- **Response (200 OK)**: Array of `EventRegistrationRead`.

---

## Admin Events Endpoints

### 10. `GET /api/v1/admin/events`
List organizer/admin events.
- **Auth**: `organizer`, `moderator`, `admin`
- **Query Params**: `status`, `limit`, `offset`
- **Response (200 OK)**: Paginated `EventAdminRead`.

### 11. `POST /api/v1/admin/events`
Quick-create an event as draft (< 3 min setup).
- **Auth**: `organizer`, `admin`
- **Request Body**: `EventQuickCreate`
- **Response (201 Created)**: `EventDetailAdmin`

### 12. `GET /api/v1/admin/events/{id}`
Get full admin event details including sections and question configurations.
- **Auth**: Event manager or Admin

### 13. `PATCH /api/v1/admin/events/{id}`
Update event details. Validates capacity cannot drop below current active registrations.
- **Auth**: Event manager or Admin

### 14. `DELETE /api/v1/admin/events/{id}`
Soft-delete draft event.
- **Auth**: Event manager or Admin

### 15. `POST /api/v1/admin/events/{id}/publish`
Publish event. Automatically creates or updates synced `Opportunity` row so the event appears in the opportunity catalog.
- **Auth**: Event manager or Admin

### 16. `POST /api/v1/admin/events/{id}/unpublish`
Unpublish event to draft. Syncs opportunity status to `draft`.
- **Auth**: Event manager or Admin

### 17. `POST /api/v1/admin/events/{id}/close`
Close registration for this event.
- **Auth**: Event manager or Admin

### 18. `POST /api/v1/admin/events/{id}/cancel`
Cancel event and notify registrants.
- **Auth**: Event manager or Admin

### 19. `GET /api/v1/admin/events/{id}/registrations`
Paginated attendee list with status filter, search query, and answers.
- **Auth**: Event manager or Admin

### 20. `POST /api/v1/admin/events/{id}/registrations/{rid}/approve`
Approve a pending registration.
- **Auth**: Event manager or Admin

### 21. `POST /api/v1/admin/events/{id}/registrations/{rid}/reject`
Reject a pending registration.
- **Auth**: Event manager or Admin

### 22. `POST /api/v1/admin/events/{id}/registrations/{rid}/undo-check-in`
Undo check-in status back to `registered`.
- **Auth**: Event manager or Admin

### 23. `GET /api/v1/admin/events/{id}/stats`
Event registration metrics (registered, waitlisted, checked_in, checkins_by_hour).
- **Auth**: Event manager or Admin

### 24. `GET /api/v1/admin/events/{id}/registrations/export`
Stream CSV export of all attendees with CSV injection neutralization (prefixing formula characters `=`, `+`, `-`, `@` with `'`).
- **Auth**: Event manager or Admin
- **Response (200 OK)**: `text/csv` attachment.

### 25. `GET /api/v1/admin/events/{id}/staff`
List staff assigned to this event.
- **Auth**: Event manager or Admin

### 26. `POST /api/v1/admin/events/{id}/staff`
Add scanner, organizer, or volunteer staff by user email.
- **Auth**: Event manager or Admin
- **Request Body**: `{ "email": "scanner@example.com", "role": "scanner" }`

### 27. `DELETE /api/v1/admin/events/{id}/staff/{user_id}`
Remove staff member from event.
- **Auth**: Event manager or Admin


---

# Phase 4: Developer Networking, Messaging & Projects API

## Connections & Networking

### 1. `POST /api/v1/connections/requests`
Request a connection with another developer by handle or user ID.
- **Auth**: User (email verified)
- **Rate Limit**: Max 30 requests/day, max 200 pending requests.
- **Request Body**:
  ```json
  {
    "handle": "bob",
    "message": "Hey Bob, let's team up for HackMIT!"
  }
  ```
- **Response (201 Created)**: `ConnectionRead`

### 2. `GET /api/v1/connections`
List approved connections for the current user (paginated).
- **Auth**: User
- **Query Params**: `status`, `page`, `per_page`
- **Response (200 OK)**: `Page[ConnectionRead]`

### 3. `GET /api/v1/connections/requests`
List pending connection requests.
- **Auth**: User
- **Query Params**: `direction=incoming|outgoing`
- **Response (200 OK)**: `List[ConnectionRead]`

### 4. `POST /api/v1/connections/requests/{id}/accept`
Accept a pending inbound connection request.
- **Auth**: User (addressee)
- **Response (200 OK)**: `ConnectionRead`

### 5. `POST /api/v1/connections/requests/{id}/decline`
Decline a pending inbound connection request.
- **Auth**: User (addressee)
- **Response (200 OK)**: `ConnectionRead`

### 6. `POST /api/v1/connections/requests/{id}/cancel`
Cancel an outgoing pending request.
- **Auth**: User (requester)
- **Response (200 OK)**: `ConnectionRead`

### 7. `DELETE /api/v1/connections/{id}`
Remove an existing connection.
- **Auth**: User (participant)
- **Response (204 No Content)**

### 8. `GET /api/v1/network/suggestions`
Discover suggested peers with match scores and reason chips (shared skills, mutual hackathon events, institution).
- **Auth**: User
- **Query Params**: `limit` (default 20, max 50)
- **Response (200 OK)**: `List[NetworkSuggestion]`

### 9. `POST /api/v1/blocks` & `DELETE /api/v1/blocks/{user_id}`
Block or unblock a user.
- **Auth**: User
- **Request Body**: `{ "user_id": "<uuid>", "reason": "optional" }`

---

## Messaging & Real-Time Chat

### 10. `GET /api/v1/conversations`
List all conversations (direct and team chats) with latest message and unread count.
- **Auth**: User
- **Response (200 OK)**: `List[ConversationRead]`

### 11. `POST /api/v1/conversations/direct`
Create or fetch direct conversation with another user. Enforces connection or team co-membership.
- **Auth**: User
- **Request Body**: `{ "user_id": "<uuid>" }`
- **Response (201 Created / 200 OK)**: `ConversationRead`

### 12. `GET /api/v1/conversations/{id}/messages`
Fetch messages in a conversation using cursor pagination.
- **Auth**: User (participant)
- **Query Params**: `cursor`, `limit` (max 100)
- **Response (200 OK)**: `ConversationMessagesPage`

### 13. `POST /api/v1/conversations/{id}/messages`
Send a message. Supports `client_msg_id` for client retries and idempotency.
- **Auth**: User (active participant)
- **Request Body**:
  ```json
  {
    "body": "Hello world!",
    "client_msg_id": "client-nonce-1"
  }
  ```
- **Response (201 Created)**: `MessageRead`

### 14. `PATCH /api/v1/messages/{id}`
Edit a sent message within a 15-minute window.
- **Auth**: User (author)
- **Request Body**: `{ "body": "Updated text" }`
- **Response (200 OK)**: `MessageRead`

### 15. `DELETE /api/v1/messages/{id}`
Soft-delete a message (sets `deleted_at`, body masked to `"This message was deleted"`).
- **Auth**: User (author or moderator/admin)
- **Response (204 No Content)**

### 16. `POST /api/v1/conversations/{id}/read`
Mark conversation messages as read.
- **Auth**: User (participant)
- **Request Body**: `{ "message_id": "<uuid>" }`

### 17. `POST /api/v1/messages/{id}/report`
Report a message to moderators for abuse, spam, or harassment.
- **Auth**: User
- **Request Body**: `{ "reason": "spam", "details": "Unsolicited promotional links" }`

### 18. `POST /api/v1/ws/ticket`
Obtain a single-use ticket for WebSocket authentication.
- **Auth**: User
- **Response (200 OK)**: `{ "ticket": "<token>", "expires_in": 60 }`

### 19. `WebSocket /ws?ticket=<ticket>`
Real-time bi-directional messaging, heartbeat, and typing indicators (see `docs/websocket.md`).

---

## Collaborative Projects & Teams

### 20. `GET /api/v1/projects`
List projects with search, tech stack filtering, and visibility enforcement.
- **Auth**: Public / User (Connections and private projects filtered according to access)
- **Query Params**: `search`, `tech_stack`, `looking_for`, `page`, `per_page`
- **Response (200 OK)**: `Page[ProjectListItem]`

### 21. `POST /api/v1/projects`
Create a project. Auto-provisions a team and team chat room.
- **Auth**: User
- **Request Body**:
  ```json
  {
    "title": "Decentralized AI Agents",
    "summary": "Autonomous AI hackathon agents",
    "description": "## Architecture...",
    "repo_url": "https://github.com/org/repo",
    "tech_stack": ["python", "solidity", "fastapi"],
    "looking_for": ["Frontend Dev", "Smart Contract Auditor"],
    "visibility": "public"
  }
  ```
- **Response (201 Created)**: `ProjectDetail`

### 22. `GET /api/v1/projects/{slug_or_id}`
Get project details.
- **Auth**: Public (if public) or User

### 23. `PATCH /api/v1/projects/{slug_or_id}` & `DELETE /api/v1/projects/{slug_or_id}`
Update or delete a project.
- **Auth**: Project owner

### 24. `POST /api/v1/projects/{slug_or_id}/collab-requests`
Submit collaboration request to join project team.
- **Auth**: User
- **Request Body**: `{ "message": "I'd love to help with smart contracts" }`
- **Response (201 Created)**: `ProjectCollabRequestRead`

### 25. `POST /api/v1/projects/{slug_or_id}/collab-requests/{req_id}/accept`
Accept a collaboration request. Synchronizes member into team and team chat.
- **Auth**: Project owner

### 26. `POST /api/v1/projects/{slug_or_id}/collab-requests/{req_id}/reject`
Reject a collaboration request.
- **Auth**: Project owner

### 27. `POST /api/v1/projects/{slug_or_id}/collab-requests/withdraw`
Withdraw pending collaboration request.
- **Auth**: Applicant

### 28. `DELETE /api/v1/projects/{slug_or_id}/members/me`
Leave a project. Revokes team chat access.
- **Auth**: Member

---

## Moderator Actions (Audit Logged)

### 29. `GET /api/v1/admin/moderation/message-reports`
List flagged messages.
- **Auth**: Moderator or Admin

### 30. `POST /api/v1/admin/moderation/message-reports/{id}/action`
Action or dismiss a report. Deletes message if requested, logs to `audit_logs`.
- **Auth**: Moderator or Admin
- **Request Body**: `{ "action": "delete_message", "action_notes": "Violation of community rules" }`

---

## Phase 3: Developer Profiles & Event Team Building

### 31. `GET /api/v1/me/profile`
Get current user's profile with privacy settings and throttle metadata.
- **Auth**: User (Bearer Token)
- **Response (200 OK)**: `MyProfileRead`

### 32. `PUT /api/v1/me/profile`
Update current user's profile. Handle changes enforce a 30-day throttle limit.
- **Auth**: User (Bearer Token)
- **Request Body**: `ProfileUpdate`
- **Response (200 OK)**: `MyProfileRead`
- **Errors**: `400 Bad Request` (`HANDLE_THROTTLED`), `409 Conflict` (Handle taken).

### 33. `POST /api/v1/me/profile/avatar`
Upload user profile avatar (JPEG, PNG, WebP up to 2MB).
- **Auth**: User (Bearer Token)
- **Request**: Multipart Form Data (`file`)
- **Response (200 OK)**: `{ "avatar_url": "https://..." }`

### 34. `GET /api/v1/profiles/{handle}`
Get public developer profile. Respects privacy flags (`is_public`, `show_github`, `show_linkedin`).
- **Auth**: Public / Optional User
- **Response (200 OK)**: `PublicProfileRead`
- **Errors**: `404 Not Found` (Masks private profiles as 404).

### 35. `GET /api/v1/people/discover`
Discover available teammates with skills, event filtering, and match scoring.
- **Auth**: Public / User
- **Query Params**: `q`, `skills` (comma-separated), `event_id`, `role`, `limit`, `offset`
- **Response (200 OK)**: `List[TeammateCandidateRead]`

### 36. `POST /api/v1/teams`
Create a hackathon or independent team. Enforces event registration if `event_id` is supplied.
- **Auth**: User
- **Request Body**: `TeamCreate`
- **Response (201 Created)**: `TeamDetail`

### 37. `GET /api/v1/teams` & `GET /api/v1/me/teams`
- `GET /api/v1/teams`: Discover public active teams with search and skills filtering.
- `GET /api/v1/me/teams`: List all teams the current user leads or belongs to.
- **Auth**: Public / User
- **Response (200 OK)**: `List[TeamDetail]`

### 38. `GET /api/v1/teams/{slug}`
Get team detail including roster and open spots.
- **Auth**: Public / User
- **Response (200 OK)**: `TeamDetail`

### 39. `PATCH /api/v1/teams/{team_id}`
Update team details (name, description, looking_for_skills, max_size, visibility).
- **Auth**: Team Leader
- **Response (200 OK)**: `TeamDetail`

### 40. `POST /api/v1/teams/{team_id}/invites`
Invite a teammate by handle or user ID.
- **Auth**: Team Leader
- **Request Body**: `{ "handle": "janedoe", "message": "Come build with us!" }`
- **Response (201 Created)**: `TeamInviteRead`

### 41. `GET /api/v1/me/invites`
List team invitations received by the current user.
- **Auth**: User
- **Response (200 OK)**: `List[TeamInviteRead]`

### 42. `POST /api/v1/invites/{invite_id}/accept` & `POST /api/v1/invites/{invite_id}/decline`
Accept or decline an invitation. Uses row locking (`FOR UPDATE`) to prevent capacity overflow.
- **Auth**: Invited User
- **Response**: `TeamDetail` (on accept) / `204 No Content` (on decline)

### 43. `POST /api/v1/teams/{team_id}/join-requests`
Request to join a team.
- **Auth**: User
- **Request Body**: `{ "message": "I'm a senior frontend dev interested in your project" }`
- **Response (201 Created)**: `TeamJoinRequestRead`

### 44. `POST /api/v1/join-requests/{request_id}/accept` & `reject`
Accept or reject an inbound join request. Automatically closes team if capacity reaches `max_size`.
- **Auth**: Team Leader
- **Response**: `TeamDetail` (on accept) / `204 No Content` (on reject)

### 45. `POST /api/v1/teams/{team_id}/leave` & `POST /api/v1/teams/{team_id}/disband`
- `leave`: Leave team (leaders must transfer leadership first).
- `disband`: Disband team and archive team conversation.
- **Auth**: Team Member / Leader

### 46. `POST /api/v1/admin/events/{event_id}/lock-teams`
Organizer control to lock team modifications before judging or hackathon starts.
- **Auth**: Event Organizer / Admin
- **Response (200 OK)**: `{ "locked": true, "event_id": "...", "teams_locked_count": 12 }`

