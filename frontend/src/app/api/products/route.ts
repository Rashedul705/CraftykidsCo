import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts as getMemoryProducts, addProduct as addMemoryProduct } from '@/lib/store';
import { SampleProduct } from '@/lib/sample-data';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';

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

      const dbProducts = await Product.find(mongoQuery).lean();
      if (dbProducts && dbProducts.length > 0) {
        return NextResponse.json({
          success: true,
          count: dbProducts.length,
          products: dbProducts,
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

    return NextResponse.json({ success: true, count: products.length, products, source: 'memory' });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'পণ্য লোড করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.titleBn || !body.titleEn || !body.basePrice) {
      return NextResponse.json(
        { success: false, message: 'পণ্যের নাম ও দাম আবশ্যক' },
        { status: 400 }
      );
    }

    const prodId = body.id || `prod-${Date.now()}`;
    const slug = body.slug || body.titleEn.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
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
      price,
      basePrice: price,
      salePrice,
      baseSalePrice: salePrice,
      image: imageUrl,
      imageUrl,
      galleryImages: body.galleryImages || [imageUrl],
      isVariable: Boolean(body.variations && body.variations.length > 0),
      isBestSeller: Boolean(body.isBestSeller),
      isNewArrival: Boolean(body.isNewArrival ?? true),
      targetAgeMin: body.targetAgeMin || 2,
      targetAgeMax: body.targetAgeMax || 8,
      stock: body.stock || 100,
      description: body.description || body.descriptionBn || '',
      pieces: body.pieces || '',
      badge: body.badge || 'New',
      safetyBadges: body.safetyBadges || ['১০০% নিরাপদ ও নন-টক্সিক'],
      variations: body.variations || [],
    };

    let createdProduct: any = null;

    // 1. Try persisting to MongoDB Atlas
    try {
      await connectToDatabase();
      const dbDoc = await Product.create(newProductData);
      createdProduct = dbDoc.toObject ? dbDoc.toObject() : dbDoc;
      console.log(`✅ Product ${slug} saved to MongoDB Atlas!`);
    } catch (dbErr: any) {
      console.error('Failed to save product in MongoDB:', dbErr.message);
    }

    // 2. Fallback/Sync to memory store
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
      variations: newProductData.variations,
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
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'নতুন পণ্য সংরক্ষণে ত্রুটি' },
      { status: 500 }
    );
  }
}
