import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { runVariationsCleanup } from '@/lib/cleanup-service';

// GET /api/admin/cleanup-variations
// Preview audit report in dry-run mode
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) return auth.response;

    const report = await runVariationsCleanup({
      dryRun: true,
      disambiguateSkus: false,
      createBaselineLogs: true,
    });

    return NextResponse.json({
      success: true,
      dryRun: true,
      report,
    });
  } catch (err: any) {
    console.error('Error running variations cleanup audit:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to run variations cleanup audit' },
      { status: 500 }
    );
  }
}

// POST /api/admin/cleanup-variations
// Trigger variations cleanup with optional commit
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) return auth.response;

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun !== false; // Default true unless explicitly false
    const disambiguateSkus = Boolean(body.disambiguateSkus);
    const createBaselineLogs = body.createBaselineLogs !== false;

    const report = await runVariationsCleanup({
      dryRun,
      disambiguateSkus,
      createBaselineLogs,
    });

    return NextResponse.json({
      success: true,
      dryRun: report.dryRun,
      report,
    });
  } catch (err: any) {
    console.error('Error executing variations cleanup:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to execute variations cleanup' },
      { status: 500 }
    );
  }
}
