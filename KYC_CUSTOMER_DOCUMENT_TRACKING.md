# How We Track Which Customer Uploaded Which Document

## Overview

The system uses a **multi-layered tracking approach** to ensure every document is linked to the correct customer through database relationships, authentication tokens, and audit trails.

---

## Complete Tracking Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. USER AUTHENTICATION                        │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  User logs in with email/password                      │     │
│  │  Backend generates JWT token containing:               │     │
│  │  - userId (from users table)                           │     │
│  │  - customerId (from users.customerId)                  │     │
│  │  - role (developer, property_owner, etc.)              │     │
│  │                                                         │     │
│  │  Token stored in localStorage: 'auth_token'            │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              2. FRONTEND SENDS DOCUMENT UPLOAD REQUEST           │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  KYCVerificationPage.tsx                               │     │
│  │                                                         │     │
│  │  const formData = new FormData();                      │     │
│  │  formData.append('file', selectedFile);                │     │
│  │  formData.append('documentType', 'nin');               │     │
│  │  formData.append('documentNumber', '12345678901');     │     │
│  │                                                         │     │
│  │  // NO customerId in request body!                     │     │
│  │  // customerId extracted from JWT token on backend     │     │
│  │                                                         │     │
│  │  Headers:                                              │     │
│  │  Authorization: Bearer <JWT_TOKEN>                     │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         3. MAIN BACKEND EXTRACTS CUSTOMER FROM JWT TOKEN         │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  backend/src/routes/verification.ts                    │     │
│  │                                                         │     │
│  │  router.post('/kyc/submit',                            │     │
│  │    authMiddleware,  // ← Validates JWT & extracts user│     │
│  │    async (req: AuthRequest, res: Response) => {        │     │
│  │                                                         │     │
│  │    // Extract customerId from authenticated user       │     │
│  │    const customerId = req.user?.customerId; // ← HERE! │     │
│  │    const userRole = req.user?.role;                    │     │
│  │                                                         │     │
│  │    if (!customerId) {                                  │     │
│  │      return res.status(400).json({                     │     │
│  │        error: 'Customer ID not found'                  │     │
│  │      });                                               │     │
│  │    }                                                   │     │
│  │                                                         │     │
│  │    // Determine customer type from role               │     │
│  │    let customerType = 'property_owner';                │     │
│  │    if (userRole === 'developer') {                     │     │
│  │      customerType = 'developer';                       │     │
│  │    }                                                   │     │
│  │                                                         │     │
│  │    // Forward to verification microservice             │     │
│  │    const result = await verificationClient             │     │
│  │      .submitVerification(                              │     │
│  │        customerId,      // ← From JWT token            │     │
│  │        customerType,    // ← From user role            │     │
│  │        req.ip,          // ← Request IP (audit)        │     │
│  │        req.headers['user-agent'] // ← User agent       │     │
│  │      );                                                │     │
│  │  });                                                   │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│      4. VERIFICATION SERVICE CREATES REQUEST WITH CUSTOMER ID    │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  verification-service/src/services/                    │     │
│  │  verification.service.ts                               │     │
│  │                                                         │     │
│  │  async createRequest(                                  │     │
│  │    customerId: string,  // ← From main backend         │     │
│  │    customerType: string,                               │     │
│  │    ipAddress?: string,                                 │     │
│  │    userAgent?: string                                  │     │
│  │  ) {                                                   │     │
│  │    // Create verification request                      │     │
│  │    const request = await prisma                        │     │
│  │      .verification_requests.create({                   │     │
│  │        data: {                                         │     │
│  │          customerId,    // ← STORED IN DATABASE        │     │
│  │          customerType,                                 │     │
│  │          status: 'pending',                            │     │
│  │          ipAddress,     // ← For audit trail           │     │
│  │          userAgent,     // ← For audit trail           │     │
│  │        },                                              │     │
│  │      });                                               │     │
│  │                                                         │     │
│  │    // Log in history                                   │     │
│  │    await prisma.verification_history.create({          │     │
│  │      data: {                                           │     │
│  │        requestId: request.id,                          │     │
│  │        action: 'request_created',                      │     │
│  │        performedBy: customerId, // ← Who did this      │     │
│  │        details: {                                      │     │
│  │          customerType,                                 │     │
│  │          ipAddress,                                    │     │
│  │        },                                              │     │
│  │      },                                                │     │
│  │    });                                                 │     │
│  │                                                         │     │
│  │    return request;                                     │     │
│  │  }                                                     │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         5. DOCUMENT UPLOADED AND LINKED TO REQUEST               │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  verification-service/src/services/                    │     │
│  │  verification.service.ts                               │     │
│  │                                                         │     │
│  │  async uploadDocument(                                 │     │
│  │    requestId: string,  // ← Links to request           │     │
│  │    file: Express.Multer.File,                          │     │
│  │    documentType: string,                               │     │
│  │    documentNumber?: string                             │     │
│  │  ) {                                                   │     │
│  │    // 1. Validate request exists                       │     │
│  │    const request = await prisma                        │     │
│  │      .verification_requests.findUnique({               │     │
│  │        where: { id: requestId }                        │     │
│  │      });                                               │     │
│  │                                                         │     │
│  │    // 2. Upload to S3 with customer-specific path      │     │
│  │    const fileKey = `verification/${requestId}/         │     │
│  │      ${documentType}/${Date.now()}-                    │     │
│  │      ${file.originalname}`;                            │     │
│  │                                                         │     │
│  │    await this.s3Client.send(uploadCommand);            │     │
│  │                                                         │     │
│  │    // 3. Create document record                        │     │
│  │    const document = await prisma                       │     │
│  │      .verification_documents.create({                  │     │
│  │        data: {                                         │     │
│  │          requestId,  // ← Links to request             │     │
│  │          documentType,                                 │     │
│  │          documentNumber: encrypt(documentNumber),      │     │
│  │          fileUrl,                                      │     │
│  │          fileName: file.originalname,                  │     │
│  │          fileSize: file.size,                          │     │
│  │          status: 'pending',                            │     │
│  │        },                                              │     │
│  │      });                                               │     │
│  │                                                         │     │
│  │    // 4. Log in history                                │     │
│  │    await prisma.verification_history.create({          │     │
│  │      data: {                                           │     │
│  │        requestId,                                      │     │
│  │        action: 'document_uploaded',                    │     │
│  │        performedBy: request.customerId, // ← From req  │     │
│  │        details: {                                      │     │
│  │          documentId: document.id,                      │     │
│  │          documentType,                                 │     │
│  │          fileName: file.originalname,                  │     │
│  │        },                                              │     │
│  │      },                                                │     │
│  │    });                                                 │     │
│  │                                                         │     │
│  │    return document;                                    │     │
│  │  }                                                     │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Relationships

### **Table Structure:**

```sql
-- Main Database (backend)
customers
├── id (UUID) ← PRIMARY KEY
├── email
├── company
├── kycStatus
└── kycVerificationId ← References verification_requests.id

users
├── id (UUID) ← PRIMARY KEY
├── email
├── customerId ← FOREIGN KEY to customers.id
└── role

-- Verification Database (verification-service)
verification_requests
├── id (UUID) ← PRIMARY KEY
├── customerId ← NO FK (microservice independence), but stores customer.id
├── customerType
├── status
├── ipAddress (audit)
└── userAgent (audit)

verification_documents
├── id (UUID) ← PRIMARY KEY
├── requestId ← FOREIGN KEY to verification_requests.id
├── documentType
├── documentNumber (encrypted)
├── fileUrl (S3 URL)
└── status

verification_history
├── id (UUID) ← PRIMARY KEY
├── requestId ← FOREIGN KEY to verification_requests.id
├── action
├── performedBy ← customerId or adminId
└── details (JSON)
```

### **Relationship Chain:**

```
Customer → Request → Document

customers.id
    ↓
verification_requests.customerId
    ↓
verification_documents.requestId
    ↓
S3 File: verification/{requestId}/{documentType}/{timestamp}-{filename}
```

---

## How We Query Documents by Customer

### **1. Get All Documents for a Customer**

```typescript
// In verification microservice
async getCustomerDocuments(customerId: string) {
  // Step 1: Find all requests for this customer
  const requests = await prisma.verification_requests.findMany({
    where: { customerId },
    include: {
      documents: true, // Include all documents
      history: true,   // Include audit trail
    },
    orderBy: { submittedAt: 'desc' },
  });

  return requests;
}
```

**SQL Equivalent:**

```sql
-- Find all documents for customer 'cust-123'
SELECT 
  vr.id AS request_id,
  vr.customerId,
  vr.customerType,
  vr.status AS request_status,
  vd.id AS document_id,
  vd.documentType,
  vd.fileName,
  vd.fileUrl,
  vd.status AS document_status,
  vd.createdAt
FROM verification_requests vr
LEFT JOIN verification_documents vd ON vd.requestId = vr.id
WHERE vr.customerId = 'cust-123'
ORDER BY vr.submittedAt DESC;
```

### **2. Get Specific Document**

```typescript
// Verify customer owns this document before allowing access
async getDocument(documentId: string, customerId: string) {
  const document = await prisma.verification_documents.findUnique({
    where: { id: documentId },
    include: {
      request: true, // Include parent request
    },
  });

  // Security check: Verify customer owns this document
  if (document.request.customerId !== customerId) {
    throw new Error('Unauthorized: Document does not belong to this customer');
  }

  return document;
}
```

### **3. Admin View: All Documents with Customer Info**

```typescript
// In admin routes
async getAllVerificationRequests(filters: any) {
  const requests = await prisma.verification_requests.findMany({
    where: {
      status: filters.status,
      customerType: filters.customerType,
    },
    include: {
      documents: {
        select: {
          id: true,
          documentType: true,
          fileName: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });

  // For each request, fetch customer details from main DB
  const enrichedRequests = await Promise.all(
    requests.map(async (request) => {
      const customer = await mainDbPrisma.customers.findUnique({
        where: { id: request.customerId },
        select: {
          id: true,
          company: true,
          email: true,
          owner: true,
        },
      });

      return {
        ...request,
        customer, // Add customer details
      };
    })
  );

  return enrichedRequests;
}
```

---

## Security: How We Prevent Unauthorized Access

### **1. JWT Token Validation**

```typescript
// backend/src/middleware/auth.ts
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Fetch user from database
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request (including customerId)
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customerId, // ← THIS IS KEY!
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### **2. Customer Ownership Validation**

```typescript
// Verify customer can only access their own documents
router.get('/documents/:documentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { documentId } = req.params;
  const customerId = req.user?.customerId; // From JWT

  // Fetch document with request
  const document = await verificationClient.getDocument(documentId);

  // Security check
  if (document.request.customerId !== customerId) {
    return res.status(403).json({ 
      error: 'Forbidden: You do not have access to this document' 
    });
  }

  res.json(document);
});
```

### **3. Admin Override (Manual Review)**

```typescript
// Admin can access any document (with audit logging)
router.get('/admin/documents/:documentId', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { documentId } = req.params;
  const adminId = req.user?.id;

  const document = await verificationClient.getDocument(documentId);

  // Log admin access
  await prisma.verification_history.create({
    data: {
      requestId: document.requestId,
      action: 'admin_viewed_document',
      performedBy: adminId,
      details: {
        documentId,
        adminEmail: req.user?.email,
      },
    },
  });

  res.json(document);
});
```

---

## Audit Trail: Complete History

Every action is logged in `verification_history`:

```typescript
// Example: Complete audit trail for a customer
const history = await prisma.verification_history.findMany({
  where: {
    request: {
      customerId: 'cust-123',
    },
  },
  orderBy: { createdAt: 'asc' },
});

// Output:
[
  {
    action: 'request_created',
    performedBy: 'cust-123',
    createdAt: '2024-11-25T10:00:00Z',
    details: { customerType: 'developer', ipAddress: '192.168.1.1' }
  },
  {
    action: 'document_uploaded',
    performedBy: 'cust-123',
    createdAt: '2024-11-25T10:05:00Z',
    details: { documentType: 'nin', fileName: 'nin-card.pdf' }
  },
  {
    action: 'document_uploaded',
    performedBy: 'cust-123',
    createdAt: '2024-11-25T10:10:00Z',
    details: { documentType: 'passport', fileName: 'passport.jpg' }
  },
  {
    action: 'verification_started',
    performedBy: 'system',
    createdAt: '2024-11-25T10:15:00Z',
    details: { provider: 'dojah' }
  },
  {
    action: 'document_verified',
    performedBy: 'system',
    createdAt: '2024-11-25T10:20:00Z',
    details: { documentType: 'nin', confidence: 95.5 }
  },
  {
    action: 'admin_viewed_document',
    performedBy: 'admin-456',
    createdAt: '2024-11-25T10:25:00Z',
    details: { adminEmail: 'admin@contrezz.com' }
  },
  {
    action: 'request_approved',
    performedBy: 'admin-456',
    createdAt: '2024-11-25T10:30:00Z',
    details: { reason: 'All documents verified' }
  }
]
```

---

## Example Queries

### **Query 1: Get All Documents for Logged-In Customer**

```typescript
// Frontend calls: GET /api/verification/kyc/status
// Backend extracts customerId from JWT token

const customerId = req.user?.customerId; // From JWT

const verification = await prisma.verification_requests.findFirst({
  where: { customerId },
  include: {
    documents: {
      select: {
        id: true,
        documentType: true,
        fileName: true,
        status: true,
        createdAt: true,
        // Don't expose fileUrl or documentNumber to frontend
      },
    },
  },
  orderBy: { submittedAt: 'desc' },
});
```

### **Query 2: Admin Search by Customer Email**

```typescript
// Admin searches for customer by email
const customerEmail = 'john@example.com';

// Step 1: Find customer in main DB
const customer = await mainDbPrisma.customers.findUnique({
  where: { email: customerEmail },
});

// Step 2: Find verification requests in verification DB
const requests = await verificationPrisma.verification_requests.findMany({
  where: { customerId: customer.id },
  include: {
    documents: true,
    history: true,
  },
});
```

### **Query 3: Get Document with Full Customer Context**

```typescript
// Given documentId, get full context
const document = await prisma.verification_documents.findUnique({
  where: { id: 'doc-789' },
  include: {
    request: true, // Get parent request
  },
});

// Fetch customer details from main DB
const customer = await mainDbPrisma.customers.findUnique({
  where: { id: document.request.customerId },
  select: {
    id: true,
    company: true,
    email: true,
    owner: true,
    kycStatus: true,
  },
});

// Full context
const fullContext = {
  document: {
    id: document.id,
    type: document.documentType,
    fileName: document.fileName,
    status: document.status,
  },
  request: {
    id: document.request.id,
    status: document.request.status,
    submittedAt: document.request.submittedAt,
  },
  customer: {
    id: customer.id,
    company: customer.company,
    email: customer.email,
    owner: customer.owner,
    kycStatus: customer.kycStatus,
  },
};
```

---

## Summary: How We Know Which Customer Uploaded Which Document

### **Answer:**

1. **JWT Token:** User logs in → JWT token contains `customerId`
2. **Backend Extraction:** Main backend extracts `customerId` from JWT token (NOT from request body)
3. **Request Creation:** Verification service creates `verification_requests` record with `customerId`
4. **Document Upload:** Each document links to `requestId`, which links to `customerId`
5. **Database Relationships:** `customers.id` → `verification_requests.customerId` → `verification_documents.requestId`
6. **S3 File Path:** `verification/{requestId}/{documentType}/{timestamp}-{filename}`
7. **Audit Trail:** Every action logged with `performedBy: customerId`
8. **Security:** Middleware validates JWT and ensures customer can only access their own documents

### **Key Points:**

- ✅ **Customer ID NEVER sent from frontend** (security)
- ✅ **Extracted from authenticated JWT token** (backend)
- ✅ **Stored in every verification request** (database)
- ✅ **Linked through foreign keys** (request → documents)
- ✅ **Validated on every access** (authorization)
- ✅ **Logged in audit trail** (compliance)

---

**Last Updated:** November 25, 2024  
**Status:** PRODUCTION READY  
**Maintained By:** Contrezz Engineering Team

