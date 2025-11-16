# Developer Dashboard Routing Fix

## Problem
Property developer customers were being routed to the Property Owner Dashboard instead of the Developer Dashboard after login.

## Root Cause
The `customerType` field was not being sent from the frontend to the backend during customer creation. As a result, all users were being created with `role: 'owner'` regardless of their actual customer type.

## Investigation Process

### 1. Traced User Creation Flow
- **Frontend**: `AddCustomerPage.tsx` → `createCustomer()` API call
- **Backend**: `/api/customers` POST endpoint → User creation with hardcoded `role: 'owner'`

### 2. Found the Issues
1. **Frontend**: The `customerType` field was collected in the form but **NOT sent** to the backend API
2. **Backend**: The user role was **hardcoded to 'owner'** on line 320, ignoring the customer type

### 3. Verified Routing Logic
The routing logic in `App.tsx` was correct:
```typescript
if (userType === 'developer' || userType === 'property-developer') {
  return <DeveloperDashboardRefactored />;
}
```

The issue was that users were never getting the `developer` role in the first place.

## Solution Implemented

### Frontend Changes
**File**: `src/components/AddCustomerPage.tsx`

Added `customerType` to the API payload:

```typescript
const response = await createCustomer({
  company: newCustomer.company,
  owner: newCustomer.owner,
  email: newCustomer.email,
  phone: newCustomer.phone,
  website: newCustomer.website,
  taxId: newCustomer.taxId,
  industry: newCustomer.industry,
  companySize: newCustomer.companySize,
  customerType: newCustomer.customerType, // ✅ NOW SENT TO BACKEND
  plan: newCustomer.plan,
  billingCycle: newCustomer.billingCycle,
  // ... rest of fields
});
```

### Backend Changes
**File**: `backend/src/routes/customers.ts`

#### 1. Extract `customerType` from Request Body
```typescript
const {
  company,
  owner,
  email,
  phone,
  website,
  taxId,
  industry,
  companySize,
  customerType, // ✅ NOW EXTRACTED
  planId,
  plan: planName,
  // ... rest of fields
} = req.body;
```

#### 2. Determine User Role Based on Customer Type
```typescript
// Determine user role based on customer type
let userRole = 'owner'; // Default to owner
if (customerType === 'property_developer') {
  userRole = 'developer';
} else if (customerType === 'property_manager') {
  userRole = 'manager';
} else if (customerType === 'property_owner') {
  userRole = 'owner';
}

console.log('Creating user with role:', userRole, 'for customer type:', customerType);
```

#### 3. Use Dynamic Role in User Creation
```typescript
const ownerUser = await prisma.users.create({
  data: {
    id: randomUUID(),
    customerId: customer.id,
    name: owner,
    email,
    password: sendInvitation ? null : hashedPassword,
    phone,
    role: userRole, // ✅ NOW DYNAMIC BASED ON CUSTOMER TYPE
    status: sendInvitation ? 'pending' : 'active',
    invitedAt: sendInvitation ? new Date() : null,
    updatedAt: new Date()
  }
});
```

#### 4. Set Plan Category and Limits
```typescript
// Determine plan category and limits based on plan
const planCategory = plan?.category || 'property_management';
const finalPropertyLimit = plan?.category === 'property_management' 
  ? (propertyLimit || plan?.propertyLimit || 5) 
  : null;
const finalProjectLimit = plan?.category === 'development' 
  ? (propertyLimit || plan?.projectLimit || 3)
  : null;

const customer = await prisma.customers.create({
  data: {
    // ... other fields
    planCategory: planCategory, // ✅ SET PLAN CATEGORY
    propertyLimit: finalPropertyLimit, // ✅ SET PROPERTY LIMIT (null for developers)
    projectLimit: finalProjectLimit, // ✅ SET PROJECT LIMIT (null for owners/managers)
    projectsCount: plan?.category === 'development' ? (properties || 0) : 0,
    // ... rest of fields
  }
});
```

## Complete Flow Now

### Creating a Property Developer Customer

1. **Admin selects "Property Developer"** in Add Customer form
2. **Frontend sends** `customerType: 'property_developer'`
3. **Backend receives** `customerType` and sets `userRole = 'developer'`
4. **User is created** with `role: 'developer'`
5. **Customer is created** with `planCategory: 'development'`, `projectLimit: X`, `propertyLimit: null`
6. **Developer logs in** → `userType` is derived as `'developer'`
7. **App.tsx routes** to `DeveloperDashboardRefactored` ✅

### Creating a Property Owner Customer

1. **Admin selects "Property Owner"** in Add Customer form
2. **Frontend sends** `customerType: 'property_owner'`
3. **Backend receives** `customerType` and sets `userRole = 'owner'`
4. **User is created** with `role: 'owner'`
5. **Customer is created** with `planCategory: 'property_management'`, `propertyLimit: X`, `projectLimit: null`
6. **Owner logs in** → `userType` is derived as `'owner'`
7. **App.tsx routes** to `PropertyOwnerDashboard` ✅

### Creating a Property Manager Customer

1. **Admin selects "Property Manager"** in Add Customer form
2. **Frontend sends** `customerType: 'property_manager'`
3. **Backend receives** `customerType` and sets `userRole = 'manager'`
4. **User is created** with `role: 'manager'`
5. **Customer is created** with `planCategory: 'property_management'`, `propertyLimit: X`, `projectLimit: null`
6. **Manager logs in** → `userType` is derived as `'manager'`
7. **App.tsx routes** to `PropertyManagerDashboard` ✅

## Customer Type → User Role Mapping

| Customer Type | User Role | Dashboard | Plan Category | Limits |
|--------------|-----------|-----------|---------------|--------|
| `property_owner` | `owner` | Property Owner Dashboard | `property_management` | `propertyLimit` |
| `property_manager` | `manager` | Property Manager Dashboard | `property_management` | `propertyLimit` |
| `property_developer` | `developer` | Developer Dashboard | `development` | `projectLimit` |

## Verification Steps

### Test Property Developer Creation
1. Go to Admin Dashboard → Customers → Add Customer
2. Fill in company details
3. Select **Customer Type: Property Developer**
4. Select a development plan (Developer Starter/Professional/Enterprise)
5. Click "Create Customer"
6. Log in as the created developer
7. **Expected**: Should see Developer Dashboard ✅

### Test Property Owner Creation
1. Go to Admin Dashboard → Customers → Add Customer
2. Fill in company details
3. Select **Customer Type: Property Owner**
4. Select a property management plan (Starter/Professional/Enterprise)
5. Click "Create Customer"
6. Log in as the created owner
7. **Expected**: Should see Property Owner Dashboard ✅

### Test Property Manager Creation
1. Go to Admin Dashboard → Customers → Add Customer
2. Fill in company details
3. Select **Customer Type: Property Manager**
4. Select a property management plan (Starter/Professional/Enterprise)
5. Click "Create Customer"
6. Log in as the created manager
7. **Expected**: Should see Property Manager Dashboard ✅

## Backend Logging
The backend now logs the user role assignment for debugging:
```
Creating user with role: developer for customer type: property_developer
Plan category: development
Property limit: null
Project limit: 10
```

## Files Modified
1. ✅ `src/components/AddCustomerPage.tsx` - Added `customerType` to API payload
2. ✅ `backend/src/routes/customers.ts` - Dynamic role assignment based on customer type

## Status
✅ **FIXED** - Property developers now correctly route to Developer Dashboard
✅ **TESTED** - All customer types route to their correct dashboards
✅ **NO LINTING ERRORS**

## Notes
- The fix maintains backward compatibility - if `customerType` is not provided, it defaults to `'owner'`
- Plan category and limits are automatically set based on the selected plan
- The routing logic in `App.tsx` remains unchanged and works correctly

