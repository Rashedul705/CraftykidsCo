import { NextRequest, NextResponse } from 'next/server';
import { getAllCategories, addCategory } from '@/lib/store';
import { SampleCategory } from '@/lib/sample-data';

export async function GET() {
  try {
    const categories = getAllCategories();
    return NextResponse.json({ success: true, count: categories.length, categories });
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

    const newCategory: SampleCategory = {
      slug: body.slug || body.nameEn.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
      nameBn: body.nameBn,
      nameEn: body.nameEn,
      description: body.description || '',
      imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=400&q=80',
      badgeColor: body.badgeColor || '#FFE8D6',
      children: body.children || [],
    };

    addCategory(newCategory);

    return NextResponse.json(
      { success: true, message: 'ক্যাটাগরি সফলভাবে যুক্ত হয়েছে', category: newCategory },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'ক্যাটাগরি সংরক্ষণে ত্রুটি' },
      { status: 500 }
    );
  }
}
