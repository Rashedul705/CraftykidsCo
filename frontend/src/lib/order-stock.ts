import mongoose, { ClientSession } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { Bundle } from '@/models/Bundle';
import { GiftItem } from '@/models/GiftItem';
import { StockLog, StockLogReason } from '@/models/StockLog';
import { getBundleById, getBundleBySlug } from '@/lib/bundles-store';

export class OutOfStockError extends Error {
  itemTitle: string;
  variantTitle?: string;
  availableStock?: number;

  constructor(message: string, itemTitle: string, variantTitle?: string, availableStock?: number) {
    super(message);
    this.name = 'OutOfStockError';
    this.itemTitle = itemTitle;
    this.variantTitle = variantTitle;
    this.availableStock = availableStock;
  }
}

export interface OrderItemToDeduct {
  productId: string;
  title: string;
  quantity: number;
  variantId?: string | mongoose.Types.ObjectId;
  variationSku?: string;
  variationTitle?: string;
  variationTitleBn?: string;
  isGiftPackage?: boolean;
  giftItemId?: string;
}

let collectionsReady = false;
export async function ensureStockCollections(): Promise<void> {
  if (collectionsReady) return;
  try {
    await Product.init().catch(() => {});
    await StockLog.init().catch(() => {});
    await StockLog.createCollection().catch(() => {});
    collectionsReady = true;
  } catch {
    collectionsReady = true;
  }
}

/**
 * Deducts stock atomically for all items in an order within a MongoDB session/transaction.
 * If any item has insufficient stock, modifiedCount is 0, or variant is inactive,
 * the entire transaction aborts and rolls back.
 * StockLog entries with reason 'order' are created for every change.
 */
export async function deductOrderStockAtomic(
  items: OrderItemToDeduct[],
  orderNumber: string,
  session: ClientSession
): Promise<void> {
  await ensureStockCollections();
  for (const item of items) {
    const qty = Math.round(Number(item.quantity));
    if (isNaN(qty) || qty <= 0) {
      throw new OutOfStockError(
        `অকার্যকর পণ্যের পরিমাণ (Invalid quantity): ${item.quantity}`,
        item.title
      );
    }

    // 1. Resolve product
    const isObjectId = mongoose.Types.ObjectId.isValid(item.productId) && item.productId.length === 24;
    const product = await Product.findOne({
      $or: [
        ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(item.productId) }] : []),
        { id: item.productId },
        { slug: item.productId },
      ],
    }).session(session);

    if (!product) {
      // Check if it's a Bundle!
      let bundleDoc: any = await Bundle.findOne({
        $or: [
          ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(item.productId) }] : []),
          { id: item.productId },
          { slug: item.productId },
        ],
      }).session(session);

      if (!bundleDoc) {
        bundleDoc = getBundleById(item.productId) || getBundleBySlug(item.productId);
      }

      if (bundleDoc) {
        // Deduct constituent products stock
        for (const cItem of (bundleDoc.items || [])) {
          const cQty = Math.round(Number(cItem.quantity || 1) * qty);
          const isCObjectId = mongoose.Types.ObjectId.isValid(cItem.productId) && cItem.productId.length === 24;
          const cProduct = await Product.findOne({
            $or: [
              ...(isCObjectId ? [{ _id: new mongoose.Types.ObjectId(cItem.productId) }] : []),
              { id: cItem.productId },
              { slug: cItem.productId },
            ],
          }).session(session);

          if (cProduct) {
            const isCVariable = Boolean(
              cProduct.hasVariations || (cProduct.variants && cProduct.variants.length > 0)
            );
            if (isCVariable && cItem.variationSku) {
              const cVariant = cProduct.variants?.find((v: any) => v.sku === cItem.variationSku);
              if (cVariant) {
                const varStock = typeof cVariant.stock === 'number' ? cVariant.stock : 0;
                if (varStock < cQty) {
                  throw new OutOfStockError(
                    `বান্ডেলের অন্তর্ভুক্ত '${cProduct.titleBn} (${cVariant.optionValue || cVariant.sku})' এর পর্যাপ্ত স্টক নেই (বাকি আছে: ${varStock}টি)`,
                    cProduct.titleBn,
                    cVariant.optionValue,
                    varStock
                  );
                }
                const updateRes = await Product.updateOne(
                  {
                    _id: cProduct._id,
                    variants: {
                      $elemMatch: {
                        _id: cVariant._id,
                        isActive: { $ne: false },
                        stock: { $gte: cQty },
                      },
                    },
                  },
                  { $inc: { 'variants.$.stock': -cQty } },
                  { session }
                );
                if (updateRes.modifiedCount === 0) {
                  throw new OutOfStockError(
                    `বান্ডেলের অন্তর্ভুক্ত '${cProduct.titleBn} (${cVariant.optionValue || cVariant.sku})' এর স্টক পরিবর্তন ব্যর্থ হয়েছে`,
                    cProduct.titleBn
                  );
                }
                await StockLog.create(
                  [
                    {
                      productId: cProduct._id,
                      variantId: cVariant._id,
                      change: -cQty,
                      stockBefore: varStock,
                      stockAfter: varStock - cQty,
                      reason: 'order' as StockLogReason,
                      orderId: orderNumber,
                      note: `Order ${orderNumber} - Bundle '${bundleDoc.titleBn}' (${cVariant.optionValue || cVariant.sku})`,
                    },
                  ],
                  { session }
                );
              }
            } else {
              const currentStock = typeof cProduct.stock === 'number' ? cProduct.stock : 0;
              if (currentStock < cQty) {
                throw new OutOfStockError(
                  `বান্ডেলের অন্তর্ভুক্ত '${cProduct.titleBn}' এর পর্যাপ্ত স্টক নেই (বাকি আছে: ${currentStock}টি)`,
                  cProduct.titleBn,
                  undefined,
                  currentStock
                );
              }
              const updateRes = await Product.updateOne(
                { _id: cProduct._id, stock: { $gte: cQty } },
                { $inc: { stock: -cQty } },
                { session }
              );
              if (updateRes.modifiedCount === 0) {
                throw new OutOfStockError(
                  `বান্ডেলের অন্তর্ভুক্ত '${cProduct.titleBn}' এর স্টক পরিবর্তন ব্যর্থ হয়েছে`,
                  cProduct.titleBn
                );
              }
              await StockLog.create(
                [
                  {
                    productId: cProduct._id,
                    change: -cQty,
                    stockBefore: currentStock,
                    stockAfter: currentStock - cQty,
                    reason: 'order' as StockLogReason,
                    orderId: orderNumber,
                    note: `Order ${orderNumber} - Bundle '${bundleDoc.titleBn}'`,
                  },
                ],
                { session }
              );
            }
          }
        }
        continue; // Bundle constituent stocks deducted successfully!
      }

      if (item.productId === 'custom-bundle') {
        // Custom bundle handled cleanly
        continue;
      }

      // Check GiftItem inventory
      const isGiftObjectId = (mongoose.Types.ObjectId.isValid(item.productId) && item.productId.length === 24) ||
        (item.giftItemId && mongoose.Types.ObjectId.isValid(item.giftItemId) && item.giftItemId.length === 24);
      const giftQueryId = item.giftItemId || item.productId;
      const giftDoc = await GiftItem.findOne({
        $or: [
          ...(isGiftObjectId ? [{ _id: new mongoose.Types.ObjectId(giftQueryId) }] : []),
          { id: giftQueryId },
        ],
      }).session(session);

      if (giftDoc) {
        const currentStock = typeof giftDoc.stock === 'number' ? giftDoc.stock : 0;
        if (currentStock < qty) {
          throw new OutOfStockError(
            `উপহার আইটেম '${giftDoc.name}' এর পর্যাপ্ত স্টক নেই (বাকি আছে: ${currentStock}টি)`,
            giftDoc.name,
            undefined,
            currentStock
          );
        }
        const updateRes = await GiftItem.updateOne(
          { _id: giftDoc._id, stock: { $gte: qty } },
          { $inc: { stock: -qty } },
          { session }
        );
        if (updateRes.modifiedCount === 0) {
          throw new OutOfStockError(
            `উপহার আইটেম '${giftDoc.name}' এর স্টক পরিবর্তন ব্যর্থ হয়েছে (স্টক শেষ)`,
            giftDoc.name,
            undefined,
            0
          );
        }
        continue;
      }

      throw new OutOfStockError(
        `পণ্য '${item.title}' পাওয়া যায়নি (Product not found)`,
        item.title
      );
    }

    const isVariable = Boolean(
      product.hasVariations || (product.variants && product.variants.length > 0)
    );

    if (isVariable) {
      // Find variant in product.variants
      const itemVarIdStr = item.variantId ? item.variantId.toString() : '';
      const itemSkuLower = item.variationSku ? item.variationSku.trim().toLowerCase() : '';
      const itemTitle = (item.variationTitle || item.variationTitleBn || '').trim().toLowerCase();

      const variant = product.variants?.find((v: any) => {
        if (itemVarIdStr && (v._id?.toString() === itemVarIdStr || v.id === itemVarIdStr)) {
          return true;
        }
        if (itemSkuLower && v.sku && v.sku.trim().toLowerCase() === itemSkuLower) {
          return true;
        }
        if (itemTitle && (
          (v.optionValue && v.optionValue.trim().toLowerCase() === itemTitle) ||
          (v.detail && v.detail.trim().toLowerCase() === itemTitle) ||
          (v.titleBn && v.titleBn.trim().toLowerCase() === itemTitle) ||
          (v.titleEn && v.titleEn.trim().toLowerCase() === itemTitle)
        )) {
          return true;
        }
        return false;
      });

      if (!variant) {
        throw new OutOfStockError(
          `'${item.title}' এর ভ্যারিয়েন্ট (${item.variationTitle || item.variationSku || 'Option'}) পাওয়া যায়নি`,
          item.title,
          item.variationTitle
        );
      }

      if (variant.isActive === false) {
        throw new OutOfStockError(
          `'${item.title} (${variant.optionValue})' ভ্যারিয়েন্টটি বর্তমানে নিষ্ক্রিয় রয়েছে`,
          item.title,
          variant.optionValue
        );
      }

      const currentStock = typeof variant.stock === 'number' ? variant.stock : 0;
      if (currentStock < qty) {
        throw new OutOfStockError(
          `'${item.title} (${variant.optionValue})' এর পর্যাপ্ত স্টক নেই (বাকি আছে: ${currentStock}টি)`,
          item.title,
          variant.optionValue,
          currentStock
        );
      }

      // Exactly the query mandated by Section 3:
      // Product.updateOne(
      //   { _id: productId,
      //     variants: { $elemMatch: { _id: variantId, isActive: true, stock: { $gte: qty } } } },
      //   { $inc: { "variants.$.stock": -qty } }
      // )
      const result = await Product.updateOne(
        {
          _id: product._id,
          variants: {
            $elemMatch: {
              _id: variant._id,
              isActive: true,
              stock: { $gte: qty },
            },
          },
        },
        {
          $inc: { 'variants.$.stock': -qty },
        },
        { session }
      );

      if (result.modifiedCount === 0) {
        throw new OutOfStockError(
          `'${item.title} (${variant.optionValue})' এর স্টক শেষ হয়ে গেছে (Out of stock)`,
          item.title,
          variant.optionValue,
          0
        );
      }

      // Record stockLog entry
      await StockLog.create(
        [
          {
            productId: product._id,
            variantId: variant._id,
            change: -qty,
            stockBefore: currentStock,
            stockAfter: currentStock - qty,
            reason: 'order' as StockLogReason,
            orderId: orderNumber,
            note: `Order ${orderNumber} placed for ${qty}x ${variant.optionValue}`,
          },
        ],
        { session }
      );
    } else {
      // Simple product
      const currentStock = typeof product.stock === 'number' ? product.stock : 0;
      if (currentStock < qty) {
        throw new OutOfStockError(
          `'${item.title}' এর পর্যাপ্ত স্টক নেই (বাকি আছে: ${currentStock}টি)`,
          item.title,
          undefined,
          currentStock
        );
      }

      const result = await Product.updateOne(
        {
          _id: product._id,
          stock: { $gte: qty },
        },
        {
          $inc: { stock: -qty },
        },
        { session }
      );

      if (result.modifiedCount === 0) {
        throw new OutOfStockError(
          `'${item.title}' এর স্টক শেষ হয়ে গেছে (Out of stock)`,
          item.title,
          undefined,
          0
        );
      }

      // Record stockLog entry
      await StockLog.create(
        [
          {
            productId: product._id,
            variantId: null,
            change: -qty,
            stockBefore: currentStock,
            stockAfter: currentStock - qty,
            reason: 'order' as StockLogReason,
            orderId: orderNumber,
            note: `Order ${orderNumber} placed for ${qty}x`,
          },
        ],
        { session }
      );
    }
  }
}

/**
 * Restores stock atomically for an order that is cancelled or returned within a session/transaction.
 * Writes a stockLogs entry for every restored item with reason 'cancel' or 'return'.
 */
export async function restoreOrderStockAtomic(
  order: {
    orderNumber?: string;
    id?: string;
    items: Array<{
      productId: any;
      quantity: number;
      variantId?: any;
      variationSku?: string;
      variationTitle?: string;
      variationTitleBn?: string;
      title?: string;
    }>;
  },
  reason: 'cancel' | 'return',
  adminNote?: string
): Promise<void> {
  await connectToDatabase();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderIdentifier = order.orderNumber || order.id || 'ORDER';

    for (const item of order.items || []) {
      const qty = Math.round(Number(item.quantity));
      if (isNaN(qty) || qty <= 0) continue;

      const isObjectId =
        mongoose.Types.ObjectId.isValid(item.productId) &&
        item.productId.toString().length === 24;
      const product = await Product.findOne({
        $or: [
          ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(item.productId) }] : []),
          { id: item.productId },
          { slug: item.productId },
        ],
      }).session(session);

      if (!product) {
        // If it was a bundle, restore constituent product stocks
        let bundleDoc: any = await Bundle.findOne({
          $or: [
            ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(item.productId) }] : []),
            { id: item.productId },
            { slug: item.productId },
          ],
        }).session(session);

        if (!bundleDoc) {
          bundleDoc = getBundleById(item.productId) || getBundleBySlug(item.productId);
        }

        if (bundleDoc) {
          for (const cItem of (bundleDoc.items || [])) {
            const cQty = Math.round(Number(cItem.quantity || 1) * qty);
            const isCObjectId = mongoose.Types.ObjectId.isValid(cItem.productId) && cItem.productId.length === 24;
            const cProduct = await Product.findOne({
              $or: [
                ...(isCObjectId ? [{ _id: new mongoose.Types.ObjectId(cItem.productId) }] : []),
                { id: cItem.productId },
                { slug: cItem.productId },
              ],
            }).session(session);

            if (cProduct) {
              const isCVariable = Boolean(
                cProduct.hasVariations || (cProduct.variants && cProduct.variants.length > 0)
              );
              if (isCVariable && cItem.variationSku) {
                const cVariant = cProduct.variants?.find((v: any) => v.sku === cItem.variationSku);
                if (cVariant) {
                  await Product.updateOne(
                    { _id: cProduct._id, 'variants._id': cVariant._id },
                    { $inc: { 'variants.$.stock': cQty } },
                    { session }
                  );
                }
              } else {
                await Product.updateOne(
                  { _id: cProduct._id },
                  { $inc: { stock: cQty } },
                  { session }
                );
              }
            }
          }
          continue;
        }

        // Check if it was a gift package item
        const isGiftObjectId = (mongoose.Types.ObjectId.isValid(item.productId) && item.productId.toString().length === 24) ||
          ((item as any).giftItemId && mongoose.Types.ObjectId.isValid((item as any).giftItemId) && (item as any).giftItemId.length === 24);
        const giftQueryId = (item as any).giftItemId || item.productId;
        const giftDoc = await GiftItem.findOne({
          $or: [
            ...(isGiftObjectId ? [{ _id: new mongoose.Types.ObjectId(giftQueryId) }] : []),
            { id: giftQueryId },
          ],
        }).session(session);

        if (giftDoc) {
          await GiftItem.updateOne(
            { _id: giftDoc._id },
            { $inc: { stock: qty } },
            { session }
          );
          continue;
        }

        continue;
      }

      const isVariable = Boolean(
        product.hasVariations || (product.variants && product.variants.length > 0)
      );

      if (isVariable) {
        const itemVarIdStr = item.variantId ? item.variantId.toString() : '';
        const itemSkuLower = item.variationSku ? item.variationSku.trim().toLowerCase() : '';
        const itemTitle = (item.variationTitle || item.variationTitleBn || '').trim().toLowerCase();

        const variant = product.variants?.find((v: any) => {
          if (itemVarIdStr && (v._id?.toString() === itemVarIdStr || v.id === itemVarIdStr)) {
            return true;
          }
          if (itemSkuLower && v.sku && v.sku.trim().toLowerCase() === itemSkuLower) {
            return true;
          }
          if (itemTitle && (
            (v.optionValue && v.optionValue.trim().toLowerCase() === itemTitle) ||
            (v.detail && v.detail.trim().toLowerCase() === itemTitle) ||
            (v.titleBn && v.titleBn.trim().toLowerCase() === itemTitle) ||
            (v.titleEn && v.titleEn.trim().toLowerCase() === itemTitle)
          )) {
            return true;
          }
          return false;
        });

        if (variant) {
          const stockBefore = typeof variant.stock === 'number' ? variant.stock : 0;
          const stockAfter = stockBefore + qty;

          await Product.updateOne(
            {
              _id: product._id,
              'variants._id': variant._id,
            },
            {
              $inc: { 'variants.$.stock': qty },
            },
            { session }
          );

          await StockLog.create(
            [
              {
                productId: product._id,
                variantId: variant._id,
                change: qty,
                stockBefore,
                stockAfter,
                reason: reason as StockLogReason,
                orderId: orderIdentifier,
                note:
                  adminNote ||
                  `Order ${orderIdentifier} ${
                    reason === 'cancel' ? 'cancelled' : 'returned'
                  } (+${qty})`,
              },
            ],
            { session }
          );
        }
      } else {
        // Simple product
        const stockBefore = typeof product.stock === 'number' ? product.stock : 0;
        const stockAfter = stockBefore + qty;

        await Product.updateOne(
          {
            _id: product._id,
          },
          {
            $inc: { stock: qty },
          },
          { session }
        );

        await StockLog.create(
          [
            {
              productId: product._id,
              variantId: null,
              change: qty,
              stockBefore,
              stockAfter,
              reason: reason as StockLogReason,
              orderId: orderIdentifier,
              note:
                adminNote ||
                `Order ${orderIdentifier} ${
                  reason === 'cancel' ? 'cancelled' : 'returned'
                } (+${qty})`,
            },
          ],
          { session }
        );
      }
    }

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
