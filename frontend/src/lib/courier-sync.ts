import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { Order, IOrder } from '@/models/Order';
import { restoreOrderStockAtomic } from '@/lib/order-stock';
import { updateOrderStatus } from '@/lib/store';
import { getCourierProvider } from '@/core/courier';

export interface CourierSyncResult {
  orderNumber: string;
  consignmentId?: string;
  trackingCode?: string;
  oldStatus: string;
  newStatus: string;
  courierStatus: string;
  changed: boolean;
  message?: string;
}

/**
 * Maps Steadfast courier status string to system order status
 */
export function mapSteadfastStatusToOrderStatus(rawCourierStatus: string): {
  targetStatus: 'SHIPPED' | 'DELIVERED' | 'RETURNED' | 'CANCELLED' | 'PROCESSING' | null;
  normalizedStatus: string;
  isApprovalPending?: boolean;
} {
  const s = (rawCourierStatus || '').toLowerCase().trim();

  if (s.includes('delivered_approval_pending')) {
    return { targetStatus: null, normalizedStatus: 'delivered_approval_pending', isApprovalPending: true };
  }
  if (s.includes('delivered') || s.includes('partial_delivered')) {
    return { targetStatus: 'DELIVERED', normalizedStatus: 'delivered' };
  }
  if (s.includes('return') || s.includes('returned') || s.includes('return_received')) {
    return { targetStatus: 'RETURNED', normalizedStatus: 'returned' };
  }
  if (s.includes('cancelled') || s.includes('canceled')) {
    return { targetStatus: 'CANCELLED', normalizedStatus: 'cancelled' };
  }
  if (s.includes('in_transit') || s.includes('transit') || s.includes('shipped') || s.includes('picked')) {
    return { targetStatus: 'SHIPPED', normalizedStatus: 'in_transit' };
  }
  if (s.includes('pending') || s.includes('in_review') || s.includes('hold')) {
    return { targetStatus: 'PROCESSING', normalizedStatus: 'pending' };
  }

  return { targetStatus: null, normalizedStatus: s };
}

/**
 * Updates an order in MongoDB Atlas and local memory cache when a courier status change occurs
 */
export async function applyCourierStatusToOrder(
  order: any,
  rawCourierStatus: string,
  source: 'webhook' | 'cron' | 'manual' = 'cron'
): Promise<CourierSyncResult> {
  const orderNumber = order.orderNumber || order.id;
  const oldStatus = order.status;
  const { targetStatus, normalizedStatus, isApprovalPending } = mapSteadfastStatusToOrderStatus(rawCourierStatus);

  const trackingCode = order.trackingCode || '';
  const consignmentId = order.consignmentId || '';

  // If status did not resolve to a definite change or is already matching
  if (!targetStatus || targetStatus === oldStatus) {
    // If it's approval pending, we can note it in timeline if not already noted
    if (isApprovalPending && oldStatus === 'SHIPPED') {
      const alreadyHasNote = order.timeline?.some(
        (t: any) => t.note && t.note.includes('delivered_approval_pending')
      );
      if (!alreadyHasNote) {
        await connectToDatabase();
        await Order.updateOne(
          { orderNumber },
          {
            $push: {
              timeline: {
                status: 'SHIPPED',
                timestamp: new Date().toISOString(),
                note: 'Steadfast: ডেলিভারি সম্পন্ন, অনুমোদনের অপেক্ষায় (delivered_approval_pending)',
              },
            },
          }
        );
      }
    }

    return {
      orderNumber,
      consignmentId,
      trackingCode,
      oldStatus,
      newStatus: oldStatus,
      courierStatus: rawCourierStatus,
      changed: false,
      message: `Status remained unchanged (${oldStatus})`,
    };
  }

  await connectToDatabase();

  const now = new Date();
  const sourceLabel =
    source === 'webhook'
      ? 'Steadfast Webhook (অটোমেটেড)'
      : source === 'manual'
      ? 'Admin Manual Check'
      : 'Steadfast Sync Cron (অটো-সিঙ্ক)';

  const updateFields: any = {
    status: targetStatus,
    updatedAt: now,
  };

  // If order is delivered and payment was COD, mark as PAID
  if (targetStatus === 'DELIVERED') {
    if (order.paymentStatus !== 'PAID') {
      updateFields.paymentStatus = 'PAID';
      updateFields.paidAt = now;
    }
  }

  // If order was returned or cancelled, restore inventory stock automatically
  if (targetStatus === 'RETURNED' || targetStatus === 'CANCELLED') {
    if (oldStatus !== 'RETURNED' && oldStatus !== 'CANCELLED' && Array.isArray(order.items)) {
      try {
        const reason = targetStatus === 'RETURNED' ? 'return' : 'cancel';
        await restoreOrderStockAtomic(order, reason, `Auto-restored via ${sourceLabel} (${rawCourierStatus})`);
      } catch (err) {
        console.error(`Failed to restore stock for order ${orderNumber}:`, err);
      }
    }
  }

  const timelineNote = `Steadfast Status: ${rawCourierStatus} (অর্ডার আপডেট: ${targetStatus})`;

  const updatedDoc = await Order.findOneAndUpdate(
    { orderNumber },
    {
      $set: updateFields,
      $push: {
        timeline: {
          status: targetStatus,
          timestamp: now.toISOString(),
          note: timelineNote,
        },
        statusHistory: {
          status: targetStatus,
          note: timelineNote,
          changedBy: sourceLabel,
          timestamp: now,
        },
      },
    },
    { new: true }
  );

  // Sync with local memory cache if present
  try {
    updateOrderStatus(orderNumber, targetStatus as any, timelineNote);
  } catch {
    // Ignore memory store errors
  }

  return {
    orderNumber,
    consignmentId,
    trackingCode,
    oldStatus,
    newStatus: targetStatus,
    courierStatus: rawCourierStatus,
    changed: true,
    message: `Order ${orderNumber} updated from ${oldStatus} to ${targetStatus}`,
  };
}

/**
 * Background worker function to scan all active in-transit orders and sync their Steadfast statuses
 */
export async function syncAllActiveSteadfastOrders(options?: {
  batchSize?: number;
  source?: 'cron' | 'manual';
}): Promise<{
  scannedCount: number;
  updatedCount: number;
  unchangedCount: number;
  failedCount: number;
  results: CourierSyncResult[];
}> {
  await connectToDatabase();
  const courier = getCourierProvider();
  const batchSize = options?.batchSize || 50;
  const source = options?.source || 'cron';

  // Find orders currently in SHIPPED, PROCESSING, or CONFIRMED state with a tracking code or consignment ID
  const activeOrders = await Order.find({
    status: { $in: ['SHIPPED', 'PROCESSING', 'CONFIRMED'] },
    $or: [
      { trackingCode: { $exists: true, $ne: '' } },
      { consignmentId: { $exists: true, $ne: '' } },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(batchSize)
    .lean();

  const results: CourierSyncResult[] = [];
  let updatedCount = 0;
  let unchangedCount = 0;
  let failedCount = 0;

  // Process in small concurrent chunks (concurrency: 5) to respect Steadfast rate limits
  const CHUNK_SIZE = 5;
  for (let i = 0; i < activeOrders.length; i += CHUNK_SIZE) {
    const chunk = activeOrders.slice(i, i + CHUNK_SIZE);
    const chunkPromises = chunk.map(async (ord) => {
      const identifier = ord.trackingCode || ord.consignmentId;
      if (!identifier) return null;

      try {
        const statusRes = await courier.checkStatus(identifier);
        const rawCourierStatus = (statusRes.rawResponse?.delivery_status || statusRes.status || '').toString();

        if (!rawCourierStatus) {
          return {
            orderNumber: ord.orderNumber,
            oldStatus: ord.status,
            newStatus: ord.status,
            courierStatus: 'UNKNOWN',
            changed: false,
            message: 'No status returned from Steadfast',
          };
        }

        const syncResult = await applyCourierStatusToOrder(ord, rawCourierStatus, source);
        return syncResult;
      } catch (err: any) {
        failedCount++;
        return {
          orderNumber: ord.orderNumber,
          oldStatus: ord.status,
          newStatus: ord.status,
          courierStatus: 'ERROR',
          changed: false,
          message: err?.message || 'Error checking status',
        };
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    for (const res of chunkResults) {
      if (res) {
        results.push(res);
        if (res.changed) {
          updatedCount++;
        } else {
          unchangedCount++;
        }
      }
    }
  }

  return {
    scannedCount: activeOrders.length,
    updatedCount,
    unchangedCount,
    failedCount,
    results,
  };
}

