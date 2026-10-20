import { NextRequest, NextResponse } from 'next/server';
import {
  getAllCategories as getMemoryCategories,
  addCategory as addMemoryCategory,
  updateCategory as updateMemoryCategory,
  deleteCategory as deleteMemoryCategory,
} from '@/lib/store';
import { SampleCategory } from '@/lib/sample-data';
import { connectToDatabase } from '@/lib/mongodb';
import { Category } from '@/models/Category';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET() {
  try {
    try {
      await connectToDatabase();
      const dbCategories = await Category.find().sort({ order: 1, displayOrder: 1 }).lean();
      if (dbCategories && dbCategories.length > 0) {
        return NextResponse.json({
          success: true,
          count: dbCategories.length,
          categories: dbCategories,
          source: 'mongodb',
        });
      }
    } catch (dbErr) {
      console.warn('MongoDB error in GET /api/categories (falling back to memory):', dbErr);
    }

    const categories = getMemoryCategories();
    return NextResponse.json({ success: true, count: categories.length, categories, source: 'memory' });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'ক্যাটাগরি তালিকা লোড করতে ত্রুটি' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();

    if (!body.nameBn || !body.nameEn) {
      return NextResponse.json(
        { success: false, message: 'ক্যাটাগরির নাম (বাংলা ও ইংরেজি) আবশ্যক' },
        { status: 400 }
      );
    }

    const slug = body.slug || body.nameEn.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const newCategoryData = {
      name: body.nameEn,
      nameBn: body.nameBn,
      nameEn: body.nameEn,
      slug,
      description: body.description || '',
      imageUrl: body.imageUrl || 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg',
      badgeColor: body.badgeColor || '#FFE8D6',
      children: body.children || [],
      attributes: body.attributes || [],
    };

    let createdCategory: any = null;

    try {
      await connectToDatabase();
      const dbDoc = await Category.findOneAndUpdate(
        { slug },
        { $set: newCategoryData },
        { upsert: true, new: true }
      );
      createdCategory = dbDoc.toObject ? dbDoc.toObject() : dbDoc;
    } catch (dbErr: any) {
      console.error('Failed to save category in MongoDB:', dbErr.message);
    }

    const sampleCat: SampleCategory = {
      slug,
      nameBn: body.nameBn,
      nameEn: body.nameEn,
      description: newCategoryData.description,
      imageUrl: newCategoryData.imageUrl,
      badgeColor: newCategoryData.badgeColor,
      children: newCategoryData.children,
      attributes: newCategoryData.attributes,
    };
    addMemoryCategory(sampleCat);

    return NextResponse.json(
      { success: true, message: 'ক্যাটাগরি সফলভাবে যুক্ত হয়েছে', category: createdCategory || sampleCat },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'ক্যাটাগরি সংরক্ষণে ত্রুটি' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const body = await req.json();
    const slug = searchParams.get('slug') || body.slug || body.id;

    if (!slug) {
      return NextResponse.json(
        { success: false, message: 'Category slug is required' },
        { status: 400 }
      );
    }

    const updates = {
      name: body.nameEn || body.name,
      nameBn: body.nameBn,
      nameEn: body.nameEn,
      description: body.description,
      imageUrl: body.imageUrl,
      badgeColor: body.badgeColor,
      children: body.children,
      attributes: body.attributes,
    };

    // Clean undefined values
    Object.keys(updates).forEach((k) => (updates as any)[k] === undefined && delete (updates as any)[k]);

    let updatedDoc: any = null;
    try {
      await connectToDatabase();
      updatedDoc = await Category.findOneAndUpdate(
        { $or: [{ slug }, { _id: slug.match(/^[0-9a-fA-F]{24}$/) ? slug : null }] },
        { $set: updates },
        { new: true }
      ).lean();
    } catch (dbErr: any) {
      console.warn('MongoDB error in PUT /api/categories:', dbErr.message);
    }

    const memUpdated = updateMemoryCategory(slug, updates);

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      category: updatedDoc || memUpdated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error updating category' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug') || searchParams.get('id');

    if (!slug) {
      return NextResponse.json(
        { success: false, message: 'Category slug or id is required' },
        { status: 400 }
      );
    }

    try {
      await connectToDatabase();
      await Category.deleteOne({
        $or: [{ slug }, { _id: slug.match(/^[0-9a-fA-F]{24}$/) ? slug : null }],
      });
    } catch (dbErr: any) {
      console.warn('MongoDB error in DELETE /api/categories:', dbErr.message);
    }

    deleteMemoryCategory(slug);

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
      slug,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error deleting category' },
      { status: 500 }
    );
  }
}
