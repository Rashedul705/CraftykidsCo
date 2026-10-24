import { describe, it } from 'node:test';
import assert from 'node:assert';
import { OrderCreateInputSchema } from '../src/lib/validations';

describe('Server-Side Zod Validation Rules for Orders', () => {
  it('accepts valid order input with integer prices and 11-digit BD phone', () => {
    const validData = {
      customerName: 'রাকিব হাসান',
      customerPhone: '01712345678',
      district: 'Dhaka (ঢাকা)',
      fullAddress: 'বাড়ি #১৫, রোড #৩, ধানমন্ডি, ঢাকা',
      paymentMethod: 'COD',
      items: [
        {
          productId: 'prod-crayons-24',
          title: 'CraftyKidsCo মোমের রঙ - ২৪ শেড',
          variationSku: 'CRAYON-24',
          variationTitle: '২৪ রঙের ক্লাসিক সেট',
          price: 299,
          quantity: 2,
        },
      ],
    };

    const res = OrderCreateInputSchema.safeParse(validData);
    assert.strictEqual(res.success, true);
  });

  it('rejects order with invalid phone number', () => {
    const invalidPhone = {
      customerName: 'রাকিব হাসান',
      customerPhone: '012345', // invalid length & operator prefix
      district: 'Dhaka',
      fullAddress: 'ধানমন্ডি, ঢাকা',
      items: [
        {
          productId: 'prod-1',
          title: 'টেস্ট পণ্য',
          price: 150,
          quantity: 1,
        },
      ],
    };

    const res = OrderCreateInputSchema.safeParse(invalidPhone);
    assert.strictEqual(res.success, false);
    if (!res.success) {
      assert.match(res.error.issues[0].message, /মোবাইল নম্বর/);
    }
  });

  it('rejects order with empty items array (empty cart)', () => {
    const emptyItems = {
      customerName: 'সুমাইয়া আক্তার',
      customerPhone: '01812345678',
      district: 'Chittagong',
      fullAddress: 'জিইসি মোড়, চট্টগ্রাম',
      items: [],
    };

    const res = OrderCreateInputSchema.safeParse(emptyItems);
    assert.strictEqual(res.success, false);
    if (!res.success) {
      assert.match(res.error.issues[0].message, /অন্তত একটি পণ্য/);
    }
  });

  it('rejects floating point price (violates whole integer taka rule)', () => {
    const floatPrice = {
      customerName: 'সুমাইয়া আক্তার',
      customerPhone: '01812345678',
      district: 'Chittagong',
      fullAddress: 'জিইসি মোড়, চট্টগ্রাম',
      items: [
        {
          productId: 'prod-1',
          title: 'টেস্ট পণ্য',
          price: 199.99, // Float price!
          quantity: 1,
        },
      ],
    };

    const res = OrderCreateInputSchema.safeParse(floatPrice);
    assert.strictEqual(res.success, false);
    if (!res.success) {
      assert.match(res.error.issues[0].message, /integer/i);
    }
  });

  it('accepts manual order input with thana, product variant, quantity, deliveryCharge, and totalAmount', () => {
    const manualOrderData = {
      customerName: 'নুসরাত জাহান',
      customerPhone: '01912345678',
      district: 'Dhaka',
      thana: 'Dhanmondi',
      fullAddress: 'বাড়ি #১২, রোড #৫, ধানমন্ডি, ঢাকা',
      paymentMethod: 'COD',
      source: 'facebook',
      deliveryCharge: 60,
      totalAmount: 1559,
      items: [
        {
          productId: 'prod-car-painting',
          title: 'কার পেইন্টিং কিট - ১২ পিস সেট',
          variationSku: 'CAR-PAINT-24',
          variationTitle: '২৪ পিস মেগা বক্স',
          variationTitleBn: '২৪ পিস মেগা বক্স',
          price: 1499,
          quantity: 1,
        },
      ],
    };

    const res = OrderCreateInputSchema.safeParse(manualOrderData);
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.strictEqual(res.data.thana, 'Dhanmondi');
      assert.strictEqual(res.data.source, 'facebook');
      assert.strictEqual(res.data.totalAmount, 1559);
      assert.strictEqual(res.data.items[0].variationTitle, '২৪ পিস মেগা বক্স');
      assert.strictEqual(res.data.items[0].quantity, 1);
    }
  });
});
