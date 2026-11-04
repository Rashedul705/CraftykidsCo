import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';

const ALLOWED_ADMIN_ROLES = [
  'admin',
  'super_admin',
  'moderator',
  'order_handler',
  'product_manager',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Allow 403 Access Denied page without redirect
  if (pathname === '/admin/403') {
    return NextResponse.next();
  }

  const token =
    request.cookies.get(ADMIN_COOKIE_NAME)?.value ||
    request.cookies.get('admin_session')?.value;
  const session = token ? await verifyAdminToken(token) : null;
  const isAuthenticated = Boolean(
    session && ALLOWED_ADMIN_ROLES.includes((session.role || '').toLowerCase())
  );

  // Case 1: If visiting /admin/login while already logged in -> redirect to /admin
  if (pathname === '/admin/login') {
    if (request.nextUrl.searchParams.has('reauth') || request.nextUrl.searchParams.has('logout')) {
      return NextResponse.next();
    }
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // Case 2: If visiting any /admin route without valid auth -> redirect to /admin/login
  if (!isAuthenticated) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Case 3: Authenticated admin or moderator -> proceed
  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ['/admin/:path*'],
};
