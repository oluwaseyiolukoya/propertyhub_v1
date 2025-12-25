# KYC Verification Module - Implementation Checklist

## Files to Create

- [ ] `backend/src/services/dojah-verification.service.ts`

  - [ ] DojahVerificationService class
  - [ ] verifyTenantDocuments() method
  - [ ] extractDocumentNumber() method
  - [ ] compareData() method
  - [ ] calculateNameMatchConfidence() method
  - [ ] logVerification() method

- [ ] `src/components/owner/KYCVerificationDialog.tsx`
  - [ ] Dialog component structure
  - [ ] Tenant info display
  - [ ] Document type selector
  - [ ] Verification button
  - [ ] Results display
  - [ ] Comparison table
  - [ ] Error handling

## Files to Modify

- [ ] `backend/src/routes/owner-verification.ts`

  - [ ] Add POST `/tenants/verifications/:tenantId/verify-kyc` endpoint
  - [ ] Import dojahVerificationService
  - [ ] Add authorization checks
  - [ ] Add error handling

- [ ] `src/lib/api/owner-verification.ts`

  - [ ] Add verifyTenantKYC() function
  - [ ] Add TypeScript types for response

- [ ] `src/components/owner/TenantVerificationManagement.tsx`
  - [ ] Import KYCVerificationDialog
  - [ ] Add showVerifyKYCModal state
  - [ ] Add tenantToVerify state
  - [ ] Add handleVerifyKYC() function
  - [ ] Add "Verify KYC" to dropdown menu
  - [ ] Add KYCVerificationDialog component

## Environment Variables

- [ ] Verify `DOJAH_APP_ID` is set
- [ ] Verify `DOJAH_API_KEY` is set
- [ ] Verify `DOJAH_BASE_URL` is set (optional, defaults to https://api.dojah.io)

## Testing

### Unit Tests

- [ ] Test DojahVerificationService.verifyTenantDocuments()
- [ ] Test document number extraction
- [ ] Test data comparison logic
- [ ] Test confidence calculation
- [ ] Test error handling

### Integration Tests

- [ ] Test API endpoint with valid request
- [ ] Test API endpoint with invalid document type
- [ ] Test API endpoint with missing documents
- [ ] Test Dojah API integration (sandbox)
- [ ] Test error scenarios

### Manual Testing

- [ ] Verify KYC button appears in dropdown
- [ ] Dialog opens with correct tenant data
- [ ] Document type selector works
- [ ] Verification completes successfully
- [ ] Results display correctly
- [ ] Confidence score is accurate
- [ ] Comparison table shows correct data
- [ ] Approve/Reject actions work
- [ ] Error messages display correctly
- [ ] Loading states work

## Documentation

- [x] Design document created
- [x] Implementation guide created
- [x] Summary document created
- [ ] API documentation updated
- [ ] User guide created (optional)

## Deployment

- [ ] Code review completed
- [ ] All tests passing
- [ ] Staging deployment
- [ ] Staging testing completed
- [ ] Production deployment
- [ ] Production monitoring setup
- [ ] User training (if needed)

---

## Quick Start Commands

```bash
# 1. Create backend service
touch backend/src/services/dojah-verification.service.ts

# 2. Create frontend dialog
touch src/components/owner/KYCVerificationDialog.tsx

# 3. Run tests
cd backend && npm test
cd ../src && npm test

# 4. Check linting
npm run lint
```

---

**Last Updated:** December 22, 2025
