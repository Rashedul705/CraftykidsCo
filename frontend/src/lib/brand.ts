/**
 * Centralized Brand Configuration
 * Rule: Store brand name and core defaults in one place so it can change later.
 * Never hardcode it across multiple places.
 */

export const BRAND_NAME = 'CraftyKidsCo';

export const BRAND_CONFIG = {
  name: BRAND_NAME,
  nameBn: 'ক্রাফটি কিডস কো',
  taglineBn: 'শিশুদের নিরাপদ মোমের রঙ ও শিক্ষণীয় খেলনা',
  taglineEn: 'Safe Natural Wax Crayons & Educational Toys for Kids',
  defaultHotline: '01731-376498',
  defaultWhatsapp: '8801731376498',
  defaultEmail: 'hello@craftykidsco.com',
  defaultAddress: 'তেরখাদিয়া, রাজপাড়া, রাজশাহী।',
  defaultOpeningHours: 'ওপেন ২৪ ঘণ্টা',
  defaultReturnDays: 7,
  defaultDeliveryDhaka: 60,
  defaultDeliveryOutside: 120,
  freeDeliveryThreshold: 1000,
  currencySymbol: '৳',
  giftWrapPrice: 50,
  giftCardPrice: 20,
} as const;

export function getBrandName(): string {
  return BRAND_NAME;
}
