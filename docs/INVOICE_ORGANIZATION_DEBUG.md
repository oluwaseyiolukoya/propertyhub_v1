# Invoice Organization Data - Debugging Guide

## Issue
Organization data (company name, address) not showing in invoice - only seeing "CONTREZZ"

## Debugging Steps

### 1. **Check Browser Console**
Open the invoice detail modal and check the browser console for these logs:

```
[InvoiceDetailModal] Fetching organization data...
[InvoiceDetailModal] Account response: {...}
[InvoiceDetailModal] Customer data: {...}
```

**What to look for:**
- ✅ If you see all three logs → Data is being fetched
- ❌ If you see an error → API call failed
- ❌ If customer data is `null` → No organization data in database

### 2. **Check Organization Data in Settings**

1. Go to **Settings** (gear icon)
2. Click **Organization** tab
3. Check if these fields have data:
   - Organization Name
   - Business Address
   - City, State, ZIP
   - Phone Number
   - Website

**If fields are empty:**
- Fill them in
- Click "Save Changes"
- Go back to invoice and check again

### 3. **Check API Response**

In browser console, look for the account response:

```javascript
{
  data: {
    user: {...},
    customer: {
      id: "...",
      company: "Your Company Name",  // ← Should have value
      street: "123 Main St",         // ← Should have value
      city: "Lagos",                 // ← Should have value
      state: "Lagos State",          // ← Should have value
      postalCode: "100001",          // ← Should have value
      phone: "+234...",              // ← Should have value
      website: "...",                // ← Should have value
      email: "..."                   // ← Should have value
    }
  }
}
```

**If `customer` is `null`:**
- User might not have a `customerId`
- Check if logged in as correct user type (Developer)

**If `customer.company` is empty:**
- Organization name not set in database
- Need to update in Settings → Organization

### 4. **Check User Type**

Organization data only loads for users with a `customerId`. Check console for:

```
User type: developer
Customer ID: abc-123-def-456
```

**If no Customer ID:**
- User might be admin/super admin
- Create a proper developer account
- Link account to a customer

### 5. **Manual Database Check**

If you have database access, run:

```sql
-- Check if customer exists
SELECT id, company, street, city, state, postalCode, phone, website, email
FROM customers
WHERE id = 'YOUR_CUSTOMER_ID';

-- Check if user has customerId
SELECT id, name, email, role, "customerId"
FROM users
WHERE email = 'YOUR_EMAIL';
```

## Common Issues & Solutions

### Issue 1: "CONTREZZ" Still Showing
**Cause**: Organization data not in database
**Solution**: 
1. Go to Settings → Organization
2. Fill in all fields
3. Click "Save Changes"
4. Refresh invoice

### Issue 2: Loading Spinner Forever
**Cause**: API call failing or hanging
**Solution**:
1. Check browser console for errors
2. Check network tab for failed requests
3. Verify backend is running
4. Check authentication token

### Issue 3: Some Fields Missing
**Cause**: Fields not filled in Settings
**Solution**:
1. Go to Settings → Organization
2. Fill in missing fields
3. Click "Save Changes"
4. Fields will appear in next invoice

### Issue 4: Data Not Updating
**Cause**: Cache or state not refreshing
**Solution**:
1. Close invoice modal
2. Reopen invoice modal
3. Data should fetch fresh
4. If still not working, refresh page

## Expected Behavior

### With Organization Data
```
┌─────────────────────────────────────┐
│ ABC Development Ltd        INVOICE  │
│ 123 Main Street            INV-...  │
│ Lagos, Lagos State, 100001          │
│ +234 123 456 7890                   │
│ www.abcdev.com                      │
│ info@abcdev.com                     │
└─────────────────────────────────────┘
```

### Without Organization Data
```
┌─────────────────────────────────────┐
│ CONTREZZ                   INVOICE  │
│ (Update organization details in     │
│  Settings)                 INV-...  │
└─────────────────────────────────────┘
```

## Quick Fix Checklist

- [ ] Backend is running (`npm run dev` in backend folder)
- [ ] Logged in as Developer user (not admin)
- [ ] Organization data filled in Settings → Organization
- [ ] Clicked "Save Changes" after filling data
- [ ] Closed and reopened invoice modal
- [ ] Checked browser console for errors
- [ ] Network tab shows successful `/api/account` call
- [ ] Response includes `customer` object with `company` field

## Testing the Fix

### Step 1: Fill Organization Data
```
Settings → Organization:
- Organization Name: "ABC Development Ltd"
- Business Address: "123 Main Street"
- City: "Lagos"
- State: "Lagos State"
- ZIP Code: "100001"
- Phone: "+234 123 456 7890"
- Website: "www.abcdev.com"

Click "Save Changes"
```

### Step 2: Open Invoice
```
1. Go to Invoices page
2. Click "View Detail" on any invoice
3. Check invoice header
```

### Step 3: Verify Data
```
✅ Company name shows "ABC Development Ltd"
✅ Address shows "123 Main Street"
✅ City/State shows "Lagos, Lagos State, 100001"
✅ Phone shows "+234 123 456 7890"
✅ Website shows "www.abcdev.com"
✅ Email shows your organization email
```

### Step 4: Test PDF/Print
```
1. Click "Download PDF"
2. Check PDF shows organization data
3. Click "Print"
4. Check print preview shows organization data
```

## Console Logs to Check

### Successful Load
```
[InvoiceDetailModal] Fetching organization data...
[InvoiceDetailModal] Account response: {data: {user: {...}, customer: {...}}}
[InvoiceDetailModal] Customer data: {company: "ABC Development Ltd", ...}
```

### Failed Load
```
[InvoiceDetailModal] Fetching organization data...
[InvoiceDetailModal] Failed to fetch organization data: Error: ...
```

### No Customer Data
```
[InvoiceDetailModal] Fetching organization data...
[InvoiceDetailModal] Account response: {data: {user: {...}, customer: null}}
[InvoiceDetailModal] Customer data: null
```

## API Endpoint Details

**Endpoint**: `GET /api/account`
**Authentication**: Required (JWT token)
**Response**:
```json
{
  "user": {
    "id": "user-123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "property_developer"
  },
  "customer": {
    "id": "customer-123",
    "company": "ABC Development Ltd",
    "street": "123 Main Street",
    "city": "Lagos",
    "state": "Lagos State",
    "postalCode": "100001",
    "phone": "+234 123 456 7890",
    "website": "www.abcdev.com",
    "email": "info@abcdev.com"
  }
}
```

## Still Not Working?

If you've tried all the above and it's still not working:

1. **Check the exact console logs** and share them
2. **Check the network response** for `/api/account` in Network tab
3. **Verify organization data** is saved in Settings
4. **Try a different browser** to rule out cache issues
5. **Clear browser cache** and try again

## Files Involved

- **Frontend**: `src/modules/developer-dashboard/components/InvoiceDetailModal.tsx`
- **Backend**: `backend/src/routes/auth.ts` (GET /api/account)
- **Backend**: `backend/src/routes/settings.ts` (PUT /api/settings/organization)
- **Database**: `customers` table

## Summary

The invoice should automatically show your organization data from the database. If it's showing "CONTREZZ", it means:
1. Organization data not in database → Fill in Settings
2. API call failing → Check console/network
3. User not linked to customer → Check user type

Follow the debugging steps above to identify and fix the issue! 🔍

