import { NextRequest, NextResponse } from 'next/server';
import {
  getAllAttributes as getMemoryAttributes,
  addAttribute as addMemoryAttribute,
  updateAttribute as updateMemoryAttribute,
  deleteAttribute as deleteMemoryAttribute,
  AttributeItem,
} from '@/lib/store';
import { connectToDatabase } from '@/lib/mongodb';
import { Attribute } from '@/models/Attribute';

export async function GET() {
  try {
    try {
      await connectToDatabase();
      const dbAttrs = await Attribute.find().sort({ displayOrder: 1, createdAt: 1 }).lean();
      if (dbAttrs && dbAttrs.length > 0) {
        return NextResponse.json({
          success: true,
          count: dbAttrs.length,
          attributes: dbAttrs,
          source: 'mongodb',
        });
      }
    } catch (dbErr) {
      console.warn('MongoDB error in GET /api/attributes (falling back to memory):', dbErr);
    }

    const memoryAttrs = getMemoryAttributes();
    return NextResponse.json({
      success: true,
      count: memoryAttrs.length,
      attributes: memoryAttrs,
      source: 'memory',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error fetching attributes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.nameBn || !body.nameEn) {
      return NextResponse.json(
        { success: false, message: 'Attribute name in Bangla and English is required' },
        { status: 400 }
      );
    }

    const code =
      body.code ||
      body.nameEn
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

    const newAttrData: AttributeItem = {
      id: body.id || `attr-${code}-${Date.now()}`,
      code,
      nameBn: body.nameBn,
      nameEn: body.nameEn,
      type: body.type || 'select',
      categories: Array.isArray(body.categories) && body.categories.length > 0 ? body.categories : ['ALL'],
      options: Array.isArray(body.options) ? body.options : [],
      displayOrder: body.displayOrder ?? 0,
      isActive: body.isActive ?? true,
    };

    let createdAttr: any = null;
    try {
      await connectToDatabase();
      createdAttr = await Attribute.findOneAndUpdate(
        { code },
        { $set: newAttrData },
        { upsert: true, new: true }
      ).lean();
    } catch (dbErr: any) {
      console.warn('MongoDB error in POST /api/attributes:', dbErr.message);
    }

    const memoryAttr = addMemoryAttribute(newAttrData);

    return NextResponse.json(
      {
        success: true,
        message: 'Attribute created successfully',
        attribute: createdAttr || memoryAttr,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error creating attribute' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json();
    const id = searchParams.get('id') || searchParams.get('code') || body.id || body.code;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Attribute id or code is required' },
        { status: 400 }
      );
    }

    const updates = {
      nameBn: body.nameBn,
      nameEn: body.nameEn,
      code: body.code,
      type: body.type,
      categories: body.categories,
      options: body.options,
      displayOrder: body.displayOrder,
      isActive: body.isActive,
    };

    Object.keys(updates).forEach((k) => (updates as any)[k] === undefined && delete (updates as any)[k]);

    let updatedDoc: any = null;
    try {
      await connectToDatabase();
      updatedDoc = await Attribute.findOneAndUpdate(
        { $or: [{ code: id }, { id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { $set: updates },
        { new: true }
      ).lean();
    } catch (dbErr: any) {
      console.warn('MongoDB error in PUT /api/attributes:', dbErr.message);
    }

    const memUpdated = updateMemoryAttribute(id, updates);

    return NextResponse.json({
      success: true,
      message: 'Attribute updated successfully',
      attribute: updatedDoc || memUpdated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error updating attribute' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || searchParams.get('code');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Attribute id or code is required' },
        { status: 400 }
      );
    }

    try {
      await connectToDatabase();
      await Attribute.deleteOne({
        $or: [{ code: id }, { id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
    } catch (dbErr: any) {
      console.warn('MongoDB error in DELETE /api/attributes:', dbErr.message);
    }

    deleteMemoryAttribute(id);

    return NextResponse.json({
      success: true,
      message: 'Attribute deleted successfully',
      id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error deleting attribute' },
      { status: 500 }
    );
  }
}
