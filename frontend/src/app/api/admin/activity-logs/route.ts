import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ActivityLog } from '@/models/ActivityLog';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req, 'users.manage');
    if (!auth.authorized) {
      return auth.response;
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const targetUserId = searchParams.get('targetUserId');

    const filter: any = {};
    if (targetUserId) {
      filter.targetUserId = targetUserId;
    }

    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs: logs.map((l: any) => ({
        id: String(l._id),
        actorEmail: l.actorEmail,
        actorName: l.actorName,
        action: l.action,
        targetUserId: l.targetUserId,
        targetUserEmail: l.targetUserEmail,
        details: l.details || {},
        createdAt: l.createdAt,
      })),
    });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED' || error?.digest?.startsWith?.('NEXT_')) {
      throw error;
    }
    console.error('Fetch activity logs error:', error);
    return NextResponse.json(
      { success: false, message: 'অ্যাক্টিভিটি লগ আনতে ত্রুটি হয়েছে: ' + (error.message || '') },
      { status: 500 }
    );
  }
}

