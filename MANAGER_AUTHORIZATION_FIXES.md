# Manager Authorization Fixes - Multiple Endpoint Issues

## Problem Summary
Multiple endpoints were failing for Property Managers due to incorrect authorization checks and Prisma relationship queries. The main issues were:

1. **Tenant Password Reset** - 403 error: "Access denied. You do not manage this tenant."
2. **Activity Logs** - 500 error due to non-existent Prisma relationships
3. **Payments API** - 500 errors on `/api/payments` and `/api/payments/overdue/list`
4. **Frontend Cache Error** - `ReferenceError: recentActivities is not defined`

---

## Issues Fixed

### 1. Tenant Password Reset Authorization ✅

**Problem:**
Property managers could not reset passwords for tenants in their managed properties. The endpoint only checked if the user was the property owner, not if they were an assigned manager.

**Error:**
```
403 Forbidden
Access denied. You do not manage this tenant.
```

**Root Cause:**
The authorization check only verified property ownership:
```typescript
// Before (Broken)
const hasAccess = tenant.leases.some(
  lease => lease.properties.ownerId === currentUserId // ❌ Only checks ownership
);
```

**Solution:**
Updated the query to include `property_managers` relationship and check both owner and manager access:

**File:** `backend/src/routes/tenant.ts`

```typescript
// After (Fixed)
const tenant = await prisma.users.findUnique({
  where: { id },
  include: {
    leases: {
      include: {
        properties: {
          select: {
            ownerId: true,
            property_managers: {
              where: {
                managerId: currentUserId,
                isActive: true
              },
              select: {
                managerId: true
              }
            }
          }
        }
      }
    }
  }
});

// Check both owner and manager access
const hasAccess = tenant.leases.some(lease => {
  // Check if user is the property owner
  if (lease.properties.ownerId === currentUserId) {
    return true;
  }
  // Check if user is an assigned manager for this property
  if (isManager && lease.properties.property_managers.length > 0) {
    return true;
  }
  return false;
});
```

**Result:**
✅ Property owners can reset tenant passwords  
✅ Property managers can reset passwords for tenants in their managed properties  
✅ Proper authorization enforcement  

---

### 2. Activity Logs Endpoint ✅

**Problem:**
The manager activities endpoint was crashing with a 500 error. The query tried to use Prisma relationships that don't exist in the schema.

**Error:**
```
500 Internal Server Error
/api/dashboard/manager/activities
```

**Root Cause:**
The query attempted to use non-existent relationships:
```typescript
// Before (Broken)
{
  AND: [
    { entity: 'unit' },
    {
      units: {  // ❌ activity_logs doesn't have 'units' relation
        propertyId: { in: propertyIds }
      }
    }
  ]
}
```

**Prisma Schema:**
```prisma
model activity_logs {
  id          String     @id
  entityId    String?
  entity      String
  // No relation to units or leases!
}
```

**Solution:**
Changed the approach to first fetch related entity IDs, then query `activity_logs`:

**File:** `backend/src/routes/dashboard.ts`

```typescript
// After (Fixed)
// 1. Get property-related activity entityIds
const units = await prisma.units.findMany({
  where: { propertyId: { in: propertyIds } },
  select: { id: true }
});
const unitIds = units.map(u => u.id);

const leases = await prisma.leases.findMany({
  where: { propertyId: { in: propertyIds } },
  select: { id: true }
});
const leaseIds = leases.map(l => l.id);

// 2. Combine all relevant entity IDs
const relevantEntityIds = [...propertyIds, ...unitIds, ...leaseIds];

// 3. Query activity_logs with these IDs
const activities = await prisma.activity_logs.findMany({
  where: {
    entityId: { in: relevantEntityIds }
  },
  orderBy: {
    createdAt: 'desc'
  },
  skip,
  take: limit
});
```

**Result:**
✅ Activity logs endpoint works correctly  
✅ Returns activities for properties, units, and leases  
✅ Proper pagination maintained  
✅ No Prisma relationship errors  

---

### 3. Payments API Endpoints ✅

**Problem:**
Two payments endpoints were failing with 500 errors for property managers:
- `GET /api/payments`
- `GET /api/payments/overdue/list`

**Errors:**
```
500 Internal Server Error
/api/payments
/api/payments/overdue/list
```

**Root Cause:**
The queries used incorrect Prisma relationship names:
```typescript
// Before (Broken)
where.lease = {
  property: {  // ❌ Wrong relation name
    managers: {  // ❌ Should be 'property_managers'
      some: {
        managerId: userId,
        isActive: true
      }
    }
  }
};
```

**Solution:**
Updated to use correct Prisma relationship names:

**File:** `backend/src/routes/payments.ts`

#### A. GET `/api/payments`
```typescript
// After (Fixed)
if (role === 'owner' || role === 'property owner' || role === 'property_owner') {
  where.lease = {
    properties: { ownerId: userId }  // ✅ Correct relation
  };
} else if (role === 'manager' || role === 'property_manager') {
  where.lease = {
    properties: {
      property_managers: {  // ✅ Correct relation
        some: {
          managerId: userId,
          isActive: true
        }
      }
    }
  };
}
```

#### B. GET `/api/payments/overdue/list`
```typescript
// After (Fixed)
if (role === 'owner' || role === 'property owner' || role === 'property_owner') {
  where.properties = { ownerId: userId };  // ✅ Correct relation
} else if (role === 'manager' || role === 'property_manager') {
  where.properties = {
    property_managers: {  // ✅ Correct relation
      some: {
        managerId: userId,
        isActive: true
      }
    }
  };
}
```

**Also Fixed:**
- Added all role variations: `'manager'`, `'property_manager'`
- Added all owner variations: `'owner'`, `'property owner'`, `'property_owner'`

**Result:**
✅ Payments endpoint works for managers  
✅ Overdue payments list works for managers  
✅ Proper property filtering based on manager assignments  
✅ Consistent role checking across endpoints  

---

### 4. Frontend Cache Error ✅

**Problem:**
Frontend console error:
```
ReferenceError: recentActivities is not defined
```

**Root Cause:**
Browser cache was serving old JavaScript code that referenced the removed `recentActivities` variable.

**Solution:**
The code has already been updated correctly. The error will resolve after:
1. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. Clear browser cache
3. Rebuild frontend

**Current Code (Correct):**
The variable `recentActivities` has been removed and replaced with paginated `activities` state.

---

## Authorization Matrix

### Tenant Password Reset

| User Role | Can Reset Password? | Requirements |
|-----------|---------------------|--------------|
| **Property Owner** | ✅ Yes | Must own property where tenant has lease |
| **Property Manager** | ✅ Yes | Must be assigned to property where tenant has lease |
| **Admin/Super Admin** | ✅ Yes | No restrictions |
| **Tenant** | ❌ No | Cannot reset other tenants' passwords |

### Activity Logs Access

| User Role | Can View Activities? | Scope |
|-----------|---------------------|-------|
| **Property Manager** | ✅ Yes | Only activities for assigned properties |
| **Property Owner** | ✅ Yes | Only activities for owned properties |
| **Admin/Super Admin** | ✅ Yes | All activities |

### Payments Access

| User Role | Can View Payments? | Scope |
|-----------|-------------------|-------|
| **Property Owner** | ✅ Yes | Payments for their properties |
| **Property Manager** | ✅ Yes | Payments for assigned properties |
| **Tenant** | ✅ Yes | Only their own payments |
| **Admin/Super Admin** | ✅ Yes | All payments |

---

## Testing Results

### Test Case 1: Manager Reset Tenant Password ✅
```
Given: Property Manager managing "Building A"
And: Tenant "John Doe" lives in Unit 101 of Building A
When: Manager clicks "Reset Password" for John Doe
Then: 
  ✅ Password resets successfully
  ✅ New password is generated
  ✅ Manager can copy password
  ✅ Tenant can login with new password
```

### Test Case 2: Manager View Activities ✅
```
Given: Property Manager managing 2 properties
When: Manager views Dashboard Overview
Then:
  ✅ Recent Activity section loads
  ✅ Shows 5 activities per page
  ✅ Pagination controls work
  ✅ No 500 errors
```

### Test Case 3: Manager View Payments ✅
```
Given: Property Manager managing properties with tenants
When: Manager navigates to Payments page
Then:
  ✅ Payments list loads successfully
  ✅ Shows only payments for managed properties
  ✅ No 500 errors
```

### Test Case 4: Manager View Overdue Payments ✅
```
Given: Property Manager with overdue payments in managed properties
When: Dashboard loads overdue payments widget
Then:
  ✅ Overdue list loads successfully
  ✅ Shows correct overdue payments
  ✅ No 500 errors
```

---

## Database Relationships

### Correct Prisma Relationships Used

```prisma
// Properties → Managers
model properties {
  property_managers property_managers[]  // ✅ Correct relation name
}

model property_managers {
  managerId  String
  propertyId String
  isActive   Boolean
  properties properties @relation(fields: [propertyId], references: [id])
}

// Leases → Properties
model leases {
  propertyId String
  properties properties @relation(fields: [propertyId], references: [id])
}

// Activity Logs (no direct relations to units/leases)
model activity_logs {
  entityId String?  // Stores ID of related entity
  entity   String   // Stores entity type: 'property', 'unit', 'lease'
}
```

---

## Error Handling

### Before (Errors)
```javascript
// Tenant password reset
❌ 403 Forbidden: "Access denied. You do not manage this tenant."

// Activity logs
❌ 500 Internal Server Error: Prisma relationship error

// Payments
❌ 500 Internal Server Error: Prisma relationship error
❌ 500 Internal Server Error: Overdue list error
```

### After (Fixed)
```javascript
// Tenant password reset
✅ 200 OK: Password reset successfully

// Activity logs
✅ 200 OK: { activities: [...], pagination: {...} }

// Payments
✅ 200 OK: Payments list returned
✅ 200 OK: Overdue list returned
```

---

## Console Logging

### Password Reset
```
🔐 Reset password request - User role: manager, Tenant ID: tenant-123
✅ Password reset for tenant: john@email.com
```

### Activities
```
📋 Fetching manager activities: { userId: 'manager-123', role: 'manager', page: 1, limit: 5 }
✅ Fetched activities: { count: 5, total: 23, page: 1, totalPages: 5, hasMore: true }
```

---

## Files Modified

### Backend
- ✅ `backend/src/routes/tenant.ts` - Fixed password reset authorization
- ✅ `backend/src/routes/dashboard.ts` - Fixed activities query
- ✅ `backend/src/routes/payments.ts` - Fixed payments queries (2 endpoints)

### Documentation
- ✅ `MANAGER_AUTHORIZATION_FIXES.md` - This file

---

## Deployment Checklist

- [x] Tenant password reset authorization fixed
- [x] Activity logs endpoint fixed
- [x] Payments list endpoint fixed
- [x] Overdue payments endpoint fixed
- [x] Role variations handled consistently
- [x] Prisma relationships corrected
- [x] No linter errors
- [x] Tested with property manager
- [x] Tested with property owner
- [x] Console logging comprehensive
- [x] Documentation complete

---

## Troubleshooting

### If manager still gets 403 on password reset:
1. Verify manager is actually assigned to the property
2. Check `property_managers` table: `isActive = true`
3. Verify tenant has an active lease in that property
4. Check backend console logs for authorization details

### If activities still show 500 error:
1. Verify tables exist: `units`, `leases`, `activity_logs`
2. Check console for Prisma query errors
3. Ensure manager has assigned properties
4. Check `property_managers.isActive = true`

### If payments still show 500 error:
1. Verify `payments` and `leases` tables exist
2. Check Prisma schema for correct relationships
3. Verify manager has assigned properties
4. Check backend console for detailed error

### If frontend cache error persists:
1. Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
2. Clear browser cache completely
3. Rebuild frontend: `npm run build`
4. Restart development server

---

**Fix Date:** January 2025  
**Status:** ✅ Deployed and Working  
**Impact:** Critical - Unblocked Core Manager Functionality  
**Files Changed:** 3 Backend Files  
**Endpoints Fixed:** 4 (Password Reset, Activities, Payments x2)

