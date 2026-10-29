import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/mongodb';
import { Product } from '../src/models/Product';
import { StockLog } from '../src/models/StockLog';
import { deductOrderStockAtomic, restoreOrderStockAtomic, ensureStockCollections, OutOfStockError } from '../src/lib/order-stock';

async function runTests() {
  console.log('--- Starting Section 3: Order Stock Deduction & Transactions Verification ---');
  await connectToDatabase();
  await ensureStockCollections();

  const testSlug = `sec3-test-product-${Date.now()}`;
  const simpleSlug = `sec3-simple-product-${Date.now()}`;

  try {
    // 1. Create a test variable product with 2 variants
    const varProduct = await Product.create({
      id: `prod-test-${Date.now()}`,
      titleBn: 'সেকশন ৩ ভ্যারিয়েবল টেস্ট পণ্য',
      titleEn: 'Section 3 Variable Test Product',
      slug: testSlug,
      hasVariations: true,
      optionName: 'Pack Size',
      variants: [
        {
          optionValue: '12 Piece Pack',
          sku: `SKU-TEST-12-${Date.now()}`,
          regularPrice: 500,
          salePrice: 450,
          stock: 1, // Only 1 unit! Perfect for concurrency test
          lowStockAlert: 2,
          isActive: true,
        },
        {
          optionValue: '24 Piece Pack',
          sku: `SKU-TEST-24-${Date.now()}`,
          regularPrice: 900,
          salePrice: null,
          stock: 10,
          lowStockAlert: 2,
          isActive: true,
        },
      ],
    });

    const v12Id = varProduct.variants![0]._id!;
    const v24Id = varProduct.variants![1]._id!;

    console.log('✓ Created variable product with 2 variants.');
    console.log(`  - Variant 1 (12 Piece): stock = 1 (id: ${v12Id})`);
    console.log(`  - Variant 2 (24 Piece): stock = 10 (id: ${v24Id})`);

    // 2. TEST CONCURRENCY: Two simultaneous orders for the last unit (Variant 1 has stock = 1)
    console.log('\n--- Test 1: Simultaneous orders for the last unit ---');
    const orderPromise1 = (async () => {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        await deductOrderStockAtomic(
          [
            {
              productId: varProduct._id.toString(),
              variantId: v12Id.toString(),
              title: varProduct.titleBn,
              quantity: 1,
            },
          ],
          'ORD-RACE-001',
          session
        );
        await session.commitTransaction();
        return { success: true, order: 'ORD-RACE-001' };
      } catch (err: any) {
        await session.abortTransaction();
        return { success: false, error: err.message, order: 'ORD-RACE-001' };
      } finally {
        session.endSession();
      }
    })();

    const orderPromise2 = (async () => {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        await deductOrderStockAtomic(
          [
            {
              productId: varProduct._id.toString(),
              variantId: v12Id.toString(),
              title: varProduct.titleBn,
              quantity: 1,
            },
          ],
          'ORD-RACE-002',
          session
        );
        await session.commitTransaction();
        return { success: true, order: 'ORD-RACE-002' };
      } catch (err: any) {
        await session.abortTransaction();
        return { success: false, error: err.message, order: 'ORD-RACE-002' };
      } finally {
        session.endSession();
      }
    })();

    const [raceRes1, raceRes2] = await Promise.all([orderPromise1, orderPromise2]);
    const successes = [raceRes1, raceRes2].filter((r) => r.success);
    const failures = [raceRes1, raceRes2].filter((r) => !r.success);

    console.log('Race result 1:', raceRes1);
    console.log('Race result 2:', raceRes2);

    if (successes.length === 1 && failures.length === 1) {
      console.log('✓ PASS: Exactly one simultaneous order succeeded, the other was blocked!');
    } else {
      throw new Error(`FAIL: Expected 1 success and 1 failure, got ${successes.length} successes and ${failures.length} failures!`);
    }

    // Verify stock after race condition is exactly 0
    const reloadedAfterRace = await Product.findById(varProduct._id).lean();
    const v12After = reloadedAfterRace!.variants!.find((v: any) => v._id.toString() === v12Id.toString());
    if (v12After!.stock === 0) {
      console.log(`✓ PASS: Variant stock is exactly 0, never negative (stock: ${v12After!.stock})`);
    } else {
      throw new Error(`FAIL: Expected variant stock to be 0, got ${v12After!.stock}`);
    }

    // Verify StockLog for the winning order
    const logsOrder = await StockLog.find({ orderId: { $in: ['ORD-RACE-001', 'ORD-RACE-002'] } }).lean();
    console.log(`✓ PASS: StockLog recorded ${logsOrder.length} entry for winning order:`, {
      change: logsOrder[0]?.change,
      stockBefore: logsOrder[0]?.stockBefore,
      stockAfter: logsOrder[0]?.stockAfter,
      reason: logsOrder[0]?.reason,
      orderId: logsOrder[0]?.orderId,
    });
    if (logsOrder.length !== 1 || logsOrder[0].change !== -1 || logsOrder[0].reason !== 'order') {
      throw new Error('FAIL: StockLog entry invalid for race test!');
    }

    // 3. TEST TRANSACTION ROLLBACK: Multi-item order where 1 item fails
    console.log('\n--- Test 2: Multi-item order transaction rollback on partial failure ---');
    // Variant 2 has 10 units. We order 2 units of Variant 2, and 5 units of Variant 1 (which only has 0 units).
    const v24Before = reloadedAfterRace!.variants!.find((v: any) => v._id.toString() === v24Id.toString())!.stock;
    console.log(`Variant 2 stock before multi-item attempt: ${v24Before}`);

    const multiSession = await mongoose.startSession();
    multiSession.startTransaction();
    let multiFailedAsExpected = false;
    try {
      await deductOrderStockAtomic(
        [
          {
            productId: varProduct._id.toString(),
            variantId: v24Id.toString(),
            title: varProduct.titleBn,
            quantity: 2, // Would reduce from 10 to 8
          },
          {
            productId: varProduct._id.toString(),
            variantId: v12Id.toString(),
            title: varProduct.titleBn,
            quantity: 5, // Fails because stock is 0!
          },
        ],
        'ORD-MULTI-FAIL',
        multiSession
      );
      await multiSession.commitTransaction();
    } catch (err: any) {
      await multiSession.abortTransaction();
      multiFailedAsExpected = true;
      console.log(`✓ Caught expected rollback error: ${err.message}`);
    } finally {
      multiSession.endSession();
    }

    if (!multiFailedAsExpected) {
      throw new Error('FAIL: Multi-item order should have thrown an error but succeeded!');
    }

    // Check that Variant 2 was NOT deducted (rolled back!)
    const reloadedAfterRollback = await Product.findById(varProduct._id).lean();
    const v24AfterRollback = reloadedAfterRollback!.variants!.find((v: any) => v._id.toString() === v24Id.toString())!.stock;
    if (v24AfterRollback === v24Before) {
      console.log(`✓ PASS: Transaction rolled back cleanly! Variant 2 stock unchanged at ${v24AfterRollback}.`);
    } else {
      throw new Error(`FAIL: Variant 2 was modified despite transaction rollback! Current stock: ${v24AfterRollback}`);
    }

    // Check that no StockLog was written for the aborted transaction
    const abortedLogs = await StockLog.find({ orderId: 'ORD-MULTI-FAIL' }).lean();
    if (abortedLogs.length === 0) {
      console.log('✓ PASS: No StockLogs written for aborted transaction.');
    } else {
      throw new Error(`FAIL: Aborted transaction left ${abortedLogs.length} orphan StockLogs!`);
    }

    // 4. TEST ORDER CANCELLATION & RETURN RESTORATION
    console.log('\n--- Test 3: Order cancellation and return restoration ---');
    const winningOrderId = successes[0].order;
    console.log(`Restoring order ${winningOrderId} with reason 'cancel'...`);

    await restoreOrderStockAtomic(
      {
        orderNumber: winningOrderId,
        items: [
          {
            productId: varProduct._id.toString(),
            variantId: v12Id.toString(),
            title: varProduct.titleBn,
            quantity: 1,
          },
        ],
      },
      'cancel',
      'Test cancellation restoration'
    );

    const reloadedAfterCancel = await Product.findById(varProduct._id).lean();
    const v12Restored = reloadedAfterCancel!.variants!.find((v: any) => v._id.toString() === v12Id.toString())!.stock;
    if (v12Restored === 1) {
      console.log(`✓ PASS: Variant 1 stock restored to 1 upon cancellation!`);
    } else {
      throw new Error(`FAIL: Expected Variant 1 stock restored to 1, got ${v12Restored}`);
    }

    const cancelLogs = await StockLog.find({ orderId: winningOrderId, reason: 'cancel' }).lean();
    if (cancelLogs.length === 1 && cancelLogs[0].change === 1) {
      console.log('✓ PASS: StockLog created with reason "cancel" and change +1:', cancelLogs[0]);
    } else {
      throw new Error(`FAIL: Cancel StockLog not created or invalid: ${JSON.stringify(cancelLogs)}`);
    }

    // Test reason: 'return'
    console.log(`Testing return restoration with reason 'return'...`);
    await restoreOrderStockAtomic(
      {
        orderNumber: 'ORD-RETURN-TEST',
        items: [
          {
            productId: varProduct._id.toString(),
            variantId: v24Id.toString(),
            title: varProduct.titleBn,
            quantity: 3,
          },
        ],
      },
      'return',
      'Customer returned item'
    );

    const returnLogs = await StockLog.find({ orderId: 'ORD-RETURN-TEST', reason: 'return' }).lean();
    if (returnLogs.length === 1 && returnLogs[0].change === 3 && returnLogs[0].reason === 'return') {
      console.log('✓ PASS: StockLog created with reason "return" and change +3:', returnLogs[0]);
    } else {
      throw new Error(`FAIL: Return StockLog not created or invalid!`);
    }

    // 5. TEST SIMPLE PRODUCT DEDUCTION
    console.log('\n--- Test 4: Simple product atomic deduction ---');
    const simpleProduct = await Product.create({
      id: `prod-simple-${Date.now()}`,
      titleBn: 'সেকশন ৩ সাধারণ পণ্য',
      titleEn: 'Section 3 Simple Product',
      slug: simpleSlug,
      hasVariations: false,
      regularPrice: 300,
      stock: 5,
    });

    const simpleSession = await mongoose.startSession();
    simpleSession.startTransaction();
    await deductOrderStockAtomic(
      [
        {
          productId: simpleProduct._id.toString(),
          title: simpleProduct.titleBn,
          quantity: 2,
        },
      ],
      'ORD-SIMPLE-001',
      simpleSession
    );
    await simpleSession.commitTransaction();
    simpleSession.endSession();

    const reloadedSimple = await Product.findById(simpleProduct._id).lean();
    if (reloadedSimple!.stock === 3) {
      console.log(`✓ PASS: Simple product stock decremented from 5 to 3.`);
    } else {
      throw new Error(`FAIL: Simple product stock expected 3, got ${reloadedSimple!.stock}`);
    }

    const simpleLogs = await StockLog.find({ orderId: 'ORD-SIMPLE-001' }).lean();
    if (simpleLogs.length === 1 && simpleLogs[0].variantId === null && simpleLogs[0].change === -2) {
      console.log('✓ PASS: Simple product StockLog logged with variantId: null and change -2.');
    } else {
      throw new Error(`FAIL: Simple product StockLog invalid: ${JSON.stringify(simpleLogs)}`);
    }

    // Clean up test documents
    console.log('\nCleaning up test products and test stockLogs...');
    await Product.deleteOne({ _id: varProduct._id });
    await Product.deleteOne({ _id: simpleProduct._id });
    await StockLog.deleteMany({
      orderId: {
        $in: ['ORD-RACE-001', 'ORD-RACE-002', 'ORD-MULTI-FAIL', 'ORD-RETURN-TEST', 'ORD-SIMPLE-001'],
      },
    });
    console.log('✓ Test cleanup complete.');

    console.log('\n========================================');
    console.log('🎉 ALL SECTION 3 REQUIREMENTS VERIFIED SUCCESSFULLY!');
    console.log('========================================');
  } catch (err: any) {
    console.error('\n❌ Test Error:', err.message);
    process.exit(1);
  }
}

runTests().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
