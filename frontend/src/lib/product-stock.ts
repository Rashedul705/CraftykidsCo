export type VariantStockStatus = 'in_stock' | 'low' | 'out';

export interface IVariantData {
  _id?: string;
  id?: string;
  optionValue: string; // e.g. "12 Piece Set"
  detail?: string; // e.g. "12 shapes + 6 colors + 1 brush" (Bangla allowed)
  sku: string; // unique across store
  regularPrice: number; // required
  salePrice?: number | null; // null means no discount
  stock: number; // integer, min 0
  lowStockAlert?: number; // default 5
  image?: string; // image url
  imageUrl?: string;
  isActive?: boolean; // default true
  stockStatus?: VariantStockStatus; // virtual / computed on read
  // Backward compatibility fields:
  titleBn?: string;
  titleEn?: string;
  price?: number;
  badge?: string;
}

/**
 * Computes the stock status of a variant or single product:
 *   out      = stock is 0
 *   low      = stock > 0 and stock <= lowStockAlert
 *   in_stock = otherwise
 */
export function computeStockStatus(stock: number, lowStockAlert = 5): VariantStockStatus {
  const s = typeof stock === 'number' && !isNaN(stock) ? Math.max(0, Math.floor(stock)) : 0;
  const alert = typeof lowStockAlert === 'number' && !isNaN(lowStockAlert) ? lowStockAlert : 5;

  if (s <= 0) return 'out';
  if (s <= alert) return 'low';
  return 'in_stock';
}

/**
 * Calculates virtual / computed fields on read:
 * - totalStock = sum of stock of active variants (when hasVariations = true), or product stock (when false)
 * - stockStatus per variant: "in_stock" | "low" | "out"
 * - product-level stockStatus: "in_stock" | "low" | "out"
 * - syncs variants and variations for backward compatibility
 */
export function computeProductStockAndStatus<T extends Record<string, any>>(rawProduct: T): T {
  if (!rawProduct || typeof rawProduct !== 'object') {
    return rawProduct;
  }

  const p = { ...rawProduct } as any;

  // Determine hasVariations
  const hasVariations = Boolean(
    p.hasVariations ??
      p.isVariable ??
      (Array.isArray(p.variants) && p.variants.length > 0) ??
      (Array.isArray(p.variations) && p.variations.length > 0)
  );
  p.hasVariations = hasVariations;
  p.isVariable = hasVariations;

  p.optionName = p.optionName || 'Set Options';

  // Normalize variants list from either p.variants or legacy p.variations
  const rawList: any[] = Array.isArray(p.variants) && p.variants.length > 0
    ? p.variants
    : Array.isArray(p.variations) && p.variations.length > 0
    ? p.variations
    : [];

  if (hasVariations && rawList.length > 0) {
    const computedVariants: IVariantData[] = rawList.map((item: any, idx: number) => {
      const optionValue = item.optionValue || item.titleEn || item.name || item.titleBn || `Option ${idx + 1}`;
      const detail = item.detail || item.whatsInIt || item.descriptionBn || '';
      const sku = (item.sku || `${p.sku || 'SKU'}-${idx + 1}`).trim();
      const regularPrice = Number(item.regularPrice ?? item.price ?? p.regularPrice ?? p.basePrice ?? 0);
      
      const rawSale = item.salePrice !== undefined ? item.salePrice : item.baseSalePrice;
      const salePrice =
        rawSale === null || rawSale === '' || rawSale === undefined || Number(rawSale) <= 0
          ? null
          : Number(rawSale);

      const stock = Math.max(0, Math.floor(Number(item.stock ?? item.stockQuantity ?? 0)));
      const lowStockAlert = Number(item.lowStockAlert ?? p.lowStockAlert ?? 5);
      const image = item.image || item.imageUrl || p.image || p.imageUrl || '';
      const isActive = item.isActive !== false;
      const stockStatus = computeStockStatus(stock, lowStockAlert);

      const id = String(item._id || item.id || `v-${idx + 1}`);

      return {
        _id: id,
        id,
        optionValue,
        detail,
        sku,
        regularPrice,
        salePrice,
        stock,
        lowStockAlert,
        image,
        imageUrl: image,
        isActive,
        stockStatus,
        // Legacy compatibility:
        titleBn: item.titleBn || optionValue,
        titleEn: item.titleEn || optionValue,
        price: regularPrice,
        badge: item.badge,
      };
    });

    p.variants = computedVariants;
    p.variations = computedVariants;

    // Total stock = sum of stock of active variants
    const totalActiveStock = computedVariants
      .filter((v) => v.isActive !== false)
      .reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

    p.totalStock = totalActiveStock;
    // Core rule: The product level never stores its own stock when hasVariations = true
    p.stock = totalActiveStock;
    p.stockStatus = computeStockStatus(totalActiveStock, p.lowStockAlert ?? 5);
  } else {
    // Simple product
    const simpleStock = Math.max(0, Math.floor(Number(p.stock ?? 0)));
    p.totalStock = simpleStock;
    p.stock = simpleStock;
    p.regularPrice = Number(p.regularPrice ?? p.basePrice ?? p.price ?? 0);
    
    const rawSale = p.salePrice !== undefined ? p.salePrice : p.baseSalePrice;
    p.salePrice =
      rawSale === null || rawSale === '' || rawSale === undefined || Number(rawSale) <= 0
        ? null
        : Number(rawSale);

    p.stockStatus = computeStockStatus(simpleStock, p.lowStockAlert ?? 5);
    p.variants = [];
    p.variations = [];
  }

  return p as T;
}
