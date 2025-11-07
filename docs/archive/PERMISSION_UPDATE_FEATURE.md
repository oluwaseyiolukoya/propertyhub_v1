# Permission Update Feature

## Overview
This feature ensures that when a Super Admin updates a user's role or permissions, the user automatically sees the changes after refreshing their dashboard. No more stale permissions or 403 errors!

---

## How It Works

### 1. Backend Permission Validation
**File:** `backend/src/middleware/auth.ts`

The authentication middleware now checks if a user's permissions have been updated since their JWT token was issued:

```typescript
// Check if user's permissions have been updated since token was issued
const tokenIssuedAt = decoded.iat ? new Date(decoded.iat * 1000) : new Date();
const userUpdatedAt = userRecord.updatedAt;

if (userUpdatedAt && userUpdatedAt > tokenIssuedAt) {
  console.log('⚠️ User permissions updated. Forcing re-authentication.');
  return res.status(401).json({ 
    error: 'Your permissions have been updated. Please log in again.',
    code: 'PERMISSIONS_UPDATED'
  });
}
```

**What happens:**
- Every API request checks if the user record was updated after the JWT was created
- If permissions changed, returns 401 with special `PERMISSIONS_UPDATED` code
- This prevents users from operating with outdated permissions

---

### 2. Frontend Permission Handling
**File:** `src/lib/api-client.ts`

The API client detects permission updates and notifies the user:

```typescript
if (response.status === 401) {
  if (data.code === 'PERMISSIONS_UPDATED') {
    // Show a toast notification before redirecting
    const event = new CustomEvent('permissionsUpdated', {
      detail: { message: data.error }
    });
    window.dispatchEvent(event);
    
    // Wait 2 seconds for toast, then redirect
    setTimeout(() => {
      removeAuthToken();
      window.location.href = '/';
    }, 2000);
  }
}
```

**What happens:**
- Detects the `PERMISSIONS_UPDATED` code
- Dispatches a custom event to show a toast notification
- Waits 2 seconds to allow user to read the message
- Automatically logs out and redirects to login page

---

### 3. User Notification
**File:** `src/App.tsx`

The main app listens for permission update events and shows a toast:

```typescript
useEffect(() => {
  const handlePermissionsUpdated = (event: any) => {
    const message = event.detail?.message || 'Your permissions have been updated. Please log in again.';
    toast.warning(message, {
      duration: 5000,
      description: 'You will be redirected to the login page shortly.',
    });
  };

  window.addEventListener('permissionsUpdated', handlePermissionsUpdated);
  return () => window.removeEventListener('permissionsUpdated', handlePermissionsUpdated);
}, []);
```

**What the user sees:**
- 🟡 **Warning Toast:** "Your permissions have been updated. Please log in again."
- Description: "You will be redirected to the login page shortly."
- Auto-logout after 2 seconds

---

## Usage Flow

### Scenario: Super Admin Updates Support Admin Role

1. **Super Admin Actions:**
   ```
   1. Login as admin@contrezz.com
   2. Go to User Management
   3. Find "Anuoluwapo" (Support Admin)
   4. Click Actions → Edit User
   5. Change role from "Support Admin" to "Senior Support Admin"
   6. Add new permissions (e.g., billing_management)
   7. Click "Save Changes"
   ```

2. **Support Admin Experience:**
   ```
   1. Anuoluwapo is currently logged in and working
   2. They refresh the page or click any menu item
   3. Backend detects: User updated after JWT was issued
   4. Frontend shows toast: "Your permissions have been updated..."
   5. After 2 seconds: Auto-logout and redirect to login
   6. Anuoluwapo logs back in with same password
   7. New JWT includes updated role and permissions
   8. Dashboard now reflects new permissions
   ```

---

## Technical Details

### Token Comparison
```
JWT Token Creation Time (iat): 2025-10-19 20:00:00
User Record Updated At:         2025-10-19 20:15:00

✅ Updated At > Token iat → Force re-authentication
```

### Error Response Format
```json
{
  "error": "Your permissions have been updated. Please log in again.",
  "code": "PERMISSIONS_UPDATED"
}
```

### Database Tables Checked
- `admins` table (for Super Admins)
- `users` table (for Internal Admin Users and Customer Users)

---

## Benefits

1. **✅ Real-Time Permission Enforcement**
   - Users cannot operate with stale permissions
   - No more 403 errors after role updates

2. **✅ Better User Experience**
   - Clear notification about why they need to re-login
   - Automatic logout prevents confusion

3. **✅ Enhanced Security**
   - Ensures permissions are always current
   - Prevents privilege escalation with old tokens

4. **✅ Minimal Disruption**
   - Only affects users whose permissions changed
   - 2-second grace period to read message
   - Simple re-login with same password

---

## Testing

### Test Case 1: Update Internal Admin Role
```bash
1. Login as Super Admin (admin@contrezz.com / admin123)
2. Go to User Management
3. Edit any internal admin user's role
4. In another browser/incognito, login as that user
5. Refresh the page
6. Verify: Toast appears and auto-logout happens
7. Login again
8. Verify: New permissions are active
```

### Test Case 2: No False Positives
```bash
1. Login as any user
2. Browse the dashboard without any role changes
3. Verify: No automatic logout occurs
4. Everything works normally
```

### Test Case 3: Multiple Users
```bash
1. Update User A's role
2. Login as User A → Should see toast and logout
3. Login as User B (not updated) → Should work normally
4. Update User B's role
5. User B refreshes → Should see toast and logout
```

---

## Configuration

### Adjust Logout Delay
In `src/lib/api-client.ts`, change the timeout:

```typescript
// Default: 2 seconds
setTimeout(() => {
  removeAuthToken();
  window.location.href = '/';
}, 2000); // Change this value (in milliseconds)
```

### Customize Toast Message
In `backend/src/middleware/auth.ts`:

```typescript
return res.status(401).json({ 
  error: 'Your custom message here',
  code: 'PERMISSIONS_UPDATED'
});
```

---

## Troubleshooting

### User Not Seeing Update
**Issue:** User's role was updated but they don't see changes

**Solutions:**
1. Ensure backend server is running: `npm run dev` in `/backend`
2. Check browser console for errors
3. Verify user's `updatedAt` field in database
4. Check backend logs for permission check messages

### Immediate Logout
**Issue:** User is logged out immediately without toast

**Solutions:**
1. Check if toast library (sonner) is working
2. Verify the 2-second delay is not being skipped
3. Check browser console for JavaScript errors

---

## Files Modified

1. ✅ `backend/src/middleware/auth.ts` - Permission validation logic
2. ✅ `src/lib/api-client.ts` - Permission update detection
3. ✅ `src/App.tsx` - Toast notification handling

---

## Future Enhancements

### Possible Improvements:
1. **WebSocket notifications** instead of polling on refresh
2. **Refresh token endpoint** to update permissions without logout
3. **Granular permission diff** showing what changed
4. **Admin notification** when user is affected by changes

---

## Support

If you encounter any issues with this feature:

1. Check backend logs for permission validation messages
2. Verify JWT token in localStorage has `iat` field
3. Check database `updatedAt` timestamps
4. Review browser console for custom events

**Status:** ✅ Fully Implemented and Tested
**Last Updated:** October 19, 2025
