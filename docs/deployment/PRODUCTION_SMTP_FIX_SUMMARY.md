# Production SMTP Fix - Summary

## Problem Identified

**Issue:** Customer creation fails with 500 error in production when "Send Invitation" is clicked.

**Root Cause:** The `sendCustomerInvitation()` and `sendTenantInvitation()` functions in `backend/src/lib/email.ts` were **throwing errors** instead of returning false when email sending failed. This caused the entire customer creation process to fail with a 500 error.

## The Fix

### 1. Changed Error Handling in Email Functions ✅

**File:** `backend/src/lib/email.ts`

**Before (Caused 500 errors):**

```typescript
export async function sendCustomerInvitation(params): Promise<boolean> {
  try {
    // ... send email
    return true;
  } catch (error: any) {
    console.error("❌ Failed to send customer invitation email:", error);
    throw new Error(
      `Failed to send customer invitation email: ${error.message}`
    );
    // ❌ THROWS - This causes 500 error in customer creation
  }
}
```

**After (Graceful degradation):**

```typescript
export async function sendCustomerInvitation(params): Promise<boolean> {
  try {
    // ... send email
    return true;
  } catch (error: any) {
    console.error("❌ Failed to send customer invitation email:", error);
    console.error("📧 Email error details:", {
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode,
      message: error?.message,
    });
    // ✅ Return false instead of throwing
    return false;
  }
}
```

### 2. Added Better Logging ✅

Added credential check and detailed logging in `getTransporter()`:

```typescript
function getTransporter(): Transporter {
  if (!transporter) {
    const config = getEmailConfig();

    // ✅ Check if credentials are configured
    if (!config.auth.user || !config.auth.pass) {
      console.error("❌ SMTP credentials not configured!");
      console.error(
        "⚠️  Please set SMTP_USER and SMTP_PASS environment variables"
      );
    }

    console.log("📧 Initializing email transporter with config:", {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user,
      from: config.from,
      hasPassword: !!config.auth.pass, // ✅ Shows if password is set
    });

    // ... create transporter
  }
  return transporter;
}
```

## What This Fixes

### Before Fix:

1. Admin creates customer with "Send Invitation" checked
2. Customer is created in database ✅
3. Email sending fails (SMTP not configured) ❌
4. Error is thrown and bubbles up ❌
5. **500 error returned to frontend** ❌
6. Frontend shows error, user thinks customer creation failed ❌

### After Fix:

1. Admin creates customer with "Send Invitation" checked
2. Customer is created in database ✅
3. Email sending fails (SMTP not configured) ⚠️
4. Error is caught, logged, and returns false ✅
5. **201 success returned to frontend** ✅
6. Customer is created successfully ✅
7. Backend logs show email failure for debugging ✅

## Production Deployment Steps

### Step 1: Deploy the Code Fix

```bash
# Pull latest changes
git pull origin main

# Restart backend
pm2 restart backend
# OR
systemctl restart backend
```

### Step 2: Verify SMTP Environment Variables

Check your production `.env` file has these variables:

```env
SMTP_HOST=mail.privateemail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@contrezz.com
SMTP_PASS=Korede@198800
SMTP_FROM=info@contrezz.com
FRONTEND_URL=https://contrezz.com
```

**Important:** Make sure there are no extra spaces or quotes around the values.

### Step 3: Test SMTP Connection (Optional)

Create a test endpoint or use the existing email test:

```bash
curl -X POST https://api.contrezz.com/api/email-test/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"to": "info@contrezz.com"}'
```

### Step 4: Test Customer Creation

1. Go to Admin Dashboard
2. Click "Add Customer"
3. Fill in customer details
4. Check "Send Invitation Email"
5. Click "Send Invitation"

**Expected Results:**

- ✅ Customer is created successfully (201 response)
- ✅ No 500 error
- ⚠️ If SMTP not configured: Customer created but email not sent (check logs)
- ✅ If SMTP configured: Customer created AND email sent

### Step 5: Check Backend Logs

```bash
# Check logs for email status
pm2 logs backend --lines 50
# OR
tail -f /var/log/backend.log
```

**Look for:**

- `📧 Initializing email transporter` - Shows SMTP config
- `✅ Customer invitation email sent successfully!` - Email sent
- `❌ Failed to send customer invitation email` - Email failed (but customer created)
- `❌ SMTP credentials not configured!` - Need to set env vars

## Common Issues & Solutions

### Issue 1: SMTP Credentials Not Set

**Symptoms:**

- Customers created successfully
- No emails sent
- Logs show: "SMTP credentials not configured"

**Solution:**

```bash
# Add to production .env
SMTP_USER=info@contrezz.com
SMTP_PASS=Korede@198800

# Restart backend
pm2 restart backend
```

### Issue 2: Firewall Blocking SMTP

**Symptoms:**

- Customers created successfully
- Logs show: "ECONNREFUSED" or "ETIMEDOUT"

**Solution:**

```bash
# Check if port 465 is blocked
telnet mail.privateemail.com 465

# If blocked, try port 587 instead
# Update .env:
SMTP_PORT=587
SMTP_SECURE=false
```

### Issue 3: Invalid SMTP Credentials

**Symptoms:**

- Customers created successfully
- Logs show: "EAUTH" or "Invalid login"

**Solution:**

- Verify credentials in Namecheap control panel
- Check if password has special characters that need escaping
- Try resetting the email password

### Issue 4: Network Issues

**Symptoms:**

- Intermittent email failures
- Logs show: "Connection lost" or "Timeout"

**Solution:**

- Increase timeout values in email.ts
- Check server's outbound network connectivity
- Consider using a relay service (SendGrid, Mailgun)

## Monitoring

### Check Email Status

Add this to your monitoring:

```bash
# Count email failures in last hour
grep "Failed to send customer invitation email" /var/log/backend.log | tail -100

# Check SMTP configuration
grep "Initializing email transporter" /var/log/backend.log | tail -1
```

### Alert on Email Failures

Set up alerts if email failures exceed threshold:

- More than 5 email failures in 1 hour
- SMTP credentials not configured

## Benefits of This Fix

1. **✅ No More 500 Errors** - Customer creation always succeeds
2. **✅ Better UX** - Users don't see failures when customers are actually created
3. **✅ Graceful Degradation** - System works even if email is down
4. **✅ Better Debugging** - Detailed logs help diagnose SMTP issues
5. **✅ Production Ready** - Handles missing config gracefully

## Files Changed

- `backend/src/lib/email.ts` - Fixed error handling and added logging

## Testing Checklist

- [ ] Customer creation works without "Send Invitation"
- [ ] Customer creation works with "Send Invitation" (SMTP configured)
- [ ] Customer creation works with "Send Invitation" (SMTP not configured)
- [ ] Backend logs show SMTP configuration status
- [ ] Backend logs show email send status
- [ ] No 500 errors when email fails
- [ ] Emails are received when SMTP is configured

## Next Steps

1. Deploy this fix to production immediately
2. Verify SMTP environment variables are set
3. Test customer creation
4. Monitor logs for email status
5. If emails still not sending, check firewall/network
