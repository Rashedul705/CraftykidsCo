import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { Bundle } from '@/models/Bundle';
import { getProductBySlug } from '@/lib/store';
import { getBundleById, getBundleBySlug } from '@/lib/bundles-store';

interface CheckStockItem {
  productId: string;
  variantId?: string;
  variationSku?: string;
  variationTitle?: string;
  title?: string;
  quantity: number;
  isBundle?: boolean;
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
      const isBundleItem = Boolean(
        item.isBundle ||
        (item.productId && (item.productId.startsWith('bundle-') || item.productId === 'custom-bundle'))
      );

      // 1. Handle Bundles (Custom Bundle or Pre-made Bundle)
      if (isBundleItem || item.productId === 'custom-bundle') {
        if (item.productId === 'custom-bundle') {
          // Custom bundle dynamically created by user - in-stock
          continue;
        }

        let dbBundle: any = await Bundle.findOne(getProductMongoQuery(item.productId)).lean();
        if (!dbBundle) {
          dbBundle = getBundleById(item.productId) || getBundleBySlug(item.productId);
        }

        if (dbBundle) {
          // Check constituent products stock in MongoDB
          let minSets = Infinity;
          let limitingItemName = '';

          for (const constituent of (dbBundle.items || [])) {
            const cQty = Math.max(1, Number(constituent.quantity) || 1);
            let cProd: any = await Product.findOne(getProductMongoQuery(constituent.productId)).lean();
            if (!cProd) {
              cProd = getProductBySlug(constituent.productId);
            }

            let cStock = 0;
            if (cProd) {
              if (cProd.variants && cProd.variants.length > 0 && constituent.variationSku) {
                const matchedV = cProd.variants.find((v: any) => v.sku === constituent.variationSku);
                cStock = matchedV ? Number(matchedV.stock ?? matchedV.stockQuantity ?? 0) : Number(cProd.stock ?? 0);
              } else {
                cStock = Number(cProd.stock ?? 0);
              }
            } else {
              cStock = Number(constituent.stock ?? 10);
            }

            const sets = Math.floor(cStock / cQty);
            if (sets < minSets) {
              minSets = sets;
              limitingItemName = constituent.productTitleBn || constituent.productTitleEn || 'পণ্য';
            }
          }

          const availableSets = minSets === Infinity ? 10 : Math.max(0, minSets);
          if (availableSets < reqQty) {
            shortages.push({
              productId: item.productId,
              title: item.title || dbBundle.titleBn || dbBundle.titleEn,
              requestedQuantity: reqQty,
              availableStock: availableSets,
              isOutOfStock: availableSets <= 0,
              message: availableSets <= 0
                ? `"${dbBundle.titleBn}" এর অন্তর্গত '${limitingItemName}' এর স্টক শেষ হয়ে গেছে।`
                : `"${dbBundle.titleBn}" এর পর্যাপ্ত স্টক নেই (অনুরোধ: ${reqQty}টি, স্টকে আছে: ${availableSets}টি)।`,
            });
          }
          continue;
        }
      }

      // 2. Regular Product Lookup
      let dbProduct = await Product.findOne(getProductMongoQuery(item.productId)).lean();

      let targetProduct: any = dbProduct;
      if (!targetProduct) {
        targetProduct = getProductBySlug(item.productId);
      }

      const itemTitle = item.title || targetProduct?.titleBn || targetProduct?.titleEn || 'Item';

      // If product not found in Product collection, check if it was actually a Bundle!
      if (!targetProduct) {
        let fallbackBundle: any = await Bundle.findOne(getProductMongoQuery(item.productId)).lean();
        if (!fallbackBundle) {
          fallbackBundle = getBundleById(item.productId) || getBundleBySlug(item.productId);
        }

        if (fallbackBundle) {
          let minSets = Infinity;
          let limitingItemName = '';
          for (const constituent of (fallbackBundle.items || [])) {
            const cQty = Math.max(1, Number(constituent.quantity) || 1);
            let cProd: any = await Product.findOne(getProductMongoQuery(constituent.productId)).lean();
            if (!cProd) cProd = getProductBySlug(constituent.productId);
            const cStock = cProd ? Number(cProd.stock ?? 10) : Number(constituent.stock ?? 10);
            const sets = Math.floor(cStock / cQty);
            if (sets < minSets) {
              minSets = sets;
              limitingItemName = constituent.productTitleBn || constituent.productTitleEn || 'পণ্য';
            }
          }

          const availableSets = minSets === Infinity ? 10 : Math.max(0, minSets);
          if (availableSets < reqQty) {
            shortages.push({
              productId: item.productId,
              title: itemTitle || fallbackBundle.titleBn || fallbackBundle.titleEn,
              requestedQuantity: reqQty,
              availableStock: availableSets,
              isOutOfStock: availableSets <= 0,
              message: availableSets <= 0
                ? `"${fallbackBundle.titleBn}" এর অন্তর্গত '${limitingItemName}' এর স্টক শেষ হয়ে গেছে।`
                : `"${fallbackBundle.titleBn}" এর পর্যাপ্ত স্টক নেই (অনুরোধ: ${reqQty}টি, স্টকে আছে: ${availableSets}টি)।`,
            });
          }
          continue;
        }

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
