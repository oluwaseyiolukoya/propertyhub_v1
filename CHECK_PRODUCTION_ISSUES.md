# Check Production Issues - Action Items

## Issue Summary

Based on the logs and investigation:

1. ✅ **Landing page content not updating**: This is because you're updating LOCAL database, but production uses a SEPARATE database
2. ❓ **Career page error**: Need to investigate what specific error you're seeing

## Immediate Actions Required

### 1. Update Production Content (Landing Page)

**Go to**: `https://admin.contrezz.com/`

1. Login with your production admin credentials
2. Navigate to **Landing Pages** → **Home**
3. Make your changes there (not in local admin)
4. Save
5. Verify at `https://contrezz.com/`

### 2. Check Career Page Error

Please provide:

1. **What error message do you see** when clicking Career?
   - Screenshot or exact error text

2. **Check browser console**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Click Career
   - Share any error messages

3. **Check Network tab**:
   - Open browser DevTools (F12)
   - Go to Network tab
   - Click Career
   - Look for failed requests (red)
   - Click on the failed request
   - Share the Response

### 3. Verify Production Backend is Running

```bash
# Test health endpoint
curl https://api.contrezz.com/health

# Expected: {"status":"ok",...}
```

### 4. Check if Career Endpoints Work

```bash
# Test public careers endpoint (should work without auth)
curl https://api.contrezz.com/api/careers

# Test admin careers endpoint (needs auth, should return "No token provided")
curl https://api.contrezz.com/api/admin/careers
```

## Common Issues and Solutions

### Issue 1: "No token provided" or "Unauthorized"

**Cause**: Admin session expired or not logged in

**Solution**:
1. Logout from `https://admin.contrezz.com/`
2. Login again
3. Try accessing Career page

### Issue 2: "Network Error" or "Failed to fetch"

**Cause**: Backend is down or unreachable

**Solution**:
```bash
# Check if backend is running
curl https://api.contrezz.com/health

# If not responding, restart it
doctl apps create-deployment <APP_ID>
```

### Issue 3: "Table does not exist" or Database Error

**Cause**: Migrations not applied to production database

**Solution**:
```bash
# Connect to production backend console
# Run migrations
npx prisma migrate deploy
```

### Issue 4: CORS Error

**Cause**: `admin.contrezz.com` not in ALLOWED_ORIGINS

**Solution**:
1. Check production environment variables
2. Ensure `ALLOWED_ORIGINS` includes:
   ```
   https://contrezz.com,https://www.contrezz.com,https://admin.contrezz.com
   ```

## Next Steps

1. **Try updating content in production admin** (`https://admin.contrezz.com/`)
2. **Share the specific error** you see on Career page
3. **Check production logs** if you have access:
   ```bash
   doctl apps logs <APP_ID> --tail 100
   ```

4. **Verify database connection**:
   ```bash
   # If you have access to production DB URL
   PUBLIC_DATABASE_URL="your-prod-url" psql -c "SELECT COUNT(*) FROM career_postings;"
   ```

## Files to Review

- `PRODUCTION_CONTENT_UPDATE_GUIDE.md` - Complete guide on updating production content
- `LANDING_PAGE_CONTENT_UPDATE_FIX.md` - Technical details of the caching fix
- `public-backend/DEPLOYMENT_INSTRUCTIONS.md` - Production deployment guide

---

**Action Required**: Please provide the specific error message from the Career page so I can help troubleshoot further.

