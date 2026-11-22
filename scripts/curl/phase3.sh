#!/usr/bin/env bash
set -euo pipefail

# LaunchByte Phase 3 Verification Script
# Tests Profiles, Teammate Discovery, Team Creation, Invites, and Join Requests.

BASE_URL="${BASE_URL:-http://localhost:8000}"
API_URL="${BASE_URL}/api/v1"

echo "=========================================================="
echo " Starting LaunchByte Phase 3 Endpoint Verification Suite"
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
PASSWORD="securepassword123"

# 1. Login as Admin
echo "--- Auth Setup ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=admin@launchbyte.io&password=adminpassword123")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Login as Admin" 200 "$HTTP_CODE" "$BODY"
ADMIN_TOKEN=$(echo "$BODY" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# 2. Register Alice, Bob, Charlie
ALICE_EMAIL="alice_${RANDOM_SUFFIX}@example.com"
BOB_EMAIL="bob_${RANDOM_SUFFIX}@example.com"
CHARLIE_EMAIL="charlie_${RANDOM_SUFFIX}@example.com"

# Register Alice
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/users" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${ALICE_EMAIL}\",\"password\":\"${PASSWORD}\",\"full_name\":\"Alice Hacker\"}")
assert_status "Register Alice" 201 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# Register Bob
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/users" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${BOB_EMAIL}\",\"password\":\"${PASSWORD}\",\"full_name\":\"Bob Builder\"}")
assert_status "Register Bob" 201 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# Register Charlie
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/users" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${CHARLIE_EMAIL}\",\"password\":\"${PASSWORD}\",\"full_name\":\"Charlie Coder\"}")
assert_status "Register Charlie" 201 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# Login Alice
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${ALICE_EMAIL}&password=${PASSWORD}")
ALICE_TOKEN=$(echo "$RESP" | sed '$d' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Login Bob
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${BOB_EMAIL}&password=${PASSWORD}")
BOB_TOKEN=$(echo "$RESP" | sed '$d' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Login Charlie
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${CHARLIE_EMAIL}&password=${PASSWORD}")
CHARLIE_TOKEN=$(echo "$RESP" | sed '$d' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

ALICE_HANDLE="alice_${RANDOM_SUFFIX}"
BOB_HANDLE="bob_${RANDOM_SUFFIX}"

echo "--- 1. Profile Setup & 30-Day Throttle ---"
# Set Alice Handle and Profile
RESP=$(curl -s -w "\n%{http_code}" -X PUT "${API_URL}/me/profile" \
    -H "Authorization: Bearer ${ALICE_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"handle\":\"${ALICE_HANDLE}\",\"headline\":\"Backend Wizard\",\"skills\":[\"Python\",\"FastAPI\",\"PostgreSQL\"],\"open_to_teams\":true,\"looking_for_roles\":[\"Backend\"]}")
assert_status "Update Alice Profile & Handle" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# Set Bob Handle and Profile
RESP=$(curl -s -w "\n%{http_code}" -X PUT "${API_URL}/me/profile" \
    -H "Authorization: Bearer ${BOB_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"handle\":\"${BOB_HANDLE}\",\"headline\":\"Frontend Architect\",\"skills\":[\"React\",\"TypeScript\"],\"open_to_teams\":true,\"looking_for_roles\":[\"Frontend\"]}")
assert_status "Update Bob Profile & Handle" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# Alice immediately tries to change handle again -> Should be Throttled (400)
RESP=$(curl -s -w "\n%{http_code}" -X PUT "${API_URL}/me/profile" \
    -H "Authorization: Bearer ${ALICE_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"handle\":\"new_alice_${RANDOM_SUFFIX}\"}")
assert_status "Assert Handle Throttle 400" 400 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

echo "--- 2. Public Profile & Teammate Discovery ---"
# Bob views Alice's public profile
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/profiles/${ALICE_HANDLE}" \
    -H "Authorization: Bearer ${BOB_TOKEN}")
assert_status "Bob reads Alice Public Profile" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# Discover teammates searching Python
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/people/discover?skills=Python" \
    -H "Authorization: Bearer ${BOB_TOKEN}")
assert_status "Discover Teammates by Skill" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

echo "--- 3. Team Creation, Invite & Capacity Locking ---"
TEAM_NAME="Team Alpha ${RANDOM_SUFFIX}"
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/teams" \
    -H "Authorization: Bearer ${ALICE_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${TEAM_NAME}\",\"max_size\":2,\"looking_for_skills\":[\"React\"]}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Alice creates Team Alpha (max 2)" 201 "$HTTP_CODE" "$BODY"
TEAM_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | head -n1 | cut -d'"' -f4)
TEAM_SLUG=$(echo "$BODY" | grep -o '"slug":"[^"]*' | head -n1 | cut -d'"' -f4)

# Alice invites Bob by handle
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/teams/${TEAM_ID}/invites" \
    -H "Authorization: Bearer ${ALICE_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"handle\":\"${BOB_HANDLE}\",\"message\":\"Join us for hackathon!\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Alice invites Bob" 201 "$HTTP_CODE" "$BODY"
INVITE_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | head -n1 | cut -d'"' -f4)

# Bob lists his invites
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/me/invites" \
    -H "Authorization: Bearer ${BOB_TOKEN}")
assert_status "Bob lists incoming invites" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# Bob accepts the invite (Team fills to 2/2 -> auto-close)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/invites/${INVITE_ID}/accept" \
    -H "Authorization: Bearer ${BOB_TOKEN}")
assert_status "Bob accepts invite" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# Charlie tries to join full team -> Should fail with 400
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/teams/${TEAM_ID}/join-requests" \
    -H "Authorization: Bearer ${CHARLIE_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"message\":\"Let me in please!\"}")
assert_status "Charlie join request rejected (Team full / closed)" 400 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

echo "--- 4. Capacity Expansion, Join Request, Leave, Transfer & Disband ---"
# Alice expands team max_size to 3
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "${API_URL}/teams/${TEAM_ID}" \
    -H "Authorization: Bearer ${ALICE_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"max_size\":3,\"accepting_requests\":true}")
assert_status "Alice expands team capacity to 3" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# Charlie now sends join request
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/teams/${TEAM_ID}/join-requests" \
    -H "Authorization: Bearer ${CHARLIE_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"message\":\"I can contribute DevOps skills.\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Charlie sends join request" 201 "$HTTP_CODE" "$BODY"
JOIN_REQ_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | head -n1 | cut -d'"' -f4)

# Alice accepts Charlie's join request
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/join-requests/${JOIN_REQ_ID}/accept" \
    -H "Authorization: Bearer ${ALICE_TOKEN}")
assert_status "Alice accepts Charlie join request" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# Charlie leaves team
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/teams/${TEAM_ID}/leave" \
    -H "Authorization: Bearer ${CHARLIE_TOKEN}")
assert_status "Charlie leaves team" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# Alice transfers leadership to Bob
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/teams/${TEAM_ID}/transfer-leadership" \
    -H "Authorization: Bearer ${ALICE_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"new_leader_id\":\"$(echo "$BODY" | grep -o '"user_id":"[^"]*' | head -n1 | cut -d'"' -f4 || true)\",\"new_leader_handle\":\"${BOB_HANDLE}\"}")
assert_status "Alice transfers leadership to Bob" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

# Bob disbands the team
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/teams/${TEAM_ID}/disband" \
    -H "Authorization: Bearer ${BOB_TOKEN}")
assert_status "Bob disbands team" 200 "$(echo "$RESP" | tail -n1)" "$(echo "$RESP" | sed '$d')"

echo "=========================================================="
echo " LaunchByte Phase 3 Verification Completed Successfully! "
echo "=========================================================="
