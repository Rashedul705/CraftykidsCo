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
  // 1. Products
  {
    key: 'products.view',
    label: 'View Products',
    group: 'products',
    description: 'পণ্য ক্যাটালগ ও ইনভেন্টরি স্টক দেখার অনুমতি',
  },
  {
    key: 'products.create',
    label: 'Create Products',
    group: 'products',
    description: 'নতুন পণ্য যোগ করার অনুমতি',
  },
  {
    key: 'products.edit',
    label: 'Edit Products',
    group: 'products',
    description: 'পণ্যের তথ্য, ছবি ও মূল্য পরিবর্তনের অনুমতি',
  },
  {
    key: 'products.delete',
    label: 'Delete Products',
    group: 'products',
    description: 'পণ্য মুছে ফেলার অনুমতি',
  },

  // 2. Categories
  {
    key: 'categories.view',
    label: 'View Categories',
    group: 'categories',
    description: 'ক্যাটাগরি ও অ্যাট্রিবিউট তালিকা দেখার অনুমতি',
  },
  {
    key: 'categories.manage',
    label: 'Manage Categories',
    group: 'categories',
    description: 'ক্যাটাগরি তৈরি, সম্পাদনা ও সাজানোর অনুমতি',
  },

  // 3. Orders
  {
    key: 'orders.view',
    label: 'View Orders',
    group: 'orders',
    description: 'সকল অর্ডারের বিবরণ ও কাস্টমার তথ্য দেখার অনুমতি',
  },
  {
    key: 'orders.update_status',
    label: 'Update Order Status',
    group: 'orders',
    description: 'অর্ডারের স্ট্যাটাস পরিবর্তন ও কুরিয়ারে পাঠানোর অনুমতি',
  },
  {
    key: 'orders.cancel',
    label: 'Cancel Orders',
    group: 'orders',
    description: 'অর্ডার বাতিল ও স্টক রিস্টোর করার অনুমতি',
  },
  {
    key: 'orders.refund',
    label: 'Refund Orders',
    group: 'orders',
    description: 'রিফান্ড প্রদান ও রিটার্ন প্রসেস করার অনুমতি',
  },

  // 4. Customers
  {
    key: 'customers.view',
    label: 'View Customers',
    group: 'customers',
    description: 'গ্রাহকদের তালিকা ও অর্ডার হিস্ট্রি দেখার অনুমতি',
  },
  {
    key: 'customers.edit',
    label: 'Edit Customers',
    group: 'customers',
    description: 'গ্রাহকের তথ্য, নোট ও ব্লকলিস্ট আপডেট করার অনুমতি',
  },
  {
    key: 'customers.delete',
    label: 'Delete Customers',
    group: 'customers',
    description: 'গ্রাহকের রেকর্ড ও সংশ্লিষ্ট অর্ডার হিস্ট্রি মুছে ফেলার অনুমতি',
  },

  // 5. Reviews
  {
    key: 'reviews.view',
    label: 'View Reviews',
    group: 'reviews',
    description: 'গ্রাহকদের দেওয়া ফটো রিভিউ ও রেটিং দেখার অনুমতি',
  },
  {
    key: 'reviews.approve',
    label: 'Approve / Reject Reviews',
    group: 'reviews',
    description: 'রিভিউ যাচাই করে ওয়েবসাইটে প্রকাশ বা স্থগিত করার অনুমতি',
  },
  {
    key: 'reviews.delete',
    label: 'Delete Reviews',
    group: 'reviews',
    description: 'আপত্তিকর রিভিউ মুছে ফেলার অনুমতি',
  },

  // 6. Coupons
  {
    key: 'coupons.view',
    label: 'View Coupons',
    group: 'coupons',
    description: 'ডিসকাউন্ট কুপন কোডের তালিকা দেখার অনুমতি',
  },
  {
    key: 'coupons.manage',
    label: 'Manage Coupons',
    group: 'coupons',
    description: 'নতুন কুপন তৈরি ও মেয়াদ নির্ধারণ করার অনুমতি',
  },

  // 7. Banners & Storefront Content
  {
    key: 'banners.view',
    label: 'View Banners & Layout',
    group: 'banners',
    description: 'হোমপেজ ব্যানার ও সেকশন বিন্যাস দেখার অনুমতি',
  },
  {
    key: 'banners.manage',
    label: 'Manage Banners & Content',
    group: 'banners',
    description: 'ব্যানার ছবি, অফার টেক্সট ও পেজ এডিটর পরিবর্তনের অনুমতি',
  },

  // 8. Reports & P&L Analytics
  {
    key: 'reports.view',
    label: 'View Reports & P&L',
    group: 'reports',
    description: 'বিক্রয় রিপোর্ট, পণ্য উৎপাদন খরচ (COGS) ও নিট প্রফিট দেখার অনুমতি',
  },

  // 9. Core Settings (Super Admin Only - Never assignable to moderators)
  {
    key: 'settings.view',
    label: 'Manage Settings (Super Admin Only)',
    group: 'settings',
    description: 'ওয়েবসাইটের মূল সেটিংস, পেমেন্ট গেটওয়ে ও এসএমএস এপিআই কনফিগারেশন',
    isSuperAdminOnly: true,
  },

  // 10. Users & Permissions (Super Admin Only - Never assignable to moderators)
  {
    key: 'users.manage',
    label: 'Manage Moderators (Super Admin Only)',
    group: 'users',
    description: 'মডারেটরদের তৈরি, পারমিশন নির্ধারণ ও অ্যাকাউন্ট নিয়ন্ত্রণ',
    isSuperAdminOnly: true,
  },
];

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'products',
    name: 'Products & Inventory',
    nameBn: 'পণ্য ও স্টক ব্যবস্থাপনা',
    description: 'পণ্য ক্যাটালগ তৈরি, সম্পাদনা ও ডিলিট করার নিয়ন্ত্রণ',
    viewPermissionKey: 'products.view',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.group === 'products'),
  },
  {
    id: 'categories',
    name: 'Categories & Attributes',
    nameBn: 'ক্যাটাগরি ও বৈশিষ্ট্য',
    description: 'ক্যাটাগরি এবং ফিল্টার অ্যাট্রিবিউট পরিচালনা',
    viewPermissionKey: 'categories.view',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.group === 'categories'),
  },
  {
    id: 'orders',
    name: 'Orders & Shipments',
    nameBn: 'অর্ডার ও কুরিয়ার ডেলিভারি',
    description: 'অর্ডার প্রসেসিং, কুরিয়ার ডিসপ্যাচ ও রিটার্ন হ্যান্ডলিং',
    viewPermissionKey: 'orders.view',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.group === 'orders'),
  },
  {
    id: 'customers',
    name: 'Customers & CRM',
    nameBn: 'গ্রাহক তথ্য ও সিআরএম',
    description: 'গ্রাহকদের হিস্ট্রি, ফোন ভেরিফিকেশন ও ব্লকলিস্ট',
    viewPermissionKey: 'customers.view',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.group === 'customers'),
  },
  {
    id: 'reviews',
    name: 'Customer Photo Reviews',
    nameBn: 'গ্রাহক ফটো রিভিউ মডারেশন',
    description: 'রিভিউ যাচাই, এপ্রুভ ও মুছে ফেলার নিয়ন্ত্রণ',
    viewPermissionKey: 'reviews.view',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.group === 'reviews'),
  },
  {
    id: 'coupons',
    name: 'Discounts & Coupons',
    nameBn: 'কুপন ও ডিসকাউন্ট',
    description: 'প্রমোশনাল কুপন ও ডিসকাউন্ট ক্যাম্পেইন',
    viewPermissionKey: 'coupons.view',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.group === 'coupons'),
  },
  {
    id: 'banners',
    name: 'Banners & Storefront Content',
    nameBn: 'ব্যানার ও পেজ কনটেন্ট',
    description: 'হোমপেজ ব্যানার, পেজ এডিটর ও পলিসি কনটেন্ট',
    viewPermissionKey: 'banners.view',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.group === 'banners'),
  },
  {
    id: 'reports',
    name: 'Financial Reports & P&L',
    nameBn: 'আর্থিক রিপোর্ট ও লাভ-ক্ষতি',
    description: 'রেভিনিউ, পরিচালন ব্যয় (OPEX) ও নিট প্রফিট এনালিটিক্স',
    viewPermissionKey: 'reports.view',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.group === 'reports'),
  },
  {
    id: 'settings',
    name: 'Core System Settings',
    nameBn: 'সিস্টেম ও সিকিউরিটি সেটিংস',
    description: 'শুধুমাত্র সুপার এডমিন (কখনো মডারেটরদের জন্য প্রযোজ্য নয়)',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.group === 'settings'),
  },
  {
    id: 'users',
    name: 'Staff & Moderators Access',
    nameBn: 'মডারেটর পারমিশন অ্যাক্সেস',
    description: 'শুধুমাত্র সুপার এডমিন (কখনো মডারেটরদের জন্য প্রযোজ্য নয়)',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.group === 'users'),
  },
];

/**
 * Return only assignable permissions (excluding Super Admin only permissions)
 */
export function getAssignablePermissions(): PermissionDefinition[] {
  return PERMISSION_DEFINITIONS.filter((p) => !p.isSuperAdminOnly);
}

/**
 * Check if a permission key is registered in the system
 */
export function isValidPermission(key: string): boolean {
  return PERMISSION_DEFINITIONS.some((p) => p.key === key);
}

/**
 * Check if a permission is strictly reserved for Super Admin
 */
export function isSuperAdminOnlyPermission(key: string): boolean {
  const perm = PERMISSION_DEFINITIONS.find((p) => p.key === key);
  return Boolean(perm?.isSuperAdminOnly);
}

/**
 * Enforces permission dependencies:
 * 1. If any non-view permission in a group is selected, auto-select the group's "view" permission.
 * 2. If a group's "view" permission is unselected, remove all other permissions in that group.
 */
export function enforcePermissionDependencies(selectedKeys: string[]): string[] {
  const set = new Set(selectedKeys.filter((k) => isValidPermission(k) && !isSuperAdminOnlyPermission(k)));

  for (const group of PERMISSION_GROUPS) {
    if (!group.viewPermissionKey) continue;

    const groupKeys = group.permissions.map((p) => p.key);
    const viewKey = group.viewPermissionKey;
    const hasView = set.has(viewKey);
    const hasAnyOtherInGroup = groupKeys.some((k) => k !== viewKey && set.has(k));

    if (hasAnyOtherInGroup && !hasView) {
      // Auto-tick view if edit/delete is present
      set.add(viewKey);
    } else if (!hasView) {
      // If view is unticked, untick all others in group
      for (const k of groupKeys) {
        set.delete(k);
      }
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
    description: 'অর্ডারের বিবরণ দেখা, স্ট্যাটাস পরিবর্তন এবং গ্রাহক তথ্য দেখার অধিকার',
    permissions: ['orders.view', 'orders.update_status', 'customers.view'],
  },
  'Content Editor': {
    name: 'Content Editor',
    nameBn: 'কনটেন্ট ও ব্যানার এডিটর',
    description: 'পণ্য তৈরি ও এডিট, ক্যাটাগরি এবং ব্যানার/হোমপেজ কনটেন্ট পরিচালনা',
    permissions: [
      'products.view',
      'products.create',
      'products.edit',
      'categories.view',
      'categories.manage',
      'banners.view',
      'banners.manage',
    ],
  },
  'Catalog Manager': {
    name: 'Catalog Manager',
    nameBn: 'ক্যাটালগ ও স্টক ম্যানেজার',
    description: 'পণ্য যোগ, সম্পাদনা ও ডিলিট এবং ক্যাটাগরি সম্পূর্ণ পরিচালনা',
    permissions: [
      'products.view',
      'products.create',
      'products.edit',
      'products.delete',
      'categories.view',
      'categories.manage',
    ],
  },
};

/**
 * Mapping of Admin Nav Tabs to their required permission
 */
export const TAB_PERMISSION_MAP: Record<string, string | null> = {
  dashboard: null, // Accessible to all authenticated staff
  reports: 'reports.view',
  expenses: 'reports.view',
  orders: 'orders.view',
  'incomplete-orders': 'orders.view',
  customers: 'customers.view',
  coupons: 'coupons.view',
  'sms-campaigns': 'settings.view', // Super admin
  products: 'products.view',
  categories: 'categories.view',
  bundles: 'products.view',
  stock: 'products.view',
  steadfast: 'orders.view',
  'delivery-charges': 'settings.view', // Super admin
  'print-settings': 'orders.view',
  'block-list': 'customers.edit',
  reviews: 'reviews.view',
  messages: 'customers.view',
  'page-editor': 'banners.manage',
  'home-sections': 'banners.manage',
  'faq-policies': 'banners.manage',
  blog: 'banners.manage',
  'site-settings': 'settings.view', // Super admin
  staff: 'users.manage', // Super admin
  moderators: 'users.manage', // Super admin
  'payments-sms': 'settings.view', // Super admin
};

