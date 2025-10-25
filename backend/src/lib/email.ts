/**
 * Email Service
 * 
 * This module handles sending emails to users.
 * Currently using console logging for development.
 * 
 * To integrate with a real email service:
 * 1. Install email provider SDK (e.g., nodemailer, sendgrid, resend, etc.)
 * 2. Configure credentials in .env
 * 3. Replace console.log with actual email sending logic
 */

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

  // TODO: Replace with actual email sending logic
  // Example with nodemailer:
  // const transporter = nodemailer.createTransport({ ... });
  // await transporter.sendMail({
  //   from: process.env.EMAIL_FROM,
  //   to: tenantEmail,
  //   subject: emailSubject,
  //   text: emailBody,
  //   html: generateHtmlEmail(params)
  // });

  // For now, log the email to console
  console.log('\n' + '='.repeat(80));
  console.log('📧 TENANT INVITATION EMAIL');
  console.log('='.repeat(80));
  console.log(`To: ${tenantEmail}`);
  console.log(`Subject: ${emailSubject}`);
  console.log('-'.repeat(80));
  console.log(emailBody);
  console.log('='.repeat(80) + '\n');

  // In production, return the result of the actual email send
  return true;
}

/**
 * Generate HTML version of the email (optional, for better formatting)
 */
function generateHtmlEmail(params: TenantInvitationParams): string {
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

