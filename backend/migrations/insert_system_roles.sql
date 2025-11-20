-- ============================================
-- Insert System Roles Migration
-- This ensures all 5 system roles exist in production
-- ============================================

-- Insert system roles (will skip if already exist)
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
) VALUES
-- Owner Role
(
    'role-owner',
    'Owner',
    'Full system control and access to all features',
    true,
    '{"all": true}'::json,
    true,
    NULL,
    ARRAY[]::text[],
    NOW(),
    NOW()
),
-- Finance Manager Role
(
    'role-finance-manager',
    'Finance Manager',
    'Financial oversight and invoice approval up to specified limit',
    true,
    '{"reports": "view", "expenses": "manage", "invoices": "approve", "projects": "view"}'::json,
    true,
    50000.00,
    ARRAY[]::text[],
    NOW(),
    NOW()
),
-- Project Manager Role
(
    'role-project-manager',
    'Project Manager',
    'Project operations and team management',
    true,
    '{"reports": "view", "invoices": "create", "projects": "manage"}'::json,
    false,
    1000000.00,
    ARRAY[]::text[],
    NOW(),
    NOW()
),
-- Accountant Role
(
    'role-accountant',
    'Accountant',
    'Financial records and reporting access',
    true,
    '{"reports": "view", "invoices": "view", "payments": "record"}'::json,
    false,
    NULL,
    ARRAY[]::text[],
    NOW(),
    NOW()
),
-- Viewer Role
(
    'role-viewer',
    'Viewer',
    'Read-only access to projects and reports',
    true,
    '{"invoices": "view", "projects": "view"}'::json,
    false,
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

-- Verify insertion
DO $$
DECLARE
    role_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO role_count FROM team_roles WHERE is_system_role = true;
    RAISE NOTICE '✅ System roles in database: %', role_count;

    IF role_count = 5 THEN
        RAISE NOTICE '✅ All 5 system roles successfully inserted/updated';
    ELSE
        RAISE WARNING '⚠️  Expected 5 system roles, found %', role_count;
    END IF;
END $$;

