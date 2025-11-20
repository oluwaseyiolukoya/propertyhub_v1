-- ============================================
-- Add Developer Owner System Role
-- ============================================
-- This migration aligns the database system roles with
-- the documentation in docs/ROLE_BASED_PAGE_ACCESS_MATRIX.md
--
-- System Roles in docs:
--  - Developer Owner  (Primary developer admin & account holder)
--  - Owner
--  - Finance Manager
--  - Project Manager
--  - Accountant
--  - Viewer
--
-- Existing seed (insert_system_roles.sql) already creates:
--  Owner, Finance Manager, Project Manager, Accountant, Viewer
-- This migration adds the missing Developer Owner role.

INSERT INTO team_roles (
    id,
    name,
    description,
    is_system_role,
    permissions,
    can_approve_invoices,
    approval_limit,
    requires_approval_from,
    created_at,
    updated_at
) VALUES (
    'role-developer-owner',
    'Developer Owner',
    'Primary developer admin & account holder with full system access',
    true,
    '{"all": true}'::json,
    true,
    NULL,
    ARRAY[]::text[],
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    can_approve_invoices = EXCLUDED.can_approve_invoices,
    approval_limit = EXCLUDED.approval_limit,
    updated_at = NOW();

-- Optional sanity notice
DO $$
DECLARE
    dev_owner_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO dev_owner_count
    FROM team_roles
    WHERE id = 'role-developer-owner' AND is_system_role = true;

    IF dev_owner_count = 1 THEN
        RAISE NOTICE '✅ Developer Owner system role is present in team_roles';
    ELSE
        RAISE WARNING '⚠️ Developer Owner role was not inserted as expected';
    END IF;
END $$;


