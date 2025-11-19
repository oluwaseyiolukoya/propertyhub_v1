# Invoice Attachment System - Architecture Design

## 📋 Overview

This document outlines the professional architecture for integrating file attachments into the invoice creation workflow, leveraging the existing customer storage infrastructure with proper quota management and security.

---

## 🎯 Design Goals

1. **Seamless Integration**: Reuse existing storage service and quota system
2. **Quota Enforcement**: Check storage limits before allowing uploads
3. **Data Isolation**: Files stored in customer-specific storage paths
4. **Audit Trail**: Track all file operations with metadata
5. **User Experience**: Real-time quota feedback and upload progress
6. **Security**: Validate file types, sizes, and customer ownership
7. **Scalability**: Support multiple attachments per invoice

---

## 🏗️ Architecture Components

### 1. Database Schema Extensions

#### A. Add `invoice_attachments` Table

```sql
-- Migration: add_invoice_attachments.sql

CREATE TABLE IF NOT EXISTS invoice_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,

  CONSTRAINT fk_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_invoice_attachments_invoice ON invoice_attachments(invoice_id);
CREATE INDEX idx_invoice_attachments_customer ON invoice_attachments(customer_id);
CREATE INDEX idx_invoice_attachments_uploaded_at ON invoice_attachments(uploaded_at);

-- Add check constraint for file size (max 50MB per file)
ALTER TABLE invoice_attachments
ADD CONSTRAINT chk_file_size CHECK (file_size > 0 AND file_size <= 52428800);

COMMENT ON TABLE invoice_attachments IS 'Stores file attachments for invoices with metadata';
COMMENT ON COLUMN invoice_attachments.file_path IS 'Path in Digital Ocean Spaces (e.g., customers/{customerId}/invoices/{invoiceId}/{filename})';
COMMENT ON COLUMN invoice_attachments.metadata IS 'Additional metadata like original upload context, description, etc.';
```

#### B. Update Prisma Schema

```prisma
// Add to schema.prisma

model invoice_attachments {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  invoice_id   String    @db.Uuid
  customer_id  String    @db.Uuid
  file_path    String
  file_name    String
  file_size    BigInt
  file_type    String
  mime_type    String
  uploaded_by  String    @db.Uuid
  uploaded_at  DateTime  @default(now())
  metadata     Json?

  // Relations
  invoice      invoices  @relation(fields: [invoice_id], references: [id], onDelete: Cascade)
  customer     customers @relation(fields: [customer_id], references: [id], onDelete: Cascade)
  uploader     users     @relation(fields: [uploaded_by], references: [id], onDelete: SetNull)

  @@index([invoice_id])
  @@index([customer_id])
  @@index([uploaded_at])
}

// Update existing models to add relations
model invoices {
  // ... existing fields ...
  attachments  invoice_attachments[]
}

model customers {
  // ... existing fields ...
  invoice_attachments  invoice_attachments[]
}

model users {
  // ... existing fields ...
  invoice_attachments  invoice_attachments[]
}
```

---

### 2. Backend API Design

#### A. New Storage Endpoint: `/api/storage/upload-invoice-attachment`

**Purpose**: Specialized endpoint for invoice attachments with quota pre-check

```typescript
// backend/src/routes/storage.ts

/**
 * POST /api/storage/upload-invoice-attachment
 * Upload invoice attachment with quota validation
 *
 * Body (multipart/form-data):
 * - file: File (required)
 * - invoiceId: string (optional, if invoice already exists)
 * - description: string (optional)
 */
router.post(
  "/upload-invoice-attachment",
  authMiddleware,
  customerOnly,
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file provided",
        });
      }

      const { invoiceId, description } = req.body;
      const customerId = req.user!.customerId!;

      // 1. Check storage quota BEFORE upload
      const quota = await storageService.checkStorageQuota(
        customerId,
        req.file.size
      );

      if (!quota.canUpload) {
        return res.status(413).json({
          success: false,
          error: "Storage quota exceeded",
          quota: {
            used: quota.used,
            limit: quota.limit,
            available: quota.available,
            usedFormatted: storageService.formatBytes(quota.used),
            limitFormatted: storageService.formatBytes(quota.limit),
          },
        });
      }

      // 2. Upload file to Digital Ocean Spaces
      const uploadResult = await storageService.uploadFile({
        customerId,
        category: "invoices",
        subcategory: "attachments",
        entityId: invoiceId || "pending", // "pending" for draft invoices
        file: {
          originalName: req.file.originalname,
          buffer: req.file.buffer,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
        uploadedBy: req.user!.id,
        metadata: {
          description,
          uploadContext: "invoice_creation",
          uploadedAt: new Date().toISOString(),
        },
      });

      // 3. Save attachment record (if invoiceId exists)
      let attachmentRecord = null;
      if (invoiceId) {
        attachmentRecord = await prisma.invoice_attachments.create({
          data: {
            invoice_id: invoiceId,
            customer_id: customerId,
            file_path: uploadResult.filePath,
            file_name: req.file.originalname,
            file_size: BigInt(req.file.size),
            file_type: storageService.getFileType(req.file.mimetype),
            mime_type: req.file.mimetype,
            uploaded_by: req.user!.id,
            metadata: {
              description,
              originalUrl: uploadResult.fileUrl,
            },
          },
        });
      }

      // 4. Return success with updated quota
      const updatedQuota = await storageService.checkStorageQuota(
        customerId,
        0
      );

      res.json({
        success: true,
        message: "File uploaded successfully",
        data: {
          fileId: uploadResult.fileId,
          filePath: uploadResult.filePath,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          fileUrl: uploadResult.fileUrl,
          cdnUrl: uploadResult.cdnUrl,
          attachmentId: attachmentRecord?.id,
          quota: {
            used: updatedQuota.used,
            limit: updatedQuota.limit,
            available: updatedQuota.available,
            percentage: updatedQuota.percentage,
            usedFormatted: storageService.formatBytes(updatedQuota.used),
            limitFormatted: storageService.formatBytes(updatedQuota.limit),
          },
        },
      });
    } catch (error: any) {
      console.error("Error uploading invoice attachment:", error);

      // Handle specific error types
      if (error.message.includes("quota exceeded")) {
        return res.status(413).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: error.message || "Failed to upload attachment",
      });
    }
  }
);
```

#### B. Endpoint: `/api/storage/delete-invoice-attachment`

```typescript
/**
 * DELETE /api/storage/delete-invoice-attachment
 * Delete invoice attachment and update quota
 *
 * Body:
 * - attachmentId: string (required)
 */
router.delete(
  "/delete-invoice-attachment",
  authMiddleware,
  customerOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const { attachmentId } = req.body;

      if (!attachmentId) {
        return res.status(400).json({
          success: false,
          error: "Attachment ID is required",
        });
      }

      const customerId = req.user!.customerId!;

      // 1. Get attachment record
      const attachment = await prisma.invoice_attachments.findUnique({
        where: { id: attachmentId },
      });

      if (!attachment) {
        return res.status(404).json({
          success: false,
          error: "Attachment not found",
        });
      }

      // 2. Verify ownership
      if (attachment.customer_id !== customerId) {
        return res.status(403).json({
          success: false,
          error: "Access denied. You can only delete your own attachments.",
        });
      }

      // 3. Delete from Digital Ocean Spaces
      await storageService.deleteFile(customerId, attachment.file_path);

      // 4. Delete database record
      await prisma.invoice_attachments.delete({
        where: { id: attachmentId },
      });

      // 5. Return updated quota
      const updatedQuota = await storageService.checkStorageQuota(
        customerId,
        0
      );

      res.json({
        success: true,
        message: "Attachment deleted successfully",
        data: {
          quota: {
            used: updatedQuota.used,
            limit: updatedQuota.limit,
            available: updatedQuota.available,
            percentage: updatedQuota.percentage,
          },
        },
      });
    } catch (error: any) {
      console.error("Error deleting invoice attachment:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);
```

#### C. Endpoint: `/api/invoices/:invoiceId/attachments`

```typescript
// backend/src/routes/invoices.ts

/**
 * GET /api/invoices/:invoiceId/attachments
 * Get all attachments for an invoice
 */
router.get(
  "/:invoiceId/attachments",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { invoiceId } = req.params;
      const customerId = req.user!.customerId!;

      // Verify invoice belongs to customer
      const invoice = await prisma.invoices.findFirst({
        where: {
          id: invoiceId,
          customer_id: customerId,
        },
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: "Invoice not found",
        });
      }

      // Get attachments
      const attachments = await prisma.invoice_attachments.findMany({
        where: { invoice_id: invoiceId },
        include: {
          uploader: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { uploaded_at: "desc" },
      });

      // Generate signed URLs for each attachment
      const attachmentsWithUrls = await Promise.all(
        attachments.map(async (att) => {
          const signedUrl = await storageService.getFileUrl(
            att.file_path,
            3600
          );
          return {
            id: att.id,
            fileName: att.file_name,
            fileSize: Number(att.file_size),
            fileSizeFormatted: storageService.formatBytes(
              Number(att.file_size)
            ),
            fileType: att.file_type,
            mimeType: att.mime_type,
            uploadedAt: att.uploaded_at,
            uploadedBy: att.uploader,
            url: signedUrl,
            metadata: att.metadata,
          };
        })
      );

      res.json({
        success: true,
        data: attachmentsWithUrls,
      });
    } catch (error: any) {
      console.error("Error fetching invoice attachments:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);
```

---

### 3. Frontend Implementation

#### A. Enhanced `CreateInvoiceModal` Component

**Key Features**:

- Real-time quota display
- Drag-and-drop file upload
- Multiple file support
- Upload progress indicators
- File preview/removal
- Quota validation before upload

```typescript
// src/modules/developer-dashboard/components/CreateInvoiceModal.tsx

import React, { useState, useEffect } from "react";
import { Upload, X, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { apiClient } from "../../../lib/api-client";

interface AttachmentFile {
  id: string;
  file: File;
  uploadStatus: "pending" | "uploading" | "success" | "error";
  uploadProgress: number;
  uploadedPath?: string;
  error?: string;
}

interface StorageQuota {
  used: number;
  limit: number;
  available: number;
  percentage: number;
  usedFormatted: string;
  limitFormatted: string;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  open,
  onClose,
  onSuccess,
  projectId,
}) => {
  // ... existing state ...

  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch storage quota on mount
  useEffect(() => {
    if (open) {
      fetchQuota();
    }
  }, [open]);

  const fetchQuota = async () => {
    setQuotaLoading(true);
    try {
      const response = await apiClient.get<any>("/api/storage/quota");
      if (response.error) {
        console.error("Failed to fetch quota:", response.error);
        return;
      }
      setQuota(response.data.data);
    } catch (error) {
      console.error("Error fetching quota:", error);
    } finally {
      setQuotaLoading(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: AttachmentFile[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      uploadStatus: "pending",
      uploadProgress: 0,
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const uploadAttachment = async (attachment: AttachmentFile) => {
    // Check quota before upload
    if (quota && attachment.file.size > quota.available) {
      setAttachments((prev) =>
        prev.map((att) =>
          att.id === attachment.id
            ? {
                ...att,
                uploadStatus: "error",
                error: `File size exceeds available storage (${quota.availableFormatted} remaining)`,
              }
            : att
        )
      );
      return;
    }

    setAttachments((prev) =>
      prev.map((att) =>
        att.id === attachment.id ? { ...att, uploadStatus: "uploading" } : att
      )
    );

    try {
      const formData = new FormData();
      formData.append("file", attachment.file);
      formData.append(
        "description",
        `Invoice attachment: ${attachment.file.name}`
      );

      const response = await apiClient.post<any>(
        "/api/storage/upload-invoice-attachment",
        formData
      );

      if (response.error) {
        throw new Error(response.error.message || "Upload failed");
      }

      const result = response.data;

      setAttachments((prev) =>
        prev.map((att) =>
          att.id === attachment.id
            ? {
                ...att,
                uploadStatus: "success",
                uploadProgress: 100,
                uploadedPath: result.data.filePath,
              }
            : att
        )
      );

      // Update quota
      if (result.data.quota) {
        setQuota(result.data.quota);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setAttachments((prev) =>
        prev.map((att) =>
          att.id === attachment.id
            ? {
                ...att,
                uploadStatus: "error",
                error: error.message || "Upload failed",
              }
            : att
        )
      );
    }
  };

  const uploadAllAttachments = async () => {
    const pendingAttachments = attachments.filter(
      (att) => att.uploadStatus === "pending"
    );

    for (const attachment of pendingAttachments) {
      await uploadAttachment(attachment);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Upload all pending attachments first
      await uploadAllAttachments();

      // 2. Check if all uploads succeeded
      const failedUploads = attachments.filter(
        (att) => att.uploadStatus === "error"
      );

      if (failedUploads.length > 0) {
        alert(
          `${failedUploads.length} file(s) failed to upload. Please remove them or try again.`
        );
        setLoading(false);
        return;
      }

      // 3. Create invoice with attachment paths
      const attachmentPaths = attachments
        .filter((att) => att.uploadStatus === "success")
        .map((att) => att.uploadedPath);

      const invoiceData = {
        ...formData,
        projectId: selectedProject,
        attachments: attachmentPaths,
      };

      // TODO: Call invoice creation API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onSuccess();
    } catch (error) {
      console.error("Error creating invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalAttachmentSize = () => {
    return attachments.reduce((total, att) => total + att.file.size, 0);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* ... existing form fields ... */}

        {/* Storage Quota Display */}
        {quota && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">
                Storage Usage
              </span>
              <span className="text-sm text-blue-700">
                {quota.usedFormatted} / {quota.limitFormatted}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  quota.percentage > 90
                    ? "bg-red-500"
                    : quota.percentage > 75
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(quota.percentage, 100)}%` }}
              />
            </div>
            {quota.percentage > 90 && (
              <p className="text-xs text-red-600 mt-2">
                <AlertCircle className="inline w-3 h-3 mr-1" />
                Storage almost full. Consider upgrading your plan.
              </p>
            )}
          </div>
        )}

        {/* Attachments Section */}
        <div className="space-y-2">
          <Label>Attachments (Optional)</Label>

          {/* Drag & Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PDF, PNG, JPG, DOC, XLS up to 50MB per file
            </p>
          </div>

          {/* Attachment List */}
          {attachments.length > 0 && (
            <div className="space-y-2 mt-4">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attachment.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatBytes(attachment.file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {attachment.uploadStatus === "pending" && (
                      <span className="text-xs text-gray-500">Pending</span>
                    )}
                    {attachment.uploadStatus === "uploading" && (
                      <span className="text-xs text-blue-600">
                        Uploading...
                      </span>
                    )}
                    {attachment.uploadStatus === "success" && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {attachment.uploadStatus === "error" && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-gray-600">
                  Total: {formatBytes(getTotalAttachmentSize())}
                </span>
                <span className="text-xs text-gray-500">
                  {attachments.length} file(s)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ... existing action buttons ... */}
      </DialogContent>
    </Dialog>
  );
};
```

---

## 🔐 Security Considerations

### 1. **Access Control**

- ✅ Verify `customerId` ownership before all operations
- ✅ Use `customerOnly` middleware on all storage endpoints
- ✅ Validate invoice ownership before fetching attachments

### 2. **File Validation**

- ✅ Whitelist allowed MIME types (already in `storage.ts`)
- ✅ Enforce max file size (50MB per file)
- ✅ Sanitize file names to prevent path traversal

### 3. **Quota Enforcement**

- ✅ Check quota BEFORE upload (prevent over-allocation)
- ✅ Use database transactions for quota updates
- ✅ Implement quota recalculation endpoint for audits

### 4. **Signed URLs**

- ✅ Generate time-limited signed URLs (1 hour expiry)
- ✅ Never expose raw S3 URLs to frontend
- ✅ Regenerate URLs on each fetch

---

## 📊 User Experience Flow

### **Invoice Creation with Attachments**

```
1. User opens "Create Invoice" modal
   ↓
2. System fetches and displays current storage quota
   ↓
3. User fills invoice details
   ↓
4. User drags/drops or selects files
   ↓
5. System validates file size against available quota
   ↓
6. User clicks "Create Invoice"
   ↓
7. System uploads all attachments sequentially
   ↓
8. System creates invoice with attachment references
   ↓
9. System updates storage quota in real-time
   ↓
10. Success! User sees updated quota and invoice created
```

### **Error Handling**

| Error Scenario    | User Feedback                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Quota exceeded    | "Storage quota exceeded. Available: 50MB. Required: 75MB. Please upgrade your plan or remove files." |
| Invalid file type | "File type not supported. Allowed: PDF, PNG, JPG, DOC, XLS"                                          |
| File too large    | "File exceeds 50MB limit. Please compress or split the file."                                        |
| Upload failed     | "Upload failed: [specific error]. Please try again."                                                 |
| Network error     | "Connection lost. Your files will be uploaded when connection is restored."                          |

---

## 🚀 Implementation Phases

### **Phase 1: Database & Backend** (Day 1)

- [ ] Create migration `add_invoice_attachments.sql`
- [ ] Update Prisma schema
- [ ] Run migration and regenerate Prisma client
- [ ] Add storage endpoints for invoice attachments
- [ ] Test endpoints with Postman/curl

### **Phase 2: Frontend Integration** (Day 2)

- [ ] Update `CreateInvoiceModal` with file upload UI
- [ ] Implement drag-and-drop functionality
- [ ] Add quota display and validation
- [ ] Implement upload progress indicators
- [ ] Add error handling and user feedback

### **Phase 3: Invoice Display** (Day 3)

- [ ] Add attachments section to invoice detail view
- [ ] Implement attachment download/preview
- [ ] Add attachment deletion for draft invoices
- [ ] Test end-to-end flow

### **Phase 4: Testing & Polish** (Day 4)

- [ ] Test quota enforcement edge cases
- [ ] Test multi-file uploads
- [ ] Test error scenarios (network failures, quota exceeded)
- [ ] Performance testing with large files
- [ ] UI/UX polish and accessibility

---

## 📈 Scalability & Performance

### **Optimization Strategies**

1. **Parallel Uploads**: Upload multiple files concurrently (max 3 at a time)
2. **Chunked Uploads**: For files > 10MB, use multipart upload
3. **Client-side Compression**: Compress images before upload
4. **CDN Caching**: Serve frequently accessed files via CDN
5. **Lazy Loading**: Load attachments only when invoice detail is viewed
6. **Thumbnail Generation**: Generate thumbnails for image attachments

### **Monitoring**

- Track average upload time per file size
- Monitor quota usage trends per customer
- Alert when customers exceed 90% quota
- Track failed uploads and reasons

---

## 🧪 Testing Strategy

### **Unit Tests**

```typescript
describe("Invoice Attachment Upload", () => {
  it("should reject upload when quota exceeded", async () => {
    // Mock customer with 100MB used, 100MB limit
    // Attempt to upload 1MB file
    // Expect 413 Payload Too Large
  });

  it("should update quota after successful upload", async () => {
    // Upload 5MB file
    // Verify quota increased by 5MB
  });

  it("should rollback quota on upload failure", async () => {
    // Mock S3 upload failure
    // Verify quota unchanged
  });
});
```

### **Integration Tests**

- Test full invoice creation flow with attachments
- Test attachment deletion and quota recalculation
- Test concurrent uploads from same customer
- Test cross-customer isolation

### **Load Tests**

- 100 concurrent uploads from different customers
- Large file uploads (50MB)
- Quota enforcement under high load

---

## 📝 API Response Examples

### **Success Response**

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "fileId": "abc123",
    "filePath": "customers/cust-456/invoices/inv-789/receipt.pdf",
    "fileName": "receipt.pdf",
    "fileSize": 524288,
    "fileUrl": "https://contrezz-uploads.nyc3.digitaloceanspaces.com/...",
    "cdnUrl": "https://cdn.contrezz.com/...",
    "attachmentId": "att-xyz",
    "quota": {
      "used": 10485760,
      "limit": 5368709120,
      "available": 5358223360,
      "percentage": 0.2,
      "usedFormatted": "10 MB",
      "limitFormatted": "5 GB"
    }
  }
}
```

### **Quota Exceeded Response**

```json
{
  "success": false,
  "error": "Storage quota exceeded",
  "quota": {
    "used": 5368709120,
    "limit": 5368709120,
    "available": 0,
    "usedFormatted": "5 GB",
    "limitFormatted": "5 GB"
  }
}
```

---

## ✅ Checklist for Implementation

- [ ] Database migration created and tested
- [ ] Prisma schema updated and client regenerated
- [ ] Backend endpoints implemented and tested
- [ ] Frontend upload UI implemented
- [ ] Quota validation working correctly
- [ ] Error handling comprehensive
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Performance testing completed
- [ ] User acceptance testing completed

---

## 🎓 Best Practices Applied

✅ **Single Responsibility**: Each endpoint has one clear purpose  
✅ **DRY Principle**: Reuse existing `storageService` methods  
✅ **Error Handling**: Comprehensive try-catch with specific error messages  
✅ **Security First**: Validate ownership, file types, and quotas  
✅ **User Feedback**: Real-time quota updates and upload progress  
✅ **Scalability**: Designed for multi-tenant SaaS with data isolation  
✅ **Audit Trail**: Track all file operations with metadata  
✅ **Type Safety**: Full TypeScript types for all data structures

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-18  
**Author**: AI Software Architect  
**Status**: Ready for Implementation
