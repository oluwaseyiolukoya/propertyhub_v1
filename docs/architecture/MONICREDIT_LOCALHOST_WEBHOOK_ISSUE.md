# Critical Issue: Monicredit Cannot Reach localhost Webhook

## Problem

Payment status remains "pending" because **Monicredit cannot reach `http://localhost:5000`** from the internet.

## Root Cause

**Monicredit is on the internet** → **Your localhost is on your local machine** → **They cannot connect!**

When you configure webhook URL as:

```
http://localhost:5000/api/monicredit/webhook/payment
```

Monicredit's servers try to call this URL, but:

- `localhost` resolves to `127.0.0.1` on Monicredit's servers (their own server, not yours!)
- They cannot reach your local machine from the internet
- Webhook is never delivered → Payment stays "pending"

## Evidence

**Test webhooks work** (because you run them locally):

- ✅ `bash scripts/test-monicredit-webhook.sh` → Works
- ✅ Manual curl to `localhost:5000` → Works
- ✅ Backend logs show webhook processing

**Real Monicredit webhooks don't work**:

- ❌ No webhook logs for real payments
- ❌ Payment status stays "pending"
- ❌ Monicredit dashboard may show "webhook delivery failed"

## Solutions

### Solution 1: Use ngrok (Recommended for Local Testing)

**ngrok** creates a public URL that tunnels to your localhost.

**Steps:**

1. **Install ngrok:**

   ```bash
   # macOS
   brew install ngrok

   # Or download from https://ngrok.com/download
   ```

2. **Start ngrok tunnel:**

   ```bash
   ngrok http 5000
   ```

3. **Copy the public URL:**

   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:5000
   ```

4. **Update Monicredit webhook URL:**

   ```
   https://abc123.ngrok.io/api/monicredit/webhook/payment
   ```

5. **Test:**
   - Make a payment through Monicredit
   - Webhook should now reach your localhost via ngrok
   - Check backend logs for webhook processing

**Note:** ngrok free tier gives you a random URL each time. For production, use a static domain or test in production environment.

### Solution 2: Test in Production

**For production testing:**

1. **Deploy backend to production** (DigitalOcean, etc.)
2. **Configure Monicredit webhook URL:**
   ```
   https://api.app.contrezz.com/api/monicredit/webhook/payment
   ```
3. **Test payment flow:**
   - Make payment through Monicredit
   - Webhook reaches production backend
   - Payment status updates

### Solution 3: Manual Webhook Trigger (For Testing)

**If you just need to test the webhook handler:**

1. **Get the transaction_id from Monicredit dashboard:**

   - Log in to Monicredit merchant dashboard
   - Find the transaction
   - Copy the transaction ID (e.g., `ACX6942DB8C6794A`)

2. **Trigger webhook manually:**

   ```bash
   cd backend
   bash scripts/test-webhook-for-payment.sh PH-1765993730760-l5gwrm ACX6942DB8C6794A
   ```

3. **Check backend logs** for webhook processing
4. **Verify database** status updated

## Verification Steps

### Step 1: Check if Webhook Was Received

**Check backend logs for:**

```
[Monicredit Payment Webhook] Request received: { ... }
```

**If you DON'T see this log:**

- ❌ Webhook was never received
- **Cause:** Monicredit cannot reach localhost
- **Solution:** Use ngrok or test in production

**If you DO see this log:**

- ✅ Webhook was received
- Check if payment was found and updated

### Step 2: Check Payment Status in Database

**Run SQL query:**

```sql
SELECT
  id,
  status,
  "providerReference",
  "paidAt",
  metadata->>'monicreditTransactionId' as transaction_id,
  metadata->>'webhookReceivedAt' as webhook_time
FROM payments
WHERE "providerReference" = 'PH-1765993730760-l5gwrm';
```

**Interpretation:**

- If `webhook_time` is NULL → Webhook was never received
- If `status = 'pending'` and `webhook_time` is NULL → Webhook not delivered
- If `status = 'success'` and `webhook_time` has value → Webhook worked! ✅

### Step 3: Check Monicredit Dashboard

**In Monicredit merchant dashboard:**

1. Go to **Webhooks** or **Settings** → **Webhooks**
2. Check webhook delivery status
3. Look for delivery failures or errors
4. Check webhook URL configuration

**Common errors:**

- "Connection refused" → Monicredit cannot reach localhost
- "DNS resolution failed" → Invalid URL
- "Timeout" → Server not responding

## Quick Test: Manual Webhook

**To verify webhook handler works (even if Monicredit can't reach you):**

```bash
cd backend

# Test webhook for your payment
bash scripts/test-webhook-for-payment.sh \
  PH-1765993730760-l5gwrm \
  ACX_TRANSACTION_ID_HERE \
  c97b0fb3-b857-416f-9071-82c9eda4169b
```

**Then check:**

1. Backend logs for webhook processing
2. Database for updated status
3. Frontend for "success" status

## Production Setup

**For production, configure webhook URL as:**

```
https://api.app.contrezz.com/api/monicredit/webhook/payment
```

**Requirements:**

- ✅ Backend deployed and accessible
- ✅ HTTPS enabled (Monicredit requires HTTPS)
- ✅ SSL certificate valid
- ✅ CORS configured to allow Monicredit's IPs (if needed)

## Summary

**The Issue:**

- Monicredit cannot reach `localhost:5000` from the internet
- Real webhooks are never delivered
- Payment status stays "pending"

**The Solution:**

1. **Local testing:** Use ngrok to expose localhost
2. **Production testing:** Use production backend URL
3. **Manual testing:** Use test script to trigger webhook

**Next Steps:**

1. Set up ngrok (for local) OR use production URL
2. Update Monicredit webhook URL
3. Make a test payment
4. Verify webhook is received (check backend logs)
5. Verify payment status updates

---

**Last Updated:** December 17, 2025  
**Status:** Critical issue - Monicredit cannot reach localhost  
**Solution:** Use ngrok for local testing or test in production
