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

/**
 * Deduct stock directly from MongoDB Atlas documents
 */
export async function deductDatabaseStock(items: any[]): Promise<void> {
  try {
    const { connectToDatabase } = await import('./mongodb');
    const { Product } = await import('@/models/Product');
    await connectToDatabase();

    for (const item of items) {
      const productId = item.productId;
      if (!productId) continue;

      const isObjectId = productId.match(/^[0-9a-fA-F]{24}$/);
      const product = await Product.findOne({
        $or: [
          { id: productId },
          { slug: productId },
          ...(isObjectId ? [{ _id: productId }] : []),
        ],
      });

      if (!product) continue;

      if (product.variations && product.variations.length > 0 && item.variationSku) {
        product.variations = product.variations.map((v: any) => {
          if (v.sku === item.variationSku || v.id === item.variationSku) {
            const currentStock = v.stock !== undefined ? v.stock : (v.stockQuantity ?? 25);
            const nextStock = Math.max(0, currentStock - item.quantity);
            return {
              ...v,
              stock: nextStock,
              stockQuantity: nextStock,
            };
          }
          return v;
        });
        product.stock = product.variations.reduce(
          (sum: number, v: any) => sum + (Number(v.stock ?? v.stockQuantity) || 0),
          0
        );
        product.markModified('variations');
        await product.save();
      } else {
        const currentStock = product.stock ?? 25;
        product.stock = Math.max(0, currentStock - item.quantity);
        await product.save();
      }
    }
  } catch (err: any) {
    console.error('Failed to deduct stock from database:', err?.message || err);
  }
}

/**
 * Restore stock directly to MongoDB Atlas documents
 */
export async function restoreDatabaseStock(items: any[]): Promise<void> {
  try {
    const { connectToDatabase } = await import('./mongodb');
    const { Product } = await import('@/models/Product');
    await connectToDatabase();

    for (const item of items) {
      const productId = item.productId;
      if (!productId) continue;

      const isObjectId = productId.match(/^[0-9a-fA-F]{24}$/);
      const product = await Product.findOne({
        $or: [
          { id: productId },
          { slug: productId },
          ...(isObjectId ? [{ _id: productId }] : []),
        ],
      });

      if (!product) continue;

      if (product.variations && product.variations.length > 0) {
        product.variations = product.variations.map((v: any) => {
          const matchSku = item.variationSku && (v.sku === item.variationSku || v.id === item.variationSku);
          const matchTitle = item.variationTitle && (v.titleBn === item.variationTitle || v.titleEn === item.variationTitle);
          if (matchSku || matchTitle) {
            const currentStock = v.stock !== undefined ? v.stock : (v.stockQuantity ?? 25);
            const nextStock = currentStock + item.quantity;
            return {
              ...v,
              stock: nextStock,
              stockQuantity: nextStock,
            };
          }
          return v;
        });
        product.stock = product.variations.reduce(
          (sum: number, v: any) => sum + (Number(v.stock ?? v.stockQuantity) || 0),
          0
        );
        product.markModified('variations');
        await product.save();
      } else {
        const currentStock = product.stock ?? 25;
        product.stock = currentStock + item.quantity;
        await product.save();
      }
    }
  } catch (err: any) {
    console.error('Failed to restore stock to database:', err?.message || err);
  }
}
