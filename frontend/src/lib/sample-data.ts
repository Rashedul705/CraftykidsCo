export interface SampleCategory {
  _id?: string;
  id?: string;
  slug: string;
  nameBn: string;
  nameEn: string;
  description: string;
  imageUrl: string;
  badgeColor?: string;
  children?: { slug: string; nameBn: string; nameEn: string }[];
  attributes?: {
    code: string;
    nameBn: string;
    nameEn: string;
    options: { labelBn: string; labelEn: string; value: string }[];
  }[];
}

export interface ProductReview {
  id: string;
  author: string;
  location?: string;
  rating: number;
  date: string;
  comment: string;
  photos?: string[];
  isVerified: boolean;
}

export interface ProductVariation {
  sku: string;
  titleBn: string;
  titleEn: string;
  price: number;
  salePrice: number;
  stock: number;
  imageUrl?: string;
  badge?: string;
}

export interface ProductVideo {
  id: string;
  title: string;
  titleBn: string;
  url: string;
  thumbnailUrl?: string;
  duration?: string;
}

export interface SampleProduct {
  id: string;
  slug: string;
  titleBn: string;
  titleEn: string;
  categorySlug?: string;
  basePrice: number;
  baseSalePrice: number;
  rating?: number;
  reviewCount?: number;
  isVariable: boolean;
  isBestSeller: boolean;
  isNewArrival?: boolean;
  targetAgeMin: number;
  targetAgeMax: number;
  imageUrl: string;
  galleryImages?: string[];
  videoUrl?: string;
  videos?: ProductVideo[];
  badge?: string;
  safetyBadges?: string[];
  description?: string;
  specifications?: { label: string; value: string }[];
  careInstructions?: string;
  faqs?: { question: string; answer: string }[];
  reviews?: ProductReview[];
  variations?: ProductVariation[];
}

export function getProductMedia(product: SampleProduct): {
  images: string[];
  videos: ProductVideo[];
} {
  const images: string[] = [product.imageUrl];
  if (product.galleryImages && product.galleryImages.length > 0) {
    product.galleryImages.forEach((img) => {
      if (!images.includes(img)) images.push(img);
    });
  }
  if (product.variations && product.variations.length > 0) {
    product.variations.forEach((v) => {
      if (v.imageUrl && !images.includes(v.imageUrl)) {
        images.push(v.imageUrl);
      }
    });
  }

  const categoryImagePool: Record<string, string[]> = {
    'art-kits': [
      'https://i.ibb.co/HDV4JVJz/craftykidsco-sweet-fruit.jpg',
      'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg',
      'https://i.ibb.co/vvrMjH6Q/craftykidsco-car-painting-kit.jpg',
      'https://i.ibb.co/kVrGCzrh/craftykidsco-tool-set.jpg',
      'https://i.ibb.co/v4bLHK3N/craftykidsco-sunny-shores.jpg',
      'https://i.ibb.co/7J0qh5wC/craftykidsco-ocean-world.jpg',
    ],
    'wax-crayons': [
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=80',
    ],
    'play-dough-clay': [
      'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    ],
    'sketchbooks': [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=80',
    ],
    'wooden-toys': [
      'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618842676088-c4d48a6a7c9d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80',
    ],
    'puzzles': [
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618842676088-c4d48a6a7c9d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80',
    ],
    'educational-toys': [
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618842676088-c4d48a6a7c9d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80',
    ],
    'gift-sets': [
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
      'https://i.ibb.co/CsS18B4H/craftykidsco-mixed-kit-1.jpg',
      'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
    ],
  };

  const pool = categoryImagePool[product.categorySlug || ''] || categoryImagePool['art-kits'];
  for (const extraImg of pool) {
    if (images.length >= 5) break;
    if (!images.includes(extraImg)) {
      images.push(extraImg);
    }
  }

  let videos: ProductVideo[] = [];
  if (product.videos && product.videos.length > 0) {
    videos = product.videos;
  } else {
    videos = [
      {
        id: 'vid-1',
        title: 'Unboxing & Box Contents Review',
        titleBn: 'ভিডিও ১: আনবক্সিং ও পণ্য রিভিউ',
        url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        duration: '0:15',
        thumbnailUrl: images[0] || product.imageUrl,
      },
      {
        id: 'vid-2',
        title: 'Creative Play & Drawing Demo',
        titleBn: 'ভিডিও ২: শিশুদের লাইভ আর্ট ডেমো',
        url: 'https://vjs.zencdn.net/v/oceans.mp4',
        duration: '0:45',
        thumbnailUrl: images[1] || images[0] || product.imageUrl,
      },
    ];
  }

  return { images, videos };
}

export const sampleCategories: SampleCategory[] = [
  {
    slug: 'wax-crayons',
    nameBn: 'মোমের রঙ',
    nameEn: 'Wax Crayons',
    description: '১০০% প্রাকৃতিক ও নিরাপদ খাদ্য মানের মোম দিয়ে তৈরি রঙিন ক্রেয়ন',
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=400&q=80',
    badgeColor: '#FFE8D6',
    children: [
      { slug: 'chunky-toddler-crayons', nameBn: 'ছোটদের মোটা মোম', nameEn: 'Chunky Toddler Crayons' },
      { slug: 'washable-crayons', nameBn: 'ওয়াশেবল মোমের রঙ', nameEn: 'Washable Crayons' },
    ],
  },
  {
    slug: 'play-dough-clay',
    nameBn: 'ক্লে ও ডো',
    nameEn: 'Clay & Dough',
    description: 'নরম, সুবাসিত ও ১০০% নন-টক্সিক রঙিন মডেলিং প্লে-ডো',
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=400&q=80',
    badgeColor: '#E1F5FE',
    children: [],
  },
  {
    slug: 'sketchbooks',
    nameBn: 'ড্রয়িং খাতা',
    nameEn: 'Drawing Books',
    description: 'মোটা প্রিমিয়াম কাগজের আর্ট ও ড্রয়িং স্কেচ প্যাড',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
    badgeColor: '#E8F5E9',
    children: [],
  },
  {
    slug: 'wooden-toys',
    nameBn: 'কাঠের খেলনা',
    nameEn: 'Wooden Toys',
    description: 'মসৃণ ও টেকসই ন্যাচারাল কাঠের পরিবেশবান্ধব খেলনা',
    imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=400&q=80',
    badgeColor: '#FCE4EC',
    children: [],
  },
  {
    slug: 'puzzles',
    nameBn: 'পাজল গেম',
    nameEn: 'Puzzles',
    description: 'শিশুর মেধা ও একাগ্রতা বিকাশের মজাদার ব্রেইন পাজল',
    imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=400&q=80',
    badgeColor: '#FFF9C4',
    children: [],
  },
  {
    slug: 'art-kits',
    nameBn: 'আর্ট কিট',
    nameEn: 'Art Kits',
    description: 'রঙ, ব্রাশ ও ক্রাফট টুলের কমপ্লিট ক্রিয়েটিভ বক্স',
    imageUrl: 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg',
    badgeColor: '#E0F7FA',
    children: [],
  },
  {
    slug: 'educational-toys',
    nameBn: 'শিক্ষামূলক',
    nameEn: 'Educational',
    description: 'মন্টেসরি মেথড লার্নিং বোর্ড ও আর্লি চাইল্ডহুড ডেভেলপমেন্ট কিটস',
    imageUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=400&q=80',
    badgeColor: '#EDE7F6',
    children: [],
  },
  {
    slug: 'gift-sets',
    nameBn: 'উপহার সেট',
    nameEn: 'Gift Sets',
    description: 'জন্মদিন ও বিশেষ উপহারের প্রিমিয়াম গিফট কম্বো প্যাক',
    imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80',
    badgeColor: '#FFEBEE',
    children: [],
  },
];

export const sampleProducts: SampleProduct[] = [
  // --- REAL CRAFTYKIDSCO PLASTER PAINTING KITS ---
  {
    id: 'prod-plaster-sweet-fruit',
    titleBn: 'সুইট ফ্রুট প্লাস্টার পেইন্টিং কিট (৬টি ফল + ৪টি রঙ + ১টি ব্রাশ)',
    titleEn: 'Sweet Fruit Plaster Painting Kit',
    slug: 'sweet-fruit-painting-kit',
    categorySlug: 'art-kits',
    basePrice: 1200,
    baseSalePrice: 990,
    rating: 4.9,
    reviewCount: 42,
    isVariable: true,
    isBestSeller: false,
    isNewArrival: true,
    targetAgeMin: 2,
    targetAgeMax: 8,
    imageUrl: 'https://i.ibb.co/HDV4JVJz/craftykidsco-sweet-fruit.jpg',
    galleryImages: [
      'https://i.ibb.co/HDV4JVJz/craftykidsco-sweet-fruit.jpg',
      'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg',
      'https://i.ibb.co/CsS18B4H/craftykidsco-mixed-kit-1.jpg'
    ],
    badge: 'সেরা উপহার',
    variations: [
      {
        sku: 'SWEET-FRUIT-STARTER',
        titleBn: 'স্টার্টার প্যাক (৬টি ফল + ৪টি রঙ + ১ ব্রাশ)',
        titleEn: 'Starter Pack (6 Fruits + 4 Colors + 1 Brush)',
        price: 1200,
        salePrice: 990,
        stock: 35,
        imageUrl: 'https://i.ibb.co/HDV4JVJz/craftykidsco-sweet-fruit.jpg',
        badge: 'Popular'
      },
      {
        sku: 'SWEET-FRUIT-MEGA',
        titleBn: 'মেগা আর্ট বক্স (১২টি ফল + ৮টি রঙ + ২ ব্রাশ + প্যালেট)',
        titleEn: 'Mega Art Box (12 Fruits + 8 Colors + 2 Brushes + Palette)',
        price: 1800,
        salePrice: 1450,
        stock: 18,
        imageUrl: 'https://i.ibb.co/CsS18B4H/craftykidsco-mixed-kit-1.jpg',
        badge: 'Best Value'
      },
      {
        sku: 'SWEET-FRUIT-DELUXE',
        titleBn: 'ডিলাক্স ফ্যামিলি গিফট বক্স (১৮টি ফল + ১২ রঙ + ৪ ব্রাশ)',
        titleEn: 'Deluxe Family Gift Box (18 Fruits + 12 Colors + 4 Brushes)',
        price: 2400,
        salePrice: 1890,
        stock: 5,
        imageUrl: 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg',
        badge: 'Save ৳510'
      }
    ],
    safetyBadges: ['১০০% ফুড-গ্রেড ন্যাচারাল জিপসাম', 'ওয়াশেবল ও নন-টক্সিক কালার', 'স্মুথ ও নিরাপদ এজ', 'স্ক্রিন-ফ্রি ক্রিয়েটিভ প্লে'],
    description: 'রসালো ও রঙিন ফলের আনন্দময় ভুবন! এই কিটে রয়েছে ৬টি সুদৃশ্য সাদা প্লাস্টার ফলের আকৃতি—আনারস (Pineapple), নাশপাতি (Pear), আঙ্গুর (Grapes), মিষ্টি লাল স্ট্রবেরি (Strawberry), রসালো তরমুজের টুকরো (Watermelon Slice) এবং মিষ্টি এক কাঁদি কলা (Bananas)। সাথে থাকছে ৪টি ব্রাইট পেইন্ট পট (লাল, হলুদ, নীল, সবুজ) এবং ১টি স্মুথ পেইন্টিং ব্রাশ। শিশুরা নিজে নিজে পছন্দমতো রঙ করে বিভিন্ন ফল চিনবে, রঙ মেলানো শিখবে এবং তাদের কল্পনাশক্তির বাস্তব রূপ দেবে। পেইন্ট করা শেষে এগুলোকে ফ্রিজ ম্যাগনেট বা পড়ার টেবিলের সুন্দর শোপিস হিসেবে সাজিয়ে রাখা যায়!',
    specifications: [
      { label: 'প্লাস্টার শেপ সংখ্যা', value: '৬টি (আনারস, নাশপাতি, আঙ্গুর, স্ট্রবেরি, তরমুজ, কলা)' },
      { label: 'রঙের সংখ্যা', value: '৪টি প্রাইমারি কালার পট (Red, Yellow, Blue, Green)' },
      { label: 'কালার মিক্সিং সুবিধা', value: 'রঙ মিশিয়ে কমলা, বেগুনি ইত্যাদি নতুন রঙ তৈরির সুযোগ' },
      { label: 'উপাদান', value: '১০০% ইকো-ফ্রেন্ডলি স্মুথ জিপসাম প্লাস্টার' },
      { label: 'উপযুক্ত বয়স', value: '২ বছর থেকে ৮ বছর' },
      { label: 'ওয়াশেবল সুবিধা', value: 'হাতে বা কাপড়ে লাগলে সাধারণ সাবান পানিতেই উঠে যায়' }
    ],
    careInstructions: 'পেইন্টিং শেষ করার পর ফ্যানের বাতাসে ১৫-২০ মিনিট রেখে দিন যাতে রঙ শুকিয়ে মসৃণ হয়ে যায়। রঙের পাত্রের মুখ ব্যবহারের পর ভালো করে আটকে রাখুন।',
    faqs: [
      {
        question: 'বাচ্চা কি নিজে নিজে রঙ করতে পারবে?',
        answer: 'হ্যাঁ, প্রতিটি ফলের আউটলাইন ও টেক্সচার খুব মসৃণ ও স্পষ্ট হওয়ায় বাচ্চারা খুব সহজেই ব্রাশ দিয়ে রঙ ভরাট করতে পারে।'
      },
      {
        question: 'রঙ কি কাপড়ে লাগলে উঠে যাবে?',
        answer: 'জি, এটি সম্পূর্ণ ওয়াশেবল ওয়াটার-বেসড পেইন্ট, সাধারণ পানিতে সাবান দিয়ে ধুয়ে নিলেই অনায়াসে উঠে যায়।'
      },
      {
        question: 'ফলগুলো কি ফ্রিজ ম্যাগনেট হিসেবে লাগানো যাবে?',
        answer: 'হ্যাঁ, পেছনে ছোট ম্যাগনেট স্টিকার লাগিয়ে অনায়াসেই ফ্রিজ বা হোয়াইটবোর্ডে লাগানো যায়।'
      }
    ],
    reviews: [
      {
        id: 'rev-sf-1',
        author: 'ফারহানা করিম',
        location: 'ঢাকা',
        rating: 5,
        date: '২০২৬-১০-১৫',
        comment: 'আমার ৪ বছরের মেয়ে তরমুজ আর স্ট্রবেরি নিজে রঙ করেছে! রঙ খুবই ব্রাইট আর কাপড় থেকে সহজেই উঠে গেছে। প্যাকেজিং অনেক সুন্দর ছিল।',
        isVerified: true
      },
      {
        id: 'rev-sf-2',
        author: 'আহমেদ জুবায়ের',
        location: 'চট্টগ্রাম',
        rating: 5,
        date: '২০২৬-১০-১২',
        comment: 'প্লাস্টার শেপগুলোর কোয়ালিটি অসাধারণ, কোনো ধারালো কোণা নেই। বাচ্চাদের উপহার দেওয়ার জন্য দারুণ একটি আইটেম।',
        isVerified: true
      }
    ]
  },
  {
    id: 'prod-plaster-little-bug',
    titleBn: 'লিটল বাগ অ্যাডভেঞ্চার প্লাস্টার পেইন্টিং কিট (৪টি কিউট পোকা + ৪টি রঙ + ব্রাশ)',
    titleEn: 'Little Bug Adventure Plaster Painting Kit',
    slug: 'little-bug-adventure',
    categorySlug: 'art-kits',
    basePrice: 1100,
    baseSalePrice: 890,
    rating: 4.9,
    reviewCount: 56,
    isVariable: true,
    isBestSeller: false,
    isNewArrival: true,
    targetAgeMin: 2,
    targetAgeMax: 8,
    imageUrl: 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg',
    galleryImages: [
      'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg',
      'https://i.ibb.co/HDV4JVJz/craftykidsco-sweet-fruit.jpg',
      'https://i.ibb.co/q35L6xdm/craftykidsco-autumn-nature.jpg'
    ],
    badge: 'টপ সেলার',
    variations: [
      {
        sku: 'BUG-STARTER-4',
        titleBn: 'স্টার্টার প্যাক (৪টি পোকা + ৪টি রঙ + ১ ব্রাশ)',
        titleEn: 'Starter Pack (4 Bugs + 4 Colors + 1 Brush)',
        price: 1100,
        salePrice: 890,
        stock: 28,
        imageUrl: 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg',
        badge: 'Popular'
      },
      {
        sku: 'BUG-EXPLORER-8',
        titleBn: 'এক্সপ্লোরার কম্বো (৮টি পোকা + ৬টি রঙ + ২ ব্রাশ)',
        titleEn: 'Explorer Combo (8 Bugs + 6 Colors + 2 Brushes)',
        price: 1650,
        salePrice: 1350,
        stock: 15,
        imageUrl: 'https://i.ibb.co/HDV4JVJz/craftykidsco-sweet-fruit.jpg',
        badge: 'Best Value'
      },
      {
        sku: 'BUG-MEGA-12',
        titleBn: 'মেগা কিংডম বক্স (১২টি পোকা + ৮ রঙ + ৩ ব্রাশ)',
        titleEn: 'Mega Kingdom Box (12 Bugs + 8 Colors + 3 Brushes)',
        price: 2200,
        salePrice: 1750,
        stock: 7,
        imageUrl: 'https://i.ibb.co/CsS18B4H/craftykidsco-mixed-kit-1.jpg',
        badge: 'Only 7 Left'
      }
    ],
    safetyBadges: ['১০০% নন-টক্সিক ও নিরাপদ', '৪টি কিউট বাগ মডেল', 'মিনি ইজেল আর্ট বোর্ড অন্তর্ভুক্ত', 'সহজে ওয়াশেবল'],
    description: 'প্রকৃতির মিষ্টি মিষ্টি পতঙ্গদের নিয়ে গড়ে তুলুন আপনার শিশুর নিজস্ব জাদুকরী পৃথিবী! Little Bug Adventure কিটে রয়েছে ৪টি থ্রিডি প্লাস্টার শেপ—ডানামেলা কিউট প্রজাপতি (Butterfly), গোলগাল মিষ্টি লেডিবাগ (Ladybug), চটপটে ড্রাগনফ্লাই/ঘাসফড়িং (Dragonfly) এবং পরিশ্রমী মৌমাছি (Honeybee)। সাথে থাকছে ৪টি আকর্ষণীয় রঙ (গোলাপি, হলুদ, সবুজ, নীল), ব্রাশ এবং একটি মিনি ডিসপ্লে ইজেল। শিশুরা নিজ হাতে রঙ করে সৃষ্টি করবে রঙিন জীববৈচিত্র্য, যা তাদের হ্যান্ড-আই কোঅর্ডিনেশন ও একাগ্রতা বৃদ্ধিতে দারুণ কার্যকর।',
    specifications: [
      { label: 'প্লাস্টার শেপ সংখ্যা', value: '৪টি (প্রজাপতি, লেডিবাগ, ঘাসফড়িং, মৌমাছি)' },
      { label: 'রঙের সংখ্যা', value: '৪ রঙের ওয়াশেবল পেইন্ট পট (Pink, Yellow, Green, Blue)' },
      { label: 'ব্রাশ অন্তর্ভুক্ত', value: '১টি ফাইন টিপ আর্টিস্ট ব্রাশ' },
      { label: 'মিনি ইজেল', value: 'কাঠের মিনি আর্ট ডিসপ্লে স্ট্যান্ড' },
      { label: 'উপাদান', value: '১০০% ইকো-ফ্রেন্ডলি জিপসাম প্লাস্টার ও নন-টক্সিক ওয়াটারবেসড পেইন্ট' },
      { label: 'উপযুক্ত বয়স', value: '২ থেকে ৮ বছর' }
    ],
    careInstructions: 'পেইন্টিং করার পর ১০-১৫ মিনিট ফ্যানের বাতাসে শুকিয়ে নিন। শুকিয়ে গেলে এটি টেকসই শো-পিস হিসেবে ঘরে সাজিয়ে রাখা যাবে।',
    faqs: [
      {
        question: 'রঙ কি শিশুর ত্বকের জন্য ক্ষতিকর?',
        answer: 'একেবারেই না। CraftyKidsCo এর প্রতিটি রঙ ১০০% চাইল্ড-সেফ ও ওয়াটারবেসড ওয়াশেবল পেইন্ট দিয়ে তৈরি। এটি সম্পূর্ণ নন-টক্সিক।'
      },
      {
        question: 'বাচ্চারা কি নিজে নিজে রঙ করতে পারবে?',
        answer: 'হ্যাঁ, শেপগুলোর আউটলাইন খুব মসৃণ ও স্পষ্ট হওয়ায় বাচ্চারা খুব সহজেই ব্রাশ দিয়ে রঙ ভরাট করতে পারে।'
      }
    ],
    reviews: [
      {
        id: 'rev-lb-1',
        author: 'নাদিয়া সুলতানা',
        location: 'উত্তরা, ঢাকা',
        rating: 5,
        date: '২০২৬-১০-১৪',
        comment: 'লেডিবাগ আর বাটারফ্লাই রঙ করতে আমার ছেলে এত আনন্দ পেয়েছে যে ফোনে তাকানোর কথাই ভুলে গেছে! Truly screen-free fun.',
        isVerified: true
      }
    ]
  },
  {
    id: 'prod-plaster-car-kit',
    titleBn: 'কার পেইন্টিং কিট - ট্রান্সপোর্ট ও যানবাহন প্লাস্টার সেট (৬টি গাড়ি + ৫টি রঙ + কালার গাইড)',
    titleEn: 'Car & Vehicles Plaster Painting Kit',
    slug: 'car-painting-kit',
    categorySlug: 'art-kits',
    basePrice: 1350,
    baseSalePrice: 1050,
    rating: 4.8,
    reviewCount: 64,
    isVariable: true,
    isBestSeller: false,
    isNewArrival: true,
    targetAgeMin: 3,
    targetAgeMax: 9,
    imageUrl: 'https://i.ibb.co/vvrMjH6Q/craftykidsco-car-painting-kit.jpg',
    galleryImages: [
      'https://i.ibb.co/vvrMjH6Q/craftykidsco-car-painting-kit.jpg',
      'https://i.ibb.co/kVrGCzrh/craftykidsco-tool-set.jpg',
      'https://i.ibb.co/v4bLHK3N/craftykidsco-sunny-shores.jpg'
    ],
    badge: 'জনপ্রিয়',
    variations: [
      {
        sku: 'CAR-RACER-4',
        titleBn: 'স্পিড রেসার প্যাক (৪টি গাড়ি + ৪ রঙ + ১ ব্রাশ)',
        titleEn: 'Speed Racer Pack (4 Cars + 4 Colors + 1 Brush)',
        price: 1200,
        salePrice: 950,
        stock: 22,
        imageUrl: 'https://i.ibb.co/vvrMjH6Q/craftykidsco-car-painting-kit.jpg',
        badge: 'Popular'
      },
      {
        sku: 'CAR-GRAND-PRIX-8',
        titleBn: 'গ্র্যান্ড প্রিক্স সেট (৮টি গাড়ি + ৬টি রঙ + ২ ব্রাশ)',
        titleEn: 'Grand Prix Set (8 Cars + 6 Colors + 2 Brushes)',
        price: 1750,
        salePrice: 1420,
        stock: 12,
        imageUrl: 'https://i.ibb.co/kVrGCzrh/craftykidsco-tool-set.jpg',
        badge: 'Best Value'
      },
      {
        sku: 'CAR-ULTIMATE-12',
        titleBn: 'আলটিমেট ট্র্যাক বক্স (১২টি গাড়ি + ৮ রঙ + ৩ ব্রাশ)',
        titleEn: 'Ultimate Track Box (12 Cars + 8 Colors + 3 Brushes)',
        price: 2300,
        salePrice: 1850,
        stock: 4,
        imageUrl: 'https://i.ibb.co/v4bLHK3N/craftykidsco-sunny-shores.jpg',
        badge: 'Only 4 Left'
      }
    ],
    safetyBadges: ['৬টি ভিন্ন যানবাহন মডেল', 'কালার গাইড কার্ড অন্তর্ভুক্ত', '৫টি শেডের কালার পট', 'স্মুথ সারফেস'],
    description: 'ছোট স্পিড ও গাড়িপ্রেমী শিশুদের জন্য স্বপ্নের আর্ট কিট! এই সেটে রয়েছে ৬টি আকর্ষণীয় যানবাহনের প্লাস্টার মডেল—মোটরসাইকেল, স্কুল বাস, ফার্ম ট্রাক্টর, ক্লাসিক প্রাইভেট কার, ডেলিভারি ভ্যান এবং রেসকিউ হেলিকপ্টার। সাথে রয়েছে ৫টি উজ্জ্বল রঙ (লাল, হলুদ, নীল, সবুজ, কালো), কালার গাইড কার্ড এবং ১টি ব্রাশ। শিশুরা পছন্দের কালার কম্বিনেশনে তৈরি করবে তাদের স্বপ্নের স্পিড ভেহিকল!',
    specifications: [
      { label: 'যানবাহনের ধরন', value: 'বাইক, বাস, ট্রাক্টর, প্রাইভেট কার, ভ্যান ও হেলিকপ্টার' },
      { label: 'রঙের সংখ্যা', value: '৫টি রঙ (Red, Yellow, Blue, Green, Black)' },
      { label: 'কালার গাইড', value: 'প্রিন্টেড ফুল কালার রেফারেন্স গাইড রয়েছে' },
      { label: 'বয়সোপযোগী', value: '৩ থেকে ৯ বছর' }
    ],
    careInstructions: 'পেইন্টিং শেষ করার পর ফ্যানের বাতাসে শুকিয়ে নিন।',
    faqs: [
      {
        question: 'গাড়িগুলো কি খেলার সময় ভেঙে যাওয়ার ভয় আছে?',
        answer: 'উচ্চমানের ডেনসিটি জিপসাম প্লাস্টার দিয়ে তৈরি হওয়ায় এটি মজবুত, তবে হাত থেকে মেঝেতে জোরে আছাড় না দেওয়ার নির্দেশনা দেওয়া ভালো।'
      }
    ],
    reviews: [
      {
        id: 'rev-car-1',
        author: 'তানভীর হাসান',
        location: 'মিরপুর, ঢাকা',
        rating: 5,
        date: '২০২৬-১০-১৬',
        comment: 'আমার ছেলে গাড়ির ভক্ত! ট্রাক্টর ও হেলিকপ্টার রঙ করে এখন ড্রয়িং টেবিলে সাজিয়ে রেখেছে। দারুণ প্রোডাক্টিভ অ্যাক্টিভিটি।',
        isVerified: true
      }
    ]
  },
  {
    id: 'prod-plaster-tool-set',
    titleBn: 'টুল সেট প্লাস্টার পেইন্টিং কিট - হ্যান্ডি বিল্ডার (৮টি টুলস + ৪টি রঙ + ১টি ব্রাশ)',
    titleEn: 'Tool Set Plaster Painting Kit - Handy Builder',
    slug: 'tool-set-painting-kit',
    categorySlug: 'art-kits',
    basePrice: 1250,
    baseSalePrice: 999,
    rating: 4.9,
    reviewCount: 35,
    isVariable: false,
    isBestSeller: false,
    isNewArrival: true,
    targetAgeMin: 3,
    targetAgeMax: 10,
    imageUrl: 'https://i.ibb.co/kVrGCzrh/craftykidsco-tool-set.jpg',
    galleryImages: [
      'https://i.ibb.co/kVrGCzrh/craftykidsco-tool-set.jpg',
      'https://i.ibb.co/vvrMjH6Q/craftykidsco-car-painting-kit.jpg'
    ],
    badge: 'নতুন',
    safetyBadges: ['৮টি মেকানিকাল টুলস প্লাস্টার', 'বাস্তব জীবনের শিক্ষামূলক খেলনা', 'নন-টক্সিক ও মসৃণ', 'স্ক্রিন-ফ্রি অ্যাক্টিভিটি'],
    description: 'খেলতে খেলতে মেকানিকাল আইডিয়া ও বাস্তব জিনিষের পরিচয়! ৮টি আকর্ষণীয় বিল্ডার টুলসের প্লাস্টার শেপ—স্ক্রু-ড্রাইভার, অ্যাডজাস্টেবল রেঞ্জ, পাওয়ার ড্রিল, করাত, হাতুড়ি, পাইপ রেঞ্জ, প্লায়ার্স এবং ডাবল ওপেন স্প্যানার। সাথে ৪টি ব্রাইট কালার ও ব্রাশ। ছোট কারিগরদের হ্যান্ড-আই কোঅর্ডিনেশন ও একাগ্রতা বাড়ানোর চমৎকার উপহার।',
    specifications: [
      { label: 'টুলসের সংখ্যা', value: '৮টি বিভিন্ন মেকানিক টুলস' },
      { label: 'রঙের সংখ্যা', value: '৪টি পেইন্ট পট (লাল, হলুদ, নীল, সবুজ)' },
      { label: 'ব্রাশ', value: '১টি অন্তর্ভুক্ত' }
    ],
    careInstructions: 'সাধারণ তাপমাত্রায় শুকিয়ে নিন।',
    faqs: [
      {
        question: 'টুলসগুলো কি আসল টুলের মতো ধারালো?',
        answer: 'একেবারেই না! শিশুদের নিরাপত্তার স্বার্থে প্রতিটি প্লাস্টার টুলের এজ গোলাকার ও মসৃণ রাখা হয়েছে।'
      }
    ]
  },
  {
    id: 'prod-plaster-sunny-shores',
    titleBn: 'সানি শোরস সমুদ্র ও সৈকত মেগা প্লাস্টার পেইন্টিং কিট (১৬টি শেপ)',
    titleEn: 'Sunny Shores Beach & Ocean Mega Plaster Kit',
    slug: 'sunny-shores',
    categorySlug: 'art-kits',
    basePrice: 1400,
    baseSalePrice: 1100,
    rating: 5.0,
    reviewCount: 48,
    isVariable: false,
    isBestSeller: true,
    isNewArrival: false,
    targetAgeMin: 3,
    targetAgeMax: 10,
    imageUrl: 'https://i.ibb.co/v4bLHK3N/craftykidsco-sunny-shores.jpg',
    galleryImages: [
      'https://i.ibb.co/v4bLHK3N/craftykidsco-sunny-shores.jpg',
      'https://i.ibb.co/7J0qh5wC/craftykidsco-ocean-world.jpg'
    ],
    badge: 'মেগা প্যাক',
    safetyBadges: ['১৬টি মেগা প্লাস্টার শেপস', 'সাদা রঙ দিয়ে শেডিং সুবিধা', 'পুরো ফ্যামিলি অ্যাক্টিভিটি'],
    description: 'সমুদ্রের ঢেউ আর বালুকাময় সৈকতের পুরো একটা গল্প ঘরে বসেই! কিটটিতে রয়েছে মোট ১৬টি বৈচিত্র্যময় প্লাস্টার শেপ—হাস্যোজ্জ্বল সূর্য, পাম গাছ, বিচ আমব্রেলা, স্টারফিশ, বাতিঘর (Lighthouse), রাজকীয় স্যান্ডক্যাসেল, বিচ বল, স্যান্ডেল, সানগ্লাস, ঝিনুক ও ক্লাউড। সাথে ৫টি পেইন্ট (গোলাপি, হলুদ, সবুজ, নীল, সাদা) এবং ব্রাশ। বিশাল কালেকশন পরিবারের একাধিক শিশু একসাথে ভাগ করে পেইন্ট করতে পারে!',
    specifications: [
      { label: 'শেপ সংখ্যা', value: '১৬টি অনন্য বিচ ও সামুদ্রিক উপাদান' },
      { label: 'রঙের সংখ্যা', value: '৫টি রঙ (Pink, Yellow, Green, Blue, White)' }
    ]
  },
  {
    id: 'prod-plaster-ocean-world',
    titleBn: 'ওশান ওয়ার্ল্ড সমুদ্রের জলচর প্রাণী প্লাস্টার পেইন্টিং কিট (৮টি মাছ)',
    titleEn: 'Ocean World Sea Life Plaster Painting Kit',
    slug: 'ocean-world-painting-kit',
    categorySlug: 'art-kits',
    basePrice: 1300,
    baseSalePrice: 1050,
    rating: 4.9,
    reviewCount: 52,
    isVariable: false,
    isBestSeller: true,
    isNewArrival: false,
    targetAgeMin: 3,
    targetAgeMax: 9,
    imageUrl: 'https://i.ibb.co/7J0qh5wC/craftykidsco-ocean-world.jpg',
    galleryImages: [
      'https://i.ibb.co/7J0qh5wC/craftykidsco-ocean-world.jpg',
      'https://i.ibb.co/v4bLHK3N/craftykidsco-sunny-shores.jpg'
    ],
    badge: 'সেরা রেটিং',
    safetyBadges: ['৮টি বিভিন্ন মাছ ও জলচর প্রাণী', 'বাস্তবধর্মী থ্রিডি খোদাই', 'নন-টক্সিক ও টেকসই'],
    description: 'গভীর সমুদ্রের রহস্যময় ও রঙিন মাছদের নিয়ে দারুণ এক শিল্পযাত্রা! ৮টি সামুদ্রিক মাছের প্লাস্টার শেপ—অরেঞ্জ ক্লাউনফিশ, গোল্ডফিশ, ফোলানো পাফারফিশ, ফ্লাইং ফিশ, গ্রেট হোয়াইট শার্ক, মিষ্টি সিন্ধুঘোটক (Seahorse) ও টুনা মাছ। সাথে ৫টি পেইন্ট (লাল, হলুদ, সবুজ, নীল, কালো) এবং ফাইন ব্রাশ। সমুদ্রবিজ্ঞান ও কালার মিক্সিংয়ের সেরা মেলবন্ধন!',
    specifications: [
      { label: 'প্রাণীর সংখ্যা', value: '৮টি থ্রিডি সি-লাইফ ফিশ' },
      { label: 'রঙের সংখ্যা', value: '৫টি রঙ (Red, Yellow, Green, Blue, Black)' }
    ]
  },
  {
    id: 'prod-plaster-mixed-kit-1',
    titleBn: 'মিক্সড কিট ১ - সুইট ট্রিটস ও স্কুল অ্যাডভেঞ্চার প্লাস্টার প্যাক (৬টি শেপ)',
    titleEn: 'Mixed Kit 1 - Sweet Treats & Adventure Plaster Set',
    slug: 'mixed-kit-1',
    categorySlug: 'art-kits',
    basePrice: 1200,
    baseSalePrice: 990,
    rating: 4.9,
    reviewCount: 73,
    isVariable: false,
    isBestSeller: true,
    isNewArrival: false,
    targetAgeMin: 2,
    targetAgeMax: 8,
    imageUrl: 'https://i.ibb.co/CsS18B4H/craftykidsco-mixed-kit-1.jpg',
    galleryImages: [
      'https://i.ibb.co/CsS18B4H/craftykidsco-mixed-kit-1.jpg',
      'https://i.ibb.co/HDV4JVJz/craftykidsco-sweet-fruit.jpg',
      'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg'
    ],
    badge: 'টপ সেলার',
    safetyBadges: ['ভ্যারাইটি কম্বো প্যাক', 'ছোট্ট হাতের উপযোগী সাইজ', '১০০% ফুড-গ্রেড ন্যাচারাল জিপসাম'],
    description: 'বাচ্চাদের সব প্রিয় জিনিস এক বক্সে! কিটটিতে রয়েছে ৬টি বৈচিত্র্যময় প্লাস্টার শেপ—রঙিন ডানাওয়ালা প্রজাপতি, মিষ্টি পাকা কলা, স্কুল ব্যাকপ্যাক, চকলেট ডোনাট, সুস্বাদু আইসক্রিম কোন এবং রেইনবো আইস ললি। সাথে ৪টি উজ্জ্বল রঙ ও ব্রাশ। ড্রয়িং ও পেইন্টিং শেখার জন্য দারুণ এক অল-ইন-ওয়ান স্টার্টার সেট।',
    specifications: [
      { label: 'শেপের সংখ্যা', value: '৬টি প্লাস্টার শেপ' },
      { label: 'রঙের সংখ্যা', value: '৪টি রঙ' }
    ]
  },
  {
    id: 'prod-plaster-autumn-nature',
    titleBn: 'অটাম উডল্যান্ড ও ন্যাচার প্লাস্টার পেইন্টিং কিট (৭টি শেপ + উডেন প্যালেট)',
    titleEn: 'Autumn Woodland & Nature Plaster Kit',
    slug: 'autumn-nature-plaster-kit',
    categorySlug: 'art-kits',
    basePrice: 1350,
    baseSalePrice: 1080,
    rating: 5.0,
    reviewCount: 39,
    isVariable: false,
    isBestSeller: true,
    isNewArrival: false,
    targetAgeMin: 3,
    targetAgeMax: 12,
    imageUrl: 'https://i.ibb.co/q35L6xdm/craftykidsco-autumn-nature.jpg',
    galleryImages: [
      'https://i.ibb.co/q35L6xdm/craftykidsco-autumn-nature.jpg',
      'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg'
    ],
    badge: 'কালেক্টরস কিট',
    safetyBadges: ['উডেন প্যালেট অন্তর্ভুক্ত', 'উষ্ণ ও প্রাকৃতিক রঙসমূহ', 'নান্দনিক ড্রয়িং অ্যাক্টিভিটি'],
    description: 'প্রকৃতির শান্ত ও স্নিগ্ধ রূপ নিয়ে বিশেষ অটাম উডল্যান্ড কিট! ৭টি শৈল্পিক প্লাস্টার শেপ—ফ্লাওয়ার পাম্পকিন, ম্যাপল লিফ, তুষার কণা (Snowflake), ক্লাসিক মিষ্টি কুমড়া, কাঠবিড়ালি (Squirrel), বুনো একর্ন (Acorn) এবং ওক পাতা। সাথে উডেন পেইন্ট ট্রে সম্বলিত ৫টি স্পেশাল শেডের রঙ (চকলেট ব্রাউন, অরেঞ্জ, পিংক, পার্পল, গ্রিন) ও ব্রাশ। নান্দনিক রুচির অনন্য স্মারক!',
    specifications: [
      { label: 'শেপ সংখ্যা', value: '৭টি ন্যাচারাল প্লাস্টার শেপ' },
      { label: 'প্যালেট ও রঙ', value: 'কাঠের ট্রের সাথে ৫টি পেইন্ট পট (Chocolate, Orange, Pink, Purple, Green)' }
    ]
  },

  // 1. New Arrivals
  {
    id: 'prod-crayons-24',
    titleBn: 'CraftyKidsCo ন্যাচারাল মোমের রঙ - ২৪ শেড',
    titleEn: 'CraftyKidsCo Natural Wax Crayons - 24 Shade Box',
    slug: 'craftykidsco-natural-wax-crayons-24-shades',
    categorySlug: 'wax-crayons',
    basePrice: 350,
    baseSalePrice: 299,
    rating: 4.9,
    reviewCount: 48,
    isVariable: true,
    isBestSeller: true,
    isNewArrival: true,
    targetAgeMin: 2,
    targetAgeMax: 7,
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-child-drawing-with-crayons-41586-large.mp4',
    badge: 'সেরা অফার',
    safetyBadges: ['১০০% বিষাক্ত নয়', 'ফুড-গ্রেড মোম', 'সহজে ওয়াশেবল'],
    description: 'CraftyKidsCo ন্যাচারাল মোমের রঙ ১০০% খাঁটি মৌচাকের মোম (Pure Beeswax) ও খাদ্য-মানের অর্গানিক পিগমেন্ট দিয়ে তৈরি। বাজারে সাধারণ ক্রেয়নে ক্ষতিকর পেট্রোলিয়াম প্যারাফিন ও লেড থাকে যা শিশুদের মুখে গেলে বিপদের কারণ হতে পারে। আমাদের ক্রেয়ন সম্পূর্ণ নন-টক্সিক ও নিরাপদ। ছোট শিশুদের নরম হাতের মুঠোয় সহজে ধরে আঁকার জন্য বিশেষ ট্রায়াঙ্গুলার মোটা গ্রিপ, যা সহজে ভেঙে যায় না এবং শিশুর হাতের সূক্ষ্ম মোটর স্কিল (Motor Skills) বিকাশে সাহায্য করে।',
    specifications: [
      { label: 'প্রধান উপাদান', value: '১০০% প্রাকৃতিক মৌচাকের মোম (Pure Beeswax) ও ফুড-গ্রেড অর্গানিক রঙ' },
      { label: 'উপযুক্ত বয়সসীমা', value: '২ বছর থেকে ৮ বছর পর্যন্ত' },
      { label: 'সেট অপশন', value: '১২ রঙ / ২৪ রঙ / ৩৬ রঙ ক্লাসিক প্যাক' },
      { label: 'গ্রিপ ডিজাইন', value: 'টডলার ট্রায়াঙ্গুলার চঙ্কি গ্রিপ (হাত থেকে পিছলাবে না, সহজে ভাঙবে না)' },
      { label: 'সার্টিফিকেশন', value: 'EN-71 নন-টক্সিক ও ফুড সেফটি সার্টিফাইড' },
      { label: 'ওয়াশেবল সুবিধা', value: 'কাপড়ে বা টাইলসে দাগ লাগলে সাধারণ সাবান পানিতেই উঠে যায়' },
    ],
    careInstructions: 'তীব্র সূর্যালোক বা অতিরিক্ত তাপ থেকে দূরে সাধারণ ঘরের তাপমাত্রায় ছায়াযুক্ত স্থানে রাখুন। রঙ কাপড়ে লাগলে সাধারণ কুসুম গরম পানি ও মৃদু সাবান দিয়ে ধুয়ে নিলেই পরিষ্কার হয়ে যাবে।',
    faqs: [
      {
        question: 'বাচ্চা অসাবধানতাবশত মুখে দিলে কি কোনো বিষাক্ত ক্ষতি হবে?',
        answer: 'না, আমাদের প্রতিটি ক্রেয়ন ১০০% প্রাকৃতিক ফুড-গ্রেড মৌচাকের মোম দিয়ে তৈরি। এটি সম্পূর্ণ নন-টক্সিক এবং কোনো ক্ষতিকর কেমিক্যাল বা লেড নেই, তাই সম্পূর্ণ নিরাপদ।'
      },
      {
        question: 'কাপড় বা দেয়ালে দাগ লাগলে কি সহজে পরিষ্কার হবে?',
        answer: 'হ্যাঁ, এটি ওয়াশেবল ফর্মুলায় তৈরি। কাপড়, টেবিল বা টাইলসে দাগ লাগলে সাধারণ পানি ও সাবান দিয়ে সহজেই মুছে পরিষ্কার করা যায়।'
      },
      {
        question: 'ঢাকার ভেতরে ও বাইরে ডেলিভারি কত দিনে পাব?',
        answer: 'ঢাকা সিটির ভেতরে ২৪ থেকে ৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ২ থেকে ৩ দিনের মধ্যে স্টিডফাস্ট কুরিয়ারের মাধ্যমে হোম ডেলিভারি পৌঁছে যাবে।'
      },
      {
        question: 'পণ্য হাতে পেয়ে কি দেখে টাকা দেওয়া যাবে?',
        answer: 'হ্যাঁ, আমাদের ১০০% ক্যাশ অন ডেলিভারি (COD) সুবিধা রয়েছে। পার্সেল হাতে পেয়ে চেক করে নিশ্চিন্তে মূল্য পরিশোধ করবেন।'
      }
    ],
    reviews: [
      {
        id: 'rev-1',
        author: 'তানজিলা হক',
        location: 'ধানমন্ডি, ঢাকা',
        rating: 5,
        date: '৫ দিন আগে',
        comment: 'আমার ৩ বছরের মেয়ের জন্য নিয়েছিলাম। রঙগুলো খুব ভাইব্রেন্ট আর স্মুথ। সবচেয়ে বড় কথা মুখে দেওয়ার ভয় নেই কারণ এটা ফুড-গ্রেড মোম দিয়ে তৈরি। ডেলিভারিও খুব দ্রুত পেয়েছি।',
        photos: ['https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=400&q=80'],
        isVerified: true
      },
      {
        id: 'rev-2',
        author: 'ইঞ্জিনিয়ার শরিফুল ইসলাম',
        location: 'জিইসি, চট্টগ্রাম',
        rating: 5,
        date: '১ সপ্তাহ আগে',
        comment: 'প্যাকেজিং এবং ক্রেয়নের কোয়ালিটি অসাধারণ! সাধারণ ক্রেয়ন ভেঙে যেত, কিন্তু এটার গ্রিপ মোটা হওয়ায় বাচ্চারা সহজে ভাঙতে পারে না। ফুল স্যাটিসফাইড।',
        isVerified: true
      },
      {
        id: 'rev-3',
        author: 'নাদিয়া সুলতানা',
        location: 'উত্তরা, ঢাকা',
        rating: 5,
        date: '২ সপ্তাহ আগে',
        comment: 'ওয়াশেবল ফিচারটা সত্যিই কাজ করে! আমার ছেলে দেয়ালে দাগ দিয়েছিল, ভেজা কাপড় দিয়ে মুছতেই দাগ উঠে গেছে। ধন্যবাদ CraftyKidsCo!',
        isVerified: true
      }
    ],
    variations: [
      {
        sku: 'CRAYON-12',
        titleBn: '১২ রঙের প্যাক (স্টার্টার)',
        titleEn: '12 Colors Starter Pack',
        price: 190,
        salePrice: 160,
        stock: 45,
        imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80'
      },
      {
        sku: 'CRAYON-24',
        titleBn: '২৪ রঙের ক্লাসিক বক্স',
        titleEn: '24 Colors Classic Box',
        price: 350,
        salePrice: 299,
        stock: 6, // Low stock: only 6 left!
        imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80'
      },
      {
        sku: 'CRAYON-36',
        titleBn: '৩৬ রঙের মেগা আর্টিস্ট বক্স',
        titleEn: '36 Colors Mega Artist Box',
        price: 490,
        salePrice: 420,
        stock: 25,
        imageUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80'
      },
    ],
  },
  {
    id: 'prod-triangular-12',
    titleBn: 'টডলার ট্রায়াঙ্গুলার গ্রিপ মোম ১২ রঙ (ভাঙবে না)',
    titleEn: 'Toddler Triangular Grip Chunky Crayons 12 Set',
    slug: 'toddler-triangular-grip-crayons-12',
    categorySlug: 'wax-crayons',
    basePrice: 260,
    baseSalePrice: 220,
    rating: 4.8,
    reviewCount: 32,
    isVariable: false,
    isBestSeller: true,
    isNewArrival: true,
    targetAgeMin: 1,
    targetAgeMax: 4,
    imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
    badge: '-১৫%',
  },
  {
    id: 'prod-play-dough-6',
    titleBn: 'সুপার সফট প্লে-ডো ৬ রঙের সেট + ৪টি শেপ কাটার',
    titleEn: 'Super Soft Play Dough 6-Color Tub Set with Cutters',
    slug: 'super-soft-play-dough-6-color-tub-set',
    categorySlug: 'play-dough-clay',
    basePrice: 320,
    baseSalePrice: 275,
    rating: 5.0,
    reviewCount: 29,
    isVariable: false,
    isBestSeller: false,
    isNewArrival: true,
    targetAgeMin: 2,
    targetAgeMax: 8,
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    badge: 'জনপ্রিয়',
  },
  {
    id: 'prod-wooden-puzzle',
    titleBn: 'বাংলা বর্ণমালা কাঠের লার্নিং পাজল বোর্ড',
    titleEn: 'Bangla & English Wooden Learning Puzzle Board',
    slug: 'wooden-learning-puzzle-board',
    categorySlug: 'wooden-toys',
    basePrice: 420,
    baseSalePrice: 360,
    rating: 4.9,
    reviewCount: 54,
    isVariable: false,
    isBestSeller: false,
    isNewArrival: true,
    targetAgeMin: 3,
    targetAgeMax: 6,
    imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
    badge: 'সেরা মান',
  },
  {
    id: 'prod-sketchbook-a4',
    titleBn: 'বাচ্চাদের মোটা আর্ট ও কালারিং ড্রয়িং প্যাড (৪০ পাতা)',
    titleEn: 'Kids Premium Heavyweight Art & Drawing Pad 40 Sheets',
    slug: 'kids-premium-art-drawing-pad-40-sheets',
    categorySlug: 'sketchbooks',
    basePrice: 240,
    baseSalePrice: 190,
    rating: 4.7,
    reviewCount: 19,
    isVariable: false,
    isBestSeller: false,
    isNewArrival: true,
    targetAgeMin: 2,
    targetAgeMax: 10,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    badge: '-২০%',
  },

  // 2. Best Sellers
  {
    id: 'prod-crayons-36',
    titleBn: 'মেগা আর্টিস্ট ৩৬ কালার স্পেশাল ক্রাফট বক্স',
    titleEn: 'Mega Artist 36 Color Special Craft Box',
    slug: 'mega-artist-36-color-special-craft-box',
    categorySlug: 'wax-crayons',
    basePrice: 490,
    baseSalePrice: 420,
    rating: 5.0,
    reviewCount: 68,
    isVariable: false,
    isBestSeller: true,
    targetAgeMin: 3,
    targetAgeMax: 9,
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
    badge: 'টপ সেলার',
  },
  {
    id: 'prod-wood-blocks-50',
    titleBn: 'কালারফুল কাঠের জিওমেট্রিক স্ট্যাকিং ব্লকস (৫০ পিস)',
    titleEn: 'Colorful Wooden Geometric Stacking Blocks 50 Pcs',
    slug: 'colorful-wooden-geometric-stacking-blocks',
    categorySlug: 'wooden-toys',
    basePrice: 550,
    baseSalePrice: 460,
    rating: 4.9,
    reviewCount: 42,
    isVariable: false,
    isBestSeller: true,
    targetAgeMin: 2,
    targetAgeMax: 6,
    imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80',
    badge: 'হট',
  },
  {
    id: 'prod-glitter-crayons',
    titleBn: 'স্পার্কল গ্লিটার মোমের রঙ ১২ কালার প্যাক',
    titleEn: 'Sparkle Glitter Wax Crayons 12 Color Pack',
    slug: 'sparkle-glitter-wax-crayons-12',
    categorySlug: 'wax-crayons',
    basePrice: 290,
    baseSalePrice: 250,
    rating: 4.8,
    reviewCount: 27,
    isVariable: false,
    isBestSeller: true,
    targetAgeMin: 3,
    targetAgeMax: 8,
    imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
    badge: '-১৪%',
  },
  {
    id: 'prod-montessori-clock',
    titleBn: 'মন্টেসরি কাঠের সময় ও শেপ লার্নিং ক্লক',
    titleEn: 'Montessori Wooden Time & Shape Learning Clock',
    slug: 'montessori-wooden-time-shape-learning-clock',
    categorySlug: 'educational-toys',
    basePrice: 450,
    baseSalePrice: 380,
    rating: 4.9,
    reviewCount: 35,
    isVariable: false,
    isBestSeller: true,
    targetAgeMin: 3,
    targetAgeMax: 7,
    imageUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=600&q=80',
    badge: 'সেরা উপহার',
  },
  {
    id: 'prod-clay-animal-kit',
    titleBn: 'মডেলিং ক্লে কিট + ৮টি অ্যানিম্যাল শেপ কাটার ও রোলার',
    titleEn: 'Modeling Clay Kit with 8 Animal Cutters and Roller',
    slug: 'modeling-clay-kit-animal-cutters',
    categorySlug: 'play-dough-clay',
    basePrice: 380,
    baseSalePrice: 320,
    rating: 4.8,
    reviewCount: 31,
    isVariable: false,
    isBestSeller: true,
    targetAgeMin: 2,
    targetAgeMax: 8,
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    badge: '-১৫%',
  },

  // 3. Wax Crayons Category Showcase
  {
    id: 'prod-crayons-12',
    titleBn: 'CraftyKidsCo ১২ শেড স্টার্টার মোম রঙ',
    titleEn: 'CraftyKidsCo 12 Shades Starter Wax Crayons',
    slug: 'craftykidsco-12-shades-starter-wax-crayons',
    categorySlug: 'wax-crayons',
    basePrice: 190,
    baseSalePrice: 160,
    rating: 4.8,
    reviewCount: 22,
    isVariable: false,
    isBestSeller: false,
    targetAgeMin: 2,
    targetAgeMax: 5,
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
    badge: '-১৬%',
  },
  {
    id: 'prod-crayons-jumbo',
    titleBn: 'জাম্বো গ্রিপ ওয়াশেবল মোমের রঙ (৮ রঙ)',
    titleEn: 'Jumbo Grip Washable Wax Crayons 8 Colors',
    slug: 'jumbo-grip-washable-wax-crayons-8',
    categorySlug: 'wax-crayons',
    basePrice: 280,
    baseSalePrice: 240,
    rating: 4.9,
    reviewCount: 19,
    isVariable: false,
    isBestSeller: false,
    targetAgeMin: 1,
    targetAgeMax: 4,
    imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
    badge: 'ওয়াশেবল',
  },
  {
    id: 'prod-crayons-metallic',
    titleBn: 'মেটালিক শাইন মোমের রঙ ৮ কালার সেট',
    titleEn: 'Metallic Shine Wax Crayons 8 Color Set',
    slug: 'metallic-shine-wax-crayons-8',
    categorySlug: 'wax-crayons',
    basePrice: 320,
    baseSalePrice: 270,
    rating: 4.7,
    reviewCount: 14,
    isVariable: false,
    isBestSeller: false,
    targetAgeMin: 3,
    targetAgeMax: 9,
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
    badge: 'মেটালিক',
  },
  {
    id: 'prod-crayons-pastel',
    titleBn: 'সফট প্যাস্টেল মোম আর্ট প্যাক (১২ শেড)',
    titleEn: 'Soft Pastel Wax Art Pack 12 Shades',
    slug: 'soft-pastel-wax-art-pack-12',
    categorySlug: 'wax-crayons',
    basePrice: 310,
    baseSalePrice: 260,
    rating: 4.8,
    reviewCount: 18,
    isVariable: false,
    isBestSeller: false,
    targetAgeMin: 3,
    targetAgeMax: 10,
    imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
    badge: '-১৬%',
  },

  // 4. Play Dough & Clay Category Showcase
  {
    id: 'prod-clay-basic-4',
    titleBn: 'আর্টক্লে ৪ বেসিক কালার টাব প্যাক',
    titleEn: 'ArtClay 4 Basic Color Tub Pack',
    slug: 'artclay-4-basic-color-tub-pack',
    categorySlug: 'play-dough-clay',
    basePrice: 220,
    baseSalePrice: 190,
    rating: 4.6,
    reviewCount: 12,
    isVariable: false,
    isBestSeller: false,
    targetAgeMin: 2,
    targetAgeMax: 6,
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    badge: 'নন-টক্সিক',
  },
  {
    id: 'prod-clay-8-colors',
    titleBn: 'প্লে-ডো ৮ রঙের ফান মেগা প্যাক',
    titleEn: 'Play Dough 8 Color Fun Mega Pack',
    slug: 'play-dough-8-color-fun-mega-pack',
    categorySlug: 'play-dough-clay',
    basePrice: 370,
    baseSalePrice: 320,
    rating: 4.9,
    reviewCount: 28,
    isVariable: false,
    isBestSeller: false,
    targetAgeMin: 2,
    targetAgeMax: 8,
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    badge: '-১৩%',
  },
  {
    id: 'prod-clay-tools-12',
    titleBn: 'মডেলিং ক্লে টুলকিট - ১২ পিস কাটার ও শেপার',
    titleEn: 'Modeling Clay Toolkit 12 Pcs Cutters and Shapers',
    slug: 'modeling-clay-toolkit-12-pcs',
    categorySlug: 'play-dough-clay',
    basePrice: 260,
    baseSalePrice: 210,
    rating: 4.7,
    reviewCount: 16,
    isVariable: false,
    isBestSeller: false,
    targetAgeMin: 3,
    targetAgeMax: 9,
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    badge: 'টুলস',
  },
  {
    id: 'prod-clay-bucket',
    titleBn: 'আর্টক্লে আলটিমেট ক্রাফট স্টোরেজ বাকেট',
    titleEn: 'ArtClay Ultimate Craft Storage Bucket Set',
    slug: 'artclay-ultimate-craft-bucket-set',
    categorySlug: 'play-dough-clay',
    basePrice: 560,
    baseSalePrice: 490,
    rating: 5.0,
    reviewCount: 34,
    isVariable: false,
    isBestSeller: true,
    targetAgeMin: 2,
    targetAgeMax: 9,
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    badge: 'মেগা প্যাক',
  },

  // 5. Educational & Wooden Toys Category Showcase
  {
    id: 'prod-wood-rainbow-arch',
    titleBn: 'ন্যাচারাল কাঠের রেইনবো স্ট্যাকিং আর্চ',
    titleEn: 'Natural Wooden Rainbow Stacking Arch',
    slug: 'natural-wooden-rainbow-stacking-arch',
    categorySlug: 'wooden-toys',
    basePrice: 480,
    baseSalePrice: 420,
    rating: 4.9,
    reviewCount: 23,
    isVariable: false,
    isBestSeller: false,
    targetAgeMin: 2,
    targetAgeMax: 6,
    imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80',
    badge: '-১২%',
  },
  {
    id: 'prod-brain-wooden-maze',
    titleBn: 'ব্রেইন বুস্টার উডেন ম্যাগনেটিক বল মেজ গেম',
    titleEn: 'Brain Booster Wooden Magnetic Ball Maze Game',
    slug: 'brain-booster-wooden-magnetic-ball-maze',
    categorySlug: 'educational-toys',
    basePrice: 330,
    baseSalePrice: 280,
    rating: 4.8,
    reviewCount: 17,
    isVariable: false,
    isBestSeller: false,
    targetAgeMin: 3,
    targetAgeMax: 7,
    imageUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=600&q=80',
    badge: 'ব্রেইন গেম',
  },
  {
    id: 'prod-wood-abacus',
    titleBn: 'ক্লাসিক উডেন কাউন্টিং অ্যাবাকাস ফ্রেম',
    titleEn: 'Classic Wooden Counting Abacus Frame',
    slug: 'classic-wooden-counting-abacus-frame',
    categorySlug: 'educational-toys',
    basePrice: 390,
    baseSalePrice: 330,
    rating: 4.7,
    reviewCount: 21,
    isVariable: false,
    isBestSeller: false,
    targetAgeMin: 3,
    targetAgeMax: 8,
    imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
    badge: '-১৫%',
  },
  {
    id: 'prod-animal-wood-puzzle',
    titleBn: 'প্রাণীদের ছবি সম্বলিত থ্রিডি কাঠের পাজল',
    titleEn: '3D Wooden Animal Knob Learning Puzzle',
    slug: '3d-wooden-animal-knob-learning-puzzle',
    categorySlug: 'wooden-toys',
    basePrice: 360,
    baseSalePrice: 310,
    rating: 4.9,
    reviewCount: 25,
    isVariable: false,
    isBestSeller: false,
    targetAgeMin: 2,
    targetAgeMax: 5,
    imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80',
    badge: 'টপ রেটেড',
  },

  // --- SKETCHBOOKS (ড্রয়িং খাতা) ---
  {
    id: 'prod-sketchbook-spiral-a3',
    titleBn: 'প্রিমিয়াম স্পাইরাল বাউন্ড জাম্বো আর্ট প্যাড (A3 সাইজ, ৫০ পাতা)',
    titleEn: 'Premium Spiral Bound Jumbo Art Pad (A3 Size, 50 Sheets)',
    slug: 'premium-spiral-jumbo-art-pad-a3',
    categorySlug: 'sketchbooks',
    basePrice: 450,
    baseSalePrice: 380,
    rating: 4.8,
    reviewCount: 16,
    isVariable: false,
    isBestSeller: false,
    isNewArrival: true,
    targetAgeMin: 2,
    targetAgeMax: 10,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    badge: 'বড় সাইজ',
    description: '১৬০ জিএসএম মোটা এসিড-ফ্রি কাগজের বড় সাইজের ড্রয়িং প্যাড। মোমের রঙ, তেল রঙ ও জলরঙে ছবি আঁকার জন্য সেরা।',
    safetyBadges: ['১৬০ GSM হেভিওয়েট পেপার', 'ইকো-ফ্রেন্ডলি এসিড-ফ্রি', 'মোমের রঙ ফ্রেন্ডলি'],
  },
  {
    id: 'prod-sketchbook-pocket-set',
    titleBn: 'পকেট ডুডলিং ও ট্রাভেল স্কেচবুক কম্বো (৩টি প্যাক)',
    titleEn: 'Pocket Doodling & Travel Sketchbook Combo (Pack of 3)',
    slug: 'pocket-doodling-travel-sketchbook-3-pack',
    categorySlug: 'sketchbooks',
    basePrice: 350,
    baseSalePrice: 280,
    rating: 4.9,
    reviewCount: 22,
    isVariable: false,
    isBestSeller: true,
    isNewArrival: false,
    targetAgeMin: 2,
    targetAgeMax: 8,
    imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
    badge: '৩টি প্যাক',
    description: 'ভ্রমণ বা গাড়িতে বসে ডুডলিং ও স্কেচ করার জন্য পকেট সাইজ ৩টি কালারফুল আর্ট প্যাড।',
    safetyBadges: ['কমপ্যাক্ট ট্রাভেল সাইজ', '১০০% স্মুথ পেপার', 'রঙিন কাভার ডিজাইন'],
  },
  {
    id: 'prod-sketchbook-watercolor-pad',
    titleBn: 'টেক্সচার্ড ওয়াটারকালার ও মোমের রঙ স্পেশাল আর্ট পেপার (A4)',
    titleEn: 'Textured Watercolor & Crayon Heavyweight Art Pad (A4)',
    slug: 'textured-watercolor-crayon-art-pad-a4',
    categorySlug: 'sketchbooks',
    basePrice: 420,
    baseSalePrice: 350,
    rating: 4.7,
    reviewCount: 14,
    isVariable: false,
    isBestSeller: false,
    isNewArrival: true,
    targetAgeMin: 3,
    targetAgeMax: 12,
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
    badge: '২০০ GSM',
    description: '২০০ জিএসএম হেভি টেক্সচার্ড আর্ট পেপার। রঙ সহজে ছড়িয়ে পড়ে না এবং কাগজ ভাঁজ বা নষ্ট হয় না।',
    safetyBadges: ['২০০ GSM ওয়াটারপ্রুফ পেপার', 'ন্যাচারাল টেক্সচার', 'বাচ্চাদের উপযোগী'],
  },

  // --- PUZZLES (পাজল গেম) ---
  {
    id: 'prod-puzzle-wooden-bangla',
    titleBn: 'বাংলা বর্ণমালা ও স্বরবর্ণ কাঠের লার্নিং পাজল বোর্ড',
    titleEn: 'Bangla Alphabet Wooden Learning Puzzle Board',
    slug: 'bangla-alphabet-wooden-learning-puzzle-board',
    categorySlug: 'puzzles',
    basePrice: 480,
    baseSalePrice: 390,
    rating: 5.0,
    reviewCount: 48,
    isVariable: false,
    isBestSeller: true,
    isNewArrival: false,
    targetAgeMin: 2,
    targetAgeMax: 6,
    imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
    badge: 'টপ সেলার',
    description: 'ছোট্টমণিদের বাংলা বর্ণমালা শেখার আকর্ষণীয় কাঠের পাজল। মসৃণ ফিনিশ ও নন-টক্সিক জলরং ব্যবহার করা হয়েছে।',
    safetyBadges: ['ন্যাচারাল ফাইন পাইন উড', 'স্মুথ ও নিরাপদ এজ', 'নন-টক্সিক নিরাপদ রঙ'],
  },
  {
    id: 'prod-puzzle-animal-jigsaw',
    titleBn: 'ওয়াইল্ড অ্যানিমেল ফ্লোর জিগস পাজল (৪৮ পিস)',
    titleEn: 'Wild Animal Safari Floor Jigsaw Puzzle (48 Pcs)',
    slug: 'wild-animal-safari-floor-jigsaw-puzzle-48',
    categorySlug: 'puzzles',
    basePrice: 650,
    baseSalePrice: 520,
    rating: 4.9,
    reviewCount: 31,
    isVariable: false,
    isBestSeller: false,
    isNewArrival: true,
    targetAgeMin: 3,
    targetAgeMax: 8,
    imageUrl: 'https://images.unsplash.com/photo-1618842676088-c4d48a6a7c9d?auto=format&fit=crop&w=600&q=80',
    badge: 'বড় পাজল',
    description: 'বাচ্চাদের মেঝেতে বসে সমাধান করার জন্য বড় সাইজের রঙিন ৪৮ পিস সাফারী প্রাণী জিগস পাজল।',
    safetyBadges: ['মোটা ও মজবুত বোর্ড', 'সহজে পরিষ্কারযোগ্য', 'ব্রেইন ডেভেলপমেন্ট'],
  },
  {
    id: 'prod-puzzle-world-map',
    titleBn: 'কিডস ম্যাগনেটিক ওয়ার্ল্ড ম্যাপ ও কান্ট্রি পাজল',
    titleEn: 'Kids Magnetic World Map & Country Learning Puzzle',
    slug: 'kids-magnetic-world-map-country-learning-puzzle',
    categorySlug: 'puzzles',
    basePrice: 850,
    baseSalePrice: 690,
    rating: 4.8,
    reviewCount: 19,
    isVariable: false,
    isBestSeller: false,
    isNewArrival: true,
    targetAgeMin: 4,
    targetAgeMax: 10,
    imageUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=600&q=80',
    badge: 'শিক্ষণীয়',
    description: 'বিশ্বের বিভিন্ন দেশ ও মহাদেশ সহজে চেনার ম্যাগনেটিক বোর্ড পাজল। ভূগোল ও মেধার বিকাশে সহায়ক।',
    safetyBadges: ['নিরাপদ ম্যাগনেট', 'প্রাণবন্ত কালার প্রিন্ট', 'টেকসই কাঠের ফ্রেম'],
  },
  {
    id: 'prod-puzzle-shape-sorter',
    titleBn: 'মন্টেসরি জিওমেট্রিক শেপ সর্টিং কাঠের পাজল',
    titleEn: 'Montessori Geometric Shape Sorting Wooden Puzzle',
    slug: 'montessori-geometric-shape-sorting-wooden-puzzle',
    categorySlug: 'puzzles',
    basePrice: 520,
    baseSalePrice: 420,
    rating: 4.9,
    reviewCount: 27,
    isVariable: false,
    isBestSeller: false,
    isNewArrival: false,
    targetAgeMin: 1,
    targetAgeMax: 4,
    imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80',
    badge: '১-৪ বছর',
    description: 'বৃত্ত, ত্রিভুজ, বর্গ সহ বিভিন্ন জ্যামিতিক আকার ও রঙের ব্লক মেলানোর আকর্ষণীয় টডলার পাজল।',
    safetyBadges: ['১০০% ন্যাচারাল উড', 'বিপিএ ফ্রি', 'মোটর স্কিল ডেভেলপমেন্ট'],
  },

  // --- GIFT SETS (উপহার সেট) ---
  {
    id: 'prod-gift-art-deluxe',
    titleBn: 'CraftyKids আল্টিমেট ক্রিয়েটিভ আর্ট গিফট বক্স (মেগা কম্বো)',
    titleEn: 'CraftyKids Ultimate Creative Art Gift Box (Mega Combo)',
    slug: 'craftykids-ultimate-creative-art-gift-box',
    categorySlug: 'gift-sets',
    basePrice: 2400,
    baseSalePrice: 1890,
    rating: 5.0,
    reviewCount: 63,
    isVariable: false,
    isBestSeller: true,
    isNewArrival: true,
    targetAgeMin: 2,
    targetAgeMax: 10,
    imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
    badge: 'মেগা কম্বো',
    description: 'জন্মদিন বা বিশেষ দিনের সেরা প্রিমিয়াম উপহার বক্স। এতে রয়েছে মোমের রঙ, প্লাস্টার পেইন্টিং কিট, প্লে-ডো ও ড্রয়িং খাতা।',
    safetyBadges: ['লাক্সারি গিফট প্যাকেজিং', '৪-ইন-১ কমপ্লিট কিট', '১০০% নন-টক্সিক'],
  },
  {
    id: 'prod-gift-birthday-special',
    titleBn: 'ছোট সোনামণির প্রথম ড্রয়িং ও ক্রাফট গিফট হ্যাম্পার',
    titleEn: 'Little Artist First Drawing & Craft Gift Hamper',
    slug: 'little-artist-first-drawing-craft-gift-hamper',
    categorySlug: 'gift-sets',
    basePrice: 1500,
    baseSalePrice: 1250,
    rating: 4.9,
    reviewCount: 38,
    isVariable: false,
    isBestSeller: false,
    isNewArrival: true,
    targetAgeMin: 1,
    targetAgeMax: 6,
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
    badge: 'উপহার বক্স',
    description: 'ছোটদের সৃজনশীলতার শুরু করার জন্য সুন্দর রিবন দিয়ে সাজানো আর্ট গিফট হ্যাম্পার।',
    safetyBadges: ['রেডি-টু-গিফট প্যাকেজিং', 'প্রিমিয়াম কোয়ালিটি', 'ফ্রি গ্রিটিং কার্ড'],
  },
  {
    id: 'prod-gift-toddler-starter',
    titleBn: 'টডলার সেন্সরি টয় ও প্লে-ডো এক্সপ্লোরার গিফট প্যাক',
    titleEn: 'Toddler Sensory Toy & Play-Dough Explorer Gift Pack',
    slug: 'toddler-sensory-toy-playdough-gift-pack',
    categorySlug: 'gift-sets',
    basePrice: 1200,
    baseSalePrice: 950,
    rating: 4.8,
    reviewCount: 29,
    isVariable: false,
    isBestSeller: false,
    isNewArrival: false,
    targetAgeMin: 1,
    targetAgeMax: 4,
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    badge: 'টডলার ফেভারিট',
    description: '১ থেকে ৪ বছরের শিশুর স্পর্শ ও রঙের অনুভূতি বিকাশের জন্য নিরাপদ প্লে-ডো ও উডেন সেন্সরি খেলনা।',
    safetyBadges: ['খাদ্য মানের উপাদান', 'স্পর্শ ও দৃষ্টির বিকাশ', 'স্মুথ উড'],
  },
  {
    id: 'prod-gift-plaster-bundle',
    titleBn: 'প্লাস্টার আর্ট ডাবল ডিলাইট গিফট বান্ডেল (২টি সম্পূর্ণ কিট)',
    titleEn: 'Plaster Art Double Delight Gift Bundle (2 Complete Kits)',
    slug: 'plaster-art-double-delight-gift-bundle',
    categorySlug: 'gift-sets',
    basePrice: 2100,
    baseSalePrice: 1690,
    rating: 4.9,
    reviewCount: 42,
    isVariable: false,
    isBestSeller: true,
    isNewArrival: true,
    targetAgeMin: 3,
    targetAgeMax: 9,
    imageUrl: 'https://i.ibb.co/CsS18B4H/craftykidsco-mixed-kit-1.jpg',
    badge: 'বেস্ট ভ্যালু',
    description: 'সুইট ফ্রুট কিট ও কার পেইন্টিং কিটের দুর্দান্ত ডাবল প্যাক কম্বো। ভাই-বোন বা বন্ধুর সাথে একসাথে খেলার সেরা উপহার।',
    safetyBadges: ['১০টি প্লাস্টার মডেল', '৮টি কালার পট ও ২টি ব্রাশ', '১০০% নন-টক্সিক'],
  },

  // --- EDUCATIONAL TOYS (শিক্ষামূলক) ---
  {
    id: 'prod-edu-math-balance',
    titleBn: 'মন্টেসরি বানর ম্যাথ ব্যালেন্স কাউন্টিং স্কেল গেম',
    titleEn: 'Montessori Monkey Math Balance Counting Scale Game',
    slug: 'montessori-monkey-math-balance-counting-game',
    categorySlug: 'educational-toys',
    basePrice: 750,
    baseSalePrice: 590,
    rating: 4.9,
    reviewCount: 35,
    isVariable: false,
    isBestSeller: true,
    isNewArrival: true,
    targetAgeMin: 3,
    targetAgeMax: 8,
    imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
    badge: 'মজার গণিত',
    description: 'ওজন ও সংখ্যার ভারসাম্যের মাধ্যমে বাচ্চাদের যোগ-বিয়োগ ও সংখ্যা গণনা শেখার আকর্ষণীয় ব্যালেন্স গেম।',
    safetyBadges: ['STEM লার্নিং টয়', 'বিপিএ ফ্রি নিরাপদ প্লাস্টিক', 'মজার খেলার ছলে শিক্ষা'],
  },
  {
    id: 'prod-edu-wooden-gears',
    titleBn: 'কগনিটিভ স্পিনিং গিয়ার্স ও মেকানিক্স উডেন বোর্ড',
    titleEn: 'Cognitive Spinning Gears & Mechanics Wooden Activity Board',
    slug: 'cognitive-spinning-gears-mechanics-wooden-board',
    categorySlug: 'educational-toys',
    basePrice: 680,
    baseSalePrice: 540,
    rating: 4.8,
    reviewCount: 24,
    isVariable: false,
    isBestSeller: false,
    isNewArrival: true,
    targetAgeMin: 2,
    targetAgeMax: 6,
    imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80',
    badge: 'STEM খেলনা',
    description: 'রঙিন চাকা বা গিয়ার ঘুরিয়ে শিশুরা মেকানিক্সের প্রাথমিক ধারণা পায় এবং হাত-চোখের সমন্বয় বাড়ায়।',
    safetyBadges: ['মসৃণ ফিনিশড কাঠ', 'হাত-চোখের সমন্বয়', 'নন-টক্সিক পেস্ট কালার'],
  },

  // --- WOODEN TOYS (কাঠের খেলনা) ---
  {
    id: 'prod-wood-car-track',
    titleBn: 'ন্যাচারাল উডেন র‍্যাম্প রেসার ও ৪টি মিনি উডেন কার',
    titleEn: 'Natural Wooden Ramp Racer Track with 4 Mini Wooden Cars',
    slug: 'natural-wooden-ramp-racer-track-4-cars',
    categorySlug: 'wooden-toys',
    basePrice: 950,
    baseSalePrice: 780,
    rating: 4.9,
    reviewCount: 39,
    isVariable: false,
    isBestSeller: true,
    isNewArrival: true,
    targetAgeMin: 1,
    targetAgeMax: 5,
    imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80',
    badge: 'টপ সেলার',
    description: '৪ স্তরের উডেন র‍্যাম্প ট্র্যাক যার ওপর দিয়ে ছোট কাঠের গাড়িগুলো দ্রুত গতিতে নিচে নেমে আসে। বাচ্চাদের অত্যন্ত প্রিয়।',
    safetyBadges: ['১০০% বিচ উড মেটেরিয়াল', 'ওয়াটার-বেসড পেইন্ট', 'স্মুথ ও রাউন্ড এজ'],
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
