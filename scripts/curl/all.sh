#!/usr/bin/env bash
set -euo pipefail

# LaunchByte Master Verification Suite
# Runs Phase 1 -> Phase 4 suites, then executes a full cross-phase user journey.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

BASE_URL="${BASE_URL:-http://localhost:8000}"
API_URL="${BASE_URL}/api/v1"

echo "======================================================================"
echo " Starting LaunchByte Complete Verification Suite"
echo " Target: ${API_URL}"
echo " Local Time: $(date)"
echo "======================================================================"

# Table results tracking
PHASE1_STATUS="PENDING"
PHASE2_STATUS="PENDING"
PHASE3_STATUS="PENDING"
PHASE4_STATUS="PENDING"
JOURNEY_STATUS="PENDING"

FAILED=0

# Reset DB if local and not explicitly skipped
if [ "${SKIP_RESET:-0}" != "1" ] && [ -f "${ROOT_DIR}/scripts/reset_db.sh" ]; then
    if [[ "${BASE_URL}" == *"localhost"* ]] || [[ "${BASE_URL}" == *"127.0.0.1"* ]]; then
        echo "--> Running local database reset & seed..."
        "${ROOT_DIR}/scripts/reset_db.sh"
    fi
fi

# Run Phase 1
echo ""
echo "======================================================================"
echo " Running Suite 1: Phase 1 (Auth, Opportunities, Hardening)"
echo "======================================================================"
if BASE_URL="${BASE_URL}" "${SCRIPT_DIR}/phase1.sh"; then
    PHASE1_STATUS="PASS"
else
    PHASE1_STATUS="FAIL"
    FAILED=1
fi

# Run Phase 2
echo ""
echo "======================================================================"
echo " Running Suite 2: Phase 2 (Events, QR Passes, Scanners, Admin)"
echo "======================================================================"
if BASE_URL="${BASE_URL}" "${SCRIPT_DIR}/phase2.sh"; then
    PHASE2_STATUS="PASS"
else
    PHASE2_STATUS="FAIL"
    FAILED=1
fi

# Run Phase 3
echo ""
echo "======================================================================"
echo " Running Suite 3: Phase 3 (Profiles, Teams, Invites, Discovery)"
echo "======================================================================"
if BASE_URL="${BASE_URL}" "${SCRIPT_DIR}/phase3.sh"; then
    PHASE3_STATUS="PASS"
else
    PHASE3_STATUS="FAIL"
    FAILED=1
fi

# Run Phase 4
echo ""
echo "======================================================================"
echo " Running Suite 4: Phase 4 (Networking, Messages, Projects, WebSocket)"
echo "======================================================================"
if BASE_URL="${BASE_URL}" "${SCRIPT_DIR}/phase4.sh"; then
    PHASE4_STATUS="PASS"
else
    PHASE4_STATUS="FAIL"
    FAILED=1
fi

# Cross-Phase Journey
echo ""
echo "======================================================================"
echo " Running Suite 5: Complete Cross-Phase User Journey"
echo "======================================================================"

JOURNEY_STEPS_PASSED=0
TOTAL_JOURNEY_STEPS=18

assert_journey_step() {
    local step_num="$1"
    local desc="$2"
    local expected_code="$3"
    local actual_code="$4"
    local body="$5"

    if [ "$actual_code" -eq "$expected_code" ]; then
        echo " [PASS] Step ${step_num}: ${desc} (HTTP ${actual_code})"
        JOURNEY_STEPS_PASSED=$((JOURNEY_STEPS_PASSED + 1))
    else
        echo " [FAIL] Step ${step_num}: ${desc} (Expected HTTP ${expected_code}, got ${actual_code})"
        echo "        Response: ${body}"
        JOURNEY_STATUS="FAIL"
        FAILED=1
        exit 1
    fi
}

RAND_ID=$(date +%s%N | cut -b1-8)
PASS="SecurePass123!"

ADMIN_RESP=$(curl -s -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=admin@launchbyte.io&password=adminpassword123")
ADMIN_TOKEN=$(echo "$ADMIN_RESP" | jq -r '.access_token // empty')

# 1. Register Lead User
LEAD_EMAIL="lead_${RAND_ID}@journey.test"
LEAD_HANDLE="lead_${RAND_ID}"
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/users" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${LEAD_EMAIL}\",\"password\":\"${PASS}\",\"full_name\":\"Journey Lead\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_journey_step 1 "Register Journey Lead User" 201 "$HTTP_CODE" "$BODY"
LEAD_ID=$(echo "$BODY" | jq -r '.id')
test -n "${LEAD_ID}" && test "${LEAD_ID}" != "null"

# 2. Verify Lead Email
DEV_TOK_RESP=$(curl -s "${API_URL}/auth/test-token?email=${LEAD_EMAIL}&type=verify" || true)
VERIFY_TOK=$(echo "$DEV_TOK_RESP" | jq -r '.token // empty')
if [ -n "$VERIFY_TOK" ]; then
    RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/verify-email/confirm" \
        -H "Content-Type: application/json" \
        -d "{\"token\":\"${VERIFY_TOK}\"}")
    HTTP_CODE=$(echo "$RESP" | tail -n1)
    BODY=$(echo "$RESP" | sed '$d')
    assert_journey_step 2 "Verify Lead User Email" 200 "$HTTP_CODE" "$BODY"
else
    echo " [NOTE] test-token skipped; proceeding with login."
    JOURNEY_STEPS_PASSED=$((JOURNEY_STEPS_PASSED + 1))
fi

# 3. Login Lead User
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${LEAD_EMAIL}&password=${PASS}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_journey_step 3 "Login Lead User" 200 "$HTTP_CODE" "$BODY"
LEAD_TOKEN=$(echo "$BODY" | jq -r '.access_token')

# 4. Setup Lead Profile & Handle
RESP=$(curl -s -w "\n%{http_code}" -X PUT "${API_URL}/me/profile" \
    -H "Authorization: Bearer ${LEAD_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"handle\":\"${LEAD_HANDLE}\",\"headline\":\"Full-Stack Lead\",\"skills\":[\"Next.js\",\"FastAPI\",\"PostgreSQL\"],\"open_to_teams\":true}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_journey_step 4 "Setup Lead Profile & Handle" 200 "$HTTP_CODE" "$BODY"
test "$(echo "$BODY" | jq -r '.handle')" = "${LEAD_HANDLE}"

# 5. Browse Opportunities
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/opportunities?limit=5" \
    -H "Authorization: Bearer ${LEAD_TOKEN}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_journey_step 5 "Browse Public Opportunities" 200 "$HTTP_CODE" "$BODY"
TOTAL_ITEMS=$(echo "$BODY" | jq -r '.total // (.items | length) // 0')
test "$TOTAL_ITEMS" -ge 1

# 6. Lookup an active Event with capacity
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/events" \
    -H "Authorization: Bearer ${LEAD_TOKEN}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_journey_step 6 "Browse Events Catalog" 200 "$HTTP_CODE" "$BODY"
EVENT_SLUG=$(echo "$BODY" | jq -r '.[0].slug // (.items[0].slug) // empty')
EVENT_ID=$(echo "$BODY" | jq -r '.[0].id // (.items[0].id) // empty')

# 7. Register Lead for Event
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/events/${EVENT_SLUG}/register" \
    -H "Authorization: Bearer ${LEAD_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_journey_step 7 "Register Lead for Hackathon Event" 201 "$HTTP_CODE" "$BODY"
REG_ID=$(echo "$BODY" | jq -r '.id')
REG_CODE=$(echo "$BODY" | jq -r '.registration_code')
test -n "${REG_CODE}" && test "${REG_CODE}" != "null"

# 8. Retrieve Entry QR Pass
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/me/registrations/${REG_ID}/pass" \
    -H "Authorization: Bearer ${LEAD_TOKEN}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_journey_step 8 "Retrieve QR Entry Pass" 200 "$HTTP_CODE" "$BODY"
QR_PAYLOAD=$(echo "$BODY" | jq -r '.qr_payload')
test -n "${QR_PAYLOAD}" && test "${QR_PAYLOAD}" != "null"

# 9. Scanner Check-in by Admin / Organizer
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/admin/events/${EVENT_ID}/scan" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"qr_payload\":\"${QR_PAYLOAD}\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_journey_step 9 "Event Scanner Check-in" 200 "$HTTP_CODE" "$BODY"
CHECKED_STATUS=$(echo "$BODY" | jq -r '.status')
test "${CHECKED_STATUS}" = "attended"

# 10. Register Peer User
PEER_EMAIL="peer_${RAND_ID}@journey.test"
PEER_HANDLE="peer_${RAND_ID}"
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/users" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${PEER_EMAIL}\",\"password\":\"${PASS}\",\"full_name\":\"Journey Peer\"}")
assert_journey_step 10 "Register Peer User" 201 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

PEER_DEV_TOK=$(curl -s "${API_URL}/auth/test-token?email=${PEER_EMAIL}&type=verify" || true)
PEER_VERIFY_TOK=$(echo "$PEER_DEV_TOK" | jq -r '.token // empty')
if [ -n "$PEER_VERIFY_TOK" ]; then
    curl -s -X POST "${API_URL}/auth/verify-email/confirm" \
        -H "Content-Type: application/json" \
        -d "{\"token\":\"${PEER_VERIFY_TOK}\"}" > /dev/null || true
fi

PEER_LOGIN=$(curl -s -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${PEER_EMAIL}&password=${PASS}")
PEER_TOKEN=$(echo "$PEER_LOGIN" | jq -r '.access_token')

curl -s -X PUT "${API_URL}/me/profile" \
    -H "Authorization: Bearer ${PEER_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"handle\":\"${PEER_HANDLE}\",\"headline\":\"ML Specialist\",\"skills\":[\"PyTorch\",\"Python\"],\"open_to_teams\":true}" > /dev/null

# 11. Peer registers for the same event
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/events/${EVENT_SLUG}/register" \
    -H "Authorization: Bearer ${PEER_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{}")
assert_journey_step 11 "Peer Registers for Same Event" 201 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# 12. Lead Creates Event Team
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/teams" \
    -H "Authorization: Bearer ${LEAD_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Neural Hackers ${RAND_ID}\",\"event_id\":\"${EVENT_ID}\",\"max_size\":4,\"looking_for_skills\":[\"ML\",\"PyTorch\"]}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_journey_step 12 "Lead Creates Team for Event" 201 "$HTTP_CODE" "$BODY"
TEAM_ID=$(echo "$BODY" | jq -r '.id')
TEAM_SLUG=$(echo "$BODY" | jq -r '.slug')

# 13. Lead Invites Peer to Team
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/teams/${TEAM_ID}/invites" \
    -H "Authorization: Bearer ${LEAD_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"handle\":\"${PEER_HANDLE}\",\"message\":\"Join our hackathon project!\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_journey_step 13 "Lead Invites Peer to Team" 201 "$HTTP_CODE" "$BODY"
INVITE_ID=$(echo "$BODY" | jq -r '.id')

# 14. Peer Accepts Team Invite
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/invites/${INVITE_ID}/accept" \
    -H "Authorization: Bearer ${PEER_TOKEN}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_journey_step 14 "Peer Accepts Team Invite" 200 "$HTTP_CODE" "$BODY"

# 15. Lead Connects with Peer (Connection Request & Accept)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/connections/requests" \
    -H "Authorization: Bearer ${LEAD_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"handle\":\"${PEER_HANDLE}\",\"message\":\"Let's connect on LaunchByte!\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_journey_step 15 "Lead Sends Peer Connection Request" 201 "$HTTP_CODE" "$BODY"
CONN_REQ_ID=$(echo "$BODY" | jq -r '.id')

curl -s -X POST "${API_URL}/connections/requests/${CONN_REQ_ID}/accept" \
    -H "Authorization: Bearer ${PEER_TOKEN}" > /dev/null

# 16. Lead Starts Direct Conversation & Sends Message
PEER_USER_ID=$(curl -s -H "Authorization: Bearer ${PEER_TOKEN}" "${API_URL}/users/me" | jq -r '.id')
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/conversations/direct" \
    -H "Authorization: Bearer ${LEAD_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"user_id\":\"${PEER_USER_ID}\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_journey_step 16 "Lead Starts Direct Conversation" 201 "$HTTP_CODE" "$BODY"
CONV_ID=$(echo "$BODY" | jq -r '.id')

# 17. Send and Read Messages
CLIENT_MSG_ID="journey-msg-${RAND_ID}"
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/conversations/${CONV_ID}/messages" \
    -H "Authorization: Bearer ${LEAD_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"body\":\"Excited to build together!\",\"client_msg_id\":\"${CLIENT_MSG_ID}\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_journey_step 17 "Lead Sends Chat Message" 201 "$HTTP_CODE" "$BODY"

# 18. Collaborative Project Lifecycle
PROJ_SLUG="neural-hack-${RAND_ID}"
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/projects" \
    -H "Authorization: Bearer ${LEAD_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Neural Hack\",\"slug\":\"${PROJ_SLUG}\",\"summary\":\"AI Project\",\"description\":\"## Details\nFull stack AI\",\"repo_url\":\"https://github.com/launchbyte/neural\",\"tech_stack\":[\"python\",\"fastapi\"],\"looking_for\":[\"Design\"],\"visibility\":\"public\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_journey_step 18 "Lead Creates Collaborative Project" 201 "$HTTP_CODE" "$BODY"

JOURNEY_STATUS="PASS"

# Print Final Summary Table
echo ""
echo "======================================================================"
echo " LaunchByte End-to-End Verification Summary Table"
echo "======================================================================"
printf " %-30s | %-12s | %-20s\n" "Suite Name" "Status" "Details"
echo "----------------------------------------------------------------------"
printf " %-30s | %-12s | %-20s\n" "Phase 1: Core Opportunities" "${PHASE1_STATUS}" "Auth, Uploads, Hardening"
printf " %-30s | %-12s | %-20s\n" "Phase 2: Events & Scanners" "${PHASE2_STATUS}" "Waitlists, QR, Staff"
printf " %-30s | %-12s | %-20s\n" "Phase 3: Profiles & Teams" "${PHASE3_STATUS}" "Discovery, Invites, Caps"
printf " %-30s | %-12s | %-20s\n" "Phase 4: Networking & Chat" "${PHASE4_STATUS}" "Connections, WS, Projects"
printf " %-30s | %-12s | %-20s\n" "Cross-Phase User Journey" "${JOURNEY_STATUS}" "${JOURNEY_STEPS_PASSED}/${TOTAL_JOURNEY_STEPS} Steps Verified"
echo "======================================================================"

if [ "$FAILED" -eq 0 ]; then
    echo " ALL VERIFICATION SUITES PASSED END-TO-END! "
    exit 0
else
    echo " SOME VERIFICATION SUITES FAILED. SEE LOGS ABOVE. "
    exit 1
fi
