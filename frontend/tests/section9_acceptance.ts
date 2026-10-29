import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/mongodb';
import { Product } from '../src/models/Product';
import { StockLog } from '../src/models/StockLog';
import { validateAndSanitizeProduct } from '../src/lib/product-validation';
import { deductOrderStockAtomic, restoreOrderStockAtomic, ensureStockCollections } from '../src/lib/order-stock';
import { runVariationsCleanup } from '../src/lib/cleanup-service';

async function runAcceptanceChecklist() {
  console.log('\n================================================================================');
  console.log('  SECTION 9: ACCEPTANCE CHECKLIST & FULL VERIFICATION SUITE');
  console.log('================================================================================\n');

  await connectToDatabase();
  await ensureStockCollections();

  const results: { test: string; passed: boolean; message: string }[] = [];

  function record(test: string, passed: boolean, message: string) {
    results.push({ test, passed, message });
    const icon = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${icon} | ${test}: ${message}`);
  }

  // ---------------------------------------------------------------------------
  // Check 1: Product Schema & Virtuals
  // ---------------------------------------------------------------------------
  try {
    const testProduct = new Product({
      id: `chk-prod-${Date.now()}`,
      titleBn: 'চেকলিস্ট টেস্ট পণ্য',
      titleEn: 'Checklist Test Product',
      slug: `test-checklist-${Date.now()}`,
      categorySlug: 'art-kits',
      hasVariations: true,
      optionName: 'Pack Size',
      variants: [
        {
          optionValue: '12 Piece Set',
          sku: `CHK-12-${Date.now()}`,
          regularPrice: 500,
          salePrice: 450,
          stock: 15,
          lowStockAlert: 5,
          isActive: true,
        },
        {
          optionValue: '24 Piece Set',
          sku: `CHK-24-${Date.now()}`,
          regularPrice: 900,
          salePrice: null,
          stock: 3,
          lowStockAlert: 5,
          isActive: true,
        },
      ],
    });

    const totalStock = testProduct.totalStock;
    const stockStatus = testProduct.stockStatus;

    if (totalStock === 18 && stockStatus === 'in_stock') {
      record('1. Schema & Virtuals', true, `totalStock (${totalStock}) & stockStatus ('${stockStatus}') computed accurately.`);
    } else {
      record('1. Schema & Virtuals', false, `Unexpected totalStock (${totalStock}) or stockStatus ('${stockStatus}').`);
    }
  } catch (err: any) {
    record('1. Schema & Virtuals', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // Check 2: Backend Validation Rules
  // ---------------------------------------------------------------------------
  try {
    // 2a. Rejects non-integer price
    const floatRes = await validateAndSanitizeProduct({
      titleBn: 'টেস্ট পণ্য',
      titleEn: 'Test Product',
      hasVariations: false,
      regularPrice: 120.55,
      stock: 10,
    });
    const floatPass = !floatRes.valid && floatRes.errors.some((e) => e.includes('পূর্ণসংখ্যা') || e.includes('integer'));

    // 2b. Rejects salePrice >= regularPrice
    const saleRes = await validateAndSanitizeProduct({
      titleBn: 'টেস্ট পণ্য',
      titleEn: 'Test Product',
      hasVariations: false,
      regularPrice: 500,
      salePrice: 550,
      stock: 10,
    });
    const salePass = !saleRes.valid && saleRes.errors.some((e) => e.includes('ছাড়ের মূল্য') || e.includes('কম হতে হবে'));

    // 2c. Rejects variable product with 0 variants
    const noVarsRes = await validateAndSanitizeProduct({
      titleBn: 'টেস্ট পণ্য',
      titleEn: 'Test Product',
      hasVariations: true,
      variants: [],
    });
    const noVarsPass = !noVarsRes.valid && noVarsRes.errors.some((e) => e.includes('কমপক্ষে একটি ভ্যারিয়েন্ট') || e.includes('variant'));

    if (floatPass && salePass && noVarsPass) {
      record('2. Backend Validation Rules', true, 'Price integers, salePrice < regularPrice, and variants existence correctly enforced.');
    } else {
      record('2. Backend Validation Rules', false, `Validation gaps: floatPass=${floatPass}, salePass=${salePass}, noVarsPass=${noVarsPass}`);
    }
  } catch (err: any) {
    record('2. Backend Validation Rules', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // Check 3: Atomic Stock Deduction & Rollback on Deficit
  // ---------------------------------------------------------------------------
  let createdProductId: string = '';
  let variant1Id: string = '';
  let variant2Id: string = '';
  const testOrderId = `ORD-CHK-${Date.now()}`;

  try {
    const testProd = await Product.create({
      id: `prod-stock-chk-${Date.now()}`,
      titleBn: 'স্টক ডিডাকশন পণ্য',
      titleEn: 'Stock Deduction Product',
      slug: `stock-deduct-${Date.now()}`,
      categorySlug: 'art-kits',
      hasVariations: true,
      optionName: 'Set',
      variants: [
        {
          optionValue: 'Small Box',
          sku: `DED-S-${Date.now()}`,
          regularPrice: 600,
          stock: 10,
          isActive: true,
        },
        {
          optionValue: 'Large Box',
          sku: `DED-L-${Date.now()}`,
          regularPrice: 1200,
          stock: 2,
          isActive: true,
        },
      ],
    });

    createdProductId = String(testProd._id);
    variant1Id = String(testProd.variants![0]._id);
    variant2Id = String(testProd.variants![1]._id);

    // 3a. Successful deduction in transaction
    const session1 = await mongoose.startSession();
    session1.startTransaction();
    try {
      await deductOrderStockAtomic(
        [
          {
            productId: createdProductId,
            variantId: variant1Id,
            quantity: 3,
            title: 'Stock Deduction Product (Small Box)',
          },
        ],
        testOrderId,
        session1
      );
      await session1.commitTransaction();
    } catch (e) {
      await session1.abortTransaction();
      throw e;
    } finally {
      session1.endSession();
    }

    const afterProd1 = await Product.findById(createdProductId).lean();
    const v1Stock = afterProd1?.variants?.find((v: any) => String(v._id) === variant1Id)?.stock;

    // Verify StockLog record created
    const log1 = await StockLog.findOne({ orderId: testOrderId }).lean();

    const deductOk = v1Stock === 7 && log1 && log1.change === -3 && log1.reason === 'order';

    // 3b. Insufficient stock failure & rollback
    let rollbackOk = false;
    const session2 = await mongoose.startSession();
    session2.startTransaction();
    try {
      await deductOrderStockAtomic(
        [
          {
            productId: createdProductId,
            variantId: variant2Id,
            quantity: 5, // Only 2 available!
            title: 'Stock Deduction Product (Large Box)',
          },
        ],
        `${testOrderId}-FAIL`,
        session2
      );
      await session2.commitTransaction();
    } catch (err: any) {
      await session2.abortTransaction();
      const afterProd2 = await Product.findById(createdProductId).lean();
      const v2Stock = afterProd2?.variants?.find((v: any) => String(v._id) === variant2Id)?.stock;
      rollbackOk = v2Stock === 2;
    } finally {
      session2.endSession();
    }

    if (deductOk && rollbackOk) {
      record('3. Atomic Stock Deduction & Rollback', true, 'Deduction correctly logged (-3, reason: order) and overdraft rolled back safely without mutation.');
    } else {
      record('3. Atomic Stock Deduction & Rollback', false, `deductOk=${deductOk}, rollbackOk=${rollbackOk}`);
    }
  } catch (err: any) {
    record('3. Atomic Stock Deduction & Rollback', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // Check 4: Stock Restoration on Cancellation
  // ---------------------------------------------------------------------------
  try {
    await restoreOrderStockAtomic(
      {
        orderNumber: testOrderId,
        items: [
          {
            productId: createdProductId,
            variantId: variant1Id,
            quantity: 3,
          },
        ],
      },
      'cancel',
      'Customer cancellation test'
    );

    const afterCancel = await Product.findById(createdProductId).lean();
    const v1StockAfterCancel = afterCancel?.variants?.find((v: any) => String(v._id) === variant1Id)?.stock;

    const cancelLog = await StockLog.findOne({ orderId: testOrderId, reason: 'cancel' }).lean();

    if (v1StockAfterCancel === 10 && cancelLog && cancelLog.change === 3) {
      record('4. Stock Restoration on Cancellation', true, `Stock restored back to 10 and logged with reason 'cancel' (+3).`);
    } else {
      record('4. Stock Restoration on Cancellation', false, `v1StockAfterCancel=${v1StockAfterCancel}, cancelLog=${Boolean(cancelLog)}`);
    }
  } catch (err: any) {
    record('4. Stock Restoration on Cancellation', false, err.message);
  }

  // Clean up temporary checklist test product before running cleanup audit
  if (createdProductId) {
    await Product.deleteOne({ _id: createdProductId });
    await StockLog.deleteMany({ productId: createdProductId });
  }

  // ---------------------------------------------------------------------------
  // Check 5: Database Cleanup Script
  // ---------------------------------------------------------------------------
  try {
    const cleanupReport = await runVariationsCleanup({ dryRun: true });
    const isClean =
      cleanupReport.legacyVariationsMigrated === 0 &&
      cleanupReport.productLevelFieldsUnsetCount === 0 &&
      cleanupReport.invalidSalePricesNullified === 0 &&
      cleanupReport.duplicateSkusFound.length === 0;

    if (isClean) {
      record('5. Database Cleanup Script', true, 'MongoDB Atlas verified clean: 0 legacy variations, 0 stale product-level pricing fields, 0 duplicate SKUs.');
    } else {
      record('5. Database Cleanup Script', false, `Cleanup gaps found: ${JSON.stringify(cleanupReport)}`);
    }
  } catch (err: any) {
    record('5. Database Cleanup Script', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n--------------------------------------------------------------------------------');
  console.log('  CHECKLIST SUMMARY');
  console.log('--------------------------------------------------------------------------------');
  const allPassed = results.every((r) => r.passed);
  console.log(`Total Checks: ${results.length} | Passed: ${results.filter((r) => r.passed).length} | Failed: ${results.filter((r) => !r.passed).length}`);
  console.log(`Status:       ${allPassed ? '🎉 ALL ACCEPTANCE CHECKS PASSED!' : '⚠️ SOME CHECKS FAILED'}\n`);

  process.exit(allPassed ? 0 : 1);
}

runAcceptanceChecklist().catch((e) => {
  console.error(e);
  process.exit(1);
});
