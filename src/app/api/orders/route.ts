import { NextRequest, NextResponse } from 'next/server';
import { OrderCreateInputSchema } from '@/lib/validations';
import {
  calculateDeliveryCharge,
  validateAndApplyCoupon,
  deductInventoryStock,
} from '@/lib/order-service';
import {
  createOrder,
  getAllOrders,
  getOrdersByPhone,
  getOrderByIdOrNumber,
  OrderRecord,
} from '@/lib/store';
import { getNotificationProvider } from '@/core/notification';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const phone = searchParams.get('phone');
    const query = searchParams.get('query');

    let orders = getAllOrders();

    if (phone) {
      orders = getOrdersByPhone(phone);
    }

    if (status && status !== 'ALL') {
      orders = orders.filter((o) => o.status === status);
    }

    if (query) {
      const q = query.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.customerName.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'অর্ডার তালিকা লোড করতে ত্রুটি হয়েছে' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Server-side validation via Zod
    const validation = OrderCreateInputSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'ভুল ইনপুট দেওয়া হয়েছে';
      return NextResponse.json(
        { success: false, message: firstError, errors: validation.error.format() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // 2. Compute subtotal from items
    const subtotal = data.items.reduce((sum, it) => sum + it.price * it.quantity, 0);

    // 3. Validate coupon if provided
    let discountAmount = 0;
    if (data.couponCode) {
      const couponRes = validateAndApplyCoupon(data.couponCode, subtotal);
      if (couponRes.valid) {
        discountAmount = couponRes.discountAmount;
      }
    }

    // 4. Calculate delivery charge by district
    const deliveryRes = calculateDeliveryCharge({
      subtotal,
      district: data.district,
    });
    const deliveryCharge = deliveryRes.deliveryCharge;

    const totalAmount = Math.max(0, subtotal - discountAmount + deliveryCharge);

    // 5. Stock check & deduction
    const stockDeductRes = deductInventoryStock(data.items);
    if (!stockDeductRes.success) {
      return NextResponse.json(
        { success: false, message: stockDeductRes.error || 'পর্যাপ্ত স্টক নেই' },
        { status: 400 }
      );
    }

    // 6. Create order with immutable snapshots
    const newOrder = createOrder({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      district: data.district,
      fullAddress: data.fullAddress,
      customerNote: data.customerNote,
      subtotal,
      deliveryCharge,
      discountAmount,
      totalAmount,
      couponCode: data.couponCode,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      paymentMethod: data.paymentMethod,
      items: data.items.map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        productId: it.productId,
        title: it.title,
        variationTitle: it.variationTitle,
        price: it.price,
        quantity: it.quantity,
        total: it.price * it.quantity,
      })),
    });

    // 7. Mock SMS Notification
    try {
      const notification = getNotificationProvider();
      await notification.sendSms({
        toPhone: newOrder.customerPhone,
        message: `CraftyKidsCo: প্রিয় গ্রাহক, আপনার অর্ডার #${newOrder.orderNumber} সফলভাবে গৃহীত হয়েছে। মোট বিল: ৳${newOrder.totalAmount}। ধন্যবাদ!`,
        templateKey: 'ORDER_PLACED',
      });
    } catch (notifErr) {
      console.warn('[Notification Error]:', notifErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'অর্ডার সফলভাবে সম্পন্ন হয়েছে!',
        order: newOrder,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'অর্ডার প্রক্রিয়াকরণে ত্রুটি';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
