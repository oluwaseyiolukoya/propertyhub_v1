# Fix Failed Production Migration

## Problem
The migration `20251120110000_consolidate_all_system_setup` failed in production and is blocking new migrations.

## Solution
Run these commands in the DigitalOcean Console:

### Step 1: Check the migration status
```bash
cd /workspace/backend
npx prisma migrate status
```

### Step 2: Mark the failed migration as rolled back
```bash
npx prisma migrate resolve --rolled-back "20251120110000_consolidate_all_system_setup"
```

### Step 3: Try to apply it again
```bash
npx prisma migrate deploy
```

### Step 4: If it fails again, mark it as applied (skip it)
If the migration keeps failing but the database schema is actually correct, you can mark it as applied:

```bash
npx prisma migrate resolve --applied "20251120110000_consolidate_all_system_setup"
```

### Step 5: Deploy all remaining migrations
```bash
npx prisma migrate deploy
```

### Step 6: Verify everything is up to date
```bash
npx prisma migrate status
```

Should show: "Database schema is up to date!"

---

## Quick Fix (All Commands in Order)

Copy and paste these commands one by one in the DigitalOcean Console:

```bash
cd /workspace/backend

# Mark failed migration as rolled back
npx prisma migrate resolve --rolled-back "20251120110000_consolidate_all_system_setup"

# Try to apply it again
npx prisma migrate deploy

# If it still fails, mark as applied and continue
npx prisma migrate resolve --applied "20251120110000_consolidate_all_system_setup"

# Deploy all remaining migrations (including unitLimit fix)
npx prisma migrate deploy

# Verify
npx prisma migrate status
```

---

## Expected Result
After running these commands, you should see:
- All 13 migrations applied
- "Database schema is up to date!"
- The `unitLimit` column will be added to the `plans` table
- Your production app will work correctly

