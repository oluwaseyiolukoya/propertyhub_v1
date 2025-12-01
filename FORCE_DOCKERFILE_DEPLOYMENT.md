# 🚀 Force Dockerfile Deployment - Expert DevOps Guide

## 🎯 **Problem Summary**

**Issue:** DigitalOcean keeps using Node.js buildpack instead of Dockerfile, causing `dist/index.js` not found error.

**Root Cause:** Buildpack's layered filesystem doesn't persist `dist/` folder to runtime container.

**Solution:** Force DigitalOcean to use Dockerfile-based deployment.

---

## 📋 **Method 1: Update Existing App in UI (Recommended)**

### **Step 1: Navigate to App Settings**

1. Go to: https://cloud.digitalocean.com/apps
2. Click `propertyhub-v1-verification-serv`
3. Click **"Settings"** tab
4. Under **"Components"**, click your service component

### **Step 2: Find Build Configuration**

Look for one of these sections:
- "Build & Deploy"
- "Build Configuration"
- "Build Type"
- "Resource Type"

### **Step 3: Configure Dockerfile**

You should see options like:

**Option A: Dropdown Menu**
```
Build Type: [Buildpack ▼]
Change to: [Dockerfile ▼]
```

**Option B: Dockerfile Path Field**
```
Dockerfile Path: [empty]
Fill in: Dockerfile
```

**Option C: Resource Type**
```
Resource Type: [Buildpack ▼]
Change to: [Dockerfile ▼]
```

### **Step 4: Set Correct Paths**

Configure these fields:

| Field | Value |
|-------|-------|
| **Source Directory** | `verification-service` |
| **Dockerfile Path** | `Dockerfile` |
| **Build Command** | *Leave EMPTY* |
| **Run Command** | *Leave EMPTY* |
| **HTTP Port** | `8080` |
| **Health Check Path** | `/health` |

### **Step 5: Save and Deploy**

1. Click **"Save"**
2. Click **"Actions"** (top-right)
3. Click **"Force Rebuild and Deploy"**

---

## 📋 **Method 2: Use App Spec File (Alternative)**

If Method 1 doesn't work or you can't find Dockerfile options:

### **Step 1: Update from App Spec**

1. In your app page, click **"Settings"** tab
2. Scroll to **"App Spec"**
3. Click **"Edit"**
4. Replace the YAML with:

```yaml
name: propertyhub-v1-verification-serv
region: nyc

services:
  - name: verification-service
    # FORCE DOCKERFILE
    dockerfile_path: verification-service/Dockerfile
    source_dir: /
    
    github:
      repo: oluwaseyiolukoya/propertyhub_v1
      branch: main
      deploy_on_push: true
    
    instance_count: 2
    instance_size_slug: basic-xs
    
    http_port: 8080
    
    health_check:
      http_path: /health
      initial_delay_seconds: 30
      period_seconds: 10
      timeout_seconds: 5
      success_threshold: 1
      failure_threshold: 3
    
    envs:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "8080"
      # Add other env vars here

databases:
  - name: production-database
    engine: PG
    production: true
```

5. Click **"Save"**
6. Click **"Deploy"**

---

## 📋 **Method 3: Delete and Recreate (Last Resort)**

If both methods above fail:

### **Step 1: Export Current Configuration**

1. Go to your app → Settings → App Spec
2. **Copy the entire YAML** (backup)
3. Note all environment variables
4. Note database attachments

### **Step 2: Create New App**

1. Click **"Create App"**
2. Choose **"GitHub"**
3. Repository: `oluwaseyiolukoya/propertyhub_v1`
4. Branch: `main`
5. **IMPORTANT:** When asked "How to build":
   - Select **"Dockerfile"**
   - Dockerfile path: `verification-service/Dockerfile`
   - Context directory: `verification-service`

### **Step 3: Configure Service**

- Name: `verification-service`
- HTTP Port: `8080`
- Health Check: `/health`
- Instance: Basic (1 GB RAM)

### **Step 4: Add Environment Variables**

Add all 14 environment variables from your backup.

### **Step 5: Attach Database**

Attach `private-verification-db-prod` database.

### **Step 6: Deploy**

Click **"Create Resources"** and wait for deployment.

### **Step 7: Update Main Backend**

Update `contrezz-backend-prod` environment variables:
```
VERIFICATION_SERVICE_URL=https://new-app-url.ondigitalocean.app
```

### **Step 8: Delete Old App**

Once new app works, delete the old `propertyhub-v1-verification-serv`.

---

## ✅ **How to Verify Dockerfile is Being Used**

### **During Build (Watch Logs):**

**✅ CORRECT (Docker):**
```
Step 1/18 : FROM node:20-alpine AS builder
 ---> 1234567890ab
Step 2/18 : WORKDIR /app
 ---> Running in abcdef123456
Step 3/18 : COPY package*.json ./
 ---> 234567890abc
...
Step 10/18 : RUN npm run build
 ---> Running in def123456789
> contrezz-verification-service@1.0.0 build
> prisma generate && npx swc src -d dist --copy-files
✔ Generated Prisma Client
Successfully compiled: 23 files with swc
 ---> 345678901bcd
Step 11/18 : RUN ls -la dist/ && test -f dist/index.js
total 120
drwxr-xr-x    2 root     root          4096 Nov 26 14:30 .
drwxr-xr-x    1 root     root          4096 Nov 26 14:30 ..
-rw-r--r--    1 root     root          1234 Nov 26 14:30 index.js
...
✅ dist/index.js exists
 ---> 456789012cde
...
Step 18/18 : CMD ["npm", "start"]
 ---> Running in 567890123def
Successfully built 678901234efg
Successfully tagged registry.digitalocean.com/...
```

**❌ WRONG (Buildpack):**
```
=====> Cloning repository...
=====> Detecting buildpacks...
Detected the following buildpacks:
   digitalocean/nodejs-appdetect  v0.0.6
   heroku/nodejs                  v0.296.5
...
-----> Installing dependencies
-----> Build
-----> Pruning devDependencies
```

### **During Runtime (Watch Logs):**

**✅ CORRECT (Docker):**
```
> npm start
> node dist/index.js

[Verification Service] Starting...
[Verification Service] Environment: production
[Verification Service] Port: 8080
[Verification Service] Connected to database
[Verification Service] Connected to Redis
[Verification Service] Server listening on port 8080
```

**❌ WRONG (Buildpack):**
```
> npm start
> node dist/index.js

Error: Cannot find module '/workspace/verification-service/dist/index.js'
```

---

## 🔍 **Troubleshooting**

### **Issue 1: Still seeing buildpack logs**

**Solution:**
- Dockerfile path might be wrong
- Try: `verification-service/Dockerfile` (full path from repo root)
- Or try: `Dockerfile` (relative to source directory)

### **Issue 2: Build fails at "COPY . ."**

**Solution:**
- Check `.dockerignore` doesn't exclude source files
- Verify `verification-service/` directory exists in repo

### **Issue 3: "Dockerfile not found"**

**Solution:**
- Verify Dockerfile exists: `verification-service/Dockerfile`
- Check it's committed to git: `git ls-files verification-service/Dockerfile`
- Try full path: `verification-service/Dockerfile`

### **Issue 4: Build succeeds but still MODULE_NOT_FOUND**

**Solution:**
- You're STILL on buildpack mode
- Check logs for "Step 1/18 : FROM node:20-alpine"
- If you don't see Docker steps, Dockerfile isn't being used

---

## 📊 **Expected Timeline**

Once Dockerfile is properly configured:

- **Build:** ~5-7 minutes (Docker multi-stage build)
- **Deploy:** ~1-2 minutes (container startup)
- **Health Check:** ~30 seconds (waiting for /health to return 200)

**Total: ~7-10 minutes**

---

## 🎯 **Success Criteria**

Deployment is successful when you see:

1. ✅ Build logs show Docker steps (`Step X/Y`)
2. ✅ Build logs show `✅ dist/index.js exists` (twice)
3. ✅ Runtime logs show `[Verification Service] Starting...`
4. ✅ Runtime logs show `Server listening on port 8080`
5. ✅ Health check passes (no "connection refused" errors)
6. ✅ App status shows "Deployed" (green)
7. ✅ Can curl `https://your-app-url.ondigitalocean.app/health` successfully

---

## 🚨 **If All Else Fails**

Contact DigitalOcean Support with this message:

```
Subject: Unable to force Dockerfile deployment for Node.js app

Hello,

I have a Node.js service with a Dockerfile at `verification-service/Dockerfile` 
in my repository `oluwaseyiolukoya/propertyhub_v1`.

Despite multiple attempts to configure Dockerfile-based deployment, the app 
keeps using the Node.js buildpack, which is causing deployment failures.

I've tried:
1. Setting Dockerfile path in UI
2. Updating app spec YAML
3. Removing Procfile
4. Clearing build commands

The app continues to detect buildpacks instead of using my Dockerfile.

Can you help me force this specific service to use Dockerfile-based deployment?

App: propertyhub-v1-verification-serv
Region: NYC
Repository: oluwaseyiolukoya/propertyhub_v1
Dockerfile: verification-service/Dockerfile
```

---

## 📝 **Next Steps After Successful Deployment**

1. **Test Health Endpoint:**
   ```bash
   curl https://your-app-url.ondigitalocean.app/health
   ```

2. **Update Main Backend:**
   Add to `contrezz-backend-prod` environment variables:
   ```
   VERIFICATION_SERVICE_URL=https://your-app-url.ondigitalocean.app
   VERIFICATION_API_KEY=vkey_fd6967cc3dbc5d1650b21b580df6f8f49cb7ddd79f1abd04
   ```

3. **Test KYC Flow:**
   - Create test user
   - Upload documents
   - Verify backend can communicate with verification service

4. **Monitor Logs:**
   - Watch for any errors
   - Verify database connections
   - Verify Redis connections

---

**Last Updated:** November 26, 2025  
**Status:** ACTIVE - Use this guide to force Dockerfile deployment  
**Priority:** CRITICAL - Required for verification service to work



