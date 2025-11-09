#!/bin/bash

echo "🔍 Debugging Admin Customer Display Issue"
echo "=========================================="
echo ""

# 1. Check backend
echo "1️⃣  Checking backend health..."
HEALTH=$(curl -s http://localhost:5000/health 2>/dev/null)
if [ $? -eq 0 ] && [ ! -z "$HEALTH" ]; then
  echo "✅ Backend is running"
else
  echo "❌ Backend is not running"
  echo "   Start with: cd backend && npm run dev"
  exit 1
fi

# 2. Login as admin
echo ""
echo "2️⃣  Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@contrezz.com","password":"admin123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Admin login failed"
  echo "   Response: $LOGIN_RESPONSE"
  exit 1
else
  echo "✅ Admin logged in successfully"
fi

# 3. Fetch customers from API
echo ""
echo "3️⃣  Fetching customers from API..."
CUSTOMERS_RESPONSE=$(curl -s http://localhost:5000/api/customers \
  -H "Authorization: Bearer $TOKEN")

CUSTOMER_COUNT=$(echo "$CUSTOMERS_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data) if isinstance(data, list) else 0)" 2>/dev/null || echo "0")

echo "   Found: $CUSTOMER_COUNT customers"
echo ""

if [ "$CUSTOMER_COUNT" -eq 0 ]; then
  echo "❌ No customers in database"
  echo ""
  echo "Possible causes:"
  echo "  1. Database not seeded"
  echo "  2. Wrong database connection"
  echo "  3. Customers table is empty"
  echo ""
  echo "Fix:"
  echo "  cd backend"
  echo "  npm run prisma:seed"
  exit 1
fi

# 4. Show customer details
echo "📋 Customer Details:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$CUSTOMERS_RESPONSE" | python3 -m json.tool 2>/dev/null | head -100

# 5. Check for required fields
echo ""
echo "4️⃣  Checking customer data structure..."
HAS_ID=$(echo "$CUSTOMERS_RESPONSE" | grep -o '"id"')
HAS_COMPANY=$(echo "$CUSTOMERS_RESPONSE" | grep -o '"company"')
HAS_EMAIL=$(echo "$CUSTOMERS_RESPONSE" | grep -o '"email"')
HAS_STATUS=$(echo "$CUSTOMERS_RESPONSE" | grep -o '"status"')

if [ ! -z "$HAS_ID" ] && [ ! -z "$HAS_COMPANY" ] && [ ! -z "$HAS_EMAIL" ] && [ ! -z "$HAS_STATUS" ]; then
  echo "✅ All required fields present (id, company, email, status)"
else
  echo "⚠️  Some required fields missing:"
  [ -z "$HAS_ID" ] && echo "   ❌ id"
  [ -z "$HAS_COMPANY" ] && echo "   ❌ company"
  [ -z "$HAS_EMAIL" ] && echo "   ❌ email"
  [ -z "$HAS_STATUS" ] && echo "   ❌ status"
fi

# 6. Frontend check
echo ""
echo "5️⃣  Frontend checklist:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To debug frontend display:"
echo ""
echo "1. Open browser: http://localhost:5173"
echo "2. Login as admin: admin@contrezz.com / admin123"
echo "3. Go to 'Customer Management' tab"
echo "4. Open DevTools (F12)"
echo "5. Go to Console tab"
echo "6. Look for these logs:"
echo "   • '🔍 Customers fetched from API:' - Should show $CUSTOMER_COUNT"
echo "   • '✅ Customers fetched from database:' - Backend log"
echo ""
echo "7. Check Network tab:"
echo "   • Find /api/customers request"
echo "   • Status should be 200"
echo "   • Response should have $CUSTOMER_COUNT customers"
echo ""
echo "8. Check React state:"
echo "   • In Console, type: window.__REACT_DEVTOOLS_GLOBAL_HOOK__"
echo "   • Or install React DevTools extension"
echo "   • Check SuperAdminDashboard state.customers"
echo ""

# 7. Common issues
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Common Issues & Fixes:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Issue 1: Customers show in API but not in UI"
echo "  • Hard refresh browser (Cmd+Shift+R)"
echo "  • Clear localStorage: localStorage.clear()"
echo "  • Check browser console for errors"
echo "  • Check if filters are hiding customers"
echo ""
echo "Issue 2: 'No customers found' message"
echo "  • Check statusFilter is set to 'all'"
echo "  • Check billingCycleFilter is set to 'all'"
echo "  • Check searchTerm is empty"
echo "  • Check filteredCustomers.length in console"
echo ""
echo "Issue 3: API returns 401 Unauthorized"
echo "  • Token expired - logout and login again"
echo "  • Admin user doesn't have permission"
echo "  • Check authMiddleware in backend"
echo ""
echo "Issue 4: Customers array is empty in React state"
echo "  • Check fetchCustomersData is being called"
echo "  • Check response.data is not null"
echo "  • Check setCustomers(response.data) is executed"
echo "  • Add console.log in fetchCustomersData"
echo ""

# 8. Quick test
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Quick Test:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Run this in browser console after logging in:"
echo ""
echo "// Test API call"
echo "fetch('/api/customers', {"
echo "  headers: {"
echo "    'Authorization': 'Bearer ' + localStorage.getItem('token')"
echo "  }"
echo "}).then(r => r.json()).then(data => {"
echo "  console.log('Customers:', data.length);"
echo "  console.log('First customer:', data[0]);"
echo "});"
echo ""

# 9. Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Backend: Running"
echo "✅ Admin login: Working"
echo "✅ API endpoint: /api/customers"
echo "✅ Customers in DB: $CUSTOMER_COUNT"
echo ""
echo "Next: Check frontend browser console for errors"
echo ""
echo "If customers still don't show:"
echo "  1. Check browser console for errors"
echo "  2. Check Network tab for /api/customers request"
echo "  3. Try hard refresh (Cmd+Shift+R)"
echo "  4. Clear browser cache and localStorage"
echo "  5. Share browser console output"

