# Fix Monicredit Payment Redirect Error

## Problem

After successful Monicredit payment, it redirects to:

```
https://api.dev.contrezz.com/api/monicredit/webhook?transId=ACX6942D22F228D1
```

This shows: "This site can't be reached - api.dev.contrezz.com's server IP address could not be found"

## Root Cause

The `FRONTEND_URL` environment variable in the backend is set incorrectly, or Monicredit is using the webhook URL instead of the callback URL.

## Solution

### Step 1: Check Current FRONTEND_URL

**In DigitalOcean (or your backend environment):**

1. Go to DigitalOcean → `contrezz-backend-prod` app (or your backend app)
2. Settings → Environment Variables
3. Check `FRONTEND_URL` value

**Current (Wrong):**

```
FRONTEND_URL=https://api.dev.contrezz.com  ❌
```

**Should be:**

```
FRONTEND_URL=https://app.contrezz.com  ✅ (Production)
```

Or for local development:

```
FRONTEND_URL=http://localhost:5173  ✅ (Local)
```

### Step 2: Update FRONTEND_URL

**In DigitalOcean:**

1. Go to Backend App → Settings → Environment Variables
2. Find `FRONTEND_URL`
3. Update to:
   - **Production:** `https://app.contrezz.com`
   - **Local:** `http://localhost:5173`
4. Click **Save**
5. **Restart the app**

### Step 3: Verify Callback URL in Code

The callback URL is constructed as:

```typescript
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const callbackUrl = `${frontendUrl}/?payment_ref=${encodeURIComponent(
  reference
)}`;
```

This should result in:

- **Production:** `https://app.contrezz.com/?payment_ref=ACX6942D22F228D1`
- **Local:** `http://localhost:5173/?payment_ref=ACX6942D22F228D1`

### Step 4: Check Monicredit Dashboard Configuration

**If Monicredit is still redirecting to the webhook URL:**

1. Log in to your Monicredit dashboard
2. Go to **Settings** → **Webhooks** or **Payment Settings**
3. Check the **Redirect URL** or **Return URL** configuration
4. Make sure it's set to your **frontend URL**, NOT the webhook URL:
   - ✅ Correct: `https://app.contrezz.com` (or `http://localhost:5173` for local)
   - ❌ Wrong: `https://api.dev.contrezz.com/api/monicredit/webhook`

**Webhook URL vs Callback URL:**

- **Webhook URL** (for Monicredit to POST to): `https://api.app.contrezz.com/api/monicredit/webhook/payment`
- **Callback/Redirect URL** (for user redirect): `https://app.contrezz.com/?payment_ref=REFERENCE`

### Step 5: Verify Payment Initialization

**Check backend logs when initializing payment:**

Look for:

```
[Monicredit Transaction] Authorization URL: ...
```

The callback URL should be in the request metadata:

```json
{
  "meta_data": {
    "callback_url": "https://app.contrezz.com/?payment_ref=..."
  }
}
```

---

## Environment Variables Reference

### Backend Environment Variables

**Production:**

```env
FRONTEND_URL=https://app.contrezz.com
```

**Local Development:**

```env
FRONTEND_URL=http://localhost:5173
```

### Monicredit Dashboard Configuration

**Redirect URL (User Return):**

```
https://app.contrezz.com
```

**Webhook URL (Server Callback):**

```
https://api.app.contrezz.com/api/monicredit/webhook/payment
```

---

## Testing

### Test Local Development

1. Set `FRONTEND_URL=http://localhost:5173` in `backend/.env`
2. Restart backend
3. Initialize Monicredit payment
4. After payment, should redirect to: `http://localhost:5173/?payment_ref=REFERENCE`

### Test Production

1. Set `FRONTEND_URL=https://app.contrezz.com` in DigitalOcean
2. Restart backend app
3. Initialize Monicredit payment
4. After payment, should redirect to: `https://app.contrezz.com/?payment_ref=REFERENCE`

---

## Troubleshooting

### Issue: Still redirecting to wrong URL

**Check:**

1. Backend environment variable `FRONTEND_URL` is correct
2. Backend app was restarted after updating environment variable
3. Monicredit dashboard redirect URL is configured correctly
4. Monicredit is using the `callback_url` from the payment initialization request

### Issue: Redirecting to webhook endpoint

**Problem:** Monicredit is using webhook URL as redirect URL.

**Solution:**

1. Check Monicredit dashboard settings
2. Ensure redirect URL is separate from webhook URL
3. Verify the `callback_url` in payment initialization request is correct

### Issue: Frontend not handling redirect

**Check:**

1. Frontend has callback handler for `payment_ref` query parameter
2. Frontend verifies payment with backend after redirect
3. Frontend cleans up URL parameters after verification

---

## Quick Fix Checklist

- [ ] Check `FRONTEND_URL` in backend environment variables
- [ ] Update `FRONTEND_URL` to correct frontend URL (`https://app.contrezz.com`)
- [ ] Restart backend app
- [ ] Check Monicredit dashboard redirect URL configuration
- [ ] Verify callback URL in payment initialization request
- [ ] Test payment flow end-to-end

---

**Last Updated:** December 16, 2025  
**Status:** Monicredit redirect fix guide

