import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { User } from '@/models/User';
import { ActivityLog } from '@/models/ActivityLog';
import { verifyAdminRequest } from '@/lib/auth';
import { deleteOrdersByCustomerPhones, getAllOrders } from '@/lib/store';

// 1. GET /api/customers - List aggregated customers from DB or memory
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req, 'customers.view');
    if (!auth.authorized) {
      return auth.response;
    }

    try {
      await connectToDatabase();
      const orders = await Order.find().sort({ createdAt: -1 }).lean();
      return NextResponse.json({
        success: true,
        count: orders.length,
        orders,
      });
    } catch (dbErr) {
      console.warn('MongoDB error in GET /api/customers (falling back to memory):', dbErr);
      const memOrders = getAllOrders();
      return NextResponse.json({
        success: true,
        count: memOrders.length,
        orders: memOrders,
      });
    }
  } catch (error: any) {
    console.error('Error in GET /api/customers:', error);
    return NextResponse.json(
      { success: false, message: 'গ্রাহকদের তালিকা লোড করতে ব্যর্থ হয়েছে' },
      { status: 500 }
    );
  }
}

// 2. DELETE /api/customers - Bulk delete customers and their order history
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req, 'customers.delete');
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json().catch(() => ({}));
    const phones: string[] = Array.isArray(body?.phones)
      ? body.phones.map((p: any) => String(p).trim()).filter(Boolean)
      : [];

    if (!phones || phones.length === 0) {
      return NextResponse.json(
        { success: false, message: 'মুছে ফেলার জন্য কোনো গ্রাহক নির্বাচন করা হয়নি' },
        { status: 400 }
      );
    }

    let deletedOrdersCount = 0;
    let deletedUsersCount = 0;

    // 1. Delete from MongoDB Atlas
    try {
      await connectToDatabase();

      // Build flexible phone regex patterns to match with or without +880 / spaces
      const phoneQueries = phones.map((p) => {
        const cleanDigits = p.replace(/[^\d]/g, '');
        const last10 = cleanDigits.slice(-10);
        return new RegExp(last10 + '$');
      });

      // Delete customer orders
      const orderDelRes = await Order.deleteMany({
        $or: [
          { customerPhone: { $in: phoneQueries } },
          { customerPhone: { $in: phones } },
        ],
      });
      deletedOrdersCount = orderDelRes.deletedCount || 0;

      // Delete registered customer user accounts
      const userDelRes = await User.deleteMany({
        role: { $in: ['customer', 'CUSTOMER'] },
        $or: [
          { phone: { $in: phoneQueries } },
          { phone: { $in: phones } },
        ],
      });
      deletedUsersCount = userDelRes.deletedCount || 0;
    } catch (dbErr: any) {
      console.error('MongoDB error in bulk customer delete:', dbErr.message);
    }

    // 2. Delete from in-memory store
    const memDeletedCount = deleteOrdersByCustomerPhones(phones);

    // 3. Log activity
    try {
      await ActivityLog.create({
        actorEmail: auth.user.email,
        actorName: auth.user.name || 'Admin',
        action: 'CUSTOMER_BULK_DELETE',
        details: {
          module: 'customers',
          message: `Deleted ${phones.length} customers (${deletedOrdersCount + memDeletedCount} orders removed).`,
          requestedCount: phones.length,
          deletedOrdersCount,
          deletedUsersCount,
          phones,
        },
      });
    } catch (logErr) {
      console.warn('Failed to record activity log for bulk customer delete:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: `${phones.length} জন গ্রাহকের রেকর্ড সফলভাবে মুছে ফেলা হয়েছে`,
      count: phones.length,
      deletedOrdersCount: Math.max(deletedOrdersCount, memDeletedCount),
      deletedUsersCount,
      phones,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/customers:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'গ্রাহক ডিলিট করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}
