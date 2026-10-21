import { NextRequest, NextResponse } from 'next/server';
import {
  getAllBundles,
  getBundleById,
  createBundle,
  updateBundle,
  deleteBundle,
  toggleBundleActive,
  calculateBundleStock,
  computeBundleFinancials,
  BundleRecord,
} from '@/lib/bundles-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');

    let bundles = getAllBundles();

    if (featured === 'true') {
      bundles = bundles.filter((b) => b.isFeatured);
    }

    if (status && status !== 'all') {
      if (status === 'low-stock') {
        bundles = bundles.filter((b) => {
          const { setsAvailable } = calculateBundleStock(b.items);
          return setsAvailable > 0 && setsAvailable <= 10;
        });
      } else if (status === 'out-of-stock') {
        bundles = bundles.filter((b) => {
          const { setsAvailable } = calculateBundleStock(b.items);
          return setsAvailable === 0;
        });
      } else {
        bundles = bundles.filter((b) => b.status === status);
      }
    }

    if (search) {
      const q = search.toLowerCase();
      bundles = bundles.filter(
        (b) =>
          b.titleBn.toLowerCase().includes(q) ||
          b.titleEn.toLowerCase().includes(q) ||
          b.slug.toLowerCase().includes(q) ||
          b.items.some((item) =>
            item.productTitleBn.toLowerCase().includes(q) ||
            item.productTitleEn.toLowerCase().includes(q)
          )
      );
    }

    // Attach computed stock status dynamically
    const enrichedBundles = bundles.map((b) => {
      const stockInfo = calculateBundleStock(b.items);
      return {
        ...b,
        setsAvailable: stockInfo.setsAvailable,
        limitingItem: stockInfo.limitingItem
          ? {
              productId: stockInfo.limitingItem.productId,
              productTitleBn: stockInfo.limitingItem.productTitleBn,
              stock: stockInfo.limitingItem.stock,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      count: enrichedBundles.length,
      bundles: enrichedBundles,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch bundles' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.titleBn || !body.titleEn) {
      return NextResponse.json(
        { success: false, error: 'Both Bangla and English titles are required' },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one product item is required in a bundle' },
        { status: 400 }
      );
    }

    const financials = computeBundleFinancials(
      body.items,
      body.pricingMode || 'fixed',
      body.pricingValue || body.bundlePrice || 0
    );

    const slug =
      body.slug ||
      body.titleEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') ||
      `bundle-${Date.now()}`;

    const newBundle = createBundle({
      slug,
      titleBn: body.titleBn,
      titleEn: body.titleEn,
      descriptionBn: body.descriptionBn || '',
      descriptionEn: body.descriptionEn || '',
      imageUrl: body.imageUrl || body.items[0]?.imageUrl || '',
      galleryImages: body.galleryImages || [body.imageUrl || body.items[0]?.imageUrl || ''],
      items: body.items,
      pricingMode: body.pricingMode || 'fixed',
      pricingValue: body.pricingValue || body.bundlePrice || 0,
      bundlePrice: financials.bundlePrice,
      originalPrice: financials.originalPrice,
      discountPercent: financials.discountPercent,
      savingsAmount: financials.savingsAmount,
      totalCost: financials.totalCost,
      profitMargin: financials.profitMargin,
      profitMarginPercent: financials.profitMarginPercent,
      status: body.status || 'active',
      startDate: body.startDate,
      endDate: body.endDate,
      suitableAge: body.suitableAge || '২-৬ বছর',
      occasion: body.occasion || 'everyday',
      badge: body.badge || (financials.discountPercent > 0 ? `${financials.discountPercent}% সাশ্রয়` : 'স্পেশাল কম্বো'),
      displayLocations: body.displayLocations || ['bundles', 'home', 'product-pages'],
      hideWhenOutOfStock: body.hideWhenOutOfStock ?? true,
      isFeatured: !!body.isFeatured,
    });

    return NextResponse.json({
      success: true,
      bundle: newBundle,
      message: 'Bundle created successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create bundle' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Bundle ID is required' },
        { status: 400 }
      );
    }

    if (action === 'toggle-active') {
      const updated = toggleBundleActive(id);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Bundle not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        bundle: updated,
        message: `Bundle is now ${updated.status === 'active' ? 'Active' : 'Draft'}`,
      });
    }

    // Recompute financials if items or pricing changed
    if (updates.items || updates.pricingMode || updates.pricingValue) {
      const existing = getBundleById(id);
      const items = updates.items || existing?.items || [];
      const mode = updates.pricingMode || existing?.pricingMode || 'fixed';
      const value = updates.pricingValue ?? existing?.pricingValue ?? 0;
      const financials = computeBundleFinancials(items, mode, value);

      Object.assign(updates, {
        originalPrice: financials.originalPrice,
        bundlePrice: financials.bundlePrice,
        discountPercent: financials.discountPercent,
        savingsAmount: financials.savingsAmount,
        totalCost: financials.totalCost,
        profitMargin: financials.profitMargin,
        profitMarginPercent: financials.profitMarginPercent,
      });
    }

    const updated = updateBundle(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Bundle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      bundle: updated,
      message: 'Bundle updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update bundle' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Bundle ID is required' },
        { status: 400 }
      );
    }

    const deleted = deleteBundle(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Bundle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Bundle deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete bundle' },
      { status: 500 }
    );
  }
}
