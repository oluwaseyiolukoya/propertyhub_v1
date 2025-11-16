# Trial Banner Not Showing - Root Cause & Fix

## Issue
New customers (e.g., `localowner2@gmail.com`) who registered through the onboarding process could not see the trial progress banner, trial countdown, or upgrade button in their dashboard.

## Root Cause

### The Bug
In `backend/src/services/onboarding.service.ts`, the `activateApplication` function (line 427) was **incorrectly setting customer status to `'active'`** when the admin activated their account:

```typescript
// BEFORE (INCORRECT):
await prisma.customers.update({
  where: { id: application.customerId },
  data: {
    status: 'active',  // ❌ This was wrong!
  },
});
```

### Why This Broke the Trial Banner
The `TrialStatusBanner` component (`src/components/TrialStatusBanner.tsx` line 43) explicitly returns `null` (doesn't render) when the customer status is `'active'`:

```typescript
// Don't show banner for active subscriptions
if (status.status === 'active') {
  return null;
}
```

### The Onboarding Flow
1. **Application Submitted** → Status: `pending`
2. **Admin Approves** → Creates customer with `status: 'trial'` ✅ (Correct)
3. **Admin Activates** → Changes customer to `status: 'active'` ❌ (WRONG!)
4. **Customer Logs In** → Trial banner doesn't show because status is `'active'`

## The Fix

### 1. Backend Code Fix
Updated `backend/src/services/onboarding.service.ts` (lines 423-433):

```typescript
// AFTER (CORRECT):
// Update customer - keep them in trial status
// Note: Customer status should remain 'trial' until they upgrade to a paid plan
// The user status is set to 'active' to allow login
await prisma.customers.update({
  where: { id: application.customerId },
  data: {
    // Don't change status - it should remain 'trial' from approval
    // status: 'active', // REMOVED - this was causing trial banner to not show
    updatedAt: new Date(),
  },
});
```

**Key Insight**: 
- **Customer status** = Subscription/billing status (`trial`, `active`, `suspended`, etc.)
- **User status** = Account access status (`active`, `pending`, `inactive`)
- These are **separate concepts**! A customer can be on `trial` while their user is `active` (can login)

### 2. Database Fix
Fixed existing affected customers:

```sql
UPDATE customers 
SET status = 'trial', updatedAt = NOW()
WHERE status = 'active' 
  AND trialStartsAt IS NOT NULL 
  AND trialEndsAt IS NOT NULL 
  AND planId IS NULL;
```

Specifically fixed: `localowner2@gmail.com`

## Expected Behavior After Fix

### For New Customers:
1. Admin approves application → Customer created with `status: 'trial'` ✅
2. Admin activates application → Customer remains `status: 'trial'` ✅
3. User created with `status: 'active'` (can login) ✅
4. Customer logs in → Sees trial banner with countdown ✅
5. Customer upgrades → Status changes to `'active'` ✅
6. Trial banner disappears ✅

### For Existing Customers:
- `localowner2@gmail.com` status updated from `'active'` → `'trial'`
- They will now see the trial banner on next login/refresh

## Testing Checklist

- [x] Fixed backend code in `onboarding.service.ts`
- [x] Updated existing customer `localowner2@gmail.com` to `trial` status
- [ ] User refreshes dashboard and sees trial banner
- [ ] Trial countdown shows in header
- [ ] "Upgrade Now" button is visible
- [ ] Progress bar shows correct days remaining (30 days for this customer)
- [ ] After upgrade, banner disappears

## Verification Steps

### Step 1: Check Customer Status
```bash
cd backend && npx ts-node -e "
import prisma from './src/lib/db';
(async () => {
  const customer = await prisma.customers.findFirst({
    where: { users: { some: { email: 'localowner2@gmail.com' } } },
    select: { email: true, status: true, trialStartsAt: true, trialEndsAt: true }
  });
  console.log(customer);
  await prisma.\$disconnect();
})();
"
```

Expected output:
```json
{
  "email": "localowner2@gmail.com",
  "status": "trial",  // ✅ Should be 'trial'
  "trialStartsAt": "2025-11-09T14:00:16.662Z",
  "trialEndsAt": "2025-12-09T14:00:16.662Z"
}
```

### Step 2: Test in Browser
1. Login as `localowner2@gmail.com`
2. Hard refresh (Cmd+Shift+R)
3. Check browser console for:
   ```
   [TrialStatusBanner] Loading status...
   [Subscription API] Status: { status: 'trial', daysRemaining: 30, ... }
   ```
4. Verify trial banner is visible at top of dashboard

### Step 3: Test New Onboarding
1. Submit a new application
2. Admin approves → Check customer status is `'trial'`
3. Admin activates → Check customer status is **still** `'trial'`
4. Login as new customer → Verify trial banner shows

## Related Files

- `backend/src/services/onboarding.service.ts` - Fixed activation logic
- `src/components/TrialStatusBanner.tsx` - Banner component (no changes needed)
- `src/components/TrialCountdown.tsx` - Header countdown (no changes needed)
- `src/components/PropertyOwnerDashboard.tsx` - Renders trial banner
- `src/components/PropertyManagerDashboard.tsx` - Renders trial banner

## Lessons Learned

1. **Separate User and Customer Status**: User status controls login access, customer status controls subscription/billing state
2. **Trial is a Subscription State**: Customers should remain in `'trial'` status until they upgrade to a paid plan
3. **Activation ≠ Active Subscription**: Activating an account (allowing login) doesn't mean they have an active paid subscription
4. **Test the Full Flow**: Always test from application submission → approval → activation → login to catch these issues

## Prevention

To prevent this in the future:
1. Add a comment in the activation function explaining why we don't change customer status
2. Add a test case that verifies customer status remains `'trial'` after activation
3. Document the difference between user status and customer status in the architecture docs

