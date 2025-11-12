# Contrezz Deployment Workflow

## 🚀 Overview

Your application is deployed on **DigitalOcean App Platform** with **automatic CI/CD** via GitHub integration.

**Production Environment:**

- Frontend: https://contrezz.com
- Backend API: https://api.contrezz.com/api/*
- Database: DigitalOcean Managed PostgreSQL

---

## 📋 Deployment Workflow

### 1️⃣ Local Development

**Start Local Environment:**

```bash
# Terminal 1: Start Backend
cd backend
npm install
npm run dev

# Terminal 2: Start Frontend
cd frontend
npm install
npm run dev
```

**Local URLs:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

**Environment Files:**

- Backend: `backend/.env` (local database, JWT secret, etc.)
- Frontend: `frontend/.env` (VITE_API_URL=http://localhost:5000)

---

### 2️⃣ Making Changes

**For Frontend Changes:**

1. Edit files in `src/` directory
2. Test locally at http://localhost:5173
3. Verify all features work

**For Backend Changes:**

1. Edit files in `backend/src/` directory
2. Test API endpoints using:
   - Postman
   - curl commands
   - Frontend integration
3. Verify database operations

**For Database Schema Changes:**

1. Edit `backend/prisma/schema.prisma`
2. Create migration:
   ```bash
   cd backend
   npx prisma migrate dev --name descriptive_name
   ```
3. Test migration locally
4. Commit migration files

---

### 3️⃣ Testing Before Deployment

**Checklist:**

- ✅ All features work locally
- ✅ No console errors in browser
- ✅ API endpoints return correct data
- ✅ Database operations succeed
- ✅ No TypeScript/ESLint errors
- ✅ Test login/logout flow
- ✅ Test critical user journeys

**Run Linter:**

```bash
# Frontend
cd frontend
npm run lint

# Backend
cd backend
npm run lint  # if configured
```

---

### 4️⃣ Commit & Push Changes

**Git Workflow:**

```bash
# 1. Check status
git status

# 2. Add files
git add .

# 3. Commit with descriptive message
git commit -m "feat: add new feature description"
# or
git commit -m "fix: resolve bug description"
# or
git commit -m "chore: update dependencies"

# 4. Push to GitHub
git push origin main
```

**Commit Message Conventions:**

- `feat:` - New feature
- `fix:` - Bug fix
- `chore:` - Maintenance (dependencies, config)
- `docs:` - Documentation only
- `refactor:` - Code refactoring
- `style:` - Formatting, no code change
- `test:` - Adding tests

---

### 5️⃣ Automatic Deployment

**What Happens Automatically:**

1. **GitHub receives push**
2. **DigitalOcean detects changes** (via webhook)
3. **Build process starts:**
   - Backend: `npm ci && npm run build`
   - Frontend: `npm ci && npm run build`
4. **Deployment:**
   - Backend: Runs `start.sh` script
   - Frontend: Serves static files from `dist/`
5. **Health checks:**
   - Backend: `/health` endpoint
   - Frontend: HTTP 200 response
6. **Go live:**
   - New version deployed
   - Old version shut down

**Deployment Time:** 2-5 minutes

---

### 6️⃣ Monitor Deployment

**Check Deployment Status:**

1. Go to: https://cloud.digitalocean.com/apps
2. Click your app: **contrezz-backend-prod**
3. View **Activity** tab
4. Look for:
   - ✅ "Deployment successful"
   - ❌ "Deployment failed" (check logs)

**View Logs:**

1. Click **Runtime Logs** tab
2. Select component: **backend** or **frontend**
3. View real-time logs
4. Look for errors or warnings

**Quick Test:**

```bash
# Test backend health
curl https://api.contrezz.com/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

---

### 7️⃣ Database Migrations (Production)

**When You Have Schema Changes:**

**Option 1: Automatic (Recommended)**

Your `backend/start.sh` already runs migrations automatically:

```bash
npx prisma migrate deploy
```

**Option 2: Manual (If Needed)**

1. Go to DigitalOcean → Apps → backend → Console
2. Run:
   ```bash
   cd /workspace/backend
   npx prisma migrate deploy
   ```

**Important:**

- ✅ Always test migrations locally first
- ✅ Migrations run automatically on deployment
- ✅ Backup database before major schema changes
- ❌ Never run `prisma migrate reset` in production

---

### 8️⃣ Environment Variables

**When to Update:**

- Adding new API keys
- Changing configuration
- Updating secrets

**How to Update:**

1. Go to: https://cloud.digitalocean.com/apps
2. Click your app → Components → **backend** or **frontend**
3. Settings → **Environment Variables**
4. Click **Edit**
5. Add/Update variables
6. Click **Save**
7. App will automatically redeploy

**Backend Environment Variables:**

```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
FRONTEND_URL=https://contrezz.com
CORS_ORIGIN=https://contrezz.com
PAYSTACK_PUBLIC_KEY=pk_...
PAYSTACK_SECRET_KEY=sk_...
NODE_ENV=production
PORT=8080
```

**Frontend Environment Variables:**

```
VITE_API_URL=https://api.contrezz.com
```

---

### 9️⃣ Rollback (If Needed)

**If Deployment Breaks Production:**

**Option 1: Revert Git Commit**

```bash
# Find the last working commit
git log --oneline

# Revert to that commit
git revert <commit-hash>

# Push
git push origin main
```

**Option 2: Manual Rollback in DigitalOcean**

1. Go to: https://cloud.digitalocean.com/apps
2. Click your app → **Activity** tab
3. Find the last successful deployment
4. Click **"..."** → **Rollback to this deployment**

---

### 🔟 Hotfix Workflow

**For Urgent Production Fixes:**

1. **Identify the issue** (check logs)
2. **Fix locally** and test thoroughly
3. **Create hotfix commit:**
   ```bash
   git add .
   git commit -m "hotfix: critical bug description"
   git push origin main
   ```
4. **Monitor deployment** closely
5. **Verify fix** in production immediately

---

## 📊 Deployment Checklist

### Before Every Deployment:

- [ ] All changes tested locally
- [ ] No console errors
- [ ] Database migrations tested
- [ ] Environment variables updated (if needed)
- [ ] Code committed with descriptive message
- [ ] Pushed to GitHub main branch

### After Deployment:

- [ ] Check deployment status (DigitalOcean dashboard)
- [ ] Test critical features on production
- [ ] Verify API health endpoint
- [ ] Check runtime logs for errors
- [ ] Test login/logout flow
- [ ] Verify database operations

---

## 🚨 Common Issues & Solutions

### Issue 1: Deployment Failed

**Symptoms:** Red "X" in DigitalOcean Activity tab

**Solutions:**

1. Check **Build Logs** for errors
2. Common causes:
   - Missing dependencies in `package.json`
   - TypeScript errors
   - Build command failed
3. Fix locally, commit, and push again

### Issue 2: App Running But Features Broken

**Symptoms:** Deployment successful but app not working

**Solutions:**

1. Check **Runtime Logs**
2. Common causes:
   - Environment variables missing
   - Database connection issues
   - CORS errors
3. Update environment variables or fix code

### Issue 3: Database Migration Failed

**Symptoms:** Migration errors in logs

**Solutions:**

1. Check migration files
2. Run migration manually in Console
3. Fix schema conflicts
4. Redeploy

### Issue 4: CORS Errors

**Symptoms:** `Access-Control-Allow-Origin` errors in browser

**Solutions:**

1. Verify `FRONTEND_URL` in backend env vars
2. Check `backend/src/index.ts` CORS configuration
3. Ensure `https://contrezz.com` is in allowed origins

---

## 🔐 Security Best Practices

1. **Never commit sensitive data:**

   - ✅ Use environment variables
   - ❌ Don't commit `.env` files
   - ❌ Don't hardcode API keys

2. **Keep dependencies updated:**

   ```bash
   npm audit
   npm audit fix
   ```

3. **Use strong secrets:**

   - JWT_SECRET: 64+ random characters
   - Database passwords: Strong, unique

4. **Monitor logs regularly:**
   - Check for suspicious activity
   - Watch for errors

---

## 📈 Scaling Considerations

**When to Scale Up:**

- App response time > 2 seconds
- Database CPU > 80%
- Memory usage > 80%

**How to Scale:**

1. **App Platform:**

   - Go to Settings → Resources
   - Increase instance size
   - Add more instances (horizontal scaling)

2. **Database:**
   - Go to Databases → Settings
   - Resize cluster
   - Add read replicas

---

## 🎯 Quick Reference

**Key URLs:**

- Production: https://contrezz.com
- API: https://api.contrezz.com/api/*
- DigitalOcean Dashboard: https://cloud.digitalocean.com/apps
- GitHub Repo: https://github.com/oluwaseyiolukoya/propertyhub_v1

**Key Commands:**

```bash
# Local development
npm run dev

# Build
npm run build

# Database migration (local)
npx prisma migrate dev

# Database migration (production)
npx prisma migrate deploy

# View logs (local)
npm run dev

# Deploy
git push origin main
```

**Support:**

- DigitalOcean Docs: https://docs.digitalocean.com/products/app-platform/
- Prisma Docs: https://www.prisma.io/docs/
- React Docs: https://react.dev/

---

## 📝 Deployment Log Template

**Keep a log of deployments:**

```
Date: 2025-11-10
Version: v1.0.0
Changes:
- Added new feature X
- Fixed bug Y
- Updated dependency Z

Deployed by: [Your Name]
Deployment time: 3 minutes
Status: ✅ Success
Issues: None
```

---

## 🎉 Summary

**Your Deployment is Automated!**

1. Make changes locally
2. Test thoroughly
3. Commit & push to GitHub
4. DigitalOcean automatically deploys
5. Monitor and verify

**That's it!** No manual server management needed. 🚀

---

**Last Updated:** November 10, 2025
**Version:** 1.0.0

