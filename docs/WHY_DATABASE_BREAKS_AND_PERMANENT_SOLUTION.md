# Why Database Schema Keeps Breaking - Root Cause Analysis & Permanent Solution

## 🔴 Critical Problem Identified

Your database schema keeps breaking because of a **fundamental mismatch** between how you're managing schema changes and how Prisma expects them to be managed.

---

## 📊 Root Causes

### 1. **Mixed Approach to Schema Changes** (PRIMARY ISSUE)

You're using **THREE DIFFERENT METHODS** to modify the database, causing chaos:

#### Method A: Prisma Migrations (Correct ✅)

```bash
npx prisma migrate dev --name my_change
```

- Creates versioned migration files in `prisma/migrations/`
- Tracks what's been applied
- Can be deployed to production safely

#### Method B: Manual SQL Execution (Dangerous ⚠️)

```bash
psql -U oluwaseyio contrezz_dev <<'EOF'
CREATE TABLE IF NOT EXISTS budget_line_items (...);
EOF
```

- **This is what we just did** to fix the immediate problem
- Changes the database directly
- **Prisma doesn't know about these changes**
- Creates "drift" between migration history and actual database

#### Method C: Prisma DB Push (Development Only ⚠️)

```bash
npx prisma db push
```

- Bypasses migrations entirely
- Good for rapid prototyping
- **Never use in production**
- Doesn't create migration files

**THE PROBLEM:** You're mixing all three methods, so:

- Migration history says: "These tables don't exist"
- Actual database says: "These tables DO exist"
- Prisma gets confused and crashes

---

### 2. **Failed Migrations Not Resolved**

Current status:

```bash
$ npx prisma migrate status
Following migration have failed:
20251123160000_fix_notification_preferences_schema
```

**What this means:**

- Prisma tried to apply a migration
- It failed partway through
- Prisma marked it as "failed" in its tracking table
- Now Prisma refuses to apply ANY new migrations until you fix this

**Why it failed:**

- The migration tried to create tables that already existed (from manual SQL)
- Or tried to add columns that were already added manually
- Or encountered a constraint violation

---

### 3. **Schema Drift Between Environments**

**Your Local Database:**

- Has tables created manually via `psql`
- Has some migrations applied
- Has some migrations marked as "failed"
- **Current state: UNKNOWN**

**Prisma's Migration History:**

- Tracks 9 migrations in `prisma/migrations/`
- Thinks some tables don't exist
- Thinks some migrations failed
- **Tracking state: OUT OF SYNC**

**Production Database (if you have one):**

- Probably has different tables than local
- Probably missing some migrations
- **State: COMPLETELY UNKNOWN**

---

## 🎯 The Permanent Solution

### **Phase 1: Clean Up Current Mess** (Do This Now)

#### Step 1: Mark Failed Migration as Applied

Since we manually created the tables, tell Prisma the migration is done:

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend

# Mark the failed migration as applied
npx prisma migrate resolve --applied "20251123160000_fix_notification_preferences_schema"
```

#### Step 2: Verify All Tables Exist

Check what's actually in your database:

```bash
psql -U oluwaseyio contrezz_dev -c "\dt" | grep -E "(project_|budget_|developer_)"
```

Expected tables:

- ✅ `developer_projects`
- ✅ `budget_line_items`
- ✅ `project_vendors`
- ✅ `project_invoices`
- ✅ `project_forecasts`
- ✅ `project_milestones`
- ✅ `project_funding`
- ✅ `project_expenses`
- ✅ `project_cash_flow_snapshots`

#### Step 3: Create a "Sync" Migration for Manual Changes

Since we created tables manually, we need to tell Prisma about them:

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend

# This creates a migration that matches current database state
npx prisma migrate dev --name sync_manual_table_creation
```

**What this does:**

- Compares `schema.prisma` with actual database
- Creates a migration for any differences
- If tables already exist, migration will be empty (that's OK!)
- Updates Prisma's tracking to match reality

#### Step 4: Verify Migration Status

```bash
npx prisma migrate status
```

**Expected output:**

```
Database schema is up to date!
```

---

### **Phase 2: Establish Proper Workflow** (Follow Forever)

#### ✅ THE ONE TRUE WAY to Change Database Schema

**For Development (Local):**

```bash
# 1. Edit schema.prisma
vim backend/prisma/schema.prisma

# 2. Create migration
cd backend
npx prisma migrate dev --name describe_your_change

# 3. Commit to git
git add prisma/migrations/
git add prisma/schema.prisma
git commit -m "feat: add new table/field"
git push
```

**For Production:**

```bash
# Production should ONLY run:
npx prisma migrate deploy

# NEVER run these in production:
# ❌ npx prisma db push
# ❌ npx prisma migrate dev
# ❌ psql ... CREATE TABLE ...
```

---

### **Phase 3: Prevent Future Breakage**

#### Rule 1: ONE Source of Truth

**`schema.prisma` is the ONLY place you define your schema.**

- ✅ Want to add a table? → Edit `schema.prisma` → Run `migrate dev`
- ❌ Never run manual `CREATE TABLE` commands
- ❌ Never run `ALTER TABLE` manually
- ❌ Never use database GUI tools to modify schema

#### Rule 2: Always Use Migrations

**Development:**

```bash
npx prisma migrate dev --name my_change
```

**Production:**

```bash
npx prisma migrate deploy
```

**NEVER use:**

- ❌ `prisma db push` (except for rapid prototyping, then throw away the database)
- ❌ Manual SQL execution
- ❌ Database GUI schema editors

#### Rule 3: Commit Migrations to Git

```bash
# After creating a migration:
git add prisma/migrations/
git add prisma/schema.prisma
git commit -m "migration: describe what changed"
```

**Why:** This ensures everyone on the team (and production) gets the same schema changes.

#### Rule 4: Never Edit Migration Files

Once a migration is created and committed:

- ✅ You can create a NEW migration to fix it
- ❌ NEVER edit the existing migration file
- ❌ NEVER delete migration files

**Why:** Prisma tracks migrations by filename. Editing breaks the tracking.

---

## 🔧 Emergency Procedures

### If Migrations Get Stuck

```bash
# Check status
npx prisma migrate status

# If a migration failed but you fixed it manually:
npx prisma migrate resolve --applied "migration_name"

# If you rolled back a migration manually:
npx prisma migrate resolve --rolled-back "migration_name"
```

### If Database is Completely Out of Sync

**Option A: Reset Development Database** (LOSES ALL DATA)

```bash
cd backend
npx prisma migrate reset
# This will:
# 1. Drop the entire database
# 2. Recreate it
# 3. Apply all migrations from scratch
# 4. Run seed script
```

**Option B: Baseline Production Database** (PRESERVES DATA)

```bash
# 1. Create a migration that matches current state
npx prisma migrate dev --name baseline_production

# 2. If migration is empty (tables already exist), that's OK
# 3. Mark it as applied
npx prisma migrate resolve --applied "baseline_production"
```

---

## 📋 Checklist: "Am I Doing This Right?"

Before making ANY database change, ask yourself:

- [ ] Did I edit `schema.prisma` first?
- [ ] Did I run `npx prisma migrate dev`?
- [ ] Did the migration succeed?
- [ ] Did I commit the migration files to git?
- [ ] Did I avoid manual SQL commands?
- [ ] Did I avoid `prisma db push`?

If you answered "Yes" to all, you're doing it right! ✅

If you answered "No" to any, STOP and follow the proper workflow. ⚠️

---

## 🎓 Why This Matters

### Without Proper Migrations:

1. **Your local database** has tables X, Y, Z
2. **Your coworker's database** has tables X, Y (missing Z)
3. **Production database** has tables X, W (missing Y, Z)
4. **Everyone's app crashes** with "table does not exist"
5. **No one knows** what the "correct" schema is
6. **You waste hours** debugging and manually fixing databases

### With Proper Migrations:

1. **Everyone runs** `npx prisma migrate dev` (or `deploy` in production)
2. **Everyone gets** the exact same schema
3. **Git tracks** every schema change
4. **You can rollback** if something breaks
5. **No surprises** in production
6. **Schema is documented** in migration files

---

## 🚀 Action Plan (Do This Now)

### Immediate (Next 10 Minutes):

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/backend

# 1. Mark failed migration as applied
npx prisma migrate resolve --applied "20251123160000_fix_notification_preferences_schema"

# 2. Create sync migration
npx prisma migrate dev --name sync_manual_changes_nov23

# 3. Verify status
npx prisma migrate status

# 4. Commit everything
cd ..
git add backend/prisma/migrations/
git add backend/prisma/schema.prisma
git commit -m "fix: sync database with migration history"
git push
```

### Short Term (Next Week):

1. ✅ Always use `npx prisma migrate dev` for schema changes
2. ✅ Never run manual SQL to create/alter tables
3. ✅ Commit all migrations to git immediately
4. ✅ Review this document before making schema changes

### Long Term (Forever):

1. ✅ Train your team on proper migration workflow
2. ✅ Add migration commands to your deployment pipeline
3. ✅ Use `npx prisma migrate deploy` in production
4. ✅ Never use `prisma db push` in production
5. ✅ Keep `schema.prisma` as single source of truth

---

## 📚 Additional Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Migration Troubleshooting](https://www.prisma.io/docs/guides/database/troubleshooting-orm)
- [Production Migration Best Practices](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)

---

## 🎯 Summary

**The Problem:**

- You're mixing manual SQL, `db push`, and migrations
- Prisma's tracking is out of sync with actual database
- Tables exist but Prisma doesn't know about them

**The Solution:**

- Use ONLY `npx prisma migrate dev` for schema changes
- Commit all migrations to git
- Use `npx prisma migrate deploy` in production
- Never run manual SQL for schema changes

**The Result:**

- ✅ Database schema never breaks
- ✅ All environments stay in sync
- ✅ Schema changes are tracked in git
- ✅ You can rollback if needed
- ✅ No more "table does not exist" errors

---

**Date:** November 23, 2025  
**Status:** CRITICAL - MUST IMPLEMENT IMMEDIATELY
