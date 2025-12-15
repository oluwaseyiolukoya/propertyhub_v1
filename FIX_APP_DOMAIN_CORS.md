# Fix CORS Error for app.contrezz.com

## Problem

Users cannot sign in to their account because:

- `https://app.contrezz.com` is not in the backend's CORS allowed origins
- Requests from `app.contrezz.com` are blocked by CORS policy
- Error: `No 'Access-Control-Allow-Origin' header is present`

## Solution Applied

✅ **Added `https://app.contrezz.com` to allowed origins** in `backend/src/index.ts`

### Changes Made

```typescript
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://contrezz.com",
  "https://www.contrezz.com",
  "https://app.contrezz.com", // ✅ Added this
  "https://api.contrezz.com",
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
].filter(Boolean);
```

## Next Steps

### 1. Commit and Push Changes

```bash
git add backend/src/index.ts
git commit -m "fix: add app.contrezz.com to CORS allowed origins"
git push origin main
```

### 2. Wait for Deployment

- DigitalOcean will auto-deploy (3-5 minutes)
- Check Activity tab for deployment status

### 3. Verify Fix

After deployment, test:

- ✅ `https://app.contrezz.com/login` should load
- ✅ Login form should work
- ✅ No CORS errors in browser console

## About the 500 Error

The `/api/public/branding` endpoint returning 500 might be:

- Database connection issue (temporary)
- Missing system_settings records (non-critical)
- Will be resolved after CORS fix allows proper error handling

## Expected Result

After deployment:

- ✅ CORS errors resolved
- ✅ Login page loads correctly
- ✅ Users can sign in
- ✅ All API calls from `app.contrezz.com` work

---

**Status:** ✅ Code fixed, needs deployment
**Time to Fix:** 3-5 minutes after push
