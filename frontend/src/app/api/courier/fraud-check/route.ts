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
    const refresh = searchParams.get('refresh') === '1';

    if (!phone) {
      return NextResponse.json(
        { success: false, message: 'Phone number parameter is required' },
        { status: 400 }
      );
    }

    if (refresh) {
      const { clearSteadfastCache } = await import('@/core/courier/steadfast.provider');
      clearSteadfastCache(phone);
    }

    const cleanDigits = phone.replace(/\D/g, '');
    const cleanPhone = cleanDigits.startsWith('880') ? cleanDigits.substring(2) : cleanDigits;

    // Helper: Query CraftyKidsCo store history for this customer phone
    const fetchStoreHistory = async () => {
      let history = { total: 0, delivered: 0, cancelled: 0, pending: 0, confirmed: 0 };
      const lookupSuffix = cleanDigits.slice(-10);
      if (!lookupSuffix) return history;

      try {
        await connectToDatabase();
        const storeOrders = await Order.find({
          customerPhone: { $regex: lookupSuffix },
        }).lean();

        if (storeOrders.length > 0) {
          return {
            total: storeOrders.length,
            delivered: storeOrders.filter((o: any) => o.status === 'DELIVERED').length,
            cancelled: storeOrders.filter((o: any) => o.status === 'CANCELLED' || o.status === 'RETURNED').length,
            pending: storeOrders.filter((o: any) => o.status === 'PENDING').length,
            confirmed: storeOrders.filter((o: any) => ['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)).length,
          };
        }
      } catch (dbErr) {
        console.warn('MongoDB query warning in fraud-check store history:', dbErr);
      }

      // Fallback: If 0 orders found in MongoDB, check in-memory store
      try {
        const { getAllOrders: getMemoryOrders } = await import('@/lib/store');
        const memOrders = getMemoryOrders().filter((o) =>
          o.customerPhone && o.customerPhone.replace(/\D/g, '').includes(lookupSuffix)
        );
        if (memOrders.length > 0) {
          return {
            total: memOrders.length,
            delivered: memOrders.filter((o) => o.status === 'DELIVERED').length,
            cancelled: memOrders.filter((o) => o.status === 'CANCELLED' || o.status === 'RETURNED').length,
            pending: memOrders.filter((o) => o.status === 'PENDING').length,
            confirmed: memOrders.filter((o) => ['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)).length,
          };
        }
      } catch (memErr) {
        console.warn('Memory order lookup error:', memErr);
      }

      return history;
    };

    const courier = getCourierProvider();

    // Run both queries in parallel for maximum speed
    const [riskData, storeHistory] = await Promise.all([
      courier.checkCustomerRisk(phone).catch(() => ({
        hasHistory: false,
        serviceStatus: 'unavailable' as const,
        statusMessage: 'কুরিয়ার গেটওয়ে সংযোগে ত্রুটি দেখা দিয়েছে',
        pastSuccessRate: 0,
        returnRatio: 0,
        isRisky: false,
        totalReports: 0,
        totalDeliveries: 0,
        returnCount: 0,
        totalParcels: 0,
      })),
      fetchStoreHistory(),
    ]);

    const cacheHeader = riskData.serviceStatus === 'available'
      ? 'private, max-age=300'
      : 'no-store, no-cache, must-revalidate';

    return NextResponse.json(
      {
        success: true,
        phone,
        provider: courier.name,
        storeHistory,
        ...riskData,
      },
      {
        headers: {
          'Cache-Control': cacheHeader,
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to check customer risk' },
      { status: 500 }
    );
  }
}
