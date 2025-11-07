# Tax ID Feature - Testing Guide

## Overview
The Tax ID field is now fully connected between the Admin Dashboard (customer creation) and the Owner Dashboard (company information page).

## Changes Made

### 1. Backend API (`backend/src/routes/auth.ts`)
- ✅ **GET /api/auth/account**: Now returns `taxId`, `industry`, and `companySize` in the customer object
- ✅ **PUT /api/auth/account**: Already handles `taxId` updates correctly

### 2. Frontend TypeScript (`src/lib/api/auth.ts`)
- ✅ Updated `getAccountInfo` response interface to include:
  - `taxId?: string`
  - `industry?: string`
  - `companySize?: string`
  - Address fields (`street`, `city`, `state`, `postalCode`, `zipCode`, `country`)

### 3. Database Schema
- ✅ `customers.taxId` field already exists in the database (nullable string)

## Testing Steps

### Test 1: Create Customer with Tax ID (Admin)
1. **Login as Admin**
   - Email: `admin@propertyhub.com`
   - Password: `admin123`

2. **Navigate to Customers Tab**
   - Click "Add Customer" button

3. **Fill in Customer Form**
   - Company Name: `Test Company LLC`
   - Owner Name: `John Doe`
   - Email: `john.doe@testcompany.com`
   - Phone: `+1234567890`
   - **Tax ID: `12-3456789`** ← Enter this value
   - Select a plan
   - Fill in other required fields

4. **Submit Form**
   - Click "Create Customer"
   - Note the temporary password or invitation link

### Test 2: Verify Tax ID in Owner Dashboard
1. **Login as Owner**
   - Email: `john.doe@testcompany.com`
   - Password: (use temporary password from step 1)

2. **Navigate to Settings**
   - Click on user avatar/settings icon
   - Go to "Settings" or "Profile"

3. **Check Company Information Tab**
   - Click on "Company Information" tab
   - **Verify**: Tax ID field displays `12-3456789`
   - The field should be visible and populated

### Test 3: Verify Tax ID is Read-Only for Owner
1. **Still in Company Information Tab**
   - Click "Edit" button
   - **Verify**: Tax ID field remains disabled (grayed out)
   - **Verify**: Helper text shows: "Tax ID can only be updated by an administrator"
   - Tax ID field should NOT be editable even in edit mode

2. **Update Tax ID as Admin (if needed)**
   - Log out from owner account
   - Log back in as admin
   - Navigate to Customers tab
   - Find the customer and click "Edit"
   - Update the Tax ID field
   - Save changes
   - Log back in as owner to verify the updated Tax ID

### Test 4: Verify in Database (Optional)
If you have database access, verify the data:

```sql
SELECT id, company, owner, email, "taxId", industry, "companySize" 
FROM customers 
WHERE email = 'john.doe@testcompany.com';
```

Expected result: `taxId` column should show the updated value.

## Expected Behavior

### Admin Dashboard - Customer Creation
- Tax ID field is visible in the "Add Customer" form
- Field label: "Tax ID"
- Placeholder: "Tax identification number"
- Field is optional (can be left empty)

### Owner Dashboard - Company Information
- Tax ID field is visible in the "Company Information" tab
- Field label: "Tax ID (EIN)"
- **Field is ALWAYS read-only for owners** (cannot be edited)
- Helper text: "Tax ID can only be updated by an administrator"
- Field has a gray background to indicate it's disabled
- Only admins can update the Tax ID through the Customers management page

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Dashboard                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Add Customer Form                                    │  │
│  │  - Tax ID: [12-3456789]                              │  │
│  │  - Other fields...                                    │  │
│  │  [Create Customer Button]                            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
              POST /api/customers
              { taxId: "12-3456789", ... }
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database                               │
│  customers table                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ id | company | owner | email | taxId | ...         │   │
│  │ 1  | Test Co | John  | j@... | 12-3456789 | ...    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
              GET /api/auth/account
              Returns: { customer: { taxId: "12-3456789", ... } }
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Owner Dashboard                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Company Information Tab                              │  │
│  │  Tax ID (EIN): [12-3456789] (READ-ONLY)             │  │
│  │  ℹ️  Tax ID can only be updated by an administrator  │  │
│  │  [Edit] [Save] (Tax ID remains disabled)            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
              
              Owner CANNOT update Tax ID
              Only other company fields can be updated
              
┌─────────────────────────────────────────────────────────────┐
│         Admin Updates Tax ID (if needed)                    │
│  Admin → Customers → Edit Customer → Update Tax ID         │
│  → Database updated → Owner sees new value on next login   │
└─────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Issue: Tax ID not showing in Owner Dashboard
**Solution**: 
- Ensure backend is running (restart if needed)
- Check browser console for API errors
- Verify the customer was created with a Tax ID value
- Clear browser cache and refresh

### Issue: Owner trying to edit Tax ID
**Solution**:
- Tax ID is intentionally read-only for owners
- Only administrators can update the Tax ID
- Owner should contact their admin to update the Tax ID
- Admin can update it via: Customers → Edit Customer → Tax ID field

### Issue: Tax ID field is empty even though it was entered
**Solution**:
- Verify the customer record in the database has the taxId value
- Check that the GET /api/auth/account endpoint returns the taxId field
- Inspect the API response in browser DevTools Network tab

## API Endpoints Reference

### GET /api/auth/account
**Response includes:**
```json
{
  "user": { ... },
  "customer": {
    "id": "...",
    "company": "Test Company LLC",
    "taxId": "12-3456789",
    "industry": "Real Estate",
    "companySize": "1-10",
    "website": "https://...",
    ...
  }
}
```

### PUT /api/auth/account
**Request body:**
```json
{
  "company": "Test Company LLC",
  "taxId": "98-7654321",
  "industry": "Real Estate",
  "companySize": "1-10",
  ...
}
```

## Success Criteria
- ✅ Admin can enter Tax ID when creating a customer
- ✅ Tax ID is saved to the database
- ✅ Owner can view Tax ID in Company Information tab
- ✅ Tax ID field is read-only for owners (cannot be edited)
- ✅ Helper text indicates admin-only access
- ✅ Admin can update Tax ID via Customers management
- ✅ Tax ID persists and displays correctly after updates
- ✅ No console errors or API failures

## Notes
- Tax ID field is optional (nullable in database)
- Field accepts any string format (no validation currently)
- Consider adding format validation if needed (e.g., XX-XXXXXXX for US EIN)
- Field is labeled as "Tax ID (EIN)" for US context, but can store any tax identifier
- **Security**: Tax ID is read-only for owners to prevent unauthorized changes
- Only administrators with proper access can modify Tax ID values

---

**Status**: ✅ Fully Implemented and Ready for Testing
**Last Updated**: 2025-11-05

