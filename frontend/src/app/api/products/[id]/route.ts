import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { StockLog } from '@/models/StockLog';
import { getProductBySlug, updateProduct as updateMemoryProduct, deleteProduct as deleteMemoryProduct } from '@/lib/store';
import { verifyAdminRequest } from '@/lib/auth';
import { computeProductStockAndStatus } from '@/lib/product-stock';
import { validateAndSanitizeProduct } from '@/lib/product-validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

function getProductMongoQuery(id: string) {
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  return isObjectId
    ? { $or: [{ _id: id }, { id }, { slug: id }] }
    : { $or: [{ id }, { slug: id }] };
}

// 1. GET /api/products/[id] - Fetch single product by id or slug
export async function GET(req: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;

    // Try MongoDB Atlas
    try {
      await connectToDatabase();
      const dbProduct = await Product.findOne(getProductMongoQuery(id)).lean();

      if (dbProduct) {
        return NextResponse.json({
          success: true,
          product: computeProductStockAndStatus(dbProduct),
          source: 'mongodb',
        });
      }
    } catch (dbErr) {
      console.warn(`MongoDB error in GET /api/products/${id}:`, dbErr);
    }

    // Fallback to in-memory store
    const memProduct = getProductBySlug(id);
    if (memProduct) {
      return NextResponse.json({
        success: true,
        product: computeProductStockAndStatus(memProduct),
        source: 'memory',
      });
    }

    return NextResponse.json(
      { success: false, message: 'পণ্যটি পাওয়া যায়নি' },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'পণ্য লোড করতে ব্যর্থ হয়েছে' },
      { status: 500 }
    );
  }
}

// 2. PATCH /api/products/[id] - Update product details or stock
export async function PATCH(req: NextRequest, context: RouteParams) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;
    const body = await req.json();

    // 2a. Handle specific variation stock update (e.g. from StockManager or inline mini-table)
    if (body.variantId || body.variationSku) {
      if (
        body.stock === undefined ||
        body.stock === null ||
        isNaN(Number(body.stock)) ||
        !Number.isInteger(Number(body.stock)) ||
        Number(body.stock) < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: 'স্টক অবশ্যই ০ বা তার বেশি পূর্ণসংখ্যা হতে হবে (Stock must be an integer >= 0).',
          },
          { status: 400 }
        );
      }
      const finalStock = Math.floor(Number(body.stock));
      let updatedDoc: any = null;
      let matchedVariant: any = null;
      let previousStock = 0;

      try {
        await connectToDatabase();
        await StockLog.createCollection().catch(() => {});
        const dbProduct = await Product.findOne(getProductMongoQuery(id));
        if (dbProduct) {
          const updateVariantList = (list: any[]) => {
            if (!Array.isArray(list)) return list;
            return list.map((v: any) => {
              const isMatch =
                (body.variantId && (String(v._id) === String(body.variantId) || String(v.id) === String(body.variantId))) ||
                (body.variationSku && (
                  v.sku === body.variationSku ||
                  String(v._id) === body.variationSku ||
                  v.id === body.variationSku ||
                  v.titleEn === body.variationSku ||
                  v.titleBn === body.variationSku ||
                  v.optionValue === body.variationSku
                ));

              if (isMatch) {
                matchedVariant = v;
                previousStock = Number(v.stock ?? v.stockQuantity ?? 0);
                return {
                  ...v,
                  stock: finalStock,
                  stockQuantity: finalStock,
                };
              }
              return v;
            });
          };

          if (dbProduct.variants && Array.isArray(dbProduct.variants)) {
            dbProduct.variants = updateVariantList(dbProduct.variants);
          }
          if (dbProduct.variations && Array.isArray(dbProduct.variations)) {
            dbProduct.variations = updateVariantList(dbProduct.variations);
          }

          // Recalculate parent stock as sum of active variation stocks
          const activeList = (dbProduct.variants && dbProduct.variants.length > 0)
            ? dbProduct.variants
            : dbProduct.variations || [];

          const totalStock = activeList
            .filter((v: any) => v.isActive !== false)
            .reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0);

          dbProduct.stock = totalStock;
          dbProduct.markModified('variants');
          dbProduct.markModified('variations');
          await dbProduct.save();
          updatedDoc = dbProduct.toObject ? dbProduct.toObject() : dbProduct;

          // Write StockLog entry with reason 'manual_edit'
          if (matchedVariant) {
            const change = finalStock - previousStock;
            try {
              await StockLog.create({
                productId: dbProduct._id || dbProduct.id,
                variantId: matchedVariant._id || matchedVariant.id || null,
                change,
                stockBefore: previousStock,
                stockAfter: finalStock,
                reason: (body.reason as any) || 'manual_edit',
                adminId: (auth as any).user?.email || (auth as any).user?.id || 'admin',
                note: body.note || `Manual inline stock edit for "${matchedVariant.optionValue || matchedVariant.sku}"`,
              });
            } catch (logErr: any) {
              console.error('Failed to write StockLog for variation manual_edit:', logErr.message);
            }
          }
        }
      } catch (dbErr: any) {
        console.error(`MongoDB error updating variation stock for product ${id}:`, dbErr.message);
      }

      const memUpdated = updateMemoryProduct(id, { stock: finalStock }, body.variationSku || body.variantId);

      if (!updatedDoc && !memUpdated) {
        return NextResponse.json(
          { success: false, message: 'পণ্য বা ভেরিয়েশন পাওয়া যায়নি' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'ভেরিয়েশন স্টক সফলভাবে আপডেট হয়েছে',
        product: computeProductStockAndStatus(updatedDoc || memUpdated),
      });
    }

    // 2b. Handle single/simple product inline stock update
    if (
      !body.variantId &&
      !body.variationSku &&
      body.stock !== undefined &&
      (body.isStockOnly || body.reason === 'manual_edit' || Object.keys(body).length <= 4)
    ) {
      if (
        isNaN(Number(body.stock)) ||
        !Number.isInteger(Number(body.stock)) ||
        Number(body.stock) < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: 'স্টক অবশ্যই ০ বা তার বেশি পূর্ণসংখ্যা হতে হবে (Stock must be an integer >= 0).',
          },
          { status: 400 }
        );
      }

      const finalStock = Math.floor(Number(body.stock));
      let updatedDoc: any = null;
      let previousStock = 0;

      try {
        await connectToDatabase();
        await StockLog.createCollection().catch(() => {});
        const dbProduct = await Product.findOne(getProductMongoQuery(id));
        if (dbProduct) {
          previousStock = Number(dbProduct.stock ?? 0);
          dbProduct.stock = finalStock;
          await dbProduct.save();
          updatedDoc = dbProduct.toObject ? dbProduct.toObject() : dbProduct;

          const change = finalStock - previousStock;
          try {
            await StockLog.create({
              productId: dbProduct._id || dbProduct.id,
              variantId: null,
              change,
              stockBefore: previousStock,
              stockAfter: finalStock,
              reason: (body.reason as any) || 'manual_edit',
              adminId: (auth as any).user?.email || (auth as any).user?.id || 'admin',
              note: body.note || `Manual inline stock edit: stock updated from ${previousStock} to ${finalStock}`,
            });
          } catch (logErr: any) {
            console.error('Failed to write StockLog for product manual_edit:', logErr.message);
          }
        }
      } catch (dbErr: any) {
        console.error(`MongoDB error updating product stock for ${id}:`, dbErr.message);
      }

      const memUpdated = updateMemoryProduct(id, { stock: finalStock });

      if (!updatedDoc && !memUpdated) {
        return NextResponse.json(
          { success: false, message: 'পণ্যটি পাওয়া যায়নি' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'পণ্যের স্টক সফলভাবে আপডেট হয়েছে',
        product: computeProductStockAndStatus(updatedDoc || memUpdated),
      });
    }

    // 2c. Full product update with Section 2 validation
    await connectToDatabase();
    const existing = await Product.findOne(getProductMongoQuery(id)).lean();
    if (!existing) {
      const mem = getProductBySlug(id);
      if (!mem) {
        return NextResponse.json(
          { success: false, message: 'আপডেট করার জন্য পণ্যটি পাওয়া যায়নি' },
          { status: 404 }
        );
      }
    }

    const merged = { ...(existing || {}), ...body };
    const productIdForCheck = String(existing?._id || existing?.id || id);

    const validation = await validateAndSanitizeProduct(merged, productIdForCheck);
    if (!validation.valid || !validation.sanitized) {
      return NextResponse.json(
        {
          success: false,
          message: validation.errors[0] || 'পণ্যের তথ্য সঠিক নয়',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const sanitized = validation.sanitized;

    // Build update operation with clean unset for variable products
    const updateOp: any = {
      $set: {
        ...sanitized,
      },
    };

    if (sanitized.hasVariations) {
      // Core rule: If product has variations, stock, SKU and price live ONLY on each variation
      updateOp.$unset = {
        sku: 1,
        regularPrice: 1,
        salePrice: 1,
        price: 1,
        basePrice: 1,
        baseSalePrice: 1,
      };
    } else {
      updateOp.$unset = {
        optionName: 1,
      };
    }

    let updatedDoc: any = null;

    try {
      updatedDoc = await Product.findOneAndUpdate(
        getProductMongoQuery(id),
        updateOp,
        { returnDocument: 'after', runValidators: false }
      ).lean();
    } catch (dbErr: any) {
      console.error(`MongoDB error updating product ${id}:`, dbErr.message);
      return NextResponse.json(
        {
          success: false,
          message: `ডাটাবেজে পণ্য আপডেট ত্রুটি: ${dbErr.message || 'Update failed'}`,
        },
        { status: 400 }
      );
    }

    // Sync in memory store
    const memUpdated = updateMemoryProduct(id, sanitized);

    if (!updatedDoc && !memUpdated) {
      return NextResponse.json(
        { success: false, message: 'আপডেট করার জন্য পণ্যটি পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'পণ্য সফলভাবে আপডেট হয়েছে',
      product: computeProductStockAndStatus(updatedDoc || memUpdated || sanitized),
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/products/[id]:', error);
    return NextResponse.json(
      { success: false, message: `পণ্য আপডেট করতে ব্যর্থ হয়েছে: ${error?.message || ''}` },
      { status: 500 }
    );
  }
}

// 3. DELETE /api/products/[id] - Delete product permanently
export async function DELETE(req: NextRequest, context: RouteParams) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;

    let deletedFromDb = false;

    // 1. Delete from MongoDB Atlas
    try {
      await connectToDatabase();
      const res = await Product.findOneAndDelete(getProductMongoQuery(id));
      if (res) deletedFromDb = true;
    } catch (dbErr: any) {
      console.error(`MongoDB error deleting product ${id}:`, dbErr.message);
    }

    // 2. Delete from memory store
    const deletedFromMem = deleteMemoryProduct(id);

    if (!deletedFromDb && !deletedFromMem) {
      return NextResponse.json(
        { success: false, message: 'মুছে ফেলার জন্য পণ্যটি পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'পণ্য সফলভাবে মুছে ফেলা হয়েছে',
      id,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'পণ্য ডিলিট করতে ব্যর্থ হয়েছে' },
      { status: 500 }
    );
  }
}
