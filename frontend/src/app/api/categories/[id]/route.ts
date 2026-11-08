import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import {
  updateCategory as updateMemoryCategory,
  deleteCategory as deleteMemoryCategory,
  getAllCategories as getMemoryCategories,
} from '@/lib/store';
import { connectToDatabase } from '@/lib/mongodb';
import { Category } from '@/models/Category';
import { verifyAdminRequest } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    let foundCategory: any = null;

    try {
      await connectToDatabase();
      const isHex = /^[0-9a-fA-F]{24}$/.test(id);
      const filter = isHex
        ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { slug: id }] }
        : { slug: id };
      foundCategory = await Category.findOne(filter).lean();
    } catch (dbErr) {
      console.warn('MongoDB error in GET /api/categories/[id]:', dbErr);
    }

    if (!foundCategory) {
      const memoryCats = getMemoryCategories();
      foundCategory = memoryCats.find((c) => c.slug === id || (c as any).id === id || (c as any)._id === id);
    }

    if (!foundCategory) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, category: foundCategory });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyAdminRequest(req, 'categories.manage');
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;
    const body = await req.json();

    const updates: any = {
      name: body.nameEn || body.name,
      nameBn: body.nameBn,
      nameEn: body.nameEn,
      description: body.description,
      imageUrl: body.imageUrl,
      badgeColor: body.badgeColor,
      children: body.children,
      attributes: body.attributes,
    };

    if (body.slug) {
      updates.slug = body.slug;
    }

    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    let updatedDoc: any = null;
    try {
      await connectToDatabase();
      const isHex = /^[0-9a-fA-F]{24}$/.test(id);
      const filter = isHex
        ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { slug: id }] }
        : { slug: id };

      updatedDoc = await Category.findOneAndUpdate(
        filter,
        { $set: updates },
        { new: true }
      ).lean();
    } catch (dbErr: any) {
      console.warn('MongoDB error in PUT /api/categories/[id]:', dbErr.message);
    }

    const memUpdated = updateMemoryCategory(id, updates);

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      category: updatedDoc || memUpdated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyAdminRequest(req, 'categories.manage');
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;

    try {
      await connectToDatabase();
      const isHex = /^[0-9a-fA-F]{24}$/.test(id);
      const filter = isHex
        ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { slug: id }] }
        : { slug: id };

      await Category.deleteOne(filter);
    } catch (dbErr: any) {
      console.warn('MongoDB error in DELETE /api/categories/[id]:', dbErr.message);
    }

    deleteMemoryCategory(id);

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
      id,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
