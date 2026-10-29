import { OrderRecord, globalOrders, getAllProducts } from './store';
import { OrderCreateInput } from './validations';
import { normalizeBDPhone } from './utils';
import { getDeliverySettings, calculateDelivery } from './delivery-store';

export interface DeliveryCalculationResult {
  deliveryCharge: number;
  isFreeDelivery: boolean;
  remainingForFreeDelivery: number;
}

export function calculateDeliveryCharge(input: {
  subtotal: number;
  district: string;
  freeShippingEnabled?: boolean;
  freeDeliveryThreshold?: number;
  thana?: string;
}): DeliveryCalculationResult {
  const currentSettings = getDeliverySettings();
  const freeEnabled = input.freeShippingEnabled !== undefined
    ? input.freeShippingEnabled
    : currentSettings.freeShippingEnabled;
  const threshold = input.freeDeliveryThreshold ?? currentSettings.freeDeliveryThreshold ?? 1000;

  const res = calculateDelivery(
    input.district,
    input.subtotal,
    {
      ...currentSettings,
      freeShippingEnabled: freeEnabled,
      freeDeliveryThreshold: threshold,
    },
    input.thana
  );

  return {
    deliveryCharge: res.charge,
    isFreeDelivery: res.isFree,
    remainingForFreeDelivery: freeEnabled ? Math.max(0, threshold - input.subtotal) : 0,
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
  if (dyn.coupon) {
    return {
      valid: dyn.valid,
      discountAmount: dyn.discountAmount,
      message: dyn.message,
    };
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
    if (product) {
      if (product.variations && product.variations.length > 0 && item.variationSku) {
        const variation = product.variations.find(
          (v) => v.sku === item.variationSku || v.id === item.variationSku
        );
        const currentVarStock = variation
          ? (variation.stock !== undefined ? variation.stock : (variation as any).stockQuantity ?? 0)
          : 0;
        if (variation && currentVarStock < item.quantity) {
          return {
            success: false,
            error: `পণ্য '${product.titleBn} (${variation.titleBn || variation.titleEn})' এর পর্যাপ্ত স্টক নেই (বাকি: ${currentVarStock}টি)`,
          };
        }
      } else {
        const currentStock = (product as any).stock ?? 25;
        if (currentStock < item.quantity) {
          return {
            success: false,
            error: `পণ্য '${product.titleBn}' এর পর্যাপ্ত স্টক নেই (বাকি: ${currentStock}টি)`,
          };
        }
      }
    }
  }

  // Second pass: deduct
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId || p.slug === item.productId);
    if (product) {
      if (product.variations && product.variations.length > 0 && item.variationSku) {
        const variation = product.variations.find(
          (v) => v.sku === item.variationSku || v.id === item.variationSku
        );
        if (variation) {
          const prevStock = variation.stock !== undefined ? variation.stock : (variation as any).stockQuantity ?? 0;
          const nextStock = Math.max(0, prevStock - item.quantity);
          variation.stock = nextStock;
          (variation as any).stockQuantity = nextStock;
        }
        product.stock = product.variations.reduce(
          (sum, v) => sum + (v.stock !== undefined ? v.stock : (v as any).stockQuantity ?? 0),
          0
        );
      } else {
        const currentStock = (product as any).stock ?? 25;
        (product as any).stock = Math.max(0, currentStock - item.quantity);
      }
    }
  }

  return { success: true };
}

/**
 * Restore inventory stock on cancellation or return
 */
export function restoreInventoryStock(order: OrderRecord): void {
  const products = getAllProducts();
  for (const item of order.items) {
    const product = products.find((p) => p.id === item.productId || p.slug === item.productId);
    if (product) {
      if (product.variations && product.variations.length > 0) {
        const variation = product.variations.find(
          (v) =>
            (item.variationSku && (v.sku === item.variationSku || v.id === item.variationSku)) ||
            (item.variationTitle && (v.titleBn === item.variationTitle || v.titleEn === item.variationTitle))
        );
        if (variation) {
          const prevStock = variation.stock !== undefined ? variation.stock : (variation as any).stockQuantity ?? 0;
          const nextStock = prevStock + item.quantity;
          variation.stock = nextStock;
          (variation as any).stockQuantity = nextStock;
        }
        product.stock = product.variations.reduce(
          (sum, v) => sum + (v.stock !== undefined ? v.stock : (v as any).stockQuantity ?? 0),
          0
        );
      } else {
        const currentStock = (product as any).stock ?? 25;
        (product as any).stock = currentStock + item.quantity;
      }
    }
  }
}

export { deductOrderStockAtomic, restoreOrderStockAtomic, OutOfStockError } from './order-stock';

/**
 * Deduct stock atomically with MongoDB transaction and StockLog logging
 */
export async function deductDatabaseStock(
  items: any[],
  orderNumber: string = `ORDER-${Date.now()}`
): Promise<void> {
  const { connectToDatabase } = await import('./mongodb');
  const mongoose = (await import('mongoose')).default;
  await connectToDatabase();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { deductOrderStockAtomic } = await import('./order-stock');
    await deductOrderStockAtomic(items, orderNumber, session);
    await session.commitTransaction();
  } catch (err: any) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Restore stock atomically with MongoDB transaction and StockLog logging
 */
export async function restoreDatabaseStock(
  itemsOrOrder: any,
  reason: 'cancel' | 'return' = 'cancel',
  orderNumber?: string
): Promise<void> {
  const { restoreOrderStockAtomic } = await import('./order-stock');
  const orderObj = Array.isArray(itemsOrOrder)
    ? { orderNumber: orderNumber || `ORDER-${Date.now()}`, items: itemsOrOrder }
    : itemsOrOrder;
  await restoreOrderStockAtomic(orderObj, reason);
}

