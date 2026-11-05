import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { verifySmtpConnection, sendTestEmail, getSmtpConfig } from '@/lib/mailer';

export async function GET(req: NextRequest) {
  try {
    // Check admin authorization
    const auth = await verifyAdminRequest(req);
    // In local development, also allow convenience access for testing
    if (!auth.authorized && process.env.NODE_ENV === 'production') {
      return auth.response;
    }

    const config = getSmtpConfig();
    const verifyResult = await verifySmtpConnection();

    return NextResponse.json({
      success: verifyResult.success,
      status: verifyResult.success ? 'CONNECTED' : 'DISCONNECTED',
      message: verifyResult.message,
      smtp: {
        host: config.host,
        port: config.port,
        user: config.user,
        passConfigured: Boolean(config.pass),
        from: config.from,
        notifyEmail: config.notifyEmail,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        status: 'ERROR',
        message: err?.message || 'Failed to inspect SMTP status',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check admin authorization
    const auth = await verifyAdminRequest(req);
    // In local development, also allow convenience access for testing
    if (!auth.authorized && process.env.NODE_ENV === 'production') {
      return auth.response;
    }

    let targetEmail: string | undefined;
    try {
      const body = await req.json();
      if (body?.to) {
        targetEmail = String(body.to).trim();
      }
    } catch {
      // Body is optional; defaults to NOTIFY_EMAIL
    }

    const result = await sendTestEmail(targetEmail);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      messageId: result.messageId,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || 'Failed to trigger test email',
      },
      { status: 500 }
    );
  }
}

