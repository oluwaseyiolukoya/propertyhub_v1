# Fix Admin Login Issues on admin.contrezz.com

## Issues Identified

1. **CORS Error**: Admin frontend trying to fetch branding from `api.app.contrezz.com` (wrong API)
2. **SSL Error**: `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` on `api.contrezz.com`
3. **Missing CORS Origin**: `admin.contrezz.com` not in public backend's `ALLOWED_ORIGINS`

---

## Root Causes

### Issue 1: Wrong API URL for Branding

**Problem:**
- `usePlatformBranding.ts` and `PlatformLogo.tsx` use `VITE_API_URL` (points to `api.app.contrezz.com`)
- When accessed from `admin.contrezz.com`, these hooks try to fetch from the app backend
- App backend doesn't have CORS configured for `admin.contrezz.com`
- Public admin doesn't need app branding anyway (it's a separate system)

**Solution:**
- Detect admin domain and skip branding fetch
- Admin domain uses its own branding (default Contrezz logo)

### Issue 2: SSL Certificate Error

**Problem:**
- `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` on `https://api.contrezz.com`
- This indicates SSL/TLS certificate configuration issues

**Solution:**
- Check DigitalOcean SSL certificate status
- Verify custom domain is properly configured
- May need to regenerate SSL certificate

### Issue 3: Missing CORS Origin

**Problem:**
- Public backend's `ALLOWED_ORIGINS` only includes:
  - `https://contrezz.com`
  - `https://www.contrezz.com`
- Missing: `https://admin.contrezz.com`

**Solution:**
- Add `https://admin.contrezz.com` to `ALLOWED_ORIGINS` in:
  - `public-backend/.do/app.yaml` (for deployment)
  - DigitalOcean environment variables (for current deployment)

---

## Fixes Applied

### ✅ Fix 1: Skip Branding for Admin Domain

**Files Modified:**
- `src/hooks/usePlatformBranding.ts`
- `src/components/PlatformLogo.tsx`

**Changes:**
- Added admin domain detection
- Skip branding fetch when on admin domain
- Use default Contrezz logo/branding for admin interface

### ✅ Fix 2: Update CORS Configuration

**Files Modified:**
- `public-backend/.do/app.yaml`

**Changes:**
- Updated `ALLOWED_ORIGINS` to include `https://admin.contrezz.com`

**Next Step:**
- Update DigitalOcean environment variable for current deployment

---

## Deployment Steps

### Step 1: Update DigitalOcean Environment Variables

1. Go to DigitalOcean App Platform
2. Select `contrezz-public-api` app
3. Go to **Settings** → **App-Level Environment Variables**
4. Find `ALLOWED_ORIGINS`
5. Update value to:
   ```
   https://contrezz.com,https://www.contrezz.com,https://admin.contrezz.com
   ```
6. Click **Save**
7. App will automatically redeploy

### Step 2: Fix SSL Certificate (if needed)

1. Go to DigitalOcean App Platform
2. Select `contrezz-public-api` app
3. Go to **Settings** → **Domains**
4. Check status of `api.contrezz.com`
5. If certificate is invalid:
   - Remove the domain
   - Re-add it
   - Wait for SSL certificate to be provisioned (5-10 minutes)

**Alternative (if SSL still fails):**
- Check DNS records: `dig api.contrezz.com`
- Verify it points to the correct DigitalOcean app
- Ensure no conflicting DNS records

### Step 3: Deploy Frontend Changes

1. Commit and push the branding fixes:
   ```bash
   git add src/hooks/usePlatformBranding.ts src/components/PlatformLogo.tsx
   git commit -m "fix: skip branding fetch for admin domain"
   git push origin main
   ```

2. Frontend will auto-deploy (if configured)
   - Or manually trigger deployment in DigitalOcean

### Step 4: Verify Fixes

**Test Admin Login:**
1. Go to `https://admin.contrezz.com`
2. Open browser DevTools → Console
3. Verify no CORS errors
4. Verify no SSL errors
5. Try logging in

**Check API Health:**
```bash
# Test public API
curl https://api.contrezz.com/health

# Test admin auth endpoint
curl -X POST https://api.contrezz.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

**Verify CORS:**
```bash
curl -H "Origin: https://admin.contrezz.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://api.contrezz.com/api/admin/auth/login \
  -v
```

Should return `Access-Control-Allow-Origin: https://admin.contrezz.com`

---

## Environment Variables Reference

### Public Backend (DigitalOcean)

```env
ALLOWED_ORIGINS=https://contrezz.com,https://www.contrezz.com,https://admin.contrezz.com
```

### Frontend (DigitalOcean)

```env
VITE_PUBLIC_ADMIN_API_URL=https://api.contrezz.com/api/admin
```

---

## Troubleshooting

### If CORS errors persist:

1. **Check environment variable is set:**
   ```bash
   # In DigitalOcean console, verify ALLOWED_ORIGINS includes admin.contrezz.com
   ```

2. **Check backend logs:**
   ```bash
   # In DigitalOcean, go to Runtime Logs
   # Look for CORS-related errors
   ```

3. **Verify domain format:**
   - Must include protocol: `https://admin.contrezz.com`
   - No trailing slash
   - Exact match (case-sensitive)

### If SSL errors persist:

1. **Check certificate status:**
   - DigitalOcean → App → Settings → Domains
   - Certificate should show "Active" or "Valid"

2. **Check DNS:**
   ```bash
   dig api.contrezz.com +short
   # Should return DigitalOcean app domain
   ```

3. **Wait for propagation:**
   - SSL certificates can take 5-10 minutes to provision
   - DNS changes can take up to 48 hours (usually < 1 hour)

4. **Force certificate renewal:**
   - Remove domain from DigitalOcean
   - Wait 5 minutes
   - Re-add domain
   - Wait for new certificate

### If login still fails:

1. **Check backend is running:**
   ```bash
   curl https://api.contrezz.com/health
   ```

2. **Check admin user exists:**
   - Connect to public database
   - Verify admin user in `public_admins` table

3. **Check authentication endpoint:**
   ```bash
   curl -X POST https://api.contrezz.com/api/admin/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your-admin@example.com","password":"your-password"}' \
     -v
   ```

---

## Summary

✅ **Fixed:**
- Branding hooks skip app API when on admin domain
- CORS configuration updated in `app.yaml`

⏳ **Action Required:**
- Update `ALLOWED_ORIGINS` in DigitalOcean environment variables
- Fix SSL certificate if still failing
- Deploy frontend changes

📋 **Verification:**
- Test admin login at `https://admin.contrezz.com`
- Check browser console for errors
- Verify API health endpoints

---

**Last Updated:** December 15, 2025  
**Status:** Fixes applied, deployment pending
