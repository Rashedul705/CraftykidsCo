import { describe, it } from 'node:test';
import assert from 'node:assert';

interface DeliveryCalculationInput {
  subtotal: number;
  district: string;
  freeShippingEnabled?: boolean;
  freeDeliveryThreshold?: number;
}

export function calculateDeliveryCharge(input: DeliveryCalculationInput): {
  deliveryCharge: number;
  isFreeDelivery: boolean;
  remainingForFreeDelivery: number;
} {
  const freeEnabled = input.freeShippingEnabled !== false;
  const threshold = input.freeDeliveryThreshold ?? 1000;
  const isInsideDhaka = input.district.trim().toLowerCase().includes('dhaka');
  const baseCharge = isInsideDhaka ? 60 : 120;

  if (freeEnabled && input.subtotal >= threshold) {
    return {
      deliveryCharge: 0,
      isFreeDelivery: true,
      remainingForFreeDelivery: 0,
    };
  }

  return {
    deliveryCharge: baseCharge,
    isFreeDelivery: false,
    remainingForFreeDelivery: freeEnabled ? Math.max(0, threshold - input.subtotal) : 0,
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

  it('applies standard delivery charges when freeShippingEnabled is toggled false regardless of subtotal', () => {
    const dhakaBigOrder = calculateDeliveryCharge({
      subtotal: 5000,
      district: 'Dhaka',
      freeShippingEnabled: false,
    });
    assert.strictEqual(dhakaBigOrder.deliveryCharge, 60);
    assert.strictEqual(dhakaBigOrder.isFreeDelivery, false);
    assert.strictEqual(dhakaBigOrder.remainingForFreeDelivery, 0);

    const outsideBigOrder = calculateDeliveryCharge({
      subtotal: 8000,
      district: 'Khulna',
      freeShippingEnabled: false,
    });
    assert.strictEqual(outsideBigOrder.deliveryCharge, 120);
    assert.strictEqual(outsideBigOrder.isFreeDelivery, false);
    assert.strictEqual(outsideBigOrder.remainingForFreeDelivery, 0);
  });

  it('honors custom threshold limit (e.g. ৳1500) when freeShippingEnabled is true', () => {
    const underCustom = calculateDeliveryCharge({
      subtotal: 1200,
      district: 'Dhaka',
      freeShippingEnabled: true,
      freeDeliveryThreshold: 1500,
    });
    assert.strictEqual(underCustom.deliveryCharge, 60);
    assert.strictEqual(underCustom.isFreeDelivery, false);
    assert.strictEqual(underCustom.remainingForFreeDelivery, 300);

    const overCustom = calculateDeliveryCharge({
      subtotal: 1600,
      district: 'Dhaka',
      freeShippingEnabled: true,
      freeDeliveryThreshold: 1500,
    });
    assert.strictEqual(overCustom.deliveryCharge, 0);
    assert.strictEqual(overCustom.isFreeDelivery, true);
  });
});
