# Invoice Organization Branding - Dynamic Company Information

## Overview
Updated the invoice PDF/print generation to dynamically display the user's organization information instead of hardcoded "CONTREZZ" branding. The invoice now shows the actual company name, address, and contact details from the database.

## Changes Made

### 1. **Organization Data Fetching** ✅

Added state and API call to fetch organization data:

```typescript
// Organization data state
const [organizationData, setOrganizationData] = useState<any>(null);
const [loadingOrganization, setLoadingOrganization] = useState(false);

// Fetch organization data
const fetchOrganizationData = async () => {
  try {
    setLoadingOrganization(true);
    const response = await apiClient.get<any>('/api/account');
    if (response.data) {
      setOrganizationData(response.data.customer);
    }
  } catch (error) {
    console.error('Failed to fetch organization data:', error);
  } finally {
    setLoadingOrganization(false);
  }
};
```

### 2. **Invoice Header - Company Information** ✅

**Before**:
```
CONTREZZ
Property Development Management
www.contrezz.com
```

**After** (Dynamic):
```
{Your Company Name}
{Street Address}
{City, State, Postal Code}
{Phone Number}
{Website}
{Email}
```

**Implementation**:
```tsx
<div>
  <h1 className="text-xl font-bold text-gray-900 mb-1">
    {organizationData?.company || 'CONTREZZ'}
  </h1>
  {organizationData?.street && (
    <p className="text-xs text-gray-600">{organizationData.street}</p>
  )}
  {(organizationData?.city || organizationData?.state) && (
    <p className="text-xs text-gray-600">
      {[organizationData?.city, organizationData?.state, organizationData?.postalCode]
        .filter(Boolean)
        .join(', ')}
    </p>
  )}
  {organizationData?.phone && (
    <p className="text-xs text-gray-600">{organizationData.phone}</p>
  )}
  {organizationData?.website && (
    <p className="text-xs text-gray-600">{organizationData.website}</p>
  )}
  {organizationData?.email && (
    <p className="text-xs text-gray-600">{organizationData.email}</p>
  )}
</div>
```

### 3. **Invoice Footer - Contact Information** ✅

**Before**:
```
Email: billing@contrezz.com
Phone: +234 XXX XXX XXXX

CONTREZZ - Property Development Management Platform
```

**After** (Dynamic):
```
Email: {Your Organization Email}
Phone: {Your Organization Phone}

{Your Company Name} - Property Development Management
```

**Implementation**:
```tsx
<p className="text-xs text-gray-600">
  For questions about this invoice, please contact:<br />
  {organizationData?.email && (
    <>Email: {organizationData.email}<br /></>
  )}
  {organizationData?.phone && (
    <>Phone: {organizationData.phone}</>
  )}
  {!organizationData?.email && !organizationData?.phone && (
    <>
      Email: billing@contrezz.com<br />
      Phone: +234 XXX XXX XXXX
    </>
  )}
</p>

{/* Footer bar */}
<p className="text-xs text-gray-400 mt-0.5">
  {organizationData?.company || 'CONTREZZ'} - Property Development Management
</p>
```

## Data Source

### Organization Data Fields Used

| Field | Source | Display Location | Fallback |
|-------|--------|------------------|----------|
| `company` | `customers.company` | Header (Company Name), Footer | 'CONTREZZ' |
| `street` | `customers.street` | Header (Address Line 1) | Hidden if empty |
| `city` | `customers.city` | Header (Address Line 2) | Hidden if empty |
| `state` | `customers.state` | Header (Address Line 2) | Hidden if empty |
| `postalCode` | `customers.postalCode` | Header (Address Line 2) | Hidden if empty |
| `phone` | `customers.phone` | Header, Footer Contact | Hidden if empty |
| `website` | `customers.website` | Header | Hidden if empty |
| `email` | `customers.email` | Header, Footer Contact | Hidden if empty |

### API Endpoint
- **Endpoint**: `GET /api/account`
- **Returns**: User and customer (organization) data
- **Authentication**: Required (JWT token)

## Visual Examples

### Example 1: Complete Organization Data
```
┌─────────────────────────────────────────────────────────┐
│ ABC Development Ltd            INVOICE                  │
│ 123 Main Street                INV-2025-001             │
│ Lagos, Lagos State, 100001                              │
│ +234 123 456 7890                                       │
│ www.abcdev.com                                          │
│ info@abcdev.com                                         │
│ ──────────────────────────────────────────────────────  │
│                                                         │
│ [Invoice Details...]                                    │
│                                                         │
│ ──────────────────────────────────────────────────────  │
│ Contact Information                                     │
│ Email: info@abcdev.com                                  │
│ Phone: +234 123 456 7890                                │
│                                                         │
│ ███████████████████████████████████████████████████████ │
│ Thank you for your business! • Generated on Nov 19 2025 │
│ ABC Development Ltd - Property Development Management   │
└─────────────────────────────────────────────────────────┘
```

### Example 2: Minimal Organization Data
```
┌─────────────────────────────────────────────────────────┐
│ My Company                     INVOICE                  │
│                                INV-2025-001             │
│ ──────────────────────────────────────────────────────  │
│                                                         │
│ [Invoice Details...]                                    │
│                                                         │
│ ──────────────────────────────────────────────────────  │
│ Contact Information                                     │
│ Email: billing@contrezz.com                             │
│ Phone: +234 XXX XXX XXXX                                │
│                                                         │
│ ███████████████████████████████████████████████████████ │
│ Thank you for your business! • Generated on Nov 19 2025 │
│ My Company - Property Development Management            │
└─────────────────────────────────────────────────────────┘
```

### Example 3: No Organization Data (Fallback)
```
┌─────────────────────────────────────────────────────────┐
│ CONTREZZ                       INVOICE                  │
│                                INV-2025-001             │
│ ──────────────────────────────────────────────────────  │
│                                                         │
│ [Invoice Details...]                                    │
│                                                         │
│ ──────────────────────────────────────────────────────  │
│ Contact Information                                     │
│ Email: billing@contrezz.com                             │
│ Phone: +234 XXX XXX XXXX                                │
│                                                         │
│ ███████████████████████████████████████████████████████ │
│ Thank you for your business! • Generated on Nov 19 2025 │
│ CONTREZZ - Property Development Management Platform     │
└─────────────────────────────────────────────────────────┘
```

## Features

### ✅ **Dynamic Data Loading**
- Organization data fetched when invoice modal opens
- Uses existing `/api/account` endpoint
- No additional backend changes required

### ✅ **Graceful Fallbacks**
- Company name falls back to "CONTREZZ" if not set
- Address fields hidden if empty
- Contact info falls back to default if not set
- No broken layout if data is missing

### ✅ **Conditional Rendering**
- Only shows fields that have data
- Smart address formatting (City, State, ZIP)
- Clean, professional appearance

### ✅ **Print & PDF Compatible**
- Organization data included in PDF export
- Proper formatting for A4 paper
- All data visible in print preview

### ✅ **Real-time Updates**
- Fetches latest organization data each time
- Reflects changes made in Settings
- No caching issues

## How to Update Organization Information

Users can update their organization information in **Settings → Organization**:

1. Navigate to **Developer Settings**
2. Click on **Organization** tab
3. Update fields:
   - Organization Name
   - Business Address
   - City, State, ZIP Code
   - Phone Number
   - Website
   - Email
4. Click **Save Changes**
5. Next invoice will show updated information

## Data Flow

```
User opens Invoice Detail Modal
    ↓
Component mounts
    ↓
useEffect triggers
    ↓
fetchOrganizationData() called
    ↓
API call to /api/account
    ↓
organizationData state updated
    ↓
Invoice header renders with organization data
    ↓
Invoice footer renders with organization data
    ↓
User downloads PDF or prints
    ↓
PDF includes organization information
```

## Benefits

### ✅ **Professional Branding**
- Each company's invoices show their own branding
- Builds trust with vendors
- Professional appearance

### ✅ **Multi-tenant Support**
- Each customer sees their own company info
- No hardcoded values
- Scalable solution

### ✅ **Easy Customization**
- Users can update info in Settings
- Changes reflect immediately
- No developer intervention needed

### ✅ **Compliance**
- Invoices show correct legal entity
- Proper contact information
- Meets business documentation standards

## Files Modified

1. **`src/modules/developer-dashboard/components/InvoiceDetailModal.tsx`**
   - Added `organizationData` state
   - Added `fetchOrganizationData` function
   - Updated invoice header to use organization data
   - Updated invoice footer to use organization data
   - Added conditional rendering for all fields

## Testing Checklist

### With Complete Organization Data
- [x] Company name displays in header
- [x] Street address displays
- [x] City, State, ZIP display on one line
- [x] Phone number displays
- [x] Website displays
- [x] Email displays
- [x] Footer shows company email
- [x] Footer shows company phone
- [x] Footer bar shows company name
- [x] PDF export includes all data
- [x] Print includes all data

### With Partial Organization Data
- [x] Company name displays (or fallback)
- [x] Missing fields are hidden
- [x] No broken layout
- [x] Footer uses available data
- [x] Fallback contact info shown if needed

### With No Organization Data
- [x] Falls back to "CONTREZZ"
- [x] Default contact info shown
- [x] Invoice still generates correctly
- [x] No errors in console

## Summary

✅ **Dynamic Organization Branding**: Invoices now show the user's actual company information
✅ **8 Fields Integrated**: Company name, address, city, state, ZIP, phone, website, email
✅ **Graceful Fallbacks**: Works even with missing data
✅ **Real-time Updates**: Reflects changes from Settings immediately
✅ **Professional Appearance**: Each company has their own branded invoices
✅ **Multi-tenant Ready**: Supports multiple organizations on the platform

Invoices are now fully branded with the organization's information! 🎉

