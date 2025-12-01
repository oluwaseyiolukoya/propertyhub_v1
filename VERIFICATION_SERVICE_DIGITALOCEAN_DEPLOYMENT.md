# Identity Verification Service - DigitalOcean Deployment Guide

## Overview

This guide covers deploying the Identity Verification microservice to DigitalOcean alongside the existing Contrezz application.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    DigitalOcean App Platform             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Frontend   │  │   Backend    │  │ Verification │  │
│  │  (Port 80)   │  │ (Port 5000)  │  │ (Port 5001)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │         │
│         └──────────────────┴──────────────────┘         │
│                            │                            │
│  ┌─────────────────────────┴────────────────────────┐  │
│  │                                                   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────┐ │  │
│  │  │  PostgreSQL  │  │  PostgreSQL  │  │ Redis  │ │  │
│  │  │   (Main DB)  │  │ (Verify DB)  │  │ Queue  │ │  │
│  │  └──────────────┘  └──────────────┘  └────────┘ │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

- [x] DigitalOcean account with existing Contrezz deployment
- [ ] Dojah API credentials (https://dojah.io)
- [ ] AWS S3 bucket for document storage
- [ ] Redis instance (can use DigitalOcean Managed Redis)

## Deployment Steps

### Step 1: Create Verification Database

**Option A: Separate Database (Recommended for Production)**

```bash
# In DigitalOcean Console:
# 1. Go to Databases → Create Database
# 2. Choose PostgreSQL 15
# 3. Name: verification-db-prod
# 4. Select same region as main app
# 5. Choose plan: Basic ($15/month for starter)
```

**Option B: Use Existing Database (Simpler for Testing)**

```bash
# Connect to existing database and create new schema
psql $DATABASE_URL -c "CREATE DATABASE verification_db;"
```

### Step 2: Create Redis Instance

**Option A: DigitalOcean Managed Redis (Recommended)**

```bash
# In DigitalOcean Console:
# 1. Go to Databases → Create Database
# 2. Choose Redis 7
# 3. Name: verification-redis
# 4. Select same region as main app
# 5. Choose plan: Basic ($15/month for starter)
```

**Option B: Self-Hosted Redis Container**

```yaml
# Add to your existing docker-compose.yml or App Platform spec
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
```

### Step 3: Configure Environment Variables

#### Verification Service Environment Variables

Add these to your DigitalOcean App Platform:

```bash
# Service Configuration
PORT=5001
NODE_ENV=production

# Database
DATABASE_URL=${verification-db.DATABASE_URL}  # From DigitalOcean managed DB
# OR for existing DB:
# DATABASE_URL=postgresql://user:pass@host:25060/verification_db?sslmode=require

# Redis
REDIS_URL=${verification-redis.REDIS_URL}  # From DigitalOcean managed Redis

# Dojah API
DOJAH_API_KEY=<your_dojah_api_key>
DOJAH_APP_ID=<your_dojah_app_id>
DOJAH_WEBHOOK_SECRET=<your_webhook_secret>
DOJAH_BASE_URL=https://api.dojah.io

# AWS S3
AWS_ACCESS_KEY_ID=<your_aws_key>
AWS_SECRET_ACCESS_KEY=<your_aws_secret>
AWS_REGION=us-east-1
AWS_S3_BUCKET=contrezz-verification-docs

# Security (Generate these securely)
ENCRYPTION_KEY=<64_char_hex_string>
API_KEY_MAIN_DASHBOARD=<64_char_hex_string>

# CORS
ALLOWED_ORIGINS=https://contrezz.com,https://api.contrezz.com

# Main Dashboard
MAIN_DASHBOARD_URL=https://api.contrezz.com
```

#### Main Backend Environment Variables

Add these to your existing backend service:

```bash
# Identity Verification Microservice
VERIFICATION_SERVICE_URL=https://verification.contrezz.com
# OR internal URL:
# VERIFICATION_SERVICE_URL=http://verification-service:5001

VERIFICATION_API_KEY=<same_as_API_KEY_MAIN_DASHBOARD_above>
```

### Step 4: Create App Platform Service

**File:** `verification-service/.do/app.yaml`

```yaml
name: contrezz-verification
region: nyc

services:
  # API Service
  - name: verification-api
    github:
      repo: YOUR_GITHUB_USERNAME/test_ui_figma_and_cursor
      branch: main
      deploy_on_push: true
    source_dir: /verification-service
    build_command: |
      npm ci
      npx prisma generate
      npm run build
    run_command: |
      npx prisma migrate deploy
      npm start
    instance_count: 1
    instance_size_slug: basic-xs
    http_port: 5001
    health_check:
      http_path: /health
      initial_delay_seconds: 30
      period_seconds: 10
      timeout_seconds: 5
      success_threshold: 1
      failure_threshold: 3
    envs:
      - key: PORT
        value: "5001"
      - key: NODE_ENV
        value: "production"
      - key: DATABASE_URL
        scope: RUN_TIME
        type: SECRET
      - key: REDIS_URL
        scope: RUN_TIME
        type: SECRET
      - key: DOJAH_API_KEY
        scope: RUN_TIME
        type: SECRET
      - key: DOJAH_APP_ID
        scope: RUN_TIME
        type: SECRET
      - key: DOJAH_WEBHOOK_SECRET
        scope: RUN_TIME
        type: SECRET
      - key: AWS_ACCESS_KEY_ID
        scope: RUN_TIME
        type: SECRET
      - key: AWS_SECRET_ACCESS_KEY
        scope: RUN_TIME
        type: SECRET
      - key: AWS_REGION
        value: "us-east-1"
      - key: AWS_S3_BUCKET
        value: "contrezz-verification-docs"
      - key: ENCRYPTION_KEY
        scope: RUN_TIME
        type: SECRET
      - key: API_KEY_MAIN_DASHBOARD
        scope: RUN_TIME
        type: SECRET
      - key: ALLOWED_ORIGINS
        value: "https://contrezz.com,https://api.contrezz.com"
      - key: MAIN_DASHBOARD_URL
        value: "https://api.contrezz.com"

  # Background Worker
  - name: verification-worker
    github:
      repo: YOUR_GITHUB_USERNAME/test_ui_figma_and_cursor
      branch: main
      deploy_on_push: true
    source_dir: /verification-service
    build_command: |
      npm ci
      npx prisma generate
      npm run build
    run_command: npm run worker
    instance_count: 1
    instance_size_slug: basic-xs
    envs:
      - key: NODE_ENV
        value: "production"
      - key: DATABASE_URL
        scope: RUN_TIME
        type: SECRET
      - key: REDIS_URL
        scope: RUN_TIME
        type: SECRET
      - key: DOJAH_API_KEY
        scope: RUN_TIME
        type: SECRET
      - key: DOJAH_APP_ID
        scope: RUN_TIME
        type: SECRET
      - key: AWS_ACCESS_KEY_ID
        scope: RUN_TIME
        type: SECRET
      - key: AWS_SECRET_ACCESS_KEY
        scope: RUN_TIME
        type: SECRET
      - key: AWS_REGION
        value: "us-east-1"
      - key: AWS_S3_BUCKET
        value: "contrezz-verification-docs"
      - key: ENCRYPTION_KEY
        scope: RUN_TIME
        type: SECRET

databases:
  - name: verification-db
    engine: PG
    version: "15"
    production: true
    cluster_name: verification-db-prod

  - name: verification-redis
    engine: REDIS
    version: "7"
    production: true
```

### Step 5: Deploy Using DigitalOcean CLI

```bash
# Install doctl if not already installed
brew install doctl  # macOS
# or
snap install doctl  # Linux

# Authenticate
doctl auth init

# Create app from spec
cd verification-service
doctl apps create --spec .do/app.yaml

# Or update existing app
doctl apps update YOUR_APP_ID --spec .do/app.yaml
```

### Step 6: Deploy Using DigitalOcean Console (Alternative)

1. **Go to App Platform** → Create App
2. **Connect GitHub Repository**
   - Repository: `YOUR_GITHUB_USERNAME/test_ui_figma_and_cursor`
   - Branch: `main`
   - Source Directory: `/verification-service`
3. **Configure Service**
   - Name: `verification-api`
   - Build Command: `npm ci && npx prisma generate && npm run build`
   - Run Command: `npx prisma migrate deploy && npm start`
   - HTTP Port: `5001`
   - Health Check: `/health`
4. **Add Worker Component**
   - Name: `verification-worker`
   - Run Command: `npm run worker`
5. **Add Environment Variables** (from Step 3)
6. **Create Databases**
   - PostgreSQL: `verification-db`
   - Redis: `verification-redis`
7. **Review and Create**

### Step 7: Update Main Backend

Update your main backend's environment variables in DigitalOcean:

```bash
# In DigitalOcean Console → Your Main Backend App → Settings → Environment Variables
VERIFICATION_SERVICE_URL=https://verification-api-xxxxx.ondigitalocean.app
VERIFICATION_API_KEY=<your_generated_api_key>
```

### Step 8: Configure DNS (Optional)

If you want a custom subdomain:

```bash
# In DigitalOcean Console → App Platform → Settings → Domains
# Add custom domain: verification.contrezz.com
# Point CNAME to: verification-api-xxxxx.ondigitalocean.app
```

### Step 9: Test Deployment

```bash
# Test health endpoint
curl https://verification-api-xxxxx.ondigitalocean.app/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-11-25T10:32:23.456Z",
  "database": "connected",
  "redis": "connected"
}

# Test API with API key
curl -X POST https://verification-api-xxxxx.ondigitalocean.app/api/verification/submit \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "test-customer-id",
    "customerType": "developer"
  }'
```

## Local Testing Before Deployment

### 1. Test with Local Databases

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Verification Service
cd verification-service
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

### 2. Test API Endpoints

```bash
# Submit verification request
curl -X POST http://localhost:5001/api/verification/submit \
  -H "X-API-Key: c4453bd1f9ae085bed83385dcb4bc745374dd0eff62455e53d411985220194da" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "test-customer-id",
    "customerType": "developer"
  }'

# Check status
curl -X GET http://localhost:5001/api/verification/status/REQUEST_ID \
  -H "X-API-Key: c4453bd1f9ae085bed83385dcb4bc745374dd0eff62455e53d411985220194da"
```

### 3. Test Main Backend Integration

```bash
# Test through main backend proxy
curl -X POST http://localhost:5000/api/verification/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Monitoring & Logs

### View Logs in DigitalOcean

```bash
# Using doctl
doctl apps logs YOUR_APP_ID --component verification-api --follow
doctl apps logs YOUR_APP_ID --component verification-worker --follow

# Or in Console: App Platform → Your App → Runtime Logs
```

### Monitor Queue Status

```bash
# Connect to Redis
redis-cli -h YOUR_REDIS_HOST -p 25061 -a YOUR_REDIS_PASSWORD

# Check queue status
LLEN bull:verification:wait
LLEN bull:verification:active
LLEN bull:verification:completed
LLEN bull:verification:failed
```

### Monitor Database

```bash
# Connect to verification database
psql $VERIFICATION_DATABASE_URL

# Check verification requests
SELECT status, COUNT(*) FROM verification_requests GROUP BY status;

# Check recent documents
SELECT * FROM verification_documents ORDER BY "createdAt" DESC LIMIT 10;

# Check provider logs
SELECT provider, success, COUNT(*) FROM provider_logs 
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY provider, success;
```

## Cost Estimation

### DigitalOcean Resources

| Resource | Plan | Monthly Cost |
|----------|------|--------------|
| Verification API Service | Basic (512MB RAM, 1 vCPU) | $5 |
| Verification Worker | Basic (512MB RAM, 1 vCPU) | $5 |
| PostgreSQL Database | Basic (1GB RAM, 1 vCPU, 10GB) | $15 |
| Redis | Basic (256MB RAM) | $15 |
| **Total Infrastructure** | | **$40/month** |

### Third-Party Services

| Service | Cost |
|---------|------|
| Dojah API | ₦50-100 per verification |
| AWS S3 | ~$5/month (first 1000 documents) |

### Total Estimated Cost

- **Fixed**: $45/month (infrastructure)
- **Variable**: ₦50-100 per verification (~$0.06-0.12 USD)
- **Example**: 1000 verifications/month = $45 + $60-120 = **$105-165/month**

## Scaling Considerations

### Horizontal Scaling

```yaml
# Increase instance count in .do/app.yaml
services:
  - name: verification-api
    instance_count: 2  # Scale to 2 instances
    
  - name: verification-worker
    instance_count: 3  # Scale to 3 workers for faster processing
```

### Vertical Scaling

```yaml
# Upgrade instance size
services:
  - name: verification-api
    instance_size_slug: professional-xs  # 1GB RAM, 1 vCPU
```

### Database Scaling

```bash
# Upgrade database plan in DigitalOcean Console
# Basic → Professional (2GB RAM, 1 vCPU, 25GB) = $30/month
```

## Security Checklist

- [ ] All API keys are stored as encrypted secrets in DigitalOcean
- [ ] Database connections use SSL (`sslmode=require`)
- [ ] CORS is configured with specific origins (no wildcards)
- [ ] API key authentication is enforced on all endpoints
- [ ] S3 bucket has proper IAM policies (no public access)
- [ ] Webhook signatures are verified
- [ ] Document numbers are encrypted at rest
- [ ] Rate limiting is enabled (100 req/min per API key)
- [ ] Logs don't contain sensitive data (PII, API keys)
- [ ] HTTPS is enforced (handled by DigitalOcean)

## Rollback Procedure

If deployment fails:

```bash
# Rollback to previous deployment
doctl apps deployments list YOUR_APP_ID
doctl apps deployments rollback YOUR_APP_ID PREVIOUS_DEPLOYMENT_ID

# Or in Console: App Platform → Your App → Deployments → Rollback
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
doctl apps logs YOUR_APP_ID --component verification-api --tail 100

# Common issues:
# 1. Missing environment variables
# 2. Database connection failed (check DATABASE_URL)
# 3. Redis connection failed (check REDIS_URL)
# 4. Build failed (check build logs)
```

### Worker Not Processing Jobs

```bash
# Check worker logs
doctl apps logs YOUR_APP_ID --component verification-worker --follow

# Check Redis connection
redis-cli -h YOUR_REDIS_HOST ping

# Check queue status
redis-cli -h YOUR_REDIS_HOST LLEN bull:verification:wait
```

### Database Migration Failed

```bash
# SSH into app container (if enabled)
doctl apps exec YOUR_APP_ID --component verification-api

# Run migrations manually
cd /workspace
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

## Support & Resources

- **DigitalOcean Docs**: https://docs.digitalocean.com/products/app-platform/
- **Prisma Migrations**: https://www.prisma.io/docs/concepts/components/prisma-migrate
- **BullMQ Docs**: https://docs.bullmq.io/
- **Dojah API Docs**: https://docs.dojah.io/

## Next Steps

After successful deployment:

1. [ ] Test all API endpoints in production
2. [ ] Monitor logs for first 24 hours
3. [ ] Set up alerts for errors and downtime
4. [ ] Configure backup schedule for verification database
5. [ ] Document API keys and credentials in secure location
6. [ ] Train team on admin verification management UI
7. [ ] Set up monitoring dashboard (optional: Datadog, New Relic)

---

**Last Updated**: November 25, 2025  
**Status**: Ready for deployment  
**Deployment Target**: DigitalOcean App Platform

