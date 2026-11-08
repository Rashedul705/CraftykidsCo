import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { BundleTier } from '@/models/BundleTier';
import { BundleSetting } from '@/models/BundleSetting';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const rawItems: { productId: string; quantity: number }[] = body.items || [];

    // 1. Fetch active tiers & settings
    const [tiers, setting] = await Promise.all([
      BundleTier.find({ isActive: true }).sort({ minQuantity: 1 }).lean(),
      BundleSetting.findOne().lean(),
    ]);

    const maxDiscount = setting?.maxDiscountPercent ?? 20;

    // 2. Fetch all requested products
    const productIds = rawItems
      .map((it) => it.productId)
      .filter((id) => Boolean(id));

    const objectIds = productIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const dbProducts = await Product.find({
      $or: [{ _id: { $in: objectIds } }, { id: { $in: productIds } }],
    }).lean();

    const productMap = new Map<string, any>();
    dbProducts.forEach((p) => {
      productMap.set(p._id.toString(), p);
      if (p.id) productMap.set(p.id, p);
    });

    const errors: string[] = [];
    let totalQuantity = 0;
    const validatedLines: any[] = [];

    for (const raw of rawItems) {
      const p = productMap.get(raw.productId);
      const qty = Math.max(0, parseInt(String(raw.quantity), 10) || 0);
      if (qty === 0) continue;

      if (!p) {
        errors.push(`Product "${raw.productId}" not found.`);
        continue;
      }

      if (p.bundleEligible === false) {
        errors.push(`Product "${p.titleEn || p.titleBn || p.title}" is not eligible for custom bundles.`);
        continue;
      }

      const availableStock = typeof p.totalStock === 'number' ? p.totalStock : (typeof p.stock === 'number' ? p.stock : 0);
      if (availableStock <= 0) {
        errors.push(`Product "${p.titleEn || p.titleBn || p.title}" is out of stock.`);
        continue;
      }

      if (qty > availableStock) {
        errors.push(
          `Requested quantity (${qty}) for "${p.titleEn || p.titleBn || p.title}" exceeds available stock (${availableStock}).`
        );
        continue;
      }

      // Base price determination: if product is on sale, discount applies on top of current selling price
      const hasSale =
        typeof p.salePrice === 'number' &&
        p.salePrice > 0 &&
        typeof p.regularPrice === 'number' &&
        p.salePrice < p.regularPrice;
      const sellingUnitPrice = hasSale
        ? p.salePrice
        : typeof p.salePrice === 'number' && p.salePrice > 0
        ? p.salePrice
        : typeof p.price === 'number' && p.price > 0
        ? p.price
        : typeof p.regularPrice === 'number'
        ? p.regularPrice
        : 0;

      totalQuantity += qty;
      validatedLines.push({
        productId: p._id.toString(),
        id: p.id || p._id.toString(),
        title: p.titleEn || p.titleBn || p.title || 'Product',
        titleBn: p.titleBn || p.title || '',
        titleEn: p.titleEn || p.title || '',
        imageUrl: p.imageUrl || p.image || (p.galleryImages && p.galleryImages[0]) || '',
        quantity: qty,
        stock: availableStock,
        originalUnitPrice: sellingUnitPrice,
        isSale: hasSale,
        regularPrice: p.regularPrice || sellingUnitPrice,
      });
    }

    // 3. Determine qualifying tier
    let qualifyingTier: any = null;
    let nextTier: any = null;

    for (const t of tiers) {
      if (totalQuantity >= t.minQuantity) {
        qualifyingTier = t;
      } else if (!nextTier) {
        nextTier = t;
      }
    }

    const tierPercentApplied = qualifyingTier
      ? Math.min(qualifyingTier.discountPercent, maxDiscount)
      : 0;

    // 4. Calculate progress message
    let progressMessage = '';
    if (tiers.length === 0) {
      progressMessage = 'Custom bundle builder';
    } else if (totalQuantity === 0) {
      const firstTier = tiers[0];
      progressMessage = `Add ${firstTier.minQuantity} items to get ${firstTier.discountPercent}% off!`;
    } else if (!qualifyingTier && nextTier) {
      const needed = nextTier.minQuantity - totalQuantity;
      progressMessage = `Add ${needed} more item${needed > 1 ? 's' : ''} to get ${nextTier.discountPercent}% off`;
    } else if (qualifyingTier && nextTier) {
      const needed = nextTier.minQuantity - totalQuantity;
      progressMessage = `Add ${needed} more item${needed > 1 ? 's' : ''} to get ${nextTier.discountPercent}% off`;
    } else if (qualifyingTier && !nextTier) {
      progressMessage = `You got the maximum discount (${tierPercentApplied}% off)!`;
    }

    // 5. Line items calculation
    let subtotal = 0;
    let discountAmount = 0;

    const detailedLines = validatedLines.map((line) => {
      const lineSubtotal = line.originalUnitPrice * line.quantity;
      const discountPerUnit = Math.round((line.originalUnitPrice * tierPercentApplied) / 100);
      const lineDiscount = discountPerUnit * line.quantity;
      const finalUnitPrice = line.originalUnitPrice - discountPerUnit;
      const lineTotal = lineSubtotal - lineDiscount;

      subtotal += lineSubtotal;
      discountAmount += lineDiscount;

      return {
        ...line,
        discountPerUnit,
        finalUnitPrice,
        lineSubtotal,
        lineDiscount,
        lineTotal,
        tierPercentApplied,
      };
    });

    const finalTotal = subtotal - discountAmount;

    return NextResponse.json({
      success: errors.length === 0,
      totalQuantity,
      subtotal,
      discountPercent: tierPercentApplied,
      discountAmount,
      finalTotal,
      progressMessage,
      qualifyingTier,
      nextTier: nextTier
        ? {
            minQuantity: nextTier.minQuantity,
            discountPercent: nextTier.discountPercent,
            itemsNeeded: nextTier.minQuantity - totalQuantity,
          }
        : null,
      items: detailedLines,
      errors,
    });
  } catch (err: any) {
    console.error('Error in POST /api/custom-bundle/calculate:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

