import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { User, IUser } from '@/models/User';
import { getJwtSecretKey } from './config';

export const ADMIN_COOKIE_NAME = 'crafty_admin_token';

export interface AdminTokenPayload {
  email: string;
  role: string;
  name?: string;
  userId?: string;
  permissions?: string[];
  isSuperAdmin?: boolean;
}

export interface FreshAdminUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  isSuperAdmin: boolean;
}

/**
 * Check if user is Super Admin (unrestricted access)
 */
export function isSuperAdminRole(user?: { role?: string; email?: string } | null): boolean {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  const envAdminEmail = (process.env.ADMIN_EMAIL || 'admin@craftykidsco.com').toLowerCase().trim();
  const userEmail = (user.email || '').toLowerCase().trim();

  return (
    role === 'super_admin' ||
    role === 'admin' ||
    Boolean(envAdminEmail && userEmail && userEmail === envAdminEmail) ||
    Boolean(userEmail && userEmail === 'admin@craftykidsco.com')
  );
}

/**
 * Reusable helper: checks if a user has a specific permission key.
 * Super Admin always has full access and cannot be restricted.
 */
export function hasPermission(
  user?: { role?: string; email?: string; permissions?: string[] } | null,
  permissionKey?: string | null
): boolean {
  if (!user) return false;
  if (!permissionKey) return true; // No permission required

  // 1. Super Admin always has full access
  if (isSuperAdminRole(user)) {
    return true;
  }

  // 2. Moderators have only the permissions saved on their account
  if (Array.isArray(user.permissions)) {
    return user.permissions.includes(permissionKey);
  }

  return false;
}

/**
 * Sign an admin JWT session token with a 7-day expiration and HS256 algorithm
 */
export async function signAdminToken(payload: AdminTokenPayload): Promise<string> {
  const secretKey = getJwtSecretKey();
  const cleanPayload = {
    ...payload,
    role: payload.role || 'moderator',
    isSuperAdmin: isSuperAdminRole(payload),
  };

  return await new SignJWT(cleanPayload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

/**
 * Verify an admin JWT token with strict HS256 algorithm enforcement
 */
export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    if (!token) return null;
    const secretKey = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    const role = String(payload.role || '').toLowerCase();
    const allowedRoles = [
      'admin',
      'super_admin',
      'moderator',
      'order_handler',
      'product_manager',
    ];

    if (!allowedRoles.includes(role)) {
      // Check if it matches fallback env admin
      const envEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
      const tokenEmail = String(payload.email || '').toLowerCase().trim();
      if (!envEmail || tokenEmail !== envEmail) {
        return null;
      }
    }

    return payload as unknown as AdminTokenPayload;
  } catch (err: any) {
    return null;
  }
}

/**
 * Retrieve current admin session from server components or route handlers
 */
export async function getAdminSession(req?: NextRequest): Promise<AdminTokenPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(ADMIN_COOKIE_NAME)?.value || req.cookies.get('admin_session')?.value;
    // Also support Authorization header Bearer token if called from external clients
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(ADMIN_COOKIE_NAME)?.value || cookieStore.get('admin_session')?.value;
    } catch {
      token = undefined;
    }
  }

  if (!token) return null;
  return await verifyAdminToken(token);
}

/**
 * Fetches fresh user from MongoDB Atlas on every request to ensure
 * permission updates or deactivations take effect immediately without re-login.
 */
export async function getFreshAdminUser(session: AdminTokenPayload): Promise<FreshAdminUser | null> {
  try {
    await connectToDatabase();
    const cleanEmail = session.email?.toLowerCase().trim();

    // 1. Look up user by ID or Email
    let dbUser: any = null;
    if (session.userId && session.userId.match(/^[0-9a-fA-F]{24}$/)) {
      dbUser = await User.findById(session.userId).lean();
    }
    if (!dbUser && cleanEmail) {
      dbUser = await User.findOne({ email: cleanEmail }).lean();
    }

    // 2. If user exists in DB
    if (dbUser) {
      // If user has been deactivated by Super Admin, deny immediately
      if (dbUser.isActive === false) {
        return null;
      }

      const isSuper = isSuperAdminRole(dbUser);
      return {
        userId: String(dbUser._id),
        email: dbUser.email || cleanEmail,
        name: dbUser.name || 'Admin',
        role: dbUser.role || (isSuper ? 'super_admin' : 'moderator'),
        permissions: Array.isArray(dbUser.permissions) ? dbUser.permissions : [],
        isActive: true,
        isSuperAdmin: isSuper,
      };
    }

    // 3. Fallback: Virtual Super Admin from environment variables
    const envAdminEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.toLowerCase().trim() : null;
    if (envAdminEmail && cleanEmail === envAdminEmail) {
      return {
        userId: 'env-super-admin',
        email: cleanEmail,
        name: session.name || 'Super Admin',
        role: 'super_admin',
        permissions: ['*'],
        isActive: true,
        isSuperAdmin: true,
      };
    }

    return null;
  } catch (err) {
    console.error('Error fetching fresh admin user:', err);
    // If DB is temporarily unreachable but session has Super Admin role
    if (isSuperAdminRole(session)) {
      return {
        userId: session.userId || 'session-super-admin',
        email: session.email,
        name: session.name || 'Super Admin',
        role: 'super_admin',
        permissions: ['*'],
        isActive: true,
        isSuperAdmin: true,
      };
    }
    return null;
  }
}

/**
 * Set the HTTP-Only secure cookie for the admin session
 */
export function setAdminSessionCookie(response: NextResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });
}

/**
 * Clear the admin session cookie on logout
 */
export function clearAdminSessionCookie(response: NextResponse): void {
  const isProduction = process.env.NODE_ENV === 'production';
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}

/**
 * Protect API route handlers:
 * 1. Checks JWT session
 * 2. Fetches fresh user from MongoDB Atlas (instant permission refresh / deactivation)
 * 3. Enforces optional requiredPermission with 403 Forbidden
 */
export async function verifyAdminRequest(
  req: NextRequest,
  requiredPermission?: string
): Promise<
  | { authorized: true; user: FreshAdminUser }
  | { authorized: false; response: NextResponse }
> {
  const session = await getAdminSession(req);
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'প্রবেশাধিকার সংরক্ষিত। অনুগ্রহ করে এডমিন হিসেবে লগইন করুন।',
        },
        { status: 401 }
      ),
    };
  }

  // Fetch fresh user from DB
  const freshUser = await getFreshAdminUser(session);
  if (!freshUser || !freshUser.isActive) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে অথবা ব্যবহারকারী খুঁজে পাওয়া যায়নি।',
        },
        { status: 401 }
      ),
    };
  }

  // Enforce required permission if specified
  if (requiredPermission && !hasPermission(freshUser, requiredPermission)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: `অনুমতি নেই: এই কাজটি সম্পন্ন করতে আপনার '${requiredPermission}' পারমিশন প্রয়োজন।`,
          requiredPermission,
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, user: freshUser };
}

/**
 * Higher-order wrapper to enforce permission on route handlers
 */
export function requirePermission(
  permissionKey: string,
  handler: (req: NextRequest, auth: { authorized: true; user: FreshAdminUser }) => Promise<NextResponse>
) {
  return async function (req: NextRequest) {
    const auth = await verifyAdminRequest(req, permissionKey);
    if (!auth.authorized) {
      return auth.response;
    }
    return handler(req, auth);
  };
}

/**
 * Validate admin credentials against MongoDB Atlas User model,
 * falling back to configured environment variables.
 */
export async function validateAdminCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; user?: AdminTokenPayload; message?: string }> {
  const cleanEmail = email.toLowerCase().trim();

  // 1. First, check if MongoDB Atlas has this user
  try {
    await connectToDatabase();
    const dbUser = await User.findOne({
      $or: [{ email: cleanEmail }, { phone: cleanEmail }],
      role: {
        $in: [
          'super_admin',
          'moderator',
          'ADMIN',
          'PRODUCT_MANAGER',
          'ORDER_HANDLER',
        ],
      },
      isActive: true,
    }).lean();

    if (dbUser && dbUser.passwordHash) {
      const isMatch = await bcrypt.compare(password, dbUser.passwordHash);
      if (isMatch) {
        const isSuper = isSuperAdminRole(dbUser);
        return {
          success: true,
          user: {
            email: dbUser.email || cleanEmail,
            role: dbUser.role || (isSuper ? 'super_admin' : 'moderator'),
            name: dbUser.name || (isSuper ? 'Super Admin' : 'Moderator'),
            userId: String(dbUser._id),
            permissions: Array.isArray(dbUser.permissions) ? dbUser.permissions : [],
            isSuperAdmin: isSuper,
          },
        };
      }
    }
  } catch (dbErr) {
    console.warn('Notice: MongoDB check during admin login failed or disconnected:', dbErr);
  }

  // 2. Validate against Environment Variables if configured (no hardcoded passwords or emails)
  const envAdminEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.toLowerCase().trim() : null;
  const envAdminPassword = process.env.ADMIN_PASSWORD;

  if (envAdminEmail && envAdminPassword && cleanEmail === envAdminEmail && password === envAdminPassword) {
    return {
      success: true,
      user: {
        email: cleanEmail,
        role: 'super_admin',
        name: 'Super Admin',
        userId: 'env-super-admin',
        permissions: ['*'],
        isSuperAdmin: true,
      },
    };
  }

  return {
    success: false,
    message: 'ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
  };
}
