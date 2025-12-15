# Fix 404 Errors for API Routes

## Problem

After login, API calls to `/api/users`, `/api/customers`, `/api/plans`, `/api/roles` are returning 404 errors.

## Root Causes

1. **Backend run command incorrect** - `.do/app.yaml` references `dist/server.js` but should be `dist/index.js`
2. **Routes require admin access** - All these routes have `adminOnly` middleware
3. **Possible DNS/routing issue** - `api.app.contrezz.com` might not be correctly configured

## Fixes Applied

### ✅ Fix 1: Correct Backend Run Command

**Changed:** `.do/app.yaml`

- **From:** `run_command: cd backend && node dist/server.js`
- **To:** `run_command: cd backend && node dist/index.js`

This matches `backend/package.json` which specifies `"main": "dist/index.js"`.

### ⚠️ Fix 2: Verify User Has Admin Access

The routes `/api/users`, `/api/customers`, `/api/plans`, `/api/roles` all require:

- `authMiddleware` - User must be authenticated ✅ (login works)
- `adminOnly` - User must be an admin ⚠️ (might be the issue)

**Check:**

1. What role does the logged-in user have?
2. Is the user an internal admin (`customerId = null`) or customer user?

**If user is not admin:**

- These routes will return **403 Forbidden**, not 404
- But if routes aren't found, it could return 404

### ⚠️ Fix 3: Verify DNS Configuration

**Check that `api.app.contrezz.com` points to the backend service:**

```bash
dig api.app.contrezz.com +short
```

**Should resolve to:** The DigitalOcean backend service domain (e.g., `contrezz-backend-prod-xxxxx.ondigitalocean.app`)

**In Namecheap DNS:**

- `api.app` CNAME → `contrezz-backend-prod-xxxxx.ondigitalocean.app`

**In DigitalOcean:**

- Backend service should have `api.app.contrezz.com` as a custom domain

## Next Steps

### 1. Commit and Push Fix

```bash
git add .do/app.yaml backend/src/index.ts
git commit -m "fix: correct backend run command and add app.contrezz.com to CORS"
git push origin main
```

### 2. Verify Backend is Running

After deployment, check backend logs:

- DigitalOcean → App → Activity → View logs
- Should see: `🚀 Server running on port 5000`
- Should see route registrations in logs

### 3. Test API Endpoints Directly

After deployment, test with curl:

```bash
# Get auth token first (from login)
TOKEN="your-jwt-token"

# Test users endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://api.app.contrezz.com/api/users

# Test customers endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://api.app.contrezz.com/api/customers

# Test plans endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://api.app.contrezz.com/api/plans

# Test roles endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://api.app.contrezz.com/api/roles
```

**Expected responses:**

- ✅ **200 OK** with data - Routes work, user has admin access
- ✅ **403 Forbidden** - Routes work, but user is not admin
- ❌ **404 Not Found** - Routes not found (deployment issue)
- ❌ **401 Unauthorized** - Token invalid/expired

### 4. Check User Role

If getting 403 errors, verify the logged-in user is an admin:

**In browser console after login:**

```javascript
// Check user data
const user = JSON.parse(localStorage.getItem("user_data"));
console.log("User role:", user?.role);
console.log("Is admin:", user?.role?.includes("admin"));
```

**Or check backend logs:**

- Look for: `✅ Admin access granted` or `❌ Admin access denied`

## Debugging Steps

### If Still Getting 404:

1. **Check backend deployment:**

   - DigitalOcean → App → Activity
   - Verify backend service deployed successfully
   - Check for build/start errors

2. **Check backend logs:**

   - DigitalOcean → App → Runtime Logs
   - Look for route registration messages
   - Look for errors on startup

3. **Verify routes are registered:**

   - Backend logs should show routes being mounted
   - Check that `/api/users`, `/api/customers`, etc. are in the logs

4. **Test health endpoint:**

   ```bash
   curl https://api.app.contrezz.com/api/health
   ```

   - Should return `{"status":"ok"}` if backend is running

5. **Check DNS:**
   ```bash
   dig api.app.contrezz.com +short
   nslookup api.app.contrezz.com
   ```

## Expected Result

After fixes:

- ✅ Backend runs with correct entry point
- ✅ Routes are accessible
- ✅ Admin users can access `/api/users`, `/api/customers`, etc.
- ✅ Non-admin users get 403 (not 404)

---

**Status:** ✅ Code fixed, needs deployment and verification
**Time to Fix:** 5-10 minutes after deployment
