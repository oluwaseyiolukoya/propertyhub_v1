# Database Migration Scripts

## 📚 Available Scripts

### 1. `check-migration-health.sh`
**Purpose:** Verify your database and migrations are in sync

**Usage:**
```bash
bash scripts/check-migration-health.sh
```

**What it checks:**
- ✅ Prisma CLI availability
- ✅ Database connection
- ✅ Migration status (applied/failed/pending)
- ✅ Schema drift (database vs schema.prisma)
- ✅ Uncommitted migration files

**When to use:**
- Before deploying to production
- After making schema changes
- When debugging database issues
- As part of CI/CD pipeline

**Exit codes:**
- `0` - All checks passed
- `1` - Issues detected (see output)

---

### 2. `create-migration.sh`
**Purpose:** Create a new database migration following best practices

**Usage:**
```bash
bash scripts/create-migration.sh "describe_your_change"
```

**Examples:**
```bash
bash scripts/create-migration.sh "add_user_preferences_table"
bash scripts/create-migration.sh "update_customer_schema"
bash scripts/create-migration.sh "add_email_column_to_users"
```

**What it does:**
1. Checks if `schema.prisma` was modified
2. Verifies migration status is clean
3. Creates the migration using `npx prisma migrate dev`
4. Shows what was created
5. Reminds you to commit to git

**When to use:**
- Every time you need to change the database schema
- After editing `schema.prisma`
- Before committing your changes

**Exit codes:**
- `0` - Migration created successfully
- `1` - Error (see output for details)

---

## 🎯 Workflow Example

### Adding a New Table

```bash
# 1. Edit schema.prisma
vim prisma/schema.prisma

# Add your model:
# model my_table {
#   id   String @id @default(uuid())
#   name String
# }

# 2. Create migration
bash scripts/create-migration.sh "add_my_table"

# 3. Review the migration
cat prisma/migrations/*/migration.sql

# 4. Test locally
npm run dev

# 5. Commit
git add prisma/migrations/ prisma/schema.prisma
git commit -m "migration: add my_table"
git push
```

### Before Deploying

```bash
# Always run health check before deploying
bash scripts/check-migration-health.sh

# If all checks pass, deploy
git push origin main
```

---

## 🔧 Troubleshooting

### "Migration failed"
```bash
# Check what went wrong
npx prisma migrate status

# If you fixed it manually
npx prisma migrate resolve --applied "migration_name"
```

### "Schema drift detected"
```bash
# Create a sync migration
bash scripts/create-migration.sh "sync_schema_drift"
```

### "Database connection failed"
```bash
# Check your .env file
cat ../.env | grep DATABASE_URL

# Test connection manually
psql $DATABASE_URL -c "SELECT 1;"
```

---

## 📖 Related Documentation

- **Root Cause Analysis:** `../docs/WHY_DATABASE_BREAKS_AND_PERMANENT_SOLUTION.md`
- **Quick Reference:** `../MIGRATION_WORKFLOW.md`
- **Resolution Summary:** `../docs/DATABASE_SCHEMA_RESOLUTION_SUMMARY.md`

---

## 🚀 Best Practices

### DO:
- ✅ Use these scripts for all schema changes
- ✅ Run health check before deploying
- ✅ Commit migrations immediately
- ✅ Review generated SQL before applying

### DON'T:
- ❌ Run manual SQL to create/alter tables
- ❌ Edit migration files after creation
- ❌ Delete migration files
- ❌ Use `prisma db push` in production

---

## 🎓 Learn More

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Migration Troubleshooting](https://www.prisma.io/docs/guides/database/troubleshooting-orm)
- [Production Best Practices](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)

---

**Created:** November 23, 2025  
**Purpose:** Prevent database schema breakage  
**Status:** Production Ready ✅




