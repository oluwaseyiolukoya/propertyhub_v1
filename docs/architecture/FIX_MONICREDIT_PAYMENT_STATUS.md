# Fix Monicredit Payment Status - Reference Mismatch

## Problem

Payment shows as "approved" in Monicredit dashboard but remains "pending" in tenant dashboard. This is a **reference mismatch** issue.

## Root Cause

**Reference Mismatch:**

1. We create payment with `providerReference: "PH-1765988015382-zo4n6r"` (our internal reference)
2. We send to Monicredit with `order_id: "PH-1765988015382-zo4n6r"`
3. Monicredit processes and generates `transaction_id: "ACX6942D6B058A39"` (different!)
4. Webhook receives `transaction_id: "ACX6942D6B058A39"` but tries to match `providerReference: "ACX6942D6B058A39"`
5. **Mismatch!** Payment has `providerReference: "PH-1765988015382-zo4n6r"` → Update fails silently
6. Verification also fails because it can't find payment by `transaction_id`

## Solution: Match by Both References

### 1. Store Transaction ID in Metadata

When Monicredit returns `transaction_id` in initialization response, store it in payment metadata:

```typescript
metadata: {
  monicreditTransactionId: "ACX6942D6B058A39",
  monicreditOrderId: "PH-1765988015382-zo4n6r",
}
```

### 2. Update Webhook to Match by Either Reference

Webhook now:

1. First tries to find payment by `order_id` (our reference)
2. If not found, tries to find by `transaction_id` (Monicredit's ID)
3. Updates payment status correctly
4. Updates `providerReference` to Monicredit's `transaction_id` for future lookups

### 3. Update Verification to Handle Both References

Verification endpoint now:

1. First tries to find by `providerReference` (our reference or Monicredit's ID)
2. If not found, searches metadata for `monicreditTransactionId`
3. Uses Monicredit's `transaction_id` for API verification call
4. Updates payment status correctly

## Changes Made

### Backend: `backend/src/routes/monicredit.ts`

**Webhook Handler:**

- ✅ Added logging to see what Monicredit sends
- ✅ Tries to match by `order_id` first (our reference)
- ✅ Falls back to matching by `transaction_id` in metadata
- ✅ Updates `providerReference` to Monicredit's `transaction_id` after webhook
- ✅ Stores both IDs in metadata for future lookups

### Backend: `backend/src/routes/payments.ts`

**Payment Initialization:**

- ✅ Stores Monicredit's `transaction_id` in metadata when received
- ✅ Keeps our `order_id` as `providerReference` initially

**Verification Endpoint:**

- ✅ Searches by both `providerReference` and `monicreditTransactionId` in metadata
- ✅ Uses Monicredit's `transaction_id` for API verification call
- ✅ Updates payment by ID (more reliable than updateMany)
- ✅ Stores verification results in metadata

## How It Works Now

### Payment Flow:

1. **Initialize Payment:**

   - Create payment: `providerReference: "PH-1765988015382-zo4n6r"`
   - Send to Monicredit: `order_id: "PH-1765988015382-zo4n6r"`
   - Monicredit returns: `transaction_id: "ACX6942D6B058A39"`
   - Store in metadata: `monicreditTransactionId: "ACX6942D6B058A39"`

2. **Webhook Received:**

   - Monicredit sends: `transaction_id: "ACX6942D6B058A39"`, `order_id: "PH-1765988015382-zo4n6r"`
   - Try to find by `order_id` → Found! ✅
   - Update payment status to "success"
   - Update `providerReference` to `transaction_id` for future lookups

3. **User Verification:**
   - User redirects with `transId: "ACX6942D6B058A39"`
   - Try to find by `providerReference` → Found! ✅ (webhook updated it)
   - Or find by `monicreditTransactionId` in metadata → Found! ✅
   - Verify with Monicredit API using `transaction_id`
   - Update payment status

## Testing

### Test Webhook:

1. **Check backend logs** when webhook is received:

   ```
   [Monicredit Payment Webhook] Received: { transactionId, orderId, status, customerId }
   ```

2. **Verify payment is found:**

   - Should see: "Payment found by order_id" or "Payment found by transaction_id"
   - Should NOT see: "Payment not found"

3. **Check database:**
   ```sql
   SELECT id, "providerReference", status, metadata
   FROM payments
   WHERE "providerReference" LIKE 'PH-%' OR metadata->>'monicreditTransactionId' IS NOT NULL
   ORDER BY "createdAt" DESC
   LIMIT 5;
   ```

### Test Verification:

1. **After payment redirect:**
   - Should find payment (not 404)
   - Should verify with Monicredit API
   - Should update status to "success"
   - Should show success toast

## Debugging

### Check Webhook Logs:

**In DigitalOcean → Backend App → Runtime Logs:**

Look for:

```
[Monicredit Payment Webhook] Received: { transactionId: "...", orderId: "...", status: "APPROVED", customerId: "..." }
```

### Check Payment Records:

**In PostgreSQL:**

```sql
-- Find recent Monicredit payments
SELECT
  id,
  "providerReference",
  status,
  amount,
  "createdAt",
  metadata->>'monicreditTransactionId' as transaction_id,
  metadata->>'monicreditOrderId' as order_id
FROM payments
WHERE provider = 'monicredit'
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Manual Webhook Test:

```bash
curl -X POST https://api.app.contrezz.com/api/monicredit/webhook/payment \
  -H "Content-Type: application/json" \
  -H "x-verify-token: YOUR_VERIFY_TOKEN" \
  -d '{
    "transaction_id": "ACX6942D6B058A39",
    "order_id": "PH-1765988015382-zo4n6r",
    "status": "APPROVED",
    "customerId": "CUSTOMER_ID",
    "amount": 10000
  }'
```

## Expected Behavior After Fix

1. ✅ Webhook matches payment by `order_id` or `transaction_id`
2. ✅ Payment status updates to "success" when webhook received
3. ✅ Verification finds payment by either reference
4. ✅ Payment shows as "success" in tenant dashboard
5. ✅ Payment history refreshes automatically

---

**Last Updated:** December 16, 2025  
**Status:** Monicredit reference mismatch fix

