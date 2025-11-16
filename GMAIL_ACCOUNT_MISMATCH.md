# Gmail Account Mismatch Issue

## 🔍 **Issue**

The App-Specific Password you created doesn't match the Gmail account in your .env file.

**Current .env:**

```
SMTP_USER=cmpmediapartners@gmail.com
SMTP_PASS=cijlxglqlbshimt
```

**Error:**

```
❌ Invalid login: 535-5.7.8 Username and Password not accepted
```

---

## 🎯 **Root Cause**

The App-Specific Password must be created for the **same Gmail account** you're using to send emails.

**Possible scenarios:**

1. You created the App-Specific Password for `infokitcon@gmail.com` but .env uses `cmpmediapartners@gmail.com`
2. 2-Step Verification is not enabled for `cmpmediapartners@gmail.com`
3. The App-Specific Password was created for a different account

---

## ✅ **Solution**

### **Option 1: Create App-Specific Password for cmpmediapartners@gmail.com** (Recommended)

**Step 1: Enable 2-Step Verification**

1. Go to: https://myaccount.google.com/security
2. **Sign in with `cmpmediapartners@gmail.com`**
3. Click "2-Step Verification"
4. Follow the prompts to enable it

**Step 2: Create App-Specific Password**

1. Go to: https://myaccount.google.com/apppasswords
2. **Make sure you're signed in as `cmpmediapartners@gmail.com`**
3. Click "Generate"
4. Select "Mail" and "Other (Custom name)"
5. Enter "Contrezz Platform"
6. Click "Generate"
7. **Copy the 16-character password** (remove all spaces)
8. Update .env:
   ```bash
   cd backend
   nano .env
   ```
   Update:
   ```env
   SMTP_PASS=your16charpassword  # No spaces!
   ```

**Step 3: Restart Backend**

```bash
pkill -f "tsx.*src/index.ts"
npm run dev
```

**Step 4: Test**

```bash
node test-env-smtp.js
```

---

### **Option 2: Use infokitcon@gmail.com** (Alternative)

If you already created an App-Specific Password for `infokitcon@gmail.com`, update .env to use that account:

```bash
cd backend
nano .env
```

Update:

```env
SMTP_USER=infokitcon@gmail.com
SMTP_PASS=your16charpassword
SMTP_FROM=infokitcon@gmail.com
```

**Restart backend:**

```bash
pkill -f "tsx.*src/index.ts"
npm run dev
```

**Test:**

```bash
node test-env-smtp.js
```

---

## 🔍 **How to Verify Which Account You're Using**

**Check which Gmail account you're signed into:**

1. Go to: https://myaccount.google.com
2. Look at the email address in the top right
3. Make sure it matches `SMTP_USER` in your .env

**If you're signed into multiple Gmail accounts:**

1. Click your profile picture
2. Switch to the correct account
3. Then create the App-Specific Password

---

## 🧪 **Testing**

After updating the .env with the correct App-Specific Password:

```bash
cd backend

# Test connection
node test-env-smtp.js
```

**Expected Output:**

```
✅ SMTP connection successful!
✅ Email server is ready to send emails.
🎉 You can now send invitation emails to customers!
```

**If it still fails:**

1. Double-check you're using the correct Gmail account
2. Verify 2-Step Verification is enabled
3. Make sure you copied the password correctly (no spaces)
4. Try creating a new App-Specific Password

---

## 📝 **Quick Checklist**

- [ ] Know which Gmail account you want to use
- [ ] Sign in to that Gmail account
- [ ] Enable 2-Step Verification for that account
- [ ] Create App-Specific Password for that account
- [ ] Update .env with matching email and password
- [ ] Remove all spaces from password
- [ ] Restart backend
- [ ] Test connection

---

## 🎯 **Recommendation**

**Use `cmpmediapartners@gmail.com`** since it's already in your .env:

1. Sign in to https://myaccount.google.com/apppasswords as `cmpmediapartners@gmail.com`
2. Enable 2-Step Verification if not already enabled
3. Create App-Specific Password
4. Update `SMTP_PASS` in .env
5. Restart backend
6. Test

---

**Status:** ⏳ **WAITING FOR CORRECT APP-SPECIFIC PASSWORD**

**Next Action:** Create App-Specific Password for `cmpmediapartners@gmail.com` or switch to `infokitcon@gmail.com`




