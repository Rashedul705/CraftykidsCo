import { describe, it } from 'node:test';
import assert from 'node:assert';

interface DeliveryCalculationInput {
  subtotal: number;
  district: string;
  freeDeliveryThreshold?: number;
}

export function calculateDeliveryCharge(input: DeliveryCalculationInput): {
  deliveryCharge: number;
  isFreeDelivery: boolean;
  remainingForFreeDelivery: number;
} {
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

describe('Delivery Charge Calculation Rules', () => {
  it('charges ৳60 for orders inside Dhaka below threshold', () => {
    const res = calculateDeliveryCharge({ subtotal: 500, district: 'Dhaka' });
    assert.strictEqual(res.deliveryCharge, 60);
    assert.strictEqual(res.isFreeDelivery, false);
    assert.strictEqual(res.remainingForFreeDelivery, 500);
  });

  it('charges ৳120 for orders outside Dhaka below threshold', () => {
    const res = calculateDeliveryCharge({ subtotal: 650, district: 'Chittagong' });
    assert.strictEqual(res.deliveryCharge, 120);
    assert.strictEqual(res.isFreeDelivery, false);
    assert.strictEqual(res.remainingForFreeDelivery, 350);
  });

  it('provides ৳0 free delivery when subtotal meets or exceeds ৳1,000 anywhere in Bangladesh', () => {
    const dhakaOrder = calculateDeliveryCharge({ subtotal: 1000, district: 'Dhaka' });
    assert.strictEqual(dhakaOrder.deliveryCharge, 0);
    assert.strictEqual(dhakaOrder.isFreeDelivery, true);

    const outsideOrder = calculateDeliveryCharge({ subtotal: 1450, district: 'Sylhet' });
    assert.strictEqual(outsideOrder.deliveryCharge, 0);
    assert.strictEqual(outsideOrder.isFreeDelivery, true);
    assert.strictEqual(outsideOrder.remainingForFreeDelivery, 0);
  });
});
