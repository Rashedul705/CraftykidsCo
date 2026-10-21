import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { getCourierProvider } from '@/core/courier';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const trackingCode = searchParams.get('trackingCode') || searchParams.get('code');

    if (!trackingCode) {
      return NextResponse.json(
        { success: false, message: 'Tracking code or Consignment ID is required' },
        { status: 400 }
      );
    }

    const courier = getCourierProvider();
    const statusResult = await courier.checkStatus(trackingCode);

    return NextResponse.json({
      success: true,
      provider: courier.name,
      ...statusResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to query courier status' },
      { status: 500 }
    );
  }
}
