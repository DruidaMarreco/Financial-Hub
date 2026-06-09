#!/bin/bash

# Financial Hub - Integration Test Script
# Tests the complete system: Database → API → Frontend

set -e

echo "🧪 Financial Hub Integration Test Suite"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
DEMO_EMAIL="demo@financialhub.io"
DEMO_PASSWORD="demo123456"
TOKEN=""

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to print test result
assert_status() {
  local test_name=$1
  local expected=$2
  local actual=$3

  if [ "$expected" = "$actual" ]; then
    echo -e "${GREEN}✓${NC} $test_name"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗${NC} $test_name (expected: $expected, got: $actual)"
    ((TESTS_FAILED++))
  fi
}

# Helper function to extract JSON field
jq_get() {
  echo "$1" | jq -r "$2"
}

echo -e "${BLUE}1. Testing API Connectivity${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if API is running
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/auth/me" 2>/dev/null || echo "0")
if [ "$HTTP_CODE" = "401" ]; then
  echo -e "${GREEN}✓${NC} API is running and responding (401 = no auth, expected)"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗${NC} API not responding properly (got HTTP $HTTP_CODE)"
  ((TESTS_FAILED++))
  echo ""
  echo -e "${RED}Make sure API is running: npm run dev${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}2. Testing Authentication${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Sign in with demo credentials
SIGNIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$DEMO_EMAIL\", \"password\": \"$DEMO_PASSWORD\"}" \
  2>/dev/null)

TOKEN=$(jq_get "$SIGNIN_RESPONSE" '.accessToken')
USER_EMAIL=$(jq_get "$SIGNIN_RESPONSE" '.user.email')

if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  echo -e "${GREEN}✓${NC} Sign in successful"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗${NC} Sign in failed"
  echo "Response: $SIGNIN_RESPONSE"
  ((TESTS_FAILED++))
  exit 1
fi

assert_status "Returned email matches" "$DEMO_EMAIL" "$USER_EMAIL"

echo ""
echo -e "${BLUE}3. Testing Accounts API${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get accounts
ACCOUNTS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/accounts" 2>/dev/null)

ACCOUNT_COUNT=$(jq_get "$ACCOUNTS_RESPONSE" 'length')

if [ ! -z "$ACCOUNT_COUNT" ] && [ "$ACCOUNT_COUNT" != "null" ]; then
  echo -e "${GREEN}✓${NC} Get accounts successful"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗${NC} Get accounts failed"
  echo "Response: $ACCOUNTS_RESPONSE"
  ((TESTS_FAILED++))
fi

# Get first account ID
FIRST_ACCOUNT_ID=$(jq_get "$ACCOUNTS_RESPONSE" '.[0].id')

if [ ! -z "$FIRST_ACCOUNT_ID" ] && [ "$FIRST_ACCOUNT_ID" != "null" ]; then
  echo -e "${GREEN}✓${NC} Found $ACCOUNT_COUNT accounts"
  ((TESTS_PASSED++))

  # Get first account details
  ACCOUNT_DETAIL=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "$API_URL/accounts/$FIRST_ACCOUNT_ID" 2>/dev/null)

  ACCOUNT_NAME=$(jq_get "$ACCOUNT_DETAIL" '.name')
  assert_status "Can fetch account details" "true" "$([ ! -z \"$ACCOUNT_NAME\" ] && echo true || echo false)"
else
  echo -e "${RED}✗${NC} No accounts found"
  ((TESTS_FAILED++))
fi

echo ""
echo -e "${BLUE}4. Testing Net Worth Calculation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get net worth
NETWORTH_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/accounts/metrics/networth" 2>/dev/null)

TOTAL_BALANCE=$(jq_get "$NETWORTH_RESPONSE" '.totalBalance')

if [ ! -z "$TOTAL_BALANCE" ] && [ "$TOTAL_BALANCE" != "null" ]; then
  echo -e "${GREEN}✓${NC} Net worth calculation successful: €$TOTAL_BALANCE"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗${NC} Net worth calculation failed"
  ((TESTS_FAILED++))
fi

echo ""
echo -e "${BLUE}5. Testing Transactions API${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get transactions
TRANSACTIONS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/transactions" 2>/dev/null)

TX_COUNT=$(jq_get "$TRANSACTIONS_RESPONSE" 'length')

if [ ! -z "$TX_COUNT" ] && [ "$TX_COUNT" != "null" ]; then
  echo -e "${GREEN}✓${NC} Get transactions successful: $TX_COUNT transactions"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗${NC} Get transactions failed"
  echo "Response: $TRANSACTIONS_RESPONSE"
  ((TESTS_FAILED++))
fi

echo ""
echo -e "${BLUE}6. Testing Transaction Statistics${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get transaction stats
STATS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/transactions/stats?period=month" 2>/dev/null)

TOTAL_INCOME=$(jq_get "$STATS_RESPONSE" '.totalIncome')
TOTAL_EXPENSE=$(jq_get "$STATS_RESPONSE" '.totalExpense')

if [ ! -z "$TOTAL_INCOME" ] && [ "$TOTAL_INCOME" != "null" ]; then
  echo -e "${GREEN}✓${NC} Transaction stats: Income €$TOTAL_INCOME, Expense €$TOTAL_EXPENSE"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗${NC} Transaction stats failed"
  ((TESTS_FAILED++))
fi

echo ""
echo -e "${BLUE}7. Testing Error Handling${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test with invalid token
INVALID_TOKEN_RESPONSE=$(curl -s -H "Authorization: Bearer invalid-token" \
  "$API_URL/accounts" 2>/dev/null)

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer invalid-token" \
  "$API_URL/accounts" 2>/dev/null)

if [ "$HTTP_CODE" = "401" ]; then
  echo -e "${GREEN}✓${NC} Invalid token returns 401 Unauthorized"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗${NC} Invalid token handling failed (got HTTP $HTTP_CODE)"
  ((TESTS_FAILED++))
fi

echo ""
echo "════════════════════════════════════════"
echo -e "${BLUE}Test Summary${NC}"
echo "════════════════════════════════════════"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✓ All tests passed! System is working correctly.${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Open http://localhost:3000 in your browser"
  echo "2. Sign in with demo@financialhub.io / demo123456"
  echo "3. Verify data displays from the database"
  echo ""
  exit 0
else
  echo ""
  echo -e "${RED}✗ Some tests failed. Check the output above.${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "1. Make sure API is running: npm run dev"
  echo "2. Check database is set up: npm run db:migrate"
  echo "3. Seed demo data: npm run db:seed"
  echo "4. Check API logs for errors"
  echo ""
  exit 1
fi
