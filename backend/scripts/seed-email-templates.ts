import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedEmailTemplates() {
  console.log('🌱 Seeding email templates...');

  // First, update existing templates with new HTML format
  console.log('🔄 Updating existing templates with new HTML format...');

  const templates = [
    {
      name: 'Account Activation',
      type: 'activation',
      category: 'Onboarding',
      subject: '🎉 Your {{companyName}} Account is Now Active!',
      body_html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Activated - Contrezz Platform</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🎉 Your Account is Active!</h1>
      <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Welcome to Contrezz Platform</p>
    </div>

    <!-- Main Content -->
    <div style="background-color: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Hi <strong>{{customerName}}</strong>,
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
        Great news! Your <strong>{{applicationType}}</strong> account for <strong>{{companyName}}</strong> has been activated and is ready to use.
      </p>

      <!-- Login Credentials Box -->
      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 0 0 30px; border-radius: 4px;">
        <h2 style="color: #667eea; margin: 0 0 15px; font-size: 18px; font-weight: 600;">Your Login Credentials</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 40%;">Email:</td>
            <td style="padding: 8px 0;">
              <span style="background-color: #f3f4f6; color: #333333; padding: 6px 12px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 14px; font-weight: 500;">{{customerEmail}}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Temporary Password:</td>
            <td style="padding: 8px 0;">
              <span style="background-color: #f3f4f6; color: #333333; padding: 6px 12px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 14px; font-weight: 500;">{{temporaryPassword}}</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Security Warning -->
      <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 20px; margin: 0 0 30px; border-radius: 4px;">
        <h3 style="color: #92400e; margin: 0 0 10px; font-size: 16px; font-weight: 600;">⚠️ Security Notice</h3>
        <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
          For your security, please change your password immediately after logging in. This temporary password should not be shared with anyone.
        </p>
      </div>

      <!-- Login Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{loginUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Log In to Your Account
        </a>
      </div>

      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 20px;">
        If you have any questions or need assistance, please contact our support team at
        <a href="mailto:support@contrezz.com" style="color: #667eea; text-decoration: none; font-weight: 500;">support@contrezz.com</a>.
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;">
        Welcome aboard!<br>
        <strong>Contrezz Platform Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #999999; font-size: 12px;">
      <p style="margin: 0 0 5px;">This is an automated email. Please do not reply to this message.</p>
      <p style="margin: 0;">© ${new Date().getFullYear()} Contrezz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
      body_text: `Hi {{customerName}},

Great news! Your {{applicationType}} account for {{companyName}} has been activated and is ready to use.

Your Login Credentials:
Email: {{customerEmail}}
Temporary Password: {{temporaryPassword}}

⚠️ Security Notice: For your security, please change your password immediately after logging in. This temporary password should not be shared with anyone.

Log in here: {{loginUrl}}

If you have any questions or need assistance, please don't hesitate to contact our support team.

Welcome aboard!
The Contrezz Team

---
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} Contrezz. All rights reserved.`,
      variables: [
        { name: 'customerName', description: 'Customer full name', required: true },
        { name: 'customerEmail', description: 'Customer email address', required: true },
        { name: 'companyName', description: 'Company/business name', required: true },
        { name: 'temporaryPassword', description: 'Temporary password for login', required: true },
        { name: 'loginUrl', description: 'Login page URL', required: true },
        { name: 'applicationType', description: 'Type of account (Developer, Property Owner, etc.)', required: false },
      ],
      is_system: true,
      is_active: true,
    },
    {
      name: 'Onboarding Confirmation',
      type: 'onboarding',
      category: 'Onboarding',
      subject: 'Thank You for Your Application - {{companyName}}',
      body_html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Received - Contrezz Platform</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Application Received!</h1>
      <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Thank you for your interest in Contrezz Platform</p>
    </div>

    <!-- Main Content -->
    <div style="background-color: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Hi <strong>{{customerName}}</strong>,
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
        Thank you for your interest in Contrezz! We've received your application for <strong>{{companyName}}</strong>.
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
        Our team will review your application and get back to you within 1-2 business days.
      </p>

      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
        If you have any questions in the meantime, please contact our support team at
        <a href="mailto:support@contrezz.com" style="color: #667eea; text-decoration: none; font-weight: 500;">support@contrezz.com</a>.
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;">
        Best regards,<br>
        <strong>Contrezz Platform Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #999999; font-size: 12px;">
      <p style="margin: 0 0 5px;">This is an automated email. Please do not reply to this message.</p>
      <p style="margin: 0;">© ${new Date().getFullYear()} Contrezz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
      body_text: `Hi {{customerName}},

Thank you for your interest in Contrezz! We've received your application for {{companyName}}.

Our team will review your application and get back to you within 1-2 business days.

If you have any questions in the meantime, please feel free to contact us.

Best regards,
The Contrezz Team

---
© ${new Date().getFullYear()} Contrezz. All rights reserved.`,
      variables: [
        { name: 'customerName', description: 'Customer full name', required: true },
        { name: 'customerEmail', description: 'Customer email address', required: true },
        { name: 'companyName', description: 'Company/business name', required: false },
      ],
      is_system: true,
      is_active: true,
    },
    {
      name: 'Password Reset',
      type: 'password_reset',
      category: 'Security',
      subject: 'Reset Your Password - {{companyName}}',
      body_html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - Contrezz Platform</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Password Reset Request</h1>
      <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Reset your Contrezz Platform password</p>
    </div>

    <!-- Main Content -->
    <div style="background-color: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Hi <strong>{{customerName}}</strong>,
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
        We received a request to reset your password. Click the button below to create a new password:
      </p>

      <!-- Reset Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{resetUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Reset Password
        </a>
      </div>

      <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 15px; margin: 30px 0; border-radius: 4px;">
        <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
          <strong>⚠️ Important:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged. This link will expire in 24 hours.
        </p>
      </div>

      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 20px;">
        If you have any questions, please contact our support team at
        <a href="mailto:support@contrezz.com" style="color: #667eea; text-decoration: none; font-weight: 500;">support@contrezz.com</a>.
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;">
        Best regards,<br>
        <strong>Contrezz Platform Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #999999; font-size: 12px;">
      <p style="margin: 0 0 5px;">This is an automated email. Please do not reply to this message.</p>
      <p style="margin: 0;">© ${new Date().getFullYear()} Contrezz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
      body_text: `Hi {{customerName}},

We received a request to reset your password. Click the link below to create a new password:

{{resetUrl}}

If you didn't request this, please ignore this email. Your password will remain unchanged.

This link will expire in 24 hours.

Best regards,
The Contrezz Team

---
© ${new Date().getFullYear()} Contrezz. All rights reserved.`,
      variables: [
        { name: 'customerName', description: 'Customer full name', required: true },
        { name: 'resetToken', description: 'Password reset token', required: true },
        { name: 'resetUrl', description: 'Password reset URL', required: true },
      ],
      is_system: true,
      is_active: true,
    },
    {
      name: 'User Invitation',
      type: 'invitation',
      category: 'Invitations',
      subject: 'You\'ve Been Invited to Join {{companyName}}',
      body_html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited - Contrezz Platform</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">You're Invited!</h1>
      <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Join {{companyName}} on Contrezz Platform</p>
    </div>

    <!-- Main Content -->
    <div style="background-color: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Hi <strong>{{customerName}}</strong>,
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
        <strong>{{inviterName}}</strong> has invited you to join <strong>{{companyName}}</strong> on Contrezz Platform.
      </p>

      <!-- Invitation Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{invitationLink}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Accept Invitation
        </a>
      </div>

      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 20px;">
        If you have any questions, please contact <strong>{{inviterName}}</strong> or our support team at
        <a href="mailto:support@contrezz.com" style="color: #667eea; text-decoration: none; font-weight: 500;">support@contrezz.com</a>.
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;">
        Best regards,<br>
        <strong>Contrezz Platform Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #999999; font-size: 12px;">
      <p style="margin: 0 0 5px;">This is an automated email. Please do not reply to this message.</p>
      <p style="margin: 0;">© ${new Date().getFullYear()} Contrezz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
      body_text: `Hi {{customerName}},

{{inviterName}} has invited you to join {{companyName}} on Contrezz.

Accept your invitation here: {{invitationLink}}

If you have any questions, please contact {{inviterName}}.

Best regards,
The Contrezz Team

---
© ${new Date().getFullYear()} Contrezz. All rights reserved.`,
      variables: [
        { name: 'customerName', description: 'Invited user name', required: true },
        { name: 'invitationLink', description: 'Invitation acceptance link', required: true },
        { name: 'inviterName', description: 'Name of person sending invitation', required: false },
        { name: 'companyName', description: 'Company name', required: false },
      ],
      is_system: true,
      is_active: true,
    },
    {
      name: 'Welcome Email',
      type: 'welcome',
      category: 'Onboarding',
      subject: 'Welcome to Contrezz, {{customerName}}!',
      body_html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Contrezz Platform</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Welcome to Contrezz!</h1>
      <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.9;">We're excited to have you on board</p>
    </div>

    <!-- Main Content -->
    <div style="background-color: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Hi <strong>{{customerName}}</strong>,
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
        Welcome to Contrezz! We're excited to have you and <strong>{{companyName}}</strong> on board.
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
        Get started by logging in to your account:
      </p>

      <!-- Login Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{loginUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Log In Now
        </a>
      </div>

      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 20px;">
        If you need any help, our support team is here for you. Contact us at
        <a href="mailto:support@contrezz.com" style="color: #667eea; text-decoration: none; font-weight: 500;">support@contrezz.com</a>.
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;">
        Best regards,<br>
        <strong>Contrezz Platform Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #999999; font-size: 12px;">
      <p style="margin: 0 0 5px;">This is an automated email. Please do not reply to this message.</p>
      <p style="margin: 0;">© ${new Date().getFullYear()} Contrezz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
      body_text: `Hi {{customerName}},

Welcome to Contrezz! We're excited to have you and {{companyName}} on board.

Get started by logging in to your account: {{loginUrl}}

If you need any help, our support team is here for you.

Best regards,
The Contrezz Team

---
© ${new Date().getFullYear()} Contrezz. All rights reserved.`,
      variables: [
        { name: 'customerName', description: 'Customer full name', required: true },
        { name: 'companyName', description: 'Company/business name', required: false },
        { name: 'loginUrl', description: 'Login page URL', required: true },
      ],
      is_system: true,
      is_active: true,
    },
    {
      name: 'Internal Admin Credentials',
      type: 'internal_admin',
      category: 'Admin',
      subject: '{{emailSubject}}',
      body_html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{emailTitle}} - Contrezz Admin Platform</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">{{headerTitle}}</h1>
      <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.9;">{{headerSubtitle}}</p>
    </div>

    <!-- Main Content -->
    <div style="background-color: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Hello <strong>{{adminName}}</strong>,
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
        {{introText}}
      </p>

      <!-- Login Credentials Box -->
      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 0 0 30px; border-radius: 4px;">
        <h2 style="color: #667eea; margin: 0 0 15px; font-size: 18px; font-weight: 600;">Your Login Credentials</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 40%;">Email:</td>
            <td style="padding: 8px 0;">
              <span style="background-color: #f3f4f6; color: #333333; padding: 6px 12px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 14px; font-weight: 500;">{{adminEmail}}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Temporary Password:</td>
            <td style="padding: 8px 0;">
              <span style="background-color: #f3f4f6; color: #333333; padding: 6px 12px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 14px; font-weight: 500;">{{tempPassword}}</span>
            </td>
          </tr>
          {{roleRow}}
          {{departmentRow}}
        </table>
      </div>

      <!-- Security Warning -->
      <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 20px; margin: 0 0 30px; border-radius: 4px;">
        <h3 style="color: #92400e; margin: 0 0 10px; font-size: 16px; font-weight: 600;">⚠️ Important Security Steps</h3>
        <ol style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Log in using your credentials above</li>
          <li style="margin-bottom: 8px;">Change your password immediately after first login</li>
          <li style="margin-bottom: 8px;">Do not share your credentials with anyone</li>
          <li>{{securityNotice}}</li>
        </ol>
      </div>

      {{featuresBox}}

      <!-- Login Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{loginUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Login to Admin Dashboard
        </a>
      </div>

      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 20px;">
        If you have any questions or need assistance, please contact our support team at
        <a href="mailto:support@contrezz.com" style="color: #667eea; text-decoration: none; font-weight: 500;">support@contrezz.com</a>.
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;">
        Best regards,<br>
        <strong>Contrezz Platform Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #999999; font-size: 12px;">
      <p style="margin: 0 0 5px;">This is an automated email. Please do not reply to this message.</p>
      <p style="margin: 0;">© ${new Date().getFullYear()} Contrezz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
      body_text: `Hello {{adminName}},

{{introText}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Email: {{adminEmail}}
Temporary Password: {{tempPassword}}
Admin Portal: {{loginUrl}}
{{roleText}}
{{departmentText}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT SECURITY STEPS:

1. Log in using your credentials above
2. Change your password immediately after first login
3. Do not share your credentials with anyone
4. {{securityNotice}}

{{featuresText}}

If you have any questions or need assistance, please contact our support team at support@contrezz.com.

Best regards,
Contrezz Platform Team

---
This is an automated email. Please do not reply to this message.
© ${new Date().getFullYear()} Contrezz. All rights reserved.`,
      variables: [
        { name: 'adminName', description: 'Admin user full name', required: true },
        { name: 'adminEmail', description: 'Admin user email address', required: true },
        { name: 'tempPassword', description: 'Temporary password for login', required: true },
        { name: 'loginUrl', description: 'Admin login page URL', required: true },
        { name: 'emailSubject', description: 'Email subject line', required: true },
        { name: 'emailTitle', description: 'Email title for HTML title tag', required: true },
        { name: 'headerTitle', description: 'Header title (e.g., "🎉 Welcome to Contrezz Admin!")', required: true },
        { name: 'headerSubtitle', description: 'Header subtitle', required: true },
        { name: 'introText', description: 'Introduction text explaining the email purpose', required: true },
        { name: 'securityNotice', description: 'Security notice text', required: true },
        { name: 'role', description: 'Admin role (e.g., Admin, Super Admin)', required: false },
        { name: 'roleRow', description: 'HTML table row for role (empty if no role)', required: false },
        { name: 'roleText', description: 'Plain text for role (empty if no role)', required: false },
        { name: 'department', description: 'Admin department', required: false },
        { name: 'departmentRow', description: 'HTML table row for department (empty if no department)', required: false },
        { name: 'departmentText', description: 'Plain text for department (empty if no department)', required: false },
        { name: 'featuresBox', description: 'HTML features box (empty for password reset)', required: false },
        { name: 'featuresText', description: 'Plain text features list (empty for password reset)', required: false },
      ],
      is_system: true,
      is_active: true,
    },
  ];

  for (const template of templates) {
    try {
      // Check if template already exists
      const existing = await prisma.email_templates.findUnique({
        where: { type: template.type },
      });

      if (existing) {
        // Update existing template with new HTML format
        try {
          await prisma.email_templates.update({
            where: { type: template.type },
            data: {
              name: template.name,
              subject: template.subject,
              body_html: template.body_html,
              body_text: template.body_text,
              variables: template.variables,
              category: template.category,
              version: existing.version + 1,
              updated_at: new Date(),
            },
          });
          console.log(`✅ Updated template "${template.name}" with new HTML format`);
        } catch (error: any) {
          console.error(`❌ Failed to update template "${template.name}":`, error.message);
        }
        continue;
      }

      await prisma.email_templates.create({
        data: {
          ...template,
          version: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      console.log(`✅ Created template: ${template.name}`);
    } catch (error: any) {
      console.error(`❌ Error creating template "${template.name}":`, error.message);
    }
  }

  console.log('✅ Email templates seeding completed!');
}

seedEmailTemplates()
  .catch((error) => {
    console.error('❌ Error seeding email templates:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

