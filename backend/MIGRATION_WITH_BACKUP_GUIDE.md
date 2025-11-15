# Complete Migration Guide with Backup & Restore

## 🎯 Overview

This guide provides a **safe, professional approach** to fixing the Prisma migration issue:
1. ✅ Backup database first
2. ✅ Fix migration properly
3. ✅ Create new migration
4. ✅ Restore backup if needed

## 📋 Prerequisites

- PostgreSQL installed and running
- `pg_dump` and `psql` commands available
- Database accessible via `DATABASE_URL` in `.env`

## 🚀 Step-by-Step Process

### Step 1: Make Scripts Executable

```bash
cd /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/backend
chmod +x scripts/*.sh
```

### Step 2: Create Database Backup

**Option A: Using the backup script (Recommended)**
```bash
bash scripts/backup-database.sh
```

**Option B: Manual backup**
```bash
# Extract database name from DATABASE_URL
# Then run:
pg_dump $DATABASE_URL > backups/backup_manual_$(date +%Y%m%d_%H%M%S).sql
gzip backups/backup_manual_*.sql
```

**What gets backed up:**
- ✅ All tables and data
- ✅ Schema structure
- ✅ Indexes and constraints
- ✅ Foreign key relationships

**Backup location:** `backend/backups/backup_contrezz_YYYYMMDD_HHMMSS.sql.gz`

### Step 3: Verify Backup

```bash
# Check backup file exists
ls -lh backups/

# View backup info
cat backups/latest_backup.txt
```

### Step 4: Fix Migration Issue

The issue is that Prisma's shadow database doesn't have the `admins` table. We'll mark the problematic migration as already applied:

```bash
npx prisma migrate resolve --applied 20251108_add_onboarding_applications
```

**What this does:**
- Marks the migration as applied in Prisma's migration history
- Tells Prisma to skip validating it against shadow database
- Allows new migrations to proceed

### Step 5: Create Purchase Orders Migration

```bash
npx prisma migrate dev --name add_purchase_orders
```

**What this does:**
- Creates migration file for purchase orders tables
- Applies migration to database
- Updates migration history

### Step 6: Generate Prisma Client

```bash
npx prisma generate
```

**What this does:**
- Generates TypeScript types
- Updates Prisma Client with new tables
- Makes new tables available in code

### Step 7: Verify Migration Success

```bash
# Check migration status
npx prisma migrate status

# Verify tables exist (optional)
npx prisma studio
# Look for: purchase_orders, purchase_order_items tables
```

## 🔄 Complete Automated Script

**All-in-one script** (does everything automatically):

```bash
cd /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/backend
bash scripts/migrate-with-backup.sh
```

This script:
1. ✅ Creates backup automatically
2. ✅ Resolves migration issue
3. ✅ Creates new migration
4. ✅ Generates Prisma Client
5. ✅ Verifies success
6. ✅ Shows restore command if needed

## 🔙 Restore Database (If Needed)

**If something goes wrong**, restore from backup:

```bash
# Option 1: Use restore script
bash scripts/restore-database.sh backups/backup_contrezz_YYYYMMDD_HHMMSS.sql.gz

# Option 2: Manual restore
gunzip -c backups/backup_contrezz_YYYYMMDD_HHMMSS.sql.gz | psql $DATABASE_URL
```

**After restore:**
```bash
npx prisma generate
```

## 📊 Verification Checklist

After migration, verify:

- [ ] Backup file created successfully
- [ ] Migration file created: `prisma/migrations/YYYYMMDD_add_purchase_orders/`
- [ ] Tables exist:
  - [ ] `purchase_orders`
  - [ ] `purchase_order_items`
  - [ ] `project_invoices` has `purchaseOrderId` column
- [ ] Prisma Client generated successfully
- [ ] Backend server starts without errors
- [ ] Can query purchase orders via API

## 🛠️ Troubleshooting

### Issue: Backup fails
**Solution:**
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env`
- Check database permissions

### Issue: Migration still fails
**Solution:**
```bash
# Try using db push instead
npx prisma db push
npx prisma generate
```

### Issue: Tables not created
**Solution:**
```bash
# Check migration status
npx prisma migrate status

# If needed, apply manually
npx prisma migrate deploy
```

### Issue: Need to rollback
**Solution:**
```bash
# Restore from backup
bash scripts/restore-database.sh backups/backup_contrezz_YYYYMMDD_HHMMSS.sql.gz

# Reset migrations (if needed)
npx prisma migrate reset
```

## 📝 Manual Commands Reference

### Backup
```bash
pg_dump $DATABASE_URL | gzip > backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore
```bash
gunzip -c backups/backup_FILE.sql.gz | psql $DATABASE_URL
```

### Check Database Connection
```bash
psql $DATABASE_URL -c "\dt"  # List tables
```

### Check Migration Status
```bash
npx prisma migrate status
```

## 🎯 Expected Outcome

After successful migration:

1. **Database:**
   - ✅ `purchase_orders` table exists
   - ✅ `purchase_order_items` table exists
   - ✅ `project_invoices.purchaseOrderId` column exists
   - ✅ All foreign keys created
   - ✅ All indexes created

2. **Backend:**
   - ✅ Prisma Client updated
   - ✅ API endpoints work
   - ✅ Can create/read purchase orders

3. **Backup:**
   - ✅ Backup file saved
   - ✅ Can restore if needed

## 🚨 Important Notes

1. **Always backup before migration** - Data loss is irreversible
2. **Test restore process** - Know how to restore before you need to
3. **Keep backups** - Don't delete backups immediately
4. **Verify after migration** - Check tables and data integrity
5. **Document changes** - Note what was changed and why

## 📞 Support

If you encounter issues:

1. Check backup file exists
2. Review error messages carefully
3. Try restore to verify backup works
4. Check Prisma documentation
5. Review migration files in `prisma/migrations/`

## ✅ Success Criteria

Migration is successful when:
- ✅ Backup created and verified
- ✅ Migration runs without errors
- ✅ Tables visible in Prisma Studio
- ✅ Backend API endpoints work
- ✅ Can create purchase orders via API
- ✅ Data integrity maintained

---

**Ready to proceed?** Run the automated script or follow the manual steps above!

