import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { getCourierProvider } from '@/core/courier';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const courier = getCourierProvider();
    if (courier.getBalance) {
      const balanceData = await courier.getBalance();
      return NextResponse.json({
        success: balanceData.success,
        balance: balanceData.balance,
        currency: balanceData.currency,
        provider: courier.name,
        message: balanceData.message,
      });
    }

    return NextResponse.json({
      success: true,
      balance: 0,
      currency: 'BDT',
      provider: courier.name,
      message: 'Provider does not support direct balance queries',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to query courier balance' },
      { status: 500 }
    );
  }
}
