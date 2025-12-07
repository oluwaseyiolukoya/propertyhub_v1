# 🚨 Production Database Migration Required

## Issue

The production database is missing tables that exist in the schema, causing 500 errors:

- `onboarding_applications` table missing
- `report_schedules` table missing (newly added)

## Root Cause

Migrations have not been applied to the production database. The schema exists locally but the production database hasn't been updated.

---

## ✅ Solution: Apply Migrations to Production

### Step 1: Connect to Production Database

**Option A: Using Connection String**

```bash
cd backend
export DATABASE_URL="your_production_database_url"
npx prisma migrate deploy
```

**Option B: Update .env temporarily**

```bash
cd backend
# Edit .env to use production DATABASE_URL
npx prisma migrate deploy
# Restore .env to local DATABASE_URL
```

### Step 2: Verify Migrations Applied

```bash
npx prisma migrate status
```

Expected output:

```
Database schema is up to date!

The following migrations have been applied:
  20251108_add_onboarding_applications
  20251206_add_report_schedules_table
  ... (and all other migrations)
```

### Step 3: Restart Production Server

```bash
# SSH into your production server
pm2 restart your-app
# OR
npm run start
```

---

## 🔒 Safe Production Migration Workflow

### Pre-Migration Checklist

- [ ] Backup production database first
- [ ] Test migrations on staging environment
- [ ] Schedule during low-traffic period
- [ ] Have rollback plan ready
- [ ] Notify team about maintenance

### Backup Production Database

```bash
# PostgreSQL backup
pg_dump -h your_host -U your_user -d your_database > backup_$(date +%Y%m%d).sql

# Or using Prisma
cd backend
npx prisma db pull
```

### Apply Migrations

```bash
cd backend

# Check current migration status
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy

# Verify success
npx prisma migrate status
```

### Rollback (if needed)

```bash
# Restore from backup
psql -h your_host -U your_user -d your_database < backup_20251206.sql
```

---

## 📋 Missing Tables in Production

### 1. `onboarding_applications`

**Migration:** `20251108_add_onboarding_applications`
**Purpose:** Store customer onboarding applications
**Impact:** Admin dashboard cannot load application stats

### 2. `report_schedules`

**Migration:** `20251206_add_report_schedules_table`
**Purpose:** Store scheduled report configurations
**Impact:** Report scheduling feature won't work

---

## 🔍 Verify Production Schema

### Check if tables exist:

```sql
-- Connect to production database
psql -h your_host -U your_user -d your_database

-- Check if onboarding_applications exists
SELECT COUNT(*) FROM onboarding_applications;

-- Check if report_schedules exists
SELECT COUNT(*) FROM report_schedules;

-- List all tables
\dt
```

### Expected Tables (New):

- `onboarding_applications` (for admin onboarding)
- `report_schedules` (for report scheduling)

---

## 🚀 Quick Fix for Production

If you have SSH access to production:

```bash
# 1. SSH into production server
ssh user@your-production-server

# 2. Navigate to backend directory
cd /path/to/your/backend

# 3. Pull latest code
git pull origin main

# 4. Install dependencies (if needed)
npm install

# 5. Apply migrations
npx prisma migrate deploy

# 6. Restart server
pm2 restart your-app
# OR
systemctl restart your-app
```

---

## ⚠️ Important Notes

### DO NOT use `npx prisma db push` in production!

- ✅ USE: `npx prisma migrate deploy`
- ❌ NEVER: `npx prisma db push`

**Why?**

- `db push` bypasses migration history
- Can cause data loss
- Doesn't track changes
- Not safe for production

### Always use migrations:

```bash
# Development
npx prisma migrate dev --name "description"

# Production
npx prisma migrate deploy
```

---

## 🔧 Alternative: Manual Migration

If automated migration fails, you can apply manually:

### 1. Get Migration SQL

```bash
cd backend/prisma/migrations/20251206_add_report_schedules_table
cat migration.sql
```

### 2. Apply to Production Database

```bash
psql -h your_host -U your_user -d your_database < migration.sql
```

### 3. Mark as Applied

```bash
npx prisma migrate resolve --applied "20251206_add_report_schedules_table"
```

---

## 🎯 Verification Steps

After applying migrations:

### 1. Check Migration Status

```bash
cd backend
npx prisma migrate status
```

Expected: "Database schema is up to date!"

### 2. Test API Endpoints

```bash
# Test onboarding stats
curl https://api.contrezz.com/api/admin/onboarding/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test report schedules
curl https://api.contrezz.com/api/report-schedules \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: Both should return 200 OK

### 3. Check Production App

1. Login to admin dashboard
2. Navigate to Onboarding section
3. Verify stats load without errors
4. Navigate to Properties → Reports
5. Try scheduling a report
6. Verify no console errors

---

## 📊 Migration Summary

### Migrations to Apply:

| Migration                            | Date  | Purpose           | Status             |
| ------------------------------------ | ----- | ----------------- | ------------------ |
| 20251108_add_onboarding_applications | Nov 8 | Admin onboarding  | ⚠️ Missing in prod |
| 20251206_add_report_schedules_table  | Dec 6 | Report scheduling | ⚠️ Missing in prod |

### Impact:

- **Admin Dashboard:** Cannot load without onboarding_applications
- **Report Scheduling:** Cannot work without report_schedules
- **Other Features:** Unaffected

---

## 🎓 Prevention for Future

### Best Practices:

1. **Always migrate production immediately after local**

   ```bash
   # After creating migration locally
   git push origin main
   # SSH to production
   git pull && npx prisma migrate deploy
   ```

2. **Set up CI/CD pipeline**

   - Auto-deploy migrations on push
   - Run migrations before deploying code
   - Notify team of schema changes

3. **Document migrations**

   - Keep migration log
   - Note breaking changes
   - Update team immediately

4. **Monitor production**
   - Set up error tracking (Sentry, LogRocket)
   - Alert on 500 errors
   - Regular health checks

---

## 🚑 Emergency Contact

If you need immediate help:

1. Check backend logs for detailed error
2. Verify DATABASE_URL is correct
3. Ensure database is accessible
4. Contact your DevOps team if self-hosting
5. Contact hosting support if using managed service

---

## 📝 Action Items

### Immediate (Critical):

- [ ] Backup production database
- [ ] Apply migrations to production
- [ ] Restart production server
- [ ] Verify admin dashboard loads
- [ ] Test report scheduling

### Soon:

- [ ] Set up CI/CD for automatic migrations
- [ ] Add production health checks
- [ ] Document deployment process
- [ ] Train team on migration workflow

---

## ✅ Success Criteria

Production deployment is successful when:

- [x] All migrations applied
- [x] Admin dashboard loads without errors
- [x] Onboarding stats display correctly
- [x] Report scheduling works
- [x] No 500 errors in console
- [x] All API endpoints respond

---

**Created:** December 6, 2025
**Priority:** 🔴 CRITICAL - Production is broken
**Action Required:** Apply migrations to production database
