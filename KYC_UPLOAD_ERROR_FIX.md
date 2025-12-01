# KYC Document Upload Error Fix

## Error

```
Failed to upload National Identification Number (NIN): Verification request not found
```

## Root Cause

The issue was caused by **React state asynchronicity**. When the KYC request was created:

```typescript
const newRequestId = submitResponse.data.requestId;
setRequestId(newRequestId);  // ← State update is async!

// Later in the loop:
formData.append('requestId', requestId!);  // ← Still using OLD value (null)!
```

The `setRequestId()` call updates the state asynchronously, but the code immediately tried to use `requestId` in the upload loop. Since the state hadn't updated yet, `requestId` was still `null`, causing the "Verification request not found" error.

## Solution

Use a **local variable** to store the request ID immediately after creation, instead of relying on the state variable:

```typescript
// Step 1: Submit KYC request if not already created
let currentRequestId = requestId;  // ← Use local variable

if (!currentRequestId) {
  const submitResponse = await apiClient.post('/api/verification/kyc/submit', {});
  
  currentRequestId = submitResponse.data.requestId;  // ← Store in local variable
  setRequestId(currentRequestId);  // ← Also update state for future renders
}

// Step 2: Upload each document
for (const doc of validDocuments) {
  const formData = new FormData();
  formData.append('requestId', currentRequestId!);  // ← Use local variable
  // ...
}
```

## Files Changed

- **`src/components/KYCVerificationPage.tsx`** (lines 159-187)
  - Added `currentRequestId` local variable
  - Use `currentRequestId` instead of `requestId` in upload loop

## Testing

1. **Clear browser storage** (to simulate fresh KYC flow)
2. **Log in** with a customer account requiring KYC
3. **Upload 2+ documents** with document numbers
4. **Click "Submit for Verification"**
5. **Expected:** Documents upload successfully without "request not found" error

## Additional Notes

### Why This Happens

React state updates are **batched and asynchronous** for performance. When you call `setRequestId()`, React doesn't immediately update the `requestId` variable. Instead, it schedules a re-render with the new value.

### Best Practice

When you need to use a value immediately after setting state:
- ✅ **Use a local variable** (like `currentRequestId`)
- ❌ **Don't rely on state variable** immediately after `setState()`

### Related Pattern

This is a common pattern in React when you need to:
1. Create a resource (e.g., request ID)
2. Immediately use that resource (e.g., upload documents)

Always use a local variable to bridge the gap between creation and usage.

---

**Status:** ✅ FIXED  
**Date:** November 25, 2024  
**Impact:** Critical - Blocked KYC document uploads

