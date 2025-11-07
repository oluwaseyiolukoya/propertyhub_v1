# DigitalOcean Deployment Guide

Complete guide to deploy Contrezz SaaS to DigitalOcean using App Platform.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment Steps](#post-deployment-steps)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

✅ **Before you start:**
- DigitalOcean account with billing enabled
- Git repository connected to DigitalOcean
- Domain name (optional but recommended)
- Paystack account for payments (optional)

---

## Architecture Overview

Your deployment will consist of:

```
┌─────────────────────────────────────────────┐
│           DigitalOcean App Platform         │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐   │
│  │   Frontend   │      │   Backend    │   │
│  │   (React)    │─────▶│  (Node.js)   │   │
│  │   Static     │      │   Express    │   │
│  └──────────────┘      └──────┬───────┘   │
│                               │            │
│                               ▼            │
│                        ┌──────────────┐   │
│                        │  PostgreSQL  │   │
│                        │   Database   │   │
│                        └──────────────┘   │
└─────────────────────────────────────────────┘
```

---

## Database Setup

### Step 1: Create Managed PostgreSQL Database

1. **Navigate to Databases:**
   - Go to DigitalOcean Dashboard
   - Click "Create" → "Databases"

2. **Configure Database:**
   ```
   Database Engine: PostgreSQL 15 or 16
   Plan: Basic ($15/month minimum)
   Datacenter Region: Choose closest to your users
   Database Name: contrezz-db
   ```

3. **Create Database:**
   - Click "Create Database Cluster"
   - Wait 3-5 minutes for provisioning

4. **Get Connection Details:**
   - Click on your database cluster
   - Go to "Connection Details"
   - Copy the "Connection String" (starts with `postgresql://`)
   - **Save this - you'll need it for environment variables**

5. **Configure Trusted Sources:**
   - Go to "Settings" → "Trusted Sources"
   - Add "All App Platform Apps" (recommended)
   - Or add specific IP addresses

### Step 2: Create Database User (Optional but Recommended)

```sql
-- Connect to your database using the connection string
-- Then run these commands:

CREATE DATABASE contrezz;
CREATE USER contrezz_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE contrezz TO contrezz_user;
```

---

## Backend Deployment

### Step 1: Create Backend App

1. **Go to App Platform:**
   - Dashboard → "Apps" → "Create App"

2. **Connect Repository:**
   - Select your Git provider (GitHub/GitLab)
   - Choose your repository
   - Select branch: `main` or `feat/auth-hardening-and-ux-fixes-20251020`

3. **Configure Backend Service:**
   ```yaml
   Name: contrezz-backend
   Type: Web Service
   Source Directory: /backend
   Build Command: npm install && npm run build
   Run Command: npm start
   Port: 5000
   Instance Size: Basic (512 MB RAM, 1 vCPU) - $5/month
   Instance Count: 1
   ```

4. **Environment Variables** (see section below)

5. **Health Check:**
   ```
   HTTP Path: /api/health
   Port: 5000
   ```

### Step 2: Backend Build Configuration

Create a file at `/backend/.do/app.yaml`:

```yaml
name: contrezz-backend
services:
  - name: backend
    source_dir: backend
    github:
      branch: main
      deploy_on_push: true
    build_command: npm install && npm run build
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 5000
    health_check:
      http_path: /api/health
    envs:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "5000"
      # Add other environment variables (see Environment Variables section)
```

---

## Frontend Deployment

### Step 1: Create Frontend App

1. **Add Frontend to Same App:**
   - In your App Platform app
   - Click "Create" → "Component"
   - Select "Static Site"

2. **Configure Frontend:**
   ```yaml
   Name: contrezz-frontend
   Type: Static Site
   Source Directory: /
   Build Command: npm install && npm run build
   Output Directory: dist
   Instance Size: Basic - $3/month
   ```

3. **Environment Variables** (Build-time):
   ```
   VITE_API_URL=https://your-backend-app.ondigitalocean.app
   ```

### Step 2: Frontend Build Configuration

Update `/vite.config.ts` for production:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-hook-form'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

### Step 3: Add Frontend Environment File

Create `.env.production`:

```bash
VITE_API_URL=https://your-backend-app.ondigitalocean.app
```

---

## Environment Variables

### Backend Environment Variables

Set these in DigitalOcean App Platform → Backend Service → Settings → Environment Variables:

#### Required Variables:

```bash
# Database
DATABASE_URL=${db.DATABASE_URL}  # Use DigitalOcean's database binding

# Server
PORT=5000
NODE_ENV=production

# JWT Authentication (GENERATE NEW SECRET!)
JWT_SECRET=<generate-using-command-below>
JWT_EXPIRES_IN=7d

# CORS - Frontend URL
FRONTEND_URL=https://your-frontend-app.ondigitalocean.app

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

#### Optional Variables:

```bash
# Payment Gateway - Platform Level (for subscription billing)
PAYSTACK_SECRET_KEY=sk_live_xxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
PAYSTACK_TEST_SECRET_KEY=sk_test_xxxxx
PAYSTACK_TEST_PUBLIC_KEY=pk_test_xxxxx

# Redis (for Socket.io scaling - optional)
REDIS_URL=redis://default:password@host:port

# Email (for future features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Generate JWT Secret:

Run this command locally:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and use it as `JWT_SECRET`.

### Frontend Environment Variables

Set these in DigitalOcean App Platform → Frontend Service → Settings → Environment Variables:

```bash
# Backend API URL (use your backend app URL)
VITE_API_URL=https://contrezz-backend-xxxxx.ondigitalocean.app
```

---

## Post-Deployment Steps

### Step 1: Run Database Migrations

After backend deployment, you need to initialize the database:

1. **Access Backend Console:**
   - Go to your backend service in App Platform
   - Click "Console" tab
   - Click "Launch Console"

2. **Run Prisma Commands:**
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Push database schema
   npx prisma db push --accept-data-loss
   
   # Seed initial data
   npm run prisma:seed
   ```

3. **Verify Database:**
   ```bash
   # Check if tables were created
   npx prisma studio
   ```

### Step 2: Test Super Admin Login

1. **Get Super Admin Credentials:**
   - Check the seed script output in the console
   - Default credentials (from seed):
     ```
     Email: admin@contrezz.com
     Password: Admin123!@#
     ```

2. **Login to Application:**
   - Visit your frontend URL
   - Login with super admin credentials
   - Change password immediately!

### Step 3: Configure Custom Domain (Optional)

#### For Frontend:

1. **Add Domain:**
   - Go to Frontend Service → Settings → Domains
   - Click "Add Domain"
   - Enter your domain: `app.yourdomain.com`

2. **Configure DNS:**
   - Add CNAME record in your DNS provider:
     ```
     Type: CNAME
     Name: app
     Value: your-frontend-app.ondigitalocean.app
     TTL: 3600
     ```

3. **Enable SSL:**
   - DigitalOcean automatically provisions Let's Encrypt SSL
   - Wait 5-10 minutes for SSL activation

#### For Backend:

1. **Add Domain:**
   - Go to Backend Service → Settings → Domains
   - Click "Add Domain"
   - Enter your domain: `api.yourdomain.com`

2. **Configure DNS:**
   - Add CNAME record:
     ```
     Type: CNAME
     Name: api
     Value: your-backend-app.ondigitalocean.app
     TTL: 3600
     ```

3. **Update Environment Variables:**
   - Update `FRONTEND_URL` in backend to use custom domain
   - Update `VITE_API_URL` in frontend to use custom domain
   - Redeploy both services

### Step 4: Configure File Uploads

DigitalOcean App Platform has ephemeral storage. For persistent file uploads:

**Option A: Use DigitalOcean Spaces (Recommended)**

1. **Create Space:**
   - Dashboard → "Spaces" → "Create Space"
   - Choose region closest to your app
   - Name: `contrezz-uploads`

2. **Get Credentials:**
   - Go to API → Spaces Keys
   - Generate new key
   - Save Access Key and Secret Key

3. **Update Backend Code:**
   - Install AWS SDK: `npm install @aws-sdk/client-s3`
   - Update file upload logic to use Spaces
   - Add environment variables:
     ```bash
     SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
     SPACES_BUCKET=contrezz-uploads
     SPACES_KEY=your-access-key
     SPACES_SECRET=your-secret-key
     ```

**Option B: Use Volume (Simpler but Limited)**

1. **Create Volume:**
   - Dashboard → "Volumes" → "Create Volume"
   - Size: 10 GB minimum
   - Region: Same as your app

2. **Attach to Backend:**
   - Go to Backend Service → Settings → Volumes
   - Mount path: `/uploads`
   - Update `UPLOAD_DIR=/uploads` in environment variables

---

## Monitoring & Maintenance

### Application Monitoring

1. **View Logs:**
   - Go to your service → "Runtime Logs"
   - Filter by severity: Info, Warning, Error
   - Download logs for analysis

2. **Resource Usage:**
   - Go to service → "Insights"
   - Monitor CPU, Memory, Bandwidth
   - Scale up if consistently high (>80%)

3. **Uptime Monitoring:**
   - Use DigitalOcean's built-in monitoring
   - Or integrate external service (UptimeRobot, Pingdom)

### Database Monitoring

1. **Database Metrics:**
   - Go to Database → "Metrics"
   - Monitor connections, queries/sec, storage

2. **Backups:**
   - DigitalOcean automatically backs up daily
   - Go to Database → "Backups" to restore

3. **Connection Pooling:**
   - Add `?connection_limit=10` to DATABASE_URL
   - Prevents connection exhaustion

### Performance Optimization

1. **Enable Caching:**
   - Add Redis for session storage
   - Cache frequently accessed data

2. **CDN for Static Assets:**
   - DigitalOcean automatically serves static files via CDN

3. **Database Optimization:**
   - Add indexes for frequently queried fields
   - Run `ANALYZE` periodically

### Scaling

**Vertical Scaling (More Resources):**
- Go to service → Settings → Resources
- Upgrade instance size
- Restart required

**Horizontal Scaling (More Instances):**
- Go to service → Settings → Resources
- Increase instance count
- Requires Redis for Socket.io

---

## Troubleshooting

### Common Issues

#### 1. Build Fails

**Symptoms:** Deployment fails during build phase

**Solutions:**
```bash
# Check build logs
# Common fixes:

# Missing dependencies
npm install --legacy-peer-deps

# TypeScript errors
npm run build:check

# Prisma issues
npx prisma generate
```

#### 2. Database Connection Fails

**Symptoms:** Backend logs show `Error: P1001: Can't reach database server`

**Solutions:**
- Verify DATABASE_URL is correct
- Check database is running (Database → Overview)
- Add App Platform to trusted sources (Database → Settings → Trusted Sources)
- Check connection limit: `?connection_limit=10`

#### 3. CORS Errors

**Symptoms:** Frontend shows `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solutions:**
- Verify `FRONTEND_URL` in backend environment variables
- Check it matches your frontend domain exactly (no trailing slash)
- Redeploy backend after changing

#### 4. 502 Bad Gateway

**Symptoms:** Frontend shows 502 error

**Solutions:**
- Check backend is running (Backend → Overview)
- Verify health check endpoint works: `/api/health`
- Check backend logs for startup errors
- Verify PORT environment variable is set to 5000

#### 5. File Uploads Fail

**Symptoms:** Uploaded files disappear after restart

**Solutions:**
- App Platform has ephemeral storage
- Use DigitalOcean Spaces (see File Uploads section)
- Or attach a Volume to backend service

#### 6. WebSocket Connection Fails

**Symptoms:** Real-time features don't work

**Solutions:**
- Verify Socket.io is configured for production
- Check CORS settings include WebSocket upgrade
- Use polling transport as fallback:
  ```typescript
  const socket = io(API_URL, {
    transports: ['websocket', 'polling']
  });
  ```

### Debug Mode

Enable detailed logging:

1. **Backend:**
   ```bash
   # Add to environment variables
   DEBUG=express:*,socket.io:*
   LOG_LEVEL=debug
   ```

2. **Frontend:**
   ```bash
   # Add to browser console
   localStorage.setItem('debug', '*');
   ```

### Health Check Endpoints

Test these endpoints after deployment:

```bash
# Backend health
curl https://your-backend-app.ondigitalocean.app/api/health

# Database connectivity
curl https://your-backend-app.ondigitalocean.app/api/system/health

# Frontend
curl https://your-frontend-app.ondigitalocean.app
```

---

## Cost Estimation

### Minimum Setup (~$25/month):

```
Backend (Basic):        $5/month
Frontend (Static):      $3/month
Database (Basic):      $15/month
Bandwidth:             $0-5/month (1TB included)
─────────────────────────────────
Total:                ~$25/month
```

### Recommended Setup (~$50/month):

```
Backend (Pro):         $12/month
Frontend (Static):      $3/month
Database (Standard):   $30/month
Spaces (10GB):          $5/month
Redis (optional):      $15/month
─────────────────────────────────
Total:                ~$50-65/month
```

### Production Setup (~$100/month):

```
Backend (Pro, 2x):     $24/month
Frontend (Static):      $3/month
Database (Premium):    $60/month
Spaces (50GB):         $10/month
Redis:                 $15/month
Load Balancer:         $10/month
─────────────────────────────────
Total:               ~$120/month
```

---

## Security Checklist

Before going live:

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET (64+ characters)
- [ ] Use production Paystack keys (not test keys)
- [ ] Enable HTTPS (automatic with custom domain)
- [ ] Configure database firewall (trusted sources only)
- [ ] Set up database backups (automatic daily)
- [ ] Enable rate limiting in backend
- [ ] Review CORS settings
- [ ] Set secure cookie flags in production
- [ ] Enable Helmet.js security headers (already configured)
- [ ] Set up monitoring and alerts
- [ ] Document admin credentials securely
- [ ] Test password reset flow
- [ ] Verify file upload restrictions

---

## Next Steps

After successful deployment:

1. **Test All Features:**
   - User registration and login
   - Property creation
   - Tenant management
   - Payment processing
   - Document uploads
   - Real-time notifications

2. **Set Up Monitoring:**
   - Configure uptime monitoring
   - Set up error tracking (Sentry, Rollbar)
   - Enable performance monitoring

3. **Create Backups:**
   - Test database restore process
   - Export environment variables
   - Document deployment process

4. **Marketing:**
   - Add custom domain
   - Set up email service
   - Configure SEO metadata
   - Add analytics (Google Analytics, Plausible)

---

## Support Resources

- **DigitalOcean Docs:** https://docs.digitalocean.com/products/app-platform/
- **Prisma Docs:** https://www.prisma.io/docs/
- **Paystack Docs:** https://paystack.com/docs/
- **Community Forum:** https://www.digitalocean.com/community/

---

## Quick Reference Commands

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Test backend locally
cd backend && npm run dev

# Test frontend locally
npm run dev

# Build frontend
npm run build

# Run Prisma migrations
npx prisma migrate deploy

# Seed database
npm run prisma:seed

# View Prisma Studio
npx prisma studio

# Check TypeScript
npm run build:check
```

---

**Last Updated:** October 31, 2025
**Version:** 1.0.0

