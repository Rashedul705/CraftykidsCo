import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Blocklist } from '@/models/Blocklist';
import { verifyAdminRequest } from '@/lib/auth';

/**
 * GET /api/blocklist
 * Fetch all blocked phone numbers and IPs with optional search query
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req, 'customers.blocklist');
    if (!auth.authorized) {
      return auth.response;
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    const filter: any = {};
    if (query) {
      filter.$or = [
        { value: { $regex: query, $options: 'i' } },
        { reason: { $regex: query, $options: 'i' } },
      ];
    }

    const items = await Blocklist.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({
      success: true,
      count: items.length,
      items: items.map((item) => ({
        id: item._id.toString(),
        type: item.type,
        value: item.value,
        phone: item.value, // alias for admin UI table
        reason: item.reason || 'High return risk / Suspicious activity',
        date: new Date(item.createdAt || Date.now()).toISOString().split('T')[0],
        createdAt: item.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching blocklist:', error);
    return NextResponse.json(
      { success: false, message: 'ব্লকলিস্ট লোড করতে সমস্যা হয়েছে: ' + (error.message || '') },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blocklist
 * Add a new phone number or IP to the database blocklist
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req, 'customers.blocklist');
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const rawValue = (body.phone || body.value || '').trim();
    const reason = (body.reason || 'High return risk / Suspicious orders').trim();
    const type = (body.type || 'PHONE').toUpperCase();

    if (!rawValue) {
      return NextResponse.json(
        { success: false, message: 'ফোন নম্বর বা মান প্রদান করা আবশ্যক' },
        { status: 400 }
      );
    }

    // Normalize phone number (strip whitespace, dashes, +88 prefix)
    let cleanValue = rawValue.replace(/[\s\-\(\)\+]/g, '');
    if (type === 'PHONE') {
      if (cleanValue.startsWith('88')) cleanValue = cleanValue.slice(2);
      if (cleanValue.length < 10) {
        return NextResponse.json(
          { success: false, message: 'সঠিক মোবাইল নম্বর (১১ ডিজিট) দিন' },
          { status: 400 }
        );
      }
    }

    await connectToDatabase();

    // Check if duplicate already exists
    const existing = await Blocklist.findOne({
      $or: [
        { value: cleanValue },
        { value: cleanValue.slice(-11) },
      ],
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'এই নম্বরটি ইতিমধ্যে ব্লকলিস্টে রয়েছে' },
        { status: 409 }
      );
    }

    const doc = await Blocklist.create({
      type,
      value: cleanValue,
      reason,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'নম্বরটি সফলভাবে ব্লকলিস্টে যুক্ত করা হয়েছে।',
      item: {
        id: doc._id.toString(),
        type: doc.type,
        value: doc.value,
        phone: doc.value,
        reason: doc.reason,
        date: new Date(doc.createdAt).toISOString().split('T')[0],
        createdAt: doc.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error adding to blocklist:', error);
    return NextResponse.json(
      { success: false, message: 'ব্লকলিস্টে যোগ করতে ত্রুটি হয়েছে: ' + (error.message || '') },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/blocklist
 * Remove an entry from the database blocklist by ID or value
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req, 'customers.blocklist');
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const value = searchParams.get('value');

    if (!id && !value) {
      return NextResponse.json(
        { success: false, message: 'আইডি অথবা নম্বর আবশ্যক' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let result = null;
    if (id) {
      result = await Blocklist.findByIdAndDelete(id);
    } else if (value) {
      const cleanVal = value.replace(/[\s\-\(\)\+]/g, '');
      result = await Blocklist.findOneAndDelete({
        $or: [{ value }, { value: cleanVal }, { value: cleanVal.slice(-11) }],
      });
    }

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'নম্বরটি ব্লকলিস্টে খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'নম্বরটি সফলভাবে ব্লকলিস্ট থেকে সরানো হয়েছে (Unblocked)।',
    });
  } catch (error: any) {
    console.error('Error removing from blocklist:', error);
    return NextResponse.json(
      { success: false, message: 'ব্লকলিস্ট থেকে মুছতে ত্রুটি হয়েছে: ' + (error.message || '') },
      { status: 500 }
    );
  }
}

