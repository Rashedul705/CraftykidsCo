import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { Bundle } from '@/models/Bundle';
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
  globalBundles,
} from '@/lib/bundles-store';

/**
 * Seed initial sample bundles into MongoDB if collection is empty
 */
async function seedBundlesIfEmpty() {
  try {
    const count = await Bundle.countDocuments();
    if (count === 0 && globalBundles && globalBundles.length > 0) {
      await Bundle.insertMany(
        globalBundles.map((b) => ({
          ...b,
          _id: mongoose.Types.ObjectId.isValid(b.id) ? new mongoose.Types.ObjectId(b.id) : undefined,
        }))
      );
      console.log('Seeded initial bundles into MongoDB');
    }
  } catch (err) {
    console.warn('Could not auto-seed bundles into MongoDB:', err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const home = searchParams.get('home');
    const productId = searchParams.get('productId');
    const productPage = searchParams.get('productPage');

    let bundles: BundleRecord[] = [];
    let isFromMongo = false;

    // 1. Try fetching from MongoDB Atlas
    try {
      await connectToDatabase();
      await seedBundlesIfEmpty();

      const mongoQuery: any = {};
      if (featured === 'true') {
        mongoQuery.isFeatured = true;
      }
      if (home === 'true') {
        mongoQuery.$or = [{ showOnHome: true }, { displayLocations: 'home' }];
      }
      if (productPage === 'true') {
        mongoQuery.$or = [{ showOnProductPage: true }, { displayLocations: 'product-pages' }];
      }
      if (productId) {
        mongoQuery['items.productId'] = productId;
      }
      if (status && status !== 'all' && status !== 'low-stock' && status !== 'out-of-stock') {
        mongoQuery.status = status;
      }
      if (search) {
        const regex = new RegExp(search, 'i');
        const searchOr = [
          { titleBn: regex },
          { titleEn: regex },
          { slug: regex },
          { 'items.productTitleBn': regex },
          { 'items.productTitleEn': regex },
        ];
        if (mongoQuery.$or) {
          mongoQuery.$and = [{ $or: mongoQuery.$or }, { $or: searchOr }];
          delete mongoQuery.$or;
        } else {
          mongoQuery.$or = searchOr;
        }
      }

      const dbBundles = await Bundle.find(mongoQuery).sort({ sortOrder: 1, createdAt: -1 }).lean();
      if (dbBundles && dbBundles.length > 0) {
        bundles = dbBundles.map((b: any) => ({
          id: b.id || b._id.toString(),
          slug: b.slug,
          titleBn: b.titleBn,
          titleEn: b.titleEn,
          descriptionBn: b.descriptionBn || '',
          descriptionEn: b.descriptionEn || '',
          imageUrl: b.imageUrl || '',
          galleryImages: b.galleryImages || [],
          items: b.items || [],
          pricingMode: b.pricingMode || 'fixed',
          pricingValue: b.pricingValue || b.bundlePrice || 0,
          bundlePrice: b.bundlePrice || 0,
          originalPrice: b.originalPrice || 0,
          discountPercent: b.discountPercent || 0,
          savingsAmount: b.savingsAmount || 0,
          totalCost: b.totalCost || 0,
          profitMargin: b.profitMargin || 0,
          profitMarginPercent: b.profitMarginPercent || 0,
          status: b.status || 'active',
          startDate: b.startDate,
          endDate: b.endDate,
          suitableAge: b.suitableAge || '২-৬ বছর',
          occasion: b.occasion || 'everyday',
          badge: b.badge || '',
          displayLocations: b.displayLocations || ['bundles', 'home', 'product-pages'],
          hideWhenOutOfStock: b.hideWhenOutOfStock ?? true,
          isFeatured: !!b.isFeatured,
          showOnHome: b.showOnHome !== undefined ? !!b.showOnHome : (b.displayLocations?.includes('home') ?? false),
          showOnProductPage: b.showOnProductPage !== undefined ? !!b.showOnProductPage : (b.displayLocations?.includes('product-pages') ?? false),
          sortOrder: b.sortOrder || 0,
          createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : new Date().toISOString(),
        }));
        isFromMongo = true;
      }
    } catch (mongoErr) {
      console.warn('MongoDB error in GET /api/bundles (falling back to memory store):', mongoErr);
    }

    // Fallback to in-memory bundles if MongoDB did not return results
    if (!isFromMongo) {
      bundles = getAllBundles();

      if (featured === 'true') {
        bundles = bundles.filter((b) => b.isFeatured);
      }

      if (status && status !== 'all' && status !== 'low-stock' && status !== 'out-of-stock') {
        bundles = bundles.filter((b) => b.status === status);
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
    }

    // Low stock / out of stock filters
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
      source: isFromMongo ? 'mongodb' : 'memory',
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

    const bundleId = body.id || `bundle-${Date.now()}`;

    const bundleData: any = {
      id: bundleId,
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
      showOnHome: body.showOnHome !== undefined ? Boolean(body.showOnHome) : (body.displayLocations ? body.displayLocations.includes('home') : false),
      showOnProductPage: body.showOnProductPage !== undefined ? Boolean(body.showOnProductPage) : (body.displayLocations ? body.displayLocations.includes('product-pages') : false),
      sortOrder: Number(body.sortOrder) || 0,
      hideWhenOutOfStock: body.hideWhenOutOfStock ?? true,
      isFeatured: !!body.isFeatured,
    };

    // 1. Save to MongoDB
    let savedInMongo = false;
    let savedDoc: any = null;
    try {
      await connectToDatabase();
      savedDoc = await Bundle.create(bundleData);
      if (savedDoc) {
        bundleData.id = savedDoc.id || savedDoc._id.toString();
        savedInMongo = true;
      }
    } catch (dbErr) {
      console.warn('Could not save bundle to MongoDB (saving to memory store):', dbErr);
    }

    // 2. Also keep in-memory store in sync
    createBundle(bundleData);

    return NextResponse.json({
      success: true,
      bundle: bundleData,
      source: savedInMongo ? 'mongodb' : 'memory',
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

    let isMongoConnected = false;
    try {
      await connectToDatabase();
      isMongoConnected = true;
    } catch (err) {
      console.warn('MongoDB connection failed in PUT /api/bundles:', err);
    }

    if (action === 'toggle-active') {
      let updated: any = null;
      if (isMongoConnected) {
        const query: any = { $or: [{ id: id }, { slug: id }] };
        if (mongoose.Types.ObjectId.isValid(id)) {
          query.$or.push({ _id: new mongoose.Types.ObjectId(id) });
        }
        const existing = await Bundle.findOne(query);
        if (existing) {
          existing.status = existing.status === 'active' ? 'draft' : 'active';
          await existing.save();
          updated = existing.toObject();
          updated.id = updated.id || updated._id.toString();
        }
      }

      const memUpdated = toggleBundleActive(id);
      if (!updated && memUpdated) {
        updated = memUpdated;
      }

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
    if (updates.displayLocations) {
      if (updates.showOnHome === undefined) {
        updates.showOnHome = updates.displayLocations.includes('home');
      }
      if (updates.showOnProductPage === undefined) {
        updates.showOnProductPage = updates.displayLocations.includes('product-pages');
      }
    }
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

    let updatedDoc: any = null;
    if (isMongoConnected) {
      const query: any = { $or: [{ id: id }, { slug: id }] };
      if (mongoose.Types.ObjectId.isValid(id)) {
        query.$or.push({ _id: new mongoose.Types.ObjectId(id) });
      }
      updatedDoc = await Bundle.findOneAndUpdate(query, updates, { new: true }).lean();
      if (updatedDoc) {
        updatedDoc.id = updatedDoc.id || updatedDoc._id.toString();
      }
    }

    const memUpdated = updateBundle(id, updates);
    const finalBundle = updatedDoc || memUpdated;

    if (!finalBundle) {
      return NextResponse.json(
        { success: false, error: 'Bundle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      bundle: finalBundle,
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

    let deletedFromMongo = false;
    try {
      await connectToDatabase();
      const query: any = { $or: [{ id: id }, { slug: id }] };
      if (mongoose.Types.ObjectId.isValid(id)) {
        query.$or.push({ _id: new mongoose.Types.ObjectId(id) });
      }
      const res = await Bundle.findOneAndDelete(query);
      if (res) deletedFromMongo = true;
    } catch (err) {
      console.warn('MongoDB delete failed in DELETE /api/bundles:', err);
    }

    const deletedFromMem = deleteBundle(id);

    if (!deletedFromMongo && !deletedFromMem) {
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
