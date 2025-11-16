# Trial Management UI - Testing Guide

## Quick Start Testing (5 Minutes)

Follow these steps to test if the trial management UI is working correctly.

---

## Prerequisites

Before testing, ensure:

1. ✅ Backend server is running (`npm run dev` in `backend/`)
2. ✅ Frontend server is running (`npm run dev` in root)
3. ✅ Database is running (PostgreSQL)
4. ✅ You have an admin account to log in

---

## Step 1: Start the Servers

### Terminal 1: Start Backend

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
npm run dev
```

**Expected output**:
```
✅ Cron jobs initialized:
   - Monthly MRR Snapshot: 1st of every month at 00:05 AM
   - Daily MRR Update: Every day at 00:10 AM
   - Trial Expiration Checker: Every day at 02:00 AM UTC
   - Trial Notification Sender: Every day at 10:00 AM UTC
   - Suspended Account Cleanup: Every day at 03:00 AM UTC
🚀 Server running on port 5000
```

### Terminal 2: Start Frontend

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor
npm run dev
```

**Expected output**:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## Step 2: Test API Endpoints

### Test 1: Check Subscription Status API

Open a new terminal and run:

```bash
# First, login to get a token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@contrezz.com","password":"admin123"}' \
  | jq -r .token)

echo "Token: $TOKEN"

# Then check subscription status
curl -s http://localhost:5000/api/subscription/status \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

**Expected output**:
```json
{
  "status": "trial",
  "trialStartsAt": "2025-11-08T00:00:00.000Z",
  "trialEndsAt": "2025-11-22T00:00:00.000Z",
  "daysRemaining": 14,
  "inGracePeriod": false,
  "gracePeriodEndsAt": null,
  "graceDaysRemaining": 0,
  "suspendedAt": null,
  "suspensionReason": null,
  "hasPaymentMethod": false,
  "canUpgrade": true,
  "nextBillingDate": null,
  "plan": {
    "id": "plan-id",
    "name": "Professional",
    "monthlyPrice": 99,
    "annualPrice": 990
  },
  "billingCycle": "monthly",
  "mrr": 0
}
```

✅ **If you see this, the API is working!**

---

## Step 3: Test UI Components

### Test 1: Trial Status Banner

1. **Login to the application**
   - Go to http://localhost:5173
   - Login with your credentials

2. **Navigate to Dashboard**
   - You should see the dashboard

3. **Check for Trial Banner**
   - Look for a blue banner at the top
   - Should show "X days left in trial"
   - Should have a progress bar
   - Should have an "Upgrade Now" button

**Expected appearance**:
```
┌─────────────────────────────────────────────────────┐
│ 🕐 14 Days Left in Trial                    [Trial] │
│                                                      │
│ You're currently on a free trial. Upgrade anytime   │
│ to unlock full features.                            │
│                                                      │
│ Trial Progress                              100%    │
│ ████████████████████████████████████████████        │
│                                                      │
│ [⚡ Upgrade Now]  [💳 Add Payment Method]          │
└─────────────────────────────────────────────────────┘
```

✅ **If you see the banner, it's working!**

### Test 2: Trial Countdown in Header

1. **Look at the dashboard header** (top right)
2. **Check for trial countdown badge**
   - Should show "Trial: 14 days left"
   - Blue background
   - Clock icon

**Expected appearance**:
```
Header: [Logo]  [Navigation]  [🕐 Trial: 14 days left] [Profile]
```

✅ **If you see the countdown, it's working!**

### Test 3: Upgrade Modal

1. **Click "Upgrade Now" button** in the banner
2. **Modal should open** with:
   - Plan selection cards
   - Monthly/Annual toggle
   - Payment method dropdown
   - Order summary
   - "Activate Subscription" button

**Expected appearance**:
```
┌─────────────────────────────────────────┐
│ Upgrade Your Subscription               │
│                                          │
│ [Monthly] [Annual - Save $XXX/year]     │
│                                          │
│ ┌──────────────┐  ┌──────────────┐     │
│ │ Professional │  │ Enterprise   │     │
│ │ $99/month    │  │ $199/month   │     │
│ │ ✓ Feature 1  │  │ ✓ Feature 1  │     │
│ │ ✓ Feature 2  │  │ ✓ Feature 2  │     │
│ └──────────────┘  └──────────────┘     │
│                                          │
│ Payment Method: [Select...]             │
│                                          │
│ Order Summary                            │
│ Plan: Professional                       │
│ Billing: Monthly                         │
│ Total: $99.00/month                      │
│                                          │
│ [⚡ Activate Subscription] [Cancel]     │
└─────────────────────────────────────────┘
```

✅ **If the modal opens, it's working!**

---

## Step 4: Test Different Trial States

### Test State 1: Trial with 3 Days Left (Urgent)

```bash
# Open Prisma Studio
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
npx prisma studio
```

1. Find your customer in the `customers` table
2. Update `trialEndsAt` to 3 days from now:
   - Click on the `trialEndsAt` field
   - Set it to: `2025-11-11T00:00:00.000Z` (3 days from Nov 8)
   - Click "Save 1 change"

3. **Refresh your dashboard** (F5)
4. **Check the banner**:
   - Should now be **orange** (not blue)
   - Should show "3 days left in trial"
   - Should have **pulse animation**

✅ **If banner is orange and pulsing, it's working!**

### Test State 2: Trial Expired - Grace Period

```bash
# In Prisma Studio
```

1. Find your customer
2. Update these fields:
   - `trialEndsAt`: `2025-11-07T00:00:00.000Z` (yesterday)
   - `gracePeriodEndsAt`: `2025-11-11T00:00:00.000Z` (3 days from now)
   - Click "Save 2 changes"

3. **Refresh your dashboard**
4. **Check the banner**:
   - Should be **orange**
   - Should show "Trial Expired - Grace Period"
   - Should show "3 days remaining"

✅ **If banner shows grace period, it's working!**

### Test State 3: Account Suspended

```bash
# In Prisma Studio
```

1. Find your customer
2. Update these fields:
   - `status`: `suspended` (select from dropdown)
   - `suspendedAt`: `2025-11-08T00:00:00.000Z` (today)
   - `suspensionReason`: `Trial expired without payment`
   - Click "Save 3 changes"

3. **Refresh your dashboard**
4. **You should be redirected** to the Account Reactivation Page
5. **Check the page**:
   - Red alert banner
   - "Account Suspended" title
   - Data retention countdown
   - "Reactivate Account" button

✅ **If you see the reactivation page, it's working!**

### Test State 4: Active Subscription (No Banner)

```bash
# In Prisma Studio
```

1. Find your customer
2. Update these fields:
   - `status`: `active`
   - `suspendedAt`: `null`
   - `gracePeriodEndsAt`: `null`
   - Click "Save 3 changes"

3. **Refresh your dashboard**
4. **Check the dashboard**:
   - **No banner should show**
   - **No countdown in header**
   - Normal dashboard view

✅ **If no banner shows, it's working!**

---

## Step 5: Test Upgrade Flow (End-to-End)

### Setup: Create a Test Payment Method

```bash
# In Prisma Studio, go to payment_methods table
# Click "Add record"
```

Add a test payment method:
- `id`: Generate UUID or use `test-pm-123`
- `tenantId`: Your user ID
- `customerId`: Your customer ID
- `authorizationCode`: `test_auth_code`
- `cardType`: `visa`
- `cardLast4`: `4242`
- `cardExpMonth`: `12`
- `cardExpYear`: `2025`
- `bank`: `Test Bank`
- `isDefault`: `true`
- Click "Save 1 change"

### Test the Upgrade

1. **Set customer back to trial**:
   ```bash
   # In Prisma Studio
   status: trial
   trialEndsAt: 2025-11-22T00:00:00.000Z (14 days from now)
   ```

2. **Refresh dashboard**
3. **Click "Upgrade Now"**
4. **In the modal**:
   - Select a plan
   - Choose "Monthly"
   - Select your test payment method
   - Click "Activate Subscription"

5. **Expected result**:
   - Loading spinner shows
   - Success toast: "Subscription activated successfully!"
   - Modal closes
   - Dashboard refreshes
   - Banner disappears

✅ **If upgrade succeeds and banner disappears, it's working!**

---

## Step 6: Test Reactivation Flow

### Setup: Suspend the Account Again

```bash
# In Prisma Studio
status: suspended
suspendedAt: 2025-11-08T00:00:00.000Z
suspensionReason: Trial expired without payment
```

### Test Reactivation

1. **Refresh dashboard**
2. **Should see Reactivation Page**
3. **Select payment method** from dropdown
4. **Click "Reactivate Account"**

5. **Expected result**:
   - Loading spinner shows
   - Success toast: "Account reactivated successfully!"
   - Redirects to dashboard
   - Full access restored

✅ **If reactivation works, everything is working!**

---

## Quick Visual Test Checklist

### ✅ Trial Banner Tests

- [ ] Shows on trial accounts
- [ ] Shows correct days remaining
- [ ] Progress bar updates
- [ ] Blue color for 7+ days
- [ ] Yellow color for 4-7 days
- [ ] Orange color for 1-3 days
- [ ] Red color for 0 days
- [ ] Pulse animation for urgent states
- [ ] "Upgrade Now" button works
- [ ] "Add Payment Method" button works

### ✅ Header Countdown Tests

- [ ] Shows in header
- [ ] Matches banner days
- [ ] Correct color coding
- [ ] Click opens upgrade modal
- [ ] Hides for active accounts

### ✅ Upgrade Modal Tests

- [ ] Opens when clicking upgrade
- [ ] Shows all plans
- [ ] Monthly/Annual toggle works
- [ ] Savings calculation correct
- [ ] Payment method dropdown works
- [ ] Order summary updates
- [ ] Upgrade button works
- [ ] Success toast shows
- [ ] Modal closes after success

### ✅ Grace Period Tests

- [ ] Orange banner shows
- [ ] Grace days countdown correct
- [ ] Can upgrade during grace
- [ ] Can add payment method

### ✅ Suspension Tests

- [ ] Reactivation page shows
- [ ] Red alert banner displays
- [ ] Data retention countdown shows
- [ ] Payment method selection works
- [ ] Reactivation button works
- [ ] Success redirects to dashboard

### ✅ Active Account Tests

- [ ] No banner shows
- [ ] No header countdown
- [ ] Normal dashboard access

---

## Automated Testing Script

Create a test script to quickly test all states:

```bash
#!/bin/bash
# File: test-trial-ui.sh

echo "🧪 Testing Trial Management UI..."

# Get auth token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@contrezz.com","password":"admin123"}' \
  | jq -r .token)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Failed to get auth token"
  exit 1
fi

echo "✅ Got auth token"

# Test 1: Get subscription status
echo ""
echo "Test 1: Get Subscription Status"
STATUS=$(curl -s http://localhost:5000/api/subscription/status \
  -H "Authorization: Bearer $TOKEN")

if echo "$STATUS" | jq -e '.status' > /dev/null; then
  echo "✅ Subscription status API working"
  echo "   Status: $(echo "$STATUS" | jq -r '.status')"
  echo "   Days Remaining: $(echo "$STATUS" | jq -r '.daysRemaining')"
else
  echo "❌ Subscription status API failed"
  exit 1
fi

# Test 2: Get subscription history
echo ""
echo "Test 2: Get Subscription History"
HISTORY=$(curl -s http://localhost:5000/api/subscription/history \
  -H "Authorization: Bearer $TOKEN")

if echo "$HISTORY" | jq -e '.events' > /dev/null; then
  EVENT_COUNT=$(echo "$HISTORY" | jq '.events | length')
  echo "✅ Subscription history API working"
  echo "   Events: $EVENT_COUNT"
else
  echo "❌ Subscription history API failed"
  exit 1
fi

echo ""
echo "🎉 All API tests passed!"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Login with your credentials"
echo "3. Check for trial banner on dashboard"
echo "4. Click 'Upgrade Now' to test modal"
```

Save and run:

```bash
chmod +x test-trial-ui.sh
./test-trial-ui.sh
```

---

## Troubleshooting

### Issue: Banner Not Showing

**Possible causes**:
1. Customer status is 'active'
2. API not returning data
3. Component not mounted

**Debug steps**:
```bash
# Check customer status in database
cd backend
npx prisma studio
# Look at customers table, check status and trialEndsAt

# Check browser console
# Open DevTools (F12) → Console tab
# Look for errors

# Check API response
# Open DevTools → Network tab
# Look for /api/subscription/status
# Check response data
```

### Issue: Upgrade Not Working

**Possible causes**:
1. No payment method
2. Invalid plan ID
3. Backend error

**Debug steps**:
```bash
# Check backend logs
# Look in terminal running backend server
# Check for error messages

# Check browser console
# Look for API errors

# Verify payment method exists
# In Prisma Studio, check payment_methods table
```

### Issue: Colors Not Showing

**Possible causes**:
1. Tailwind CSS not configured
2. CSS not loading

**Debug steps**:
```bash
# Check if Tailwind is working
# Look for other colored elements on page

# Check browser DevTools → Elements
# Inspect the banner element
# Check if classes are applied

# Restart frontend server
npm run dev
```

---

## Performance Testing

### Load Time Test

```javascript
// In browser console
console.time('Component Load');
// Refresh page
// After page loads:
console.timeEnd('Component Load');
// Should be < 2 seconds
```

### API Response Time Test

```bash
# Test API response time
time curl -s http://localhost:5000/api/subscription/status \
  -H "Authorization: Bearer $TOKEN" > /dev/null

# Should be < 500ms
```

---

## Browser Testing

Test in multiple browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Success Criteria

Your trial management UI is working correctly if:

✅ All API endpoints return data  
✅ Trial banner shows on dashboard  
✅ Header countdown displays  
✅ Upgrade modal opens and works  
✅ Colors change based on urgency  
✅ Grace period shows correctly  
✅ Suspension page displays  
✅ Reactivation works  
✅ Active accounts hide banner  
✅ No console errors  
✅ Responsive on mobile  

---

## Next Steps After Testing

Once all tests pass:

1. **Integrate into your actual dashboard**
   - Follow `TRIAL_UI_INTEGRATION_GUIDE.md`

2. **Test with real users**
   - Create test accounts
   - Monitor behavior

3. **Set up monitoring**
   - Track conversion rates
   - Monitor errors

4. **Configure email notifications**
   - Set up email service
   - Test notification delivery

---

## Need Help?

If tests fail:

1. Check backend logs: `backend/logs/`
2. Check browser console (F12)
3. Check Network tab for API errors
4. Verify database has correct data
5. Ensure all servers are running

**All tests passing?** 🎉 Your trial management UI is ready to use!

