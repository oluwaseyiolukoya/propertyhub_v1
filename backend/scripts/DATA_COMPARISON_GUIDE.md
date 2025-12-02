# Data Comparison Guide

This guide helps you compare data between local and production environments.

## Quick Start

### Run Locally
```bash
cd backend
npx tsx scripts/compare-data.ts
```

### Run in Production (DigitalOcean Console)
```bash
cd /workspace/backend
npx tsx scripts/compare-data.ts
```

## What This Script Shows

### 1. Record Counts
- Properties, Units, Payments, Expenses, Leases, Users, Customers

### 2. Payment Analysis
- Breakdown by status (success, pending, failed)
- Breakdown by type (rent, deposit, subscription, etc.)
- Last 10 recent payments with details

### 3. Expense Analysis
- Breakdown by status (paid, pending)
- Breakdown by category (maintenance, utilities, etc.)
- Last 10 recent expenses with details

### 4. Monthly Revenue Trend
- Revenue, Expenses, and Net Income for last 12 months
- This matches what the Financial Reports chart shows

### 5. Data Quality Checks
- Payments without property
- Expenses without property
- Success payments without paidAt date
- Units without property

## Common Issues & Solutions

### Issue: Chart shows only expenses, no revenue

**Diagnosis:**
Run the script and check the "MONTHLY REVENUE DATA" section. If revenue is 0 but expenses exist, it means:

1. **No payments recorded** - Add rental payments in the Payment Management page
2. **All payments are subscriptions** - Subscription payments are excluded from revenue charts
3. **Payments not marked as success** - Check payment status
4. **Payments don't have paidAt date** - Check data quality section

**Solution:**
```bash
# Check payment types
SELECT type, status, COUNT(*), SUM(amount) 
FROM payments 
GROUP BY type, status;

# Check if payments have paidAt
SELECT COUNT(*) FROM payments WHERE status = 'success' AND "paidAt" IS NULL;
```

### Issue: Different data between local and production

**Steps:**
1. Run script locally: `npx tsx scripts/compare-data.ts > local-data.txt`
2. Run script in production console: `npx tsx scripts/compare-data.ts > prod-data.txt`
3. Compare the two files side by side

## Expected Output Example

```
🔍 DATA COMPARISON REPORT
============================================================

📍 Environment: PRODUCTION
🔗 Database: contrezz-db-prod-do-user-18499071-0.d.db.ondigitalocean.com:25060

📊 RECORD COUNTS:
------------------------------------------------------------
Properties:  3
Units:       12
Payments:    5
Expenses:    2
Leases:      4
Users:       2
Customers:   1

💰 PAYMENT BREAKDOWN:
------------------------------------------------------------
Status: success
  Count: 5
  Total: 250000.00

By Type:
Type: rent
  Count: 4
  Total: 200000.00
Type: deposit
  Count: 1
  Total: 50000.00

📈 MONTHLY REVENUE DATA (Last 12 Months):
------------------------------------------------------------
Month       Revenue      Expenses     Net Income
------------------------------------------------------------
Jan            0.00         0.00           0.00
Feb            0.00         0.00           0.00
...
Dec       200000.00     20000.00      180000.00
------------------------------------------------------------
TOTAL     200000.00     20000.00      180000.00

✅ DATA QUALITY CHECKS:
------------------------------------------------------------
Payments without property: 0
Expenses without property: 0
Success payments without paidAt: 0
Units without property: 0

============================================================
✅ Data comparison complete!
```

## Troubleshooting

### Script fails with "Cannot find module"
```bash
cd backend
npm install
```

### Database connection error
- **Local:** Check if PostgreSQL is running: `brew services list`
- **Production:** Make sure you're in the DigitalOcean Console, not local terminal

### Permission denied
```bash
chmod +x scripts/compare-data.ts
```

## Quick Fixes

### Add test payment data (Local only)
```sql
-- Add a test payment
INSERT INTO payments (id, "customerId", "propertyId", amount, status, type, "paidAt", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'your-customer-id',
  'your-property-id',
  50000.00,
  'success',
  'rent',
  NOW(),
  NOW(),
  NOW()
);
```

### Add test expense data (Local only)
```sql
-- Add a test expense
INSERT INTO expenses (id, "propertyId", amount, category, description, date, status, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'your-property-id',
  10000.00,
  'maintenance',
  'Test maintenance expense',
  NOW(),
  'paid',
  NOW(),
  NOW()
);
```

## Support

If you see unexpected results:
1. Check the "DATA QUALITY CHECKS" section for issues
2. Compare local vs production output
3. Verify payment types and statuses
4. Ensure paidAt dates are set for successful payments

