const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'info@contrezz.com',
    pass: 'Korede@198800'
  }
});

transporter.verify()
  .then(() => console.log('✅ Email works!'))
  .catch((err) => console.error('❌ Failed:', err.message));




