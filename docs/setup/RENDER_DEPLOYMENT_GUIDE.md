# Render Deployment Guide - Backend

Complete guide for deploying the Contrezz backend to Render.com with all necessary configurations.

## 🚀 Quick Deployment Checklist

- [ ] Update `package.json` build script
- [ ] Create `.env.example` file
- [ ] Configure Render service settings
- [ ] Set environment variables
- [ ] Configure PostgreSQL database
- [ ] Set up Redis (optional for Socket.io scaling)
- [ ] Configure build and start commands
- [ ] Set up health check endpoint
- [ ] Configure CORS for production

## 📋 Required Configuration Changes

### 1. Update `backend/package.json`

Your current `package.json` needs a proper build script for production:

**Current:**
```json
"scripts": {
  "build": "echo 'Build complete - using tsx for runtime'",
  "start": "tsx src/index.ts"
}
```

**Update to:**
```json
"scripts": {
  "build": "prisma generate && prisma migrate deploy",
  "start": "tsx src/index.ts",
  "postinstall": "prisma generate"
}
```

**Why?**
- `prisma generate` creates the Prisma Client
- `prisma migrate deploy` applies migrations in production
- `postinstall` ensures Prisma Client is generated after npm install

### 2. Create Proper `.env.example`

Update `backend/env.example` to include all required variables:

```env
# Database (Render PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/database"

# Server
PORT=5000
NODE_ENV=production

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-in-production
JWT_EXPIRES_IN=7d

# CORS - Your frontend URL
FRONTEND_URL=https://your-app.vercel.app

# Payment Gateway (Paystack)
PAYSTACK_SECRET_KEY=sk_live_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_live_your_public_key
PAYSTACK_TEST_SECRET_KEY=sk_test_your_test_secret_key
PAYSTACK_TEST_PUBLIC_KEY=pk_test_your_test_public_key

# Redis (Optional - for Socket.io scaling)
REDIS_URL=redis://default:password@host:6379

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Email (Optional - for future use)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🔧 Render Service Configuration

### Step 1: Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the repository: `contrezz_v1`

### Step 2: Configure Service Settings

**Basic Settings:**
```
Name: contrezz-backend
Region: Choose closest to your users (e.g., Oregon, Frankfurt, Singapore)
Branch: main (or your production branch)
Root Directory: backend
```

**Build & Deploy:**
```
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
```

**Instance Type:**
```
Free (for testing)
Starter ($7/month - recommended for production)
Standard ($25/month - for high traffic)
```

### Step 3: Environment Variables

Add these in Render Dashboard → Environment → Environment Variables:

#### Required Variables

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Sets production mode |
| `PORT` | `5000` | Render auto-assigns, but set for consistency |
| `DATABASE_URL` | `[Auto-filled by Render]` | From PostgreSQL addon |
| `JWT_SECRET` | `[Generate strong secret]` | Min 32 characters |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Your frontend URL |

#### Platform Paystack (Optional - Only for Admin Subscriptions)

**Note:** These are ONLY needed if you're charging property owners for subscription plans. Individual property owners configure their own Paystack keys in the frontend, which are stored in the database.

| Key | Value | Purpose |
|-----|-------|---------|
| `PAYSTACK_SECRET_KEY` | `sk_live_your_platform_key` | Platform subscription billing only |
| `PAYSTACK_PUBLIC_KEY` | `pk_live_your_platform_key` | Platform subscription billing only |

**Not needed in Render environment:**
- ❌ Individual owner Paystack keys (configured per-owner in frontend)
- ❌ Test keys (use production keys only)

#### Optional (Recommended)

| Key | Value | Notes |
|-----|-------|-------|
| `REDIS_URL` | `[From Redis addon]` | For Socket.io scaling |
| `JWT_EXPIRES_IN` | `7d` | Token expiration |
| `MAX_FILE_SIZE` | `5242880` | 5MB file upload limit |

### Step 4: Add PostgreSQL Database

1. In your Render service, go to **"Environment"** tab
2. Click **"Add Database"** or create separately:
   - Go to Dashboard → **"New +"** → **"PostgreSQL"**
   - Name: `contrezz-db`
   - Plan: Free (for testing) or Starter ($7/month)
   - Region: Same as your web service
3. Copy the **Internal Database URL** to `DATABASE_URL` environment variable

**Important:** Use the **Internal Database URL** (faster, free bandwidth within Render)

### Step 5: Add Redis (Optional - for Scaling)

For Socket.io scaling across multiple instances:

1. Go to Dashboard → **"New +"** → **"Redis"**
2. Name: `contrezz-redis`
3. Plan: Free (for testing) or Starter ($10/month)
4. Copy the **Internal Redis URL** to `REDIS_URL` environment variable

**Note:** Redis is optional. Your app will work without it using in-memory Socket.io.

## 🔐 Security Configuration

### 1. Generate Strong JWT Secret

```bash
# Generate a secure JWT secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use this value for `JWT_SECRET` in Render environment variables.

### 2. CORS Configuration

Your backend already supports dynamic CORS. Just set `FRONTEND_URL`:

```env
FRONTEND_URL=https://your-app.vercel.app
```

The backend will automatically allow:
- Your production frontend
- All Vercel preview URLs (*.vercel.app)
- Localhost (for development)

### 3. Helmet Security Headers

Already configured in `backend/src/index.ts`. No changes needed.

## 📊 Health Check Configuration

Render uses health checks to ensure your service is running.

**Already configured in your app:**
```
Endpoint: /health
Method: GET
Expected Status: 200
```

**Render Configuration:**
1. Go to **"Settings"** → **"Health Check"**
2. Set **Health Check Path**: `/health`
3. Save changes

## 🗄️ Database Migration

### Initial Deployment

On first deploy, Render will automatically run:
```bash
npm run build  # which runs: prisma generate && prisma migrate deploy
```

This applies all migrations to your production database.

### Subsequent Deployments

1. **Add new migration locally:**
   ```bash
   cd backend
   npx prisma migrate dev --name your_migration_name
   ```

2. **Commit and push:**
   ```bash
   git add backend/prisma/migrations
   git commit -m "feat: add new migration"
   git push
   ```

3. **Render auto-deploys** and runs `prisma migrate deploy`

### Manual Migration (if needed)

If you need to manually run migrations:

1. Go to Render Dashboard → Your Service → **"Shell"**
2. Run:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

## 🌱 Database Seeding

### Option 1: Manual Seeding via Shell

1. Go to Render Dashboard → Your Service → **"Shell"**
2. Run:
   ```bash
   cd backend
   npm run prisma:seed
   ```

### Option 2: One-time Deploy Hook

Add to `package.json`:
```json
"scripts": {
  "build": "prisma generate && prisma migrate deploy && npm run seed:prod",
  "seed:prod": "if [ \"$SEED_DATABASE\" = \"true\" ]; then tsx prisma/seed.ts; fi"
}
```

Then set environment variable temporarily:
```
SEED_DATABASE=true
```

Remove after first successful deploy.

## 🔍 Monitoring & Logs

### View Logs

1. Go to Render Dashboard → Your Service → **"Logs"**
2. Real-time logs show:
   - Application startup
   - API requests (Morgan logging)
   - Errors and warnings
   - Database connections

### Metrics

1. Go to **"Metrics"** tab
2. Monitor:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

### Alerts

Set up alerts in **"Settings"** → **"Alerts"**:
- Service down
- High CPU usage
- High memory usage
- Deploy failures

## 🚀 Deployment Process

### Automatic Deployment

Render auto-deploys when you push to your branch:

1. **Make changes locally**
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: your changes"
   git push origin main
   ```
3. **Render detects push** and starts build
4. **Build process:**
   - Install dependencies
   - Run `npm run build`
   - Generate Prisma Client
   - Apply migrations
5. **Deploy** new version
6. **Health check** verifies service is running

### Manual Deployment

1. Go to Render Dashboard → Your Service
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Or click **"Clear build cache & deploy"** for clean build

## 🔧 Troubleshooting

### Build Fails

**Error: "Cannot find module '@prisma/client'"**

**Solution:** Ensure `postinstall` script in `package.json`:
```json
"postinstall": "prisma generate"
```

**Error: "Migration failed"**

**Solution:** Check database connection and migration files:
```bash
# In Render Shell
cd backend
npx prisma migrate status
npx prisma migrate resolve --applied [migration_name]
```

### Service Won't Start

**Error: "Port already in use"**

**Solution:** Render assigns `PORT` automatically. Ensure your code uses:
```typescript
const PORT = process.env.PORT || 5000;
```

**Error: "Database connection failed"**

**Solution:** 
1. Check `DATABASE_URL` is set correctly
2. Verify database is running
3. Check database region matches service region

### CORS Errors

**Error: "CORS policy blocked"**

**Solution:** 
1. Verify `FRONTEND_URL` is set correctly
2. Check frontend URL matches exactly (https, no trailing slash)
3. Review CORS configuration in `backend/src/index.ts`

### Socket.io Connection Issues

**Error: "WebSocket connection failed"**

**Solution:**
1. Ensure your frontend connects to correct backend URL
2. Check Socket.io CORS settings
3. Verify Redis is running (if using Redis adapter)
4. Fallback to polling if WebSocket blocked:
   ```typescript
   // Frontend
   const socket = io(BACKEND_URL, {
     transports: ['websocket', 'polling']
   });
   ```

## 📱 Connect Frontend to Backend

### Update Frontend Environment Variables

In your Vercel/frontend deployment, set:

```env
VITE_API_URL=https://your-backend.onrender.com
VITE_SOCKET_URL=https://your-backend.onrender.com
```

### Update API Client

Your `src/lib/api-config.ts` should use:
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

## 🎯 Production Checklist

Before going live:

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Set production `DATABASE_URL`
- [ ] Configure production `FRONTEND_URL`
- [ ] Add Paystack live keys
- [ ] Set up Redis (for scaling)
- [ ] Enable health checks
- [ ] Configure alerts
- [ ] Test all API endpoints
- [ ] Verify CORS works with frontend
- [ ] Test Socket.io connections
- [ ] Run database migrations
- [ ] Seed initial data (if needed)
- [ ] Monitor logs for errors
- [ ] Set up custom domain (optional)

## 🌐 Custom Domain (Optional)

### Add Custom Domain

1. Go to **"Settings"** → **"Custom Domains"**
2. Click **"Add Custom Domain"**
3. Enter your domain: `api.yourdomain.com`
4. Add DNS records as instructed:
   ```
   Type: CNAME
   Name: api
   Value: your-service.onrender.com
   ```
5. Wait for DNS propagation (5-30 minutes)
6. Render auto-provisions SSL certificate

### Update Environment Variables

After custom domain is active:
```env
# Update in frontend
VITE_API_URL=https://api.yourdomain.com
```

## 💰 Cost Estimation

### Free Tier
- **Web Service**: Free (spins down after 15 min inactivity)
- **PostgreSQL**: Free (90 days, then $7/month)
- **Redis**: Free (30 days, then $10/month)
- **Total**: Free for testing

### Production (Recommended)
- **Web Service**: Starter ($7/month) or Standard ($25/month)
- **PostgreSQL**: Starter ($7/month) - 1GB storage
- **Redis**: Starter ($10/month) - 25MB
- **Total**: $24-42/month

### High Traffic
- **Web Service**: Pro ($85/month) - Autoscaling
- **PostgreSQL**: Standard ($20/month) - 10GB storage
- **Redis**: Standard ($50/month) - 1GB
- **Total**: $155/month

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render Node.js Guide](https://render.com/docs/deploy-node-express-app)
- [Prisma on Render](https://render.com/docs/deploy-prisma)
- [Render PostgreSQL](https://render.com/docs/databases)
- [Render Redis](https://render.com/docs/redis)

## 🆘 Support

If you encounter issues:

1. Check Render logs for errors
2. Review this guide's troubleshooting section
3. Check [Render Community](https://community.render.com/)
4. Contact Render support (Starter plan and above)

---

**Last Updated**: October 2025  
**Tested On**: Render.com (Node.js runtime)

