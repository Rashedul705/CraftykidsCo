import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/models/Setting';
import {
  getDeliverySettings,
  updateDeliverySettings,
  defaultDeliverySettings,
  DeliverySettings,
} from '@/lib/delivery-store';

export async function GET() {
  try {
    // 1. Try reading from MongoDB Setting
    try {
      await connectToDatabase();
      const doc = await Setting.findOne({ key: 'delivery_settings' }).lean();
      if (doc && doc.value) {
        const parsed = JSON.parse(doc.value);
        const merged: DeliverySettings = {
          ...defaultDeliverySettings,
          ...parsed,
        };
        updateDeliverySettings(merged);
        return NextResponse.json({ success: true, settings: merged, source: 'mongodb' });
      }
    } catch (dbErr) {
      console.warn('MongoDB error reading delivery_settings (using memory fallback):', dbErr);
    }

    // 2. Fallback to memory store
    return NextResponse.json({
      success: true,
      settings: getDeliverySettings(),
      source: 'memory',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message, settings: defaultDeliverySettings },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const updates: Partial<DeliverySettings> = {
      dhakaRate: Number(body.dhakaRate !== undefined ? body.dhakaRate : 60),
      suburbsRate: Number(body.suburbsRate !== undefined ? body.suburbsRate : 100),
      outsideDhakaRate: Number(body.outsideDhakaRate !== undefined ? body.outsideDhakaRate : 120),
      freeDeliveryThreshold: Number(body.freeDeliveryThreshold !== undefined ? body.freeDeliveryThreshold : 1000),
      codFee: Number(body.codFee !== undefined ? body.codFee : 0),
    };

    const updated = updateDeliverySettings(updates);

    // Save to MongoDB Setting
    try {
      await connectToDatabase();
      await Setting.findOneAndUpdate(
        { key: 'delivery_settings' },
        { key: 'delivery_settings', value: JSON.stringify(updated) },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      console.warn('MongoDB error saving delivery_settings:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery settings updated successfully',
      settings: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
