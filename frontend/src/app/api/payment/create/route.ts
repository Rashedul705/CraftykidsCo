import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { getOrderByIdOrNumber } from '@/lib/store';

/**
 * POST /api/payment/create
 * Initiates an automated bKash or Nagad payment session for an order.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, paymentMethod = 'BKASH' } = body;

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, message: 'অর্ডার নাম্বার প্রয়োজন।' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Locate Order
    let order = await Order.findOne({
      $or: [{ orderNumber: orderNumber.trim() }, { id: orderNumber.trim() }],
    }).lean();

    if (!order) {
      order = getOrderByIdOrNumber(orderNumber) as any;
    }

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'অর্ডার খুঁজে পাওয়া যায়নি।' },
        { status: 404 }
      );
    }

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { success: false, message: 'এই অর্ডারের পেমেন্ট ইতিমধ্যে সম্পন্ন হয়েছে।' },
        { status: 400 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.headers.get('origin') ||
      'http://localhost:3000';

    const useMock =
      process.env.USE_MOCK_PAYMENTS === 'true' ||
      !process.env.BKASH_APP_KEY ||
      !process.env.BKASH_APP_SECRET;

    // 2. Real bKash Tokenized Gateway (if production credentials provided)
    if (!useMock && paymentMethod === 'BKASH') {
      try {
        const bkashBaseUrl =
          process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v2.0';

        // A. Grant Token
        const tokenRes = await fetch(
          `${bkashBaseUrl}/tokenized/checkout/token/grant`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              username: process.env.BKASH_USERNAME || '',
              password: process.env.BKASH_PASSWORD || '',
            },
            body: JSON.stringify({
              app_key: process.env.BKASH_APP_KEY,
              app_secret: process.env.BKASH_APP_SECRET,
            }),
          }
        );

        const tokenData = await tokenRes.json();
        if (tokenData && tokenData.id_token) {
          // B. Create Payment
          const createRes = await fetch(
            `${bkashBaseUrl}/tokenized/checkout/create`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: tokenData.id_token,
                'X-APP-Key': process.env.BKASH_APP_KEY || '',
              },
              body: JSON.stringify({
                mode: '0011',
                payerReference: order.customerPhone,
                callbackURL: `${appUrl}/api/payment/bkash/callback`,
                amount: String(order.totalAmount),
                currency: 'BDT',
                intent: 'sale',
                merchantInvoiceNumber: order.orderNumber,
              }),
            }
          );

          const createData = await createRes.json();
          if (createData && createData.bkashURL) {
            return NextResponse.json({
              success: true,
              isSandbox: false,
              paymentID: createData.paymentID,
              paymentURL: createData.bkashURL,
            });
          }
        }
      } catch (bkashErr) {
        console.warn('Real bKash gateway handshake error (falling back to simulator):', bkashErr);
      }
    }

    // 3. Automated Simulator / Sandbox Payment Session
    const paymentID = `CKC_PAY_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      isSandbox: true,
      paymentID,
      paymentMethod,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      customerPhone: order.customerPhone,
      customerName: order.customerName,
      paymentURL: `/payment/gateway?orderNumber=${encodeURIComponent(order.orderNumber)}&paymentID=${encodeURIComponent(paymentID)}&method=${encodeURIComponent(paymentMethod)}`,
    });
  } catch (error: any) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { success: false, message: 'পেমেন্ট গেটওয়ে শুরু করা সম্ভব হয়নি।' },
      { status: 500 }
    );
  }
}

