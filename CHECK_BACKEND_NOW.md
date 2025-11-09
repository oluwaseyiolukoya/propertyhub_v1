# 🚨 URGENT: Check Backend Terminal NOW

## The Issue

The frontend shows "Failed to upgrade subscription" but this is just a **symptom**.

The **real error** is in your **backend terminal**.

---

## 🔍 What to Do RIGHT NOW

### Step 1: Look at Your Backend Terminal

Find the terminal window where you ran:
```bash
cd backend
PORT=5000 npm run dev
```

### Step 2: Look for These Logs

You should see detailed logs like:

```
[Subscription] ========== UPGRADE REQUEST START ==========
[Subscription] User: { ... }
[Subscription] Request body: { ... }
[Subscription] Fetching customer...
```

**Then EITHER:**

✅ **Success:**
```
[Subscription] Customer found: { ... }
[Subscription] Verifying payment with Paystack...
[Subscription] Payment verified successfully
[Subscription] ========== UPGRADE SUCCESS ==========
```

❌ **OR Error (THIS IS WHAT WE NEED):**
```
[Subscription] ========== UPGRADE ERROR ==========
[Subscription] Error message: [THE ACTUAL ERROR]
[Subscription] Error code: [ERROR CODE]
[Subscription] Error stack: [STACK TRACE]
```

---

## 📋 Copy and Share This

**Copy the ENTIRE output** from your backend terminal starting from:
```
[Subscription] ========== UPGRADE REQUEST START ==========
```

to:
```
[Subscription] ========== UPGRADE ERROR ==========
```

This will tell me **exactly** what's failing.

---

## 🎯 Most Common Issues

Based on the 500 error, here are the most likely causes:

### 1. Database Connection Issue

**Check if backend shows:**
```
Error: P1001: Can't reach database server
```

**Fix:**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# If not running, start it
brew services start postgresql@14
```

### 2. Missing Environment Variable

**Check if backend shows:**
```
[Subscription] Paystack secret key not configured
```

**Fix:**
```bash
cd backend
cat .env.local | grep PAYSTACK_SECRET_KEY
# Should show: PAYSTACK_SECRET_KEY=sk_test_...
```

### 3. Plan Not Found

**Check if backend shows:**
```
[Subscription] Plan not found: [plan-id]
```

**Fix:**
```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.plans.findMany({ where: { isActive: true } }).then(plans => {
  console.log('Available plans:');
  plans.forEach(p => console.log('  -', p.id, ':', p.name));
  prisma.\$disconnect();
});
"
```

### 4. Customer Not Found

**Check if backend shows:**
```
[Subscription] Customer not found: [customer-id]
```

**Fix:**
```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.customers.findFirst({
  where: { email: 'demo@contrezz.com' }
}).then(c => {
  console.log('Customer:', c ? c.id : 'NOT FOUND');
  prisma.\$disconnect();
});
"
```

### 5. Paystack Verification Failed

**Check if backend shows:**
```
[Subscription] Payment verification failed: { ... }
```

**Possible causes:**
- Payment reference is invalid
- Payment was not actually successful
- Paystack API issue

---

## 🆘 If Backend Terminal is Not Running

If you don't see any backend logs, it means the backend is not running!

**Start it:**
```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
PORT=5000 npm run dev
```

You should see:
```
Server running on port 5000
Database connected
```

---

## 📊 Quick Diagnostic Commands

Run these to check system health:

### Check 1: Database Connection
```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database error:', err.message))
  .finally(() => prisma.\$disconnect());
"
```

### Check 2: Customer Status
```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.customers.findFirst({
  where: { email: 'demo@contrezz.com' }
}).then(c => {
  if (!c) {
    console.log('❌ Customer not found');
  } else {
    console.log('✅ Customer found');
    console.log('   Status:', c.status);
    console.log('   ID:', c.id);
  }
  prisma.\$disconnect();
});
"
```

### Check 3: Available Plans
```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.plans.findMany({
  where: { isActive: true, monthlyPrice: { gt: 0 } }
}).then(plans => {
  console.log('Available plans:', plans.length);
  plans.forEach(p => console.log('  -', p.name, '(', p.id, ')'));
  prisma.\$disconnect();
});
"
```

### Check 4: Paystack Configuration
```bash
cd backend
grep PAYSTACK_SECRET_KEY .env.local
```

Should show:
```
PAYSTACK_SECRET_KEY=sk_test_...
```

---

## 🎯 What I Need From You

**Please share:**

1. **Backend terminal output** (the full upgrade request logs)
2. **Results of the 4 diagnostic commands** above

This will tell me exactly what's wrong and I can provide the precise fix!

---

## 💡 Quick Fix Attempts

While we wait for logs, try these:

### Attempt 1: Restart Everything

```bash
# Terminal 1: Kill and restart backend
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
pkill -f "npm run dev"
PORT=5000 npm run dev

# Terminal 2: Hard refresh frontend
# In Chrome: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### Attempt 2: Clear Auth and Re-login

1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Click "Clear All"
4. Refresh page
5. Login again
6. Try upgrade again

### Attempt 3: Check Backend Port

```bash
# Check if port 5000 is in use
lsof -i :5000

# If nothing shows, backend is not running
# Start it:
cd backend
PORT=5000 npm run dev
```

---

## 🎉 Once We See the Logs

I'll be able to tell you:
1. ✅ Exactly which step is failing
2. ✅ Why it's failing  
3. ✅ The precise fix needed

**Check your backend terminal NOW and share the logs!** 🚀

