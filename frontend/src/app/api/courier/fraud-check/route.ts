import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { getCourierProvider } from '@/core/courier';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { success: false, message: 'Phone number parameter is required' },
        { status: 400 }
      );
    }

    const courier = getCourierProvider();
    const riskData = await courier.checkCustomerRisk(phone);

    // Query CraftyKidsCo store history for this customer phone
    let storeHistory = { total: 0, delivered: 0, cancelled: 0, pending: 0 };
    try {
      await connectToDatabase();
      const cleanDigits = phone.replace(/\D/g, '');
      const lookupSuffix = cleanDigits.slice(-10);
      if (lookupSuffix) {
        const storeOrders = await Order.find({
          customerPhone: { $regex: lookupSuffix },
        }).lean();

        storeHistory = {
          total: storeOrders.length,
          delivered: storeOrders.filter((o: any) => o.status === 'DELIVERED').length,
          cancelled: storeOrders.filter((o: any) => o.status === 'CANCELLED' || o.status === 'RETURNED').length,
          pending: storeOrders.filter((o: any) => ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)).length,
        };
      }
    } catch (dbErr) {
      console.warn('MongoDB query warning in fraud-check store history:', dbErr);
    }

    // Fallback: If 0 orders found in MongoDB, check in-memory store
    if (storeHistory.total === 0) {
      try {
        const { getAllOrders: getMemoryOrders } = await import('@/lib/store');
        const cleanDigits = phone.replace(/\D/g, '');
        const lookupSuffix = cleanDigits.slice(-10);
        if (lookupSuffix) {
          const memOrders = getMemoryOrders().filter((o) =>
            o.customerPhone && o.customerPhone.replace(/\D/g, '').includes(lookupSuffix)
          );
          if (memOrders.length > 0) {
            storeHistory = {
              total: memOrders.length,
              delivered: memOrders.filter((o) => o.status === 'DELIVERED').length,
              cancelled: memOrders.filter((o) => o.status === 'CANCELLED' || o.status === 'RETURNED').length,
              pending: memOrders.filter((o) => ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)).length,
            };
          }
        }
      } catch (memErr) {
        console.warn('Memory order lookup error:', memErr);
      }
    }

    return NextResponse.json({
      success: true,
      phone,
      provider: courier.name,
      storeHistory,
      ...riskData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to check customer risk' },
      { status: 500 }
    );
  }
}
