import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { BundleTier } from '@/models/BundleTier';
import { BundleSetting } from '@/models/BundleSetting';

async function getMaxDiscount() {
  const setting = await BundleSetting.findOne().lean();
  return setting?.maxDiscountPercent ?? 20;
}

export async function GET() {
  try {
    await connectToDatabase();
    let tiers = await BundleTier.find().sort({ minQuantity: 1 }).lean();

    // Seed defaults if empty
    if (tiers.length === 0) {
      const defaultTiers = [
        { minQuantity: 2, discountPercent: 5, isActive: true, sortOrder: 1 },
        { minQuantity: 3, discountPercent: 10, isActive: true, sortOrder: 2 },
        { minQuantity: 4, discountPercent: 15, isActive: true, sortOrder: 3 },
      ];
      await BundleTier.insertMany(defaultTiers);
      tiers = await BundleTier.find().sort({ minQuantity: 1 }).lean();
    }

    return NextResponse.json({ success: true, tiers });
  } catch (err: any) {
    console.error('Error in GET /api/bundle-tiers:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { minQuantity, discountPercent, isActive = true, sortOrder = 0 } = body;

    const qty = parseInt(minQuantity, 10);
    const disc = parseFloat(discountPercent);

    if (isNaN(qty) || qty < 1) {
      return NextResponse.json(
        { success: false, message: 'Minimum quantity must be a positive integer.' },
        { status: 400 }
      );
    }

    if (isNaN(disc) || disc < 0 || disc > 100) {
      return NextResponse.json(
        { success: false, message: 'Discount percentage must be between 0 and 100.' },
        { status: 400 }
      );
    }

    const maxDiscount = await getMaxDiscount();
    if (disc > maxDiscount) {
      return NextResponse.json(
        {
          success: false,
          message: `Discount percentage (${disc}%) cannot exceed the global maximum discount (${maxDiscount}%).`,
        },
        { status: 400 }
      );
    }

    // Check duplicate minQuantity
    const existing = await BundleTier.findOne({ minQuantity: qty });
    if (existing) {
      return NextResponse.json(
        { success: false, message: `A tier for ${qty} items already exists.` },
        { status: 400 }
      );
    }

    const newTier = await BundleTier.create({
      minQuantity: qty,
      discountPercent: disc,
      isActive: Boolean(isActive),
      sortOrder: Number(sortOrder) || qty,
    });

    return NextResponse.json({ success: true, tier: newTier }, { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /api/bundle-tiers:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, _id, minQuantity, discountPercent, isActive, sortOrder } = body;
    const tierId = id || _id;

    if (!tierId) {
      return NextResponse.json({ success: false, message: 'Tier ID is required.' }, { status: 400 });
    }

    const tier = await BundleTier.findById(tierId);
    if (!tier) {
      return NextResponse.json({ success: false, message: 'Tier not found.' }, { status: 404 });
    }

    if (discountPercent !== undefined) {
      const disc = parseFloat(discountPercent);
      if (isNaN(disc) || disc < 0 || disc > 100) {
        return NextResponse.json(
          { success: false, message: 'Discount percentage must be between 0 and 100.' },
          { status: 400 }
        );
      }
      const maxDiscount = await getMaxDiscount();
      if (disc > maxDiscount) {
        return NextResponse.json(
          {
            success: false,
            message: `Discount percentage (${disc}%) cannot exceed the global maximum discount (${maxDiscount}%).`,
          },
          { status: 400 }
        );
      }
      tier.discountPercent = disc;
    }

    if (minQuantity !== undefined) {
      const qty = parseInt(minQuantity, 10);
      if (isNaN(qty) || qty < 1) {
        return NextResponse.json(
          { success: false, message: 'Minimum quantity must be a positive integer.' },
          { status: 400 }
        );
      }
      // Check collision with another tier
      const collision = await BundleTier.findOne({ minQuantity: qty, _id: { $ne: tier._id } });
      if (collision) {
        return NextResponse.json(
          { success: false, message: `Another tier for ${qty} items already exists.` },
          { status: 400 }
        );
      }
      tier.minQuantity = qty;
    }

    if (isActive !== undefined) {
      tier.isActive = Boolean(isActive);
    }

    if (sortOrder !== undefined) {
      tier.sortOrder = Number(sortOrder);
    }

    await tier.save();
    return NextResponse.json({ success: true, tier });
  } catch (err: any) {
    console.error('Error in PUT /api/bundle-tiers:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Tier ID is required.' }, { status: 400 });
    }

    await BundleTier.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Tier deleted successfully.' });
  } catch (err: any) {
    console.error('Error in DELETE /api/bundle-tiers:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

