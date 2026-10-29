import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { getProductBySlug } from '@/lib/store';

interface CheckStockItem {
  productId: string;
  variantId?: string;
  variationSku?: string;
  variationTitle?: string;
  title?: string;
  quantity: number;
}

function getProductMongoQuery(id: string) {
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  return isObjectId
    ? { $or: [{ _id: id }, { id }, { slug: id }] }
    : { $or: [{ id }, { slug: id }] };
}

// POST /api/products/check-stock
// Re-checks current live stock for cart/checkout before placing order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: CheckStockItem[] = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: true,
        hasShortage: false,
        shortages: [],
      });
    }

    await connectToDatabase();

    const shortages: Array<{
      productId: string;
      variantId?: string;
      variationSku?: string;
      title: string;
      variationTitle?: string;
      requestedQuantity: number;
      availableStock: number;
      isOutOfStock: boolean;
      message: string;
    }> = [];

    for (const item of items) {
      const reqQty = Math.max(1, Number(item.quantity) || 1);
      let dbProduct = await Product.findOne(getProductMongoQuery(item.productId)).lean();

      let targetProduct: any = dbProduct;
      if (!targetProduct) {
        targetProduct = getProductBySlug(item.productId);
      }

      const itemTitle = item.title || targetProduct?.titleBn || targetProduct?.titleEn || 'Item';

      if (!targetProduct) {
        shortages.push({
          productId: item.productId,
          title: itemTitle,
          requestedQuantity: reqQty,
          availableStock: 0,
          isOutOfStock: true,
          message: `"${itemTitle}" পণ্যটি বর্তমানে ক্যাটালগে পাওয়া যায়নি।`,
        });
        continue;
      }

      const isVariable = Boolean(
        targetProduct.hasVariations ||
        (targetProduct.variants && targetProduct.variants.length > 0) ||
        (targetProduct.variations && targetProduct.variations.length > 0)
      );

      if (isVariable) {
        const variantsList = (targetProduct.variants && targetProduct.variants.length > 0)
          ? targetProduct.variants
          : targetProduct.variations || [];

        const matchedVariant = variantsList.find(
          (v: any) =>
            (item.variantId && (String(v._id) === String(item.variantId) || String(v.id) === String(item.variantId))) ||
            (item.variationSku && v.sku === item.variationSku) ||
            (item.variationTitle && (v.optionValue === item.variationTitle || v.titleEn === item.variationTitle || v.titleBn === item.variationTitle))
        );

        const varTitle =
          item.variationTitle ||
          matchedVariant?.optionValue ||
          matchedVariant?.titleEn ||
          matchedVariant?.titleBn ||
          matchedVariant?.sku ||
          'Variation';

        if (!matchedVariant) {
          shortages.push({
            productId: item.productId,
            variantId: item.variantId,
            variationSku: item.variationSku,
            title: itemTitle,
            variationTitle: varTitle,
            requestedQuantity: reqQty,
            availableStock: 0,
            isOutOfStock: true,
            message: `"${itemTitle}" (${varTitle}) ভ্যারিয়েশনটি স্টকে নেই।`,
          });
          continue;
        }

        const available = matchedVariant.isActive === false ? 0 : Number(matchedVariant.stock ?? matchedVariant.stockQuantity ?? 0);

        if (available < reqQty) {
          shortages.push({
            productId: item.productId,
            variantId: String(matchedVariant._id || matchedVariant.id || ''),
            variationSku: matchedVariant.sku || item.variationSku,
            title: itemTitle,
            variationTitle: varTitle,
            requestedQuantity: reqQty,
            availableStock: Math.max(0, available),
            isOutOfStock: available <= 0,
            message: available <= 0
              ? `"${itemTitle}" (${varTitle}) এর স্টক শেষ হয়ে গেছে।`
              : `"${itemTitle}" (${varTitle}) এর স্টক পরিবর্তন হয়েছে: আপনি চেয়েছেন ${reqQty}টি, কিন্তু স্টকে আছে মাত্র ${available}টি।`,
          });
        }
      } else {
        const available = Number(targetProduct.stock ?? 0);
        if (available < reqQty) {
          shortages.push({
            productId: item.productId,
            title: itemTitle,
            requestedQuantity: reqQty,
            availableStock: Math.max(0, available),
            isOutOfStock: available <= 0,
            message: available <= 0
              ? `"${itemTitle}" এর স্টক শেষ হয়ে গেছে।`
              : `"${itemTitle}" এর স্টক পরিবর্তন হয়েছে: আপনি চেয়েছেন ${reqQty}টি, কিন্তু স্টকে আছে মাত্র ${available}টি।`,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      hasShortage: shortages.length > 0,
      shortages,
    });
  } catch (error: any) {
    console.error('Error in check-stock API:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to check stock' },
      { status: 500 }
    );
  }
}
