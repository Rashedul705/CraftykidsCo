import { connectToDatabase } from '../src/lib/mongodb';
import { Product } from '../src/models/Product';
import { BundleTier } from '../src/models/BundleTier';
import { BundleSetting } from '../src/models/BundleSetting';
import { Bundle } from '../src/models/Bundle';
import { GiftCategory } from '../src/models/GiftCategory';
import { GiftItem } from '../src/models/GiftItem';

export async function seedDemoData() {
  await connectToDatabase();
  console.log('--- Cleaning up any existing DEMO items before seeding ---');
  await Product.deleteMany({ titleEn: { $regex: /^DEMO/i } });
  await Bundle.deleteMany({ titleEn: { $regex: /^DEMO/i } });
  await GiftCategory.deleteMany({ name: { $regex: /^DEMO/i } });
  await GiftItem.deleteMany({ name: { $regex: /^DEMO/i } });

  console.log('--- Seeding Bundle Settings & Tiers ---');
  await BundleSetting.findOneAndUpdate(
    {},
    { maxDiscountPercent: 20, showOutOfStockMode: 'greyed' },
    { upsert: true, new: true }
  );

  await BundleTier.deleteMany({});
  await BundleTier.create([
    { minQuantity: 2, discountPercent: 5, isActive: true, sortOrder: 1 },
    { minQuantity: 3, discountPercent: 10, isActive: true, sortOrder: 2 },
    { minQuantity: 4, discountPercent: 15, isActive: true, sortOrder: 3 },
  ]);

  console.log('--- Seeding 6 DEMO Products ---');
  const p1 = await Product.create({
    id: 'demo-prod-reg-a',
    titleBn: 'ডেমো আর্ট কিট রেগুলার এ',
    titleEn: 'DEMO Art Kit Regular A',
    slug: 'demo-art-kit-regular-a',
    regularPrice: 500,
    price: 500,
    basePrice: 500,
    stock: 20,
    bundleEligible: true,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
  });

  const p2 = await Product.create({
    id: 'demo-prod-reg-b',
    titleBn: 'ডেমো আর্ট কিট রেগুলার বি',
    titleEn: 'DEMO Art Kit Regular B',
    slug: 'demo-art-kit-regular-b',
    regularPrice: 700,
    price: 700,
    basePrice: 700,
    stock: 15,
    bundleEligible: true,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=400',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=400',
  });

  const p3 = await Product.create({
    id: 'demo-prod-reg-c',
    titleBn: 'ডেমো আর্ট কিট রেগুলার সি',
    titleEn: 'DEMO Art Kit Regular C',
    slug: 'demo-art-kit-regular-c',
    regularPrice: 600,
    price: 600,
    basePrice: 600,
    stock: 10,
    bundleEligible: true,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
  });

  const p4 = await Product.create({
    id: 'demo-prod-sale',
    titleBn: 'ডেমো ক্রেয়ন সেট সেল',
    titleEn: 'DEMO Crayon Set Sale',
    slug: 'demo-crayon-set-sale',
    regularPrice: 400,
    basePrice: 400,
    salePrice: 350,
    baseSalePrice: 350,
    price: 350,
    stock: 25,
    bundleEligible: true,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=400',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=400',
  });

  const p5 = await Product.create({
    id: 'demo-prod-oos',
    titleBn: 'ডেমো পাজল আউট অব স্টক',
    titleEn: 'DEMO Puzzle Out of Stock',
    slug: 'demo-puzzle-out-of-stock',
    regularPrice: 450,
    price: 450,
    basePrice: 450,
    stock: 0,
    bundleEligible: true,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
  });

  const p6 = await Product.create({
    id: 'demo-prod-not-bundle',
    titleBn: 'ডেমো স্পেশাল নট বান্ডেল এলিজিবল',
    titleEn: 'DEMO Exclusive Not Bundle Eligible',
    slug: 'demo-exclusive-not-bundle-eligible',
    regularPrice: 1200,
    price: 1200,
    basePrice: 1200,
    stock: 30,
    bundleEligible: false,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=400',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=400',
  });

  console.log('--- Seeding 2 Curated Bundles ---');
  await Bundle.create({
    id: 'demo-fixed-combo',
    slug: 'demo-fixed-combo',
    titleBn: 'ডেমো ফিক্সড কম্বো',
    titleEn: 'DEMO Fixed Combo',
    descriptionBn: 'ডেমো ফিক্সড প্রাইস কম্বো প্যাকেজ',
    descriptionEn: 'Demo Fixed Price Combo Package',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
    galleryImages: [],
    pricingMode: 'fixed',
    pricingValue: 1000,
    bundlePrice: 1000,
    originalPrice: 1200,
    discountPercent: 16.67,
    savingsAmount: 200,
    totalCost: 600,
    profitMargin: 400,
    profitMarginPercent: 40,
    status: 'active',
    suitableAge: '3-8 years',
    occasion: 'General',
    badge: 'Popular',
    displayLocations: ['home', 'bundles', 'product-pages'],
    hideWhenOutOfStock: false,
    isFeatured: true,
    showOnHome: true,
    showOnProductPage: true,
    sortOrder: 1,
    items: [
      {
        productId: p1._id.toString(),
        productTitleBn: p1.titleBn,
        productTitleEn: p1.titleEn,
        quantity: 1,
        unitPrice: 500,
        costPrice: 250,
        stock: p1.stock,
        imageUrl: p1.image,
      },
      {
        productId: p2._id.toString(),
        productTitleBn: p2.titleBn,
        productTitleEn: p2.titleEn,
        quantity: 1,
        unitPrice: 700,
        costPrice: 350,
        stock: p2.stock,
        imageUrl: p2.image,
      },
    ],
  });

  await Bundle.create({
    id: 'demo-percent-combo',
    slug: 'demo-percent-combo',
    titleBn: 'ডেমো পার্সেন্ট কম্বো',
    titleEn: 'DEMO Percent Combo',
    descriptionBn: 'ডেমো ১৫% ডিসকাউন্ট কম্বো',
    descriptionEn: 'Demo 15% Off Combo',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=400',
    galleryImages: [],
    pricingMode: 'percent',
    pricingValue: 15,
    bundlePrice: 935,
    originalPrice: 1100,
    discountPercent: 15,
    savingsAmount: 165,
    totalCost: 550,
    profitMargin: 385,
    profitMarginPercent: 41,
    status: 'active',
    suitableAge: '3-8 years',
    occasion: 'General',
    badge: 'Save 15%',
    displayLocations: ['home', 'bundles', 'product-pages'],
    hideWhenOutOfStock: false,
    isFeatured: true,
    showOnHome: true,
    showOnProductPage: true,
    sortOrder: 2,
    items: [
      {
        productId: p1._id.toString(),
        productTitleBn: p1.titleBn,
        productTitleEn: p1.titleEn,
        quantity: 1,
        unitPrice: 500,
        costPrice: 250,
        stock: p1.stock,
        imageUrl: p1.image,
      },
      {
        productId: p3._id.toString(),
        productTitleBn: p3.titleBn,
        productTitleEn: p3.titleEn,
        quantity: 1,
        unitPrice: 600,
        costPrice: 300,
        stock: p3.stock,
        imageUrl: p3.image,
      },
    ],
  });

  console.log('--- Seeding 2 Gift Categories ---');
  const cat1 = await GiftCategory.create({
    name: 'DEMO Gift Packaging & Boxes',
    sortOrder: 1,
    isActive: true,
  });

  const cat2 = await GiftCategory.create({
    name: 'DEMO Gift Accessories & Ribbons',
    sortOrder: 2,
    isActive: true,
  });

  console.log('--- Seeding 8 Gift Items ---');
  // 1: Compulsory in stock
  await GiftItem.create({
    name: 'DEMO Pine Wood Gift Box',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
    price: 150,
    stock: 25,
    categoryId: cat1._id.toString(),
    categoryName: cat1.name,
    isCompulsory: true,
    showInSuggestions: true,
    suggestionMessage: 'Essential pine wood box to assemble your gift nicely',
    isActive: true,
    sortOrder: 1,
  });

  // 2: Compulsory out of stock
  await GiftItem.create({
    name: 'DEMO Luxury Velvet Box (OOS)',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
    price: 200,
    stock: 0,
    categoryId: cat1._id.toString(),
    categoryName: cat1.name,
    isCompulsory: true,
    showInSuggestions: false,
    suggestionMessage: 'Luxury velvet box (currently out of stock)',
    isActive: true,
    sortOrder: 2,
  });

  // 3: Suggestion only
  await GiftItem.create({
    name: 'DEMO Satin Ribbon',
    image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=400',
    price: 40,
    stock: 30,
    categoryId: cat2._id.toString(),
    categoryName: cat2.name,
    isCompulsory: false,
    showInSuggestions: true,
    suggestionMessage: 'Add this elegant satin ribbon for the perfect touch',
    isActive: true,
    sortOrder: 3,
  });

  // 4: OOS normal item
  await GiftItem.create({
    name: 'DEMO Silk Bow (OOS)',
    image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=400',
    price: 80,
    stock: 0,
    categoryId: cat2._id.toString(),
    categoryName: cat2.name,
    isCompulsory: false,
    showInSuggestions: false,
    suggestionMessage: '',
    isActive: true,
    sortOrder: 4,
  });

  // 5: Regular item
  await GiftItem.create({
    name: 'DEMO Mini Greeting Card',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
    price: 30,
    stock: 50,
    categoryId: cat2._id.toString(),
    categoryName: cat2.name,
    isCompulsory: false,
    showInSuggestions: true,
    suggestionMessage: 'Personalized greeting card',
    isActive: true,
    sortOrder: 5,
  });

  // 6: Regular item
  await GiftItem.create({
    name: 'DEMO Crinkle Paper Filler',
    image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=400',
    price: 50,
    stock: 40,
    categoryId: cat1._id.toString(),
    categoryName: cat1.name,
    isCompulsory: false,
    showInSuggestions: false,
    suggestionMessage: '',
    isActive: true,
    sortOrder: 6,
  });

  // 7: Regular item
  await GiftItem.create({
    name: 'DEMO Small Soft Toy',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
    price: 180,
    stock: 20,
    categoryId: cat2._id.toString(),
    categoryName: cat2.name,
    isCompulsory: false,
    showInSuggestions: false,
    suggestionMessage: '',
    isActive: true,
    sortOrder: 7,
  });

  // 8: Regular item
  await GiftItem.create({
    name: 'DEMO Decorative Sticker Pack',
    image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=400',
    price: 25,
    stock: 60,
    categoryId: cat2._id.toString(),
    categoryName: cat2.name,
    isCompulsory: false,
    showInSuggestions: false,
    suggestionMessage: '',
    isActive: true,
    sortOrder: 8,
  });

  console.log('✅ DEMO Data seeded successfully!');
}

if (process.argv[1]?.endsWith('seed-demo-data.ts')) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error seeding demo data:', err);
      process.exit(1);
    });
}

