'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Gift, Sparkles, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';

export default function BundlesPage() {
  const { addItem } = useCart();
  const [added, setAdded] = useState<string | null>(null);

  const bundles = [
    {
      id: 'bundle-mega-artist',
      slug: 'little-artist-mega-gift-bundle',
      titleBn: 'ছোট আর্টিস্ট মেগা গিফট কম্বো (মোম + প্লে-ডো + আর্ট প্যাড)',
      titleEn: 'Little Artist Mega Gift Bundle',
      price: 699,
      originalPrice: 890,
      description: 'একটি গিফট বক্সে পাচ্ছেন: ২৪ কালার ন্যাচারাল মোমের রঙ + ৬ রঙের প্লে-ডো + আর্ট প্যাড ও ৪টি শেপ কাটার। জন্মদিনের দারুণ উপহার!',
      imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
      badge: '৩০% সাশ্রয়',
    },
    {
      id: 'bundle-toddler-starter',
      slug: 'toddler-starter-art-combo',
      titleBn: 'টডলার স্টার্টার আর্ট সেট (মোটা মোম + কাঠের পাজল)',
      titleEn: 'Toddler Starter Art Set',
      price: 590,
      originalPrice: 680,
      description: '১-৩ বছরের শিশুদের প্রথম আঁকাআঁকি ও ব্রেইন ডেভেলপমেন্টের জন্য ট্রায়াঙ্গুলার মোটা মোম এবং কাঠের বর্ণমালা পাজল।',
      imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80',
      badge: 'টপ রেটেড',
    },
  ];

  const handleAddBundle = (bundle: typeof bundles[0]) => {
    addItem({
      id: bundle.id,
      productId: bundle.id,
      productSlug: bundle.slug,
      title: bundle.titleEn,
      titleBn: bundle.titleBn,
      imageUrl: bundle.imageUrl,
      price: bundle.price,
      quantity: 1,
    });
    setAdded(bundle.id);
    setTimeout(() => setAdded(null), 1500);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 md:pb-12 text-[#2B2B2B]">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FF6B6B] text-white shadow-sm">
            <Gift className="w-3.5 h-3.5" />
            গিফট সেট ও কম্বো অফার
          </span>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#2B2B2B]">
            একসাথে কিনুন এবং ৩০% পর্যন্ত সাশ্রয় করুন
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B]">
            বাচ্চাদের জন্মদিন, ঈদ বা যেকোনো উৎসবের জন্য আকর্ষণীয় প্যাকেজিংয়ে প্রস্তুত গিফট বক্স।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {bundles.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-[28px] border-2 border-[#FFD9D9] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div className="space-y-4">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#EFE9E0]">
                  <Image src={b.imageUrl} alt={b.titleBn} fill className="object-cover" />
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-[#FF6B6B] text-white shadow-md">
                    {b.badge}
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="font-heading font-black text-xl text-[#2B2B2B] leading-tight">
                    {b.titleBn}
                  </h2>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed">{b.description}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-[#EFE9E0] mt-4 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-[#FF6B6B]">৳{b.price}</span>
                  <span className="block text-xs line-through text-[#6B6B6B]">৳{b.originalPrice}</span>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleAddBundle(b)}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {added === b.id ? 'Added!' : 'Add to Cart'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Centralized Footer */}
      <Footer />

      <MobileBottomNav activeTab="shop" />
    </div>
  );
}
