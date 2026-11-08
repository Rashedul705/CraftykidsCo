import { connectToDatabase } from '@/lib/mongodb';
import { BundleTier } from '@/models/BundleTier';
import { BundleSetting } from '@/models/BundleSetting';

export interface RecalculatedOrderResult {
  items: any[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
}

/**
 * Recalculate remaining items when one or more items in a bundle order are returned or cancelled.
 *
 * Rules:
 * 1. Custom Bundles:
 *    - For each custom bundle group (grouped by bundleGroupId), calculate remaining quantity.
 *    - Match remaining quantity against active tiers.
 *    - If remaining quantity falls below the lowest tier (or remaining quantity < lowest minQuantity),
 *      discount becomes 0 for remaining items.
 *    - If it still qualifies for a lower tier, apply that tier's percent on remaining items.
 * 2. Curated Combos:
 *    - For fixed-price or percent curated combos: a partial return means the combo discount
 *      becomes 0 for the remaining items (each reverts to its originalUnitPrice).
 */
export async function recalculateBundleOrderOnPartialReturn(
  remainingItems: any[],
  deliveryCharge: number = 0
): Promise<RecalculatedOrderResult> {
  await connectToDatabase();
  const [tiers, setting] = await Promise.all([
    BundleTier.find({ isActive: true }).sort({ minQuantity: 1 }).lean(),
    BundleSetting.findOne().lean(),
  ]);

  const maxDiscount = setting?.maxDiscountPercent ?? 20;

  // Group custom bundles by bundleGroupId
  const customGroups: { [groupId: string]: any[] } = {};
  const curatedGroups: { [groupId: string]: any[] } = {};
  const regularItems: any[] = [];

  for (const item of remainingItems) {
    if (item.bundleType === 'custom' && item.bundleGroupId) {
      if (!customGroups[item.bundleGroupId]) {
        customGroups[item.bundleGroupId] = [];
      }
      customGroups[item.bundleGroupId].push(item);
    } else if (item.bundleType === 'curated' && item.bundleGroupId) {
      if (!curatedGroups[item.bundleGroupId]) {
        curatedGroups[item.bundleGroupId] = [];
      }
      curatedGroups[item.bundleGroupId].push(item);
    } else {
      regularItems.push(item);
    }
  }

  const updatedItems: any[] = [];
  let subtotal = 0;
  let totalDiscount = 0;

  // Process Custom Bundles
  for (const groupId of Object.keys(customGroups)) {
    const groupItems = customGroups[groupId];
    const totalQty = groupItems.reduce((acc, it) => acc + (it.quantity || 1), 0);

    // Find highest qualifying tier for remaining quantity
    let qualifyingTier: any = null;
    for (const t of tiers) {
      if (totalQty >= t.minQuantity) {
        qualifyingTier = t;
      }
    }

    const appliedPercent = qualifyingTier
      ? Math.min(qualifyingTier.discountPercent, maxDiscount)
      : 0;

    for (const item of groupItems) {
      const origUnit = item.originalUnitPrice ?? item.price;
      const qty = item.quantity || 1;
      const lineSubtotal = origUnit * qty;
      const discountPerUnit = appliedPercent > 0 ? Math.round((origUnit * appliedPercent) / 100) : 0;
      const lineDiscount = discountPerUnit * qty;
      const finalPrice = origUnit - discountPerUnit;

      subtotal += lineSubtotal;
      totalDiscount += lineDiscount;

      updatedItems.push({
        ...item,
        originalUnitPrice: origUnit,
        discountAmount: lineDiscount,
        finalPrice,
        price: finalPrice,
        total: finalPrice * qty,
        totalPrice: finalPrice * qty,
        tierPercentApplied: appliedPercent,
      });
    }
  }

  // Process Curated Combos
  for (const groupId of Object.keys(curatedGroups)) {
    const groupItems = curatedGroups[groupId];
    const isPartialCurated = Boolean((groupItems as any).isPartial || groupItems.some((it) => it.isPartialReturn));

    for (const item of groupItems) {
      const origUnit = item.originalUnitPrice ?? item.price;
      const qty = item.quantity || 1;
      const lineSubtotal = origUnit * qty;

      // If partial return on curated combo, discount becomes 0
      const discountPerUnit = isPartialCurated
        ? 0
        : Math.round(((item.discountAmount || 0) / qty) || 0);
      const lineDiscount = discountPerUnit * qty;
      const finalPrice = origUnit - discountPerUnit;

      subtotal += lineSubtotal;
      totalDiscount += lineDiscount;

      updatedItems.push({
        ...item,
        originalUnitPrice: origUnit,
        discountAmount: lineDiscount,
        finalPrice,
        price: finalPrice,
        total: finalPrice * qty,
        totalPrice: finalPrice * qty,
        tierPercentApplied: isPartialCurated ? 0 : item.tierPercentApplied || 0,
      });
    }
  }

  // Regular / gift items
  for (const item of regularItems) {
    const origUnit = item.originalUnitPrice ?? item.price;
    const qty = item.quantity || 1;
    const lineSubtotal = origUnit * qty;
    const lineDiscount = item.discountAmount ?? 0;
    const finalPrice = item.finalPrice ?? item.price;

    subtotal += lineSubtotal;
    totalDiscount += lineDiscount;

    updatedItems.push({
      ...item,
      originalUnitPrice: origUnit,
      discountAmount: lineDiscount,
      finalPrice,
      price: finalPrice,
      total: finalPrice * qty,
      totalPrice: finalPrice * qty,
    });
  }

  const totalAmount = Math.max(0, subtotal - totalDiscount + deliveryCharge);

  return {
    items: updatedItems,
    subtotal,
    discountAmount: totalDiscount,
    totalAmount,
  };
}

