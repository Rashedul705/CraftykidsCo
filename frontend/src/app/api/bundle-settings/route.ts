import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { BundleSetting } from '@/models/BundleSetting';
import { BundleTier } from '@/models/BundleTier';

async function getOrCreateSettings() {
  await connectToDatabase();
  let setting = await BundleSetting.findOne().lean();
  if (!setting) {
    const created = await BundleSetting.create({
      maxDiscountPercent: 20,
      showOutOfStockMode: 'greyed',
    });
    setting = created.toObject();
  }
  return setting;
}

export async function GET() {
  try {
    const setting = await getOrCreateSettings();
    return NextResponse.json({ success: true, setting });
  } catch (err: any) {
    console.error('Error in GET /api/bundle-settings:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { maxDiscountPercent, showOutOfStockMode } = body;

    if (maxDiscountPercent !== undefined) {
      const num = Number(maxDiscountPercent);
      if (isNaN(num) || num < 0 || num > 100) {
        return NextResponse.json(
          { success: false, message: 'Max discount must be a percentage between 0 and 100.' },
          { status: 400 }
        );
      }
    }

    if (showOutOfStockMode && !['greyed', 'hidden'].includes(showOutOfStockMode)) {
      return NextResponse.json(
        { success: false, message: 'showOutOfStockMode must be either "greyed" or "hidden".' },
        { status: 400 }
      );
    }

    let setting = await BundleSetting.findOne();
    if (!setting) {
      setting = new BundleSetting();
    }

    if (maxDiscountPercent !== undefined) {
      setting.maxDiscountPercent = Number(maxDiscountPercent);
    }
    if (showOutOfStockMode) {
      setting.showOutOfStockMode = showOutOfStockMode;
    }

    await setting.save();

    return NextResponse.json({ success: true, setting });
  } catch (err: any) {
    console.error('Error in PUT /api/bundle-settings:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

