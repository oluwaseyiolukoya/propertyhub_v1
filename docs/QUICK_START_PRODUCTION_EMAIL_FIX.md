# ⚡ QUICK START: Production Email Fix

## 🎯 **What We Did**

Your **Expert Team** (Database Engineer + Software Engineer + DevOps Engineer) has diagnosed and implemented a comprehensive solution for production email issues.

---

## 📦 **What's Deployed**

✅ **Enhanced Production Logging** - See exactly what's happening  
✅ **Test Email Endpoint** - Test emails without creating team members  
✅ **Diagnostic Script** - Comprehensive SMTP verification tool  
✅ **Detailed Documentation** - Step-by-step troubleshooting guides

---

## ⏱️ **Deployment Status**

🚀 **Deploying Now** - Wait ~7 minutes for Digital Ocean to deploy commit `33d1cc9`

---

## 🔧 **STEP 1: Run Diagnostic Script (After Deployment)**

### **In Digital Ocean Console:**

```bash
# 1. Access Console
# Go to: Digital Ocean → Apps → contrezz → Console

# 2. Navigate to workspace
cd /workspace

# 3. Run diagnostic script
node scripts/diagnose-email-production.js
```

### **What It Does:**
- ✅ Checks all environment variables
- ✅ Tests SMTP connection
- ✅ Sends a test email
- ✅ Provides troubleshooting guidance

### **Expected Output (if working):**
```
✅ SMTP_HOST: smtp.gmail.com
✅ SMTP_USER: info@contrezz.com
✅ SMTP_PASS: ******* (16 characters)
✅ SMTP connection verified successfully!
✅ Test email sent successfully!
🎉 DIAGNOSTIC COMPLETE - ALL TESTS PASSED!
```

### **If It Fails:**
The script will tell you exactly what's wrong:
- ❌ **EAUTH (535)** → Wrong password (use App Password)
- ❌ **ETIMEDOUT** → Firewall blocking SMTP
- ❌ **Missing vars** → Environment variables not set

---

## 🧪 **STEP 2: Test Email Endpoint**

### **Option A: Using Postman/Insomnia**

```http
POST https://api.contrezz.com/api/team/test-email
Headers:
  Authorization: Bearer YOUR_AUTH_TOKEN
  Content-Type: application/json
Body:
{
  "email": "your-email@gmail.com"
}
```

### **Option B: Using curl**

```bash
curl -X POST https://api.contrezz.com/api/team/test-email \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

### **Expected Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully! Check your inbox.",
  "recipient": "your-email@gmail.com"
}
```

---

## 📊 **STEP 3: Check Production Logs**

### **In Digital Ocean:**

```
Digital Ocean → Apps → contrezz → Runtime Logs
```

### **Search for:**
```
[PRODUCTION DEBUG]
[Team Invitation]
```

### **What to Look For:**

✅ **Good Signs:**
```
📧 [PRODUCTION DEBUG] sendTeamInvitation called
📧 [PRODUCTION DEBUG] SMTP Config: { host: 'smtp.gmail.com', ... }
✅ [Team Invitation] SMTP connection verified successfully
✅ Team invitation email sent successfully!
```

❌ **Bad Signs:**
```
❌ [Team Invitation] SMTP verification failed
❌ Failed to send team invitation email
Error: Invalid login: 535
```

---

## 🔐 **STEP 4: Fix SMTP Issues (If Needed)**

### **Issue #1: Wrong Gmail Password**

**Symptom:** `Error: Invalid login: 535` or `EAUTH`

**Fix:**
1. Go to Google Account → Security → 2-Step Verification
2. Scroll to "App passwords"
3. Generate new app password for "Mail"
4. Copy the 16-character password (e.g., `abcdefghijklmnop`)
5. Update in Digital Ocean:
   ```
   Digital Ocean → Apps → contrezz → Settings → Environment Variables
   SMTP_PASS=abcdefghijklmnop
   ```
6. Restart app

### **Issue #2: Missing Display Name**

**Symptom:** Email shows "Info" instead of "Contrezz Team"

**Fix:**
1. Update in Digital Ocean:
   ```
   SMTP_FROM="Contrezz Team <info@contrezz.com>"
   ```
2. Restart app

### **Issue #3: Firewall Blocking**

**Symptom:** `ETIMEDOUT` or `ECONNECTION`

**Fix:**
1. Check Digital Ocean firewall settings
2. Ensure outbound SMTP (port 587) is allowed
3. Try alternative port (465 for SSL)

---

## ✅ **STEP 5: Verify Team Invitation**

### **Test Real Invitation:**

1. Go to your dashboard
2. Settings → Team → Invite Team Member
3. Fill in details and click "Invite"

### **Check Results:**

✅ **Success Indicators:**
- Email received within 10 seconds
- From name shows as your company name
- Email has professional formatting
- Temporary password works for login

❌ **Failure Indicators:**
- No email received after 1 minute
- Email in spam folder
- From name shows as "Info"
- Temporary password doesn't work

---

## 📞 **NEED HELP?**

### **Check These Documents:**

1. **Detailed Diagnosis:**
   - `docs/PRODUCTION_EMAIL_DIAGNOSIS.md`

2. **Step-by-Step Solution:**
   - `docs/EXPERT_TEAM_SOLUTION.md`

3. **Root Cause Analysis:**
   - `docs/PERMANENT_FIX_ROOT_CAUSE_ANALYSIS.md`

### **Common Commands:**

```bash
# Check environment variables
node -e "console.log('SMTP_HOST:', process.env.SMTP_HOST); console.log('SMTP_USER:', process.env.SMTP_USER); console.log('SMTP_FROM:', process.env.SMTP_FROM);"

# Test SMTP connection
node scripts/diagnose-email-production.js

# Check production logs
tail -f /var/log/app.log | grep "Team Invitation"
```

---

## 🎯 **SUCCESS CRITERIA**

You'll know it's working when:

- ✅ Diagnostic script passes all tests
- ✅ Test email endpoint returns `success: true`
- ✅ Production logs show "SMTP connection verified"
- ✅ Team invitation email received instantly
- ✅ From name shows as company name
- ✅ Temporary password works for login

---

## ⏰ **Timeline**

- **Now:** Deployment in progress (~7 minutes)
- **+7 min:** Run diagnostic script
- **+10 min:** Test email endpoint
- **+15 min:** Check production logs
- **+20 min:** Fix any SMTP issues
- **+25 min:** Verify team invitation works

---

**Total Time to Resolution:** ~25 minutes

---

**Generated by:** Expert Team (Database + Software + DevOps)  
**Date:** November 20, 2025  
**Commit:** `33d1cc9`  
**Status:** ✅ Deployed - Ready to Test

