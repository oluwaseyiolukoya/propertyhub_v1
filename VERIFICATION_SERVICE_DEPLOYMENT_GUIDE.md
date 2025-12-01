# Verification Service Deployment Guide

**Date:** November 26, 2025  
**Status:** READY FOR DEPLOYMENT  
**Platform:** DigitalOcean App Platform

---

## 📋 Overview

This guide covers deploying the **verification microservice** to DigitalOcean App Platform alongside your existing main backend.

### **Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                    DigitalOcean App Platform                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌────────────────────────┐   │
│  │  Main Backend    │         │  Verification Service  │   │
│  │  (Port 8080)     │◄────────┤  (Port 5001)          │   │
│  │                  │  HTTP   │                        │   │
│  └────────┬─────────┘         └───────┬────────────────┘   │
│           │                            │                     │
│           │                            │                     │
│           ▼                            ▼                     │
│  ┌─────────────────┐         ┌────────────────────────┐   │
│  │  Main Database  │         │  Verification Database │   │
│  │  (PostgreSQL)   │         │  (PostgreSQL)          │   │
│  └─────────────────┘         └────────────────────────┘   │
│                                         │                    │
│                                         ▼                    │
│                               ┌────────────────────────┐   │
│                               │  DigitalOcean Spaces   │   │
│                               │  (Document Storage)    │   │
│                               └────────────────────────┘   │
│                                         │                    │
│                                         ▼                    │
│                               ┌────────────────────────┐   │
│                               │  Redis (Managed)       │   │
│                               │  (Job Queue)           │   │
│                               └────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Prerequisites

### **1. DigitalOcean Resources Needed:**

- ✅ App Platform (existing - for main backend)
- ⚠️ **NEW:** Second PostgreSQL database cluster (for verification service)
- ⚠️ **NEW:** Redis managed database (for BullMQ job queue)
- ✅ Spaces bucket (existing - `contrezz-uploads`)
- ✅ Spaces access keys (existing)

### **2. Environment Variables Required:**

```bash
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# DigitalOcean Spaces
SPACES_ACCESS_KEY_ID=...
SPACES_SECRET_ACCESS_KEY=...
SPACES_REGION=nyc3
SPACES_BUCKET=contrezz-uploads
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com

# Dojah API
DOJAH_API_KEY=...
DOJAH_APP_ID=...

# Security
ENCRYPTION_KEY=... (32-byte hex string)
API_KEY_MAIN_DASHBOARD=... (for main backend to call verification service)

# Main Dashboard
MAIN_DASHBOARD_URL=https://your-backend.ondigitalocean.app

# Node
NODE_ENV=production
PORT=8080
```

---

## 📝 Deployment Options

### **Option 1: Deploy as Separate App (Recommended)**

**Pros:**

- ✅ Independent scaling
- ✅ Isolated failures
- ✅ Easier monitoring
- ✅ Can use different instance sizes

**Cons:**

- ❌ Costs ~$12/month extra
- ❌ Requires separate database ($15/month)

### **Option 2: Deploy in Same App as Worker**

**Pros:**

- ✅ Lower cost (no extra app)
- ✅ Can share database

**Cons:**

- ❌ Coupled deployment
- ❌ Harder to scale independently
- ❌ Shared resources

**Recommendation:** Use **Option 1** for production, **Option 2** for dev/staging.

---

## 🚀 Deployment Steps

### **Step 1: Create Verification Database**

```bash
# Using DigitalOcean CLI (doctl)
doctl databases create verification-db-prod \
  --engine pg \
  --version 15 \
  --size db-s-1vcpu-1gb \
  --region nyc3 \
  --num-nodes 1

# Or use the DigitalOcean web console:
# 1. Go to Databases → Create Database
# 2. Choose PostgreSQL 15
# 3. Size: Basic (1 vCPU, 1 GB RAM) - $15/month
# 4. Region: NYC3 (same as main app)
# 5. Name: verification-db-prod
```

**Get connection string:**

```bash
doctl databases connection verification-db-prod
```

### **Step 2: Create Redis Database**

```bash
# Using DigitalOcean CLI
doctl databases create verification-redis-prod \
  --engine redis \
  --version 7 \
  --size db-s-1vcpu-1gb \
  --region nyc3 \
  --num-nodes 1

# Or use web console:
# 1. Go to Databases → Create Database
# 2. Choose Redis 7
# 3. Size: Basic (1 vCPU, 1 GB RAM) - $15/month
# 4. Region: NYC3
# 5. Name: verification-redis-prod
```

**Get connection string:**

```bash
doctl databases connection verification-redis-prod
```

### **Step 3: Run Database Migrations**

```bash
# Connect to verification database
export DATABASE_URL="postgresql://user:pass@host:port/db"

# Run migrations
cd verification-service
npx prisma migrate deploy

# Seed API key
npx prisma db seed
```

### **Step 4: Create App Platform Service**

#### **Option A: Using DigitalOcean Web Console**

1. **Go to App Platform → Create App**
2. **Connect GitHub Repository:**

   - Repository: `oluwaseyiolukoya/propertyhub_v1`
   - Branch: `main`
   - Source Directory: `/verification-service`

3. **Configure Service:**

   - **Name:** `verification-service`
   - **Type:** Web Service
   - **Instance Size:** Basic (512 MB RAM, 1 vCPU) - $12/month
   - **Build Command:**
     ```bash
     npm ci && npx prisma generate && npm run build
     ```
   - **Run Command:**
     ```bash
     npm run start
     ```
   - **HTTP Port:** `8080`
   - **Health Check Path:** `/health`

4. **Add Environment Variables:**

   ```
   NODE_ENV=production
   PORT=8080
   DATABASE_URL=${verification-db.DATABASE_URL}
   REDIS_URL=${verification-redis.REDIS_URL}
   SPACES_ACCESS_KEY_ID=<from-spaces>
   SPACES_SECRET_ACCESS_KEY=<from-spaces>
   SPACES_REGION=nyc3
   SPACES_BUCKET=contrezz-uploads
   SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
   DOJAH_API_KEY=<your-dojah-key>
   DOJAH_APP_ID=<your-dojah-app-id>
   ENCRYPTION_KEY=<generate-with-script>
   API_KEY_MAIN_DASHBOARD=<generate-with-script>
   MAIN_DASHBOARD_URL=https://your-backend.ondigitalocean.app
   ```

5. **Create App**

#### **Option B: Using Terraform**

```hcl
# Add to terraform/digitalocean/main.tf

resource "digitalocean_database_cluster" "verification_postgres" {
  name       = "verification-db-prod"
  engine     = "pg"
  version    = "15"
  size       = "db-s-1vcpu-1gb"
  region     = "nyc3"
  node_count = 1
}

resource "digitalocean_database_cluster" "verification_redis" {
  name       = "verification-redis-prod"
  engine     = "redis"
  version    = "7"
  size       = "db-s-1vcpu-1gb"
  region     = "nyc3"
  node_count = 1
}

resource "digitalocean_app" "verification_service" {
  spec {
    name   = "verification-service"
    region = "nyc"

    service {
      name               = "verification-api"
      instance_count     = 1
      instance_size_slug = "basic-xxs"

      github {
        repo           = "oluwaseyiolukoya/propertyhub_v1"
        branch         = "main"
        deploy_on_push = true
      }

      source_dir = "/verification-service"

      build_command = "npm ci && npx prisma generate && npm run build"
      run_command   = "npm run start"

      health_check {
        http_path             = "/health"
        initial_delay_seconds = 30
        period_seconds        = 10
      }

      env {
        key   = "NODE_ENV"
        value = "production"
      }

      env {
        key   = "PORT"
        value = "8080"
      }

      env {
        key   = "DATABASE_URL"
        value = digitalocean_database_cluster.verification_postgres.private_uri
        type  = "SECRET"
      }

      env {
        key   = "rediss://default:AVtkAAIncDJkZWVmMmQxMmZmZTE0YTM2YjUxZjhkMDMyYTYwODdhY3AyMjMzOTY@relaxed-quail-23396.upstash.io:6379"
        value = digitalocean_database_cluster.verification_redis.private_uri
        type  = "SECRET"
      }

      # Add other env vars...

      http_port = 8080
    }
  }
}
```

Then run:

```bash
cd terraform/digitalocean
terraform plan
terraform apply
```

### **Step 5: Update Main Backend**

Add environment variable to main backend:

```bash
VERIFICATION_SERVICE_URL=https://verification-service-xxxxx.ondigitalocean.app
VERIFICATION_API_KEY=<same-as-API_KEY_MAIN_DASHBOARD>
```

Redeploy main backend to pick up new env vars.

### **Step 6: Verify Deployment**

```bash
# Check health
curl https://verification-service-xxxxx.ondigitalocean.app/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-11-26T...",
  "uptime": 123.456,
  "service": "verification-service",
  "version": "1.0.0",
  "dependencies": {
    "database": "ok",
    "redis": "ok"
  }
}
```

---

## 🔧 Post-Deployment Configuration

### **1. Database Firewall Rules**

Ensure verification database allows connections from verification service:

```bash
# Get app ID
doctl apps list

# Add firewall rule
doctl databases firewalls append <verification-db-id> \
  --rule "type:app,value:<verification-app-id>"
```

### **2. Spaces CORS Configuration**

Already configured in `contrezz-uploads` bucket:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### **3. Redis Configuration**

No special configuration needed - managed by DigitalOcean.

### **4. Monitoring Setup**

Enable monitoring in App Platform:

- CPU usage alerts
- Memory usage alerts
- Error rate alerts
- Response time alerts

---

## 💰 Cost Breakdown

### **Production (Separate App):**

```
Main Backend:          $12/month  (existing)
Main Database:         $15/month  (existing)
Verification Service:  $12/month  (NEW)
Verification Database: $15/month  (NEW)
Redis:                 $15/month  (NEW)
Spaces:                $5/month   (existing, 250GB included)
────────────────────────────────────────
Total NEW costs:       $42/month
Total (all services):  $74/month
```

### **Development (Shared App):**

```
Main Backend:          $12/month
Main Database:         $15/month  (shared)
Redis:                 $15/month
Spaces:                $5/month
────────────────────────────────────────
Total:                 $47/month
```

---

## 🧪 Testing Checklist

After deployment, test:

- [ ] Health endpoint responds
- [ ] Database connection works
- [ ] Redis connection works
- [ ] Spaces upload works
- [ ] Spaces download works
- [ ] Main backend can call verification service
- [ ] KYC submission works
- [ ] Document upload works
- [ ] Admin can view documents
- [ ] Admin can approve/reject
- [ ] Emails are sent
- [ ] Dojah API integration works

---

## 🔒 Security Checklist

- [ ] All secrets in environment variables (not code)
- [ ] Database firewall rules configured
- [ ] API key authentication enabled
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Encryption key is secure (32-byte random)
- [ ] Spaces bucket has proper ACLs
- [ ] HTTPS enforced
- [ ] No sensitive data in logs

---

## 📊 Monitoring

### **Key Metrics to Watch:**

1. **API Response Time**

   - Target: < 500ms for document upload
   - Target: < 200ms for status checks

2. **Error Rate**

   - Target: < 1% of requests

3. **Database Connections**

   - Monitor pool usage
   - Alert if > 80% utilized

4. **Redis Queue Length**

   - Target: < 100 pending jobs
   - Alert if > 500 jobs

5. **Spaces Storage**
   - Monitor usage (250GB included)
   - Alert at 80% capacity

### **Logging:**

View logs:

```bash
doctl apps logs <verification-app-id> --type run
doctl apps logs <verification-app-id> --type build
```

---

## 🐛 Troubleshooting

### **Issue: Health check fails**

```bash
# Check logs
doctl apps logs <app-id> --type run

# Common causes:
# 1. Database connection failed
# 2. Redis connection failed
# 3. Port mismatch (must be 8080)
# 4. Build failed
```

### **Issue: Document upload fails**

```bash
# Check Spaces credentials
# Verify SPACES_ACCESS_KEY_ID and SPACES_SECRET_ACCESS_KEY

# Test connection
curl -X POST https://verification-service.../api/verification/upload/test-request-id \
  -H "X-API-Key: $API_KEY" \
  -F "file=@test.pdf" \
  -F "documentType=passport"
```

### **Issue: Main backend can't reach verification service**

```bash
# Check API key matches
echo $VERIFICATION_API_KEY  # in main backend
echo $API_KEY_MAIN_DASHBOARD  # in verification service

# Check URL is correct
curl https://verification-service.../health
```

---

## 🔄 Rollback Plan

If deployment fails:

1. **Revert code:**

   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Rollback database:**

   ```bash
   cd verification-service
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

3. **Disable verification service:**
   - Set `VERIFICATION_SERVICE_URL=` (empty) in main backend
   - KYC will be disabled temporarily

---

## 📚 Related Documentation

- [Verification Service README](verification-service/README.md)
- [Dojah Integration Guide](verification-service/DOJAH_INTEGRATION.md)
- [DigitalOcean Spaces Setup](DIGITALOCEAN_SPACES_SETUP_GUIDE.md)
- [Testing Guide](VERIFICATION_SERVICE_TESTING_GUIDE.md)

---

## ✅ Deployment Checklist

### **Pre-Deployment:**

- [ ] Code pushed to GitHub
- [ ] Migrations tested locally
- [ ] Environment variables prepared
- [ ] Dojah API credentials obtained
- [ ] Spaces bucket configured

### **Deployment:**

- [ ] Verification database created
- [ ] Redis database created
- [ ] Migrations applied
- [ ] API key seeded
- [ ] App Platform service created
- [ ] Environment variables configured
- [ ] Main backend updated with verification URL

### **Post-Deployment:**

- [ ] Health check passes
- [ ] All tests pass
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Team notified

---

**Last Updated:** November 26, 2025  
**Status:** ✅ READY FOR DEPLOYMENT  
**Estimated Time:** 2-3 hours
