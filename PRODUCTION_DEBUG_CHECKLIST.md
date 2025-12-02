# Production Debugging Checklist

## Issue: Chart displays differently in production vs local

**Symptom:** Revenue vs Expenses Trend chart shows only green expense bars in production, but works correctly locally.

---

## Step 1: Run the Debug Script in Production

### Access DigitalOcean Console
1. Go to DigitalOcean Dashboard
2. Navigate to your Backend app
3. Click **Console** tab
4. Wait for terminal to load

### Run Debug Script
```bash
cd /workspace/backend
npx tsx scripts/debug-production.ts
```

### What to Look For
The script will tell you EXACTLY what's wrong. Look for these sections:

#### ❌ Critical Issues:
- **"NO OWNERS FOUND"** → No owner accounts exist
- **"NO PROPERTIES FOUND"** → Owner has no properties
- **"NO CHART-ELIGIBLE PAYMENTS FOUND"** → This is likely your issue
- **"EXPENSES ONLY, NO REVENUE"** → Matches your screenshot

#### ✅ What Should Be There:
- At least 1 owner account
- At least 1 property for that owner
- Payments with:
  - `status = 'success'`
  - `type != 'subscription'` (rent, deposit, etc.)
  - `paidAt` date is NOT null

---

## Step 2: Check Deployment Status

### Verify Latest Code is Deployed
```bash
# In DigitalOcean Console
cd /workspace/backend
git log --oneline -3
```

**Expected output should show:**
```
c578e1a feat: Add comprehensive production debugging script
97e1359 feat: Add data comparison script
ab13d80 fix: Add empty state handling and debug logging
```

If you see older commits, the deployment hasn't completed yet. Wait 2-3 minutes and check again.

---

## Step 3: Check Database Schema

### Verify Migrations
```bash
cd /workspace/backend
npx prisma migrate status
```

**Expected output:**
```
24 migrations found in prisma/migrations
Database schema is up to date!
```

If you see "pending migrations", run:
```bash
npx prisma migrate deploy
```

---

## Step 4: Check Frontend Build

### Verify Frontend Has Latest Code
1. Open production site in browser
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Refresh the page
5. Look for: `📊 Monthly Revenue Data:` log

**What it means:**
- **If you see the log:** Frontend has latest code ✅
- **If you don't see it:** Frontend hasn't deployed yet, wait 2-3 minutes

---

## Step 5: Inspect API Response

### Check What Data the API Returns
1. In browser Developer Tools, go to **Network** tab
2. Navigate to Financial Reports page
3. Find the request: `monthly-revenue?months=12`
4. Click on it
5. Go to **Response** tab

**Expected format:**
```json
[
  {
    "month": "Jan",
    "revenue": 0,
    "expenses": 0,
    "netIncome": 0
  },
  ...
  {
    "month": "Dec",
    "revenue": 700000,
    "expenses": 200000,
    "netIncome": 500000
  }
]
```

**If all months show 0 revenue:** No chart-eligible payments exist in production.

---

## Step 6: Common Root Causes & Solutions

### Root Cause 1: No Payments in Production
**Diagnosis:** Debug script shows "NO CHART-ELIGIBLE PAYMENTS FOUND"

**Solution:**
1. Log into production as owner
2. Go to **Payment Management** page
3. Click **"Record Manual Payment"**
4. Fill in:
   - Tenant: Select a tenant
   - Amount: Enter amount (e.g., 200000)
   - Payment Method: Select method
   - Payment Date: Select date
   - Payment Type: **MUST be "Rent" or "Deposit"** (NOT subscription)
5. Click **"Record & send receipt"**
6. Refresh Financial Reports page

### Root Cause 2: All Payments are Subscriptions
**Diagnosis:** Debug script shows "Subscription payments: X" but "Chart-eligible payments: 0"

**Why:** Subscription payments are excluded from revenue charts (they're platform fees, not property revenue)

**Solution:** Add rent/deposit payments as shown above.

### Root Cause 3: Payments Missing `paidAt` Date
**Diagnosis:** Debug script shows "Success payments without paidAt: X"

**Why:** The chart filters by `paidAt` date range, so payments without this field are excluded.

**Solution:** This is a data integrity issue. Run this SQL in production:
```sql
UPDATE payments 
SET "paidAt" = "createdAt" 
WHERE status = 'success' AND "paidAt" IS NULL;
```

### Root Cause 4: Payments Have Wrong Status
**Diagnosis:** Debug script shows "Payments with non-success status: X"

**Why:** Only `status = 'success'` payments count as revenue.

**Solution:** Check why payments aren't marked as success. Possible reasons:
- Manual payments not properly saved
- Payment verification failed
- Database migration issue

---

## Step 7: Quick Fix (Add Test Data)

If you just want to see the chart working, add test data:

### Via UI (Recommended)
1. Log into production
2. Add 2-3 manual payments with type "Rent"
3. Add 1-2 expenses
4. Refresh Financial Reports

### Via Database (Advanced)
```sql
-- Add a test payment
INSERT INTO payments (
  id, "customerId", "propertyId", amount, status, type, "paidAt", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  c.id,
  p.id,
  200000.00,
  'success',
  'rent',
  NOW(),
  NOW(),
  NOW()
FROM customers c
CROSS JOIN properties p
WHERE c.id = (SELECT id FROM customers LIMIT 1)
  AND p.id = (SELECT id FROM properties LIMIT 1)
LIMIT 1;
```

---

## Step 8: Verify the Fix

### After Adding Data:
1. Refresh Financial Reports page
2. Check browser console for: `📊 Monthly Revenue Data:`
3. Verify the data shows non-zero revenue
4. Chart should now display blue revenue bars

### If Still Not Working:
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Try incognito/private window
4. Check browser console for errors

---

## Step 9: Compare Local vs Production

### Run Comparison Script in Both Environments

**Local:**
```bash
cd backend
export DATABASE_URL="postgresql://oluwaseyio@localhost:5432/contrezz?schema=public"
npx tsx scripts/compare-data.ts > local-report.txt
```

**Production (DigitalOcean Console):**
```bash
cd /workspace/backend
npx tsx scripts/compare-data.ts > prod-report.txt
```

**Compare:**
```bash
# Download prod-report.txt from console
# Then compare side by side
diff local-report.txt prod-report.txt
```

---

## Expected Results After Fix

### Chart Should Show:
- **Blue bars:** Revenue (rent/deposit payments)
- **Green bars:** Expenses
- **Orange line:** Net Income (revenue - expenses)

### Console Should Show:
```
📊 Monthly Revenue Data: [
  { month: "Jan", revenue: 0, expenses: 0, netIncome: 0 },
  ...
  { month: "Dec", revenue: 700000, expenses: 200000, netIncome: 500000 }
]
```

### API Response Should Return:
- Non-zero revenue values for months with payments
- Proper expense values
- Correct net income calculations

---

## Still Having Issues?

### Collect This Information:
1. Output of `npx tsx scripts/debug-production.ts`
2. Screenshot of browser Network tab showing `/api/financial/monthly-revenue` response
3. Screenshot of browser Console showing any errors
4. Output of `git log --oneline -3` in production
5. Output of `npx prisma migrate status` in production

### Common Edge Cases:

**Case 1: Code deployed but not restarted**
```bash
# Force restart the app in DigitalOcean Dashboard
# Apps → Backend → Settings → Force Redeploy
```

**Case 2: Environment variables missing**
```bash
# Check if FRONTEND_URL is set correctly
echo $FRONTEND_URL
```

**Case 3: Database connection issues**
```bash
# Test database connection
npx prisma db pull
```

---

## Summary Checklist

- [ ] Latest code deployed (commit c578e1a or later)
- [ ] Database schema up to date (24 migrations)
- [ ] Debug script run in production
- [ ] At least 1 owner account exists
- [ ] At least 1 property exists for owner
- [ ] At least 1 chart-eligible payment exists:
  - [ ] status = 'success'
  - [ ] type = 'rent' or 'deposit' (NOT 'subscription')
  - [ ] paidAt is NOT null
  - [ ] paidAt is within last 12 months
- [ ] Browser console shows `📊 Monthly Revenue Data:` log
- [ ] API returns non-zero revenue values
- [ ] Chart displays blue revenue bars

---

**Last Updated:** December 2, 2024
**Script Location:** `backend/scripts/debug-production.ts`
**Related Files:** `backend/scripts/compare-data.ts`, `backend/src/routes/financial.ts`

