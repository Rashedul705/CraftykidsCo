import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Expense } from '@/models/Expense';
import { verifyAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'খরচের আইডি আবশ্যক' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const deleted = await Expense.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'খরচের রেকর্ডটি পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ব্যয়ের রেকর্ড সফলভাবে মুছে ফেলা হয়েছে।',
      id,
    });
  } catch (error: any) {
    console.error('Delete expense error:', error);
    return NextResponse.json(
      { success: false, message: 'ব্যয় মুছতে ত্রুটি হয়েছে: ' + (error.message || '') },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'খরচের আইডি আবশ্যক' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { title, category, amount, date, paymentMethod, note } = body;

    await connectToDatabase();

    const updateFields: any = {};
    if (title && typeof title === 'string') updateFields.title = title.trim();
    if (category) updateFields.category = category;
    if (amount !== undefined) updateFields.amount = Math.max(0, Math.round(Number(amount) || 0));
    if (date) updateFields.date = new Date(date);
    if (paymentMethod) updateFields.paymentMethod = paymentMethod.trim();
    if (note !== undefined) updateFields.note = String(note).trim();

    const updated = await Expense.findByIdAndUpdate(id, updateFields, { new: true });
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'খরচের রেকর্ডটি পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ব্যয় সফলভাবে আপডেট করা হয়েছে।',
      expense: updated,
    });
  } catch (error: any) {
    console.error('Update expense error:', error);
    return NextResponse.json(
      { success: false, message: 'ব্যয় আপডেট করতে ত্রুটি: ' + (error.message || '') },
      { status: 500 }
    );
  }
}

