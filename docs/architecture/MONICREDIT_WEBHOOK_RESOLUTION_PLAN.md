# Monicredit Webhook Resolution Plan - Systematic Approach

## Executive Summary

**Problem:** Payment status remains "pending" after webhook is configured and test webhook returns success.

**Root Cause Analysis:** Multiple potential failure points identified:

1. Status value format mismatch (case sensitivity)
2. Payment lookup failure (reference mismatch)
3. Database update not occurring
4. Frontend not refreshing

**Solution Applied:** Comprehensive fixes with enhanced logging and diagnostic tools.

## Systematic Investigation Completed

### ✅ Phase 1: Endpoint Verification

- **Status:** COMPLETE
- **Result:** Webhook endpoint is accessible at `/api/monicredit/webhook/payment`
- **Evidence:** Diagnostic script confirms HTTP 200 responses

### ✅ Phase 2: Code Enhancements

- **Status:** COMPLETE
- **Changes:**
  1. Added status normalization (handles case variations)
  2. Enhanced field extraction (multiple field name variations)
  3. Added comprehensive logging throughout handler
  4. Improved payment lookup (works with or without customerId)

### ✅ Phase 3: Diagnostic Tools Created

- **Status:** COMPLETE
- **Tools:**
  1. `backend/scripts/diagnose-monicredit-webhook.sh` - Automated diagnostic
  2. `backend/scripts/check-payment-status.sql` - Database verification queries
  3. `backend/scripts/test-monicredit-webhook.sh` - Manual webhook testing

## Current State Analysis

### What We Know:

1. ✅ Webhook endpoint is accessible
2. ✅ Test webhook returns success (HTTP 200)
3. ✅ Code handles multiple status formats
4. ✅ Code handles missing customerId
5. ❓ **Unknown:** Is payment actually being found and updated?

### What We Need to Verify:

#### Critical Check 1: Backend Logs

**Action Required:** Check backend terminal logs when webhook is received

**Look for:**

```
[Monicredit Payment Webhook] Request received: { ... }
[Monicredit Payment Webhook] Extracted data: { transactionId, orderId, status, normalizedStatus, ... }
[Monicredit Payment Webhook] Found payment, updating status: { ... }
[Monicredit Payment Webhook] Payment updated successfully: { ... }
```

**OR if payment not found:**

```
[Monicredit Payment Webhook] Payment not found: { transactionId, orderId, customerId }
```

#### Critical Check 2: Database Status

**Action Required:** Run SQL query to check payment status

```sql
SELECT
  id,
  status,
  "providerReference",
  "paidAt",
  "updatedAt",
  metadata->>'monicreditTransactionId' as transaction_id,
  metadata->>'webhookReceivedAt' as webhook_time
FROM payments
WHERE "providerReference" = 'PH-1765989259432-nzgcko'
   OR metadata->>'monicreditTransactionId' = 'ACX6942DB8C6794A';
```

**Expected Results:**

- If webhook worked: `status = 'success'`, `paidAt` has timestamp, `webhook_time` has timestamp
- If webhook didn't work: `status = 'pending'`, `paidAt = NULL`, `webhook_time = NULL`

#### Critical Check 3: Actual Monicredit Webhook

**Action Required:** Verify Monicredit is actually calling the webhook

**Steps:**

1. Check Monicredit dashboard for webhook delivery status
2. Look for webhook delivery logs/events
3. Verify webhook URL is correctly configured: `http://localhost:5000/api/monicredit/webhook/payment`
4. **Note:** For local testing, Monicredit may not be able to reach `localhost`. Consider using ngrok or testing in production.

## Resolution Steps (In Order)

### Step 1: Restart Backend

```bash
cd backend
# Stop current backend (Ctrl+C)
npm run dev
```

**Why:** Apply all code changes including status normalization and enhanced logging.

### Step 2: Run Diagnostic Script

```bash
cd backend
bash scripts/diagnose-monicredit-webhook.sh
```

**What it does:**

- Tests backend accessibility
- Tests webhook endpoint
- Sends test webhook payloads
- Provides SQL queries to check database

### Step 3: Check Backend Logs

**While diagnostic script runs, watch backend terminal for:**

- `[Monicredit Payment Webhook] Request received`
- `[Monicredit Payment Webhook] Extracted data`
- `[Monicredit Payment Webhook] Found payment` OR `Payment not found`

**Key Information to Note:**

- What `order_id` value is extracted?
- What `transaction_id` value is extracted?
- What `status` value is extracted?
- What `normalizedStatus` value is calculated?
- Is payment found or not?

### Step 4: Verify Database

**Run SQL query from diagnostic script output:**

```sql
SELECT id, status, "providerReference", "paidAt", "updatedAt",
       metadata->>'monicreditTransactionId' as transaction_id
FROM payments
WHERE "providerReference" = 'PH-1765989259432-nzgcko';
```

**Interpretation:**

- If `status = 'success'` → Webhook is working! ✅
- If `status = 'pending'` → Webhook is not updating payment ❌

### Step 5: Identify Root Cause

**If logs show "Payment not found":**

- **Issue:** Reference mismatch
- **Check:** Compare `order_id` in logs vs `providerReference` in database
- **Check:** Compare `transaction_id` in logs vs `metadata.monicreditTransactionId` in database
- **Check:** Compare `customerId` in logs vs payment's `customerId` in database

**If logs show "Found payment" but status still pending:**

- **Issue:** Status value not recognized
- **Check:** What `status` value is in logs?
- **Check:** What `normalizedStatus` value is in logs?
- **Solution:** May need to add more status value variations to handler

**If logs show "Payment updated successfully" but status still pending:**

- **Issue:** Frontend not refreshing
- **Check:** Refresh page manually
- **Check:** Check browser console for socket connection
- **Check:** Verify socket events are being received

### Step 6: Test with Real Monicredit Webhook

**Important:** The test script uses simulated payloads. Real Monicredit webhook may have different format.

**Steps:**

1. Make a real payment through Monicredit
2. Watch backend logs when webhook is received
3. Compare real webhook payload with test payload
4. Adjust handler if payload format differs

**Note:** For local testing, Monicredit cannot reach `localhost:5000`. Options:

- Use ngrok to expose localhost: `ngrok http 5000`
- Test in production environment
- Use Monicredit's webhook testing tool (if available)

## Code Changes Summary

### 1. Status Normalization

**File:** `backend/src/routes/monicredit.ts`

**Change:**

```typescript
// Normalize status to uppercase for comparison
const normalizedStatus = status ? String(status).toUpperCase() : null;

// Check both normalized and original status
if (
  normalizedStatus === "APPROVED" ||
  normalizedStatus === "SUCCESS" ||
  status === "APPROVED" ||
  status === "SUCCESS"
) {
  // Update payment
}
```

**Why:** Monicredit may send status as "approved" (lowercase) instead of "APPROVED".

### 2. Enhanced Field Extraction

**File:** `backend/src/routes/monicredit.ts`

**Change:** Tries multiple field name variations:

- `transaction_id`, `transid`, `transId`, `transactionId`, `id`
- `order_id`, `orderid`, `orderId`, `order_number`, `reference`
- `status`, `data.status`, `payment_status`, `transaction_status`, `transactionStatus`, `paymentStatus`
- `customerId`, `customer_id`, `metadata.customerId`, `merchant_id`, `merchantId`

**Why:** Monicredit API may use different field names than documented.

### 3. Payment Lookup Without customerId

**File:** `backend/src/routes/monicredit.ts`

**Change:** If `customerId` is missing, searches for payment by `order_id` or `transaction_id` across all customers.

**Why:** Monicredit may not always send `customerId` in webhook payload.

### 4. Comprehensive Logging

**File:** `backend/src/routes/monicredit.ts`

**Change:** Added logging at every step:

- Request received (headers, body)
- Extracted data (all fields)
- Payment lookup results
- Database update confirmation
- Processing completion

**Why:** Enable systematic debugging of webhook processing.

## Expected Behavior After Fixes

### Successful Webhook Flow:

1. **Monicredit sends webhook** → Backend receives POST to `/api/monicredit/webhook/payment`
2. **Backend logs:** `[Monicredit Payment Webhook] Request received`
3. **Backend extracts:** `transaction_id`, `order_id`, `status`, `customerId`
4. **Backend normalizes:** `status` → `normalizedStatus` (uppercase)
5. **Backend finds payment:** By `order_id` or `transaction_id`
6. **Backend logs:** `[Monicredit Payment Webhook] Found payment, updating status`
7. **Backend updates:** `status = "success"`, `paidAt = NOW()`
8. **Backend logs:** `[Monicredit Payment Webhook] Payment updated successfully`
9. **Backend emits:** Socket event `payment:updated`
10. **Frontend receives:** Socket event → UI updates to show "success"

### Failure Scenarios:

**Scenario A: Payment Not Found**

- **Log:** `[Monicredit Payment Webhook] Payment not found`
- **Cause:** Reference mismatch
- **Fix:** Verify `order_id`/`transaction_id` match database values

**Scenario B: Status Not Recognized**

- **Log:** Webhook received but no "Found payment" log
- **Cause:** Status value not "APPROVED" or "SUCCESS"
- **Fix:** Check logs for actual status value, add to handler if needed

**Scenario C: Database Update Fails**

- **Log:** "Found payment" but no "updated successfully"
- **Cause:** Prisma update error
- **Fix:** Check backend logs for Prisma errors

## Next Actions (Priority Order)

### 🔴 HIGH PRIORITY

1. **Restart backend** to apply all code changes
2. **Run diagnostic script** to get baseline status
3. **Check backend logs** when webhook is received
4. **Verify database** status after webhook

### 🟡 MEDIUM PRIORITY

5. **Compare test payload vs real Monicredit payload** (if different)
6. **Test with actual Monicredit webhook** (not just test script)
7. **Verify frontend socket connection** if database shows success but UI doesn't

### 🟢 LOW PRIORITY

8. **Set up ngrok** for local webhook testing (if needed)
9. **Document Monicredit webhook payload format** for future reference
10. **Add webhook retry mechanism** if Monicredit supports it

## Success Criteria

✅ **Webhook is working correctly when:**

1. Backend logs show "Payment updated successfully"
2. Database shows `status = 'success'` and `paidAt` has timestamp
3. Frontend UI shows payment as "success" (after refresh or socket event)
4. No errors in backend logs

❌ **Webhook is NOT working when:**

1. Backend logs show "Payment not found"
2. Database shows `status = 'pending'` after webhook
3. Frontend UI shows "pending" even after database update
4. Errors in backend logs

---

**Last Updated:** December 17, 2025  
**Status:** Systematic investigation complete, fixes applied, diagnostic tools ready  
**Next Step:** Run diagnostic script and check backend logs
