import { describe, it } from 'node:test';
import assert from 'node:assert';

interface VariationStockState {
  sku: string;
  stockQuantity: number;
}

export function deductStock(
  item: VariationStockState,
  requestedQuantity: number
): { success: boolean; remainingStock: number; error?: string } {
  if (requestedQuantity <= 0) {
    return { success: false, remainingStock: item.stockQuantity, error: 'Invalid quantity' };
  }

  if (item.stockQuantity < requestedQuantity) {
    return {
      success: false,
      remainingStock: item.stockQuantity,
      error: `Only ${item.stockQuantity} items in stock`,
    };
  }

  const remainingStock = item.stockQuantity - requestedQuantity;
  return { success: true, remainingStock };
}

export function restoreStock(
  item: VariationStockState,
  cancelledQuantity: number
): { success: boolean; restoredStock: number } {
  const restoredStock = item.stockQuantity + cancelledQuantity;
  return { success: true, restoredStock };
}

describe('Variation Stock Tracking Rules', () => {
  it('successfully deducts stock when quantity is available', () => {
    const variation: VariationStockState = { sku: 'CRAYON-24', stockQuantity: 20 };
    const res = deductStock(variation, 3);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.remainingStock, 17);
  });

  it('prevents overselling when requested quantity exceeds available inventory', () => {
    const variation: VariationStockState = { sku: 'CRAYON-24', stockQuantity: 2 };
    const res = deductStock(variation, 5);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.remainingStock, 2);
  });

  it('restores stock when an order is cancelled or returned', () => {
    const variation: VariationStockState = { sku: 'CRAYON-24', stockQuantity: 17 };
    const res = restoreStock(variation, 3);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.restoredStock, 20);
  });
});
