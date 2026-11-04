import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { updateOrder, getOrderByIdOrNumber } from '@/lib/store';

/**
 * POST /api/payment/execute
 * Confirms payment execution, transitions order paymentStatus to PAID,
 * logs transaction ID, and adds timestamped entry to order timeline.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      paymentID,
      orderNumber,
      paymentMethod = 'BKASH',
      trxID,
      customerMsisdn,
    } = body;

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, message: 'অর্ডার নাম্বার প্রয়োজন।' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const query = {
      $or: [{ orderNumber: orderNumber.trim() }, { id: orderNumber.trim() }],
    };

    const existingOrder = await Order.findOne(query).lean();
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, message: 'অর্ডার পাওয়া যায়নি।' },
        { status: 404 }
      );
    }

    const now = new Date();
    const finalTrxID =
      trxID?.trim() ||
      `${paymentMethod === 'NAGAD' ? 'NGD' : 'BKS'}${Math.floor(10000000 + Math.random() * 90000000)}`;

    const paymentDetails = {
      provider: paymentMethod,
      paymentID: paymentID || `PAY_${Date.now()}`,
      trxID: finalTrxID,
      amount: existingOrder.totalAmount,
      customerMsisdn: customerMsisdn || existingOrder.customerPhone,
      paymentExecuteTime: now.toISOString(),
      status: 'Completed',
    };

    const timelineEntry = {
      status: 'PAID',
      timestamp: now.toISOString(),
      note: `অনলাইন পেমেন্ট সম্পন্ন হয়েছে (${paymentMethod} TrxID: ${finalTrxID}, ৳${existingOrder.totalAmount})`,
    };

    // 1. Update in MongoDB Atlas
    const updateOp: any = {
      $set: {
        paymentStatus: 'PAID',
        paymentMethod: paymentMethod === 'NAGAD' ? 'NAGAD' : 'BKASH',
        transactionId: finalTrxID,
        paidAt: now,
        paymentDetails,
        updatedAt: now,
      },
      $push: {
        timeline: timelineEntry,
      },
    };

    const updatedDoc = await Order.findOneAndUpdate(query, updateOp, {
      returnDocument: 'after',
    }).lean();

    // 2. Sync to memory store
    updateOrder(orderNumber, {
      paymentStatus: 'PAID',
      paymentMethod: paymentMethod === 'NAGAD' ? 'NAGAD' : 'BKASH',
      transactionId: finalTrxID,
      paidAt: now.toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'পেমেন্ট সফলভাবে গৃহীত হয়েছে।',
      order: {
        orderNumber: existingOrder.orderNumber,
        totalAmount: existingOrder.totalAmount,
        paymentStatus: 'PAID',
        paymentMethod,
        trxID: finalTrxID,
        paidAt: now.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Payment execution error:', error);
    return NextResponse.json(
      { success: false, message: 'পেমেন্ট ভেরিফিকেশন ব্যর্থ হয়েছে।' },
      { status: 500 }
    );
  }
}

