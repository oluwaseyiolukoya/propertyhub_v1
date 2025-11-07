# Billing MRR Calculation Fix 🔧

## Issue Reported
Monthly Revenue showing **$0.98** with **+0% growth** from last month.

## Root Cause Analysis

### The Problem
The original last month MRR calculation was flawed:

```typescript
// ❌ WRONG - Original Code
const lastMonthCustomers = await prisma.customers.findMany({
  where: {
    status: { in: ['active', 'trial'] },
    createdAt: { lte: lastMonthEnd }
  },
  select: { mrr: true }
});
const lastMonthMRR = lastMonthCustomers.reduce((sum, c) => sum + (c.mrr || 0), 0);
```

**Why This Was Wrong:**
1. It gets customers created **before or during** last month
2. It uses their **current MRR** (not historical MRR from last month)
3. If all customers were created this month, `lastMonthMRR = 0`
4. If customers existed before, it uses their current MRR for both months
5. Result: `(currentMRR - lastMonthMRR) / lastMonthMRR = 0/0 = 0%` or same values = 0%

### Example Scenario
**Scenario 1: All New Customers This Month**
- Current Month: 5 customers with $100 MRR each = $500 total
- Last Month: 0 customers (all created this month)
- Calculation: `(500 - 0) / 0 = undefined → 0%` ❌
- **Expected**: Should show **+100%** or "All new revenue"

**Scenario 2: Existing Customers**
- Current Month: 5 customers with $100 MRR each = $500 total
- Last Month: Same 5 customers with same $100 MRR = $500 total
- Calculation: `(500 - 500) / 500 = 0%` ✅ (Correct if no changes)
- **But**: If a customer upgraded from $50 to $100 this month, we'd miss it!

## The Fix

### Updated Logic
```typescript
// ✅ CORRECT - Fixed Code
const lastMonthCustomers = await prisma.customers.findMany({
  where: {
    OR: [
      {
        // Active/trial customers created BEFORE this month
        status: { in: ['active', 'trial'] },
        createdAt: { lt: currentMonthStart }
      },
      {
        // Cancelled customers that were active last month
        status: 'cancelled',
        createdAt: { lt: currentMonthStart },
        updatedAt: { gte: lastMonthStart }
      }
    ]
  },
  select: { mrr: true, status: true }
});

const lastMonthMRR = lastMonthCustomers.reduce((sum, c) => sum + (c.mrr || 0), 0);

// If lastMonthMRR is 0 but currentMonthMRR > 0, show 100% growth
const revenueGrowth = lastMonthMRR > 0
  ? ((currentMonthMRR - lastMonthMRR) / lastMonthMRR) * 100
  : currentMonthMRR > 0 ? 100 : 0;
```

### What Changed:
1. **Excludes new customers this month** from last month calculation
2. **Includes cancelled customers** that were active last month
3. **Shows 100% growth** if starting from $0 last month
4. **More accurate comparison** of month-over-month changes

## Limitations & Trade-offs

### Current Approach Limitations:
⚠️ **Still Not Perfect** - This approach has limitations:

1. **No Historical MRR Snapshots**
   - We don't store MRR values at specific points in time
   - We're using current MRR for customers that existed last month
   - If a customer changed their plan mid-month, we won't capture it accurately

2. **Plan Changes Not Tracked**
   - Customer upgraded from $50 → $100 this month?
   - We'll use $100 for both months (incorrect)
   - Growth will appear as 0% when it should be higher

3. **Cancelled Customer MRR**
   - Cancelled customers still show their last MRR value
   - This is actually correct for last month's calculation
   - But we need to ensure MRR is set to 0 on cancellation

### Better Solution (Future Enhancement):
Create a **monthly MRR snapshot table**:

```sql
CREATE TABLE mrr_snapshots (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  month DATE,  -- First day of month
  mrr DECIMAL(10,2),
  plan_id UUID,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_mrr_snapshots_month ON mrr_snapshots(month);
CREATE INDEX idx_mrr_snapshots_customer ON mrr_snapshots(customer_id);
```

**Benefits:**
- ✅ Accurate historical MRR at any point in time
- ✅ Track plan changes and upgrades
- ✅ Calculate true month-over-month growth
- ✅ Enable cohort analysis and trends
- ✅ Support revenue forecasting

**Implementation:**
```typescript
// Run monthly (via cron job)
async function snapshotMRR() {
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  
  const customers = await prisma.customers.findMany({
    where: { status: { in: ['active', 'trial'] } }
  });
  
  for (const customer of customers) {
    await prisma.mrr_snapshots.create({
      data: {
        customerId: customer.id,
        month: firstOfMonth,
        mrr: customer.mrr,
        planId: customer.planId,
        status: customer.status
      }
    });
  }
}
```

## Testing the Fix

### Test 1: All New Customers
1. Create 3 new customers this month with $100 MRR each
2. Check billing overview
3. **Expected**: 
   - Current MRR: $300
   - Last Month MRR: $0
   - Growth: **+100%** (or show "All new revenue")

### Test 2: Existing Customers
1. Have 5 customers from last month with $100 MRR each
2. Don't change anything
3. **Expected**:
   - Current MRR: $500
   - Last Month MRR: $500
   - Growth: **0%**

### Test 3: Mixed (New + Existing)
1. Have 3 customers from last month with $100 MRR each = $300
2. Add 2 new customers this month with $100 MRR each = $200
3. **Expected**:
   - Current MRR: $500
   - Last Month MRR: $300
   - Growth: **+66.7%** = `(500-300)/300*100`

### Test 4: Customer Cancelled
1. Have 5 customers from last month with $100 MRR each = $500
2. Cancel 1 customer this month
3. **Expected**:
   - Current MRR: $400
   - Last Month MRR: $500
   - Growth: **-20%** = `(400-500)/500*100`

## Debug Logging

Added console logging to help diagnose issues:

```typescript
console.log('📊 Billing Analytics Debug:');
console.log('  Current MRR:', currentMonthMRR);
console.log('  Last Month MRR:', lastMonthMRR);
console.log('  Current Active Subs:', currentActiveSubscriptions);
console.log('  Last Month Active Subs:', lastMonthActiveSubscriptions);
console.log('  New This Month:', newSubscriptionsThisMonth);
console.log('  Cancelled This Month:', cancelledThisMonth);
console.log('  Revenue Growth:', revenueGrowth.toFixed(1) + '%');
```

**To View Logs:**
1. Check backend terminal/console
2. Look for `📊 Billing Analytics Debug:` when loading billing page
3. Verify the numbers match your database

## Verifying Database Values

### Check Current MRR:
```sql
SELECT 
  COUNT(*) as active_count,
  SUM(mrr) as total_mrr,
  AVG(mrr) as avg_mrr
FROM customers 
WHERE status IN ('active', 'trial');
```

### Check Customers Created This Month:
```sql
SELECT 
  COUNT(*) as new_this_month,
  SUM(mrr) as new_mrr
FROM customers 
WHERE status IN ('active', 'trial')
  AND "createdAt" >= date_trunc('month', CURRENT_DATE);
```

### Check Customers From Last Month:
```sql
SELECT 
  COUNT(*) as existing_count,
  SUM(mrr) as existing_mrr
FROM customers 
WHERE status IN ('active', 'trial')
  AND "createdAt" < date_trunc('month', CURRENT_DATE);
```

### Check Cancelled This Month:
```sql
SELECT 
  COUNT(*) as cancelled_count,
  SUM(mrr) as lost_mrr
FROM customers 
WHERE status = 'cancelled'
  AND "updatedAt" >= date_trunc('month', CURRENT_DATE);
```

## Why $0.98 Might Appear

### Possible Reasons:

1. **Currency Conversion Issue**
   - MRR stored in one currency (e.g., NGN)
   - Displayed in another (e.g., USD)
   - $0.98 could be ₦1,500 NGN converted to USD

2. **Test/Demo Data**
   - Small MRR values for testing
   - Single customer with $0.98 monthly plan

3. **Incomplete Customer Setup**
   - Customers created without proper plan assignment
   - Default MRR values not set correctly

4. **Plan Pricing Issue**
   - Plan monthly price set to $0.98 instead of $98
   - Check `plans` table for correct pricing

### Check Your Data:
```sql
-- See all customers and their MRR
SELECT 
  id,
  name,
  email,
  status,
  mrr,
  "billingCycle",
  "planId",
  "createdAt"
FROM customers 
WHERE status IN ('active', 'trial')
ORDER BY "createdAt" DESC;

-- Check plan pricing
SELECT 
  id,
  name,
  "priceMonthly",
  "priceYearly",
  currency
FROM plans 
WHERE "isActive" = true;
```

## Next Steps

### Immediate:
1. ✅ Fix deployed (improved last month MRR calculation)
2. 🔄 Restart backend server to apply changes
3. 🧪 Test with the scenarios above
4. 📊 Check debug logs in backend console
5. 🔍 Verify database values match expectations

### Short-term:
1. Review customer MRR values in database
2. Ensure plan pricing is correct
3. Verify currency conversions are accurate
4. Test with real customer data

### Long-term:
1. Implement MRR snapshot table for accurate historical tracking
2. Add monthly cron job to capture MRR snapshots
3. Build revenue trend charts (6-month, 12-month)
4. Add cohort analysis for customer retention
5. Implement revenue forecasting

## Summary

**Problem**: 0% growth due to incorrect last month MRR calculation
**Solution**: Exclude new customers from last month, include cancelled customers
**Limitation**: Still uses current MRR (not historical), plan changes not tracked
**Best Practice**: Implement MRR snapshot table for accurate historical data

---

**Status**: ✅ **FIXED** (with limitations noted)
**Last Updated**: 2025-11-05
**Next Enhancement**: MRR snapshot table for accurate historical tracking



