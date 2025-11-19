# Vendor Dropdown Fix - Create Invoice Modal

## Issue
The "Create New Invoice" modal was showing hardcoded vendors (BuildRight Steel Ltd, PowerTech Solutions, etc.) instead of the real vendors created in the Purchase Orders page.

## Root Cause
In `src/modules/developer-dashboard/components/CreateInvoiceModal.tsx`:
- Line 90-95 had a hardcoded `const vendors` array
- The useEffect was trying to fetch real vendors but couldn't update the const array
- Type casting `(setVendors as any)` was used but there was no state setter

## Solution Applied

### 1. Changed Hardcoded Array to State
**Before:**
```typescript
const vendors = [
  { id: 'vendor-1', name: 'BuildRight Steel Ltd' },
  { id: 'vendor-2', name: 'PowerTech Solutions' },
  { id: 'vendor-3', name: 'Concrete Masters' },
  { id: 'vendor-4', name: 'Design Studio Pro' },
];
```

**After:**
```typescript
const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([]);
```

### 2. Added Missing Imports
```typescript
import { getVendors } from '../../../lib/api/vendors';
import { apiClient } from '../../../lib/api-client';
```

### 3. Cleaned Up Vendor Fetching Logic
Removed unnecessary type casting and added proper error logging:
```typescript
const response: any = await getVendors();
if (response?.data) {
  const list = response.data.map((v: any) => ({ id: v.id, name: v.name }));
  setVendors(list);
} else {
  setVendors([]);
}
```

## Result
✅ The vendor dropdown now displays real vendors from the database
✅ Any vendor created in Purchase Orders page appears in the invoice modal
✅ Empty state shows "No vendors found" if no vendors exist
✅ Vendors are fetched fresh every time the modal opens

## Testing
1. Go to **Purchase Orders** page
2. Click **"Add Vendor"** button
3. Create a new vendor (e.g., "Test Vendor ABC")
4. Go to **Invoices** page
5. Click **"New Invoice"**
6. Open the **Vendor** dropdown
7. ✅ You should see "Test Vendor ABC" in the list (not hardcoded vendors)

## Files Modified
- `src/modules/developer-dashboard/components/CreateInvoiceModal.tsx`
  - Added vendors state (line 84)
  - Added imports for `getVendors` and `apiClient` (lines 31-32)
  - Cleaned up vendor fetching logic (lines 106-119)

