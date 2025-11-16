# 🔍 Debug Upgrade Issue - Step by Step

## Current Status

Payment is successful in Paystack, but the upgrade fails with a 500 error.

I've added comprehensive logging to track exactly where the issue occurs.

---

## 🧪 Test Now with Full Logging

### Step 1: Check Backend is Running

```bash
# Make sure backend is running on port 5000
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
PORT=5000 npm run dev
```

**Watch the terminal carefully** - you'll see detailed logs for each step.

### Step 2: Test Payment Flow

1. **Open Chrome with disabled security:**
   ```bash
   pkill "Google Chrome"
   open -na "Google Chrome" --args --disable-web-security --user-data-dir="/tmp/chrome_dev_test" http://localhost:5173
   ```

2. **Login:** `demo@contrezz.com` / `demo123`

3. **Click "Upgrade Now"**

4. **Select a plan** (e.g., Professional, Monthly)

5. **Click "Proceed to Payment"**

6. **Pay with test card:**
   - Card: `4084 0840 8408 4081`
   - CVV: `408`
   - Expiry: `12/30`
   - PIN: `0000`
   - OTP: `123456`

### Step 3: Watch Backend Logs

When payment succeeds, you'll see logs like this:

```
[Subscription] ========== UPGRADE REQUEST START ==========
[Subscription] User: { id: '...', customerId: '...', email: '...' }
[Subscription] Request body: { planId: '...', billingCycle: 'monthly', paymentReference: '...', savePaymentMethod: true }
[Subscription] Fetching customer...
[Subscription] Customer found: { id: '...', email: '...', status: 'trial' }
[Subscription] Verifying payment with Paystack...
[Subscription] Calling Paystack API with reference: upgrade_...
[Subscription] Paystack verification response: { status: true, dataStatus: 'success', message: '...' }
[Subscription] Payment verified successfully
[Subscription] Fetching plan: ...
[Subscription] Plan found: { id: '...', name: 'Professional', monthlyPrice: 99 }
[Subscription] Updating customer in database...
[Subscription] Customer updated successfully: { id: '...', status: 'active', planId: '...', propertyLimit: 10, userLimit: 5, storageLimit: 5000 }
[Subscription] ========== UPGRADE SUCCESS ==========
[Subscription] Sending response: { success: true, ... }
```

**OR** if there's an error:

```
[Subscription] ========== UPGRADE ERROR ==========
[Subscription] Error message: [EXACT ERROR MESSAGE]
[Subscription] Error code: [ERROR CODE]
[Subscription] Error stack: [FULL STACK TRACE]
```

---

## 🎯 What to Look For

### Scenario 1: Error at "Fetching customer"

**Log shows:**
```
[Subscription] Customer not found: ...
```

**Problem:** User's `customerId` is invalid or missing.

**Fix:** Check user authentication and database.

---

### Scenario 2: Error at "Verifying payment"

**Log shows:**
```
[Subscription] Payment verification failed: { ... }
```

**Problem:** Paystack API returned an error.

**Possible causes:**
- Payment reference is invalid
- Payment was not actually successful
- Paystack API is down
- Wrong Paystack secret key

**Fix:** Check the Paystack verification response details in the logs.

---

### Scenario 3: Error at "Fetching plan"

**Log shows:**
```
[Subscription] Plan not found: ...
```

**Problem:** The selected plan ID doesn't exist in the database.

**Fix:** Check plans in database:
```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.plans.findMany({ where: { isActive: true } }).then(plans => {
  console.log('Available plans:');
  plans.forEach(p => console.log('  -', p.id, p.name));
  prisma.\$disconnect();
});
"
```

---

### Scenario 4: Error at "Updating customer"

**Log shows:**
```
[Subscription] Updating customer in database...
[Subscription] ========== UPGRADE ERROR ==========
[Subscription] Error message: [Prisma error]
```

**Problem:** Database update failed.

**Possible causes:**
- Database connection issue
- Schema mismatch
- Constraint violation

**Fix:** Check the Prisma error message and code in the logs.

---

### Scenario 5: No logs at all

**Problem:** Request not reaching the backend.

**Possible causes:**
- Backend not running
- Wrong port
- CORS issue
- Network issue

**Fix:**
1. Check backend is running: `lsof -i :5000`
2. Check frontend is calling correct URL
3. Check browser console for network errors

---

## 📊 After You Test

**Copy and paste the ENTIRE backend terminal output** from:
```
[Subscription] ========== UPGRADE REQUEST START ==========
```

to either:
```
[Subscription] ========== UPGRADE SUCCESS ==========
```

or:
```
[Subscription] ========== UPGRADE ERROR ==========
```

This will show me exactly where the issue is.

---

## 🔧 Quick Checks

### Check 1: Database Connection

```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database error:', err))
  .finally(() => prisma.\$disconnect());
"
```

### Check 2: Paystack Configuration

```bash
cd backend
grep PAYSTACK_SECRET_KEY .env.local
```

Should show:
```
PAYSTACK_SECRET_KEY=sk_test_...
```

### Check 3: Customer Status

```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.customers.findFirst({
  where: { email: 'demo@contrezz.com' }
}).then(c => {
  console.log('Customer status:', c.status);
  console.log('Customer ID:', c.id);
  prisma.\$disconnect();
});
"
```

### Check 4: Available Plans

```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.plans.findMany({
  where: { isActive: true, monthlyPrice: { gt: 0 } }
}).then(plans => {
  console.log('Available plans for upgrade:');
  plans.forEach(p => console.log('  -', p.id, ':', p.name, '-', p.monthlyPrice));
  prisma.\$disconnect();
});
"
```

---

## 🎉 Expected Successful Flow

When everything works, you'll see:

1. **Backend logs:**
   ```
   [Subscription] ========== UPGRADE REQUEST START ==========
   [Subscription] User: { ... }
   [Subscription] Request body: { ... }
   [Subscription] Fetching customer...
   [Subscription] Customer found: { ... }
   [Subscription] Verifying payment with Paystack...
   [Subscription] Calling Paystack API with reference: ...
   [Subscription] Paystack verification response: { status: true, dataStatus: 'success', ... }
   [Subscription] Payment verified successfully
   [Subscription] Fetching plan: ...
   [Subscription] Plan found: { ... }
   [Subscription] Updating customer in database...
   [Subscription] Customer updated successfully: { ... }
   [Subscription] ========== UPGRADE SUCCESS ==========
   [Subscription] Sending response: { success: true, ... }
   ```

2. **Frontend:**
   - Toast: "🎉 Subscription activated successfully!"
   - Page reloads
   - Trial banner disappears
   - Account is active

3. **Database:**
   ```bash
   cd backend
   node -e "
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();
   prisma.customers.findFirst({
     where: { email: 'demo@contrezz.com' },
     include: { plans: true }
   }).then(c => {
     console.log('✅ Status:', c.status);
     console.log('✅ Plan:', c.plans.name);
     console.log('✅ Property Limit:', c.propertyLimit);
     console.log('✅ User Limit:', c.userLimit);
     console.log('✅ Storage Limit:', c.storageLimit);
     console.log('✅ Trial Ends:', c.trialEndsAt);
     prisma.\$disconnect();
   });
   "
   ```

   Should show:
   ```
   ✅ Status: active
   ✅ Plan: Professional
   ✅ Property Limit: 10
   ✅ User Limit: 5
   ✅ Storage Limit: 5000
   ✅ Trial Ends: null
   ```

---

## 🆘 Next Steps

1. **Run the test** following Step 1-3 above
2. **Copy the backend logs** from the terminal
3. **Share the logs** so I can see exactly where it fails
4. **I'll provide the exact fix** based on the error

The detailed logging will show us exactly which step is failing! 🔍

