# 🚀 Storage Implementation - Quick Start Guide

## 📋 **Implementation Steps**

### **Phase 1: Database Setup** (15 minutes)

#### **Step 1: Run Migration**
```bash
cd backend
psql -U your_user -d your_database -f migrations/add_storage_tracking.sql
```

Or using Prisma:
```bash
npx prisma db push
```

#### **Step 2: Update Prisma Schema**
Add to `backend/prisma/schema.prisma`:

```prisma
model customers {
  // ... existing fields
  storage_used              BigInt?   @default(0)
  storage_limit             BigInt?   @default(5368709120) // 5GB
  storage_last_calculated   DateTime? @default(now())
}

model plans {
  // ... existing fields
  storage_limit BigInt? @default(5368709120) // 5GB
}

model storage_usage {
  id           String   @id @default(uuid())
  customer_id  String
  file_type    String
  category     String?
  file_count   Int      @default(0)
  total_size   BigInt   @default(0)
  last_updated DateTime @default(now())
  
  customers customers @relation(fields: [customer_id], references: [id], onDelete: Cascade)
  
  @@unique([customer_id, file_type, category])
  @@index([customer_id])
}

model storage_transactions {
  id          String   @id @default(uuid())
  customer_id String
  file_id     String?
  file_path   String
  file_name   String
  file_size   BigInt
  file_type   String?
  action      String
  uploaded_by String?
  created_at  DateTime @default(now())
  metadata    Json?
  
  customers customers @relation(fields: [customer_id], references: [id], onDelete: Cascade)
  users     users?    @relation(fields: [uploaded_by], references: [id])
  
  @@index([customer_id])
  @@index([created_at])
}
```

---

### **Phase 2: Install Dependencies** (5 minutes)

```bash
cd backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer
npm install --save-dev @types/multer
```

---

### **Phase 3: Environment Setup** (5 minutes)

Add to `backend/.env`:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
S3_BUCKET_NAME=contrezz-storage

# Storage Settings
DEFAULT_STORAGE_LIMIT=5368709120  # 5GB in bytes
MAX_FILE_SIZE=52428800            # 50MB in bytes
```

---

### **Phase 4: Create Storage Service** (10 minutes)

Create `backend/src/services/storage.service.ts` with the code from the architecture document.

---

### **Phase 5: Create API Routes** (10 minutes)

Create `backend/src/routes/storage.ts` with the code from the architecture document.

Register in `backend/src/index.ts`:

```typescript
import storageRoutes from './routes/storage';

// ... other routes
app.use('/api/storage', storageRoutes);
```

---

### **Phase 6: Frontend Integration** (15 minutes)

#### **1. Create Storage Hook**
Create `src/hooks/useStorage.ts`

#### **2. Create Storage Dashboard**
Create `src/components/StorageDashboard.tsx`

#### **3. Add to Settings Page**
```typescript
import { StorageDashboard } from './StorageDashboard';

// In your settings page
<StorageDashboard />
```

---

## 🧪 **Testing**

### **Test 1: Upload File**
```bash
curl -X POST http://localhost:5000/api/storage/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf" \
  -F "category=documents" \
  -F "subcategory=leases"
```

### **Test 2: Check Quota**
```bash
curl http://localhost:5000/api/storage/quota \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Test 3: Get Stats**
```bash
curl http://localhost:5000/api/storage/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 **Storage Limits by Plan**

| Plan | Storage Limit | In Bytes |
|------|---------------|----------|
| **Starter** | 5 GB | 5,368,709,120 |
| **Professional** | 50 GB | 53,687,091,200 |
| **Business** | 100 GB | 107,374,182,400 |
| **Enterprise** | Unlimited | 9,223,372,036,854,775,807 |

---

## 🗂️ **Storage Structure**

```
s3://contrezz-storage/
└── customers/
    └── {customerId}/
        ├── documents/
        │   ├── leases/
        │   ├── contracts/
        │   ├── invoices/
        │   └── receipts/
        ├── properties/
        │   └── {propertyId}/
        │       ├── photos/
        │       ├── floor-plans/
        │       └── inspection-reports/
        ├── tenants/
        │   └── {tenantId}/
        │       ├── id-documents/
        │       ├── payment-receipts/
        │       └── applications/
        └── projects/
            └── {projectId}/
                ├── blueprints/
                ├── progress-photos/
                ├── vendor-invoices/
                └── permits/
```

---

## 🔧 **Common Use Cases**

### **1. Upload Property Photo**
```typescript
const file = event.target.files[0];
await uploadFile(file, {
  category: 'properties',
  entityId: propertyId,
  subcategory: 'photos',
  metadata: {
    propertyName: 'Sunset Apartments',
    uploadedFrom: 'property-details-page',
  },
});
```

### **2. Upload Lease Document**
```typescript
await uploadFile(file, {
  category: 'documents',
  subcategory: 'leases',
  entityId: tenantId,
  metadata: {
    tenantName: 'John Doe',
    leaseStartDate: '2025-01-01',
  },
});
```

### **3. Upload Project Blueprint**
```typescript
await uploadFile(file, {
  category: 'projects',
  entityId: projectId,
  subcategory: 'blueprints',
  metadata: {
    projectName: 'Tower Block A',
    version: '2.0',
  },
});
```

---

## ⚠️ **Important Notes**

### **Security**
- ✅ All files are isolated per customer
- ✅ Signed URLs expire after 1 hour
- ✅ File type validation on upload
- ✅ Size limits enforced

### **Performance**
- ✅ Files stored in cloud (S3)
- ✅ Database only stores metadata
- ✅ Indexed queries for fast lookups
- ✅ Lazy loading for large file lists

### **Cost Management**
- ✅ Per-customer storage quotas
- ✅ Real-time usage tracking
- ✅ Automatic cleanup on delete
- ✅ Storage analytics for optimization

---

## 🎯 **Next Steps**

1. ✅ Run database migration
2. ✅ Install dependencies
3. ✅ Configure environment variables
4. ✅ Create storage service
5. ✅ Create API routes
6. ✅ Add frontend components
7. ✅ Test upload/delete
8. ✅ Monitor storage usage

---

## 📚 **Documentation**

- **Full Architecture**: `CUSTOMER_STORAGE_ARCHITECTURE.md`
- **API Reference**: See storage routes section
- **Frontend Hooks**: See `useStorage.ts`
- **Database Schema**: See migration file

---

**Your customer storage system is ready to implement!** 🚀

**Estimated Total Time**: ~60 minutes
**Difficulty**: Intermediate
**Status**: Production-Ready

