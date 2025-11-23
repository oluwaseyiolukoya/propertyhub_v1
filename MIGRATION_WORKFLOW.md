# 🚀 Database Migration Workflow - Quick Reference

## ⚡ Quick Commands

### Check Database Health
```bash
cd backend
bash scripts/check-migration-health.sh
```

### Create New Migration
```bash
cd backend

# 1. Edit schema.prisma first
vim prisma/schema.prisma

# 2. Create migration
bash scripts/create-migration.sh "describe_your_change"

# 3. Commit to git
git add prisma/migrations/ prisma/schema.prisma
git commit -m "migration: describe_your_change"
git push
```

### Apply Migrations (Production)
```bash
cd backend
npx prisma migrate deploy
```

---

## 🎯 The Golden Rules

### ✅ DO:
1. **Always edit `schema.prisma` first**
2. **Always use `npx prisma migrate dev`** to create migrations
3. **Always commit migrations to git immediately**
4. **Always use `npx prisma migrate deploy`** in production
5. **Always run health check before deploying**

### ❌ DON'T:
1. **Never run manual SQL** to create/alter tables
2. **Never use `prisma db push`** in production
3. **Never edit migration files** after they're created
4. **Never delete migration files**
5. **Never skip committing migrations**

---

## 📋 Step-by-Step Workflows

### Workflow 1: Adding a New Table

```bash
# 1. Edit schema.prisma
cd backend
vim prisma/schema.prisma

# Add your model:
# model my_new_table {
#   id        String   @id @default(uuid())
#   name      String
#   createdAt DateTime @default(now())
# }

# 2. Create migration
bash scripts/create-migration.sh "add_my_new_table"

# 3. Test locally
npm run dev

# 4. Commit
git add prisma/migrations/ prisma/schema.prisma
git commit -m "migration: add my_new_table"
git push
```

### Workflow 2: Adding a Column

```bash
# 1. Edit schema.prisma
cd backend
vim prisma/schema.prisma

# Add field to existing model:
# model users {
#   ...
#   newField String?  // Add this
# }

# 2. Create migration
bash scripts/create-migration.sh "add_newField_to_users"

# 3. Test
npm run dev

# 4. Commit
git add prisma/migrations/ prisma/schema.prisma
git commit -m "migration: add newField to users"
git push
```

### Workflow 3: Renaming a Column

```bash
# 1. Edit schema.prisma
cd backend
vim prisma/schema.prisma

# Rename field:
# model users {
#   oldName String  // Change to:
#   newName String  @map("oldName")  // Keeps DB column name
# }

# 2. Create migration
bash scripts/create-migration.sh "rename_oldName_to_newName"

# 3. Review migration SQL carefully!
cat prisma/migrations/*/migration.sql

# 4. Test
npm run dev

# 5. Commit
git add prisma/migrations/ prisma/schema.prisma
git commit -m "migration: rename oldName to newName"
git push
```

---

## 🔧 Troubleshooting

### Problem: "Migration failed"

```bash
# Check what went wrong
npx prisma migrate status

# If you fixed it manually:
npx prisma migrate resolve --applied "migration_name"

# If you want to rollback:
npx prisma migrate resolve --rolled-back "migration_name"
```

### Problem: "Table already exists"

This means you created the table manually. Fix:

```bash
# Mark the migration as applied
npx prisma migrate resolve --applied "migration_name"

# Verify
npx prisma migrate status
```

### Problem: "Schema drift detected"

Your database doesn't match schema.prisma:

```bash
# Create a sync migration
bash scripts/create-migration.sh "sync_schema_drift"

# This will create a migration with the differences
```

### Problem: "Database is locked"

```bash
# Close all database connections
# Stop your dev server
# Stop any database GUI tools
# Then try again
```

---

## 🎓 Understanding Migration Files

### What's in a migration file?

```
prisma/migrations/
└── 20251123120000_add_user_preferences/
    └── migration.sql
```

**migration.sql** contains:
- SQL commands to update the database
- CREATE TABLE, ALTER TABLE, etc.
- Generated automatically by Prisma

**Never edit these files manually!**

---

## 🚀 Production Deployment

### Before Deploying:

```bash
# 1. Check health
cd backend
bash scripts/check-migration-health.sh

# 2. Ensure migrations are committed
git status prisma/migrations/

# 3. Push to git
git push origin main
```

### During Deployment:

Your deployment should run:

```bash
# In production environment
npx prisma migrate deploy
npx prisma generate
npm start
```

### After Deployment:

```bash
# Verify migrations applied
npx prisma migrate status
```

---

## 📊 Migration Status Meanings

| Status | Meaning | Action |
|--------|---------|--------|
| ✅ "Database schema is up to date" | All good! | None |
| ⚠️ "Pending migrations" | Migrations not applied | Run `migrate deploy` |
| ❌ "Failed migrations" | Migration crashed | Run `migrate resolve` |
| ⚠️ "Schema drift" | DB doesn't match schema | Create sync migration |

---

## 🎯 Quick Checklist

Before making ANY database change:

- [ ] I edited `schema.prisma` first
- [ ] I ran `bash scripts/create-migration.sh "name"`
- [ ] I reviewed the generated SQL
- [ ] I tested locally
- [ ] I committed to git
- [ ] I did NOT run manual SQL commands
- [ ] I did NOT use `prisma db push`

---

## 📚 Learn More

- **Full explanation:** `docs/WHY_DATABASE_BREAKS_AND_PERMANENT_SOLUTION.md`
- **Prisma docs:** https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Health check:** `bash scripts/check-migration-health.sh`

---

## 🆘 Emergency Contacts

If migrations are completely broken:

1. **Check health:** `bash scripts/check-migration-health.sh`
2. **Read the docs:** `docs/WHY_DATABASE_BREAKS_AND_PERMANENT_SOLUTION.md`
3. **Last resort:** Reset dev database (LOSES DATA)
   ```bash
   npx prisma migrate reset
   ```

---

**Remember:** Migrations are your friend! They keep your database in sync across all environments. Follow the workflow and you'll never have schema issues again. 🎉

