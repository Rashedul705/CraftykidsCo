import { NextRequest, NextResponse } from 'next/server';
import { AdminLoginSchema } from '@/lib/validations';
import { validateAdminCredentials, signAdminToken, setAdminSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = AdminLoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.issues[0]?.message || 'ভুল তথ্য' },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const authResult = await validateAdminCredentials(email, password);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, message: authResult.message || 'ভুল ইমেইল বা পাসওয়ার্ড' },
        { status: 401 }
      );
    }

    // Generate signed JWT
    const token = await signAdminToken({
      email: authResult.user.email,
      role: 'ADMIN',
      name: authResult.user.name,
      userId: authResult.user.userId,
    });

    const response = NextResponse.json({
      success: true,
      message: 'এডমিন লগইন সফল হয়েছে!',
      user: authResult.user,
    });

    // Set HTTP-Only Cookie
    setAdminSessionCookie(response, token);

    return response;
  } catch (error: any) {
    console.error('Error during admin login:', error);
    return NextResponse.json(
      { success: false, message: 'সার্ভারে লগইনে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}
