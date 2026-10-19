import { NextRequest, NextResponse } from 'next/server';
import { getAllCategories as getMemoryCategories, addCategory as addMemoryCategory } from '@/lib/store';
import { SampleCategory } from '@/lib/sample-data';
import { connectToDatabase } from '@/lib/mongodb';
import { Category } from '@/models/Category';

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
    };

    let createdCategory: any = null;

    try {
      await connectToDatabase();
      const dbDoc = await Category.create(newCategoryData);
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
