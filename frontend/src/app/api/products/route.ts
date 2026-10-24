import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts as getMemoryProducts, addProduct as addMemoryProduct } from '@/lib/store';
import { SampleProduct } from '@/lib/sample-data';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { verifyAdminRequest } from '@/lib/auth';

import { sortProductsByStockAndRecency } from '@/lib/product-utils';

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
        const sorted = sortProductsByStockAndRecency(dbProducts);
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

    const sortedMemory = sortProductsByStockAndRecency(products);
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

    if (!body.titleBn || !body.titleEn || !body.basePrice) {
      return NextResponse.json(
        { success: false, message: 'পণ্যের নাম ও দাম আবশ্যক' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Ensure collision-free unique slug
    let baseSlug = (body.slug || body.titleEn || '')
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    if (!baseSlug) {
      baseSlug = `prod-${Date.now()}`;
    }

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

    const price = Math.round(Number(body.basePrice));
    const salePrice = body.baseSalePrice ? Math.round(Number(body.baseSalePrice)) : price;
    const imageUrl = body.imageUrl || body.image || 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg';

    const newProductData = {
      id: prodId,
      slug,
      title: body.titleEn,
      titleBn: body.titleBn,
      titleEn: body.titleEn,
      category: body.category || body.categorySlug || 'Art Kits',
      categorySlug: body.categorySlug || 'art-kits',
      primaryCategorySlug: body.categorySlug || 'art-kits',
      subCategory: body.subCategory || '',
      price,
      basePrice: price,
      salePrice,
      baseSalePrice: salePrice,
      costPerItem: body.costPerItem !== undefined && body.costPerItem !== '' ? Number(body.costPerItem) : undefined,
      sku: body.sku || `CKC-${slug.substring(0, 8).toUpperCase()}-001`,
      stock: body.stock !== undefined && body.stock !== '' ? Math.max(0, Number(body.stock)) : 100,
      lowStockAlert: body.lowStockAlert !== undefined && body.lowStockAlert !== '' ? Number(body.lowStockAlert) : 5,
      brand: body.brand || 'CraftyKidsCo',
      tags: Array.isArray(body.tags) ? body.tags : [],
      description: body.description || body.descriptionBn || '',
      descriptionBn: body.descriptionBn || body.description || '',
      descriptionEn: body.descriptionEn || '',
      shortDescriptionBn: body.shortDescriptionBn || '',
      shortDescriptionEn: body.shortDescriptionEn || '',
      pieces: body.pieces || '',
      boxItems: Array.isArray(body.boxItems)
        ? body.boxItems
        : typeof body.boxItems === 'string'
        ? body.boxItems.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : [],
      materials: body.materials || 'প্রাকৃতিক মৌমাছির মোম ও ফুড কালার',
      safetyStandards: body.safetyStandards || '১০০% নন-টক্সিক সার্টিফাইড',
      ageAppropriate: body.ageAppropriate || '',
      badge: body.badge || 'New',
      image: imageUrl,
      imageUrl,
      galleryImages: body.galleryImages && body.galleryImages.length > 0 ? body.galleryImages : [imageUrl],
      isVariable: Boolean(body.variations && body.variations.length > 0),
      isBestSeller: Boolean(body.isBestSeller),
      isNewArrival: Boolean(body.isNewArrival ?? true),
      isFeatured: Boolean(body.isFeatured),
      targetAge: body.targetAge || '2+',
      targetAgeMin: body.targetAgeMin || 2,
      targetAgeMax: body.targetAgeMax || 8,
      safetyBadges: body.safetyBadges || ['১০০% নিরাপদ ও নন-টক্সিক'],
      variations: body.variations || [],
      videoUrl: body.videoUrl || undefined,
      videoUrl2: body.videoUrl2 || undefined,
      videos: Array.isArray(body.videos) ? body.videos : [],
      weight: body.weight !== undefined && body.weight !== '' ? Number(body.weight) : 350,
      packageSize: body.packageSize || '20 x 15 x 5 cm',
      handlingTime: body.handlingTime || '1-2 Days',
      seoTitle: body.seoTitle || body.titleEn,
      seoDescription: body.seoDescription || body.shortDescriptionEn || '',
      allowCashOnDelivery: body.allowCashOnDelivery !== undefined ? Boolean(body.allowCashOnDelivery) : true,
      showStockLeft: body.showStockLeft !== undefined ? Boolean(body.showStockLeft) : true,
      requiresGiftWrap: body.requiresGiftWrap !== undefined ? Boolean(body.requiresGiftWrap) : false,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    };

    let createdProduct: any = null;

    // 3. Persist to MongoDB Atlas
    try {
      const dbDoc = await Product.create(newProductData);
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
    const sampleProd: SampleProduct = {
      id: prodId,
      slug,
      titleBn: body.titleBn,
      titleEn: body.titleEn,
      categorySlug: newProductData.categorySlug,
      basePrice: price,
      baseSalePrice: salePrice,
      imageUrl,
      galleryImages: newProductData.galleryImages,
      isVariable: newProductData.isVariable,
      isBestSeller: newProductData.isBestSeller,
      isNewArrival: newProductData.isNewArrival,
      targetAgeMin: newProductData.targetAgeMin,
      targetAgeMax: newProductData.targetAgeMax,
      pieces: newProductData.pieces,
      boxItems: newProductData.boxItems,
      materials: newProductData.materials,
      safetyStandards: newProductData.safetyStandards,
      ageAppropriate: newProductData.ageAppropriate,
      variations: newProductData.variations,
      videoUrl: newProductData.videoUrl,
      videoUrl2: newProductData.videoUrl2,
      videos: newProductData.videos,
    };
    addMemoryProduct(sampleProd);

    return NextResponse.json(
      {
        success: true,
        message: 'পণ্য সফলভাবে যুক্ত হয়েছে',
        product: createdProduct || sampleProd,
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
