import { NextRequest, NextResponse } from 'next/server';
import { sendMetaCapiEvent, MetaCapiEventPayload } from '@/lib/meta-capi';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.eventName) {
      return NextResponse.json(
        { success: false, message: 'eventName is required' },
        { status: 400 }
      );
    }

    // Extract client IP address from proxy headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || undefined);

    // Extract user agent
    const clientUserAgent = req.headers.get('user-agent') || undefined;

    // Extract Facebook cookies (_fbp and _fbc)
    const fbp = body.userData?.fbp || req.cookies.get('_fbp')?.value;
    const fbc = body.userData?.fbc || req.cookies.get('_fbc')?.value;

    const payload: MetaCapiEventPayload = {
      eventName: body.eventName,
      eventId: body.eventId || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      eventTime: body.eventTime || Math.floor(Date.now() / 1000),
      eventSourceUrl: body.eventSourceUrl || req.headers.get('referer') || undefined,
      actionSource: 'website',
      userData: {
        ...(body.userData || {}),
        clientIp,
        clientUserAgent,
        fbp,
        fbc,
      },
      customData: body.customData || {},
      testEventCode: body.testEventCode,
    };

    const result = await sendMetaCapiEvent(payload);

    return NextResponse.json({
      success: result.success,
      eventId: payload.eventId,
      eventsReceived: result.eventsReceived,
      fbTraceId: result.fbTraceId,
      message: result.message,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal tracking error';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
