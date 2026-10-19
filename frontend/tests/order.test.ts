import { describe, it } from 'node:test';
import assert from 'node:assert';

interface OrderItemInput {
  productId: string;
  variationSku: string;
  titleBn: string;
  titleEn: string;
  unitPrice: number; // Integer BDT
  quantity: number;
}

interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  district: string;
  fullAddress: string;
  items: OrderItemInput[];
  deliveryCharge: number;
  discountAmount?: number;
}

export function createOrderWithSnapshot(input: CreateOrderInput) {
  // Validate integer prices (MongoDB rule: no floats)
  for (const item of input.items) {
    if (!Number.isInteger(item.unitPrice) || item.unitPrice < 0) {
      throw new Error(`Invalid unit price for ${item.titleEn}: must be non-negative integer`);
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error(`Invalid quantity for ${item.titleEn}: must be positive integer`);
    }
  }

  // Calculate items and snapshot
  const itemSnapshots = input.items.map((item) => ({
    ...item,
    totalPrice: item.unitPrice * item.quantity,
  }));

  const subtotal = itemSnapshots.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const deliveryCharge = input.deliveryCharge;
  const discountAmount = input.discountAmount || 0;
  const totalAmount = Math.max(0, subtotal + deliveryCharge - discountAmount);

  // Generate unique order number with date prefix
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const orderNumber = `CKC-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    orderNumber,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    district: input.district,
    fullAddress: input.fullAddress,
    items: itemSnapshots,
    subtotal,
    deliveryCharge,
    discountAmount,
    totalAmount,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    paymentMethod: 'COD',
    createdAt: new Date(),
  };
}

describe('Order Creation & Snapshot Integrity Rules', () => {
  it('creates order with immutable price and title snapshots', () => {
    const input: CreateOrderInput = {
      customerName: 'Rahim Khan',
      customerPhone: '01712345678',
      district: 'Dhaka',
      fullAddress: 'House 12, Road 4, Dhanmondi',
      deliveryCharge: 60,
      discountAmount: 0,
      items: [
        {
          productId: 'prod-1',
          variationSku: 'CRAYON-24',
          titleBn: 'CraftyKidsCo ন্যাচারাল মোমের রঙ - ২৪ শেড',
          titleEn: 'CraftyKidsCo Natural Wax Crayons - 24 Shade Box',
          unitPrice: 299,
          quantity: 2,
        },
      ],
    };

    const order = createOrderWithSnapshot(input);
    assert.strictEqual(order.subtotal, 598);
    assert.strictEqual(order.deliveryCharge, 60);
    assert.strictEqual(order.totalAmount, 658);
    assert.strictEqual(order.items[0].totalPrice, 598);
    assert.match(order.orderNumber, /^CKC-\d{8}-\d{4}$/);
  });

  it('correctly deducts coupon discount from total', () => {
    const input: CreateOrderInput = {
      customerName: 'Sadia Islam',
      customerPhone: '01812345678',
      district: 'Chittagong',
      fullAddress: 'Nasirabad, Chittagong',
      deliveryCharge: 120,
      discountAmount: 50,
      items: [
        {
          productId: 'prod-2',
          variationSku: 'CLAY-6',
          titleBn: 'সুপার সফট প্লে-ডো ৬ কালার',
          titleEn: 'Super Soft Play Dough 6 Colors',
          unitPrice: 275,
          quantity: 2,
        },
      ],
    };

    const order = createOrderWithSnapshot(input);
    assert.strictEqual(order.subtotal, 550);
    assert.strictEqual(order.deliveryCharge, 120);
    assert.strictEqual(order.discountAmount, 50);
    assert.strictEqual(order.totalAmount, 620); // 550 + 120 - 50 = 620
  });

  it('rejects floating point price inputs according to integer taka rule', () => {
    assert.throws(
      () =>
        createOrderWithSnapshot({
          customerName: 'Test',
          customerPhone: '01700000000',
          district: 'Dhaka',
          fullAddress: 'Test Address',
          deliveryCharge: 60,
          items: [
            {
              productId: 'prod-3',
              variationSku: 'INVALID-PRICE',
              titleBn: 'Test',
              titleEn: 'Test',
              unitPrice: 199.99, // Invalid float
              quantity: 1,
            },
          ],
        }),
      /must be non-negative integer/
    );
  });
});
