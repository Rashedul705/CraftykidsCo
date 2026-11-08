export interface PermissionDefinition {
  key: string;
  label: string;
  group: string;
  description: string;
  isSuperAdminOnly?: boolean;
}

export interface PermissionGroup {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  viewPermissionKey?: string;
  permissions: PermissionDefinition[];
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // 1. OVERVIEW
  {
    key: 'dashboard.view',
    label: 'Dashboard (ড্যাশবোর্ড ও ওভারভিউ)',
    group: 'overview',
    description: 'অ্যাডমিন হোম ড্যাশবোর্ড ওভারভিউ ও দৈনিক বিক্রয় মেট্রিক্স দেখার অনুমতি',
  },

  // 2. SALES
  {
    key: 'orders.view',
    label: 'Orders (অর্ডার তালিকা ও বিবরণ)',
    group: 'sales',
    description: 'সকল অর্ডারের বিবরণ, কাস্টমার তথ্য ও শিপিং দেখার অনুমতি',
  },
  {
    key: 'orders.update_status',
    label: 'Update Order Status (স্ট্যাটাস ও কুরিয়ার পরিবর্তন)',
    group: 'sales',
    description: 'অর্ডারের স্ট্যাটাস পরিবর্তন ও কুরিয়ারে পাঠানোর অনুমতি',
  },
  {
    key: 'orders.cancel',
    label: 'Cancel Orders (অর্ডার বাতিলকরণ)',
    group: 'sales',
    description: 'অর্ডার বাতিল ও স্টক রিস্টোর করার অনুমতি',
  },
  {
    key: 'orders.refund',
    label: 'Refund Orders (রিফান্ড ও রিটার্ন প্রসেস)',
    group: 'sales',
    description: 'রিফান্ড প্রদান ও রিটার্ন প্রসেস করার অনুমতি',
  },
  {
    key: 'orders.incomplete',
    label: 'Incomplete orders (ইনকমপ্লিট / পরিত্যক্ত অর্ডার)',
    group: 'sales',
    description: 'চেকআউটে অসমাপ্ত বা পরিত্যক্ত কার্ট অর্ডার ট্র্যাকিং ও ফলোআপ করার অনুমতি',
  },
  {
    key: 'customers.view',
    label: 'Customers (গ্রাহক তালিকা ও হিস্ট্রি)',
    group: 'sales',
    description: 'গ্রাহকদের তালিকা ও অর্ডার হিস্ট্রি দেখার অনুমতি',
  },
  {
    key: 'customers.edit',
    label: 'Edit Customers (গ্রাহক তথ্য সম্পাদনা)',
    group: 'sales',
    description: 'গ্রাহকের তথ্য, ফোন নম্বর ও কাস্টমার নোট আপডেট করার অনুমতি',
  },
  {
    key: 'customers.delete',
    label: 'Delete Customers (গ্রাহক মুছে ফেলা)',
    group: 'sales',
    description: 'গ্রাহকের রেকর্ড ও সংশ্লিষ্ট অর্ডার হিস্ট্রি মুছে ফেলার অনুমতি',
  },
  {
    key: 'coupons.view',
    label: 'Coupons (ডিসকাউন্ট কুপন তালিকা)',
    group: 'sales',
    description: 'ডিসকাউন্ট কুপন কোডের তালিকা দেখার অনুমতি',
  },
  {
    key: 'coupons.manage',
    label: 'Manage Coupons (কুপন তৈরি ও নিয়ন্ত্রণ)',
    group: 'sales',
    description: 'নতুন কুপন তৈরি, এডিট ও মেয়াদ নির্ধারণ করার অনুমতি',
  },
  {
    key: 'campaigns.sms',
    label: 'SMS campaigns (বাল্ক এসএমএস ক্যাম্পেইন)',
    group: 'sales',
    description: 'বাল্ক এসএমএস ক্যাম্পেইন তৈরি, প্রমোশন মেসেজ পাঠানো ও ব্যালেন্স দেখার অনুমতি',
  },

  // 3. CATALOG
  {
    key: 'products.view',
    label: 'Products (পণ্য ক্যাটালগ ও স্টক)',
    group: 'catalog',
    description: 'পণ্য ক্যাটালগ ও ইনভেন্টরি স্টক দেখার অনুমতি',
  },
  {
    key: 'products.create',
    label: 'Create Products (নতুন পণ্য যোগ)',
    group: 'catalog',
    description: 'নতুন পণ্য তৈরি ও আপলোড করার অনুমতি',
  },
  {
    key: 'products.edit',
    label: 'Edit Products (পণ্য সম্পাদনা)',
    group: 'catalog',
    description: 'পণ্যের তথ্য, ছবি, ভ্যারিয়েশন ও মূল্য পরিবর্তনের অনুমতি',
  },
  {
    key: 'products.delete',
    label: 'Delete Products (পণ্য মুছে ফেলা)',
    group: 'catalog',
    description: 'পণ্য মুছে ফেলার অনুমতি',
  },
  {
    key: 'categories.view',
    label: 'Categories and attributes (ক্যাটাগরি ও বৈশিষ্ট্য)',
    group: 'catalog',
    description: 'ক্যাটাগরি ও ফিল্টার অ্যাট্রিবিউট তালিকা দেখার অনুমতি',
  },
  {
    key: 'categories.manage',
    label: 'Manage Categories (ক্যাটাগরি তৈরি ও সাজানো)',
    group: 'catalog',
    description: 'ক্যাটাগরি তৈরি, সম্পাদনা ও সাজানোর অনুমতি',
  },
  {
    key: 'bundles.manage',
    label: 'Bundles (কম্বো ও প্রোডাক্ট বান্ডেল)',
    group: 'catalog',
    description: 'কম্বো অফার ও প্রোডাক্ট বান্ডেল প্যাকেজ তৈরি এবং সাজানোর অনুমতি',
  },
  {
    key: 'stock.manage',
    label: 'Stock (ইনভেন্টরি স্টক এডজাস্টার)',
    group: 'catalog',
    description: 'ইনভেন্টরি স্টক সংখ্যা আপডেট, দ্রুত রিস্টক ও স্টক হিস্ট্রি লগ দেখার অনুমতি',
  },

  // 4. SHIPPING
  {
    key: 'shipping.charges',
    label: 'Delivery charges (ডেলিভারি চার্জ)',
    group: 'shipping',
    description: 'ঢাকা ও ঢাকার বাইরে ডেলিভারি চার্জ রেট ও ফ্রি শিপিং নির্ধারণের অনুমতি',
  },
  {
    key: 'customers.blocklist',
    label: 'Block list (ফ্রড ও ফেক কাস্টমার ব্লকলিস্ট)',
    group: 'shipping',
    description: 'সন্দেহভাজন বা ফেক গ্রাহক ও ফোন নম্বর ব্লকলিস্ট পরিচালনা করার অনুমতি',
  },

  // 5. CONTENT
  {
    key: 'messages.view',
    label: 'Messages (গ্রাহকদের মেসেজ)',
    group: 'content',
    description: 'ওয়েবসাইটের কন্টাক্ট ফর্ম থেকে আসা গ্রাহকদের বার্তা ও মেসেজ দেখার অনুমতি',
  },
  {
    key: 'pages.manage',
    label: 'Page editor (পেজ এডিটর)',
    group: 'content',
    description: 'এবাউট, কন্টাক্ট, পলিসি ও কাস্টম পেজ তৈরি ও টেক্সট পরিবর্তনের অনুমতি',
  },
  {
    key: 'home.sections',
    label: 'Home sections (হোম সেকশন ও ব্যানার)',
    group: 'content',
    description: 'হোমপেজ ব্যানার, ক্যাটাগরি গ্রিড, অফার ব্যানার ও সেকশন বিন্যাস সাজানোর অনুমতি',
  },

  // 6. SYSTEM
  {
    key: 'settings.site',
    label: 'Site settings (সাইট সেটিংস)',
    group: 'system',
    description: 'ওয়েবসাইট টাইটেল, লোগো, সোশ্যাল লিংক ও সাধারণ সেটিংস কনফিগারেশনের অনুমতি',
  },
  {
    key: 'users.manage',
    label: 'Staff and roles (টিম মেম্বার ও পারমিশন)',
    group: 'system',
    description: 'মডারেটর ও স্টাফদের অ্যাকাউন্ট তৈরি, পাসওয়ার্ড রিসেট ও পারমিশন নিয়ন্ত্রণের অনুমতি',
  },
  {
    key: 'settings.payments_sms',
    label: 'Payments and SMS (পেমেন্ট গেটওয়ে ও এসএমএস এপিআই)',
    group: 'system',
    description: 'bKash, Nagad, Shurjopay পেমেন্ট গেটওয়ে এবং বাল্ক এসএমএস এপিআই কি কনফিগারেশন',
  },

  // 7. REVIEWS
  {
    key: 'reviews.view',
    label: 'View Reviews (গ্রাহক ফটো রিভিউ)',
    group: 'reviews',
    description: 'গ্রাহকদের দেওয়া ফটো রিভিউ ও স্টার রেটিং দেখার অনুমতি',
  },
  {
    key: 'reviews.approve',
    label: 'Approve / Reject Reviews (রিভিউ অনুমোদন/অপ্রকাশ)',
    group: 'reviews',
    description: 'রিভিউ যাচাই করে ওয়েবসাইটে প্রকাশ বা স্থগিত করার অনুমতি',
  },
  {
    key: 'reviews.delete',
    label: 'Delete Reviews (রিভিউ মুছে ফেলা)',
    group: 'reviews',
    description: 'আপত্তিকর রিভিউ মুছে ফেলার অনুমতি',
  },

  // 8. FINANCIAL REPORTS
  {
    key: 'reports.view',
    label: 'Financial Reports & P&L (আর্থিক রিপোর্ট ও লাভ-ক্ষতি)',
    group: 'reports',
    description: 'বিক্রয় রিপোর্ট, পণ্য উৎপাদন খরচ (COGS) ও নিট প্রফিট এনালিটিক্স দেখার অনুমতি',
  },
];

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'overview',
    name: 'OVERVIEW',
    nameBn: 'ওভারভিউ',
    description: 'ড্যাশবোর্ড ও প্রতিদিনের বিক্রয় মেট্রিক্স সামারি',
    viewPermissionKey: 'dashboard.view',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.group === 'overview'),
  },
  {
    id: 'sales',
    name: 'SALES',
    nameBn: 'সেলস ও কাস্টমার',
    description: 'অর্ডার, ইনকমপ্লিট অর্ডার, কাস্টমার, কুপন ও এসএমএস ক্যাম্পেইন',
    viewPermissionKey: 'orders.view',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.group === 'sales'),
  },
  {
    id: 'catalog',
    name: 'CATALOG',
    nameBn: 'পণ্য ক্যাটালগ ও ইনভেন্টরি',
    description: 'পণ্য, ক্যাটাগরি ও অ্যাট্রিবিউট, বান্ডেল এবং ইনভেন্টরি স্টক',
    viewPermissionKey: 'products.view',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.group === 'catalog'),
  },
  {
    id: 'shipping',
    name: 'SHIPPING',
    nameBn: 'শিপিং ও ডেলিভারি',
    description: 'ডেলিভারি চার্জ নির্ধারণ এবং ফ্রড কাস্টমার ব্লকলিস্ট',
    viewPermissionKey: 'shipping.charges',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.group === 'shipping'),
  },
  {
    id: 'content',
    name: 'CONTENT',
    nameBn: 'কনটেন্ট ও পেজ',
    description: 'কন্টাক্ট মেসেজ, পেজ এডিটর এবং হোমপেজ সেকশন বিন্যাস',
    viewPermissionKey: 'messages.view',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.group === 'content'),
  },
  {
    id: 'system',
    name: 'SYSTEM',
    nameBn: 'সিস্টেম ও কনফিগারেশন',
    description: 'সাইট সেটিংস, স্টাফ ও পারমিশন রোল এবং পেমেন্ট/এসএমএস গেটওয়ে',
    viewPermissionKey: 'settings.site',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.group === 'system'),
  },
  {
    id: 'reviews',
    name: 'REVIEWS',
    nameBn: 'গ্রাহক ফটো রিভিউ',
    description: 'গ্রাহকদের ফটো রিভিউ মডারেশন ও রেটিং যাচাই',
    viewPermissionKey: 'reviews.view',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.group === 'reviews'),
  },
  {
    id: 'reports',
    name: 'FINANCIALS',
    nameBn: 'আর্থিক রিপোর্ট ও লাভ-ক্ষতি',
    description: 'বিক্রয় রিপোর্ট, পণ্য উৎপাদন খরচ (COGS) ও নিট প্রফিট এনালিটিক্স',
    viewPermissionKey: 'reports.view',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.group === 'reports'),
  },
];

/**
 * Return all assignable permissions
 */
export function getAssignablePermissions(): PermissionDefinition[] {
  return PERMISSION_DEFINITIONS.filter((p) => !p.isSuperAdminOnly);
}

/**
 * Check if a permission key is registered in the system
 */
export function isValidPermission(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const clean = key.trim();
  if (clean === '*') return true;
  return PERMISSION_DEFINITIONS.some((p) => p.key === clean);
}

/**
 * Check if a permission is strictly reserved for Super Admin
 */
export function isSuperAdminOnlyPermission(key: string): boolean {
  const perm = PERMISSION_DEFINITIONS.find((p) => p.key === key);
  return Boolean(perm?.isSuperAdminOnly);
}

/**
 * Child action to parent view dependency mapping
 */
export const PERMISSION_DEPENDENCIES: Record<string, string> = {
  'orders.update_status': 'orders.view',
  'orders.cancel': 'orders.view',
  'orders.refund': 'orders.view',
  'customers.edit': 'customers.view',
  'customers.delete': 'customers.view',
  'coupons.manage': 'coupons.view',
  'products.create': 'products.view',
  'products.edit': 'products.view',
  'products.delete': 'products.view',
  'categories.manage': 'categories.view',
  'reviews.approve': 'reviews.view',
  'reviews.delete': 'reviews.view',
};

/**
 * Enforces permission dependencies:
 * 1. If any sub-action is selected, ensure parent view permission is included.
 * 2. If a parent view permission is unselected, remove its dependent sub-actions.
 */
export function enforcePermissionDependencies(selectedKeys: string[]): string[] {
  const set = new Set(selectedKeys.filter((k) => isValidPermission(k) && !isSuperAdminOnlyPermission(k)));

  // 1. If child action is selected, auto-select its parent view permission
  for (const [child, parent] of Object.entries(PERMISSION_DEPENDENCIES)) {
    if (set.has(child) && !set.has(parent)) {
      set.add(parent);
    }
  }

  // 2. If parent view permission is unselected, remove child action permissions
  for (const [child, parent] of Object.entries(PERMISSION_DEPENDENCIES)) {
    if (!set.has(parent) && set.has(child)) {
      set.delete(child);
    }
  }

  return Array.from(set);
}

/**
 * Ready-made presets for quick 1-click role configuration
 */
export const PRESETS: Record<
  string,
  { name: string; nameBn: string; description: string; permissions: string[] }
> = {
  'Review Moderator': {
    name: 'Review Moderator',
    nameBn: 'রিভিউ মডারেটর',
    description: 'কাস্টমারদের দেওয়া ফটো রিভিউ যাচাই, এপ্রুভ ও অপ্রকাশ করার অধিকার',
    permissions: ['reviews.view', 'reviews.approve'],
  },
  'Order Handler': {
    name: 'Order Handler',
    nameBn: 'অর্ডার হ্যান্ডলার ও সেলস',
    description: 'অর্ডারের বিবরণ দেখা, স্ট্যাটাস পরিবর্তন, ইনকমপ্লিট অর্ডার এবং গ্রাহক তথ্য দেখার অধিকার',
    permissions: [
      'orders.view',
      'orders.update_status',
      'orders.incomplete',
      'customers.view',
    ],
  },
  'Content Editor': {
    name: 'Content Editor',
    nameBn: 'কনটেন্ট ও ব্যানার এডিটর',
    description: 'পণ্য তৈরি ও এডিট, ক্যাটাগরি, পেজ এডিটর এবং হোমপেজ কনটেন্ট পরিচালনা',
    permissions: [
      'products.view',
      'products.create',
      'products.edit',
      'categories.view',
      'categories.manage',
      'pages.manage',
      'home.sections',
      'messages.view',
    ],
  },
  'Catalog Manager': {
    name: 'Catalog Manager',
    nameBn: 'ক্যাটালগ ও স্টক ম্যানেজার',
    description: 'পণ্য যোগ, সম্পাদনা ও ডিলিট, ক্যাটাগরি, বান্ডেল এবং ইনভেন্টরি স্টক পরিচালনা',
    permissions: [
      'products.view',
      'products.create',
      'products.edit',
      'products.delete',
      'categories.view',
      'categories.manage',
      'bundles.manage',
      'stock.manage',
    ],
  },
};

/**
 * Mapping of Admin Nav Tabs to their required permission
 */
export const TAB_PERMISSION_MAP: Record<string, string | null> = {
  // 1. OVERVIEW
  dashboard: 'dashboard.view',

  // 2. SALES
  orders: 'orders.view',
  'incomplete-orders': 'orders.incomplete',
  customers: 'customers.view',
  coupons: 'coupons.view',
  'sms-campaigns': 'campaigns.sms',

  // 3. CATALOG
  products: 'products.view',
  categories: 'categories.view',
  bundles: 'bundles.manage',
  'gift-packages': 'bundles.manage',
  stock: 'stock.manage',

  // 4. SHIPPING
  'delivery-charges': 'shipping.charges',
  'block-list': 'customers.blocklist',

  // 5. CONTENT
  messages: 'messages.view',
  'page-editor': 'pages.manage',
  'home-sections': 'home.sections',

  // 6. SYSTEM
  'site-settings': 'settings.site',
  staff: 'users.manage',
  moderators: 'users.manage',
  'payments-sms': 'settings.payments_sms',

  // Shortcuts & Extras
  steadfast: 'orders.view',
  'print-settings': 'orders.view',
  reviews: 'reviews.view',
  reports: 'reports.view',
  expenses: 'reports.view',
  'faq-policies': 'pages.manage',
  blog: 'pages.manage',
};

/**
 * Safely resolves the first allowed tab for a user based on their permissions.
 * Super Admins default to 'dashboard'.
 * Moderators with 'dashboard.view' default to 'dashboard'.
 * Moderators without 'dashboard.view' fallback to their first accessible tab.
 */
export function getFirstAllowedTab(
  user?: { isSuperAdmin?: boolean; permissions?: string[] } | null
): string {
  if (!user || user.isSuperAdmin) return 'dashboard';
  const perms = Array.isArray(user.permissions) ? user.permissions : [];

  if (perms.includes('dashboard.view')) return 'dashboard';

  // Candidate tabs in priority order matching the sidebar
  const candidateTabs = [
    'orders',
    'incomplete-orders',
    'customers',
    'coupons',
    'sms-campaigns',
    'products',
    'categories',
    'bundles',
    'stock',
    'delivery-charges',
    'block-list',
    'messages',
    'page-editor',
    'home-sections',
    'site-settings',
    'staff',
    'payments-sms',
    'reviews',
    'reports',
  ];

  for (const tab of candidateTabs) {
    const reqPerm = TAB_PERMISSION_MAP[tab];
    if (reqPerm && perms.includes(reqPerm)) {
      return tab;
    }
  }

  return 'orders';
}
