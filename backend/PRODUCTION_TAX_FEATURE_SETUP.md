# Production Tax Calculator Feature Setup

## Problem
The Tax Calculator module is not visible in production because the `tax_calculator` feature hasn't been added to the user's plan.

## Solution

### Step 1: Run the Script to Add Feature to Plans

In your production environment, run:

```bash
cd backend
npx tsx scripts/add-tax-feature-to-all-plans.ts
```

This script will:
- Add `tax_calculator` feature to Professional, Business, and Enterprise plans
- Verify the feature was added correctly
- Show which plans now have the feature

### Step 2: Verify User's Plan

The Tax Calculator is only available for:
- ✅ Professional plan
- ✅ Business plan  
- ✅ Enterprise plan
- ❌ Starter plan (not included)

### Step 3: Check User's Current Plan

You can check a user's plan in the database:

```sql
SELECT 
  c.email,
  p.name as plan_name,
  p.features
FROM customers c
LEFT JOIN plans p ON c."planId" = p.id
WHERE c.email = 'user@example.com';
```

### Step 4: Alternative - Manual Database Update

If you need to manually add the feature to a specific plan:

```sql
-- Update Enterprise plan
UPDATE plans
SET features = array_append(
  array_append(features, 'Tax Calculator'),
  'tax_calculator'
)
WHERE name = 'Enterprise' AND category = 'property_management'
AND NOT (features::text LIKE '%tax_calculator%' OR features::text LIKE '%Tax Calculator%');
```

### Step 5: Refresh Frontend

After updating plans:
1. Users should refresh their browser
2. The Tax Calculator should appear in the sidebar navigation
3. If it doesn't appear, check:
   - User's plan is Professional, Business, or Enterprise
   - Browser cache is cleared
   - Account info is refreshed (may need to log out and back in)

## Troubleshooting

### Tax Calculator still not visible?

1. **Check plan features:**
   ```bash
   cd backend
   npx tsx scripts/check-tax-feature.ts
   ```

2. **Verify user's plan:**
   - Check in Settings > Subscription
   - Or query database directly

3. **Check frontend console:**
   - Open browser DevTools
   - Check for errors
   - Verify `accountInfo.customer.plan.features` includes `tax_calculator`

4. **Force refresh account info:**
   - Log out and log back in
   - Or clear browser cache and reload

## Notes

- The feature check happens in `PropertyOwnerDashboard.tsx` via `hasTaxCalculatorFeature()`
- The backend API also checks for the feature via `requireFeature('tax_calculator')` middleware
- Both must pass for the Tax Calculator to be accessible

