# Production Email Not Being Sent - Troubleshooting Guide

## 🔍 Issue
Users creating accounts through the Get Started page are not receiving confirmation emails in production.

## 📋 Console Output Analysis
```javascript
[GetStartedPage] Submitting application: {applicationType: 'property-owner', ...}
[Onboarding API] Submitting application: {email: 'olukoyaseyifunmi@gmail.com', type: 'property-owner'}
⚠️ No auth token found for request to: /api/onboarding/apply
[Onboarding API] Application submitted successfully: {success: true, message: 'Application submitted successfully', data: {…}}
[GetStartedPage] Application submitted successfully: {success: true, message: 'Application submitted successfully', data: {…}}
```

## ✅ What's Working
- Application submission ✓
- API communication ✓
- Response received ✓

## ❌ What's Missing
- No `emailSent` status visible in logs
- Need to check if backend is returning `emailSent` field
- Need to verify SMTP configuration

## 🔧 Debugging Steps

### Step 1: Check Console for Toast Messages
**What toast message did you see?**
- ✅ "A confirmation email has been sent to..." → Email sent successfully
- ⚠️ Warning toast about email failure → Email sending failed
- ❓ Only "Application submitted successfully" → Need to check response data

### Step 2: Expand Response Data Object
In the console, expand the `data: {…}` object to see:
```javascript
// Look for this in console:
[GetStartedPage] Application submitted successfully: {
  success: true,
  message: 'Application submitted successfully',
  data: {
    applicationId: "...",
    status: "pending",
    estimatedReviewTime: "24-48 hours",
    submittedAt: "...",
    emailSent: ???  // ← Check if this field exists and its value
  }
}
```

### Step 3: Check Backend Logs (DigitalOcean)
Run this command in DigitalOcean console:
```bash
# View recent logs
cd /workspace/backend
pm2 logs --lines 100 | grep -i "email\|onboarding"

# Or check app logs
pm2 logs backend --lines 100
```

Look for:
```bash
# Success indicators:
✅ Onboarding confirmation email sent successfully!
📬 Message ID: ...
📧 Sent to: olukoyaseyifunmi@gmail.com

# Failure indicators:
❌ Failed to send onboarding confirmation email:
📧 Email error details: ...
```

### Step 4: Verify SMTP Configuration
Check environment variables in DigitalOcean:
```bash
echo "SMTP_HOST: $SMTP_HOST"
echo "SMTP_PORT: $SMTP_PORT"
echo "SMTP_USER: $SMTP_USER"
echo "SMTP_FROM: $SMTP_FROM"
# Don't echo SMTP_PASS for security
```

Required variables:
- `SMTP_HOST` - e.g., smtp.gmail.com
- `SMTP_PORT` - e.g., 587
- `SMTP_USER` - Your email address
- `SMTP_PASS` - App password (not regular password)
- `SMTP_FROM` - Sender email address

## 🚨 Common Issues & Solutions

### Issue 1: SMTP Environment Variables Not Set
**Symptom:** Backend logs show email errors
**Solution:**
```bash
# Add to DigitalOcean App Platform environment variables:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=no-reply@contrezz.com
```

### Issue 2: Gmail App Password Required
**Symptom:** EAUTH or authentication errors
**Solution:**
1. Enable 2-Factor Authentication on Gmail
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use App Password (not regular password) in `SMTP_PASS`

### Issue 3: Backend Not Returning `emailSent` Field
**Symptom:** No email status in frontend logs
**Solution:** Check backend code at `backend/src/routes/onboarding.ts`:
```typescript
res.status(201).json({
  success: true,
  message: 'Application submitted successfully',
  data: {
    applicationId: application.id,
    status: application.status,
    estimatedReviewTime: '24-48 hours',
    submittedAt: application.createdAt,
    emailSent: emailSent, // ← Make sure this line exists
  },
});
```

### Issue 4: Firewall Blocking SMTP Port
**Symptom:** Connection timeout or refused
**Solution:**
- Check if port 587 (or 465 for SSL) is allowed
- Try alternative ports: 587, 465, 2525
- Check DigitalOcean firewall settings

### Issue 5: Email Going to Spam
**Symptom:** Email sent successfully but user doesn't receive
**Solution:**
- Check spam/junk folder
- Verify SPF records for your domain
- Consider using dedicated email service (SendGrid, Mailgun, AWS SES)

## 🔍 Quick Diagnostic Command
Add this to the frontend to see the full response:

```typescript
// In GetStartedPage.tsx, after line 350:
console.log('📧 Email Status:', {
  emailSent: response?.data?.emailSent,
  fullResponse: JSON.stringify(response, null, 2)
});
```

## 📝 What to Check Next

### Priority 1: Backend Logs
```bash
# SSH into DigitalOcean and run:
pm2 logs backend --lines 200 | grep -A 10 -B 5 "olukoyaseyifunmi@gmail.com"
```

This will show:
1. If email sending was attempted
2. If it succeeded or failed
3. What error occurred (if any)

### Priority 2: Test Email Configuration
```bash
# In DigitalOcean console:
cd /workspace/backend
node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transport.verify((err, success) => {
  if (err) console.error('❌ SMTP Error:', err);
  else console.log('✅ SMTP Config Valid:', success);
});
"
```

### Priority 3: Check Database
```sql
-- Check if application was created
SELECT id, email, "createdAt", status 
FROM onboarding_applications 
WHERE email = 'olukoyaseyifunmi@gmail.com'
ORDER BY "createdAt" DESC 
LIMIT 1;
```

## 🎯 Expected Flow

### Successful Email Flow:
```
1. User submits application
2. Backend creates application record
3. Backend attempts to send email
4. Email sent successfully
5. Backend returns emailSent: true
6. Frontend shows: "A confirmation email has been sent to..."
7. User receives email in inbox
```

### Failed Email Flow:
```
1. User submits application
2. Backend creates application record
3. Backend attempts to send email
4. Email fails (SMTP error)
5. Backend returns emailSent: false
6. Frontend shows warning toast
7. User contacts support
```

## 🛠️ Immediate Actions Required

1. **Check what toast message appeared** - This tells us if emailSent was true/false
2. **Check backend logs** - Shows actual email sending attempts and errors
3. **Verify SMTP env vars** - Ensure they're set in production
4. **Test SMTP connection** - Run verification command above

## 📞 If Issue Persists

Contact information to provide when requesting help:
- Application ID from database
- Backend logs (last 200 lines)
- SMTP configuration (without password)
- Which toast message appeared
- Full console response data object

---

**Created:** November 17, 2025  
**Status:** Under Investigation  
**Priority:** High

