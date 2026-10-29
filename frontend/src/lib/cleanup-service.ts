import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { StockLog } from '@/models/StockLog';

export interface CleanupOptions {
  dryRun?: boolean;
  disambiguateSkus?: boolean;
  createBaselineLogs?: boolean;
}

export interface SkuOccurrence {
  productId: string;
  productTitle: string;
  variantId?: string;
  optionValue?: string;
}

export interface SkuDuplicateGroup {
  sku: string;
  occurrences: SkuOccurrence[];
  disambiguatedTo?: string[];
}

export interface CleanupReport {
  dryRun: boolean;
  totalProductsScanned: number;
  variableProductsFound: number;
  simpleProductsFound: number;
  legacyVariationsMigrated: number;
  productLevelFieldsUnsetCount: number;
  invalidSalePricesNullified: number;
  optionValuesNormalized: number;
  duplicateSkusFound: SkuDuplicateGroup[];
  baselineStockLogsCreated: number;
  changes: string[];
  warnings: string[];
  errors: string[];
}

/**
 * Standardize and clean option values like '12 piece set', '24 pcs', '12 shades'
 */
export function normalizeOptionValue(raw: string): string {
  if (!raw || typeof raw !== 'string') return raw || '';
  let str = raw.trim();

  // Pattern: {N} piece set / pcs / pc
  str = str.replace(/\b(\d+)\s*(?:piece set|piece|pcs|pc|pieces)\b/gi, '$1 Piece Set');

  // Pattern: {N} shades / shade
  str = str.replace(/\b(\d+)\s*(?:shades|shade)\b/gi, '$1 Shades');

  // Pattern: {N} colors / color
  str = str.replace(/\b(\d+)\s*(?:colors|color)\b/gi, '$1 Colors');

  // Capitalize first character if lowercase
  if (str.length > 0 && str[0] >= 'a' && str[0] <= 'z') {
    str = str.charAt(0).toUpperCase() + str.slice(1);
  }

  return str;
}

/**
 * Core migration and cleanup routine for MongoDB Atlas
 */
export async function runVariationsCleanup(options: CleanupOptions = {}): Promise<CleanupReport> {
  const dryRun = options.dryRun !== false; // Default to true (safe dry-run)
  const disambiguateSkus = Boolean(options.disambiguateSkus);
  const createBaselineLogs = options.createBaselineLogs !== false; // Default true

  await connectToDatabase();

  const report: CleanupReport = {
    dryRun,
    totalProductsScanned: 0,
    variableProductsFound: 0,
    simpleProductsFound: 0,
    legacyVariationsMigrated: 0,
    productLevelFieldsUnsetCount: 0,
    invalidSalePricesNullified: 0,
    optionValuesNormalized: 0,
    duplicateSkusFound: [],
    baselineStockLogsCreated: 0,
    changes: [],
    warnings: [],
    errors: [],
  };

  const rawProducts = await Product.find({}).lean();
  report.totalProductsScanned = rawProducts.length;

  const skuMap = new Map<string, SkuOccurrence[]>();

  for (const rawProduct of rawProducts) {
    const prodId = String(rawProduct._id || rawProduct.id);
    const prodTitle = rawProduct.titleEn || rawProduct.titleBn || 'Untitled Product';

    const legacyVariations: any[] = (rawProduct as any).variations || [];
    const currentVariants: any[] = rawProduct.variants || [];

    const isVariable = Boolean(
      rawProduct.hasVariations ||
      currentVariants.length > 0 ||
      legacyVariations.length > 0
    );

    if (isVariable) {
      report.variableProductsFound++;
      let variantsToPersist: any[] = [];
      let productModified = false;
      const unsets: Record<string, any> = {};

      // 1. Check legacy variations migration
      if ((!currentVariants || currentVariants.length === 0) && legacyVariations.length > 0) {
        variantsToPersist = legacyVariations.map((lv: any, idx: number) => {
          const rawName = lv.name || lv.optionValue || lv.titleEn || `Option ${idx + 1}`;
          const normalized = normalizeOptionValue(rawName);
          const regPrice = Math.round(Number(lv.regularPrice ?? lv.price ?? 0));
          const sPrice = lv.salePrice != null && Number(lv.salePrice) > 0 && Number(lv.salePrice) < regPrice
            ? Math.round(Number(lv.salePrice))
            : null;
          const stockVal = Math.round(Number(lv.stock ?? lv.stockQuantity ?? 0));

          return {
            optionValue: normalized,
            detail: lv.detail || lv.whatsInIt || lv.descriptionBn || '',
            sku: (lv.sku || `${rawProduct.slug || 'prod'}-OPT-${idx + 1}`).trim().toUpperCase(),
            regularPrice: regPrice,
            salePrice: sPrice,
            stock: stockVal,
            lowStockAlert: Number(lv.lowStockAlert || rawProduct.lowStockAlert || 5),
            imageUrl: lv.imageUrl || lv.image || '',
            isActive: lv.isActive !== false,
          };
        });

        report.legacyVariationsMigrated += variantsToPersist.length;
        report.changes.push(`[${prodTitle}]: Migrated ${variantsToPersist.length} legacy variations into standard variants schema.`);
        productModified = true;
      } else {
        // Inspect current variants for normalization & invalid salePrice
        variantsToPersist = currentVariants.map((v: any) => {
          const rawOpt = v.optionValue || v.name || '';
          const normalized = normalizeOptionValue(rawOpt);
          if (rawOpt && normalized !== rawOpt) {
            report.optionValuesNormalized++;
            report.changes.push(`[${prodTitle}]: Normalized option '${rawOpt}' -> '${normalized}'`);
            productModified = true;
          }

          const regPrice = Math.round(Number(v.regularPrice ?? v.price ?? 0));
          let sPrice = v.salePrice != null ? Math.round(Number(v.salePrice)) : null;

          if (sPrice !== null && sPrice >= regPrice) {
            report.invalidSalePricesNullified++;
            report.changes.push(`[${prodTitle} - ${normalized}]: Sale price (${sPrice}) >= regular price (${regPrice}). Nullifying salePrice.`);
            sPrice = null;
            productModified = true;
          }

          return {
            ...v,
            optionValue: normalized,
            regularPrice: regPrice,
            salePrice: sPrice,
            stock: Math.round(Number(v.stock ?? v.stockQuantity ?? 0)),
            sku: (v.sku || '').trim().toUpperCase(),
          };
        });
      }

      // Collect SKUs for duplicate analysis
      for (const variant of variantsToPersist) {
        if (variant.sku) {
          const list = skuMap.get(variant.sku) || [];
          list.push({
            productId: prodId,
            productTitle: prodTitle,
            variantId: String(variant._id || variant.id || ''),
            optionValue: variant.optionValue,
          });
          skuMap.set(variant.sku, list);
        }
      }

      // 2. Identify product-level fields to remove on variable products
      const fieldsToCheck = [
        'regularPrice',
        'salePrice',
        'stock',
        'stockQuantity',
        'price',
        'basePrice',
        'baseSalePrice',
        'variations', // remove legacy variations key
      ];

      for (const field of fieldsToCheck) {
        if ((rawProduct as any)[field] !== undefined) {
          unsets[field] = 1;
          report.productLevelFieldsUnsetCount++;
          productModified = true;
        }
      }

      if (unsets.stock !== undefined || unsets.regularPrice !== undefined) {
        report.changes.push(`[${prodTitle}]: Unsetting product-level pricing & stock fields (${Object.keys(unsets).join(', ')}).`);
      }

      // Commit changes if not dry-run
      if (!dryRun && productModified) {
        const updateDoc: Record<string, any> = {
          $set: {
            hasVariations: true,
            optionName: rawProduct.optionName || 'Set Options',
            variants: variantsToPersist,
          },
        };

        if (Object.keys(unsets).length > 0) {
          updateDoc.$unset = unsets;
        }

        await Product.updateOne({ _id: rawProduct._id }, updateDoc);
      }

      // Baseline stock logs for variants
      if (createBaselineLogs && !dryRun) {
        for (const variant of variantsToPersist) {
          const vStock = Number(variant.stock || 0);
          if (vStock > 0) {
            const vId = variant._id ? String(variant._id) : undefined;
            const logExists = await StockLog.findOne({
              productId: prodId,
              ...(vId ? { variantId: vId } : {}),
            }).lean();

            if (!logExists) {
              await StockLog.create({
                productId: prodId,
                variantId: vId || null,
                stockBefore: 0,
                stockAfter: vStock,
                change: vStock,
                reason: 'restock',
                note: `Initial baseline stock record for variant "${variant.optionValue}"`,
                adminId: 'system_migration',
              });
              report.baselineStockLogsCreated++;
            }
          }
        }
      } else if (createBaselineLogs && dryRun) {
        for (const variant of variantsToPersist) {
          if (Number(variant.stock || 0) > 0) {
            report.baselineStockLogsCreated++;
          }
        }
      }
    } else {
      // Simple product
      report.simpleProductsFound++;
      let simpleModified = false;
      const unsets: Record<string, any> = {};
      const sets: Record<string, any> = {};

      const currentRegPrice = rawProduct.regularPrice != null
        ? Number(rawProduct.regularPrice)
        : (rawProduct as any).price != null
        ? Number((rawProduct as any).price)
        : 0;

      let currentSalePrice = rawProduct.salePrice != null ? Number(rawProduct.salePrice) : null;

      // Migrate legacy 'price' -> 'regularPrice'
      if (rawProduct.regularPrice == null && (rawProduct as any).price != null) {
        sets.regularPrice = currentRegPrice;
        unsets.price = 1;
        simpleModified = true;
        report.changes.push(`[${prodTitle}]: Migrated legacy 'price' (${currentRegPrice}) to 'regularPrice'.`);
      }

      // Clean invalid sale price
      if (currentSalePrice !== null && currentSalePrice >= currentRegPrice) {
        report.invalidSalePricesNullified++;
        report.changes.push(`[${prodTitle}]: Simple product salePrice (${currentSalePrice}) >= regularPrice (${currentRegPrice}). Nullifying.`);
        unsets.salePrice = 1;
        simpleModified = true;
      }

      // Remove unwanted legacy fields if present
      for (const field of ['stockQuantity', 'basePrice', 'baseSalePrice', 'variations']) {
        if ((rawProduct as any)[field] !== undefined) {
          unsets[field] = 1;
          simpleModified = true;
        }
      }

      // Collect SKU
      const simpleSku = (rawProduct.sku || '').trim().toUpperCase();
      if (simpleSku) {
        const list = skuMap.get(simpleSku) || [];
        list.push({
          productId: prodId,
          productTitle: prodTitle,
        });
        skuMap.set(simpleSku, list);
      }

      if (!dryRun && simpleModified) {
        const updateDoc: Record<string, any> = {};
        if (Object.keys(sets).length > 0) updateDoc.$set = sets;
        if (Object.keys(unsets).length > 0) updateDoc.$unset = unsets;
        if (Object.keys(updateDoc).length > 0) {
          await Product.updateOne({ _id: rawProduct._id }, updateDoc);
        }
      }

      // Baseline stock log for simple product
      if (createBaselineLogs && !dryRun) {
        const pStock = Number(rawProduct.stock || 0);
        if (pStock > 0) {
          const logExists = await StockLog.findOne({ productId: prodId }).lean();
          if (!logExists) {
            await StockLog.create({
              productId: prodId,
              variantId: null,
              stockBefore: 0,
              stockAfter: pStock,
              change: pStock,
              reason: 'restock',
              note: `Initial baseline stock record for simple product`,
              adminId: 'system_migration',
            });
            report.baselineStockLogsCreated++;
          }
        }
      } else if (createBaselineLogs && dryRun) {
        if (Number(rawProduct.stock || 0) > 0) {
          report.baselineStockLogsCreated++;
        }
      }
    }
  }

  // Duplicate SKU analysis
  for (const [sku, occurrences] of skuMap.entries()) {
    if (occurrences.length > 1) {
      const dupGroup: SkuDuplicateGroup = {
        sku,
        occurrences,
      };

      report.warnings.push(`Duplicate SKU detected: "${sku}" used by ${occurrences.length} items.`);

      if (disambiguateSkus) {
        dupGroup.disambiguatedTo = [];
        occurrences.forEach((occ, idx) => {
          if (idx === 0) {
            dupGroup.disambiguatedTo?.push(sku); // Keep first
          } else {
            const newSku = `${sku}-D${idx + 1}`;
            dupGroup.disambiguatedTo?.push(newSku);
            report.changes.push(`Disambiguating duplicate SKU "${sku}" -> "${newSku}" for product "${occ.productTitle}"`);
          }
        });

        if (!dryRun) {
          for (let i = 1; i < occurrences.length; i++) {
            const occ = occurrences[i];
            const newSku = dupGroup.disambiguatedTo[i];
            if (occ.variantId && mongoose.Types.ObjectId.isValid(occ.variantId)) {
              await Product.updateOne(
                { _id: occ.productId, 'variants._id': occ.variantId },
                { $set: { 'variants.$.sku': newSku } }
              );
            } else {
              // Try matching variant by old SKU first
              const res = await Product.updateOne(
                { _id: occ.productId, 'variants.sku': sku },
                { $set: { 'variants.$.sku': newSku } }
              );
              if (res.matchedCount === 0) {
                await Product.updateOne(
                  { _id: occ.productId },
                  { $set: { sku: newSku } }
                );
              }
            }
          }
        }
      }

      report.duplicateSkusFound.push(dupGroup);
    }
  }

  return report;
}
