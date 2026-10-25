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

export interface WelcomeOfferConfig {
  enabled: boolean;
  tag: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  couponCode: string;
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

  // 9. Welcome Offer (10% Off Coupon Signup)
  welcomeOffer: WelcomeOfferConfig;

  // 10. Footer Info
  footer: {
    aboutBn: string;
    phone: string;
    email: string;
    address: string;
    copyrightText: string;
  };

  // 10. Print & Thermal Sticker Settings
  print: {
    companyName: string;
    tagline: string;
    phone: string;
    supportPhone: string;
    whatsapp: string;
    website: string;
    facebookPage: string;
    logoUrl: string;
    returnPolicyText: string;
    showReceiverDetails: boolean;
    showCollectAmount: boolean;
    showFragileTag: boolean;
    defaultStickerSize: '100x150' | '75x50' | 'sheet4' | 'sheet8';
  };

  // 11. Custom Static Pages (Contact, About, Privacy, Terms) Editable from Admin
  customPages?: CustomPagesSettings;
}

export interface CustomPagesSettings {
  contact: {
    headline: string;
    subtitle: string;
    phone: string;
    whatsapp: string;
    location: string;
    openingHours: string;
    noticeBannerText: string;
  };
  about: {
    badge: string;
    headline: string;
    subtitle: string;
    storyTitle: string;
    storyPara1: string;
    storyPara2: string;
    stat1Val: string;
    stat1Label: string;
    stat2Val: string;
    stat2Label: string;
    stat3Val: string;
    stat3Label: string;
    stat4Val: string;
    stat4Label: string;
    pillar1Title: string;
    pillar1Desc: string;
    pillar2Title: string;
    pillar2Desc: string;
    pillar3Title: string;
    pillar3Desc: string;
    pillar4Title: string;
    pillar4Desc: string;
    ctaHeading: string;
    ctaSubtitle: string;
  };
  privacy: {
    headline: string;
    lastUpdated: string;
    introText: string;
    section1Title: string;
    section1Content: string;
    section2Title: string;
    section2Content: string;
    section3Title: string;
    section3Content: string;
    section4Title: string;
    section4Content: string;
    section5Title: string;
    section5Content: string;
    section6Title: string;
    section6Content: string;
    section7Title: string;
    section7Content: string;
  };
  terms: {
    headline: string;
    lastUpdated: string;
    introText: string;
    section1Title: string;
    section1Content: string;
    section2Title: string;
    section2Content: string;
    section3Title: string;
    section3Content: string;
    section4Title: string;
    section4Content: string;
    section5Title: string;
    section5Content: string;
    section6Title: string;
    section6Content: string;
    section7Title: string;
    section7Content: string;
    section8Title: string;
    section8Content: string;
    section9Title: string;
    section9Content: string;
    section10Title: string;
    section10Content: string;
  };
}

export const defaultSiteSettings: SiteSettings = {
  announcement: {
    textBn: 'দেশজুড়ে দ্রুত হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি!',
    textEn: 'Nationwide Fast Home Delivery & Cash on Delivery!',
    hotline: '01731-376498',
    whatsapp: '01731-376498',
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
      link: 'https://wa.me/8801731376498',
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
    whatsappNumber: '+8801731376498',
  },
  welcomeOffer: {
    enabled: true,
    tag: 'Special Welcome Offer',
    titleBn: 'প্রথম অর্ডারে ১০% বিশেষ ছাড়!',
    titleEn: 'Get 10% Off On Your First Order!',
    descBn: 'আপনার মোবাইল নম্বর দিয়ে প্রথম অর্ডারের জন্য প্রোমো কোড সংগ্রহ করুন এবং চেকআউটে সরাসরি ছাড় উপভোগ করুন',
    descEn: 'Enter your phone number to claim your first order promo code at checkout',
    couponCode: 'CRAFTY10',
  },
  footer: {
    aboutBn: 'শিশুদের সুস্থ শৈশব ও সৃজনশীল মেধা বিকাশে ১০০% নিরাপদ নন-টক্সিক মোমের রঙ ও শিক্ষণীয় খেলনার নির্ভরযোগ্য ব্র্যান্ড।',
    phone: '+৮৮০ ১৭৩১-৩৭৬৪৯৮',
    email: 'support@craftykidsco.com',
    address: 'তেরখাদিয়া, রাজপাড়া, রাজশাহী। ওপেন ২৪ ঘণ্টা',
    copyrightText: '© ২০২৬ CraftyKidsCo. সর্বস্বত্ব সংরক্ষিত।',
  },
  print: {
    companyName: 'CraftyKidsCo',
    tagline: 'শিশুদের নিরাপদ প্রাকৃতিক রঙ ও শিক্ষামূলক খেলনা',
    phone: '01731-376498',
    supportPhone: '01731-376498',
    whatsapp: '8801731376498',
    website: 'craftykidsco.com',
    facebookPage: 'fb.com/craftykidsco.bd',
    logoUrl: '/icons/icon-192x192.png',
    returnPolicyText: 'পণ্য পাওয়ার পর কোনো সমস্যা থাকলে ৩ দিনের মধ্যে সাপোর্ট নম্বরে যোগাযোগ করুন।',
    showReceiverDetails: true,
    showCollectAmount: true,
    showFragileTag: false,
    defaultStickerSize: '100x150',
  },
  customPages: {
    contact: {
      headline: 'যোগাযোগ করুন',
      subtitle: 'শিশুদের নিরাপদ মোমের রঙ, খেলনা বা আপনার অর্ডার সংক্রান্ত যেকোনো তথ্যের জন্য সরাসরি আমাদের সাথে যুক্ত থাকুন।',
      phone: '01731-376498',
      whatsapp: '01731-376498',
      location: 'তেরখাদিয়া, রাজপাড়া, রাজশাহী।',
      openingHours: 'ওপেন ২৪ ঘণ্টা',
      noticeBannerText: 'পণ্য নির্বাচন, বয়স উপযোগী খেলনার পরামর্শ বা যেকোনো প্রশ্নের সরাসরি সমাধানের জন্য আমাদের WhatsApp এ মেসেজ দিন।',
    },
    about: {
      badge: 'শিশুর সুস্থ শৈশব ও নিরাপদ সৃজনশীলতা',
      headline: 'আমরা শিশুদের প্রতিটি রঙ ও কল্পনায় ছড়িয়ে দিচ্ছি প্রাকৃতিক নিরাপত্তা',
      subtitle: 'CraftyKidsCo-এর প্রতিটি পণ্য তৈরি হয় শিশুদের স্পর্শকাতর হাতের কথা ভেবে। সাধারণ কেমিক্যাল ও প্যারাফিন নয়, আমাদের ভিত্তি ১০০% খাঁটি প্রাকৃতিক মৌমাছির মোম ও ফুড-গ্রেড নিরাপত্তা।',
      storyTitle: 'কেন আমরা CraftyKidsCo শুরু করেছিলাম?',
      storyPara1: 'বাজারে প্রচলিত অধিকাংশ সাধারণ ক্রেয়ন মোম তৈরি হয় পেট্রোলিয়ামের উপজাত প্যারাফিন ওয়াক্স এবং কৃত্রিম হেভি-মেটাল পিগমেন্ট দিয়ে। শিশুরা ছবি আঁকার সময় প্রায়শই রঙ মুখে দেয়, হাতে ঘষাঘষি করে এবং হাত না ধুয়ে খাবার খেয়ে ফেলে। এতে অনিচ্ছাকৃতভাবেই শিশুর শরীরে ক্ষতিকর রাসায়নিক প্রবেশ করে।',
      storyPara2: 'অভিভাবক হিসেবে আমরা এই ভীতি থেকে পরিত্রাণ খুঁজেছি। ঠিক সেই তাগিদ থেকেই CraftyKidsCo-এর জন্ম। আমরা দেশীয় প্রাকৃতিক মৌমাছির মোম (Beeswax), উদ্ভিজ্জ তেল এবং সার্টিফাইড ফুড কালার দিয়ে তৈরি করেছি সম্পূর্ণ খাওয়ার মতো নিরাপদ (Food-Grade Safe) আর্ট ও ক্রাফটিং পণ্য।',
      stat1Val: '১০০%',
      stat1Label: 'প্রাকৃতিক মৌমাছির মোম',
      stat2Val: '০%',
      stat2Label: 'নন-টক্সিক ও লেড-মুক্ত',
      stat3Val: '৫০,০০০+',
      stat3Label: 'অভিভাবকের বিশ্বস্ততা',
      stat4Val: '৬৪',
      stat4Label: 'জেলায় হোম ডেলিভারি',
      pillar1Title: '১০০% প্রাকৃতিক ও পরিবেশবান্ধব',
      pillar1Desc: 'কোনো সিন্থেটিক গন্ধ বা কেমিক্যাল নেই। প্রাকৃতিক মৌমাছির মোমের মৃদু সুবাস শিশুদের সংবেদনশীল ঘ্রাণশক্তির জন্য আনন্দদায়ক ও স্বাস্থ্যকর।',
      pillar2Title: 'ফুড-গ্রেড পিগমেন্ট নিরাপত্তা',
      pillar2Desc: 'আন্তর্জাতিক খেলনা নিরাপত্তা মানদণ্ড (ASTM D-4236 ও EN71) অনুসরণে তৈরি। ছোট শিশুরা অসাবধানতাবশত জিহ্বায় ছোঁয়ালেও বিষক্রিয়ার ভয় থাকে না।',
      pillar3Title: 'মোটর স্কিল ও স্ক্রিন-ফ্রি শৈশব',
      pillar3Desc: 'স্মার্টফোনের স্ক্রিনের বিকল্প হিসেবে শিশুদের কল্পনাশক্তি, হাতের সূক্ষ্ম পেশীর ভারসাম্য ও সৃজনশীল রঙের জগত উন্মোচনে আমাদের প্রতিটি পণ্য ডিজাইন করা।',
      pillar4Title: 'সহজ গ্রিপ ও ভাঙন-প্রতিরোধী নকশা',
      pillar4Desc: 'ছোট ছোট আঙুলের উপযোগী প্রশস্ত গ্রিপ, যা সহজে হাত থেকে পিছলে যায় না এবং বারবার মেঝেতে পড়ে ভেঙে গুড়া হওয়ার প্রবণতা রোধ করে।',
      ctaHeading: 'আপনার সন্তানের জন্য নিরাপদ সৃজনশীলতার দরজা খুলুন',
      ctaSubtitle: 'আমাদের ক্যাটালগ ঘুরে দেখুন এবং আপনার শিশুর বয়স ও পছন্দের উপযোগী নিরাপদ মোমের রঙ বা খেলনা অর্ডার করুন।',
    },
    privacy: {
      headline: 'গোপনীয়তা নীতিমালা (Privacy Policy)',
      lastUpdated: '২৫ অক্টোবর, ২০২৬',
      introText: 'CraftyKidsCo-এ আপনার এবং আপনার পরিবারের ব্যক্তিগত তথ্যের নিরাপত্তা আমাদের কাছে অত্যন্ত গুরুত্বপূর্ণ। এই গোপনীয়তা নীতিমালায় ব্যাখ্যা করা হয়েছে যে কীভাবে আমরা আপনার তথ্য সংগ্রহ, সংরক্ষণ, ব্যবহার ও সুরক্ষিত রাখি।',
      section1Title: '১. আমরা যেসকল তথ্য সংগ্রহ করি',
      section1Content: 'আপনার অর্ডার সফলভাবে সম্পন্ন ও ডেলিভারি করার জন্য আমরা কেবল প্রয়োজনীয় তথ্য সংগ্রহ করি: নাম, মোবাইল নম্বর, পূর্ণাঙ্গ ডেলিভারি ঠিকানা (জেলা, থানা ও এলাকা), অর্ডার বিবরণ এবং কুরিয়ার ডেলিভারি সংক্রান্ত তথ্য।',
      section2Title: '২. শিশুদের তথ্যের বিশেষ সুরক্ষা (Children\'s Privacy)',
      section2Content: 'যদিও আমাদের পণ্য শিশুদের জন্য নির্মিত, তবে আমাদের ওয়েবসাইট শুধুমাত্র ১৮ বছর বা তদূর্ধ্ব বয়সী অভিভাবক ও প্রাপ্তবয়স্কদের ব্যবহারের জন্য। আমরা সচেতনভাবে কোনো অপ্রাপ্তবয়স্ক শিশুর ব্যক্তিগত তথ্য সংগ্রহ করি না।',
      section3Title: '৩. তথ্যের ব্যবহার ও উদ্দেশ্য',
      section3Content: 'আমরা সংগৃহীত তথ্য শুধুমাত্র অর্ডার প্রসেস, কুরিয়ার পার্টনারের মাধ্যমে ডেলিভারি নিশ্চিতকরণ, এসএমএস আপডেট প্রদান এবং কাস্টমার সাপোর্ট সেবায় ব্যবহার করি।',
      section4Title: '৪. তৃতীয় পক্ষের সাথে তথ্য শেয়ার না করার নিশ্চয়তা',
      section4Content: 'আমরা আপনার তথ্য কোনো বাণিজ্যিক বিজ্ঞাপনী সংস্থা বা তৃতীয় পক্ষের কাছে বিক্রয়, ভাড়া বা অপব্যবহার করি না। শুধুমাত্র ডেলিভারি পার্টনার (স্টিডফাস্ট)-এর সাথে প্রয়োজনীয় তথ্য শেয়ার করা হয়।',
      section5Title: '৫. তথ্য নিরাপত্তা ও সুরক্ষা ব্যবস্থা',
      section5Content: 'আমাদের ওয়েবসাইট সর্বাধুনিক SSL এনক্রিপশন প্রযুক্তি দ্বারা সুরক্ষিত। আপনার ব্যক্তিগত তথ্য নিরাপদ সার্ভারে সংরক্ষিত থাকে।',
      section6Title: '৬. কুকিজ ও ট্র্যাকিং নীতি',
      section6Content: 'আপনার কার্ট মেমোরি সংরক্ষণ ও ওয়েবসাইট গতিশীল রাখার জন্য সাধারণ ব্রাউজার কুকিজ ব্যবহৃত হয়।',
      section7Title: '৭. আপনার অধিকার ও যোগাযোগ',
      section7Content: 'আপনার সংরক্ষিত তথ্যের কোনো পরিবর্তন বা সংশোধনের জন্য আপনি সরাসরি আমাদের হটলাইন বা WhatsApp-এ যোগাযোগ করতে পারেন।',
    },
    terms: {
      headline: 'ব্যবহারের শর্তাবলী (Terms of Service)',
      lastUpdated: '২৫ অক্টোবর, ২০২৬',
      introText: 'CraftyKidsCo ওয়েবসাইটে আপনাকে স্বাগতম। এই সাইটটি ব্রাউজ করা, অ্যাকাউন্ট তৈরি করা বা যেকোনো পণ্য অর্ডার করার ক্ষেত্রে নিচের শর্তাবলী প্রযোজ্য হবে।',
      section1Title: '১. সাধারণ শর্ত ও গ্রাহক যোগ্যতা',
      section1Content: 'এই ওয়েবসাইট থেকে কেনাকাটা করার জন্য গ্রাহককে কমপক্ষে ১৮ বছর বা তদূর্ধ্ব বয়সী হতে হবে অথবা পিতামাতা/অভিভাবকের সরাসরি তত্ত্বাবধানে অর্ডার করতে হবে।',
      section2Title: '২. পণ্যের বিবরণ ও মূল্য নির্ধারণ (BDT / ৳)',
      section2Content: 'সকল পণ্যের মূল্য বাংলাদেশী টাকায় নির্ধারিত। স্টক থাকা সাপেক্ষে পণ্য সরবরাহ করা হয়।',
      section3Title: '৩. অর্ডার প্রক্রিয়া ও নিশ্চয়তা',
      section3Content: 'অর্ডার প্লেস করার পর সিস্টেম বা প্রতিনিধির মাধ্যমে ভেরিফিকেশন কল বা এসএমএস দেওয়া হতে পারে।',
      section4Title: '৪. মূল্য পরিশোধ ও ক্যাশ অন ডেলিভারি (COD)',
      section4Content: 'সারা বাংলাদেশে আমাদের সবচেয়ে জনপ্রিয় পেমেন্ট মাধ্যম ক্যাশ অন ডেলিভারি (COD)। পণ্য হাতে পেয়ে মূল্য পরিশোধ করার সুযোগ রয়েছে।',
      section5Title: '৫. ডেলিভারি নীতিমালা ও সময়সীমা',
      section5Content: 'ঢাকার ভেতরে ২৪-৪৮ ঘণ্টা (চার্জ ৳৬০) এবং ঢাকার বাইরে ৪৮-৭২ ঘণ্টা (চার্জ ৳১২০)। ৳১,০০০ বা তার বেশি অর্ডারে সারা বাংলাদেশে ফ্রি ডেলিভারি।',
      section6Title: '৬. ৭ দিনের রিটার্ন ও রিপ্লেসমেন্ট পলিসি',
      section6Content: 'পণ্য ভাঙা বা ত্রুটিপূর্ণ পেলে ডেলিভারির ৭ দিনের মধ্যে প্রমাণসহ জানালে সম্পূর্ণ বিনামূল্যে রিপ্লেসমেন্ট দেওয়া হবে।',
      section7Title: '৭. নিরাপদ ব্যবহার ও অভিভাবকের সতর্কতা',
      section7Content: 'আমাদের সকল পণ্য ১০০% প্রাকৃতিক ও নন-টক্সিক। ৩ বছরের নিচের শিশুদের ক্ষেত্রে অভিভাবকের প্রত্যক্ষ তত্ত্বাবধানে খেলনা ব্যবহারের অনুরোধ করা হচ্ছে।',
      section8Title: '৮. মেধা-স্বত্ব ও কপিরাইট',
      section8Content: 'CraftyKidsCo-এর লোগো, নাম, পণ্যের ছবি ও কন্টেন্টের স্বত্বাধিকার বাংলাদেশ কপিরাইট ও ট্রেডমার্ক আইন অনুযায়ী সংরক্ষিত।',
      section9Title: '৯. প্রযোজ্য আইন ও সরকারি নীতিমালা',
      section9Content: 'এই শর্তাবলী গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের ডিজিটাল কমার্স পরিচালনা নির্দেশিকা ২০২১ ও ভোক্তা অধিকার সংরক্ষণ আইন অনুযায়ী পরিচালিত।',
      section10Title: '১০. যোগাযোগ ও গ্রাহক সেবা',
      section10Content: 'যেকোনো জিজ্ঞাসা বা সহায়তার জন্য আমাদের হটলাইন বা WhatsApp এ সরাসরি যোগাযোগ করুন।',
    },
  },
};
