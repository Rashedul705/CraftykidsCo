import { NextRequest, NextResponse } from 'next/server';
import { OrderCreateInputSchema } from '@/lib/validations';
import {
  calculateDeliveryCharge,
  validateAndApplyCoupon,
  deductInventoryStock,
} from '@/lib/order-service';
import {
  createOrder as createMemoryOrder,
  getAllOrders as getMemoryOrders,
  getOrdersByPhone as getMemoryOrdersByPhone,
  OrderRecord,
} from '@/lib/store';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { getNotificationProvider } from '@/core/notification';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const phone = searchParams.get('phone');
    const query = searchParams.get('query');

    // If not searching for a customer's own phone orders, require admin authentication
    if (!phone) {
      const auth = await verifyAdminRequest(req);
      if (!auth.authorized) {
        return auth.response;
      }
    }

    // 1. Try querying MongoDB Atlas
    try {
      await connectToDatabase();
      const mongoQuery: any = {};

      if (phone) {
        mongoQuery.customerPhone = phone;
      }
      if (status && status !== 'ALL') {
        mongoQuery.status = status;
      }
      if (query) {
        const regex = new RegExp(query, 'i');
        mongoQuery.$or = [
          { orderNumber: regex },
          { customerPhone: regex },
          { customerName: regex },
        ];
      }

      const syncErrors: any[] = [];
      const memoryOrders = getMemoryOrders();
      for (const mOrd of memoryOrders) {
        const exists = await Order.findOne({ orderNumber: mOrd.orderNumber });
        if (!exists) {
          try {
            await Order.create({
              id: mOrd.id,
              orderNumber: mOrd.orderNumber,
              customerName: mOrd.customerName,
              customerPhone: mOrd.customerPhone,
              district: mOrd.district,
              fullAddress: mOrd.fullAddress,
              subtotal: mOrd.subtotal,
              deliveryCharge: mOrd.deliveryCharge,
              discountAmount: mOrd.discountAmount || 0,
              totalAmount: mOrd.totalAmount,
              status: mOrd.status,
              paymentStatus: mOrd.paymentStatus,
              paymentMethod: mOrd.paymentMethod,
              courier: mOrd.courier,
              consignmentId: mOrd.consignmentId,
              trackingCode: mOrd.trackingCode,
              source: mOrd.source || 'website',
              internalNote: mOrd.internalNote,
              timeline: mOrd.timeline,
              items: mOrd.items.map(it => ({
                productId: it.productId,
                id: it.id,
                title: it.title,
                titleBn: it.title,
                titleEn: it.title,
                price: it.price,
                unitPrice: it.price,
                quantity: it.quantity,
                total: it.total,
                totalPrice: it.total,
                imageUrl: it.imageUrl,
              })),
            });
          } catch (e: any) {
            syncErrors.push({ order: mOrd.orderNumber, msg: e?.message, errs: e?.errors });
          }
        }
      }

      const dbOrders = await Order.find(mongoQuery).sort({ createdAt: -1 }).lean();
      if (dbOrders && dbOrders.length > 0) {
        return NextResponse.json({
          success: true,
          count: dbOrders.length,
          orders: dbOrders.map((o: any) => ({
            ...o,
            id: o.id || o._id?.toString() || o.orderNumber,
          })),
          source: 'mongodb',
        });
      }
    } catch (dbErr) {
      console.warn('MongoDB query warning in /api/orders (falling back to memory):', dbErr);
    }

    // 2. Fallback to in-memory store
    let orders = getMemoryOrders();

    if (phone) {
      orders = getMemoryOrdersByPhone(phone);
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

    return NextResponse.json({ success: true, count: orders.length, orders, source: 'memory' });
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

    // 6. Generate Order ID
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `CKC-${todayStr}-${randomSuffix}`;
    const orderId = `ord-${Date.now()}`;

    const orderPayload = {
      id: orderId,
      orderNumber,
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
      status: 'PENDING' as const,
      paymentStatus: 'UNPAID' as const,
      paymentMethod: data.paymentMethod,
      items: data.items.map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        productId: it.productId,
        title: it.title,
        titleBn: it.title,
        titleEn: it.title,
        variationTitle: it.variationTitle,
        price: it.price,
        unitPrice: it.price,
        quantity: it.quantity,
        total: it.price * it.quantity,
        totalPrice: it.price * it.quantity,
      })),
      timeline: [
        {
          status: 'PENDING',
          timestamp: new Date().toISOString(),
          note: 'অর্ডার সফলভাবে গ্রহণ করা হয়েছে (Pending Confirmation)',
        },
      ],
      statusHistory: [
        {
          status: 'PENDING',
          note: 'অর্ডার সফলভাবে গ্রহণ করা হয়েছে',
          changedBy: 'CUSTOMER',
          timestamp: new Date(),
        },
      ],
    };

    let savedOrder: any = null;

    // 7. Persist to MongoDB Atlas
    try {
      await connectToDatabase();
      const mongoOrder = await Order.create(orderPayload);
      savedOrder = mongoOrder.toObject ? mongoOrder.toObject() : mongoOrder;
      console.log(`✅ Order ${orderNumber} persisted to MongoDB Atlas!`);
    } catch (dbErr: any) {
      console.error('Failed to save order to MongoDB Atlas:', dbErr.message);
    }

    // Also update in-memory store as fallback
    const memoryOrder = createMemoryOrder({
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
      items: orderPayload.items,
    });

    const finalOrder = savedOrder || memoryOrder;

    // 8. SMS Notification Mock
    try {
      const notification = getNotificationProvider();
      await notification.sendSms({
        toPhone: finalOrder.customerPhone,
        message: `CraftyKidsCo: প্রিয় গ্রাহক, আপনার অর্ডার #${finalOrder.orderNumber} সফলভাবে গৃহীত হয়েছে। মোট বিল: ৳${finalOrder.totalAmount}। ধন্যবাদ!`,
        templateKey: 'ORDER_PLACED',
      });
    } catch (notifErr) {
      console.warn('[Notification Error]:', notifErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'অর্ডার সফলভাবে সম্পন্ন হয়েছে!',
        order: finalOrder,
        orderId: finalOrder.orderNumber,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'অর্ডার প্রক্রিয়াকরণে ত্রুটি';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
