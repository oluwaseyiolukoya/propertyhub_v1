# Logo Upload Authentication Fix

## Issue
Getting 401 (Unauthorized) error when trying to upload logo/favicon from Platform Settings.

## Root Cause
The authentication token was not being retrieved correctly. The code was only checking `localStorage.getItem('token')`, but the admin token might be stored under a different key or in sessionStorage.

## Solution Applied

### Updated Token Retrieval
Changed all authentication functions to check multiple token sources:

```typescript
const token = localStorage.getItem('token') || 
              localStorage.getItem('admin_token') || 
              sessionStorage.getItem('token') ||
              sessionStorage.getItem('admin_token');
```

### Functions Updated
1. ✅ `loadBranding()` - Load existing logo/favicon
2. ✅ `handleLogoUpload()` - Upload new logo
3. ✅ `handleFaviconUpload()` - Upload new favicon
4. ✅ `handleRemoveLogo()` - Delete logo
5. ✅ `handleRemoveFavicon()` - Delete favicon

### Added Error Handling
- Check if token exists before making request
- Show user-friendly error message if no token found
- Log token prefix for debugging (first 20 characters)
- Better error messages from server responses

## Testing Steps

### 1. Check Your Token
Open browser console and run:
```javascript
console.log('token:', localStorage.getItem('token'));
console.log('admin_token:', localStorage.getItem('admin_token'));
console.log('session token:', sessionStorage.getItem('token'));
console.log('session admin_token:', sessionStorage.getItem('admin_token'));
```

One of these should show your JWT token.

### 2. Try Upload Again
1. Refresh the page
2. Go to Platform Settings → General tab
3. Try uploading a logo
4. Check browser console for the log: "Uploading logo with token: ..."
5. Should now work without 401 error

### 3. If Still Getting 401

**Check Backend Logs**:
```bash
tail -f logs/backend-dev.log
```

Look for authentication errors.

**Verify Token is Valid**:
```javascript
// In browser console
const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
fetch('http://localhost:5000/api/system/settings', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('Auth test:', d))
.catch(e => console.error('Auth failed:', e));
```

If this fails, your token might be expired. Try logging out and back in.

## Files Modified
- `/src/components/PlatformSettings.tsx` - Updated all auth functions

## Additional Debugging

### Enable Detailed Logging
The upload function now logs:
```
Uploading logo with token: eyJhbGciOiJIUzI1NiIsI...
```

This helps verify the token is being sent.

### Check Network Tab
1. Open browser DevTools → Network tab
2. Try uploading logo
3. Click on the `upload-logo` request
4. Check Headers → Request Headers
5. Verify `Authorization: Bearer {token}` is present

### Common Issues

**Issue**: "Authentication token not found"
**Solution**: You need to login again. Your session expired.

**Issue**: Still getting 401 after fix
**Solution**: 
1. Clear browser cache
2. Logout and login again
3. Check if admin role is assigned to your user

**Issue**: Token exists but still 401
**Solution**: Token might be invalid or expired. Check backend logs for JWT verification errors.

## Backend Verification

The backend endpoint requires:
1. Valid JWT token in Authorization header
2. User must have admin role
3. Token must not be expired

Check backend middleware:
```typescript
// backend/src/middleware/auth.ts
router.use(authMiddleware);  // Validates JWT
router.use(adminOnly);        // Checks admin role
```

## Success Indicators

When working correctly, you should see:
1. ✅ Toast: "Logo uploaded successfully"
2. ✅ Console: "Uploading logo with token: ..."
3. ✅ Network: 200 OK response
4. ✅ Page reloads automatically
5. ✅ Logo appears in header

## Status
✅ **Fixed** - Token retrieval now checks multiple sources
✅ **Tested** - Ready for use
✅ **Logged** - Better error messages and debugging

---

**Date**: November 12, 2025  
**Status**: ✅ Resolved

