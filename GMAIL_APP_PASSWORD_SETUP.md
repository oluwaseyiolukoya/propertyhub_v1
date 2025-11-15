# Gmail App-Specific Password Setup Guide

## 🔍 **Current Issue**

Gmail authentication is failing because you're using your regular Gmail password instead of an App-Specific Password.

**Error:**
```
❌ Invalid login: 535-5.7.8 Username and Password not accepted
```

**Gmail Security:** Gmail requires App-Specific Passwords for third-party applications (like Nodemailer) for security reasons.

---

## ✅ **Solution: Create Gmail App-Specific Password**

### **Step 1: Enable 2-Step Verification** (if not already enabled)

1. Go to: https://myaccount.google.com/security
2. Click on **"2-Step Verification"**
3. Follow the prompts to enable it
4. Verify with your phone number

**Note:** You MUST have 2-Step Verification enabled to create App-Specific Passwords.

---

### **Step 2: Create App-Specific Password**

1. **Go to:** https://myaccount.google.com/apppasswords
   
2. **Sign in** to your Gmail account (infokitcon@gmail.com)

3. **Select App:** Choose **"Mail"**

4. **Select Device:** Choose **"Other (Custom name)"**

5. **Enter Name:** Type **"Contrezz Platform"**

6. **Click "Generate"**

7. **Copy the Password:** You'll see a 16-character password like:
   ```
   abcd efgh ijkl mnop
   ```
   
8. **Important:** Copy this password immediately (you won't see it again!)

---

### **Step 3: Update .env File**

**Open the .env file:**
```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
nano .env
```

**Update SMTP_PASS with the App-Specific Password:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=infokitcon@gmail.com
SMTP_PASS=abcdefghijklmnop  # ← Replace with your 16-char password (no spaces)
SMTP_FROM=infokitcon@gmail.com
```

**Important:** Remove all spaces from the password when pasting!

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

---

### **Step 4: Restart Backend**

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend
pkill -f "tsx.*src/index.ts"
npm run dev
```

---

### **Step 5: Test Email Connection**

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend

# Test connection
node test-gmail-direct.js
```

**Expected Output:**
```
✅ Gmail connection successful!
✅ Ready to send emails.
```

---

### **Step 6: Test Sending Email**

```bash
# Get admin token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@contrezz.com","password":"admin123","userType":"admin"}' \
  -s | jq -r '.token')

# Send test email to yourself
curl -X POST http://localhost:5000/api/email-test/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"infokitcon@gmail.com"}' \
  -s | jq .
```

**Expected Output:**
```json
{
  "success": true,
  "message": "Test email sent successfully! Check your inbox.",
  "messageId": "..."
}
```

---

## 🎯 **Quick Reference**

### **Gmail SMTP Settings:**
```
Host: smtp.gmail.com
Port: 587
Secure: false (use STARTTLS)
User: infokitcon@gmail.com
Pass: [16-character App-Specific Password]
```

### **Links:**
- **Enable 2-Step Verification:** https://myaccount.google.com/security
- **Create App Password:** https://myaccount.google.com/apppasswords
- **Gmail Help:** https://support.google.com/mail/?p=BadCredentials

---

## ⚠️ **Important Notes**

1. **App-Specific Password is NOT your regular Gmail password**
2. **You need 2-Step Verification enabled first**
3. **Remove all spaces from the password when pasting**
4. **The password is 16 characters long**
5. **You can create multiple app passwords for different apps**
6. **You can revoke app passwords anytime**

---

## 🔐 **Security**

**App-Specific Passwords are secure because:**
- They're unique to each application
- They can be revoked without changing your main password
- They don't give access to your full Google account
- They're randomly generated and hard to guess

---

## 📝 **Troubleshooting**

### **Issue: "App passwords" option not showing**

**Solution:**
1. Enable 2-Step Verification first
2. Wait a few minutes
3. Refresh the page
4. Try again

### **Issue: Still getting authentication error**

**Solution:**
1. Make sure you copied the password correctly (no spaces)
2. Make sure you're using the App-Specific Password, not your regular password
3. Restart the backend after updating .env
4. Test connection again

### **Issue: "Less secure app access" message**

**Solution:**
- Gmail no longer supports "Less secure apps"
- You MUST use App-Specific Passwords
- This is a security requirement from Google

---

## ✅ **Checklist**

- [ ] 2-Step Verification enabled
- [ ] App-Specific Password created
- [ ] Password copied (16 characters, no spaces)
- [ ] .env file updated with App-Specific Password
- [ ] Backend restarted
- [ ] Connection test successful
- [ ] Test email received

---

## 🚀 **After Setup**

Once Gmail is working, you can:

1. **Create customers** - They'll receive invitation emails
2. **Test with your own email** - Verify emails are formatted correctly
3. **Switch back to Namecheap** - Once network issues are resolved
4. **Keep Gmail as backup** - For testing and development

---

**Status:** ⏳ **WAITING FOR APP-SPECIFIC PASSWORD**

**Next Action:** Create Gmail App-Specific Password and update .env! 🔑

