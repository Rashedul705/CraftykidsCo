export interface HeroSlide {
  id: string;
  tagBn: string;
  tagEn: string;
  titleBn: string;
  titleBnHighlight: string;
  titleEn: string;
  subtitleBn: string;
  descBn: string;
  descEn: string;
  imageUrl: string;
  badgeTop: string;
  badgeBottom: string;
  ctaPrimaryText: string;
  ctaPrimaryHref: string;
  ctaSecondaryText: string;
  ctaSecondaryHref: string;
  bgGradient: string;
  borderColor: string;
  accentColor: string;
  isActive?: boolean;
}

export interface TrustBadge {
  id: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  icon: 'shield' | 'truck' | 'rotate' | 'headphones';
  enabled: boolean;
}

export interface ShowcaseSectionConfig {
  enabled: boolean;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  badge: string;
}

export interface PromoBanner {
  id: string;
  tag: string;
  title: string;
  desc: string;
  buttonText: string;
  link: string;
  imageUrl: string;
  badgeText: string;
  bgGradient: string;
  enabled: boolean;
}

export interface WhyLoveCard {
  id: string;
  titleBn: string;
  descBn: string;
  icon: 'heart' | 'shield' | 'sparkles' | 'award';
}

export interface ParentReview {
  id: string;
  name: string;
  kidAge: string;
  rating: number;
  reviewBn: string;
  verified: boolean;
  productName: string;
  avatarUrl?: string;
}

export interface SiteSettings {
  // 1. Top Announcement & Contact Bar
  announcement: {
    textBn: string;
    textEn: string;
    hotline: string;
    whatsapp: string;
    email: string;
    enabled: boolean;
  };

  // 2. Hero Slides Carousel
  heroSlides: HeroSlide[];

  // 3. Trust / Safety Features
  trustBadges: TrustBadge[];

  // 4. Product Showcase Sections
  showcases: {
    newArrivals: ShowcaseSectionConfig;
    bestSellers: ShowcaseSectionConfig;
    artKits: ShowcaseSectionConfig;
    waxCrayons: ShowcaseSectionConfig;
    playDough: ShowcaseSectionConfig;
    educationalToys: ShowcaseSectionConfig;
  };

  // 5. Middle Promotional Banners
  promoBanners: PromoBanner[];

  // 6. Why Parents Love Us
  whyLoveUs: {
    headingBn: string;
    headingEn: string;
    subtitleBn: string;
    cards: WhyLoveCard[];
  };

  // 7. Customer Testimonials
  testimonials: {
    headingBn: string;
    headingEn: string;
    subtitleBn: string;
    reviews: ParentReview[];
  };

  // 8. Bulk & School Orders Banner
  bulkOrderBanner: {
    enabled: boolean;
    titleBn: string;
    descBn: string;
    ctaText: string;
    whatsappNumber: string;
  };

  // 9. Footer Info
  footer: {
    aboutBn: string;
    phone: string;
    email: string;
    address: string;
    copyrightText: string;
  };
}

export const defaultSiteSettings: SiteSettings = {
  announcement: {
    textBn: 'দেশজুড়ে দ্রুত হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি!',
    textEn: 'Nationwide Fast Home Delivery & Cash on Delivery!',
    hotline: '01700-000000',
    whatsapp: '01711-223344',
    email: 'support@craftykidsco.com',
    enabled: true,
  },
  heroSlides: [
    {
      id: 'slide-plaster',
      tagBn: 'বেস্ট সেলার • ৩ডি প্লাস্টার পেইন্টিং',
      tagEn: 'Best Seller • 3D Plaster Painting',
      titleBn: 'শিশুর সৃজনশীল প্রতিভা বিকাশে',
      titleBnHighlight: '৩ডি প্লাস্টার পেইন্টিং ও ক্রাফট কিট',
      titleEn: 'Bring Kids Creative Imagination to Life',
      subtitleBn: 'সুইট ফ্রুট, কার, টুলস ও বাটারফ্লাই প্লাস্টার পেইন্টিং কিটস',
      descBn: '১০০% নিরাপদ প্রাকৃতিক জিপসাম মডেল ও ওয়াশেবল ফুড-গ্রেড রঙ। বাচ্চা নিজে রঙ করে বানাবে আকর্ষণীয় শোপিস ও ফ্রিজ ম্যাগনেট!',
      descEn: '100% safe non-toxic gypsum models & washable colors. Kids paint their own fridge magnets and room decor!',
      imageUrl: 'https://i.ibb.co/HDV4JVJz/craftykidsco-sweet-fruit.jpg',
      badgeTop: '★ ৬টি প্লাস্টার ফল + ৪টি ওয়াশেবল রঙ + ব্রাশ',
      badgeBottom: '১০০% নন-টক্সিক ও স্ক্রিন-ফ্রি ক্রিয়েটিভ প্লে',
      ctaPrimaryText: 'Shop Art Kits',
      ctaPrimaryHref: '/category/art-kits',
      ctaSecondaryText: 'Explore All',
      ctaSecondaryHref: '/shop',
      bgGradient: 'from-[#FFF5EB] via-[#FFF9F0] to-[#FFE8E8]',
      borderColor: '#F3E5D8',
      accentColor: '#E53935',
      isActive: true,
    },
    {
      id: 'slide-crayons',
      tagBn: '১০০% ফুড-গ্রেড মোম • কেমিক্যাল মুক্ত',
      tagEn: '100% Food-Grade Beeswax • Chemical Free',
      titleBn: 'ছোট সোনামণির প্রথম আঁকাআঁকি হোক',
      titleBnHighlight: 'খাঁটি মৌচাকের মোমে তৈরি নিরাপদ ক্রেয়ন',
      titleEn: 'Safe First Coloring Journey for Little Artists',
      subtitleBn: 'শিশুর কোমল ত্বকের জন্য সম্পূর্ণ নিরাপদ ও ক্ষতিকর প্যারাফিন মুক্ত',
      descBn: 'বাচ্চা মুখে দিলেও কোনো ভয় নেই। মসৃণ গ্রিপ, সহজে ভাঙে না এবং জামা বা মেঝেতে লাগলে সাধারণ পানিতেই ধুয়ে যায়!',
      descEn: 'Worry-free even if toddlers put it in their mouth. Smooth grip, durable and 100% washable from clothes and floors!',
      imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1200&q=80',
      badgeTop: '★ খাঁটি প্রাকৃতিক বিসওয়াক্স ও ফুড কালার',
      badgeBottom: 'সহজে ওয়াশেবল ও প্রিমিয়াম মসৃণ ফিনিশ',
      ctaPrimaryText: 'Shop Crayons',
      ctaPrimaryHref: '/category/wax-crayons',
      ctaSecondaryText: 'Order Now',
      ctaSecondaryHref: '/shop',
      bgGradient: 'from-[#FFFDF0] via-[#FFF8E7] to-[#FFF3D6]',
      borderColor: '#F5E6BE',
      accentColor: '#D97706',
      isActive: true,
    },
    {
      id: 'slide-dough',
      tagBn: 'সুপার সফট ও নন-স্টিকি • সেন্সরি প্লে',
      tagEn: 'Super Soft & Non-Sticky • Sensory Play',
      titleBn: 'কল্পনার রঙে গড়ে উঠুক নিজের মজার পৃথিবী',
      titleBnHighlight: 'নরম, সুবাসিত ও নন-টক্সিক প্লে-ডো ও ক্লে',
      titleEn: 'Sculpt Your Own Fun World with Colorful Dough',
      subtitleBn: 'আঙুলের ফাইন মোটর স্কিল ও স্পর্শের অনুভূতি বৃদ্ধির সেরা উপায়',
      descBn: 'হাতে আঠার মতো লেগে থাকে না। নানা রঙের প্লে-ডো দিয়ে ফল, ফুল ও পশুপাখি বানিয়ে শিশুরা পায় অফুরন্ত আনন্দ!',
      descEn: 'Non-sticky and super pliable. Enhances toddler hand-eye coordination, fine motor skills and tactile sensing!',
      imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=1200&q=80',
      badgeTop: '★ ৬ রঙের সফট প্লে-ডো + ৪টি শেপ কাটার',
      badgeBottom: 'হ্যান্ড-আই কোঅর্ডিনেশন ও সেন্সরি বুস্টার',
      ctaPrimaryText: 'Shop Play-Dough',
      ctaPrimaryHref: '/category/play-dough-clay',
      ctaSecondaryText: 'View Offers',
      ctaSecondaryHref: '/shop',
      bgGradient: 'from-[#F0F9FF] via-[#E0F2FE] to-[#F0F9FF]',
      borderColor: '#BAE6FD',
      accentColor: '#0284C7',
      isActive: true,
    },
    {
      id: 'slide-wooden',
      tagBn: 'ব্রেইন ডেভেলপমেন্ট • স্ক্রিন-ফ্রি শিক্ষা',
      tagEn: 'Brain Development • Screen-Free STEM Toys',
      titleBn: 'খেলতে খেলতে শিখুক গণিত, ভাষা ও লজিক',
      titleBnHighlight: 'প্রাকৃতিক পাইন কাঠের মসৃণ খেলনা ও পাজল',
      titleEn: 'Learn Math, Language & Logic Through Play',
      subtitleBn: 'মোবাইলের আসক্তি দূর করে বুদ্ধি ও একাগ্রতা বিকাশের সেরা মাধ্যম',
      descBn: 'শিশুদের মোবাইলের স্ক্রিন আসক্তি দূর করে বুদ্ধি, মেধা ও একাগ্রতা বাড়াতে মন্টেসরি কাঠের খেলনা ও পাজলের জুড়ি নেই!',
      descEn: 'Replace mobile screen addiction with tactile, screen-free cognitive growth and spatial memory building!',
      imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1200&q=80',
      badgeTop: '★ মসৃণ ফিনিশ ও ন্যাচারাল বিচ উড',
      badgeBottom: '১ থেকে ৮ বছর বয়সীদের সেরা উপহার',
      ctaPrimaryText: 'Shop Wooden Toys',
      ctaPrimaryHref: '/category/wooden-toys',
      ctaSecondaryText: 'View Catalog',
      ctaSecondaryHref: '/shop',
      bgGradient: 'from-[#F0FDF4] via-[#DCFCE7] to-[#F0FDF4]',
      borderColor: '#BBF7D0',
      accentColor: '#16A34A',
      isActive: true,
    },
  ],
  trustBadges: [
    {
      id: 'badge-safe',
      titleBn: '১০০% নিরাপদ ও পরীক্ষিত',
      titleEn: '100% Non-Toxic & Safe',
      descBn: 'খাদ্য-গ্রেড মোম ও প্রাকৃতিক উপাদান',
      descEn: 'Food-grade wax & natural ingredients',
      icon: 'shield',
      enabled: true,
    },
    {
      id: 'badge-shipping',
      titleBn: 'ফাস্ট হোম ডেলিভারি',
      titleEn: 'Fast Home Delivery',
      descBn: 'সারা দেশে ক্যাশ অন ডেলিভারি সুবিধা',
      descEn: 'Cash on delivery across Bangladesh',
      icon: 'truck',
      enabled: true,
    },
    {
      id: 'badge-return',
      titleBn: 'সহজ রিটার্ন পলিসি',
      titleEn: '7 Days Easy Return',
      descBn: 'ভাঙ্গা বা ত্রুটিপূর্ণ পণ্যে ১০০% রিপ্লেসমেন্ট',
      descEn: '100% replacement for damaged items',
      icon: 'rotate',
      enabled: true,
    },
    {
      id: 'badge-support',
      titleBn: '২৪/৭ কাস্টমার সাপোর্ট',
      titleEn: 'Friendly Customer Support',
      descBn: 'যেকোনো প্রয়োজনে আমাদের কল করুন',
      descEn: 'Reach us via hotline or WhatsApp',
      icon: 'headphones',
      enabled: true,
    },
  ],
  showcases: {
    newArrivals: {
      enabled: true,
      titleBn: 'নতুন কালেকশন',
      titleEn: 'New Arrivals',
      subtitleBn: 'সদ্য যুক্ত হওয়া ক্রাফট, পেইন্টিং ও নিরাপদ খেলনাসমূহ',
      badge: 'New In Stock',
    },
    bestSellers: {
      enabled: true,
      titleBn: 'জনপ্রিয় পণ্য',
      titleEn: 'Best Sellers',
      subtitleBn: 'শত শত অভিভাবকের প্রথম পছন্দের সেরা ক্রাফট আইটেম',
      badge: 'Top Pick',
    },
    artKits: {
      enabled: true,
      titleBn: '৩ডি প্লাস্টার পেইন্টিং কালেকশন',
      titleEn: '3D Plaster Art & Kits',
      subtitleBn: 'নিরাপদ জিপসাম মডেল, ব্রাশ ও ওয়াশেবল ফুড-গ্রেড রঙ',
      badge: 'Art Kits',
    },
    waxCrayons: {
      enabled: true,
      titleBn: 'খাঁটি মোমের রঙ (Natural Crayons)',
      titleEn: 'Natural Beeswax Crayons',
      subtitleBn: '১০০% প্রাকৃতিক মৌচাকের মোমে তৈরি, ক্ষতিকর কেমিক্যাল মুক্ত',
      badge: 'Safe Crayons',
    },
    playDough: {
      enabled: true,
      titleBn: 'মডেলিং ক্লে ও প্লে-ডো',
      titleEn: 'Play-Dough & Soft Clay',
      subtitleBn: 'সুপার সফট, নন-স্টিকি ও শিশুদের কোমল হাতের জন্য নিরাপদ',
      badge: 'Clay & Dough',
    },
    educationalToys: {
      enabled: true,
      titleBn: 'শিক্ষামূলক কাঠের খেলনা ও পাজল',
      titleEn: 'Educational & Wooden Toys',
      subtitleBn: 'স্ক্রিন-ফ্রি শিক্ষা, মেধা ও একাগ্রতা বিকাশের সেরা উপহার',
      badge: 'Wooden STEM',
    },
  },
  promoBanners: [
    {
      id: 'promo-1',
      tag: 'লিমিটেড অফার • কম্বো প্যাকেজ',
      title: 'প্লাস্টার আর্ট ও ক্রেয়ন মেগা কম্বো',
      desc: 'একসাথে প্লাস্টার আর্ট কিট ও ১২ রঙের ন্যাচারাল মোমের রঙ কিনলে পাচ্ছেন বিশেষ ছাড় ও ফ্রি গিফট বক্স!',
      buttonText: 'Order Combo Now',
      link: '/shop',
      imageUrl: 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg',
      badgeText: '২০% ছাড়',
      bgGradient: 'from-[#FFF7ED] to-[#FFEDD5]',
      enabled: true,
    },
    {
      id: 'promo-2',
      tag: 'স্কুল ও প্রি-স্কুল স্পেশাল',
      title: 'বাল্ক অর্ডারে আকর্ষণীয় পাইকারি মূল্য',
      desc: 'স্কুল, ডে-কেয়ার বা জন্মদিনের রিটার্ন গিফটের জন্য একসাথে ১০টির বেশি অর্ডারে স্পেশাল ডিসকাউন্ট উপভোগ করুন।',
      buttonText: 'WhatsApp for Bulk',
      link: 'https://wa.me/8801711223344',
      imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
      badgeText: 'হোলসেল রেট',
      bgGradient: 'from-[#F0FDF4] to-[#DCFCE7]',
      enabled: true,
    },
  ],
  whyLoveUs: {
    headingBn: 'অভিভাবকেরা কেন ক্রাফটিকিডস পছন্দ করেন?',
    headingEn: 'Why Parents Love CraftyKidsCo',
    subtitleBn: 'আমরা বিশ্বাস করি প্রতিটি শিশুই অনন্য প্রতিভার অধিকারী। তাদের প্রথম সৃজনশীল পদক্ষেপে নিরাপত্তা ও আনন্দ নিশ্চিত করাই আমাদের লক্ষ্য।',
    cards: [
      {
        id: 'card-1',
        titleBn: '১০০% চাইল্ড-সেফ উপকরণ',
        descBn: 'আমাদের প্রতিটি পণ্যে খাদ্য-গ্রেড ও প্রাকৃতিক উপাদান ব্যবহৃত হয়, যা সম্পূর্ণ গন্ধহীন ও ক্ষতিকর কেমিক্যাল মুক্ত।',
        icon: 'shield',
      },
      {
        id: 'card-2',
        titleBn: 'মোবাইল স্ক্রিন-মুক্ত খেলাধুলা',
        descBn: 'বাচ্চাদের মোবাইলের স্ক্রিন আসক্তি কমিয়ে নিজের হাতে গড়ার আনন্দ ও একাগ্রতা বৃদ্ধিতে সহায়তা করে।',
        icon: 'sparkles',
      },
      {
        id: 'card-3',
        titleBn: 'সহজে ধোয়া যায় (ওয়াশেবল)',
        descBn: 'আঁকাআঁকির সময় হাত, কাপড় বা মেঝেতে রঙ লাগলে সাধারণ পানি দিয়েই অনায়াসে ধুয়ে ফেলা যায়।',
        icon: 'heart',
      },
      {
        id: 'card-4',
        titleBn: 'প্রিমিয়াম কোয়ালিটি ও টেকসই',
        descBn: 'সহজে ভাঙে না এবং শিশুদের কোমল হাতের গ্রিপের সাথে নিখুঁতভাবে মানানসই করে তৈরি করা হয়েছে।',
        icon: 'award',
      },
    ],
  },
  testimonials: {
    headingBn: 'হ্যাপি প্যারেন্টস রিভিউ',
    headingEn: 'Happy Parents Reviews',
    subtitleBn: 'সারাদেশের শত শত সন্তুষ্ট বাবা-মায়ের মূল্যবান মতামত',
    reviews: [
      {
        id: 'rev-1',
        name: 'নাজনীন সুলতানা',
        kidAge: 'মা (৪ বছর বয়সী সন্তানের)',
        rating: 5,
        reviewBn: 'আমার বাচ্চার জন্য সুইট ফ্রুট প্লাস্টার পেইন্টিং কিটটা নিয়েছিলাম। রঙগুলো সত্যিই ওয়াশেবল এবং প্লাস্টার ফলগুলো খুব মসৃণ। বাচ্চা ঘণ্টার পর ঘণ্টা মোবাইল ভুলে রঙ করতে ব্যস্ত থাকে!',
        verified: true,
        productName: 'সুইট ফ্রুট পেইন্টিং কিট',
      },
      {
        id: 'rev-2',
        name: 'তানভীর আহমেদ',
        kidAge: 'বাবা (৩ বছর বয়সী সন্তানের)',
        rating: 5,
        reviewBn: 'মৌচাকের মোমে তৈরি ক্রেয়নগুলো অসাধারণ। সাধারণ ক্রেয়নের মতো গন্ধ নেই এবং ভাঙার কোনো ভয় নেই। ডেলিভারিও মাত্র ২ দিনে পেয়েছি। হাইলি রিকমেন্ডেড!',
        verified: true,
        productName: 'ন্যাচারাল মোমের রঙ',
      },
      {
        id: 'rev-3',
        name: 'ফারহানা ইসলাম',
        kidAge: 'মা (৫ বছর বয়সী সন্তানের)',
        rating: 5,
        reviewBn: 'প্লে-ডো খুব সফট এবং হাতে কোনো আঠালো ভাব থাকে না। আমার মেয়ে সুন্দর সুন্দর ফুল ও তারা বানিয়ে সাজিয়ে রেখেছে। প্যাকেজিং ও সার্ভিস দারুণ লেগেছে।',
        verified: true,
        productName: 'মডেলিং প্লে-ডো সেট',
      },
    ],
  },
  bulkOrderBanner: {
    enabled: true,
    titleBn: 'স্কুল, ডে-কেয়ার ও জন্মদিনের রিটার্ন গিফট প্যাকেজ',
    descBn: 'আপনার স্কুলের আর্ট ক্লাস বা বাচ্চার জন্মদিনের স্মরণীয় উপহার হিসেবে ক্রাফট কিট নিতে আমাদের সাথে যোগাযোগ করুন। বিশেষ বাল্ক ডিসকাউন্ট দেওয়া হয়!',
    ctaText: 'হোয়াটসঅ্যাপে যোগাযোগ করুন',
    whatsappNumber: '+8801711223344',
  },
  footer: {
    aboutBn: 'শিশুদের সুস্থ শৈশব ও সৃজনশীল মেধা বিকাশে ১০০% নিরাপদ নন-টক্সিক মোমের রঙ ও শিক্ষণীয় খেলনার নির্ভরযোগ্য ব্র্যান্ড।',
    phone: '+৮৮০ ১৭১১-২২৩৩৪৪',
    email: 'support@craftykidsco.com',
    address: 'ধানমন্ডি, ঢাকা, বাংলাদেশ',
    copyrightText: '© ২০২৬ CraftyKidsCo. সর্বস্বত্ব সংরক্ষিত।',
  },
};
