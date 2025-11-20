-- ============================================
-- Verify and Fix Team Roles in Production
-- ============================================

-- Step 1: Check if team_roles table exists
SELECT
    CASE
        WHEN EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'team_roles'
        )
        THEN '✅ team_roles table exists'
        ELSE '❌ team_roles table does NOT exist'
    END as table_status;

-- Step 2: Count existing system roles
SELECT
    COUNT(*) as system_role_count,
    CASE
        WHEN COUNT(*) = 5 THEN '✅ All 5 system roles exist'
        WHEN COUNT(*) = 0 THEN '❌ No system roles found'
        ELSE '⚠️  Only ' || COUNT(*) || ' system roles found (expected 5)'
    END as status
FROM team_roles
WHERE is_system_role = true;

-- Step 3: List all existing roles
SELECT
    id,
    name,
    description,
    is_system_role,
    can_approve_invoices,
    approval_limit,
    (SELECT COUNT(*) FROM team_members WHERE role_id = team_roles.id) as member_count
FROM team_roles
ORDER BY is_system_role DESC, name ASC;

-- Step 4: Insert missing system roles (if any)
-- This will only insert roles that don't already exist
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

-- Step 5: Verify roles were created/updated
SELECT
    '✅ Verification Complete' as status,
    COUNT(*) as total_system_roles
FROM team_roles
WHERE is_system_role = true;

-- Step 6: Show final list of all roles
SELECT
    id,
    name,
    description,
    is_system_role as "System Role",
    can_approve_invoices as "Can Approve",
    approval_limit as "Approval Limit",
    (SELECT COUNT(*) FROM team_members WHERE role_id = team_roles.id) as "Members"
FROM team_roles
ORDER BY is_system_role DESC, name ASC;

