import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { syncAllActiveSteadfastOrders } from '@/lib/courier-sync';

async function authorizeSyncRequest(req: NextRequest): Promise<boolean> {
  // 1. Check CRON_SECRET if passed from external cron scheduler
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    const xCronSecret = req.headers.get('x-cron-secret');
    const { searchParams } = new URL(req.url);
    const querySecret = searchParams.get('secret') || searchParams.get('key');

    if (
      authHeader === `Bearer ${cronSecret}` ||
      xCronSecret === cronSecret ||
      querySecret === cronSecret
    ) {
      return true;
    }
  }

  // 2. Check Admin Session
  const adminAuth = await verifyAdminRequest(req);
  return adminAuth.authorized;
}

export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await authorizeSyncRequest(req);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin session or CRON_SECRET required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const batchSize = parseInt(searchParams.get('limit') || '50', 10);
    const sourceParam = searchParams.get('source') === 'manual' ? 'manual' : 'cron';

    const syncReport = await syncAllActiveSteadfastOrders({
      batchSize: isNaN(batchSize) ? 50 : batchSize,
      source: sourceParam,
    });

    return NextResponse.json({
      success: true,
      message: `Steadfast courier sync completed. Scanned: ${syncReport.scannedCount}, Updated: ${syncReport.updatedCount}, Unchanged: ${syncReport.unchangedCount}`,
      ...syncReport,
    });
  } catch (error: any) {
    console.error('Steadfast Sync API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to sync Steadfast statuses: ' + (error.message || '') },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}

