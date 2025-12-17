# Systematic Investigation: Monicredit Webhook Payment Status Issue

## Problem Statement

Payment status remains "pending" after webhook is configured and test webhook returns success.

## Investigation Methodology

### Phase 1: Endpoint Verification ✅

**Objective:** Verify webhook endpoint is accessible and properly mounted

**Steps:**

1. ✅ Check webhook route is mounted in `backend/src/index.ts`
2. ✅ Test endpoint accessibility with curl
3. ✅ Verify route path: `/api/monicredit/webhook/payment`

**Result:** Endpoint is accessible and returns 200 OK

### Phase 2: Payload Processing ✅

**Objective:** Verify webhook handler correctly parses incoming payload

**Steps:**

1. ✅ Check payload parsing logic
2. ✅ Verify field extraction (transaction_id, order_id, status, customerId)
3. ✅ Add comprehensive logging

**Findings:**

- Handler extracts: `transaction_id`, `order_id`, `status`, `customerId`
- Tries multiple field name variations
- Logs full payload for debugging

### Phase 3: Payment Lookup Logic 🔍

**Objective:** Verify webhook can find the payment record

**Current Logic:**

1. If `customerId` present:
   - Search by `customerId + providerReference (order_id)`
   - If not found, search by `customerId + transaction_id` (in metadata)
2. If `customerId` missing:
   - Search by `providerReference (order_id)` across all customers
   - If not found, search by `transaction_id` (in metadata)

**Potential Issues:**

- `order_id` in webhook doesn't match `providerReference` in DB
- `transaction_id` in webhook doesn't match `metadata.monicreditTransactionId`
- `customerId` mismatch

### Phase 4: Status Update Logic 🔍

**Objective:** Verify payment status is actually updated in database

**Current Logic:**

- Checks if `status === "APPROVED" || status === "SUCCESS"`
- Updates payment with `status: "success"`, `paidAt: new Date()`
- Stores webhook metadata

**Potential Issues:**

- Status value from Monicredit is not exactly "APPROVED" or "SUCCESS"
- Status might be lowercase: "approved", "success"
- Status might be in different field location

**Fix Applied:**

- Added `normalizedStatus` to handle case-insensitive comparison
- Checks both original and normalized status values

### Phase 5: Database Verification 🔍

**Objective:** Verify database update actually occurs

**Steps:**

1. Run diagnostic script: `bash backend/scripts/diagnose-monicredit-webhook.sh`
2. Check database directly with SQL query
3. Verify `status`, `paidAt`, and `metadata.webhookReceivedAt` fields

**SQL Query:**

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

### Phase 6: Frontend Status Reading 🔍

**Objective:** Verify frontend reads updated status correctly

**Steps:**

1. Check if frontend polls for payment status
2. Verify socket events are received
3. Check if frontend cache needs clearing

## Diagnostic Tools Created

### 1. Diagnostic Script

**File:** `backend/scripts/diagnose-monicredit-webhook.sh`

**Usage:**

```bash
cd backend
bash scripts/diagnose-monicredit-webhook.sh
```

**What it checks:**

- Backend accessibility
- Webhook endpoint accessibility
- Webhook payload processing (with and without customerId)
- Provides SQL queries to check database

### 2. SQL Query File

**File:** `backend/scripts/check-payment-status.sql`

**Usage:**

- Run queries in PostgreSQL to check payment status
- Check by order_id
- Check by transaction_id
- Check all recent Monicredit payments

### 3. Enhanced Logging

**Added to webhook handler:**

- Request headers and body logging
- Extracted data logging
- Payment lookup results
- Database update confirmation
- Processing completion confirmation

## Systematic Debugging Steps

### Step 1: Run Diagnostic Script

```bash
cd backend
bash scripts/diagnose-monicredit-webhook.sh
```

### Step 2: Check Backend Logs

Watch backend terminal for:

```
[Monicredit Payment Webhook] Request received: { ... }
[Monicredit Payment Webhook] Extracted data: { ... }
[Monicredit Payment Webhook] Found payment, updating status: { ... }
[Monicredit Payment Webhook] Payment updated successfully: { ... }
```

**If you see "Payment not found":**

- Check the `order_id` and `transaction_id` values in logs
- Compare with database values
- Verify `customerId` matches

### Step 3: Check Database

Run SQL query from `check-payment-status.sql`:

- Verify payment exists
- Check current status
- Check if `webhookReceivedAt` is set (indicates webhook processed)

### Step 4: Test Webhook Manually

```bash
cd backend
bash scripts/test-monicredit-webhook.sh
```

Watch backend logs for processing details.

### Step 5: Verify Status Normalization

The webhook now handles:

- `"APPROVED"` (uppercase)
- `"approved"` (lowercase)
- `"SUCCESS"` (uppercase)
- `"success"` (lowercase)

Check logs to see what status value Monicredit actually sends.

## Common Issues and Solutions

### Issue 1: Payment Not Found

**Symptoms:**

- Log shows: `[Monicredit Payment Webhook] Payment not found`
- Webhook returns: `"Webhook received but payment not found"`

**Diagnosis:**

1. Check logs for extracted `order_id` and `transaction_id`
2. Compare with database `providerReference` and `metadata.monicreditTransactionId`
3. Check if `customerId` matches

**Solution:**

- Verify Monicredit sends correct `order_id` (should match `providerReference`)
- Verify `transaction_id` is stored in metadata during payment initialization
- Check if `customerId` in webhook matches payment's `customerId`

### Issue 2: Status Not Recognized

**Symptoms:**

- Webhook received but payment not updated
- No "Found payment, updating status" log

**Diagnosis:**

- Check logs for `normalizedStatus` value
- Check what status value Monicredit actually sends

**Solution:**

- Status normalization now handles case variations
- Check logs to see actual status value and add to handler if needed

### Issue 3: Database Update Fails Silently

**Symptoms:**

- Logs show "Found payment, updating status" but status remains pending

**Diagnosis:**

- Check database directly with SQL query
- Verify Prisma update is not throwing errors

**Solution:**

- Check backend logs for Prisma errors
- Verify database connection
- Check if payment record is locked or has constraints

### Issue 4: Frontend Not Refreshing

**Symptoms:**

- Database shows `status = "success"`
- UI still shows "pending"

**Diagnosis:**

- Check if socket events are emitted
- Check if frontend is listening for payment updates
- Check browser console for errors

**Solution:**

- Refresh page manually
- Check socket connection in browser console
- Verify frontend payment polling/refresh logic

## Next Steps

1. **Run diagnostic script** to get baseline status
2. **Check backend logs** when webhook is received
3. **Verify database** status after webhook
4. **Test with actual Monicredit webhook** (not just test script)
5. **Check Monicredit dashboard** for webhook delivery status

## Expected Flow After Fix

1. Monicredit sends webhook → Backend receives it
2. Backend extracts `order_id` and `transaction_id`
3. Backend finds payment by `order_id` or `transaction_id`
4. Backend updates payment: `status = "success"`, `paidAt = NOW()`
5. Backend emits socket event: `payment:updated`
6. Frontend receives socket event → UI updates to show "success"

---

**Last Updated:** December 17, 2025  
**Status:** Systematic investigation framework for Monicredit webhook issues
