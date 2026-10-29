import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { StockLog, StockLogReason } from '@/models/StockLog';
import { verifyAdminRequest } from '@/lib/auth';
import { computeProductStockAndStatus } from '@/lib/product-stock';
import { getProductBySlug, updateProduct as updateMemoryProduct } from '@/lib/store';

interface RouteParams {
  params: Promise<{ id: string }>;
}

function getProductMongoQuery(id: string) {
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  return isObjectId
    ? { $or: [{ _id: id }, { id }, { slug: id }] }
    : { $or: [{ id }, { slug: id }] };
}

// 1. GET /api/products/[id]/stock-logs
// Returns stock change history with optional filters: ?variantId=... &reason=...
export async function GET(req: NextRequest, context: RouteParams) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;
    const url = new URL(req.url);
    const variantIdFilter = url.searchParams.get('variantId');
    const reasonFilter = url.searchParams.get('reason');

    await connectToDatabase();
    await StockLog.createCollection().catch(() => {});

    // 1. Find product
    const dbProduct = await Product.findOne(getProductMongoQuery(id)).lean();
    if (!dbProduct) {
      // Check in-memory store
      const memProduct = getProductBySlug(id);
      if (!memProduct) {
        return NextResponse.json(
          { success: false, message: 'পণ্যটি পাওয়া যায়নি (Product not found)' },
          { status: 404 }
        );
      }
    }

    const matchedId = dbProduct ? (dbProduct._id || dbProduct.id) : id;
    const allProductIds = dbProduct
      ? [dbProduct._id, dbProduct.id, dbProduct.slug, String(dbProduct._id)].filter(Boolean)
      : [id];

    // 2. Build query
    const filterQuery: any = {
      productId: { $in: allProductIds },
    };

    if (variantIdFilter && variantIdFilter !== 'ALL') {
      if (variantIdFilter === 'SIMPLE') {
        filterQuery.variantId = { $in: [null, undefined, ''] };
      } else {
        filterQuery.variantId = variantIdFilter;
      }
    }

    if (reasonFilter && reasonFilter !== 'ALL') {
      filterQuery.reason = reasonFilter;
    }

    // 3. Query stock logs
    const logs = await StockLog.find(filterQuery)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    // 4. Enrich logs with variation details
    const variants = (dbProduct?.variants || (dbProduct as any)?.variations || []) as any[];
    const variantMap = new Map<string, any>();
    variants.forEach((v: any) => {
      const vKey = String(v._id || v.id || v.sku);
      variantMap.set(vKey, v);
      if (v._id) variantMap.set(String(v._id), v);
      if (v.id) variantMap.set(String(v.id), v);
      if (v.sku) variantMap.set(v.sku, v);
    });

    const enrichedLogs = logs.map((log: any) => {
      const varData = log.variantId ? variantMap.get(String(log.variantId)) : null;
      return {
        _id: String(log._id),
        id: String(log._id),
        productId: String(log.productId),
        variantId: log.variantId ? String(log.variantId) : null,
        variationName: varData?.optionValue || varData?.titleEn || varData?.titleBn || (log.variantId ? 'Variation' : 'Simple Product'),
        variationDetail: varData?.detail || '',
        variationSku: varData?.sku || '',
        variationImage: varData?.imageUrl || dbProduct?.imageUrl || '',
        change: Number(log.change),
        stockBefore: Number(log.stockBefore),
        stockAfter: Number(log.stockAfter),
        reason: log.reason as StockLogReason,
        orderId: log.orderId || null,
        adminId: log.adminId || 'admin',
        note: log.note || '',
        createdAt: log.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      logs: enrichedLogs,
      product: {
        id: matchedId,
        titleEn: dbProduct?.titleEn || '',
        titleBn: dbProduct?.titleBn || '',
        hasVariations: Boolean(dbProduct?.hasVariations),
        optionName: dbProduct?.optionName || 'Option',
        variants: variants.map((v: any) => ({
          _id: String(v._id || v.id),
          id: String(v._id || v.id),
          optionValue: v.optionValue || v.titleEn || v.titleBn || 'Variant',
          detail: v.detail || '',
          sku: v.sku || '',
          stock: Number(v.stock ?? v.stockQuantity ?? 0),
          regularPrice: v.regularPrice ?? v.price,
          salePrice: v.salePrice ?? null,
          imageUrl: v.imageUrl || '',
          isActive: v.isActive !== false,
        })),
        stock: Number(dbProduct?.stock ?? 0),
      },
    });
  } catch (error: any) {
    console.error('Error fetching stock logs:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch stock logs' },
      { status: 500 }
    );
  }
}

// 2. POST /api/products/[id]/stock-logs
// Handles restock or manual stock adjustments
export async function POST(req: NextRequest, context: RouteParams) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;
    const body = await req.json();

    const { variantId, quantity, note, reason = 'restock' } = body;

    if (quantity === undefined || isNaN(Number(quantity)) || !Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
      return NextResponse.json(
        { success: false, message: 'পরিমাণ অবশ্যই ১ বা তার বেশি পূর্ণসংখ্যা হতে হবে (Quantity must be an integer >= 1)' },
        { status: 400 }
      );
    }

    const addQty = Math.floor(Number(quantity));

    await connectToDatabase();
    await StockLog.createCollection().catch(() => {});

    const dbProduct = await Product.findOne(getProductMongoQuery(id));
    if (!dbProduct) {
      return NextResponse.json(
        { success: false, message: 'পণ্যটি পাওয়া যায়নি (Product not found)' },
        { status: 404 }
      );
    }

    let previousStock = 0;
    let finalStock = 0;
    let targetVariantId: string | null = null;
    let variantLabel = '';

    const isVariable = Boolean(dbProduct.hasVariations || (dbProduct.variants && dbProduct.variants.length > 0));

    if (isVariable) {
      if (!variantId) {
        return NextResponse.json(
          { success: false, message: 'ভ্যারিয়েশন নির্বাচন করুন (Please select a variation to restock)' },
          { status: 400 }
        );
      }

      const variantList = (dbProduct.variants && dbProduct.variants.length > 0)
        ? dbProduct.variants
        : dbProduct.variations || [];

      const targetVariant = variantList.find(
        (v: any) =>
          String(v._id) === String(variantId) ||
          String(v.id) === String(variantId) ||
          v.sku === String(variantId)
      );

      if (!targetVariant) {
        return NextResponse.json(
          { success: false, message: 'নির্দিষ্ট ভ্যারিয়েশনটি পাওয়া যায়নি (Variation not found)' },
          { status: 404 }
        );
      }

      previousStock = Number(targetVariant.stock ?? targetVariant.stockQuantity ?? 0);
      finalStock = previousStock + addQty;
      targetVariant.stock = finalStock;
      targetVariant.stockQuantity = finalStock;
      targetVariantId = String(targetVariant._id || targetVariant.id || targetVariant.sku);
      variantLabel = targetVariant.optionValue || targetVariant.sku || 'Variation';

      // Recalculate parent product total stock from active variants
      const totalStock = variantList
        .filter((v: any) => v.isActive !== false)
        .reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0);

      dbProduct.stock = totalStock;
      dbProduct.markModified('variants');
      dbProduct.markModified('variations');
    } else {
      previousStock = Number(dbProduct.stock ?? 0);
      finalStock = previousStock + addQty;
      dbProduct.stock = finalStock;
      variantLabel = dbProduct.titleEn || dbProduct.titleBn || 'Simple Product';
    }

    await dbProduct.save();

    // Create stockLog entry
    const adminUser = (auth as any).user?.email || (auth as any).user?.id || 'admin';
    const logDoc = await StockLog.create({
      productId: dbProduct._id || dbProduct.id,
      variantId: targetVariantId,
      change: addQty,
      stockBefore: previousStock,
      stockAfter: finalStock,
      reason: reason as StockLogReason,
      adminId: adminUser,
      note: note?.trim() || `Restocked +${addQty} units for ${variantLabel}`,
    });

    // Also update in-memory product cache if present
    updateMemoryProduct(id, { stock: dbProduct.stock }, targetVariantId || undefined);

    return NextResponse.json({
      success: true,
      message: `স্টক সফলভাবে রিস্টক করা হয়েছে (+${addQty} ইউনিট)`,
      log: {
        _id: String(logDoc._id),
        productId: String(logDoc.productId),
        variantId: logDoc.variantId,
        change: logDoc.change,
        stockBefore: logDoc.stockBefore,
        stockAfter: logDoc.stockAfter,
        reason: logDoc.reason,
        adminId: logDoc.adminId,
        note: logDoc.note,
        createdAt: logDoc.createdAt,
      },
      product: computeProductStockAndStatus(dbProduct.toObject ? dbProduct.toObject() : dbProduct),
    });
  } catch (error: any) {
    console.error('Error in POST /api/products/[id]/stock-logs:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process restock' },
      { status: 500 }
    );
  }
}
