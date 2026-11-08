import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { GiftItem } from '@/models/GiftItem';
import { GiftCategory } from '@/models/GiftCategory';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const active = searchParams.get('active');
    const categoryId = searchParams.get('categoryId');
    const suggestions = searchParams.get('suggestions');
    const compulsory = searchParams.get('compulsory');

    const query: any = {};
    if (active === 'true') {
      query.isActive = { $ne: false };
    }
    if (categoryId) {
      query.categoryId = categoryId;
    }
    if (suggestions === 'true') {
      query.showInSuggestions = true;
    }
    if (compulsory === 'true') {
      query.isCompulsory = true;
    }

    const items = await GiftItem.find(query).sort({ sortOrder: 1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    console.error('Error in GET /api/gift-items:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const {
      name,
      image = '',
      price,
      stock,
      categoryId,
      categoryName = '',
      showInSuggestions = false,
      isCompulsory = false,
      suggestionMessage = '',
      isActive = true,
      sortOrder = 0,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: 'Gift item name is required.' }, { status: 400 });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ success: false, message: 'Valid price is required.' }, { status: 400 });
    }

    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return NextResponse.json({ success: false, message: 'Valid non-negative stock is required.' }, { status: 400 });
    }

    // Lookup categoryName if not provided
    let catName = categoryName;
    if (!catName && categoryId) {
      const cat = await GiftCategory.findById(categoryId).lean();
      if (cat) catName = cat.name;
    }

    const item = await GiftItem.create({
      name: name.trim(),
      image,
      price: parsedPrice,
      stock: parsedStock,
      categoryId: categoryId || 'general',
      categoryName: catName || 'General',
      showInSuggestions: Boolean(showInSuggestions),
      isCompulsory: Boolean(isCompulsory),
      suggestionMessage: suggestionMessage?.trim() || '',
      isActive: Boolean(isActive),
      sortOrder: Number(sortOrder) || 0,
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /api/gift-items:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const {
      id,
      _id,
      name,
      image,
      price,
      stock,
      categoryId,
      categoryName,
      showInSuggestions,
      isCompulsory,
      suggestionMessage,
      isActive,
      sortOrder,
    } = body;

    const itemId = id || _id;
    if (!itemId) {
      return NextResponse.json({ success: false, message: 'Gift item ID is required.' }, { status: 400 });
    }

    const item = await GiftItem.findById(itemId);
    if (!item) {
      return NextResponse.json({ success: false, message: 'Gift item not found.' }, { status: 404 });
    }

    if (name !== undefined) item.name = name.trim();
    if (image !== undefined) item.image = image;
    if (price !== undefined) {
      const p = parseFloat(price);
      if (!isNaN(p) && p >= 0) item.price = p;
    }
    if (stock !== undefined) {
      const s = parseInt(stock, 10);
      if (!isNaN(s) && s >= 0) item.stock = s;
    }
    if (categoryId !== undefined) {
      item.categoryId = categoryId;
      if (categoryName) {
        item.categoryName = categoryName;
      } else {
        const cat = await GiftCategory.findById(categoryId).lean();
        if (cat) item.categoryName = cat.name;
      }
    }
    if (showInSuggestions !== undefined) item.showInSuggestions = Boolean(showInSuggestions);
    if (isCompulsory !== undefined) item.isCompulsory = Boolean(isCompulsory);
    if (suggestionMessage !== undefined) item.suggestionMessage = suggestionMessage.trim();
    if (isActive !== undefined) item.isActive = Boolean(isActive);
    if (sortOrder !== undefined) item.sortOrder = Number(sortOrder);

    await item.save();
    return NextResponse.json({ success: true, item });
  } catch (err: any) {
    console.error('Error in PUT /api/gift-items:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * Quick inline stock update
 */
export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, _id, stock } = body;
    const itemId = id || _id;

    if (!itemId) {
      return NextResponse.json({ success: false, message: 'Item ID is required.' }, { status: 400 });
    }

    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return NextResponse.json({ success: false, message: 'Stock must be a non-negative integer.' }, { status: 400 });
    }

    const item = await GiftItem.findByIdAndUpdate(itemId, { stock: parsedStock }, { new: true });
    if (!item) {
      return NextResponse.json({ success: false, message: 'Item not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item });
  } catch (err: any) {
    console.error('Error in PATCH /api/gift-items:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Gift item ID is required.' }, { status: 400 });
    }

    await GiftItem.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Gift item deleted successfully.' });
  } catch (err: any) {
    console.error('Error in DELETE /api/gift-items:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

