# 🔍 Debug Trial Banner Not Showing

## Issue
The trial progress banner is not visible in the customer dashboard for `demo@contrezz.com`.

## Root Cause Analysis

The `TrialStatusBanner` component will **NOT show** if any of these conditions are true:

1. ✅ **Loading state** - Component is still fetching data
2. ✅ **No status data** - API returned null/undefined
3. ✅ **Status is 'active'** - User has an active paid subscription
4. ✅ **Status is not 'trial', 'suspended', or grace period** - User is in an unknown state

## Debugging Steps

### Step 1: Check if demo@contrezz.com Exists

1. **Open Prisma Studio:**
   ```bash
   cd backend
   npx prisma studio
   ```
   
2. **Go to:** http://localhost:5555

3. **Navigate to:** `customers` table

4. **Find:** `demo@contrezz.com`

5. **Check these fields:**
   - `status` - Should be `'trial'`
   - `subscriptionStatus` - Should be `'trial'`
   - `trialStartsAt` - Should have a date
   - `trialEndsAt` - Should have a future date
   - `gracePeriodEndsAt` - Should be null (unless in grace period)

### Step 2: Check API Response

1. **Login and get token:**
   ```bash
   # Login
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"demo@contrezz.com","password":"demo123"}' \
     | jq -r '.token' > /tmp/token.txt
   
   # View token
   cat /tmp/token.txt
   ```

2. **Fetch subscription status:**
   ```bash
   curl -s http://localhost:5000/api/subscription/status \
     -H "Authorization: Bearer $(cat /tmp/token.txt)" \
     | jq .
   ```

   **Expected response:**
   ```json
   {
     "status": "trial",
     "trialStartsAt": "2025-11-09T...",
     "trialEndsAt": "2025-11-23T...",
     "daysRemaining": 14,
     "inGracePeriod": false,
     "gracePeriodEndsAt": null,
     "graceDaysRemaining": 0,
     "suspendedAt": null,
     "suspensionReason": null,
     "hasPaymentMethod": false,
     "canUpgrade": true,
     "nextBillingDate": null,
     "plan": null,
     "billingCycle": null,
     "mrr": 0
   }
   ```

### Step 3: Check Frontend Console

1. **Open browser:** http://localhost:5173
2. **Login as:** `demo@contrezz.com` / `demo123`
3. **Open DevTools:** F12 or Cmd+Option+I
4. **Go to Console tab**
5. **Look for:**
   - `[TrialStatusBanner] Error loading status:` - API error
   - Network errors for `/api/subscription/status`
   - Any React errors

### Step 4: Check Network Tab

1. **Open DevTools → Network tab**
2. **Filter:** XHR/Fetch
3. **Find:** `/api/subscription/status` request
4. **Check:**
   - Status code (should be 200)
   - Response body (should match expected JSON above)
   - Request headers (Authorization header present?)

## Common Issues & Fixes

### Issue 1: demo@contrezz.com Doesn't Exist

**Symptom:** Can't login or 404 error

**Fix:** Create the customer

```bash
cd backend
npx prisma studio
```

1. Go to `customers` table
2. Click "Add record"
3. Fill in:
   - `id`: `customer-demo-1` (or generate UUID)
   - `companyName`: `Demo Customer`
   - `email`: `demo@contrezz.com`
   - `status`: `trial`
   - `subscriptionStatus`: `trial`
   - `trialStartsAt`: Today's date
   - `trialEndsAt`: Today + 14 days
   - `createdAt`: Now
   - `updatedAt`: Now

4. Go to `users` table
5. Click "Add record"
6. Fill in:
   - `id`: `user-demo-1` (or generate UUID)
   - `customerId`: `customer-demo-1` (from step 3)
   - `email`: `demo@contrezz.com`
   - `password`: (hash of `demo123` - see below)
   - `role`: `owner`
   - `firstName`: `Demo`
   - `lastName`: `User`
   - `status`: `active`
   - `createdAt`: Now
   - `updatedAt`: Now

**To hash password:**
```bash
cd backend
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('demo123', 10));"
```

### Issue 2: Status is 'active' Instead of 'trial'

**Symptom:** Banner doesn't show, but user exists

**Fix:** Update customer status

```bash
cd backend
npx prisma studio
```

1. Go to `customers` table
2. Find `demo@contrezz.com`
3. Update:
   - `status`: `trial`
   - `subscriptionStatus`: `trial`
   - `trialStartsAt`: Today
   - `trialEndsAt`: Today + 14 days
   - `gracePeriodEndsAt`: null
   - `suspendedAt`: null

### Issue 3: Trial Dates are in the Past

**Symptom:** Banner shows "0 days remaining" or grace period

**Fix:** Update trial dates

```bash
cd backend
npx prisma studio
```

1. Go to `customers` table
2. Find `demo@contrezz.com`
3. Update:
   - `trialStartsAt`: Today's date
   - `trialEndsAt`: Today + 14 days (e.g., `2025-11-23T00:00:00.000Z`)

### Issue 4: API Returns 401 Unauthorized

**Symptom:** `{"error": "Unauthorized"}` or `{"error": "Invalid token"}`

**Possible causes:**
1. Token expired (JWT_EXPIRES_IN in backend/.env.local)
2. JWT_SECRET mismatch between login and verification
3. User doesn't have `customerId` field

**Fix:**

1. **Check JWT_SECRET:**
   ```bash
   cd backend
   grep JWT_SECRET .env.local
   ```
   Should be the same value everywhere.

2. **Check user has customerId:**
   ```bash
   cd backend
   npx prisma studio
   ```
   Go to `users` table, find `demo@contrezz.com`, ensure `customerId` is set.

3. **Try fresh login:**
   - Clear browser localStorage
   - Hard refresh (Cmd+Shift+R)
   - Login again

### Issue 5: Component Not Rendering

**Symptom:** No banner, no errors, API works

**Check:**

1. **Is TrialStatusBanner imported in PropertyOwnerDashboard?**
   ```typescript
   import { TrialStatusBanner } from './TrialStatusBanner';
   ```

2. **Is it rendered in the JSX?**
   ```typescript
   <TrialStatusBanner
     onUpgradeClick={() => setShowUpgradeModal(true)}
     onAddPaymentMethod={() => setCurrentView('settings')}
   />
   ```

3. **Is the dashboard actually PropertyOwnerDashboard?**
   - Check user role is `owner` or `manager`
   - Not `admin` (admin dashboard is different)

### Issue 6: API Route Not Found

**Symptom:** 404 error for `/api/subscription/status`

**Fix:**

1. **Check backend is running:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Check route is registered in backend/src/index.ts:**
   ```typescript
   import subscriptionManagementRoutes from './routes/subscription';
   app.use('/api/subscription', subscriptionManagementRoutes);
   ```

3. **Restart backend:**
   ```bash
   cd backend
   npm run dev
   ```

## Manual Testing Script

Run this to test the complete flow:

```bash
#!/bin/bash

echo "🧪 Testing Trial Banner..."
echo ""

# 1. Check backend health
echo "1️⃣ Checking backend..."
HEALTH=$(curl -s http://localhost:5000/health)
if [ $? -eq 0 ]; then
  echo "✅ Backend is running"
else
  echo "❌ Backend is not running"
  exit 1
fi

# 2. Login
echo ""
echo "2️⃣ Logging in as demo@contrezz.com..."
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@contrezz.com","password":"demo123"}' \
  | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo "Response:"
  curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@contrezz.com","password":"demo123"}' | jq .
  exit 1
else
  echo "✅ Login successful"
  echo "Token: ${TOKEN:0:20}..."
fi

# 3. Get subscription status
echo ""
echo "3️⃣ Fetching subscription status..."
STATUS=$(curl -s http://localhost:5000/api/subscription/status \
  -H "Authorization: Bearer $TOKEN")

echo "$STATUS" | jq .

# 4. Check status field
SUBSCRIPTION_STATUS=$(echo "$STATUS" | jq -r '.status')
DAYS_REMAINING=$(echo "$STATUS" | jq -r '.daysRemaining')

echo ""
echo "📊 Results:"
echo "  Status: $SUBSCRIPTION_STATUS"
echo "  Days Remaining: $DAYS_REMAINING"

if [ "$SUBSCRIPTION_STATUS" = "trial" ] && [ "$DAYS_REMAINING" -gt 0 ]; then
  echo ""
  echo "✅ Trial banner SHOULD be visible"
  echo "   If not visible, check frontend console for errors"
elif [ "$SUBSCRIPTION_STATUS" = "active" ]; then
  echo ""
  echo "ℹ️  User has active subscription - banner will NOT show"
else
  echo ""
  echo "⚠️  Unexpected status: $SUBSCRIPTION_STATUS"
fi
```

Save as `test-trial-banner.sh`, make executable, and run:

```bash
chmod +x test-trial-banner.sh
./test-trial-banner.sh
```

## Quick Fix Checklist

- [ ] Backend is running on port 5000
- [ ] Frontend is running on port 5173
- [ ] `demo@contrezz.com` exists in database
- [ ] Customer status is `'trial'`
- [ ] `trialEndsAt` is in the future
- [ ] User has `customerId` field set
- [ ] Can login successfully
- [ ] `/api/subscription/status` returns 200
- [ ] Response has `status: 'trial'`
- [ ] Response has `daysRemaining > 0`
- [ ] No errors in browser console
- [ ] `TrialStatusBanner` is imported and rendered

## Still Not Working?

If you've checked everything above and it still doesn't work:

1. **Clear all caches:**
   ```bash
   # Stop servers
   # Delete node_modules
   cd backend && rm -rf node_modules && npm install
   cd .. && rm -rf node_modules && npm install
   
   # Restart
   cd backend && npm run dev
   # In another terminal:
   npm run dev
   ```

2. **Check for TypeScript errors:**
   ```bash
   npm run build:check
   ```

3. **Add debug logging:**
   
   In `src/components/TrialStatusBanner.tsx`, line 26:
   ```typescript
   const loadStatus = async () => {
     try {
       console.log('[TrialStatusBanner] Fetching status...');
       const data = await getSubscriptionStatus();
       console.log('[TrialStatusBanner] Status received:', data);
       setStatus(data);
     } catch (error: any) {
       console.error('[TrialStatusBanner] Error loading status:', error);
     } finally {
       setLoading(false);
     }
   };
   ```

4. **Share the output:**
   - Backend terminal logs
   - Browser console logs
   - Network tab screenshot
   - Prisma Studio screenshot of customer record

---

## Expected Behavior

When everything is working:

1. ✅ User logs in as `demo@contrezz.com`
2. ✅ Dashboard loads
3. ✅ Trial banner appears at the top (blue gradient if 7+ days remaining)
4. ✅ Shows "X Days Left in Trial"
5. ✅ Progress bar shows trial progress
6. ✅ "Upgrade Now" button is visible
7. ✅ Clicking "Upgrade Now" opens upgrade modal

---

**Need more help? Run the test script above and share the output!**

