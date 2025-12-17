# Debug Pending Payment - PH-1765994852895-r6cbpt

## Problem

Payment `PH-1765994852895-r6cbpt` is still showing as "pending" while a previous payment `PH-1765993730760-l5gwrm` was successful.

## Investigation Steps

### Step 1: Check Database Status

**Run SQL query to compare both payments:**

```sql
-- Payment 1 (Success): PH-1765993730760-l5gwrm
SELECT
  'Payment 1 (Success)' as payment_label,
  status,
  "providerReference",
  "paidAt",
  metadata->>'monicreditTransactionId' as transaction_id,
  metadata->>'webhookReceivedAt' as webhook_time
FROM payments
WHERE "providerReference" = 'PH-1765993730760-l5gwrm';

-- Payment 2 (Pending): PH-1765994852895-r6cbpt
SELECT
  'Payment 2 (Pending)' as payment_label,
  status,
  "providerReference",
  "paidAt",
  metadata->>'monicreditTransactionId' as transaction_id,
  metadata->>'webhookReceivedAt' as webhook_time
FROM payments
WHERE "providerReference" = 'PH-1765994852895-r6cbpt';
```

**Key Questions:**

1. Does Payment 2 have a `transaction_id` in metadata?
2. Does Payment 2 have a `webhook_time` in metadata?
3. What is the `paidAt` value for Payment 2?

### Step 2: Check Backend Logs for Webhook

**Check production backend logs for:**

```
[Monicredit Payment Webhook] Request received
[Monicredit Payment Webhook] Extracted data: { orderId: 'PH-1765994852895-r6cbpt', ... }
```

**If you DON'T see this:**

- ❌ Webhook was never received for Payment 2
- **Possible causes:**
  - Monicredit hasn't sent the webhook yet
  - Webhook URL misconfigured
  - Monicredit cannot reach production backend
  - Transaction not completed on Monicredit side

**If you DO see this:**

- ✅ Webhook was received
- Check if payment was found and updated

### Step 3: Check Monicredit Dashboard

**In Monicredit merchant dashboard:**

1. **Find Payment 2 transaction:**

   - Search for order ID: `PH-1765994852895-r6cbpt`
   - Or search by transaction ID (if available)

2. **Check transaction status:**

   - Is it marked as "Approved" or "Success"?
   - Is it still "Pending" on Monicredit side?

3. **Check webhook delivery:**
   - Go to **Webhooks** or **Transaction Details**
   - Look for webhook delivery status
   - Check if webhook was sent
   - Check if webhook delivery failed

### Step 4: Compare Payment Initialization

**Check if Payment 2 was initialized correctly:**

```sql
SELECT
  "providerReference",
  provider,
  status,
  metadata->>'monicreditTransactionId' as transaction_id,
  metadata->>'initializedAt' as initialized_at,
  "createdAt"
FROM payments
WHERE "providerReference" = 'PH-1765994852895-r6cbpt';
```

**Expected:**

- `provider` = `'monicredit'`
- `transaction_id` should be set (from Monicredit's initialization response)
- `initialized_at` should have a timestamp

### Step 5: Manual Webhook Test

**If webhook wasn't received, test manually:**

1. **Get transaction_id from Monicredit dashboard:**

   - Find transaction for `PH-1765994852895-r6cbpt`
   - Copy the transaction ID (e.g., `ACX...`)

2. **Trigger webhook manually:**

   ```bash
   cd backend
   bash scripts/test-webhook-for-payment.sh \
     PH-1765994852895-r6cbpt \
     ACX_TRANSACTION_ID_FROM_MONICREDIT \
     CUSTOMER_ID
   ```

3. **Check backend logs** for webhook processing
4. **Verify database** status updated

## Common Causes

### Cause 1: Webhook Not Delivered

**Symptoms:**

- `webhook_time` is NULL in database
- No webhook logs in backend
- Payment status is "pending"

**Solution:**

- Check Monicredit dashboard for webhook delivery status
- Verify webhook URL is correct: `https://api.app.contrezz.com/api/monicredit/webhook/payment`
- Check if Monicredit can reach production backend
- Wait a few minutes (webhooks can be delayed)

### Cause 2: Payment Not Found by Webhook

**Symptoms:**

- Webhook logs show "Payment not found"
- `webhook_time` is NULL
- Payment status is "pending"

**Solution:**

- Check if `order_id` in webhook matches `providerReference` in database
- Check if `transaction_id` in webhook matches `metadata.monicreditTransactionId`
- Verify `customerId` matches

### Cause 3: Status Value Not Recognized

**Symptoms:**

- Webhook was received
- Payment was found
- But status not updated

**Solution:**

- Check backend logs for status value
- Verify status normalization is working
- Check if Monicredit sent a different status format

### Cause 4: Transaction Not Completed on Monicredit

**Symptoms:**

- Payment shows "pending" in Monicredit dashboard
- No webhook sent (because transaction not completed)

**Solution:**

- Complete the payment on Monicredit side
- Wait for webhook to be sent
- Or manually trigger webhook after payment completion

## Quick Diagnostic Commands

### Check Payment Status:

```bash
cd backend
tsx scripts/check-payment-by-reference.ts PH-1765994852895-r6cbpt
```

### Check Recent Monicredit Payments:

```bash
cd backend
tsx scripts/check-payment-by-reference.ts
```

### Test Webhook Manually:

```bash
cd backend
bash scripts/test-webhook-for-payment.sh \
  PH-1765994852895-r6cbpt \
  ACX_TRANSACTION_ID \
  CUSTOMER_ID
```

## Next Steps

1. ✅ Check database status for both payments
2. ⏳ Check production backend logs for webhook activity
3. ⏳ Check Monicredit dashboard for transaction and webhook status
4. ⏳ Compare initialization data between successful and pending payments
5. ⏳ If webhook not received, check webhook URL configuration
6. ⏳ If needed, manually trigger webhook for testing

---

**Last Updated:** December 17, 2025  
**Status:** Investigation guide for pending payment  
**Related:** `MONICREDIT_LOCALHOST_WEBHOOK_ISSUE.md`, `WEBHOOK_PROVIDER_REFERENCE_FIX.md`
