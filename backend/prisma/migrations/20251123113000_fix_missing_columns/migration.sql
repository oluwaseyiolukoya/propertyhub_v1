-- Align database schema with current Prisma models
-- This migration adds missing columns that are currently causing runtime errors
-- (P2022) because Prisma expects them but they do not exist in the database.

-- 1) plans.trialDurationDays
ALTER TABLE plans
ADD COLUMN IF NOT EXISTS "trialDurationDays" INTEGER;

-- 2) notifications.read and notifications.data
-- Existing table uses `status` and `metadata`; Prisma model expects `read` and `data`.
-- We add the new columns but keep the old ones for backward compatibility.
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS "read" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "data" JSONB DEFAULT '{}'::jsonb;

-- 3) email_queue extra fields used by new notification system
ALTER TABLE email_queue
ADD COLUMN IF NOT EXISTS "to_name" TEXT,
ADD COLUMN IF NOT EXISTS "from_name" TEXT,
ADD COLUMN IF NOT EXISTS "template_name" TEXT,
ADD COLUMN IF NOT EXISTS "template_data" JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "scheduled_at" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "failed_at" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "error_message" TEXT,
ADD COLUMN IF NOT EXISTS "retry_count" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "max_retries" INTEGER DEFAULT 3;

-- 4) customers storage tracking fields
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS "storage_used" BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS "storage_limit" BIGINT DEFAULT 5368709120,
ADD COLUMN IF NOT EXISTS "storage_last_calculated" TIMESTAMP DEFAULT NOW();

-- 5) users profile & password flow fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "bio" TEXT,
ADD COLUMN IF NOT EXISTS "is_temp_password" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "temp_password_expires_at" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "must_change_password" BOOLEAN DEFAULT FALSE;


