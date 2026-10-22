import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import bwipjs from 'bwip-js';
import puppeteer, { PDFOptions } from 'puppeteer-core';
import { OrderRecord } from '@/lib/store';
import { calculateAmountToCollect, formatTaka } from '@/lib/order-calc';
import { defaultSiteSettings } from '@/lib/site-settings';

// Cache embedded fonts base64 so disk is only read once
let embeddedFontsCssCache: string | null = null;

export function getEmbeddedFontsCss(): string {
  if (embeddedFontsCssCache) return embeddedFontsCssCache;

  try {
    const fontsDir = path.join(process.cwd(), 'public', 'fonts');
    const hindRegPath = path.join(fontsDir, 'HindSiliguri-Regular.ttf');
    const hindBoldPath = path.join(fontsDir, 'HindSiliguri-Bold.ttf');
    const fredokaSemiPath = path.join(fontsDir, 'Fredoka-SemiBold.ttf');
    const fredokaBoldPath = path.join(fontsDir, 'Fredoka-Bold.ttf');

    let css = '';

    if (fs.existsSync(hindRegPath)) {
      const b64 = fs.readFileSync(hindRegPath).toString('base64');
      css += `
@font-face {
  font-family: 'Hind Siliguri';
  src: url('data:font/truetype;charset=utf-8;base64,${b64}') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
`;
    }

    if (fs.existsSync(hindBoldPath)) {
      const b64 = fs.readFileSync(hindBoldPath).toString('base64');
      css += `
@font-face {
  font-family: 'Hind Siliguri';
  src: url('data:font/truetype;charset=utf-8;base64,${b64}') format('truetype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
`;
    }

    if (fs.existsSync(fredokaSemiPath)) {
      const b64 = fs.readFileSync(fredokaSemiPath).toString('base64');
      css += `
@font-face {
  font-family: 'Fredoka';
  src: url('data:font/truetype;charset=utf-8;base64,${b64}') format('truetype');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
`;
    }

    if (fs.existsSync(fredokaBoldPath)) {
      const b64 = fs.readFileSync(fredokaBoldPath).toString('base64');
      css += `
@font-face {
  font-family: 'Fredoka';
  src: url('data:font/truetype;charset=utf-8;base64,${b64}') format('truetype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
`;
    }

    embeddedFontsCssCache = css;
    return css;
  } catch (err) {
    console.warn('Failed to embed fonts from disk, falling back to Google Fonts link:', err);
    return `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Hind+Siliguri:wght@400;600;700&display=swap');
`;
  }
}

/**
 * Generate QR code as SVG data string
 */
export async function generateQrCodeSvg(text: string): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: 'svg',
      margin: 1,
      width: 90,
      color: { dark: '#000000', light: '#FFFFFF' },
    });
  } catch {
    return '';
  }
}

/**
 * Generate Code 128 Barcode as pure SVG
 */
export async function generateBarcodeSvg(text: string): Promise<string> {
  if (!text) return '';
  const clean = text.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!clean) return '';

  try {
    return await (bwipjs as any).toSVG({
      bcid: 'code128',
      text: clean,
      scale: 3,
      height: 14,
      includetext: false,
    });
  } catch (err) {
    console.warn('Barcode generation failed for:', text, err);
    return '';
  }
}

/**
 * Find Chrome/Chromium executable across platforms
 */
export function findChromeExecutable(): string | null {
  if (
    process.env.PUPPETEER_EXECUTABLE_PATH &&
    fs.existsSync(/*turbopackIgnore: true*/ process.env.PUPPETEER_EXECUTABLE_PATH)
  ) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const paths = [
    '/nix/var/nix/profiles/default/bin/chromium',
    '/root/.nix-profile/bin/chromium',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];

  for (const p of paths) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ p)) return p;
    } catch {
      // continue
    }
  }

  return null;
}

/**
 * Render HTML to PDF Buffer via Puppeteer with zero margins and preferCSSPageSize
 */
export async function renderHtmlToPdf(
  html: string,
  options: { format?: 'A4' | '100x150'; landscape?: boolean } = {}
): Promise<Buffer | null> {
  const executablePath = findChromeExecutable();
  if (!executablePath) {
    console.warn('No Chrome executable found on server. Falling back to HTML print view.');
    return null;
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=medium',
        '--enable-font-antialiasing',
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });

    const pdfOptions: PDFOptions = {
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    };

    if (options.format === '100x150') {
      pdfOptions.width = '100mm';
      pdfOptions.height = '150mm';
    } else if (options.format === 'A4') {
      pdfOptions.format = 'a4';
    }

    const pdfBuffer = await page.pdf(pdfOptions);
    return Buffer.from(pdfBuffer);
  } catch (err) {
    console.error('Puppeteer PDF generation failed:', err);
    return null;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

/**
 * -------------------------------------------------------------
 * 1. CUSTOMER INVOICE (A4) TEMPLATE GENERATOR
 * -------------------------------------------------------------
 */
export async function generateInvoiceHtml(
  orders: OrderRecord[],
  siteSettings = defaultSiteSettings,
  isHtmlFallback = false
): Promise<string> {
  const printConfig = siteSettings.print || defaultSiteSettings.print;
  const embeddedFonts = getEmbeddedFontsCss();

  // Generate SVG QR codes for each order
  const orderQrs: Record<string, string> = {};
  for (const ord of orders) {
    const trackingUrl = `https://${printConfig.website || 'craftykidsco.com'}/track?orderId=${encodeURIComponent(ord.orderNumber || ord.id)}`;
    orderQrs[ord.id] = await generateQrCodeSvg(trackingUrl);
  }

  const invoicesHtml = orders
    .map((ord, idx) => {
      const fin = calculateAmountToCollect(ord);
      const formattedDate = new Date(ord.createdAt || Date.now()).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const enDate = new Date(ord.createdAt || Date.now()).toLocaleDateString('en-GB');

      // Table items
      const items = Array.isArray(ord.items) && ord.items.length > 0 ? ord.items : [];

      return `
      <div class="invoice-page">
        <!-- 1. CRAYON STRIPE (2mm tall across full page width in 5 equal colors) -->
        <div class="crayon-stripe">
          <div style="background-color: #D6403B;"></div>
          <div style="background-color: #FFC93C;"></div>
          <div style="background-color: #5BC0EB;"></div>
          <div style="background-color: #7BD389;"></div>
          <div style="background-color: #FF8A65;"></div>
        </div>

        <div class="invoice-content">
          <!-- 2. HEADER ROW -->
          <div class="header-row">
            <div class="header-left">
              <div class="brand-logo-mark">C</div>
              <div>
                <div class="brand-title">${printConfig.companyName || 'CraftyKidsCo'}</div>
                <div class="brand-tagline">${printConfig.tagline || 'শিশুদের নিরাপদ প্রাকৃতিক রঙ ও শিক্ষামূলক খেলনা'}</div>
              </div>
            </div>

            <div class="header-right">
              <div class="invoice-title">ইনভয়েস</div>
              <div class="order-number">#${ord.orderNumber}</div>
              <div class="order-date">${formattedDate} (${enDate})</div>
            </div>
          </div>

          <!-- 3. TWO INFO BOXES -->
          <div class="info-boxes-grid">
            <!-- Box 1: Receiver -->
            <div class="info-box">
              <div class="box-title">যাকে পাঠানো হচ্ছে</div>
              <div class="box-content">
                <div class="customer-name">${ord.customerName || 'গ্রাহকের নাম'}</div>
                <div class="customer-phone">${ord.customerPhone || 'ফোন নম্বর নেই'}</div>
                <div class="customer-address">${ord.fullAddress || 'ঠিকানা দেওয়া হয়নি'}</div>
                <div class="customer-district"><span class="label">জেলা:</span> ${ord.district || 'ঢাকা'}</div>
                ${ord.customerNote ? `<div class="customer-note"><span class="label">নোট:</span> ${ord.customerNote}</div>` : ''}
              </div>
            </div>

            <!-- Box 2: Order Details -->
            <div class="info-box">
              <div class="box-title">অর্ডারের তথ্য</div>
              <div class="box-content">
                <div><span class="label">পেমেন্ট মেথড:</span> <strong>${ord.paymentMethod || 'COD'}</strong></div>
                <div><span class="label">পেমেন্ট স্ট্যাটাস:</span> <strong>${fin.isPaid ? 'পেইড (পরিশোধিত)' : 'বকেয়া (ক্যাশ অন ডেলিভারি)'}</strong></div>
                <div><span class="label">কুরিয়ার:</span> ${ord.courier || 'Steadfast Courier'}</div>
                <div><span class="label">ট্র্যাকিং কোড:</span> <strong>${ord.trackingCode || ord.consignmentId || 'প্রস্তুত হচ্ছে'}</strong></div>
                ${ord.source ? `<div><span class="label">অর্ডার উৎস:</span> ${ord.source}</div>` : ''}
              </div>
            </div>
          </div>

          <!-- 4. ITEMS TABLE IN BORDERED ROUNDED BOX -->
          <div class="items-table-wrapper">
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 36px; text-align: center;">#</th>
                  <th style="text-align: left;">পণ্য ও বিবরণ</th>
                  <th style="width: 55px; text-align: center;">পরিমাণ</th>
                  <th style="width: 85px; text-align: right;">একক মূল্য</th>
                  <th style="width: 95px; text-align: right;">মোট টাকা</th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map((it: any, iIdx: number) => {
                    const title = it.titleBn || it.title || 'পণ্য';
                    const variation = it.variationTitleBn || it.variationTitle || '';
                    const isBundle = it.bundleItems && Array.isArray(it.bundleItems) && it.bundleItems.length > 0;
                    const lineTotal = (Number(it.price) || 0) * (Number(it.quantity) || 1);

                    return `
                    <tr>
                      <td style="text-align: center; color: #888; font-weight: bold;">${iIdx + 1}</td>
                      <td>
                        <div class="product-title">${title}</div>
                        ${variation ? `<div class="product-var">${variation}</div>` : ''}
                        ${
                          isBundle
                            ? `<div class="bundle-contents">অন্তর্ভুক্ত: ${it.bundleItems.join(', ')}</div>`
                            : ''
                        }
                      </td>
                      <td style="text-align: center; font-weight: bold;">${it.quantity}</td>
                      <td style="text-align: right; font-family: 'Fredoka', sans-serif;">${formatTaka(it.price)}</td>
                      <td style="text-align: right; font-family: 'Fredoka', sans-serif; font-weight: bold;">${formatTaka(lineTotal)}</td>
                    </tr>
                    `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>

          <!-- 5. BOTTOM AREA: TWO COLUMNS -->
          <div class="bottom-area-grid">
            <!-- Left Column: QR Code -->
            <div class="bottom-left">
              <div class="qr-container">
                <div class="qr-svg-wrapper">
                  ${orderQrs[ord.id] || ''}
                </div>
                <div class="qr-help">
                  <strong>অর্ডার ট্র্যাকিং QR কোড</strong>
                  <span>স্মার্টফোনের ক্যামেরা দিয়ে স্ক্যান করে এই অর্ডারের লাইভ ডেলিভারি স্ট্যাটাস চেক করুন।</span>
                </div>
              </div>
            </div>

            <!-- Right Column: Subtotal, Delivery, Discount, Highlighted Amount to Collect Box -->
            <div class="bottom-right">
              <div class="calc-row">
                <span class="calc-label">সাবটোটাল (পণ্য মূল্য):</span>
                <span class="calc-value">${formatTaka(fin.subtotal)}</span>
              </div>
              <div class="calc-row">
                <span class="calc-label">ডেলিভারি চার্জ:</span>
                <span class="calc-value">${fin.deliveryCharge === 0 ? 'ফ্রি (৳0)' : formatTaka(fin.deliveryCharge)}</span>
              </div>
              ${
                fin.discount > 0
                  ? `
              <div class="calc-row text-discount">
                <span class="calc-label">কুপন ডিসকাউন্ট:</span>
                <span class="calc-value">- ${formatTaka(fin.discount)}</span>
              </div>
              `
                  : ''
              }

              <!-- Highlighted box (2px border #D6403B, background #FFF6F5) -->
              <div class="highlight-collect-box">
                <div class="collect-box-label">
                  ${fin.isPaid ? 'পেমেন্ট স্ট্যাটাস' : 'ডেলিভারির সময় দিতে হবে'}
                </div>
                <div class="collect-box-amount ${fin.isPaid ? 'paid-text' : ''}">
                  ${fin.isPaid ? 'পেইড' : formatTaka(fin.amountToCollect)}
                </div>
                ${!fin.isPaid ? '<div class="collect-box-sub">পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ মূল্য পরিশোধ করুন</div>' : ''}
              </div>
            </div>
          </div>

          <!-- 6. FOOTER PINNED TO THE BOTTOM OF THE PAGE -->
          <div class="invoice-footer">
            <div class="footer-thankyou">
              ক্রাফটিকিডসকো-এর সাথে থাকার জন্য ধন্যবাদ! আমাদের পণ্য শিশুদের শৈশবকে করবে আনন্দময় ও সৃজনশীল।
            </div>
            <div class="footer-policy">
              ${printConfig.returnPolicyText || 'পণ্য হাতে পাওয়ার পর কোনো ত্রুটি বা সমস্যা পেলে ৩ দিনের মধ্যে আমাদের কাস্টমার কেয়ারে যোগাযোগ করুন।'}
            </div>
            <div class="footer-contact-row">
              <div><strong>হটলাইন:</strong> ${printConfig.phone || printConfig.supportPhone || '01731-376498'}</div>
              <div><strong>হোয়াটসঅ্যাপ:</strong> ${printConfig.whatsapp || '+8801731376498'}</div>
              <div><strong>ওয়েবসাইট:</strong> ${printConfig.website || 'craftykidsco.com'}</div>
              <div><strong>ফেসবুক:</strong> ${printConfig.facebookPage || 'facebook.com/craftykidsco.bd'}</div>
            </div>
          </div>
        </div>
      </div>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <title>Customer Invoices - CraftyKidsCo</title>
  <style>
    ${embeddedFonts}

    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #FFFFFF;
      font-family: 'Hind Siliguri', sans-serif;
      color: #2B2B2B;
      font-size: 12.5px;
      line-height: 1.45;
    }

    .invoice-page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      margin: 0 auto;
      background: #FFFFFF;
      position: relative;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      overflow: hidden;
    }

    /* 1. CRAYON STRIPE */
    .crayon-stripe {
      height: 2.2mm;
      width: 100%;
      display: flex;
    }
    .crayon-stripe > div {
      flex: 1;
      height: 100%;
    }

    .invoice-content {
      padding: 11mm 13mm 10mm 13mm;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    /* 2. HEADER */
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 9mm;
      border-bottom: 1.5px solid #F0ECE4;
      margin-bottom: 5mm;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo-mark {
      width: 44px;
      height: 44px;
      background-color: #D6403B;
      color: #FFFFFF;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Fredoka', cursive, sans-serif;
      font-size: 26px;
      font-weight: 700;
    }
    .brand-title {
      font-family: 'Fredoka', cursive, sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: #2B2B2B;
      line-height: 1.1;
      letter-spacing: -0.5px;
    }
    .brand-tagline {
      font-size: 11px;
      color: #7A7A7A;
      margin-top: 2px;
    }
    .header-right {
      text-align: right;
    }
    .invoice-title {
      font-family: 'Hind Siliguri', sans-serif;
      font-size: 26px;
      font-weight: 700;
      color: #2B2B2B;
      line-height: 1;
    }
    .order-number {
      font-family: 'Fredoka', sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: #C23631;
      margin-top: 3px;
    }
    .order-date {
      font-size: 11px;
      color: #7A7A7A;
      margin-top: 2px;
    }

    /* 3. INFO BOXES */
    .info-boxes-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 5mm;
    }
    .info-box {
      border: 1px solid #EFE9E0;
      border-radius: 12px;
      padding: 10px 14px;
      background: #FFFFFF;
    }
    .box-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #8C827A;
      margin-bottom: 6px;
      border-bottom: 1px dashed #EFE9E0;
      padding-bottom: 4px;
    }
    .box-content {
      font-size: 12px;
      line-height: 1.5;
    }
    .customer-name {
      font-weight: 700;
      font-size: 13.5px;
      color: #2B2B2B;
    }
    .customer-phone {
      font-weight: 700;
      color: #0B5F85;
      font-size: 12.5px;
      margin-bottom: 2px;
    }
    .customer-address {
      color: #4A4A4A;
      font-size: 11.5px;
    }
    .customer-district, .customer-note {
      font-size: 11.5px;
      margin-top: 2px;
    }
    .label {
      color: #888888;
      font-size: 11px;
    }

    /* 4. ITEMS TABLE */
    .items-table-wrapper {
      border: 1px solid #EFE9E0;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 5mm;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .items-table thead th {
      background-color: #FAF7F2;
      padding: 8px 10px;
      font-weight: 700;
      color: #555;
      border-bottom: 1px solid #EFE9E0;
      font-size: 11.5px;
    }
    .items-table tbody td {
      padding: 8px 10px;
      border-bottom: 1px solid #F4EFEB;
      vertical-align: middle;
    }
    .items-table tbody tr:last-child td {
      border-bottom: none;
    }
    .product-title {
      font-weight: 700;
      color: #2B2B2B;
      font-size: 12.5px;
    }
    .product-var {
      font-size: 10.5px;
      color: #7A7A7A;
      margin-top: 1px;
    }
    .bundle-contents {
      font-size: 10px;
      color: #0B5F85;
      font-style: italic;
      margin-top: 2px;
    }

    /* 5. BOTTOM AREA */
    .bottom-area-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: auto;
    }
    .bottom-left {
      display: flex;
      flex-direction: column;
    }
    .qr-container {
      display: flex;
      align-items: center;
      gap: 12px;
      border: 1px solid #EFE9E0;
      border-radius: 12px;
      padding: 10px;
      background: #FAFAFA;
    }
    .qr-svg-wrapper {
      width: 68px;
      height: 68px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #FFFFFF;
      padding: 2px;
      border: 1px solid #E5E0D8;
      border-radius: 6px;
    }
    .qr-svg-wrapper svg {
      width: 100%;
      height: 100%;
    }
    .qr-help {
      font-size: 11px;
      color: #555;
      line-height: 1.35;
    }
    .qr-help strong {
      display: block;
      color: #2B2B2B;
      font-size: 11.5px;
      margin-bottom: 2px;
    }

    .bottom-right {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      font-size: 12.5px;
      padding: 2px 4px;
    }
    .calc-label {
      color: #666;
    }
    .calc-value {
      font-family: 'Fredoka', sans-serif;
      font-weight: 600;
      color: #2B2B2B;
    }
    .text-discount {
      color: #1F6B43;
    }
    .text-discount .calc-value {
      color: #1F6B43;
    }

    /* HIGHLIGHTED COLLECT BOX */
    .highlight-collect-box {
      margin-top: 6px;
      border: 2px solid #D6403B;
      background-color: #FFF6F5;
      border-radius: 12px;
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      text-align: right;
    }
    .collect-box-label {
      font-size: 11px;
      font-weight: 700;
      color: #D6403B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .collect-box-amount {
      font-family: 'Fredoka', sans-serif;
      font-size: 26px;
      font-weight: 700;
      color: #D6403B;
      line-height: 1.1;
      margin: 2px 0;
    }
    .collect-box-amount.paid-text {
      font-family: 'Hind Siliguri', sans-serif;
      color: #1F6B43;
      font-size: 24px;
    }
    .collect-box-sub {
      font-size: 9.5px;
      color: #8C5350;
    }

    /* 6. PINNED FOOTER */
    .invoice-footer {
      margin-top: auto;
      padding-top: 5mm;
      border-top: 1px solid #F0ECE4;
      text-align: center;
      font-size: 11px;
      color: #777;
    }
    .footer-thankyou {
      font-weight: 700;
      color: #2B2B2B;
      font-size: 12px;
      margin-bottom: 2px;
    }
    .footer-policy {
      font-size: 10px;
      color: #888;
      margin-bottom: 6px;
    }
    .footer-contact-row {
      display: flex;
      justify-content: center;
      gap: 16px;
      font-size: 10.5px;
      color: #444;
      flex-wrap: wrap;
    }
    .footer-contact-row strong {
      color: #2B2B2B;
    }

    @media print {
      body { margin: 0; padding: 0; }
      .invoice-page { margin: 0; box-shadow: none; }
    }
  </style>
</head>
<body ${isHtmlFallback ? 'onload="window.print()"' : ''}>
  ${invoicesHtml}
</body>
</html>
  `;
}

/**
 * -------------------------------------------------------------
 * 2. PARCEL STICKER (100 x 150 mm) TEMPLATE GENERATOR
 * PURE BLACK AND WHITE FOR THERMAL PRINTERS
 * -------------------------------------------------------------
 */
export async function generateStickerHtml(
  orders: OrderRecord[],
  siteSettings = defaultSiteSettings,
  options: {
    sheetLayout?: 'single' | 'sheet4' | 'sheet8';
    startPos?: number;
    isCompact?: boolean;
    isHtmlFallback?: boolean;
  } = {}
): Promise<string> {
  const printConfig = siteSettings.print || defaultSiteSettings.print;
  const embeddedFonts = getEmbeddedFontsCss();

  // Filter or warn on orders without consignmentId
  const validOrders = orders.filter((o) => !!(o.consignmentId || o.trackingCode));
  if (validOrders.length === 0 && orders.length > 0) {
    // If test mode or none have consignment, let's allow them with fallback ID
  }

  // Pre-generate barcodes for all orders
  const barcodes: Record<string, string> = {};
  for (const ord of orders) {
    const consignmentId = ord.consignmentId || ord.trackingCode || ord.orderNumber;
    barcodes[ord.id] = await generateBarcodeSvg(consignmentId);
  }

  const renderSingleStickerCard = (ord: OrderRecord, isCompact = false) => {
    const fin = calculateAmountToCollect(ord);
    const consignmentId = ord.consignmentId || ord.trackingCode || `#${ord.orderNumber}`;
    const barcodeSvg = barcodes[ord.id] || '';
    const isFragile = ord.internalNote?.toLowerCase().includes('fragile') || printConfig.showFragileTag;

    return `
    <div class="sticker-container ${isCompact ? 'compact' : ''}">
      <!-- 1. SENDER ROW -->
      <div class="section sender-row">
        <div class="sender-left">
          <div class="company-name">${printConfig.companyName || 'CraftyKidsCo'}</div>
          <div class="company-tagline">${printConfig.tagline || 'শিশুদের নিরাপদ মোমের রঙ ও খেলনা'}</div>
        </div>
        <div class="sender-right">
          <div class="company-phone">${printConfig.phone || '01731-376498'}</div>
        </div>
      </div>

      <!-- 2. CONSIGNMENT BLOCK (THE MOST IMPORTANT PART) -->
      <div class="section consignment-block">
        <div class="consignment-label">STEADFAST CONSIGNMENT ID</div>
        <div class="consignment-id">#${consignmentId}</div>
        <div class="barcode-wrapper">
          ${barcodeSvg || `<div style="height: 14mm; display:flex; align-items:center; justify-content:center; border: 1px solid #000; font-size: 11pt;">[ BARCODE: ${consignmentId} ]</div>`}
        </div>
      </div>

      <!-- 3. RECEIVER BLOCK -->
      ${
        printConfig.showReceiverDetails
          ? `
      <div class="section receiver-block">
        <div class="receiver-header">
          <span class="receiver-tag">প্রাপক (RECIPIENT)</span>
          <span class="receiver-district-badge">${ord.district || 'ঢাকা'}</span>
        </div>
        <div class="customer-name">${ord.customerName || 'Customer'}</div>
        <div class="customer-phone">${ord.customerPhone || ''}</div>
        <div class="customer-address">${ord.fullAddress || ''}</div>
      </div>
      `
          : ''
      }

      <!-- 4. COLLECT BAR (SOLID BLACK WITH WHITE TEXT) -->
      ${
        printConfig.showCollectAmount
          ? `
      <div class="section collect-bar">
        <div class="collect-left">
          <span class="collect-bangla-label">${fin.isPaid ? 'পেমেন্ট অবস্থা' : 'ক্যাশ কালেক্ট করুন'}</span>
          <span class="collect-subtext">${fin.isPaid ? 'PAID IN ADVANCE' : 'COLLECT CASH ON DELIVERY'}</span>
        </div>
        <div class="collect-amount">
          ${fin.isPaid ? 'পেইড' : formatTaka(fin.amountToCollect)}
        </div>
      </div>
      `
          : ''
      }

      <!-- 5. FOOTER ROW -->
      <div class="section footer-row">
        <div class="order-ref">Order: #${ord.orderNumber}</div>
        ${isFragile ? '<div class="fragile-badge">সাবধানে রাখুন (FRAGILE)</div>' : '<div class="standard-badge">STANDARD PARCEL</div>'}
      </div>
    </div>
    `;
  };

  const layout = options.sheetLayout || 'single';

  let bodyContent = '';

  if (layout === 'sheet4') {
    // A4 sheet: 4 stickers (2 x 2 grid, cells 105 x 148.5 mm)
    // Supports startPos (1 to 4)
    const startPos = Math.max(1, Math.min(4, Number(options.startPos) || 1));
    const itemsWithBlanks: Array<OrderRecord | null> = [];

    // Fill blanks before startPos
    for (let i = 1; i < startPos; i++) {
      itemsWithBlanks.push(null);
    }
    itemsWithBlanks.push(...orders);

    // Group into chunks of 4 per A4 page
    const pages: Array<Array<OrderRecord | null>> = [];
    for (let i = 0; i < itemsWithBlanks.length; i += 4) {
      pages.push(itemsWithBlanks.slice(i, i + 4));
    }

    bodyContent = pages
      .map(
        (pageItems) => `
      <div class="sheet-a4-page sheet4-grid">
        ${pageItems
          .map((item, cellIdx) =>
            item
              ? `<div class="sheet4-cell">${renderSingleStickerCard(item, false)}</div>`
              : `<div class="sheet4-cell blank-cell"><div class="blank-hint">Blank position #${cellIdx + 1}</div></div>`
          )
          .join('')}
      </div>
    `
      )
      .join('');
  } else if (layout === 'sheet8') {
    // A4 sheet: 8 stickers (2 x 4 grid, cells 105 x 74 mm)
    const startPos = Math.max(1, Math.min(8, Number(options.startPos) || 1));
    const itemsWithBlanks: Array<OrderRecord | null> = [];

    for (let i = 1; i < startPos; i++) {
      itemsWithBlanks.push(null);
    }
    itemsWithBlanks.push(...orders);

    const pages: Array<Array<OrderRecord | null>> = [];
    for (let i = 0; i < itemsWithBlanks.length; i += 8) {
      pages.push(itemsWithBlanks.slice(i, i + 8));
    }

    bodyContent = pages
      .map(
        (pageItems) => `
      <div class="sheet-a4-page sheet8-grid">
        ${pageItems
          .map((item, cellIdx) =>
            item
              ? `<div class="sheet8-cell">${renderSingleStickerCard(item, true)}</div>`
              : `<div class="sheet8-cell blank-cell"><div class="blank-hint">Blank #${cellIdx + 1}</div></div>`
          )
          .join('')}
      </div>
    `
      )
      .join('');
  } else {
    // Single 100 x 150 mm thermal label pages
    bodyContent = orders
      .map(
        (ord) => `
      <div class="thermal-page">
        ${renderSingleStickerCard(ord, options.isCompact || false)}
      </div>
    `
      )
      .join('');
  }

  return `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <title>Parcel Stickers (100x150mm) - CraftyKidsCo</title>
  <style>
    ${embeddedFonts}

    /* PURE BLACK AND WHITE SPECIFICATION FOR THERMAL PRINTERS */
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color: #000000;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #FFFFFF;
      font-family: 'Hind Siliguri', sans-serif;
    }

    @page sticker {
      size: 100mm 150mm;
      margin: 0;
    }

    @page sheet {
      size: A4 portrait;
      margin: 0;
    }

    .thermal-page {
      page: sticker;
      width: 100mm;
      height: 150mm;
      max-width: 100mm;
      max-height: 150mm;
      page-break-after: always;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2.5mm;
    }

    .sticker-container {
      width: 95mm;
      height: 145mm;
      border: 0.8mm solid #000000;
      background: #FFFFFF;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .section {
      border-bottom: 0.5mm solid #000000;
      padding: 2.5mm 3mm;
    }
    .section:last-child {
      border-bottom: none;
    }

    /* 1. SENDER ROW */
    .sender-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 12mm;
    }
    .company-name {
      font-family: 'Fredoka', sans-serif;
      font-size: 15pt;
      font-weight: 700;
      line-height: 1.1;
    }
    .company-tagline {
      font-size: 8.5pt;
      font-weight: 600;
      margin-top: 1px;
    }
    .company-phone {
      font-size: 11pt;
      font-weight: 700;
      text-align: right;
    }

    /* 2. CONSIGNMENT BLOCK (MOST IMPORTANT) */
    .consignment-block {
      text-align: center;
      padding: 2.5mm 2mm;
      background: #FFFFFF;
    }
    .consignment-label {
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .consignment-id {
      font-family: 'Fredoka', sans-serif;
      font-size: 26pt;
      font-weight: 700;
      line-height: 1.1;
      letter-spacing: 0.5px;
      margin: 1.5mm 0;
    }
    .barcode-wrapper {
      height: 14mm;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      width: 100%;
    }
    .barcode-wrapper svg {
      max-width: 90mm;
      height: 13.5mm;
    }

    /* 3. RECEIVER BLOCK */
    .receiver-block {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      padding: 3mm 3.5mm;
    }
    .receiver-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5mm;
    }
    .receiver-tag {
      font-size: 9.5pt;
      font-weight: 700;
      border: 0.4mm solid #000000;
      padding: 1px 4px;
    }
    .receiver-district-badge {
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
    }
    .customer-name {
      font-size: 14pt;
      font-weight: 700;
      line-height: 1.2;
    }
    .customer-phone {
      font-size: 14pt;
      font-weight: 700;
      line-height: 1.2;
      margin: 1mm 0 1.5mm 0;
    }
    .customer-address {
      font-size: 10pt;
      font-weight: 600;
      line-height: 1.35;
    }

    /* 4. COLLECT BAR: SOLID BLACK WITH WHITE TEXT */
    .collect-bar {
      background-color: #000000 !important;
      padding: 2.5mm 3.5mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .collect-bar * {
      color: #FFFFFF !important;
    }
    .collect-left {
      display: flex;
      flex-direction: column;
    }
    .collect-bangla-label {
      font-size: 12pt;
      font-weight: 700;
      line-height: 1.1;
    }
    .collect-subtext {
      font-size: 7.5pt;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .collect-amount {
      font-family: 'Fredoka', 'Hind Siliguri', sans-serif;
      font-size: 24pt;
      font-weight: 700;
      line-height: 1;
    }

    /* 5. FOOTER ROW */
    .footer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2mm 3mm;
      min-height: 8mm;
    }
    .order-ref {
      font-size: 9.5pt;
      font-weight: 700;
    }
    .fragile-badge {
      font-size: 9pt;
      font-weight: 700;
      border: 0.5mm solid #000000;
      padding: 1px 5px;
    }
    .standard-badge {
      font-size: 8.5pt;
      font-weight: 600;
    }

    /* COMPACT STYLES (FOR 8-UP OR 75x50) */
    .sticker-container.compact {
      width: 100%;
      height: 100%;
      border: 0.5mm solid #000000;
    }
    .compact .company-name { font-size: 11pt; }
    .compact .company-tagline { display: none; }
    .compact .company-phone { font-size: 9pt; }
    .compact .consignment-id { font-size: 18pt; margin: 0.5mm 0; }
    .compact .barcode-wrapper { height: 9mm; }
    .compact .barcode-wrapper svg { height: 9mm; }
    .compact .customer-name { font-size: 11pt; }
    .compact .customer-phone { font-size: 11pt; margin: 0.5mm 0; }
    .compact .customer-address { font-size: 8pt; line-height: 1.2; }
    .compact .collect-amount { font-size: 17pt; }
    .compact .collect-bangla-label { font-size: 10pt; }

    /* SHEET LAYOUTS (FOR NORMAL LASER/INKJET PRINTERS) */
    .sheet-a4-page {
      page: sheet;
      width: 210mm;
      height: 297mm;
      page-break-after: always;
      display: grid;
      box-sizing: border-box;
      padding: 0;
      margin: 0;
    }
    .sheet4-grid {
      grid-template-columns: 105mm 105mm;
      grid-template-rows: 148.5mm 148.5mm;
    }
    .sheet8-grid {
      grid-template-columns: 105mm 105mm;
      grid-template-rows: repeat(4, 74.25mm);
    }
    .sheet4-cell, .sheet8-cell {
      border: 1px dashed #777; /* Thin dashed cut lines between cells */
      padding: 3mm;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-sizing: border-box;
    }
    .blank-cell {
      background: #FAFAFA;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .blank-hint {
      color: #999;
      font-size: 10pt;
      font-style: italic;
    }

    @media print {
      body { margin: 0; padding: 0; }
    }
  </style>
</head>
<body ${options.isHtmlFallback ? 'onload="window.print()"' : ''}>
  ${bodyContent}
</body>
</html>
  `;
}
