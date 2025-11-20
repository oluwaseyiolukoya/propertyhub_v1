-- Seed default system roles for team management
-- This migration is DATA-ONLY and safe to run multiple times.
-- It is also safe in environments where the team_roles table does not yet exist.

DO $$
BEGIN
  -- Only run if team_roles table exists in this database
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'team_roles'
  ) THEN

    -- Insert 5 default system roles (idempotent via ON CONFLICT DO NOTHING)
    INSERT INTO team_roles (
      id,
      customer_id,
      name,
      description,
      is_system_role,
      permissions,
      can_approve_invoices,
      approval_limit,
      requires_approval_from,
      created_at,
      updated_at
    )
    VALUES
      (
        'role-owner',
        NULL,
        'Owner',
        'Full access to all features',
        TRUE,
        '{"all": true}',
        TRUE,
        NULL,
        ARRAY[]::text[],
        NOW(),
        NOW()
      ),
      (
        'role-finance-manager',
        NULL,
        'Finance Manager',
        'Approve invoices and manage finances',
        TRUE,
        '{"invoices": "approve", "expenses": "manage", "reports": "view", "projects": "view"}',
        TRUE,
        50000,
        ARRAY[]::text[],
        NOW(),
        NOW()
      ),
      (
        'role-project-manager',
        NULL,
        'Project Manager',
        'Create invoices and manage projects',
        TRUE,
        '{"invoices": "create", "projects": "manage", "reports": "view"}',
        FALSE,
        1000000,
        ARRAY[]::text[],
        NOW(),
        NOW()
      ),
      (
        'role-accountant',
        NULL,
        'Accountant',
        'Record payments and view reports',
        TRUE,
        '{"payments": "record", "reports": "view", "invoices": "view"}',
        FALSE,
        NULL,
        ARRAY[]::text[],
        NOW(),
        NOW()
      ),
      (
        'role-viewer',
        NULL,
        'Viewer',
        'View-only access',
        TRUE,
        '{"projects": "view", "invoices": "view"}',
        FALSE,
        NULL,
        ARRAY[]::text[],
        NOW(),
        NOW()
      )
    ON CONFLICT (id) DO NOTHING;

  ELSE
    RAISE NOTICE 'team_roles table does not exist in this database. Skipping system roles seed.';
  END IF;

END $$;


