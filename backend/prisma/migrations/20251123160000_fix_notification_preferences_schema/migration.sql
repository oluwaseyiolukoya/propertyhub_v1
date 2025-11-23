-- Fix notification_preferences schema to match Prisma model and notification service
-- - Add missing columns expected by Prisma
-- - Add composite unique constraint on (user_id, customer_id)
-- This migration is written to be idempotent and safe to run multiple times.

-- 1) Add missing columns for email notification flags
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS email_invoice_approval   BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_invoice_approved   BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_invoice_rejected   BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_invoice_paid       BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_team_invitation    BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_delegation         BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_daily_digest       BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_weekly_summary     BOOLEAN DEFAULT FALSE;

-- 2) Add missing columns for in-app notification flags
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS inapp_enabled            BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS inapp_invoice_approval   BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS inapp_invoice_approved   BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS inapp_invoice_rejected   BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS inapp_invoice_paid       BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS inapp_team_invitation    BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS inapp_delegation         BOOLEAN DEFAULT TRUE;

-- 3) Add missing columns for push + quiet hours
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS push_enabled             BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS quiet_hours_enabled      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS quiet_hours_start        TIME,
  ADD COLUMN IF NOT EXISTS quiet_hours_end          TIME,
  ADD COLUMN IF NOT EXISTS quiet_hours_timezone     VARCHAR(50) DEFAULT 'UTC';

-- 4) Ensure created_at / updated_at columns exist (Prisma expects these fields)
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 5) Ensure composite unique constraint on (user_id, customer_id)
DO $$
BEGIN
  BEGIN
    ALTER TABLE notification_preferences
      ADD CONSTRAINT notification_preferences_user_customer_unique
      UNIQUE (user_id, customer_id);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Constraint already exists, ignore
      NULL;
  END;
END
$$;

-- 6) Helpful indexes (if not already created)
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id
  ON notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_customer_id
  ON notification_preferences(customer_id);


