# Fix Malformed Monicredit Redirect URL

## Problem

Monicredit is redirecting with a **malformed URL** that has two question marks:

```
?payment_ref=PH-1765994236308-syptoj?transId=ACX6942EEFCCF028
```

This breaks `URLSearchParams` parsing because:

- `URLSearchParams` only parses the first query string correctly
- The `transId` parameter is not recognized as a separate parameter
- Frontend cannot extract the payment reference correctly

## Root Cause

Monicredit is appending `transId` as a **second query string** (with another `?`) instead of using `&` to separate parameters. This happens when:

1. Backend adds `transId` to the callback URL: `?payment_ref=REF&transId=ACX...`
2. Monicredit redirects but incorrectly formats it: `?payment_ref=REF?transId=ACX...`

## Solution: Enhanced URL Parsing

Updated frontend code in `App.tsx` and `TenantPaymentsPage.tsx` to handle malformed URLs:

### 1. Manual URL Parsing

Instead of relying solely on `URLSearchParams`, we now:

1. **Try normal parsing first** (for correctly formatted URLs)
2. **Detect malformed format** (when `payment_ref` contains `?`)
3. **Extract both values manually** using regex and string splitting
4. **Prioritize `transId`** (Monicredit) over `payment_ref` for verification

### 2. Code Changes

**Before:**

```typescript
const params = new URLSearchParams(window.location.search);
let paymentRef = params.get("payment_ref") || params.get("transId");
if (paymentRef) {
  paymentRef = paymentRef.split("?")[0]; // Simple cleaning
}
```

**After:**

```typescript
// Handle malformed URLs like: ?payment_ref=REF?transId=ACX...
const search = window.location.search;
let paymentRef: string | null = null;
let transId: string | null = null;

// Try normal parsing first
const params = new URLSearchParams(search);
paymentRef = params.get("payment_ref") || params.get("transId");
transId = params.get("transId");

// If payment_ref contains malformed query, extract manually
if (paymentRef && paymentRef.includes("?")) {
  const parts = paymentRef.split("?");
  paymentRef = parts[0]; // First part is the actual reference

  // Extract transId from malformed part
  if (parts.length > 1) {
    const malformedPart = parts.slice(1).join("?");
    const malformedParams = new URLSearchParams("?" + malformedPart);
    transId = malformedParams.get("transId") || transId;
  }
}

// Also check entire search string for malformed format
if (
  !paymentRef &&
  search.includes("payment_ref=") &&
  search.includes("?transId=")
) {
  const paymentRefMatch = search.match(/[?&]payment_ref=([^?&]+)/);
  const transIdMatch = search.match(/[?&]transId=([^&]+)/);
  if (paymentRefMatch) paymentRef = paymentRefMatch[1].split("?")[0];
  if (transIdMatch) transId = transIdMatch[1];
}

// Prioritize transId (Monicredit), otherwise use payment_ref
const finalRef = transId || paymentRef;
if (finalRef) {
  paymentRef = finalRef.split("?")[0].split("&")[0]; // Final cleanup
}
```

## Testing

### Test Case 1: Normal URL (Paystack)

```
?payment_ref=PH-1234567890-abc
```

**Expected:** Extracts `PH-1234567890-abc` correctly

### Test Case 2: Normal URL with transId (Monicredit)

```
?payment_ref=PH-1234567890-abc&transId=ACX123
```

**Expected:** Extracts `ACX123` (prioritizes transId)

### Test Case 3: Malformed URL (Current Issue)

```
?payment_ref=PH-1234567890-abc?transId=ACX123
```

**Expected:**

- Extracts `PH-1234567890-abc` from first part
- Extracts `ACX123` from second part
- Uses `ACX123` for verification (prioritizes transId)

### Test Case 4: Only transId

```
?transId=ACX123
```

**Expected:** Extracts `ACX123` correctly

## Additional: Check Webhook Status

Even with this fix, if payment status is still "pending", check:

### 1. Is Webhook Being Called?

**Check production backend logs for:**

```
[Monicredit Payment Webhook] Request received
```

**If you DON'T see this:**

- ❌ Webhook is not being called
- **Possible causes:**
  - Webhook URL not configured correctly in Monicredit dashboard
  - Monicredit cannot reach production backend
  - SSL certificate issues

**If you DO see this:**

- ✅ Webhook is being called
- Check if payment was found and updated

### 2. Check Payment Status in Database

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
WHERE "providerReference" = 'PH-1765994236308-syptoj'
   OR metadata->>'monicreditTransactionId' = 'ACX6942EEFCCF028';
```

**Interpretation:**

- If `webhook_time` is NULL → Webhook was never received
- If `status = 'pending'` and `webhook_time` is NULL → Webhook not delivered
- If `status = 'success'` and `webhook_time` has value → Webhook worked! ✅

### 3. Verify Webhook URL in Monicredit Dashboard

**In Monicredit merchant dashboard:**

1. Go to **Settings** → **Webhooks**
2. Verify webhook URL is: `https://api.app.contrezz.com/api/monicredit/webhook/payment`
3. Check webhook delivery status for this transaction
4. Look for delivery failures or errors

## Summary

**The Issue:**

- Monicredit redirects with malformed URL: `?payment_ref=REF?transId=ACX...`
- `URLSearchParams` cannot parse this correctly
- Frontend cannot extract payment reference

**The Fix:**

- Enhanced URL parsing to handle malformed URLs
- Manual extraction of both `payment_ref` and `transId`
- Prioritizes `transId` for Monicredit payments

**Next Steps:**

1. ✅ Frontend code updated to handle malformed URLs
2. ⏳ Test with new payment to verify URL parsing works
3. ⏳ Check production backend logs for webhook delivery
4. ⏳ Verify payment status updates after webhook

---

**Last Updated:** December 17, 2025  
**Status:** Fixed malformed URL parsing  
**Related:** `MONICREDIT_LOCALHOST_WEBHOOK_ISSUE.md`, `WEBHOOK_PROVIDER_REFERENCE_FIX.md`
