# 🚀 Quick Start: Database Migration Workflow

## ⚡ TL;DR - The Only 4 Commands You Need

```bash
# 1. Check database health
cd backend && bash scripts/check-migration-health.sh

# 2. Edit your schema
vim backend/prisma/schema.prisma

# 3. Create migration
cd backend && bash scripts/create-migration.sh "describe_your_change"

# 4. Commit to git
git add backend/prisma/migrations/ backend/prisma/schema.prisma
git commit -m "migration: describe_your_change"
git push
```

---

## 🎯 Golden Rules (Never Break These!)

### ✅ DO:
1. **Always edit `schema.prisma` first**
2. **Always use the migration script**
3. **Always commit migrations immediately**
4. **Always run health check before deploying**

### ❌ DON'T:
1. **Never run manual SQL** to create/alter tables
2. **Never use `prisma db push`** in production
3. **Never edit migration files** after creation
4. **Never delete migration files**

---

## 📋 Common Scenarios

### Scenario 1: Adding a New Table

```bash
# 1. Edit schema.prisma
vim backend/prisma/schema.prisma

# Add your model:
model my_new_table {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
}

# 2. Create migration
cd backend
bash scripts/create-migration.sh "add_my_new_table"

# 3. Test
npm run dev

# 4. Commit
git add prisma/migrations/ prisma/schema.prisma
git commit -m "migration: add my_new_table"
git push
```

### Scenario 2: Adding a Column

```bash
# 1. Edit schema.prisma
vim backend/prisma/schema.prisma

# Add field to existing model:
model users {
  ...
  newField String?  // Add this
}

# 2. Create migration
cd backend
bash scripts/create-migration.sh "add_newField_to_users"

# 3. Test & Commit (same as above)
```

### Scenario 3: Before Deploying

```bash
# Always run health check
cd backend
bash scripts/check-migration-health.sh

# If all checks pass ✅
git push origin main

# If issues detected ⚠️
# Follow the script's instructions to fix
```

---

## 🔧 Troubleshooting

### "Migration failed"
```bash
npx prisma migrate status
# Follow the instructions in the output
```

### "Schema drift detected"
```bash
cd backend
bash scripts/create-migration.sh "sync_schema_drift"
```

### "Database connection failed"
```bash
# Check your .env file
cat backend/.env | grep DATABASE_URL
```

---

## 📚 Need More Details?

- **Full Guide:** `MIGRATION_WORKFLOW.md`
- **Root Cause:** `docs/WHY_DATABASE_BREAKS_AND_PERMANENT_SOLUTION.md`
- **Scripts Help:** `backend/scripts/README.md`

---

## 🎓 Why This Matters

**Before (Bad):**
- ❌ Database breaks randomly
- ❌ "Table does not exist" errors
- ❌ Hours wasted debugging

**After (Good):**
- ✅ Everyone has same schema
- ✅ Changes tracked in git
- ✅ No more surprises

---

## ✅ Checklist (Print This!)

Before making ANY database change:

- [ ] I edited `schema.prisma` first
- [ ] I ran `bash scripts/create-migration.sh "name"`
- [ ] I reviewed the generated SQL
- [ ] I tested locally
- [ ] I committed to git
- [ ] I did NOT run manual SQL
- [ ] I did NOT use `prisma db push`

---

**Remember:** Follow the workflow = Happy database = Happy team! 🎉

**Date:** November 23, 2025  
**Status:** Production Ready ✅




