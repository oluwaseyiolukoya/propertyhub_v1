# Contrezz Deployment Guide

## 🚨 Current Issue
Your frontend is deployed on Vercel (`https://contrezz-v1.vercel.app`) but cannot connect to the backend because:
1. Backend is only running on `localhost:5000` (not accessible from the internet)
2. Backend CORS is configured for `localhost:5173` (local development)

## ✅ Solution: Deploy Backend & Configure Environment Variables

---

## Step 1: Deploy Backend to Render (Free Tier)

### 1.1 Create a Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended for easier deployment)

### 1.2 Deploy Backend
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `oluwaseyiolukoya/contrezz_v1`
3. Configure the service:
   - **Name**: `contrezz-backend` (or any name you prefer)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### 1.3 Set Environment Variables on Render
Click "Environment" tab and add these variables:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=<your-postgres-database-url>
JWT_SECRET=<generate-a-secure-random-string>
FRONTEND_URL=https://contrezz-v1.vercel.app
```

**To get DATABASE_URL:**
1. In Render, click "New +" → "PostgreSQL"
2. Create a free PostgreSQL database
3. Copy the "Internal Database URL"
4. Use that as `DATABASE_URL`

**To generate JWT_SECRET:**
Run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1.4 Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Your backend URL will be: `https://contrezz-backend.onrender.com` (or similar)

---

## Step 2: Configure Vercel Environment Variables

### 2.1 Add Environment Variable to Vercel
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your `contrezz-v1` project
3. Go to "Settings" → "Environment Variables"
4. Add this variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://contrezz-backend.onrender.com` (your Render backend URL)
   - **Environment**: Select all (Production, Preview, Development)
5. Click "Save"

### 2.2 Redeploy Frontend
1. Go to "Deployments" tab
2. Click the three dots on the latest deployment
3. Click "Redeploy"
4. Wait for redeployment (2-3 minutes)

---

## Step 3: Initialize Database

### 3.1 Run Migrations on Render
1. In your Render dashboard, open your backend service
2. Go to "Shell" tab
3. Run these commands:
```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

Or if shell is not available, add this to your Build Command in Render:
```
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

---

## Alternative: Quick Fix for Testing (Temporary)

If you want to quickly test with your local backend:

### Update Backend CORS to Allow Multiple Origins

Edit `/Users/oluwaseyio/test_ui_figma_and_cursor/backend/src/index.ts`:

```typescript
// Replace line 53-56 with:
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://contrezz-v1.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### Expose Your Local Backend (Using ngrok - NOT RECOMMENDED FOR PRODUCTION)

1. Install ngrok:
```bash
npm install -g ngrok
```

2. Start your backend:
```bash
cd backend
npm run dev
```

3. In another terminal, expose it:
```bash
ngrok http 5000
```

4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

5. Add to Vercel environment variables:
   - **VITE_API_URL**: `https://abc123.ngrok.io`

6. Redeploy Vercel

⚠️ **Note**: ngrok URLs expire and change frequently. This is only for testing!

---

## Step 4: Verify Deployment

### 4.1 Test Backend Health
Visit: `https://contrezz-backend.onrender.com/health`

You should see:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": "...",
  "environment": "production"
}
```

### 4.2 Test Frontend
1. Visit: `https://contrezz-v1.vercel.app`
2. Try to log in
3. Check browser console - no CORS errors!

---

## Step 5: Create Environment Files (For Development)

### 5.1 Backend `.env` File

Create `/Users/oluwaseyio/test_ui_figma_and_cursor/backend/.env`:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/contrezz
JWT_SECRET=your-jwt-secret-here
FRONTEND_URL=http://localhost:5173
```

### 5.2 Frontend `.env` File

Create `/Users/oluwaseyio/test_ui_figma_and_cursor/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 5.3 Frontend `.env.production` File

Create `/Users/oluwaseyio/test_ui_figma_and_cursor/.env.production`:

```env
VITE_API_URL=https://contrezz-backend.onrender.com
```

---

## Common Issues & Solutions

### Issue: "Failed to load resource: net::ERR_FAILED"
**Solution**: Backend is not running or URL is incorrect. Verify backend URL.

### Issue: "CORS policy: Response to preflight request doesn't pass access control check"
**Solution**: Backend CORS not configured for Vercel domain. Update `FRONTEND_URL` environment variable in Render.

### Issue: "Database connection failed"
**Solution**: 
1. Check `DATABASE_URL` in Render environment variables
2. Ensure database is running
3. Run migrations: `npx prisma migrate deploy`

### Issue: "JWT_SECRET is not defined"
**Solution**: Add `JWT_SECRET` environment variable in Render.

### Issue: Render Free Tier Sleeping
**Render free tier services sleep after 15 minutes of inactivity.**

**Solutions**:
1. Upgrade to paid plan ($7/month)
2. Use a free uptime monitoring service like [UptimeRobot](https://uptimerobot.com) to ping your backend every 5 minutes
3. Accept the ~30 second cold start on first request

---

## Cost Breakdown

### Free Tier (Recommended for Testing)
- **Render Backend**: Free (with cold starts)
- **Render PostgreSQL**: Free (limited to 1GB storage)
- **Vercel Frontend**: Free (100GB bandwidth/month)
- **Total**: $0/month

### Production Tier (Recommended for Real Use)
- **Render Backend**: $7/month (no cold starts, more resources)
- **Render PostgreSQL**: $7/month (shared CPU, 1GB RAM, 10GB storage)
- **Vercel Frontend**: Free (or $20/month for Pro features)
- **Total**: $14-34/month

---

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Add environment variables to Vercel
3. ✅ Redeploy frontend
4. ✅ Test login
5. ✅ Set up database backup
6. ✅ Configure custom domain (optional)

---

## Support

If you encounter any issues:
1. Check Render logs: Dashboard → Your Service → Logs
2. Check Vercel logs: Dashboard → Your Project → Deployments → View Logs
3. Check browser console for errors
4. Verify all environment variables are set correctly

---

**Last Updated**: October 24, 2025  
**Status**: Ready for Deployment  
**Version**: 1.0.0

