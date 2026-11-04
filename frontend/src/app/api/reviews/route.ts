import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Review } from '@/models/Review';
import { Order } from '@/models/Order';

/**
 * GET /api/reviews
 * Fetch approved customer reviews and aggregate rating statistics for a product.
 * Query Params: ?productSlug=... OR ?productId=...
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productSlug = searchParams.get('productSlug')?.trim();
    const productId = searchParams.get('productId')?.trim();
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 100);

    await connectToDatabase();

    const query: any = { isApproved: true };

    if (productSlug && productId) {
      query.$or = [{ productSlug }, { productId }];
    } else if (productSlug) {
      query.productSlug = productSlug;
    } else if (productId) {
      query.productId = productId;
    }

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Calculate Aggregate Stats
    const totalReviews = reviews.length;
    let sumRating = 0;
    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const allPhotos: { url: string; authorName: string; rating: number; reviewId: string }[] = [];
    let verifiedCount = 0;

    for (const rev of reviews) {
      const r = Math.min(Math.max(Math.round(rev.rating || 5), 1), 5);
      ratingCounts[r] = (ratingCounts[r] || 0) + 1;
      sumRating += rev.rating || 5;

      if (rev.isVerified) verifiedCount++;

      if (Array.isArray(rev.photos) && rev.photos.length > 0) {
        for (const p of rev.photos) {
          if (p && typeof p === 'string' && p.trim()) {
            allPhotos.push({
              url: p.trim(),
              authorName: rev.authorName,
              rating: rev.rating,
              reviewId: String(rev._id),
            });
          }
        }
      }
    }

    const averageRating = totalReviews > 0 ? Number((sumRating / totalReviews).toFixed(1)) : 5.0;

    // Mask customer phone before returning to public client
    const safeReviews = reviews.map((rev: any) => {
      let maskedPhone = '';
      if (rev.customerPhone) {
        const clean = rev.customerPhone.replace(/\D/g, '');
        if (clean.length >= 8) {
          maskedPhone = `${clean.slice(0, 3)}****${clean.slice(-3)}`;
        }
      }

      return {
        id: rev._id?.toString() || rev.id,
        productId: rev.productId,
        productSlug: rev.productSlug,
        productTitle: rev.productTitle,
        authorName: rev.authorName,
        customerPhone: maskedPhone,
        rating: rev.rating,
        comment: rev.comment,
        photos: rev.photos || [],
        isVerified: rev.isVerified,
        createdAt: rev.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalReviews,
        averageRating,
        ratingCounts,
        verifiedCount,
        totalPhotos: allPhotos.length,
        photos: allPhotos,
      },
      reviews: safeReviews,
    });
  } catch (error: any) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json(
      { success: false, message: 'রিভিউ লোড করা সম্ভব হয়নি।' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Customer storefront endpoint to submit a review with optional craft photos.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productId,
      productSlug,
      productTitle,
      productImage,
      authorName,
      customerPhone,
      rating,
      comment,
      photos,
    } = body;

    // Validation
    if (!authorName || typeof authorName !== 'string' || authorName.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'অনুগ্রহ করে আপনার নাম সঠিকভাবে লিখুন (কমপক্ষে ২ অক্ষর)।' },
        { status: 400 }
      );
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { success: false, message: 'অনুগ্রহ করে ১ থেকে ৫ এর মধ্যে রেটিং দিন।' },
        { status: 400 }
      );
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length < 5) {
      return NextResponse.json(
        { success: false, message: 'অনুগ্রহ করে আপনার মন্তব্য বিস্তারিত লিখুন (কমপক্ষে ৫ অক্ষর)।' },
        { status: 400 }
      );
    }

    if (!productId && !productSlug) {
      return NextResponse.json(
        { success: false, message: 'প্রোডাক্টের তথ্য পাওয়া যায়নি।' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verified Buyer Check
    let isVerified = false;
    const cleanPhone = customerPhone ? String(customerPhone).replace(/\D/g, '') : '';
    if (cleanPhone.length >= 10) {
      const suffix = cleanPhone.slice(-10);
      try {
        const matchingOrder = await Order.findOne({
          customerPhone: { $regex: suffix },
          status: { $in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        }).lean();

        if (matchingOrder) {
          isVerified = true;
        }
      } catch (err) {
        console.warn('Order verification lookup warning:', err);
      }
    }

    // Process Photos (max 5 photos)
    const validPhotos: string[] = [];
    if (Array.isArray(photos)) {
      for (const p of photos.slice(0, 5)) {
        if (p && typeof p === 'string' && (p.startsWith('http') || p.startsWith('data:image/'))) {
          validPhotos.push(p.trim());
        }
      }
    }

    // Save to Database
    const newReview = await Review.create({
      productId: productId || productSlug,
      productSlug: productSlug || '',
      productTitle: productTitle || 'Craft Product',
      productImage: productImage || '',
      authorName: authorName.trim(),
      customerPhone: cleanPhone || undefined,
      rating: Math.round(numRating),
      comment: comment.trim(),
      photos: validPhotos,
      isVerified,
      isApproved: false, // Requires admin moderation
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      reviewId: newReview._id,
      isVerified,
      message: 'ধন্যবাদ! আপনার রিভিউটি সফলভাবে জমা হয়েছে। আমাদের অ্যাডমিন টিম যাচাই করার পর এটি প্রদর্শিত হবে।',
    });
  } catch (error: any) {
    console.error('Failed to submit review:', error);
    return NextResponse.json(
      { success: false, message: 'রিভিউ সাবমিট ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}

