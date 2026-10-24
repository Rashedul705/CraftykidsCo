export interface DeliverySettings {
  dhakaRate: number;
  suburbsRate: number;
  outsideDhakaRate: number;
  freeShippingEnabled: boolean;
  freeDeliveryThreshold: number;
  codFee: number;
  suburbsDistricts: string[];
}

export const defaultDeliverySettings: DeliverySettings = {
  dhakaRate: 60,
  suburbsRate: 100,
  outsideDhakaRate: 120,
  freeShippingEnabled: true,
  freeDeliveryThreshold: 1000,
  codFee: 0,
  suburbsDistricts: ['Gazipur', 'Narayanganj', 'Savar', 'Keraniganj', 'গাজীপুর', 'নারায়ণগঞ্জ', 'সাভার', 'কেরানীগঞ্জ'],
};

// Global in-memory cache
let globalDeliverySettings: DeliverySettings = { ...defaultDeliverySettings };

export function getDeliverySettings(): DeliverySettings {
  return globalDeliverySettings;
}

export function updateDeliverySettings(updates: Partial<DeliverySettings>): DeliverySettings {
  globalDeliverySettings = {
    ...globalDeliverySettings,
    ...updates,
  };
  return globalDeliverySettings;
}

export function calculateDelivery(
  district: string | null | undefined,
  subtotal: number,
  settings: DeliverySettings = globalDeliverySettings,
  thana?: string | null
): {
  isCalculated: boolean;
  charge: number;
  isFree: boolean;
  zone: 'DHAKA' | 'SUBURBS' | 'OUTSIDE' | 'NONE';
  descriptionBn: string;
} {
  const isFree = settings.freeShippingEnabled !== false && subtotal >= settings.freeDeliveryThreshold;

  if (!district || district.trim() === '') {
    // District not selected yet!
    return {
      isCalculated: false,
      charge: 0,
      isFree,
      zone: 'NONE',
      descriptionBn: isFree ? 'ফ্রি ডেলিভারি' : 'জেলা নির্বাচন করুন',
    };
  }

  const d = district.toLowerCase();
  const t = (thana || '').toLowerCase();

  if (isFree) {
    return {
      isCalculated: true,
      charge: 0,
      isFree: true,
      zone: d.includes('dhaka') || d.includes('ঢাকা') ? 'DHAKA' : 'OUTSIDE',
      descriptionBn: `ফ্রি ডেলিভারি (অর্ডার ৳${settings.freeDeliveryThreshold}+)`,
    };
  }

  // Check if thana is explicitly a Dhaka suburb (e.g. Savar, Keraniganj, Dhamrai)
  // or if district itself is a suburb (e.g. Gazipur, Narayanganj)
  const isSuburb =
    settings.suburbsDistricts.some((s) => d.includes(s.toLowerCase())) ||
    settings.suburbsDistricts.some((s) => t.includes(s.toLowerCase()));

  if (isSuburb) {
    return {
      isCalculated: true,
      charge: settings.suburbsRate,
      isFree: false,
      zone: 'SUBURBS',
      descriptionBn: `ঢাকা উপশহর (৳${settings.suburbsRate})`,
    };
  }

  if (d.includes('dhaka') || d.includes('ঢাকা')) {
    return {
      isCalculated: true,
      charge: settings.dhakaRate,
      isFree: false,
      zone: 'DHAKA',
      descriptionBn: `ঢাকা সিটি (৳${settings.dhakaRate})`,
    };
  }

  return {
    isCalculated: true,
    charge: settings.outsideDhakaRate,
    isFree: false,
    zone: 'OUTSIDE',
    descriptionBn: `ঢাকার বাইরে (৳${settings.outsideDhakaRate})`,
  };
}
