# Verification Service Setup Checklist ✅

## Prerequisites Completed ✅

- ✅ **Dependencies Installed**
  - verification-service: 453 packages
  - backend: Updated with latest packages

- ✅ **Environment Files Created**
  - verification-service/.env created from .env.example
  - Security keys generated

## Next Steps - Configuration Required

### 1. Configure verification-service/.env

Open `verification-service/.env` and add these values:

```env
# Service
PORT=5001
NODE_ENV=development

# Database - REQUIRED
DATABASE_URL=postgresql://user:password@localhost:5432/verification_db

# Redis - REQUIRED
REDIS_URL=redis://localhost:6379

# Dojah API - REQUIRED (Get from https://dojah.io/dashboard)
DOJAH_API_KEY=your_dojah_api_key_here
DOJAH_APP_ID=your_dojah_app_id_here
DOJAH_BASE_URL=https://sandbox.dojah.io
DOJAH_WEBHOOK_SECRET=your_webhook_secret

# DigitalOcean Spaces - REQUIRED (for document storage)
SPACES_ACCESS_KEY_ID=your_spaces_access_key
SPACES_SECRET_ACCESS_KEY=your_spaces_secret_key
SPACES_REGION=nyc3
SPACES_BUCKET=contrezz-verification-docs
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com

# Security - ALREADY GENERATED
ENCRYPTION_KEY=690670524a89d6492d397c6158e583b74940838de425fe6f26242ea91240a30e
API_KEY_MAIN_DASHBOARD=c4453bd1f9ae085bed83385dcb4bc745374dd0eff62455e53d411985220194da

# Main Dashboard
MAIN_DASHBOARD_URL=http://localhost:5000
```

### 2. Configure backend/.env

Add these lines to `backend/.env`:

```env
# Verification Service Integration
VERIFICATION_SERVICE_URL=http://localhost:5001
VERIFICATION_API_KEY=c4453bd1f9ae085bed83385dcb4bc745374dd0eff62455e53d411985220194da
```

### 3. Setup PostgreSQL Database

```bash
# Option 1: Create local database
createdb verification_db

# Option 2: Use existing PostgreSQL server
# Just update DATABASE_URL in verification-service/.env
```

### 4. Setup Redis

```bash
# Option 1: Install Redis locally (macOS)
brew install redis
brew services start redis

# Option 2: Use Docker
docker run -d -p 6379:6379 redis:7-alpine

# Option 3: Use cloud Redis (e.g., Redis Cloud, Upstash)
# Update REDIS_URL in .env
```

### 5. Setup DigitalOcean Spaces (for document storage)

**DigitalOcean Spaces (S3-compatible)**
1. Go to DigitalOcean Console → Spaces
   - URL: https://cloud.digitalocean.com/spaces
2. Create a new Space:
   - Name: `contrezz-verification-docs`
   - Region: Choose closest to your app (e.g., `nyc3`, `sfo3`, `sgp1`)
   - Enable CDN (optional, for faster access)
3. Generate Spaces Access Keys:
   - Go to API → Tokens/Keys → Spaces Keys
   - Click "Generate New Key"
   - Save the Access Key ID and Secret Access Key
4. Update verification-service/.env:
   ```
   SPACES_ACCESS_KEY_ID=your_generated_access_key
   SPACES_SECRET_ACCESS_KEY=your_generated_secret_key
   SPACES_REGION=nyc3
   SPACES_BUCKET=contrezz-verification-docs
   SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
   ```

**Option B: Alternative (for testing)**
- Use MinIO (local S3-compatible storage)
- Or temporarily skip file upload testing

### 6. Setup Dojah Account

1. Go to https://dojah.io
2. Sign up for an account
3. Go to Dashboard → API Keys
4. Copy API Key and App ID
5. Add to verification-service/.env

**For Testing:**
- Use Dojah Sandbox: `DOJAH_BASE_URL=https://sandbox.dojah.io`
- Test credentials provided in Dojah docs

## Quick Start Commands

Once configuration is complete:

```bash
# Terminal 1: Start Redis
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

## Verification Checklist

After starting all services, verify:

```bash
# 1. Check Redis
redis-cli ping
# Should return: PONG

# 2. Check Verification Service
curl http://localhost:5001/health
# Should return: {"status":"ok",...}

# 3. Check Main Backend
curl http://localhost:5000/health
# Should return: {"status":"healthy",...}

# 4. Check Frontend
# Open: http://localhost:5173
```

## Common Issues & Solutions

### Issue: "Cannot connect to database"
**Solution:** 
- Check PostgreSQL is running
- Verify DATABASE_URL is correct
- Create database: `createdb verification_db`

### Issue: "Redis connection failed"
**Solution:**
- Check Redis is running: `redis-cli ping`
- Start Redis: `redis-server` or `brew services start redis`

### Issue: "Prisma Client not generated"
**Solution:**
```bash
cd verification-service
npx prisma generate
```

### Issue: "Migration failed"
**Solution:**
```bash
cd verification-service
npx prisma migrate reset
npx prisma migrate deploy
```

## What's Next?

After setup is complete:

1. ✅ Run health checks (see above)
2. ✅ Test API endpoints (see VERIFICATION_SERVICE_TESTING_GUIDE.md)
3. ✅ Upload test documents
4. ✅ Check worker processing
5. ✅ Test admin approval flow

## Need Help?

- **Testing Guide:** `VERIFICATION_SERVICE_TESTING_GUIDE.md`
- **Complete Documentation:** `VERIFICATION_SERVICE_COMPLETE.md`
- **Phase Summaries:** `VERIFICATION_SERVICE_PHASE[1-6]_COMPLETE.md`

---

**Status:** Prerequisites Complete ✅
**Next:** Configure environment variables above
**Time Required:** 10-15 minutes for configuration
