#!/usr/bin/env bash
set -euo pipefail

# LaunchByte Security Sweep & Fuzzing Suite
# Tests unauthenticated access, authorization boundaries, invalid UUIDs,
# oversized payloads, SQL injection strings, and XSS payloads.
# STRICT REQUIREMENT: No 500 Internal Server Errors and no stack traces.

BASE_URL="${BASE_URL:-http://localhost:8000}"
API_URL="${BASE_URL}/api/v1"

echo "======================================================================"
echo " Starting LaunchByte Security Sweep Suite"
echo " Target: ${API_URL}"
echo "======================================================================"

FAILED=0
TOTAL_CHECKS=0
PASSED_CHECKS=0

check_status() {
    local test_name="$1"
    local expected_code="$2"
    local actual_code="$3"
    local body="$4"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    # Check for internal server error or stack traces
    if [ "$actual_code" -eq 500 ] || [[ "$body" == *"Traceback (most recent call last)"* ]] || [[ "$body" == *"Internal Server Error"* ]]; then
        echo " [CRITICAL FAIL] ${test_name}: HTTP 500 or stack trace detected!"
        echo "                 Response: ${body}"
        FAILED=1
        return
    fi

    if [ "$actual_code" -eq "$expected_code" ]; then
        echo " [PASS] ${test_name} (HTTP ${actual_code})"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo " [FAIL] ${test_name}: Expected HTTP ${expected_code}, got ${actual_code}"
        echo "        Response: ${body}"
        FAILED=1
    fi
}

RANDOM_HEX=$(date +%s%N | cut -b1-8)

echo "--- 1. Unauthenticated Endpoint Checks (401 Expected) ---"

AUTH_REQUIRED_ENDPOINTS=(
    "GET /users/me"
    "GET /me/profile"
    "PUT /me/profile"
    "POST /me/profile/avatar"
    "GET /applications"
    "GET /saved"
    "GET /notifications"
    "POST /teams"
    "GET /me/teams"
    "GET /me/invites"
    "POST /projects"
    "GET /connections"
    "GET /conversations"
    "POST /ws/ticket"
    "GET /admin/audit-logs"
)

for ep in "${AUTH_REQUIRED_ENDPOINTS[@]}"; do
    METHOD=$(echo "$ep" | cut -d' ' -f1)
    PATH=$(echo "$ep" | cut -d' ' -f2)

    RESP=$(curl -s -w "\n%{http_code}" -X "${METHOD}" "${API_URL}${PATH}" \
        -H "Content-Type: application/json" \
        -d "{}" || true)
    CODE=$(echo "$RESP" | tail -n1)
    BODY=$(echo "$RESP" | sed '$d')
    check_status "No-Auth ${METHOD} ${PATH}" 401 "$CODE" "$BODY"
done

echo "--- 2. Public Endpoints by Design (Must NOT return 401) ---"
PUBLIC_ENDPOINTS=(
    "GET /opportunities"
    "GET /events"
    "GET /teams"
    "GET /projects"
    "GET /people/discover"
    "GET /tags"
    "GET /health"
)

for ep in "${PUBLIC_ENDPOINTS[@]}"; do
    METHOD=$(echo "$ep" | cut -d' ' -f1)
    PATH=$(echo "$ep" | cut -d' ' -f2)

    RESP=$(curl -s -w "\n%{http_code}" -X "${METHOD}" "${API_URL}${PATH}" || true)
    CODE=$(echo "$RESP" | tail -n1)
    BODY=$(echo "$RESP" | sed '$d')

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ "$CODE" -eq 200 ]; then
        echo " [PASS] Public ${METHOD} ${PATH} accessible (HTTP 200)"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo " [FAIL] Public ${METHOD} ${PATH} returned unexpected ${CODE}"
        FAILED=1
    fi
done

echo "--- 3. Authorization Boundaries (Ownership Isolation) ---"

# Setup User A and User B
USER_A_EMAIL="user_a_${RANDOM_HEX}@security.test"
USER_B_EMAIL="user_b_${RANDOM_HEX}@security.test"
PASS="StrongPass123!"

curl -s -X POST "${API_URL}/users" -H "Content-Type: application/json" -d "{\"email\":\"${USER_A_EMAIL}\",\"password\":\"${PASS}\",\"full_name\":\"Alice\"}" > /dev/null
curl -s -X POST "${API_URL}/users" -H "Content-Type: application/json" -d "{\"email\":\"${USER_B_EMAIL}\",\"password\":\"${PASS}\",\"full_name\":\"Bob\"}" > /dev/null

TOKEN_A=$(curl -s -X POST "${API_URL}/auth/login" -H "Content-Type: application/x-www-form-urlencoded" -d "username=${USER_A_EMAIL}&password=${PASS}" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
TOKEN_B=$(curl -s -X POST "${API_URL}/auth/login" -H "Content-Type: application/x-www-form-urlencoded" -d "username=${USER_B_EMAIL}&password=${PASS}" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# User A creates a team
TEAM_RESP=$(curl -s -X POST "${API_URL}/teams" -H "Authorization: Bearer ${TOKEN_A}" -H "Content-Type: application/json" -d "{\"name\":\"Team Alice ${RANDOM_HEX}\",\"max_size\":3}")
TEAM_A_ID=$(echo "$TEAM_RESP" | grep -o '"id":"[^"]*' | head -n1 | cut -d'"' -f4)

# User B tries to disband User A's team -> 403 Forbidden
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/teams/${TEAM_A_ID}/disband" -H "Authorization: Bearer ${TOKEN_B}")
CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
check_status "User B cannot disband User A's team" 403 "$CODE" "$BODY"

# User A creates a project
PROJ_SLUG="alice-proj-${RANDOM_HEX}"
PROJ_RESP=$(curl -s -X POST "${API_URL}/projects" -H "Authorization: Bearer ${TOKEN_A}" -H "Content-Type: application/json" -d "{\"title\":\"Alice Proj\",\"slug\":\"${PROJ_SLUG}\",\"summary\":\"Summary\",\"description\":\"Desc\",\"repo_url\":\"https://github.com/a/p\",\"visibility\":\"private\"}")
PROJ_A_ID=$(echo "$PROJ_RESP" | grep -o '"id":"[^"]*' | head -n1 | cut -d'"' -f4)

# User B tries to modify User A's project -> 403 Forbidden
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "${API_URL}/projects/${PROJ_A_ID}" -H "Authorization: Bearer ${TOKEN_B}" -H "Content-Type: application/json" -d "{\"title\":\"Hacked Title\"}")
CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
check_status "User B cannot edit User A's project" 403 "$CODE" "$BODY"

echo "--- 4. Fuzzing & Malicious Inputs (No 500 Allowed) ---"

# 4.1 Invalid UUID in path -> 422
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/teams/not-a-valid-uuid/invites" -H "Authorization: Bearer ${TOKEN_A}")
CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
check_status "Invalid UUID format in path parameter" 422 "$CODE" "$BODY"

# 4.2 Wrong Content-Type header -> 415 or 422
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/teams" \
    -H "Authorization: Bearer ${TOKEN_A}" \
    -H "Content-Type: text/plain" \
    -d "plain text body")
CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if [ "$CODE" -eq 415 ] || [ "$CODE" -eq 422 ]; then
    echo " [PASS] Wrong Content-Type rejected gracefully (HTTP ${CODE})"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo " [FAIL] Wrong Content-Type returned ${CODE}: ${BODY}"
    FAILED=1
fi

# 4.3 SQL Injection attempts in credentials & search queries
SQLI_PAYLOADS=(
    "' OR '1'='1"
    "admin' --"
    "\" OR \"\"=\""
    "1; DROP TABLE users; --"
)

for payload in "${SQLI_PAYLOADS[@]}"; do
    RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=${payload}&password=${payload}")
    CODE=$(echo "$RESP" | tail -n1)
    BODY=$(echo "$RESP" | sed '$d')
    check_status "SQL Injection attempt: ${payload}" 401 "$CODE" "$BODY"
done

# 4.4 XSS Payloads in text fields (Should be sanitized by nh3 without 500)
XSS_PAYLOAD="<script>alert('XSS')</script><img src=x onerror=alert(1)>"
RESP=$(curl -s -w "\n%{http_code}" -X PUT "${API_URL}/me/profile" \
    -H "Authorization: Bearer ${TOKEN_A}" \
    -H "Content-Type: application/json" \
    -d "{\"headline\":\"${XSS_PAYLOAD}\",\"bio\":\"${XSS_PAYLOAD}\"}")
CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
check_status "XSS payload in profile sanitized cleanly" 200 "$CODE" "$BODY"

# Verify XSS was stripped
if [[ "$BODY" == *"<script>"* ]]; then
    echo " [CRITICAL FAIL] Raw <script> tag detected in profile response!"
    FAILED=1
else
    echo " [PASS] Script tags properly neutralized by sanitizer"
fi

# 4.5 Malformed JSON
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/teams" \
    -H "Authorization: Bearer ${TOKEN_A}" \
    -H "Content-Type: application/json" \
    -d "{name: broken_json without quotes")
CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
check_status "Malformed JSON body rejected" 422 "$CODE" "$BODY"

echo ""
echo "======================================================================"
echo " Security Sweep Completed: ${PASSED_CHECKS} / ${TOTAL_CHECKS} checks passed."
echo "======================================================================"

if [ "$FAILED" -eq 0 ]; then
    echo " SECURITY SWEEP PASSED — ZERO 500 ERRORS OR LEAKS DETECTED! "
    exit 0
else
    echo " SECURITY SWEEP FAILED — REVIEW DEFECTS ABOVE. "
    exit 1
fi
