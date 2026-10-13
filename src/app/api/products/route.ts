import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, addProduct } from '@/lib/store';
import { SampleProduct } from '@/lib/sample-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let products = getAllProducts();

    if (category && category !== 'all') {
      if (category === 'wax-crayons') {
        products = products.filter((p) => p.slug.includes('crayon') || p.slug.includes('washable'));
      } else if (category === 'educational-toys') {
        products = products.filter((p) => p.slug.includes('puzzle') || p.slug.includes('blocks'));
      } else if (category === 'play-dough-clay') {
        products = products.filter((p) => p.slug.includes('dough'));
      }
    }

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) => p.titleBn.toLowerCase().includes(q) || p.titleEn.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, count: products.length, products });
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

    const newProduct: SampleProduct = {
      id: `prod-${Date.now()}`,
      slug: body.slug || body.titleEn.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
      titleBn: body.titleBn,
      titleEn: body.titleEn,
      categorySlug: body.categorySlug || 'wax-crayons',
      basePrice: Math.round(Number(body.basePrice)),
      baseSalePrice: body.baseSalePrice ? Math.round(Number(body.baseSalePrice)) : Math.round(Number(body.basePrice)),
      imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
      isVariable: Boolean(body.variations && body.variations.length > 0),
      isBestSeller: Boolean(body.isBestSeller),
      targetAgeMin: body.targetAgeMin || 2,
      targetAgeMax: body.targetAgeMax || 6,
      variations: body.variations || [],
    };

    addProduct(newProduct);

    return NextResponse.json(
      { success: true, message: 'পণ্য সফলভাবে যুক্ত হয়েছে', product: newProduct },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'নতুন পণ্য সংরক্ষণে ত্রুটি' },
      { status: 500 }
    );
  }
}
