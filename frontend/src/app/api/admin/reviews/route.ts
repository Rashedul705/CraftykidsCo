import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Review } from '@/models/Review';
import { verifyAdminRequest } from '@/lib/auth';

/**
 * GET /api/admin/reviews
 * Fetch customer reviews for admin moderation panel with filtering & search.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all'; // 'all', 'pending', 'approved', 'rejected'
    const search = searchParams.get('search')?.trim();

    await connectToDatabase();

    const query: any = {};

    if (status === 'pending') {
      query.isApproved = false;
      query.$or = [{ adminNote: { $ne: 'REJECTED' } }, { adminNote: { $exists: false } }];
    } else if (status === 'approved') {
      query.isApproved = true;
    } else if (status === 'rejected') {
      query.isApproved = false;
      query.adminNote = 'REJECTED';
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { authorName: regex },
        { comment: regex },
        { productTitle: regex },
        { customerPhone: regex },
      ];
    }

    const reviews = await Review.find(query).sort({ createdAt: -1 }).limit(150).lean();

    // Summary counts
    const pendingCount = await Review.countDocuments({
      isApproved: false,
      $or: [{ adminNote: { $ne: 'REJECTED' } }, { adminNote: { $exists: false } }],
    });
    const approvedCount = await Review.countDocuments({ isApproved: true });
    const totalCount = await Review.countDocuments({});

    const formattedReviews = reviews.map((r: any) => ({
      id: r._id?.toString() || r.id,
      productId: r.productId,
      productSlug: r.productSlug,
      productTitle: r.productTitle || 'Product',
      productImage: r.productImage || '',
      authorName: r.authorName,
      customerPhone: r.customerPhone || '',
      rating: r.rating,
      comment: r.comment,
      photos: r.photos || [],
      isVerified: r.isVerified || false,
      isApproved: r.isApproved || false,
      adminNote: r.adminNote || '',
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      success: true,
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        total: totalCount,
      },
      reviews: formattedReviews,
    });
  } catch (error: any) {
    console.error('Admin reviews fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'রিভিউ লোড করতে ব্যর্থ হয়েছে।' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/reviews
 * Moderate review: Approve, Reject, or update admin note.
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { id, isApproved, adminNote } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'রিভিউ আইডি প্রয়োজন।' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updateFields: any = {};
    if (typeof isApproved === 'boolean') {
      updateFields.isApproved = isApproved;
    }
    if (adminNote !== undefined) {
      updateFields.adminNote = String(adminNote);
    }

    const updated = await Review.findByIdAndUpdate(id, { $set: updateFields }, { returnDocument: 'after' }).lean();

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'রিভিউ পাওয়া যায়নি।' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: isApproved ? 'রিভিউ সফলভাবে অনুমোদিত হয়েছে।' : 'রিভিউ রিজেক্ট করা হয়েছে।',
      review: updated,
    });
  } catch (error: any) {
    console.error('Admin review update error:', error);
    return NextResponse.json(
      { success: false, message: 'রিভিউ আপডেট করতে ব্যর্থ হয়েছে।' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/reviews
 * Permanently delete a review.
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'রিভিউ আইডি প্রয়োজন।' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    await Review.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'রিভিউ মুছে ফেলা হয়েছে।',
    });
  } catch (error: any) {
    console.error('Admin review delete error:', error);
    return NextResponse.json(
      { success: false, message: 'রিভিউ মুছতে ব্যর্থ হয়েছে।' },
      { status: 500 }
    );
  }
}

