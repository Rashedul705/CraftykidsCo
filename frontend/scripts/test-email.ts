import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Parse .env if present
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    });
  }
} catch (e) {
  // ignore
}

async function main() {
  console.log('Testing SMTP connection with credentials from .env...');
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.NOTIFY_EMAIL || user;
  const from = process.env.MAIL_FROM || `"Crafty Kids Co" <${user}>`;

  console.log(`Host: ${host}:${port}`);
  console.log(`User: ${user}`);
  console.log(`From: ${from}`);
  console.log(`To: ${to}`);

  if (!user || !pass) {
    console.error('Error: SMTP_USER or SMTP_PASS is missing in .env');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false, // port 587 uses STARTTLS
    auth: {
      user,
      pass,
    },
  });

  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ Transporter verification successful! SMTP server is reachable.');

    console.log(`Sending test email to ${to}...`);
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Crafty Kids Co - SMTP Test Email',
      text: 'This is a test email confirming that Gmail SMTP is properly configured with Nodemailer.',
      html: `
        <div style="font-family: sans-serif; background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #D6403B; margin-top: 0;">SMTP Test Successful</h2>
          <p>Congratulations! Your Gmail SMTP configuration is working properly.</p>
          <ul style="color: #4b5563; line-height: 1.6;">
            <li><strong>SMTP Server:</strong> ${host}:${port}</li>
            <li><strong>Sender:</strong> ${user}</li>
            <li><strong>Recipient:</strong> ${to}</li>
            <li><strong>Timestamp (UTC):</strong> ${new Date().toISOString()}</li>
          </ul>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Crafty Kids Co System Notification</p>
        </div>
      `,
    });

    console.log(`✅ Test email successfully sent! Message ID: ${info.messageId}`);
  } catch (error: any) {
    console.error('❌ Failed to verify or send test email:', error);
    process.exit(1);
  }
}

main();
