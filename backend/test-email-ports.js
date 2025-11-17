const nodemailer = require('nodemailer');

// SMTP Configuration
const host = 'mail.privateemail.com';
const user = 'info@contrezz.com';
const pass = 'Korede@198800';

async function testPort(port, secure) {
  console.log(`\n🧪 Testing port ${port} (secure: ${secure})...`);

  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: secure,
    auth: {
      user: user,
      pass: pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    debug: false,
  });

  try {
    await transporter.verify();
    console.log(`✅ Port ${port} (secure: ${secure}) - CONNECTION SUCCESSFUL!`);

    // Try sending a test email
    const info = await transporter.sendMail({
      from: `"Contrezz Test" <${user}>`,
      to: user, // Send to ourselves
      subject: `Test Email - Port ${port}`,
      text: `This is a test email sent via port ${port} with secure=${secure}`,
    });

    console.log(`✅ Port ${port} - EMAIL SENT! Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.log(`❌ Port ${port} (secure: ${secure}) - FAILED`);
    console.log(`   Error: ${error.code} - ${error.message}`);
    return false;
  } finally {
    transporter.close();
  }
}

async function runTests() {
  console.log('📧 Testing SMTP Ports for Namecheap Private Email\n');
  console.log(`Host: ${host}`);
  console.log(`User: ${user}`);
  console.log('='.repeat(60));

  // Test different ports
  await testPort(465, true);  // SSL
  await testPort(587, false); // STARTTLS
  await testPort(25, false);  // Plain/STARTTLS

  console.log('\n' + '='.repeat(60));
  console.log('✅ Testing complete!');
  process.exit(0);
}

runTests();

