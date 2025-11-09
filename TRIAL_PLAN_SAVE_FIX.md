# 🔧 Trial Plan Save Issue - FIXED

## Problem

Admin was unable to save the Trial plan after editing the trial duration field. The update request was being sent but the backend was not accepting the `trialDurationDays` field.

## Root Cause

The backend `/api/plans/:id` (PUT) route was not extracting or saving the `trialDurationDays` field from the request body.

**Before:**
```typescript
// Update plan route
const {
  name,
  description,
  monthlyPrice,
  annualPrice,
  // ... other fields
  isPopular
  // ❌ trialDurationDays was missing
} = req.body;

const plan = await prisma.plans.update({
  where: { id },
  data: {
    name,
    description,
    // ... other fields
    isPopular,
    // ❌ trialDurationDays not included
    updatedAt: new Date()
  }
});
```

## The Fix

Updated both CREATE and UPDATE routes to handle `trialDurationDays`:

### 1. Update Plan Route (PUT /:id)

**File:** `backend/src/routes/plans.ts`

```typescript
// Extract from request body
const {
  name,
  description,
  monthlyPrice,
  annualPrice,
  currency,
  propertyLimit,
  userLimit,
  storageLimit,
  features,
  isActive,
  isPopular,
  trialDurationDays  // ✅ Added
} = req.body;

// Include in update data
const plan = await prisma.plans.update({
  where: { id },
  data: {
    name,
    description,
    monthlyPrice,
    annualPrice,
    currency,
    propertyLimit,
    userLimit,
    storageLimit,
    features,
    isActive,
    isPopular,
    trialDurationDays: trialDurationDays !== undefined ? trialDurationDays : undefined,  // ✅ Added
    updatedAt: new Date()
  }
});
```

### 2. Create Plan Route (POST /)

Also updated the create route for consistency:

```typescript
const plan = await prisma.plans.create({
  data: {
    id: uuidv4(),
    name,
    description,
    monthlyPrice: parseFloat(monthlyPrice),
    annualPrice: annualPrice ? parseFloat(annualPrice) : parseFloat(monthlyPrice) * 10,
    currency: currency || 'NGN',
    propertyLimit: parseInt(propertyLimit) || 5,
    userLimit: parseInt(userLimit) || 3,
    storageLimit: parseInt(storageLimit) || 1000,
    features: features || {},
    isActive: isActive !== undefined ? isActive : true,
    isPopular: isPopular || false,
    trialDurationDays: trialDurationDays !== undefined ? parseInt(trialDurationDays) : undefined,  // ✅ Added
    updatedAt: new Date()
  }
});
```

## What Changed

| Route | Before | After |
|-------|--------|-------|
| POST /api/plans | ❌ Ignored trialDurationDays | ✅ Saves trialDurationDays |
| PUT /api/plans/:id | ❌ Ignored trialDurationDays | ✅ Updates trialDurationDays |

## Testing

### Test 1: Update Trial Plan

1. **Login as admin:** http://localhost:5173
2. **Go to Billing & Plans** tab
3. **Find Trial plan** (monthlyPrice = $0)
4. **Click Edit**
5. **Change trial duration** to 30 days
6. **Click "Update Plan"**
7. **Should see:** ✅ "Plan updated successfully!" toast

### Test 2: Verify Database

```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.plans.findFirst({
  where: { monthlyPrice: 0 },
  select: { name: true, trialDurationDays: true, updatedAt: true }
}).then(plan => {
  console.log('Trial Plan:');
  console.log('  Duration:', plan.trialDurationDays, 'days');
  console.log('  Updated:', plan.updatedAt);
  prisma.\$disconnect();
});
"
```

**Expected output:**
```
Trial Plan:
  Duration: 30 days
  Updated: 2025-11-09T06:52:...
```

### Test 3: Create New Customer

After updating trial duration to 30 days, create a new customer and verify they get 30-day trial:

```bash
cd backend
npx tsx -e "
import { PrismaClient } from '@prisma/client';
import { calculateTrialEndDate } from './src/lib/trial-config';

const prisma = new PrismaClient();

async function test() {
  const endDate = await calculateTrialEndDate();
  const now = new Date();
  const days = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  console.log('New customers will get:', days, 'days trial');
  console.log('Trial ends:', endDate.toISOString().split('T')[0]);
  
  await prisma.\$disconnect();
}

test();
"
```

**Expected output:**
```
New customers will get: 30 days trial
Trial ends: 2025-12-09
```

## Backend Restart Required

⚠️ **Important:** After updating the backend code, the server was restarted to load the changes.

```bash
# Backend was restarted
cd backend
PORT=5000 npm run dev
```

## Summary

✅ **Fixed:** Backend now accepts and saves `trialDurationDays` field

✅ **Routes Updated:** Both CREATE and UPDATE plan routes

✅ **Backend Restarted:** Changes are now live

✅ **Ready:** Admin can now edit and save trial duration

---

**The admin can now successfully save the Trial plan with the updated trial duration!** 🎉

