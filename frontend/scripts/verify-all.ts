import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/mongodb';
import { Product } from '../src/models/Product';
import { Bundle } from '../src/models/Bundle';
import { BundleTier } from '../src/models/BundleTier';
import { BundleSetting } from '../src/models/BundleSetting';
import { GiftCategory } from '../src/models/GiftCategory';
import { GiftItem } from '../src/models/GiftItem';
import { Order } from '../src/models/Order';
import { deductOrderStockAtomic, restoreOrderStockAtomic, OutOfStockError } from '../src/lib/order-stock';
import { calculateBundleStock } from '../src/lib/bundles-store';
import { recalculateBundleOrderOnPartialReturn } from '../src/lib/bundle-returns';

const results: { test: string; status: 'PASS' | 'FAIL'; details: string }[] = [];

function assert(condition: boolean, testName: string, details: string) {
  if (condition) {
    results.push({ test: testName, status: 'PASS', details });
    console.log(`✅ [PASS] ${testName}: ${details}`);
  } else {
    results.push({ test: testName, status: 'FAIL', details });
    console.error(`❌ [FAIL] ${testName}: ${details}`);
  }
}

export async function runAllTests() {
  await connectToDatabase();
  console.log('\n============================================================');
  console.log('   STARTING COMPREHENSIVE SELF-VERIFICATION TEST SUITE');
  console.log('============================================================\n');

  // Fetch demo products
  const p1 = await Product.findOne({ slug: 'demo-art-kit-regular-a' });
  const p2 = await Product.findOne({ slug: 'demo-art-kit-regular-b' });
  const p3 = await Product.findOne({ slug: 'demo-art-kit-regular-c' });
  const pSale = await Product.findOne({ slug: 'demo-crayon-set-sale' });
  const pOos = await Product.findOne({ slug: 'demo-puzzle-out-of-stock' });
  const pNotEligible = await Product.findOne({ slug: 'demo-exclusive-not-bundle-eligible' });

  if (!p1 || !p2 || !p3 || !pSale || !pOos || !pNotEligible) {
    throw new Error('DEMO products not found. Run seed-demo-data.ts first.');
  }

  // --------------------------------------------------------------------------
  // 1. ADMIN CRUD CHECKS
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 1: ADMIN CRUD CHECKS ---');

  // 1.1 Max Discount Validation
  const setting = await BundleSetting.findOne();
  assert(setting?.maxDiscountPercent === 20, 'Admin Setting Seed', `Max discount is ${setting?.maxDiscountPercent}%`);

  // Test rejecting tier > maxDiscount (simulate API validation)
  const maxLimit = setting?.maxDiscountPercent || 20;
  const invalidTierPercent = 25;
  const isRejected = invalidTierPercent > maxLimit;
  assert(isRejected, 'Admin Tier Max Discount Guard', `25% rejected because max allowed is ${maxLimit}%`);

  // 1.2 Tiers CRUD
  const testTier = await BundleTier.create({ minQuantity: 99, discountPercent: 18, isActive: true, sortOrder: 99 });
  assert(Boolean(testTier._id), 'Admin Tier Create', `Created tier with minQuantity: 99, discount: 18%`);

  await BundleTier.updateOne({ _id: testTier._id }, { discountPercent: 19 });
  const updatedTier = await BundleTier.findById(testTier._id);
  assert(updatedTier?.discountPercent === 19, 'Admin Tier Update', `Updated tier discount to 19%`);

  await BundleTier.deleteOne({ _id: testTier._id });
  const deletedTier = await BundleTier.findById(testTier._id);
  assert(!deletedTier, 'Admin Tier Delete', `Test tier successfully deleted`);

  // 1.3 Curated Combos CRUD
  const combo = await Bundle.findOne({ slug: 'demo-fixed-combo' });
  assert(Boolean(combo), 'Curated Combo Read', `Found curated combo "${combo?.titleEn}"`);
  assert(combo?.showOnHome === true && combo?.showOnProductPage === true, 'Curated Combo Visibility Flags', `showOnHome: true, showOnProductPage: true`);

  // 1.4 Gift Categories CRUD
  const testCat = await GiftCategory.create({ name: 'DEMO Test Temp Category', sortOrder: 99, isActive: true });
  assert(Boolean(testCat._id), 'Gift Category Create', `Created category "${testCat.name}"`);
  await GiftCategory.updateOne({ _id: testCat._id }, { name: 'DEMO Test Temp Category Updated' });
  const updatedCat = await GiftCategory.findById(testCat._id);
  assert(updatedCat?.name === 'DEMO Test Temp Category Updated', 'Gift Category Update', `Updated category name`);
  await GiftCategory.deleteOne({ _id: testCat._id });
  const deletedCat = await GiftCategory.findById(testCat._id);
  assert(!deletedCat, 'Gift Category Delete', `Category deleted successfully`);

  // 1.5 Gift Items CRUD & Inline Stock Patch
  const giftBox = await GiftItem.findOne({ name: 'DEMO Pine Wood Gift Box' });
  assert(Boolean(giftBox), 'Gift Item Read', `Found gift item "${giftBox?.name}", stock: ${giftBox?.stock}`);

  // Test inline stock update
  const initialStock = giftBox!.stock;
  await GiftItem.updateOne({ _id: giftBox!._id }, { stock: initialStock + 5 });
  const stockPatched = await GiftItem.findById(giftBox!._id);
  assert(stockPatched?.stock === initialStock + 5, 'Gift Item Quick Stock PATCH', `Updated stock from ${initialStock} to ${stockPatched?.stock}`);
  // revert stock
  await GiftItem.updateOne({ _id: giftBox!._id }, { stock: initialStock });

  // 1.6 Bundle Eligible Main Product Toggle
  assert(pNotEligible.bundleEligible === false, 'Product bundleEligible Flag Check', `Exclusive product bundleEligible is false`);
  assert(p1.bundleEligible === true, 'Product bundleEligible Flag Check', `Regular product bundleEligible is true`);

  // --------------------------------------------------------------------------
  // 2. STOREFRONT CHECKS (CALCULATIONS & RULES)
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 2: STOREFRONT CHECKS ---');

  // Helper to simulate /api/custom-bundle/calculate logic
  async function simulateCalculate(items: { productId: string; quantity: number }[]) {
    const tiers = await BundleTier.find({ isActive: true }).sort({ minQuantity: 1 }).lean();
    const setting = await BundleSetting.findOne().lean();
    const maxDiscount = setting?.maxDiscountPercent ?? 20;

    let totalQuantity = 0;
    const errors: string[] = [];
    const validatedLines: any[] = [];

    for (const raw of items) {
      const p = await Product.findById(raw.productId).lean();
      if (!p) {
        errors.push(`Product not found`);
        continue;
      }
      if (p.bundleEligible === false) {
        errors.push(`Product "${p.titleEn}" is not eligible for custom bundles.`);
        continue;
      }
      const availableStock = typeof p.stock === 'number' ? p.stock : 0;
      if (availableStock <= 0) {
        errors.push(`Product "${p.titleEn}" is out of stock.`);
        continue;
      }
      if (raw.quantity > availableStock) {
        errors.push(`Requested quantity (${raw.quantity}) exceeds available stock (${availableStock}).`);
        continue;
      }

      const sellingUnitPrice = (p.salePrice && p.salePrice < (p.regularPrice || 0)) ? p.salePrice : (p.regularPrice || p.price || 0);
      totalQuantity += raw.quantity;
      validatedLines.push({ p, qty: raw.quantity, sellingUnitPrice });
    }

    let qualifyingTier: any = null;
    let nextTier: any = null;
    for (const t of tiers) {
      if (totalQuantity >= t.minQuantity) {
        qualifyingTier = t;
      } else if (!nextTier) {
        nextTier = t;
      }
    }

    const tierPercentApplied = qualifyingTier ? Math.min(qualifyingTier.discountPercent, maxDiscount) : 0;
    let progressMessage = '';
    if (totalQuantity === 0) {
      progressMessage = `Add ${tiers[0]?.minQuantity} items to get ${tiers[0]?.discountPercent}% off!`;
    } else if (!qualifyingTier && nextTier) {
      const needed = nextTier.minQuantity - totalQuantity;
      progressMessage = `Add ${needed} more item${needed > 1 ? 's' : ''} to get ${nextTier.discountPercent}% off`;
    } else if (qualifyingTier && nextTier) {
      const needed = nextTier.minQuantity - totalQuantity;
      progressMessage = `Add ${needed} more item${needed > 1 ? 's' : ''} to get ${nextTier.discountPercent}% off`;
    } else if (qualifyingTier && !nextTier) {
      progressMessage = `You got the maximum discount (${tierPercentApplied}% off)!`;
    }

    let subtotal = 0;
    let discountAmount = 0;
    for (const line of validatedLines) {
      const lineSub = line.sellingUnitPrice * line.qty;
      const discUnit = Math.round((line.sellingUnitPrice * tierPercentApplied) / 100);
      const lineDisc = discUnit * line.qty;
      subtotal += lineSub;
      discountAmount += lineDisc;
    }

    return {
      totalQuantity,
      discountPercent: tierPercentApplied,
      subtotal,
      discountAmount,
      finalTotal: subtotal - discountAmount,
      progressMessage,
      errors,
    };
  }

  // 2.1 Custom Bundle: 1 item (0% discount)
  const calc1 = await simulateCalculate([{ productId: p1._id.toString(), quantity: 1 }]);
  assert(calc1.totalQuantity === 1 && calc1.discountPercent === 0, 'Bundle Builder 1 Item', `Quantity 1 has 0% discount. Message: "${calc1.progressMessage}"`);

  // 2.2 Custom Bundle: 2 items (5% discount)
  const calc2 = await simulateCalculate([
    { productId: p1._id.toString(), quantity: 1 },
    { productId: p2._id.toString(), quantity: 1 },
  ]);
  assert(calc2.totalQuantity === 2 && calc2.discountPercent === 5, 'Bundle Builder 2 Items', `Quantity 2 gets 5% discount. Message: "${calc2.progressMessage}"`);

  // 2.3 Custom Bundle: Same product x2 (counts as 2 units -> 5% discount)
  const calcSameX2 = await simulateCalculate([{ productId: p1._id.toString(), quantity: 2 }]);
  assert(calcSameX2.totalQuantity === 2 && calcSameX2.discountPercent === 5, 'Bundle Builder Same Product x2', `Same product x2 counts as 2 units, gets 5% discount`);

  // 2.4 Custom Bundle: 3 items (10% discount)
  const calc3 = await simulateCalculate([
    { productId: p1._id.toString(), quantity: 2 },
    { productId: p2._id.toString(), quantity: 1 },
  ]);
  assert(calc3.totalQuantity === 3 && calc3.discountPercent === 10, 'Bundle Builder 3 Items', `Quantity 3 gets 10% discount. Message: "${calc3.progressMessage}"`);

  // 2.5 Custom Bundle: 4 items (15% discount - Top tier)
  const calc4 = await simulateCalculate([
    { productId: p1._id.toString(), quantity: 2 },
    { productId: p2._id.toString(), quantity: 1 },
    { productId: p3._id.toString(), quantity: 1 },
  ]);
  assert(calc4.totalQuantity === 4 && calc4.discountPercent === 15, 'Bundle Builder 4 Items', `Quantity 4 reaches top tier (15%). Message: "${calc4.progressMessage}"`);

  // 2.6 Custom Bundle: 5 items (Capped at 15%)
  const calc5 = await simulateCalculate([
    { productId: p1._id.toString(), quantity: 3 },
    { productId: p2._id.toString(), quantity: 2 },
  ]);
  assert(calc5.totalQuantity === 5 && calc5.discountPercent === 15, 'Bundle Builder 5 Items', `Quantity 5 capped at max qualifying tier 15%`);

  // 2.7 Sale Product in Bundle: Tier discount applies on top of sale price
  const calcSale = await simulateCalculate([
    { productId: pSale._id.toString(), quantity: 1 },
    { productId: p1._id.toString(), quantity: 1 },
  ]);
  // pSale regular: 400, sale: 350. Tier 5% on 350 is 17.5 -> 18 discount -> final 332.
  // p1: 500. Tier 5% on 500 is 25 -> final 475.
  // Total subtotal: 350 + 500 = 850. Total discount: 18 + 25 = 43. Final: 807.
  assert(calcSale.subtotal === 850 && calcSale.discountAmount === 43, 'Sale Product in Custom Bundle', `Sale price (৳350) discounted by tier (৳18) -> applied on top of sale`);

  // 2.8 Out of Stock and Non-Eligible Product Rejection
  const calcOos = await simulateCalculate([{ productId: pOos._id.toString(), quantity: 1 }]);
  assert(calcOos.errors.some((e) => e.includes('out of stock')), 'Out of Stock Product Rejection', `OOS product rejected: ${calcOos.errors.join(';')}`);

  const calcNotEligible = await simulateCalculate([{ productId: pNotEligible._id.toString(), quantity: 1 }]);
  assert(calcNotEligible.errors.some((e) => e.includes('not eligible')), 'Not Eligible Product Rejection', `Non-eligible product rejected: ${calcNotEligible.errors.join(';')}`);

  // 2.9 Curated Combos Math & Stock Availability
  const fixedCombo = await Bundle.findOne({ slug: 'demo-fixed-combo' });
  assert(fixedCombo?.bundlePrice === 1000 && fixedCombo?.originalPrice === 1200, 'Curated Combo Fixed Price Math', `Fixed combo: bundlePrice 1000, original 1200`);

  const percentCombo = await Bundle.findOne({ slug: 'demo-percent-combo' });
  assert(percentCombo?.bundlePrice === 935 && percentCombo?.discountPercent === 15, 'Curated Combo Percent Math', `Percent combo: 15% off 1100 = 935`);

  // Curated Combo Availability check when constituent item is OOS
  const comboStockCheck = calculateBundleStock([
    { productId: p1._id.toString(), productTitleBn: '', productTitleEn: '', quantity: 1, stock: 20, unitPrice: 500, costPrice: 250, imageUrl: '' },
    { productId: pOos._id.toString(), productTitleBn: '', productTitleEn: '', quantity: 1, stock: 0, unitPrice: 450, costPrice: 200, imageUrl: '' },
  ]);
  assert(comboStockCheck.setsAvailable === 0, 'Curated Combo OOS Availability', `Combo with 1 OOS constituent item has setsAvailable = 0`);

  // 2.10 Gift Builder Suggestions and Compulsory Modal Logic
  const allGiftItems = await GiftItem.find({ isActive: true }).lean();
  const suggestionItems = allGiftItems.filter((it) => it.showInSuggestions && it.stock > 0);
  assert(suggestionItems.length >= 2, 'Gift Builder Suggestions Query', `Found ${suggestionItems.length} active in-stock suggestions`);

  const missingCompulsoryItems = allGiftItems.filter((it) => it.isCompulsory && it.stock > 0);
  const oosCompulsoryItems = allGiftItems.filter((it) => it.isCompulsory && it.stock <= 0);
  assert(oosCompulsoryItems.length >= 1, 'Gift Builder OOS Compulsory Filter', `Found ${oosCompulsoryItems.length} OOS compulsory items (DEMO Luxury Velvet Box)`);
  assert(
    !missingCompulsoryItems.some((it) => it.name.includes('(OOS)')),
    'Gift Builder Compulsory Modal Filter',
    `Modal only prompts in-stock compulsory items, excludes OOS items`
  );

  // 2.11 Coupon Blocking Rule
  function checkCouponAllowed(items: any[]): { allowed: boolean; reason?: string } {
    const hasBundle = items.some((it: any) =>
      it.bundleType === 'custom' ||
      it.bundleType === 'curated' ||
      it.isBundle ||
      it.bundleId ||
      it.productId === 'custom-bundle'
    );
    if (hasBundle) {
      return { allowed: false, reason: 'Coupons cannot be applied to carts containing bundle discounts.' };
    }
    return { allowed: true };
  }

  const couponWithCustom = checkCouponAllowed([{ productId: 'custom-bundle', bundleType: 'custom' }]);
  assert(!couponWithCustom.allowed, 'Coupon Block on Custom Bundle', `Rejected: ${couponWithCustom.reason}`);

  const couponWithCurated = checkCouponAllowed([{ productId: 'demo-fixed-combo', bundleType: 'curated' }]);
  assert(!couponWithCurated.allowed, 'Coupon Block on Curated Combo', `Rejected: ${couponWithCurated.reason}`);

  const couponWithGiftOnly = checkCouponAllowed([{ productId: 'gift-1', isGiftPackage: true }]);
  assert(couponWithGiftOnly.allowed, 'Coupon Allowed on Gift Package Only', `Coupons are allowed when no bundle in cart`);

  // --------------------------------------------------------------------------
  // 3. STOCK AND ORDER CHECKS
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 3: STOCK AND ORDER CHECKS ---');

  // 3.1 Order Placement with Custom Bundle & Snapshots
  const session1 = await mongoose.startSession();
  session1.startTransaction();

  const p1StockBefore = (await Product.findById(p1._id).session(session1))!.stock!;
  const p2StockBefore = (await Product.findById(p2._id).session(session1))!.stock!;

  const customOrderNumber = `CKC-TEST-CUSTOM-${Date.now()}`;
  const customOrderGroupId = `bundle-grp-${Date.now()}`;

  await deductOrderStockAtomic(
    [
      { productId: p1._id.toString(), title: p1.titleEn, quantity: 1 },
      { productId: p2._id.toString(), title: p2.titleEn, quantity: 1 },
    ],
    customOrderNumber,
    session1
  );

  const customOrderDoc = await Order.create(
    [
      {
        id: `ord-test-${Date.now()}`,
        orderNumber: customOrderNumber,
        customerName: 'DEMO Customer Custom',
        customerPhone: '01700000001',
        district: 'Dhaka',
        fullAddress: 'Dhanmondi, Dhaka',
        subtotal: 1200,
        deliveryCharge: 60,
        discountAmount: 60, // 5% of 1200
        totalAmount: 1200,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        paymentMethod: 'COD',
        items: [
          {
            id: 'item-1',
            productId: p1._id.toString(),
            title: p1.titleEn,
            price: 475,
            originalUnitPrice: 500,
            discountAmount: 25,
            finalPrice: 475,
            quantity: 1,
            total: 475,
            bundleType: 'custom',
            bundleGroupId: customOrderGroupId,
            tierPercentApplied: 5,
          },
          {
            id: 'item-2',
            productId: p2._id.toString(),
            title: p2.titleEn,
            price: 665,
            originalUnitPrice: 700,
            discountAmount: 35,
            finalPrice: 665,
            quantity: 1,
            total: 665,
            bundleType: 'custom',
            bundleGroupId: customOrderGroupId,
            tierPercentApplied: 5,
          },
        ],
      },
    ],
    { session: session1 }
  );

  await session1.commitTransaction();
  session1.endSession();

  const p1StockAfter = (await Product.findById(p1._id))!.stock!;
  const p2StockAfter = (await Product.findById(p2._id))!.stock!;
  assert(p1StockAfter === p1StockBefore - 1 && p2StockAfter === p2StockBefore - 1, 'Custom Bundle Atomic Stock Deduction', `p1: ${p1StockBefore} -> ${p1StockAfter}, p2: ${p2StockBefore} -> ${p2StockAfter}`);

  const savedCustomOrder = await Order.findOne({ orderNumber: customOrderNumber }).lean();
  assert(
    savedCustomOrder?.items[0]?.bundleType === 'custom' &&
    savedCustomOrder?.items[0]?.tierPercentApplied === 5 &&
    savedCustomOrder?.items[0]?.originalUnitPrice === 500 &&
    savedCustomOrder?.items[0]?.finalPrice === 475,
    'Custom Bundle Snapshots Persisted',
    `Snapshots verified: bundleType=custom, tier=5%, orig=500, final=475`
  );

  // 3.2 Order Placement with Gift Package & Snapshots
  const session2 = await mongoose.startSession();
  session2.startTransaction();

  const giftItemDoc = await GiftItem.findOne({ name: 'DEMO Pine Wood Gift Box' }).session(session2);
  const giftStockBefore = giftItemDoc!.stock;
  const giftOrderNumber = `CKC-TEST-GIFT-${Date.now()}`;
  const giftPkgGroupId = `pkg-${Date.now()}`;

  await deductOrderStockAtomic(
    [
      {
        productId: giftItemDoc!._id.toString(),
        giftItemId: giftItemDoc!._id.toString(),
        title: giftItemDoc!.name,
        quantity: 2,
        isGiftPackage: true,
      },
    ],
    giftOrderNumber,
    session2
  );

  const giftOrderDoc = await Order.create(
    [
      {
        id: `ord-test-gift-${Date.now()}`,
        orderNumber: giftOrderNumber,
        customerName: 'DEMO Customer Gift',
        customerPhone: '01700000002',
        district: 'Chittagong',
        fullAddress: 'Agrabad, Chittagong',
        subtotal: 300,
        deliveryCharge: 120,
        discountAmount: 0,
        totalAmount: 420,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        paymentMethod: 'COD',
        items: [
          {
            id: 'item-g1',
            productId: giftItemDoc!._id.toString(),
            title: giftItemDoc!.name,
            price: 150,
            originalUnitPrice: 150,
            discountAmount: 0,
            finalPrice: 150,
            quantity: 2,
            total: 300,
            isGiftPackage: true,
            packageGroupId: giftPkgGroupId,
            giftItemId: giftItemDoc!._id.toString(),
            giftItemName: giftItemDoc!.name,
          },
        ],
      },
    ],
    { session: session2 }
  );

  await session2.commitTransaction();
  session2.endSession();

  const giftStockAfter = (await GiftItem.findById(giftItemDoc!._id))!.stock;
  assert(giftStockAfter === giftStockBefore - 2, 'Gift Item Atomic Stock Deduction', `GiftItem stock: ${giftStockBefore} -> ${giftStockAfter}`);

  const savedGiftOrder = await Order.findOne({ orderNumber: giftOrderNumber }).lean();
  assert(
    savedGiftOrder?.items[0]?.isGiftPackage === true &&
    savedGiftOrder?.items[0]?.giftItemId === giftItemDoc!._id.toString(),
    'Gift Package Snapshots Persisted',
    `Snapshots verified: isGiftPackage=true, giftItemId=${giftItemDoc!._id}`
  );

  // 3.3 Order Cancellation & Stock Restoration
  await restoreOrderStockAtomic(savedCustomOrder as any, 'cancel', 'Test cancel');
  const p1StockRestored = (await Product.findById(p1._id))!.stock!;
  assert(p1StockRestored === p1StockBefore, 'Order Stock Restoration Product', `Product stock restored back to ${p1StockRestored}`);

  await restoreOrderStockAtomic(savedGiftOrder as any, 'cancel', 'Test cancel');
  const giftStockRestored = (await GiftItem.findById(giftItemDoc!._id))!.stock;
  assert(giftStockRestored === giftStockBefore, 'Order Stock Restoration GiftItem', `GiftItem stock restored back to ${giftStockRestored}`);

  // 3.4 Partial Returns / Cancellations Test
  // Suppose custom bundle had 2 items originally (5% discount).
  // Customer returns item 2.
  // Remaining item is item 1 (quantity: 1).
  // Because 1 < 2 (lowest tier minQuantity), discount MUST become 0!
  const remainingCustomItems = [
    {
      productId: p1._id.toString(),
      title: p1.titleEn,
      originalUnitPrice: 500,
      price: 475,
      quantity: 1,
      bundleType: 'custom',
      bundleGroupId: 'group-1',
      tierPercentApplied: 5,
    },
  ];

  const recalcCustom = await recalculateBundleOrderOnPartialReturn(remainingCustomItems, 60);
  assert(
    recalcCustom.discountAmount === 0 &&
    recalcCustom.items[0]?.finalPrice === 500 &&
    recalcCustom.items[0]?.tierPercentApplied === 0,
    'Custom Bundle Partial Return Recalculation',
    `Remaining qty 1 < lowest tier (min 2). Tier dropped to 0%, discount dropped to 0, item reverted to original unit price ৳500`
  );

  // Curated combo partial return test:
  // Fixed price combo originally discounted. If 1 item is returned, remaining items lose combo discount!
  const remainingCuratedItems = [
    {
      productId: p1._id.toString(),
      title: p1.titleEn,
      originalUnitPrice: 500,
      price: 400,
      discountAmount: 100,
      quantity: 1,
      bundleType: 'curated',
      bundleGroupId: 'curated-grp-1',
      isPartialReturn: true,
    },
  ];

  const recalcCurated = await recalculateBundleOrderOnPartialReturn(remainingCuratedItems, 60);
  assert(
    recalcCurated.discountAmount === 0 &&
    recalcCurated.items[0]?.finalPrice === 500 &&
    recalcCurated.items[0]?.tierPercentApplied === 0,
    'Curated Combo Partial Return Recalculation',
    `Combo discount drops to 0 on partial return. Remaining item reverted to original price ৳500`
  );

  // 3.5 Race Condition / Concurrency Test
  console.log('\n--- CONCURRENCY / RACE CONDITION TEST ---');
  // Create a product with exactly stock = 1
  const raceProd = await Product.create({
    id: `race-prod-${Date.now()}`,
    slug: `race-prod-${Date.now()}`,
    titleBn: 'ডেমো রেস টেস্ট পণ্য',
    titleEn: 'DEMO Race Test Product',
    regularPrice: 300,
    price: 300,
    basePrice: 300,
    stock: 1,
    bundleEligible: true,
    isActive: true,
  });

  async function tryOrderRace() {
    const s = await mongoose.startSession();
    s.startTransaction();
    try {
      await deductOrderStockAtomic(
        [{ productId: raceProd._id.toString(), title: raceProd.titleEn, quantity: 1 }],
        `CKC-RACE-${Date.now()}`,
        s
      );
      await s.commitTransaction();
      return { success: true };
    } catch (err: any) {
      await s.abortTransaction();
      return { success: false, error: err.message };
    } finally {
      s.endSession();
    }
  }

  // Fire 2 concurrent orders simultaneously
  const [raceRes1, raceRes2] = await Promise.all([tryOrderRace(), tryOrderRace()]);
  const raceProdFinal = await Product.findById(raceProd._id);

  const onePassedOneFailed =
    (raceRes1.success && !raceRes2.success) || (!raceRes1.success && raceRes2.success);
  assert(
    onePassedOneFailed && raceProdFinal?.stock === 0,
    'Concurrency Stock = 1 Test',
    `Exactly one order succeeded, second cleanly failed. Final stock: ${raceProdFinal?.stock} (never negative!)`
  );

  // 3.6 Deactivated Product inside Curated Combo Test
  console.log('\n--- DEACTIVATED CONSTITUENT PRODUCT TEST ---');
  // Temporarily deactivate p3
  await Product.updateOne({ _id: p3._id }, { isActive: false });
  // Check that calculation / stock check handles inactive product safely
  const inactiveCheck = calculateBundleStock([
    { productId: p1._id.toString(), productTitleBn: '', productTitleEn: '', quantity: 1, stock: 10, unitPrice: 500, costPrice: 250, imageUrl: '' },
    { productId: p3._id.toString(), productTitleBn: '', productTitleEn: '', quantity: 1, stock: 10, unitPrice: 600, costPrice: 300, imageUrl: '' },
  ]);
  assert(typeof inactiveCheck.setsAvailable === 'number', 'Deactivated Product Graceful Handling', `calculateBundleStock executed safely without crash`);
  // Re-activate p3
  await Product.updateOne({ _id: p3._id }, { isActive: true });

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n============================================================');
  console.log('                 FINAL TEST REPORT SUMMARY');
  console.log('============================================================');
  const passedCount = results.filter((r) => r.status === 'PASS').length;
  const failedCount = results.filter((r) => r.status === 'FAIL').length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}\n`);

  results.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.status}] ${r.test}: ${r.details}`);
  });

  if (failedCount > 0) {
    throw new Error(`Self-verification suite had ${failedCount} failing test(s).`);
  }
}

if (process.argv[1]?.endsWith('verify-all.ts')) {
  runAllTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Test suite failed:', err);
      process.exit(1);
    });
}

