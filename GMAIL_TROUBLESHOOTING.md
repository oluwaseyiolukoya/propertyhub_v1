# Gmail SMTP Troubleshooting - Step by Step

## 🔴 **Current Status**

**Still failing with:**
```
❌ Invalid login: 535-5.7.8 Username and Password not accepted
Error Code: EAUTH
```

**Current Configuration:**
```
SMTP_USER=cmpmediapartners@gmail.com
SMTP_PASS=cijlxglqlbshimt
```

---

## 🎯 **Root Cause**

The App-Specific Password `cijlxglqlbshimt` is **NOT valid** for `cmpmediapartners@gmail.com`.

**This happens when:**
1. ❌ 2-Step Verification is not enabled for `cmpmediapartners@gmail.com`
2. ❌ The password was created for a different Gmail account
3. ❌ The password was copied incorrectly
4. ❌ The password was revoked or expired

---

## ✅ **Solution: Create New App-Specific Password**

### **Step 1: Verify 2-Step Verification**

1. **Open:** https://myaccount.google.com/security
2. **Sign in** with `cmpmediapartners@gmail.com`
3. **Look for:** "2-Step Verification" section
4. **Check status:**
   - ✅ If it says "On" → Go to Step 2
   - ❌ If it says "Off" → Click it and enable it first

**To Enable 2-Step Verification:**
- Click "2-Step Verification"
- Click "Get Started"
- Enter your phone number
- Verify with SMS code
- Click "Turn On"

---

### **Step 2: Create App-Specific Password**

1. **Open:** https://myaccount.google.com/apppasswords
2. **Sign in** with `cmpmediapartners@gmail.com`
3. **Verify you're on the right account** (check email in top right)
4. **Click:** "Select app" dropdown
5. **Choose:** "Mail"
6. **Click:** "Select device" dropdown
7. **Choose:** "Other (Custom name)"
8. **Type:** "Contrezz Platform"
9. **Click:** "Generate"
10. **You'll see a 16-character password like:**
    ```
    abcd efgh ijkl mnop
    ```
11. **Copy it** (you won't see it again!)

---

### **Step 3: Update .env File**

**Open .env:**
```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
nano .env
```

**Find this line:**
```env
SMTP_PASS=cijlxglqlbshimt
```

**Replace with your new password (REMOVE ALL SPACES):**
```env
SMTP_PASS=abcdefghijklmnop
```

**Example:**
If Google shows: `abcd efgh ijkl mnop`
You type: `abcdefghijklmnop` (no spaces!)

**Save:**
- Press `Ctrl+X`
- Press `Y`
- Press `Enter`

---

### **Step 4: Restart Backend**

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
pkill -f "tsx.*src/index.ts"
sleep 2
npm run dev
```

---

### **Step 5: Test Connection**

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
node test-env-smtp.js
```

**Expected Output:**
```
🔍 Testing SMTP with .env configuration...
📧 Host: smtp.gmail.com
📧 Port: 587
📧 User: cmpmediapartners@gmail.com
📧 Pass: abcd***

✅ SMTP connection successful!
✅ Email server is ready to send emails.
🎉 You can now send invitation emails to customers!
```

---

## 🔍 **Common Mistakes**

### **Mistake 1: Wrong Gmail Account**
❌ Creating App-Specific Password while signed into `infokitcon@gmail.com`
✅ Must be signed into `cmpmediapartners@gmail.com`

**How to check:**
- Go to: https://myaccount.google.com
- Look at email in top right corner
- Should say: `cmpmediapartners@gmail.com`

### **Mistake 2: Spaces in Password**
❌ `abcd efgh ijkl mnop` (with spaces)
✅ `abcdefghijklmnop` (no spaces)

### **Mistake 3: 2-Step Verification Not Enabled**
❌ Trying to create App-Specific Password without 2-Step Verification
✅ Enable 2-Step Verification first, then create password

### **Mistake 4: Using Regular Password**
❌ Using `Korede@198800` (your regular Gmail password)
✅ Using 16-character App-Specific Password

---

## 🆘 **If Still Not Working**

### **Option 1: Use Different Gmail Account**

If `cmpmediapartners@gmail.com` doesn't have 2-Step Verification or you can't enable it, use a different account:

**Update .env to use infokitcon@gmail.com:**
```env
SMTP_USER=infokitcon@gmail.com
SMTP_PASS=your-app-specific-password-for-infokitcon
SMTP_FROM=infokitcon@gmail.com
```

### **Option 2: Use SendGrid (Free Tier)**

If Gmail continues to fail, use SendGrid (free 100 emails/day):

1. **Sign up:** https://signup.sendgrid.com/
2. **Create API Key:** Settings → API Keys → Create API Key
3. **Update .env:**
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   SMTP_FROM=cmpmediapartners@gmail.com
   ```

### **Option 3: Use Mailgun (Free Tier)**

Mailgun offers 5,000 free emails/month:

1. **Sign up:** https://signup.mailgun.com/
2. **Get SMTP credentials:** Sending → Domain Settings → SMTP Credentials
3. **Update .env:**
   ```env
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=postmaster@your-domain.mailgun.org
   SMTP_PASS=your-mailgun-password
   SMTP_FROM=cmpmediapartners@gmail.com
   ```

---

## 📋 **Verification Checklist**

Before testing, verify:

- [ ] Signed into correct Gmail account (`cmpmediapartners@gmail.com`)
- [ ] 2-Step Verification is enabled
- [ ] Created NEW App-Specific Password
- [ ] Copied password correctly (no spaces)
- [ ] Updated .env file with new password
- [ ] Saved .env file
- [ ] Restarted backend server
- [ ] Running test from correct directory

---

## 🎯 **Quick Test Commands**

```bash
# 1. Check current .env
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
grep SMTP_PASS .env

# 2. Restart backend
pkill -f "tsx.*src/index.ts"
npm run dev &

# 3. Test connection
sleep 3
node test-env-smtp.js

# 4. If successful, send test email
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@contrezz.com","password":"admin123","userType":"admin"}' \
  -s | jq -r '.token')

curl -X POST http://localhost:5000/api/email-test/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"cmpmediapartners@gmail.com"}' \
  -s | jq .
```

---

## 💡 **Pro Tip**

**For production, use a dedicated email service:**
- ✅ SendGrid (100 emails/day free)
- ✅ Mailgun (5,000 emails/month free)
- ✅ AWS SES (62,000 emails/month free)
- ❌ Gmail (limited to 500 emails/day, requires App-Specific Password)

---

**Status:** 🔴 **STILL FAILING - ACTION REQUIRED**

**Next Steps:**
1. Go to: https://myaccount.google.com/apppasswords
2. Sign in as `cmpmediapartners@gmail.com`
3. Create NEW App-Specific Password
4. Update .env with new password (no spaces!)
5. Restart backend
6. Test again

**Need help?** Let me know which step you're stuck on!





