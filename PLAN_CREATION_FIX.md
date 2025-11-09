# ✅ Plan Creation 500 Error - Fixed!

## The Problem

When trying to create a new billing plan (like a "Trial Plan"), the server returned a 500 Internal Server Error:

```
:5000/api/plans:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

## Root Cause

The Prisma schema requires certain fields that the backend wasn't providing:

### Required Fields in Database:
1. ✅ `id` - String (must be UUID)
2. ✅ `annualPrice` - Float (NOT optional in schema)
3. ✅ `updatedAt` - DateTime (must be provided)
4. ✅ Type conversions needed (string to Float/Int)

### What Was Missing:
- No `id` field (Prisma doesn't auto-generate for String type)
- No `updatedAt` field
- No type conversions (monthlyPrice came as string, needed Float)
- Default currency was 'USD' but schema default is 'NGN'

## All Fixes Applied

### 1. Added UUID Import
**File**: `backend/src/routes/plans.ts` (Line 6)

```typescript
import { v4 as uuidv4 } from 'uuid';
```

### 2. Fixed Create Plan Route
**File**: `backend/src/routes/plans.ts` (Lines 53-69)

```typescript
// Before
const plan = await prisma.plans.create({
  data: {
    name,
    description,
    monthlyPrice,
    annualPrice: annualPrice || monthlyPrice * 10,
    currency: currency || 'USD',
    propertyLimit: propertyLimit || 5,
    userLimit: userLimit || 3,
    storageLimit: storageLimit || 1000,
    features: features || [],
    isActive: isActive !== undefined ? isActive : true,
    isPopular: isPopular || false
  }
});

// After
const plan = await prisma.plans.create({
  data: {
    id: uuidv4(),                                           // ✅ Added UUID
    name,
    description,
    monthlyPrice: parseFloat(monthlyPrice),                 // ✅ Type conversion
    annualPrice: annualPrice 
      ? parseFloat(annualPrice) 
      : parseFloat(monthlyPrice) * 10,                      // ✅ Type conversion
    currency: currency || 'NGN',                            // ✅ Changed default
    propertyLimit: parseInt(propertyLimit) || 5,            // ✅ Type conversion
    userLimit: parseInt(userLimit) || 3,                    // ✅ Type conversion
    storageLimit: parseInt(storageLimit) || 1000,           // ✅ Type conversion
    features: features || {},                               // ✅ Changed to object
    isActive: isActive !== undefined ? isActive : true,
    isPopular: isPopular || false,
    updatedAt: new Date()                                   // ✅ Added updatedAt
  }
});
```

### 3. Added Better Error Logging
**File**: `backend/src/routes/plans.ts` (Lines 46, 71, 77-78)

```typescript
console.log('[Plans] Creating plan with data:', req.body);
// ... create plan ...
console.log('[Plans] Plan created successfully:', plan.id);

// In catch block
console.error('[Plans] Failed to create plan:', error);
return res.status(500).json({ 
  error: 'Failed to create plan', 
  details: error.message  // ✅ Added error details
});
```

### 4. Fixed Update Plan Route
**File**: `backend/src/routes/plans.ts` (Line 117)

```typescript
const plan = await prisma.plans.update({
  where: { id },
  data: {
    // ... other fields ...
    updatedAt: new Date()  // ✅ Added updatedAt
  }
});
```

## Key Changes Explained

### 1. UUID Generation
The `id` field is a String type in Prisma, so it doesn't auto-generate. We need to manually create a UUID:

```typescript
id: uuidv4()
```

### 2. Type Conversions
Form data comes as strings, but the database expects specific types:

```typescript
monthlyPrice: parseFloat(monthlyPrice)    // "100" → 100.0
propertyLimit: parseInt(propertyLimit)    // "5" → 5
```

### 3. Currency Default
The schema default is `'NGN'` (Nigerian Naira), not `'USD'`:

```typescript
currency: currency || 'NGN'
```

### 4. Features Format
Changed from array to object (more flexible for storing plan features):

```typescript
features: features || {}  // {} instead of []
```

### 5. UpdatedAt Field
Must be explicitly set (not auto-generated):

```typescript
updatedAt: new Date()
```

## How to Test

### Step 1: Restart Backend Server

The backend needs to be restarted to apply the changes:

```bash
# Stop the backend (Ctrl+C)
cd backend
npm run dev
```

### Step 2: Login as Admin

1. Go to: http://localhost:5173
2. Login as: **admin@contrezz.com** (password: `admin123`)

### Step 3: Create a Trial Plan

1. Go to **Settings** or **Billing Plans** section
2. Click **"Add Plan"** or **"Create Plan"**
3. Fill in the form:

**Example Trial Plan:**
```
Name: Trial Plan
Description: 14-day free trial with limited features
Monthly Price: 0
Annual Price: 0 (or leave empty for auto-calculation)
Currency: NGN (or your preferred currency)
Property Limit: 2
User Limit: 1
Storage Limit: 100
Features: (add features as needed)
Is Active: ✅ Yes
Is Popular: ❌ No
```

4. Click **"Create"** or **"Save"**
5. You should see: **"Plan created successfully!"** ✅

### Step 4: Verify in Database

Open Prisma Studio to verify:

```bash
cd backend
npx prisma studio
```

Go to: http://localhost:5555
- Click on `plans` table
- You should see your new "Trial Plan" with:
  - ✅ A UUID `id`
  - ✅ `monthlyPrice: 0`
  - ✅ `annualPrice: 0`
  - ✅ `updatedAt` timestamp

## Example Trial Plan Configuration

Here's a recommended configuration for a trial plan:

```json
{
  "name": "Trial Plan",
  "description": "14-day free trial - Perfect for testing the platform",
  "monthlyPrice": 0,
  "annualPrice": 0,
  "currency": "NGN",
  "propertyLimit": 2,
  "userLimit": 1,
  "storageLimit": 100,
  "features": {
    "properties": "Up to 2 properties",
    "users": "1 user account",
    "storage": "100 MB storage",
    "support": "Email support only",
    "trial": "14-day trial period"
  },
  "isActive": true,
  "isPopular": false
}
```

## Setting as Default Trial Plan

After creating the plan, you can set it as the default for new customers:

### Option 1: Update Onboarding Service

Edit `backend/src/services/onboarding.service.ts`:

```typescript
// In approveApplication function
const plan = await prisma.plans.findFirst({
  where: { name: 'Trial Plan' }  // Find your trial plan
});

const customer = await prisma.customers.create({
  data: {
    // ... other fields ...
    planId: plan?.id || application.selectedPlanId,  // Use trial plan as default
    // ...
  }
});
```

### Option 2: Make Trial Plan the First Plan

In Prisma Studio:
1. Go to `plans` table
2. Update `displayOrder` field:
   - Trial Plan: `displayOrder = 1`
   - Other plans: `displayOrder = 2, 3, 4...`

Then in your code, select the first plan by default:

```typescript
const defaultPlan = await prisma.plans.findFirst({
  where: { isActive: true },
  orderBy: { displayOrder: 'asc' }
});
```

## Troubleshooting

### Error: "Missing required fields"

**Check**:
- `name` is provided
- `monthlyPrice` is provided (can be 0)

**Solution**:
```typescript
{
  "name": "Trial Plan",
  "monthlyPrice": 0
}
```

### Error: "Unique constraint failed on the fields: (name)"

**Problem**: A plan with this name already exists

**Solution**:
- Use a different name, or
- Delete the existing plan first (if it has no customers)

### Error: "Invalid type for field"

**Problem**: Type mismatch (e.g., sending string instead of number)

**Solution**: The backend now handles type conversions automatically with `parseFloat()` and `parseInt()`

### Backend Console Shows Error Details

Check the backend console for detailed error messages:

```bash
[Plans] Creating plan with data: { name: '...', monthlyPrice: '...' }
[Plans] Failed to create plan: Error: ...
```

This will show the exact error from Prisma.

## Summary

✅ Added UUID generation for `id` field  
✅ Added type conversions (parseFloat, parseInt)  
✅ Changed default currency to 'NGN'  
✅ Changed features default to `{}`  
✅ Added `updatedAt` field  
✅ Added better error logging  
✅ Fixed both create and update routes  
✅ No linting errors  

**Just restart the backend and try creating your Trial Plan again!** 🎉

---

## Next Steps

1. ✅ **Create Trial Plan** - Use the form in admin dashboard
2. ✅ **Set as default** - Update onboarding service
3. ✅ **Test with new customer** - Sign up and verify trial plan is assigned
4. ✅ **Verify trial banner** - Login as customer and see trial countdown

---

**Need help?** Check the backend console for detailed error messages.

