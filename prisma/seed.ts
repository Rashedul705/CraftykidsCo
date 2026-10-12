import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const seedSampleData = {
  categories: [
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
  ],

  badges: [
    {
      nameBn: '১০০% বিষাক্ত নয় (Non-Toxic)',
      nameEn: '100% Non-Toxic Wax',
      color: '#7BD389',
      description: 'শিশুর ত্বকে সম্পূর্ণ নিরাপদ ও খাদ্য মানের মোম',
    },
    {
      nameBn: 'সহজে ধুয়ে ফেলা যায়',
      nameEn: 'Washable with Water',
      color: '#5BC0EB',
      description: 'পোশাক বা দেয়াল থেকে সহজে পানি দিয়ে পরিষ্কারযোগ্য',
    },
    {
      nameBn: '২+ বছরের বাচ্চাদের জন্য',
      nameEn: 'Ages 2+ Safe',
      color: '#FFC93C',
      description: 'ছোট হাতের গ্রিপিংয়ের জন্য বিশেষভাবে তৈরি',
    },
  ],

  deliveryZones: [
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
  ],

  coupons: [
    {
      code: 'RONG10',
      discountType: 'PERCENTAGE',
      discountVal: 10,
      minOrderVal: 500,
      maxDiscount: 150,
      usageLimit: 100,
    },
    {
      code: 'FREE60',
      discountType: 'FIXED',
      discountVal: 60,
      minOrderVal: 600,
      usageLimit: 50,
    },
  ],

  sampleProducts: [
    {
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
  ],

  sampleBundle: {
    titleBn: 'ছোট আর্টিস্ট গিফট বক্স কম্বো (মোম + প্লে-ডো + আর্ট প্যাড)',
    titleEn: 'Little Artist Mega Gift Bundle (Crayons + Dough + Art Pad)',
    slug: 'little-artist-mega-gift-bundle',
    price: 699,
    originalPrice: 890,
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
  },
};

async function main() {
  console.log('Seeding Rongdhonu Kids database mock data...');
  // Check if DB is reachable
  try {
    // Delivery zones
    for (const zone of seedSampleData.deliveryZones) {
      await prisma.deliveryZone.create({
        data: {
          name: zone.name,
          districts: zone.districts,
          standardCharge: zone.standardCharge,
          freeDeliveryMinimum: zone.freeDeliveryMinimum,
        },
      });
    }

    console.log('✔ Delivery zones seeded');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log('Database connection not yet configured or pending:', msg);
  }
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
