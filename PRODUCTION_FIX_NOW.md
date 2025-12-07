# 🚨 PRODUCTION FIX - IMMEDIATE ACTION REQUIRED

## Problem Summary

Your production API is returning **500 errors** because database migrations have not been applied to production.

**Affected Endpoints:**
- ❌ `/api/admin/onboarding/stats`
- ❌ `/api/admin/onboarding/applications`
- ❌ `/api/report-schedules` (newly added today)

**Missing Tables:**
- `onboarding_applications`
- `report_schedules`

---

## ⚡ Quick Fix (5 Minutes)

### Option 1: Automated Script (Recommended)

```bash
# 1. Navigate to backend
cd backend

# 2. Set production database URL
export DATABASE_URL="your_production_database_connection_string"

# 3. Run deployment script
bash scripts/deploy-production-migrations.sh
```

The script will:
- ✅ Check your database connection
- ✅ Show current migration status
- ✅ Apply pending migrations
- ✅ Verify tables were created
- ✅ Give you next steps

---

### Option 2: Manual Deployment

```bash
# 1. Navigate to backend
cd backend

# 2. Set production database URL
export DATABASE_URL="your_production_database_connection_string"

# 3. Check migration status
npx prisma migrate status

# 4. Apply migrations
npx prisma migrate deploy

# 5. Verify success
npx prisma migrate status
```

Expected output: "Database schema is up to date!"

---

### Option 3: Using Production .env

If you have a production `.env` file:

```bash
cd backend

# 1. Backup your local .env
cp .env .env.local

# 2. Copy production .env
cp .env.production .env
# OR edit .env to use production DATABASE_URL

# 3. Apply migrations
npx prisma migrate deploy

# 4. Restore local .env
cp .env.local .env
```

---

## 🔄 After Migration: Restart Server

```bash
# If using PM2
pm2 restart your-app

# If using systemctl
sudo systemctl restart your-app

# If using Docker
docker restart your-container

# If running directly
# Press Ctrl+C in terminal, then:
npm run start
```

---

## ✅ Verify Fix

### 1. Check Frontend Console
Open https://app.contrezz.com in browser:
- Should see **NO** 500 errors
- Admin dashboard should load
- Reports should work

### 2. Test API Directly

```bash
# Test onboarding stats
curl https://api.contrezz.com/api/admin/onboarding/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 200 OK with stats data

# Test report schedules
curl https://api.contrezz.com/api/report-schedules \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 200 OK with schedules array
```

---

## 🔍 Troubleshooting

### Error: "Connection refused"
**Problem:** Can't connect to production database
**Fix:** 
- Check DATABASE_URL is correct
- Verify database is running
- Check firewall rules allow connection

### Error: "Migration failed"
**Problem:** Migration has errors
**Fix:**
- Check backend logs for specific error
- See detailed guide: `PRODUCTION_DEPLOYMENT_FIX.md`
- May need manual SQL execution

### Error: "Table already exists"
**Problem:** Table exists but migration not marked as applied
**Fix:**
```bash
npx prisma migrate resolve --applied "20251108_add_onboarding_applications"
npx prisma migrate resolve --applied "20251206_add_report_schedules_table"
```

---

## 📋 Migrations to Apply

| Migration | Purpose | Priority |
|-----------|---------|----------|
| `20251108_add_onboarding_applications` | Admin onboarding system | 🔴 CRITICAL |
| `20251206_add_report_schedules_table` | Report scheduling feature | 🟡 HIGH |
| *(all others)* | Various features | Check with `migrate status` |

---

## 🎯 Success Checklist

After running migrations:

- [ ] Migrations applied: `npx prisma migrate status` shows "up to date"
- [ ] Production server restarted
- [ ] Admin dashboard loads without errors
- [ ] Onboarding section works
- [ ] Report scheduling works
- [ ] No 500 errors in browser console
- [ ] API tests return 200 OK

---

## ⏱️ Time Estimate

- **Migrations:** 1-2 minutes
- **Server restart:** 10-30 seconds
- **Verification:** 2 minutes
- **Total:** ~5 minutes

---

## 🔒 Safety Notes

### Before Migration:
- ✅ **BACKUP** your production database first
- ✅ Notify team about maintenance
- ✅ Consider doing during low-traffic period

### Backup Command:
```bash
# PostgreSQL
pg_dump -h HOST -U USER -d DATABASE > backup_$(date +%Y%m%d_%H%M%S).sql

# Keep backup for at least 7 days
```

### Rollback (if needed):
```bash
psql -h HOST -U USER -d DATABASE < backup_20251206_120000.sql
```

---

## 📞 Need Help?

### Documentation:
1. **This file** - Quick fix
2. `PRODUCTION_DEPLOYMENT_FIX.md` - Detailed guide
3. `backend/scripts/README.md` - Script documentation

### Helper Scripts:
```bash
# Check what's wrong
cd backend && bash scripts/check-production-migrations.sh

# Deploy migrations safely
cd backend && bash scripts/deploy-production-migrations.sh
```

### Still Stuck?
1. Check server logs for specific errors
2. Verify DATABASE_URL points to production
3. Ensure database is accessible from your machine
4. Contact your DevOps/infrastructure team

---

## 🎓 Why This Happened

**Root Cause:** Migrations were created locally but never applied to production database.

**Prevention:**
1. Always run `npx prisma migrate deploy` in production after pushing code
2. Set up CI/CD to auto-deploy migrations
3. Document deployment procedures
4. Test on staging before production

---

## 📊 Current Status

```
Local Database:    ✅ Up to date (all migrations applied)
Production DB:     ❌ Missing migrations (causing 500 errors)
Frontend:          ✅ Code is deployed
Backend Code:      ✅ Code is deployed
Backend DB:        ❌ Schema mismatch (needs migrations)
```

**Fix:** Apply migrations to production database

---

## ⚡ TL;DR - Just Fix It!

```bash
cd backend
export DATABASE_URL="your_production_url"
npx prisma migrate deploy
pm2 restart your-app  # Or however you restart
```

Then verify at https://app.contrezz.com

---

**Created:** December 6, 2025
**Priority:** 🔴 CRITICAL
**Impact:** Production broken
**Time to Fix:** 5 minutes
**Difficulty:** Easy

