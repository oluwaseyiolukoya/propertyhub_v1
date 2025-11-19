-- Add team invitation email template with temporary password
-- Run: PGPASSWORD=Contrezz2025 psql -h localhost -U oluwaseyio -d contrezz -f backend/migrations/add_team_invitation_template.sql

-- Insert or update the team invitation template
INSERT INTO notification_templates (
  customer_id,
  name,
  type,
  subject,
  body_html,
  variables,
  is_system,
  is_active,
  created_at,
  updated_at
) VALUES (
  NULL,
  'Team Invitation with Temporary Password',
  'team_invitation',
  'Welcome to {{companyName}} - Your Account Details',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2563eb;">Welcome to {{companyName}}!</h2>

    <p>Hi {{memberName}},</p>

    <p>You have been invited to join <strong>{{companyName}}</strong> as a <strong>{{roleName}}</strong> by {{inviterName}}.</p>

    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1f2937;">Your Login Credentials</h3>
      <p style="margin: 10px 0;"><strong>Email:</strong> {{email}}</p>
      <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 16px;">{{temporaryPassword}}</code></p>
      <p style="margin: 10px 0; color: #dc2626; font-size: 14px;">⚠️ This password will expire in <strong>{{expiryHours}} hours</strong></p>
    </div>

    <div style="margin: 30px 0;">
      <a href="{{loginUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Login to Your Account</a>
    </div>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e;"><strong>Important:</strong> You will be required to change your password upon first login for security purposes.</p>
    </div>

    <h3 style="color: #1f2937;">Your Role & Permissions</h3>
    <ul style="color: #4b5563;">
      <li><strong>Role:</strong> {{roleName}}</li>
      <li><strong>Department:</strong> {{department}}</li>
      <li><strong>Job Title:</strong> {{jobTitle}}</li>
    </ul>

    <h3 style="color: #1f2937;">Getting Started</h3>
    <ol style="color: #4b5563;">
      <li>Click the "Login to Your Account" button above</li>
      <li>Enter your email and temporary password</li>
      <li>Create a new secure password</li>
      <li>Complete your profile setup</li>
      <li>Start collaborating with your team!</li>
    </ol>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">If you did not expect this invitation or have any questions, please contact {{inviterEmail}}.</p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      This is an automated message from {{companyName}}. Please do not reply to this email.
    </p>
  </div>',
  '["memberName", "companyName", "roleName", "inviterName", "email", "temporaryPassword", "expiryHours", "loginUrl", "department", "jobTitle", "inviterEmail"]',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (customer_id, name, type) DO UPDATE SET
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  variables = EXCLUDED.variables,
  updated_at = NOW();

