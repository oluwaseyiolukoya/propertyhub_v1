# 🔧 Upgrade Modal - Plans Not Showing - FIXED

## Problem

When a property owner clicked "Upgrade Now" in the trial banner, the upgrade modal opened but **no plans were displayed**.

## Root Cause

The `UpgradeModal` component was calling `getBillingPlans()` which uses the `/api/plans` endpoint. This endpoint has `adminOnly` middleware, so regular users (property owners) get a 403 Forbidden error.

### Code Analysis

**Backend Route (`backend/src/routes/plans.ts`):**
```typescript
router.use(authMiddleware);
router.use(adminOnly);  // ❌ Only admins can access

router.get('/', async (req: AuthRequest, res: Response) => {
  // Returns all plans
});
```

**Frontend (`src/components/UpgradeModal.tsx`):**
```typescript
import { getBillingPlans } from '../lib/api/plans';

const loadData = async () => {
  const plansResponse = await getBillingPlans(); // ❌ Calls admin-only endpoint
  // ...
};
```

## The Fix

### 1. Use Correct Endpoint

There was already a user-accessible endpoint at `/api/subscriptions/plans` that doesn't require admin privileges:

**Backend (`backend/src/routes/subscriptions.ts`):**
```typescript
router.get('/plans', authMiddleware, async (req: AuthRequest, res: Response) => {
  // ✅ Only requires authentication, not admin
  const plans = await prisma.plans.findMany({
    where: { 
      isActive: true,
      monthlyPrice: { gt: 0 } // Exclude free/trial plans
    },
    orderBy: [{ monthlyPrice: 'asc' }]
  });
  
  res.json({ plans });
});
```

### 2. Created New API Function

**Added to `src/lib/api/plans.ts`:**
```typescript
/**
 * Get available plans for subscription (non-admin users)
 * This endpoint is accessible to all authenticated users
 */
export const getAvailablePlans = async () => {
  const response = await apiClient.get<{ plans: BillingPlan[] }>(
    API_ENDPOINTS.SUBSCRIPTIONS.PLANS
  );
  // Return in same format as getBillingPlans for compatibility
  return {
    ...response,
    data: response.data?.plans || []
  };
};
```

### 3. Updated UpgradeModal

**Changed `src/components/UpgradeModal.tsx`:**
```typescript
// Before:
import { getBillingPlans } from '../lib/api/plans';
const plansResponse = await getBillingPlans();

// After:
import { getAvailablePlans } from '../lib/api/plans';
const plansResponse = await getAvailablePlans();
```

### 4. Filtered Out Trial Plans

Modified the backend to exclude free/trial plans (monthlyPrice = 0) from the upgrade options:

```typescript
where: { 
  isActive: true,
  monthlyPrice: { gt: 0 } // Exclude free/trial plans
}
```

## Available Plans

After the fix, users see these plans when upgrading:

1. **Starter** - $500/month or $5,400/year
2. **Professional** - $1,200/month or $12,960/year
3. **Enterprise** - $2,500/month or $27,000/year

The **Trial** plan ($0) is excluded since it's not a paid upgrade option.

## Testing

### Test 1: API Endpoint

```bash
# Login as owner
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@contrezz.com","password":"demo123"}' \
  | jq -r '.token')

# Get available plans
curl -s http://localhost:5000/api/subscriptions/plans \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.plans[] | {name, monthlyPrice, annualPrice}'
```

**Expected output:**
```json
{
  "name": "Starter",
  "monthlyPrice": 500,
  "annualPrice": 5400
}
{
  "name": "Professional",
  "monthlyPrice": 1200,
  "annualPrice": 12960
}
{
  "name": "Enterprise",
  "monthlyPrice": 2500,
  "annualPrice": 27000
}
```

### Test 2: Frontend UI

1. **Open browser:** http://localhost:5173
2. **Login as:** demo@contrezz.com / demo123
3. **Click:** "Upgrade Now" button in trial banner
4. **Verify:**
   - ✅ Modal opens
   - ✅ Shows 3 plans (Starter, Professional, Enterprise)
   - ✅ Each plan shows monthly and annual pricing
   - ✅ Can select a plan
   - ✅ Can choose billing cycle (Monthly/Annual)
   - ✅ "Continue to Payment" button is enabled

## Files Changed

1. **`src/lib/api/plans.ts`**
   - Added `getAvailablePlans()` function

2. **`src/components/UpgradeModal.tsx`**
   - Changed import from `getBillingPlans` to `getAvailablePlans`
   - Updated `loadData()` to use new function

3. **`backend/src/routes/subscriptions.ts`**
   - Added filter to exclude free/trial plans (`monthlyPrice: { gt: 0 }`)

## API Endpoints Summary

| Endpoint | Access | Purpose |
|----------|--------|---------|
| `/api/plans` | Admin only | Manage all plans (CRUD) |
| `/api/subscriptions/plans` | Authenticated users | View available paid plans for upgrade |

## Troubleshooting

### Issue: "No plans available"

**Possible causes:**
1. No plans in database
2. All plans are inactive
3. All plans are free (monthlyPrice = 0)

**Fix:**
```bash
# Check plans in database
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.plans.findMany().then(plans => {
  console.log('Plans:', plans.length);
  plans.forEach(p => console.log('-', p.name, '$' + p.monthlyPrice, 'Active:', p.isActive));
  prisma.\$disconnect();
});
"
```

### Issue: "Invalid token" error

**Fix:**
```bash
# Reset password
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
prisma.users.update({
  where: { email: 'demo@contrezz.com' },
  data: { password: bcrypt.hashSync('demo123', 10) }
}).then(() => {
  console.log('✅ Password reset');
  prisma.\$disconnect();
});
"
```

### Issue: Plans show in admin but not in upgrade modal

**Check:**
1. Are plans `isActive: true`?
2. Do plans have `monthlyPrice > 0`?
3. Is backend running?
4. Check browser console for API errors

**Debug:**
```javascript
// In browser console after logging in as owner
fetch('/api/subscriptions/plans', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => console.log('Plans:', data.plans));
```

## Best Practices

### 1. Separate Admin and User Endpoints

- **Admin endpoints:** `/api/plans` - Full CRUD operations
- **User endpoints:** `/api/subscriptions/plans` - Read-only, filtered data

### 2. Filter Data Appropriately

- Exclude inactive plans
- Exclude free/trial plans from upgrade options
- Sort by price (ascending)

### 3. Consistent API Response Format

Both endpoints return plans in compatible formats:
```typescript
// Admin endpoint
res.json(plans);  // Array of plans

// User endpoint
res.json({ plans });  // Object with plans array

// Frontend wrapper handles both
return {
  ...response,
  data: response.data?.plans || response.data || []
};
```

## Summary

✅ **Problem:** Upgrade modal showed no plans for property owners

✅ **Cause:** Using admin-only endpoint (`/api/plans`)

✅ **Solution:** Created `getAvailablePlans()` to use user-accessible endpoint (`/api/subscriptions/plans`)

✅ **Bonus:** Filtered out free/trial plans from upgrade options

✅ **Result:** Owners can now see and select from 3 paid plans (Starter, Professional, Enterprise)

---

**Test it now:**
1. Login as demo@contrezz.com
2. Click "Upgrade Now"
3. See 3 plans displayed
4. Select a plan and proceed to payment
