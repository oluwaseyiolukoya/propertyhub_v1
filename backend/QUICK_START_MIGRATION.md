# 🚀 Quick Start: Migration with Backup

## ⚡ Fastest Way (Automated)

```bash
cd /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z/backend

# Make scripts executable (first time only)
chmod +x scripts/*.sh

# Run complete migration with backup
bash scripts/migrate-with-backup.sh
```

**That's it!** The script will:
1. ✅ Backup your database
2. ✅ Fix migration issue
3. ✅ Create purchase orders migration
4. ✅ Generate Prisma Client
5. ✅ Verify everything works

---

## 📝 Manual Steps (If You Prefer)

### 1. Backup Database
```bash
bash scripts/backup-database.sh
# Note the backup file path shown
```

### 2. Fix Migration Issue
```bash
npx prisma migrate resolve --applied 20251108_add_onboarding_applications
```

### 3. Create New Migration
```bash
npx prisma migrate dev --name add_purchase_orders
```

### 4. Generate Prisma Client
```bash
npx prisma generate
```

### 5. Verify Success
```bash
npx prisma migrate status
# Should show: "Database schema is up to date"
```

---

## 🔙 Restore Backup (If Needed)

```bash
# Replace with your actual backup file
bash scripts/restore-database.sh backups/backup_contrezz_YYYYMMDD_HHMMSS.sql.gz
```

---

## ✅ Verify Migration Worked

```bash
# Open Prisma Studio
npx prisma studio

# Look for these tables:
# - purchase_orders
# - purchase_order_items
# - project_invoices (should have purchaseOrderId column)
```

---

## 🎯 What Gets Created

- ✅ `purchase_orders` table
- ✅ `purchase_order_items` table  
- ✅ `project_invoices.purchaseOrderId` column
- ✅ All foreign keys and indexes
- ✅ Backup file in `backups/` directory

---

**Ready?** Run the automated script above! 🚀

