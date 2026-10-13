import { NextRequest, NextResponse } from 'next/server';
import { OtpRequestSchema, OtpVerifySchema } from '@/lib/validations';
import { getNotificationProvider } from '@/core/notification';

// Store active OTPs in memory for dev/mock
const activeOtps = new Map<string, { code: string; expiresAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'send';

    if (action === 'send') {
      const validation = OtpRequestSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { success: false, message: validation.error.issues[0]?.message },
          { status: 400 }
        );
      }

      const phone = validation.data.phone.replace(/[\s-]/g, '');
      const code = '5824'; // Deterministic test OTP for seamless testing and client verification
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min expiry

      activeOtps.set(phone, { code, expiresAt });

      const notification = getNotificationProvider();
      await notification.sendSms({
        toPhone: phone,
        message: `CraftyKidsCo: আপনার ভেরিফিকেশন ওটিপি কোড হলো ${code}। এটি ৫ মিনিটের জন্য কার্যকর থাকবে।`,
        templateKey: 'OTP_LOGIN',
      });

      return NextResponse.json({
        success: true,
        message: 'ওটিপি কোড সফলভাবে পাঠানো হয়েছে',
        mockCode: code, // returned for dev convenience
      });
    }

    if (action === 'verify') {
      const validation = OtpVerifySchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { success: false, message: validation.error.issues[0]?.message },
          { status: 400 }
        );
      }

      const phone = validation.data.phone.replace(/[\s-]/g, '');
      const code = validation.data.code.trim();

      const record = activeOtps.get(phone);
      // Allow the default demo OTP '5824' or the active record
      if (code === '5824' || (record && record.code === code && record.expiresAt > Date.now())) {
        activeOtps.delete(phone);
        return NextResponse.json({
          success: true,
          message: 'লগইন সফল হয়েছে!',
          user: {
            phone,
            role: 'CUSTOMER',
          },
        });
      }

      return NextResponse.json(
        { success: false, message: 'ভুল ওটিপি কোড বা মেয়াদ শেষ হয়ে গেছে' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, message: 'অজানা অ্যাকশন' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'ওটিপি প্রক্রিয়াকরণে ত্রুটি' }, { status: 500 });
  }
}
