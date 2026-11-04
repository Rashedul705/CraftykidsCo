import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { applyCourierStatusToOrder } from '@/lib/courier-sync';

/**
 * GET: Webhook Verification & Health Check for Steadfast Courier Merchant Portal
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    provider: 'STEADFAST',
    service: 'CraftyKidsCo Steadfast Courier Webhook Listener',
    timestamp: new Date().toISOString(),
    supportedEvents: ['delivery_status', 'status_update', 'consignment_status'],
  });
}

/**
 * POST: Inbound Delivery Status Webhook from Steadfast Courier
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);

    if (!rawBody || typeof rawBody !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Invalid or empty webhook payload' },
        { status: 400 }
      );
    }

    // Extract payload properties supporting multiple Steadfast webhook variations
    const data = rawBody.data || rawBody.payload || rawBody;
    const invoice = (data.invoice || data.order_id || data.orderNumber || '').toString().trim();
    const consignmentId = (data.consignment_id || data.consignmentId || '').toString().trim();
    const trackingCode = (data.tracking_code || data.trackingCode || '').toString().trim();
    const rawStatus = (data.status || data.delivery_status || '').toString().trim();

    if (!rawStatus) {
      return NextResponse.json(
        { success: false, message: 'Delivery status is required in webhook payload' },
        { status: 400 }
      );
    }

    if (!invoice && !consignmentId && !trackingCode) {
      return NextResponse.json(
        { success: false, message: 'At least one order identifier (invoice, consignment_id, or tracking_code) is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const lookupQueries: any[] = [];
    if (invoice) {
      lookupQueries.push({ orderNumber: invoice });
      lookupQueries.push({ id: invoice });
    }
    if (consignmentId) {
      lookupQueries.push({ consignmentId });
    }
    if (trackingCode) {
      lookupQueries.push({ trackingCode });
    }

    const order = await Order.findOne({ $or: lookupQueries }).lean();

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: `Order matching invoice '${invoice}', consignment '${consignmentId}', or tracking '${trackingCode}' not found.`,
        },
        { status: 404 }
      );
    }

    const syncResult = await applyCourierStatusToOrder(order, rawStatus, 'webhook');

    return NextResponse.json({
      success: true,
      message: 'Steadfast webhook processed successfully',
      result: syncResult,
    });
  } catch (error: any) {
    console.error('Steadfast Webhook Processing Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error processing webhook: ' + (error.message || '') },
      { status: 500 }
    );
  }
}

