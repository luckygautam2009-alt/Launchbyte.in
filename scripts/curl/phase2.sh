#!/usr/bin/env bash
set -euo pipefail

# LaunchByte Phase 2 Verification Script
# Tests every Phase 2 event endpoint with curl and asserts HTTP status codes.

BASE_URL="${BASE_URL:-http://localhost:8000}"
API_URL="${BASE_URL}/api/v1"

echo "=========================================================="
echo " Starting LaunchByte Phase 2 Endpoint Verification Suite"
echo " Target: ${API_URL}"
echo "=========================================================="

FAILED=0

assert_status() {
    local step_name="$1"
    local expected="$2"
    local actual="$3"
    local body="$4"

    if [ "$actual" -eq "$expected" ]; then
        echo " [PASS] ${step_name} (HTTP ${actual})"
    else
        echo " [FAIL] ${step_name}: expected HTTP ${expected}, got HTTP ${actual}"
        echo "        Response: ${body}"
        FAILED=1
        exit 1
    fi
}

RANDOM_SUFFIX=$(date +%s%N | cut -b1-8)

# 1. Login as Admin
echo "--- Auth Setup ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=admin@launchbyte.io&password=adminpassword123")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Login as Admin" 200 "$HTTP_CODE" "$BODY"
ADMIN_TOKEN=$(echo "$BODY" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# 2. Login as regular user (seed student)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=student@launchbyte.io&password=studentpassword123")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Login as Seed Student" 200 "$HTTP_CODE" "$BODY"
STUDENT_TOKEN=$(echo "$BODY" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# 3. Register two new users with verified emails for capacity & waitlist testing
USER_A_EMAIL="attendee_a_${RANDOM_SUFFIX}@example.com"
USER_B_EMAIL="attendee_b_${RANDOM_SUFFIX}@example.com"
PASSWORD="securepassword123"

# Register User A
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/users" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${USER_A_EMAIL}\",\"password\":\"${PASSWORD}\",\"full_name\":\"Attendee A\"}")
assert_status "Register User A" 201 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${USER_A_EMAIL}&password=${PASSWORD}")
USER_A_TOKEN=$(echo "$RESP" | sed '$d' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Register User B
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/users" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${USER_B_EMAIL}\",\"password\":\"${PASSWORD}\",\"full_name\":\"Attendee B\"}")
assert_status "Register User B" 201 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${USER_B_EMAIL}&password=${PASSWORD}")
USER_B_TOKEN=$(echo "$RESP" | sed '$d' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo "--- Admin Events CRUD ---"
# 4. Quick Create Event (POST /admin/events) with capacity=1 and waitlist enabled
EVENT_TITLE="CurlCon ${RANDOM_SUFFIX}"
STARTS_AT=$(date -u -v+7d "+%Y-%m-%dT10:00:00Z" 2>/dev/null || date -u -d "+7 days" "+%Y-%m-%dT10:00:00Z")
ENDS_AT=$(date -u -v+8d "+%Y-%m-%dT18:00:00Z" 2>/dev/null || date -u -d "+8 days" "+%Y-%m-%dT18:00:00Z")

CREATE_PAYLOAD=$(cat <<EOF
{
  "title": "${EVENT_TITLE}",
  "tagline": "The premier cURL hackathon",
  "starts_at": "${STARTS_AT}",
  "ends_at": "${ENDS_AT}",
  "timezone": "UTC",
  "mode": "online",
  "online_url": "https://meet.launchbyte.io/curlcon",
  "capacity": 1,
  "waitlist_enabled": true,
  "requires_approval": false,
  "theme_accent": "#6366f1",
  "sections": {
    "schedule": [{"time": "10:00", "title": "Opening Keynote"}],
    "prizes": [{"rank": "1st", "amount": "$5,000"}],
    "faqs": [{"question": "Who can attend?", "answer": "Anyone!"}]
  }
}
EOF
)

RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/admin/events" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "${CREATE_PAYLOAD}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Create Event as Draft" 201 "$HTTP_CODE" "$BODY"
EVENT_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
EVENT_SLUG=$(echo "$BODY" | grep -o '"slug":"[^"]*' | head -1 | cut -d'"' -f4)

# 5. Non-admin forbidden from creating admin event (403)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/admin/events" \
    -H "Authorization: Bearer ${STUDENT_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "${CREATE_PAYLOAD}")
assert_status "Regular User Forbidden to Create Admin Event" 403 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# 6. Update Event (PATCH /admin/events/{id})
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "${API_URL}/admin/events/${EVENT_ID}" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"tagline\":\"Updated tagline for cURL enthusiasts\"}")
assert_status "Update Event" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# 7. Public detail hidden while draft (404)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/events/${EVENT_SLUG}")
assert_status "Draft Event Not Visible Publicly" 404 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# 8. Publish Event (POST /admin/events/{id}/publish)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/admin/events/${EVENT_ID}/publish" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}")
assert_status "Publish Event" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

echo "--- Public Events API ---"
# 9. Public Listing (GET /events)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/events?limit=10")
assert_status "List Public Events" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# 10. Public Detail (GET /events/{slug})
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/events/${EVENT_SLUG}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Get Public Event Detail" 200 "$HTTP_CODE" "$BODY"

# Verify online_url is MASKED (hidden) for unauthenticated/unregistered
if echo "$BODY" | grep -q '"online_url":null'; then
    echo " [PASS] Sensitive field online_url correctly masked from public"
else
    echo " [FAIL] Sensitive field online_url was leaked in public response!"
    exit 1
fi

echo "--- Registration, Capacity & Waitlist ---"
# 11. Register User A (Fills the 1 spot)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/events/${EVENT_ID}/register" \
    -H "Authorization: Bearer ${USER_A_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"answers":{}}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Register User A (Capacity Spot)" 201 "$HTTP_CODE" "$BODY"
REG_A_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
REG_A_CODE=$(echo "$BODY" | grep -o '"registration_code":"[^"]*' | head -1 | cut -d'"' -f4)

# 12. Register User B (Capacity full -> goes to waitlist #1)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/events/${EVENT_ID}/register" \
    -H "Authorization: Bearer ${USER_B_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"answers":{}}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Register User B (Waitlisted)" 201 "$HTTP_CODE" "$BODY"
if echo "$BODY" | grep -q '"status":"waitlisted"'; then
    echo " [PASS] User B correctly placed on waitlist"
else
    echo " [FAIL] User B expected status waitlisted, got: $BODY"
    exit 1
fi

# 13. Idempotent re-registration returns existing registration (200)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/events/${EVENT_ID}/register" \
    -H "Authorization: Bearer ${USER_A_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"answers":{}}')
assert_status "Re-registration Is Idempotent" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# 14. List User Registrations (GET /me/registrations)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/me/registrations" \
    -H "Authorization: Bearer ${USER_A_TOKEN}")
assert_status "Get User Registrations" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

echo "--- QR Entry Pass & Security ---"
# 15. Get Pass JSON (GET /registrations/{id}/pass)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/registrations/${REG_A_ID}/pass" \
    -H "Authorization: Bearer ${USER_A_TOKEN}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Get Pass JSON" 200 "$HTTP_CODE" "$BODY"
PASS_TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*' | head -1 | cut -d'"' -f4)

# 16. Get Pass PNG (GET /registrations/{id}/pass.png)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/registrations/${REG_A_ID}/pass.png" \
    -H "Authorization: Bearer ${USER_A_TOKEN}")
assert_status "Get Pass PNG Image" 200 "$(echo "$RESP" | tail -n1)" "[PNG binary]"

# 17. Unauthorized user cannot access User A's pass (404 / 403)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/registrations/${REG_A_ID}/pass" \
    -H "Authorization: Bearer ${USER_B_TOKEN}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
if [ "$HTTP_CODE" -eq 403 ] || [ "$HTTP_CODE" -eq 404 ]; then
    echo " [PASS] Ownership boundary: User B denied access to User A's pass (HTTP ${HTTP_CODE})"
else
    echo " [FAIL] Expected 403/404 on cross-user pass access, got HTTP ${HTTP_CODE}"
    exit 1
fi

echo "--- Check-in Scanner & Verification ---"
# 18. Add student as scanner staff for this event
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/admin/events/${EVENT_ID}/staff" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"student@launchbyte.io\",\"role\":\"scanner\"}")
assert_status "Add Scanner Staff" 201 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# 19. Check in attendee using signed QR token
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/events/${EVENT_ID}/check-in" \
    -H "Authorization: Bearer ${STUDENT_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"${PASS_TOKEN}\"}")
assert_status "Check-in Attendee via Token" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# 20. Duplicate check-in rejected (409)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/events/${EVENT_ID}/check-in" \
    -H "Authorization: Bearer ${STUDENT_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"${PASS_TOKEN}\"}")
assert_status "Duplicate Check-in Rejected" 409 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# 21. Forged / invalid token rejected (400 or 401 or 422)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/events/${EVENT_ID}/check-in" \
    -H "Authorization: Bearer ${STUDENT_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"token":"forged.invalid.token"}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
if [ "$HTTP_CODE" -ge 400 ] && [ "$HTTP_CODE" -lt 500 ]; then
    echo " [PASS] Forged token rejected (HTTP ${HTTP_CODE})"
else
    echo " [FAIL] Forged token should return 4xx, got HTTP ${HTTP_CODE}"
    exit 1
fi

# 22. Undo check-in (POST /admin/events/{id}/registrations/{rid}/undo-check-in)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/admin/events/${EVENT_ID}/registrations/${REG_A_ID}/undo-check-in" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}")
assert_status "Undo Check-in" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# 23. Check-in via manual registration code fallback
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/events/${EVENT_ID}/check-in" \
    -H "Authorization: Bearer ${STUDENT_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"registration_code\":\"${REG_A_CODE}\"}")
assert_status "Check-in Attendee via Manual Code" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

echo "--- FIFO Waitlist Promotion ---"
# 24. Cancel User A's registration -> User B automatically promoted from waitlist to registered
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/events/${EVENT_ID}/cancel-registration" \
    -H "Authorization: Bearer ${USER_A_TOKEN}")
assert_status "Cancel Registration" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# 25. Verify User B is now promoted to REGISTERED
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/me/registrations" \
    -H "Authorization: Bearer ${USER_B_TOKEN}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if echo "$BODY" | grep -q '"status":"registered"'; then
    echo " [PASS] User B automatically promoted to 'registered' upon User A cancellation (FIFO)"
else
    echo " [FAIL] Expected User B status to be 'registered', got: $BODY"
    exit 1
fi

echo "--- Event Stats & Admin Reports ---"
# 26. Get Event Stats (GET /admin/events/{id}/stats)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/admin/events/${EVENT_ID}/stats" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}")
assert_status "Get Event Stats" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# 27. Export Registrations CSV (GET /admin/events/{id}/registrations/export)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/admin/events/${EVENT_ID}/registrations/export" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}")
assert_status "Export Registrations CSV" 200 "$(echo "$RESP" | tail -n1)" "[CSV content]"

# 28. Close Event (POST /admin/events/{id}/close)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/admin/events/${EVENT_ID}/close" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}")
assert_status "Close Event Registration" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# 29. Cancel Event (POST /admin/events/{id}/cancel)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/admin/events/${EVENT_ID}/cancel" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}")
assert_status "Cancel Event" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

echo "=========================================================="
echo " ALL 29 PHASE 2 ENDPOINT CHECKS PASSED SUCCESSFULLY! "
echo "=========================================================="
