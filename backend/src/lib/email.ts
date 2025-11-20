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

    // Check if credentials are configured
    if (!config.auth.user || !config.auth.pass) {
      console.error('❌ SMTP credentials not configured!');
      console.error('⚠️  Please set SMTP_USER and SMTP_PASS environment variables');
      console.error('📧 Current config:', {
        host: config.host,
        port: config.port,
        user: config.auth.user || 'NOT SET',
        hasPassword: !!config.auth.pass
      });
    }

    console.log('📧 Initializing email transporter with config:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user,
      from: config.from,
      hasPassword: !!config.auth.pass
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
 * Generic send email function
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  try {
    const config = getEmailConfig();
    const transporter = getTransporter();

    const mailOptions = {
      from: config.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${params.to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${params.to}:`, error);
    return false;
  }
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
    console.error('📧 Email error details:', {
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode,
      message: error?.message
    });
    // Return false instead of throwing to prevent tenant creation from failing
    return false;
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
    console.error('📧 Email error details:', {
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode,
      message: error?.message
    });
    // Return false instead of throwing to prevent customer creation from failing
    return false;
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

/**
 * Onboarding application confirmation email parameters
 */
interface OnboardingConfirmationParams {
  applicantName: string;
  applicantEmail: string;
  applicationType: 'property-owner' | 'property-manager' | 'developer';
  applicationId: string;
  estimatedReviewTime?: string;
}

/**
 * Send onboarding application confirmation email
 */
export async function sendOnboardingConfirmation(params: OnboardingConfirmationParams): Promise<boolean> {
  const {
    applicantName,
    applicantEmail,
    applicationType,
    applicationId,
    estimatedReviewTime = '24-48 hours'
  } = params;

  // Map application type to friendly name
  const roleNames = {
    'property-owner': 'Property Owner',
    'property-manager': 'Property Manager',
    'developer': 'Property Developer'
  };
  const roleName = roleNames[applicationType] || applicationType;

  const config = getEmailConfig();
  const emailSubject = `Application Received - ${roleName} | Contrezz Platform`;

  const emailBody = `
Hello ${applicantName},

Thank you for your interest in joining Contrezz Platform as a ${roleName}!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APPLICATION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Application ID: ${applicationId}
Role: ${roleName}
Email: ${applicantEmail}
Status: Under Review
Estimated Review Time: ${estimatedReviewTime}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT HAPPENS NEXT?

1. Our team will review your application
2. You'll receive an email with the approval decision
3. Once approved, you'll get login credentials to access your dashboard
4. You can then set up your account and start using the platform

IMPORTANT NOTES:

• Please check your spam/junk folder for our emails
• Add no-reply@contrezz.com to your contacts
• Your application will be reviewed within ${estimatedReviewTime}
• You'll receive an email invitation with password setup instructions after approval

If you have any questions or need assistance, please contact our support team at support@contrezz.com.

Best regards,
Contrezz Platform Team

---
This is an automated email. Please do not reply to this message.
Application ID: ${applicationId}
  `.trim();

  try {
    console.log('📧 [Onboarding Email] Step 1: Getting transporter...');
    const transporter = getTransporter();

    // Verify connection before sending (fixes EAUTH connection lost issue)
    console.log('📧 [Onboarding Email] Step 2: Verifying SMTP connection...');
    try {
      await transporter.verify();
      console.log('✅ [Onboarding Email] SMTP connection verified successfully');
    } catch (verifyError: any) {
      console.error('❌ [Onboarding Email] SMTP verification failed:', verifyError.message);
      console.error('🔄 [Onboarding Email] Attempting to create fresh transporter...');

      // Reset transporter and try again
      const freshTransporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.auth.user,
          pass: config.auth.pass,
        },
        pool: false, // Disable connection pooling for onboarding emails
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 30000,
      });

      console.log('✅ [Onboarding Email] Fresh transporter created');

      // Use the fresh transporter for sending
      console.log('📧 [Onboarding Email] Step 3: Sending email with fresh connection...');
      const info = await freshTransporter.sendMail({
        from: `"Contrezz Platform" <${config.from}>`,
        to: applicantEmail,
        subject: emailSubject,
        text: emailBody,
        html: generateOnboardingConfirmationHtml(params)
      });

      console.log('✅ Onboarding confirmation email sent successfully!');
      console.log('📬 Message ID:', info.messageId);
      console.log('📧 Sent to:', applicantEmail);

      return true;
    }

    console.log('📧 [Onboarding Email] Step 3: Sending email with verified connection...');
    const info = await transporter.sendMail({
      from: `"Contrezz Platform" <${config.from}>`,
      to: applicantEmail,
      subject: emailSubject,
      text: emailBody,
      html: generateOnboardingConfirmationHtml(params)
    });

    console.log('✅ Onboarding confirmation email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Sent to:', applicantEmail);

    return true;
  } catch (error: any) {
    console.error('❌ Failed to send onboarding confirmation email:', error);
    console.error('📧 Email error details:', {
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode,
      message: error?.message
    });
    return false;
  }
}

/**
 * Generate HTML version of onboarding confirmation email
 */
function generateOnboardingConfirmationHtml(params: OnboardingConfirmationParams): string {
  const {
    applicantName,
    applicantEmail,
    applicationType,
    applicationId,
    estimatedReviewTime = '24-48 hours'
  } = params;

  const roleNames = {
    'property-owner': 'Property Owner',
    'property-manager': 'Property Manager',
    'developer': 'Property Developer'
  };
  const roleName = roleNames[applicationType] || applicationType;

  const html = `
<!DOCTYPE html>
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
        Hello <strong>${applicantName}</strong>,
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
        Thank you for your interest in joining Contrezz Platform as a <strong>${roleName}</strong>!
      </p>

      <!-- Application Details Box -->
      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 0 0 30px; border-radius: 4px;">
        <h2 style="color: #667eea; margin: 0 0 15px; font-size: 18px; font-weight: 600;">Application Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 40%;">Application ID:</td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 500;">${applicationId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Role:</td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 500;">${roleName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Email:</td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 500;">${applicantEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Status:</td>
            <td style="padding: 8px 0;">
              <span style="background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Under Review</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Review Time:</td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 500;">${estimatedReviewTime}</td>
          </tr>
        </table>
      </div>

      <!-- What Happens Next -->
      <h2 style="color: #333333; margin: 0 0 15px; font-size: 18px; font-weight: 600;">What Happens Next?</h2>
      <ol style="color: #666666; font-size: 15px; line-height: 1.8; margin: 0 0 30px; padding-left: 20px;">
        <li style="margin-bottom: 10px;">Our team will review your application</li>
        <li style="margin-bottom: 10px;">You'll receive an email with the approval decision</li>
        <li style="margin-bottom: 10px;">Once approved, you'll get login credentials to access your dashboard</li>
        <li style="margin-bottom: 10px;">You can then set up your account and start using the platform</li>
      </ol>

      <!-- Important Notes -->
      <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 20px; margin: 0 0 30px; border-radius: 4px;">
        <h3 style="color: #92400e; margin: 0 0 10px; font-size: 16px; font-weight: 600;">⚠️ Important Notes</h3>
        <ul style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Please check your spam/junk folder for our emails</li>
          <li style="margin-bottom: 8px;">Add no-reply@contrezz.com to your contacts</li>
          <li style="margin-bottom: 8px;">Your application will be reviewed within ${estimatedReviewTime}</li>
          <li>You'll receive an email invitation with password setup instructions after approval</li>
        </ul>
      </div>

      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
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
      <p style="margin: 0;">Application ID: ${applicationId}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return html;
}

/**
 * Send contact form confirmation email
 * Note: Ticket ID is not shown to users, only visible to admins
 */
export interface ContactFormConfirmationParams {
  to: string;
  name: string;
  submissionId: string; // Ticket ID - stored internally, not shown in email
  formType: string;
  subject?: string;
  message: string;
}

export async function sendContactFormConfirmation(params: ContactFormConfirmationParams): Promise<boolean> {
  const config = getEmailConfig();

  const formTypeLabels: Record<string, string> = {
    contact_us: 'Contact Form',
    schedule_demo: 'Demo Request',
    blog_inquiry: 'Blog Inquiry',
    community_request: 'Community Request',
    partnership: 'Partnership Inquiry',
    support: 'Support Request'
  };

  const formTypeLabel = formTypeLabels[params.formType] || 'Contact Form';

  console.log(`📧 Attempting to send confirmation email to ${params.to}`);
  console.log(`📧 SMTP Config: ${config.host}:${config.port} (user: ${config.auth.user})`);

  // Create fresh transporter for each email (no pooling)
  // This is more reliable for infrequent emails
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure, // Use SSL/TLS for secure connection
    auth: {
      user: config.auth.user,
      pass: config.auth.pass,
    },
    pool: false, // Disable pooling for reliability
    tls: {
      rejectUnauthorized: true, // Validate SSL certificates for security
      minVersion: 'TLSv1.2', // Enforce minimum TLS version
      ciphers: 'HIGH:!aNULL:!eNULL:!EXPORT:!DES:!MD5:!PSK:!RC4:!SEED', // Strong ciphers only
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
    debug: false, // Disable debug in production
    logger: false, // Disable logging in production
  });

  try {
    const mailOptions = {
      from: `"Contrezz Support" <${config.from}>`,
      to: params.to,
      subject: `Confirmation: We received your ${formTypeLabel}`,
      html: generateContactFormConfirmationEmail(params, formTypeLabel),
    };

    console.log(`📤 Sending email with subject: "${mailOptions.subject}"`);

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Contact form confirmation email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📧 Accepted: ${info.accepted}`);
    console.log(`📧 Response: ${info.response}`);

    return true;
  } catch (error: any) {
    console.error('❌ Failed to send contact form confirmation email');
    console.error(`❌ Error code: ${error.code}`);
    console.error(`❌ Error message: ${error.message}`);
    console.error(`❌ Full error:`, error);

    // Log specific error types
    if (error.code === 'ECONNRESET') {
      console.error('⚠️  Connection reset by server - possible authentication or network issue');
    } else if (error.code === 'EAUTH') {
      console.error('⚠️  Authentication failed - check SMTP credentials');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⚠️  Connection timeout - check network/firewall');
    }

    return false;
  } finally {
    // Close the transporter
    transporter.close();
  }
}

/**
 * Generate HTML for contact form confirmation email
 */
function generateContactFormConfirmationEmail(
  params: ContactFormConfirmationParams,
  formTypeLabel: string
): string {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Form Confirmation - Contrezz</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background-color: #7c3aed; padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                ✅ We Received Your Message
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Hi <strong>${params.name}</strong>,
              </p>

              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Thank you for contacting Contrezz! We've successfully received your <strong>${formTypeLabel}</strong> and our team will review it shortly.
              </p>

              <!-- Submission Summary -->
              <div style="background-color: #f9fafb; border-left: 4px solid #7c3aed; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 18px; font-weight: 600;">
                  Your Submission
                </h3>

                <table width="100%" cellpadding="0" cellspacing="0">
                  ${params.subject ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 100px;">
                      <strong>Subject:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                      ${params.subject}
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                      <strong>Message:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; line-height: 1.5;">
                      ${params.message.substring(0, 200)}${params.message.length > 200 ? '...' : ''}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- What's Next -->
              <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 12px; color: #1e40af; font-size: 16px; font-weight: 600;">
                  📅 What happens next?
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #1f2937; font-size: 14px; line-height: 1.8;">
                  <li>Our team will review your submission within <strong>24 hours</strong></li>
                  <li>You'll receive a personalized response via email</li>
                  <li>For urgent matters, please call us at <strong>+234 916 840 7781</strong></li>
                </ul>
              </div>

              <p style="margin: 20px 0 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Best regards,<br>
                <strong>The Contrezz Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                This is an automated confirmation email. Please do not reply to this message.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Contrezz. All rights reserved.
              </p>
              <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;">
                <a href="mailto:hello@contrezz.com" style="color: #7c3aed; text-decoration: none;">Contact Support</a> •
                <a href="#" style="color: #7c3aed; text-decoration: none;">Visit Website</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return html;
}

/**
 * Send password reset email with temporary password
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  temporaryPassword: string;
  accountType: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = getEmailConfig();

    // Check if SMTP is configured
    if (!config.auth.user || !config.auth.pass) {
      console.error('❌ SMTP credentials not configured');
      return {
        success: false,
        error: 'Email service not configured. Please contact administrator.'
      };
    }

    const transporter = getTransporter();

    // Verify connection before sending
    try {
      console.log('🔍 Verifying SMTP connection for password reset...');
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (verifyError: any) {
      console.error('❌ SMTP verification failed:', verifyError.message);
      console.log('🔄 Attempting with fresh transporter...');

      // Create fresh transporter without connection pooling
      const freshTransporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.auth.user,
          pass: config.auth.pass,
        },
        pool: false, // Disable connection pooling
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 30000,
      });

      try {
        const info = await freshTransporter.sendMail({
          from: `"Contrezz Security" <${config.from}>`,
          to: params.to,
          subject: 'Password Reset - Temporary Password',
          html: generatePasswordResetEmailHTML(params),
        });

        console.log('✅ Password reset email sent via fresh transporter');
        console.log('📧 Message ID:', info.messageId);
        console.log('📬 Accepted:', info.accepted);
        console.log('📭 Rejected:', info.rejected);

        if (info.rejected && info.rejected.length > 0) {
          return {
            success: false,
            error: `Email rejected by server: ${info.rejected.join(', ')}`
          };
        }

        return {
          success: true,
          messageId: info.messageId
        };
      } catch (sendError: any) {
        console.error('❌ Failed to send email with fresh transporter:', sendError.message);
        return {
          success: false,
          error: `Email delivery failed: ${sendError.message}`
        };
      }
    }

    // Send with verified connection
    try {
      const info = await transporter.sendMail({
        from: `"Contrezz Security" <${config.from}>`,
        to: params.to,
        subject: 'Password Reset - Temporary Password',
        html: generatePasswordResetEmailHTML(params),
      });

      console.log('✅ Password reset email sent successfully');
      console.log('📧 Message ID:', info.messageId);
      console.log('📬 Accepted:', info.accepted);
      console.log('📭 Rejected:', info.rejected);

      if (info.rejected && info.rejected.length > 0) {
        return {
          success: false,
          error: `Email rejected by server: ${info.rejected.join(', ')}`
        };
      }

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (sendError: any) {
      console.error('❌ Failed to send email:', sendError.message);
      return {
        success: false,
        error: `Email delivery failed: ${sendError.message}`
      };
    }
  } catch (error: any) {
    console.error('❌ Unexpected error in sendPasswordResetEmail:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Generate HTML for password reset email
 */
function generatePasswordResetEmailHTML(params: {
  name: string;
  temporaryPassword: string;
  accountType: string;
}): string {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🔐 Password Reset
              </h1>
              <p style="margin: 10px 0 0; color: #fecaca; font-size: 16px;">
                Temporary Password Generated
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Hello <strong>${params.name}</strong>,
              </p>

              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your <strong>${params.accountType}</strong> account.
                A temporary password has been generated for you.
              </p>

              <!-- Temporary Password Box -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <p style="margin: 0 0 12px; color: #92400e; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Your Temporary Password
                </p>
                <p style="margin: 0; color: #78350f; font-size: 32px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 4px; text-align: center;">
                  ${params.temporaryPassword}
                </p>
              </div>

              <!-- Important Instructions -->
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 12px; color: #dc2626; font-size: 16px; font-weight: 600;">
                  ⚠️ Important Security Instructions
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #991b1b; font-size: 14px; line-height: 1.8;">
                  <li><strong>Use this password immediately</strong> to log in to your account</li>
                  <li><strong>Change your password</strong> after logging in for security</li>
                  <li>This temporary password will <strong>expire in 24 hours</strong></li>
                  <li><strong>Never share</strong> this password with anyone</li>
                  <li>If you didn't request this reset, <strong>contact support immediately</strong></li>
                </ul>
              </div>

              <!-- Next Steps -->
              <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 12px; color: #1e40af; font-size: 16px; font-weight: 600;">
                  📋 Next Steps
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #1f2937; font-size: 14px; line-height: 1.8;">
                  <li>Go to the <strong>Contrezz login page</strong></li>
                  <li>Enter your email address</li>
                  <li>Use the <strong>temporary password above</strong></li>
                  <li>You'll be prompted to <strong>create a new password</strong></li>
                  <li>Choose a strong, unique password</li>
                </ol>
              </div>

              <p style="margin: 20px 0 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Best regards,<br>
                <strong>The Contrezz Security Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                This is an automated security email. Please do not reply to this message.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Contrezz. All rights reserved.
              </p>
              <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;">
                <a href="mailto:hello@contrezz.com" style="color: #7c3aed; text-decoration: none;">Contact Support</a> •
                <a href="#" style="color: #7c3aed; text-decoration: none;">Security Center</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return html;
}

/**
 * Send team invitation email with temporary password (INSTANT DELIVERY)
 * Uses same pattern as onboarding email for immediate delivery
 */
export interface TeamInvitationParams {
  memberName: string;
  memberEmail: string;
  companyName: string;
  roleName: string;
  inviterName: string;
  temporaryPassword: string;
  expiryHours: number;
  loginUrl: string;
  department?: string;
  jobTitle?: string;
}

export async function sendTeamInvitation(params: TeamInvitationParams): Promise<boolean> {
  const config = getEmailConfig();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 [PRODUCTION DEBUG] sendTeamInvitation called');
  console.log('📧 [PRODUCTION DEBUG] Parameters:', {
    memberName: params.memberName,
    memberEmail: params.memberEmail,
    companyName: params.companyName,
    roleName: params.roleName,
    inviterName: params.inviterName,
    expiryHours: params.expiryHours,
    expiryHoursType: typeof params.expiryHours,
    loginUrl: params.loginUrl,
    department: params.department,
    jobTitle: params.jobTitle,
  });
  console.log('📧 [PRODUCTION DEBUG] SMTP Config:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user,
    from: config.from,
    hasPassword: !!config.auth.pass,
    passwordLength: config.auth.pass?.length || 0,
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const emailSubject = `Welcome to ${params.companyName} - Your Account is Ready!`;

  const emailBody = `
Hello ${params.memberName},

${params.inviterName} has invited you to join ${params.companyName} as a ${params.roleName}.

YOUR LOGIN CREDENTIALS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: ${params.memberEmail}
Temporary Password: ${params.temporaryPassword}
Expires in: ${params.expiryHours} hours
Login URL: ${params.loginUrl}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT: For security reasons, you will be required to change your password on first login.

Your Role: ${params.roleName}
${params.department ? `Department: ${params.department}` : ''}
${params.jobTitle ? `Job Title: ${params.jobTitle}` : ''}

If you have any questions, please contact your administrator.

Best regards,
${params.inviterName}
${params.companyName}

---
This is an automated email. Please do not reply to this message.
  `.trim();

  try {
    console.log('📧 [Team Invitation] Step 1: Getting transporter...');
    const transporter = getTransporter();

    // Verify connection before sending (fixes EAUTH connection lost issue)
    console.log('📧 [Team Invitation] Step 2: Verifying SMTP connection...');
    try {
      await transporter.verify();
      console.log('✅ [Team Invitation] SMTP connection verified successfully');
    } catch (verifyError: any) {
      console.error('❌ [Team Invitation] SMTP verification failed:', verifyError.message);
      console.error('🔄 [Team Invitation] Attempting to create fresh transporter...');

      // Reset transporter and try again
      const freshTransporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.auth.user,
          pass: config.auth.pass,
        },
        pool: false, // Disable connection pooling for team invitation emails
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 30000,
      });

      console.log('✅ [Team Invitation] Fresh transporter created');

      // Use the fresh transporter for sending
      console.log('📧 [Team Invitation] Step 3: Sending email with fresh connection...');
      const info = await freshTransporter.sendMail({
        from: `"${params.companyName}" <${config.from}>`,
        to: params.memberEmail,
        subject: emailSubject,
        text: emailBody,
        html: generateTeamInvitationHtml(params)
      });

      console.log('✅ Team invitation email sent successfully!');
      console.log('📬 Message ID:', info.messageId);
      console.log('📧 Sent to:', params.memberEmail);

      return true;
    }

    console.log('📧 [Team Invitation] Step 3: Sending email with verified connection...');
    const info = await transporter.sendMail({
      from: `"${params.companyName}" <${config.from}>`,
      to: params.memberEmail,
      subject: emailSubject,
      text: emailBody,
      html: generateTeamInvitationHtml(params)
    });

    console.log('✅ Team invitation email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Sent to:', params.memberEmail);

    return true;
  } catch (error: any) {
    console.error('❌ Failed to send team invitation email:', error);
    console.error('📧 Email error details:', {
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode,
      message: error?.message
    });
    return false;
  }
}

/**
 * Generate HTML version of team invitation email
 */
function generateTeamInvitationHtml(params: TeamInvitationParams): string {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background-color: #4F46E5; padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                Welcome to ${params.companyName}!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Hi <strong>${params.memberName}</strong>,
              </p>

              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                ${params.inviterName} has invited you to join <strong>${params.companyName}</strong> as a <strong>${params.roleName}</strong>.
              </p>

              <!-- Credentials Box -->
              <div style="background-color: #f9fafb; border-left: 4px solid #4F46E5; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 18px; font-weight: 600;">
                  Your Login Credentials
                </h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 150px;">
                      <strong>Email:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                      ${params.memberEmail}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      <strong>Temporary Password:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-family: 'Courier New', monospace; font-weight: 600;">
                      ${params.temporaryPassword}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      <strong>Expires in:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                      ${params.expiryHours} hours
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Important Notice -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ Important:</strong> For security reasons, you will be required to change your password on first login.
                </p>
              </div>

              <!-- Login Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${params.loginUrl}" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Login to Your Account
                </a>
              </div>

              <p style="margin: 20px 0 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                If you have any questions, please contact your administrator.
              </p>

              <p style="margin: 20px 0 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Best regards,<br>
                <strong>${params.inviterName}</strong><br>
                ${params.companyName}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                This is an automated message from ${params.companyName}.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                If you did not expect this invitation, please ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return html;
}

export default {
  testEmailConnection,
  sendTestEmail,
  sendTenantInvitation,
  sendCustomerInvitation,
  sendOnboardingConfirmation,
  sendContactFormConfirmation,
  sendPasswordResetEmail,
  sendTeamInvitation
};
