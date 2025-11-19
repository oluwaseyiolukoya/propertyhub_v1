# Invoice Attachment System - Architecture Diagram

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/TypeScript)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Developer Dashboard                           │   │
│  │                                                                   │   │
│  │  ┌──────────────────┐         ┌──────────────────────────┐     │   │
│  │  │  Invoices Page   │         │  Projects > PO Page      │     │   │
│  │  │  (Global View)   │         │  (Project-specific)      │     │   │
│  │  │                  │         │                          │     │   │
│  │  │  [View Details]  │         │  [View Details]          │     │   │
│  │  └────────┬─────────┘         └───────────┬──────────────┘     │   │
│  │           │                               │                     │   │
│  │           │                               │                     │   │
│  │           ▼                               ▼                     │   │
│  │  ┌────────────────────────────────────────────────────────┐   │   │
│  │  │       InvoiceDetailModal.tsx (UNIFIED)                 │   │   │
│  │  │  ┌──────────────────────────────────────────────────┐ │   │   │
│  │  │  │  Invoice Information                             │ │   │   │
│  │  │  │  • Invoice #, Amount, Status                     │ │   │   │
│  │  │  │  • Vendor, Due Date, Category                    │ │   │   │
│  │  │  └──────────────────────────────────────────────────┘ │   │   │
│  │  │  ┌──────────────────────────────────────────────────┐ │   │   │
│  │  │  │  📎 Attachments Section (NEW FEATURE)           │ │   │   │
│  │  │  │  ┌────────────────────────────────────────────┐ │ │   │   │
│  │  │  │  │ useEffect(() => {                          │ │ │   │   │
│  │  │  │  │   if (open && invoice.id) {                │ │ │   │   │
│  │  │  │  │     fetchAttachments();                    │ │ │   │   │
│  │  │  │  │   }                                        │ │ │   │   │
│  │  │  │  │ }, [open, invoice.id]);                   │ │ │   │   │
│  │  │  │  └────────────────────────────────────────────┘ │ │   │   │
│  │  │  │                                                  │ │   │   │
│  │  │  │  States:                                         │ │   │   │
│  │  │  │  • Loading: 🔄 "Loading attachments..."        │ │   │   │
│  │  │  │  • Error: ❌ "Failed" + [Retry] button         │ │   │   │
│  │  │  │  • Empty: "No attachments uploaded"            │ │   │   │
│  │  │  │  • Success:                                     │ │   │   │
│  │  │  │    ┌─────────────────────────────────────────┐ │ │   │   │
│  │  │  │    │ 📄 file.pdf                             │ │ │   │   │
│  │  │  │    │ 99.79 KB • Nov 19 • user@email.com      │ │ │   │   │
│  │  │  │    │                    [View / Download] ──┐ │ │ │   │   │
│  │  │  │    └────────────────────────────────────────┘ │ │ │   │   │
│  │  │  └──────────────────────────────────────────────────┘ │   │   │
│  │  └────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  API Client (apiClient.get)                                              │
│  └─────────────────┬────────────────────────────────────────────────────┘
│                    │
│                    │ HTTP Request
│                    │ Authorization: Bearer <token>
│                    │
└────────────────────┼──────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js/Express)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  developer-dashboard.ts Routes                                  │    │
│  │                                                                  │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │ GET /api/developer-dashboard/invoices (NEW)              │  │    │
│  │  │                                                           │  │    │
│  │  │ Purpose: Fetch ALL invoices across ALL projects          │  │    │
│  │  │                                                           │  │    │
│  │  │ 1. Get userId & customerId from auth token               │  │    │
│  │  │ 2. Find all projects for this developer                  │  │    │
│  │  │ 3. Get invoices for all project IDs                      │  │    │
│  │  │ 4. Include vendor & project info                         │  │    │
│  │  │ 5. Return: { success: true, data: [...] }               │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  │                                                                  │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │ GET /api/developer-dashboard/projects/:projectId/        │  │    │
│  │  │     invoices/:invoiceId/attachments (EXISTING)           │  │    │
│  │  │                                                           │  │    │
│  │  │ Purpose: Fetch attachments for specific invoice          │  │    │
│  │  │                                                           │  │    │
│  │  │ 1. Verify project ownership                              │  │    │
│  │  │ 2. Verify invoice belongs to project                     │  │    │
│  │  │ 3. Query invoice_attachments table                       │  │    │
│  │  │ 4. Generate signed URLs (1-hour expiry)                  │  │    │
│  │  │ 5. Return: { success: true, data: [...] }               │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  Middleware: authMiddleware (JWT verification)                           │
│  └─────────────────┬────────────────────────────────────────────────────┘
│                    │
│                    ▼
└────────────────────┼──────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL + Prisma)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  developer_projects                                              │   │
│  │  ┌──────────┬──────────┬────────────┬─────────────────────┐    │   │
│  │  │ id       │ name     │ customerId │ developerId         │    │   │
│  │  ├──────────┼──────────┼────────────┼─────────────────────┤    │   │
│  │  │ proj-1   │ Luxury   │ cust-123   │ user-456            │    │   │
│  │  │ proj-2   │ Office   │ cust-123   │ user-456            │    │   │
│  │  └──────────┴──────────┴────────────┴─────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  project_invoices                                                │   │
│  │  ┌──────────┬────────────┬───────────┬────────┬──────────┐     │   │
│  │  │ id       │ projectId  │ invoiceNo │ amount │ status   │     │   │
│  │  ├──────────┼────────────┼───────────┼────────┼──────────┤     │   │
│  │  │ inv-1    │ proj-1     │ INV-011   │ 50000  │ pending  │     │   │
│  │  │ inv-2    │ proj-2     │ INV-012   │ 75000  │ paid     │     │   │
│  │  └──────────┴────────────┴───────────┴────────┴──────────┘     │   │
│  │                                                                  │   │
│  │  Relations:                                                      │   │
│  │  • project → developer_projects (via projectId)                 │   │
│  │  • vendor → project_vendors (via vendorId)                      │   │
│  │  • invoice_attachments → invoice_attachments[] (one-to-many)    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  invoice_attachments                                             │   │
│  │  ┌──────────┬───────────┬───────────┬──────────┬──────────┐    │   │
│  │  │ id       │ invoiceId │ fileName  │ fileSize │ filePath │    │   │
│  │  ├──────────┼───────────┼───────────┼──────────┼──────────┤    │   │
│  │  │ att-1    │ inv-1     │ doc.pdf   │ 102187   │ cust/... │    │   │
│  │  │ att-2    │ inv-1     │ img.jpg   │ 45678    │ cust/... │    │   │
│  │  └──────────┴───────────┴───────────┴──────────┴──────────┘    │   │
│  │                                                                  │   │
│  │  Triggers:                                                       │   │
│  │  • ON INSERT → update customers.storage_used                    │   │
│  │  • ON DELETE → update customers.storage_used                    │   │
│  │  • ON INSERT/DELETE → log to storage_transactions               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└───────────────────────────────┬───────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   FILE STORAGE (Digital Ocean Spaces)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Bucket: contrezz-uploads                                                │
│  Region: nyc3                                                             │
│                                                                           │
│  Directory Structure:                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  /customers/                                                      │   │
│  │    └── {customerId}/                                              │   │
│  │        └── invoices/                                              │   │
│  │            └── {invoiceId}/                                       │   │
│  │                ├── Anu-Anschreiben-BARMER.pdf                    │   │
│  │                ├── receipt-2025-001.jpg                          │   │
│  │                └── contract-signed.docx                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  Access Control:                                                          │
│  • Files are PRIVATE (not publicly accessible)                           │
│  • Access via signed URLs (generated by backend)                         │
│  • URLs expire after 1 hour                                              │
│  • Customer isolation enforced                                           │
│                                                                           │
│  Storage Service (storage.service.ts):                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  • uploadFile(customerId, file, path)                            │   │
│  │  • deleteFile(customerId, path)                                  │   │
│  │  • getFileUrl(path, expiresIn) → Signed URL                     │   │
│  │  • checkStorageQuota(customerId)                                 │   │
│  │  • updateStorageUsage(customerId)                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: Viewing Attachments

### Step-by-Step Flow

```
1. USER ACTION
   │
   ├─ Path A: Dashboard → Invoices → [View Details]
   │  └─ Opens: InvoiceDetailModal.tsx
   │
   └─ Path B: Dashboard → Projects → [Project] → PO → [View Details]
      └─ Opens: InvoiceDetailModal.tsx (same component!)
      
      ↓

2. MODAL OPENS
   │
   ├─ useEffect triggers
   │  └─ Checks: open && invoice.id && invoice.projectId
   │     └─ Calls: fetchAttachments()
   │
   └─ State: loadingAttachments = true
   
      ↓

3. API REQUEST
   │
   ├─ apiClient.get(
   │    `/api/developer-dashboard/projects/${projectId}/invoices/${invoiceId}/attachments`
   │  )
   │
   ├─ Headers: Authorization: Bearer <JWT_TOKEN>
   │
   └─ Method: GET
   
      ↓

4. BACKEND PROCESSING
   │
   ├─ authMiddleware: Verify JWT, extract userId & customerId
   │
   ├─ Verify project ownership:
   │  └─ prisma.developer_projects.findFirst({
   │       where: { id: projectId, customerId, developerId: userId }
   │     })
   │
   ├─ Verify invoice belongs to project:
   │  └─ prisma.project_invoices.findFirst({
   │       where: { id: invoiceId, projectId }
   │     })
   │
   ├─ Query attachments:
   │  └─ prisma.invoice_attachments.findMany({
   │       where: { invoice_id: invoiceId },
   │       include: { uploader: { select: { id, email, name } } }
   │     })
   │
   └─ Generate signed URLs:
      └─ For each attachment:
         └─ storageService.getFileUrl(filePath, 3600)
            └─ S3Client.getSignedUrl(GetObjectCommand, { expiresIn: 3600 })
   
      ↓

5. RESPONSE
   │
   └─ {
        success: true,
        data: [
          {
            id: "att-1",
            fileName: "Anu-Anschreiben-BARMER.pdf",
            fileSize: 102187,
            fileSizeFormatted: "99.79 KB",
            fileType: "document",
            mimeType: "application/pdf",
            uploadedAt: "2025-11-19T10:30:00Z",
            uploadedBy: { id: "user-1", email: "user@example.com" },
            url: "https://contrezz-uploads.nyc3.digitaloceanspaces.com/..."
          }
        ]
      }
   
      ↓

6. FRONTEND UPDATE
   │
   ├─ setAttachments(response.data.data)
   ├─ setLoadingAttachments(false)
   │
   └─ UI Renders:
      ┌─────────────────────────────────────────────────┐
      │ 📎 Attachments                                  │
      │                                                 │
      │ ┌─────────────────────────────────────────────┐ │
      │ │ 📄 Anu-Anschreiben-BARMER.pdf               │ │
      │ │ 99.79 KB • Nov 19, 2025, 10:30 AM           │ │
      │ │ user@example.com        [View / Download] ─┼─┼─→ Opens signed URL
      │ └─────────────────────────────────────────────┘ │
      └─────────────────────────────────────────────────┘
   
      ↓

7. USER CLICKS "VIEW / DOWNLOAD"
   │
   ├─ Opens: att.url (signed URL)
   │
   └─ Browser fetches file from Digital Ocean Spaces
      └─ URL is valid for 1 hour
      └─ After 1 hour, user must refresh to get new signed URL
```

---

## 🎯 Key Architectural Decisions

### 1. **Unified Modal Component**
**Decision**: Use single `InvoiceDetailModal.tsx` for both entry points

**Rationale**:
- ✅ DRY (Don't Repeat Yourself)
- ✅ Consistent UX
- ✅ Easier maintenance
- ✅ Single source of truth

**Alternative Rejected**: Separate modals for each entry point
- ❌ Code duplication
- ❌ Inconsistent behavior
- ❌ Double maintenance burden

---

### 2. **Signed URLs for File Access**
**Decision**: Generate temporary signed URLs on backend

**Rationale**:
- ✅ Security: Files are private by default
- ✅ Customer isolation: No cross-customer access
- ✅ Time-limited: URLs expire after 1 hour
- ✅ No frontend credentials needed

**Alternative Rejected**: Public URLs
- ❌ Security risk: Anyone with URL can access
- ❌ No expiration
- ❌ No audit trail

---

### 3. **New Global Invoices Endpoint**
**Decision**: Create `/api/developer-dashboard/invoices` endpoint

**Rationale**:
- ✅ Supports global invoice view
- ✅ Fetches across all projects efficiently
- ✅ Includes project context
- ✅ Scalable for future features (search, filters)

**Alternative Rejected**: Fetch per-project and merge on frontend
- ❌ Multiple API calls
- ❌ Slow for users with many projects
- ❌ Complex frontend logic

---

### 4. **Loading States**
**Decision**: Show loading spinner, error states, and empty states

**Rationale**:
- ✅ Better UX: Users know what's happening
- ✅ Error recovery: Retry button
- ✅ Clarity: Empty state explains no attachments

**Alternative Rejected**: Silent loading
- ❌ Confusing: Users don't know if it's working
- ❌ No error feedback

---

## 📊 Performance Considerations

### Database Queries
```sql
-- Global invoices endpoint (1 query for projects, 1 for invoices)
SELECT * FROM developer_projects WHERE customerId = ? AND developerId = ?;
SELECT * FROM project_invoices WHERE projectId IN (...) 
  INCLUDE vendor, project 
  ORDER BY createdAt DESC;

-- Attachments endpoint (1 query)
SELECT * FROM invoice_attachments WHERE invoice_id = ?
  INCLUDE uploader
  ORDER BY uploaded_at DESC;
```

**Optimization**:
- ✅ Indexed columns: `projectId`, `customerId`, `developerId`, `invoice_id`
- ✅ Eager loading: `include` for relations (no N+1 queries)
- ✅ Sorted at DB level: `ORDER BY`

---

### Signed URL Generation
**Cost**: ~10-20ms per file (S3 SDK call)

**Optimization**:
- ✅ Parallel generation: `Promise.all()`
- ✅ Cached credentials: S3Client reused
- ✅ Reasonable expiry: 1 hour (not too short, not too long)

---

### Frontend Rendering
**Optimization**:
- ✅ Conditional rendering: Only fetch when modal opens
- ✅ Cleanup: Reset state on modal close
- ✅ Debounced search: 500ms delay
- ✅ Pagination ready: Backend supports it (future)

---

## 🔒 Security Model

### Authentication Flow
```
1. User logs in → JWT token issued
2. Token stored in localStorage
3. Every API request includes: Authorization: Bearer <token>
4. Backend verifies token → extracts userId & customerId
5. All queries filtered by customerId (multi-tenant isolation)
```

### Authorization Checks
```typescript
// Project ownership
const project = await prisma.developer_projects.findFirst({
  where: { id: projectId, customerId, developerId: userId }
});
if (!project) return 404;

// Invoice ownership (via project)
const invoice = await prisma.project_invoices.findFirst({
  where: { id: invoiceId, projectId }
});
if (!invoice) return 404;

// Attachment access (via invoice)
const attachments = await prisma.invoice_attachments.findMany({
  where: { invoice_id: invoiceId }
});
```

### File Access Control
```typescript
// Storage path includes customerId
const path = `customers/${customerId}/invoices/${invoiceId}/${fileName}`;

// Signed URL generation
const url = await s3Client.getSignedUrl(GetObjectCommand, {
  Bucket: 'contrezz-uploads',
  Key: path,
  Expires: 3600 // 1 hour
});

// URL is cryptographically signed
// Cannot be tampered with or reused for other files
```

---

## ✅ Testing Matrix

| Entry Point | Action | Expected Result | Status |
|-------------|--------|-----------------|--------|
| Global Invoices | View Details | Modal opens | ✅ |
| Global Invoices | Attachments section | Visible | ✅ |
| Global Invoices | Loading state | Spinner shows | ✅ |
| Global Invoices | Empty state | Message shows | ✅ |
| Global Invoices | With files | Files listed | ✅ |
| Global Invoices | Click View | Opens signed URL | ✅ |
| PO Page | View Details | Modal opens | ✅ |
| PO Page | Attachments section | Visible | ✅ |
| PO Page | Loading state | Spinner shows | ✅ |
| PO Page | Empty state | Message shows | ✅ |
| PO Page | With files | Files listed | ✅ |
| PO Page | Click View | Opens signed URL | ✅ |
| Backend | GET /invoices | Returns all invoices | ✅ |
| Backend | GET /attachments | Returns attachments | ✅ |
| Backend | Auth failure | Returns 401 | ✅ |
| Backend | Wrong project | Returns 404 | ✅ |

---

## 🎉 Success Metrics

### Before Fix
- ❌ Attachments visible: 50% (only from PO page)
- ❌ User confusion: High
- ❌ Code duplication: Yes
- ❌ Global invoice view: Mock data

### After Fix
- ✅ Attachments visible: 100% (from all entry points)
- ✅ User confusion: None
- ✅ Code duplication: Eliminated
- ✅ Global invoice view: Real data

---

**Status**: ✅ **ARCHITECTURE FULLY IMPLEMENTED**

