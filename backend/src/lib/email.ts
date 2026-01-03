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
  fromName: string;
}

// Get email configuration from environment variables
function getEmailConfig(): EmailConfig {
  const host = process.env.SMTP_HOST || 'mail.privateemail.com'; // Namecheap default
  const port = parseInt(process.env.SMTP_PORT || '465');
  const secure = process.env.SMTP_SECURE !== 'false'; // Default to true for port 465
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const fromEmail = process.env.SMTP_FROM || user;
  const fromName = process.env.SMTP_FROM_NAME || 'Contrezz Platform';

  // Format: "Sender Name" <email@example.com>
  const from = `"${fromName}" <${fromEmail}>`;

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    from,
    fromName
  };
}

// Helper function to get just the email address from config
function getFromEmail(): string {
  const config = getEmailConfig();
  // Extract email from "Name" <email@example.com> format
  const match = config.from.match(/<(.+)>/);
  return match ? match[1] : config.from;
}

// Helper function to format sender with custom name
function formatSender(name: string): string {
  const email = getFromEmail();
  return `"${name}" <${email}>`;
}

// Create transporter (singleton)
let transporter: Transporter | null = null;

export function getTransporter(): Transporter {
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
      from: config.from, // Already formatted as "Sender Name" <email@example.com>
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    };

    const info = await transporter.sendMail(mailOptions);

    // Validate email was actually sent
    if (!info || !info.messageId) {
      console.error(`❌ Email send failed - no message ID returned for ${params.to}`);
      console.error('📧 Response:', info);
      return false;
    }

    // Check for rejection
    if (info.rejected && info.rejected.length > 0) {
      console.error(`❌ Email rejected by server for ${params.to}`);
      console.error('📧 Rejected addresses:', info.rejected);
      return false;
    }

    // Check that at least one recipient was accepted
    if (!info.accepted || info.accepted.length === 0) {
      console.error(`❌ Email not accepted by any recipient for ${params.to}`);
      console.error('📧 Accepted list is empty or undefined:', info.accepted);
      return false;
    }

    console.log(`✅ Email sent successfully to ${params.to}`);
    console.log(`📬 Message ID: ${info.messageId}`);
    console.log(`📧 Response: ${info.response || 'No response'}`);
    console.log(`📧 Accepted: ${info.accepted?.join(', ') || 'N/A'}`);

    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${params.to}:`, error);
    console.error(`❌ Error code: ${error.code}`);
    console.error(`❌ Error message: ${error.message}`);
    if (error.response) {
      console.error(`❌ SMTP Response: ${error.response}`);
    }
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
      from: config.from,
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
  companyName?: string; // Property owner's company name
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
    companyName,
    ownerName,
    managerName
  } = params;

  const config = getEmailConfig();
  // Use company name as the "invited by" reference, fallback to owner/manager name
  const invitedBy = companyName || ownerName || managerName || 'Property Management';
  // Production sign-in URL
  const loginUrl = process.env.PRODUCTION_SIGNIN_URL || process.env.FRONTEND_URL || 'https://app.contrezz.com/signin';

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

IMPORTANT NEXT STEPS:
1. Log in using your credentials above
2. Change your password immediately for security
3. Complete your KYC (Know Your Customer) verification
   - Upload a valid government-issued ID (National ID, Driver's License, or International Passport)
   - Take a selfie for identity verification

KYC verification is required to access all tenant features and services.

If you have any questions or need assistance, please contact property management.

Best regards,
${invitedBy}
Property Management Team

---
This is an automated email. Please do not reply to this message.
  `.trim();

  try {
    console.log('📧 Attempting to send tenant invitation email to:', tenantEmail);
    let transporter = getTransporter();

    // Verify connection is still alive (handles stale pooled connections)
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified for tenant invitation');
    } catch (verifyError: any) {
      console.error('❌ SMTP verification failed, creating fresh transporter:', verifyError.message);

      // Create fresh transporter WITHOUT connection pooling
      const nodemailer = require('nodemailer');
      transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: { user: config.auth.user, pass: config.auth.pass },
        pool: false, // Disable connection pooling for fresh connection
        tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 30000,
      });
    }

    const info = await transporter.sendMail({
      from: formatSender(invitedBy),
      to: tenantEmail,
      subject: emailSubject,
      text: emailBody,
      html: generateTenantInvitationHtml(params)
    });

    console.log('✅ Tenant invitation email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📬 Recipient:', tenantEmail);

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
    companyName,
    ownerName,
    managerName
  } = params;

  // Use company name as the "invited by" reference, fallback to owner/manager name
  const invitedBy = companyName || ownerName || managerName || 'Property Management';
  // Production sign-in URL
  const loginUrl = process.env.PRODUCTION_SIGNIN_URL || process.env.FRONTEND_URL || 'https://app.contrezz.com/signin';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${propertyName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
    .content { background-color: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .credentials { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .credential-item { margin: 12px 0; }
    .credential-label { font-weight: 600; color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .credential-value { color: #333333; font-size: 16px; font-family: 'Courier New', monospace; background: #fff; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 4px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: bold; }
    .button:hover { opacity: 0.9; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; background-color: #f9fafb; border-radius: 0 0 10px 10px; }
    .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .kyc-section { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .kyc-section h3 { margin-top: 0; color: #065f46; }
    .kyc-section ul { margin: 10px 0 0; padding-left: 20px; }
    .kyc-section li { margin: 8px 0; color: #047857; }
    .steps { background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .step { display: flex; align-items: flex-start; margin: 15px 0; }
    .step-number { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0; }
    .step-content { flex: 1; }
    .step-title { font-weight: 600; color: #333333; margin-bottom: 2px; }
    .step-desc { color: #6b7280; font-size: 13px; }
    .features { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
    .feature { display: flex; align-items: center; gap: 8px; color: #374151; font-size: 14px; }
    .feature-icon { color: #667eea; }
    .property-info { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 0 0 30px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 Welcome to ${propertyName}!</h1>
      <p>Your new home awaits</p>
    </div>
    <div class="content">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Dear <strong>${tenantName}</strong>,
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
        Congratulations! Your lease for <strong>Unit ${unitNumber}</strong> begins on <strong>${new Date(leaseStartDate).toLocaleDateString()}</strong>.
      </p>

      <div class="property-info">
        <h2 style="color: #667eea; margin: 0 0 15px; font-size: 18px; font-weight: 600;">Property Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 40%;">Property:</td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 500;">${propertyName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Unit:</td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 500;">${unitNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Lease Start:</td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 500;">${new Date(leaseStartDate).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Managed By:</td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 500;">${invitedBy}</td>
          </tr>
        </table>
      </div>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
        You have been invited to access the <strong>Tenant Portal</strong> where you can:
      </p>

      <div class="features">
        <div class="feature"><span class="feature-icon">✓</span> View your lease details</div>
        <div class="feature"><span class="feature-icon">✓</span> Submit maintenance requests</div>
        <div class="feature"><span class="feature-icon">✓</span> Make rental payments</div>
        <div class="feature"><span class="feature-icon">✓</span> Communicate with management</div>
      </div>

      <div class="credentials">
        <h3 style="margin-top: 0; color: #667eea; font-size: 18px; font-weight: 600;">🔐 Your Login Credentials</h3>
        <div class="credential-item">
          <span class="credential-label">Email Address</span><br>
          <span class="credential-value">${tenantEmail}</span>
        </div>
        <div class="credential-item">
          <span class="credential-label">Temporary Password</span><br>
          <span class="credential-value">${tempPassword}</span>
        </div>
        <div class="credential-item">
          <span class="credential-label">Portal URL</span><br>
          <a href="${loginUrl}" style="color: #667eea; font-size: 16px; font-weight: 500;">${loginUrl}</a>
        </div>
      </div>

      <div class="steps">
        <h3 style="margin-top: 0; color: #333333; font-size: 18px; font-weight: 600;">📋 Next Steps</h3>
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <div class="step-title">Log In to Your Account</div>
            <div class="step-desc">Use your credentials above to access the tenant portal</div>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <div class="step-title">Change Your Password</div>
            <div class="step-desc">Create a secure password for your account</div>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <div class="step-title">Complete KYC Verification</div>
            <div class="step-desc">Verify your identity to unlock all features</div>
          </div>
        </div>
      </div>

      <div class="kyc-section">
        <h3>🛡️ KYC Verification Required</h3>
        <p style="margin: 0 0 10px; color: #065f46;">To ensure security and comply with regulations, please complete your KYC (Know Your Customer) verification:</p>
        <ul>
          <li><strong>Upload a valid government-issued ID</strong> (National ID, Driver's License, or International Passport)</li>
          <li><strong>Take a selfie</strong> for identity verification</li>
        </ul>
        <p style="margin: 15px 0 0; color: #047857; font-size: 13px;">⏱️ KYC verification typically takes 24-48 hours to process.</p>
      </div>

      <div class="warning">
        <strong>⚠️ Security Notice:</strong> Your temporary password will expire in 48 hours. Please log in and change it immediately.
      </div>

      <center>
        <a href="${loginUrl}" class="button">🚀 Access Tenant Portal</a>
      </center>

      <p style="margin-top: 30px; color: #333333;">If you have any questions or need assistance, please contact property management.</p>

      <p style="color: #333333;">Best regards,<br>
      <strong>${invitedBy}</strong><br>
      Property Management Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email from Contrezz Property Management Platform.</p>
      <p>Please do not reply to this message.</p>
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
      from: config.from,
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
        from: config.from,
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
      from: config.from,
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
      from: formatSender('Contrezz Support'),
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
          from: formatSender('Contrezz Security'),
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
        from: formatSender('Contrezz Security'),
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
 * Send account activation email (when admin activates customer from onboarding)
 */
export interface AccountActivationParams {
  customerName: string;
  customerEmail: string;
  companyName: string;
  temporaryPassword: string;
  /**
   * Optional explicit login URL.
   * If not provided, we will build it from FRONTEND_URL + '/signin'
   * so that in production it always points to the real sign-in page
   * (e.g. https://contrezz.com/signin).
   */
  loginUrl?: string;
  applicationType: string;
}

/**
 * Send templated email using template system
 * Falls back to hardcoded templates if template not found
 */
export async function sendTemplatedEmail(
  templateType: string,
  variables: Record<string, any>,
  recipient: { email: string; name?: string }
): Promise<boolean> {
  try {
    const { emailTemplateService } = require('../services/email-template.service');
    const { templateRendererService } = require('../services/template-renderer.service');

    // Get active template by type
    const template = await emailTemplateService.getTemplateByType(templateType);

    if (!template) {
      console.warn(`⚠️ No active template found for type: ${templateType}, falling back to hardcoded template`);
      return false; // Fallback to hardcoded templates
    }

    // Validate variables
    const validation = emailTemplateService.validateVariables(template, variables);
    if (!validation.valid) {
      console.error(`❌ Missing required variables for template ${templateType}:`, validation.missing);
      return false;
    }

    // Render template
    const renderedSubject = templateRendererService.renderSubject(template.subject, variables);
    const renderedHtml = templateRendererService.renderHtmlBody(template.body_html, variables);
    const renderedText = template.body_text
      ? templateRendererService.renderTemplate(template.body_text, variables)
      : templateRendererService.generatePlainText(renderedHtml, variables);

    // Send email
    return await sendEmail({
      to: recipient.email,
      subject: renderedSubject,
      html: renderedHtml,
      text: renderedText,
    });
  } catch (error: any) {
    console.error(`❌ Error sending templated email (${templateType}):`, error);
    return false;
  }
}

/**
 * Internal Admin Credentials Email Parameters
 */
interface InternalAdminCredentialsParams {
  adminName: string;
  adminEmail: string;
  tempPassword: string;
  role?: string;
  department?: string;
  isPasswordReset?: boolean;
}

/**
 * Send login credentials email to internal admin user
 */
export async function sendInternalAdminCredentials(params: InternalAdminCredentialsParams): Promise<boolean> {
  const {
    adminName,
    adminEmail,
    tempPassword,
    role,
    department,
    isPasswordReset = false
  } = params;

  const config = getEmailConfig();
  const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const loginUrl = `${frontendBase}/signin`;

  // Try to use template from database first
  try {
    const { emailTemplateService } = require('../services/email-template.service');
    const { templateRendererService } = require('../services/template-renderer.service');

    const template = await emailTemplateService.getTemplateByType('internal_admin');

    if (template && template.is_active) {
      // Prepare variables for template
      const emailSubject = isPasswordReset
        ? '🔐 Your Admin Account Password Has Been Reset - Contrezz Platform'
        : '🎉 Welcome to Contrezz Admin Platform - Your Account is Ready!';

      const roleRow = role ? `<tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Role:</td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 500;">${role}</td>
          </tr>` : '';
      const roleText = role ? `Role: ${role}` : '';

      const departmentRow = department ? `<tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Department:</td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 500;">${department}</td>
          </tr>` : '';
      const departmentText = department ? `Department: ${department}` : '';

      const featuresBox = !isPasswordReset ? `<div style="background-color: #eff6ff; padding: 20px; margin: 0 0 30px; border-radius: 4px;">
        <h3 style="color: #1e40af; margin: 0 0 10px; font-size: 16px; font-weight: 600;">What You Can Do</h3>
        <ul style="color: #1e40af; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Access the Admin Dashboard</li>
          <li style="margin-bottom: 8px;">Manage users and permissions</li>
          <li style="margin-bottom: 8px;">View system reports and analytics</li>
          <li style="margin-bottom: 8px;">Configure platform settings</li>
          <li>Monitor customer accounts</li>
        </ul>
      </div>` : '';

      const featuresText = !isPasswordReset ? `WHAT YOU CAN DO:

• Access the Admin Dashboard
• Manage users and permissions
• View system reports and analytics
• Configure platform settings
• Monitor customer accounts` : '';

      const templateVariables = {
        adminName,
        adminEmail,
        tempPassword,
        loginUrl,
        emailSubject,
        emailTitle: isPasswordReset ? 'Password Reset' : 'Welcome',
        headerTitle: isPasswordReset ? '🔐 Password Reset' : '🎉 Welcome to Contrezz Admin!',
        headerSubtitle: isPasswordReset ? 'Your password has been reset' : 'Your admin account is ready',
        introText: isPasswordReset
          ? 'Your admin account password has been reset. Here are your new login credentials:'
          : 'Your admin account has been created and is ready to use. Here are your login credentials:',
        securityNotice: `If you did not request this ${isPasswordReset ? 'password reset' : 'account'}, please contact support immediately`,
        role: role || '',
        roleRow,
        roleText,
        department: department || '',
        departmentRow,
        departmentText,
        featuresBox,
        featuresText,
      };

      // Validate variables
      const validation = emailTemplateService.validateVariables(template, templateVariables);
      if (validation.valid) {
        // Render template
        const renderedSubject = templateRendererService.renderSubject(template.subject, templateVariables);
        const renderedHtml = templateRendererService.renderHtmlBody(template.body_html, templateVariables);
        const renderedText = template.body_text
          ? templateRendererService.renderTemplate(template.body_text, templateVariables)
          : templateRendererService.generatePlainText(renderedHtml, templateVariables);

        // Send email using template
        const emailSent = await sendEmail({
          to: adminEmail,
          subject: renderedSubject,
          html: renderedHtml,
          text: renderedText,
        });

        if (emailSent) {
          console.log(`✅ [Internal Admin Credentials] Email sent successfully using template to: ${adminEmail}`);
          return true;
        }
      } else {
        console.warn(`⚠️ [Internal Admin Credentials] Template validation failed, falling back to hardcoded template:`, validation.missing);
      }
    }
  } catch (templateError: any) {
    console.warn(`⚠️ [Internal Admin Credentials] Error using template, falling back to hardcoded template:`, templateError.message);
  }

  // Fallback to hardcoded template
  const emailSubject = isPasswordReset
    ? '🔐 Your Admin Account Password Has Been Reset - Contrezz Platform'
    : '🎉 Welcome to Contrezz Admin Platform - Your Account is Ready!';

  const emailBody = `
Hello ${adminName},

${isPasswordReset
  ? 'Your admin account password has been reset. Here are your new login credentials:'
  : 'Your admin account has been created and is ready to use. Here are your login credentials:'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Email: ${adminEmail}
Temporary Password: ${tempPassword}
Admin Portal: ${loginUrl}
${role ? `Role: ${role}` : ''}
${department ? `Department: ${department}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT SECURITY STEPS:

1. Log in using your credentials above
2. Change your password immediately after first login
3. Do not share your credentials with anyone
4. If you did not request this ${isPasswordReset ? 'password reset' : 'account'}, please contact support immediately

${!isPasswordReset ? `
WHAT YOU CAN DO:

• Access the Admin Dashboard
• Manage users and permissions
• View system reports and analytics
• Configure platform settings
• Monitor customer accounts
` : ''}

If you have any questions or need assistance, please contact our support team at support@contrezz.com.

Best regards,
Contrezz Platform Team

---
This is an automated email. Please do not reply to this message.
  `.trim();

  const html = generateInternalAdminCredentialsHtml(params, loginUrl);

  try {
    console.log(`📧 [Internal Admin Credentials] Sending ${isPasswordReset ? 'password reset' : 'welcome'} email to: ${adminEmail}`);

    const transporter = getTransporter();

    // Verify connection before sending
    try {
      await transporter.verify();
      console.log('✅ [Internal Admin Credentials] SMTP connection verified');
    } catch (verifyError: any) {
      console.error('❌ [Internal Admin Credentials] SMTP verification failed:', verifyError.message);
      console.error('🔄 [Internal Admin Credentials] Creating fresh transporter...');

      const freshTransporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.auth.user,
          pass: config.auth.pass,
        },
        pool: false,
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 30000,
      });

      const info = await freshTransporter.sendMail({
        from: config.from,
        to: adminEmail,
        subject: emailSubject,
        text: emailBody,
        html: html
      });

      console.log('✅ [Internal Admin Credentials] Email sent successfully!');
      console.log('📬 Message ID:', info.messageId);
      return true;
    }

    const info = await transporter.sendMail({
      from: config.from,
      to: adminEmail,
      subject: emailSubject,
      text: emailBody,
      html: html
    });

    console.log('✅ [Internal Admin Credentials] Email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    return true;
  } catch (error: any) {
    console.error('❌ [Internal Admin Credentials] Failed to send email:', error);
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
 * Generate HTML version of internal admin credentials email
 */
function generateInternalAdminCredentialsHtml(params: InternalAdminCredentialsParams, loginUrl: string): string {
  const {
    adminName,
    adminEmail,
    tempPassword,
    role,
    department,
    isPasswordReset = false
  } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isPasswordReset ? 'Password Reset' : 'Welcome'} - Contrezz Admin Platform</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
        ${isPasswordReset ? '🔐 Password Reset' : '🎉 Welcome to Contrezz Admin!'}
      </h1>
      <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.9;">
        ${isPasswordReset ? 'Your password has been reset' : 'Your admin account is ready'}
      </p>
    </div>

    <!-- Main Content -->
    <div style="background-color: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Hello <strong>${adminName}</strong>,
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
        ${isPasswordReset
          ? 'Your admin account password has been reset. Here are your new login credentials:'
          : 'Your admin account has been created and is ready to use. Here are your login credentials:'}
      </p>

      <!-- Login Credentials Box -->
      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 0 0 30px; border-radius: 4px;">
        <h2 style="color: #667eea; margin: 0 0 15px; font-size: 18px; font-weight: 600;">Your Login Credentials</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 40%;">Email:</td>
            <td style="padding: 8px 0;">
              <span style="background-color: #f3f4f6; color: #333333; padding: 6px 12px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 14px; font-weight: 500;">${adminEmail}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Temporary Password:</td>
            <td style="padding: 8px 0;">
              <span style="background-color: #f3f4f6; color: #333333; padding: 6px 12px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 14px; font-weight: 500;">${tempPassword}</span>
            </td>
          </tr>
          ${role ? `
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Role:</td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 500;">${role}</td>
          </tr>
          ` : ''}
          ${department ? `
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Department:</td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 500;">${department}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- Security Warning -->
      <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 20px; margin: 0 0 30px; border-radius: 4px;">
        <h3 style="color: #92400e; margin: 0 0 10px; font-size: 16px; font-weight: 600;">⚠️ Important Security Steps</h3>
        <ol style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Log in using your credentials above</li>
          <li style="margin-bottom: 8px;">Change your password immediately after first login</li>
          <li style="margin-bottom: 8px;">Do not share your credentials with anyone</li>
          <li>If you did not request this ${isPasswordReset ? 'password reset' : 'account'}, contact support immediately</li>
        </ol>
      </div>

      ${!isPasswordReset ? `
      <!-- Features Box -->
      <div style="background-color: #eff6ff; padding: 20px; margin: 0 0 30px; border-radius: 4px;">
        <h3 style="color: #1e40af; margin: 0 0 10px; font-size: 16px; font-weight: 600;">What You Can Do</h3>
        <ul style="color: #1e40af; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Access the Admin Dashboard</li>
          <li style="margin-bottom: 8px;">Manage users and permissions</li>
          <li style="margin-bottom: 8px;">View system reports and analytics</li>
          <li style="margin-bottom: 8px;">Configure platform settings</li>
          <li>Monitor customer accounts</li>
        </ul>
      </div>
      ` : ''}

      <!-- Login Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Access Admin Dashboard
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
</html>
  `.trim();
}

export async function sendAccountActivationEmail(params: AccountActivationParams): Promise<boolean> {
  try {
    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const loginUrl = params.loginUrl || `${frontendBase}/signin`;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 [Account Activation] Preparing to send activation email...');
    console.log('📧 [Account Activation] Recipient:', params.customerEmail);
    console.log('📧 [Account Activation] Company:', params.companyName);
    console.log('📧 [Account Activation] Login URL:', loginUrl);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Try to use template system first
    try {
      const templateSent = await sendTemplatedEmail(
        'activation',
        {
          customerName: params.customerName,
          customerEmail: params.customerEmail,
          companyName: params.companyName,
          temporaryPassword: params.temporaryPassword,
          loginUrl: loginUrl,
          applicationType: params.applicationType,
        },
        {
          email: params.customerEmail,
          name: params.customerName,
        }
      );

      if (templateSent) {
        console.log('✅ [Account Activation] Email sent using template system');
        return true;
      }
    } catch (templateError: any) {
      console.warn('⚠️ [Account Activation] Template system failed, using hardcoded template:', templateError.message);
    }

    // Fallback to hardcoded template
    const config = getEmailConfig();

    const accountType = params.applicationType === 'property-developer' || params.applicationType === 'developer'
      ? 'Developer'
      : params.applicationType === 'property-owner'
      ? 'Property Owner'
      : params.applicationType === 'property-manager'
      ? 'Property Manager'
      : 'Customer';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; background-color: #f9fafb; }
    .credentials { background-color: #fff; padding: 20px; border-left: 4px solid #4F46E5; margin: 20px 0; border-radius: 4px; }
    .credentials h3 { margin-top: 0; color: #4F46E5; }
    .credential-item { margin: 10px 0; }
    .credential-label { font-weight: bold; color: #666; }
    .credential-value { font-family: 'Courier New', monospace; background-color: #f3f4f6; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; }
    .button { display: inline-block; padding: 14px 28px; background-color: #4F46E5; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .button:hover { background-color: #4338CA; }
    .warning { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .warning-icon { color: #F59E0B; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background-color: #f9fafb; border-radius: 0 0 8px 8px; }
    .footer a { color: #4F46E5; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Your Account is Active!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${params.customerName}</strong>,</p>

      <p>Great news! Your <strong>${accountType}</strong> account for <strong>${params.companyName}</strong> has been approved and activated by our admin team.</p>

      <p><strong>⚠️ Important:</strong> Before you can access your dashboard, you must complete our <strong>Identity Verification (KYC)</strong> process. This is a one-time requirement to ensure the security of your account.</p>

      <div class="credentials">
        <h3>🔐 Your Login Credentials</h3>
        <div class="credential-item">
          <div class="credential-label">Email:</div>
          <div class="credential-value">${params.customerEmail}</div>
        </div>
        <div class="credential-item">
          <div class="credential-label">Temporary Password:</div>
          <div class="credential-value">${params.temporaryPassword}</div>
        </div>
      </div>

      <div class="warning">
        <p><span class="warning-icon">📋 Identity Verification Required:</span></p>
        <p>After logging in, you will be directed to our KYC verification page. Please have the following documents ready:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li><strong>National Identification Number (NIN)</strong> - Strongly recommended</li>
          <li>Proof of Address (Utility bill, Bank statement)</li>
          <li>Valid Passport Data Page</li>
          <li>Driver's License</li>
          <li>Voter's Card</li>
        </ul>
        <p><strong>You must upload at least 2 documents</strong> to complete verification. Once verified, your account will be activated with a free trial period.</p>
      </div>

      <div class="warning">
        <p><span class="warning-icon">⚠️ Security Notice:</span></p>
        <p>For your security, you will be required to <strong>change your password</strong> on your first login. Please choose a strong, unique password.</p>
      </div>

      <div style="text-align: center;">
        <a href="${loginUrl}" class="button">Login to Your Account</a>
      </div>

      <p style="margin-top: 30px;">If you have any questions or need assistance getting started, please don't hesitate to contact our support team.</p>

      <p>Welcome aboard!</p>
      <p><strong>The Contrezz Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message from Contrezz.</p>
      <p>If you did not apply for an account, please contact us immediately at <a href="mailto:support@contrezz.com">support@contrezz.com</a></p>
      <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
        © ${new Date().getFullYear()} Contrezz. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Your Account is Active!

Hi ${params.customerName},

Great news! Your ${accountType} account for ${params.companyName} has been approved and activated by our admin team.

Your Login Credentials:
Email: ${params.customerEmail}
Temporary Password: ${params.temporaryPassword}

IMPORTANT: For your security, you will be required to change your password on your first login.

Login here: ${loginUrl}

If you have any questions or need assistance getting started, please contact our support team.

Welcome aboard!
The Contrezz Team

---
This is an automated message from Contrezz.
If you did not apply for an account, please contact us immediately at support@contrezz.com
    `;

    console.log('📧 [Account Activation] Step 1: Creating fresh transporter...');

    // Create fresh transporter without connection pooling for instant delivery
    const freshTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
      pool: false, // Disable connection pooling for instant delivery
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 30000,
    });

    console.log('📧 [Account Activation] Step 2: Verifying SMTP connection...');

    try {
      await freshTransporter.verify();
      console.log('✅ [Account Activation] SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('❌ [Account Activation] SMTP verification failed:', verifyError);
      throw verifyError;
    }

    console.log('📧 [Account Activation] Step 3: Sending email with verified connection...');

    const info = await freshTransporter.sendMail({
      from: formatSender('Contrezz'),
      to: params.customerEmail,
      subject: `🎉 Your ${params.companyName} Account is Now Active!`,
      text,
      html,
    });

    // Validate email was actually sent
    if (!info || !info.messageId) {
      console.error('❌ [Account Activation] Email send failed - no message ID returned');
      console.error('📧 Response:', info);
      return false;
    }

    // Check for rejection
    if (info.rejected && info.rejected.length > 0) {
      console.error('❌ [Account Activation] Email rejected by server');
      console.error('📧 Rejected addresses:', info.rejected);
      return false;
    }

    console.log('✅ Account activation email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Sent to:', params.customerEmail);
    console.log('📊 Response:', info.response);
    console.log('[Account Activation] ✅✅✅ Activation email sent successfully to:', params.customerEmail);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return true;
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ [Account Activation] Failed to send activation email:', error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return false;
  }
}

/**
 * Send plan upgrade confirmation email
 */
export interface PlanUpgradeParams {
  customerName: string;
  customerEmail: string;
  companyName: string;
  oldPlanName: string;
  newPlanName: string;
  newPlanPrice: number;
  currency: string;
  billingCycle: string;
  effectiveDate: string;
  newFeatures: {
    projects?: number;
    properties?: number;
    units?: number;
    users: number;
    storage: number;
  };
  dashboardUrl: string;
}

export async function sendPlanUpgradeEmail(params: PlanUpgradeParams): Promise<boolean> {
  try {
    const config = getEmailConfig();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 [Plan Upgrade] Preparing to send upgrade confirmation email...');
    console.log('📧 [Plan Upgrade] Recipient:', params.customerEmail);
    console.log('📧 [Plan Upgrade] Company:', params.companyName);
    console.log('📧 [Plan Upgrade] Plan:', `${params.oldPlanName} → ${params.newPlanName}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Explicitly log SMTP configuration to confirm env values are being used
    console.log('📧 [Plan Upgrade] SMTP Config (from env):', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user,
      from: config.from,
      hasPassword: !!config.auth.pass,
      passwordLength: config.auth.pass ? String(config.auth.pass).length : 0,
    });

    // Format price (prices are now stored in Naira, not kobo)
    const formattedPrice = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: params.currency,
      minimumFractionDigits: 0,
    }).format(params.newPlanPrice);

    // Build features list
    let featuresHtml = '';
    let featuresText = '';

    if (params.newFeatures.projects) {
      featuresHtml += `<li><strong>${params.newFeatures.projects}</strong> active projects</li>`;
      featuresText += `- ${params.newFeatures.projects} active projects\n`;
    }
    if (params.newFeatures.properties) {
      featuresHtml += `<li><strong>${params.newFeatures.properties}</strong> properties</li>`;
      featuresText += `- ${params.newFeatures.properties} properties\n`;
    }
    if (params.newFeatures.units) {
      featuresHtml += `<li><strong>${params.newFeatures.units}</strong> units per property</li>`;
      featuresText += `- ${params.newFeatures.units} units per property\n`;
    }
    featuresHtml += `<li><strong>${params.newFeatures.users}</strong> team members</li>`;
    featuresHtml += `<li><strong>${params.newFeatures.storage}MB</strong> storage</li>`;
    featuresText += `- ${params.newFeatures.users} team members\n`;
    featuresText += `- ${params.newFeatures.storage}MB storage\n`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 32px; }
    .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
    .content { padding: 30px 20px; background-color: #f9fafb; }
    .upgrade-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .upgrade-box .old-plan { font-size: 18px; opacity: 0.8; text-decoration: line-through; margin-bottom: 10px; }
    .upgrade-box .arrow { font-size: 24px; margin: 10px 0; }
    .upgrade-box .new-plan { font-size: 28px; font-weight: bold; margin-top: 10px; }
    .upgrade-box .price { font-size: 36px; font-weight: bold; margin: 15px 0; }
    .features { background-color: #fff; padding: 25px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
    .features h3 { margin-top: 0; color: #667eea; }
    .features ul { list-style: none; padding: 0; }
    .features li { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .features li:last-child { border-bottom: none; }
    .features li:before { content: "✓"; color: #10b981; font-weight: bold; margin-right: 10px; }
    .info-box { background-color: #EEF2FF; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .button:hover { opacity: 0.9; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background-color: #f9fafb; border-radius: 0 0 8px 8px; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Plan Upgraded Successfully!</h1>
      <p>Your subscription has been upgraded</p>
    </div>
    <div class="content">
      <p>Hi <strong>${params.customerName}</strong>,</p>

      <p>Great news! Your subscription for <strong>${params.companyName}</strong> has been successfully upgraded.</p>

      <div class="upgrade-box">
        <div class="old-plan">${params.oldPlanName}</div>
        <div class="arrow">↓</div>
        <div class="new-plan">${params.newPlanName}</div>
        <div class="price">${formattedPrice}/${params.billingCycle === 'annual' ? 'year' : 'month'}</div>
      </div>

      <div class="features">
        <h3>🎉 Your New Plan Includes:</h3>
        <ul>
          ${featuresHtml}
        </ul>
      </div>

      <div class="info-box">
        <p><strong>📅 Effective Date:</strong> ${params.effectiveDate}</p>
        <p><strong>💳 Billing Cycle:</strong> ${params.billingCycle === 'annual' ? 'Annual' : 'Monthly'}</p>
        <p style="margin-bottom: 0;"><strong>🔄 Next Billing:</strong> ${params.billingCycle === 'annual' ? '1 year from today' : '30 days from today'}</p>
      </div>

      <div style="text-align: center;">
        <a href="${params.dashboardUrl}" class="button">Go to Dashboard</a>
      </div>

      <p style="margin-top: 30px;">Your new plan features are now active and ready to use. If you have any questions about your upgrade or need assistance, please don't hesitate to contact our support team.</p>

      <p>Thank you for choosing Contrezz!</p>
      <p><strong>The Contrezz Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated confirmation from Contrezz.</p>
      <p>Questions? Contact us at <a href="mailto:support@contrezz.com">support@contrezz.com</a></p>
      <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
        © ${new Date().getFullYear()} Contrezz. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Plan Upgraded Successfully!

Hi ${params.customerName},

Great news! Your subscription for ${params.companyName} has been successfully upgraded.

UPGRADE SUMMARY:
Previous Plan: ${params.oldPlanName}
New Plan: ${params.newPlanName}
Price: ${formattedPrice}/${params.billingCycle === 'annual' ? 'year' : 'month'}

YOUR NEW PLAN INCLUDES:
${featuresText}

BILLING INFORMATION:
Effective Date: ${params.effectiveDate}
Billing Cycle: ${params.billingCycle === 'annual' ? 'Annual' : 'Monthly'}
Next Billing: ${params.billingCycle === 'annual' ? '1 year from today' : '30 days from today'}

Your new plan features are now active and ready to use.

Access your dashboard: ${params.dashboardUrl}

If you have any questions about your upgrade or need assistance, please contact our support team.

Thank you for choosing Contrezz!
The Contrezz Team

---
This is an automated confirmation from Contrezz.
Questions? Contact us at support@contrezz.com
    `;

    console.log('📧 [Plan Upgrade] Step 1: Creating fresh transporter...');

    // Create fresh transporter without connection pooling for instant delivery
    const freshTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
      pool: false, // Disable connection pooling for instant delivery
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 30000,
    });

    console.log('📧 [Plan Upgrade] Step 2: Verifying SMTP connection...');

    try {
      await freshTransporter.verify();
      console.log('✅ [Plan Upgrade] SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('❌ [Plan Upgrade] SMTP verification failed:', verifyError);
      throw verifyError;
    }

    console.log('📧 [Plan Upgrade] Step 3: Sending email with verified connection...');

    const info = await freshTransporter.sendMail({
      from: formatSender('Contrezz'),
      to: params.customerEmail,
      subject: `🚀 Your ${params.companyName} Plan Has Been Upgraded!`,
      text,
      html,
    });

    // Validate email was actually sent
    if (!info || !info.messageId) {
      console.error('❌ [Plan Upgrade] Email send failed - no message ID returned');
      console.error('📧 Response:', info);
      return false;
    }

    // Check for rejection
    if (info.rejected && info.rejected.length > 0) {
      console.error('❌ [Plan Upgrade] Email rejected by server');
      console.error('📧 Rejected addresses:', info.rejected);
      return false;
    }

    // Optional: check that at least one recipient was accepted
    if (!info.accepted || info.accepted.length === 0) {
      console.error('❌ [Plan Upgrade] Email not accepted by any recipient');
      console.error('📧 Accepted list is empty or undefined:', info.accepted);
      return false;
    }

    console.log('✅ Plan upgrade email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Sent to:', params.customerEmail);
    console.log('📊 Response:', info.response);
    console.log('[Plan Upgrade] ✅✅✅ Upgrade confirmation email sent successfully to:', params.customerEmail);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return true;
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ [Plan Upgrade] Failed to send upgrade confirmation email:', error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return false;
  }
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
        from: formatSender(params.companyName),
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
      from: formatSender(params.companyName),
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

/**
 * Send KYC Verified Email (Auto-approved by Dojah)
 */
export interface KYCVerifiedParams {
  customerName: string;
  customerEmail: string;
  companyName: string;
  loginUrl: string;
}

export async function sendKYCVerifiedEmail(params: KYCVerifiedParams): Promise<boolean> {
  try {
    const config = getEmailConfig();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 [KYC Verified] Preparing to send KYC verified email...');
    console.log('📧 [KYC Verified] Recipient:', params.customerEmail);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10B981; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; background-color: #f9fafb; }
    .success-box { background-color: #D1FAE5; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; padding: 14px 28px; background-color: #10B981; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .button:hover { background-color: #059669; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background-color: #f9fafb; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Identity Verified!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${params.customerName}</strong>,</p>

      <p>Great news! Your identity verification has been completed successfully.</p>

      <div class="success-box">
        <p><strong>🎉 Your account is now active with a FREE TRIAL!</strong></p>
        <p>You can now access your dashboard and start using all the features available to you.</p>
      </div>

      <div style="text-align: center;">
        <a href="${params.loginUrl}" class="button">Access Your Dashboard</a>
      </div>

      <p style="margin-top: 30px;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

      <p>Welcome aboard!</p>
      <p><strong>The Contrezz Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message from Contrezz.</p>
      <p>If you did not apply for an account, please contact us immediately at <a href="mailto:support@contrezz.com">support@contrezz.com</a></p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `Identity Verified!

Hi ${params.customerName},

Great news! Your identity verification has been completed successfully.

Your account is now active with a FREE TRIAL! You can now access your dashboard and start using all the features available to you.

Access your dashboard: ${params.loginUrl}

If you have any questions or need assistance, please don't hesitate to contact our support team.

Welcome aboard!
The Contrezz Team

This is an automated message from Contrezz.
If you did not apply for an account, please contact us immediately at support@contrezz.com`;

    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: formatSender('Contrezz'),
      to: params.customerEmail,
      subject: '✅ Identity Verification Complete - Welcome to Contrezz!',
      html,
      text,
    });

    console.log('✅ [KYC Verified] Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ [KYC Verified] Failed to send email:', error);
    return false;
  }
}

/**
 * Send Manual Verification Email (Admin approved)
 */
export interface ManualVerificationParams {
  customerName: string;
  customerEmail: string;
  companyName: string;
  loginUrl: string;
  adminNotes?: string;
}

export async function sendManualVerificationEmail(params: ManualVerificationParams): Promise<boolean> {
  try {
    const config = getEmailConfig();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 [Manual Verification] Preparing to send manual verification email...');
    console.log('📧 [Manual Verification] Recipient:', params.customerEmail);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #3B82F6; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; background-color: #f9fafb; }
    .success-box { background-color: #DBEAFE; border-left: 4px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; padding: 14px 28px; background-color: #3B82F6; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .button:hover { background-color: #2563EB; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background-color: #f9fafb; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Account Verified by Admin</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${params.customerName}</strong>,</p>

      <p>Your account has been manually verified and approved by our admin team.</p>

      <div class="success-box">
        <p><strong>🎉 Your account is now active with a FREE TRIAL!</strong></p>
        <p>You can now access your dashboard and start using all the features available to you.</p>
        ${params.adminNotes ? `<p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #93C5FD;"><strong>Admin Note:</strong> ${params.adminNotes}</p>` : ''}
      </div>

      <div style="text-align: center;">
        <a href="${params.loginUrl}" class="button">Access Your Dashboard</a>
      </div>

      <p style="margin-top: 30px;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

      <p>Welcome aboard!</p>
      <p><strong>The Contrezz Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message from Contrezz.</p>
      <p>If you did not apply for an account, please contact us immediately at <a href="mailto:support@contrezz.com">support@contrezz.com</a></p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `Account Verified by Admin

Hi ${params.customerName},

Your account has been manually verified and approved by our admin team.

Your account is now active with a FREE TRIAL! You can now access your dashboard and start using all the features available to you.

${params.adminNotes ? `Admin Note: ${params.adminNotes}\n\n` : ''}Access your dashboard: ${params.loginUrl}

If you have any questions or need assistance, please don't hesitate to contact our support team.

Welcome aboard!
The Contrezz Team

This is an automated message from Contrezz.
If you did not apply for an account, please contact us immediately at support@contrezz.com`;

    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: formatSender('Contrezz'),
      to: params.customerEmail,
      subject: '✅ Account Verified - Welcome to Contrezz!',
      html,
      text,
    });

    console.log('✅ [Manual Verification] Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ [Manual Verification] Failed to send email:', error);
    return false;
  }
}

/**
 * Send KYC Rejection Email
 */
export interface KYCRejectionParams {
  customerName: string;
  customerEmail: string;
  companyName: string;
  rejectionReason: string;
  retryUrl: string;
}

export async function sendKYCRejectionEmail(params: KYCRejectionParams): Promise<boolean> {
  try {
    const config = getEmailConfig();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 [KYC Rejection] Preparing to send KYC rejection email...');
    console.log('📧 [KYC Rejection] Recipient:', params.customerEmail);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #EF4444; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; background-color: #f9fafb; }
    .warning-box { background-color: #FEE2E2; border-left: 4px solid #EF4444; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .info-box { background-color: #DBEAFE; border-left: 4px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; padding: 14px 28px; background-color: #3B82F6; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .button:hover { background-color: #2563EB; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background-color: #f9fafb; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Verification Not Approved</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${params.customerName}</strong>,</p>

      <p>We were unable to verify your identity with the documents you provided.</p>

      <div class="warning-box">
        <p><strong>Reason for Rejection:</strong></p>
        <p>${params.rejectionReason}</p>
      </div>

      <div class="info-box">
        <p><strong>📋 What to do next:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Review the rejection reason above</li>
          <li>Ensure your documents are clear, legible, and valid</li>
          <li>Make sure the information matches what you provided</li>
          <li>Submit new documents for verification</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="${params.retryUrl}" class="button">Retry Verification</a>
      </div>

      <p style="margin-top: 30px;">If you have any questions or need assistance, please contact our support team at <a href="mailto:support@contrezz.com">support@contrezz.com</a></p>

      <p><strong>The Contrezz Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message from Contrezz.</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `Verification Not Approved

Hi ${params.customerName},

We were unable to verify your identity with the documents you provided.

Reason for Rejection:
${params.rejectionReason}

What to do next:
- Review the rejection reason above
- Ensure your documents are clear, legible, and valid
- Make sure the information matches what you provided
- Submit new documents for verification

Retry verification: ${params.retryUrl}

If you have any questions or need assistance, please contact our support team at support@contrezz.com

The Contrezz Team

This is an automated message from Contrezz.`;

    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: formatSender('Contrezz'),
      to: params.customerEmail,
      subject: '❌ Identity Verification Not Approved',
      html,
      text,
    });

    console.log('✅ [KYC Rejection] Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ [KYC Rejection] Failed to send email:', error);
    return false;
  }
}

// ============================================================================
// TENANT KYC APPROVAL/REJECTION BY OWNER
// ============================================================================

interface TenantKycApprovedParams {
  tenantName: string;
  tenantEmail: string;
  propertyName: string;
  approvedBy: string;
  notes?: string;
}

export async function sendTenantKycApprovedEmail(params: TenantKycApprovedParams): Promise<boolean> {
  try {
    const config = getEmailConfig();
    const loginUrl = process.env.PRODUCTION_SIGNIN_URL || process.env.FRONTEND_URL || 'https://app.contrezz.com/signin';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KYC Verification Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">✅ KYC Approved!</h1>
      <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your identity has been verified</p>
    </div>

    <div style="background-color: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Dear <strong>${params.tenantName}</strong>,
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Great news! Your KYC (Know Your Customer) verification has been <strong style="color: #10b981;">approved</strong> by ${params.approvedBy} at ${params.propertyName}.
      </p>

      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <h3 style="color: #065f46; margin: 0 0 10px; font-size: 16px;">🎉 What this means for you:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #047857;">
          <li style="margin: 8px 0;">Full access to all tenant portal features</li>
          <li style="margin: 8px 0;">Ability to make rental payments online</li>
          <li style="margin: 8px 0;">Submit and track maintenance requests</li>
          <li style="margin: 8px 0;">View and download lease documents</li>
        </ul>
      </div>

      ${params.notes ? `
      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #333333; font-size: 14px;"><strong>Note from property management:</strong></p>
        <p style="margin: 10px 0 0; color: #666666; font-size: 14px;">${params.notes}</p>
      </div>
      ` : ''}

      <center>
        <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold;">
          🚀 Access Tenant Portal
        </a>
      </center>

      <p style="color: #666666; font-size: 14px; margin-top: 30px;">
        If you have any questions, please contact your property management.
      </p>

      <p style="color: #333333;">
        Best regards,<br>
        <strong>${params.propertyName}</strong><br>
        Property Management Team
      </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p>This is an automated email from Contrezz Property Management Platform.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const text = `
KYC Verification Approved!

Dear ${params.tenantName},

Great news! Your KYC (Know Your Customer) verification has been approved by ${params.approvedBy} at ${params.propertyName}.

What this means for you:
- Full access to all tenant portal features
- Ability to make rental payments online
- Submit and track maintenance requests
- View and download lease documents

${params.notes ? `Note from property management: ${params.notes}\n` : ''}

Access your tenant portal: ${loginUrl}

If you have any questions, please contact your property management.

Best regards,
${params.propertyName}
Property Management Team
    `.trim();

    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: formatSender(params.propertyName),
      to: params.tenantEmail,
      subject: '✅ KYC Verification Approved - Full Access Granted!',
      html,
      text,
    });

    console.log('✅ [Tenant KYC Approved] Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ [Tenant KYC Approved] Failed to send email:', error);
    return false;
  }
}

interface TenantKycRejectedParams {
  tenantName: string;
  tenantEmail: string;
  propertyName: string;
  rejectedBy: string;
  reason: string;
}

export async function sendTenantKycRejectedEmail(params: TenantKycRejectedParams): Promise<boolean> {
  try {
    const config = getEmailConfig();
    const loginUrl = process.env.PRODUCTION_SIGNIN_URL || process.env.FRONTEND_URL || 'https://app.contrezz.com/signin';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KYC Verification Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">KYC Verification Update</h1>
      <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Action required</p>
    </div>

    <div style="background-color: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Dear <strong>${params.tenantName}</strong>,
      </p>

      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        We regret to inform you that your KYC verification could not be approved at this time.
      </p>

      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <h3 style="color: #991b1b; margin: 0 0 10px; font-size: 16px;">📋 Reason for Rejection:</h3>
        <p style="margin: 0; color: #7f1d1d; font-size: 14px;">${params.reason}</p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="color: #333333; margin: 0 0 15px; font-size: 16px;">📝 What to do next:</h3>
        <ol style="margin: 0; padding-left: 20px; color: #666666;">
          <li style="margin: 8px 0;">Review the rejection reason above</li>
          <li style="margin: 8px 0;">Ensure your documents are clear, legible, and valid</li>
          <li style="margin: 8px 0;">Make sure the information matches your records</li>
          <li style="margin: 8px 0;">Log in and resubmit your KYC documents</li>
        </ol>
      </div>

      <center>
        <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold;">
          🔄 Resubmit KYC Documents
        </a>
      </center>

      <p style="color: #666666; font-size: 14px; margin-top: 30px;">
        If you believe this was a mistake or need assistance, please contact your property management at ${params.propertyName}.
      </p>

      <p style="color: #333333;">
        Best regards,<br>
        <strong>${params.propertyName}</strong><br>
        Property Management Team
      </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p>This is an automated email from Contrezz Property Management Platform.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const text = `
KYC Verification Update

Dear ${params.tenantName},

We regret to inform you that your KYC verification could not be approved at this time.

Reason for Rejection:
${params.reason}

What to do next:
1. Review the rejection reason above
2. Ensure your documents are clear, legible, and valid
3. Make sure the information matches your records
4. Log in and resubmit your KYC documents

Resubmit your documents: ${loginUrl}

If you believe this was a mistake or need assistance, please contact your property management at ${params.propertyName}.

Best regards,
${params.propertyName}
Property Management Team
    `.trim();

    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: formatSender(params.propertyName),
      to: params.tenantEmail,
      subject: '❌ KYC Verification - Action Required',
      html,
      text,
    });

    console.log('✅ [Tenant KYC Rejected] Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ [Tenant KYC Rejected] Failed to send email:', error);
    return false;
  }
}

export default {
  getTransporter,
  testEmailConnection,
  sendTestEmail,
  sendTenantInvitation,
  sendCustomerInvitation,
  sendOnboardingConfirmation,
  sendContactFormConfirmation,
  sendPasswordResetEmail,
  sendTeamInvitation,
  sendKYCVerifiedEmail,
  sendManualVerificationEmail,
  sendKYCRejectionEmail,
  sendTenantKycApprovedEmail,
  sendTenantKycRejectedEmail,
  sendAccountActivationEmail,
  sendTemplatedEmail,
  sendInternalAdminCredentials,
};
