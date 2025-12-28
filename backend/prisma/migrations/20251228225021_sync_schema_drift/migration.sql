-- This migration syncs schema drift (index renames and default values)
-- Since db push was used in production, this migration is marked as rolled back
-- and the schema is already in sync. This file is kept for migration history.

-- Note: The original migration attempted to rename indexes and alter tables
-- that may not exist in all environments. Since db push handled the sync,
-- this migration is effectively a no-op for production.

-- No SQL changes needed - schema already synced via db push
