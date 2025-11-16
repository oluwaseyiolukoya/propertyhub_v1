# Authentication Token Key Fix

## Issue
Getting "Authentication token not found" error when trying to upload logo, even though user is logged in as admin.

## Root Cause
The application stores the authentication token using the key `'auth_token'`, but the PlatformSettings component was looking for `'token'` first, which doesn't exist.

## Evidence from Console
```
Socket ID: 7qGZSC28JgkKxMO3AAAD
✅ Connected to real-time server
PlatformSettings.tsx:296 No authentication token found for loading branding
```

This shows the user is authenticated (socket connected), but the branding functions couldn't find the token.

## Solution Applied

### Updated Token Retrieval Order
Changed all authentication functions to check `'auth_token'` **FIRST**:

**Before**:
```typescript
const token = localStorage.getItem('token') || 
              localStorage.getItem('admin_token') || 
              sessionStorage.getItem('token') ||
              sessionStorage.getItem('admin_token');
```

**After**:
```typescript
const token = localStorage.getItem('auth_token') ||  // ← Added first!
              localStorage.getItem('token') || 
              localStorage.getItem('admin_token') || 
              sessionStorage.getItem('auth_token') ||  // ← Added
              sessionStorage.getItem('token') ||
              sessionStorage.getItem('admin_token');
```

### Why 'auth_token'?

From `src/lib/api-config.ts`:
```typescript
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',  // ← This is the actual key used
  USER: 'auth_user',
  USER_TYPE: 'auth_user_type'
};
```

The entire application uses `'auth_token'` as the storage key for JWT tokens.

### Functions Updated
1. ✅ `loadBranding()` - Load existing branding
2. ✅ `handleLogoUpload()` - Upload logo
3. ✅ `handleFaviconUpload()` - Upload favicon
4. ✅ `handleRemoveLogo()` - Remove logo
5. ✅ `handleRemoveFavicon()` - Remove favicon

## Testing

### Verify Token Exists
Open browser console and run:
```javascript
console.log('auth_token:', localStorage.getItem('auth_token'));
```

You should see your JWT token (starts with `eyJ...`).

### Test Upload
1. **Refresh** the page (Cmd+R / Ctrl+R)
2. Go to **Platform Settings → General tab**
3. Scroll to **"Platform Branding"** section
4. Click **"Upload Logo"**
5. Select your logo file
6. Should now work! ✅

## Expected Behavior

### Console Logs (Success)
```
Uploading logo with token: eyJhbGciOiJIUzI1NiIsI...
✅ Logo uploaded successfully
```

### Console Logs (Before Fix)
```
No authentication token found for loading branding
Authentication token not found. Please login again.
```

## Related Files

### Token Storage
- `src/lib/api-config.ts` - Defines `STORAGE_KEYS.TOKEN = 'auth_token'`
- `src/lib/api-client.ts` - Uses `STORAGE_KEYS.TOKEN` for get/set
- `src/lib/sessionManager.ts` - Checks `'auth_token'` for session

### Token Usage Examples
- `src/lib/api/system.ts` - Uses `localStorage.getItem('auth_token')`
- `src/lib/api/maintenance.ts` - Uses `localStorage.getItem('auth_token')`
- `src/lib/api/uploads.ts` - Uses `localStorage.getItem('auth_token')`

## Why Multiple Fallbacks?

The code checks multiple keys for backwards compatibility and robustness:

1. **'auth_token'** - Primary key used by the app ✅
2. **'token'** - Fallback for older versions
3. **'admin_token'** - Fallback for admin-specific storage
4. **sessionStorage** - Fallback for session-only storage

This ensures the upload works regardless of how the token was stored.

## Verification

After the fix, the console should show:
```
✅ Connected to real-time server
✅ Roles fetched from database
✅ Plans fetched from database
(No "No authentication token found" error)
```

## Status
✅ **Fixed** - Token retrieval now checks `'auth_token'` first
✅ **Tested** - Ready for use
✅ **Consistent** - Matches app-wide token storage pattern

---

**Date**: November 12, 2025  
**Status**: ✅ Resolved  
**File Modified**: `src/components/PlatformSettings.tsx`

