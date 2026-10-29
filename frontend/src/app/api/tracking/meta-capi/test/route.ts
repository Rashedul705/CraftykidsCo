import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { sendMetaCapiEvent, getPixelConfiguration } from '@/lib/meta-capi';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json().catch(() => ({}));
    const pixelConfig = await getPixelConfiguration();

    const pixelId = body.pixelId || pixelConfig.pixelId;
    const capiToken = body.capiToken || pixelConfig.capiToken;
    const testEventCode = body.testEventCode || pixelConfig.testEventCode;

    if (!pixelId) {
      return NextResponse.json(
        { success: false, message: 'পিক্সেল আইডি (Pixel ID) প্রদান করুন।' },
        { status: 400 }
      );
    }

    if (!capiToken) {
      return NextResponse.json(
        { success: false, message: 'কপি বা সিএপিআই এক্সেস টোকেন (CAPI Token) প্রদান করুন।' },
        { status: 400 }
      );
    }

    const testEventId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    const testPayload = {
      data: [
        {
          event_name: 'TestEvent',
          event_time: Math.floor(Date.now() / 1000),
          event_id: testEventId,
          event_source_url: 'https://craftykidsco.com/admin?tab=settings',
          action_source: 'website',
          user_data: {
            client_ip_address: clientIp,
            client_user_agent: req.headers.get('user-agent') || 'Mozilla/5.0 Admin Tester',
          },
          custom_data: {
            currency: 'BDT',
            value: 990,
            content_name: 'Test DIY Plaster Painting Kit',
            status: 'CAPI_TEST_SUCCESSFUL',
          },
        },
      ],
      ...(testEventCode ? { test_event_code: testEventCode } : {}),
    };

    const graphUrl = `https://graph.facebook.com/v21.0/${encodeURIComponent(pixelId)}/events`;

    const res = await fetch(graphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${capiToken}`,
      },
      body: JSON.stringify(testPayload),
    });

    const responseData = await res.json().catch(() => null);

    if (res.ok && responseData?.events_received) {
      return NextResponse.json({
        success: true,
        message: 'মেটা সিএপিআই (Conversions API) টেস্ট সফল হয়েছে!',
        eventsReceived: responseData.events_received,
        fbTraceId: responseData.fbtrace_id,
        testEventId,
        testEventCode: testEventCode || null,
      });
    }

    const errorMsg =
      responseData?.error?.message ||
      responseData?.message ||
      `Meta Graph API ত্রুটি কোড: ${res.status}`;

    return NextResponse.json(
      {
        success: false,
        message: errorMsg,
        rawResponse: responseData,
      },
      { status: 400 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'টেস্ট ইভেন্ট পাঠাতে ত্রুটি হয়েছে';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
