# 🔧 Fix Email Login URL to Production

## 📋 Problem
Activation emails contain login links pointing to `localhost` instead of production URL (`https://contrezz.com/signin`).

---

## ✅ Solution: Update Environment Variable in DigitalOcean

### **Step 1: Go to DigitalOcean App Platform**

1. Navigate to: https://cloud.digitalocean.com/apps
2. Click on your **`contrezz-backend-prod`** app

---

### **Step 2: Update Environment Variables**

1. Click on **"Settings"** tab
2. Scroll to **"App-Level Environment Variables"**
3. Look for `FRONTEND_URL` variable:
   - **If it exists:** Click "Edit" and update the value
   - **If it doesn't exist:** Click "Add Variable" to create it

4. Set the value to:
   ```
   https://contrezz.com
   ```

5. **Important:** Make sure there's **NO trailing slash** (`/`)

---

### **Step 3: Save and Redeploy**

1. Click **"Save"**
2. DigitalOcean will automatically redeploy your app
3. Wait 2-3 minutes for the deployment to complete

---

## 🧪 Test the Fix

### **Step 1: Create a Test User**

1. Go to your admin dashboard
2. Navigate to **Onboarding Applications**
3. Find a pending application
4. Click **"Activate"**

### **Step 2: Check the Email**

1. Open the activation email sent to the user
2. Click the **"Login to Your Account"** button
3. **Expected:** Should redirect to `https://contrezz.com/signin`
4. **Not:** `http://localhost:5173/signin`

---

## 📝 Current Code (Already Correct!)

The code in `backend/src/lib/email.ts` is already set up correctly:

```typescript
const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
const loginUrl = params.loginUrl || `${frontendBase}/signin`;
```

**How it works:**
- Uses `process.env.FRONTEND_URL` if set (production)
- Falls back to `http://localhost:5173` for local development
- Automatically appends `/signin` to the base URL

---

## ✅ Verification Checklist

After updating the environment variable:

- [ ] `FRONTEND_URL` is set to `https://contrezz.com` in DigitalOcean
- [ ] No trailing slash in the URL
- [ ] App has been redeployed
- [ ] Test activation email sent
- [ ] Login button redirects to `https://contrezz.com/signin`
- [ ] User can successfully log in with temporary password

---

## 🚨 Common Mistakes to Avoid

❌ **Don't include `/signin` in the environment variable**
```
FRONTEND_URL=https://contrezz.com/signin  ❌ WRONG
```

✅ **Correct format:**
```
FRONTEND_URL=https://contrezz.com  ✅ CORRECT
```

The code automatically appends `/signin` when needed.

---

## 🔍 Troubleshooting

### **Issue: Email still shows localhost after update**

**Solution:**
1. Verify the environment variable is saved in DigitalOcean
2. Check the deployment logs to ensure the app restarted
3. Try a hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
4. Clear browser cache

### **Issue: 404 error when clicking login button**

**Solution:**
1. Ensure your frontend is deployed at `https://contrezz.com`
2. Verify the `/signin` route exists in your frontend
3. Check DNS settings for `contrezz.com`

---

## 📚 Related Files

- **Email Template:** `backend/src/lib/email.ts` (line 1463-1600)
- **Onboarding Service:** `backend/src/services/onboarding.service.ts`
- **Environment Example:** `backend/.env.example`

---

**Last Updated:** November 26, 2025
**Status:** Ready to deploy
**Priority:** HIGH - Affects user onboarding experience



