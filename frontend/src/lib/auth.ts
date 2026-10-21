import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { getJwtSecretKey } from './config';

export const ADMIN_COOKIE_NAME = 'crafty_admin_token';

export interface AdminTokenPayload {
  email: string;
  role: 'ADMIN';
  name?: string;
  userId?: string;
}

/**
 * Sign an admin JWT session token with a 7-day expiration and HS256 algorithm
 */
export async function signAdminToken(payload: AdminTokenPayload): Promise<string> {
  const secretKey = getJwtSecretKey();
  return await new SignJWT({ ...payload })
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
    if (payload.role !== 'ADMIN') return null;
    return payload as unknown as AdminTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Retrieve current admin session from server components or route handlers
 */
export async function getAdminSession(req?: NextRequest): Promise<AdminTokenPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
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
      token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    } catch {
      token = undefined;
    }
  }

  if (!token) return null;
  return await verifyAdminToken(token);
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
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}

/**
 * Protect API route handlers: returns unauthorized response if caller is not an admin
 */
export async function verifyAdminRequest(
  req: NextRequest
): Promise<{ authorized: true; user: AdminTokenPayload } | { authorized: false; response: NextResponse }> {
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
  return { authorized: true, user: session };
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

  // 1. First, check if MongoDB Atlas has this admin user
  try {
    await connectToDatabase();
    const dbUser = await User.findOne({
      $or: [{ email: cleanEmail }, { phone: cleanEmail }],
      role: 'ADMIN',
      isActive: true,
    }).lean();

    if (dbUser && dbUser.passwordHash) {
      const isMatch = await bcrypt.compare(password, dbUser.passwordHash);
      if (isMatch) {
        return {
          success: true,
          user: {
            email: dbUser.email || cleanEmail,
            role: 'ADMIN',
            name: dbUser.name || 'Admin',
            userId: String(dbUser._id),
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
        role: 'ADMIN',
        name: 'Super Admin',
      },
    };
  }

  return {
    success: false,
    message: 'ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
  };
}
