#!/usr/bin/env node

/**
 * Production Email Diagnostic Script
 *
 * This script diagnoses email sending issues in production by:
 * 1. Checking environment variables
 * 2. Testing SMTP connection
 * 3. Attempting to send a test email
 * 4. Verifying email configuration
 *
 * Usage:
 *   node scripts/diagnose-email-production.js
 */

const nodemailer = require('nodemailer');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 PRODUCTION EMAIL DIAGNOSTIC TOOL');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Step 1: Check Environment Variables
console.log('📋 Step 1: Checking Environment Variables...\n');

const requiredEnvVars = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
];

const envStatus = {};
let allEnvVarsPresent = true;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const isPresent = !!value;
  envStatus[varName] = isPresent;

  if (!isPresent) {
    allEnvVarsPresent = false;
    console.log(`❌ ${varName}: NOT SET`);
  } else {
    // Mask sensitive values
    if (varName === 'SMTP_PASS') {
      console.log(`✅ ${varName}: ******* (${value.length} characters)`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  }
});

console.log('');

if (!allEnvVarsPresent) {
  console.error('❌ CRITICAL: Missing required environment variables!');
  console.error('Please set all required SMTP variables in your .env file or Digital Ocean settings.\n');
  process.exit(1);
}

console.log('✅ All required environment variables are set.\n');

// Step 2: Parse Configuration
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('⚙️  Step 2: Parsing Email Configuration...\n');

const config = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  from: process.env.SMTP_FROM,
};

console.log('📧 Email Configuration:');
console.log(`   Host: ${config.host}`);
console.log(`   Port: ${config.port}`);
console.log(`   Secure: ${config.secure}`);
console.log(`   User: ${config.auth.user}`);
console.log(`   From: ${config.from}`);
console.log('');

// Step 3: Test SMTP Connection
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔌 Step 3: Testing SMTP Connection...\n');

const transporter = nodemailer.createTransport({
  host: config.host,
  port: config.port,
  secure: config.secure,
  auth: {
    user: config.auth.user,
    pass: config.auth.pass,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  },
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 30000,
});

console.log('🔄 Attempting to verify SMTP connection...');

transporter.verify()
  .then(() => {
    console.log('✅ SMTP connection verified successfully!\n');

    // Step 4: Send Test Email
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Step 4: Sending Test Email...\n');

    const testEmail = process.env.TEST_EMAIL || config.auth.user;
    console.log(`📬 Sending test email to: ${testEmail}`);

    return transporter.sendMail({
      from: config.from,
      to: testEmail,
      subject: '🧪 Test Email from Contrezz Production',
      text: `
This is a test email from the Contrezz production environment.

If you received this email, your SMTP configuration is working correctly!

Configuration Details:
- SMTP Host: ${config.host}
- SMTP Port: ${config.port}
- SMTP User: ${config.auth.user}
- From Address: ${config.from}

Timestamp: ${new Date().toISOString()}
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .success { background-color: #10B981; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .details { background-color: white; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 Test Email</h1>
    </div>
    <div class="content">
      <div class="success">
        <h2 style="margin: 0;">✅ SMTP Configuration Working!</h2>
      </div>
      <p>This is a test email from the <strong>Contrezz production environment</strong>.</p>
      <p>If you received this email, your SMTP configuration is working correctly!</p>
      <div class="details">
        <h3>Configuration Details:</h3>
        <ul>
          <li><strong>SMTP Host:</strong> ${config.host}</li>
          <li><strong>SMTP Port:</strong> ${config.port}</li>
          <li><strong>SMTP User:</strong> ${config.auth.user}</li>
          <li><strong>From Address:</strong> ${config.from}</li>
        </ul>
      </div>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    </div>
    <div class="footer">
      <p>This is an automated test email from Contrezz.</p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    });
  })
  .then((info) => {
    console.log('✅ Test email sent successfully!\n');
    console.log('📬 Email Details:');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 DIAGNOSTIC COMPLETE - ALL TESTS PASSED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Your email configuration is working correctly.');
    console.log('✅ Team invitation emails should now be sent successfully.\n');

    console.log('📋 Next Steps:');
    console.log('   1. Check your inbox for the test email');
    console.log('   2. Try inviting a team member from the dashboard');
    console.log('   3. Check production logs for any errors\n');

    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ SMTP connection or email sending failed!\n');
    console.error('Error Details:');
    console.error(`   Code: ${error.code || 'N/A'}`);
    console.error(`   Command: ${error.command || 'N/A'}`);
    console.error(`   Response: ${error.response || 'N/A'}`);
    console.error(`   Message: ${error.message}`);
    console.error('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 TROUBLESHOOTING GUIDE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.log('❌ Authentication Failed (EAUTH / 535)');
      console.log('');
      console.log('Possible Causes:');
      console.log('   1. Incorrect SMTP username or password');
      console.log('   2. Using regular Gmail password instead of App Password');
      console.log('   3. 2-Step Verification not enabled (required for App Passwords)');
      console.log('');
      console.log('Solution:');
      console.log('   1. Go to Google Account → Security → 2-Step Verification');
      console.log('   2. Scroll to "App passwords"');
      console.log('   3. Generate a new app password for "Mail"');
      console.log('   4. Update SMTP_PASS in your environment variables');
      console.log('   5. Restart your application');
      console.log('');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.log('❌ Connection Failed (ECONNECTION / ETIMEDOUT)');
      console.log('');
      console.log('Possible Causes:');
      console.log('   1. Incorrect SMTP host or port');
      console.log('   2. Firewall blocking SMTP connections');
      console.log('   3. Network connectivity issues');
      console.log('');
      console.log('Solution:');
      console.log('   1. Verify SMTP_HOST and SMTP_PORT are correct');
      console.log('   2. Check Digital Ocean firewall settings');
      console.log('   3. Try using port 465 (secure) or 587 (TLS)');
      console.log('');
    } else if (error.code === 'ESOCKET') {
      console.log('❌ Socket Error (ESOCKET)');
      console.log('');
      console.log('Possible Causes:');
      console.log('   1. Connection lost during email sending');
      console.log('   2. SMTP server timeout');
      console.log('   3. Network instability');
      console.log('');
      console.log('Solution:');
      console.log('   1. Increase socket timeout in transporter config');
      console.log('   2. Disable connection pooling (pool: false)');
      console.log('   3. Implement retry logic');
      console.log('');
    } else {
      console.log('❌ Unknown Error');
      console.log('');
      console.log('Please check:');
      console.log('   1. All environment variables are set correctly');
      console.log('   2. SMTP credentials are valid');
      console.log('   3. Network connectivity is stable');
      console.log('   4. SMTP server is not blocking your IP');
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(1);
  });

