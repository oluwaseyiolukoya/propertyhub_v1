# Quick Deploy Guide - Contrezz

## 🚀 Deploy in 3 Steps

### 1. Make Changes Locally

```bash
# Start development
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2

# Test your changes at:
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
```

### 2. Commit & Push

```bash
git add .
git commit -m "feat: describe your changes"
git push origin main
```

### 3. Wait for Auto-Deploy

- ⏱️ Takes 2-5 minutes
- ✅ Check: https://cloud.digitalocean.com/apps
- 🧪 Test: https://contrezz.com

---

## 📋 Common Tasks

### Add New Feature

```bash
# 1. Create feature locally
# 2. Test thoroughly
# 3. Commit & push
git add .
git commit -m "feat: add new dashboard widget"
git push origin main
```

### Fix Bug

```bash
# 1. Fix bug locally
# 2. Test fix
# 3. Commit & push
git add .
git commit -m "fix: resolve login issue"
git push origin main
```

### Update Database Schema

```bash
# 1. Edit backend/prisma/schema.prisma
# 2. Create migration locally
cd backend
npx prisma migrate dev --name add_new_field

# 3. Test migration
# 4. Commit & push (migration runs automatically on deploy)
git add .
git commit -m "feat: add new user field"
git push origin main
```

### Update Environment Variables

1. Go to: https://cloud.digitalocean.com/apps
2. Click app → Component → Settings → Environment Variables
3. Edit → Save (auto-redeploys)

---

## 🔍 Check Deployment Status

```bash
# Test backend
curl https://api.contrezz.com/api/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

**Or visit:**

- Dashboard: https://cloud.digitalocean.com/apps
- Production: https://contrezz.com

---

## 🚨 Emergency Rollback

```bash
# Revert last commit
git revert HEAD
git push origin main

# Or rollback in DigitalOcean:
# Dashboard → Activity → "..." → Rollback
```

---

## 📞 Quick Links

- **Production:** https://contrezz.com
- **API:** https://api.contrezz.com/api/*
- **Dashboard:** https://cloud.digitalocean.com/apps
- **GitHub:** https://github.com/oluwaseyiolukoya/propertyhub_v1
- **Full Guide:** See `DEPLOYMENT_WORKFLOW.md`

---

## ✅ Pre-Deploy Checklist

- [ ] Tested locally
- [ ] No console errors
- [ ] Descriptive commit message
- [ ] Pushed to GitHub

## ✅ Post-Deploy Checklist

- [ ] Deployment successful (check dashboard)
- [ ] Test critical features
- [ ] Check logs for errors
- [ ] Verify API health

---

**Remember:** Every push to `main` branch automatically deploys! 🚀




