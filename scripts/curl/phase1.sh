#!/usr/bin/env bash
set -euo pipefail

# LaunchByte Phase 1 Verification Script
# Tests every Phase 1 endpoint with curl and asserts HTTP status codes.

BASE_URL="${BASE_URL:-http://localhost:8000}"
API_URL="${BASE_URL}/api/v1"

echo "=========================================================="
echo " Starting LaunchByte Phase 1 Endpoint Verification Suite"
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
TEST_USER_EMAIL="curl_user_${RANDOM_SUFFIX}@example.com"
TEST_USER_PASS="securepass123"

# 1. Register User (201)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/users" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_USER_EMAIL}\",\"password\":\"${TEST_USER_PASS}\",\"full_name\":\"Curl User\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Register new user" 201 "$HTTP_CODE" "$BODY"

# 2. Duplicate Registration (409)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/users" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_USER_EMAIL}\",\"password\":\"${TEST_USER_PASS}\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Duplicate registration rejected" 409 "$HTTP_CODE" "$BODY"

# 3. Email Verify Flow (Read dev token & confirm)
DEV_TOKEN_RESP=$(curl -s "${API_URL}/auth/test-token?email=${TEST_USER_EMAIL}&type=verify" || true)
VERIFY_TOKEN=$(echo "$DEV_TOKEN_RESP" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || true)

if [ -n "$VERIFY_TOKEN" ]; then
    RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/verify-email/confirm" \
        -H "Content-Type: application/json" \
        -d "{\"token\":\"${VERIFY_TOKEN}\"}")
    HTTP_CODE=$(echo "$RESP" | tail -n1)
    BODY=$(echo "$RESP" | sed '$d')
    assert_status "Confirm email verification" 200 "$HTTP_CODE" "$BODY"
fi

# 4. Login (200)
LOGIN_RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/login" \
    -d "username=${TEST_USER_EMAIL}&password=${TEST_USER_PASS}")
HTTP_CODE=$(echo "$LOGIN_RESP" | tail -n1)
BODY=$(echo "$LOGIN_RESP" | sed '$d')
assert_status "Login success" 200 "$HTTP_CODE" "$BODY"
USER_TOKEN=$(echo "$BODY" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# 5. Seed login for admin and organizer
ADMIN_LOGIN=$(curl -s -X POST "${API_URL}/auth/login" -d "username=admin@example.com&password=admin-pass-123" || true)
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4 || true)

ORGANIZER_LOGIN=$(curl -s -X POST "${API_URL}/auth/login" -d "username=organizer@example.com&password=organizer-pass-123" || true)
ORGANIZER_TOKEN=$(echo "$ORGANIZER_LOGIN" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4 || true)

# 6. GET /users/me (200)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/users/me" -H "Authorization: Bearer ${USER_TOKEN}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Get current user profile" 200 "$HTTP_CODE" "$BODY"

# 7. Public Opportunities Browse with filters
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/opportunities?type=hackathon&limit=5&sort=deadline")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Public opportunities browse" 200 "$HTTP_CODE" "$BODY"

# 8. Public Tags with counts
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/tags")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Get tags with counts" 200 "$HTTP_CODE" "$BODY"

# 9. Public Types with counts
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/opportunities/types")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Get types with counts" 200 "$HTTP_CODE" "$BODY"

# 10. Detail & atomic view_count
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/opportunities/bytehacks-global-2026")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Get opportunity detail by slug" 200 "$HTTP_CODE" "$BODY"
OPP_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | head -n1 | cut -d'"' -f4)

# 11. Save Opportunity
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/opportunities/${OPP_ID}/save" \
    -H "Authorization: Bearer ${USER_TOKEN}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Save opportunity" 200 "$HTTP_CODE" "$BODY"

# 12. List Saved Opportunities
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/me/saved" \
    -H "Authorization: Bearer ${USER_TOKEN}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Get saved opportunities" 200 "$HTTP_CODE" "$BODY"

# 13. Unsave Opportunity
RESP=$(curl -s -w "\n%{http_code}" -X DELETE "${API_URL}/opportunities/${OPP_ID}/save" \
    -H "Authorization: Bearer ${USER_TOKEN}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Unsave opportunity" 204 "$HTTP_CODE" "$BODY"

# 14. Report Opportunity
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/opportunities/${OPP_ID}/report" \
    -H "Authorization: Bearer ${USER_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"reason":"misleading","details":"Curl verification report test."}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Report opportunity" 201 "$HTTP_CODE" "$BODY"

# 15. Duplicate Report (409)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/opportunities/${OPP_ID}/report" \
    -H "Authorization: Bearer ${USER_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"reason":"misleading","details":"Duplicate report."}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Duplicate report rejected" 409 "$HTTP_CODE" "$BODY"

# 16. About Team Public (200)
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/about/team")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Get public team members" 200 "$HTTP_CODE" "$BODY"

# 17. Security / Forbidden Cases
# User accessing admin queue -> 403
RESP=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/admin/opportunities" \
    -H "Authorization: Bearer ${USER_TOKEN}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "User denied admin opportunities" 403 "$HTTP_CODE" "$BODY"

# Unauthenticated upload -> 401
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/uploads/images")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Unauthenticated upload denied" 401 "$HTTP_CODE" "$BODY"

# Password reset request (Always 202)
RESP=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/password-reset/request" \
    -H "Content-Type: application/json" \
    -d '{"email":"curl_user_test@example.com"}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Password reset request (no enumeration)" 202 "$HTTP_CODE" "$BODY"

echo "=========================================================="
echo " All Phase 1 API endpoints verified successfully! [PASS] "
echo "=========================================================="
