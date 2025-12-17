# Debug Monicredit Webhook - Payment Status Not Updating

## Problem

Webhook test returns success, but payment status remains "pending" in the UI.

## Investigation Steps

### 1. Check Backend Logs

When the webhook is received, you should see these log entries:

```
[Monicredit Payment Webhook] Request received: { ... }
[Monicredit Payment Webhook] Extracted data: { transactionId, orderId, status, customerId, ... }
[Monicredit Payment Webhook] Found payment, updating status: { paymentId, currentStatus, ... }
[Monicredit Payment Webhook] Payment updated successfully: { paymentId, newStatus, paidAt, ... }
```

**If you see "Payment not found":**

- The webhook is working, but it can't find the payment record
- Check if `order_id` or `transaction_id` matches what's in the database

**If you DON'T see "Found payment, updating status":**

- The webhook is not finding the payment
- Check the `customerId` in the webhook payload vs. the payment's `customerId`

### 2. Verify Database Status

Run this SQL query to check the payment status:

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

**Expected result after webhook:**

- `status` should be `"success"`
- `paidAt` should have a timestamp
- `webhook_time` should have a timestamp

### 3. Test Webhook Manually

Run the test script:

```bash
cd backend
bash scripts/test-monicredit-webhook.sh
```

**Check backend logs for:**

1. `[Monicredit Payment Webhook] Extracted data:` - Shows what the webhook received
2. `[Monicredit Payment Webhook] Found payment, updating status:` - Confirms payment was found
3. `[Monicredit Payment Webhook] Payment updated successfully:` - Confirms database update

### 4. Common Issues

#### Issue 1: Payment Not Found

**Symptoms:**

- Log shows: `[Monicredit Payment Webhook] Payment not found:`
- Webhook returns: `"Webhook received but payment not found"`

**Causes:**

- `order_id` in webhook doesn't match `providerReference` in database
- `transaction_id` in webhook doesn't match `metadata.monicreditTransactionId`
- `customerId` mismatch

**Fix:**

- Check what `order_id` Monicredit is sending in the webhook
- Verify the payment record has the correct `providerReference`
- Check if `customerId` in webhook matches payment's `customerId`

#### Issue 2: Status Not "APPROVED" or "SUCCESS"

**Symptoms:**

- Webhook received but payment not updated
- Log shows webhook received but no update logs

**Causes:**

- Monicredit sends status as `"approved"` (lowercase) instead of `"APPROVED"`
- Status field is in a different location in the payload

**Fix:**

- Check the `fullPayload` in logs to see actual status value
- Update webhook handler to accept lowercase status values

#### Issue 3: Frontend Not Refreshing

**Symptoms:**

- Database shows `status = "success"`
- UI still shows "pending"

**Causes:**

- Frontend not polling for updates
- Socket events not reaching frontend
- Frontend cache not cleared

**Fix:**

- Refresh the page manually
- Check browser console for socket connection
- Verify socket events are being received

### 5. Enhanced Logging

The webhook handler now logs:

- Request headers and body
- Extracted transaction details
- Payment lookup results
- Database update results
- Socket event emissions

**To see all logs:**

- Watch backend terminal output
- Look for `[Monicredit Payment Webhook]` prefix

### 6. Manual Database Update (Temporary Fix)

If webhook is not working, manually update the payment:

```sql
UPDATE payments
SET
  status = 'success',
  "paidAt" = NOW(),
  "updatedAt" = NOW(),
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{webhookReceivedAt}',
    to_jsonb(NOW()::text)
  )
WHERE "providerReference" = 'PH-1765989259432-nzgcko';
```

Then refresh the frontend to see the updated status.

## Next Steps

1. **Check backend logs** when webhook is received
2. **Verify database** status after webhook
3. **Test webhook manually** using the test script
4. **Check Monicredit dashboard** for webhook delivery status
5. **Verify frontend** is refreshing after webhook updates

---

**Last Updated:** December 17, 2025  
**Status:** Debugging guide for Monicredit webhook issues
