# 🚨 Fix: KYC Submission 500 Error in Production

## 📋 Problem

When users try to submit KYC verification in production, they get:

```
Failed to submit verification
500 Internal Server Error from /api/verification/kyc/submit
```

---

## 🔍 Root Cause

The **main backend** (`contrezz-backend-prod`) is missing environment variables to communicate with the **verification service**:

- `VERIFICATION_SERVICE_URL` - URL of the verification microservice
- `VERIFICATION_API_KEY` - API key for authentication

Without these, the backend cannot reach the verification service, causing a 500 error.

---

## ✅ Solution: Add Environment Variables to Main Backend

### **Step 1: Get Verification Service URL**

1. Go to: https://cloud.digitalocean.com/apps
2. Click on **`verification-service`** (or your verification app name)
3. Copy the **App URL** (e.g., `https://contrezz-verification-service-8ghq7.ondigitalocean.app`)

---

### **Step 2: Get API Key**

The API key was generated during setup. Use the same key that's in your verification service:

```
vkey_fd6967cc3dbc5d1650b21b580df6f8f49cb7ddd79f1abd04
```

**⚠️ Important:** This must match the `API_KEY_MAIN_DASHBOARD` in your verification service!

**To verify the key in verification service:**

1. Go to DigitalOcean → `verification-service` → Settings → Environment Variables
2. Find `API_KEY_MAIN_DASHBOARD`
3. Use the **same value** for `VERIFICATION_API_KEY` in main backend

---

### **Step 3: Add Environment Variables to Main Backend**

1. Go to: https://cloud.digitalocean.com/apps
2. Click on **`contrezz-backend-prod`** (your main backend app)
3. Go to **Settings** → **App-Level Environment Variables**
4. Add these two variables:

**Variable 1:**

```
Name: VERIFICATION_SERVICE_URL
Value: https://contrezz-verification-service-8ghq7.ondigitalocean.app
```

**Variable 2:**

```
Name: VERIFICATION_API_KEY
Value: vkey_fd6967cc3dbc5d1650b21b580df6f8f49cb7ddd79f1abd04
```

5. Click **"Save"**
6. DigitalOcean will automatically redeploy the app (wait 2-3 minutes)

---

## 🧪 Test the Fix

### **Step 1: Log in as a Customer**

1. Go to `https://contrezz.com/signin`
2. Log in with a temporary password (from activation email)

### **Step 2: Submit KYC**

1. You should see the KYC verification page
2. Click **"Start Verification"** or **"Submit"**
3. **Expected:** Success message, no 500 error
4. **Not:** "Failed to submit verification"

### **Step 3: Verify in Backend Logs**

Check DigitalOcean runtime logs for:

```
[VerificationClient] Submitting verification for customer <id>
[VerificationClient] ✅ Verification submitted: <requestId>
[KYC] Verification request created: <requestId>
```

---

## 🔍 How the Flow Works

```
User (Frontend)
    ↓
Main Backend (/api/verification/kyc/submit)
    ↓ (uses VERIFICATION_SERVICE_URL + VERIFICATION_API_KEY)
Verification Service (/api/verification/submit)
    ↓
Creates verification request in verification DB
    ↓
Returns requestId to main backend
    ↓
Main backend updates customer.kycStatus = 'in_progress'
    ↓
Success response to frontend
```

---

## 📝 Environment Variables Summary

### **Main Backend (`contrezz-backend-prod`) Needs:**

```bash
VERIFICATION_SERVICE_URL=https://contrezz-verification-service-8ghq7.ondigitalocean.app
VERIFICATION_API_KEY=vkey_fd6967cc3dbc5d1650b21b580df6f8f49cb7ddd79f1abd04
FRONTEND_URL=https://contrezz.com
```

### **Verification Service Already Has:**

```bash
DATABASE_URL=<verification-db-connection-string>
REDIS_URL=<valkey-connection-string>
SPACES_ACCESS_KEY_ID=<spaces-key>
SPACES_SECRET_ACCESS_KEY=<spaces-secret>
API_KEY_MAIN_DASHBOARD=vkey_fd6967cc3dbc5d1650b21b580df6f8f49cb7ddd79f1abd04
```

---

## 🚨 Common Mistakes to Avoid

❌ **Don't add trailing slashes:**

```
VERIFICATION_SERVICE_URL=https://...app/  ❌ WRONG
```

✅ **Correct format:**

```
VERIFICATION_SERVICE_URL=https://...app  ✅ CORRECT
```

❌ **Don't mix up the API keys:**

- Main backend uses: `VERIFICATION_API_KEY`
- Verification service uses: `API_KEY_MAIN_DASHBOARD`
- They should have the **same value**!

---

## 🔍 Troubleshooting

### **Issue: Still getting 500 error after adding variables**

**Solution:**

1. Verify the environment variables are saved in DigitalOcean
2. Check the deployment logs to ensure the app restarted
3. Verify the verification service is running:
   ```bash
   curl https://contrezz-verification-service-8ghq7.ondigitalocean.app/health
   ```
4. Check main backend logs for connection errors

### **Issue: "Invalid API key" error**

**Solution:**

1. Verify both services have the same API key
2. Check for typos or extra spaces
3. Regenerate the API key if needed:
   ```sql
   UPDATE api_keys
   SET key = 'vkey_newkey123...'
   WHERE name = 'main_dashboard';
   ```

### **Issue: "Connection timeout" error**

**Solution:**

1. Verify the verification service URL is correct
2. Check if the verification service is healthy
3. Ensure both services are in the same region (NYC3)

---

## ✅ Verification Checklist

After adding the environment variables:

- [ ] `VERIFICATION_SERVICE_URL` is set in main backend
- [ ] `VERIFICATION_API_KEY` is set in main backend
- [ ] `FRONTEND_URL` is set to `https://contrezz.com`
- [ ] Main backend has been redeployed
- [ ] Verification service is running and healthy
- [ ] Test KYC submission works without 500 error
- [ ] Check backend logs for successful verification submission
- [ ] Verify requestId is created in verification database

---

## 📚 Related Files

- **Main Backend Route:** `backend/src/routes/verification.ts` (line 156-216)
- **Verification Client:** `backend/src/services/verification-client.service.ts` (line 14-15, 38-62)
- **Verification Service:** `verification-service/src/routes/verification.ts`

---

**Last Updated:** November 26, 2025
**Status:** Ready to deploy
**Priority:** CRITICAL - Blocks user onboarding and KYC verification
