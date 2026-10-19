const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static assets from frontend public directory
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Mock Products Data (Authentic Crafty Kids Co. Plaster Painting Kits + Storefront Catalog)
const products = [
  // 1. Little Bug Adventure Painting Kit
  {
    id: 'prod-plaster-bug-adventure',
    title: 'Little Bug Adventure Painting Kit',
    titleBn: 'লিটল বাগ অ্যাডভেঞ্চার প্লাস্টার পেইন্টিং কিট (৪টি পোকা + ৪টি রঙ + ১টি ব্রাশ)',
    titleEn: 'Little Bug Adventure Painting Kit',
    slug: 'little-bug-adventure',
    price: 1200,
    basePrice: 1200,
    salePrice: 999,
    baseSalePrice: 999,
    category: 'Nature & Bugs',
    categorySlug: 'art-kits',
    description: 'ছোট্ট সোনামণিদের সৃজনশীল কল্পনায় নিজেদের রঙিন জগৎ তৈরি করতে CraftyKidsCo এর লিটল বাগ অ্যাডভেঞ্চার প্লাস্টার পেইন্টিং কিট! কিটটিতে রয়েছে প্রজাপতি, লেডিবাগ, ড্রাগনফ্লাই ও মৌমাছির ৪টি মসৃণ হোয়াইট প্লাস্টার শেপ, ৪টি নিরাপদ ওয়াশেবল রঙ (গোলাপি, হলুদ, সবুজ, নীল), ১টি কালারিং ব্রাশ এবং মিনি ডিসপ্লে স্ট্যান্ড। শিশুরা নিজেদের পছন্দমত রঙ করে তৈরি করতে পারবে আকর্ষণীয় খেলনা ও পড়ার টেবিলের সাজসজ্জা।',
    pieces: '৪টি প্লাস্টার পোকা + ৪টি ওয়াশেবল পেইন্ট + ১টি ব্রাশ + মিনি ইজেল স্ট্যান্ড',
    badge: 'সেরা অফার',
    rating: 5.0,
    reviewsCount: 58,
    reviewCount: 58,
    image: '/images/products/little-bug-adventure.jpg',
    imageUrl: '/images/products/little-bug-adventure.jpg',
    galleryImages: [
      '/images/products/little-bug-adventure.jpg',
      '/images/products/mixed-kit-1.jpg',
      '/images/products/sweet-fruit.jpg'
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
      { label: 'উপাদান', value: '১০০% ইকো-ফ্রেন্ডলি জিপসাম প্লাস্টার ও নন-টক্সিক ওয়াটারবেসড পেইন্ট' },
      { label: 'উপযুক্ত বয়স', value: '২ থেকে ৮ বছর' },
      { label: 'বিশেষ সুবিধা', value: 'হাতে বা কাপড়ে দাগ লাগলে সহজেই সাধারণ পানি দিয়ে উঠে যায়' }
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
    ]
  },

  // 2. Sweet Fruit Painting Kit
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
    description: 'রসালো ও রঙিন ফলের আনন্দময় ভুবন! এই কিটে রয়েছে ৬টি সুদৃশ্য প্লাস্টার ফলের আকৃতি—আনারস, নাশপাতি, আঙ্গুর, লাল স্ট্রবেরি, রসালো তরমুজের স্লাইস এবং মিষ্টি কলা। সাথে থাকছে ৪টি ব্রাইট পেইন্ট পট (লাল, হলুদ, নীল, সবুজ) এবং ১টি পেইন্টিং ব্রাশ। শিশুরা নিজে নিজে রঙ করে বিভিন্ন ফল চিনবে এবং তাদের ক্রিয়েটিভিটি প্রকাশ করবে।',
    pieces: '৬টি প্লাস্টার ফল + ৪টি ওয়াশেবল পেইন্ট + ১টি ব্রাশ',
    badge: 'সেরা মান',
    rating: 4.9,
    reviewsCount: 42,
    reviewCount: 42,
    image: '/images/products/sweet-fruit.jpg',
    imageUrl: '/images/products/sweet-fruit.jpg',
    galleryImages: [
      '/images/products/sweet-fruit.jpg',
      '/images/products/little-bug-adventure.jpg',
      '/images/products/mixed-kit-1.jpg'
    ],
    accentColor: '#FCE4EC',
    tagColor: 'bg-pink-100 text-pink-800',
    isNewArrival: true,
    isBestSeller: false,
    targetAgeMin: 2,
    targetAgeMax: 7,
    safetyBadges: ['১০০% নন-টক্সিক ও নিরাপদ', 'রঙিন ফল পরিচিতি', 'ওয়াশেবল ওয়াটার কালার', 'পারফেক্ট উপহার'],
    specifications: [
      { label: 'প্লাস্টার শেপ সংখ্যা', value: '৬টি (আনারস, নাশপাতি, আঙ্গুর, স্ট্রবেরি, তরমুজ, কলা)' },
      { label: 'রঙের সংখ্যা', value: '৪টি প্রাইমারি কালার পট (Red, Yellow, Blue, Green)' },
      { label: 'কালার মিক্সিং সুবিধা', value: 'রঙ মিশিয়ে কমলা, বেগুনি ইত্যাদি নতুন রঙ তৈরির সুযোগ' },
      { label: 'উপাদান', value: 'স্মুথ জিপসাম প্লাস্টার' },
      { label: 'বয়সোপযোগী', value: '২ থেকে ৭ বছর' }
    ],
    careInstructions: 'রঙ করা শেষে শুকিয়ে ঘরের টেবিলে সাজিয়ে রাখুন। কাপড়ে লাগলে সাধারণ সাবান পানিতেই পরিষ্কার হবে।',
    faqs: [
      {
        question: 'ফলগুলো কি ফ্রিজ ম্যাগনেট হিসেবে লাগানো যাবে?',
        answer: 'হ্যাঁ, পেছনে ছোট ম্যাগনেট স্টিকার লাগিয়ে অনায়াসেই ফ্রিজ বা হোয়াইটবোর্ডে লাগানো যায়।'
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
    image: '/images/products/car-painting-kit.jpg',
    imageUrl: '/images/products/car-painting-kit.jpg',
    galleryImages: [
      '/images/products/car-painting-kit.jpg',
      '/images/products/tool-set.jpg',
      '/images/products/sunny-shores.jpg'
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
    image: '/images/products/tool-set.jpg',
    imageUrl: '/images/products/tool-set.jpg',
    galleryImages: [
      '/images/products/tool-set.jpg',
      '/images/products/car-painting-kit.jpg'
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
    image: '/images/products/sunny-shores.jpg',
    imageUrl: '/images/products/sunny-shores.jpg',
    galleryImages: [
      '/images/products/sunny-shores.jpg',
      '/images/products/ocean-world.jpg'
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
    image: '/images/products/ocean-world.jpg',
    imageUrl: '/images/products/ocean-world.jpg',
    galleryImages: [
      '/images/products/ocean-world.jpg',
      '/images/products/sunny-shores.jpg'
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
    image: '/images/products/mixed-kit-1.jpg',
    imageUrl: '/images/products/mixed-kit-1.jpg',
    galleryImages: [
      '/images/products/mixed-kit-1.jpg',
      '/images/products/sweet-fruit.jpg',
      '/images/products/little-bug-adventure.jpg'
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
    image: '/images/products/autumn-nature.jpg',
    imageUrl: '/images/products/autumn-nature.jpg',
    galleryImages: [
      '/images/products/autumn-nature.jpg',
      '/images/products/little-bug-adventure.jpg'
    ],
    accentColor: '#EFEBE9',
    tagColor: 'bg-stone-100 text-stone-800',
    isNewArrival: false,
    isBestSeller: true,
    targetAgeMin: 3,
    targetAgeMax: 12,
    safetyBadges: ['উডেন প্যালেট অন্তর্ভুক্ত', 'উষ্ণ ও প্রাকৃতিক রঙসমূহ', 'নান্দনিক ড্রয়িং অ্যাক্টিভিটি']
  },


  // 2. Additional Storefront Products
  {
    id: 'prod-crayons-24',
    title: 'CraftyKidsCo Natural Wax Crayons - 24 Shade Box',
    titleBn: 'CraftyKidsCo ন্যাচারাল মোমের রঙ - ২৪ শেড',
    titleEn: 'CraftyKidsCo Natural Wax Crayons - 24 Shade Box',
    slug: 'craftykidsco-natural-wax-crayons-24-shades',
    price: 350,
    basePrice: 350,
    salePrice: 299,
    baseSalePrice: 299,
    category: 'Wax Crayons',
    categorySlug: 'wax-crayons',
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
    image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
    badge: 'সেরা অফার',
    rating: 4.9,
    reviewCount: 48,
    isNewArrival: true,
    isBestSeller: true,
    targetAgeMin: 2,
    targetAgeMax: 7,
  },
  {
    id: 'prod-triangular-12',
    title: 'Toddler Triangular Grip Chunky Crayons 12 Set',
    titleBn: 'টডলার ট্রায়াঙ্গুলার গ্রিপ মোম ১২ রঙ (ভাঙবে না)',
    titleEn: 'Toddler Triangular Grip Chunky Crayons 12 Set',
    slug: 'toddler-triangular-grip-crayons-12',
    price: 260,
    basePrice: 260,
    salePrice: 220,
    baseSalePrice: 220,
    category: 'Wax Crayons',
    categorySlug: 'wax-crayons',
    imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
    badge: '-১৫%',
    rating: 4.8,
    reviewCount: 32,
    isNewArrival: true,
    isBestSeller: true,
    targetAgeMin: 1,
    targetAgeMax: 4,
  },
  {
    id: 'prod-play-dough-6',
    title: 'Super Soft Play Dough 6-Color Tub Set with Cutters',
    titleBn: 'সুপার সফট প্লে-ডো ৬ রঙের সেট + ৪টি শেপ কাটার',
    titleEn: 'Super Soft Play Dough 6-Color Tub Set with Cutters',
    slug: 'super-soft-play-dough-6-color-tub-set',
    price: 320,
    basePrice: 320,
    salePrice: 275,
    baseSalePrice: 275,
    category: 'Play Dough & Clay',
    categorySlug: 'play-dough-clay',
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    badge: 'জনপ্রিয়',
    rating: 5.0,
    reviewCount: 29,
    isNewArrival: true,
    isBestSeller: false,
    targetAgeMin: 2,
    targetAgeMax: 8,
  },
  {
    id: 'prod-wooden-puzzle',
    title: 'Bangla & English Wooden Learning Puzzle Board',
    titleBn: 'বাংলা বর্ণমালা কাঠের লার্নিং পাজল বোর্ড',
    titleEn: 'Bangla & English Wooden Learning Puzzle Board',
    slug: 'wooden-learning-puzzle-board',
    price: 420,
    basePrice: 420,
    salePrice: 360,
    baseSalePrice: 360,
    category: 'Wooden Toys',
    categorySlug: 'wooden-toys',
    imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
    badge: 'সেরা মান',
    rating: 4.9,
    reviewCount: 54,
    isNewArrival: true,
    isBestSeller: false,
    targetAgeMin: 3,
    targetAgeMax: 6,
  },
  {
    id: 'prod-sketchbook-a4',
    title: 'Kids Premium Heavyweight Art & Drawing Pad 40 Sheets',
    titleBn: 'বাচ্চাদের মোটা আর্ট ও কালারিং ড্রয়িং প্যাড (৪০ পাতা)',
    titleEn: 'Kids Premium Heavyweight Art & Drawing Pad 40 Sheets',
    slug: 'kids-premium-art-drawing-pad-40-sheets',
    price: 240,
    basePrice: 240,
    salePrice: 190,
    baseSalePrice: 190,
    category: 'Drawing Books',
    categorySlug: 'sketchbooks',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    badge: '-২০%',
    rating: 4.7,
    reviewCount: 19,
    isNewArrival: true,
    isBestSeller: false,
    targetAgeMin: 2,
    targetAgeMax: 10,
  },
  {
    id: 'prod-crayons-36',
    title: 'Mega Artist 36 Color Special Craft Box',
    titleBn: 'মেগা আর্টিস্ট ৩৬ কালার স্পেশাল ক্রাফট বক্স',
    titleEn: 'Mega Artist 36 Color Special Craft Box',
    slug: 'mega-artist-36-color-special-craft-box',
    price: 490,
    basePrice: 490,
    salePrice: 420,
    baseSalePrice: 420,
    category: 'Wax Crayons',
    categorySlug: 'wax-crayons',
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
    badge: 'টপ সেলার',
    rating: 5.0,
    reviewCount: 68,
    isBestSeller: true,
    targetAgeMin: 3,
    targetAgeMax: 9,
  },
  {
    id: 'prod-wood-blocks-50',
    title: 'Colorful Wooden Geometric Stacking Blocks 50 Pcs',
    titleBn: 'কালারফুল কাঠের জিওমেট্রিক স্ট্যাকিং ব্লকস (৫০ পিস)',
    titleEn: 'Colorful Wooden Geometric Stacking Blocks 50 Pcs',
    slug: 'colorful-wooden-geometric-stacking-blocks',
    price: 550,
    basePrice: 550,
    salePrice: 460,
    baseSalePrice: 460,
    category: 'Wooden Toys',
    categorySlug: 'wooden-toys',
    imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80',
    badge: 'হট',
    rating: 4.9,
    reviewCount: 42,
    isBestSeller: true,
    targetAgeMin: 2,
    targetAgeMax: 6,
  },
  {
    id: 'prod-glitter-crayons',
    title: 'Sparkle Glitter Wax Crayons 12 Color Pack',
    titleBn: 'স্পার্কল গ্লিটার মোমের রঙ ১২ কালার প্যাক',
    titleEn: 'Sparkle Glitter Wax Crayons 12 Color Pack',
    slug: 'sparkle-glitter-wax-crayons-12',
    price: 290,
    basePrice: 290,
    salePrice: 250,
    baseSalePrice: 250,
    category: 'Wax Crayons',
    categorySlug: 'wax-crayons',
    imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
    badge: '-১৪%',
    rating: 4.8,
    reviewCount: 27,
    isBestSeller: true,
    targetAgeMin: 3,
    targetAgeMax: 8,
  },
  {
    id: 'prod-montessori-clock',
    title: 'Montessori Wooden Time & Shape Learning Clock',
    titleBn: 'মন্টেসরি কাঠের সময় ও শেপ লার্নিং ক্লক',
    titleEn: 'Montessori Wooden Time & Shape Learning Clock',
    slug: 'montessori-wooden-time-shape-learning-clock',
    price: 450,
    basePrice: 450,
    salePrice: 380,
    baseSalePrice: 380,
    category: 'Educational',
    categorySlug: 'educational-toys',
    imageUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=600&q=80',
    badge: 'সেরা উপহার',
    rating: 4.9,
    reviewCount: 35,
    isBestSeller: true,
    targetAgeMin: 3,
    targetAgeMax: 7,
  },
  {
    id: 'prod-clay-animal-kit',
    title: 'Modeling Clay Kit with 8 Animal Cutters and Roller',
    titleBn: 'মডেলিং ক্লে কিট + ৮টি অ্যানিম্যাল শেপ কাটার ও রোলার',
    titleEn: 'Modeling Clay Kit with 8 Animal Cutters and Roller',
    slug: 'modeling-clay-kit-animal-cutters',
    price: 380,
    basePrice: 380,
    salePrice: 320,
    baseSalePrice: 320,
    category: 'Play Dough & Clay',
    categorySlug: 'play-dough-clay',
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    badge: '-১৫%',
    rating: 4.8,
    reviewCount: 31,
    isBestSeller: true,
    targetAgeMin: 2,
    targetAgeMax: 8,
  },
  // Showcase Crayons
  {
    id: 'prod-crayons-12',
    title: 'CraftyKidsCo 12 Shades Starter Wax Crayons',
    titleBn: 'CraftyKidsCo ১২ শেড স্টার্টার মোম রঙ',
    titleEn: 'CraftyKidsCo 12 Shades Starter Wax Crayons',
    slug: 'craftykidsco-12-shades-starter-wax-crayons',
    price: 190,
    basePrice: 190,
    salePrice: 160,
    baseSalePrice: 160,
    category: 'Wax Crayons',
    categorySlug: 'wax-crayons',
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
    badge: '-১৬%',
    rating: 4.8,
    reviewCount: 22,
    targetAgeMin: 2,
    targetAgeMax: 5,
  },
  {
    id: 'prod-crayons-jumbo',
    title: 'Jumbo Grip Washable Wax Crayons 8 Colors',
    titleBn: 'জাম্বো গ্রিপ ওয়াশেবল মোমের রঙ (৮ রঙ)',
    titleEn: 'Jumbo Grip Washable Wax Crayons 8 Colors',
    slug: 'jumbo-grip-washable-wax-crayons-8',
    price: 280,
    basePrice: 280,
    salePrice: 240,
    baseSalePrice: 240,
    category: 'Wax Crayons',
    categorySlug: 'wax-crayons',
    imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
    badge: 'ওয়াশেবল',
    rating: 4.9,
    reviewCount: 19,
    targetAgeMin: 1,
    targetAgeMax: 4,
  },
  {
    id: 'prod-crayons-metallic',
    title: 'Metallic Shine Wax Crayons 8 Color Set',
    titleBn: 'মেটালিক শাইন মোমের রঙ ৮ কালার সেট',
    titleEn: 'Metallic Shine Wax Crayons 8 Color Set',
    slug: 'metallic-shine-wax-crayons-8',
    price: 320,
    basePrice: 320,
    salePrice: 270,
    baseSalePrice: 270,
    category: 'Wax Crayons',
    categorySlug: 'wax-crayons',
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
    badge: 'মেটালিক',
    rating: 4.7,
    reviewCount: 14,
    targetAgeMin: 3,
    targetAgeMax: 9,
  },
  {
    id: 'prod-crayons-pastel',
    title: 'Soft Pastel Wax Art Pack 12 Shades',
    titleBn: 'সফট প্যাস্টেল মোম আর্ট প্যাক (১২ শেড)',
    titleEn: 'Soft Pastel Wax Art Pack 12 Shades',
    slug: 'soft-pastel-wax-art-pack-12',
    price: 310,
    basePrice: 310,
    salePrice: 260,
    baseSalePrice: 260,
    category: 'Wax Crayons',
    categorySlug: 'wax-crayons',
    imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
    badge: '-১৬%',
    rating: 4.8,
    reviewCount: 18,
    targetAgeMin: 3,
    targetAgeMax: 10,
  },
  // Showcase Clay
  {
    id: 'prod-clay-basic-4',
    title: 'ArtClay 4 Basic Color Tub Pack',
    titleBn: 'আর্টক্লে ৪ বেসিক কালার টাব প্যাক',
    titleEn: 'ArtClay 4 Basic Color Tub Pack',
    slug: 'artclay-4-basic-color-tub-pack',
    price: 220,
    basePrice: 220,
    salePrice: 190,
    baseSalePrice: 190,
    category: 'Play Dough & Clay',
    categorySlug: 'play-dough-clay',
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    badge: 'নন-টক্সিক',
    rating: 4.6,
    reviewCount: 12,
    targetAgeMin: 2,
    targetAgeMax: 6,
  },
  {
    id: 'prod-clay-8-colors',
    title: 'Play Dough 8 Color Fun Mega Pack',
    titleBn: 'প্লে-ডো ৮ রঙের ফান মেগা প্যাক',
    titleEn: 'Play Dough 8 Color Fun Mega Pack',
    slug: 'play-dough-8-color-fun-mega-pack',
    price: 370,
    basePrice: 370,
    salePrice: 320,
    baseSalePrice: 320,
    category: 'Play Dough & Clay',
    categorySlug: 'play-dough-clay',
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    badge: '-১৩%',
    rating: 4.9,
    reviewCount: 28,
    targetAgeMin: 2,
    targetAgeMax: 8,
  },
  {
    id: 'prod-clay-tools-12',
    title: 'Modeling Clay Toolkit 12 Pcs Cutters and Shapers',
    titleBn: 'মডেলিং ক্লে টুলকিট - ১২ পিস কাটার ও শেপার',
    titleEn: 'Modeling Clay Toolkit 12 Pcs Cutters and Shapers',
    slug: 'modeling-clay-toolkit-12-pcs',
    price: 260,
    basePrice: 260,
    salePrice: 210,
    baseSalePrice: 210,
    category: 'Play Dough & Clay',
    categorySlug: 'play-dough-clay',
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    badge: 'টুলস',
    rating: 4.7,
    reviewCount: 16,
    targetAgeMin: 3,
    targetAgeMax: 9,
  },
  {
    id: 'prod-clay-bucket',
    title: 'ArtClay Ultimate Craft Storage Bucket Set',
    titleBn: 'আর্টক্লে আলটিমেট ক্রাফট স্টোরেজ বাকেট',
    titleEn: 'ArtClay Ultimate Craft Storage Bucket Set',
    slug: 'artclay-ultimate-craft-bucket-set',
    price: 560,
    basePrice: 560,
    salePrice: 490,
    baseSalePrice: 490,
    category: 'Play Dough & Clay',
    categorySlug: 'play-dough-clay',
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    badge: 'মেগা প্যাক',
    rating: 5.0,
    reviewCount: 34,
    targetAgeMin: 2,
    targetAgeMax: 9,
  },
  // Showcase Wooden/Educational
  {
    id: 'prod-wood-rainbow-arch',
    title: 'Natural Wooden Rainbow Stacking Arch',
    titleBn: 'ন্যাচারাল কাঠের রেইনবো স্ট্যাকিং আর্চ',
    titleEn: 'Natural Wooden Rainbow Stacking Arch',
    slug: 'natural-wooden-rainbow-stacking-arch',
    price: 480,
    basePrice: 480,
    salePrice: 420,
    baseSalePrice: 420,
    category: 'Wooden Toys',
    categorySlug: 'wooden-toys',
    imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80',
    badge: '-১২%',
    rating: 4.9,
    reviewCount: 23,
    targetAgeMin: 2,
    targetAgeMax: 6,
  },
  {
    id: 'prod-brain-wooden-maze',
    title: 'Brain Booster Wooden Magnetic Ball Maze Game',
    titleBn: 'ব্রেইন বুস্টার উডেন ম্যাগনেটিক বল মেজ গেম',
    titleEn: 'Brain Booster Wooden Magnetic Ball Maze Game',
    slug: 'brain-booster-wooden-magnetic-ball-maze',
    price: 330,
    basePrice: 330,
    salePrice: 280,
    baseSalePrice: 280,
    category: 'Educational',
    categorySlug: 'educational-toys',
    imageUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=600&q=80',
    badge: 'ব্রেইন গেম',
    rating: 4.8,
    reviewCount: 17,
    targetAgeMin: 3,
    targetAgeMax: 7,
  },
  {
    id: 'prod-wood-abacus',
    title: 'Classic Wooden Counting Abacus Frame',
    titleBn: 'ক্লাসিক উডেন কাউন্টিং অ্যাবাকাস ফ্রেম',
    titleEn: 'Classic Wooden Counting Abacus Frame',
    slug: 'classic-wooden-counting-abacus-frame',
    price: 390,
    basePrice: 390,
    salePrice: 330,
    baseSalePrice: 330,
    category: 'Educational',
    categorySlug: 'educational-toys',
    imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
    badge: '-১৫%',
    rating: 4.7,
    reviewCount: 21,
    targetAgeMin: 3,
    targetAgeMax: 8,
  },
  {
    id: 'prod-animal-wood-puzzle',
    title: '3D Wooden Animal Knob Learning Puzzle',
    titleBn: 'প্রাণীদের ছবি সম্বলিত থ্রিডি কাঠের পাজল',
    titleEn: '3D Wooden Animal Knob Learning Puzzle',
    slug: '3d-wooden-animal-knob-learning-puzzle',
    price: 360,
    basePrice: 360,
    salePrice: 310,
    baseSalePrice: 310,
    category: 'Wooden Toys',
    categorySlug: 'wooden-toys',
    imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80',
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80',
    badge: 'টপ রেটেড',
    rating: 4.9,
    reviewCount: 25,
    targetAgeMin: 2,
    targetAgeMax: 5,
  },
];

// Endpoints
// 1. GET /api/products
app.get('/api/products', (req, res) => {
  // Support both direct array and wrapped response formats
  if (req.query.format === 'object' || req.query.wrapper === 'true') {
    return res.json({
      success: true,
      total: products.length,
      data: products,
    });
  }
  res.json(products);
});

// 2. GET /api/products/:id
app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const product = products.find((p) => p.id === id || p.slug === id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json(product);
});

// 3. Infrastructure & API Registry Dashboard (Root Route)
app.get('/', (req, res) => {
  // Support JSON output for API clients if specifically requested
  if (req.headers.accept && req.headers.accept.includes('application/json') && !req.headers.accept.includes('text/html')) {
    return res.json({
      status: 'online',
      service: 'Crafty Kids Server',
      subtitle: 'ADVANCED BACKEND INFRASTRUCTURE',
      uptime: process.uptime(),
      port: PORT,
      environment: process.env.NODE_ENV || 'Development',
      database: {
        system: 'MongoDB Atlas',
        status: 'Offline (Mock API Mode)'
      },
      services: {
        imageHosting: 'ImgBB API',
        notifications: 'SMTP & BulkSMSBD'
      },
      endpoints: [
        { method: 'GET', path: '/api/products', desc: 'Retrieve full product catalog & plaster kits' },
        { method: 'GET', path: '/api/products/:id', desc: 'Fetch single product details by ID or slug' },
        { method: 'POST', path: '/api/orders', desc: 'Submit checkout order with items & delivery info' },
        { method: 'POST', path: '/api/upload-image', desc: 'Upload and host images via ImgBB' },
        { method: 'POST', path: '/api/auth/otp', desc: 'Dispatch SMS OTP verification to customer' },
        { method: 'GET', path: '/api/status', desc: 'Health check, heartbeat, and diagnostics' }
      ]
    });
  }

  // Calculate dynamic uptime: Xh Ym Zs
  const totalSeconds = Math.floor(process.uptime());
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Crafty Kids Server &bull; Advanced Backend Infrastructure</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background-color: #0f111a;
      color: #e2e8f0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow-x: hidden;
      line-height: 1.5;
    }

    /* Ambient background glows */
    body::before {
      content: '';
      position: fixed;
      top: -160px;
      left: 15%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(15, 17, 26, 0) 70%);
      pointer-events: none;
      z-index: 0;
    }

    body::after {
      content: '';
      position: fixed;
      bottom: -150px;
      right: 10%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(15, 17, 26, 0) 70%);
      pointer-events: none;
      z-index: 0;
    }

    .container {
      max-width: 1120px;
      margin: 0 auto;
      padding: 48px 24px 64px;
      position: relative;
      z-index: 1;
      width: 100%;
    }

    /* Header */
    .header {
      margin-bottom: 36px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #94a3b8;
      width: fit-content;
      backdrop-filter: blur(8px);
    }

    .header-title-row {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
    }

    .header h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #f8fafc;
      background: linear-gradient(135deg, #ffffff 40%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header .subtitle {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.14em;
      color: #38bdf8;
      text-transform: uppercase;
      margin-top: 4px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      background: rgba(255, 255, 255, 0.04);
      color: #e2e8f0;
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(8px);
    }

    .action-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.18);
      color: #ffffff;
      transform: translateY(-1px);
    }

    .action-btn.primary {
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
    }

    .action-btn.primary:hover {
      box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5);
    }

    /* Status Dots */
    .dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }

    .dot.green {
      background: #22c55e;
      box-shadow: 0 0 8px #22c55e, 0 0 16px rgba(34, 197, 94, 0.6);
      animation: pulse-green 2.5s infinite;
    }

    .dot.red {
      background: #ef4444;
      box-shadow: 0 0 8px #ef4444, 0 0 16px rgba(239, 68, 68, 0.6);
      animation: pulse-red 2.5s infinite;
    }

    @keyframes pulse-green {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.75; transform: scale(1.1); }
    }

    @keyframes pulse-red {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.75; transform: scale(1.1); }
    }

    /* Glassmorphism Card Style */
    .card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 16px;
      padding: 24px;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
    }

    .card:hover {
      background: rgba(255, 255, 255, 0.035);
      border-color: rgba(255, 255, 255, 0.14);
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
    }

    /* 3-Column Grid for Server Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 44px;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .card-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .card-title {
      font-size: 15px;
      font-weight: 700;
      color: #f1f5f9;
      letter-spacing: -0.01em;
    }

    .pill-tag {
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .pill-tag.green {
      background: rgba(34, 197, 94, 0.1);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.25);
    }

    .pill-tag.red {
      background: rgba(239, 68, 68, 0.1);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.25);
    }

    .stat-list {
      display: flex;
      flex-direction: column;
      gap: 13px;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 13px;
    }

    .stat-label {
      color: #94a3b8;
      font-weight: 500;
    }

    .stat-value {
      color: #e2e8f0;
      font-weight: 600;
      text-align: right;
    }

    .stat-value.mono {
      font-family: 'JetBrains Mono', monospace;
      color: #38bdf8;
      font-size: 12.5px;
      background: rgba(56, 189, 248, 0.08);
      padding: 2px 7px;
      border-radius: 6px;
      border: 1px solid rgba(56, 189, 248, 0.15);
    }

    .stat-value.status-offline {
      color: #f87171;
      font-weight: 600;
    }

    /* API Registry Section */
    .section-header {
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .section-header h2 {
      font-size: 19px;
      font-weight: 800;
      color: #f1f5f9;
      letter-spacing: -0.02em;
    }

    .section-header p {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 4px;
    }

    .endpoint-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .endpoint-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all 0.2s ease;
      text-decoration: none;
      color: inherit;
    }

    .endpoint-card:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }

    .endpoint-top {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .method-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .method-badge.get {
      background: rgba(16, 185, 129, 0.12);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }

    .method-badge.post {
      background: rgba(99, 102, 241, 0.12);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.25);
    }

    .endpoint-url {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 600;
      color: #f1f5f9;
      word-break: break-all;
    }

    .endpoint-desc {
      font-size: 12.5px;
      color: #94a3b8;
      line-height: 1.4;
    }

    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #64748b;
    }

    .footer a {
      color: #94a3b8;
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer a:hover {
      color: #e2e8f0;
    }

    @media (max-width: 900px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      .endpoint-grid {
        grid-template-columns: 1fr;
      }
      .header-title-row {
        flex-direction: column;
        gap: 12px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <div class="header-badge">
        <span class="dot green"></span>
        <span>Operational &bull; Live Node Cluster</span>
      </div>
      <div class="header-title-row">
        <div>
          <h1>Crafty Kids Server</h1>
          <div class="subtitle">ADVANCED BACKEND INFRASTRUCTURE</div>
        </div>
        <div class="header-actions">
          <a href="/api/products" target="_blank" class="action-btn primary">
            <span>Explore Products API</span>
            <span>&rarr;</span>
          </a>
          <a href="http://localhost:3000" target="_blank" class="action-btn">
            <span>Open Storefront</span>
          </a>
        </div>
      </div>
    </header>

    <!-- 3-Column Stats Grid -->
    <section class="stats-grid">
      <!-- Card 1: Core Engine -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-wrap">
            <span class="dot green"></span>
            <span class="card-title">Core Engine</span>
          </div>
          <span class="pill-tag green">Active</span>
        </div>
        <div class="stat-list">
          <div class="stat-row">
            <span class="stat-label">Uptime</span>
            <span class="stat-value mono">${uptimeString}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Environment</span>
            <span class="stat-value">Development</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Port</span>
            <span class="stat-value mono">${PORT}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Runtime</span>
            <span class="stat-value">Node.js ${process.version}</span>
          </div>
        </div>
      </div>

      <!-- Card 2: Database -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-wrap">
            <span class="dot red"></span>
            <span class="card-title">Database</span>
          </div>
          <span class="pill-tag red">Standby</span>
        </div>
        <div class="stat-list">
          <div class="stat-row">
            <span class="stat-label">System</span>
            <span class="stat-value">MongoDB Atlas</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Connection</span>
            <span class="stat-value status-offline">Offline (Mock API Mode)</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Storage Engine</span>
            <span class="stat-value">In-Memory Mock Store</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Collections</span>
            <span class="stat-value">Products (${products.length}), Orders</span>
          </div>
        </div>
      </div>

      <!-- Card 3: Services -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-wrap">
            <span class="dot green"></span>
            <span class="card-title">Services</span>
          </div>
          <span class="pill-tag green">Configured</span>
        </div>
        <div class="stat-list">
          <div class="stat-row">
            <span class="stat-label">Image Hosting</span>
            <span class="stat-value">ImgBB API</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Notifications</span>
            <span class="stat-value">SMTP &amp; BulkSMSBD</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Courier Partner</span>
            <span class="stat-value">Steadfast Logistics</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">CORS Policy</span>
            <span class="stat-value">Enabled (* Access)</span>
          </div>
        </div>
      </div>
    </section>

    <!-- API Registry Section -->
    <section>
      <div class="section-header">
        <div>
          <h2>API Registry</h2>
          <p>Exposed RESTful endpoints for storefront &amp; administrative operations</p>
        </div>
      </div>

      <div class="endpoint-grid">
        <!-- Endpoint 1 -->
        <a href="/api/products" target="_blank" class="endpoint-card">
          <div class="endpoint-top">
            <span class="method-badge get">GET</span>
            <span class="endpoint-url">/api/products</span>
          </div>
          <p class="endpoint-desc">Retrieve all products, plaster painting kits, and inventory catalog.</p>
        </a>

        <!-- Endpoint 2 -->
        <a href="/api/products/1" target="_blank" class="endpoint-card">
          <div class="endpoint-top">
            <span class="method-badge get">GET</span>
            <span class="endpoint-url">/api/products/:id</span>
          </div>
          <p class="endpoint-desc">Fetch single product details, images, specifications, and reviews.</p>
        </a>

        <!-- Endpoint 3 -->
        <div class="endpoint-card">
          <div class="endpoint-top">
            <span class="method-badge post">POST</span>
            <span class="endpoint-url">/api/orders</span>
          </div>
          <p class="endpoint-desc">Submit new checkout order with customer details, phone, and delivery address.</p>
        </div>

        <!-- Endpoint 4 -->
        <div class="endpoint-card">
          <div class="endpoint-top">
            <span class="method-badge post">POST</span>
            <span class="endpoint-url">/api/upload-image</span>
          </div>
          <p class="endpoint-desc">Upload product photos directly to ImgBB cloud storage.</p>
        </div>

        <!-- Endpoint 5 -->
        <div class="endpoint-card">
          <div class="endpoint-top">
            <span class="method-badge post">POST</span>
            <span class="endpoint-url">/api/auth/otp</span>
          </div>
          <p class="endpoint-desc">Generate and dispatch single-use OTP SMS to customer mobile.</p>
        </div>

        <!-- Endpoint 6 -->
        <a href="/api/status" target="_blank" class="endpoint-card">
          <div class="endpoint-top">
            <span class="method-badge get">GET</span>
            <span class="endpoint-url">/api/status</span>
          </div>
          <p class="endpoint-desc">Health check ping, timestamp diagnostics, and system heartbeat.</p>
        </a>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <span>Crafty Kids Co. &copy; 2026 &bull; Advanced Backend Infrastructure</span>
      <div style="display: flex; gap: 16px;">
        <a href="/api/products">Raw Products JSON</a>
        <a href="http://localhost:3000">Storefront UI</a>
      </div>
    </footer>
  </div>
</body>
</html>`;

  res.send(html);
});

// 4. API Status & Heartbeat
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    service: 'Crafty Kids Server',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
  });
});


app.listen(PORT, HOST, () => {
  console.log(`Crafty Kids Co. Mock API Server running on http://${HOST}:${PORT}`);
});
