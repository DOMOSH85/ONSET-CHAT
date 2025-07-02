const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendResetEmail(email, resetUrl) {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'no-reply@onset-chat.com',
    to: email,
    subject: 'Password Reset Request',
    html: `<p>You requested a password reset.</p>
           <p>Click <a href="${resetUrl}">here</a> to reset your password. This link will expire in 30 minutes.</p>`
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendResetEmail }; 