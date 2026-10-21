import { NextRequest, NextResponse } from 'next/server';
import {
  getIncompleteOrders,
  saveIncompleteOrder,
  updateIncompleteOrderStatus,
  removeIncompleteOrder,
} from '@/lib/incomplete-orders-store';
import { createOrder, getAllProducts } from '@/lib/store';

export async function GET() {
  try {
    const list = getIncompleteOrders();
    return NextResponse.json({ success: true, incompleteOrders: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.phone) {
      return NextResponse.json({ success: false, message: 'Phone number is required' }, { status: 400 });
    }

    const saved = saveIncompleteOrder({
      phone: body.phone,
      customerName: body.customerName,
      district: body.district,
      address: body.address || body.fullAddress,
      items: body.items || [],
      subtotal: body.subtotal || 0,
      deliveryCharge: body.deliveryCharge || 60,
      totalAmount: body.totalAmount || (body.subtotal || 0) + (body.deliveryCharge || 60),
      notes: body.notes,
    });

    return NextResponse.json({ success: true, incompleteOrder: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, notes, action } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    // Special action: convert to order
    if (action === 'convert') {
      const allIncomplete = getIncompleteOrders();
      const inc = allIncomplete.find((item) => item.id === id);
      if (!inc) {
        return NextResponse.json({ success: false, message: 'Incomplete order not found' }, { status: 404 });
      }

      // Convert to full OrderRecord
      const newOrder = createOrder({
        customerName: inc.customerName || 'Customer',
        customerPhone: inc.phone,
        district: inc.district || 'Dhaka',
        fullAddress: inc.address || 'Address pending verification',
        customerNote: 'Converted from incomplete checkout by staff',
        subtotal: inc.subtotal,
        deliveryCharge: inc.deliveryCharge || 60,
        discountAmount: 0,
        totalAmount: inc.totalAmount,
        status: 'CONFIRMED',
        paymentStatus: 'UNPAID',
        paymentMethod: 'COD',
        source: 'phone',
        internalNote: `Recovered abandoned cart. Contacted at ${new Date().toLocaleTimeString('bn-BD')}`,
        items: inc.items.map((it, idx) => ({
          id: `conv-item-${idx}`,
          productId: 'prod-recovered',
          title: it.title,
          variationTitle: it.variationTitle,
          price: it.price,
          quantity: it.quantity,
          total: it.price * it.quantity,
          imageUrl: it.imageUrl,
        })),
      });

      updateIncompleteOrderStatus(id, 'CONVERTED', `Converted to order #${newOrder.orderNumber}`);

      return NextResponse.json({
        success: true,
        message: `Successfully converted to Order #${newOrder.orderNumber}`,
        order: newOrder,
      });
    }

    const updated = updateIncompleteOrderStatus(id, status, notes);
    return NextResponse.json({ success: true, incompleteOrder: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const removed = removeIncompleteOrder(id);
    return NextResponse.json({ success: removed });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
