import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Expense } from '@/models/Expense';
import { verifyAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req, 'reports.view');
    if (!auth.authorized) {
      return auth.response;
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '30d'; // 'today', '7d', '30d', 'all', 'custom'
    const month = searchParams.get('month'); // e.g. '2026-11'
    const category = searchParams.get('category');
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    const filter: any = {};

    if (category && category !== 'ALL') {
      filter.category = category;
    }

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [yearStr, monthStr] = month.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10) - 1;
      const startOfMonth = new Date(y, m, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(y, m + 1, 0, 23, 59, 59, 999);
      filter.date = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (customStart || customEnd) {
      filter.date = {};
      if (customStart) filter.date.$gte = new Date(customStart);
      if (customEnd) filter.date.$lte = new Date(customEnd);
    } else if (range !== 'all') {
      const now = new Date();
      if (range === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        filter.date = { $gte: startOfDay };
      } else if (range === '7d') {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filter.date = { $gte: start };
      } else if (range === '30d') {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filter.date = { $gte: start };
      }
    }

    const expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 }).lean();

    let totalAmount = 0;
    const categoryBreakdown: Record<string, { total: number; count: number }> = {
      FB_ADS: { total: 0, count: 0 },
      PACKAGING: { total: 0, count: 0 },
      COURIER: { total: 0, count: 0 },
      SALARY: { total: 0, count: 0 },
      OFFICE_RENT: { total: 0, count: 0 },
      SOFTWARE_SMS: { total: 0, count: 0 },
      OTHER: { total: 0, count: 0 },
    };

    for (const exp of expenses) {
      const amt = Number(exp.amount) || 0;
      totalAmount += amt;
      const cat = exp.category || 'OTHER';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { total: 0, count: 0 };
      }
      categoryBreakdown[cat].total += amt;
      categoryBreakdown[cat].count += 1;
    }

    return NextResponse.json({
      success: true,
      count: expenses.length,
      totalAmount,
      categoryBreakdown,
      expenses,
    });
  } catch (error: any) {
    console.error('Fetch expenses error:', error);
    return NextResponse.json(
      { success: false, message: 'খরচের তালিকা লোড করতে ত্রুটি: ' + (error.message || '') },
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

    await connectToDatabase();

    const body = await req.json();
    const { title, category, amount, date, paymentMethod, note, receiptUrl } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { success: false, message: 'খরচের বিবরণ/শিরোনাম আবশ্যক।' },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'সঠিক খরচের পরিমাণ (টাকা) প্রদান করুন।' },
        { status: 400 }
      );
    }

    const validCategories = [
      'FB_ADS',
      'PACKAGING',
      'COURIER',
      'SALARY',
      'OFFICE_RENT',
      'SOFTWARE_SMS',
      'OTHER',
    ];
    const cat = validCategories.includes(category) ? category : 'OTHER';

    const recordedBy = auth.user?.name || auth.user?.email || 'Admin';

    const expenseDate = date ? new Date(date) : new Date();

    const expense = await Expense.create({
      title: title.trim(),
      category: cat,
      amount: Math.round(numAmount),
      date: expenseDate,
      paymentMethod: paymentMethod?.trim() || 'Cash',
      note: note?.trim() || '',
      receiptUrl: receiptUrl?.trim() || '',
      recordedBy,
    });

    return NextResponse.json({
      success: true,
      message: 'ব্যয় সফলভাবে রেকর্ড করা হয়েছে।',
      expense,
    });
  } catch (error: any) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      { success: false, message: 'ব্যয় যুক্ত করতে ত্রুটি: ' + (error.message || '') },
      { status: 500 }
    );
  }
}
