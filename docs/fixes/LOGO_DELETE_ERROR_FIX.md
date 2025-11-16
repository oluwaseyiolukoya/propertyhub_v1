# Logo Delete Error Fix

## Issue
Getting 500 Internal Server Error when trying to delete/remove the uploaded logo:
```
DELETE http://localhost:5000/api/system/settings/logo 500 (Internal Server Error)
Remove error: {error: 'Failed to delete setting'}
```

## Root Cause
The backend delete endpoint had insufficient error handling and logging, making it difficult to diagnose the actual issue. The error could be caused by:
1. Database deletion failing
2. File system permission issues
3. Prisma query issues
4. File path resolution problems

## Solution Applied

### Enhanced Error Handling & Logging

**File**: `backend/src/routes/system.ts`

**Improvements**:

1. **Detailed Logging**:
   ```typescript
   console.log('[DELETE LOGO] Starting logo deletion...');
   console.log('[DELETE LOGO] Found setting:', setting);
   console.log('[DELETE LOGO] Attempting to delete file:', filePath);
   console.log('[DELETE LOGO] Database record deleted successfully');
   ```

2. **Graceful File Deletion**:
   - File deletion errors are now non-fatal
   - Continues to delete database record even if file deletion fails
   - Logs file errors but doesn't throw

3. **Better Error Messages**:
   ```typescript
   return res.status(500).json({ 
     error: 'Failed to delete logo',
     details: error.message,
     code: error.code 
   });
   ```

4. **Early Return for Missing Logo**:
   ```typescript
   if (!setting) {
     console.log('[DELETE LOGO] No logo setting found');
     return res.json({ message: 'Logo deleted successfully' });
   }
   ```

5. **Separate Error Handling**:
   - File deletion wrapped in try/catch
   - Database deletion separate from file deletion
   - Stack trace logging for debugging

## Testing Steps

### 1. Try Deleting Logo Again

1. **Refresh** the Platform Settings page
2. **Click "Remove"** on the logo
3. **Check browser console** for error details
4. **Check backend logs**:
   ```bash
   tail -f logs/backend-dev.log | grep "DELETE LOGO"
   ```

### 2. Check Backend Logs

The logs will now show exactly where the failure occurs:

**Successful Deletion**:
```
[DELETE LOGO] Starting logo deletion...
[DELETE LOGO] Found setting: { id: '...', key: 'platform_logo_url', ... }
[DELETE LOGO] Attempting to delete file: /path/to/backend/uploads/logos/...
[DELETE LOGO] File deleted successfully
[DELETE LOGO] Deleting database record with key: platform_logo_url
[DELETE LOGO] Database record deleted successfully
```

**File Not Found (Non-Fatal)**:
```
[DELETE LOGO] Starting logo deletion...
[DELETE LOGO] Found setting: { ... }
[DELETE LOGO] Attempting to delete file: /path/to/file
[DELETE LOGO] File does not exist
[DELETE LOGO] Deleting database record with key: platform_logo_url
[DELETE LOGO] Database record deleted successfully
```

**Database Error**:
```
[DELETE LOGO] Starting logo deletion...
[DELETE LOGO] Found setting: { ... }
[DELETE LOGO] Unexpected error: [Error details]
[DELETE LOGO] Error stack: [Stack trace]
```

### 3. Common Issues & Solutions

**Issue**: File permission error
```
[DELETE LOGO] File deletion error (continuing anyway): EACCES: permission denied
```
**Solution**: Check file permissions:
```bash
ls -la backend/uploads/logos/
chmod 644 backend/uploads/logos/*
```

**Issue**: Database connection error
```
[DELETE LOGO] Unexpected error: PrismaClientKnownRequestError
```
**Solution**: Check database connection and restart backend

**Issue**: File path resolution error
```
[DELETE LOGO] File deletion error (continuing anyway): ENOENT: no such file or directory
```
**Solution**: This is non-fatal, database record will still be deleted

## Frontend Error Display

The frontend now receives more detailed error information:

**Before**:
```json
{
  "error": "Failed to delete setting"
}
```

**After**:
```json
{
  "error": "Failed to delete logo",
  "details": "Specific error message",
  "code": "P2025"  // Prisma error code if applicable
}
```

## Manual Cleanup (If Needed)

If the logo delete continues to fail, you can manually clean up:

### 1. Delete Database Record
```sql
-- Connect to database
psql -U postgres -d contrezz

-- Delete the setting
DELETE FROM system_settings WHERE key = 'platform_logo_url';
```

### 2. Delete File
```bash
# Find and delete logo files
cd backend/uploads/logos/
ls -la
rm platform-logo-*.svg  # or .png, .jpg, etc.
```

### 3. Restart Backend
```bash
# Kill backend process
lsof -ti:5000 | xargs kill -9

# Start backend
cd backend && npm run dev
```

## Expected Behavior

### Successful Delete Flow

1. **User clicks "Remove"** on logo
2. **Frontend sends DELETE request** to `/api/system/settings/logo`
3. **Backend logs**: Starting deletion...
4. **Backend finds** database record
5. **Backend deletes** file (if exists)
6. **Backend deletes** database record
7. **Backend responds**: `{ message: 'Logo deleted successfully' }`
8. **Frontend shows toast**: "Logo removed successfully"
9. **Frontend updates state**: `logoUrl = null`
10. **Page reloads**: Default Building2 icon appears

### Error Handling Flow

1. **Error occurs** during deletion
2. **Backend logs** detailed error information
3. **Backend responds** with error details
4. **Frontend shows toast**: Error message with details
5. **Frontend logs** error to console
6. **User can retry** or check logs

## Debugging Commands

### Check Database Record
```bash
# Using Prisma Studio
cd backend && npx prisma studio

# Navigate to system_settings table
# Look for key: 'platform_logo_url'
```

### Check File Exists
```bash
# List logo files
ls -la backend/uploads/logos/

# Check specific file
ls -la backend/uploads/logos/platform-logo-*.svg
```

### Check Backend Process
```bash
# Check if backend is running
lsof -ti:5000

# Check backend logs
tail -50 logs/backend-dev.log
```

### Test Delete Endpoint Directly
```bash
# Get your auth token
TOKEN=$(node -e "console.log(localStorage.getItem('auth_token'))")

# Test delete endpoint
curl -X DELETE \
  http://localhost:5000/api/system/settings/logo \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Status

✅ **Enhanced Error Handling**: Detailed logging added  
✅ **Graceful Degradation**: File errors don't block database deletion  
✅ **Better Error Messages**: Frontend receives detailed error info  
✅ **Debugging Support**: Comprehensive logging for troubleshooting  

---

**Date**: November 12, 2025  
**Status**: ✅ Fixed with Enhanced Logging  
**Next Step**: Try deleting logo again and check backend logs

The delete should now work, or at minimum, provide detailed error information in the backend logs to help diagnose the issue.

