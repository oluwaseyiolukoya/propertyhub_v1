# 🛡️ Safe Schema Changes Guide - Avoiding Data Loss

## 🎯 **When Removing Columns or Making Breaking Changes**

---

## ⚠️ **The Problem with `prisma db push --accept-data-loss`:**

When you **remove a column** from your schema:

```prisma
// Before
model users {
  id String
  email String
  name String
  oldColumn String  // ← You want to remove this
}

// After
model users {
  id String
  email String
  name String
  // oldColumn removed ← This will DELETE the column and ALL its data!
}
```

**If you run `prisma db push --accept-data-loss`:**

- ❌ Column is **immediately deleted**
- ❌ All data in that column is **permanently lost**
- ❌ No way to undo
- ❌ No backup created
- ❌ No migration history

---

## ✅ **SAFE ALTERNATIVE: Use Prisma Migrations**

### **Method 1: Create a Migration (Recommended)**

Instead of `prisma db push`, use `prisma migrate`:

```bash
# DON'T USE THIS when removing columns:
# npx prisma db push --accept-data-loss  ❌

# USE THIS INSTEAD:
npx prisma migrate dev --name remove_old_column  ✅
```

**What this does:**

1. ✅ Creates a migration file you can review
2. ✅ Shows you exactly what SQL will run
3. ✅ Lets you backup data before applying
4. ✅ Creates a migration history
5. ✅ Can be rolled back if needed

---

## 📋 **Step-by-Step: Safe Column Removal**

### **Step 1: Create the Migration (Local)**

```bash
# 1. Edit your schema.prisma - remove the column
# 2. Create migration
npx prisma migrate dev --name remove_unused_column

# 3. Prisma will show you the SQL:
# -- AlterTable
# ALTER TABLE "users" DROP COLUMN "oldColumn";
```

### **Step 2: Review the Migration File**

```bash
# Check what will happen
cat prisma/migrations/20251117_remove_unused_column/migration.sql
```

**Example migration file:**

```sql
-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "oldColumn";
```

### **Step 3: Backup Data (If Needed)**

```bash
# If the column has important data, backup first
psql $DATABASE_URL -c "
  CREATE TABLE users_backup AS
  SELECT id, oldColumn
  FROM users
  WHERE oldColumn IS NOT NULL;
"
```

### **Step 4: Apply to Production**

```bash
# On production server
npx prisma migrate deploy
```

---

## 🔄 **Comparison: `db push` vs `migrate`**

| Feature        | `prisma db push`       | `prisma migrate`          |
| -------------- | ---------------------- | ------------------------- |
| **Speed**      | ⚡ Fast                | 🐢 Slower (creates files) |
| **Safety**     | ⚠️ Risky for deletions | ✅ Safe (reviewable)      |
| **History**    | ❌ No history          | ✅ Full history           |
| **Rollback**   | ❌ Can't rollback      | ✅ Can rollback           |
| **Review**     | ❌ No preview          | ✅ Can review SQL         |
| **Production** | ⚠️ Use with caution    | ✅ Recommended            |
| **Best For**   | Adding tables/columns  | Removing or changing      |

---

## 📊 **When to Use Each Command:**

### **Use `prisma db push` when:**

✅ Adding new tables  
✅ Adding new columns  
✅ Adding new indexes  
✅ Prototyping/development  
✅ Quick schema sync  
✅ No data loss risk

### **Use `prisma migrate` when:**

✅ Removing columns  
✅ Removing tables  
✅ Changing column types  
✅ Renaming columns  
✅ Production deployments  
✅ Need migration history

---

## 🛠️ **Safe Alternatives for Common Changes:**

### **1. Removing a Column Safely:**

```bash
# ❌ DON'T DO THIS:
npx prisma db push --accept-data-loss

# ✅ DO THIS INSTEAD:
# Step 1: Create migration
npx prisma migrate dev --name remove_column_name

# Step 2: Review the migration
cat prisma/migrations/*/migration.sql

# Step 3: Backup if needed
pg_dump $DATABASE_URL > backup.sql

# Step 4: Apply to production
npx prisma migrate deploy
```

---

### **2. Renaming a Column Safely:**

**Option A: Using Migration (Preserves Data)**

```bash
# 1. Create migration
npx prisma migrate dev --name rename_column

# 2. Edit the migration file to use RENAME instead of DROP/ADD
# Change from:
# ALTER TABLE "users" DROP COLUMN "oldName";
# ALTER TABLE "users" ADD COLUMN "newName" TEXT;

# To:
# ALTER TABLE "users" RENAME COLUMN "oldName" TO "newName";

# 3. Apply
npx prisma migrate deploy
```

**Option B: Two-Step Approach (Zero Downtime)**

```bash
# Step 1: Add new column
# In schema.prisma:
model users {
  id String
  oldName String  // Keep old
  newName String  // Add new
}

npx prisma migrate dev --name add_new_column

# Step 2: Copy data
psql $DATABASE_URL -c "UPDATE users SET newName = oldName;"

# Step 3: Remove old column
# In schema.prisma:
model users {
  id String
  newName String  // Only new remains
}

npx prisma migrate dev --name remove_old_column
```

---

### **3. Changing Column Type Safely:**

```bash
# Example: Change from String to Int

# Step 1: Add new column with new type
model users {
  id String
  age String  // Old (will remove)
  ageInt Int  // New
}

npx prisma migrate dev --name add_age_int

# Step 2: Migrate data
psql $DATABASE_URL -c "
  UPDATE users
  SET ageInt = CAST(age AS INTEGER)
  WHERE age ~ '^[0-9]+$';
"

# Step 3: Remove old column
model users {
  id String
  ageInt Int @map("age")  // Rename to original
}

npx prisma migrate dev --name switch_to_int
```

---

### **4. Removing a Table Safely:**

```bash
# ❌ DON'T DO THIS:
# Just delete the model and run prisma db push

# ✅ DO THIS INSTEAD:

# Step 1: Backup the table
pg_dump -t table_name $DATABASE_URL > table_backup.sql

# Step 2: Remove from schema and create migration
npx prisma migrate dev --name remove_table_name

# Step 3: Review migration
cat prisma/migrations/*/migration.sql

# Step 4: Apply to production
npx prisma migrate deploy
```

---

## 🔄 **Migration Workflow for Production:**

### **Development (Local):**

```bash
# 1. Make schema changes
# Edit prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name descriptive_name

# 3. Test locally
npm run dev

# 4. Commit migration files
git add prisma/migrations/
git commit -m "feat: add migration for X"
git push origin main
```

### **Production (Server):**

```bash
# 1. Pull latest code
git pull origin main

# 2. Apply migrations (safe)
npx prisma migrate deploy

# 3. Generate Prisma Client
npx prisma generate

# 4. Restart app
pm2 restart backend
```

---

## 📝 **Update Your Deployment Script:**

### **For Destructive Changes, Use This Script:**

Create `backend/deploy-with-migrations.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment with migrations..."

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Apply migrations (safer than db push)
echo "🗄️ Applying database migrations..."
npx prisma migrate deploy

# Generate Prisma Client
echo "🔨 Generating Prisma Client..."
npx prisma generate

# Build application
echo "🏗️ Building application..."
npm run build

# Restart service
echo "🔄 Restarting backend..."
pm2 restart backend

echo "✅ Deployment complete!"
```

**Make it executable:**

```bash
chmod +x backend/deploy-with-migrations.sh
```

---

## 🎯 **Updated package.json Scripts:**

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "build": "npx swc src -d dist --copy-files",
    "postinstall": "prisma generate",

    // For adding new tables/columns (safe, fast)
    "deploy": "npm run build && npm run db:sync",
    "db:sync": "prisma generate && prisma db push --accept-data-loss",

    // For removing/changing columns (safe, tracked)
    "deploy:migrate": "npm run build && npm run db:migrate",
    "db:migrate": "prisma migrate deploy",

    // Development
    "migrate:dev": "prisma migrate dev",
    "migrate:create": "prisma migrate dev --create-only"
  }
}
```

---

## 🛡️ **Safety Checklist Before Removing Columns:**

- [ ] **Backup database** before making changes
- [ ] **Use `prisma migrate`** instead of `prisma db push`
- [ ] **Review migration SQL** before applying
- [ ] **Test on staging** environment first
- [ ] **Check for dependencies** (foreign keys, indexes)
- [ ] **Verify data** isn't needed anymore
- [ ] **Update application code** to not use the column
- [ ] **Deploy code changes** before removing column
- [ ] **Have rollback plan** ready

---

## 🔄 **Rollback Strategy:**

### **If You Need to Undo a Migration:**

```bash
# Option 1: Revert the migration (if just applied)
npx prisma migrate resolve --rolled-back migration_name

# Option 2: Create a new migration that reverses changes
# Edit schema.prisma to add column back
npx prisma migrate dev --name restore_column

# Option 3: Restore from backup
psql $DATABASE_URL < backup.sql
```

---

## 📊 **Decision Tree:**

```
Are you making schema changes?
│
├─ Adding new tables/columns?
│  └─ Use: npx prisma db push --accept-data-loss ✅
│     (Fast, safe, no history needed)
│
├─ Removing columns/tables?
│  └─ Use: npx prisma migrate dev ✅
│     (Safe, reviewable, can rollback)
│
├─ Changing column types?
│  └─ Use: npx prisma migrate dev ✅
│     (Safe, reviewable, can rollback)
│
└─ Renaming columns?
   └─ Use: npx prisma migrate dev ✅
      (Edit migration to use RENAME)
```

---

## 🎯 **Summary:**

| Operation     | Command              | Risk Level | Reversible           |
| ------------- | -------------------- | ---------- | -------------------- |
| Add table     | `prisma db push`     | ✅ Safe    | ✅ Yes               |
| Add column    | `prisma db push`     | ✅ Safe    | ✅ Yes               |
| Remove column | `prisma migrate dev` | ⚠️ Medium  | ✅ Yes (with backup) |
| Remove table  | `prisma migrate dev` | ⚠️ High    | ✅ Yes (with backup) |
| Change type   | `prisma migrate dev` | ⚠️ Medium  | ✅ Yes (with backup) |
| Rename column | `prisma migrate dev` | ⚠️ Medium  | ✅ Yes               |

---

## 💡 **Best Practice:**

**For Production:**

1. ✅ Always use `prisma migrate deploy` for destructive changes
2. ✅ Always backup before removing columns
3. ✅ Always test on staging first
4. ✅ Always review migration SQL
5. ✅ Keep migration history in git

**For Development:**

- Use `prisma db push` for quick prototyping
- Use `prisma migrate dev` when you want to keep history

---

## 🚀 **Quick Reference:**

```bash
# SAFE - Adding things (use current deploy.sh)
./deploy.sh  # Uses prisma db push

# SAFER - Removing things (use this instead)
./deploy-with-migrations.sh  # Uses prisma migrate deploy

# Or manually:
npx prisma migrate deploy  # Apply tracked migrations
npx prisma db push         # Quick sync (additive only)
```

---

**Remember:**

- `prisma db push` = Fast but risky for deletions
- `prisma migrate` = Slower but safe for all changes

**Your current setup is perfect for adding new features!** ✅  
**Switch to migrations when you need to remove or change existing schema.** 🛡️
