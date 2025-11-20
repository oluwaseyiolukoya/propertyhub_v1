/**
 * Relaxed SMTP Connection Test
 * Tests with more permissive TLS settings
 */

const nodemailer = require('nodemailer');

async function testRelaxedConnection() {
  console.log('\n🚀 Testing with relaxed TLS settings...\n');
  console.log('='.repeat(80));

  const config = {
    host: 'mail.privateemail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'info@contrezz.com',
      pass: 'Korede@198800'
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1',
      ciphers: 'SSLv3'
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    debug: true,
    logger: true
  };

  console.log('Host:', config.host);
  console.log('Port:', config.port);
  console.log('User:', config.auth.user);
  console.log('TLS Settings: Very relaxed (all versions allowed)');
  console.log('='.repeat(80));

  try {
    const transporter = nodemailer.createTransport(config);

    console.log('\n🔍 Verifying connection...\n');
    await transporter.verify();

    console.log('\n✅ SUCCESS! Connection verified.');
    console.log('\n📧 Sending test email...\n');

    const info = await transporter.sendMail({
      from: '"Contrezz Platform" <info@contrezz.com>',
      to: 'info@contrezz.com', // Send to yourself
      subject: '✅ Test Email from Contrezz Platform',
      text: 'This is a test email. If you receive this, your SMTP is working!',
      html: '<h1>✅ Success!</h1><p>Your SMTP configuration is working correctly!</p>'
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);

    return true;
  } catch (error) {
    console.log('\n❌ FAILED:', error.message);
    if (error.code) console.log('Error Code:', error.code);
    if (error.command) console.log('Command:', error.command);
    if (error.response) console.log('Response:', error.response);
    if (error.responseCode) console.log('Response Code:', error.responseCode);
    return false;
  }
}

testRelaxedConnection().catch(console.error);








