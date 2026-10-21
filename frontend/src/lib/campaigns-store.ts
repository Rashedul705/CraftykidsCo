/**
 * SMS Campaigns Store & Engine
 * Supports Unicode/Bangla character counting, audience segment filters,
 * fatigue/opt-out protection, and BulkSMSBD delivery queuing.
 */

export type AudienceSegmentKey =
  | 'all'
  | 'ordered_30d'
  | 'ordered_90d'
  | 'inactive_90d'
  | 'repeat_buyers'
  | 'category_art_kits'
  | 'district_dhaka'
  | 'abandoned_checkout'
  | 'custom_csv';

export interface AudienceSegmentOption {
  key: AudienceSegmentKey;
  label: string;
  count: number;
  description: string;
}

export interface CampaignTemplate {
  id: string;
  title: string;
  text: string;
  category: 'promo' | 'cart' | 'new' | 'vip';
}

export interface SmsCampaignRecord {
  id: string;
  name: string;
  message: string;
  audienceSegment: AudienceSegmentKey;
  audienceLabel: string;
  recipientCount: number;
  smsPerRecipient: number;
  totalSmsCount: number;
  costPerSms: number;
  totalCost: number;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduledFor?: string;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  couponCode?: string;
  couponUses: number;
  skipOptOut: boolean;
  skipRecentMarketing7d: boolean;
  skipOpenOrders: boolean;
  createdAt: string;
  sentAt?: string;
}

export const AUDIENCE_SEGMENTS: AudienceSegmentOption[] = [
  {
    key: 'all',
    label: 'All Customers',
    count: 2450,
    description: 'Every verified customer in the shop database',
  },
  {
    key: 'ordered_30d',
    label: 'Ordered in last 30 days',
    count: 410,
    description: 'Active recent buyers with warm engagement',
  },
  {
    key: 'ordered_90d',
    label: 'Ordered in last 90 days',
    count: 920,
    description: 'Quarterly shoppers who know the brand',
  },
  {
    key: 'inactive_90d',
    label: 'Not ordered in 90+ days',
    count: 740,
    description: 'Lapsed buyers ready for win-back discounts',
  },
  {
    key: 'repeat_buyers',
    label: 'Repeat Buyers (2+ orders)',
    count: 580,
    description: 'High-LTV loyal customers who love child-safe crafts',
  },
  {
    key: 'category_art_kits',
    label: 'Bought from Art Kits',
    count: 630,
    description: 'Parents interested in painting & crayon sets',
  },
  {
    key: 'district_dhaka',
    label: 'Dhaka District Shoppers',
    count: 1350,
    description: 'Eligible for same-day / next-day delivery campaigns',
  },
  {
    key: 'abandoned_checkout',
    label: 'Abandoned Checkout',
    count: 11,
    description: 'Visitors who entered phone number but did not submit',
  },
];

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'flash-sale',
    title: 'Weekend Flash Sale',
    category: 'promo',
    text: 'প্রিয় {name}, CraftyKidsCo-তে শুরু হয়েছে বিশেষ উইকেন্ড সেল! আজই অর্ডার করুন এবং {coupon} ব্যবহারে পান ১৫% অতিরিক্ত ছাড়: {link}',
  },
  {
    id: 'cart-recovery',
    title: 'Abandoned Cart Recovery',
    category: 'cart',
    text: 'প্রিয় {name}, আপনার কার্টে পছন্দের আর্ট কিট অপেক্ষা করছে! স্টক শেষ হওয়ার আগেই অর্ডার সম্পন্ন করতে {coupon} কোডটি ব্যবহার করুন: {link}',
  },
  {
    id: 'new-arrivals',
    title: 'New Product Arrival',
    category: 'new',
    text: 'শিশুদের সৃজনশীলতায় যুক্ত হলো নতুন ন্যাচারাল আর্ট কিট! ১০০% নিরাপদ উপাদান ও ফুড-গ্রেড রঙ দেখতে ভিজিট করুন: {link}',
  },
  {
    id: 'vip-appreciation',
    title: 'VIP Repeat Customer',
    category: 'vip',
    text: 'প্রিয় {name}, আপনি আমাদের প্রিয় শুভানুধ্যায়ী। আপনার পরবর্তী অর্ডারে বিশেষ উপহার ও ফ্রি ডেলিভারি পেতে ব্যবহার করুন কোড {coupon}: {link}',
  },
];

/**
 * Calculates SMS parts according to Bangladesh telecom guidelines:
 * - English GSM: 160 chars for 1 SMS, 153 chars per part for multi-part
 * - Bangla / Unicode: 70 chars for 1 SMS, 67 chars per part for multi-part
 */
export function calculateSmsParts(text: string): {
  isUnicode: boolean;
  charCount: number;
  smsCount: number;
  remainingInCurrentPart: number;
  maxPerPart: number;
} {
  const isUnicode = /[^\x00-\x7F]/.test(text);
  const charCount = text.length;

  if (charCount === 0) {
    return {
      isUnicode,
      charCount: 0,
      smsCount: 0,
      remainingInCurrentPart: isUnicode ? 70 : 160,
      maxPerPart: isUnicode ? 70 : 160,
    };
  }

  if (isUnicode) {
    if (charCount <= 70) {
      return {
        isUnicode: true,
        charCount,
        smsCount: 1,
        remainingInCurrentPart: 70 - charCount,
        maxPerPart: 70,
      };
    } else {
      const parts = Math.ceil(charCount / 67);
      const remaining = parts * 67 - charCount;
      return {
        isUnicode: true,
        charCount,
        smsCount: parts,
        remainingInCurrentPart: remaining,
        maxPerPart: 67,
      };
    }
  } else {
    if (charCount <= 160) {
      return {
        isUnicode: false,
        charCount,
        smsCount: 1,
        remainingInCurrentPart: 160 - charCount,
        maxPerPart: 160,
      };
    } else {
      const parts = Math.ceil(charCount / 153);
      const remaining = parts * 153 - charCount;
      return {
        isUnicode: false,
        charCount,
        smsCount: parts,
        remainingInCurrentPart: remaining,
        maxPerPart: 153,
      };
    }
  }
}

// Initial Sample Campaigns
export let globalCampaigns: SmsCampaignRecord[] = [
  {
    id: 'camp-101',
    name: 'বৈশাখী স্পেশাল ক্রাফট অফার',
    message: 'প্রিয় {name}, বৈশাখ উপলক্ষে CraftyKidsCo এর সকল মোমের রঙ ও আর্ট কিটে ১৫% ছাড়! কোড: {coupon}। ভিজিট: {link}',
    audienceSegment: 'ordered_90d',
    audienceLabel: 'Ordered in last 90 days',
    recipientCount: 920,
    smsPerRecipient: 2,
    totalSmsCount: 1840,
    costPerSms: 0.35,
    totalCost: 644,
    status: 'completed',
    sentCount: 920,
    deliveredCount: 898,
    failedCount: 22,
    couponCode: 'BOISHAKH15',
    couponUses: 84,
    skipOptOut: true,
    skipRecentMarketing7d: true,
    skipOpenOrders: true,
    createdAt: '2026-10-10T11:00:00Z',
    sentAt: '2026-10-10T12:00:00Z',
  },
  {
    id: 'camp-102',
    name: 'কার্ট রিকভারি ফলো-আপ (অক্টোবর)',
    message: 'প্রিয় {name}, আপনার কার্ট অপেক্ষা করছে! আজই অর্ডার সম্পন্ন করে {coupon} কোডে ফ্রি ডেলিভারি পান: {link}',
    audienceSegment: 'abandoned_checkout',
    audienceLabel: 'Abandoned Checkout',
    recipientCount: 11,
    smsPerRecipient: 1,
    totalSmsCount: 11,
    costPerSms: 0.35,
    totalCost: 3.85,
    status: 'completed',
    sentCount: 11,
    deliveredCount: 11,
    failedCount: 0,
    couponCode: 'FREESHIP',
    couponUses: 4,
    skipOptOut: true,
    skipRecentMarketing7d: false,
    skipOpenOrders: true,
    createdAt: '2026-10-18T16:00:00Z',
    sentAt: '2026-10-18T16:05:00Z',
  },
  {
    id: 'camp-103',
    name: 'উইকেন্ড আর্ট বক্স ফ্ল্যাশ ক্যাম্পেইন',
    message: 'প্রিয় {name}, বাচ্চাদের জন্য নিরাপদ মোমের রঙ ও কাঠের পাজলে সেরা অফার! ব্যবহার করুন {coupon}: {link}',
    audienceSegment: 'category_art_kits',
    audienceLabel: 'Bought from Art Kits',
    recipientCount: 630,
    smsPerRecipient: 1,
    totalSmsCount: 630,
    costPerSms: 0.35,
    totalCost: 220.5,
    status: 'scheduled',
    scheduledFor: '2026-10-23T10:00',
    sentCount: 0,
    deliveredCount: 0,
    failedCount: 0,
    couponCode: 'CRAFTY10',
    couponUses: 0,
    skipOptOut: true,
    skipRecentMarketing7d: true,
    skipOpenOrders: true,
    createdAt: '2026-10-21T09:00:00Z',
  },
];

export function getAllCampaigns(): SmsCampaignRecord[] {
  return [...globalCampaigns];
}

export function createCampaign(
  data: Omit<SmsCampaignRecord, 'id' | 'createdAt' | 'sentCount' | 'deliveredCount' | 'failedCount' | 'couponUses'>
): SmsCampaignRecord {
  const newCamp: SmsCampaignRecord = {
    ...data,
    id: `camp-${Date.now()}`,
    sentCount: data.status === 'completed' ? data.recipientCount : 0,
    deliveredCount: data.status === 'completed' ? Math.round(data.recipientCount * 0.98) : 0,
    failedCount: data.status === 'completed' ? Math.round(data.recipientCount * 0.02) : 0,
    couponUses: 0,
    createdAt: new Date().toISOString(),
    sentAt: data.status === 'completed' ? new Date().toISOString() : undefined,
  };
  globalCampaigns.unshift(newCamp);
  return newCamp;
}
