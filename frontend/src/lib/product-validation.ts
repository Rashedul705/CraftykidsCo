import mongoose from 'mongoose';
import { Product } from '@/models/Product';
import { IVariant } from '@/models/Product';

export interface ProductValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: any;
}

/**
 * Validates and sanitizes product data according to strict variation & stock rules:
 * 1. salePrice must be empty OR strictly less than regularPrice. Reject otherwise.
 * 2. SKU must be unique across the whole store (reject duplicates).
 * 3. stock must be an integer >= 0.
 * 4. If hasVariations is true, at least one variant is required.
 * 5. If hasVariations is true, ignore any product-level stock, sku and prices.
 * 6. Never auto-copy product-level sale price into variants.
 * 7. An empty sale price means "no discount" (saved as null, never filled with regular price).
 */
export async function validateAndSanitizeProduct(
  data: any,
  currentProductId?: string
): Promise<ProductValidationResult> {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid product data provided.'] };
  }

  // 1. Basic title validation
  if (!data.titleBn || typeof data.titleBn !== 'string' || !data.titleBn.trim()) {
    errors.push('বাংলায় পণ্যের নাম আবশ্যক (titleBn is required).');
  }
  if (!data.titleEn || typeof data.titleEn !== 'string' || !data.titleEn.trim()) {
    errors.push('ইংরেজিতে পণ্যের নাম আবশ্যক (titleEn is required).');
  }

  // Determine hasVariations
  const hasVariations = Boolean(
    data.hasVariations !== undefined
      ? data.hasVariations
      : data.isVariable !== undefined
      ? data.isVariable
      : Array.isArray(data.variants) && data.variants.length > 0
  );

  const sanitized: any = { ...data };
  sanitized.hasVariations = hasVariations;
  sanitized.isVariable = hasVariations;
  sanitized.titleBn = data.titleBn?.trim();
  sanitized.titleEn = data.titleEn?.trim();
  sanitized.title = sanitized.titleEn;

  // Normalization for slug
  let slug = (data.slug || sanitized.titleEn || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  if (!slug) slug = `prod-${Date.now()}`;
  sanitized.slug = slug;

  // Exclude current product ID in duplicate checks
  const buildIdQuery = (id?: string) => {
    if (!id) return null;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    return isObjectId ? { $and: [{ _id: { $ne: id } }, { id: { $ne: id } }] } : { id: { $ne: id } };
  };
  const idExclusion = buildIdQuery(currentProductId);

  // ------------------------------------------------------------
  // CASE A: Product has variations (hasVariations = true)
  // ------------------------------------------------------------
  if (hasVariations) {
    const rawVariants: any[] = Array.isArray(data.variants)
      ? data.variants
      : Array.isArray(data.variations)
      ? data.variations
      : [];

    // Rule 4: At least one variant is required
    if (rawVariants.length === 0) {
      errors.push('একাধিক ভেরিয়েশন সক্রিয় থাকলে কমপক্ষে ১টি ভেরিয়েশন আবশ্যক (At least one variant is required).');
      return { valid: false, errors };
    }

    const localSkus = new Set<string>();
    const sanitizedVariants: IVariant[] = [];

    for (let i = 0; i < rawVariants.length; i++) {
      const v = rawVariants[i];
      const variantIdx = i + 1;
      const optionValue = (v.optionValue || v.titleEn || v.name || v.titleBn || `Option ${variantIdx}`).trim();
      const variantLabel = `ভেরিয়েশন #${variantIdx} ("${optionValue}")`;

      // 1. SKU validation
      const sku = (v.sku || '').trim();
      if (!sku) {
        errors.push(`${variantLabel}: SKU আবশ্যক (SKU is required).`);
      } else {
        const lowerSku = sku.toLowerCase();
        if (localSkus.has(lowerSku)) {
          errors.push(`${variantLabel}: ডুপ্লিকেট SKU "${sku}" একই পণ্যে ব্যবহার করা যাবে না (Duplicate SKU in same product).`);
        } else {
          localSkus.add(lowerSku);
        }
      }

      // 2. Regular price validation
      const rawRegular = v.regularPrice !== undefined ? v.regularPrice : v.price;
      if (rawRegular === undefined || rawRegular === null || rawRegular === '' || isNaN(Number(rawRegular))) {
        errors.push(`${variantLabel}: রেগুলার প্রাইস আবশ্যক (Regular price is required).`);
      } else if (!Number.isInteger(Number(rawRegular))) {
        errors.push(`${variantLabel}: রেগুলার প্রাইস অবশ্যই পূর্ণসংখ্যা হতে হবে (Regular price must be an integer).`);
      }
      const regularPrice = Math.round(Number(rawRegular || 0));
      if (regularPrice <= 0) {
        errors.push(`${variantLabel}: রেগুলার প্রাইস অবশ্যই ০ এর বেশি হতে হবে (Regular price must be > 0).`);
      }

      // 3. Sale price validation (Rule 1, Rule 6, Rule 7)
      // Never auto-copy product-level sale price.
      const rawSale = v.salePrice !== undefined ? v.salePrice : v.baseSalePrice;
      let salePrice: number | null = null;

      if (rawSale !== null && rawSale !== undefined && String(rawSale).trim() !== '') {
        const numSale = Number(rawSale);
        if (isNaN(numSale) || numSale < 0) {
          errors.push(`${variantLabel}: ডিসকাউন্ট প্রাইস অবৈধ (Sale price must be a valid non-negative number).`);
        } else if (!Number.isInteger(numSale)) {
          errors.push(`${variantLabel}: ডিসকাউন্ট প্রাইস অবশ্যই পূর্ণসংখ্যা হতে হবে (Sale price must be an integer).`);
        } else {
          salePrice = Math.round(numSale);
          // Rule 1: salePrice must be strictly less than regularPrice
          if (salePrice >= regularPrice) {
            errors.push(
              `${variantLabel}: ডিসকাউন্ট প্রাইস (৳${salePrice}) অবশ্যই রেগুলার প্রাইস (৳${regularPrice}) থেকে কম হতে হবে (Sale price must be less than regular price).`
            );
          }
        }
      }

      // 4. Stock validation (Rule 3: integer >= 0)
      const rawStock = v.stock !== undefined ? v.stock : v.stockQuantity;
      if (
        rawStock === undefined ||
        rawStock === null ||
        rawStock === '' ||
        isNaN(Number(rawStock)) ||
        !Number.isInteger(Number(rawStock)) ||
        Number(rawStock) < 0
      ) {
        errors.push(`${variantLabel}: স্টক অবশ্যই ০ বা তার বেশি পূর্ণসংখ্যা হতে হবে (Stock must be an integer >= 0).`);
      }
      const stock = Math.max(0, Math.floor(Number(rawStock || 0)));

      // 5. Low stock alert
      const lowStockAlert = Math.max(0, Math.floor(Number(v.lowStockAlert ?? 5)));

      const variantId = v._id || v.id || new mongoose.Types.ObjectId().toString();

      sanitizedVariants.push({
        _id: variantId,
        id: String(variantId),
        optionValue,
        detail: (v.detail || v.whatsInIt || v.descriptionBn || '').trim(),
        sku,
        regularPrice,
        salePrice,
        stock,
        lowStockAlert,
        image: v.image || v.imageUrl || data.image || data.imageUrl || '',
        imageUrl: v.image || v.imageUrl || data.image || data.imageUrl || '',
        isActive: v.isActive !== false,
        // Legacy compatibility:
        titleBn: v.titleBn || optionValue,
        titleEn: v.titleEn || optionValue,
        price: regularPrice,
      });
    }

    // Rule 2: Store-wide SKU uniqueness check
    if (localSkus.size > 0) {
      try {
        const skuArray = Array.from(localSkus);
        const skuCollisionQuery: any = {
          $or: [
            { sku: { $in: skuArray } },
            { 'variants.sku': { $in: skuArray } },
            { 'variations.sku': { $in: skuArray } },
          ],
        };
        if (idExclusion) {
          skuCollisionQuery.$and = [idExclusion];
        }

        const collidingProduct = await Product.findOne(skuCollisionQuery)
          .select('titleEn titleBn sku variants variations')
          .lean();

        if (collidingProduct) {
          // Identify the conflicting SKU
          let conflictingSku = '';
          for (const s of skuArray) {
            if (collidingProduct.sku && collidingProduct.sku.toLowerCase() === s) {
              conflictingSku = s;
              break;
            }
            const matchingV = [
              ...(collidingProduct.variants || []),
              ...(collidingProduct.variations || []),
            ].find((cv: any) => cv.sku && cv.sku.toLowerCase() === s);
            if (matchingV) {
              conflictingSku = s;
              break;
            }
          }

          errors.push(
            `SKU "${conflictingSku || skuArray.join(', ')}" ইতোমধ্যে অন্য পণ্যে ("${
              collidingProduct.titleEn || collidingProduct.titleBn
            }") ব্যবহৃত হচ্ছে। প্রতিটি SKU অবশ্যই অনন্য (Unique) হতে হবে।`
          );
        }
      } catch (err: any) {
        console.warn('SKU uniqueness check DB warning:', err?.message);
      }
    }

    // Rule 5: If hasVariations is true, ignore any product-level stock, sku and prices
    delete sanitized.sku;
    delete sanitized.regularPrice;
    delete sanitized.salePrice;
    delete sanitized.price;
    delete sanitized.basePrice;
    delete sanitized.baseSalePrice;

    sanitized.optionName = (data.optionName || 'Set Options').trim();
    sanitized.variants = sanitizedVariants;
    sanitized.variations = sanitizedVariants;

    // Total stock is calculated strictly as sum of stock of active variants
    const totalStock = sanitizedVariants
      .filter((v) => v.isActive !== false)
      .reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

    sanitized.totalStock = totalStock;
    sanitized.stock = totalStock; // Never typed by hand
  } else {
    // ------------------------------------------------------------
    // CASE B: Simple product (hasVariations = false)
    // ------------------------------------------------------------
    // 1. Regular price validation
    const rawRegular = data.regularPrice !== undefined ? data.regularPrice : data.basePrice ?? data.price;
    if (rawRegular === undefined || rawRegular === null || rawRegular === '' || isNaN(Number(rawRegular))) {
      errors.push('পণ্যের রেগুলার প্রাইস আবশ্যক (Regular price is required).');
    } else if (!Number.isInteger(Number(rawRegular))) {
      errors.push('রেগুলার প্রাইস অবশ্যই পূর্ণসংখ্যা হতে হবে (Regular price must be an integer).');
    }
    const regularPrice = Math.round(Number(rawRegular || 0));
    if (regularPrice <= 0) {
      errors.push('রেগুলার প্রাইস অবশ্যই ০ এর বেশি হতে হবে (Regular price must be > 0).');
    }

    // 2. Sale price validation (Rule 1, Rule 7)
    const rawSale = data.salePrice !== undefined ? data.salePrice : data.baseSalePrice;
    let salePrice: number | null = null;

    if (rawSale !== null && rawSale !== undefined && String(rawSale).trim() !== '') {
      const numSale = Number(rawSale);
      if (isNaN(numSale) || numSale < 0) {
        errors.push('ডিসকাউন্ট প্রাইস অবৈধ (Sale price must be a valid non-negative number).');
      } else if (!Number.isInteger(numSale)) {
        errors.push('ডিসকাউন্ট প্রাইস অবশ্যই পূর্ণসংখ্যা হতে হবে (Sale price must be an integer).');
      } else {
        salePrice = Math.round(numSale);
        // Rule 1: salePrice must be strictly less than regularPrice
        if (salePrice >= regularPrice) {
          errors.push(
            `ডিসকাউন্ট প্রাইস (৳${salePrice}) অবশ্যই রেগুলার প্রাইস (৳${regularPrice}) থেকে কম হতে হবে (Sale price must be less than regular price).`
          );
        }
      }
    }

    // 3. SKU validation (Rule 2)
    const sku = (data.sku || `CKC-${slug.substring(0, 8).toUpperCase()}-001`).trim();
    if (!sku) {
      errors.push('SKU আবশ্যক (SKU is required).');
    } else {
      try {
        const skuCollisionQuery: any = {
          $or: [
            { sku: sku },
            { 'variants.sku': sku },
            { 'variations.sku': sku },
          ],
        };
        if (idExclusion) {
          skuCollisionQuery.$and = [idExclusion];
        }

        const collidingProduct = await Product.findOne(skuCollisionQuery)
          .select('titleEn titleBn')
          .lean();

        if (collidingProduct) {
          errors.push(
            `SKU "${sku}" ইতোমধ্যে অন্য পণ্যে ("${
              collidingProduct.titleEn || collidingProduct.titleBn
            }") ব্যবহৃত হচ্ছে। প্রতিটি SKU অবশ্যই অনন্য (Unique) হতে হবে।`
          );
        }
      } catch (err: any) {
        console.warn('Simple product SKU uniqueness check DB warning:', err?.message);
      }
    }

    // 4. Stock validation (Rule 3)
    const rawStock = data.stock;
    if (
      rawStock !== undefined &&
      rawStock !== null &&
      rawStock !== '' &&
      (isNaN(Number(rawStock)) || !Number.isInteger(Number(rawStock)) || Number(rawStock) < 0)
    ) {
      errors.push('স্টক অবশ্যই ০ বা তার বেশি পূর্ণসংখ্যা হতে হবে (Stock must be an integer >= 0).');
    }
    const stock = rawStock !== undefined && rawStock !== '' ? Math.max(0, Math.floor(Number(rawStock))) : 100;

    sanitized.regularPrice = regularPrice;
    sanitized.basePrice = regularPrice;
    sanitized.price = regularPrice;
    sanitized.salePrice = salePrice;
    sanitized.baseSalePrice = salePrice;
    sanitized.sku = sku;
    sanitized.stock = stock;
    sanitized.totalStock = stock;
    sanitized.lowStockAlert = Math.max(0, Math.floor(Number(data.lowStockAlert ?? 5)));
    sanitized.variants = [];
    sanitized.variations = [];
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined,
  };
}
