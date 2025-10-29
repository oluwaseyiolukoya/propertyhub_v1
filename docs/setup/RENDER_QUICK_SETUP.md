# Render Quick Setup - TL;DR

Fast track guide for deploying to Render. See [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md) for detailed instructions.

## ✅ Changes Already Made

These configuration changes have been applied to your codebase:

1. ✅ **Updated `backend/package.json`**
   - Build script: `prisma generate && prisma migrate deploy`
   - Added postinstall: `prisma generate`

2. ✅ **Updated `backend/env.example`**
   - Added Paystack environment variables
   - Added Redis URL (optional)
   - Added deployment notes

3. ✅ **Health check endpoint exists**
   - `/health` endpoint already configured

4. ✅ **CORS configured**
   - Supports Vercel deployments
   - Dynamic origin handling

## 🚀 Render Setup Steps

### 1. Create Web Service

```
Dashboard → New + → Web Service
Repository: propertyhub_v1
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
```

### 2. Add PostgreSQL

```
Dashboard → New + → PostgreSQL
Name: propertyhub-db
Plan: Starter ($7/month)
Region: Same as web service
```

Copy **Internal Database URL** → Add to environment variables as `DATABASE_URL`

### 3. Environment Variables

**Required:**
```
NODE_ENV=production
DATABASE_URL=[from PostgreSQL addon]
JWT_SECRET=[generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
FRONTEND_URL=https://your-frontend.vercel.app
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
```

**Optional (for testing):**
```
PAYSTACK_TEST_SECRET_KEY=sk_test_...
PAYSTACK_TEST_PUBLIC_KEY=pk_test_...
```

**Optional (for scaling):**
```
REDIS_URL=[from Redis addon]
```

### 4. Configure Health Check

```
Settings → Health Check
Path: /health
```

### 5. Deploy

Click **"Create Web Service"** and wait for deployment.

## 🔗 Connect Frontend

Update your frontend environment variables:

```env
VITE_API_URL=https://your-backend.onrender.com
VITE_SOCKET_URL=https://your-backend.onrender.com
```

## 🧪 Test Deployment

```bash
# Health check
curl https://your-backend.onrender.com/health

# Should return:
# {"status":"ok","timestamp":"...","uptime":...}
```

## 📊 Monitor

- **Logs**: Dashboard → Your Service → Logs
- **Metrics**: Dashboard → Your Service → Metrics
- **Alerts**: Settings → Alerts

## 🆘 Common Issues

**Build fails with "Cannot find module '@prisma/client'"**
- Fixed by `postinstall: prisma generate` in package.json ✅

**CORS errors**
- Verify `FRONTEND_URL` matches your frontend exactly
- No trailing slash in URL

**Database connection fails**
- Use **Internal Database URL** (not External)
- Check database is in same region

**Service won't start**
- Check logs for errors
- Verify all required env vars are set

## 💰 Cost

**Minimum Production Setup:**
- Web Service (Starter): $7/month
- PostgreSQL (Starter): $7/month
- **Total: $14/month**

**With Redis (for scaling):**
- Add Redis (Starter): $10/month
- **Total: $24/month**

## 📚 Full Documentation

For detailed instructions, troubleshooting, and advanced configuration:
- [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)

---

**Ready to deploy?** Follow the steps above and you'll be live in ~10 minutes! 🚀

