# Production Project Creation - Debug Investigation

**Date**: 2025-11-16  
**Issue**: Developer cannot create projects in production (500 errors)

## Problem Statement

Property developers can create projects successfully in local development, but getting 500 errors in production:

```
POST /api/developer-dashboard/projects - 500 Internal Server Error
GET /api/developer-dashboard/portfolio/overview - 500 Internal Server Error
GET /api/developer-dashboard/projects - 500 Internal Server Error
```

**Frontend Console Logs:**
```
[CreateProject] Creating project with data: Object
Failed to load resource: the server responded with a status of 500 ()
[CreateProject] Error creating project: Error: Failed to create project
```

## Root Cause Hypothesis

Based on the pattern (works locally, fails in production), the most likely causes are:

1. **Foreign Key Constraint Failure (Most Likely)**
   - The `customerId` or `developerId` in the JWT token doesn't exist in the production database
   - User was created but customer record is missing
   - User's `customerId` field doesn't match any existing customer

2. **Database Schema Mismatch**
   - Production database schema is out of sync with local
   - Missing required fields or columns

3. **Data Type Issues**
   - Production database has stricter type checking
   - NULL handling differences

## Diagnostic Enhancements Applied

### 1. Enhanced Error Logging

**File**: `backend/src/routes/developer-dashboard.ts`

Added comprehensive logging for all developer dashboard endpoints:

```typescript
// Project Creation - Lines 722-797
console.log('🔍 [DEBUG] Attempting to create project:', {
  userId, customerId, userEmail, projectName
});

// Validate customer exists
const customerExists = await prisma.customers.findUnique({
  where: { id: customerId },
  select: { id: true, name: true }
});

// Validate user exists
const userExists = await prisma.users.findUnique({
  where: { id: userId },
  select: { id: true, email: true, role: true, customerId: true }
});

// Verify user-customer association
if (userExists.customerId !== customerId) {
  console.error('❌ [ERROR] User-Customer mismatch');
  return res.status(400).json({
    error: 'Account mismatch',
    details: 'Your user account is not associated with the specified customer',
    debugInfo: { tokenCustomerId, dbCustomerId }
  });
}
```

### 2. Detailed Error Responses

Changed error responses to include full details even in production (for debugging):

```typescript
// Before
res.status(500).json({
  error: 'Failed to create project',
  details: process.env.NODE_ENV === 'production'
    ? 'Please try again or contact support'
    : error.message
});

// After
res.status(500).json({
  error: 'Failed to create project',
  details: error.message,  // Now shows error message
  code: error.code,
  debugInfo: {
    userId: (req as any).user?.id,
    customerId: (req as any).user?.customerId,
    timestamp: new Date().toISOString()
  }
});
```

### 3. Specific Error Handling

Added explicit checks for common Prisma error codes:

- **P2002**: Unique constraint violation (duplicate project)
- **P2003**: Foreign key constraint failure (invalid customerId or developerId)

### 4. Endpoints Enhanced

All affected endpoints now have enhanced diagnostics:

1. `POST /api/developer-dashboard/projects` - Project creation
2. `GET /api/developer-dashboard/portfolio/overview` - Portfolio overview
3. `GET /api/developer-dashboard/projects` - Projects list

## Next Steps

1. **Deploy to Production**
   - Push the enhanced logging changes
   - Restart the production server

2. **Reproduce the Error**
   - Attempt to create a project as the property developer
   - Check the error response in the browser console

3. **Analyze the Response**
   The error response will now include:
   ```json
   {
     "error": "...",
     "details": "Actual error message",
     "code": "P2003",
     "debugInfo": {
       "userId": "...",
       "customerId": "...",
       "timestamp": "..."
     }
   }
   ```

4. **Check Server Logs**
   Look for the following log entries:
   - `🔍 [DEBUG] Attempting to create project`
   - `❌ [ERROR] Customer not found in database`
   - `❌ [ERROR] User not found in database`
   - `❌ [ERROR] User-Customer mismatch`
   - `❌ [CRITICAL ERROR] Error creating project`

## Expected Outcomes

### Scenario A: Customer Not Found
```
❌ [ERROR] Customer not found in database
Response: { error: 'Customer account not found', debugInfo: {...} }
```

**Resolution**: The customer record is missing from production database. Need to either:
- Create the customer record manually
- Re-run the customer creation process
- Sync data from local to production

### Scenario B: User-Customer Mismatch
```
❌ [ERROR] User-Customer mismatch
tokenCustomerId: "abc123"
dbCustomerId: "xyz789"
```

**Resolution**: JWT token has stale customerId. User needs to:
- Log out and log in again to get fresh token
- Update the user's customerId in the database

### Scenario C: Database Schema Issue
```
Prisma error with code P20XX
Details about missing column or table
```

**Resolution**: Run database migrations on production:
```bash
npx prisma migrate deploy
```

## Verification Steps

After deployment:

1. **Test Project Creation**
   - Login as property developer
   - Navigate to Create Project page
   - Fill in project details
   - Click Create Project
   - Check browser console for detailed error

2. **Check Backend Logs**
   - Access production server logs
   - Look for debug output with emoji markers (🔍, ❌, ✅)
   - Identify which validation check is failing

3. **Verify Database State**
   ```sql
   -- Check if customer exists
   SELECT id, name, email FROM customers 
   WHERE id = '<customerId from error>';
   
   -- Check if user exists and customer association
   SELECT id, email, role, "customerId" FROM users 
   WHERE id = '<userId from error>';
   
   -- Check for orphaned users
   SELECT u.id, u.email, u."customerId", c.id as customer_exists
   FROM users u
   LEFT JOIN customers c ON u."customerId" = c.id
   WHERE u."customerId" IS NOT NULL AND c.id IS NULL;
   ```

## Files Modified

- `backend/src/routes/developer-dashboard.ts` (Lines 696-889, 152-296, 303-447)

## Temporary Changes

Note: The enhanced error logging (showing full error messages in production) is **temporary** for debugging purposes. Once the issue is resolved, revert to secure error messages:

```typescript
// Revert to secure production errors after debugging
details: process.env.NODE_ENV === 'production'
  ? 'Please try again or contact support'
  : error.message
```

## Related Issues

- Initial developer login issues (FIXED - Password hash mismatch)
- Admin password generation bug (FIXED - Password sync issue)
- JWT_SECRET validation (FIXED - Fail-fast validation)

---

**Status**: 🔍 Investigation in progress - Awaiting production deployment and error reproduction

