# Production Migration Plan - Verification Service Consolidation

**Date**: December 4, 2025  
**Migration**: Consolidate Verification Service + Schema Updates  
**Risk Level**: 🟡 MEDIUM (New tables + Schema changes)  
**Estimated Downtime**: None (additive changes only)

---

## 📋 Overview

We need to migrate 27 pending migrations to production, most importantly:

1. **Verification Service Consolidation** - Moving verification tables to main database
2. **Schema Updates** - Various improvements and fixes
3. **New Features** - KYC fields, sessions, performance indexes

**Key Point**: All migrations are **ADDITIVE** (no data loss), they only:

- ✅ Add new tables
- ✅ Add new columns
- ✅ Add indexes
- ❌ **NO data deletion**
- ❌ **NO column removal**

---

## 🎯 Pre-Migration Checklist

### 1. Backup Production Database ⚠️ CRITICAL

```bash
# SSH into your DigitalOcean droplet or use DigitalOcean console
pg_dump -h YOUR_DB_HOST -U YOUR_DB_USER -d YOUR_DB_NAME -F c -b -v -f "backup_$(date +%Y%m%d_%H%M%S).dump"

# Verify backup was created
ls -lh backup_*.dump

# Download backup locally for safety
scp user@host:backup_*.dump ./backups/
```

### 2. Check Production Database State

```bash
# Connect to production backend
cd /path/to/production/backend

# Check current migration status
npx prisma migrate status

# This will show you which migrations are pending
```

### 3. Test Migrations Locally First

```bash
# In your local environment
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend

# Apply all pending migrations locally
npx prisma migrate dev

# Verify everything works
npm run dev

# Test critical features:
# - User login
# - Payment processing
# - Verification system
# - Document uploads
```

---

## 🚀 Production Migration Steps

### Step 1: Prepare Production Environment

```bash
# 1. SSH into production server
ssh user@your-production-server

# 2. Navigate to backend directory
cd /path/to/production/backend

# 3. Pull latest code
git fetch origin
git pull origin main

# 4. Install dependencies (if any new ones)
npm install

# 5. Verify environment variables
# Make sure these are set in production .env:
cat .env | grep -E "DATABASE_URL|SPACES_|PAYSTACK_SECRET_KEY"
```

### Step 2: Apply Migrations (Zero Downtime)

```bash
# Apply all pending migrations to production
npx prisma migrate deploy

# This will:
# ✅ Create new verification_requests table
# ✅ Create new verification_documents table
# ✅ Create new verification_history table
# ✅ Create new provider_logs table
# ✅ Add indexes for performance
# ✅ Add foreign key constraints
# ✅ Add new columns to existing tables

# Expected output:
# "27 migrations applied successfully"
```

### Step 3: Verify Migration Success

```bash
# 1. Check migration status again
npx prisma migrate status
# Should show: "Database schema is up to date!"

# 2. Verify new tables exist
npx prisma db execute --stdin <<'SQL'
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'verification_requests',
  'verification_documents',
  'verification_history',
  'provider_logs'
);
SQL

# Should return 4 tables
```

### Step 4: Restart Application

```bash
# If using PM2
pm2 restart backend

# If using systemd
sudo systemctl restart contrezz-backend

# If using Docker
docker-compose restart backend

# If using DigitalOcean App Platform
# It will auto-restart after deployment
```

### Step 5: Verify Application Health

```bash
# Test health endpoint
curl https://your-domain.com/api/health

# Test authentication
curl https://your-domain.com/api/auth/validate-session \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test database connection
curl https://your-domain.com/api/admin/verification/requests \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 🔄 Rollback Plan (If Needed)

### Option 1: Undo Last Migration

```bash
# Mark the last migration as rolled back
npx prisma migrate resolve --rolled-back 20251204_consolidate_verification_service

# Manually drop the new tables (if needed)
npx prisma db execute --stdin <<'SQL'
DROP TABLE IF EXISTS provider_logs CASCADE;
DROP TABLE IF EXISTS verification_history CASCADE;
DROP TABLE IF EXISTS verification_documents CASCADE;
DROP TABLE IF EXISTS verification_requests CASCADE;
SQL
```

### Option 2: Restore from Backup

```bash
# Stop the application
pm2 stop backend

# Restore database from backup
pg_restore -h YOUR_DB_HOST -U YOUR_DB_USER -d YOUR_DB_NAME -v backup_YYYYMMDD_HHMMSS.dump

# Restart application
pm2 start backend
```

---

## 📊 Migration Details

### New Tables Created

| Table                    | Purpose                             | Records      |
| ------------------------ | ----------------------------------- | ------------ |
| `verification_requests`  | KYC verification requests           | Starts empty |
| `verification_documents` | Uploaded verification documents     | Starts empty |
| `verification_history`   | Audit trail for verifications       | Starts empty |
| `provider_logs`          | API logs for verification providers | Starts empty |

### Schema Changes

| Model       | Change                                      | Impact                  |
| ----------- | ------------------------------------------- | ----------------------- |
| `customers` | Add `verificationRequests` relation         | Safe - no data change   |
| `users`     | Add `reviewedVerificationRequests` relation | Safe - no data change   |
| All tables  | Performance indexes added                   | Safe - improves queries |

---

## ⚠️ Known Issues & Solutions

### Issue 1: Duplicate Migration Entries

**Problem**: Two migrations with similar names:

- `20251204_consolidate_verification_service`
- `20251204175644_consolidate_verification_service`

**Solution**:

```bash
# Mark the duplicate as applied (if it has no migration.sql)
npx prisma migrate resolve --applied 20251204175644_consolidate_verification_service
```

### Issue 2: Migration Already Applied

**Problem**: Tables already exist in production

**Solution**:

```bash
# Mark migration as applied without running it
npx prisma migrate resolve --applied 20251204_consolidate_verification_service

# Or use baseline approach
npx prisma migrate resolve --applied $(ls prisma/migrations | head -n 27)
```

---

## ✅ Post-Migration Verification Checklist

After migration, verify these features work:

- [ ] User authentication and login
- [ ] Property owner dashboard loads
- [ ] Admin dashboard loads
- [ ] Verification requests page accessible
- [ ] Document uploads work
- [ ] Payment processing works
- [ ] Subscription renewals work
- [ ] No console errors in browser
- [ ] No errors in server logs

### Test Commands

```bash
# 1. Check verification tables have correct structure
npx prisma db execute --stdin <<'SQL'
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name LIKE 'verification_%'
ORDER BY table_name, ordinal_position;
SQL

# 2. Test verification endpoint
curl https://your-domain.com/api/admin/verification/requests \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 3. Check application logs
pm2 logs backend --lines 50
```

---

## 📞 Emergency Contacts

**Database Issues**: Contact DigitalOcean support  
**Application Issues**: Check logs and rollback if needed  
**Critical Failures**: Restore from backup immediately

---

## 🎓 Key Learnings

1. **Always backup before migrations** - Non-negotiable
2. **Test locally first** - Catch issues early
3. **Migrations are additive** - No data loss if only adding tables/columns
4. **Verify after deployment** - Don't assume success
5. **Have a rollback plan** - Prepare for worst case

---

## 📝 Migration Timeline

| Step                | Duration      | Status     |
| ------------------- | ------------- | ---------- |
| Backup database     | 5-10 min      | ⏳ Pending |
| Apply migrations    | 2-5 min       | ⏳ Pending |
| Restart application | 1-2 min       | ⏳ Pending |
| Verify deployment   | 5-10 min      | ⏳ Pending |
| **Total**           | **15-30 min** | ⏳ Pending |

---

## 🚨 Important Notes

1. ⚠️ **DO NOT** run `npx prisma db push` in production - it bypasses migration history
2. ⚠️ **DO NOT** manually alter tables - use migrations only
3. ⚠️ **DO** backup before any migration
4. ⚠️ **DO** test in staging/local first
5. ⚠️ **DO** verify after deployment

---

**Last Updated**: December 4, 2025  
**Status**: Ready for production deployment  
**Reviewed By**: AI Assistant  
**Approved By**: _(Awaiting user approval)_
