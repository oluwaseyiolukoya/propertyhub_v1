#!/bin/bash

# Trial Management UI - Quick Test Script
# This script tests if the trial management API endpoints are working

echo "🧪 Testing Trial Management UI..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "Checking if backend is running..."
if ! curl -s http://localhost:5000/api/system/health > /dev/null 2>&1; then
  echo -e "${RED}❌ Backend is not running${NC}"
  echo "Please start the backend server:"
  echo "  cd backend && npm run dev"
  exit 1
fi
echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Get auth token
echo "Getting auth token..."
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@contrezz.com","password":"admin123"}' \
  | jq -r .token 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo -e "${RED}❌ Failed to get auth token${NC}"
  echo "Please check your admin credentials"
  exit 1
fi

echo -e "${GREEN}✅ Got auth token${NC}"
echo ""

# Test 1: Get subscription status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: GET /api/subscription/status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

STATUS=$(curl -s http://localhost:5000/api/subscription/status \
  -H "Authorization: Bearer $TOKEN")

if echo "$STATUS" | jq -e '.status' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Subscription status API working${NC}"
  echo ""
  echo "Response:"
  echo "$STATUS" | jq '.'
  echo ""
  echo "Key fields:"
  echo "  Status: $(echo "$STATUS" | jq -r '.status')"
  echo "  Days Remaining: $(echo "$STATUS" | jq -r '.daysRemaining')"
  echo "  In Grace Period: $(echo "$STATUS" | jq -r '.inGracePeriod')"
  echo "  Has Payment Method: $(echo "$STATUS" | jq -r '.hasPaymentMethod')"
else
  echo -e "${RED}❌ Subscription status API failed${NC}"
  echo "Response: $STATUS"
  exit 1
fi

echo ""

# Test 2: Get subscription history
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: GET /api/subscription/history"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HISTORY=$(curl -s http://localhost:5000/api/subscription/history \
  -H "Authorization: Bearer $TOKEN")

if echo "$HISTORY" | jq -e '.events' > /dev/null 2>&1; then
  EVENT_COUNT=$(echo "$HISTORY" | jq '.events | length')
  echo -e "${GREEN}✅ Subscription history API working${NC}"
  echo "  Total events: $EVENT_COUNT"

  if [ "$EVENT_COUNT" -gt 0 ]; then
    echo ""
    echo "Recent events:"
    echo "$HISTORY" | jq -r '.events[0:3] | .[] | "  - \(.eventType) (\(.triggeredBy)) at \(.createdAt)"'
  fi
else
  echo -e "${RED}❌ Subscription history API failed${NC}"
  echo "Response: $HISTORY"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 All API tests passed!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps to test the UI:"
echo ""
echo "1. Open your browser and go to:"
echo -e "   ${YELLOW}http://localhost:5173${NC}"
echo ""
echo "2. Login with your credentials"
echo ""
echo "3. Check the dashboard for:"
echo "   ✓ Trial status banner at the top"
echo "   ✓ Trial countdown in the header"
echo "   ✓ 'Upgrade Now' button"
echo ""
echo "4. Click 'Upgrade Now' to test the modal"
echo ""
echo "5. To test different states, use Prisma Studio:"
echo -e "   ${YELLOW}cd backend && npx prisma studio${NC}"
echo ""
echo "For detailed testing instructions, see:"
echo "   TRIAL_UI_TESTING_GUIDE.md"
echo ""

