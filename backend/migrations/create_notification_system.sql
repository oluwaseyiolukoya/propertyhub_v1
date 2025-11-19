-- =====================================================
-- NOTIFICATION SYSTEM MIGRATION
-- Phase 3: Notifications & Advanced Features
-- =====================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    action_url VARCHAR(500),
    priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    -- Email notifications
    email_enabled BOOLEAN DEFAULT TRUE,
    email_invoice_approval BOOLEAN DEFAULT TRUE,
    email_invoice_approved BOOLEAN DEFAULT TRUE,
    email_invoice_rejected BOOLEAN DEFAULT TRUE,
    email_invoice_paid BOOLEAN DEFAULT TRUE,
    email_team_invitation BOOLEAN DEFAULT TRUE,
    email_delegation BOOLEAN DEFAULT TRUE,
    email_daily_digest BOOLEAN DEFAULT FALSE,
    email_weekly_summary BOOLEAN DEFAULT FALSE,

    -- In-app notifications
    inapp_enabled BOOLEAN DEFAULT TRUE,
    inapp_invoice_approval BOOLEAN DEFAULT TRUE,
    inapp_invoice_approved BOOLEAN DEFAULT TRUE,
    inapp_invoice_rejected BOOLEAN DEFAULT TRUE,
    inapp_invoice_paid BOOLEAN DEFAULT TRUE,
    inapp_team_invitation BOOLEAN DEFAULT TRUE,
    inapp_delegation BOOLEAN DEFAULT TRUE,

    -- Push notifications (future)
    push_enabled BOOLEAN DEFAULT FALSE,

    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    quiet_hours_timezone VARCHAR(50) DEFAULT 'UTC',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, customer_id)
);

-- Create email queue table
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    to_email VARCHAR(255) NOT NULL,
    to_name VARCHAR(255),
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    template_name VARCHAR(100),
    template_data JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    failed_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(500),
    body_html TEXT,
    body_text TEXT,
    variables JSONB DEFAULT '[]',
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(customer_id, name, type)
);

-- Create notification logs table (for audit trail)
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_customer_id ON notification_preferences(customer_id);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_customer_id ON email_queue(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority DESC);

CREATE INDEX IF NOT EXISTS idx_notification_templates_customer_id ON notification_templates(customer_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_id ON notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_customer_id ON notification_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

CREATE TRIGGER notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

CREATE TRIGGER email_queue_updated_at
    BEFORE UPDATE ON email_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

CREATE TRIGGER notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

-- Insert default system notification templates
INSERT INTO notification_templates (name, type, subject, body_html, body_text, variables, is_system, is_active) VALUES
(
    'invoice_approval_request',
    'email',
    'Invoice Approval Required: {{invoiceNumber}}',
    '<h2>Invoice Approval Required</h2><p>Hello {{approverName}},</p><p>An invoice requires your approval:</p><ul><li><strong>Invoice Number:</strong> {{invoiceNumber}}</li><li><strong>Amount:</strong> {{amount}}</li><li><strong>Vendor:</strong> {{vendorName}}</li><li><strong>Due Date:</strong> {{dueDate}}</li></ul><p><a href="{{actionUrl}}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Invoice</a></p>',
    'Invoice Approval Required\n\nHello {{approverName}},\n\nAn invoice requires your approval:\n\nInvoice Number: {{invoiceNumber}}\nAmount: {{amount}}\nVendor: {{vendorName}}\nDue Date: {{dueDate}}\n\nReview at: {{actionUrl}}',
    '["approverName", "invoiceNumber", "amount", "vendorName", "dueDate", "actionUrl"]',
    TRUE,
    TRUE
),
(
    'invoice_approved',
    'email',
    'Invoice Approved: {{invoiceNumber}}',
    '<h2>Invoice Approved</h2><p>Hello {{requesterName}},</p><p>Your invoice has been approved:</p><ul><li><strong>Invoice Number:</strong> {{invoiceNumber}}</li><li><strong>Amount:</strong> {{amount}}</li><li><strong>Approved By:</strong> {{approverName}}</li><li><strong>Approved At:</strong> {{approvedAt}}</li></ul><p><a href="{{actionUrl}}" style="background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Invoice</a></p>',
    'Invoice Approved\n\nHello {{requesterName}},\n\nYour invoice has been approved:\n\nInvoice Number: {{invoiceNumber}}\nAmount: {{amount}}\nApproved By: {{approverName}}\nApproved At: {{approvedAt}}\n\nView at: {{actionUrl}}',
    '["requesterName", "invoiceNumber", "amount", "approverName", "approvedAt", "actionUrl"]',
    TRUE,
    TRUE
),
(
    'invoice_rejected',
    'email',
    'Invoice Rejected: {{invoiceNumber}}',
    '<h2>Invoice Rejected</h2><p>Hello {{requesterName}},</p><p>Your invoice has been rejected:</p><ul><li><strong>Invoice Number:</strong> {{invoiceNumber}}</li><li><strong>Amount:</strong> {{amount}}</li><li><strong>Rejected By:</strong> {{approverName}}</li><li><strong>Reason:</strong> {{reason}}</li><li><strong>Comments:</strong> {{comments}}</li></ul><p><a href="{{actionUrl}}" style="background-color: #EF4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Invoice</a></p>',
    'Invoice Rejected\n\nHello {{requesterName}},\n\nYour invoice has been rejected:\n\nInvoice Number: {{invoiceNumber}}\nAmount: {{amount}}\nRejected By: {{approverName}}\nReason: {{reason}}\nComments: {{comments}}\n\nView at: {{actionUrl}}',
    '["requesterName", "invoiceNumber", "amount", "approverName", "reason", "comments", "actionUrl"]',
    TRUE,
    TRUE
),
(
    'team_invitation',
    'email',
    'You''ve been invited to join {{organizationName}}',
    '<h2>Team Invitation</h2><p>Hello {{inviteeName}},</p><p>You''ve been invited to join <strong>{{organizationName}}</strong> as a <strong>{{roleName}}</strong>.</p><p>Invited by: {{inviterName}}</p><p><a href="{{actionUrl}}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>',
    'Team Invitation\n\nHello {{inviteeName}},\n\nYou''ve been invited to join {{organizationName}} as a {{roleName}}.\n\nInvited by: {{inviterName}}\n\nAccept invitation at: {{actionUrl}}',
    '["inviteeName", "organizationName", "roleName", "inviterName", "actionUrl"]',
    TRUE,
    TRUE
),
(
    'delegation_assigned',
    'email',
    'Approval Delegation Assigned',
    '<h2>Approval Delegation</h2><p>Hello {{delegateName}},</p><p><strong>{{delegatorName}}</strong> has delegated their approval authority to you.</p><ul><li><strong>From:</strong> {{startDate}}</li><li><strong>To:</strong> {{endDate}}</li><li><strong>Reason:</strong> {{reason}}</li></ul><p><a href="{{actionUrl}}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Pending Approvals</a></p>',
    'Approval Delegation\n\nHello {{delegateName}},\n\n{{delegatorName}} has delegated their approval authority to you.\n\nFrom: {{startDate}}\nTo: {{endDate}}\nReason: {{reason}}\n\nView pending approvals at: {{actionUrl}}',
    '["delegateName", "delegatorName", "startDate", "endDate", "reason", "actionUrl"]',
    TRUE,
    TRUE
)
ON CONFLICT (customer_id, name, type) DO NOTHING;

-- Create function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id, customer_id)
    VALUES (NEW.id, NEW.customer_id)
    ON CONFLICT (user_id, customer_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create notification preferences
CREATE TRIGGER create_user_notification_preferences
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE notifications
    SET read = TRUE, read_at = CURRENT_TIMESTAMP
    WHERE id = notification_uuid AND user_id = user_uuid AND read = FALSE;

    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE notifications
    SET read = TRUE, read_at = CURRENT_TIMESTAMP
    WHERE user_id = user_uuid AND read = FALSE;

    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected;
END;
$$ LANGUAGE plpgsql;

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM notifications
    WHERE user_id = user_uuid AND read = FALSE;

    RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old notifications (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    rows_deleted INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days'
    AND read = TRUE;

    GET DIAGNOSTICS rows_deleted = ROW_COUNT;
    RETURN rows_deleted;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old notification logs (older than 180 days)
CREATE OR REPLACE FUNCTION cleanup_old_notification_logs()
RETURNS INTEGER AS $$
DECLARE
    rows_deleted INTEGER;
BEGIN
    DELETE FROM notification_logs
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '180 days';

    GET DIAGNOSTICS rows_deleted = ROW_COUNT;
    RETURN rows_deleted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE notifications IS 'Stores in-app notifications for users';
COMMENT ON TABLE notification_preferences IS 'User preferences for email and in-app notifications';
COMMENT ON TABLE email_queue IS 'Queue for outgoing emails with retry logic';
COMMENT ON TABLE notification_templates IS 'Email and notification templates with variable substitution';
COMMENT ON TABLE notification_logs IS 'Audit trail for notification actions';

