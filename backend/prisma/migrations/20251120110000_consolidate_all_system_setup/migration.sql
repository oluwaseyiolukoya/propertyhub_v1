-- ============================================
-- CONSOLIDATED SYSTEM SETUP MIGRATION
-- This migration consolidates ALL system setup
-- that was previously in separate SQL files
-- ============================================

-- ============================================
-- PART 1: NOTIFICATION SYSTEM
-- (from create_notification_system.sql)
-- ============================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'unread',
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_customer ON notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  invoice_approved BOOLEAN DEFAULT true,
  invoice_rejected BOOLEAN DEFAULT true,
  invoice_pending_approval BOOLEAN DEFAULT true,
  team_invitation BOOLEAN DEFAULT true,
  payment_received BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- Create email_queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  priority INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority);
CREATE INDEX IF NOT EXISTS idx_email_queue_created ON email_queue(created_at);

-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB DEFAULT '[]',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_customer ON notification_templates(customer_id);

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  notification_id TEXT REFERENCES notifications(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_notification ON notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs(created_at);

-- ============================================
-- PART 2: NOTIFICATION TRIGGERS
-- (from fix_notification_preferences_trigger.sql)
-- ============================================

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS create_user_notification_preferences ON users;
DROP FUNCTION IF EXISTS create_default_notification_preferences();

-- Create fixed trigger function
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (
    user_id,
    customer_id,
    email_enabled,
    in_app_enabled,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW."customerId",  -- Fixed: use camelCase as in users table
    true,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER create_user_notification_preferences
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- ============================================
-- PART 3: DEFAULT NOTIFICATION TEMPLATES
-- (from add_team_invitation_template.sql + others)
-- ============================================

INSERT INTO notification_templates (type, subject, body_html, body_text, is_system, created_at, updated_at)
VALUES
  -- Team invitation template
  (
    'team_invitation',
    'Welcome to {{companyName}} - Your Account is Ready!',
    '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .credentials { background-color: #fff; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to {{companyName}}!</h1>
    </div>
    <div class="content">
      <p>Hi {{memberName}},</p>
      <p>{{inviterName}} has invited you to join <strong>{{companyName}}</strong> as a <strong>{{roleName}}</strong>.</p>
      
      <div class="credentials">
        <h3>Your Login Credentials</h3>
        <p><strong>Email:</strong> {{email}}</p>
        <p><strong>Temporary Password:</strong> <code>{{temporaryPassword}}</code></p>
        <p><strong>Expires in:</strong> {{expiryHours}} hours</p>
      </div>
      
      <p><strong>⚠️ Important:</strong> For security reasons, you will be required to change your password on first login.</p>
      
      <a href="{{loginUrl}}" class="button">Login to Your Account</a>
      
      <p>If you have any questions, please contact your administrator.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from {{companyName}}.</p>
      <p>If you did not expect this invitation, please ignore this email.</p>
    </div>
  </div>
</body>
</html>',
    'Welcome to {{companyName}}!\n\nHi {{memberName}},\n\n{{inviterName}} has invited you to join {{companyName}} as a {{roleName}}.\n\nYour Login Credentials:\nEmail: {{email}}\nTemporary Password: {{temporaryPassword}}\nExpires in: {{expiryHours}} hours\n\nIMPORTANT: You will be required to change your password on first login.\n\nLogin here: {{loginUrl}}\n\nIf you have any questions, please contact your administrator.',
    true,
    NOW(),
    NOW()
  ),
  
  -- Invoice approved template
  (
    'invoice_approved',
    'Invoice {{invoiceNumber}} Approved',
    '<p>Your invoice <strong>{{invoiceNumber}}</strong> for {{amount}} has been approved by {{approverName}}.</p>',
    'Your invoice {{invoiceNumber}} for {{amount}} has been approved by {{approverName}}.',
    true,
    NOW(),
    NOW()
  ),
  
  -- Invoice rejected template
  (
    'invoice_rejected',
    'Invoice {{invoiceNumber}} Rejected',
    '<p>Your invoice <strong>{{invoiceNumber}}</strong> has been rejected by {{approverName}}.</p><p>Reason: {{reason}}</p>',
    'Your invoice {{invoiceNumber}} has been rejected by {{approverName}}. Reason: {{reason}}',
    true,
    NOW(),
    NOW()
  ),
  
  -- Invoice pending approval template
  (
    'invoice_pending_approval',
    'New Invoice Awaiting Your Approval',
    '<p>Invoice <strong>{{invoiceNumber}}</strong> for {{amount}} is awaiting your approval.</p>',
    'Invoice {{invoiceNumber}} for {{amount}} is awaiting your approval.',
    true,
    NOW(),
    NOW()
  ),
  
  -- Payment received template
  (
    'payment_received',
    'Payment Received for Invoice {{invoiceNumber}}',
    '<p>Payment of {{amount}} has been received for invoice <strong>{{invoiceNumber}}</strong>.</p>',
    'Payment of {{amount}} has been received for invoice {{invoiceNumber}}.',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (type) DO NOTHING;

-- ============================================
-- PART 4: SYSTEM ROLES SEEDING
-- (from seed_system_roles migration)
-- ============================================

INSERT INTO team_roles (id, customer_id, name, description, is_system_role, permissions, can_approve_invoices, approval_limit, requires_approval_from, created_at, updated_at)
VALUES
  (
    'role-owner',
    NULL,
    'Owner',
    'Full access to all features',
    true,
    '{"all": true}'::jsonb,
    true,
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
    true,
    '{"invoices": "approve", "expenses": "manage", "reports": "view", "projects": "view"}'::jsonb,
    true,
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
    true,
    '{"invoices": "create", "projects": "manage", "reports": "view"}'::jsonb,
    false,
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
    true,
    '{"payments": "record", "reports": "view", "invoices": "view"}'::jsonb,
    false,
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
    true,
    '{"projects": "view", "invoices": "view"}'::jsonb,
    false,
    NULL,
    ARRAY[]::text[],
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- This section just documents what should exist
-- Actual verification happens in application code

-- Expected tables:
--   ✓ notifications
--   ✓ notification_preferences
--   ✓ email_queue
--   ✓ notification_templates
--   ✓ notification_logs
--   ✓ team_roles (with 5 system roles)

-- Expected triggers:
--   ✓ create_user_notification_preferences

-- Expected templates:
--   ✓ team_invitation
--   ✓ invoice_approved
--   ✓ invoice_rejected
--   ✓ invoice_pending_approval
--   ✓ payment_received

