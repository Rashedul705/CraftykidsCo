import { NextRequest, NextResponse } from 'next/server';
import { getOrderByIdOrNumber, updateOrderStatus, OrderRecord } from '@/lib/store';
import { getNotificationProvider } from '@/core/notification';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const order = getOrderByIdOrNumber(id);

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'অর্ডার পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'অর্ডার তথ্য লোড করতে ত্রুটি' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { status, note } = body;

    const validStatuses = [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'অকার্যকর অর্ডার স্ট্যাটাস' },
        { status: 400 }
      );
    }

    const updated = updateOrderStatus(id, status as OrderRecord['status'], note);

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'অর্ডার খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    // Send SMS Notification on important status transitions
    try {
      const notification = getNotificationProvider();
      if (status === 'CONFIRMED') {
        await notification.sendSms({
          toPhone: updated.customerPhone,
          message: `CraftyKidsCo: প্রিয় গ্রাহক, আপনার অর্ডার #${updated.orderNumber} কনফার্ম করা হয়েছে। শীঘ্রই প্যাকেজিং শুরু হচ্ছে।`,
          templateKey: 'ORDER_CONFIRMED',
        });
      } else if (status === 'SHIPPED') {
        await notification.sendSms({
          toPhone: updated.customerPhone,
          message: `CraftyKidsCo: আপনার অর্ডার #${updated.orderNumber} কুরিয়ারে হস্তান্তর করা হয়েছে। ট্র্যাকিং কোড: ${updated.trackingCode || 'TRK-Pending'}।`,
          templateKey: 'ORDER_SHIPPED',
        });
      }
    } catch (notifErr) {
      console.warn('[Notification Error]:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `অর্ডারের স্ট্যাটাস '${status}' করা হয়েছে`,
      order: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'অর্ডার স্ট্যাটাস আপডেট করতে ত্রুটি' },
      { status: 500 }
    );
  }
}
