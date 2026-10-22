/**
 * Product Utility Functions
 * Handles stock evaluation and unified sorting rules:
 * 1. In-stock products show first; stock-out products show last.
 * 2. Recently added products show first within each group.
 */

export function isProductOutOfStock(product: any): boolean {
  if (!product) return false;
  if (product.isOutOfStock === true) return true;

  // If product has variations, check if all variations are out of stock
  if (Array.isArray(product.variations) && product.variations.length > 0) {
    const totalVarStock = product.variations.reduce((sum: number, v: any) => {
      const vStock = Number(v.stockQuantity ?? v.stock ?? 0);
      return sum + (isNaN(vStock) ? 0 : vStock);
    }, 0);
    if (totalVarStock <= 0) return true;
  }

  // Check direct stock field
  if (typeof product.stock === 'number') {
    return product.stock <= 0;
  }

  return false;
}

export function getProductStock(product: any): number {
  if (!product) return 0;
  if (Array.isArray(product.variations) && product.variations.length > 0) {
    return product.variations.reduce((sum: number, v: any) => {
      const vStock = Number(v.stockQuantity ?? v.stock ?? 0);
      return sum + (isNaN(vStock) ? 0 : vStock);
    }, 0);
  }
  if (typeof product.stock === 'number') {
    return product.stock;
  }
  return 25; // default healthy stock
}

export function sortProductsByStockAndRecency<T = any>(products: T[]): T[] {
  if (!Array.isArray(products)) return [];

  return [...products].sort((a: any, b: any) => {
    const aOut = isProductOutOfStock(a);
    const bOut = isProductOutOfStock(b);

    // Rule 1: Stock-out products will show last
    if (aOut && !bOut) return 1;
    if (!aOut && bOut) return -1;

    // Rule 2: Recently added products show first
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (aDate !== bDate && !isNaN(aDate) && !isNaN(bDate) && (aDate > 0 || bDate > 0)) {
      return bDate - aDate;
    }

    // Fallback: If ID has timestamp or digits (e.g. prod-173456... or prod-Date.now())
    const aIdMatch = String(a.id || a._id || '').match(/\d{9,}/);
    const bIdMatch = String(b.id || b._id || '').match(/\d{9,}/);
    if (aIdMatch && bIdMatch) {
      const aNum = Number(aIdMatch[0]);
      const bNum = Number(bIdMatch[0]);
      if (aNum !== bNum) return bNum - aNum;
    }

    return 0;
  });
}
