# KYC Verification Module Design - Property Owner Manual Verification

## Overview

This document outlines the architecture for adding a **"Verify KYC"** feature in the Property Owner Dashboard's Tenant Verification page. This allows owners to manually trigger Dojah KYC verification for tenant-submitted documents.

---

## Architecture Design

### 1. **Component Structure**

```
src/components/owner/
├── TenantVerificationManagement.tsx (existing)
└── KYCVerificationDialog.tsx (new)
    ├── DocumentViewer
    ├── DojahVerificationPanel
    └── VerificationResults
```

### 2. **Backend API Structure**

```
backend/src/routes/
├── owner-verification.ts (existing)
│   └── POST /api/owner/tenants/verifications/:tenantId/verify-kyc (new)
│
backend/src/services/
└── dojah-verification.service.ts (new)
    ├── verifyTenantDocuments()
    ├── verifyNIN()
    ├── verifyPassport()
    └── aggregateVerificationResults()
```

### 3. **Data Flow**

```
[Owner clicks "Verify KYC"]
    ↓
[Frontend: KYCVerificationDialog opens]
    ↓
[Frontend: Fetches tenant documents]
    ↓
[Owner selects document type to verify]
    ↓
[Frontend: POST /api/owner/tenants/verifications/:tenantId/verify-kyc]
    ↓
[Backend: dojah-verification.service.ts]
    ├── Extract document data
    ├── Call Dojah API (NIN/Passport/DL/VIN)
    ├── Compare with tenant data
    ├── Calculate confidence score
    └── Store results
    ↓
[Backend: Update tenant KYC status]
    ↓
[Frontend: Display results in dialog]
    ↓
[Owner: Approve/Reject based on results]
```

---

## Implementation Details

### Frontend Components

#### 1. **KYCVerificationDialog.tsx**

**Purpose:** Modal dialog for owner to verify tenant KYC using Dojah

**Features:**

- Display tenant information
- Show uploaded documents with preview
- Document type selector (NIN, Passport, Driver's License, Voter's Card, BVN)
- Real-time verification status
- Confidence score display
- Side-by-side comparison (tenant data vs Dojah data)
- Approve/Reject actions based on results

**State Management:**

```typescript
interface KYCVerificationState {
  tenant: TenantVerificationDetails;
  selectedDocument: VerificationDocument | null;
  documentType: "nin" | "passport" | "dl" | "vin" | null;
  verificationInProgress: boolean;
  verificationResult: DojahVerificationResult | null;
  confidenceScore: number;
  comparisonData: {
    tenant: any;
    dojah: any;
    matches: boolean[];
  };
}
```

**UI Layout:**

```
┌─────────────────────────────────────────┐
│  Verify KYC - [Tenant Name]        [X] │
├─────────────────────────────────────────┤
│                                         │
│  [Tenant Info Card]                     │
│  Name, Email, Phone, Property           │
│                                         │
│  [Documents Section]                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │  NIN    │ │Passport │ │   DL    │  │
│  │ [View]  │ │ [View]  │ │ [View]  │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│                                         │
│  [Verification Panel]                   │
│  Select Document Type: [Dropdown ▼]    │
│  [Start Verification] button            │
│                                         │
│  [Results Section] (shown after verify) │
│  Confidence: 85% ✓                      │
│  ┌─────────────────┬─────────────────┐ │
│  │ Tenant Data     │ Dojah Data      │ │
│  ├─────────────────┼─────────────────┤ │
│  │ Name: John Doe  │ Name: John Doe  │ │
│  │ DOB: 1990-01-15 │ DOB: 1990-01-15 │ │
│  │ ...             │ ...             │ │
│  └─────────────────┴─────────────────┘ │
│                                         │
│  [Actions]                               │
│  [Approve] [Reject] [Close]             │
└─────────────────────────────────────────┘
```

#### 2. **Integration in TenantVerificationManagement.tsx**

**Add to Dropdown Menu:**

```typescript
<DropdownMenuItem
  onClick={() => handleVerifyKYC(tenant.id)}
  className="cursor-pointer"
  disabled={!tenant.kycVerificationId || verificationInProgress}
>
  <ShieldCheck className="h-4 w-4 mr-2" />
  Verify KYC
</DropdownMenuItem>
```

**Conditional Display:**

- Show "Verify KYC" when:
  - `tenant.kycStatus === 'in_progress'`
  - `tenant.kycVerificationId` exists
  - Documents are available
- Hide when:
  - Already verified (`kycStatus === 'verified' || 'owner_approved'`)
  - No documents submitted

---

### Backend Implementation

#### 1. **New Endpoint: POST /api/owner/tenants/verifications/:tenantId/verify-kyc**

**File:** `backend/src/routes/owner-verification.ts`

**Request Body:**

```typescript
{
  documentType: 'nin' | 'passport' | 'dl' | 'vin' | 'bvn';
  documentId?: string; // Optional: specific document to verify
}
```

**📚 API Reference:** See [Dojah API Reference](./KYC_VERIFICATION_DOJAH_API_REFERENCE.md) for correct endpoints, parameters, and response formats.

````

**Response:**

```typescript
{
  success: boolean;
  result: {
    status: 'verified' | 'failed' | 'pending_review';
    confidence: number; // 0-100
    referenceId: string; // Dojah reference
    data: {
      // Dojah response data
      firstName: string;
      lastName: string;
      middleName?: string;
      dateOfBirth: string;
      gender: string;
      // ... other fields
    };
    comparison: {
      tenantData: any;
      dojahData: any;
      matches: {
        name: boolean;
        dob: boolean;
        // ... other fields
      };
    };
  };
  message: string;
}
````

**Implementation Flow:**

1. Authenticate owner
2. Verify tenant belongs to owner's customer
3. Fetch tenant documents from verification service
4. Extract document data based on `documentType`
5. Call `dojah-verification.service.verifyTenantDocuments()`
6. Store verification result in database
7. Update tenant `kycStatus` if confidence ≥ 80%
8. Return results to frontend

#### 2. **New Service: dojah-verification.service.ts**

**File:** `backend/src/services/dojah-verification.service.ts`

**Purpose:** Encapsulate all Dojah API interactions for owner-initiated verification

**Methods:**

```typescript
class DojahVerificationService {
  /**
   * Main entry point - verify tenant documents using Dojah
   */
  async verifyTenantDocuments(
    tenantId: string,
    documentType: "nin" | "passport" | "dl" | "vin",
    documents: VerificationDocument[]
  ): Promise<VerificationResult>;

  /**
   * Verify NIN (National Identification Number)
   */
  private async verifyNIN(
    nin: string,
    tenantData: any
  ): Promise<VerificationResult>;

  /**
   * Verify Passport
   */
  private async verifyPassport(
    passportNumber: string,
    tenantData: any
  ): Promise<VerificationResult>;

  /**
   * Verify Driver's License
   */
  private async verifyDriversLicense(
    licenseNumber: string,
    tenantData: any
  ): Promise<VerificationResult>;

  /**
   * Verify Voter's Card
   */
  private async verifyVotersCard(
    vin: string,
    tenantData: any
  ): Promise<VerificationResult>;

  /**
   * Verify BVN (Bank Verification Number)
   */
  private async verifyBVN(
    bvn: string,
    tenantData: any
  ): Promise<VerificationResult>;

  /**
   * Compare tenant data with Dojah response
   */
  private compareData(tenantData: any, dojahData: any): ComparisonResult;

  /**
   * Calculate confidence score
   */
  private calculateConfidence(matches: boolean[], weights: number[]): number;

  /**
   * Log verification attempt
   */
  private async logVerification(
    tenantId: string,
    result: VerificationResult
  ): Promise<void>;
}
```

**Integration with Existing Dojah Provider:**

The service will use the existing `DojahProvider` from `backend/src/providers/dojah.provider.ts`:

```typescript
import { DojahProvider } from "../providers/dojah.provider";

class DojahVerificationService {
  private dojahProvider: DojahProvider;

  constructor() {
    this.dojahProvider = new DojahProvider();
  }

  async verifyNIN(nin: string, tenantData: any) {
    const result = await this.dojahProvider.verifyNIN({
      nin,
      firstName: tenantData.firstName,
      lastName: tenantData.lastName,
      dob: tenantData.dateOfBirth,
    });
    // Process result...
  }
}
```

---

### Database Schema Updates

**No schema changes needed** - existing fields are sufficient:

- `users.kycStatus` - Will be updated to 'verified' or 'pending_review'
- `users.kycVerificationId` - Already exists
- `users.kycOwnerApprovalStatus` - For owner's final decision
- `users.kycOwnerNotes` - For owner's verification notes

**Optional Enhancement:** Add verification history table for audit trail:

```prisma
model kyc_verification_history {
  id                String   @id @default(uuid())
  tenantId          String
  verifiedBy        String   // Owner ID
  verificationType  String   // 'dojah_nin', 'dojah_passport', etc.
  documentType      String
  confidenceScore   Float
  status            String   // 'verified', 'failed', 'pending_review'
  dojahReferenceId  String?
  comparisonData    Json?    // Store comparison results
  notes             String?  @db.Text
  createdAt         DateTime @default(now())

  tenant            users    @relation(fields: [tenantId], references: [id])
  verifier          users    @relation(fields: [verifiedBy], references: [id])

  @@index([tenantId])
  @@index([verifiedBy])
  @@index([createdAt])
}
```

---

### API Client Updates

**File:** `src/lib/api/owner-verification.ts`

**Add new function:**

```typescript
/**
 * Verify tenant KYC using Dojah
 */
export async function verifyTenantKYC(
  tenantId: string,
  documentType: "nin" | "passport" | "dl" | "vin",
  documentId?: string
): Promise<
  ApiResponse<{
    success: boolean;
    result: DojahVerificationResult;
    message: string;
  }>
> {
  return apiClient.post(
    `/api/owner/tenants/verifications/${tenantId}/verify-kyc`,
    { documentType, documentId }
  );
}
```

---

## User Flow

### 1. **Owner Initiates Verification**

1. Owner navigates to **Tenant Verification** page
2. Sees list of tenants needing verification
3. Clicks **three-dot menu** → **"Verify KYC"**
4. `KYCVerificationDialog` opens

### 2. **Verification Process**

1. Dialog shows:
   - Tenant information
   - Available documents (NIN, Passport, etc.)
   - Document previews
2. Owner selects document type to verify (e.g., "NIN")
3. Clicks **"Start Verification"**
4. Loading state shows: "Verifying with Dojah..."
5. Backend:
   - Extracts document number from selected document
   - Calls Dojah API
   - Compares results with tenant data
   - Calculates confidence score
6. Results displayed:
   - Confidence score (e.g., "85% Match")
   - Side-by-side comparison table
   - Matched/Unmatched fields highlighted

### 3. **Owner Decision**

1. Owner reviews results
2. Options:
   - **Approve** - If confidence ≥ 80% and data matches
   - **Reject** - If confidence < 80% or data doesn't match
   - **Request More Info** - If unclear
3. Owner can add notes
4. Status updated in database
5. Tenant notified (optional)

---

## Error Handling

### Frontend Errors

```typescript
try {
  const result = await verifyTenantKYC(tenantId, documentType);
  // Handle success
} catch (error) {
  if (error.statusCode === 400) {
    toast.error("Invalid document type or missing data");
  } else if (error.statusCode === 404) {
    toast.error("Document not found");
  } else if (error.statusCode === 429) {
    toast.error("Rate limit exceeded. Please try again later.");
  } else if (error.statusCode === 500) {
    toast.error("Dojah service unavailable. Please try again.");
  } else {
    toast.error("Verification failed. Please try again.");
  }
}
```

### Backend Errors

1. **Dojah API Errors:**

   - Log to `provider_logs` table
   - Return user-friendly error
   - Mark for manual review

2. **Document Not Found:**

   - Return 404 with clear message
   - Suggest owner request resubmission

3. **Rate Limiting:**

   - Queue verification request
   - Return "pending" status
   - Process later

4. **Network Errors:**
   - Retry with exponential backoff (3 attempts)
   - If all fail, mark as "pending_review"

---

## Security Considerations

### 1. **Authorization**

- Only property owners can verify their tenants
- Verify `tenant.customerId === owner.customerId`
- Check `ownerOrManagerOnly` middleware

### 2. **Rate Limiting**

- Limit Dojah API calls per owner (e.g., 10 per hour)
- Prevent abuse and control costs
- Queue excess requests

### 3. **Data Privacy**

- Don't log sensitive data (NIN, passport numbers)
- Mask in logs: `NIN: 123***789`
- Store only verification results, not raw documents

### 4. **Audit Trail**

- Log all verification attempts
- Store who verified, when, and result
- Track confidence scores for analysis

---

## Performance Optimization

### 1. **Caching**

- Cache Dojah responses for same document (24 hours)
- Avoid duplicate API calls
- Store in Redis with key: `dojah:${documentType}:${number}`

### 2. **Async Processing**

- For multiple documents, process in parallel
- Use Promise.all() for concurrent Dojah calls
- Show progress for each document

### 3. **Optimistic Updates**

- Update UI immediately when owner approves/rejects
- Sync with backend in background
- Revert on error

---

## Testing Strategy

### Unit Tests

1. **dojah-verification.service.ts**

   - Test each verification method
   - Mock Dojah API responses
   - Test confidence calculation
   - Test data comparison logic

2. **KYCVerificationDialog.tsx**
   - Test dialog open/close
   - Test document selection
   - Test verification flow
   - Test error handling

### Integration Tests

1. **End-to-End Verification Flow**

   - Owner clicks "Verify KYC"
   - Dialog opens
   - Verification completes
   - Results displayed
   - Owner approves/rejects

2. **Dojah API Integration**
   - Test with sandbox credentials
   - Verify real API responses
   - Test error scenarios

### Manual Testing Checklist

- [ ] Verify KYC button appears for tenants with documents
- [ ] Dialog opens with correct tenant data
- [ ] Document previews work
- [ ] NIN verification works
- [ ] Passport verification works
- [ ] Results display correctly
- [ ] Confidence score calculated accurately
- [ ] Approve/Reject actions work
- [ ] Status updates in database
- [ ] Error handling works for all scenarios

---

## File Structure

```
backend/src/
├── routes/
│   └── owner-verification.ts (add new endpoint)
├── services/
│   └── dojah-verification.service.ts (new)
└── providers/
    └── dojah.provider.ts (existing - reuse)

src/
├── components/
│   └── owner/
│       ├── TenantVerificationManagement.tsx (modify)
│       └── KYCVerificationDialog.tsx (new)
└── lib/
    └── api/
        └── owner-verification.ts (add new function)
```

---

## Implementation Phases

### Phase 1: Backend Service (Foundation)

1. Create `dojah-verification.service.ts`
2. Implement verification methods
3. Add logging and error handling
4. Unit tests

### Phase 2: Backend API Endpoint

1. Add endpoint to `owner-verification.ts`
2. Integrate with service
3. Add authorization checks
4. Add rate limiting

### Phase 3: Frontend Dialog Component

1. Create `KYCVerificationDialog.tsx`
2. Implement UI layout
3. Add document preview
4. Add verification flow

### Phase 4: Integration

1. Add "Verify KYC" to dropdown menu
2. Connect dialog to API
3. Add error handling
4. Add loading states

### Phase 5: Testing & Polish

1. End-to-end testing
2. Error scenario testing
3. UI/UX improvements
4. Performance optimization

---

## Success Metrics

- **Verification Success Rate:** > 90% of verifications complete successfully
- **Response Time:** < 5 seconds for Dojah API calls
- **User Satisfaction:** Owners can verify tenants in < 2 minutes
- **Error Rate:** < 5% of verification attempts fail

---

## Future Enhancements

1. **Bulk Verification:** Verify multiple tenants at once
2. **Auto-Verification:** Automatically verify when documents are submitted
3. **Verification History:** Show past verification attempts
4. **Confidence Thresholds:** Configurable thresholds per document type
5. **Multi-Provider Support:** Add other KYC providers (Smile Identity, etc.)
6. **Webhook Notifications:** Notify tenants when verified

---

**Last Updated:** December 22, 2025
**Status:** Design Complete - Ready for Implementation


