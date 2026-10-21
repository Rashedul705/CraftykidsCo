import { NextRequest, NextResponse } from 'next/server';
import { getCoupons, addCoupon, updateCoupon, deleteCoupon, validateCoupon } from '@/lib/coupons-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const subtotal = Number(searchParams.get('subtotal') || '0');

    if (code) {
      const result = validateCoupon(code, subtotal);
      return NextResponse.json({ success: true, ...result });
    }

    const coupons = getCoupons();
    return NextResponse.json({ success: true, coupons });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.code || !body.discountValue) {
      return NextResponse.json(
        { success: false, message: 'Coupon code and discount value are required' },
        { status: 400 }
      );
    }

    const created = addCoupon({
      code: body.code,
      discountType: body.discountType || 'percentage',
      discountValue: Number(body.discountValue),
      minOrderAmount: Number(body.minOrderAmount || 0),
      maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : undefined,
      usageLimit: body.usageLimit ? Number(body.usageLimit) : undefined,
      isActive: body.isActive !== undefined ? body.isActive : true,
      startDate: body.startDate || new Date().toISOString().split('T')[0],
      endDate: body.endDate || '2026-12-31',
      descriptionBn: body.descriptionBn || '',
    });

    return NextResponse.json({ success: true, coupon: created });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const updated = updateCoupon(id, updates);
    return NextResponse.json({ success: true, coupon: updated });
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

    const removed = deleteCoupon(id);
    return NextResponse.json({ success: removed });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
