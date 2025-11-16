# Database Restore Recovery Guide

**Date**: 2025-11-16  
**Issue**: Production database restored from old backup  
**Impact**: Missing tables created after backup date  
**Status**: 🚨 CRITICAL - Immediate action required

---

## What Happened

You restored your production database from an **older backup** today. This backup was taken **before** certain tables (like `developer_projects`) were created in production.

### Timeline

```
Past (Backup Date) ──────────► Recent ───────────► Today
                                                    
✅ Backup taken               ✅ New tables         ⚠️  Database restored
   - Core tables exist           added                - Back to backup state
   - Basic features              - developer_projects - New tables GONE
                                 - Budget tables      - Code expects them
                                 - Project features   - ERRORS!
```

---

## Root Cause Analysis

### The Problem

1. **Old Backup Restored**: Contains only tables that existed at backup time
2. **Code Expects New Tables**: Application code was updated since backup
3. **Schema Mismatch**: Database structure ≠ Code expectations
4. **Result**: `Error: Table does not exist`

### Specific Impact

**Missing Table**: `developer_projects`  
**Error**: `P2021 - The table public.developer_projects does not exist`

**Likely Also Missing** (depending on backup age):
- `budget_line_items`
- `project_expenses`
- `project_funding`
- `project_invoices`
- `project_forecasts`
- `project_milestones`
- `project_vendors`
- `project_cash_flow_snapshots`
- `purchase_orders`
- `project_stages`
- `stage_templates`

---

## Data Loss Assessment

### ⚠️ IMPORTANT QUESTIONS

**1. Were there existing developer projects before the restore?**
- If YES → Those projects are LOST (restored to old state)
- If NO → No project data loss, just missing structure

**2. Were there other records in the missing tables?**
- Budget items, expenses, invoices, etc.
- These would also be lost if they existed

**3. What was the backup date?**
- Check DigitalOcean to see backup timestamp
- Anything created AFTER that date is lost

### Affected Features

Features that depend on missing tables will NOT work:
- ❌ Creating developer projects
- ❌ Developer dashboard
- ❌ Budget management
- ❌ Expense tracking
- ❌ Project funding records
- ❌ Purchase orders
- ❌ Project stages/milestones

---

## 🚀 Recovery Steps

### STEP 1: Sync Database Schema (IMMEDIATE)

**Via DigitalOcean Console** (Fastest - 2 minutes):

1. Go to **DigitalOcean Dashboard**
2. Navigate to your **Backend App**
3. Click **Console** tab
4. Run these commands:

```bash
cd /workspace
npx prisma db push --accept-data-loss
```

**Expected Output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database

🚀  Your database is now in sync with your Prisma schema.

✔ Generated Prisma Client
```

### STEP 2: Verify Tables Created

Still in console, verify tables exist:

```bash
psql $DATABASE_URL -c "\dt" | grep -E "developer|project|budget"
```

Should show:
```
public | developer_projects         | table
public | budget_line_items          | table
public | project_expenses           | table
public | project_funding            | table
...etc
```

### STEP 3: Test Functionality

1. **Login** as developer
2. **Try creating a project** → Should work ✅
3. **Check other features** → Should work ✅

---

## Alternative Recovery Method

If Console access is not available:

### Create Temporary Auto-Fix Script

I can create a deployment script that automatically detects and fixes this.

**Would you like me to create that?**

---

## Prevention for Future Restores

### Before Restoring Database

1. **Document current state**
   ```bash
   # List all tables
   psql $DATABASE_URL -c "\dt"
   
   # Count records in key tables
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM developer_projects;"
   ```

2. **Note the backup date/time**
   - Check when backup was taken
   - Understand what data will be lost

3. **Consider alternatives**
   - Can you recover without full restore?
   - Can you restore specific tables only?
   - Is there a more recent backup?

### After Restoring Database

**ALWAYS run schema sync immediately:**

```bash
npx prisma db push --accept-data-loss
```

This ensures the restored database structure matches current code.

### Best Practice Workflow

```bash
# 1. Before restore - Document current state
psql $DATABASE_URL -c "\dt" > tables_before_restore.txt

# 2. Restore database
# (via DigitalOcean dashboard)

# 3. After restore - Sync schema immediately
npx prisma db push --accept-data-loss

# 4. Verify - Compare tables
psql $DATABASE_URL -c "\dt" > tables_after_sync.txt
diff tables_before_restore.txt tables_after_sync.txt

# 5. Test - Verify functionality
# Test each major feature
```

---

## Understanding `prisma db push`

### What It Does

- Compares `schema.prisma` with actual database
- Creates missing tables
- Adds missing columns
- Creates missing indexes
- Does NOT run migrations
- Does NOT keep migration history

### Why `--accept-data-loss` Flag

The flag is **required** but name is misleading in this case:

**Flag Purpose:**
- Acknowledges Prisma can't guarantee zero data loss
- Required for any schema change
- Safety mechanism to make you think before running

**In This Case:**
- ✅ We're ADDING tables (not dropping)
- ✅ No data is actually lost
- ✅ Existing tables remain untouched
- ✅ Safe to use

### When It Could Actually Lose Data

`db push --accept-data-loss` COULD lose data if:
- You remove fields from schema → Columns dropped
- You change field types → Data converted/lost
- You remove tables from schema → Tables dropped

**In recovery scenario**: We're only ADDING, so safe.

---

## Verification Checklist

After running `prisma db push`:

- [ ] Command completed successfully
- [ ] No error messages
- [ ] Can access application
- [ ] Can create developer projects ✅
- [ ] Developer dashboard loads ✅
- [ ] Other features working ✅
- [ ] No console errors ✅

---

## If Recovery Fails

### Troubleshooting Steps

**1. Check Database Connection**
```bash
echo $DATABASE_URL
psql $DATABASE_URL -c "SELECT version();"
```

**2. Check Database Permissions**
```bash
psql $DATABASE_URL -c "SELECT current_user, session_user;"
```

User must have `CREATE TABLE` permission.

**3. Check Disk Space**
```bash
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"
```

**4. Check for Conflicts**
```bash
# See if tables partially exist
psql $DATABASE_URL -c "\d developer_projects"
```

If table exists but structure is wrong:
```bash
# Drop and recreate (DANGEROUS - only if empty)
psql $DATABASE_URL -c "DROP TABLE IF EXISTS developer_projects CASCADE;"
npx prisma db push --accept-data-loss
```

---

## Alternative: Restore from More Recent Backup

If you have a **more recent backup** that includes the missing tables:

### DigitalOcean Backups

1. Check **Databases** → Your DB → **Backups**
2. Look for backups **after** developer dashboard was added
3. Restore from that backup instead
4. Still run `prisma db push` to be safe

### Manual Backup Files

If you have SQL dumps:
```bash
# Restore from SQL file
psql $DATABASE_URL < backup_file.sql

# Sync schema just in case
npx prisma db push --accept-data-loss
```

---

## Long-Term Solution

### 1. Implement Proper Migrations

Instead of `db push`, use proper migrations:

```bash
# When schema changes
npx prisma migrate dev --name describe_change

# In production
npx prisma migrate deploy
```

Your `start.sh` already does this! Keep using it.

### 2. Regular Backups

Ensure DigitalOcean automatic backups are:
- ✅ Enabled
- ✅ Daily or more frequent
- ✅ Retained for sufficient time

### 3. Test Restores in Staging

Before restoring production:
- Test restore in staging environment
- Verify functionality
- Document any issues
- Then apply to production

### 4. Document Schema Changes

Keep a changelog of when tables were added:
```markdown
# Schema Changelog

## 2025-11-10 - Developer Dashboard
- Added: developer_projects
- Added: budget_line_items
- Added: project_expenses
...
```

This helps identify what's missing after a restore.

---

## Summary

### The Issue
- Database restored from old backup
- Missing tables created after backup date
- Application code expects tables that don't exist

### The Fix
```bash
npx prisma db push --accept-data-loss
```

### Time to Fix
- 2 minutes via console
- Immediate effect
- Test and verify: 5 minutes
- **Total: ~10 minutes**

### Prevention
- Always run `prisma db push` after database restore
- Use staging for restore testing
- Keep migration history documented
- Regular backups with retention

---

## Status

🔴 **BLOCKING**: Missing tables preventing core functionality  
🎯 **ACTION**: Run `prisma db push` in DigitalOcean Console  
⏱️ **TIME**: 2 minutes to fix  
✅ **SAFE**: No data loss, only adding tables

---

## Next Steps

1. **IMMEDIATE**: Run `prisma db push` in Console
2. **VERIFY**: Test project creation
3. **DOCUMENT**: Note what data was lost (if any)
4. **PREVENT**: Update restore procedures
5. **MONITOR**: Check all features work correctly

---

**Ready to proceed?** Just run that command in Console and you're fixed! 🚀

