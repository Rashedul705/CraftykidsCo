import { SampleProduct, SampleCategory, sampleCategories, sampleProducts } from './sample-data';
export type { SampleProduct, SampleCategory };
import { SiteSettings, defaultSiteSettings } from './site-settings';

export interface CartItemData {
  id: string; // unique item id in cart (productId + variationSku)
  productId: string;
  productSlug: string;
  title: string;
  titleBn: string;
  imageUrl: string;
  price: number;
  quantity: number;
  variationSku?: string;
  variationTitle?: string;
  variationTitleBn?: string;
  isBundle?: boolean;
  bundleItemsSummary?: string;
  giftWrap?: boolean;
  giftMessage?: string;
}

export interface OrderItemRecord {
  id: string;
  productId: string;
  title: string;
  variationTitle?: string;
  variationTitleBn?: string;
  variationSku?: string;
  price: number;
  quantity: number;
  total: number;
  imageUrl?: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  district: string;
  thana?: string;
  fullAddress: string;
  customerNote?: string;
  subtotal: number;
  deliveryCharge: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  paymentStatus: 'UNPAID' | 'PAID';
  paymentMethod: 'COD' | 'BKASH' | 'NAGAD';
  courier?: 'STEADFAST';
  consignmentId?: string;
  trackingCode?: string;
  timeline: { status: string; timestamp: string; note: string }[];
  items: OrderItemRecord[];
  createdAt: string;
  source?: 'website' | 'facebook' | 'phone' | 'manual';
  internalNote?: string;
}

// In-memory persistent state (shared across client sessions and API routes in server environment)
export let globalOrders: OrderRecord[] = [
  {
    id: 'ord-ckc-3751',
    orderNumber: 'CKC-20261019-3751',
    customerName: 'রাশেদুল ইসলাম',
    customerPhone: '01712345678',
    district: 'Dhaka',
    fullAddress: 'মিরপুর ১০, ঢাকা',
    customerNote: 'সন্ধ্যার পর ডেলিভারি দিন',
    subtotal: 999,
    deliveryCharge: 60,
    discountAmount: 0,
    totalAmount: 1059,
    status: 'CONFIRMED',
    paymentStatus: 'UNPAID',
    paymentMethod: 'COD',
    source: 'website',
    internalNote: 'Customer confirmed via WhatsApp call.',
    timeline: [
      { status: 'PENDING', timestamp: '10:42 AM', note: 'Placed 12 min ago from website' },
      { status: 'CONFIRMED', timestamp: '10:51 AM', note: 'Confirmed by [staff name], 10:51 AM' },
    ],
    items: [
      {
        id: 'item-3751-1',
        productId: 'prod-little-bug',
        title: 'Little Bug Adventure',
        price: 999,
        quantity: 1,
        total: 999,
        imageUrl: 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg',
      },
    ],
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-ckc-3750',
    orderNumber: 'CKC-20261019-3750',
    customerName: 'Farhana Jaman',
    customerPhone: '01811223344',
    district: 'Rajshahi',
    fullAddress: 'বোয়ালিয়া, রাজশাহী',
    subtotal: 899,
    deliveryCharge: 120,
    discountAmount: 120,
    totalAmount: 899,
    status: 'PENDING',
    paymentStatus: 'PAID',
    paymentMethod: 'BKASH',
    source: 'website',
    timeline: [
      { status: 'PENDING', timestamp: '09:30 AM', note: 'Order placed with bKash pre-payment' },
    ],
    items: [
      {
        id: 'item-3750-1',
        productId: 'prod-crayons-24',
        title: 'Natural Crayons 24 colors',
        price: 599,
        quantity: 1,
        total: 599,
        imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'item-3750-2',
        productId: 'prod-play-dough',
        title: 'Organic Modeling Dough',
        price: 300,
        quantity: 1,
        total: 300,
        imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
      },
    ],
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-ckc-3749',
    orderNumber: 'CKC-20261018-3749',
    customerName: 'Rakib Ahmed',
    customerPhone: '01919876543',
    district: 'Chattogram',
    fullAddress: 'পাহাড়তলী, চট্টগ্রাম',
    subtotal: 360,
    deliveryCharge: 120,
    discountAmount: 0,
    totalAmount: 480,
    status: 'SHIPPED',
    paymentStatus: 'UNPAID',
    paymentMethod: 'COD',
    courier: 'STEADFAST',
    consignmentId: 'STF-849201',
    trackingCode: 'TRK-771239',
    source: 'facebook',
    timeline: [
      { status: 'PENDING', timestamp: 'Yesterday 02:00 PM', note: 'Order placed via Facebook Messenger' },
      { status: 'CONFIRMED', timestamp: 'Yesterday 03:00 PM', note: 'Confirmed with customer' },
      { status: 'SHIPPED', timestamp: 'Yesterday 06:00 PM', note: 'Steadfast dispatched' },
    ],
    items: [
      {
        id: 'item-3749-1',
        productId: 'prod-wooden-puzzle',
        title: 'Wooden Puzzle Board',
        price: 360,
        quantity: 1,
        total: 360,
        imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80',
      },
    ],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-ckc-3748',
    orderNumber: 'CKC-20261018-3748',
    customerName: 'Nusrat Jahan',
    customerPhone: '01655443322',
    district: 'Sylhet',
    fullAddress: 'জিন্দাবাজার, সিলেট',
    subtotal: 2150,
    deliveryCharge: 120,
    discountAmount: 120,
    totalAmount: 2150,
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    paymentMethod: 'COD',
    courier: 'STEADFAST',
    consignmentId: 'STF-849202',
    trackingCode: 'TRK-771240',
    source: 'website',
    timeline: [
      { status: 'DELIVERED', timestamp: 'Yesterday 04:30 PM', note: 'Steadfast delivered & cash collected' },
    ],
    items: [
      {
        id: 'item-3748-1',
        productId: 'prod-art-combo',
        title: 'Little Artist Combo',
        price: 1450,
        quantity: 1,
        total: 1450,
        imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'item-3748-2',
        productId: 'prod-crayons-12',
        title: 'Classic Beeswax Crayons',
        price: 350,
        quantity: 2,
        total: 700,
        imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
      },
    ],
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-rk-1001',
    orderNumber: 'RK-1001',
    customerName: 'তানজিলা হক',
    customerPhone: '01711223344',
    district: 'Dhaka',
    fullAddress: 'বাড়ি #১২, রোড #৪, ধানমন্ডি, ঢাকা',
    customerNote: 'অফিস টাইমের পর ডেলিভারি দিন প্লিজ',
    subtotal: 598,
    deliveryCharge: 60,
    discountAmount: 60,
    totalAmount: 598,
    couponCode: 'FREE60',
    status: 'CONFIRMED',
    paymentStatus: 'UNPAID',
    paymentMethod: 'COD',
    source: 'website',
    timeline: [
      { status: 'PENDING', timestamp: '২০২৬-১০-১২ ১০:৩০ AM', note: 'অর্ডার প্লেস করা হয়েছে' },
      { status: 'CONFIRMED', timestamp: '২০২৬-১০-১২ ১১:১৫ AM', note: 'অর্ডার ভেরিফাই করা হয়েছে' },
    ],
    items: [
      {
        id: 'item-1',
        productId: 'prod-crayons-24',
        title: 'CraftyKidsCo ন্যাচারাল মোমের রঙ - ২৪ শেড',
        price: 299,
        quantity: 2,
        total: 598,
        imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80',
      },
    ],
    createdAt: '2026-10-12T04:30:00.000Z',
  },
];

export let globalProducts: SampleProduct[] = [...sampleProducts];

// Add extra rich products for Phase 1 catalog
if (globalProducts.length <= 4) {
  globalProducts.push(
    {
      id: 'prod-jumbo-washable',
      titleBn: 'জ্যাম্বো ওয়াশেবল মোমের রঙ (১২ প্যাক)',
      titleEn: 'Jumbo Washable Beeswax Crayons (12 Pack)',
      slug: 'jumbo-washable-beeswax-crayons-12',
      basePrice: 280,
      baseSalePrice: 240,
      isVariable: false,
      isBestSeller: true,
      targetAgeMin: 1,
      targetAgeMax: 5,
      imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'prod-wooden-blocks-50',
      titleBn: 'রঙিন কাঠের সেন্সরি বিল্ডিং ব্লকস (৫০ পিস)',
      titleEn: 'Sensory Wooden Building Blocks Set (50 Pcs)',
      slug: 'sensory-wooden-building-blocks-50',
      basePrice: 580,
      baseSalePrice: 499,
      isVariable: false,
      isBestSeller: false,
      targetAgeMin: 2,
      targetAgeMax: 8,
      imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
    }
  );
}

export let globalCategories: SampleCategory[] = [...sampleCategories];

export function getAllCategories(): SampleCategory[] {
  return globalCategories;
}

export function addCategory(cat: SampleCategory): SampleCategory {
  globalCategories.push(cat);
  return cat;
}

export function updateCategory(slugOrId: string, updates: Partial<SampleCategory>): SampleCategory | null {
  const index = globalCategories.findIndex(
    (c) => c.slug === slugOrId || (c as any).id === slugOrId || (c as any)._id === slugOrId
  );
  if (index === -1) return null;
  globalCategories[index] = {
    ...globalCategories[index],
    ...updates,
  };
  return globalCategories[index];
}

export function deleteCategory(slugOrId: string): boolean {
  const initialLen = globalCategories.length;
  globalCategories = globalCategories.filter(
    (c) => c.slug !== slugOrId && (c as any).id !== slugOrId && (c as any)._id !== slugOrId
  );
  return globalCategories.length < initialLen;
}

// ---------------------------------------------------------------------------
// ATTRIBUTES & VARIATIONS TAXONOMY STORE
// ---------------------------------------------------------------------------

export interface AttributeOption {
  labelBn: string;
  labelEn: string;
  value: string;
}

export interface AttributeItem {
  id: string;
  code: string;
  nameBn: string;
  nameEn: string;
  type?: string;
  categories: string[]; // ['ALL'] or specific category slugs
  options: AttributeOption[];
  displayOrder?: number;
  isActive?: boolean;
}

export const defaultAttributes: AttributeItem[] = [
  {
    id: 'attr-age-group',
    code: 'ageGroup',
    nameBn: 'বয়স সীমা',
    nameEn: 'Age Group',
    type: 'select',
    categories: ['ALL'],
    options: [
      { labelBn: '২-৪ বছর (টডলার)', labelEn: '2-4 Years (Toddler)', value: '2-4' },
      { labelBn: '৪-৬ বছর (প্রি-স্কুল)', labelEn: '4-6 Years (Pre-School)', value: '4-6' },
      { labelBn: '৬-৮ বছর (স্কুল গোয়ার)', labelEn: '6-8 Years (School)', value: '6-8' },
      { labelBn: '৮+ বছর (ক্রিয়েটিভ জুনিয়র)', labelEn: '8+ Years (Creative Junior)', value: '8+' },
    ],
  },
  {
    id: 'attr-theme',
    code: 'theme',
    nameBn: 'থিম ও চরিত্র',
    nameEn: 'Theme & Character',
    type: 'select',
    categories: ['art-kits', 'puzzles', 'wax-crayons'],
    options: [
      { labelBn: 'ছোট পোকা অ্যাডভেঞ্চার', labelEn: 'Little Bug Adventure', value: 'bugs' },
      { labelBn: 'মিষ্টি ফলমূল ও খাবার', labelEn: 'Sweet Fruits & Treats', value: 'fruits' },
      { labelBn: 'গাড়ি ও যানবাহন', labelEn: 'Vehicles & Transport', value: 'vehicles' },
      { labelBn: 'টুলস ও মেকানিক আর্ট', labelEn: 'Builder & Tools', value: 'tools' },
      { labelBn: 'সানি শোরস বিচ', labelEn: 'Sunny Shores', value: 'beach' },
      { labelBn: 'সাগরের জীবজগৎ', labelEn: 'Ocean World', value: 'ocean' },
    ],
  },
  {
    id: 'attr-pack-size',
    code: 'packSize',
    nameBn: 'প্যাকের আকার ও সংখ্যা',
    nameEn: 'Pack Size & Pieces',
    type: 'select',
    categories: ['wax-crayons', 'play-dough-clay', 'art-kits'],
    options: [
      { labelBn: 'সিঙ্গেল প্যাক (১ টি)', labelEn: 'Single Pack (1 Pc)', value: '1-pc' },
      { labelBn: 'স্টার্টার সেট (৬ টি)', labelEn: 'Starter Set (6 Pcs)', value: '6-pcs' },
      { labelBn: 'ডিলাক্স প্যাক (১২ টি)', labelEn: 'Deluxe Pack (12 Pcs)', value: '12-pcs' },
      { labelBn: 'মেগা ক্রাফট বান্ডেল (২৪ টি)', labelEn: 'Mega Bundle (24 Pcs)', value: '24-pcs' },
    ],
  },
  {
    id: 'attr-material',
    code: 'material',
    nameBn: 'নিরাপত্তা ও উপাদান',
    nameEn: 'Material & Safety Grade',
    type: 'select',
    categories: ['ALL'],
    options: [
      { labelBn: '১০০% ফুড-গ্রেড প্রাকৃতিক মোম', labelEn: '100% Food-Grade Beeswax', value: 'beeswax' },
      { labelBn: 'ইকো-ফ্রেন্ডলি ন্যাচারাল প্লাস্টার', labelEn: 'Child-Safe Natural Plaster', value: 'plaster' },
      { labelBn: 'অর্গানিক ফুড ডো (লবণ ও আটা)', labelEn: 'Organic Food-Grade Dough', value: 'organic-dough' },
      { labelBn: 'মসৃণ কেমিক্যালমুক্ত পাইন উড', labelEn: 'Smooth Chemical-Free Wood', value: 'wood' },
    ],
  },
];

export let globalAttributes: AttributeItem[] = [...defaultAttributes];

export function getAllAttributes(): AttributeItem[] {
  return globalAttributes;
}

export function addAttribute(attr: AttributeItem): AttributeItem {
  globalAttributes.push(attr);
  return attr;
}

export function updateAttribute(codeOrId: string, updates: Partial<AttributeItem>): AttributeItem | null {
  const index = globalAttributes.findIndex(
    (a) => a.code === codeOrId || a.id === codeOrId
  );
  if (index === -1) return null;
  globalAttributes[index] = {
    ...globalAttributes[index],
    ...updates,
  };
  return globalAttributes[index];
}

export function deleteAttribute(codeOrId: string): boolean {
  const initialLen = globalAttributes.length;
  globalAttributes = globalAttributes.filter(
    (a) => a.code !== codeOrId && a.id !== codeOrId
  );
  return globalAttributes.length < initialLen;
}

export function getAllProducts(): SampleProduct[] {
  return globalProducts;
}

export function addProduct(prod: SampleProduct): SampleProduct {
  globalProducts.unshift(prod);
  return prod;
}

export function updateProduct(
  id: string,
  updates: Partial<SampleProduct>,
  variationSku?: string
): SampleProduct | null {
  const index = globalProducts.findIndex((p) => p.id === id || p.slug === id);
  if (index === -1) return null;

  if (variationSku && updates.stock !== undefined && globalProducts[index].variations) {
    const finalStock = Math.max(0, updates.stock);
    globalProducts[index].variations = globalProducts[index].variations!.map((v) => {
      if (
        v.sku === variationSku ||
        v.id === variationSku ||
        v.titleEn === variationSku ||
        v.titleBn === variationSku
      ) {
        return {
          ...v,
          stock: finalStock,
          stockQuantity: finalStock,
        };
      }
      return v;
    });
    const totalStock = globalProducts[index].variations!.reduce(
      (sum, v) => sum + (v.stock ?? (v as any).stockQuantity ?? 0),
      0
    );
    globalProducts[index].stock = totalStock;
    return globalProducts[index];
  }

  globalProducts[index] = { ...globalProducts[index], ...updates };
  return globalProducts[index];
}

export function deleteProduct(id: string): boolean {
  const index = globalProducts.findIndex((p) => p.id === id || p.slug === id);
  if (index === -1) return false;
  globalProducts.splice(index, 1);
  return true;
}

export function getProductBySlug(slug: string): SampleProduct | undefined {
  return globalProducts.find((p) => p.slug === slug);
}

export function getProductsByCategory(categorySlug: string): SampleProduct[] {
  const direct = globalProducts.filter((p) => p.categorySlug === categorySlug);
  if (direct.length > 0) return direct;

  if (categorySlug === 'art-kits') {
    return globalProducts.filter((p) => p.categorySlug === 'art-kits' || p.slug.includes('paint') || p.slug.includes('kit'));
  }
  if (categorySlug === 'wax-crayons') {
    return globalProducts.filter((p) => p.slug.includes('crayon') || p.slug.includes('washable') || p.categorySlug === 'wax-crayons');
  }
  if (categorySlug === 'educational-toys') {
    return globalProducts.filter((p) => p.categorySlug === 'educational-toys' || p.slug.includes('edu') || p.slug.includes('blocks'));
  }
  if (categorySlug === 'play-dough-clay') {
    return globalProducts.filter((p) => p.slug.includes('dough') || p.slug.includes('clay') || p.categorySlug === 'play-dough-clay');
  }
  return globalProducts;
}

export function getAllOrders(): OrderRecord[] {
  return globalOrders;
}

export function getOrderByIdOrNumber(query: string): OrderRecord | undefined {
  const q = query.trim().toUpperCase();
  return globalOrders.find(
    (o) => o.id.toUpperCase() === q || o.orderNumber.toUpperCase() === q
  );
}

export function getOrdersByPhone(phone: string): OrderRecord[] {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  return globalOrders.filter((o) => o.customerPhone.replace(/[^\d]/g, '').includes(cleanPhone));
}

export function createOrder(data: Omit<OrderRecord, 'id' | 'orderNumber' | 'createdAt' | 'timeline'>): OrderRecord {
  const nextOrderNumber = `RK-${Math.floor(1000 + globalOrders.length + 1)}`;
  const newOrder: OrderRecord = {
    ...data,
    id: `ord-${nextOrderNumber.toLowerCase()}`,
    orderNumber: nextOrderNumber,
    createdAt: new Date().toISOString(),
    timeline: [
      {
        status: 'PENDING',
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        note: 'নতুন অর্ডার প্লেস করা হয়েছে',
      },
    ],
  };

  // Deduct variation stock if variations present
  for (const item of newOrder.items) {
    const product = globalProducts.find((p) => p.id === item.productId || p.slug === item.productId);
    if (product && product.variations && item.variationTitle) {
      const variation = product.variations.find(
        (v) => v.titleBn === item.variationTitle || v.titleEn === item.variationTitle
      );
      if (variation) {
        variation.stock = Math.max(0, variation.stock - item.quantity);
      }
    }
  }

  globalOrders = [newOrder, ...globalOrders];
  return newOrder;
}

export function updateOrderStatus(orderId: string, status: OrderRecord['status'], note?: string): OrderRecord | null {
  const order = globalOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
  if (!order) return null;

  const previousStatus = order.status;
  order.status = status;
  order.timeline.push({
    status,
    timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    note: note || `অর্ডার স্ট্যাটাস পরিবর্তিত হয়ে '${status}' হয়েছে`,
  });

  // If order is cancelled, restore stock
  if (status === 'CANCELLED' && previousStatus !== 'CANCELLED') {
    for (const item of order.items) {
      const product = globalProducts.find((p) => p.id === item.productId || p.slug === item.productId);
      if (product && product.variations && item.variationTitle) {
        const variation = product.variations.find(
          (v) => v.titleBn === item.variationTitle || v.titleEn === item.variationTitle
        );
        if (variation) {
          variation.stock += item.quantity;
        }
      }
    }
  }

  return order;
}

export function updateOrder(orderId: string, updates: Partial<OrderRecord>): OrderRecord | null {
  const order = globalOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
  if (!order) return null;

  Object.assign(order, updates);
  return order;
}

export function assignCourierToOrder(orderId: string, consignmentId: string, trackingCode: string): OrderRecord | null {
  const order = globalOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
  if (!order) return null;

  order.courier = 'STEADFAST';
  order.consignmentId = consignmentId;
  order.trackingCode = trackingCode;
  order.status = 'SHIPPED';
  order.timeline.push({
    status: 'SHIPPED',
    timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    note: `স্টিডফাস্ট কুরিয়ারে কনসাইনমেন্ট ক্রিয়েট করা হয়েছে (ID: ${consignmentId}, Tracking: ${trackingCode})`,
  });

  return order;
}

export function getMemoryOrders(): OrderRecord[] {
  return globalOrders;
}

// Global Site Settings / Home Sections in-memory store
export let globalSiteSettings: SiteSettings = { ...defaultSiteSettings };

export function getSiteSettings(): SiteSettings {
  return globalSiteSettings;
}

export function updateSiteSettings(newSettings: Partial<SiteSettings>): SiteSettings {
  globalSiteSettings = {
    ...globalSiteSettings,
    ...newSettings,
    announcement: {
      ...globalSiteSettings.announcement,
      ...(newSettings.announcement || {}),
    },
    showcases: {
      ...globalSiteSettings.showcases,
      ...(newSettings.showcases || {}),
    },
    whyLoveUs: {
      ...globalSiteSettings.whyLoveUs,
      ...(newSettings.whyLoveUs || {}),
    },
    testimonials: {
      ...globalSiteSettings.testimonials,
      ...(newSettings.testimonials || {}),
    },
    bulkOrderBanner: {
      ...globalSiteSettings.bulkOrderBanner,
      ...(newSettings.bulkOrderBanner || {}),
    },
    welcomeOffer: {
      ...globalSiteSettings.welcomeOffer,
      ...(newSettings.welcomeOffer || {}),
    },
    footer: {
      ...globalSiteSettings.footer,
      ...(newSettings.footer || {}),
    },
    customPages: newSettings.customPages
      ? {
          contact: {
            ...globalSiteSettings.customPages!.contact,
            ...(newSettings.customPages.contact || {}),
          },
          about: {
            ...globalSiteSettings.customPages!.about,
            ...(newSettings.customPages.about || {}),
          },
          privacy: {
            ...globalSiteSettings.customPages!.privacy,
            ...(newSettings.customPages.privacy || {}),
          },
          terms: {
            ...globalSiteSettings.customPages!.terms,
            ...(newSettings.customPages.terms || {}),
          },
        }
      : globalSiteSettings.customPages,
    heroSlides: Array.isArray(newSettings.heroSlides) ? newSettings.heroSlides : globalSiteSettings.heroSlides,
    trustBadges: Array.isArray(newSettings.trustBadges) ? newSettings.trustBadges : globalSiteSettings.trustBadges,
    promoBanners: Array.isArray(newSettings.promoBanners) ? newSettings.promoBanners : globalSiteSettings.promoBanners,
    nav: newSettings.nav
      ? {
          ...(globalSiteSettings.nav || defaultSiteSettings.nav!),
          ...newSettings.nav,
          menuItems: Array.isArray(newSettings.nav.menuItems)
            ? newSettings.nav.menuItems
            : (globalSiteSettings.nav?.menuItems || defaultSiteSettings.nav!.menuItems),
        }
      : globalSiteSettings.nav,
    contact: newSettings.contact
      ? { ...(globalSiteSettings.contact || defaultSiteSettings.contact!), ...newSettings.contact }
      : globalSiteSettings.contact,
    social: newSettings.social
      ? { ...(globalSiteSettings.social || defaultSiteSettings.social!), ...newSettings.social }
      : globalSiteSettings.social,
    seo: newSettings.seo
      ? { ...(globalSiteSettings.seo || defaultSiteSettings.seo!), ...newSettings.seo }
      : globalSiteSettings.seo,
    analytics: newSettings.analytics
      ? { ...(globalSiteSettings.analytics || defaultSiteSettings.analytics!), ...newSettings.analytics }
      : globalSiteSettings.analytics,
    pixel: newSettings.pixel
      ? { ...(globalSiteSettings.pixel || defaultSiteSettings.pixel!), ...newSettings.pixel }
      : globalSiteSettings.pixel,
    branding: newSettings.branding
      ? { ...(globalSiteSettings.branding || defaultSiteSettings.branding!), ...newSettings.branding }
      : globalSiteSettings.branding,
  };
  return globalSiteSettings;
}

// -------------------------------------------------------------
// Contact Messages (In-memory Store fallback)
// -------------------------------------------------------------
export interface ContactMessageRecord {
  id: string;
  name: string;
  phone: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  replyNote?: string;
  repliedAt?: string;
  repliedBy?: string;
  createdAt: string;
}

let globalContactMessages: ContactMessageRecord[] = [
  {
    id: 'msg-sample-1',
    name: 'ফারজানা ইয়াসমিন',
    phone: '01712345678',
    subject: 'স্কুল বা বাল্ক অর্ডার',
    message: 'আমাদের প্লে-গ্রুপ ও নার্সারির ৬০ জন বাচ্চার জন্য ন্যাচারাল ক্রেয়ন ও আর্ট কিটের পাইকারি রেট জানতে চাই।',
    status: 'unread',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'msg-sample-2',
    name: 'তানভীর আহমেদ',
    phone: '01898765432',
    subject: 'অর্ডার ও ট্র্যাকিং সহায়তা',
    message: 'আমার অর্ডারটি গতকাল পাঠানো হয়েছিল, স্টিডফাস্ট ট্র্যাকিং স্ট্যাটাস জানতে চাই।',
    status: 'replied',
    replyNote: 'গ্রাহককে হোয়াটসঅ্যাপে ট্র্যাকিং লিঙ্ক ও ডেলিভারি আপডেট দেওয়া হয়েছে।',
    repliedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    repliedBy: 'Admin',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export function getContactMessages(): ContactMessageRecord[] {
  return [...globalContactMessages];
}

export function addContactMessage(msg: Omit<ContactMessageRecord, 'id' | 'createdAt' | 'status'> & { status?: 'unread' | 'read' | 'replied' }): ContactMessageRecord {
  const newMsg: ContactMessageRecord = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ...msg,
    status: msg.status || 'unread',
    createdAt: new Date().toISOString(),
  };
  globalContactMessages.unshift(newMsg);
  return newMsg;
}

export function updateContactMessage(id: string, updates: Partial<ContactMessageRecord>): ContactMessageRecord | null {
  const idx = globalContactMessages.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  globalContactMessages[idx] = {
    ...globalContactMessages[idx],
    ...updates,
  };
  return globalContactMessages[idx];
}

export function deleteContactMessage(id: string): boolean {
  const initialLen = globalContactMessages.length;
  globalContactMessages = globalContactMessages.filter((m) => m.id !== id);
  return globalContactMessages.length < initialLen;
}

