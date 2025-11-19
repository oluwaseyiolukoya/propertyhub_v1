-- ============================================
-- Team Management & Invoice Approval System
-- Migration Date: November 19, 2025
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TEAM ROLES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS team_roles (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id       TEXT REFERENCES customers(id) ON DELETE CASCADE,

  -- Role Details
  name              TEXT NOT NULL,
  description       TEXT,
  is_system_role    BOOLEAN DEFAULT false,

  -- Permissions (JSON for flexibility)
  permissions       JSONB NOT NULL DEFAULT '{}',

  -- Invoice Approval Settings
  can_approve_invoices BOOLEAN DEFAULT false,
  approval_limit    DECIMAL(15,2),
  requires_approval_from TEXT[],

  -- Audit
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),

  UNIQUE(customer_id, name)
);

CREATE INDEX IF NOT EXISTS idx_team_roles_customer ON team_roles(customer_id);
CREATE INDEX IF NOT EXISTS idx_team_roles_system ON team_roles(is_system_role) WHERE is_system_role = true;

COMMENT ON TABLE team_roles IS 'Predefined roles with permissions for team members';
COMMENT ON COLUMN team_roles.approval_limit IS 'Maximum invoice amount this role can approve (NULL = unlimited)';
COMMENT ON COLUMN team_roles.requires_approval_from IS 'Array of role IDs that must approve before this role';

-- Insert default system roles
INSERT INTO team_roles (id, customer_id, name, description, is_system_role, permissions, can_approve_invoices, approval_limit) VALUES
  ('role-owner', NULL, 'Owner', 'Full access to all features', true, '{"all": true}'::jsonb, true, NULL),
  ('role-finance-manager', NULL, 'Finance Manager', 'Approve invoices and manage finances', true, '{"invoices": "approve", "expenses": "manage", "reports": "view"}'::jsonb, true, NULL),
  ('role-project-manager', NULL, 'Project Manager', 'Create invoices and manage projects', true, '{"invoices": "create", "projects": "manage", "reports": "view"}'::jsonb, false, 1000000),
  ('role-accountant', NULL, 'Accountant', 'Record payments and view reports', true, '{"payments": "record", "reports": "view", "invoices": "view"}'::jsonb, false, NULL),
  ('role-viewer', NULL, 'Viewer', 'View-only access', true, '{"projects": "view", "invoices": "view"}'::jsonb, false, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. TEAM MEMBERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS team_members (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id       TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id           TEXT REFERENCES users(id) ON DELETE CASCADE,
  role_id           TEXT NOT NULL REFERENCES team_roles(id),

  -- Member Details
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  job_title         TEXT,
  department        TEXT,

  -- Status & Permissions
  status            TEXT NOT NULL DEFAULT 'active',
  can_approve_invoices BOOLEAN DEFAULT false,
  approval_limit    DECIMAL(15,2),
  can_create_invoices BOOLEAN DEFAULT false,
  can_manage_projects BOOLEAN DEFAULT false,
  can_view_reports  BOOLEAN DEFAULT false,

  -- Delegation
  delegate_to       TEXT REFERENCES team_members(id),
  delegation_start  TIMESTAMP,
  delegation_end    TIMESTAMP,

  -- Audit
  invited_by        TEXT REFERENCES users(id),
  invited_at        TIMESTAMP DEFAULT NOW(),
  joined_at         TIMESTAMP,
  last_active       TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),

  UNIQUE(customer_id, email),
  CHECK (status IN ('active', 'inactive', 'suspended', 'invited'))
);

CREATE INDEX IF NOT EXISTS idx_team_members_customer ON team_members(customer_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_approver ON team_members(can_approve_invoices, status) WHERE can_approve_invoices = true AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);

COMMENT ON TABLE team_members IS 'Team members with roles and permissions for invoice approval';
COMMENT ON COLUMN team_members.status IS 'Member status: active, inactive, suspended, invited';
COMMENT ON COLUMN team_members.approval_limit IS 'Maximum invoice amount this member can approve (NULL = use role limit)';

-- ============================================
-- 3. INVOICE APPROVAL WORKFLOWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS invoice_approval_workflows (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id       TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Workflow Details
  name              TEXT NOT NULL,
  description       TEXT,
  is_active         BOOLEAN DEFAULT true,
  is_default        BOOLEAN DEFAULT false,

  -- Trigger Conditions
  min_amount        DECIMAL(15,2),
  max_amount        DECIMAL(15,2),
  categories        TEXT[],

  -- Approval Levels (JSON array of levels)
  approval_levels   JSONB NOT NULL,

  -- Auto-approval Rules
  auto_approve_under DECIMAL(15,2),

  -- Audit
  created_by        TEXT REFERENCES users(id),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),

  UNIQUE(customer_id, name)
);

CREATE INDEX IF NOT EXISTS idx_workflows_customer ON invoice_approval_workflows(customer_id);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON invoice_approval_workflows(is_active, is_default);
CREATE INDEX IF NOT EXISTS idx_workflows_amount ON invoice_approval_workflows(min_amount, max_amount) WHERE is_active = true;

COMMENT ON TABLE invoice_approval_workflows IS 'Configurable approval workflows for invoices';
COMMENT ON COLUMN invoice_approval_workflows.approval_levels IS 'JSON array defining approval levels, required approvers, and timeouts';
COMMENT ON COLUMN invoice_approval_workflows.auto_approve_under IS 'Auto-approve invoices below this amount';

-- ============================================
-- 4. INVOICE APPROVALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS invoice_approvals (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_id        TEXT NOT NULL REFERENCES project_invoices(id) ON DELETE CASCADE,
  workflow_id       TEXT REFERENCES invoice_approval_workflows(id),

  -- Approval Details
  level             INTEGER NOT NULL,
  level_name        TEXT,
  approver_id       TEXT NOT NULL REFERENCES team_members(id),

  -- Decision
  status            TEXT NOT NULL DEFAULT 'pending',
  decision          TEXT,
  comments          TEXT,

  -- Timestamps
  requested_at      TIMESTAMP DEFAULT NOW(),
  responded_at      TIMESTAMP,
  due_at            TIMESTAMP,

  -- Delegation
  delegated_to      TEXT REFERENCES team_members(id),
  delegated_at      TIMESTAMP,

  -- Notifications
  notification_sent BOOLEAN DEFAULT false,
  reminder_count    INTEGER DEFAULT 0,
  last_reminder_at  TIMESTAMP,

  CHECK (status IN ('pending', 'approved', 'rejected', 'delegated', 'expired')),
  CHECK (decision IS NULL OR decision IN ('approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_approvals_invoice ON invoice_approvals(invoice_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON invoice_approvals(approver_id, status);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON invoice_approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_due ON invoice_approvals(due_at, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_approvals_workflow ON invoice_approvals(workflow_id);

COMMENT ON TABLE invoice_approvals IS 'Individual approval requests for invoices';
COMMENT ON COLUMN invoice_approvals.level IS 'Which level in the workflow (1, 2, 3, etc.)';
COMMENT ON COLUMN invoice_approvals.status IS 'Current status: pending, approved, rejected, delegated, expired';

-- ============================================
-- 5. APPROVAL HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS approval_history (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_id        TEXT NOT NULL REFERENCES project_invoices(id) ON DELETE CASCADE,
  approval_id       TEXT REFERENCES invoice_approvals(id),

  -- Action Details
  action            TEXT NOT NULL,
  actor_id          TEXT REFERENCES team_members(id),
  actor_name        TEXT NOT NULL,
  actor_role        TEXT,

  -- Details
  level             INTEGER,
  comments          TEXT,
  previous_status   TEXT,
  new_status        TEXT,

  -- Metadata
  metadata          JSONB,
  ip_address        TEXT,
  user_agent        TEXT,

  -- Timestamp
  created_at        TIMESTAMP DEFAULT NOW(),

  CHECK (action IN ('submitted', 'approved', 'rejected', 'delegated', 'escalated', 'auto_approved', 'reminded', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_history_invoice ON approval_history(invoice_id);
CREATE INDEX IF NOT EXISTS idx_history_actor ON approval_history(actor_id);
CREATE INDEX IF NOT EXISTS idx_history_action ON approval_history(action);
CREATE INDEX IF NOT EXISTS idx_history_created ON approval_history(created_at DESC);

COMMENT ON TABLE approval_history IS 'Complete audit trail of all approval actions';
COMMENT ON COLUMN approval_history.action IS 'Action type: submitted, approved, rejected, delegated, escalated, auto_approved, reminded, expired';

-- ============================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_team_roles_updated_at BEFORE UPDATE ON team_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON invoice_approval_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log approval history
CREATE OR REPLACE FUNCTION log_approval_action()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO approval_history (
      invoice_id,
      approval_id,
      action,
      actor_id,
      actor_name,
      level,
      new_status,
      created_at
    ) VALUES (
      NEW.invoice_id,
      NEW.id,
      'submitted',
      NEW.approver_id,
      (SELECT first_name || ' ' || last_name FROM team_members WHERE id = NEW.approver_id),
      NEW.level,
      NEW.status,
      NOW()
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO approval_history (
      invoice_id,
      approval_id,
      action,
      actor_id,
      actor_name,
      level,
      comments,
      previous_status,
      new_status,
      created_at
    ) VALUES (
      NEW.invoice_id,
      NEW.id,
      CASE
        WHEN NEW.status = 'approved' THEN 'approved'
        WHEN NEW.status = 'rejected' THEN 'rejected'
        WHEN NEW.status = 'delegated' THEN 'delegated'
        ELSE 'updated'
      END,
      NEW.approver_id,
      (SELECT first_name || ' ' || last_name FROM team_members WHERE id = NEW.approver_id),
      NEW.level,
      NEW.comments,
      OLD.status,
      NEW.status,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_approval_changes AFTER INSERT OR UPDATE ON invoice_approvals
  FOR EACH ROW EXECUTE FUNCTION log_approval_action();

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Get active approvers for a customer
CREATE OR REPLACE FUNCTION get_active_approvers(p_customer_id TEXT)
RETURNS TABLE (
  member_id TEXT,
  member_name TEXT,
  role_name TEXT,
  approval_limit DECIMAL(15,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tm.id,
    tm.first_name || ' ' || tm.last_name,
    tr.name,
    COALESCE(tm.approval_limit, tr.approval_limit)
  FROM team_members tm
  JOIN team_roles tr ON tm.role_id = tr.id
  WHERE tm.customer_id = p_customer_id
    AND tm.status = 'active'
    AND tm.can_approve_invoices = true
  ORDER BY tr.name, tm.first_name;
END;
$$ LANGUAGE plpgsql;

-- Get pending approvals for a member
CREATE OR REPLACE FUNCTION get_pending_approvals(p_member_id TEXT)
RETURNS TABLE (
  approval_id TEXT,
  invoice_id TEXT,
  invoice_number TEXT,
  amount DECIMAL(15,2),
  vendor_name TEXT,
  level INTEGER,
  due_at TIMESTAMP,
  requested_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ia.id,
    ia.invoice_id,
    pi.invoiceNumber,
    pi.amount,
    v.name,
    ia.level,
    ia.due_at,
    ia.requested_at
  FROM invoice_approvals ia
  JOIN project_invoices pi ON ia.invoice_id = pi.id
  LEFT JOIN vendors v ON pi.vendorId = v.id
  WHERE ia.approver_id = p_member_id
    AND ia.status = 'pending'
  ORDER BY ia.due_at ASC NULLS LAST, ia.requested_at ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. SAMPLE DATA (for testing)
-- ============================================

-- Note: Sample data will be added per customer during onboarding

SELECT 'Team Management System tables created successfully' AS status;

