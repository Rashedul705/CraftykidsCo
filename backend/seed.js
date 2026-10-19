require('dotenv').config();
const { connectDB, mongoose } = require('./db');
const Product = require('./models/Product');
const Category = require('./models/Category');

const IMGBB_URLS = {
  sweetFruit: 'https://i.ibb.co/HDV4JVJz/craftykidsco-sweet-fruit.jpg',
  littleBug: 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg',
  carKit: 'https://i.ibb.co/vvrMjH6Q/craftykidsco-car-painting-kit.jpg',
  toolSet: 'https://i.ibb.co/kVrGCzrh/craftykidsco-tool-set.jpg',
  sunnyShores: 'https://i.ibb.co/v4bLHK3N/craftykidsco-sunny-shores.jpg',
  oceanWorld: 'https://i.ibb.co/7J0qh5wC/craftykidsco-ocean-world.jpg',
  mixedKit1: 'https://i.ibb.co/CsS18B4H/craftykidsco-mixed-kit-1.jpg',
  autumnNature: 'https://i.ibb.co/q35L6xdm/craftykidsco-autumn-nature.jpg'
};

const categoriesToSeed = [
  {
    slug: 'art-kits',
    nameBn: 'আর্ট কিট',
    nameEn: 'Art Kits',
    description: 'রঙ, ব্রাশ ও থ্রিডি প্লাস্টার শেপ নিয়ে ক্রিয়েট • পেইন্ট • প্লে কিটস',
    imageUrl: IMGBB_URLS.littleBug,
    badgeColor: '#FFE0B2',
    children: [
      { slug: 'plaster-kits', nameBn: 'প্লাস্টার পেইন্টিং', nameEn: 'Plaster Painting' },
      { slug: 'diy-crafts', nameBn: 'ডিআইওয়াই ক্রাফটস', nameEn: 'DIY Crafts' }
    ]
  },
  {
    slug: 'wax-crayons',
    nameBn: 'মোমের রঙ',
    nameEn: 'Wax Crayons',
    description: '১০০% প্রাকৃতিক ও নিরাপদ খাদ্য মানের মোম দিয়ে তৈরি রঙিন ক্রেয়ন',
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=400&q=80',
    badgeColor: '#FFE8D6',
    children: [
      { slug: 'chunky-toddler-crayons', nameBn: 'ছোটদের মোটা মোম', nameEn: 'Chunky Toddler Crayons' },
      { slug: 'washable-crayons', nameBn: 'ওয়াশেবল মোমের রঙ', nameEn: 'Washable Crayons' }
    ]
  },
  {
    slug: 'play-dough-clay',
    nameBn: 'ক্লে ও ডো',
    nameEn: 'Clay & Dough',
    description: 'নরম, সুবাসিত ও ১০০% নন-টক্সিক রঙিন মডেলিং প্লে-ডো',
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=400&q=80',
    badgeColor: '#E1F5FE',
    children: []
  },
  {
    slug: 'sketchbooks',
    nameBn: 'ড্রয়িং খাতা',
    nameEn: 'Drawing Books',
    description: 'মোটা প্রিমিয়াম কাগজের আর্ট ও ড্রয়িং স্কেচ প্যাড',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
    badgeColor: '#E8F5E9',
    children: []
  },
  {
    slug: 'wooden-toys',
    nameBn: 'কাঠের খেলনা',
    nameEn: 'Wooden Toys',
    description: 'মসৃণ ও টেকসই ন্যাচারাল কাঠের পরিবেশবান্ধব খেলনা',
    imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=400&q=80',
    badgeColor: '#FCE4EC',
    children: []
  },
  {
    slug: 'educational-toys',
    nameBn: 'শিক্ষামূলক',
    nameEn: 'Educational',
    description: 'মন্টেসরি মেথড লার্নিং বোর্ড ও আর্লি চাইল্ডহুড ডেভেলপমেন্ট কিটস',
    imageUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=400&q=80',
    badgeColor: '#EDE7F6',
    children: []
  },
  {
    slug: 'puzzles',
    nameBn: 'পাজল গেম',
    nameEn: 'Puzzles',
    description: 'শিশুর মেধা ও একাগ্রতা বিকাশের মজাদার ব্রেইন পাজল',
    imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=400&q=80',
    badgeColor: '#FFF9C4',
    children: []
  },
  {
    slug: 'gift-sets',
    nameBn: 'উপহার সেট',
    nameEn: 'Gift Sets',
    description: 'জন্মদিন ও বিশেষ উপহারের প্রিমিয়াম গিফট কম্বো প্যাক',
    imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80',
    badgeColor: '#FFEBEE',
    children: []
  }
];

const productsToSeed = [
  // 1. Sweet Fruit Painting Kit
  {
    id: 'prod-plaster-sweet-fruit',
    title: 'Sweet Fruit Painting Kit',
    titleBn: 'সুইট ফ্রুট প্লাস্টার পেইন্টিং কিট (৬টি ফল + ৪টি রঙ + ১টি ব্রাশ)',
    titleEn: 'Sweet Fruit Painting Kit',
    slug: 'sweet-fruit-painting-kit',
    price: 1200,
    basePrice: 1200,
    salePrice: 990,
    baseSalePrice: 990,
    category: 'Fruits & Sweet Treats',
    categorySlug: 'art-kits',
    description: 'রসালো ও রঙিন ফলের আনন্দময় ভুবন! এই কিটে রয়েছে ৬টি সুদৃশ্য সাদা প্লাস্টার ফলের আকৃতি—আনারস, নাশপাতি, আঙ্গুর, লাল স্ট্রবেরি, রসালো তরমুজের স্লাইস এবং মিষ্টি কলা। সাথে থাকছে ৪টি ব্রাইট পেইন্ট পট (লাল, হলুদ, নীল, সবুজ) এবং ১টি পেইন্টিং ব্রাশ। শিশুরা নিজে নিজে রঙ করে বিভিন্ন ফল চিনবে এবং তাদের ক্রিয়েটিভিটি প্রকাশ করবে।',
    pieces: '৬টি প্লাস্টার ফল + ৪টি ওয়াশেবল পেইন্ট + ১টি ব্রাশ',
    badge: 'সেরা উপহার',
    rating: 4.9,
    reviewsCount: 42,
    reviewCount: 42,
    image: IMGBB_URLS.sweetFruit,
    imageUrl: IMGBB_URLS.sweetFruit,
    galleryImages: [
      IMGBB_URLS.sweetFruit,
      IMGBB_URLS.littleBug,
      IMGBB_URLS.mixedKit1
    ],
    accentColor: '#FCE4EC',
    tagColor: 'bg-pink-100 text-pink-800',
    isNewArrival: true,
    isBestSeller: false,
    targetAgeMin: 2,
    targetAgeMax: 8,
    safetyBadges: ['১০০% ফুড-গ্রেড ন্যাচারাল জিপসাম', 'ওয়াশেবল ও নন-টক্সিক কালার', 'স্মুথ ও নিরাপদ এজ', 'স্ক্রিন-ফ্রি ক্রিয়েটিভ প্লে'],
    specifications: [
      { label: 'প্লাস্টার শেপ সংখ্যা', value: '৬টি (আনারস, নাশপাতি, আঙ্গুর, স্ট্রবেরি, তরমুজ, কলা)' },
      { label: 'রঙের সংখ্যা', value: '৪টি প্রাইমারি কালার পট (Red, Yellow, Blue, Green)' },
      { label: 'কালার মিক্সিং সুবিধা', value: 'রঙ মিশিয়ে কমলা, বেগুনি ইত্যাদি নতুন রঙ তৈরির সুযোগ' },
      { label: 'উপাদান', value: 'স্মুথ জিপসাম প্লাস্টার' },
      { label: 'বয়সোপযোগী', value: '২ থেকে ৮ বছর' }
    ],
    careInstructions: 'রঙ করা শেষে শুকিয়ে ঘরের টেবিলে সাজিয়ে রাখুন। কাপড়ে লাগলে সাধারণ সাবান পানিতেই পরিষ্কার হবে।',
    faqs: [
      {
        question: 'ফলগুলো কি ফ্রিজ ম্যাগনেট হিসেবে লাগানো যাবে?',
        answer: 'হ্যাঁ, পেছনে ছোট ম্যাগনেট স্টিকার লাগিয়ে অনায়াসেই ফ্রিজ বা হোয়াইটবোর্ডে লাগানো যায়।'
      }
    ]
  },

  // 2. Little Bug Adventure
  {
    id: 'prod-plaster-little-bug',
    title: 'Little Bug Adventure Painting Kit',
    titleBn: 'লিটল বাগ অ্যাডভেঞ্চার প্লাস্টার পেইন্টিং কিট (৪টি কিউট পোকা + ৪টি রঙ + ব্রাশ)',
    titleEn: 'Little Bug Adventure Painting Kit',
    slug: 'little-bug-adventure',
    price: 1100,
    basePrice: 1100,
    salePrice: 890,
    baseSalePrice: 890,
    category: 'Nature & Bugs',
    categorySlug: 'art-kits',
    description: 'ছোট্ট সোনামণিদের সৃজনশীল কল্পনায় নিজেদের রঙিন জগৎ তৈরি করতে CraftyKidsCo এর লিটল বাগ অ্যাডভেঞ্চার প্লাস্টার পেইন্টিং কিট! কিটটিতে রয়েছে প্রজাপতি, লেডিবাগ, ড্রাগনফ্লাই ও মৌমাছির ৪টি মসৃণ হোয়াইট প্লাস্টার শেপ, ৪টি নিরাপদ ওয়াশেবল রঙ (গোলাপি, হলুদ, সবুজ, নীল), ১টি কালারিং ব্রাশ এবং মিনি ডিসপ্লে স্ট্যান্ড। শিশুরা নিজেদের পছন্দমত রঙ করে তৈরি করতে পারবে আকর্ষণীয় খেলনা ও পড়ার টেবিলের সাজসজ্জা।',
    pieces: '৪টি প্লাস্টার পোকা + ৪টি ওয়াশেবল পেইন্ট + ১টি ব্রাশ + মিনি ইজেল স্ট্যান্ড',
    badge: 'টপ সেলার',
    rating: 5.0,
    reviewsCount: 56,
    reviewCount: 56,
    image: IMGBB_URLS.littleBug,
    imageUrl: IMGBB_URLS.littleBug,
    galleryImages: [
      IMGBB_URLS.littleBug,
      IMGBB_URLS.sweetFruit,
      IMGBB_URLS.autumnNature
    ],
    accentColor: '#FFE8D6',
    tagColor: 'bg-amber-100 text-amber-800',
    isNewArrival: true,
    isBestSeller: false,
    targetAgeMin: 2,
    targetAgeMax: 8,
    safetyBadges: ['১০০% নন-টক্সিক জিপসাম প্লাস্টার', 'সহজে ধোয়া যায় এমন রঙ', 'স্মুথ ও নিরাপদ ফিনিশিং', 'স্ক্রিন-ফ্রি ক্রিয়েটিভ প্লে'],
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
      }
    ]
  },

  // 3. Car & Transport Painting Kit
  {
    id: 'prod-plaster-car-kit',
    title: 'Car Painting Kit - Vehicles & Transport',
    titleBn: 'কার পেইন্টিং কিট - ট্রান্সপোর্ট ও যানবাহন প্লাস্টার সেট',
    titleEn: 'Car Painting Kit - Vehicles & Transport',
    slug: 'car-painting-kit',
    price: 1350,
    basePrice: 1350,
    salePrice: 1050,
    baseSalePrice: 1050,
    category: 'Vehicles & Transport',
    categorySlug: 'art-kits',
    description: 'ছোট গাড়ির পাগল বাচ্চাদের জন্য সেরা উপহার! এই কিটে রয়েছে ৬টি শক্তিশালী যানবাহনের প্লাস্টার মডেল—মোটরসাইকেল, স্কুল বাস, ফার্ম ট্রাক্টর, ক্লাসিক কার, ডেলিভারি ভ্যান এবং রেসকিউ হেলিকপ্টার। সাথে রয়েছে ৫টি ভাইব্রেন্ট পেইন্ট (লাল, হলুদ, নীল, সবুজ, কালো), কালার গাইড কার্ড এবং ১টি ব্রাশ। শিশুরা পছন্দের কালার কম্বিনেশনে তৈরি করবে তাদের স্বপ্নের স্পিড ভেহিকল!',
    pieces: '৬টি যানবাহন + ৫টি পেইন্ট পট + ১টি ব্রাশ + কালার গাইড',
    badge: 'জনপ্রিয়',
    rating: 4.8,
    reviewsCount: 64,
    reviewCount: 64,
    image: IMGBB_URLS.carKit,
    imageUrl: IMGBB_URLS.carKit,
    galleryImages: [
      IMGBB_URLS.carKit,
      IMGBB_URLS.toolSet,
      IMGBB_URLS.sunnyShores
    ],
    accentColor: '#E1F5FE',
    tagColor: 'bg-sky-100 text-sky-800',
    isNewArrival: true,
    isBestSeller: false,
    targetAgeMin: 3,
    targetAgeMax: 9,
    safetyBadges: ['১০০% নিরাপদ ও মসৃণ', '৫ কালার শেডস', 'কালার গাইড কার্ড অন্তর্ভুক্ত', 'মোটর স্কিল বুস্টার'],
    specifications: [
      { label: 'যানবাহনের ধরন', value: 'বাইক, বাস, ট্রাক্টর, প্রাইভেট কার, ভ্যান ও হেলিকপ্টার' },
      { label: 'রঙের সংখ্যা', value: '৫টি রঙ (Red, Yellow, Blue, Green, Black)' },
      { label: 'কালার গাইড', value: 'প্রিন্টেড ফুল কালার রেফারেন্স গাইড রয়েছে' }
    ]
  },

  // 4. Tool Set Painting Kit
  {
    id: 'prod-plaster-tool-set',
    title: 'Tool Set Painting Kit - Handy Builder',
    titleBn: 'টুল সেট প্লাস্টার পেইন্টিং কিট (৮টি টুলস + ৪টি রঙ + ১টি ব্রাশ)',
    titleEn: 'Tool Set Painting Kit - Handy Builder',
    slug: 'tool-set-painting-kit',
    price: 1250,
    basePrice: 1250,
    salePrice: 999,
    baseSalePrice: 999,
    category: 'Builder & Tools',
    categorySlug: 'art-kits',
    description: 'খেলতে খেলতে মেকানিকাল আইডিয়া ও বাস্তব জিনিষের পরিচয়! ৮টি আকর্ষণীয় বিল্ডার টুলসের প্লাস্টার শেপ—স্ক্রু-ড্রাইভার, অ্যাডজাস্টেবল রেঞ্জ, পাওয়ার ড্রিল, করাত, হাতুড়ি, পাইপ রেঞ্জ, প্লায়ার্স এবং ডাবল ওপেন স্প্যানার। সাথে ৪টি ব্রাইট কালার ও ব্রাশ। ছোট কারিগরদের হ্যান্ড-আই কোঅর্ডিনেশন ও একাগ্রতা বাড়ানোর চমৎকার উপহার।',
    pieces: '৮টি প্লাস্টার টুলস + ৪টি পেইন্ট পট + ১টি ব্রাশ',
    badge: 'নতুন',
    rating: 4.9,
    reviewsCount: 35,
    reviewCount: 35,
    image: IMGBB_URLS.toolSet,
    imageUrl: IMGBB_URLS.toolSet,
    galleryImages: [
      IMGBB_URLS.toolSet,
      IMGBB_URLS.carKit
    ],
    accentColor: '#FFF3E0',
    tagColor: 'bg-orange-100 text-orange-800',
    isNewArrival: true,
    isBestSeller: false,
    targetAgeMin: 3,
    targetAgeMax: 10,
    safetyBadges: ['৮টি ভিন্ন ভিন্ন টুলস', 'রোলপ্লে ও শিক্ষা', 'নন-টক্সিক কালার', 'স্মুথ ফিনিশিং']
  },

  // 5. Sunny Shores Beach Painting Kit
  {
    id: 'prod-plaster-sunny-shores',
    title: 'Sunny Shores Beach & Ocean Painting Kit',
    titleBn: 'সানি শোরস সমুদ্র ও সৈকত মেগা প্লাস্টার পেইন্টিং কিট (১৬টি শেপ)',
    titleEn: 'Sunny Shores Beach & Ocean Painting Kit',
    slug: 'sunny-shores',
    price: 1400,
    basePrice: 1400,
    salePrice: 1100,
    baseSalePrice: 1100,
    category: 'Ocean & Beach Life',
    categorySlug: 'art-kits',
    description: 'সমুদ্রের ঢেউ আর বালুকাময় সৈকতের পুরো একটা গল্প ঘরে বসেই! কিটটিতে রয়েছে মোট ১৬টি বৈচিত্র্যময় প্লাস্টার শেপ—হাস্যোজ্জ্বল সূর্য, পাম গাছ, বিচ আমব্রেলা, স্টারফিশ, বাতিঘর (Lighthouse), রাজকীয় স্যান্ডক্যাসেল, বিচ বল, স্যান্ডেল, সানগ্লাস, ঝিনুক ও ক্লাউড। সাথে ৫টি পেইন্ট (গোলাপি, হলুদ, সবুজ, নীল, সাদা) এবং ব্রাশ। বিশাল কালেকশন পরিবারের একাধিক শিশু একসাথে ভাগ করে পেইন্ট করতে পারে!',
    pieces: '১৬টি বিচ শেপ + ৫টি পেইন্ট পট + ১টি ব্রাশ',
    badge: 'মেগা প্যাক',
    rating: 5.0,
    reviewsCount: 48,
    reviewCount: 48,
    image: IMGBB_URLS.sunnyShores,
    imageUrl: IMGBB_URLS.sunnyShores,
    galleryImages: [
      IMGBB_URLS.sunnyShores,
      IMGBB_URLS.oceanWorld
    ],
    accentColor: '#FFF9C4',
    tagColor: 'bg-yellow-100 text-yellow-800',
    isNewArrival: false,
    isBestSeller: true,
    targetAgeMin: 3,
    targetAgeMax: 10,
    safetyBadges: ['১৬টি মেগা প্লাস্টার শেপস', 'সাদা রঙ দিয়ে শেডিং সুবিধা', 'পুরো ফ্যামিলি অ্যাক্টিভিটি']
  },

  // 6. Ocean World Sea Life Painting Kit
  {
    id: 'prod-plaster-ocean-world',
    title: 'Ocean World Sea Life Plaster Painting Kit',
    titleBn: 'ওশান ওয়ার্ল্ড সমুদ্রের জলচর প্রাণী প্লাস্টার পেইন্টিং কিট (৮টি মাছ)',
    titleEn: 'Ocean World Sea Life Plaster Painting Kit',
    slug: 'ocean-world-painting-kit',
    price: 1300,
    basePrice: 1300,
    salePrice: 1050,
    baseSalePrice: 1050,
    category: 'Undersea Adventures',
    categorySlug: 'art-kits',
    description: 'গভীর সমুদ্রের রহস্যময় ও রঙিন মাছদের নিয়ে দারুণ এক শিল্পযাত্রা! ৮টি সামুদ্রিক মাছের প্লাস্টার শেপ—অরেঞ্জ ক্লাউনফিশ, গোল্ডফিশ, ফোলানো পাফারফিশ, ফ্লাইং ফিশ, গ্রেট হোয়াইট শার্ক, মিষ্টি সিন্ধুঘোটক (Seahorse) ও টুনা মাছ। সাথে ৫টি পেইন্ট (লাল, হলুদ, সবুজ, নীল, কালো) এবং ফাইন ব্রাশ। সমুদ্রবিজ্ঞান ও কালার মিক্সিংয়ের সেরা মেলবন্ধন!',
    pieces: '৮টি সামুদ্রিক মাছ + ৫টি পেইন্ট পট + ১টি ব্রাশ',
    badge: 'সেরা রেটিং',
    rating: 4.9,
    reviewsCount: 52,
    reviewCount: 52,
    image: IMGBB_URLS.oceanWorld,
    imageUrl: IMGBB_URLS.oceanWorld,
    galleryImages: [
      IMGBB_URLS.oceanWorld,
      IMGBB_URLS.sunnyShores
    ],
    accentColor: '#E0F7FA',
    tagColor: 'bg-cyan-100 text-cyan-800',
    isNewArrival: false,
    isBestSeller: true,
    targetAgeMin: 3,
    targetAgeMax: 9,
    safetyBadges: ['৮টি বিভিন্ন মাছ ও জলচর প্রাণী', 'বাস্তবধর্মী থ্রিডি খোদাই', 'নন-টক্সিক ও টেকসই']
  },

  // 7. Mixed Kit 1 - Sweet Treats & School Adventure
  {
    id: 'prod-plaster-mixed-kit-1',
    title: 'Mixed Kit 1 - Sweet Treats & Adventure',
    titleBn: 'মিক্সড কিট ১ - সুইট ট্রিটস ও স্কুল অ্যাডভেঞ্চার প্লাস্টার প্যাক',
    titleEn: 'Mixed Kit 1 - Sweet Treats & Adventure',
    slug: 'mixed-kit-1',
    price: 1200,
    basePrice: 1200,
    salePrice: 990,
    baseSalePrice: 990,
    category: 'Super Value Combo',
    categorySlug: 'art-kits',
    description: 'বাচ্চাদের সব প্রিয় জিনিস এক বক্সে! কিটটিতে রয়েছে ৬টি বৈচিত্র্যময় প্লাস্টার শেপ—রঙিন ডানাওয়ালা প্রজাপতি, মিষ্টি পাকা কলা, স্কুল ব্যাকপ্যাক, চকলেট ডোনাট, সুস্বাদু আইসক্রিম কোন এবং রেইনবো আইস ললি। সাথে ৪টি উজ্জ্বল রঙ ও ব্রাশ। ড্রয়িং ও পেইন্টিং শেখার জন্য দারুণ এক অল-ইন-ওয়ান স্টার্টার সেট।',
    pieces: '৬টি প্লাস্টার শেপ + ৪টি পেইন্ট পট + ১টি ব্রাশ',
    badge: 'টপ সেলার',
    rating: 4.9,
    reviewsCount: 73,
    reviewCount: 73,
    image: IMGBB_URLS.mixedKit1,
    imageUrl: IMGBB_URLS.mixedKit1,
    galleryImages: [
      IMGBB_URLS.mixedKit1,
      IMGBB_URLS.sweetFruit,
      IMGBB_URLS.littleBug
    ],
    accentColor: '#F3E5F5',
    tagColor: 'bg-purple-100 text-purple-800',
    isNewArrival: false,
    isBestSeller: true,
    targetAgeMin: 2,
    targetAgeMax: 8,
    safetyBadges: ['ভ্যারাইটি কম্বো প্যাক', 'ছোট্ট হাতের উপযোগী সাইজ', '১০০% ফুড-গ্রেড ন্যাচারাল জিপসাম']
  },

  // 8. Autumn Woodland & Nature Plaster Kit
  {
    id: 'prod-plaster-autumn-nature',
    title: 'Autumn Woodland & Nature Plaster Kit',
    titleBn: 'অটাম উডল্যান্ড ও ন্যাচার প্লাস্টার পেইন্টিং কিট (৭টি শেপ)',
    titleEn: 'Autumn Woodland & Nature Plaster Kit',
    slug: 'autumn-nature-plaster-kit',
    price: 1350,
    basePrice: 1350,
    salePrice: 1080,
    baseSalePrice: 1080,
    category: 'Forest & Nature',
    categorySlug: 'art-kits',
    description: 'প্রকৃতির শান্ত ও স্নিগ্ধ রূপ নিয়ে বিশেষ অটাম উডল্যান্ড কিট! ৭টি শৈল্পিক প্লাস্টার শেপ—ফ্লাওয়ার পাম্পকিন, ম্যাপল লিফ, তুষার কণা (Snowflake), ক্লাসিক মিষ্টি কুমড়া, কাঠবিড়ালি (Squirrel), বুনো একর্ন (Acorn) এবং ওক পাতা। সাথে উডেন পেইন্ট ট্রে সম্বলিত ৫টি স্পেশাল শেডের রঙ (চকলেট ব্রাউন, অরেঞ্জ, পিংক, পার্পল, গ্রিন) ও ব্রাশ। নান্দনিক রুচির অনন্য স্মারক!',
    pieces: '৭টি প্লাস্টার শেপ + উডেন ট্রেতে ৫টি পেইন্ট পট + ১টি ব্রাশ',
    badge: 'কালেক্টরস কিট',
    rating: 5.0,
    reviewsCount: 39,
    reviewCount: 39,
    image: IMGBB_URLS.autumnNature,
    imageUrl: IMGBB_URLS.autumnNature,
    galleryImages: [
      IMGBB_URLS.autumnNature,
      IMGBB_URLS.littleBug
    ],
    accentColor: '#EFEBE9',
    tagColor: 'bg-stone-100 text-stone-800',
    isNewArrival: false,
    isBestSeller: true,
    targetAgeMin: 3,
    targetAgeMax: 12,
    safetyBadges: ['উডেন প্যালেট অন্তর্ভুক্ত', 'উষ্ণ ও প্রাকৃতিক রঙসমূহ', 'নান্দনিক ড্রয়িং অ্যাক্টিভিটি']
  },

  // 9. Sketchbooks
  {
    id: 'prod-sketchbook-spiral-a3',
    title: 'Premium Spiral Bound Jumbo Art Pad (A3)',
    titleBn: 'প্রিমিয়াম স্পাইরাল বাউন্ড জাম্বো আর্ট প্যাড (A3 সাইজ, ৫০ পাতা)',
    titleEn: 'Premium Spiral Bound Jumbo Art Pad (A3 Size, 50 Sheets)',
    slug: 'premium-spiral-jumbo-art-pad-a3',
    price: 450,
    basePrice: 450,
    salePrice: 380,
    baseSalePrice: 380,
    category: 'Drawing Books',
    categorySlug: 'sketchbooks',
    description: '১৬০ জিএসএম মোটা এসিড-ফ্রি কাগজের বড় সাইজের ড্রয়িং প্যাড। মোমের রঙ, তেল রঙ ও জলরঙে ছবি আঁকার জন্য সেরা।',
    pieces: '৫০ পাতা (A3 সাইজ)',
    badge: 'বড় সাইজ',
    rating: 4.8,
    reviewsCount: 16,
    reviewCount: 16,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    galleryImages: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'],
    isNewArrival: true,
    isBestSeller: false,
    targetAgeMin: 2,
    targetAgeMax: 10,
    safetyBadges: ['১৬০ GSM হেভিওয়েট পেপার', 'ইকো-ফ্রেন্ডলি এসিড-ফ্রি', 'মোমের রঙ ফ্রেন্ডলি']
  },
  {
    id: 'prod-sketchbook-pocket-set',
    title: 'Pocket Doodling & Travel Sketchbook Combo (Pack of 3)',
    titleBn: 'পকেট ডুডলিং ও ট্রাভেল স্কেচবুক কম্বো (৩টি প্যাক)',
    titleEn: 'Pocket Doodling & Travel Sketchbook Combo (Pack of 3)',
    slug: 'pocket-doodling-travel-sketchbook-3-pack',
    price: 350,
    basePrice: 350,
    salePrice: 280,
    baseSalePrice: 280,
    category: 'Drawing Books',
    categorySlug: 'sketchbooks',
    description: 'ভ্রমণ বা গাড়িতে বসে ডুডলিং ও স্কেচ করার জন্য পকেট সাইজ ৩টি কালারফুল আর্ট প্যাড।',
    pieces: '৩টি স্কেচবুক প্যাক',
    badge: '৩টি প্যাক',
    rating: 4.9,
    reviewsCount: 22,
    reviewCount: 22,
    image: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
    galleryImages: ['https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80'],
    isNewArrival: false,
    isBestSeller: true,
    targetAgeMin: 2,
    targetAgeMax: 8,
    safetyBadges: ['কমপ্যাক্ট ট্রাভেল সাইজ', '১০০% স্মুথ পেপার', 'রঙিন কাভার ডিজাইন']
  },

  // 10. Puzzles
  {
    id: 'prod-puzzle-wooden-bangla',
    title: 'Bangla Alphabet Wooden Learning Puzzle Board',
    titleBn: 'বাংলা বর্ণমালা ও স্বরবর্ণ কাঠের লার্নিং পাজল বোর্ড',
    titleEn: 'Bangla Alphabet Wooden Learning Puzzle Board',
    slug: 'bangla-alphabet-wooden-learning-puzzle-board',
    price: 480,
    basePrice: 480,
    salePrice: 390,
    baseSalePrice: 390,
    category: 'Puzzles',
    categorySlug: 'puzzles',
    description: 'ছোট্টমণিদের বাংলা বর্ণমালা শেখার আকর্ষণীয় কাঠের পাজল। মসৃণ ফিনিশ ও নন-টক্সিক জলরং ব্যবহার করা হয়েছে।',
    pieces: 'বাংলা বর্ণমালা কাঠের বোর্ড',
    badge: 'টপ সেলার',
    rating: 5.0,
    reviewsCount: 48,
    reviewCount: 48,
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
    galleryImages: ['https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80'],
    isNewArrival: false,
    isBestSeller: true,
    targetAgeMin: 2,
    targetAgeMax: 6,
    safetyBadges: ['ন্যাচারাল ফাইন পাইন উড', 'স্মুথ ও নিরাপদ এজ', 'নন-টক্সিক নিরাপদ রঙ']
  },
  {
    id: 'prod-puzzle-animal-jigsaw',
    title: 'Wild Animal Safari Floor Jigsaw Puzzle (48 Pcs)',
    titleBn: 'ওয়াইল্ড অ্যানিমেল ফ্লোর জিগস পাজল (৪৮ পিস)',
    titleEn: 'Wild Animal Safari Floor Jigsaw Puzzle (48 Pcs)',
    slug: 'wild-animal-safari-floor-jigsaw-puzzle-48',
    price: 650,
    basePrice: 650,
    salePrice: 520,
    baseSalePrice: 520,
    category: 'Puzzles',
    categorySlug: 'puzzles',
    description: 'বাচ্চাদের মেঝেতে বসে সমাধান করার জন্য বড় সাইজের রঙিন ৪৮ পিস সাফারী প্রাণী জিগস পাজল।',
    pieces: '৪৮ পিস ফ্লোর পাজল',
    badge: 'বড় পাজল',
    rating: 4.9,
    reviewsCount: 31,
    reviewCount: 31,
    image: 'https://images.unsplash.com/photo-1618842676088-c4d48a6a7c9d?auto=format&fit=crop&w=600&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1618842676088-c4d48a6a7c9d?auto=format&fit=crop&w=600&q=80',
    galleryImages: ['https://images.unsplash.com/photo-1618842676088-c4d48a6a7c9d?auto=format&fit=crop&w=600&q=80'],
    isNewArrival: true,
    isBestSeller: false,
    targetAgeMin: 3,
    targetAgeMax: 8,
    safetyBadges: ['মোটা ও মজবুত বোর্ড', 'সহজে পরিষ্কারযোগ্য', 'ব্রেইন ডেভেলপমেন্ট']
  },

  // 11. Gift Sets
  {
    id: 'prod-gift-art-deluxe',
    title: 'CraftyKids Ultimate Creative Art Gift Box',
    titleBn: 'CraftyKids আল্টিমেট ক্রিয়েটিভ আর্ট গিফট বক্স (মেগা কম্বো)',
    titleEn: 'CraftyKids Ultimate Creative Art Gift Box (Mega Combo)',
    slug: 'craftykids-ultimate-creative-art-gift-box',
    price: 2400,
    basePrice: 2400,
    salePrice: 1890,
    baseSalePrice: 1890,
    category: 'Gift Sets',
    categorySlug: 'gift-sets',
    description: 'জন্মদিন বা বিশেষ দিনের সেরা প্রিমিয়াম উপহার বক্স। এতে রয়েছে মোমের রঙ, প্লাস্টার পেইন্টিং কিট, প্লে-ডো ও ড্রয়িং খাতা।',
    pieces: '৪-ইন-১ আল্টিমেট ক্রাফট গিফট বক্স',
    badge: 'মেগা কম্বো',
    rating: 5.0,
    reviewsCount: 63,
    reviewCount: 63,
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
    galleryImages: ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80'],
    isNewArrival: true,
    isBestSeller: true,
    targetAgeMin: 2,
    targetAgeMax: 10,
    safetyBadges: ['লাক্সারি গিফট প্যাকেজিং', '৪-ইন-১ কমপ্লিট কিট', '১০০% নন-টক্সিক']
  },
  {
    id: 'prod-gift-plaster-bundle',
    title: 'Plaster Art Double Delight Gift Bundle',
    titleBn: 'প্লাস্টার আর্ট ডাবল ডিলাইট গিফট বান্ডেল (২টি সম্পূর্ণ কিট)',
    titleEn: 'Plaster Art Double Delight Gift Bundle (2 Complete Kits)',
    slug: 'plaster-art-double-delight-gift-bundle',
    price: 2100,
    basePrice: 2100,
    salePrice: 1690,
    baseSalePrice: 1690,
    category: 'Gift Sets',
    categorySlug: 'gift-sets',
    description: 'সুইট ফ্রুট কিট ও কার পেইন্টিং কিটের দুর্দান্ত ডাবল প্যাক কম্বো। ভাই-বোন বা বন্ধুর সাথে একসাথে খেলার সেরা উপহার।',
    pieces: '২টি সম্পূর্ণ প্লাস্টার কিট',
    badge: 'বেস্ট ভ্যালু',
    rating: 4.9,
    reviewsCount: 42,
    reviewCount: 42,
    image: 'https://i.ibb.co/CsS18B4H/craftykidsco-mixed-kit-1.jpg',
    imageUrl: 'https://i.ibb.co/CsS18B4H/craftykidsco-mixed-kit-1.jpg',
    galleryImages: ['https://i.ibb.co/CsS18B4H/craftykidsco-mixed-kit-1.jpg'],
    isNewArrival: true,
    isBestSeller: true,
    targetAgeMin: 3,
    targetAgeMax: 9,
    safetyBadges: ['১০টি প্লাস্টার মডেল', '৮টি কালার পট ও ২টি ব্রাশ', '১০০% নন-টক্সিক']
  },

  // 12. Educational Toys
  {
    id: 'prod-edu-math-balance',
    title: 'Montessori Monkey Math Balance Counting Game',
    titleBn: 'মন্টেসরি বানর ম্যাথ ব্যালেন্স কাউন্টিং স্কেল গেম',
    titleEn: 'Montessori Monkey Math Balance Counting Scale Game',
    slug: 'montessori-monkey-math-balance-counting-game',
    price: 750,
    basePrice: 750,
    salePrice: 590,
    baseSalePrice: 590,
    category: 'Educational',
    categorySlug: 'educational-toys',
    description: 'ওজন ও সংখ্যার ভারসাম্যের মাধ্যমে বাচ্চাদের যোগ-বিয়োগ ও সংখ্যা গণনা শেখার আকর্ষণীয় ব্যালেন্স গেম।',
    pieces: 'ব্যালেন্স স্কেল + সংখ্যা ও মিনি বানর',
    badge: 'মজার গণিত',
    rating: 4.9,
    reviewsCount: 35,
    reviewCount: 35,
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
    galleryImages: ['https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80'],
    isNewArrival: true,
    isBestSeller: true,
    targetAgeMin: 3,
    targetAgeMax: 8,
    safetyBadges: ['STEM লার্নিং টয়', 'বিপিএ ফ্রি নিরাপদ প্লাস্টিক', 'মজার খেলার ছলে শিক্ষা']
  },

  // 13. Wooden Toys
  {
    id: 'prod-wood-car-track',
    title: 'Natural Wooden Ramp Racer Track with 4 Cars',
    titleBn: 'ন্যাচারাল উডেন র‍্যাম্প রেসার ও ৪টি মিনি উডেন কার',
    titleEn: 'Natural Wooden Ramp Racer Track with 4 Mini Wooden Cars',
    slug: 'natural-wooden-ramp-racer-track-4-cars',
    price: 950,
    basePrice: 950,
    salePrice: 780,
    baseSalePrice: 780,
    category: 'Wooden Toys',
    categorySlug: 'wooden-toys',
    description: '৪ স্তরের উডেন র‍্যাম্প ট্র্যাক যার ওপর দিয়ে ছোট কাঠের গাড়িগুলো দ্রুত গতিতে নিচে নেমে আসে। বাচ্চাদের অত্যন্ত প্রিয়।',
    pieces: '৪ স্তর ট্র্যাক + ৪টি কাঠের কার',
    badge: 'টপ সেলার',
    rating: 4.9,
    reviewsCount: 39,
    reviewCount: 39,
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80',
    galleryImages: ['https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80'],
    isNewArrival: true,
    isBestSeller: true,
    targetAgeMin: 1,
    targetAgeMax: 5,
    safetyBadges: ['১০০% বিচ উড মেটেরিয়াল', 'ওয়াটার-বেসড পেইন্ট', 'স্মুথ ও রাউন্ড এজ']
  }
];

async function seedDatabase() {
  await connectDB();

  console.log('Seeding categories to MongoDB Atlas...');
  for (const cat of categoriesToSeed) {
    await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true });
  }
  console.log(`✓ Seeded ${categoriesToSeed.length} categories.`);

  console.log('Seeding products with ImgBB hosted URLs to MongoDB Atlas...');
  for (const prod of productsToSeed) {
    await Product.findOneAndUpdate({ slug: prod.slug }, prod, { upsert: true, new: true });
  }
  console.log(`✓ Seeded ${productsToSeed.length} products to MongoDB Atlas!`);

  const total = await Product.countDocuments();
  console.log(`Total products in MongoDB Atlas: ${total}`);

  process.exit(0);
}

if (require.main === module) {
  seedDatabase().catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}

module.exports = {
  seedDatabase,
  productsToSeed,
  categoriesToSeed,
  IMGBB_URLS
};
