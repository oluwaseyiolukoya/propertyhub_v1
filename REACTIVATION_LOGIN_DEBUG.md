# Reactivation Login Debug Guide

## Problem

After reactivating a customer account, users still cannot log in and see the error:
```
Your account has been deactivated. Please contact your administrator.
```

## Root Cause

The login endpoint checks two conditions:
1. `user.isActive === false`
2. `user.status !== 'active'`

If either condition is true, login is blocked.

## Debugging Steps

### Step 1: Check User Status in Database

Run this command to check the user's current status:

```bash
cd backend
node scripts/check-user-status.js <email>
```

**Example:**
```bash
node scripts/check-user-status.js developer_two@contrezz.com
```

**Expected Output (if reactivated correctly):**
```
🔍 Checking status for: developer_two@contrezz.com

👤 User Details:
  - ID: xxx
  - Name: Developer Two
  - Email: developer_two@contrezz.com
  - Role: developer
  - Is Active: true          ✅ Should be true
  - Status: active           ✅ Should be 'active'
  - Customer ID: xxx

🏢 Customer Details:
  - Company: Developer Two Company
  - Status: active           ✅ Should be 'active'
  - MRR: 99
  - Plan: Developer Starter

📊 Login Check:
  ✅ ALLOWED: User can log in
```

**If Blocked:**
```
📊 Login Check:
  ❌ BLOCKED: isActive is false
  OR
  ❌ BLOCKED: status is 'inactive' (not 'active')
```

### Step 2: Check Backend Logs

When attempting to login, check the backend console for:

```
❌ Login blocked - User inactive: {
  email: 'developer_two@contrezz.com',
  isActive: false,
  status: 'inactive',
  customerId: 'xxx'
}
```

This will tell you exactly why the login is being blocked.

### Step 3: Manually Reactivate User (if needed)

If the reactivation endpoint didn't work, manually fix it:

```bash
cd backend
node scripts/manual-reactivate.js <customer-id>
```

Or use Prisma Studio:
```bash
cd backend
npx prisma studio
```

Then:
1. Go to `users` table
2. Find the user by email
3. Set `isActive` to `true`
4. Set `status` to `'active'`
5. Save

## Reactivation Endpoint Verification

### Test the Reactivation Endpoint

```bash
# Get the customer ID first
curl -X GET http://localhost:5000/api/customers \
  -H "Authorization: Bearer <admin_token>" \
  | jq '.[] | select(.email=="developer_two@contrezz.com") | .id'

# Then reactivate
curl -X POST http://localhost:5000/api/customers/<customer-id>/reactivate \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Reactivating for testing"}'
```

### Expected Response:

```json
{
  "message": "Customer account reactivated successfully",
  "customer": {
    "id": "xxx",
    "company": "Developer Two Company",
    "status": "active",
    "mrr": 99,
    ...
  }
}
```

## What the Reactivation Endpoint Does

```typescript
// 1. Updates Customer
await prisma.customers.update({
  where: { id },
  data: {
    status: 'active',
    mrr: calculatedMRR,
    subscriptionStartDate: new Date(),
    trialStartsAt: null,
    trialEndsAt: null,
    ...
  }
});

// 2. Reactivates ALL Users
await prisma.users.updateMany({
  where: { customerId: id },
  data: {
    isActive: true,        // ✅ This should allow login
    status: 'active',      // ✅ This should allow login
    updatedAt: new Date()
  }
});
```

## Common Issues

### Issue 1: Reactivation Endpoint Not Called

**Symptom:** User status is still `inactive` after "reactivation"

**Solution:** Make sure you're calling the correct endpoint:
```
POST /api/customers/:id/reactivate
```

NOT:
```
PUT /api/customers/:id
```

### Issue 2: Wrong Customer ID

**Symptom:** Reactivation succeeds but wrong customer is reactivated

**Solution:** Verify the customer ID before calling reactivation

### Issue 3: Database Not Updated

**Symptom:** Reactivation endpoint returns success but database not updated

**Solution:** Check backend logs for Prisma errors

### Issue 4: Multiple Users for Customer

**Symptom:** Some users can login, others cannot

**Solution:** The reactivation endpoint uses `updateMany` which should update ALL users. Verify with:

```sql
SELECT id, email, role, isActive, status 
FROM users 
WHERE customerId = '<customer-id>';
```

All should have `isActive: true` and `status: 'active'`.

## Manual Fix Script

Create `backend/scripts/manual-reactivate.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function manualReactivate() {
  const customerId = process.argv[2];
  
  if (!customerId) {
    console.error('Usage: node scripts/manual-reactivate.js <customer-id>');
    process.exit(1);
  }

  try {
    // 1. Reactivate customer
    const customer = await prisma.customers.update({
      where: { id: customerId },
      data: {
        status: 'active',
        updatedAt: new Date()
      }
    });

    console.log('✅ Customer reactivated:', customer.company);

    // 2. Reactivate all users
    const result = await prisma.users.updateMany({
      where: { customerId },
      data: {
        isActive: true,
        status: 'active',
        updatedAt: new Date()
      }
    });

    console.log(`✅ Reactivated ${result.count} users`);

    // 3. Verify
    const users = await prisma.users.findMany({
      where: { customerId },
      select: { email: true, isActive: true, status: true }
    });

    console.log('\n📋 User Status:');
    users.forEach(u => {
      console.log(`  - ${u.email}: isActive=${u.isActive}, status=${u.status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

manualReactivate();
```

## Testing Checklist

After reactivation:

- [ ] Run `check-user-status.js` script
- [ ] Verify `isActive: true`
- [ ] Verify `status: 'active'`
- [ ] Verify customer `status: 'active'`
- [ ] Verify customer `mrr > 0`
- [ ] Try to login
- [ ] Check backend logs for any errors
- [ ] Verify all team members can login

## Expected Flow

### Successful Reactivation:

```
1. Admin calls reactivation endpoint
   ↓
2. Backend updates customer status to 'active'
   ↓
3. Backend updates customer MRR
   ↓
4. Backend updates ALL users:
   - isActive: true
   - status: 'active'
   ↓
5. User tries to login
   ↓
6. Login check passes:
   - isActive === true ✅
   - status === 'active' ✅
   ↓
7. User logged in successfully ✅
```

### Failed Login After Reactivation:

```
1. Admin calls reactivation endpoint
   ↓
2. Backend updates customer
   ↓
3. Backend updates users (but something fails?)
   ↓
4. User tries to login
   ↓
5. Login check fails:
   - isActive === false ❌
   OR
   - status !== 'active' ❌
   ↓
6. Login blocked with 403 error
```

## Quick Fix

If you need to quickly fix a specific user:

```bash
# Using Prisma Client directly
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const email = 'developer_two@contrezz.com';
  
  const user = await prisma.users.update({
    where: { email },
    data: {
      isActive: true,
      status: 'active'
    }
  });
  
  console.log('✅ Fixed:', user.email);
  await prisma.\$disconnect();
})();
"
```

---

**Status:** Debug guide ready
**Date:** November 14, 2025
**Next Step:** Run `check-user-status.js` to diagnose the issue

