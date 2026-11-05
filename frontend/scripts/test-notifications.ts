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

import {
  verifySmtpConnection,
  sendOrderNotificationEmail,
  sendContactNotificationEmail,
} from '../src/lib/mailer';

async function test() {
  console.log('1. Testing SMTP verification...');
  const verifyRes = await verifySmtpConnection();
  console.log('Verification result:', verifyRes);

  console.log('\n2. Testing New Order notification email...');
  const sampleOrder = {
    orderNumber: 'CKC-20261106-TEST',
    customerName: 'সাকিব আল হাসান',
    customerPhone: '01712345678',
    district: 'Dhaka',
    thana: 'Dhanmondi',
    fullAddress: 'House #42, Road #7/A, Dhanmondi, Dhaka-1209',
    customerNote: 'দয়া করে দ্রুত ডেলিভারি দিন। উপহারের জন্য পাঠানো হবে।',
    subtotal: 1250,
    deliveryCharge: 60,
    discountAmount: 50,
    totalAmount: 1260,
    paymentMethod: 'COD',
    paymentStatus: 'UNPAID',
    createdAt: new Date(),
    items: [
      {
        title: 'অর্গানিক বিওয়াক্স মোমের রঙ (Organic Beeswax Crayons)',
        variationTitle: '১২ রঙের সেট (12 Colors)',
        quantity: 1,
        price: 750,
        total: 750,
      },
      {
        title: 'শিশুদের কাঠের কিচেন সেট (Wooden Kitchen Toy)',
        quantity: 1,
        price: 500,
        total: 500,
      },
    ],
  };

  const orderSuccess = await sendOrderNotificationEmail(sampleOrder);
  console.log('Order email notification result:', orderSuccess ? '✅ SUCCESS' : '❌ FAILED');

  console.log('\n3. Testing New Contact Message notification email...');
  const sampleContact = {
    name: 'তানজিলা হক',
    email: 'tanzila.test@example.com',
    phone: '01812345678',
    subject: 'স্কুল বা বাল্ক অর্ডার',
    message: 'আমাদের স্কুলের শিশুদের চিত্রাঙ্কন উৎসবের জন্য ৫০টি আর্ট কিটের বিশেষ মূল্য তালিকা প্রয়োজন। অনুগ্রহ করে দ্রুত যোগাযোগ করবেন।',
    createdAt: new Date(),
  };

  const contactSuccess = await sendContactNotificationEmail(sampleContact);
  console.log('Contact email notification result:', contactSuccess ? '✅ SUCCESS' : '❌ FAILED');
}

test().catch(console.error);

