import { NextResponse } from 'next/server';
import { clearAdminSessionCookie } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'লগআউট সম্পন্ন হয়েছে।',
  });

  clearAdminSessionCookie(response);
  return response;
}
