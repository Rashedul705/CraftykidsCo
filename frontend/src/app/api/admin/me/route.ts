import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, getFreshAdminUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession(req);

    if (!session) {
      return NextResponse.json(
        { authenticated: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch fresh live user from MongoDB Atlas
    const freshUser = await getFreshAdminUser(session);

    if (!freshUser || !freshUser.isActive) {
      return NextResponse.json(
        { authenticated: false, message: 'User account is inactive or not found' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: freshUser.userId,
        email: freshUser.email,
        role: freshUser.role,
        name: freshUser.name,
        isSuperAdmin: freshUser.isSuperAdmin,
        permissions: freshUser.permissions,
        isActive: freshUser.isActive,
      },
    });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED' || error?.digest?.startsWith?.('NEXT_')) {
      throw error;
    }
    console.error('Error in GET /api/admin/me:', error);
    return NextResponse.json(
      { authenticated: false, message: error?.message || 'Authentication error' },
      { status: 401 }
    );
  }
}
