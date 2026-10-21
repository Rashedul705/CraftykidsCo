/**
 * Bundles Store & Business Logic
 * Centralized store for bundle packages, constituent inventory tracking,
 * automated "Sets available now" calculation, and margin analytics.
 */

export interface BundleItem {
  productId: string;
  productTitleBn: string;
  productTitleEn: string;
  variationSku?: string;
  variationTitle?: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  stock: number;
  imageUrl: string;
}

export interface BundleRecord {
  id: string;
  slug: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  imageUrl: string;
  galleryImages: string[];
  items: BundleItem[];
  pricingMode: 'fixed' | 'percent' | 'amount';
  pricingValue: number;
  bundlePrice: number;
  originalPrice: number;
  discountPercent: number;
  savingsAmount: number;
  totalCost: number;
  profitMargin: number;
  profitMarginPercent: number;
  status: 'active' | 'draft' | 'scheduled';
  startDate?: string;
  endDate?: string;
  suitableAge: string;
  occasion: string;
  badge: string;
  displayLocations: ('bundles' | 'home' | 'product-pages')[];
  hideWhenOutOfStock: boolean;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export function calculateBundleStock(items: BundleItem[]): {
  setsAvailable: number;
  limitingItem: BundleItem | null;
} {
  if (!items || items.length === 0) {
    return { setsAvailable: 0, limitingItem: null };
  }

  let minSets = Infinity;
  let limiting: BundleItem | null = null;

  for (const item of items) {
    const qty = Math.max(1, item.quantity || 1);
    const availableSets = Math.floor((item.stock || 0) / qty);
    if (availableSets < minSets) {
      minSets = availableSets;
      limiting = item;
    }
  }

  return {
    setsAvailable: minSets === Infinity ? 0 : Math.max(0, minSets),
    limitingItem: limiting,
  };
}

export function computeBundleFinancials(
  items: BundleItem[],
  mode: 'fixed' | 'percent' | 'amount',
  value: number
) {
  const originalPrice = items.reduce(
    (sum, i) => sum + (i.unitPrice || 0) * (i.quantity || 1),
    0
  );
  const totalCost = items.reduce(
    (sum, i) => sum + (i.costPrice || 0) * (i.quantity || 1),
    0
  );

  let bundlePrice = originalPrice;
  if (mode === 'fixed') {
    bundlePrice = Math.max(0, Math.round(value));
  } else if (mode === 'percent') {
    const discount = (originalPrice * Math.min(100, Math.max(0, value))) / 100;
    bundlePrice = Math.max(0, Math.round(originalPrice - discount));
  } else if (mode === 'amount') {
    bundlePrice = Math.max(0, Math.round(originalPrice - value));
  }

  const savingsAmount = Math.max(0, originalPrice - bundlePrice);
  const discountPercent =
    originalPrice > 0 ? Math.round((savingsAmount / originalPrice) * 100) : 0;
  const profitMargin = bundlePrice - totalCost;
  const profitMarginPercent =
    bundlePrice > 0 ? Math.round((profitMargin / bundlePrice) * 100) : 0;

  return {
    originalPrice,
    totalCost,
    bundlePrice,
    savingsAmount,
    discountPercent,
    profitMargin,
    profitMarginPercent,
  };
}

// Initial rich sample bundles
export let globalBundles: BundleRecord[] = [
  {
    id: 'bundle-little-artist-mega',
    slug: 'little-artist-mega-gift-bundle',
    titleBn: 'ছোট আর্টিস্ট মেগা গিফট কম্বো (মোম + প্লে-ডো + আর্ট সেট)',
    titleEn: 'Little Artist Mega Gift Bundle',
    descriptionBn:
      'একটি প্রিমিয়াম গিফট বক্সে পাচ্ছেন: ২৪ কালার ১০০% ন্যাচারাল নিরাপদ মোমের রঙ, ৫ রঙের নন-টক্সিক প্লে-ডো এবং ফান কাটার শেপ সেট। জন্মদিনের সেরা উপহার!',
    descriptionEn:
      'All-in-one child-safe gift bundle including 24 natural wax crayons, sensory play-dough set, and creative modeling cutters in a deluxe gift box.',
    imageUrl:
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=800&q=80',
    ],
    items: [
      {
        productId: 'prod-crayons-24',
        productTitleBn: 'ন্যাচারাল মোমের রঙ (২৪ শেড ক্লাসিক বক্স)',
        productTitleEn: 'Natural Wax Crayons 24 Shades',
        variationSku: 'CRAYON-24',
        variationTitle: '24 Colors Classic Box',
        quantity: 1,
        unitPrice: 299,
        costPrice: 140,
        stock: 45,
        imageUrl:
          'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
      },
      {
        productId: 'prod-dough-sensory',
        productTitleBn: 'ন্যাচারাল প্লে-ডো এবং সেন্সরি কাটার শেপ সেট',
        productTitleEn: 'Natural Play-Dough & Sensory Cutters',
        quantity: 1,
        unitPrice: 590,
        costPrice: 240,
        stock: 25,
        imageUrl:
          'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
      },
    ],
    pricingMode: 'fixed',
    pricingValue: 699,
    bundlePrice: 699,
    originalPrice: 889,
    discountPercent: 21,
    savingsAmount: 190,
    totalCost: 380,
    profitMargin: 319,
    profitMarginPercent: 46,
    status: 'active',
    suitableAge: '২-৭ বছর',
    occasion: 'birthday',
    badge: '২১% সাশ্রয়',
    displayLocations: ['bundles', 'home', 'product-pages'],
    hideWhenOutOfStock: true,
    isFeatured: true,
    createdAt: '2026-10-15T10:00:00Z',
    updatedAt: '2026-10-21T12:00:00Z',
  },
  {
    id: 'bundle-toddler-starter-art',
    slug: 'toddler-starter-art-combo',
    titleBn: 'টডলার স্টার্টার আর্ট ও সেন্সরি কম্বো (মোটা মোম + উডেন পাজল)',
    titleEn: 'Toddler Starter Art & Sensory Combo',
    descriptionBn:
      '১ থেকে ৪ বছর বয়সী শিশুদের গ্রিপ ডেভেলপমেন্ট ও প্রথম আঁকাআঁকির জন্য সহজে ভাঙবে না এমন ১২ রঙের মোটা ট্রায়াঙ্গুলার মোম এবং হ্যান্ড-আই কোঅর্ডিনেশনের কাঠের বর্ণমালা পাজল।',
    descriptionEn:
      'Designed for toddlers aged 1-4. Features chunky triangular natural wax crayons and a smooth wooden alphabet puzzle board.',
    imageUrl:
      'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
    ],
    items: [
      {
        productId: 'prod-triangular-12',
        productTitleBn: 'টডলার ট্রায়াঙ্গুলার গ্রিপ মোম ১২ রঙ',
        productTitleEn: 'Toddler Triangular Grip Crayons 12',
        quantity: 1,
        unitPrice: 220,
        costPrice: 95,
        stock: 30,
        imageUrl:
          'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
      },
      {
        productId: 'prod-wooden-puzzle',
        productTitleBn: 'ম্যাগনেটিক কাঠের বর্ণমালা ও নম্বর পাজল বোর্ড',
        productTitleEn: 'Magnetic Wooden Alphabet Puzzle Board',
        quantity: 1,
        unitPrice: 550,
        costPrice: 210,
        stock: 14,
        imageUrl:
          'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
      },
    ],
    pricingMode: 'fixed',
    pricingValue: 590,
    bundlePrice: 590,
    originalPrice: 770,
    discountPercent: 23,
    savingsAmount: 180,
    totalCost: 305,
    profitMargin: 285,
    profitMarginPercent: 48,
    status: 'active',
    suitableAge: '১-৪ বছর',
    occasion: 'everyday',
    badge: 'টপ রেটেড',
    displayLocations: ['bundles', 'home', 'product-pages'],
    hideWhenOutOfStock: true,
    isFeatured: false,
    createdAt: '2026-10-16T11:00:00Z',
    updatedAt: '2026-10-21T12:00:00Z',
  },
  {
    id: 'bundle-plaster-art-double',
    slug: 'plaster-art-double-delight-combo',
    titleBn: 'প্লাস্টার আর্ট ডাবল ডিলাইট গিফট বান্ডেল (২টি সম্পূর্ণ কিট)',
    titleEn: 'Plaster Art Double Delight Gift Bundle (2 Kits)',
    descriptionBn:
      'সুইট ফ্রুট পেইন্টিং কিট এবং কার পেইন্টিং কিট—দুটি সম্পূর্ণ প্লাস্টার অফ প্যারিস সেট একসাথে। ভাই-বোন বা বন্ধুদের সৃজনশীল রঙিন বিকেলে মেতে ওঠার পারফেক্ট কম্বো।',
    descriptionEn:
      'Double the plaster painting fun! Includes Sweet Fruit Painting Kit and Car Painting 12-Piece Set with vibrant child-safe paints and brushes.',
    imageUrl: 'https://i.ibb.co/CsS18B4H/craftykidsco-mixed-kit-1.jpg',
    galleryImages: [
      'https://i.ibb.co/CsS18B4H/craftykidsco-mixed-kit-1.jpg',
      'https://i.ibb.co/HDV4JVJz/craftykidsco-sweet-fruit.jpg',
      'https://i.ibb.co/6R2NqF8T/craftykidsco-car-kit.jpg',
    ],
    items: [
      {
        productId: 'prod-sweet-fruit',
        productTitleBn: 'সুইট ফ্রুট প্লাস্টার অফ প্যারিস পেইন্টিং কিট',
        productTitleEn: 'Sweet Fruit Plaster Painting Kit',
        quantity: 1,
        unitPrice: 850,
        costPrice: 350,
        stock: 18,
        imageUrl: 'https://i.ibb.co/HDV4JVJz/craftykidsco-sweet-fruit.jpg',
      },
      {
        productId: 'prod-car-paint',
        productTitleBn: 'কার পেইন্টিং কিট - ১২ পিস প্লাস্টার আর্ট সেট',
        productTitleEn: 'Car Painting Kit - 12 Piece Set',
        quantity: 1,
        unitPrice: 950,
        costPrice: 400,
        stock: 8,
        imageUrl: 'https://i.ibb.co/6R2NqF8T/craftykidsco-car-kit.jpg',
      },
    ],
    pricingMode: 'percent',
    pricingValue: 25,
    bundlePrice: 1350,
    originalPrice: 1800,
    discountPercent: 25,
    savingsAmount: 450,
    totalCost: 750,
    profitMargin: 600,
    profitMarginPercent: 44,
    status: 'active',
    suitableAge: '৩-১০ বছর',
    occasion: 'birthday',
    badge: '২৫% সাশ্রয়',
    displayLocations: ['bundles', 'home', 'product-pages'],
    hideWhenOutOfStock: true,
    isFeatured: false,
    createdAt: '2026-10-18T14:00:00Z',
    updatedAt: '2026-10-21T12:00:00Z',
  },
  {
    id: 'bundle-montessori-stem-scale',
    slug: 'montessori-little-math-genius-bundle',
    titleBn: 'মন্টেসরি লিটল ম্যাথ জিনিয়াস বান্ডেল (ব্যালেন্স স্কেল + গিয়ার্স)',
    titleEn: 'Montessori Little Math Genius Bundle',
    descriptionBn:
      'STEM ও কগনিটিভ দক্ষতার জন্য বানর ম্যাথ ব্যালেন্স স্কেল গেম এবং স্পিনিং মেকানিক্স উডেন বোর্ড। খেলার ছলে যোগ-বিয়োগ ও লজিক্যাল চিন্তাভাবনার বিকাশ।',
    descriptionEn:
      'STEM foundation bundle featuring monkey balance counting game and wooden spinning activity gears board.',
    imageUrl:
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
    ],
    items: [
      {
        productId: 'prod-edu-math-balance',
        productTitleBn: 'মন্টেসরি বানর ম্যাথ ব্যালেন্স কাউন্টিং স্কেল গেম',
        productTitleEn: 'Montessori Monkey Math Balance Counting Game',
        quantity: 1,
        unitPrice: 750,
        costPrice: 280,
        stock: 15,
        imageUrl:
          'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
      },
      {
        productId: 'prod-edu-wooden-gears',
        productTitleBn: 'কগনিটিভ স্পিনিং গিয়ার্স ও মেকানিক্স উডেন বোর্ড',
        productTitleEn: 'Cognitive Spinning Gears Wooden Board',
        quantity: 1,
        unitPrice: 680,
        costPrice: 260,
        stock: 12,
        imageUrl:
          'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
      },
    ],
    pricingMode: 'fixed',
    pricingValue: 1090,
    bundlePrice: 1090,
    originalPrice: 1430,
    discountPercent: 24,
    savingsAmount: 340,
    totalCost: 540,
    profitMargin: 550,
    profitMarginPercent: 50,
    status: 'active',
    suitableAge: '৩-৮ বছর',
    occasion: 'school',
    badge: '২৪% সাশ্রয়',
    displayLocations: ['bundles', 'home', 'product-pages'],
    hideWhenOutOfStock: true,
    isFeatured: false,
    createdAt: '2026-10-19T09:00:00Z',
    updatedAt: '2026-10-21T12:00:00Z',
  },
];

export function getAllBundles(): BundleRecord[] {
  return [...globalBundles];
}

export function getBundleById(id: string): BundleRecord | undefined {
  return globalBundles.find((b) => b.id === id);
}

export function getBundleBySlug(slug: string): BundleRecord | undefined {
  return globalBundles.find((b) => b.slug === slug);
}

export function createBundle(
  data: Omit<BundleRecord, 'id' | 'createdAt' | 'updatedAt'>
): BundleRecord {
  const newBundle: BundleRecord = {
    ...data,
    id: `bundle-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  globalBundles.unshift(newBundle);
  return newBundle;
}

export function updateBundle(
  id: string,
  data: Partial<BundleRecord>
): BundleRecord | null {
  const index = globalBundles.findIndex((b) => b.id === id);
  if (index === -1) return null;

  globalBundles[index] = {
    ...globalBundles[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  return globalBundles[index];
}

export function deleteBundle(id: string): boolean {
  const initialLen = globalBundles.length;
  globalBundles = globalBundles.filter((b) => b.id !== id);
  return globalBundles.length < initialLen;
}

export function toggleBundleActive(id: string): BundleRecord | null {
  const bundle = globalBundles.find((b) => b.id === id);
  if (!bundle) return null;
  bundle.status = bundle.status === 'active' ? 'draft' : 'active';
  bundle.updatedAt = new Date().toISOString();
  return bundle;
}
