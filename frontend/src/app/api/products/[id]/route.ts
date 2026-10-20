import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { getProductBySlug, updateProduct as updateMemoryProduct, deleteProduct as deleteMemoryProduct } from '@/lib/store';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 1. GET /api/products/[id] - Fetch single product by id or slug
export async function GET(req: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;

    // Try MongoDB Atlas
    try {
      await connectToDatabase();
      const dbProduct = await Product.findOne({
        $or: [{ id }, { slug: id }],
      }).lean();

      if (dbProduct) {
        return NextResponse.json({
          success: true,
          product: dbProduct,
          source: 'mongodb',
        });
      }
    } catch (dbErr) {
      console.warn(`MongoDB error in GET /api/products/${id}:`, dbErr);
    }

    // Fallback to in-memory store
    const memProduct = getProductBySlug(id);
    if (memProduct) {
      return NextResponse.json({
        success: true,
        product: memProduct,
        source: 'memory',
      });
    }

    return NextResponse.json(
      { success: false, message: 'পণ্যটি পাওয়া যায়নি' },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'পণ্য লোড করতে ব্যর্থ হয়েছে' },
      { status: 500 }
    );
  }
}

// 2. PATCH /api/products/[id] - Update product details or stock
export async function PATCH(req: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const updateFields: any = {};
    if (body.titleBn !== undefined) updateFields.titleBn = body.titleBn;
    if (body.titleEn !== undefined) {
      updateFields.titleEn = body.titleEn;
      updateFields.title = body.titleEn;
    }
    if (body.basePrice !== undefined) {
      const p = Math.round(Number(body.basePrice));
      updateFields.basePrice = p;
      updateFields.price = p;
    }
    if (body.baseSalePrice !== undefined) {
      const sp = Math.round(Number(body.baseSalePrice));
      updateFields.baseSalePrice = sp;
      updateFields.salePrice = sp;
    }
    if (body.stock !== undefined) updateFields.stock = Math.max(0, Number(body.stock));
    if (body.categorySlug !== undefined) {
      updateFields.categorySlug = body.categorySlug;
      updateFields.category = body.category || body.categorySlug;
      updateFields.primaryCategorySlug = body.categorySlug;
    }
    if (body.imageUrl !== undefined) {
      updateFields.imageUrl = body.imageUrl;
      updateFields.image = body.imageUrl;
    }
    if (body.galleryImages !== undefined) updateFields.galleryImages = body.galleryImages;
    if (body.description !== undefined) {
      updateFields.description = body.description;
      updateFields.descriptionBn = body.descriptionBn || body.description;
      updateFields.descriptionEn = body.descriptionEn || body.description;
    }
    if (body.shortDescriptionBn !== undefined) updateFields.shortDescriptionBn = body.shortDescriptionBn;
    if (body.shortDescriptionEn !== undefined) updateFields.shortDescriptionEn = body.shortDescriptionEn;
    if (body.pieces !== undefined) updateFields.pieces = body.pieces;
    if (body.badge !== undefined) updateFields.badge = body.badge;
    if (body.isNewArrival !== undefined) updateFields.isNewArrival = Boolean(body.isNewArrival);
    if (body.isBestSeller !== undefined) updateFields.isBestSeller = Boolean(body.isBestSeller);
    if (body.costPerItem !== undefined) updateFields.costPerItem = Number(body.costPerItem);
    if (body.sku !== undefined) updateFields.sku = body.sku;
    if (body.lowStockAlert !== undefined) updateFields.lowStockAlert = Number(body.lowStockAlert);
    if (body.subCategory !== undefined) updateFields.subCategory = body.subCategory;
    if (body.tags !== undefined) updateFields.tags = body.tags;
    if (body.brand !== undefined) updateFields.brand = body.brand;
    if (body.safetyBadges !== undefined) updateFields.safetyBadges = body.safetyBadges;
    if (body.targetAge !== undefined) updateFields.targetAge = body.targetAge;
    if (body.targetAgeMin !== undefined) updateFields.targetAgeMin = body.targetAgeMin;
    if (body.videoUrl !== undefined) updateFields.videoUrl = body.videoUrl;
    if (body.weight !== undefined) updateFields.weight = body.weight;
    if (body.packageSize !== undefined) updateFields.packageSize = body.packageSize;
    if (body.handlingTime !== undefined) updateFields.handlingTime = body.handlingTime;
    if (body.seoTitle !== undefined) updateFields.seoTitle = body.seoTitle;
    if (body.seoDescription !== undefined) updateFields.seoDescription = body.seoDescription;
    if (body.allowCashOnDelivery !== undefined) updateFields.allowCashOnDelivery = Boolean(body.allowCashOnDelivery);
    if (body.requiresGiftWrap !== undefined) updateFields.requiresGiftWrap = Boolean(body.requiresGiftWrap);
    if (body.isActive !== undefined) updateFields.isActive = Boolean(body.isActive);
    if (body.variations !== undefined) {
      updateFields.variations = body.variations;
      updateFields.isVariable = body.variations.length > 0;
    }

    let updatedDoc: any = null;

    // 1. Update in MongoDB Atlas
    try {
      await connectToDatabase();
      updatedDoc = await Product.findOneAndUpdate(
        { $or: [{ id }, { slug: id }] },
        { $set: updateFields },
        { new: true, runValidators: true }
      ).lean();
    } catch (dbErr: any) {
      console.error(`MongoDB error updating product ${id}:`, dbErr.message);
    }

    // 2. Sync in memory store
    const memUpdated = updateMemoryProduct(id, updateFields);

    if (!updatedDoc && !memUpdated) {
      return NextResponse.json(
        { success: false, message: 'আপডেট করার জন্য পণ্যটি পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'পণ্য সফলভাবে আপডেট হয়েছে',
      product: updatedDoc || memUpdated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'পণ্য আপডেট করতে ব্যর্থ হয়েছে' },
      { status: 500 }
    );
  }
}

// 3. DELETE /api/products/[id] - Delete product permanently
export async function DELETE(req: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;

    let deletedFromDb = false;

    // 1. Delete from MongoDB Atlas
    try {
      await connectToDatabase();
      const res = await Product.findOneAndDelete({
        $or: [{ id }, { slug: id }],
      });
      if (res) deletedFromDb = true;
    } catch (dbErr: any) {
      console.error(`MongoDB error deleting product ${id}:`, dbErr.message);
    }

    // 2. Delete from memory store
    const deletedFromMem = deleteMemoryProduct(id);

    if (!deletedFromDb && !deletedFromMem) {
      return NextResponse.json(
        { success: false, message: 'মুছে ফেলার জন্য পণ্যটি পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'পণ্য সফলভাবে মুছে ফেলা হয়েছে',
      id,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'পণ্য ডিলিট করতে ব্যর্থ হয়েছে' },
      { status: 500 }
    );
  }
}
