import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { getCourierProvider } from '@/core/courier';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { assignCourierToOrder, getOrderByIdOrNumber, OrderRecord } from '@/lib/store';
import { getNotificationProvider } from '@/core/notification';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const {
      orderId,
      orderNumber,
      customerName,
      customerPhone,
      customerAddress,
      district,
      codAmount,
      customerNote,
    } = body || {};

    let targetOrder: any = null;

    // Look up order if orderId or orderNumber is supplied
    const lookupKey = orderId || orderNumber;
    if (lookupKey) {
      try {
        await connectToDatabase();
        const isObjectId = String(lookupKey).match(/^[0-9a-fA-F]{24}$/);
        targetOrder = await Order.findOne({
          $or: [
            { id: lookupKey },
            { orderNumber: lookupKey },
            ...(isObjectId ? [{ _id: lookupKey }] : []),
          ],
        }).lean();
      } catch (dbErr) {
        console.warn('MongoDB lookup error in courier dispatch:', dbErr);
      }

      if (!targetOrder) {
        targetOrder = getOrderByIdOrNumber(lookupKey);
      }
    }

    // Resolve payload fields prioritizing targetOrder if found
    const finalOrderNumber = orderNumber || targetOrder?.orderNumber || orderId || `CK-${Date.now().toString().slice(-6)}`;
    const finalCustomerName = customerName || targetOrder?.customerName || 'Customer';
    const finalCustomerPhone = customerPhone || targetOrder?.customerPhone || '';
    const finalAddress = customerAddress || targetOrder?.fullAddress || targetOrder?.shippingAddress?.address || 'Bangladesh';
    const finalDistrict = district || targetOrder?.district || targetOrder?.shippingAddress?.district || 'Dhaka';
    const finalCodAmount = codAmount !== undefined ? codAmount : (targetOrder?.totalAmount || 0);
    const finalNote = customerNote || targetOrder?.customerNote || 'CraftyKidsCo Plaster Painting Kits Delivery';

    if (!finalCustomerPhone) {
      return NextResponse.json(
        { success: false, message: 'গ্রাহকের ফোন নম্বর ছাড়া স্টিডফাস্টে পার্সেল তৈরি করা যাবে না।' },
        { status: 400 }
      );
    }

    // Call Steadfast Courier Provider
    const courier = getCourierProvider();
    const result = await courier.createConsignment({
      orderId: String(orderId || finalOrderNumber),
      orderNumber: String(finalOrderNumber),
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      customerAddress: finalAddress,
      district: finalDistrict,
      codAmount: Number(finalCodAmount),
      customerNote: finalNote,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || 'স্টিডফাস্টে কনসাইনমেন্ট তৈরিতে সমস্যা হয়েছে।',
          courier: 'STEADFAST',
          rawResponse: result.rawResponse,
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const consignmentId = result.consignmentId;
    const trackingCode = result.trackingCode;

    // 1. Update in MongoDB Atlas
    try {
      await connectToDatabase();
      const isObjectId = String(lookupKey).match(/^[0-9a-fA-F]{24}$/);
      await Order.findOneAndUpdate(
        {
          $or: [
            { id: lookupKey },
            { orderNumber: finalOrderNumber },
            ...(isObjectId ? [{ _id: lookupKey }] : []),
          ],
        },
        {
          $set: {
            courier: 'STEADFAST',
            consignmentId,
            trackingCode,
            status: 'SHIPPED',
            updatedAt: now,
          },
          $push: {
            timeline: {
              status: 'SHIPPED',
              timestamp: now.toISOString(),
              note: `স্টিডফাস্ট কুরিয়ারে বুকিং সম্পন্ন (Consignment ID: ${consignmentId}, Tracking: ${trackingCode})`,
            },
            statusHistory: {
              status: 'SHIPPED',
              note: `Dispatched to Steadfast Courier. Tracking: ${trackingCode}`,
              changedBy: 'ADMIN',
              timestamp: now,
            },
          },
        }
      );
    } catch (dbErr) {
      console.warn('MongoDB order update warning in dispatch:', dbErr);
    }

    // 2. Update memory store fallback
    if (orderId) {
      assignCourierToOrder(orderId, consignmentId, trackingCode);
    }

    // 3. Optional SMS alert with tracking code
    try {
      const notification = getNotificationProvider();
      await notification.sendSms({
        toPhone: finalCustomerPhone,
        message: `CraftyKidsCo: আপনার অর্ডার #${finalOrderNumber} স্টিডফাস্ট কুরিয়ারে হস্তান্তর করা হয়েছে। ট্র্যাকিং কোড: ${trackingCode}। ধন্যবাদ!`,
        templateKey: 'ORDER_SHIPPED',
      });
    } catch (notifErr) {
      console.warn('Notification error on Steadfast dispatch:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `সাফল্য! স্টিডফাস্ট কনসাইনমেন্ট তৈরি হয়েছে। ট্র্যাকিং কোড: ${trackingCode}`,
      consignmentId,
      trackingCode,
      trackingUrl: `https://steadfast.com.bd/t/${trackingCode}`,
      courierCharge: result.courierCharge,
      orderNumber: finalOrderNumber,
    });
  } catch (error: any) {
    console.error('Steadfast dispatch route error:', error);
    const isProd = process.env.NODE_ENV === 'production';
    return NextResponse.json(
      {
        success: false,
        message: isProd ? 'Internal server error during courier dispatch' : (error.message || 'Unknown error'),
      },
      { status: 500 }
    );
  }
}
