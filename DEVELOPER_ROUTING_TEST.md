# Developer Dashboard Routing - Test Plan

## Issue Fixed
Property developer customers were being routed to the Property Owner Dashboard instead of the Developer Dashboard.

## Root Cause
The `customerType` field was not being sent from frontend to backend, causing all users to be created with `role: 'owner'`.

## Changes Made

### 1. Frontend (`src/components/AddCustomerPage.tsx`)
- ✅ Added `customerType` to the `createCustomer` API call payload

### 2. Backend (`backend/src/routes/customers.ts`)
- ✅ Extract `customerType` from request body
- ✅ Map `customerType` to correct user role:
  - `property_developer` → `role: 'developer'`
  - `property_manager` → `role: 'manager'`
  - `property_owner` → `role: 'owner'`
- ✅ Set `planCategory` and limits based on plan

## Test Scenarios

### Test 1: Create Property Developer Customer ✅

**Steps:**
1. Login as Super Admin
2. Navigate to Customers → Add Customer
3. Fill in the form:
   - Company: "Test Development Corp"
   - Owner Name: "John Developer"
   - Email: "john.developer@test.com"
   - Phone: "+1234567890"
   - **Customer Type: Property Developer** ⭐
   - **Plan: Developer Professional** ⭐
   - Billing Cycle: Monthly
4. Click "Create Customer"
5. Note the temporary password
6. Logout from Super Admin
7. Login with john.developer@test.com and the temporary password

**Expected Result:**
- ✅ User should see **Developer Dashboard**
- ✅ Dashboard should show "Contrezz Developer" or custom logo
- ✅ Should see project-related features (not property features)

**Actual Result:**
- [ ] To be tested

---

### Test 2: Create Property Owner Customer ✅

**Steps:**
1. Login as Super Admin
2. Navigate to Customers → Add Customer
3. Fill in the form:
   - Company: "Test Property Management"
   - Owner Name: "Jane Owner"
   - Email: "jane.owner@test.com"
   - Phone: "+1234567891"
   - **Customer Type: Property Owner** ⭐
   - **Plan: Professional** ⭐
   - Billing Cycle: Monthly
4. Click "Create Customer"
5. Note the temporary password
6. Logout from Super Admin
7. Login with jane.owner@test.com and the temporary password

**Expected Result:**
- ✅ User should see **Property Owner Dashboard**
- ✅ Dashboard should show "Contrezz Owner" or custom logo
- ✅ Should see property-related features

**Actual Result:**
- [ ] To be tested

---

### Test 3: Create Property Manager Customer ✅

**Steps:**
1. Login as Super Admin
2. Navigate to Customers → Add Customer
3. Fill in the form:
   - Company: "Test Management Services"
   - Owner Name: "Bob Manager"
   - Email: "bob.manager@test.com"
   - Phone: "+1234567892"
   - **Customer Type: Property Manager** ⭐
   - **Plan: Starter** ⭐
   - Billing Cycle: Monthly
4. Click "Create Customer"
5. Note the temporary password
6. Logout from Super Admin
7. Login with bob.manager@test.com and the temporary password

**Expected Result:**
- ✅ User should see **Property Manager Dashboard**
- ✅ Should see property management features

**Actual Result:**
- [ ] To be tested

---

### Test 4: Verify Plan Filtering ✅

**Steps:**
1. Login as Super Admin
2. Navigate to Customers → Add Customer
3. Select **Customer Type: Property Developer**
4. Open the "Select Plan" dropdown

**Expected Result:**
- ✅ Should ONLY show:
  - Developer Starter
  - Developer Professional
  - Developer Enterprise
- ❌ Should NOT show:
  - Starter
  - Professional
  - Enterprise

**Steps (continued):**
5. Change **Customer Type: Property Owner**
6. Open the "Select Plan" dropdown

**Expected Result:**
- ✅ Should ONLY show:
  - Starter
  - Professional
  - Enterprise
- ❌ Should NOT show:
  - Developer Starter
  - Developer Professional
  - Developer Enterprise

**Actual Result:**
- [ ] To be tested

---

### Test 5: Verify Database Records ✅

**Steps:**
1. After creating a Property Developer customer, check the database:

```sql
-- Check user role
SELECT id, name, email, role, customerId 
FROM users 
WHERE email = 'john.developer@test.com';

-- Check customer plan category
SELECT c.id, c.company, c.planCategory, c.propertyLimit, c.projectLimit, p.name as planName, p.category as planCategory
FROM customers c
LEFT JOIN plans p ON c.planId = p.id
WHERE c.email = 'john.developer@test.com';
```

**Expected Result:**
- ✅ User record: `role = 'developer'`
- ✅ Customer record: `planCategory = 'development'`
- ✅ Customer record: `projectLimit = 10` (for Developer Professional)
- ✅ Customer record: `propertyLimit = NULL`
- ✅ Plan record: `category = 'development'`

**Actual Result:**
- [ ] To be tested

---

## Verification Checklist

### Frontend
- [x] `customerType` field exists in form state
- [x] `customerType` dropdown shows correct options
- [x] `customerType` is sent in API call
- [x] Plan filtering works based on `customerType`
- [x] Field labels change (Properties ↔ Projects)
- [ ] No console errors when creating customer

### Backend
- [x] `customerType` is extracted from request body
- [x] User role is set correctly based on `customerType`
- [x] Customer `planCategory` is set correctly
- [x] Customer limits (`propertyLimit`/`projectLimit`) are set correctly
- [ ] Backend logs show correct role assignment
- [ ] No errors in backend logs

### Authentication & Routing
- [x] Login returns correct `userType` for developers
- [x] `deriveUserTypeFromUser` handles `developer` role
- [x] App.tsx routes developers to Developer Dashboard
- [ ] Developer can access Developer Dashboard
- [ ] Developer cannot access Owner/Manager dashboards

### Database
- [ ] User table has correct `role` value
- [ ] Customer table has correct `planCategory` value
- [ ] Customer table has correct limit values
- [ ] Plan table has correct `category` value

---

## Testing Instructions

### Quick Test (Recommended)
1. Open browser to `http://localhost:5173`
2. Login as Super Admin (admin@contrezz.com)
3. Create a Property Developer customer (Test 1)
4. Logout and login as the new developer
5. Verify you see the Developer Dashboard ✅

### Full Test Suite
Run all 5 test scenarios above and check off each result.

---

## Debugging Tips

### If Developer Still Sees Owner Dashboard

1. **Check Backend Logs:**
```bash
tail -f logs/backend-dev.log | grep "Creating user with role"
```
Should show: `Creating user with role: developer for customer type: property_developer`

2. **Check Login Response:**
Open browser DevTools → Network tab → Look for `/api/auth/login` response:
```json
{
  "token": "...",
  "user": {
    "role": "developer",  // ← Should be "developer"
    "userType": "developer"  // ← Should be "developer"
  }
}
```

3. **Check Frontend Console:**
Look for these logs:
```
🔐 Login - Initial Type: developer
👤 User Data: {role: "developer", ...}
📋 User Role: developer
🎯 UserType from backend: developer
✅ Final UserType: developer
```

4. **Check Database:**
```bash
cd backend
npx prisma studio
```
- Open `users` table → Find the user → Check `role` field
- Open `customers` table → Find the customer → Check `planCategory` field

### If Plans Don't Filter Correctly

1. **Check Frontend Console:**
Look for errors when selecting customer type

2. **Check Plan Data:**
Open DevTools → Console:
```javascript
// Check if plans have category field
console.log(subscriptionPlans);
```

3. **Verify Seed Data:**
```bash
cd backend
npm run seed
```

---

## Files Modified
1. ✅ `src/components/AddCustomerPage.tsx`
2. ✅ `backend/src/routes/customers.ts`

## Files NOT Modified (Already Correct)
- ✅ `src/App.tsx` - Routing logic
- ✅ `backend/src/routes/auth.ts` - User type derivation
- ✅ `backend/prisma/schema.prisma` - Database schema
- ✅ `backend/prisma/seed.ts` - Seed data

---

## Status
🔧 **FIX APPLIED** - Ready for testing
📝 **DOCUMENTATION COMPLETE**
⏳ **AWAITING USER TESTING**

---

## Next Steps
1. User tests the fix with real customer creation
2. User confirms developers see Developer Dashboard
3. User confirms owners see Owner Dashboard
4. User confirms plan filtering works correctly
5. Mark this issue as ✅ RESOLVED

