'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ProductCard } from '@/components/storefront/ProductCard';
import { sampleCategories } from '@/lib/sample-data';
import { getProductsByCategory } from '@/lib/store';
import { useCart } from '@/context/CartContext';

function CategoryContent() {
  const params = useParams();
  const slug = (params?.slug as string) || 'wax-crayons';
  const { addItem } = useCart();
  const [locale, setLocale] = useState<'bn' | 'en'>('bn');

  const currentCategory = sampleCategories.find((c) => c.slug === slug) || sampleCategories[0];
  const products = getProductsByCategory(slug);

  const handleQuickAdd = (productId: string) => {
    const product = products.find((p) => p.slug === productId || p.id === productId);
    if (!product) return;

    addItem({
      id: `${product.id}-default`,
      productId: product.id,
      productSlug: product.slug,
      title: product.titleEn,
      titleBn: product.titleBn,
      imageUrl: product.imageUrl,
      price: product.baseSalePrice || product.basePrice,
      quantity: 1,
    });
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
        <Link href="/" className="hover:text-[#FF6B6B]">হোম</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[#FF6B6B]">ক্যাটাগরি</Link>
        <span>/</span>
        <span className="font-bold text-[#2B2B2B]">{locale === 'bn' ? currentCategory.nameBn : currentCategory.nameEn}</span>
      </div>

      {/* Category Header Banner */}
      <div className="bg-gradient-to-r from-[#FFF3E6] via-[#FFF9F0] to-[#E8F7FD] border border-[#FFE4CC] rounded-[28px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FF6B6B] text-white">
            <Sparkles className="w-3.5 h-3.5" />
            {locale === 'bn' ? 'স্পেশাল কালেকশন' : 'Special Collection'}
          </span>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#2B2B2B]">
            {locale === 'bn' ? currentCategory.nameBn : currentCategory.nameEn}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] max-w-lg">
            {currentCategory.description}
          </p>
        </div>

        {/* Subcategories (if any) */}
        {currentCategory.children && currentCategory.children.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {currentCategory.children.map((sub) => (
              <span
                key={sub.slug}
                className="px-3.5 py-1.5 rounded-full bg-white border border-[#EFE9E0] text-xs font-bold text-[#2B2B2B] shadow-sm hover:border-[#FF6B6B] cursor-pointer"
              >
                {locale === 'bn' ? sub.nameBn : sub.nameEn}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg text-[#2B2B2B]">
            {locale === 'bn' ? `পণ্যসমূহ (${products.length}টি)` : `Products (${products.length})`}
          </h2>
          <Link href="/shop" className="text-xs font-bold text-[#FF6B6B] flex items-center gap-1 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> সব ক্যাটাগরি দেখুন
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => (
            <Link key={p.slug} href={`/product/${p.slug}`} className="block">
              <ProductCard
                id={p.slug}
                slug={p.slug}
                title={locale === 'bn' ? p.titleBn : p.titleEn}
                price={p.basePrice}
                salePrice={p.baseSalePrice}
                imageUrl={p.imageUrl}
                ageBadgeText={`${p.targetAgeMin}+ বছর`}
                safetyBadgeText="১০০% নিরাপদ"
                locale={locale}
                onQuickAdd={() => handleQuickAdd(p.slug)}
              />
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function CategoryDetailPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 md:pb-12 text-[#2B2B2B]">
      <Header />
      <Suspense fallback={<div className="p-12 text-center text-xs">লোড হচ্ছে...</div>}>
        <CategoryContent />
      </Suspense>
      <MobileBottomNav activeTab="shop" />
    </div>
  );
}
