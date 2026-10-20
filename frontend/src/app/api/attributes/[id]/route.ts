import { NextRequest, NextResponse } from 'next/server';
import {
  updateAttribute as updateMemoryAttribute,
  deleteAttribute as deleteMemoryAttribute,
  getAllAttributes as getMemoryAttributes,
} from '@/lib/store';
import { connectToDatabase } from '@/lib/mongodb';
import { Attribute } from '@/models/Attribute';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    let foundAttr: any = null;

    try {
      await connectToDatabase();
      foundAttr = await Attribute.findOne({
        $or: [{ code: id }, { id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      }).lean();
    } catch (dbErr) {
      console.warn('MongoDB error in GET /api/attributes/[id]:', dbErr);
    }

    if (!foundAttr) {
      const memoryAttrs = getMemoryAttributes();
      foundAttr = memoryAttrs.find((a) => a.code === id || a.id === id);
    }

    if (!foundAttr) {
      return NextResponse.json({ success: false, message: 'Attribute not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, attribute: foundAttr });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();

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
      console.warn('MongoDB error in PUT /api/attributes/[id]:', dbErr.message);
    }

    const memUpdated = updateMemoryAttribute(id, updates);

    return NextResponse.json({
      success: true,
      message: 'Attribute updated successfully',
      attribute: updatedDoc || memUpdated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    try {
      await connectToDatabase();
      await Attribute.deleteOne({
        $or: [{ code: id }, { id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });
    } catch (dbErr: any) {
      console.warn('MongoDB error in DELETE /api/attributes/[id]:', dbErr.message);
    }

    deleteMemoryAttribute(id);

    return NextResponse.json({
      success: true,
      message: 'Attribute deleted successfully',
      id,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
