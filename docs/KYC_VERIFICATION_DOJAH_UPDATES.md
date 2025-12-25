# KYC Verification Module - Dojah API Updates

## Summary

Updated the KYC Verification Module design to align with official Dojah API documentation.

---

## Key Updates

### 1. **Added BVN (Bank Verification Number) Support** ⭐ NEW

**Endpoint:** `GET /api/v1/kyc/bvn`

**Why Add BVN:**
- Alternative verification method when NIN is not available
- Financial services compliance requirement
- Additional verification layer for enhanced security

**Implementation:**
- Added `verifyBVN()` method to `DojahVerificationService`
- BVN validation returns confidence values for name matching
- Response format: `entity.first_name.confidence_value` and `entity.last_name.confidence_value`

**Documentation:** https://docs.dojah.io/docs/nigeria/validate-bvn

---

### 2. **Verified Correct Endpoints**

| Document Type | Endpoint | Status |
|--------------|----------|--------|
| NIN | `GET /api/v1/kyc/nin` | ✅ Correct |
| Passport | `GET /api/v1/kyc/passport` | ✅ Correct |
| Driver's License | `GET /api/v1/kyc/dl` | ⚠️ **Discrepancy** |
| VIN | `GET /api/v1/kyc/vin` | ✅ Correct |
| BVN | `GET /api/v1/kyc/bvn` | ✅ Added |

**⚠️ Driver's License Endpoint Issue:**
- **Dojah Docs:** `/api/v1/kyc/dl`
- **Existing Code:** `/api/v1/kyc/drivers_license`
- **Action Required:** Verify which endpoint works in production before deploying

---

### 3. **Response Field Mapping Corrections**

#### Date Format Variations
- **Driver's License:** `DD-MM-YYYY` format (e.g., `28-09-1998`)
- **All Others:** `YYYY-MM-DD` format (e.g., `1990-01-15`)

**Implementation Impact:**
- Need to handle date format conversion for Driver's License
- All other endpoints use standard `YYYY-MM-DD` format

#### Name Field Variations
- **NIN:** `entity.firstname`, `entity.surname`
- **Passport:** `entity.first_name`, `entity.last_name`
- **Driver's License:** `entity.firstName`, `entity.lastName`
- **VIN:** `entity.full_name` (single field - needs parsing)
- **BVN:** `entity.first_name.value`, `entity.last_name.value`

---

### 4. **Additional Verification Options**

#### Phone Number Lookup (Optional)
**Endpoint:** `GET /api/v1/kyc/phone_number/basic` or `/api/v1/kyc/phone_number`

**Use Case:**
- Secondary verification method
- Cross-reference with submitted documents
- Enhanced identity verification

**Documentation:** https://docs.dojah.io/docs/nigeria/lookup-phone-number

#### Virtual NIN (vNIN) (Optional)
**Endpoint:** `GET /api/v1/kyc/vnin`

**Use Case:**
- Privacy-enhanced alternative to regular NIN
- Valid for 72 hours only
- Generated via NIMC Mobile App or USSD

**Important:** vNIN should NOT be stored in database (NIMC requirement)

**Documentation:** https://docs.dojah.io/docs/nigeria/lookup-virtual-nin

---

## Updated Type Definitions

### Backend Service
```typescript
documentType: 'nin' | 'passport' | 'dl' | 'vin' | 'bvn'
```

### Frontend API
```typescript
documentType: 'nin' | 'passport' | 'dl' | 'vin' | 'bvn'
```

### Frontend Dialog
```typescript
documentType: 'nin' | 'passport' | 'dl' | 'vin' | 'bvn' | ''
```

---

## Implementation Checklist Updates

### New Items Added:
- [ ] Add BVN verification method to `DojahVerificationService`
- [ ] Verify Driver's License endpoint (`/api/v1/kyc/dl` vs `/api/v1/kyc/drivers_license`)
- [ ] Add BVN option to frontend document type selector
- [ ] Handle Driver's License date format (`DD-MM-YYYY`)
- [ ] Handle VIN `full_name` parsing (single field)
- [ ] Test BVN verification with sandbox credentials (`22222222222`)
- [ ] Update error handling for BVN-specific errors

### Updated Items:
- [ ] Update type definitions to include `'bvn'`
- [ ] Update API endpoint validation to accept `'bvn'`
- [ ] Update frontend dialog to show BVN option
- [ ] Update documentation references

---

## Test Credentials (Sandbox)

| Document Type | Test Value | Endpoint |
|--------------|------------|----------|
| NIN | `12345678901` | `/api/v1/kyc/nin` |
| Passport | `A12345678` | `/api/v1/kyc/passport` |
| Driver's License | `FKJ494A2133` | `/api/v1/kyc/dl` |
| VIN | `91F6B1F5BE29535558655586` | `/api/v1/kyc/vin` |
| **BVN** | **`22222222222`** | **`/api/v1/kyc/bvn`** ⭐ NEW |

---

## Files Updated

1. ✅ `docs/KYC_VERIFICATION_DOJAH_API_REFERENCE.md` (NEW)
   - Complete Dojah API reference
   - All endpoints, parameters, response formats
   - Field mapping table
   - Test credentials

2. ✅ `docs/KYC_VERIFICATION_IMPLEMENTATION_GUIDE.md`
   - Added BVN support
   - Updated type definitions
   - Added BVN verification method
   - Added endpoint notes

3. ✅ `docs/KYC_VERIFICATION_MODULE_DESIGN.md`
   - Added BVN to document types
   - Updated request body types
   - Added API reference link

4. ✅ `docs/KYC_VERIFICATION_DOJAH_UPDATES.md` (THIS FILE)
   - Summary of all updates

---

## Next Steps

1. **Verify Driver's License Endpoint**
   - Test both `/api/v1/kyc/dl` and `/api/v1/kyc/drivers_license`
   - Update code to use correct endpoint
   - Update DojahProvider if needed

2. **Implement BVN Verification**
   - Add `verifyBVN()` method to service
   - Test with sandbox credentials
   - Add to frontend UI

3. **Handle Date Format Differences**
   - Add date format conversion for Driver's License
   - Ensure consistent date handling across all document types

4. **Update Frontend**
   - Add BVN to document type selector
   - Update validation logic
   - Test BVN verification flow

---

## References

- [Dojah NIN Lookup](https://docs.dojah.io/docs/nigeria/lookup-nin)
- [Dojah Passport Lookup](https://docs.dojah.io/docs/nigeria/lookup-passport)
- [Dojah Driver's License Lookup](https://docs.dojah.io/docs/nigeria/lookup-drivers-license)
- [Dojah Voter's ID Lookup](https://docs.dojah.io/docs/nigeria/lookup-voters-id)
- [Dojah BVN Validation](https://docs.dojah.io/docs/nigeria/validate-bvn) ⭐ NEW
- [Dojah Phone Number Lookup](https://docs.dojah.io/docs/nigeria/lookup-phone-number)
- [Dojah Virtual NIN Lookup](https://docs.dojah.io/docs/nigeria/lookup-virtual-nin)

---

**Last Updated:** December 22, 2025
**Status:** Updated with Official Dojah Documentation


