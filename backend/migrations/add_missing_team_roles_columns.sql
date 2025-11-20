-- Add missing columns to team_roles table
-- These columns were defined in the Prisma schema but not in the database

ALTER TABLE team_roles
ADD COLUMN IF NOT EXISTS can_create_invoices BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_projects BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_reports BOOLEAN DEFAULT false;

-- Update existing system roles with appropriate permissions
UPDATE team_roles
SET
  can_create_invoices = true,
  can_manage_projects = true,
  can_view_reports = true
WHERE name = 'Owner' AND is_system_role = true;

UPDATE team_roles
SET
  can_create_invoices = true,
  can_manage_projects = false,
  can_view_reports = true
WHERE name = 'Finance Manager' AND is_system_role = true;

UPDATE team_roles
SET
  can_create_invoices = false,
  can_manage_projects = true,
  can_view_reports = true
WHERE name = 'Project Manager' AND is_system_role = true;

UPDATE team_roles
SET
  can_create_invoices = true,
  can_manage_projects = false,
  can_view_reports = true
WHERE name = 'Accountant' AND is_system_role = true;

UPDATE team_roles
SET
  can_create_invoices = false,
  can_manage_projects = false,
  can_view_reports = true
WHERE name = 'Viewer' AND is_system_role = true;

UPDATE team_roles
SET
  can_create_invoices = true,
  can_manage_projects = true,
  can_view_reports = true
WHERE name = 'Developer Owner' AND is_system_role = true;

-- Verify the changes
SELECT
  name,
  can_approve_invoices,
  can_create_invoices,
  can_manage_projects,
  can_view_reports
FROM team_roles
WHERE is_system_role = true
ORDER BY name;

