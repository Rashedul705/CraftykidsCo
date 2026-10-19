import { SampleProduct, SampleCategory, sampleCategories, sampleProducts } from './sample-data';

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
}

export interface OrderItemRecord {
  id: string;
  productId: string;
  title: string;
  variationTitle?: string;
  price: number;
  quantity: number;
  total: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  district: string;
  fullAddress: string;
  customerNote?: string;
  subtotal: number;
  deliveryCharge: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'PAID';
  paymentMethod: 'COD' | 'BKASH' | 'NAGAD';
  courier?: 'STEADFAST';
  consignmentId?: string;
  trackingCode?: string;
  timeline: { status: string; timestamp: string; note: string }[];
  items: OrderItemRecord[];
  createdAt: string;
}

// In-memory persistent state (shared across client sessions and API routes in server environment)
export let globalOrders: OrderRecord[] = [
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
    timeline: [
      { status: 'PENDING', timestamp: '২০২৬-১০-১২ ১০:৩০ AM', note: 'গ্রাহক দ্বারা অর্ডার সফলভাবে প্লেস করা হয়েছে' },
      { status: 'CONFIRMED', timestamp: '২০২৬-১০-১২ ১১:১৫ AM', note: 'অর্ডার ভেরিফাই ও কনফার্ম করা হয়েছে' },
    ],
    items: [
      {
        id: 'item-1',
        productId: 'prod-crayons-24',
        title: 'CraftyKidsCo ন্যাচারাল মোমের রঙ - ২৪ শেড',
        variationTitle: '২৪ রঙের ক্লাসিক সেট',
        price: 299,
        quantity: 2,
        total: 598,
      },
    ],
    createdAt: '2026-10-12T04:30:00.000Z',
  },
  {
    id: 'ord-rk-1002',
    orderNumber: 'RK-1002',
    customerName: 'রাকিব আহমেদ',
    customerPhone: '01819876543',
    district: 'Chittagong',
    fullAddress: 'জিইসি মোড়, লালখান বাজার, চট্টগ্রাম',
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
    timeline: [
      { status: 'PENDING', timestamp: '২০২৬-১০-১১ ০২:০০ PM', note: 'অর্ডার গৃহীত হয়েছে' },
      { status: 'CONFIRMED', timestamp: '২০২৬-১০-১১ ০৩:০০ PM', note: 'কনফার্মেশন কল সম্পন্ন' },
      { status: 'PROCESSING', timestamp: '২০২৬-১০-১১ ০৫:০০ PM', note: 'প্যাকেজিং সম্পন্ন' },
      { status: 'SHIPPED', timestamp: '২০২৬-১০-১২ ০৯:০০ AM', note: 'স্টিডফাস্ট কুরিয়ারে হস্তান্তর করা হয়েছে' },
    ],
    items: [
      {
        id: 'item-2',
        productId: 'prod-wooden-puzzle',
        title: 'বর্ণমালা কাঠের লার্নিং পাজল বোর্ড',
        price: 360,
        quantity: 1,
        total: 360,
      },
    ],
    createdAt: '2026-10-11T08:00:00.000Z',
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

export function getAllProducts(): SampleProduct[] {
  return globalProducts;
}

export function addProduct(prod: SampleProduct): SampleProduct {
  globalProducts.unshift(prod);
  return prod;
}

export function updateProduct(id: string, updates: Partial<SampleProduct>): SampleProduct | null {
  const index = globalProducts.findIndex((p) => p.id === id || p.slug === id);
  if (index === -1) return null;
  globalProducts[index] = { ...globalProducts[index], ...updates };
  return globalProducts[index];
}

export function getProductBySlug(slug: string): SampleProduct | undefined {
  return globalProducts.find((p) => p.slug === slug);
}

export function getProductsByCategory(categorySlug: string): SampleProduct[] {
  if (categorySlug === 'wax-crayons') {
    return globalProducts.filter((p) => p.slug.includes('crayon') || p.slug.includes('washable'));
  }
  if (categorySlug === 'educational-toys') {
    return globalProducts.filter((p) => p.slug.includes('puzzle') || p.slug.includes('blocks'));
  }
  if (categorySlug === 'play-dough-clay') {
    return globalProducts.filter((p) => p.slug.includes('dough'));
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
