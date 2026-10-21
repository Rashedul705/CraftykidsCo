import { NextRequest, NextResponse } from 'next/server';
import {
  getAllCampaigns,
  createCampaign,
  calculateSmsParts,
} from '@/lib/campaigns-store';
import { getNotificationProvider } from '@/core/notification';

export async function GET(req: NextRequest) {
  try {
    const provider = getNotificationProvider();
    const balanceInfo = await provider.getBalance();
    const campaigns = getAllCampaigns();

    return NextResponse.json({
      success: true,
      balance: balanceInfo.balance,
      currency: balanceInfo.currency,
      providerName: provider.name,
      campaigns,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const provider = getNotificationProvider();

    // Action 1: Send Test SMS
    if (body.action === 'send-test') {
      const { phone, message } = body;
      if (!phone || !message) {
        return NextResponse.json(
          { success: false, error: 'Phone number and message are required' },
          { status: 400 }
        );
      }

      // Replace sample variables for test preview
      const previewText = message
        .replace(/{name}/g, 'আরিয়ান')
        .replace(/{coupon}/g, 'TEST10')
        .replace(/{link}/g, 'craftykidsco.com/deals');

      const result = await provider.sendSms({
        toPhone: phone,
        message: previewText,
        isMarketing: true,
        templateKey: 'MARKETING_PROMO',
      });

      return NextResponse.json({
        success: result.success,
        messageId: result.messageId,
        message: result.success ? 'Test SMS sent successfully!' : result.error,
      });
    }

    // Action 2: Launch / Schedule Campaign
    const {
      name,
      message,
      audienceSegment,
      audienceLabel,
      recipientCount,
      scheduledFor,
      sendNow,
      couponCode,
      skipOptOut,
      skipRecentMarketing7d,
      skipOpenOrders,
    } = body;

    if (!name || !message) {
      return NextResponse.json(
        { success: false, error: 'Campaign name and message are required' },
        { status: 400 }
      );
    }

    const { smsCount } = calculateSmsParts(message);
    const count = recipientCount || 100;
    const totalSms = count * smsCount;
    const costPerSms = 0.35;
    const totalCost = Math.round(totalSms * costPerSms * 100) / 100;

    const newCampaign = createCampaign({
      name,
      message,
      audienceSegment: audienceSegment || 'all',
      audienceLabel: audienceLabel || 'All Customers',
      recipientCount: count,
      smsPerRecipient: smsCount,
      totalSmsCount: totalSms,
      costPerSms,
      totalCost,
      status: sendNow ? 'completed' : 'scheduled',
      scheduledFor: sendNow ? undefined : scheduledFor,
      couponCode: couponCode || undefined,
      skipOptOut: !!skipOptOut,
      skipRecentMarketing7d: !!skipRecentMarketing7d,
      skipOpenOrders: !!skipOpenOrders,
    });

    return NextResponse.json({
      success: true,
      campaign: newCampaign,
      message: sendNow
        ? `Campaign dispatched to ${count} recipients in background queue!`
        : `Campaign scheduled for ${scheduledFor}!`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process campaign' },
      { status: 500 }
    );
  }
}
