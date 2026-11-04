import { NextRequest, NextResponse } from 'next/server';
import { getOrderByIdOrNumber, updateOrderStatus, updateOrder, OrderRecord } from '@/lib/store';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { getNotificationProvider } from '@/core/notification';
import { verifyAdminRequest } from '@/lib/auth';
import { restoreInventoryStock } from '@/lib/order-service';
import { restoreOrderStockAtomic } from '@/lib/order-stock';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 1. Try MongoDB
    try {
      await connectToDatabase();
      const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
      const dbOrder = await Order.findOne({
        $or: [
          { orderNumber: id },
          { id: id },
          ...(isObjectId ? [{ _id: id }] : [])
        ]
      }).lean();

      if (dbOrder) {
        return NextResponse.json({ success: true, order: dbOrder, source: 'mongodb' });
      }
    } catch (dbErr) {
      console.warn('MongoDB error in GET /api/orders/[id]:', dbErr);
    }

    // 2. Fallback to memory
    const order = getOrderByIdOrNumber(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'অর্ডার পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order, source: 'memory' });
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

    const targetStatus = body?.status;
    let requiredPerm = 'orders.update_status';
    if (targetStatus === 'CANCELLED') {
      requiredPerm = 'orders.cancel';
    } else if (targetStatus === 'RETURNED') {
      requiredPerm = 'orders.refund';
    }

    const auth = await verifyAdminRequest(req, requiredPerm);
    if (!auth.authorized) {
      return auth.response;
    }
    const {
      status,
      note,
      totalAmount,
      deliveryCharge,
      discountAmount,
      subtotal,
      fullAddress,
      customerNote,
      internalNote,
      paymentStatus,
      callStatus,
      callLog,
    } = body;

    const validStatuses = [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'RETURNED',
    ];

    const now = new Date();
    const setFields: any = { updatedAt: now };
    const timelineEntries: any[] = [];
    const statusHistoryEntries: any[] = [];

    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: 'অকার্যকর অর্ডার স্ট্যাটাস' },
          { status: 400 }
        );
      }
      setFields.status = status;
      if (status === 'DELIVERED' && paymentStatus === undefined) {
        setFields.paymentStatus = 'PAID';
      }

      // Automatically restore inventory stock if cancelling or returning an active order
      if (status === 'CANCELLED' || status === 'RETURNED') {
        try {
          await connectToDatabase();
          const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
          let currentOrder = await Order.findOne({
            $or: [
              { orderNumber: id },
              { id: id },
              ...(isObjectId ? [{ _id: id }] : []),
            ],
          }).lean();

          if (!currentOrder) {
            currentOrder = getOrderByIdOrNumber(id) as any;
          }

          if (
            currentOrder &&
            currentOrder.status !== 'CANCELLED' &&
            currentOrder.status !== 'RETURNED' &&
            currentOrder.items
          ) {
            const reason = status === 'CANCELLED' ? 'cancel' : 'return';
            await restoreOrderStockAtomic(currentOrder as any, reason, note);
            restoreInventoryStock(currentOrder as any);
          }
        } catch (restoreErr) {
          console.error('Error during automatic stock restoration:', restoreErr);
        }
      }
      timelineEntries.push({
        status,
        timestamp: now.toISOString(),
        note: note || `স্ট্যাটাস পরিবর্তন: ${status}`,
      });
      statusHistoryEntries.push({
        status,
        note: note || `Status updated to ${status}`,
        changedBy: 'ADMIN',
        timestamp: now,
      });
    }

    if (totalAmount !== undefined) {
      const val = Math.round(Number(totalAmount));
      if (!isNaN(val) && val >= 0) {
        setFields.totalAmount = val;
        if (!status) {
          timelineEntries.push({
            status: 'UPDATED',
            timestamp: now.toISOString(),
            note: note || `মোট বিল পরিবর্তন: ৳${val.toLocaleString()}`,
          });
        }
      }
    }

    if (deliveryCharge !== undefined) {
      const val = Math.round(Number(deliveryCharge));
      if (!isNaN(val) && val >= 0) setFields.deliveryCharge = val;
    }

    if (discountAmount !== undefined) {
      const val = Math.round(Number(discountAmount));
      if (!isNaN(val) && val >= 0) setFields.discountAmount = val;
    }

    if (subtotal !== undefined) {
      const val = Math.round(Number(subtotal));
      if (!isNaN(val) && val >= 0) setFields.subtotal = val;
    }

    if (fullAddress !== undefined && typeof fullAddress === 'string') {
      setFields.fullAddress = fullAddress.trim();
    }

    if (customerNote !== undefined && typeof customerNote === 'string') {
      setFields.customerNote = customerNote.trim();
    }

    if (internalNote !== undefined && typeof internalNote === 'string') {
      setFields.internalNote = internalNote.trim();
    }

    const validCallStatuses = [
      'PENDING',
      'CONNECTED',
      'NOT_ANSWERED',
      'BUSY',
      'UNREACHABLE',
      'CALL_LATER',
    ];

    if (callStatus !== undefined && validCallStatuses.includes(callStatus)) {
      setFields.callStatus = callStatus;
    }

    let callLogEntry: any = null;
    if (callLog && typeof callLog === 'object') {
      const callStatusFinal = callLog.status || callStatus || 'CONNECTED';
      callLogEntry = {
        status: validCallStatuses.includes(callStatusFinal) ? callStatusFinal : 'CONNECTED',
        note: callLog.note ? String(callLog.note).trim() : '',
        calledBy: callLog.calledBy || 'Admin Staff',
        calledAt: callLog.calledAt || now.toISOString(),
      };
      setFields.callStatus = callLogEntry.status;

      const callStatusBn: Record<string, string> = {
        PENDING: 'অপেক্ষমাণ',
        CONNECTED: 'কথা হয়েছে (রিসিভড)',
        NOT_ANSWERED: 'ফোন ধরেননি',
        BUSY: 'ব্যস্ত ছিল',
        UNREACHABLE: 'ফোন বন্ধ / নেটওয়ার্ক নেই',
        CALL_LATER: 'পরে কল করতে বলেছে',
      };

      timelineEntries.push({
        status: `CALL_${callLogEntry.status}`,
        timestamp: callLogEntry.calledAt,
        note: `টেলিসেলস কল: ${callStatusBn[callLogEntry.status] || callLogEntry.status}${callLogEntry.note ? ' - ' + callLogEntry.note : ''} (${callLogEntry.calledBy})`,
      });
    }

    if (paymentStatus !== undefined && ['UNPAID', 'PAID', 'REFUNDED'].includes(paymentStatus)) {
      setFields.paymentStatus = paymentStatus;
    }

    let updated: any = null;

    // 1. Try updating in MongoDB Atlas
    try {
      await connectToDatabase();
      const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
      const query = {
        $or: [
          { orderNumber: id },
          { id: id },
          ...(isObjectId ? [{ _id: id }] : []),
        ],
      };

      const updateOp: any = { $set: setFields };
      const pushOperations: any = {};

      if (timelineEntries.length > 0) {
        pushOperations.timeline = { $each: timelineEntries };
        if (statusHistoryEntries.length > 0) {
          pushOperations.statusHistory = { $each: statusHistoryEntries };
        }
      }

      if (callLogEntry) {
        pushOperations.callLogs = callLogEntry;
      }

      if (Object.keys(pushOperations).length > 0) {
        updateOp.$push = pushOperations;
      }

      const updatedDoc = await Order.findOneAndUpdate(
        query,
        updateOp,
        { returnDocument: 'after' }
      ).lean();

      if (updatedDoc) {
        updated = updatedDoc;
      }
    } catch (dbErr) {
      console.error('MongoDB order update error:', dbErr);
    }

    // 2. Update memory store as sync/fallback
    if (status) {
      updateOrderStatus(id, status as OrderRecord['status'], note);
    }
    const memUpdated = updateOrder(id, setFields);
    if (memUpdated && callLogEntry) {
      if (!(memUpdated as any).callLogs) (memUpdated as any).callLogs = [];
      (memUpdated as any).callLogs.push(callLogEntry);
    }
    if (!updated && memUpdated) {
      updated = memUpdated;
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'অর্ডার খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    // Send SMS Notification on important status transitions
    if (status) {
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
    }

    return NextResponse.json({
      success: true,
      message: status ? `অর্ডারের স্ট্যাটাস '${status}' করা হয়েছে` : 'অর্ডার তথ্য সফলভাবে আপডেট হয়েছে',
      order: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'অর্ডার স্ট্যাটাস আপডেট করতে ত্রুটি' },
      { status: 500 }
    );
  }
}
