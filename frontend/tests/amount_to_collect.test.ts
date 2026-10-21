import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateAmountToCollect, isOrderPaid, formatTaka } from '../src/lib/order-calc';

describe('Order Amount to Collect & Calculation Engine', () => {
  it('correctly calculates amountToCollect = subtotal + delivery - discount for standard COD', () => {
    // Specifically testing the bug report case: Subtotal 1569, Delivery 60 => Amount to Collect must be 1629
    const result = calculateAmountToCollect({
      subtotal: 1569,
      deliveryCharge: 60,
      discountAmount: 0,
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
    });

    assert.strictEqual(result.subtotal, 1569);
    assert.strictEqual(result.deliveryCharge, 60);
    assert.strictEqual(result.discount, 0);
    assert.strictEqual(result.grossTotal, 1629);
    assert.strictEqual(result.amountToCollect, 1629);
    assert.strictEqual(result.isPaid, false);
    assert.strictEqual(result.collectDisplayBn, '৳1,629');
    assert.strictEqual(result.collectDisplayEn, '৳1,629');
  });

  it('correctly applies discount in formula: subtotal + delivery - discount', () => {
    const result = calculateAmountToCollect({
      subtotal: 1569,
      deliveryCharge: 60,
      discountAmount: 100,
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
    });

    assert.strictEqual(result.grossTotal, 1529);
    assert.strictEqual(result.amountToCollect, 1529);
    assert.strictEqual(result.collectDisplayBn, '৳1,529');
  });

  it('returns 0 and shows পেইড when order paymentStatus is PAID', () => {
    const result = calculateAmountToCollect({
      subtotal: 1569,
      deliveryCharge: 60,
      discountAmount: 0,
      paymentStatus: 'PAID',
      paymentMethod: 'COD', // Even if marked COD, if paymentStatus is PAID, collect is 0
    });

    assert.strictEqual(result.grossTotal, 1629);
    assert.strictEqual(result.amountToCollect, 0);
    assert.strictEqual(result.isPaid, true);
    assert.strictEqual(result.collectDisplayBn, 'পেইড');
    assert.strictEqual(result.collectDisplayEn, 'PAID');
  });

  it('returns 0 and shows পেইড when paid via bKash / Nagad / Card', () => {
    const bkashOrder = calculateAmountToCollect({
      subtotal: 899,
      deliveryCharge: 120,
      discountAmount: 0,
      paymentMethod: 'BKASH',
      paymentStatus: 'COMPLETED',
    });
    assert.strictEqual(bkashOrder.amountToCollect, 0);
    assert.strictEqual(bkashOrder.isPaid, true);
    assert.strictEqual(bkashOrder.collectDisplayBn, 'পেইড');

    const nagadOrder = calculateAmountToCollect({
      subtotal: 1200,
      deliveryCharge: 0,
      discountAmount: 100,
      paymentMethod: 'NAGAD',
      paymentStatus: 'PAID',
    });
    assert.strictEqual(nagadOrder.amountToCollect, 0);
    assert.strictEqual(nagadOrder.isPaid, true);
    assert.strictEqual(nagadOrder.collectDisplayBn, 'পেইড');
  });

  it('handles free delivery threshold accurately (delivery charge 0)', () => {
    const result = calculateAmountToCollect({
      subtotal: 2150,
      deliveryCharge: 0,
      discountAmount: 0,
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
    });

    assert.strictEqual(result.grossTotal, 2150);
    assert.strictEqual(result.amountToCollect, 2150);
    assert.strictEqual(result.collectDisplayBn, '৳2,150');
  });

  it('gracefully handles missing subtotal by computing from items', () => {
    const result = calculateAmountToCollect({
      deliveryCharge: 60,
      items: [
        { price: 500, quantity: 2 },
        { price: 250, quantity: 1 },
      ],
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
    });

    // 500*2 + 250*1 = 1250, + 60 = 1310
    assert.strictEqual(result.subtotal, 1250);
    assert.strictEqual(result.grossTotal, 1310);
    assert.strictEqual(result.amountToCollect, 1310);
    assert.strictEqual(result.collectDisplayBn, '৳1,310');
  });

  it('formats currency correctly with thousand separators and Taka sign', () => {
    assert.strictEqual(formatTaka(1629), '৳1,629');
    assert.strictEqual(formatTaka(50000), '৳50,000');
    assert.strictEqual(formatTaka(0), '৳0');
  });
});
