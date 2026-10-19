import { NextRequest, NextResponse } from 'next/server';
import { AdminLoginSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = AdminLoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const cleanEmail = email.toLowerCase().trim();

    // Default admin accounts for development & operations
    const validAdmins = [
      'admin@craftykidsco.com',
      'admin@rongdhonukids.com',
      'owner@craftykidsco.com',
    ];

    if (validAdmins.includes(cleanEmail) && (password === 'admin123' || password === 'craftykids2026')) {
      return NextResponse.json({
        success: true,
        message: 'এডমিন লগইন সফল হয়েছে!',
        user: {
          email: cleanEmail,
          role: 'ADMIN',
          name: 'Super Admin',
        },
      });
    }

    return NextResponse.json(
      { success: false, message: 'ভুল ইমেইল বা পাসওয়ার্ড' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: 'লগইনে ত্রুটি' }, { status: 500 });
  }
}
