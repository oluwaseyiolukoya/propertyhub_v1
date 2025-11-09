#!/bin/bash

echo "🧪 Testing Trial Banner..."
echo ""

# 1. Check backend health
echo "1️⃣  Checking backend..."
HEALTH=$(curl -s http://localhost:5000/health 2>/dev/null)
if [ $? -eq 0 ] && [ ! -z "$HEALTH" ]; then
  echo "✅ Backend is running"
  echo "   Response: $HEALTH"
else
  echo "❌ Backend is not running on port 5000"
  echo ""
  echo "Start backend with:"
  echo "  cd backend && npm run dev"
  exit 1
fi

# 2. Login
echo ""
echo "2️⃣  Logging in as demo@contrezz.com..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@contrezz.com","password":"demo123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Login failed"
  echo ""
  echo "Response:"
  echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
  echo ""
  echo "Possible issues:"
  echo "  - demo@contrezz.com doesn't exist"
  echo "  - Wrong password"
  echo "  - Database not seeded"
  echo ""
  echo "Fix: Open Prisma Studio and check users table"
  echo "  cd backend && npx prisma studio"
  exit 1
else
  echo "✅ Login successful"
  echo "   Token: ${TOKEN:0:30}..."
fi

# 3. Get subscription status
echo ""
echo "3️⃣  Fetching subscription status..."
STATUS=$(curl -s http://localhost:5000/api/subscription/status \
  -H "Authorization: Bearer $TOKEN")

echo ""
echo "📋 API Response:"
echo "$STATUS" | python3 -m json.tool 2>/dev/null || echo "$STATUS"

# 4. Check status field
SUBSCRIPTION_STATUS=$(echo "$STATUS" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
DAYS_REMAINING=$(echo "$STATUS" | grep -o '"daysRemaining":[0-9]*' | cut -d':' -f2)
HAS_ERROR=$(echo "$STATUS" | grep -o '"error"')

echo ""
echo "📊 Analysis:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -z "$HAS_ERROR" ]; then
  echo "❌ API returned an error"
  echo ""
  echo "Possible issues:"
  echo "  - Invalid token (JWT_SECRET mismatch?)"
  echo "  - User doesn't have customerId"
  echo "  - Customer not found in database"
  echo ""
  echo "Fix: Check backend logs and Prisma Studio"
  exit 1
fi

if [ -z "$SUBSCRIPTION_STATUS" ]; then
  echo "❌ No status field in response"
  echo ""
  echo "This means the API is not returning expected data."
  echo "Check backend logs for errors."
  exit 1
fi

echo "Status: $SUBSCRIPTION_STATUS"
echo "Days Remaining: $DAYS_REMAINING"
echo ""

if [ "$SUBSCRIPTION_STATUS" = "trial" ]; then
  if [ "$DAYS_REMAINING" -gt 0 ]; then
    echo "✅ Trial banner SHOULD be visible"
    echo ""
    echo "Expected UI:"
    if [ "$DAYS_REMAINING" -gt 7 ]; then
      echo "  • Blue gradient banner"
      echo "  • \"$DAYS_REMAINING Days Left in Trial\""
    elif [ "$DAYS_REMAINING" -gt 3 ]; then
      echo "  • Yellow/Amber gradient banner"
      echo "  • \"$DAYS_REMAINING Days Left in Trial\""
    elif [ "$DAYS_REMAINING" -gt 1 ]; then
      echo "  • Orange gradient banner"
      echo "  • \"$DAYS_REMAINING Days Left in Trial\""
    else
      echo "  • Red gradient banner"
      echo "  • \"Trial Ends Today!\""
    fi
    echo "  • Progress bar showing trial progress"
    echo "  • \"Upgrade Now\" button"
    echo ""
    echo "If banner is NOT visible:"
    echo "  1. Open browser console (F12)"
    echo "  2. Look for errors"
    echo "  3. Check Network tab for /api/subscription/status"
    echo "  4. Hard refresh page (Cmd+Shift+R)"
  else
    echo "⚠️  Trial has ended (0 days remaining)"
    echo ""
    echo "Expected UI:"
    echo "  • Orange \"Grace Period\" banner"
    echo "  • Or Red \"Account Suspended\" banner"
  fi
elif [ "$SUBSCRIPTION_STATUS" = "active" ]; then
  echo "ℹ️  User has ACTIVE subscription"
  echo ""
  echo "Trial banner will NOT show (this is correct behavior)"
  echo "Active users don't see trial banners."
elif [ "$SUBSCRIPTION_STATUS" = "suspended" ]; then
  echo "⚠️  Account is SUSPENDED"
  echo ""
  echo "Expected UI:"
  echo "  • Red \"Account Suspended\" banner"
  echo "  • \"Add Payment Method\" button"
elif [ "$SUBSCRIPTION_STATUS" = "cancelled" ]; then
  echo "⚠️  Account is CANCELLED"
  echo ""
  echo "Trial banner will NOT show."
else
  echo "❌ Unexpected status: $SUBSCRIPTION_STATUS"
  echo ""
  echo "Valid statuses: trial, active, suspended, cancelled"
  echo "Check database for data corruption."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 Next Steps:"
echo ""
echo "1. Open frontend: http://localhost:5173"
echo "2. Login as: demo@contrezz.com / demo123"
echo "3. Check if banner appears"
echo ""
echo "If banner doesn't appear:"
echo "  • Open DevTools (F12)"
echo "  • Go to Console tab"
echo "  • Look for [TrialStatusBanner] logs"
echo "  • Check Network tab for API errors"
echo ""
echo "For detailed debugging:"
echo "  cat DEBUG_TRIAL_BANNER.md"

