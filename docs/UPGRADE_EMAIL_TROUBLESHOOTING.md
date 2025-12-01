# Upgrade Email Troubleshooting Guide

## Issue
Developer completes plan upgrade successfully, but no confirmation email is received.

## Diagnostic Steps

### Step 1: Check Backend Logs

When a developer upgrades their plan, you should see these logs in the backend console:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Subscription] 📧 SENDING UPGRADE CONFIRMATION EMAIL
[Subscription] Customer: developer@example.com
[Subscription] Plan: Developer Lite → Developer Pro
[Subscription] Price: 399
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 [Plan Upgrade] Preparing to send upgrade confirmation email...
📧 [Plan Upgrade] Recipient: developer@example.com
📧 [Plan Upgrade] Company: Developer Company
📧 [Plan Upgrade] Plan: Developer Lite → Developer Pro
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 [Plan Upgrade] SMTP Config (from env):
  host: smtp.gmail.com
  port: 587
  secure: false
  user: your-email@gmail.com
  from: your-email@gmail.com
  hasPassword: true
  passwordLength: 16
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 [Plan Upgrade] Step 1: Creating fresh transporter...
📧 [Plan Upgrade] Step 2: Sending email...
✅ [Plan Upgrade] Email sent successfully!
📬 [Plan Upgrade] Message ID: <abc123@gmail.com>
📧 [Plan Upgrade] Accepted: ["developer@example.com"]
[Subscription] 📧 Email function returned: ✅ SUCCESS
[Subscription] ✅ Upgrade confirmation email sent successfully
```

### Step 2: Check for Errors

If email fails, you'll see:

```
❌ [Plan Upgrade] Email send failed - no message ID returned
OR
❌ [Plan Upgrade] Email rejected by server
OR
❌ [Plan Upgrade] Email not accepted by server
OR
[Subscription] ❌ EXCEPTION while sending upgrade confirmation email: Error: ...
```

### Step 3: Verify SMTP Configuration

Check your `.env` file has correct SMTP settings:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
FRONTEND_URL=http://localhost:5173
```

**Important for Gmail**:
- You MUST use an **App Password**, not your regular Gmail password
- Go to: https://myaccount.google.com/apppasswords
- Generate a new app password for "Mail"
- Use that 16-character password in `SMTP_PASS`

### Step 4: Test Email Manually

You can test the email function directly by running this in your backend:

```bash
cd backend
node -e "
const { sendPlanUpgradeEmail } = require('./src/lib/email');
sendPlanUpgradeEmail({
  customerName: 'Test User',
  customerEmail: 'test@example.com',
  companyName: 'Test Company',
  oldPlanName: 'Developer Lite',
  newPlanName: 'Developer Pro',
  newPlanPrice: 399,
  currency: 'NGN',
  billingCycle: 'monthly',
  effectiveDate: 'November 23, 2025',
  newFeatures: { projects: 10, users: 5, storage: 1000 },
  dashboardUrl: 'http://localhost:5173/dashboard'
}).then(result => {
  console.log('Email sent:', result);
  process.exit(0);
}).catch(err => {
  console.error('Email failed:', err);
  process.exit(1);
});
"
```

## Common Issues

### Issue 1: SMTP Connection Timeout
**Symptoms**: No logs after "Creating fresh transporter"
**Solution**: 
- Check firewall/network allows outbound SMTP
- Verify SMTP_HOST and SMTP_PORT are correct
- Try using port 465 with `SMTP_SECURE=true`

### Issue 2: Authentication Failed
**Symptoms**: `Error: Invalid login: 535 Authentication failed`
**Solution**:
- Verify SMTP_USER matches SMTP_FROM
- Regenerate Gmail App Password
- Ensure no extra spaces in .env values

### Issue 3: Email Rejected
**Symptoms**: `Email rejected by server`
**Solution**:
- Check recipient email is valid
- Verify sender email is verified with Gmail
- Check Gmail sending limits (not exceeded)

### Issue 4: Connection Pooling Issues
**Symptoms**: Works sometimes, fails other times
**Solution**:
- Email function already uses `pool: false` for instant delivery
- This should prevent stale connection issues

### Issue 5: Frontend Shows Success But No Email
**Symptoms**: Upgrade succeeds, no email received, no errors in logs
**Solution**:
- Check spam/junk folder
- Verify email address in customer record is correct
- Check if email function is even being called (look for the logs above)

## Verification Checklist

- [ ] Backend is running and logs are visible
- [ ] SMTP environment variables are set correctly
- [ ] Gmail App Password is being used (not regular password)
- [ ] Firewall allows outbound SMTP connections
- [ ] Customer email address is valid
- [ ] Email logs appear in backend console during upgrade
- [ ] No errors in email sending logs
- [ ] Check spam/junk folder

## Next Steps

1. **Try upgrading a plan** while watching the backend console
2. **Copy all email-related logs** from the console
3. **Check the customer's email** (including spam folder)
4. **If no logs appear**, the email function might not be called
5. **If logs show errors**, share the error message for diagnosis

## Testing Procedure

1. Open backend console (where `npm run dev` is running)
2. As a developer, go to Settings → Billing
3. Click "Change Plan"
4. Select a higher plan (e.g., Developer Pro)
5. Complete payment with test card
6. **Watch backend console** for email logs
7. Check email inbox (and spam folder)

## Expected Behavior

✅ **Success Flow**:
1. Payment completes successfully
2. Backend logs show "SENDING UPGRADE CONFIRMATION EMAIL"
3. SMTP connection established
4. Email sent successfully
5. Message ID returned
6. Customer receives email within 1-2 minutes

❌ **Failure Flow**:
1. Payment completes successfully
2. Backend logs show "SENDING UPGRADE CONFIRMATION EMAIL"
3. SMTP connection fails OR email rejected
4. Error logged with details
5. API returns 500 error
6. Frontend shows error (but upgrade still succeeded)

---

**Date**: November 23, 2025  
**Status**: Investigating  
**Priority**: High - Email notifications are critical for user experience




