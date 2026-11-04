import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { getCourierProvider } from '@/core/courier';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { assignCourierToOrder, getOrderByIdOrNumber } from '@/lib/store';
import { calculateAmountToCollect } from '@/lib/order-calc';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { orderIds } = body || {};

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'কমপক্ষে একটি অর্ডার নির্বাচন করুন' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find all target orders
    const objectIds = orderIds.filter((id) => String(id).match(/^[0-9a-fA-F]{24}$/));
    const dbOrders = await Order.find({
      $or: [
        { id: { $in: orderIds } },
        { orderNumber: { $in: orderIds } },
        ...(objectIds.length > 0 ? [{ _id: { $in: objectIds } }] : []),
      ],
    }).lean();

    // Merge with in-memory store if any not found in DB
    const ordersToProcess: any[] = [];
    const processedIds = new Set<string>();

    for (const dbOrd of dbOrders) {
      if (!dbOrd.consignmentId) {
        ordersToProcess.push(dbOrd);
        if (dbOrd.id) processedIds.add(String(dbOrd.id));
        if (dbOrd.orderNumber) processedIds.add(String(dbOrd.orderNumber));
      }
    }

    for (const id of orderIds) {
      if (!processedIds.has(id)) {
        const memOrd = getOrderByIdOrNumber(id);
        if (memOrd && !memOrd.consignmentId) {
          ordersToProcess.push(memOrd);
          if (memOrd.id) processedIds.add(String(memOrd.id));
          if (memOrd.orderNumber) processedIds.add(String(memOrd.orderNumber));
        }
      }
    }

    if (ordersToProcess.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'নির্বাচিত অর্ডারগুলোর মধ্যে কোনোটিই কুরিয়ারে পাঠানোর উপযুক্ত নয় (ইতিমধ্যে পাঠানো হয়েছে অথবা পাওয়া যায়নি)।',
        },
        { status: 400 }
      );
    }

    const courier = getCourierProvider();
    const results: Array<{
      orderId: string;
      orderNumber: string;
      success: boolean;
      consignmentId?: string;
      trackingCode?: string;
      error?: string;
    }> = [];

    let successCount = 0;
    let failCount = 0;

    // Process each consignment
    for (const ord of ordersToProcess) {
      const finalOrderNumber = ord.orderNumber || ord.id;
      const finalCustomerName = ord.customerName || 'Customer';
      const finalCustomerPhone = ord.customerPhone || '';
      const finalAddress = ord.fullAddress || ord.shippingAddress?.address || 'Bangladesh';
      const finalDistrict = ord.district || ord.shippingAddress?.district || 'Dhaka';
      const finalCodAmount = calculateAmountToCollect(ord).amountToCollect;
      const finalNote = ord.customerNote || 'CraftyKidsCo Delivery';

      if (!finalCustomerPhone) {
        failCount++;
        results.push({
          orderId: ord.id,
          orderNumber: finalOrderNumber,
          success: false,
          error: 'ফোন নম্বর নেই',
        });
        continue;
      }

      try {
        const dispatchRes = await courier.createConsignment({
          orderId: String(ord.id || finalOrderNumber),
          orderNumber: String(finalOrderNumber),
          customerName: finalCustomerName,
          customerPhone: finalCustomerPhone,
          customerAddress: finalAddress,
          district: finalDistrict,
          codAmount: Number(finalCodAmount),
          customerNote: finalNote,
        });

        if (dispatchRes.success && dispatchRes.consignmentId) {
          successCount++;
          const now = new Date();
          const consignmentId = dispatchRes.consignmentId;
          const trackingCode = dispatchRes.trackingCode;

          // Update MongoDB
          try {
            await Order.findOneAndUpdate(
              {
                $or: [
                  { id: ord.id },
                  { orderNumber: finalOrderNumber },
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
                    note: `বাল্ক বুকিংয়ে স্টিডফাস্ট কুরিয়ারে হস্তান্তর (Consignment: ${consignmentId}, Tracking: ${trackingCode})`,
                  },
                },
              }
            );
          } catch (updateErr) {
            console.warn('DB update warning in bulk dispatch:', updateErr);
          }

          // Memory store update
          if (ord.id) {
            assignCourierToOrder(ord.id, consignmentId, trackingCode);
          }

          results.push({
            orderId: ord.id,
            orderNumber: finalOrderNumber,
            success: true,
            consignmentId,
            trackingCode,
          });
        } else {
          failCount++;
          results.push({
            orderId: ord.id,
            orderNumber: finalOrderNumber,
            success: false,
            error: dispatchRes.message || 'স্টিডফাস্ট কনসাইনমেন্ট ব্যর্থ',
          });
        }
      } catch (err: any) {
        failCount++;
        results.push({
          orderId: ord.id,
          orderNumber: finalOrderNumber,
          success: false,
          error: err.message || 'কুরিয়ার এরর',
        });
      }
    }

    return NextResponse.json({
      success: successCount > 0,
      totalRequested: orderIds.length,
      eligibleProcessed: ordersToProcess.length,
      successCount,
      failCount,
      results,
      message: `${successCount}টি অর্ডার সফলভাবে স্টিডফাস্টে পাঠানো হয়েছে${failCount > 0 ? ` (${failCount}টি ব্যর্থ)` : ''}।`,
    });
  } catch (error: any) {
    console.error('Bulk dispatch route error:', error);
    return NextResponse.json(
      { success: false, message: 'বাল্ক কুরিয়ার ডিসপ্যাচ করতে সমস্যা হয়েছে: ' + (error.message || '') },
      { status: 500 }
    );
  }
}
