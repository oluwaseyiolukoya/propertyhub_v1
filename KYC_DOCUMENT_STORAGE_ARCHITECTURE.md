# KYC Document Storage Architecture

## Overview

The KYC verification system uses a **secure, encrypted, cloud-based storage architecture** for customer identity documents. This document explains how documents are uploaded, stored, processed, and accessed.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  KYCVerificationPage.tsx                               │     │
│  │  - User selects document type (NIN, Passport, etc.)    │     │
│  │  - User uploads file (PDF, JPG, PNG)                   │     │
│  │  - User enters document number (if applicable)         │     │
│  │  - Form validation and preview                         │     │
│  └────────────────────────────────────────────────────────┘     │
│                            │                                     │
│                            │ POST /api/verification/kyc/submit   │
│                            │ (multipart/form-data)               │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MAIN BACKEND (Express)                        │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  backend/src/routes/verification.ts                    │     │
│  │  - Receives multipart form data                        │     │
│  │  - Validates user authentication                       │     │
│  │  - Proxies request to verification microservice        │     │
│  └────────────────────────────────────────────────────────┘     │
│                            │                                     │
│                            │ POST /api/verification/submit       │
│                            │ (with API key authentication)       │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              VERIFICATION MICROSERVICE (Express)                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  verification-service/src/routes/verification.ts       │     │
│  │  - Validates API key                                   │     │
│  │  - Validates file type (PDF, JPG, PNG)                 │     │
│  │  - Validates file size (max 10MB)                      │     │
│  │  - Validates document type                             │     │
│  │  - Calls VerificationService.uploadDocument()          │     │
│  └────────────────────────────────────────────────────────┘     │
│                            │                                     │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  verification-service/src/services/                    │     │
│  │  verification.service.ts                               │     │
│  │                                                         │     │
│  │  1. Create/retrieve verification_request record        │     │
│  │  2. Validate document type not already uploaded        │     │
│  │  3. Generate unique S3 key:                            │     │
│  │     verification/{requestId}/{docType}/{timestamp}-    │     │
│  │     {filename}                                          │     │
│  │  4. Upload to DigitalOcean Spaces (S3-compatible)      │     │
│  │  5. Encrypt document number (AES-256-GCM)              │     │
│  │  6. Save document record to database                   │     │
│  │  7. Add verification job to Redis queue                │     │
│  └────────────────────────────────────────────────────────┘     │
│                            │                                     │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  AWS SDK S3 Client (DigitalOcean Spaces)               │     │
│  │  - Endpoint: nyc3.digitaloceanspaces.com               │     │
│  │  - Bucket: contrezz-verification-docs                  │     │
│  │  - Server-side encryption: AES256                      │     │
│  │  - Access: Private (pre-signed URLs for viewing)       │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DIGITALOCEAN SPACES (S3)                       │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Bucket: contrezz-verification-docs                    │     │
│  │  Region: nyc3                                          │     │
│  │                                                         │     │
│  │  File Structure:                                       │     │
│  │  verification/                                         │     │
│  │  ├── {requestId-1}/                                    │     │
│  │  │   ├── nin/                                          │     │
│  │  │   │   └── 1732567890123-nin-card.pdf               │     │
│  │  │   ├── passport/                                     │     │
│  │  │   │   └── 1732567891234-passport-datapage.jpg      │     │
│  │  │   └── utility_bill/                                 │     │
│  │  │       └── 1732567892345-electricity-bill.pdf       │     │
│  │  ├── {requestId-2}/                                    │     │
│  │  │   └── ...                                           │     │
│  │                                                         │     │
│  │  Security:                                             │     │
│  │  - Private bucket (no public access)                   │     │
│  │  - Server-side encryption (AES-256)                    │     │
│  │  - Access via pre-signed URLs (time-limited)           │     │
│  │  - CORS configured for frontend domain                 │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  VERIFICATION DATABASE (PostgreSQL)             │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  verification_requests                                 │     │
│  │  - id (UUID)                                           │     │
│  │  - customerId (from main DB)                           │     │
│  │  - customerType                                        │     │
│  │  - status (pending, in_progress, verified, etc.)       │     │
│  │  - createdAt, updatedAt                                │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  verification_documents                                │     │
│  │  - id (UUID)                                           │     │
│  │  - requestId (FK to verification_requests)             │     │
│  │  - documentType (nin, passport, drivers_license, etc.) │     │
│  │  - documentNumber (ENCRYPTED with AES-256-GCM)         │     │
│  │  - fileUrl (S3 URL)                                    │     │
│  │  - fileName, fileSize, mimeType                        │     │
│  │  - status (pending, verified, rejected)                │     │
│  │  - verificationData (JSON - results from Dojah)        │     │
│  │  - createdAt, updatedAt                                │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REDIS QUEUE (BullMQ)                       │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  verification-queue                                    │     │
│  │  - Job: { documentId, priority, attempts }             │     │
│  │  - Worker processes jobs asynchronously                │     │
│  │  - Retry logic: 3 attempts with exponential backoff    │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   VERIFICATION WORKER                            │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  verification-service/src/workers/                     │     │
│  │  verification.worker.ts                                │     │
│  │                                                         │     │
│  │  1. Fetch document from database                       │     │
│  │  2. Decrypt document number                            │     │
│  │  3. Call Dojah API for verification:                   │     │
│  │     - NIN verification                                  │     │
│  │     - Passport verification                             │     │
│  │     - Driver's license verification                     │     │
│  │     - Document analysis (OCR + face match)             │     │
│  │  4. Calculate confidence score                         │     │
│  │  5. Update document status (verified/rejected)         │     │
│  │  6. Update request status                              │     │
│  │  7. Notify main dashboard                              │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Storage Flow (Step-by-Step)

### 1. **User Uploads Document (Frontend)**

```typescript
// src/components/KYCVerificationPage.tsx
const handleDocumentUpload = async (
  documentType: string,
  file: File,
  documentNumber?: string
) => {
  const formData = new FormData();
  formData.append("customerId", customerId);
  formData.append("customerType", "developer"); // or property_owner, etc.
  formData.append("documentType", documentType); // 'nin', 'passport', etc.
  formData.append("file", file);
  if (documentNumber) {
    formData.append("documentNumber", documentNumber);
  }

  // Send to main backend
  const response = await submitKycVerification(formData);
};
```

**Supported Document Types:**

- `nin` - National Identity Number (Nigeria)
- `passport` - International Passport
- `drivers_license` - Driver's License
- `voters_card` - Voter's Card
- `utility_bill` - Utility Bill (proof of address)
- `proof_of_address` - Other proof of address

**File Restrictions:**

- **Max size:** 10MB
- **Allowed formats:** PDF, JPG, JPEG, PNG
- **Validation:** Client-side and server-side

---

### 2. **Main Backend Proxies Request**

```typescript
// backend/src/routes/verification.ts
router.post(
  "/kyc/submit",
  authMiddleware,
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const user = await prisma.users.findUnique({ where: { id: userId } });

      // Forward to verification microservice
      const formData = new FormData();
      formData.append("customerId", user.customerId);
      formData.append("customerType", req.body.customerType);
      formData.append("documentType", req.body.documentType);
      formData.append("file", req.file.buffer, req.file.originalname);
      if (req.body.documentNumber) {
        formData.append("documentNumber", req.body.documentNumber);
      }

      const response = await fetch(
        `${VERIFICATION_SERVICE_URL}/api/verification/submit`,
        {
          method: "POST",
          headers: {
            "x-api-key": VERIFICATION_API_KEY,
          },
          body: formData,
        }
      );

      res.json(await response.json());
    } catch (error) {
      res.status(500).json({ error: "Failed to submit verification" });
    }
  }
);
```

---

### 3. **Verification Service Uploads to S3**

```typescript
// verification-service/src/services/verification.service.ts
async uploadDocument(requestId, file, documentType, documentNumber, metadata) {
  // 1. Validate request
  const request = await prisma.verification_requests.findUnique({ where: { id: requestId } });

  // 2. Generate unique S3 key
  const fileKey = `verification/${requestId}/${documentType}/${Date.now()}-${file.originalname}`;

  // 3. Upload to DigitalOcean Spaces (S3-compatible)
  const uploadCommand = new PutObjectCommand({
    Bucket: config.spaces.bucket, // 'contrezz-verification-docs'
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
    ServerSideEncryption: 'AES256', // Encrypt at rest
  });

  await this.s3Client.send(uploadCommand);

  // 4. Construct file URL
  const fileUrl = `https://${config.spaces.bucket}.${config.spaces.region}.digitaloceanspaces.com/${fileKey}`;

  // 5. Encrypt document number (if provided)
  const encryptedNumber = documentNumber ? encrypt(documentNumber) : null;

  // 6. Save document record to database
  const document = await prisma.verification_documents.create({
    data: {
      requestId,
      documentType,
      documentNumber: encryptedNumber, // ENCRYPTED
      fileUrl, // S3 URL
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      status: 'pending',
      verificationData: metadata || {},
    },
  });

  // 7. Add to verification queue
  await queueService.addVerificationJob(document.id, 5);

  return document;
}
```

---

### 4. **Document Number Encryption**

```typescript
// verification-service/src/lib/encryption.ts
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex"); // 64-char hex string

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Return: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
```

**Why Encrypt Document Numbers?**

- NIN, passport numbers, driver's license numbers are **Personally Identifiable Information (PII)**
- Database breach would not expose raw document numbers
- Only the verification service can decrypt (has the key)
- Complies with data protection regulations (GDPR, NDPR)

---

### 5. **File Storage Structure in S3**

```
contrezz-verification-docs/
└── verification/
    ├── req-abc123-def456/
    │   ├── nin/
    │   │   └── 1732567890123-nin-card.pdf
    │   ├── passport/
    │   │   └── 1732567891234-passport-datapage.jpg
    │   └── utility_bill/
    │       └── 1732567892345-electricity-bill.pdf
    ├── req-xyz789-uvw012/
    │   ├── drivers_license/
    │   │   └── 1732567893456-drivers-license.jpg
    │   └── proof_of_address/
    │       └── 1732567894567-bank-statement.pdf
    └── ...
```

**File Naming Convention:**

- `verification/{requestId}/{documentType}/{timestamp}-{originalFilename}`
- **Example:** `verification/req-abc123/nin/1732567890123-nin-card.pdf`

**Benefits:**

- Easy to locate documents by request ID
- Organized by document type
- Timestamp prevents filename collisions
- Original filename preserved for auditing

---

### 6. **Database Records**

#### `verification_requests` Table

| Field          | Type     | Description                                                        |
| -------------- | -------- | ------------------------------------------------------------------ |
| `id`           | UUID     | Primary key                                                        |
| `customerId`   | String   | Customer ID from main DB                                           |
| `customerType` | String   | 'developer', 'property_owner', etc.                                |
| `status`       | String   | 'pending', 'in_progress', 'verified', 'pending_review', 'rejected' |
| `ipAddress`    | String   | Request IP (for audit)                                             |
| `userAgent`    | String   | Request user agent (for audit)                                     |
| `createdAt`    | DateTime | Request creation time                                              |
| `updatedAt`    | DateTime | Last update time                                                   |

#### `verification_documents` Table

| Field              | Type     | Description                                                     |
| ------------------ | -------- | --------------------------------------------------------------- |
| `id`               | UUID     | Primary key                                                     |
| `requestId`        | UUID     | FK to verification_requests                                     |
| `documentType`     | String   | 'nin', 'passport', 'drivers_license', etc.                      |
| `documentNumber`   | String   | **ENCRYPTED** document number                                   |
| `fileUrl`          | String   | S3 URL (e.g., `https://bucket.nyc3.digitaloceanspaces.com/...`) |
| `fileName`         | String   | Original filename                                               |
| `fileSize`         | Int      | File size in bytes                                              |
| `mimeType`         | String   | MIME type (e.g., 'application/pdf')                             |
| `status`           | String   | 'pending', 'verified', 'rejected'                               |
| `verificationData` | JSON     | Results from Dojah API                                          |
| `createdAt`        | DateTime | Upload time                                                     |
| `updatedAt`        | DateTime | Last update time                                                |

---

### 7. **Verification Worker Processing**

```typescript
// verification-service/src/workers/verification.worker.ts
async function processVerification(documentId: string) {
  // 1. Fetch document
  const document = await prisma.verification_documents.findUnique({
    where: { id: documentId },
    include: { request: true },
  });

  // 2. Decrypt document number
  const documentNumber = document.documentNumber
    ? decrypt(document.documentNumber)
    : null;

  // 3. Call Dojah API based on document type
  let verificationResult;

  switch (document.documentType) {
    case "nin":
      verificationResult = await dojahProvider.verifyNIN(documentNumber);
      break;
    case "passport":
      verificationResult = await dojahProvider.verifyPassport(documentNumber);
      break;
    case "drivers_license":
      verificationResult = await dojahProvider.verifyDriversLicense(
        documentNumber
      );
      break;
    // ... other types
  }

  // 4. Update document status
  await prisma.verification_documents.update({
    where: { id: documentId },
    data: {
      status: verificationResult.verified ? "verified" : "rejected",
      verificationData: verificationResult.data,
    },
  });

  // 5. Check if all documents verified
  const allDocuments = await prisma.verification_documents.findMany({
    where: { requestId: document.requestId },
  });

  const allVerified = allDocuments.every((doc) => doc.status === "verified");

  if (allVerified) {
    // Update request status
    await prisma.verification_requests.update({
      where: { id: document.requestId },
      data: { status: "verified" },
    });

    // Notify main dashboard
    await notificationService.notifyMainDashboard(document.request.customerId, {
      type: "verification_complete",
      status: "verified",
    });
  }
}
```

---

## Security Features

### 1. **Server-Side Encryption (SSE)**

- All files encrypted at rest using AES-256
- Managed by DigitalOcean Spaces
- No additional key management required

### 2. **Document Number Encryption**

- AES-256-GCM encryption for document numbers
- Encryption key stored in environment variable (not in database)
- Only verification service can decrypt

### 3. **Private Bucket**

- Bucket is private (no public access)
- Files accessed via pre-signed URLs (time-limited)
- CORS configured for frontend domain only

### 4. **API Key Authentication**

- Main backend → Verification service: API key required
- Prevents unauthorized access to verification endpoints

### 5. **Audit Trail**

- `verification_history` table logs all actions
- IP address and user agent tracked
- Immutable audit log

### 6. **Rate Limiting**

- Max 10 requests per minute per IP
- Prevents abuse and DDoS attacks

---

## Access Control

### Who Can Access Documents?

1. **Customer (Owner):**

   - Can upload documents for their own verification
   - Can view their own document status
   - **Cannot** download original files (privacy)

2. **Admin (Manual Review):**

   - Can view document metadata
   - Can generate pre-signed URLs to view documents (time-limited)
   - Can approve/reject verification requests
   - Actions logged in audit trail

3. **Verification Worker:**

   - Can read documents for automated verification
   - Can update document status
   - Cannot delete documents

4. **System:**
   - Automated cleanup of expired pre-signed URLs
   - Retention policy: Documents deleted after 7 years (compliance)

---

## Document Lifecycle

```
1. UPLOAD
   ↓
2. PENDING (in queue)
   ↓
3. IN_PROGRESS (worker processing)
   ↓
4. VERIFIED / REJECTED
   ↓
5. ARCHIVED (after 90 days)
   ↓
6. DELETED (after 7 years)
```

---

## Cost Estimation (DigitalOcean Spaces)

**Pricing:**

- Storage: $5/month for 250GB
- Bandwidth: $0.01/GB after 1TB free

**Estimated Usage:**

- Average document size: 2MB
- 1000 customers × 3 documents = 3000 documents
- Total storage: 3000 × 2MB = 6GB
- **Monthly cost:** ~$5 (well within free tier)

---

## Backup and Disaster Recovery

### Backup Strategy

1. **Database Backups:**

   - Automated daily backups (DigitalOcean managed)
   - Point-in-time recovery (7 days)

2. **S3 Backups:**

   - Cross-region replication (optional)
   - Versioning enabled (recover deleted files)

3. **Encryption Key Backup:**
   - Store `ENCRYPTION_KEY` in secure vault (e.g., 1Password, AWS Secrets Manager)
   - **Never** commit to git

### Disaster Recovery Plan

1. **Database Failure:**

   - Restore from latest backup
   - Replay transaction logs (if available)

2. **S3 Bucket Deletion:**

   - Restore from cross-region replica
   - Re-upload from backup if no replica

3. **Encryption Key Loss:**
   - **CRITICAL:** Document numbers become unrecoverable
   - Prevention: Store key in multiple secure locations

---

## Compliance and Data Protection

### GDPR / NDPR Compliance

1. **Right to Access:**

   - Customers can request their document metadata
   - Pre-signed URLs provided for viewing

2. **Right to Erasure:**

   - Customers can request document deletion
   - Soft delete (mark as deleted, actual deletion after 30 days)

3. **Data Minimization:**

   - Only collect necessary documents
   - Encrypt sensitive data (document numbers)

4. **Purpose Limitation:**

   - Documents used only for identity verification
   - Not shared with third parties (except Dojah for verification)

5. **Storage Limitation:**
   - Documents deleted after 7 years (or sooner if customer requests)

---

## Monitoring and Logging

### Metrics to Track

1. **Upload Success Rate:**

   - Target: >99%
   - Alert if <95%

2. **Verification Processing Time:**

   - Target: <5 minutes
   - Alert if >10 minutes

3. **Storage Usage:**

   - Monitor bucket size
   - Alert if approaching quota

4. **API Errors:**
   - Track 4xx/5xx errors
   - Alert on spike

### Logging

```typescript
// Example log entry
{
  timestamp: '2024-11-25T10:30:00Z',
  level: 'info',
  service: 'verification-service',
  action: 'document_uploaded',
  requestId: 'req-abc123',
  documentId: 'doc-xyz789',
  documentType: 'nin',
  fileSize: 2048576,
  customerId: 'cust-456',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
}
```

---

## Summary

### Key Points

1. **Storage:** DigitalOcean Spaces (S3-compatible)
2. **Encryption:** AES-256 at rest, document numbers encrypted in database
3. **Access:** Private bucket, pre-signed URLs for viewing
4. **Processing:** Asynchronous via Redis queue
5. **Verification:** Dojah API for automated checks
6. **Compliance:** GDPR/NDPR compliant, audit trail, retention policy

### Files Involved

- **Frontend:** `src/components/KYCVerificationPage.tsx`
- **Main Backend:** `backend/src/routes/verification.ts`
- **Microservice:** `verification-service/src/services/verification.service.ts`
- **Worker:** `verification-service/src/workers/verification.worker.ts`
- **Encryption:** `verification-service/src/lib/encryption.ts`

### Environment Variables Required

```bash
# Verification Service
SPACES_ACCESS_KEY_ID=<your_key>
SPACES_SECRET_ACCESS_KEY=<your_secret>
SPACES_REGION=nyc3
SPACES_BUCKET=contrezz-verification-docs
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
ENCRYPTION_KEY=<64_char_hex_string>

# Main Backend
VERIFICATION_SERVICE_URL=http://localhost:5001
VERIFICATION_API_KEY=<same_as_microservice>
```

---

**Last Updated:** November 25, 2024  
**Status:** PRODUCTION READY  
**Maintained By:** Contrezz Engineering Team
