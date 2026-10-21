export interface IncompleteOrderRecord {
  id: string;
  phone: string;
  customerName?: string;
  district?: string;
  address?: string;
  items: Array<{
    title: string;
    variationTitle?: string;
    price: number;
    quantity: number;
    imageUrl?: string;
  }>;
  subtotal: number;
  deliveryCharge?: number;
  totalAmount: number;
  ipAddress?: string;
  isFollowedUp: boolean;
  status: 'PENDING_CONTACT' | 'FOLLOWED_UP' | 'CONVERTED' | 'DISMISSED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Initial sample incomplete checkouts for demonstration & testing
let globalIncompleteOrders: IncompleteOrderRecord[] = [
  {
    id: 'inc-901',
    phone: '01712987654',
    customerName: 'তানজিলা রহমান',
    district: 'Dhaka',
    address: 'বাড়ি ১২, রোড ৪, ধানমন্ডি',
    items: [
      {
        title: 'CraftyKidsCo ন্যাচারাল মোমের রঙ - ২৪ শেড',
        variationTitle: '২৪ রঙের ক্লাসিক সেট',
        price: 299,
        quantity: 2,
        imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'টডলার ট্রায়াঙ্গুলার গ্রিপ মোম ১২ রঙ',
        price: 220,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
      },
    ],
    subtotal: 818,
    deliveryCharge: 60,
    totalAmount: 878,
    isFollowedUp: false,
    status: 'PENDING_CONTACT',
    notes: 'Phone entered on checkout step 1, abandoned on payment choice',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: 'inc-902',
    phone: '01855443322',
    customerName: 'কামরুল হাসান',
    district: 'Chittagong',
    address: 'জিইসি মোড়, চট্টগ্রাম',
    items: [
      {
        title: 'অর্গানিক প্লে-ডো অ্যান্ড ক্লে ক্রাফট কিট',
        variationTitle: '৮ রঙের সুপার প্যাক',
        price: 499,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
      },
    ],
    subtotal: 499,
    deliveryCharge: 120,
    totalAmount: 619,
    isFollowedUp: true,
    status: 'FOLLOWED_UP',
    notes: 'Sent WhatsApp discount reminder. Customer said will complete tonight.',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: 'inc-903',
    phone: '01911998877',
    customerName: 'সামিয়া হক',
    district: 'Sylhet',
    address: 'উপশহর, সিলেট',
    items: [
      {
        title: 'মন্টেসরি কাঠের বর্ণমালা ও নম্বর পাজল বোর্ড',
        price: 650,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80',
      },
    ],
    subtotal: 650,
    deliveryCharge: 120,
    totalAmount: 770,
    isFollowedUp: false,
    status: 'PENDING_CONTACT',
    notes: 'Entered phone 15 min ago',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
];

export function getIncompleteOrders(): IncompleteOrderRecord[] {
  return globalIncompleteOrders;
}

export function saveIncompleteOrder(data: Partial<IncompleteOrderRecord> & { phone: string }): IncompleteOrderRecord {
  const existingIndex = globalIncompleteOrders.findIndex((o) => o.phone === data.phone && o.status !== 'CONVERTED');

  const now = new Date().toISOString();
  if (existingIndex >= 0) {
    globalIncompleteOrders[existingIndex] = {
      ...globalIncompleteOrders[existingIndex],
      ...data,
      updatedAt: now,
    };
    return globalIncompleteOrders[existingIndex];
  }

  const newRecord: IncompleteOrderRecord = {
    id: `inc-${Date.now().toString().slice(-4)}`,
    phone: data.phone,
    customerName: data.customerName || 'Shopper',
    district: data.district || 'Dhaka',
    address: data.address || '',
    items: data.items || [],
    subtotal: data.subtotal || 0,
    deliveryCharge: data.deliveryCharge || 60,
    totalAmount: data.totalAmount || (data.subtotal || 0) + (data.deliveryCharge || 60),
    isFollowedUp: false,
    status: 'PENDING_CONTACT',
    notes: data.notes || 'Abandoned draft captured during checkout',
    createdAt: now,
    updatedAt: now,
  };

  globalIncompleteOrders.unshift(newRecord);
  return newRecord;
}

export function updateIncompleteOrderStatus(
  id: string,
  status: IncompleteOrderRecord['status'],
  notes?: string
): IncompleteOrderRecord | null {
  const index = globalIncompleteOrders.findIndex((o) => o.id === id);
  if (index === -1) return null;

  globalIncompleteOrders[index] = {
    ...globalIncompleteOrders[index],
    status,
    isFollowedUp: status === 'FOLLOWED_UP' || status === 'CONVERTED',
    notes: notes !== undefined ? notes : globalIncompleteOrders[index].notes,
    updatedAt: new Date().toISOString(),
  };

  return globalIncompleteOrders[index];
}

export function removeIncompleteOrder(id: string): boolean {
  const initial = globalIncompleteOrders.length;
  globalIncompleteOrders = globalIncompleteOrders.filter((o) => o.id !== id);
  return globalIncompleteOrders.length < initial;
}
