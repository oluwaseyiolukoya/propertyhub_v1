# Authentication and Delete Request Fixes

## Overview
Fixed two critical issues:
1. **401 Unauthorized** error when deleting projects (missing authentication headers)
2. **500 Internal Server Error** on `/api/auth/account` endpoint for developer users

## Issues Identified

### Issue 1: DELETE Request 401 Unauthorized
**Error:**
```
DELETE http://localhost:5173/api/developer-dashboard/projects/25c4a984-3157-45f9-b2c4-4668dc4e63d3 401 (Unauthorized)
```

**Root Cause:**
The `handleDeleteProject` function in `DeveloperDashboardRefactored.tsx` was using plain `fetch()` API without including authentication headers. The API client (`apiClient`) automatically handles authentication tokens, but the delete function wasn't using it.

**Solution:**
- Replaced `fetch()` with `apiClient.delete()` which automatically includes the `Authorization: Bearer <token>` header
- Updated error handling to properly extract error messages from the API response

### Issue 2: Account Endpoint 500 Error
**Error:**
```
GET http://localhost:5173/api/auth/account 500 (Internal Server Error)
Failed to fetch account data: Error: Failed to get subscription status
```

**Root Cause:**
The `/api/auth/account` endpoint was attempting to count properties, units, and managers for all users with a `customerId`, including developer users. However:
- Developer users don't have properties/units (they have projects instead)
- The Prisma queries for `properties` and `units` tables were failing for developers
- This caused the entire endpoint to return a 500 error

**Solution:**
- Added a check to skip property/unit/manager counting for developer users
- Wrapped the counting logic in a try-catch block for graceful error handling
- Developers now get account info without attempting to count non-existent properties/units

## Changes Made

### Frontend Changes

#### `src/modules/developer-dashboard/components/DeveloperDashboardRefactored.tsx`

**Before:**
```typescript
const handleDeleteProject = async (projectId: string) => {
  // ...
  const response = await fetch(`/api/developer-dashboard/projects/${projectId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  // ...
};
```

**After:**
```typescript
import { apiClient } from '../../../lib/api-client';

const handleDeleteProject = async (projectId: string) => {
  // ...
  const response = await apiClient.delete<{ message: string }>(
    `/api/developer-dashboard/projects/${projectId}`
  );

  if (response.error) {
    throw new Error(response.error.message || 'Failed to delete project');
  }
  // ...
};
```

**Benefits:**
- ✅ Automatic authentication header inclusion
- ✅ Consistent error handling with other API calls
- ✅ Better error messages for users

### Backend Changes

#### `backend/src/routes/auth.ts` - `/account` endpoint

**Before:**
```typescript
if (user.customerId) {
  // Get actual counts from database
  const [properties, units, managers] = await Promise.all([
    prisma.properties.count({ where: { customerId: user.customerId } }),
    prisma.units.count({ where: { properties: { customerId: user.customerId } } }),
    prisma.users.count({ where: { customerId: user.customerId, role: { in: [...] }, isActive: true } })
  ]);
  // ...
}
```

**After:**
```typescript
// Only count properties/units/managers for non-developer users
if (user.customerId && derivedUserType !== 'developer') {
  try {
    // Get actual counts from database
    const [properties, units, managers] = await Promise.all([
      prisma.properties.count({ where: { customerId: user.customerId } }),
      prisma.units.count({ where: { properties: { customerId: user.customerId } } }),
      prisma.users.count({ where: { customerId: user.customerId, role: { in: [...] }, isActive: true } })
    ]);
    // ...
  } catch (error) {
    console.warn('⚠️ Error counting properties/units/managers for customer:', error);
    // Continue with default values if counting fails
  }
}
```

**Benefits:**
- ✅ Developer users can now access account info without errors
- ✅ Graceful error handling prevents 500 errors
- ✅ Non-developer users still get accurate property/unit counts

## Testing Checklist

### Delete Project Functionality
- [x] Delete request includes authentication headers
- [x] Delete request succeeds for authenticated users
- [x] Delete request fails with proper error message for unauthorized users
- [x] Success toast appears after successful deletion
- [x] Error toast appears with descriptive message on failure

### Account Endpoint
- [x] Developer users can fetch account info without errors
- [x] Account info includes user data correctly
- [x] Account info includes customer data (if applicable)
- [x] Property/unit counting is skipped for developers
- [x] Property/unit counting still works for owners/managers
- [x] Errors in counting don't crash the endpoint

## Impact

### Before Fixes
- ❌ Project deletion failed with 401 Unauthorized
- ❌ Account info fetch failed with 500 Internal Server Error for developers
- ❌ Subscription status fetch failed due to account endpoint error
- ❌ Dashboard couldn't load account data

### After Fixes
- ✅ Project deletion works correctly with authentication
- ✅ Account info loads successfully for all user types
- ✅ Subscription status loads correctly
- ✅ Dashboard loads account data without errors

## Files Modified

### Frontend
1. `src/modules/developer-dashboard/components/DeveloperDashboardRefactored.tsx`
   - Added `apiClient` import
   - Updated `handleDeleteProject` to use `apiClient.delete()`
   - Improved error handling

### Backend
1. `backend/src/routes/auth.ts`
   - Added developer user type check before counting properties/units
   - Added try-catch block for graceful error handling
   - Improved error logging

## Related Issues

These fixes resolve:
- Authentication issues with DELETE requests
- Developer user account endpoint errors
- Subscription status loading failures
- Dashboard data fetching errors

## Next Steps

Consider:
1. Adding unit tests for the delete project functionality
2. Adding integration tests for the account endpoint with different user types
3. Creating a dedicated API module for developer dashboard operations
4. Adding more specific error messages for different failure scenarios

