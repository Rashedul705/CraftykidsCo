import { OrderRecord, globalOrders, getAllProducts } from './store';
import { OrderCreateInput } from './validations';
import { normalizeBDPhone } from './utils';

export interface DeliveryCalculationResult {
  deliveryCharge: number;
  isFreeDelivery: boolean;
  remainingForFreeDelivery: number;
}

export function calculateDeliveryCharge(input: {
  subtotal: number;
  district: string;
  freeDeliveryThreshold?: number;
}): DeliveryCalculationResult {
  const threshold = input.freeDeliveryThreshold ?? 1000;
  const isInsideDhaka = input.district.trim().toLowerCase().includes('dhaka');
  const baseCharge = isInsideDhaka ? 60 : 120;

  if (input.subtotal >= threshold) {
    return {
      deliveryCharge: 0,
      isFreeDelivery: true,
      remainingForFreeDelivery: 0,
    };
  }

  return {
    deliveryCharge: baseCharge,
    isFreeDelivery: false,
    remainingForFreeDelivery: Math.max(0, threshold - input.subtotal),
  };
}

export interface CouponRule {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountVal: number;
  minOrderVal: number;
  maxDiscount?: number;
  isActive: boolean;
}

export const ACTIVE_COUPONS: CouponRule[] = [
  {
    code: 'RONG10',
    discountType: 'PERCENTAGE',
    discountVal: 10,
    minOrderVal: 500,
    maxDiscount: 150,
    isActive: true,
  },
  {
    code: 'FREE60',
    discountType: 'FIXED',
    discountVal: 60,
    minOrderVal: 600,
    isActive: true,
  },
  {
    code: 'CRAFTYKIDS',
    discountType: 'PERCENTAGE',
    discountVal: 15,
    minOrderVal: 800,
    maxDiscount: 200,
    isActive: true,
  },
];

import { validateCoupon as validateDynamicCoupon } from './coupons-store';

export function validateAndApplyCoupon(
  code: string,
  subtotal: number
): { valid: boolean; discountAmount: number; message?: string } {
  // Check dynamic coupons store first
  const dyn = validateDynamicCoupon(code, subtotal);
  if (dyn.valid) {
    return { valid: true, discountAmount: dyn.discountAmount, message: dyn.message };
  }

  const coupon = ACTIVE_COUPONS.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
  if (!coupon || !coupon.isActive) {
    return { valid: false, discountAmount: 0, message: dyn.message || 'কুপন কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ' };
  }

  if (subtotal < coupon.minOrderVal) {
    return {
      valid: false,
      discountAmount: 0,
      message: `এই কুপনের জন্য সর্বনিম্ন ৳${coupon.minOrderVal} টাকার অর্ডার করতে হবে`,
    };
  }

  if (coupon.discountType === 'PERCENTAGE') {
    const rawDiscount = Math.round((subtotal * coupon.discountVal) / 100);
    const discountAmount = coupon.maxDiscount
      ? Math.min(rawDiscount, coupon.maxDiscount)
      : rawDiscount;
    return { valid: true, discountAmount };
  }

  const discountAmount = Math.min(subtotal, coupon.discountVal);
  return { valid: true, discountAmount };
}

/**
 * Deduct stock from global products inventory for each ordered item
 */
export function deductInventoryStock(items: OrderCreateInput['items']): {
  success: boolean;
  error?: string;
} {
  const products = getAllProducts();

  // First pass: verify sufficient stock
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId || p.slug === item.productId);
    if (product && product.variations && item.variationSku) {
      const variation = product.variations.find((v) => v.sku === item.variationSku);
      if (variation && variation.stock < item.quantity) {
        return {
          success: false,
          error: `পণ্য '${product.titleBn} (${variation.titleBn})' এর পর্যাপ্ত স্টক নেই (বাকি: ${variation.stock}টি)`,
        };
      }
    }
  }

  // Second pass: deduct
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId || p.slug === item.productId);
    if (product && product.variations && item.variationSku) {
      const variation = product.variations.find((v) => v.sku === item.variationSku);
      if (variation) {
        variation.stock = Math.max(0, variation.stock - item.quantity);
      }
    }
  }

  return { success: true };
}

/**
 * Restore inventory stock on cancellation
 */
export function restoreInventoryStock(order: OrderRecord): void {
  const products = getAllProducts();
  for (const item of order.items) {
    const product = products.find((p) => p.id === item.productId || p.slug === item.productId);
    if (product && product.variations && item.variationTitle) {
      // Find matching variation
      const variation = product.variations.find(
        (v) => v.titleBn === item.variationTitle || v.titleEn === item.variationTitle
      );
      if (variation) {
        variation.stock += item.quantity;
      }
    }
  }
}
