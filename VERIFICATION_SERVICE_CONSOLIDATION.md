                                                                    -+# 🏗️ Verification Service Consolidation Architecture

## Executive Summary

**Objective:** Consolidate the standalone verification-service into the main backend to reduce infrastructure costs by 50% while maintaining all functionality.

**Current Cost:** 2 servers (backend + verification-service) = ~$12-20/month  
**Target Cost:** 1 server (consolidated backend) = ~$6-10/month  
**Savings:** ~$6-10/month (50% reduction)

---

## 📊 Current vs Target Architecture

### Current (Microservice)

```
┌─────────────────────────────────────┐
│  Main Backend (Port 5000)           │
│  ├─ Property management             │
│  ├─ Payments, leases, etc.          │
│  └─ HTTP calls → Verification       │
└─────────────────────────────────────┘
              ↓ HTTP (Network latency)
┌─────────────────────────────────────┐
│  Verification Service (Port 8080)   │
│  ├─ Dojah integration               │
│  ├─ Document verification           │
│  ├─ Queue workers                   │
│  └─ Separate Prisma client          │
└─────────────────────────────────────┘

Issues:
- ❌ Double server cost
- ❌ Network latency between services
- ❌ Complex deployment
- ❌ Duplicate dependencies
```

### Target (Monolithic with Modules)

```
┌─────────────────────────────────────────────────┐
│  Consolidated Backend (Port 5000)               │
│                                                  │
│  ├─ Main API Routes                             │
│  │   ├─ /api/auth                               │
│  │   ├─ /api/properties                         │
│  │   ├─ /api/payments                           │
│  │   └─ ...                                     │
│  │                                               │
│  ├─ Verification Module (INTEGRATED)            │
│  │   ├─ /api/verification/*                     │
│  │   │   ├─ POST /submit                        │
│  │   │   ├─ POST /upload/:id                    │
│  │   │   ├─ GET /status/:id                     │
│  │   │   └─ GET /customer/:id                   │
│  │   │                                           │
│  │   ├─ /api/admin/verification/*               │
│  │   │   ├─ GET /requests                       │
│  │   │   ├─ POST /requests/:id/approve          │
│  │   │   ├─ POST /requests/:id/reject           │
│  │   │   └─ GET /analytics                      │
│  │   │                                           │
│  │   ├─ /webhook/dojah                          │
│  │   │                                           │
│  │   └─ Internal Services                       │
│  │       ├─ VerificationService                 │
│  │       ├─ DojahProvider                       │
│  │       ├─ QueueService (BullMQ)               │
│  │       └─ EncryptionUtils                     │
│  │                                               │
│  └─ Single Prisma Client (merged schemas)      │
│                                                  │
└─────────────────────────────────────────────────┘

Benefits:
- ✅ 50% cost savings (1 server vs 2)
- ✅ Direct function calls (no HTTP overhead)
- ✅ Simpler deployment
- ✅ Single codebase to maintain
- ✅ Shared dependencies
```

---

## 🗂️ File Structure After Migration

```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── properties.ts
│   │   ├── payments.ts
│   │   ├── verification.ts          ← MOVE FROM verification-service
│   │   └── verification-admin.ts    ← MOVE FROM verification-service/routes/admin.ts
│   │
│   ├── services/
│   │   ├── verification/
│   │   │   ├── verification.service.ts   ← MOVE & RENAME
│   │   │   ├── queue.service.ts          ← MOVE
│   │   │   ├── notification.service.ts   ← MOVE
│   │   │   └── webhook.service.ts        ← MOVE
│   │   └── verification-client.service.ts  ← DELETE (no longer needed)
│   │
│   ├── lib/
│   │   └── verification/
│   │       ├── providers/
│   │       │   ├── base.provider.ts      ← MOVE
│   │       │   ├── dojah.provider.ts     ← MOVE
│   │       │   ├── provider.factory.ts   ← MOVE
│   │       │   └── index.ts              ← MOVE
│   │       ├── encryption.ts             ← MOVE
│   │       └── config.ts                 ← CREATE (merge env.ts)
│   │
│   ├── middleware/
│   │   ├── auth.ts                       ← UPDATE (add verification auth)
│   │   └── verification-rateLimit.ts     ← MOVE & RENAME
│   │
│   ├── types/
│   │   └── verification.types.ts         ← MOVE FROM verification-service/types/index.ts
│   │
│   └── workers/
│       └── verification.worker.ts        ← MOVE
│
├── prisma/
│   └── schema.prisma                     ← MERGE verification tables here
│
└── package.json                          ← ADD verification dependencies

DELETED:
- verification-service/ (entire directory)
```

---

## 🔀 Database Schema Integration

### Add to `backend/prisma/schema.prisma`:

```prisma
// ============================================
// VERIFICATION SYSTEM TABLES
// (Migrated from verification-service)
// ============================================

model verification_requests {
  id              String   @id @default(uuid())
  customerId      String
  customerEmail   String?
  customerType    String   // 'property_owner', 'developer', 'property_manager', 'tenant'
  status          String   @default("pending") // pending, in_progress, approved, rejected, failed
  submittedAt     DateTime @default(now())
  completedAt     DateTime?
  reviewedBy      String?
  reviewedAt      DateTime?
  rejectionReason String?  @db.Text
  ipAddress       String?
  userAgent       String?  @db.Text

  // Relations
  customer        customers  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  reviewer        users?     @relation("verification_reviewer", fields: [reviewedBy], references: [id])
  documents       verification_documents[]
  history         verification_history[]

  @@index([customerId])
  @@index([customerEmail])
  @@index([status])
  @@index([submittedAt])
}

model verification_documents {
  id                String   @id @default(uuid())
  requestId         String
  documentType      String   // 'nin', 'passport', 'drivers_license', etc.
  documentNumber    String?  @db.Text // Encrypted
  fileUrl           String   @db.Text // S3 URL
  fileName          String
  fileSize          Int
  mimeType          String
  status            String   @default("pending")
  provider          String?  // 'dojah', 'youverify'
  providerReference String?
  verificationData  Json?
  confidence        Float?
  verifiedAt        DateTime?
  failureReason     String?  @db.Text
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  request           verification_requests @relation(fields: [requestId], references: [id], onDelete: Cascade)

  @@index([requestId])
  @@index([status])
  @@index([documentType])
  @@index([createdAt])
}

model verification_history {
  id          String   @id @default(uuid())
  requestId   String
  action      String
  performedBy String?
  details     Json?
  createdAt   DateTime @default(now())

  request     verification_requests @relation(fields: [requestId], references: [id], onDelete: Cascade)

  @@index([requestId])
  @@index([action])
  @@index([createdAt])
}

model provider_logs {
  id              String   @id @default(uuid())
  provider        String
  documentId      String?
  endpoint        String
  requestPayload  Json?
  responsePayload Json?
  statusCode      Int?
  duration        Int?
  success         Boolean
  errorMessage    String?  @db.Text
  createdAt       DateTime @default(now())

  @@index([provider])
  @@index([success])
  @@index([createdAt])
  @@index([documentId])
}
```

---

## 🔧 Code Integration Steps

### 1. Update Main Backend `index.ts`

```typescript
// Add to imports section
import verificationRoutes from "./routes/verification";
import verificationAdminRoutes from "./routes/verification-admin";
import verificationWebhookRoutes from "./routes/verification-webhook";

// Add to middleware section (after existing middleware)
app.use("/api/verification", verificationRoutes);
app.use("/api/admin/verification", verificationAdminRoutes);
app.use("/webhook/dojah", verificationWebhookRoutes);
```

### 2. Replace Client Calls with Direct Service Calls

**Before (HTTP client):**

```typescript
// In owner-verification.ts
import { verificationClient } from "../services/verification-client.service";

// HTTP call (slow, network overhead)
const result = await verificationClient.submitVerification(
  customerId,
  customerType,
  customerEmail
);
```

**After (Direct import):**

```typescript
// In owner-verification.ts
import { VerificationService } from "../services/verification/verification.service";

const verificationService = new VerificationService();

// Direct function call (fast, no network)
const result = await verificationService.submitVerification({
  customerId,
  customerType,
  customerEmail,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});
```

### 3. Update Environment Variables

**Merge these from `verification-service/.env` to `backend/.env`:**

```env
# === VERIFICATION SERVICE CONFIGURATION ===
# (Migrated from standalone verification-service)

# Dojah API Configuration
DOJAH_API_KEY=your_dojah_api_key
DOJAH_APP_ID=your_dojah_app_id
DOJAH_API_URL=https://api.dojah.io
DOJAH_WEBHOOK_SECRET=your_dojah_webhook_secret

# DigitalOcean Spaces (Document Storage)
DO_SPACES_KEY=your_spaces_key
DO_SPACES_SECRET=your_spaces_secret
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=contrezz-verifications
DO_SPACES_REGION=nyc3

# Redis (Queue Service)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=1

# Encryption
ENCRYPTION_KEY=your_32_char_encryption_key_here
```

---

## 🔄 Migration Steps (Execution Order)

### Phase 1: Preparation (No Downtime)

```bash
# 1. Backup verification service database
cd verification-service
npx prisma migrate deploy
pg_dump -t verification_* > verification_backup.sql

# 2. Test main backend build
cd ../backend
npm install
npm run build
```

### Phase 2: Code Migration

```bash
# 3. Copy verification tables to main schema
# Edit: backend/prisma/schema.prisma
# Add all verification models shown above

# 4. Create migration (tables already exist, mark as applied)
cd backend
bash scripts/create-migration.sh "integrate_verification_service"

# 5. Copy verification code
cp -r ../verification-service/src/providers ./src/lib/verification/
cp -r ../verification-service/src/services/* ./src/services/verification/
cp ../verification-service/src/routes/verification.ts ./src/routes/
cp ../verification-service/src/routes/admin.ts ./src/routes/verification-admin.ts
cp ../verification-service/src/routes/webhook.ts ./src/routes/verification-webhook.ts
cp ../verification-service/src/middleware/rateLimit.ts ./src/middleware/verification-rateLimit.ts
cp ../verification-service/src/lib/encryption.ts ./src/lib/verification/
cp ../verification-service/src/types/index.ts ./src/types/verification.types.ts

# 6. Update imports in copied files
# Change relative paths to match new structure
```

### Phase 3: Code Updates

```bash
# 7. Update verification routes
# Change path prefixes, update imports

# 8. Update owner-verification.ts
# Replace verificationClient with direct service calls

# 9. Add dependencies to backend/package.json
# Add: bullmq, ioredis, multer-s3, etc.

# 10. Update backend/src/index.ts
# Mount verification routes
```

### Phase 4: Testing

```bash
# 11. Test locally
cd backend
npm install
npm run dev

# 12. Test verification flows
# - Submit verification
# - Upload documents
# - Approve/reject requests
# - Webhook handling
```

### Phase 5: Deployment

```bash
# 13. Update .do/app.yaml
# Remove verification-service component

# 14. Commit and push
git add -A
git commit -m "feat: Consolidate verification service into main backend"
git push origin main

# 15. Monitor deployment

# 16. Verify production

# 17. Delete old verification-service app in DigitalOcean
```

---

## 🔧 Required Code Changes

### 1. Update `backend/package.json`

**Add these dependencies:**

```json
{
  "dependencies": {
    // Existing dependencies...

    // Verification service dependencies
    "bullmq": "^5.15.0",
    "ioredis": "^5.4.1",
    "multer-s3": "^3.0.1",
    "express-validator": "^7.2.0",
    "zod": "^3.23.8"
  }
}
```

### 2. Update `backend/src/index.ts`

**Add to imports:**

```typescript
import verificationRoutes from "./routes/verification";
import verificationAdminRoutes from "./routes/verification-admin";
import verificationWebhookRoutes from "./routes/verification-webhook";
```

**Add to routes (after existing routes):**

```typescript
// Verification routes (consolidated from microservice)
app.use("/api/verification", verificationRoutes);
app.use("/api/admin/verification", verificationAdminRoutes);
app.use("/webhook/dojah", verificationWebhookRoutes);
```

### 3. Update `backend/src/routes/owner-verification.ts`

**Before:**

```typescript
import { verificationClient } from "../services/verification-client.service";

// Submit verification
const result = await verificationClient.submitVerification(
  customerId,
  "property_owner",
  customer.email
);
```

**After:**

```typescript
import { VerificationService } from "../services/verification/verification.service";

const verificationService = new VerificationService();

// Direct function call
const result = await verificationService.submitVerification({
  customerId,
  customerType: "property_owner",
  customerEmail: customer.email,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});
```

### 4. Update `.do/app.yaml`

**Remove verification-service section:**

```yaml
# DELETE THIS ENTIRE SECTION:
# services:
#   - name: verification-service
#     dockerfile_path: verification-service/Dockerfile
#     ...
```

**Keep only:**

```yaml
name: propertyhub-v1
region: nyc

static_sites:
  - name: frontend
    # ... (keep as is)

services:
  - name: backend
    # ... (keep as is)
    # Backend now handles verification internally

databases:
  - name: production-database
    # ... (keep as is)
```

---

## 📦 Package Dependencies to Merge

### From `verification-service/package.json` to `backend/package.json`:

**Production Dependencies:**

```json
{
  "@aws-sdk/client-s3": "^3.933.0",
  "@aws-sdk/lib-storage": "^3.931.0",
  "@aws-sdk/s3-request-presigner": "^3.940.0",
  "bullmq": "^5.15.0",
  "ioredis": "^5.4.1",
  "multer-s3": "^3.0.1",
  "express-validator": "^7.2.0",
  "zod": "^3.23.8"
}
```

**Note:** Don't duplicate what already exists in backend!

---

## 🔐 Security Considerations

### 1. API Key Middleware

Since verification was a separate service with API key auth, you need to maintain that for backwards compatibility:

```typescript
// backend/src/middleware/verification-auth.ts
export function verificationApiKeyAuth(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  // For internal calls, skip API key check
  if (req.headers["x-internal-call"] === "true") {
    return next();
  }

  // For external calls, verify API key
  if (!apiKey || apiKey !== process.env.VERIFICATION_API_KEY) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  next();
}
```

### 2. Database Access

- Keep existing Prisma client
- Verification tables in same database (already the case)
- No cross-service queries needed

### 3. Rate Limiting

- Merge rate limiting rules
- Apply to verification endpoints

---

## ⚡ Performance Improvements

### Before (Microservice):

```
Request flow:
1. Client → Main Backend (5ms)
2. Main Backend → Verification Service (HTTP call: 50-100ms)
3. Verification Service → Dojah API (200-500ms)
4. Response back through chain (100-200ms)

Total overhead: ~150-300ms for internal communication
```

### After (Consolidated):

```
Request flow:
1. Client → Backend (5ms)
2. Backend → Verification Service (direct call: <1ms)
3. Verification Service → Dojah API (200-500ms)
4. Response back (5ms)

Total overhead: ~10ms (95% faster internal communication!)
```

---

## 🧪 Testing Checklist

### Before Deployment:

- [ ] Local build succeeds
- [ ] All verification endpoints work
- [ ] Document upload works
- [ ] Dojah integration works
- [ ] Webhooks work
- [ ] Admin approval/rejection works
- [ ] Queue worker processes jobs
- [ ] No console errors
- [ ] All tests pass

### After Deployment:

- [ ] Production build succeeds
- [ ] Health check passes
- [ ] Submit verification works
- [ ] Document upload to S3 works
- [ ] Status retrieval works
- [ ] Admin dashboard shows requests
- [ ] Webhooks from Dojah received
- [ ] No memory leaks
- [ ] Monitor logs for errors

---

## 🚨 Rollback Plan (If Needed)

If consolidation causes issues:

### Option 1: Quick Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# DigitalOcean auto-deploys previous version
# Old verification-service stays running
```

### Option 2: Re-enable Verification Service

```bash
# Restore verification-service in app.yaml
git checkout HEAD~1 -- .do/app.yaml
git commit -m "rollback: Re-enable separate verification service"
git push origin main
```

### Option 3: Keep Both Temporarily

- Don't delete verification-service app immediately
- Monitor for 48 hours
- Delete after confirming stability

---

## 💰 Cost Analysis

### Current Monthly Costs:

```
Frontend (Static Site):    $0 (free tier)
Main Backend:              $5/month (Basic XS)
Verification Service:      $5/month (Basic XS)
Database:                  $7/month (Dev Database)
───────────────────────────────────────────
Total:                     $17/month
```

### After Consolidation:

```
Frontend (Static Site):    $0 (free tier)
Consolidated Backend:      $5/month (Basic XS) ← Same instance
Database:                  $7/month (Dev Database)
───────────────────────────────────────────
Total:                     $12/month

SAVINGS:                   $5/month ($60/year)
```

**Note:** If you later scale to Professional tier ($12/month), savings become $12/month ($144/year).

---

## 🎯 Implementation Recommendation

### Approach: **Gradual Migration** (Safest)

**Phase 1** (Week 1): Preparation

- Merge schemas
- Copy code
- Update imports
- Test locally

**Phase 2** (Week 2): Parallel Run

- Deploy consolidated backend
- Keep verification-service running
- Route 10% of traffic to new system
- Monitor for errors

**Phase 3** (Week 3): Full Migration

- Route 100% traffic to consolidated backend
- Monitor for 48 hours
- Delete verification-service

### Alternative: **Big Bang Migration** (Faster but riskier)

- Complete all steps in 1 day
- Deploy immediately
- Higher risk but immediate cost savings

---

## 📋 Environment Variables Checklist

**Add to backend/.env:**

```env
# Verification Service (migrated)
DOJAH_API_KEY=
DOJAH_APP_ID=
DOJAH_API_URL=https://api.dojah.io
DOJAH_WEBHOOK_SECRET=

# DigitalOcean Spaces
DO_SPACES_KEY=
DO_SPACES_SECRET=
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=contrezz-verifications
DO_SPACES_REGION=nyc3

# Redis (for BullMQ queues)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=1

# Encryption
ENCRYPTION_KEY=
```

**Remove from .env:**

```env
# DELETE THESE (no longer needed):
# VERIFICATION_SERVICE_URL=
# VERIFICATION_API_KEY=
```

---

## ✅ Success Criteria

The migration is complete when:

1. ✅ All verification endpoints respond correctly
2. ✅ Documents upload to S3 successfully
3. ✅ Dojah API integration works
4. ✅ Admin can approve/reject requests
5. ✅ Webhooks are received and processed
6. ✅ Queue workers process jobs
7. ✅ No increase in error rate
8. ✅ Response times are same or better
9. ✅ DigitalOcean shows 1 service (not 2)
10. ✅ Monthly bill reduced by ~$5

---

## 🚀 Ready to Execute?

Would you like me to:

1. **Execute the migration now** (automated)?
2. **Create migration scripts** for manual execution?
3. **Set up gradual rollout** (safer)?
4. **Just update app.yaml** and deploy immediately?

Let me know your preference and I'll proceed with the consolidation! 🎯

**Recommendation:** Let me automate the entire migration for you with proper testing at each step.
