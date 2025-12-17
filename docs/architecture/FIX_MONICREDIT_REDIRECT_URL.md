# Fix Monicredit Redirect URL - Match Paystack Behavior

## Problem

After successful Monicredit payment, it redirects to the webhook URL instead of the frontend payment page. The payment should redirect back to the payment page (like Paystack does) and show success status.

## Root Cause

Monicredit payment initialization was only sending `callback_url` in `meta_data`, but Monicredit might need it as a top-level field (`redirect_url`, `return_url`, or `callback_url`) to use it for user redirects.

## Solution: Add Top-Level Redirect URL Fields

Updated the Monicredit payment initialization to include redirect URL fields at the top level (not just in metadata):

```typescript
{
  // ... other fields
  redirect_url: callbackUrl,      // Primary redirect field
  return_url: callbackUrl,         // Alternative field name
  callback_url: callbackUrl,       // Also include this
  meta_data: {
    // ... metadata
    callback_url: callbackUrl,     // Keep in metadata for webhook reference
  }
}
```

This ensures Monicredit has multiple ways to find the redirect URL, similar to how Paystack uses `callback_url` at the top level.

## How It Works (Like Paystack)

### Paystack Flow:

1. Payment initialized with `callback_url: https://app.contrezz.com/?payment_ref=REF`
2. User completes payment on Paystack
3. Paystack redirects to: `https://app.contrezz.com/?payment_ref=REF`
4. Frontend detects `payment_ref` parameter
5. Frontend calls `/api/payments/verify/REF`
6. Payment status updates to success
7. UI refreshes to show success

### Monicredit Flow (After Fix):

1. Payment initialized with `redirect_url: https://app.contrezz.com/?payment_ref=REF`
2. User completes payment on Monicredit
3. Monicredit redirects to: `https://app.contrezz.com/?payment_ref=REF` (or `?transId=REF`)
4. Frontend detects `payment_ref` or `transId` parameter
5. Frontend calls `/api/payments/verify/REF`
6. Payment status updates to success
7. UI refreshes to show success

## Frontend Already Handles This

The frontend already has handlers for payment callbacks:

**In `TenantPaymentsPage.tsx`:**

```typescript
const paymentRef = urlParams.get("payment_ref") || urlParams.get("reference");
const trxref = urlParams.get("trxref");
const reference = paymentRef || trxref;
```

**In `App.tsx`:**

```typescript
const paymentRef = params.get("payment_ref");
```

Both components:

1. Detect `payment_ref` in URL
2. Clean up URL parameters
3. Call verification endpoint
4. Update UI based on status
5. Refresh payment history

## Additional: Handle transId Parameter

Monicredit might redirect with `transId` instead of `payment_ref`. Update frontend to also check for `transId`:

**In `TenantPaymentsPage.tsx` and `App.tsx`:**

```typescript
const paymentRef =
  urlParams.get("payment_ref") ||
  urlParams.get("reference") ||
  urlParams.get("transId") || // Add Monicredit support
  urlParams.get("transid"); // Case variation
```

## Testing

### Test Payment Flow:

1. **Initialize Payment:**

   - Go to tenant payments page
   - Click "Pay Now" on a payment
   - Select Monicredit as payment method
   - Click "Pay"

2. **Complete Payment:**

   - Complete payment on Monicredit page
   - Should redirect to: `https://app.contrezz.com/?payment_ref=REF` (or `?transId=REF`)

3. **Verify Redirect:**
   - Should land on payment page (not webhook URL)
   - Should see "Verifying payment..." toast
   - Should see "Payment successful!" toast
   - Payment status should update to "success"
   - Payment history should refresh

## If Still Redirecting to Webhook

If Monicredit still redirects to webhook URL after this fix:

1. **Check Monicredit Dashboard:**

   - Log in to Monicredit merchant dashboard
   - Go to **Settings** → **Payment Settings** or **Redirect URLs**
   - Look for "Success URL", "Return URL", or "Redirect URL"
   - Update it to: `https://app.contrezz.com` (or `http://localhost:5173` for local)
   - **Do NOT** use the webhook URL here

2. **Verify Webhook URL is Separate:**

   - Webhook URL (for server callbacks): `https://api.app.contrezz.com/api/monicredit/webhook/payment`
   - Redirect URL (for user redirects): `https://app.contrezz.com`

3. **Check Backend Logs:**
   - Look for the payment initialization request
   - Verify `redirect_url`, `return_url`, and `callback_url` are in the request body
   - Check what Monicredit returns in the authorization URL

---

**Last Updated:** December 16, 2025  
**Status:** Monicredit redirect URL fix - match Paystack behavior

