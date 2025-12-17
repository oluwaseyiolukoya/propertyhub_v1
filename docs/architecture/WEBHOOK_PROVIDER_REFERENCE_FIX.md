# Fix: Webhook Changing providerReference Breaks Frontend Queries

## Problem Identified

**Root Cause:** The webhook handler was updating `providerReference` from the original `order_id` (e.g., `PH-1765989259432-nzgcko`) to Monicredit's `transaction_id` (e.g., `ACX6942DB8C6794A`). This broke frontend queries because:

1. Frontend queries payment by original `order_id`: `PH-1765989259432-nzgcko`
2. Webhook updates `providerReference` to: `ACX6942DB8C6794A`
3. Frontend can't find payment by original reference → Shows "pending"

## Evidence from Logs

**Backend logs show:**

```
[Monicredit Payment Webhook] Found payment, updating status: {
  paymentId: 'c08c71c0-8369-41b5-93b7-9c1f497aeb14',
  currentStatus: 'success',
  orderId: 'PH-1765989259432-nzgcko',
  transactionId: 'ACX6942DB8C6794A',
  ...
}
[Monicredit Payment Webhook] Payment updated successfully: {
  paymentId: 'c08c71c0-8369-41b5-93b7-9c1f497aeb14',
  newStatus: 'success',
  paidAt: 2025-12-17T17:42:38.119Z,
  providerReference: 'ACX6942DB8C6794A'  ← CHANGED from PH-...
}
```

**The webhook IS working** (payment updated to success), but `providerReference` was changed, breaking frontend queries.

## Solution Applied

### Changed Behavior:

- **Before:** Webhook updated `providerReference` to `transaction_id`
- **After:** Webhook KEEPS original `providerReference` (order_id)

### Why This Works:

1. **Frontend compatibility:** Frontend can still query by original `order_id` (`PH-...`)
2. **Webhook matching:** Transaction ID stored in `metadata.monicreditTransactionId` for webhook matching
3. **Best of both worlds:** Original reference preserved, transaction ID available in metadata

### Code Changes:

**File:** `backend/src/routes/monicredit.ts`

**Removed:**

```typescript
// Also update providerReference if we have transactionId and it's different
if (transactionId && payment.providerReference !== transactionId) {
  await prisma.payments.update({
    where: { id: payment.id },
    data: {
      providerReference: transactionId, // ❌ This broke frontend queries
    },
  });
}
```

**Replaced with:**

```typescript
// Keep original providerReference (order_id) for frontend compatibility
// Transaction ID is already stored in metadata for webhook matching
// This ensures frontend can still query by original order_id
console.log(
  "[Monicredit Payment Webhook] Keeping original providerReference:",
  payment.providerReference
);
// Don't update providerReference - keep original order_id
// Transaction ID is already in metadata for future webhook matching
```

## Verification

### How to Verify Fix:

1. **Restart backend** to apply changes
2. **Make a new payment** through Monicredit
3. **Check database** after webhook:
   ```sql
   SELECT
     "providerReference",
     status,
     metadata->>'monicreditTransactionId' as transaction_id
   FROM payments
   WHERE "providerReference" = 'PH-1765989259432-nzgcko';
   ```

**Expected Result:**

- `providerReference` = `PH-1765989259432-nzgcko` (original, NOT changed)
- `status` = `'success'` (updated by webhook)
- `transaction_id` = `ACX6942DB8C6794A` (stored in metadata)

4. **Frontend should now:**
   - Query by `PH-1765989259432-nzgcko` → Finds payment ✅
   - Shows status as "success" ✅

## Why This Approach is Better

### ✅ Advantages:

1. **Frontend compatibility:** No changes needed to frontend code
2. **Webhook matching:** Still works via `metadata.monicreditTransactionId`
3. **Backward compatible:** Existing payments still work
4. **Clear separation:** `providerReference` = our reference, `metadata.monicreditTransactionId` = Monicredit's reference

### ❌ Previous Approach Problems:

1. **Broke frontend queries:** Frontend couldn't find payment by original reference
2. **Inconsistent:** `providerReference` changed after webhook, breaking expectations
3. **Required frontend changes:** Would need to update frontend to query by transaction_id

## Testing

### Test 1: Webhook Updates Status

```bash
# Run test webhook
bash backend/scripts/test-monicredit-webhook.sh

# Check database
SELECT "providerReference", status FROM payments
WHERE "providerReference" = 'PH-1765989259432-nzgcko';
```

**Expected:**

- `providerReference` = `PH-1765989259432-nzgcko` (unchanged)
- `status` = `'success'` (updated)

### Test 2: Frontend Can Query Payment

```bash
# Frontend queries by original order_id
GET /api/payments/verify/PH-1765989259432-nzgcko
```

**Expected:**

- Returns payment with `status: "success"`
- No 404 error

### Test 3: Webhook Still Matches by Transaction ID

```bash
# Webhook with transaction_id but no order_id
curl -X POST http://localhost:5000/api/monicredit/webhook/payment \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "ACX6942DB8C6794A",
    "status": "APPROVED"
  }'
```

**Expected:**

- Webhook finds payment by `metadata.monicreditTransactionId`
- Updates payment status
- Keeps original `providerReference`

---

**Last Updated:** December 17, 2025  
**Status:** Fix applied - Webhook now preserves original providerReference  
**Impact:** Frontend queries will now work correctly after webhook updates
