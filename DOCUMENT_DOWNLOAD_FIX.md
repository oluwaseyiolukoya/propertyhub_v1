# Document Download URL Encoding Fix

**Date:** November 26, 2025  
**Status:** ✅ FIXED

---

## 🐛 Problem

When admin tried to view/download documents with **spaces in filenames**, they got this error:

```xml
<Error>
  <Code>NoSuchKey</Code>
  <Message/>
  <BucketName>contrezz-uploads</BucketName>
</Error>
```

---

## 🔍 Root Cause

**URL Encoding Mismatch:**

1. **File Storage:** Files are stored in DigitalOcean Spaces with **decoded** keys (actual spaces)
   ```
   verification/.../drivers_license/1764145063920-Anu Anschreiben_Oberlin Service .pdf
   ```

2. **Database Storage:** The `fileUrl` in the database contains **URL-encoded** paths
   ```
   https://contrezz-uploads.nyc3.digitaloceanspaces.com/verification/.../1764145063920-Anu%20Anschreiben_Oberlin%20Service%20.pdf
   ```

3. **Pre-signed URL Generation:** The code was extracting the key from `fileUrl` **without decoding**, resulting in:
   ```
   verification/.../1764145063920-Anu%20Anschreiben_Oberlin%20Service%20.pdf
   ```
   (Note: `%20` instead of actual space)

4. **S3 Lookup Failure:** S3 client tried to find a file with `%20` in the key, but the actual file has spaces, so it returned `NoSuchKey`.

---

## ✅ Solution

**Decode URL-encoded characters before generating pre-signed URL:**

### Before (Broken):
```typescript
// Extract S3 key from fileUrl
const url = new URL(document.fileUrl);
const fileKey = url.pathname.substring(1); // Remove leading '/'
// Result: "verification/.../1764145063920-Anu%20Anschreiben_Oberlin%20Service%20.pdf"
```

### After (Fixed):
```typescript
// Extract S3 key from fileUrl
const url = new URL(document.fileUrl);
// Decode URL-encoded characters (e.g., %20 -> space)
const fileKey = decodeURIComponent(url.pathname.substring(1)); // Remove leading '/' and decode
// Result: "verification/.../1764145063920-Anu Anschreiben_Oberlin Service .pdf"
```

---

## 📝 File Changed

**File:** `verification-service/src/services/admin.service.ts`  
**Method:** `getDocumentDownloadUrl()`  
**Line:** ~281

**Change:**
```diff
- const fileKey = url.pathname.substring(1);
+ const fileKey = decodeURIComponent(url.pathname.substring(1));
```

---

## 🧪 Testing

### Test Case 1: File with Spaces
```bash
# Document: "Anu Anschreiben_Oberlin Service .pdf"
# File URL: https://contrezz-uploads.nyc3.digitaloceanspaces.com/.../1764145063920-Anu%20Anschreiben_Oberlin%20Service%20.pdf

# Before Fix:
# ❌ Extracted key: "verification/.../1764145063920-Anu%20Anschreiben_Oberlin%20Service%20.pdf"
# ❌ S3 lookup: NoSuchKey

# After Fix:
# ✅ Extracted key: "verification/.../1764145063920-Anu Anschreiben_Oberlin Service .pdf"
# ✅ S3 lookup: Success
# ✅ Pre-signed URL generated
```

### Test Case 2: File without Spaces
```bash
# Document: "Anu-Lebenslauf-Update-081125.pdf"
# File URL: https://contrezz-uploads.nyc3.digitaloceanspaces.com/.../1764108955683-Anu-Lebenslauf-Update-081125.pdf

# Before Fix:
# ✅ Extracted key: "verification/.../1764108955683-Anu-Lebenslauf-Update-081125.pdf"
# ✅ Works fine

# After Fix:
# ✅ Extracted key: "verification/.../1764108955683-Anu-Lebenslauf-Update-081125.pdf"
# ✅ Still works (decodeURIComponent doesn't affect non-encoded strings)
```

---

## 🎯 Impact

### **Affected Files:**
- Files with spaces in filenames
- Files with special characters: `%`, `+`, `&`, `#`, etc.

### **Not Affected:**
- Files with only alphanumeric characters, hyphens, underscores, dots

### **Backward Compatible:**
- ✅ Old files without special characters still work
- ✅ New files with special characters now work

---

## 🚀 Deployment

### Steps:
1. ✅ Updated `verification-service/src/services/admin.service.ts`
2. ✅ Restarted verification service
3. ✅ Verified health check passes

### Verification:
```bash
# Check service health
curl http://localhost:5001/health

# Test document download (admin must be logged in)
# Go to Admin → Verification → View Request → Click "View" or "Download" on document
```

---

## 📚 Related Files

- `verification-service/src/services/admin.service.ts` - Fixed file
- `verification-service/src/services/verification.service.ts` - File upload (stores URL)
- `backend/src/routes/admin-verification.ts` - Proxy to verification service
- `src/components/admin/VerificationManagement.tsx` - Admin UI

---

## 🔮 Future Improvements

### 1. **Sanitize Filenames on Upload**
Instead of allowing spaces and special characters, sanitize filenames:
```typescript
const sanitizedFilename = originalFilename
  .replace(/\s+/g, '-')  // Replace spaces with hyphens
  .replace(/[^a-zA-Z0-9.-]/g, ''); // Remove special chars
```

### 2. **Store Decoded Key in Database**
Store both `fileUrl` (for display) and `fileKey` (decoded, for S3 operations):
```typescript
{
  fileUrl: 'https://.../%20file.pdf',  // For display/download
  fileKey: 'verification/.../file.pdf' // For S3 operations
}
```

### 3. **Add File Validation**
Reject uploads with problematic characters:
```typescript
const invalidChars = /[<>:"|?*\x00-\x1F]/;
if (invalidChars.test(filename)) {
  throw new Error('Filename contains invalid characters');
}
```

---

## ✅ Success Criteria

A document download is working correctly when:

1. ✅ Admin can view documents with spaces in filenames
2. ✅ Admin can download documents with spaces in filenames
3. ✅ Pre-signed URLs are generated successfully
4. ✅ No `NoSuchKey` errors in DigitalOcean Spaces
5. ✅ Old documents without spaces still work
6. ✅ Document access is logged in `verification_history`

---

## 🎓 Key Learnings

1. **URL Encoding Matters:** Always decode URL-encoded strings before using them as S3 keys
2. **Test with Special Characters:** Always test file operations with spaces, Unicode, and special chars
3. **S3 Key Format:** S3 keys should match exactly how files are stored (no encoding)
4. **Pre-signed URLs:** AWS SDK handles encoding in the final URL, but the key must be decoded

---

**Last Updated:** November 26, 2025  
**Status:** ✅ PRODUCTION READY  
**Severity:** HIGH - Blocked document access for files with spaces

