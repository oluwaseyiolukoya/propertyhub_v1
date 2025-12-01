# Email Search Implementation for Verification Management

**Date:** November 26, 2025  
**Status:** ✅ COMPLETE

---

## 📋 Overview

Implemented email search functionality in the Verification Management page to allow admins to search for verification requests by customer email address.

---

## 🎯 Features Implemented

### 1. **Database Schema Update**
- Added `customerEmail` field to `verification_requests` table
- Added index on `customerEmail` for fast searches
- Migration: `20251126043127_add_customer_email_to_verification_requests`

```prisma
model verification_requests {
  id              String   @id @default(uuid())
  customerId      String
  customerEmail   String?  // NEW: Customer email for search
  customerType    String
  status          String   @default("pending")
  // ... other fields ...
  
  @@index([customerEmail]) // NEW: Index for fast search
}
```

### 2. **Backend API Updates**

#### Verification Service (`verification-service/`)
- **Route:** Updated `POST /api/verification/submit` to accept `customerEmail`
- **Service:** Updated `createRequest()` to store customer email
- **Admin Route:** Updated `GET /api/admin/requests` to accept `email` query parameter
- **Admin Service:** Updated `listRequests()` to filter by email (case-insensitive)

```typescript
// Admin Service - Email Search
if (email && email.trim()) {
  where.customerEmail = {
    contains: email.trim(),
    mode: 'insensitive', // Case-insensitive search
  };
}
```

#### Main Backend (`backend/`)
- **Verification Client:** Updated `submitVerification()` to accept and pass `customerEmail`
- **KYC Route:** Updated `POST /api/verification/kyc/submit` to fetch and pass customer email

```typescript
// Fetch customer email
const customer = await prisma.customers.findUnique({
  where: { id: customerId },
  select: { email: true },
});

// Pass to verification service
const verificationRequest = await verificationClient.submitVerification(
  customerId,
  customerType,
  customer.email, // Pass email for search
  req.ip,
  req.headers['user-agent']
);
```

### 3. **Frontend Updates**

#### API Client (`src/lib/api/verification.ts`)
- Updated `getVerificationRequests()` to accept `email` parameter
- Passes email to backend API

```typescript
export const getVerificationRequests = async (
  status?: string,
  page: number = 1,
  limit: number = 20,
  email?: string // NEW
) => {
  const params: any = { status, page, limit };
  
  if (email && email.trim()) {
    params.email = email.trim();
  }
  
  return apiClient.get<PaginatedRequests>('/api/admin/verification/requests', params);
};
```

#### Verification Management Component (`src/components/admin/VerificationManagement.tsx`)
- Added `emailSearch` state for email search input
- Added dedicated email search input field
- Kept existing `searchTerm` for client-side filtering (Request ID, Customer ID)
- Updated `loadRequests()` to pass `emailSearch` to API
- Added `customerEmail` column to the table
- Auto-reloads when email search changes

```tsx
// Email Search (Server-side)
<input
  type="email"
  placeholder="Search by customer email..."
  value={emailSearch}
  onChange={(e) => {
    setEmailSearch(e.target.value);
    setPage(1); // Reset to page 1 when searching
  }}
/>

// Local Filter (Client-side)
<input
  type="text"
  placeholder="Filter by customer ID or request ID..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
```

---

## 🔍 How It Works

### **Search Flow:**

1. **Admin enters email** in the search box
2. **Frontend** calls `getVerificationRequests(status, page, limit, email)`
3. **Main Backend** proxies request to verification service
4. **Verification Service** queries database with case-insensitive `LIKE` search:
   ```sql
   SELECT * FROM verification_requests
   WHERE "customerEmail" ILIKE '%search@example.com%'
   AND status = 'pending'
   ORDER BY "submittedAt" DESC
   LIMIT 20 OFFSET 0;
   ```
5. **Results** returned to frontend and displayed in table

### **Search Types:**

| Search Field | Type | Scope | Example |
|--------------|------|-------|---------|
| **Email Search** | Server-side | Database query | `john@example.com` |
| **Local Filter** | Client-side | Current page results | `cust-123` or `req-456` |

---

## 📊 UI Changes

### **Before:**
- Single search box for Customer ID or Request ID
- No email visibility in table

### **After:**
- **Two search inputs:**
  1. Email search (server-side, searches database)
  2. Local filter (client-side, filters current results)
- **New table column:** Customer Email
- **Table columns (in order):**
  1. Request ID
  2. Customer Email ← NEW
  3. Customer ID
  4. Type
  5. Documents
  6. Status
  7. Submitted
  8. Actions

---

## 🎯 Use Cases

### **1. Find Customer by Email**
```
Admin types: "olukoyaseyifunmi@gmail.com"
→ Shows all verification requests for that customer
→ Includes all attempts (rejected, approved, pending)
```

### **2. Partial Email Search**
```
Admin types: "olukoya"
→ Shows all requests with emails containing "olukoya"
→ Case-insensitive
```

### **3. Combined Filtering**
```
Admin:
1. Searches by email: "john@example.com"
2. Filters by status: "Pending"
3. Locally filters by Request ID: "090cc"
→ Shows pending requests for john@example.com with ID starting with 090cc
```

---

## 🔧 Technical Details

### **Database Query Performance:**
- ✅ Index on `customerEmail` for fast searches
- ✅ Case-insensitive search using Prisma's `mode: 'insensitive'`
- ✅ Pagination to limit results
- ✅ Combined with status filter for efficient queries

### **Migration:**
```bash
cd verification-service
npx prisma migrate dev --name add_customer_email_to_verification_requests
```

### **Migration SQL:**
```sql
-- Add customerEmail column
ALTER TABLE "verification_requests" 
ADD COLUMN "customerEmail" TEXT;

-- Add index for fast search
CREATE INDEX "verification_requests_customerEmail_idx" 
ON "verification_requests"("customerEmail");
```

---

## 📝 Example Queries

### **1. Search by Email:**
```
GET /api/admin/verification/requests?email=john@example.com&status=pending&page=1&limit=20
```

### **2. Search Partial Email:**
```
GET /api/admin/verification/requests?email=john&page=1&limit=20
```

### **3. No Email Filter:**
```
GET /api/admin/verification/requests?status=all&page=1&limit=20
```

---

## ✅ Testing Checklist

- [x] Database migration applied successfully
- [x] Verification service accepts `customerEmail` parameter
- [x] Main backend fetches and passes customer email
- [x] Admin API endpoint filters by email
- [x] Frontend displays email search input
- [x] Frontend displays customer email in table
- [x] Email search triggers API call
- [x] Case-insensitive search works
- [x] Partial email search works
- [x] Pagination works with email search
- [x] Combined filters work (email + status)
- [x] Local filter still works for Request ID / Customer ID

---

## 🚀 Deployment Notes

### **Production Deployment:**

1. **Apply Migration:**
   ```bash
   cd verification-service
   npx prisma migrate deploy
   ```

2. **Restart Services:**
   ```bash
   # Restart verification service
   pm2 restart verification-service
   
   # Restart main backend
   pm2 restart backend
   ```

3. **Verify:**
   ```bash
   # Check verification service health
   curl http://localhost:5001/health
   
   # Test email search
   curl -H "X-API-Key: $API_KEY" \
     "http://localhost:5001/api/admin/requests?email=test@example.com"
   ```

---

## 🎓 Benefits

1. **Faster Customer Lookup** - Admins can search by email instead of copying Customer IDs
2. **Better UX** - Email is more memorable than UUIDs
3. **Audit Trail** - Email visible in table for quick reference
4. **Multiple Attempts** - See all verification attempts for same email
5. **Flexible Search** - Partial email matching for fuzzy searches

---

## 📚 Related Files

### **Backend (Verification Service):**
- `verification-service/prisma/schema.prisma` - Schema update
- `verification-service/src/routes/admin.ts` - Admin API route
- `verification-service/src/services/admin.service.ts` - Email search logic
- `verification-service/src/routes/verification.ts` - Submit endpoint
- `verification-service/src/services/verification.service.ts` - Create request

### **Backend (Main):**
- `backend/src/services/verification-client.service.ts` - Client update
- `backend/src/routes/verification.ts` - KYC submit route

### **Frontend:**
- `src/lib/api/verification.ts` - API client
- `src/components/admin/VerificationManagement.tsx` - UI component

---

## 🔮 Future Enhancements

1. **Advanced Search:**
   - Search by customer name
   - Search by phone number
   - Date range filter

2. **Export:**
   - Export search results to CSV
   - Include customer email in exports

3. **Bulk Actions:**
   - Approve multiple requests by email
   - Reject multiple requests

4. **Email Notifications:**
   - Send bulk emails to customers
   - Resend verification instructions

---

**Last Updated:** November 26, 2025  
**Status:** ✅ PRODUCTION READY  
**Migration:** `20251126043127_add_customer_email_to_verification_requests`

