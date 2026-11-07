import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { ActivityLog } from '@/models/ActivityLog';
import { verifyAdminRequest } from '@/lib/auth';
import {
  isValidPermission,
  isSuperAdminOnlyPermission,
  enforcePermissionDependencies,
  getAssignablePermissions,
} from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    // Only Super Admin can view and manage moderators
    const auth = await verifyAdminRequest(req, 'users.manage');
    if (!auth.authorized) {
      return auth.response;
    }

    await connectToDatabase();

    const moderators = await User.find({
      role: {
        $in: [
          'moderator',
          'MODERATOR',
          'super_admin',
          'ADMIN',
          'admin',
          'ORDER_HANDLER',
          'order_handler',
          'PRODUCT_MANAGER',
          'product_manager',
        ],
      },
    })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = moderators.map((m: any) => {
      const isSuper =
        m.role === 'super_admin' ||
        m.role === 'ADMIN' ||
        m.role === 'admin' ||
        (m.email && m.email.toLowerCase().includes('admin@craftykidsco.com'));

      return {
        id: String(m._id),
        name: m.name || 'Unnamed Staff',
        email: m.email || '',
        phone: m.phone || '',
        role: m.role || 'moderator',
        isSuperAdmin: isSuper,
        plainPassword: isSuper ? undefined : (m.plainPassword || ''),
        isActive: m.isActive !== false,
        permissions: Array.isArray(m.permissions) ? m.permissions : [],
        permissionsCount: Array.isArray(m.permissions) ? m.permissions.length : 0,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      count: formatted.length,
      moderators: formatted,
    });
  } catch (error: any) {
    console.error('Fetch moderators error:', error);
    return NextResponse.json(
      { success: false, message: 'মডারেটরদের তালিকা আনতে ব্যর্থ হয়েছে: ' + (error.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req, 'users.manage');
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { name, email, password, permissions = [], isActive = true } = body;

    // 1. Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'মডারেটরের নাম আবশ্যক।' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email || '').toLowerCase().trim();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, message: 'সঠিক ইমেইল এড্রেস প্রদান করুন।' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' },
        { status: 400 }
      );
    }

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, message: 'পারমিশন তালিকা একটি অ্যারে (Array) হতে হবে।' },
        { status: 400 }
      );
    }

    // 2. Validate permission keys & reject unknown or super-admin only keys
    for (const key of permissions) {
      if (!isValidPermission(key)) {
        return NextResponse.json(
          { success: false, message: `অকার্যকর পারমিশন কি: '${key}'` },
          { status: 400 }
        );
      }
      if (isSuperAdminOnlyPermission(key)) {
        return NextResponse.json(
          {
            success: false,
            message: `পারমিশন '${key}' শুধুমাত্র সুপার এডমিনদের জন্য নির্ধারিত এবং মডারেটরকে বরাদ্দ করা যাবে না।`,
          },
          { status: 400 }
        );
      }
    }

    // Apply dependency rules (e.g. edit requires view)
    const finalPermissions = enforcePermissionDependencies(permissions);

    await connectToDatabase();

    // Check if email already exists
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট নিবন্ধিত রয়েছে।' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create moderator (save plainPassword so Super Admin can see/retrieve it)
    const newModerator = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      plainPassword: password.trim(),
      role: 'moderator',
      permissions: finalPermissions,
      isActive: Boolean(isActive),
    });

    // 3. Activity Logging
    try {
      await ActivityLog.create({
        actorId: auth.user.userId,
        actorEmail: auth.user.email,
        actorName: auth.user.name,
        action: 'MODERATOR_CREATED',
        targetUserId: String(newModerator._id),
        targetUserEmail: cleanEmail,
        details: {
          name: name.trim(),
          permissions: finalPermissions,
          permissionsCount: finalPermissions.length,
        },
      });
    } catch (logErr) {
      console.warn('Failed to write activity log:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: 'নতুন মডারেটর সফলভাবে তৈরি হয়েছে।',
      moderator: {
        id: String(newModerator._id),
        name: newModerator.name,
        email: newModerator.email,
        role: newModerator.role,
        isActive: newModerator.isActive,
        permissions: newModerator.permissions,
        createdAt: newModerator.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Create moderator error:', error);
    return NextResponse.json(
      { success: false, message: 'মডারেটর তৈরি করতে ত্রুটি হয়েছে: ' + (error.message || '') },
      { status: 500 }
    );
  }
}

