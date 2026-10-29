import { NextRequest, NextResponse } from 'next/server';
import { OrderCreateInputSchema } from '@/lib/validations';
import {
  calculateDeliveryCharge,
  validateAndApplyCoupon,
  deductInventoryStock,
} from '@/lib/order-service';
import { deductOrderStockAtomic, ensureStockCollections, OutOfStockError } from '@/lib/order-stock';
import {
  createOrder as createMemoryOrder,
  getAllOrders as getMemoryOrders,
  getOrdersByPhone as getMemoryOrdersByPhone,
  OrderRecord,
} from '@/lib/store';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Setting } from '@/models/Setting';
import {
  getDeliverySettings,
  updateDeliverySettings,
  defaultDeliverySettings,
  calculateDelivery,
} from '@/lib/delivery-store';
import { getNotificationProvider } from '@/core/notification';
import { verifyAdminRequest } from '@/lib/auth';
import { sendMetaCapiEvent } from '@/lib/meta-capi';

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
    let currentDeliverySettings = getDeliverySettings();
    try {
      await connectToDatabase();
      const settingDoc = await Setting.findOne({ key: 'delivery_settings' }).lean();
      if (settingDoc && (settingDoc as any).value) {
        const parsed = JSON.parse((settingDoc as any).value);
        currentDeliverySettings = {
          ...defaultDeliverySettings,
          ...parsed,
        };
        updateDeliverySettings(currentDeliverySettings);
      }
    } catch (dbErr) {
      console.warn('MongoDB error reading delivery_settings in orders route:', dbErr);
    }

    const deliveryRes = calculateDelivery(
      data.district,
      subtotal,
      currentDeliverySettings,
      data.thana
    );

    const deliveryCharge = typeof data.deliveryCharge === 'number'
      ? data.deliveryCharge
      : deliveryRes.charge;

    const totalAmount = data.totalAmount !== undefined
      ? data.totalAmount
      : Math.max(0, subtotal - discountAmount + deliveryCharge);

    // 5. Generate Order ID
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
      thana: data.thana || '',
      fullAddress: data.fullAddress,
      customerNote: data.customerNote,
      subtotal,
      deliveryCharge,
      discountAmount,
      totalAmount,
      couponCode: data.couponCode,
      source: data.source || 'website',
      status: 'PENDING' as const,
      paymentStatus: (data.paymentMethod === 'BKASH' || data.paymentMethod === 'NAGAD') ? ('PAID' as const) : ('UNPAID' as const),
      paymentMethod: data.paymentMethod,
      items: data.items.map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        productId: it.productId,
        variantId: it.variantId || undefined,
        title: it.title,
        titleBn: it.title,
        titleEn: it.title,
        variationSku: it.variationSku || '',
        variationTitle: it.variationTitle || (it as any).variationTitleBn || '',
        variationTitleBn: (it as any).variationTitleBn || it.variationTitle || '',
        imageUrl: it.imageUrl || '',
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

    // 6. Atomic stock deduction & order persistence in MongoDB transaction
    try {
      await connectToDatabase();
      await ensureStockCollections();
      const mongoose = (await import('mongoose')).default;
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Atomic stock deduction for all items using $elemMatch & $gte
        await deductOrderStockAtomic(data.items, orderNumber, session);

        // Save order document inside the same transaction
        const [createdOrder] = await Order.create([orderPayload], { session });
        savedOrder = createdOrder.toObject ? createdOrder.toObject() : createdOrder;

        await session.commitTransaction();
        console.log(`✅ Order ${orderNumber} persisted with atomic stock deduction!`);
      } catch (txErr: any) {
        await session.abortTransaction();
        console.warn(`[Stock Deduction / Order Error]: ${txErr.message}`);
        return NextResponse.json(
          {
            success: false,
            message: txErr.message || 'পর্যাপ্ত স্টক নেই বা অর্ডার সম্পন্ন করা যায়নি',
          },
          { status: 400 }
        );
      } finally {
        session.endSession();
      }
    } catch (dbErr: any) {
      console.warn('MongoDB connection / session error in /api/orders (falling back to memory):', dbErr.message);
      // Fallback for offline / memory mode
      const stockDeductRes = deductInventoryStock(data.items);
      if (!stockDeductRes.success) {
        return NextResponse.json(
          { success: false, message: stockDeductRes.error || 'পর্যাপ্ত স্টক নেই' },
          { status: 400 }
        );
      }
    }

    // Also update in-memory store as fallback
    const memoryOrder = createMemoryOrder({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      district: data.district,
      thana: data.thana || '',
      fullAddress: data.fullAddress,
      customerNote: data.customerNote,
      subtotal,
      deliveryCharge,
      discountAmount,
      totalAmount,
      couponCode: data.couponCode,
      source: (data.source as any) || 'website',
      status: 'PENDING',
      paymentStatus: (data.paymentMethod === 'BKASH' || data.paymentMethod === 'NAGAD') ? 'PAID' : 'UNPAID',
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

    // 9. Meta Conversions API (CAPI) Server-Side Purchase Event
    try {
      const forwardedFor = req.headers.get('x-forwarded-for');
      const realIp = req.headers.get('x-real-ip');
      const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || undefined);
      const clientUserAgent = req.headers.get('user-agent') || undefined;
      const fbp = data.fbp || req.cookies.get('_fbp')?.value;
      const fbc = data.fbc || req.cookies.get('_fbc')?.value;
      const purchaseEventId = data.eventId || `purch_${finalOrder.orderNumber}`;

      // Fire in background non-blocking
      sendMetaCapiEvent({
        eventName: 'Purchase',
        eventId: purchaseEventId,
        eventTime: Math.floor(Date.now() / 1000),
        eventSourceUrl: req.headers.get('referer') || `${process.env.NEXT_PUBLIC_APP_URL || 'https://craftykidsco.com'}/checkout`,
        actionSource: 'website',
        userData: {
          phone: finalOrder.customerPhone,
          name: finalOrder.customerName,
          district: finalOrder.district,
          clientIp,
          clientUserAgent,
          fbp,
          fbc,
        },
        customData: {
          currency: 'BDT',
          value: Number(finalOrder.totalAmount),
          order_id: finalOrder.orderNumber,
          num_items: finalOrder.items.reduce((s: number, it: any) => s + (it.quantity || 1), 0),
          content_type: 'product',
          content_ids: finalOrder.items.map((it: any) => it.variantId || it.productId || it.variationSku || it.id),
          contents: finalOrder.items.map((it: any) => ({
            id: it.variantId || it.productId || it.variationSku || it.id,
            quantity: it.quantity,
            item_price: it.price || it.unitPrice,
            title: it.title,
          })),
        },
      }).catch((capiErr) => {
        console.warn('[Meta CAPI Purchase Error]:', capiErr);
      });
    } catch (capiWrapperErr) {
      console.warn('[Meta CAPI Purchase Trigger Error]:', capiWrapperErr);
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
