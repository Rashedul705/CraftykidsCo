export interface CouponRecord {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // e.g. 10 for 10%, or 60 for ৳60
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  descriptionBn: string;
}

let globalCoupons: CouponRecord[] = [
  {
    id: 'coup-1',
    code: 'RONG10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 500,
    maxDiscount: 150,
    usageLimit: 500,
    usedCount: 84,
    isActive: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    descriptionBn: '১০% ছাড় (সর্বোচ্চ ৳১৫০), সর্বনিম্ন ৳৫০০ অর্ডারে',
  },
  {
    id: 'coup-2',
    code: 'FREE60',
    discountType: 'fixed',
    discountValue: 60,
    minOrderAmount: 600,
    usageLimit: 300,
    usedCount: 142,
    isActive: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    descriptionBn: '৳৬০ ফ্ল্যাট ছাড়, সর্বনিম্ন ৳৬০০ অর্ডারে',
  },
  {
    id: 'coup-3',
    code: 'EIDJOY15',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 1200,
    maxDiscount: 300,
    usageLimit: 100,
    usedCount: 29,
    isActive: true,
    startDate: '2026-03-01',
    endDate: '2026-06-30',
    descriptionBn: 'ঈদ স্পেশাল ১৫% ডিসকাউন্ট (সর্বোচ্চ ৳৩০০)',
  },
  {
    id: 'coup-4',
    code: 'FIRSTORDER',
    discountType: 'fixed',
    discountValue: 100,
    minOrderAmount: 800,
    usageLimit: 1000,
    usedCount: 312,
    isActive: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    descriptionBn: 'নতুন অভিভাবকদের জন্য প্রথম অর্ডারে ৳১০০ ওয়েলকাম ছাড়',
  },
];

export function getCoupons(): CouponRecord[] {
  return globalCoupons;
}

export function addCoupon(data: Omit<CouponRecord, 'id' | 'usedCount'>): CouponRecord {
  const newCoup: CouponRecord = {
    ...data,
    id: `coup-${Date.now().toString().slice(-4)}`,
    code: data.code.trim().toUpperCase(),
    usedCount: 0,
  };
  globalCoupons.unshift(newCoup);
  return newCoup;
}

export function updateCoupon(id: string, updates: Partial<CouponRecord>): CouponRecord | null {
  const idx = globalCoupons.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  globalCoupons[idx] = { ...globalCoupons[idx], ...updates };
  return globalCoupons[idx];
}

export function deleteCoupon(id: string): boolean {
  const initial = globalCoupons.length;
  globalCoupons = globalCoupons.filter((c) => c.id !== id);
  return globalCoupons.length < initial;
}

export function validateCoupon(code: string, subtotal: number): {
  valid: boolean;
  discountAmount: number;
  message: string;
  coupon?: CouponRecord;
} {
  const clean = code.trim().toUpperCase();
  const c = globalCoupons.find((x) => x.code === clean);

  if (!c || !c.isActive) {
    return { valid: false, discountAmount: 0, message: 'কুপন কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ।' };
  }

  if (c.usageLimit && c.usedCount >= c.usageLimit) {
    return { valid: false, discountAmount: 0, message: 'এই কুপনের ব্যবহারের সীমা শেষ হয়ে গেছে।' };
  }

  if (subtotal < c.minOrderAmount) {
    return {
      valid: false,
      discountAmount: 0,
      message: `${c.code} কুপনের জন্য সর্বনিম্ন ৳${c.minOrderAmount} টাকার অর্ডার আবশ্যক।`,
    };
  }

  let discount = 0;
  if (c.discountType === 'percentage') {
    discount = Math.round((subtotal * c.discountValue) / 100);
    if (c.maxDiscount && discount > c.maxDiscount) {
      discount = c.maxDiscount;
    }
  } else {
    discount = c.discountValue;
  }

  return {
    valid: true,
    discountAmount: discount,
    message: `অভিনন্দন! ৳${discount} ছাড় প্রযোজ্য হয়েছে।`,
    coupon: c,
  };
}
