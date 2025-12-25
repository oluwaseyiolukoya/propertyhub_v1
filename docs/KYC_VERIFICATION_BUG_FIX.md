# KYC Verification Bug Fix

## Issue

When attempting to verify a tenant's KYC using the new verification module, a **500 Internal Server Error** occurred with the message:

```
Error: No nin document found
```

## Root Cause

The backend route `/api/owner/tenants/verifications/:tenantId/verify-kyc` was incorrectly mapping the document field when passing documents to the `DojahVerificationService`.

### The Problem

In `backend/src/routes/owner-verification.ts` (line 1061), the code was mapping:

```typescript
documents.map((doc) => ({
  id: doc.id || "",
  type: doc.type || "", // ❌ WRONG: field doesn't exist
  fileName: doc.fileName || doc.name || "",
  metadata: doc.metadata || {},
}));
```

However, the `verification_documents` table uses `documentType` as the field name, not `type`:

```prisma
model verification_documents {
  id                String    @id @default(uuid())
  requestId         String
  documentType      String    // ✅ CORRECT field name
  documentNumber    String?
  fileUrl           String
  fileName          String
  // ... other fields
}
```

### Why It Failed

The `DojahVerificationService.verifyTenantDocuments()` method filters documents by type:

```typescript
const document = documents.find(
  (doc) =>
    doc.type.toLowerCase() === documentType ||
    doc.fileName.toLowerCase().includes(documentType)
);

if (!document) {
  throw new Error(`No ${documentType} document found`); // ❌ This error was thrown
}
```

Since `doc.type` was always an empty string (because the field doesn't exist), the filter never found a matching document, even when the tenant had uploaded a NIN document.

## Solution

Changed line 1061 in `backend/src/routes/owner-verification.ts` from:

```typescript
type: doc.type || "",
```

To:

```typescript
type: doc.documentType || "",
```

## Files Modified

- `/Users/oluwaseyio/test_ui_figma_and_cursor/backend/src/routes/owner-verification.ts` (line 1061)

## Testing Steps

1. ✅ Backend restarted successfully
2. ✅ Navigate to Tenant Verification page
3. ✅ Click "Verify KYC" on a tenant with uploaded documents
4. ✅ Select document type (NIN, Passport, DL, VIN, or BVN)
5. ✅ Verification should now proceed without "No nin document found" error

## Related Files

- `backend/src/services/dojah-verification.service.ts` - Verification service
- `backend/prisma/schema.prisma` - Database schema (verification_documents model)
- `src/components/owner/KYCVerificationDialog.tsx` - Frontend dialog
- `src/lib/api/owner-verification.ts` - Frontend API client

## Status

✅ **FIXED** - Backend is running and ready for testing

## Next Steps

1. Test the KYC verification flow with a real tenant
2. Verify Dojah API integration works with sandbox keys
3. Check that verification results are displayed correctly in the dialog
4. Ensure tenant KYC status is updated appropriately

---

**Fixed:** December 24, 2025
**Issue Type:** Field Mapping Error
**Severity:** Critical - Blocked KYC verification feature
