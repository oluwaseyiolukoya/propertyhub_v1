# Identity Verification Microservice - Testing Guide

## Quick Start Testing (5 Minutes)

### Prerequisites

```bash
# 1. Install dependencies
cd verification-service
npm install

cd ../backend
npm install

# 2. Setup environment variables
cd ../verification-service
cp .env.example .env

# Edit .env with your credentials:
# - DATABASE_URL (PostgreSQL)
# - REDIS_URL (Redis)
# - DOJAH_API_KEY (from Dojah dashboard)
# - DOJAH_APP_ID (from Dojah dashboard)
# - AWS credentials (for S3)
# - ENCRYPTION_KEY (generate with: openssl rand -hex 32)
```

### Start Services

```bash
# Terminal 1: Start Redis (if not running)
redis-server

# Terminal 2: Start Verification Service
cd verification-service
npx prisma generate
npx prisma migrate deploy
npm run dev

# Terminal 3: Start Verification Worker
cd verification-service
npm run worker:dev

# Terminal 4: Start Main Backend
cd backend
npm run dev

# Terminal 5: Start Frontend
npm run dev
```

---

## Testing Checklist

### ✅ Phase 1: Health Check

```bash
# Test verification service is running
curl http://localhost:5001/health

# Expected response:
# {
#   "status": "ok",
#   "service": "verification-service",
#   "timestamp": "2025-11-25T..."
# }
```

### ✅ Phase 2: Backend Integration

```bash
# 1. Login to get JWT token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'

# Save the token from response
TOKEN="your_jwt_token_here"

# 2. Start verification
curl -X POST http://localhost:5000/api/verification/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Expected response:
# {
#   "success": true,
#   "requestId": "uuid-here",
#   "status": "pending"
# }

# Save the requestId
REQUEST_ID="uuid-from-response"

# 3. Upload a document
curl -X POST http://localhost:5000/api/verification/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "document=@/path/to/your/nin-document.jpg" \
  -F "requestId=$REQUEST_ID" \
  -F "documentType=nin" \
  -F "documentNumber=12345678901" \
  -F 'metadata={"firstName":"John","lastName":"Doe","dob":"1990-01-01"}'

# Expected response:
# {
#   "success": true,
#   "documentId": "uuid-here",
#   "status": "pending"
# }

# 4. Check verification status
curl http://localhost:5000/api/verification/status \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
# {
#   "verified": false,
#   "status": "in_progress",
#   "requestId": "uuid",
#   "documents": [...]
# }
```

### ✅ Phase 3: Frontend Testing

1. **Open Browser**: http://localhost:5173
2. **Login** with your credentials
3. **Navigate** to verification section (you'll need to add a route/link)
4. **Start Verification**:
   - Click "Start Verification" button
   - Should see upload form

5. **Upload Documents**:
   - Select document type (NIN, Passport, etc.)
   - Enter document number
   - Enter first name, last name
   - For NIN: Enter date of birth
   - Upload file (JPEG, PNG, or PDF)
   - Click "Upload Document"

6. **Check Status**:
   - Should see document in "pending" or "in_progress" state
   - Wait for worker to process (check Terminal 3)
   - Refresh to see updated status

### ✅ Phase 4: Admin Testing

```bash
# 1. Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin-password"
  }'

ADMIN_TOKEN="admin_jwt_token_here"

# 2. List all verification requests
curl "http://localhost:5000/api/admin/verification/requests?status=pending&page=1&limit=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. Get request details
curl "http://localhost:5000/api/admin/verification/requests/$REQUEST_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 4. Approve verification
curl -X POST "http://localhost:5000/api/admin/verification/requests/$REQUEST_ID/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# 5. Get analytics
curl http://localhost:5000/api/admin/verification/analytics \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### ✅ Phase 5: Worker Testing

**Watch Terminal 3 (Worker) for logs:**

```
🔄 [Worker] Processing job 123 for document abc-def
[Worker] Document type: nin, Status: pending
[Worker] Using provider: dojah
[Dojah] Verifying NIN: 123***
[Dojah] ✅ SMTP connection verified
[Worker] Verification result: { success: true, status: 'verified', confidence: 95 }
[Worker] ✅ Request abc-123 completed with status: approved
✅ [Worker] Job 123 completed
```

### ✅ Phase 6: Database Verification

```bash
# Connect to database
psql $DATABASE_URL

# Check verification requests
SELECT id, "customerId", status, "submittedAt" 
FROM verification_requests 
ORDER BY "submittedAt" DESC 
LIMIT 5;

# Check documents
SELECT id, "documentType", status, confidence, "verifiedAt"
FROM verification_documents 
WHERE "requestId" = 'your-request-id';

# Check history
SELECT action, "performedBy", "createdAt"
FROM verification_history 
WHERE "requestId" = 'your-request-id'
ORDER BY "createdAt" DESC;

# Check provider logs
SELECT provider, endpoint, "statusCode", success, duration
FROM provider_logs 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

---

## Testing Scenarios

### Scenario 1: Successful NIN Verification

**Steps:**
1. Start verification
2. Upload NIN document with correct details
3. Wait for worker to process
4. Check status - should be "verified"
5. Check confidence score - should be > 80%

**Expected Result:**
- Document status: `verified`
- Request status: `approved` (if all docs verified)
- Confidence: 80-100%
- User receives notification

### Scenario 2: Failed Verification

**Steps:**
1. Start verification
2. Upload document with incorrect details
3. Wait for worker to process
4. Check status - should be "failed"

**Expected Result:**
- Document status: `failed`
- Request status: `rejected`
- Failure reason provided
- User receives notification

### Scenario 3: Manual Review (Utility Bill)

**Steps:**
1. Start verification
2. Upload utility bill
3. Check status - should be "pending"
4. Admin reviews and approves/rejects

**Expected Result:**
- Document status: `pending`
- Admin notification sent
- Admin can approve/reject manually

### Scenario 4: Multiple Documents

**Steps:**
1. Start verification
2. Upload NIN document
3. Upload passport document
4. Upload utility bill
5. Wait for processing

**Expected Result:**
- All documents tracked separately
- Request status updates when all complete
- Individual confidence scores

---

## Debugging Common Issues

### Issue 1: "Connection refused" to verification service

**Solution:**
```bash
# Check if service is running
curl http://localhost:5001/health

# If not, start it:
cd verification-service
npm run dev
```

### Issue 2: "Redis connection failed"

**Solution:**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not, start Redis:
redis-server
```

### Issue 3: "Database does not exist"

**Solution:**
```bash
cd verification-service
npx prisma migrate deploy
```

### Issue 4: "API key invalid"

**Solution:**
```bash
# Generate API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to verification-service/.env
API_KEY_MAIN_DASHBOARD=generated_key_here

# Add to backend/.env
VERIFICATION_API_KEY=same_generated_key_here

# Restart both services
```

### Issue 5: Worker not processing jobs

**Solution:**
```bash
# Check Redis connection
redis-cli
> KEYS verification:*
> LLEN verification:waiting

# Check worker logs
cd verification-service
npm run worker:dev

# Should see: "🚀 Verification Worker started"
```

### Issue 6: "Document upload failed"

**Solution:**
```bash
# Check file size (must be < 10MB)
ls -lh your-document.jpg

# Check file type (must be JPEG, PNG, or PDF)
file your-document.jpg

# Check AWS credentials
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
```

---

## Performance Testing

### Load Test with Apache Bench

```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:5001/health

# Test verification submission (with auth)
ab -n 100 -c 5 -H "Authorization: Bearer $TOKEN" \
  -p verification-payload.json \
  -T application/json \
  http://localhost:5000/api/verification/start
```

### Monitor Queue Performance

```bash
# Connect to Redis
redis-cli

# Check queue stats
> LLEN verification:waiting
> LLEN verification:active
> LLEN verification:completed
> LLEN verification:failed
```

---

## Integration Testing

### Test Complete Flow

```bash
# Run this script to test end-to-end
cd verification-service
npm test

# Or manually:
npm run test:integration
```

**Test file:** `verification-service/tests/integration/complete-flow.test.ts`

```typescript
describe('Complete Verification Flow', () => {
  it('should verify NIN successfully', async () => {
    // 1. Start verification
    const request = await startVerification('customer-123', 'developer');
    expect(request.id).toBeDefined();
    
    // 2. Upload document
    const document = await uploadDocument(request.id, ninFile, 'nin', '12345678901');
    expect(document.id).toBeDefined();
    
    // 3. Wait for processing
    await sleep(5000);
    
    // 4. Check status
    const status = await getStatus(request.id);
    expect(status.status).toBe('approved');
  });
});
```

---

## Monitoring & Logs

### Check Service Logs

```bash
# Verification service logs
tail -f verification-service/logs/app.log

# Worker logs
tail -f verification-service/logs/worker.log

# Main backend logs
tail -f backend/logs/app.log
```

### Monitor with PM2 (Production)

```bash
# Install PM2
npm install -g pm2

# Start services
pm2 start verification-service/dist/index.js --name verification-api
pm2 start verification-service/dist/workers/verification.worker.js --name verification-worker

# Monitor
pm2 monit

# View logs
pm2 logs verification-api
pm2 logs verification-worker
```

---

## Test Data

### Sample NIN (Dojah Sandbox)

```json
{
  "nin": "12345678901",
  "firstName": "John",
  "lastName": "Doe",
  "dob": "1990-01-01"
}
```

### Sample Passport

```json
{
  "passportNumber": "A12345678",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

### Sample Files

Create test files:
```bash
# Create dummy NIN image
convert -size 800x600 xc:white -pointsize 30 \
  -draw "text 100,300 'National Identity Card'" \
  test-nin.jpg

# Create dummy PDF
echo "Test Document" | ps2pdf - test-document.pdf
```

---

## Success Criteria

✅ **All tests pass when:**
- Health check returns 200
- Verification request created successfully
- Document upload succeeds
- Worker processes job within 30 seconds
- Status updates correctly
- Admin can approve/reject
- Notifications sent
- Database records created
- Audit trail logged

---

## Next Steps After Testing

1. **Fix any issues** found during testing
2. **Add more test cases** for edge cases
3. **Setup monitoring** (Sentry, DataDog, etc.)
4. **Configure alerts** for failures
5. **Deploy to staging** environment
6. **Run load tests** in staging
7. **Deploy to production** with monitoring

---

## Quick Test Script

Save this as `test-verification.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Verification Service..."

# 1. Health check
echo "1. Health check..."
curl -s http://localhost:5001/health | jq

# 2. Login
echo "2. Login..."
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' | jq -r '.token')

echo "Token: ${TOKEN:0:20}..."

# 3. Start verification
echo "3. Start verification..."
REQUEST_ID=$(curl -s -X POST http://localhost:5000/api/verification/start \
  -H "Authorization: Bearer $TOKEN" | jq -r '.requestId')

echo "Request ID: $REQUEST_ID"

# 4. Check status
echo "4. Check status..."
curl -s http://localhost:5000/api/verification/status \
  -H "Authorization: Bearer $TOKEN" | jq

echo "✅ Basic tests complete!"
```

Run it:
```bash
chmod +x test-verification.sh
./test-verification.sh
```

---

**Happy Testing! 🎉**

If you encounter any issues, check the logs and refer to the debugging section above.
