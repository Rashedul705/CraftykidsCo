import { describe, it } from 'node:test';
import assert from 'node:assert';

interface CouponRule {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountVal: number;
  minOrderVal: number;
  maxDiscount?: number;
  isActive: boolean;
}

export function applyCoupon(
  coupon: CouponRule,
  orderSubtotal: number
): { valid: boolean; discountAmount: number; message?: string } {
  if (!coupon.isActive) {
    return { valid: false, discountAmount: 0, message: 'Coupon is inactive' };
  }

  if (orderSubtotal < coupon.minOrderVal) {
    return {
      valid: false,
      discountAmount: 0,
      message: `Minimum order of ৳${coupon.minOrderVal} required`,
    };
  }

  if (coupon.discountType === 'PERCENTAGE') {
    const rawDiscount = Math.round((orderSubtotal * coupon.discountVal) / 100);
    const discountAmount = coupon.maxDiscount
      ? Math.min(rawDiscount, coupon.maxDiscount)
      : rawDiscount;
    return { valid: true, discountAmount };
  }

  // FIXED
  const discountAmount = Math.min(orderSubtotal, coupon.discountVal);
  return { valid: true, discountAmount };
}

describe('Coupon Code Discount Engine', () => {
  const percentageCoupon: CouponRule = {
    code: 'RONG10',
    discountType: 'PERCENTAGE',
    discountVal: 10,
    minOrderVal: 500,
    maxDiscount: 150,
    isActive: true,
  };

  const fixedCoupon: CouponRule = {
    code: 'FREE60',
    discountType: 'FIXED',
    discountVal: 60,
    minOrderVal: 600,
    isActive: true,
  };

  it('rejects coupon if order subtotal is below minimum order value', () => {
    const res = applyCoupon(percentageCoupon, 450);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.discountAmount, 0);
  });

  it('applies 10% discount on orders meeting minimum requirement', () => {
    const res = applyCoupon(percentageCoupon, 800);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.discountAmount, 80);
  });

  it('caps percentage discount to maxDiscount limit', () => {
    const res = applyCoupon(percentageCoupon, 2000);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.discountAmount, 150); // Capped at 150
  });

  it('correctly applies fixed taka discount', () => {
    const res = applyCoupon(fixedCoupon, 750);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.discountAmount, 60);
  });
});
