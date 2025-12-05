# 🚀 Production Migration - Quick Reference

## One-Command Migration (Recommended)

```bash
cd /path/to/production/backend
bash scripts/safe-production-migrate.sh
```

This script will automatically:
- ✅ Create database backup
- ✅ Apply all pending migrations
- ✅ Verify migration success
- ✅ Test database connection
- ✅ Generate Prisma Client

---

## Manual Migration Steps

### 1. Backup Database (CRITICAL!)

```bash
# Create backup
pg_dump -h YOUR_DB_HOST -U YOUR_DB_USER -d YOUR_DB_NAME > backup_$(date +%Y%m%d).sql

# Verify backup exists
ls -lh backup_*.sql
```

### 2. Apply Migrations

```bash
cd /path/to/production/backend
npx prisma migrate deploy
```

### 3. Restart Application

```bash
# PM2
pm2 restart backend

# Systemd
sudo systemctl restart contrezz-backend

# Docker
docker-compose restart backend
```

---

## Emergency Rollback

### If Migration Fails

```bash
# Restore from backup
psql -h YOUR_DB_HOST -U YOUR_DB_USER -d YOUR_DB_NAME < backup_YYYYMMDD.sql

# Restart application
pm2 restart backend
```

### Mark Migration as Applied (If Tables Already Exist)

```bash
npx prisma migrate resolve --applied 20251204_consolidate_verification_service
```

---

## Verification Commands

### Check Migration Status

```bash
npx prisma migrate status
```

### Test Database Connection

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => console.log('✅ Connected'))
  .catch(e => console.error('❌ Failed:', e))
  .finally(() => prisma.\$disconnect());
"
```

### Verify New Tables Exist

```bash
npx prisma db execute --stdin <<'SQL'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'verification_%';
SQL
```

---

## What Changes in This Migration?

### New Tables (All start empty - NO DATA LOSS)
- `verification_requests` - KYC verification requests
- `verification_documents` - Uploaded documents
- `verification_history` - Audit trail
- `provider_logs` - API logs

### Schema Updates
- Add relations to `customers` and `users` tables
- Add performance indexes
- Add foreign key constraints

### NO Breaking Changes
- ❌ No data deletion
- ❌ No column removal  
- ❌ No table drops
- ✅ Only additions

---

## Important URLs

- **Detailed Plan**: See `PRODUCTION_MIGRATION_PLAN.md`
- **Migration Script**: `backend/scripts/safe-production-migrate.sh`
- **Backup Location**: `backend/backups/`

---

## Support

**Issues?** Check the detailed plan in `PRODUCTION_MIGRATION_PLAN.md`  
**Emergency?** Restore from backup immediately

---

**Last Updated**: December 4, 2025

