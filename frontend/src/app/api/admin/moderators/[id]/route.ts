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
} from '@/lib/permissions';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminRequest(req, 'users.manage');
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;
    await connectToDatabase();

    const user = await User.findById(id).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'মডারেটর খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      moderator: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive !== false,
        permissions: Array.isArray(user.permissions) ? user.permissions : [],
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error fetching moderator' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminRequest(req, 'users.manage');
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;
    const body = await req.json();
    const { name, permissions, isActive, password } = body;

    await connectToDatabase();

    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'মডারেটর খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    // Protect Super Admin from losing Super Admin status or being restricted via moderator route
    const isTargetSuperAdmin =
      existingUser.role === 'super_admin' || existingUser.role === 'ADMIN';

    if (isTargetSuperAdmin && permissions !== undefined) {
      return NextResponse.json(
        {
          success: false,
          message: 'সুপার এডমিনের পারমিশন সীমাবদ্ধ করা সম্ভব নয়। সুপার এডমিনের সর্বদা পূর্ণ প্রবেশাধিকার থাকে।',
        },
        { status: 400 }
      );
    }

    const updateFields: any = { updatedAt: new Date() };

    if (name && typeof name === 'string') {
      updateFields.name = name.trim();
    }

    if (typeof isActive === 'boolean') {
      updateFields.isActive = isActive;
    }

    if (password && typeof password === 'string' && password.length >= 6) {
      updateFields.passwordHash = await bcrypt.hash(password, 10);
    }

    const oldPermissions: string[] = Array.isArray(existingUser.permissions)
      ? existingUser.permissions
      : [];

    let newPermissions: string[] = oldPermissions;

    if (Array.isArray(permissions)) {
      // Validate permission keys & reject unknown or super admin only keys
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

      // Enforce dependency rules (ticking edit auto-ticks view, unticking view unticks edit/delete)
      newPermissions = enforcePermissionDependencies(permissions);
      updateFields.permissions = newPermissions;
    }

    const updatedUser = await User.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

    // Activity Logging
    try {
      const added = newPermissions.filter((p) => !oldPermissions.includes(p));
      const removed = oldPermissions.filter((p) => !newPermissions.includes(p));

      await ActivityLog.create({
        actorId: auth.user.userId,
        actorEmail: auth.user.email,
        actorName: auth.user.name,
        action:
          isActive !== undefined && isActive !== existingUser.isActive
            ? 'MODERATOR_STATUS_CHANGED'
            : 'MODERATOR_PERMISSIONS_UPDATED',
        targetUserId: id,
        targetUserEmail: existingUser.email,
        details: {
          targetName: existingUser.name,
          oldPermissions,
          newPermissions,
          added,
          removed,
          status: updatedUser?.isActive ? 'ACTIVE' : 'INACTIVE',
        },
      });
    } catch (logErr) {
      console.warn('Failed to record activity log:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: 'মডারেটরের তথ্য ও পারমিশন সফলভাবে আপডেট করা হয়েছে।',
      moderator: {
        id: String(updatedUser?._id),
        name: updatedUser?.name,
        email: updatedUser?.email,
        role: updatedUser?.role,
        isActive: updatedUser?.isActive,
        permissions: updatedUser?.permissions,
        updatedAt: updatedUser?.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Update moderator error:', error);
    return NextResponse.json(
      { success: false, message: 'মডারেটর আপডেট করতে ত্রুটি হয়েছে: ' + (error.message || '') },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminRequest(req, 'users.manage');
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;

    // Prevent deleting own account
    if (auth.user.userId === id) {
      return NextResponse.json(
        { success: false, message: 'আপনি নিজের অ্যাকাউন্ট ডিলিট করতে পারবেন না।' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: 'মডারেটর পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    // Prevent deleting super admin
    if (targetUser.role === 'super_admin' || targetUser.role === 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'সুপার এডমিন অ্যাকাউন্ট ডিলিট করা নিষিদ্ধ।' },
        { status: 403 }
      );
    }

    await User.findByIdAndDelete(id);

    // Activity log
    try {
      await ActivityLog.create({
        actorId: auth.user.userId,
        actorEmail: auth.user.email,
        actorName: auth.user.name,
        action: 'MODERATOR_DELETED',
        targetUserId: id,
        targetUserEmail: targetUser.email,
        details: {
          deletedName: targetUser.name,
          deletedPermissions: targetUser.permissions,
        },
      });
    } catch (logErr) {
      console.warn('Failed to record activity log:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: 'মডারেটর সফলভাবে মুছে ফেলা হয়েছে।',
      id,
    });
  } catch (error: any) {
    console.error('Delete moderator error:', error);
    return NextResponse.json(
      { success: false, message: 'মডারেটর ডিলিট করতে ত্রুটি হয়েছে: ' + (error.message || '') },
      { status: 500 }
    );
  }
}
