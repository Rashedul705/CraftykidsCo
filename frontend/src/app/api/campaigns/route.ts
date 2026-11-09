import { NextRequest, NextResponse } from 'next/server';
import {
  getAllCampaigns,
  createCampaign,
  calculateSmsParts,
} from '@/lib/campaigns-store';
import { getNotificationProvider } from '@/core/notification';
import { verifyAdminRequest } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Campaign } from '@/models/Campaign';
import { Order } from '@/models/Order';
import { IncompleteOrder } from '@/models/IncompleteOrder';
import { Blocklist } from '@/models/Blocklist';
import { NotificationLog } from '@/models/Notification';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req, 'campaigns.sms');
    if (!auth.authorized) {
      return auth.response;
    }

    const provider = getNotificationProvider();
    const balanceInfo = await provider.getBalance();

    // Connect to database and fetch campaigns
    let campaigns: any[] = [];
    let segmentCounts: Record<string, number> = {
      all: 0,
      ordered_30d: 0,
      ordered_90d: 0,
      inactive_90d: 0,
      repeat_buyers: 0,
      category_art_kits: 0,
      district_dhaka: 0,
      abandoned_checkout: 0,
    };

    try {
      await connectToDatabase();
      const dbCampaigns = await Campaign.find().sort({ createdAt: -1 }).lean();
      if (dbCampaigns && dbCampaigns.length > 0) {
        campaigns = dbCampaigns.map((c: any) => ({
          ...c,
          id: c.id || c._id?.toString(),
        }));
      } else {
        campaigns = getAllCampaigns();
      }

      // Compute live audience counts
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const allOrders = await Order.find().lean();
      const uniquePhoneMap = new Map<string, { count: number; lastDate: Date; hasArt: boolean; isDhaka: boolean }>();

      for (const ord of allOrders) {
        const phone = (ord.customerPhone || '').replace(/[^0-9]/g, '');
        if (!phone || phone.length < 11) continue;

        const isDhaka = /dhaka|ঢাকা/i.test(ord.district || '') || /dhaka|ঢাকা/i.test(ord.fullAddress || '');
        const hasArt = (ord.items || []).some((it: any) =>
          /art|আর্ট|রং|মোম|crayon|paint|clay|ড্রয়িং/i.test(it.title || '')
        );
        const ordDate = ord.createdAt ? new Date(ord.createdAt) : new Date();

        if (!uniquePhoneMap.has(phone)) {
          uniquePhoneMap.set(phone, { count: 1, lastDate: ordDate, hasArt, isDhaka });
        } else {
          const rec = uniquePhoneMap.get(phone)!;
          rec.count += 1;
          if (ordDate > rec.lastDate) rec.lastDate = ordDate;
          if (hasArt) rec.hasArt = true;
          if (isDhaka) rec.isDhaka = true;
        }
      }

      const totalUnique = uniquePhoneMap.size;
      let count30d = 0;
      let count90d = 0;
      let countInactive90d = 0;
      let countRepeat = 0;
      let countArt = 0;
      let countDhaka = 0;

      uniquePhoneMap.forEach((info) => {
        if (info.lastDate >= thirtyDaysAgo) count30d++;
        if (info.lastDate >= ninetyDaysAgo) count90d++;
        if (info.lastDate < ninetyDaysAgo) countInactive90d++;
        if (info.count >= 2) countRepeat++;
        if (info.hasArt) countArt++;
        if (info.isDhaka) countDhaka++;
      });

      const abandonedCount = await IncompleteOrder.countDocuments();

      segmentCounts = {
        all: totalUnique,
        ordered_30d: count30d,
        ordered_90d: count90d,
        inactive_90d: countInactive90d,
        repeat_buyers: countRepeat,
        category_art_kits: countArt,
        district_dhaka: countDhaka,
        abandoned_checkout: abandonedCount,
      };
    } catch (dbErr) {
      console.warn('MongoDB error loading campaigns/segments:', dbErr);
      campaigns = getAllCampaigns();
    }

    return NextResponse.json({
      success: true,
      balance: balanceInfo.balance,
      currency: balanceInfo.currency,
      providerName: provider.name,
      campaigns,
      segmentCounts,
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
    const auth = await verifyAdminRequest(req, 'campaigns.sms');
    if (!auth.authorized) {
      return auth.response;
    }

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
        .replace(/{name}/g, 'সম্মানিত গ্রাহক')
        .replace(/{coupon}/g, body.couponCode || 'CRAFTY10')
        .replace(/{link}/g, process.env.NEXT_PUBLIC_APP_URL || 'craftykidsco.com');

      const result = await provider.sendSms({
        toPhone: phone,
        message: previewText,
        isMarketing: true,
        templateKey: 'MARKETING_PROMO',
      });

      return NextResponse.json({
        success: result.success,
        messageId: result.messageId,
        message: result.success ? `Test SMS dispatched to ${phone}` : result.error,
        error: result.error,
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
    const count = recipientCount || 1;
    const totalSms = count * smsCount;
    const costPerSms = 0.35;
    const totalCost = Math.round(totalSms * costPerSms * 100) / 100;

    let sentCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;

    // If launching immediately, gather real target audience and send
    if (sendNow) {
      try {
        await connectToDatabase();

        // 1. Get blocked numbers
        const blockedDocs = await Blocklist.find().lean();
        const blockedSet = new Set(blockedDocs.map((b: any) => String(b.value).trim()));

        // 2. Customers with open orders (if skipOpenOrders is active)
        const openOrderCustomerPhones = new Set<string>();
        if (skipOpenOrders) {
          const openOrders = await Order.find({
            status: { $in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] },
          }).lean();
          for (const ord of openOrders) {
            const p = (ord.customerPhone || '').replace(/[^0-9]/g, '');
            if (p) openOrderCustomerPhones.add(p);
          }
        }

        // 3. Customers who received marketing SMS in last 7 days (if fatigue protection active)
        const recentMarketingPhones = new Set<string>();
        if (skipRecentMarketing7d) {
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const recentLogs = await NotificationLog.find({
            event: 'MARKETING_PROMO',
            createdAt: { $gte: sevenDaysAgo },
          }).lean();
          for (const log of recentLogs) {
            const p = (log.recipient || '').replace(/[^0-9]/g, '');
            if (p) recentMarketingPhones.add(p);
          }
        }

        // 4. Retrieve candidate recipients by segment
        const recipientList: Array<{ name: string; phone: string }> = [];
        const seenPhones = new Set<string>();

        if (audienceSegment === 'abandoned_checkout') {
          const incOrders = await IncompleteOrder.find().lean();
          for (const inc of incOrders) {
            const phone = (inc.phone || '').replace(/[^0-9]/g, '');
            if (!phone || phone.length < 11 || seenPhones.has(phone)) continue;
            seenPhones.add(phone);
            recipientList.push({ name: inc.customerName || 'গ্রাহক', phone });
          }
        } else {
          const orders = await Order.find().sort({ createdAt: -1 }).lean();
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

          for (const ord of orders) {
            const phone = (ord.customerPhone || '').replace(/[^0-9]/g, '');
            if (!phone || phone.length < 11 || seenPhones.has(phone)) continue;

            const ordDate = ord.createdAt ? new Date(ord.createdAt) : new Date();
            const isDhaka = /dhaka|ঢাকা/i.test(ord.district || '') || /dhaka|ঢাকা/i.test(ord.fullAddress || '');
            const hasArt = (ord.items || []).some((it: any) =>
              /art|আর্ট|রং|মোম|crayon|paint|clay|ড্রয়িং/i.test(it.title || '')
            );

            // Filter by audience segment
            let matches = false;
            if (audienceSegment === 'all' || !audienceSegment) matches = true;
            else if (audienceSegment === 'ordered_30d' && ordDate >= thirtyDaysAgo) matches = true;
            else if (audienceSegment === 'ordered_90d' && ordDate >= ninetyDaysAgo) matches = true;
            else if (audienceSegment === 'inactive_90d' && ordDate < ninetyDaysAgo) matches = true;
            else if (audienceSegment === 'district_dhaka' && isDhaka) matches = true;
            else if (audienceSegment === 'category_art_kits' && hasArt) matches = true;
            else matches = true;

            if (matches) {
              seenPhones.add(phone);
              recipientList.push({ name: ord.customerName || 'গ্রাহক', phone });
            }
          }
        }

        // 5. Filter out blocked, recent marketing, and open order phones
        const finalRecipients = recipientList.filter((r) => {
          const clean = r.phone.slice(-11);
          if (blockedSet.has(clean) || blockedSet.has(r.phone)) return false;
          if (openOrderCustomerPhones.has(clean) || openOrderCustomerPhones.has(r.phone)) return false;
          if (recentMarketingPhones.has(clean) || recentMarketingPhones.has(r.phone)) return false;
          return true;
        });

        // 6. Build payloads and dispatch
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://craftykidsco.com';
        const payloads = finalRecipients.map((rec) => {
          const personalizedText = message
            .replace(/{name}/g, rec.name)
            .replace(/{coupon}/g, couponCode || '')
            .replace(/{link}/g, appUrl);
          return {
            toPhone: rec.phone,
            message: personalizedText,
            isMarketing: true,
            templateKey: 'MARKETING_PROMO' as const,
          };
        });

        if (payloads.length > 0) {
          const sendResults = await provider.sendBatch(payloads);
          sentCount = sendResults.filter((r) => r.success).length;
          deliveredCount = sentCount;
          failedCount = sendResults.length - sentCount;
        }
      } catch (sendErr) {
        console.error('Error dispatching marketing campaign SMS batch:', sendErr);
      }
    }

    const campaignId = `camp-${Date.now()}`;
    const campaignPayload = {
      id: campaignId,
      name,
      message,
      audienceSegment: audienceSegment || 'all',
      audienceLabel: audienceLabel || 'All Customers',
      recipientCount: sendNow ? (sentCount + failedCount || count) : count,
      smsPerRecipient: smsCount,
      totalSmsCount: (sendNow ? (sentCount + failedCount || count) : count) * smsCount,
      costPerSms,
      totalCost,
      status: sendNow ? ('completed' as const) : ('scheduled' as const),
      scheduledFor: sendNow ? undefined : scheduledFor,
      sentCount: sendNow ? sentCount : 0,
      deliveredCount: sendNow ? deliveredCount : 0,
      failedCount: sendNow ? failedCount : 0,
      couponCode: couponCode || undefined,
      couponUses: 0,
      skipOptOut: Boolean(skipOptOut),
      skipRecentMarketing7d: Boolean(skipRecentMarketing7d),
      skipOpenOrders: Boolean(skipOpenOrders),
      createdAt: new Date().toISOString(),
      sentAt: sendNow ? new Date().toISOString() : undefined,
    };

    // Save in memory store
    createCampaign(campaignPayload);

    // Save in MongoDB Atlas
    try {
      await connectToDatabase();
      await Campaign.create({
        ...campaignPayload,
        createdAt: new Date(),
        sentAt: sendNow ? new Date() : undefined,
      });
    } catch (saveErr) {
      console.warn('Could not persist campaign to MongoDB:', saveErr);
    }

    return NextResponse.json({
      success: true,
      campaign: campaignPayload,
      message: sendNow
        ? `Campaign dispatched! ${sentCount} SMS successfully sent via BulkSMSBD.`
        : `Campaign successfully scheduled for ${scheduledFor}!`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process campaign' },
      { status: 500 }
    );
  }
}
