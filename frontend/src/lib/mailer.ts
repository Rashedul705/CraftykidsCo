import nodemailer from 'nodemailer';
import type { Transporter, SendMailOptions } from 'nodemailer';

/**
 * Escapes special HTML characters to prevent HTML/XSS injection in emails.
 */
export function escapeHtml(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats a given date/time in the Asia/Dhaka (GMT+6) timezone.
 */
export function formatDhakaDateTime(dateInput?: Date | string | number): string {
  try {
    const date = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(date.getTime())) {
      return new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
    }
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Maps payment method code to a human-readable label.
 */
function formatPaymentMethod(method?: string): string {
  switch ((method || '').toUpperCase()) {
    case 'COD':
      return 'Cash on Delivery (COD)';
    case 'BKASH':
      return 'bKash';
    case 'NAGAD':
      return 'Nagad';
    case 'CARD':
      return 'Credit / Debit Card';
    default:
      return method || 'Cash on Delivery';
  }
}

/**
 * Returns SMTP configuration read from environment variables.
 */
export function getSmtpConfig() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const from = process.env.MAIL_FROM || (user ? `Crafty Kids Co <${user}>` : 'Crafty Kids Co');
  const notifyEmail = process.env.NOTIFY_EMAIL || 'craftykidscobd@gmail.com';

  return { host, port, user, pass, from, notifyEmail };
}

// Global cached transporter instance to prevent multiple connections
let transporterInstance: Transporter | null = null;

/**
 * Returns a configured Nodemailer transporter singleton.
 */
export function getTransporter(): Transporter {
  if (transporterInstance) {
    return transporterInstance;
  }

  const { host, port, user, pass } = getSmtpConfig();

  transporterInstance = nodemailer.createTransport({
    host,
    port,
    secure: false, // port 587 uses STARTTLS (false)
    auth: {
      user,
      pass,
    },
    // Connection timeout safety
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return transporterInstance;
}

let hasLoggedVerify = false;

/**
 * Verifies the SMTP transporter connection and logs the result.
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  const { host, port, user, pass } = getSmtpConfig();

  if (!user || !pass) {
    const msg = '[Mailer] SMTP credentials (SMTP_USER / SMTP_PASS) are not set. Emails will be skipped.';
    if (!hasLoggedVerify) {
      console.warn(msg);
      hasLoggedVerify = true;
    }
    return { success: false, message: msg };
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    const msg = `[Mailer] ✅ SMTP server connection verified successfully: connected to ${host}:${port} as ${user}`;
    if (!hasLoggedVerify) {
      console.log(msg);
      hasLoggedVerify = true;
    }
    return { success: true, message: msg };
  } catch (error: any) {
    const msg = `[Mailer] ❌ SMTP server connection failed (${host}:${port}): ${error?.message || error}`;
    console.error(msg);
    return { success: false, message: msg };
  }
}

/**
 * Low-level sendMail wrapper with try/catch and error logging.
 */
export async function sendMail(options: SendMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { user, pass, from } = getSmtpConfig();

  if (!user || !pass) {
    console.warn('[Mailer] Skipping email sending: SMTP_USER or SMTP_PASS is missing in environment variables.');
    return { success: false, error: 'SMTP credentials missing' };
  }

  try {
    const transporter = getTransporter();
    const mailOptions = {
      from,
      ...options,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer] ✅ Email sent successfully: ${info.messageId} (Subject: "${options.subject}")`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[Mailer] ❌ Failed to send email (Subject: "${options.subject}"):`, err?.message || err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

/**
 * Sends a New Order notification email to the store admin.
 * Non-blocking, simple and clean HTML template with white background and inline CSS.
 */
export async function sendOrderNotificationEmail(order: any): Promise<boolean> {
  try {
    if (!order) {
      console.warn('[Mailer] sendOrderNotificationEmail called with null/empty order');
      return false;
    }

    const { notifyEmail, from } = getSmtpConfig();
    const orderNumber = escapeHtml(order.orderNumber || 'N/A');
    const customerName = escapeHtml(order.customerName || 'Customer');
    const customerPhone = escapeHtml(order.customerPhone || 'N/A');
    const fullAddress = escapeHtml(order.fullAddress || 'N/A');
    const district = escapeHtml(order.district || '');
    const thana = escapeHtml(order.thana || '');
    const cityText = [district, thana].filter(Boolean).join(', ') || 'N/A';
    const customerNote = order.customerNote ? escapeHtml(order.customerNote) : '';
    const paymentMethod = escapeHtml(formatPaymentMethod(order.paymentMethod));
    const paymentStatus = escapeHtml((order.paymentStatus || 'UNPAID').toUpperCase());
    const orderDate = formatDhakaDateTime(order.createdAt || new Date());

    const subtotal = Number(order.subtotal || 0).toLocaleString('en-US');
    const deliveryCharge = Number(order.deliveryCharge || 0).toLocaleString('en-US');
    const discountAmount = Number(order.discountAmount || 0);
    const totalAmount = Number(order.totalAmount || 0).toLocaleString('en-US');

    // Build items table rows
    const items = Array.isArray(order.items) ? order.items : [];
    const itemRows = items
      .map((item: any, index: number) => {
        const title = escapeHtml(item.title || item.titleBn || item.titleEn || `Item #${index + 1}`);
        const variation = item.variationTitle || item.variationTitleBn || item.variationTitleEn;
        const variationText = variation ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">Variant: ${escapeHtml(variation)}</div>` : '';
        const qty = item.quantity || 1;
        const price = Number(item.price || item.unitPrice || 0);
        const itemTotal = Number(item.total || item.totalPrice || price * qty);

        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 10px; font-size: 13px; color: #1e293b; text-align: left; vertical-align: top;">
              <strong style="color: #0f172a;">${title}</strong>
              ${variationText}
            </td>
            <td style="padding: 12px 10px; font-size: 13px; color: #334155; text-align: center; vertical-align: top; white-space: nowrap;">
              ${qty}
            </td>
            <td style="padding: 12px 10px; font-size: 13px; color: #334155; text-align: right; vertical-align: top; white-space: nowrap;">
              ৳${price.toLocaleString('en-US')}
            </td>
            <td style="padding: 12px 10px; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right; vertical-align: top; white-space: nowrap;">
              ৳${itemTotal.toLocaleString('en-US')}
            </td>
          </tr>
        `;
      })
      .join('');

    const discountRow =
      discountAmount > 0
        ? `
        <tr>
          <td colspan="3" style="padding: 6px 10px; text-align: right; font-size: 13px; color: #16a34a;">Discount:</td>
          <td style="padding: 6px 10px; text-align: right; font-size: 13px; font-weight: 600; color: #16a34a; white-space: nowrap;">-৳${discountAmount.toLocaleString('en-US')}</td>
        </tr>
      `
        : '';

    const noteSection = customerNote
      ? `
      <div style="margin-top: 18px; padding: 12px 16px; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 6px;">
        <strong style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #854d0e;">Customer Note:</strong>
        <p style="margin: 4px 0 0; font-size: 13px; color: #713f12; line-height: 1.4;">${customerNote}</p>
      </div>
    `
      : '';

    const paymentStatusBadge =
      paymentStatus === 'PAID'
        ? '<span style="background-color: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; display: inline-block;">PAID</span>'
        : '<span style="background-color: #fef3c7; color: #b45309; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; display: inline-block;">UNPAID</span>';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Order #${orderNumber}</title>
</head>
<body style="margin: 0; padding: 24px 10px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; border-collapse: separate; overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="padding: 24px 28px; background-color: #ffffff; border-bottom: 2px solid #D6403B;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align: middle;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #D6403B; letter-spacing: -0.3px;">Crafty Kids Co</h1>
              <p style="margin: 3px 0 0; font-size: 13px; color: #64748b;">New Store Order Notification</p>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <div style="font-size: 15px; font-weight: 800; color: #0f172a;">#${orderNumber}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${orderDate} (BST)</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Customer & Delivery Details -->
    <tr>
      <td style="padding: 24px 28px; background-color: #ffffff;">
        <h2 style="margin: 0 0 14px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
          Customer & Delivery Information
        </h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; line-height: 1.6;">
          <tr>
            <td style="width: 130px; color: #64748b; padding: 4px 0; vertical-align: top;"><strong>Customer Name:</strong></td>
            <td style="color: #0f172a; padding: 4px 0; font-weight: 600;">${customerName}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0; vertical-align: top;"><strong>Phone Number:</strong></td>
            <td style="color: #0f172a; padding: 4px 0;"><a href="tel:${customerPhone}" style="color: #D6403B; text-decoration: none; font-weight: 600;">${customerPhone}</a></td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0; vertical-align: top;"><strong>Delivery City/District:</strong></td>
            <td style="color: #0f172a; padding: 4px 0;">${cityText}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0; vertical-align: top;"><strong>Full Address:</strong></td>
            <td style="color: #0f172a; padding: 4px 0;">${fullAddress}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0; vertical-align: top;"><strong>Payment Method:</strong></td>
            <td style="color: #0f172a; padding: 4px 0; font-weight: 600;">${paymentMethod}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0; vertical-align: top;"><strong>Payment Status:</strong></td>
            <td style="padding: 4px 0;">${paymentStatusBadge}</td>
          </tr>
        </table>

        ${noteSection}
      </td>
    </tr>

    <!-- Order Items -->
    <tr>
      <td style="padding: 0 28px 24px; background-color: #ffffff;">
        <h2 style="margin: 0 0 14px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
          Order Items Summary
        </h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <th style="padding: 10px; font-size: 12px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase; letter-spacing: 0.5px;">Product</th>
              <th style="padding: 10px; font-size: 12px; font-weight: 700; color: #475569; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; width: 60px;">Qty</th>
              <th style="padding: 10px; font-size: 12px; font-weight: 700; color: #475569; text-align: right; text-transform: uppercase; letter-spacing: 0.5px; width: 90px;">Price</th>
              <th style="padding: 10px; font-size: 12px; font-weight: 700; color: #475569; text-align: right; text-transform: uppercase; letter-spacing: 0.5px; width: 90px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0;">Subtotal:</td>
              <td style="padding: 10px; text-align: right; font-size: 13px; font-weight: 600; color: #0f172a; border-top: 1px solid #e2e8f0; white-space: nowrap;">৳${subtotal}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 6px 10px; text-align: right; font-size: 13px; color: #64748b;">Delivery Charge:</td>
              <td style="padding: 6px 10px; text-align: right; font-size: 13px; font-weight: 600; color: #0f172a; white-space: nowrap;">৳${deliveryCharge}</td>
            </tr>
            ${discountRow}
            <tr style="background-color: #f8fafc; border-top: 2px solid #e2e8f0;">
              <td colspan="3" style="padding: 12px 10px; text-align: right; font-size: 15px; font-weight: 800; color: #0f172a;">Grand Total:</td>
              <td style="padding: 12px 10px; text-align: right; font-size: 16px; font-weight: 800; color: #D6403B; white-space: nowrap;">৳${totalAmount}</td>
            </tr>
          </tfoot>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 16px 28px; background-color: #ffffff; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
          This is an automated notification from <strong>Crafty Kids Co Storefront</strong>.<br>
          Sent to <strong>${escapeHtml(notifyEmail)}</strong> &bull; Order Time: ${orderDate} (Asia/Dhaka)
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const subject = `New Order #${order.orderNumber} - ${order.customerName}`;

    await sendMail({
      from,
      to: notifyEmail,
      subject,
      html,
    });

    return true;
  } catch (err: any) {
    console.error('[Mailer] ❌ Error in sendOrderNotificationEmail:', err?.message || err);
    return false;
  }
}

/**
 * Sends a New Contact Message notification email to the store admin.
 * Non-blocking, simple and clean HTML template with white background and inline CSS.
 * Sets replyTo to customer's email so admin can reply directly from Gmail.
 */
export async function sendContactNotificationEmail(data: {
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
  createdAt?: Date | string;
}): Promise<boolean> {
  try {
    if (!data) {
      console.warn('[Mailer] sendContactNotificationEmail called with null/empty data');
      return false;
    }

    const { notifyEmail, from } = getSmtpConfig();
    const name = escapeHtml(data.name || 'Anonymous');
    const customerEmail = data.email ? data.email.trim() : '';
    const emailEscaped = customerEmail ? escapeHtml(customerEmail) : 'Not provided';
    const phone = data.phone ? escapeHtml(data.phone) : 'N/A';
    const messageSubject = data.subject ? escapeHtml(data.subject) : 'General Inquiry';
    const rawMessage = (data.message || '').replace(/\r\n/g, '\n');
    const messageHtml = escapeHtml(rawMessage).replace(/\n/g, '<br>');
    const messageDate = formatDhakaDateTime(data.createdAt || new Date());

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Contact Message from ${name}</title>
</head>
<body style="margin: 0; padding: 24px 10px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; border-collapse: separate; overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="padding: 24px 28px; background-color: #ffffff; border-bottom: 2px solid #D6403B;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align: middle;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #D6403B; letter-spacing: -0.3px;">Crafty Kids Co</h1>
              <p style="margin: 3px 0 0; font-size: 13px; color: #64748b;">New Contact Form Message</p>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <div style="font-size: 12px; color: #64748b;">${messageDate} (BST)</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Sender Details -->
    <tr>
      <td style="padding: 24px 28px 16px; background-color: #ffffff;">
        <h2 style="margin: 0 0 14px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
          Sender Information
        </h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; line-height: 1.6;">
          <tr>
            <td style="width: 120px; color: #64748b; padding: 4px 0; vertical-align: top;"><strong>Name:</strong></td>
            <td style="color: #0f172a; padding: 4px 0; font-weight: 600;">${name}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0; vertical-align: top;"><strong>Email:</strong></td>
            <td style="color: #0f172a; padding: 4px 0;">
              ${customerEmail ? `<a href="mailto:${emailEscaped}" style="color: #D6403B; text-decoration: none; font-weight: 600;">${emailEscaped}</a>` : '<span style="color: #94a3b8;">Not provided</span>'}
            </td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0; vertical-align: top;"><strong>Phone:</strong></td>
            <td style="color: #0f172a; padding: 4px 0;">
              ${data.phone ? `<a href="tel:${phone}" style="color: #D6403B; text-decoration: none; font-weight: 600;">${phone}</a>` : '<span style="color: #94a3b8;">N/A</span>'}
            </td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0; vertical-align: top;"><strong>Subject:</strong></td>
            <td style="color: #0f172a; padding: 4px 0; font-weight: 600;">${messageSubject}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Message Body -->
    <tr>
      <td style="padding: 0 28px 24px; background-color: #ffffff;">
        <h2 style="margin: 0 0 10px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
          Message
        </h2>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: normal;">
          ${messageHtml}
        </div>

        ${
          customerEmail
            ? `<div style="margin-top: 14px; font-size: 12px; color: #16a34a; font-weight: 600;">
                &bull; You can hit "Reply" in your email client to respond directly to ${emailEscaped}.
              </div>`
            : ''
        }
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 16px 28px; background-color: #ffffff; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
          This message was submitted via the <strong>Crafty Kids Co Contact Form</strong>.<br>
          Sent to <strong>${escapeHtml(notifyEmail)}</strong> &bull; Received at: ${messageDate} (Asia/Dhaka)
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const subject = `New Contact Message from ${data.name}`;

    const mailOptions: SendMailOptions = {
      from,
      to: notifyEmail,
      subject,
      html,
    };

    if (customerEmail && customerEmail.includes('@')) {
      mailOptions.replyTo = customerEmail;
    }

    await sendMail(mailOptions);
    return true;
  } catch (err: any) {
    console.error('[Mailer] ❌ Error in sendContactNotificationEmail:', err?.message || err);
    return false;
  }
}

/**
 * Sends a diagnostic test email to verify configuration.
 */
export async function sendTestEmail(targetEmail?: string): Promise<{ success: boolean; message: string; messageId?: string }> {
  const { notifyEmail, from, host, port } = getSmtpConfig();
  const recipient = targetEmail || notifyEmail;
  const testTime = formatDhakaDateTime(new Date());

  const subject = `Crafty Kids Co - SMTP Test Email (${testTime})`;
  const html = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 24px 10px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; border-top: 4px solid #16a34a;">
    <h2 style="margin: 0 0 12px; font-size: 18px; color: #166534;">✅ Gmail SMTP Test Successful</h2>
    <p style="margin: 0 0 16px; font-size: 14px; color: #475569; line-height: 1.5;">
      Your Nodemailer configuration with Gmail SMTP is working properly. Automated notification emails for new orders and contact form submissions are ready to be sent.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; color: #334155; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 12px;">
      <tr>
        <td style="padding: 4px 0; width: 130px;"><strong>SMTP Host:</strong></td>
        <td style="padding: 4px 0;">${host}:${port}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0;"><strong>Sender (From):</strong></td>
        <td style="padding: 4px 0;">${escapeHtml(from)}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0;"><strong>Recipient (To):</strong></td>
        <td style="padding: 4px 0;">${escapeHtml(recipient)}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0;"><strong>Date & Time (BST):</strong></td>
        <td style="padding: 4px 0;">${testTime}</td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();

  const res = await sendMail({
    from,
    to: recipient,
    subject,
    html,
  });

  if (res.success) {
    return {
      success: true,
      message: `Test email sent successfully to ${recipient}!`,
      messageId: res.messageId,
    };
  } else {
    return {
      success: false,
      message: `Failed to send test email: ${res.error}`,
    };
  }
}

// Automatically verify connection in Node runtime when module is imported
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  // Run asynchronously without blocking module evaluation
  setTimeout(() => {
    verifySmtpConnection().catch(() => {});
  }, 100);
}
