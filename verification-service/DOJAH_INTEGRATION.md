# Dojah API Integration Documentation

## Overview

This document details the Dojah API integration for identity verification in the Contrezz KYC system.

## Authentication

All Dojah API requests require the following headers:

```
AppId: YOUR_APP_ID
Authorization: YOUR_SECRET_KEY
Content-Type: application/json
```

These are configured in the `.env` file:
- `DOJAH_APP_ID` - Your Dojah App ID
- `DOJAH_API_KEY` - Your Dojah Secret Key

## Supported Verification Methods

### 1. National Identification Number (NIN) Verification ⭐ RECOMMENDED

**Endpoint:** `GET /api/v1/kyc/nin`

**Required Parameters:**
- `nin` - 11-digit National Identification Number

**What Dojah Returns:**
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

**Verification Logic:**
- Compares provided `firstName` and `lastName` with NIN record
- If `dob` provided, verifies it matches
- Calculates confidence score (0-100%)
- Threshold: 80% for approval

**Use Case:** Primary verification method. Most comprehensive data including photo.

---

### 2. International Passport Verification

**Endpoint:** `GET /api/v1/kyc/passport`

**Required Parameters:**
- `passport_number` - Passport number

**What Dojah Returns:**
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

**Verification Logic:**
- Compares provided names with passport record
- Confidence score based on name matching
- Threshold: 80% for approval

**Use Case:** Good for international users or as secondary verification.

---

### 3. Driver's License Verification

**Endpoint:** `GET /api/v1/kyc/drivers_license`

**Required Parameters:**
- `license_number` - Driver's license number
- `dob` - Date of birth (YYYY-MM-DD) - **REQUIRED by Dojah**

**What Dojah Returns:**
```json
{
  "entity": {
    "license_number": "ABC123456789",
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1990-01-15",
    "issue_date": "2018-05-10",
    "expiry_date": "2028-05-10",
    "photo": "base64_encoded_image",
    "state_of_issue": "Lagos"
  },
  "reference_id": "REF123456"
}
```

**Verification Logic:**
- Compares names and DOB with license record
- Weighted confidence: 40% firstName + 40% lastName + 20% DOB
- Threshold: 80% for approval

**Use Case:** Secondary verification or for users without NIN.

---

### 4. Voter's Card Verification

**Endpoint:** `GET /api/v1/kyc/vin`

**Required Parameters:**
- `vin` - Voter Identification Number

**What Dojah Returns:**
```json
{
  "entity": {
    "vin": "90F5B00000000000",
    "first_name": "John",
    "last_name": "Doe",
    "gender": "Male",
    "state": "Lagos",
    "lga": "Ikeja",
    "polling_unit": "Unit 001",
    "occupation": "Engineer"
  },
  "reference_id": "REF123456"
}
```

**Verification Logic:**
- Compares names with voter record
- Confidence score based on name matching
- Threshold: 80% for approval

**Use Case:** Alternative ID for Nigerian citizens.

---

### 5. Document Analysis (OCR + Authenticity Check)

**Endpoint:** `POST /api/v1/document/analysis`

**Required Parameters:**
- `document_image` - Base64 encoded image
- `document_type` - Type of document (e.g., "nin_slip", "passport", "drivers_license", "utility_bill")

**What Dojah Returns:**
```json
{
  "entity": {
    "document_type": "nin_slip",
    "document_number": "12345678901",
    "full_name": "John Doe Smith",
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1990-01-15",
    "address": "123 Main Street, Lagos",
    "issue_date": "2015-03-20",
    "expiry_date": "2025-03-20",
    "authenticity_score": 95.5,
    "confidence_score": 92.0
  },
  "reference_id": "REF123456"
}
```

**Verification Logic:**
- Extracts text from document image (OCR)
- Checks document authenticity (tamper detection)
- Returns confidence and authenticity scores
- Threshold: 70% for approval (lower for documents)

**Use Case:** 
- Verify uploaded document images
- Extract data from utility bills, proof of address
- Detect fake or tampered documents

---

## Data Matching & Confidence Scoring

### Name Matching Algorithm

Uses Levenshtein distance to calculate similarity between provided names and Dojah records:

```typescript
calculateNameMatchConfidence(provided: string, fromRecord: string): number {
  // Returns 0-100% based on string similarity
  // Accounts for typos, case differences, extra spaces
}
```

### Confidence Score Calculation

**For NIN/Passport/Voter's Card (without DOB):**
```
confidence = (firstNameMatch + lastNameMatch) / 2
```

**For NIN/Driver's License (with DOB):**
```
confidence = (firstNameMatch * 0.4) + (lastNameMatch * 0.4) + (dobMatch * 0.2)
```

**For Documents:**
```
confidence = Dojah's authenticity_score or confidence_score
```

### Approval Thresholds

- **ID Verification (NIN, Passport, etc.):** 80%
- **Document Analysis:** 70%
- **Manual Review Trigger:** < threshold

---

## Verification Flow

### Step 1: User Uploads Documents

User provides:
- At least 2 documents
- Document numbers (NIN, passport, etc.)
- Uploaded images

### Step 2: Verification Service Processes

For each document:

1. **If document has a number (NIN, passport, etc.):**
   - Call Dojah ID lookup API (GET)
   - Compare names with user-provided data
   - Calculate confidence score

2. **For uploaded images:**
   - Download image from storage
   - Convert to base64
   - Call Dojah Document Analysis API (POST)
   - Extract data and check authenticity

### Step 3: Aggregate Results

- Collect all verification results
- Calculate overall confidence
- Determine final status:
  - **approved**: All checks passed (≥80%)
  - **pending_review**: Some checks failed, needs admin review
  - **rejected**: Critical failures

### Step 4: Notify Main Backend

Send webhook to main backend:
```
POST /api/verification/kyc/webhook
{
  "requestId": "...",
  "status": "approved" | "pending_review",
  "customerId": "...",
  "failureReason": "..." // if pending_review
}
```

---

## Error Handling

### Dojah API Errors

**Common Error Codes:**
- `400` - Invalid parameters
- `401` - Invalid API key or App ID
- `404` - Record not found
- `429` - Rate limit exceeded
- `500` - Dojah server error

**Our Handling:**
```typescript
try {
  const response = await dojahAPI.get('/api/v1/kyc/nin', { params: { nin } });
  // Process response
} catch (error) {
  // Log to provider_logs table
  // Return failed result
  // Mark for manual review if appropriate
}
```

### Fallback Strategy

1. **ID Lookup Fails:** Mark for manual review
2. **Document Analysis Fails:** Mark for manual review
3. **Network Errors:** Retry with exponential backoff
4. **Rate Limits:** Queue for later processing

---

## Testing

### Sandbox Mode

Dojah provides sandbox credentials for testing:
- Use sandbox App ID and Secret Key
- Test with sample data
- No real API calls charged

### Test Data

**Valid NIN (Sandbox):**
```
NIN: 12345678901
Name: Test User
DOB: 1990-01-01
```

**Valid Passport (Sandbox):**
```
Passport: A12345678
Name: Test User
```

### Testing Checklist

- [ ] NIN verification with valid data
- [ ] NIN verification with invalid data
- [ ] Passport verification
- [ ] Driver's license verification
- [ ] Voter's card verification
- [ ] Document analysis with clear image
- [ ] Document analysis with blurry image
- [ ] Error handling (invalid credentials)
- [ ] Rate limiting behavior
- [ ] Webhook delivery to main backend

---

## Production Deployment

### Environment Variables

```bash
# Dojah Configuration
DOJAH_APP_ID=your_production_app_id
DOJAH_API_KEY=your_production_secret_key
DOJAH_BASE_URL=https://api.dojah.io
```

### Security Checklist

- [ ] Production API keys configured
- [ ] Keys stored in secure environment (not in code)
- [ ] HTTPS enforced for all API calls
- [ ] API keys rotated regularly
- [ ] Rate limiting configured
- [ ] Error logging enabled
- [ ] Sensitive data encrypted in logs
- [ ] Webhook signature verification enabled

### Monitoring

**Key Metrics to Track:**
- API response times
- Success/failure rates per verification type
- Confidence score distribution
- Manual review rate
- Dojah API errors
- Cost per verification

**Alerts:**
- High failure rate (>20%)
- Slow response times (>5s)
- Dojah API errors
- Rate limit warnings

---

## Cost Optimization

### Dojah Pricing (Approximate)

- NIN Lookup: ₦50 per request
- Passport Lookup: ₦100 per request
- Driver's License: ₦75 per request
- Document Analysis: ₦150 per document

### Optimization Strategies

1. **Cache Results:** Store verified data to avoid duplicate lookups
2. **Prioritize NIN:** Most cost-effective and comprehensive
3. **Batch Processing:** Process multiple documents in queue
4. **Smart Retry:** Don't retry on 404 (not found) errors
5. **Document Analysis:** Only use when ID lookup fails

---

## Support & Resources

**Dojah Documentation:**
- API Docs: https://docs.dojah.io/
- API Reference: https://api-docs.dojah.io/
- Support: https://support.dojah.io/

**Contrezz Internal:**
- Verification Service: `verification-service/`
- Dojah Provider: `verification-service/src/providers/dojah.provider.ts`
- Testing Guide: `VERIFICATION_SERVICE_TESTING_GUIDE.md`

---

## Changelog

**v1.0.0 (2025-11-25)**
- Initial Dojah integration
- Support for NIN, Passport, Driver's License, Voter's Card
- Document Analysis API integration
- Confidence scoring algorithm
- Error handling and logging
- Manual review fallback

---

**Last Updated:** November 25, 2025
**Maintained By:** Contrezz Development Team

