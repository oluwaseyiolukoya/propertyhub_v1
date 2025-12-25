# Dojah API Reference for KYC Verification Module

## Overview

This document provides the correct Dojah API endpoints, parameters, and response formats based on the official Dojah documentation.

**Base URL:** `https://api.dojah.io`

**Authentication Headers:**

```
AppId: YOUR_APP_ID
Authorization: YOUR_SECRET_KEY
Content-Type: application/json
```

---

## Supported Document Types

### 1. **National Identification Number (NIN)** ✅

**Endpoint:** `GET /api/v1/kyc/nin`

**Documentation:** https://docs.dojah.io/docs/nigeria/lookup-nin

**Query Parameters:**

- `nin` (required) - 11-digit National Identification Number

**Response Format:**

```json
{
  "entity": {
    "nin": "12345678901",
    "firstname": "John",
    "surname": "Doe",
    "middlename": "Smith",
    "birthdate": "1990-01-15",
    "gender": "Male",
    "phone": "+2348012345678",
    "residence_address": "123 Main Street, Lagos",
    "photo": "base64_encoded_image"
  },
  "reference_id": "REF123456"
}
```

**Implementation Notes:**

- Use `entity.firstname` and `entity.surname` for name matching
- `entity.birthdate` format: `YYYY-MM-DD`
- Photo is base64 encoded image

---

### 2. **International Passport** ✅

**Endpoint:** `GET /api/v1/kyc/passport`

**Documentation:** https://docs.dojah.io/docs/nigeria/lookup-passport

**Query Parameters:**

- `passport_number` (required) - Passport number

**Response Format:**

```json
{
  "entity": {
    "passport_number": "A12345678",
    "first_name": "John",
    "last_name": "Doe",
    "middle_name": "Smith",
    "date_of_birth": "1990-01-15",
    "gender": "Male",
    "nationality": "Nigerian",
    "issue_date": "2020-01-01",
    "expiry_date": "2030-01-01"
  },
  "reference_id": "REF123456"
}
```

**Implementation Notes:**

- Use `entity.first_name` and `entity.last_name`
- `entity.date_of_birth` format: `YYYY-MM-DD`

---

### 3. **Driver's License** ✅

**Endpoint:** `GET /api/v1/kyc/dl`

**Documentation:** https://docs.dojah.io/docs/nigeria/lookup-drivers-license

**Query Parameters:**

- `license_number` (required) - Driver's license number

**Response Format:**

```json
{
  "entity": {
    "uuid": "1625583696",
    "licenseNo": "FKJ494A2133",
    "firstName": "JOHN",
    "lastName": "DOE",
    "middleName": "",
    "gender": "Male",
    "issuedDate": "2019-01-25",
    "expiryDate": "2024-08-17",
    "stateOfIssue": "LAGOS",
    "birthDate": "28-09-1998",
    "photo": "BASE 64 IMAGE"
  }
}
```

**Implementation Notes:**

- Use `entity.firstName` and `entity.lastName`
- `entity.birthDate` format: `DD-MM-YYYY` (different from NIN!)
- Test credentials: `FKJ494A2133` or `FKJ49409AB13`

**⚠️ Important:** The existing codebase uses `/api/v1/kyc/drivers_license` but Dojah docs specify `/api/v1/kyc/dl`. Verify which endpoint works in production.

---

### 4. **Voter's Identification Number (VIN)** ✅

**Endpoint:** `GET /api/v1/kyc/vin`

**Documentation:** https://docs.dojah.io/docs/nigeria/lookup-voters-id

**Query Parameters:**

- `vin` (required) - Voter's identification number

**Response Format:**

```json
{
  "entity": {
    "full_name": "JOHN DOE",
    "voter_identification_number": "91F1234567890123",
    "gender": "Male",
    "occupation": "STUDENT",
    "time_of_registration": "2011-02-18 13:59:46",
    "state": "ONDO",
    "local_government": "IDANRE",
    "registration_area_ward": "",
    "polling_unit": "OJAJIGBOKIN, O/S IN FRONT OF ABANA I & II",
    "polling_unit_code": "12/03/04/005",
    "address": "NO 16 OWODE QTS KABBA",
    "phone": "0812345678",
    "date_of_birth": "1960-10-16"
  }
}
```

**Implementation Notes:**

- Use `entity.full_name` (single field, not first/last)
- `entity.date_of_birth` format: `YYYY-MM-DD`
- Test credentials: `91F6B1F5BE29535558655586`

---

### 5. **Bank Verification Number (BVN)** ⭐ NEW

**Endpoint:** `GET /api/v1/kyc/bvn`

**Documentation:** https://docs.dojah.io/docs/nigeria/validate-bvn

**Query Parameters:**

- `bvn` (required) - 11-digit Bank Verification Number
- `first_name` (optional) - First name for validation
- `last_name` (optional) - Last name for validation
- `dob` (optional) - Date of birth in `YYYY-MM-DD` format

**Response Format:**

```json
{
  "entity": {
    "bvn": {
      "value": "23456789012",
      "status": true
    },
    "first_name": {
      "confidence_value": 100,
      "status": true
    },
    "last_name": {
      "confidence_value": 100,
      "status": true
    }
  }
}
```

**Implementation Notes:**

- This is a **validation** endpoint (not lookup)
- Returns confidence values for name matching
- Use `entity.first_name.confidence_value` and `entity.last_name.confidence_value`
- Test credentials: `22222222222`

**When to Use:**

- When tenant provides BVN instead of NIN
- As additional verification layer
- For financial services compliance

---

### 6. **Phone Number Lookup** (Optional - Additional Verification)

**Endpoint:** `GET /api/v1/kyc/phone_number/basic` or `GET /api/v1/kyc/phone_number`

**Documentation:** https://docs.dojah.io/docs/nigeria/lookup-phone-number

**Query Parameters:**

- `phone_number` (required) - Phone number

**Response Format (Basic):**

```json
{
  "entity": {
    "first_name": "JOHN",
    "middle_name": "DOE",
    "last_name": "CHHUKWU",
    "gender": "Male",
    "nationality": "NGA",
    "date_of_birth": "1990-05-16",
    "msisdn": "23481222222222"
  }
}
```

**Response Format (Advanced):**

```json
{
  "entity": {
    "first_name": "JOHN",
    "last_name": "DOE",
    "middle_name": "CHHUKWU",
    "date_of_birth": "1960-12-12",
    "phone_number": "08012345678",
    "photo": "BASE 64 IMAGE",
    "gender": "M",
    "customer": "9b2ac137-5360-4050-b412-4fa6728a31fb"
  }
}
```

**Implementation Notes:**

- Can be used as secondary verification
- Test credentials: `09011111111`
- Advanced endpoint returns photo

---

### 7. **Virtual NIN (vNIN)** (Optional - Alternative to NIN)

**Endpoint:** `GET /api/v1/kyc/vnin`

**Documentation:** https://docs.dojah.io/docs/nigeria/lookup-virtual-nin

**Query Parameters:**

- `vnin` (required) - 16-character Virtual NIN (e.g., `AB012345678910YZ`)

**Response Format:**

```json
{
  "entity": {
    "vnin": "AB012345678910YZ",
    "firstname": "John",
    "middlename": "Doe",
    "surname": "Alamutu",
    "user_id": "WXABCD-1234",
    "gender": "M",
    "mobile": "08012345678",
    "dateOfBirth": "YYYY-MM-DD",
    "photo": "/9j/4AAQSkZJRgABAgAAAQABAAD/2wBDAAgGBgc..."
  }
}
```

**Implementation Notes:**

- vNIN is valid for only 72 hours
- Generated via NIMC Mobile App or USSD: `*346*3*NIN*EnterpriseCode#`
- Dojah Enterprise Code: `1138183`
- Test credentials: `AB012345678910YZ`
- Should NOT be stored in database (NIMC requirement)

**When to Use:**

- When tenant prefers not to share raw NIN
- For enhanced privacy
- As alternative to regular NIN verification

---

## Response Field Mapping

### Name Fields (Varies by Endpoint)

| Endpoint         | First Name Field          | Last Name Field          | Notes                       |
| ---------------- | ------------------------- | ------------------------ | --------------------------- |
| NIN              | `entity.firstname`        | `entity.surname`         | Also has `middlename`       |
| Passport         | `entity.first_name`       | `entity.last_name`       | Also has `middle_name`      |
| Driver's License | `entity.firstName`        | `entity.lastName`        | Also has `middleName`       |
| VIN              | `entity.full_name`        | N/A                      | Single field, needs parsing |
| BVN              | `entity.first_name.value` | `entity.last_name.value` | Validation response         |
| Phone Number     | `entity.first_name`       | `entity.last_name`       | Also has `middle_name`      |
| vNIN             | `entity.firstname`        | `entity.surname`         | Also has `middlename`       |

### Date of Birth Fields (Varies by Format)

| Endpoint         | DOB Field              | Format       | Example         |
| ---------------- | ---------------------- | ------------ | --------------- |
| NIN              | `entity.birthdate`     | `YYYY-MM-DD` | `1990-01-15`    |
| Passport         | `entity.date_of_birth` | `YYYY-MM-DD` | `1990-01-15`    |
| Driver's License | `entity.birthDate`     | `DD-MM-YYYY` | `28-09-1998` ⚠️ |
| VIN              | `entity.date_of_birth` | `YYYY-MM-DD` | `1960-10-16`    |
| Phone Number     | `entity.date_of_birth` | `YYYY-MM-DD` | `1990-05-16`    |
| vNIN             | `entity.dateOfBirth`   | `YYYY-MM-DD` | `1990-01-15`    |

**⚠️ Important:** Driver's License uses `DD-MM-YYYY` format, all others use `YYYY-MM-DD`.

---

## Updated Implementation Code

### Updated Service Method with BVN Support

```typescript
async verifyTenantDocuments(
  tenantId: string,
  documentType: 'nin' | 'passport' | 'dl' | 'vin' | 'bvn',
  documents: VerificationDocument[],
  tenantData: TenantData
): Promise<{
  success: boolean;
  result: VerificationResult;
  comparison: ComparisonResult;
}> {
  // ... existing code ...

  switch (documentType) {
    case "nin":
      // GET /api/v1/kyc/nin?nin=12345678901
      verificationResult = await this.dojahProvider.verifyNIN(
        documentNumber,
        tenantData.firstName,
        tenantData.lastName,
        tenantData.dateOfBirth
      );
      break;

    case "passport":
      // GET /api/v1/kyc/passport?passport_number=A12345678
      verificationResult = await this.dojahProvider.verifyPassport(
        documentNumber,
        tenantData.firstName,
        tenantData.lastName
      );
      break;

    case "dl":
      // GET /api/v1/kyc/dl?license_number=FKJ494A2133
      // Note: Check if endpoint should be /api/v1/kyc/dl or /api/v1/kyc/drivers_license
      verificationResult = await this.dojahProvider.verifyDriversLicense(
        documentNumber,
        tenantData.firstName,
        tenantData.lastName,
        tenantData.dateOfBirth
      );
      break;

    case "vin":
      // GET /api/v1/kyc/vin?vin=91F1234567890123
      verificationResult = await this.dojahProvider.verifyVotersCard(
        documentNumber,
        tenantData.firstName,
        tenantData.lastName
      );
      break;

    case "bvn":
      // GET /api/v1/kyc/bvn?bvn=22222222222&first_name=John&last_name=Doe&dob=1990-01-15
      verificationResult = await this.verifyBVN(
        documentNumber,
        tenantData.firstName,
        tenantData.lastName,
        tenantData.dateOfBirth
      );
      break;

    default:
      throw new Error(`Unsupported document type: ${documentType}`);
  }

  // ... rest of code ...
}

/**
 * Verify BVN (Bank Verification Number)
 * Dojah Endpoint: GET /api/v1/kyc/bvn
 */
private async verifyBVN(
  bvn: string,
  firstName: string,
  lastName: string,
  dob?: string
): Promise<VerificationResult> {
  const startTime = Date.now();
  const endpoint = '/api/v1/kyc/bvn';

  try {
    const params: any = { bvn };
    if (firstName) params.first_name = firstName;
    if (lastName) params.last_name = lastName;
    if (dob) params.dob = dob; // Format: YYYY-MM-DD

    const response = await this.dojahProvider['client'].get(endpoint, { params });

    const entity = response.data?.entity;

    if (!entity || !entity.bvn?.status) {
      return {
        success: false,
        status: 'failed',
        confidence: 0,
        referenceId: '',
        error: 'BVN not found or invalid',
      };
    }

    // Calculate confidence from BVN validation response
    const firstNameConfidence = entity.first_name?.confidence_value || 0;
    const lastNameConfidence = entity.last_name?.confidence_value || 0;
    const confidence = (firstNameConfidence + lastNameConfidence) / 2;

    const isVerified = confidence >= 80 && entity.first_name?.status && entity.last_name?.status;

    return {
      success: isVerified,
      status: isVerified ? 'verified' : 'failed',
      confidence,
      referenceId: `BVN-${Date.now()}`,
      data: {
        bvn: entity.bvn.value,
        firstName: entity.first_name?.value || '',
        lastName: entity.last_name?.value || '',
        firstNameMatch: entity.first_name?.status || false,
        lastNameMatch: entity.last_name?.status || false,
      },
    };
  } catch (error) {
    return this.handleError(error as AxiosError, endpoint, { bvn: '***' }, startTime);
  }
}
```

---

## Updated Frontend Document Type Options

```typescript
// In KYCVerificationDialog.tsx
const documentTypes = [
  { value: "nin", label: "National ID (NIN)", icon: "🆔" },
  { value: "passport", label: "International Passport", icon: "📘" },
  { value: "dl", label: "Driver's License", icon: "🚗" },
  { value: "vin", label: "Voter's Card (VIN)", icon: "🗳️" },
  { value: "bvn", label: "Bank Verification Number (BVN)", icon: "🏦" },
];
```

---

## Error Handling

### Common Dojah Error Responses

**400 Bad Request:**

```json
{
  "error": "BVN not found"
}
```

**401 Unauthorized:**

- Invalid AppId or Authorization key
- Check environment variables

**404 Not Found:**

```json
{
  "error": "Record not found"
}
```

**429 Too Many Requests:**

- Rate limit exceeded
- Implement retry with exponential backoff

**500 Internal Server Error:**

- Dojah service issue
- Mark for manual review

---

## Test Credentials (Sandbox)

| Document Type    | Test Value                      | Notes                  |
| ---------------- | ------------------------------- | ---------------------- |
| NIN              | `12345678901`                   | Standard test NIN      |
| Passport         | `A12345678`                     | Standard test passport |
| Driver's License | `FKJ494A2133` or `FKJ49409AB13` | Test license numbers   |
| VIN              | `91F6B1F5BE29535558655586`      | Test voter's ID        |
| BVN              | `22222222222`                   | Test BVN               |
| Phone Number     | `09011111111`                   | Test phone number      |
| vNIN             | `AB012345678910YZ`              | Test virtual NIN       |

---

## Implementation Checklist

- [ ] Verify Dojah endpoint for Driver's License (`/api/v1/kyc/dl` vs `/api/v1/kyc/drivers_license`)
- [ ] Add BVN verification support
- [ ] Handle different date formats (DD-MM-YYYY for DL vs YYYY-MM-DD for others)
- [ ] Handle VIN full_name parsing (single field vs first/last)
- [ ] Add phone number lookup as optional secondary verification
- [ ] Consider vNIN as alternative to regular NIN
- [ ] Update error handling for all Dojah error codes
- [ ] Test with sandbox credentials
- [ ] Verify response field mapping for each document type

---

## References

- [Dojah NIN Lookup](https://docs.dojah.io/docs/nigeria/lookup-nin)
- [Dojah Passport Lookup](https://docs.dojah.io/docs/nigeria/lookup-passport)
- [Dojah Driver's License Lookup](https://docs.dojah.io/docs/nigeria/lookup-drivers-license)
- [Dojah Voter's ID Lookup](https://docs.dojah.io/docs/nigeria/lookup-voters-id)
- [Dojah BVN Validation](https://docs.dojah.io/docs/nigeria/validate-bvn)
- [Dojah Phone Number Lookup](https://docs.dojah.io/docs/nigeria/lookup-phone-number)
- [Dojah Virtual NIN Lookup](https://docs.dojah.io/docs/nigeria/lookup-virtual-nin)

---

**Last Updated:** December 22, 2025
**Status:** Updated with Official Dojah Documentation


