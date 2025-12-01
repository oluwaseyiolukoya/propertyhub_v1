# KYC Resubmission After Rejection - Fix

## Error

When trying to reupload documents after KYC rejection:

```
Failed to upload Passport Data Page: Document type passport already uploaded
```

## Root Cause

When a KYC verification is **rejected**, the system was trying to reuse the **old verification request ID**. The verification service doesn't allow uploading the same document type twice to the same request, causing the error.

### Why This Happened

1. User submits KYC documents → Request ID: `req-abc123` created
2. Admin rejects verification
3. User clicks "Retry Verification"
4. System tries to upload to **same request ID** (`req-abc123`)
5. Verification service says: "Document type already uploaded to this request"
6. ❌ Upload fails

### The Problem Flow

```
┌─────────────────────────────────────────────────────────────┐
│  First Submission (req-abc123)                              │
│  ✅ NIN uploaded                                            │
│  ✅ Passport uploaded                                       │
│  ❌ REJECTED by admin                                       │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  User Clicks "Retry Verification"                           │
│  ⚠️  System tries to reuse req-abc123                       │
│  ❌ Tries to upload NIN to req-abc123 → FAILS              │
│     (NIN already exists for this request)                   │
└─────────────────────────────────────────────────────────────┘
```

## Solution

When KYC is **rejected**, create a **NEW verification request** instead of reusing the old one.

### Fixed Flow

```
┌─────────────────────────────────────────────────────────────┐
│  First Submission (req-abc123)                              │
│  ✅ NIN uploaded                                            │
│  ✅ Passport uploaded                                       │
│  ❌ REJECTED by admin                                       │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  User Clicks "Retry Verification"                           │
│  ✅ System clears old request ID                            │
│  ✅ Creates NEW request (req-xyz789)                        │
│  ✅ Uploads NIN to req-xyz789 → SUCCESS                    │
│  ✅ Uploads Passport to req-xyz789 → SUCCESS               │
└─────────────────────────────────────────────────────────────┘
```

## Code Changes

### Change 1: Don't Load Old Request ID if Rejected

**File:** `src/components/KYCVerificationPage.tsx`

**Before:**
```typescript
// If in progress, load existing request
if (data.verificationDetails?.requestId) {
  setRequestId(data.verificationDetails.requestId);
}
```

**After:**
```typescript
// If in progress, load existing request
// BUT: If rejected, don't reuse the old request (user needs to create new one)
if (data.verificationDetails?.requestId && data.kycStatus !== 'rejected') {
  setRequestId(data.verificationDetails.requestId);
} else if (data.kycStatus === 'rejected') {
  // Clear old request ID so user can create a new request
  setRequestId(null);
  console.log('[KYC] Previous request was rejected, user can create new request');
}
```

### Change 2: Always Create New Request if Previous Was Rejected

**File:** `src/components/KYCVerificationPage.tsx`

**Before:**
```typescript
// Step 1: Submit KYC request if not already created
let currentRequestId = requestId;

if (!currentRequestId) {
  // Create new request
}
```

**After:**
```typescript
// Step 1: Submit KYC request if not already created OR if previous was rejected
let currentRequestId = requestId;
const isRejected = kycStatus?.kycStatus === 'rejected';

if (!currentRequestId || isRejected) {
  console.log('[KYC] Submitting KYC request...', 
    isRejected ? '(resubmission after rejection)' : '(new request)');
  
  const submitResponse = await apiClient.post('/api/verification/kyc/submit', {});
  currentRequestId = submitResponse.data.requestId;
  setRequestId(currentRequestId);
  
  // Reset uploaded status for all documents (for resubmission)
  if (isRejected) {
    setDocuments(docs => docs.map(d => ({ 
      ...d, 
      uploaded: false, 
      uploading: false 
    })));
  }
}
```

## How It Works Now

### Scenario 1: First-Time Submission

1. User uploads documents
2. System creates **new request** (`req-abc123`)
3. Documents uploaded to `req-abc123`
4. ✅ Success

### Scenario 2: Resubmission After Rejection

1. User's previous request (`req-abc123`) was rejected
2. User clicks "Retry Verification"
3. System detects `kycStatus === 'rejected'`
4. System **clears old request ID** (`requestId = null`)
5. User uploads new documents
6. System creates **new request** (`req-xyz789`)
7. Documents uploaded to `req-xyz789`
8. ✅ Success

### Scenario 3: Resubmission After Pending Review

1. User's request (`req-abc123`) is `pending_review`
2. User wants to add more documents
3. System **reuses existing request** (`req-abc123`)
4. New documents uploaded to `req-abc123`
5. ✅ Success (no duplicate document types)

## Testing Steps

### Test 1: Normal Submission (First Time)

1. Log in with new customer
2. Upload 2 documents (NIN + Passport)
3. Click "Submit for Verification"
4. **Expected:** ✅ Documents upload successfully

### Test 2: Resubmission After Rejection

1. Admin rejects KYC verification
2. Customer sees "Verification Rejected" screen
3. Customer clicks "Retry Verification"
4. Customer uploads 2 NEW documents (can be same types)
5. Click "Submit for Verification"
6. **Expected:** ✅ Documents upload successfully (new request created)

### Test 3: Add More Documents (Pending Review)

1. Customer uploads 2 documents
2. Status is `pending_review`
3. Customer wants to add a 3rd document
4. **Expected:** ✅ New document uploads to same request

## Database Impact

### Before Fix

```sql
-- verification_requests table
req-abc123 | customerId | rejected | 2024-11-25 10:00:00

-- verification_documents table
doc-1 | req-abc123 | nin      | rejected
doc-2 | req-abc123 | passport | rejected

-- User tries to reupload to req-abc123
-- ❌ FAILS: "Document type already uploaded"
```

### After Fix

```sql
-- verification_requests table
req-abc123 | customerId | rejected | 2024-11-25 10:00:00
req-xyz789 | customerId | pending  | 2024-11-25 11:00:00  ← NEW REQUEST

-- verification_documents table
doc-1 | req-abc123 | nin      | rejected
doc-2 | req-abc123 | passport | rejected
doc-3 | req-xyz789 | nin      | pending   ← NEW DOCUMENTS
doc-4 | req-xyz789 | passport | pending   ← NEW DOCUMENTS

-- ✅ SUCCESS: New request, new documents
```

## Edge Cases Handled

### Edge Case 1: User Refreshes Page During Resubmission

**Scenario:**
1. User clicks "Retry Verification"
2. User refreshes page before uploading

**Behavior:**
- System loads KYC status
- Detects `kycStatus === 'rejected'`
- Clears old request ID
- User can upload fresh documents
- ✅ Works correctly

### Edge Case 2: Multiple Rejections

**Scenario:**
1. First submission rejected → `req-abc123`
2. Second submission rejected → `req-xyz789`
3. Third submission attempt

**Behavior:**
- System always creates new request for each resubmission
- Old requests remain in database (audit trail)
- ✅ Works correctly

### Edge Case 3: Partial Upload Before Rejection

**Scenario:**
1. User uploads 1 document
2. Admin rejects before user uploads 2nd document
3. User tries to upload 2nd document

**Behavior:**
- System detects rejection
- Creates new request
- User uploads both documents to new request
- ✅ Works correctly

## Backend Validation

The verification service validates:

1. **Document type uniqueness per request:**
   ```typescript
   // verification-service/src/services/verification.service.ts
   const existingDoc = await prisma.verification_documents.findFirst({
     where: {
       requestId,
       documentType,
     },
   });
   
   if (existingDoc) {
     throw new Error(`Document type ${documentType} already uploaded`);
   }
   ```

2. **Request status:**
   ```typescript
   if (!['pending', 'in_progress'].includes(request.status)) {
     throw new Error(`Cannot upload documents for request with status: ${request.status}`);
   }
   ```

This ensures data integrity and prevents duplicate documents.

## Files Modified

- ✅ `src/components/KYCVerificationPage.tsx` (lines 87-95, 162-179)
  - Don't load old request ID if rejected
  - Always create new request if previous was rejected
  - Reset document upload status on resubmission

## Related Issues

This fix also resolves:
- ❌ "Cannot upload documents for request with status: rejected"
- ❌ "Request not found" (when old request was deleted)
- ❌ Confusion about why documents won't upload after rejection

## Best Practices Applied

1. **Clear State on Rejection:**
   - Old request ID cleared
   - Document upload status reset
   - User starts fresh

2. **User Feedback:**
   - "Retry Verification" button clearly indicates action
   - Console logs show "(resubmission after rejection)"
   - Toast messages guide user through process

3. **Data Integrity:**
   - Each verification attempt has unique request ID
   - Complete audit trail maintained
   - No orphaned documents

4. **Error Prevention:**
   - Check rejection status before reusing request
   - Create new request automatically
   - Validate on both frontend and backend

## Summary

### Problem
❌ Resubmission after rejection failed with "Document type already uploaded"

### Solution
✅ Create new verification request for each resubmission after rejection

### Impact
- ✅ Users can retry KYC verification after rejection
- ✅ Each attempt has unique request ID
- ✅ Complete audit trail maintained
- ✅ No duplicate document errors

---

**Status:** ✅ FIXED  
**Date:** November 25, 2024  
**Impact:** Critical - Blocked KYC resubmission after rejection  
**Related:** KYC_UPLOAD_ERROR_FIX.md (previous fix for initial upload)

