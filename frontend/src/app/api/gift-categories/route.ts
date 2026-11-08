import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { GiftCategory } from '@/models/GiftCategory';

export async function GET() {
  try {
    await connectToDatabase();
    let categories = await GiftCategory.find().sort({ sortOrder: 1, createdAt: 1 }).lean();
    if (categories.length === 0) {
      await GiftCategory.create([
        { name: 'Gift Packaging & Boxes', sortOrder: 1, isActive: true },
        { name: 'Gift Accessories & Ribbons', sortOrder: 2, isActive: true },
        { name: 'Greeting Cards & Extras', sortOrder: 3, isActive: true },
      ]);
      categories = await GiftCategory.find().sort({ sortOrder: 1, createdAt: 1 }).lean();
    }
    return NextResponse.json({ success: true, categories });
  } catch (err: any) {
    console.error('Error in GET /api/gift-categories:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, sortOrder = 0, isActive = true } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: 'Category name is required.' }, { status: 400 });
    }

    const category = await GiftCategory.create({
      name: name.trim(),
      sortOrder: Number(sortOrder) || 0,
      isActive: Boolean(isActive),
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /api/gift-categories:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, _id, name, sortOrder, isActive } = body;
    const catId = id || _id;

    if (!catId) {
      return NextResponse.json({ success: false, message: 'Category ID is required.' }, { status: 400 });
    }

    const category = await GiftCategory.findById(catId);
    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found.' }, { status: 404 });
    }

    if (name !== undefined) category.name = name.trim();
    if (sortOrder !== undefined) category.sortOrder = Number(sortOrder);
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();
    return NextResponse.json({ success: true, category });
  } catch (err: any) {
    console.error('Error in PUT /api/gift-categories:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Category ID is required.' }, { status: 400 });
    }

    await GiftCategory.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err: any) {
    console.error('Error in DELETE /api/gift-categories:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

