# Property Manager Registration - Owner Role Assignment

## Summary
Updated the onboarding system so that property managers who register from the "Get Started" page are assigned the **"owner" role** instead of "manager" role, giving them full control over their properties.

## Problem
Previously, when a property manager registered through the Get Started page:
- They were assigned the **"manager" role**
- Managers have limited permissions (need to be assigned to properties by owners)
- They couldn't create properties or have full control
- This didn't match the expectation that they should manage their own properties

## Solution
Property managers registering from Get Started are now assigned the **"owner" role** because:
1. They are registering their own business/company
2. They have full control over their own customer account
3. They manage their own properties (not someone else's)
4. They are essentially "owners" of their property management business

## Changes Made

### File: `backend/src/services/onboarding.service.ts`

**Before:**
```typescript
await prisma.users.create({
  data: {
    // ...
    role: application.applicationType === 'property-owner' ? 'owner' : 'manager',
    // ...
  },
});
```

**After:**
```typescript
// Note: Both property-owner and property-manager get 'owner' role
// Property managers registering from Get Started page have full control over their properties
// They are essentially owners of their own customer account
const userRole = (application.applicationType === 'property-owner' || application.applicationType === 'property-manager') 
  ? 'owner' 
  : 'tenant';

await prisma.users.create({
  data: {
    // ...
    role: userRole,
    // ...
  },
});
```

## Role Assignment Logic

### Application Type → User Role Mapping

| Application Type | User Role | Reason |
|-----------------|-----------|---------|
| `property-owner` | **owner** | They own properties |
| `property-manager` | **owner** | They manage their own business and properties |
| `tenant` | **tenant** | They rent properties |

## Impact

### Before (Old Behavior)
**Property Manager Registration:**
1. Registers from Get Started page
2. Admin approves and activates
3. Gets **"manager" role** ❌
4. Logs in but has limited permissions
5. Cannot create properties
6. Needs to be assigned to properties by an owner
7. Confusing experience

### After (New Behavior)
**Property Manager Registration:**
1. Registers from Get Started page
2. Admin approves and activates
3. Gets **"owner" role** ✅
4. Logs in with full permissions
5. Can create and manage properties
6. Has full control over their account
7. Expected experience

## User Experience

### Property Manager Dashboard
With the "owner" role, property managers can now:
- ✅ Create new properties
- ✅ Add units to properties
- ✅ Invite and manage tenants
- ✅ Manage leases and payments
- ✅ View financial reports
- ✅ Manage expenses
- ✅ Create and assign other managers (if needed)
- ✅ Access all owner-level features

### Permissions
The "owner" role has full permissions:
- Create, read, update, delete properties
- Manage all aspects of their business
- Access all dashboard features
- Manage billing and subscriptions
- View analytics and reports

## Important Notes

### This Does NOT Affect:
1. **Existing property managers** - Already created managers keep their role
2. **Managers created by owners** - Owners can still create managers with limited permissions
3. **Manager assignments** - Property-specific manager assignments still work

### Distinction Between:
1. **Property Manager (from Get Started)** = Owner of their own property management business
   - Gets "owner" role
   - Full control over their account
   
2. **Manager (created by owner)** = Employee/assistant of a property owner
   - Gets "manager" role
   - Limited permissions
   - Assigned to specific properties

## Testing

### Test Case 1: New Property Manager Registration
1. Go to Get Started page
2. Select "Property Manager" as application type
3. Fill out the form and submit
4. Admin approves the application
5. Admin activates the account
6. Property manager receives credentials
7. Property manager logs in
8. **Expected**: Should see full Owner Dashboard with all features ✅

### Test Case 2: Verify Role in Database
```sql
-- Check the user role
SELECT id, name, email, role, customerId 
FROM users 
WHERE email = 'propertymanager@example.com';

-- Should show: role = 'owner'
```

### Test Case 3: Property Owner Registration (No Change)
1. Go to Get Started page
2. Select "Property Owner" as application type
3. Complete registration and activation
4. **Expected**: Still gets "owner" role ✅

### Test Case 4: Tenant Registration (No Change)
1. Go to Get Started page
2. Select "Tenant" as application type
3. Complete registration and activation
4. **Expected**: Gets "tenant" role ✅

## Files Modified

- `/backend/src/services/onboarding.service.ts` - Updated role assignment logic in `activateApplication` method

## Migration Notes

### For Existing Property Managers
If you have existing property managers who were activated with the "manager" role and need to be upgraded to "owner":

```sql
-- Find property managers with manager role
SELECT u.id, u.name, u.email, u.role, oa.applicationType
FROM users u
JOIN onboarding_applications oa ON u.email = oa.email
WHERE oa.applicationType = 'property-manager' 
  AND u.role = 'manager';

-- Update them to owner role
UPDATE users 
SET role = 'owner', updatedAt = NOW()
WHERE id IN (
  SELECT u.id
  FROM users u
  JOIN onboarding_applications oa ON u.email = oa.email
  WHERE oa.applicationType = 'property-manager' 
    AND u.role = 'manager'
);
```

## Benefits

1. **Better User Experience**: Property managers get the permissions they expect
2. **Less Confusion**: Clear distinction between business owners and employees
3. **Full Control**: Property managers can manage their business without limitations
4. **Correct Terminology**: "Owner" better describes someone running their own business
5. **Simplified Onboarding**: No need for additional setup after activation

## Future Considerations

Potential enhancements:
- [ ] Add a "Property Management Company" account type for larger organizations
- [ ] Allow property managers to create sub-managers with limited permissions
- [ ] Add role upgrade/downgrade functionality in admin panel
- [ ] Create a "Company Admin" role for multi-user property management companies

