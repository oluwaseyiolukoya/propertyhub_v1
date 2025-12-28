# Production Migration Fix - 20251228225021_sync_schema_drift

## Issue
The migration `20251228225021_sync_schema_drift` failed in production because it attempted to alter tables and rename indexes that don't exist in the production database.

## What Happened
1. Migration failed with P3009 error
2. Production deployment used `db push` as fallback
3. Schema is now synced, but migration is marked as failed
4. This blocks future migrations from running

## Solution

### Step 1: Mark Failed Migration as Rolled Back

In production, run this command to mark the failed migration as rolled back:

```bash
cd backend
npx prisma migrate resolve --rolled-back 20251228225021_sync_schema_drift
```

**Why rolled-back?** Because `db push` already synced the schema, so the migration changes are already applied, but we need to tell Prisma the migration itself failed and was handled via `db push`.

### Step 2: Verify Migration Status

```bash
npx prisma migrate status
```

You should see:
- All migrations applied
- `20251228225021_sync_schema_drift` marked as rolled back
- No pending migrations

### Step 3: Future Migrations

After resolving this, future migrations will work normally. The migration file has been updated to be a no-op since the schema is already synced.

## Alternative: Mark as Applied (If Needed)

If marking as rolled-back doesn't work, you can mark it as applied instead:

```bash
npx prisma migrate resolve --applied 20251228225021_sync_schema_drift
```

## Prevention

This happened because the migration was auto-generated from schema drift that included references to tables/indexes from other parts of the codebase that don't exist in production.

**Best Practice:** Always review auto-generated migrations before committing, especially when they include:
- Index renames
- Table alterations for tables that may not exist
- Changes to project-related tables (if project features aren't enabled)

