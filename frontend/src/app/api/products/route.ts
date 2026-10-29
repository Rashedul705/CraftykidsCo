import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts as getMemoryProducts, addProduct as addMemoryProduct } from '@/lib/store';
import { SampleProduct } from '@/lib/sample-data';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { verifyAdminRequest } from '@/lib/auth';

import { sortProductsByStockAndRecency } from '@/lib/product-utils';
import { computeProductStockAndStatus } from '@/lib/product-stock';
import { validateAndSanitizeProduct } from '@/lib/product-validation';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // 1. Try querying MongoDB Atlas
    try {
      await connectToDatabase();
      const mongoQuery: any = {};

      if (category && category !== 'all') {
        mongoQuery.$or = [
          { category: category },
          { categorySlug: category },
          { primaryCategorySlug: category },
        ];
      }

      if (search) {
        const regex = new RegExp(search, 'i');
        mongoQuery.$or = [
          { titleBn: regex },
          { titleEn: regex },
          { title: regex },
        ];
      }

      const dbProducts = await Product.find(mongoQuery).sort({ createdAt: -1 }).lean();
      if (dbProducts && dbProducts.length > 0) {
        const computed = dbProducts.map((p) => computeProductStockAndStatus(p));
        const sorted = sortProductsByStockAndRecency(computed);
        return NextResponse.json({
          success: true,
          count: sorted.length,
          products: sorted,
          source: 'mongodb',
        });
      }
    } catch (dbErr) {
      console.warn('MongoDB error in GET /api/products (falling back to memory):', dbErr);
    }

    // 2. Fallback to in-memory products
    let products = getMemoryProducts();

    if (category && category !== 'all') {
      products = products.filter(
        (p) => p.categorySlug === category || p.slug.includes(category)
      );
    }

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.titleBn.toLowerCase().includes(q) ||
          p.titleEn.toLowerCase().includes(q)
      );
    }

    const computedMemory = products.map((p) => computeProductStockAndStatus(p));
    const sortedMemory = sortProductsByStockAndRecency(computedMemory);
    return NextResponse.json({ success: true, count: sortedMemory.length, products: sortedMemory, source: 'memory' });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'পণ্য লোড করতে সমস্যা হয়েছে' },
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

    const body = await req.json();

    await connectToDatabase();

    // Section 2: Full validation & sanitization
    const validation = await validateAndSanitizeProduct(body);
    if (!validation.valid || !validation.sanitized) {
      return NextResponse.json(
        {
          success: false,
          message: validation.errors[0] || 'পণ্যের তথ্য সঠিক নয়',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const sanitized = validation.sanitized;

    // 1. Ensure collision-free unique slug
    let baseSlug = sanitized.slug;
    let slug = baseSlug;
    let slugCounter = 1;
    try {
      while (await Product.exists({ slug })) {
        slugCounter++;
        slug = `${baseSlug}-${slugCounter}`;
      }
    } catch (err) {
      console.warn('Slug collision check warning:', err);
    }
    sanitized.slug = slug;

    // 2. Ensure collision-free unique id
    let prodId = body.id || `prod-${Date.now()}`;
    let idCounter = 1;
    try {
      while (await Product.exists({ id: prodId })) {
        idCounter++;
        prodId = `prod-${Date.now()}-${idCounter}`;
      }
    } catch (err) {
      console.warn('ID collision check warning:', err);
    }
    sanitized.id = prodId;

    const imageUrl = body.imageUrl || body.image || 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg';
    sanitized.image = imageUrl;
    sanitized.imageUrl = imageUrl;
    sanitized.galleryImages = body.galleryImages && body.galleryImages.length > 0 ? body.galleryImages : [imageUrl];
    sanitized.category = body.category || body.categorySlug || 'Art Kits';
    sanitized.categorySlug = body.categorySlug || 'art-kits';
    sanitized.primaryCategorySlug = body.categorySlug || 'art-kits';
    sanitized.subCategory = body.subCategory || '';
    sanitized.brand = body.brand || 'CraftyKidsCo';
    sanitized.tags = Array.isArray(body.tags) ? body.tags : [];
    sanitized.description = body.description || body.descriptionBn || '';
    sanitized.descriptionBn = body.descriptionBn || body.description || '';
    sanitized.descriptionEn = body.descriptionEn || '';
    sanitized.shortDescriptionBn = body.shortDescriptionBn || '';
    sanitized.shortDescriptionEn = body.shortDescriptionEn || '';
    sanitized.pieces = body.pieces || '';
    sanitized.boxItems = Array.isArray(body.boxItems)
      ? body.boxItems
      : typeof body.boxItems === 'string'
      ? body.boxItems.split('\n').map((s: string) => s.trim()).filter(Boolean)
      : [];
    sanitized.materials = body.materials || 'প্রাকৃতিক মৌমাছির মোম ও ফুড কালার';
    sanitized.safetyStandards = body.safetyStandards || '১০০% নন-টক্সিক সার্টিফাইড';
    sanitized.ageAppropriate = body.ageAppropriate || '';
    sanitized.badge = body.badge || 'New';
    sanitized.isBestSeller = Boolean(body.isBestSeller);
    sanitized.isNewArrival = Boolean(body.isNewArrival ?? true);
    sanitized.isFeatured = Boolean(body.isFeatured);
    sanitized.targetAge = body.targetAge || '2+';
    sanitized.targetAgeMin = body.targetAgeMin || 2;
    sanitized.targetAgeMax = body.targetAgeMax || 8;
    sanitized.safetyBadges = body.safetyBadges || ['১০০% নিরাপদ ও নন-টক্সিক'];
    sanitized.videoUrl = body.videoUrl || undefined;
    sanitized.videoUrl2 = body.videoUrl2 || undefined;
    sanitized.videos = Array.isArray(body.videos) ? body.videos : [];
    sanitized.faqs = Array.isArray(body.faqs) ? body.faqs : [];
    sanitized.weight = body.weight !== undefined && body.weight !== '' ? Number(body.weight) : 350;
    sanitized.packageSize = body.packageSize || '20 x 15 x 5 cm';
    sanitized.handlingTime = body.handlingTime || '1-2 Days';
    sanitized.seoTitle = body.seoTitle || sanitized.titleEn;
    sanitized.seoDescription = body.seoDescription || body.shortDescriptionEn || '';
    sanitized.allowCashOnDelivery = body.allowCashOnDelivery !== undefined ? Boolean(body.allowCashOnDelivery) : true;
    sanitized.showStockLeft = body.showStockLeft !== undefined ? Boolean(body.showStockLeft) : true;
    sanitized.requiresGiftWrap = body.requiresGiftWrap !== undefined ? Boolean(body.requiresGiftWrap) : false;
    sanitized.isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    let createdProduct: any = null;

    // 3. Persist to MongoDB Atlas
    try {
      const dbDoc = await Product.create(sanitized);
      createdProduct = dbDoc.toObject ? dbDoc.toObject() : dbDoc;
      console.log(`✅ Product ${slug} saved to MongoDB Atlas!`);
    } catch (dbErr: any) {
      console.error('Failed to save product in MongoDB:', dbErr);
      return NextResponse.json(
        {
          success: false,
          message: `ডাটাবেজে পণ্য সংরক্ষণে ত্রুটি: ${dbErr.message || 'Validation error'}`,
        },
        { status: 400 }
      );
    }

    // 4. Sync to memory store
    addMemoryProduct(sanitized);

    return NextResponse.json(
      {
        success: true,
        message: 'পণ্য সফলভাবে যুক্ত হয়েছে',
        product: computeProductStockAndStatus(createdProduct || sanitized),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/products:', error);
    return NextResponse.json(
      { success: false, message: `নতুন পণ্য সংরক্ষণে ত্রুটি: ${error?.message || ''}` },
      { status: 500 }
    );
  }
}
