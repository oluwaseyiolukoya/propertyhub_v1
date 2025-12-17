# Monicredit Payment Pending Status - Root Cause & Fix

## Problem Summary

Monicredit payments were stuck in "pending" status even after successful payment completion on Monicredit's end.

**Specific payment debugged:** `PH-1765998042209-glni0l` (Transaction ID: `ACX6942FDDAB0BFC`)

## Root Cause Analysis

### 1. Monicredit Demo API Limitation

The Monicredit demo environment (`https://demo.backend.monicredit.com`) does not have working verification endpoints:

- `/api/v1/payment/transactions/verify-transaction/{id}` returns `400 Bad Request: "The route could not be found"`
- Other verification endpoints either return HTML (website) or authentication errors

### 2. Webhook Localhost Limitation

Monicredit's webhook service cannot reach `localhost:5000`. Since webhooks are the primary mechanism for payment status updates, local development payments never received status updates.

### 3. Verification Loop

When API verification fails, the backend was returning "pending" status without any fallback mechanism to trust redirect-based payment confirmations.

## Solutions Implemented

### Immediate Fix

The specific payment `PH-1765998042209-glni0l` was manually updated to "success" status in the database.

### Permanent Fixes in `backend/src/routes/payments.ts`

#### 1. Early Database Status Check

Added check at the beginning of Monicredit verification to return immediately if payment is already finalized:

```typescript
// If payment is already success/failed in DB, return that status immediately
if (payment.status === "success" || payment.status === "failed") {
  return res.json({
    status: payment.status,
    reference,
    provider,
    verified: true,
    verificationSource: "database",
    payment,
  });
}
```

#### 2. Trust Redirect Mode

Added environment variable `MONICREDIT_TRUST_REDIRECT` to enable automatic success marking when:

- API verification fails
- User was redirected from Monicredit with a valid transaction ID (ACX...)

```typescript
// Enable in .env for demo/sandbox environments
MONICREDIT_TRUST_REDIRECT = true;
```

When enabled, payments redirected from Monicredit with valid transId will be automatically marked as success.

## Environment Configuration

### For Local Development (Demo/Sandbox)

Add to `backend/.env`:

```env
# Monicredit Configuration
MONICREDIT_TRUST_REDIRECT=true
```

### For Production

In production with working webhooks:

```env
# Don't enable trust redirect if webhooks are working
MONICREDIT_TRUST_REDIRECT=false

# Or simply don't set it (defaults to false)
```

## Verification Flow (Updated)

1. **Check DB Status First**: If payment is already success/failed, return that immediately
2. **Try API Verification**: Attempt Monicredit API verification (may fail in demo environment)
3. **Trust Redirect Fallback**: If API fails but `MONICREDIT_TRUST_REDIRECT=true` and valid transId exists, mark as success
4. **Return Pending**: If all else fails, return pending status

## How to Test

1. Ensure `MONICREDIT_TRUST_REDIRECT=true` in backend/.env
2. Restart backend: `cd backend && npm run dev`
3. Make a payment via Monicredit
4. After redirect back to the app, payment should show as "success"

## Alternative Solutions for Local Development

### Option 1: Use ngrok (Recommended for webhook testing)

```bash
# Install ngrok
brew install ngrok

# Expose localhost:5000
ngrok http 5000

# Update Monicredit dashboard webhook URL to ngrok URL
# e.g., https://abc123.ngrok.io/api/monicredit/webhook/payment
```

### Option 2: Test in Production

Deploy to production where webhooks can reach your backend.

### Option 3: Manual Webhook Trigger

```bash
curl -X POST http://localhost:5000/api/monicredit/webhook/payment \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "ACX...",
    "order_id": "PH-...",
    "status": "APPROVED",
    "customerId": "your-customer-id"
  }'
```

## Files Modified

1. `backend/src/routes/payments.ts` - Added early DB check and trust redirect logic
2. `backend/.env` - Added `MONICREDIT_TRUST_REDIRECT=true`

## Related Documentation

- `MONICREDIT_LOCALHOST_WEBHOOK_ISSUE.md` - Why webhooks can't reach localhost
- `DEBUG_MONICREDIT_WEBHOOK.md` - Webhook debugging guide
- `FIX_MONICREDIT_REDIRECT_URL.md` - Redirect URL configuration

## Date

December 17, 2025
