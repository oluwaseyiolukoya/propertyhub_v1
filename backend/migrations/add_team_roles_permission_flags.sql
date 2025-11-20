-- ============================================
-- Add explicit permission flags to team_roles
-- Date: November 20, 2025
-- ============================================

-- These columns mirror the conceptual model used in the codebase:
-- - team_roles defines the *default* permissions for a role
-- - team_members can override these per-user
--
-- The columns are added with safe defaults and IF NOT EXISTS
-- so this migration is idempotent and safe in production.

ALTER TABLE team_roles
  ADD COLUMN IF NOT EXISTS can_create_invoices BOOLEAN DEFAULT false;

ALTER TABLE team_roles
  ADD COLUMN IF NOT EXISTS can_manage_projects BOOLEAN DEFAULT false;

ALTER TABLE team_roles
  ADD COLUMN IF NOT EXISTS can_view_reports BOOLEAN DEFAULT false;

-- Optional: backfill existing system roles if they already exist
-- (safe even if table is currently empty)
UPDATE team_roles
SET
  can_create_invoices = CASE
    WHEN name IN ('Owner', 'Project Manager') THEN true
    ELSE can_create_invoices
  END,
  can_manage_projects = CASE
    WHEN name IN ('Owner', 'Project Manager') THEN true
    ELSE can_manage_projects
  END,
  can_view_reports = true
WHERE is_system_role = true;


