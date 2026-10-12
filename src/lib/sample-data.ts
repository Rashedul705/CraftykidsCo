export interface SampleCategory {
  slug: string;
  nameBn: string;
  nameEn: string;
  description: string;
  imageUrl: string;
  children?: { slug: string; nameBn: string; nameEn: string }[];
}

export interface SampleProduct {
  id: string;
  slug: string;
  titleBn: string;
  titleEn: string;
  basePrice: number;
  baseSalePrice: number;
  isVariable: boolean;
  isBestSeller: boolean;
  targetAgeMin: number;
  targetAgeMax: number;
  imageUrl: string;
  variations?: {
    sku: string;
    titleBn: string;
    titleEn: string;
    price: number;
    salePrice: number;
    stock: number;
  }[];
}

export const sampleCategories: SampleCategory[] = [
  {
    slug: 'wax-crayons',
    nameBn: 'মোমের রঙ (Mom er Color)',
    nameEn: 'Wax Crayons',
    description: '১০০% প্রাকৃতিক ও নিরাপদ খাদ্য মানের মোম দিয়ে তৈরি রঙিন ক্রেয়ন',
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
    children: [
      {
        slug: 'chunky-toddler-crayons',
        nameBn: 'ছোটদের মোটা মোম (Chunky)',
        nameEn: 'Chunky Toddler Crayons',
      },
      {
        slug: 'washable-crayons',
        nameBn: 'ওয়াশেবল মোমের রঙ',
        nameEn: 'Washable Crayons',
      },
    ],
  },
  {
    slug: 'educational-toys',
    nameBn: 'শিক্ষণীয় খেলনা',
    nameEn: 'Educational Toys',
    description: 'বাচ্চাদের মস্তিষ্কের বিকাশ ও সৃজনশীলতায় সহায়ক খেলনা',
    imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
    children: [
      {
        slug: 'wooden-puzzles',
        nameBn: 'কাঠের পাজল',
        nameEn: 'Wooden Puzzles',
      },
      {
        slug: 'building-blocks',
        nameBn: 'বিল্ডিং ব্লকস',
        nameEn: 'Building Blocks',
      },
    ],
  },
  {
    slug: 'play-dough-clay',
    nameBn: 'প্লে-ডো ও ক্লে',
    nameEn: 'Play Dough & Clay',
    description: 'নরম, সুবাসিত ও নন-টক্সিক রঙিন মডেলিং ক্লে',
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    children: [],
  },
];

export const sampleProducts: SampleProduct[] = [
  {
    id: 'prod-crayons-24',
    titleBn: 'রংধনু ন্যাচারাল মোমের রঙ (Mom er Color) - ২৪ শেড',
    titleEn: 'Rongdhonu Natural Wax Crayons - 24 Shade Box',
    slug: 'rongdhonu-natural-wax-crayons-24-shades',
    basePrice: 350,
    baseSalePrice: 299,
    isVariable: true,
    isBestSeller: true,
    targetAgeMin: 2,
    targetAgeMax: 7,
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
    variations: [
      {
        sku: 'CRAYON-12',
        titleBn: '১২ রঙের প্যাক (১ম পর্যায়)',
        titleEn: '12 Colors Starter Pack',
        price: 190,
        salePrice: 160,
        stock: 45,
      },
      {
        sku: 'CRAYON-24',
        titleBn: '২৪ রঙের ক্লাসিক সেট (সবচেয়ে জনপ্রিয়)',
        titleEn: '24 Colors Classic Box',
        price: 350,
        salePrice: 299,
        stock: 60,
      },
      {
        sku: 'CRAYON-36',
        titleBn: '৩৬ রঙের মেগা আর্টিস্ট বক্স',
        titleEn: '36 Colors Mega Artist Box',
        price: 490,
        salePrice: 420,
        stock: 25,
      },
    ],
  },
  {
    id: 'prod-triangular-12',
    titleBn: 'টডলার ট্রায়াঙ্গুলার গ্রিপ মোম ১২ রঙ (ভাঙবে না)',
    titleEn: 'Toddler Triangular Grip Chunky Crayons 12 Set',
    slug: 'toddler-triangular-grip-crayons-12',
    basePrice: 260,
    baseSalePrice: 220,
    isVariable: false,
    isBestSeller: true,
    targetAgeMin: 1,
    targetAgeMax: 4,
    imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'prod-wooden-puzzle',
    titleBn: 'বর্ণমালা কাঠের লার্নিং পাজল বোর্ড',
    titleEn: 'Bangla & English Wooden Learning Puzzle Board',
    slug: 'wooden-learning-puzzle-board',
    basePrice: 420,
    baseSalePrice: 360,
    isVariable: false,
    isBestSeller: false,
    targetAgeMin: 3,
    targetAgeMax: 6,
    imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'prod-play-dough-6',
    titleBn: 'সুপার সফট প্লে-ডো ৬ রঙের সেট + ৪টি শেপ কাটার',
    titleEn: 'Super Soft Play Dough 6-Color Tub Set with Cutters',
    slug: 'super-soft-play-dough-6-color-tub-set',
    basePrice: 320,
    baseSalePrice: 275,
    isVariable: false,
    isBestSeller: false,
    targetAgeMin: 2,
    targetAgeMax: 8,
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
  },
];

export const sampleDeliveryZones = [
  {
    name: 'Inside Dhaka (ঢাকার ভেতরে)',
    districts: 'Dhaka',
    standardCharge: 60,
    freeDeliveryMinimum: 1000,
  },
  {
    name: 'Outside Dhaka (ঢাকার বাইরে)',
    districts: 'Chittagong,Sylhet,Rajshahi,Khulna,Barisal,Rangpur,Mymensingh,Gazipur,Narayanganj,Cumilla',
    standardCharge: 120,
    freeDeliveryMinimum: 1000,
  },
];
