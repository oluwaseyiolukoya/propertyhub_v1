/**
 * Email Service
 *
 * This module handles sending emails using Nodemailer with Namecheap SMTP.
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

// Get email configuration from environment variables
function getEmailConfig(): EmailConfig {
  const host = process.env.SMTP_HOST || 'mail.privateemail.com'; // Namecheap default
  const port = parseInt(process.env.SMTP_PORT || '465');
  const secure = process.env.SMTP_SECURE !== 'false'; // Default to true for port 465
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const from = process.env.SMTP_FROM || user;

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    from
  };
}

// Create transporter (singleton)
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    const config = getEmailConfig();

    console.log('📧 Initializing email transporter with config:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user,
      from: config.from
    });

    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
      // Additional options for better compatibility
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates (for testing)
        minVersion: 'TLSv1.2'
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 5000, // 5 seconds
      socketTimeout: 30000, // 30 seconds
    });
  }

  return transporter;
}

/**
 * Test email connection
 */
export async function testEmailConnection(): Promise<{ success: boolean; message: string; error?: any }> {
  try {
    const config = getEmailConfig();

    // Check if credentials are configured
    if (!config.auth.user || !config.auth.pass) {
      return {
        success: false,
        message: 'Email credentials not configured. Please set SMTP_USER and SMTP_PASS in .env file.'
      };
    }

    console.log('🔍 Testing email connection...');
    console.log('📧 SMTP Host:', config.host);
    console.log('📧 SMTP Port:', config.port);
    console.log('📧 SMTP User:', config.auth.user);
    console.log('📧 SMTP From:', config.from);

    const transporter = getTransporter();

    // Verify connection
    await transporter.verify();

    console.log('✅ Email connection successful!');
    return {
      success: true,
      message: 'Email connection successful! SMTP server is ready to send emails.'
    };
  } catch (error: any) {
    console.error('❌ Email connection failed:', error);
    return {
      success: false,
      message: `Email connection failed: ${error.message}`,
      error: {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      }
    };
  }
}

/**
 * Send a test email
 */
export async function sendTestEmail(to: string): Promise<{ success: boolean; message: string; messageId?: string; error?: any }> {
  try {
    const config = getEmailConfig();

    if (!config.auth.user || !config.auth.pass) {
      return {
        success: false,
        message: 'Email credentials not configured. Please set SMTP_USER and SMTP_PASS in .env file.'
      };
    }

    console.log(`📧 Sending test email to: ${to}`);

    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: `"Contrezz Platform" <${config.from}>`,
      to: to,
      subject: '✅ Test Email from Contrezz Platform',
      text: `
Hello!

This is a test email from the Contrezz Platform.

If you're receiving this email, it means your SMTP configuration is working correctly! 🎉

Email Configuration:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SMTP Host: ${config.host}
SMTP Port: ${config.port}
SMTP User: ${config.auth.user}
From Address: ${config.from}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sent at: ${new Date().toLocaleString()}

Best regards,
Contrezz Platform Team

---
This is an automated test email.
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Email from Contrezz Platform</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .success-badge { background-color: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 20px 0; font-weight: bold; }
    .config-box { background-color: #fff; border: 2px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 8px; font-family: monospace; font-size: 14px; }
    .config-item { margin: 8px 0; }
    .config-label { color: #6b7280; }
    .config-value { color: #2563eb; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border-radius: 0 0 8px 8px; background-color: #f3f4f6; }
    .emoji { font-size: 48px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Test Email from Contrezz Platform</h1>
    </div>
    <div class="content">
      <center>
        <div class="emoji">🎉</div>
        <div class="success-badge">✅ Email Configuration Working!</div>
      </center>

      <p>Hello!</p>

      <p>This is a test email from the <strong>Contrezz Platform</strong>.</p>

      <p>If you're receiving this email, it means your SMTP configuration is working correctly!</p>

      <div class="config-box">
        <strong>Email Configuration:</strong>
        <div class="config-item">
          <span class="config-label">SMTP Host:</span>
          <span class="config-value">${config.host}</span>
        </div>
        <div class="config-item">
          <span class="config-label">SMTP Port:</span>
          <span class="config-value">${config.port}</span>
        </div>
        <div class="config-item">
          <span class="config-label">SMTP User:</span>
          <span class="config-value">${config.auth.user}</span>
        </div>
        <div class="config-item">
          <span class="config-label">From Address:</span>
          <span class="config-value">${config.from}</span>
        </div>
      </div>

      <p style="color: #6b7280; font-size: 14px;">
        <strong>Sent at:</strong> ${new Date().toLocaleString()}
      </p>

      <p>Best regards,<br>
      <strong>Contrezz Platform Team</strong></p>
    </div>
    <div class="footer">
      This is an automated test email.
    </div>
  </div>
</body>
</html>
      `.trim()
    });

    console.log('✅ Test email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Response:', info.response);

    return {
      success: true,
      message: 'Test email sent successfully! Check your inbox.',
      messageId: info.messageId
    };
  } catch (error: any) {
    console.error('❌ Failed to send test email:', error);
    return {
      success: false,
      message: `Failed to send test email: ${error.message}`,
      error: {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      }
    };
  }
}

// ============================================================================
// TENANT INVITATION EMAIL
// ============================================================================

interface TenantInvitationParams {
  tenantName: string;
  tenantEmail: string;
  tempPassword: string;
  propertyName: string;
  unitNumber: string;
  leaseStartDate: string;
  ownerName?: string;
  managerName?: string;
}

/**
 * Send tenant invitation email with login credentials
 */
export async function sendTenantInvitation(params: TenantInvitationParams): Promise<boolean> {
  const {
    tenantName,
    tenantEmail,
    tempPassword,
    propertyName,
    unitNumber,
    leaseStartDate,
    ownerName,
    managerName
  } = params;

  const config = getEmailConfig();
  const invitedBy = ownerName || managerName || 'Property Management';
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  // Email content
  const emailSubject = `Welcome to ${propertyName} - Your Tenant Portal Access`;
  const emailBody = `
Dear ${tenantName},

Welcome to ${propertyName}! Your lease for Unit ${unitNumber} begins on ${new Date(leaseStartDate).toLocaleDateString()}.

You have been invited by ${invitedBy} to access the Tenant Portal where you can:
- View your lease details
- Submit maintenance requests
- Make rental payments
- Communicate with property management

YOUR LOGIN CREDENTIALS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: ${tenantEmail}
Password: ${tempPassword}
Portal: ${loginUrl}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT: Please log in and change your password immediately for security.

If you have any questions or need assistance, please contact property management.

Best regards,
${invitedBy}
Property Management Team

---
This is an automated email. Please do not reply to this message.
  `.trim();

  try {
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: `"${invitedBy}" <${config.from}>`,
      to: tenantEmail,
      subject: emailSubject,
      text: emailBody,
      html: generateTenantInvitationHtml(params)
    });

    console.log('✅ Tenant invitation email sent successfully!');
    console.log('📬 Message ID:', info.messageId);

    return true;
  } catch (error: any) {
    console.error('❌ Failed to send tenant invitation email:', error);
    throw new Error(`Failed to send tenant invitation email: ${error.message}`);
  }
}

/**
 * Generate HTML version of tenant invitation email
 */
function generateTenantInvitationHtml(params: TenantInvitationParams): string {
  const {
    tenantName,
    tenantEmail,
    tempPassword,
    propertyName,
    unitNumber,
    leaseStartDate,
    ownerName,
    managerName
  } = params;

  const invitedBy = ownerName || managerName || 'Property Management';
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${propertyName}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .credentials { background-color: #fff; border: 2px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .credential-item { margin: 10px 0; }
    .credential-label { font-weight: bold; color: #1f2937; }
    .credential-value { color: #2563eb; font-size: 16px; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to ${propertyName}!</h1>
    </div>
    <div class="content">
      <p>Dear ${tenantName},</p>

      <p>Your lease for <strong>Unit ${unitNumber}</strong> begins on <strong>${new Date(leaseStartDate).toLocaleDateString()}</strong>.</p>

      <p>You have been invited by ${invitedBy} to access the Tenant Portal where you can:</p>
      <ul>
        <li>View your lease details</li>
        <li>Submit maintenance requests</li>
        <li>Make rental payments</li>
        <li>Communicate with property management</li>
      </ul>

      <div class="credentials">
        <h3 style="margin-top: 0; color: #1f2937;">Your Login Credentials</h3>
        <div class="credential-item">
          <span class="credential-label">Email:</span><br>
          <span class="credential-value">${tenantEmail}</span>
        </div>
        <div class="credential-item">
          <span class="credential-label">Password:</span><br>
          <span class="credential-value">${tempPassword}</span>
        </div>
        <div class="credential-item">
          <span class="credential-label">Portal URL:</span><br>
          <a href="${loginUrl}" class="credential-value">${loginUrl}</a>
        </div>
      </div>

      <div class="warning">
        <strong>⚠️ IMPORTANT:</strong> Please log in and change your password immediately for security.
      </div>

      <center>
        <a href="${loginUrl}" class="button">Access Tenant Portal</a>
      </center>

      <p>If you have any questions or need assistance, please contact property management.</p>

      <p>Best regards,<br>
      ${invitedBy}<br>
      Property Management Team</p>
    </div>
    <div class="footer">
      This is an automated email. Please do not reply to this message.
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ============================================================================
// CUSTOMER INVITATION EMAIL
// ============================================================================

interface CustomerInvitationParams {
  customerName: string;
  customerEmail: string;
  companyName: string;
  tempPassword: string;
  planName?: string;
  customerType: 'property_owner' | 'property_manager' | 'property_developer';
}

/**
 * Send customer invitation email with login credentials
 */
export async function sendCustomerInvitation(params: CustomerInvitationParams): Promise<boolean> {
  const {
    customerName,
    customerEmail,
    companyName,
    tempPassword,
    planName,
    customerType
  } = params;

  const config = getEmailConfig();
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  // Determine dashboard type based on customer type
  let dashboardType = 'Owner Dashboard';
  if (customerType === 'property_manager') {
    dashboardType = 'Manager Dashboard';
  } else if (customerType === 'property_developer') {
    dashboardType = 'Developer Dashboard';
  }

  // Email content
  const emailSubject = `Welcome to Contrezz - Your ${dashboardType} Access`;
  const emailBody = `
Dear ${customerName},

Welcome to Contrezz! Your account for ${companyName} has been successfully created.

You now have access to the ${dashboardType} where you can manage your ${customerType === 'property_developer' ? 'development projects' : 'properties'}, track performance, and grow your business.

YOUR LOGIN CREDENTIALS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: ${customerEmail}
Password: ${tempPassword}
Portal: ${loginUrl}
${planName ? `Plan: ${planName}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT: Please log in and change your password immediately for security.

If you have any questions or need assistance, please contact our support team.

Best regards,
Contrezz Platform Team

---
This is an automated email. Please do not reply to this message.
  `.trim();

  try {
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: `"Contrezz Platform" <${config.from}>`,
      to: customerEmail,
      subject: emailSubject,
      text: emailBody,
      html: generateCustomerInvitationHtml(params)
    });

    console.log('✅ Customer invitation email sent successfully!');
    console.log('📬 Message ID:', info.messageId);

    return true;
  } catch (error: any) {
    console.error('❌ Failed to send customer invitation email:', error);
    throw new Error(`Failed to send customer invitation email: ${error.message}`);
  }
}

/**
 * Generate HTML version of customer invitation email
 */
function generateCustomerInvitationHtml(params: CustomerInvitationParams): string {
  const {
    customerName,
    customerEmail,
    companyName,
    tempPassword,
    planName,
    customerType
  } = params;

  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  let dashboardType = 'Owner Dashboard';
  let dashboardFeatures = [
    'Manage your properties and units',
    'Track rental income and expenses',
    'Monitor maintenance requests',
    'View analytics and reports'
  ];

  if (customerType === 'property_manager') {
    dashboardType = 'Manager Dashboard';
    dashboardFeatures = [
      'Manage assigned properties',
      'Handle tenant requests',
      'Track maintenance tasks',
      'Generate property reports'
    ];
  } else if (customerType === 'property_developer') {
    dashboardType = 'Developer Dashboard';
    dashboardFeatures = [
      'Manage development projects',
      'Track project costs and budgets',
      'Monitor project timelines',
      'View project analytics'
    ];
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Contrezz</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .credentials { background-color: #fff; border: 2px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .credential-item { margin: 10px 0; }
    .credential-label { font-weight: bold; color: #1f2937; }
    .credential-value { color: #2563eb; font-size: 16px; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
    .features { background-color: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .features ul { margin: 10px 0; padding-left: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to Contrezz!</h1>
    </div>
    <div class="content">
      <p>Dear ${customerName},</p>

      <p>Welcome to <strong>Contrezz</strong>! Your account for <strong>${companyName}</strong> has been successfully created.</p>

      <div class="features">
        <h3 style="margin-top: 0; color: #1f2937;">Your ${dashboardType}</h3>
        <p>You now have access to:</p>
        <ul>
          ${dashboardFeatures.map(feature => `<li>${feature}</li>`).join('\n          ')}
        </ul>
      </div>

      <div class="credentials">
        <h3 style="margin-top: 0; color: #1f2937;">Your Login Credentials</h3>
        <div class="credential-item">
          <span class="credential-label">Email:</span><br>
          <span class="credential-value">${customerEmail}</span>
        </div>
        <div class="credential-item">
          <span class="credential-label">Password:</span><br>
          <span class="credential-value">${tempPassword}</span>
        </div>
        <div class="credential-item">
          <span class="credential-label">Portal URL:</span><br>
          <a href="${loginUrl}" class="credential-value">${loginUrl}</a>
        </div>
        ${planName ? `
        <div class="credential-item">
          <span class="credential-label">Your Plan:</span><br>
          <span class="credential-value">${planName}</span>
        </div>
        ` : ''}
      </div>

      <div class="warning">
        <strong>⚠️ IMPORTANT:</strong> Please log in and change your password immediately for security.
      </div>

      <center>
        <a href="${loginUrl}" class="button">Access Your Dashboard</a>
      </center>

      <p>If you have any questions or need assistance, please contact our support team.</p>

      <p>Best regards,<br>
      <strong>Contrezz Platform Team</strong></p>
    </div>
    <div class="footer">
      This is an automated email. Please do not reply to this message.
    </div>
  </div>
</body>
</html>
  `.trim();
}

export default {
  testEmailConnection,
  sendTestEmail,
  sendTenantInvitation,
  sendCustomerInvitation
};
