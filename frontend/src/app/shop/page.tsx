'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  RotateCcw,
  Sparkles,
  Baby,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getAllProducts } from '@/lib/store';
import { sampleCategories } from '@/lib/sample-data';
import { useCart } from '@/context/CartContext';

function ShopContent() {
  const searchParams = useSearchParams();
  const { addItem } = useCart();
  const [locale, setLocale] = useState<'bn' | 'en'>('bn');

  const initialAge = searchParams.get('age') || 'all';
  const initialCategory = searchParams.get('category') || 'all';
  const initialFilter = searchParams.get('filter') || '';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedAge, setSelectedAge] = useState<string>(initialAge);
  const [sortBy, setSortBy] = useState<string>(
    initialFilter === 'new' ? 'newest' : 'best_selling'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Sync state if URL query params change (e.g. user clicked age pill from home)
  useEffect(() => {
    const ageFromUrl = searchParams.get('age');
    if (ageFromUrl) setSelectedAge(ageFromUrl);

    const catFromUrl = searchParams.get('category');
    if (catFromUrl) setSelectedCategory(catFromUrl);

    const filterFromUrl = searchParams.get('filter');
    if (filterFromUrl === 'new') setSortBy('newest');
    else if (filterFromUrl === 'trending') setSortBy('best_selling');
  }, [searchParams]);

  const allProducts = getAllProducts();

  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((product) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle =
            product.titleBn.toLowerCase().includes(q) ||
            product.titleEn.toLowerCase().includes(q);
          if (!matchesTitle) return false;
        }

        // Category filter
        if (selectedCategory !== 'all') {
          if (product.categorySlug === selectedCategory) {
            // direct match
          } else if (selectedCategory === 'art-kits') {
            if (!product.slug.includes('paint') && !product.slug.includes('kit')) return false;
          } else if (selectedCategory === 'wax-crayons') {
            if (!product.slug.includes('crayon') && !product.slug.includes('washable')) return false;
          } else if (selectedCategory === 'educational-toys') {
            if (!product.slug.includes('blocks') && !product.slug.includes('edu')) return false;
          } else if (selectedCategory === 'play-dough-clay') {
            if (!product.slug.includes('dough') && !product.slug.includes('clay')) return false;
          } else {
            return false;
          }
        }

        // Kid's Age group filter
        if (selectedAge !== 'all') {
          const minAge = product.targetAgeMin || 0;
          const maxAge = product.targetAgeMax || 99;
          if (selectedAge === '1-3') {
            if (minAge > 3) return false;
          } else if (selectedAge === '3-5') {
            if (minAge > 5 || maxAge < 3) return false;
          } else if (selectedAge === '5+') {
            if (maxAge < 5) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.baseSalePrice || a.basePrice;
        const priceB = b.baseSalePrice || b.basePrice;

        if (sortBy === 'price_asc') return priceA - priceB;
        if (sortBy === 'price_desc') return priceB - priceA;
        if (sortBy === 'best_selling') return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
        return 0; // default newest
      });
  }, [allProducts, searchQuery, selectedCategory, selectedAge, sortBy]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedAge('all');
    setSearchQuery('');
    setSortBy('best_selling');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 md:pb-12 text-[#2B2B2B]">
      <Header locale={locale} onToggleLocale={() => setLocale(locale === 'bn' ? 'en' : 'bn')} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-xs text-[#6B6B6B] flex items-center gap-1.5 mb-1">
              <Link href="/" className="hover:text-[#FF6B6B]">হোম</Link>
              <span>/</span>
              <span className="font-bold text-[#2B2B2B]">সব পণ্য ও ক্যাটালগ</span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B]">
              {locale === 'bn' ? 'শিশুদের নিরাপদ মোমের রঙ ও খেলনার শপ' : 'Kids Safe Art & Toy Catalog'}
            </h1>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6B6B6B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'bn' ? 'মোম, পাজল বা খেলনা খুঁজুন...' : 'Search crayons, toys...'}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-[#EFE9E0] text-sm text-[#2B2B2B] focus:outline-none focus:border-[#FF6B6B] shadow-sm"
            />
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#FF6B6B] text-white shadow-sm'
                : 'bg-white border border-[#EFE9E0] text-[#2B2B2B] hover:border-[#FF6B6B]'
            }`}
          >
            {locale === 'bn' ? 'সব ক্যাটাগরি (All)' : 'All Categories'}
          </button>
          {sampleCategories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setSelectedCategory(c.slug)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === c.slug
                  ? 'bg-[#FF6B6B] text-white shadow-sm'
                  : 'bg-white border border-[#EFE9E0] text-[#2B2B2B] hover:border-[#FF6B6B]'
              }`}
            >
              {locale === 'bn' ? c.nameBn : c.nameEn}
            </button>
          ))}
        </div>

        {/* Quick Age Group Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
          <span className="text-xs font-bold text-[#6B6B6B] flex items-center gap-1 shrink-0 pl-1">
            <Baby className="w-3.5 h-3.5 text-[#FF6B6B]" /> বাচ্চার বয়স:
          </span>
          {[
            { id: 'all', label: 'সব বয়স (All)', emoji: '🎈' },
            { id: '1-3', label: '১ - ৩ বছর (Toddler)', emoji: '👶' },
            { id: '3-5', label: '৩ - ৫ বছর (Pre-School)', emoji: '🎨' },
            { id: '5+', label: '৫+ বছর (School Age)', emoji: '🚀' },
          ].map((age) => (
            <button
              key={age.id}
              onClick={() => setSelectedAge(age.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedAge === age.id
                  ? 'bg-[#2B2B2B] text-white shadow-sm'
                  : 'bg-white border border-[#EFE9E0] text-[#6B6B6B] hover:text-[#2B2B2B] hover:border-[#2B2B2B]'
              }`}
            >
              <span>{age.emoji}</span>
              <span>{age.label}</span>
            </button>
          ))}
        </div>

        {/* Layout: Sidebar Filter & Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block bg-white border border-[#EFE9E0] rounded-[22px] p-5 space-y-6 shadow-sm sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
              <div className="flex items-center gap-2 font-heading font-bold text-base text-[#2B2B2B]">
                <Filter className="w-4 h-4 text-[#FF6B6B]" />
                <span>{locale === 'bn' ? 'ফিল্টার' : 'Filters'}</span>
              </div>
              <button
                onClick={resetFilters}
                className="text-xs text-[#6B6B6B] hover:text-[#FF6B6B] flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Age Filter Radio in Sidebar */}
            <div className="space-y-3">
              <span className="font-heading font-bold text-sm text-[#2B2B2B] block flex items-center gap-1.5">
                <Baby className="w-4 h-4 text-[#FF6B6B]" />
                {locale === 'bn' ? 'বয়স সীমা (Age Group)' : 'Age Group'}
              </span>
              <div className="space-y-2 text-xs font-medium text-[#2B2B2B]">
                {[
                  { id: 'all', label: 'সব বয়স (All Ages)' },
                  { id: '1-3', label: '১ - ৩ বছর (Toddler)' },
                  { id: '3-5', label: '৩ - ৫ বছর (Pre-school)' },
                  { id: '5+', label: '৫+ বছর (School Age)' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2 cursor-pointer hover:text-[#FF6B6B]">
                    <input
                      type="radio"
                      name="age_filter"
                      checked={selectedAge === item.id}
                      onChange={() => setSelectedAge(item.id)}
                      className="accent-[#FF6B6B]"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Safety Certifications Notice */}
            <div className="p-3.5 rounded-2xl bg-[#EBF8EE] border border-[#C4EDCD] text-xs text-[#2D7A3E] space-y-1">
              <span className="font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#7BD389]" />
                ১০০% নিরাপদ গ্যারান্টি
              </span>
              <p className="text-[11px] leading-tight text-[#2D7A3E]/80">
                আমাদের প্রতিটি ক্রেয়ন প্রাকৃতিক মোম দিয়ে তৈরি এবং শিশু-নিরাপদ নন-টক্সিক সার্টিফাইড।
              </p>
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Active Filters count and sort */}
            <div className="flex items-center justify-between bg-white border border-[#EFE9E0] p-3 sm:px-4 rounded-2xl shadow-xs">
              <span className="text-xs font-bold text-[#6B6B6B]">
                মোট <span className="text-[#FF6B6B]">{filteredProducts.length}</span> টি পণ্য পাওয়া গেছে
              </span>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#6B6B6B] hidden sm:inline">সর্ট করুন:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#FAF7F2] border border-[#EFE9E0] text-[#2B2B2B] text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#FF6B6B]"
                >
                  <option value="best_selling">জনপ্রিয় পণ্য (Popular)</option>
                  <option value="price_asc">দাম: কম থেকে বেশি</option>
                  <option value="price_desc">দাম: বেশি থেকে কম</option>
                </select>
              </div>
            </div>

            {/* Empty state */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#EFE9E0] p-12 text-center space-y-3">
                <span className="text-3xl block">🔍</span>
                <h3 className="font-heading font-black text-lg text-[#2B2B2B]">
                  কোনো পণ্য খুঁজে পাওয়া যায়নি
                </h3>
                <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
                  আপনার নির্বাচিত ফিল্টারে কোনো পণ্য মেলেনি। অন্য ক্যাটাগরি বা বয়স নির্বাচন করে চেষ্টা করুন।
                </p>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-full bg-[#FF6B6B] text-white text-xs font-bold hover:bg-[#E05353] transition-colors"
                >
                  ফিল্টার রিসেট করুন
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id || product.slug}
                    id={product.id || product.slug}
                    slug={product.slug || product.id}
                    title={locale === 'bn' ? product.titleBn : product.titleEn}
                    titleEn={product.titleEn}
                    price={product.basePrice ?? product.price}
                    salePrice={product.baseSalePrice ?? product.salePrice}
                    badge={product.badge}
                    ageBadgeText={product.targetAgeMin ? `${product.targetAgeMin}+ বছর` : '২+ বছর'}
                    safetyBadgeText="১০০% নিরাপদ"
                    rating={product.rating}
                    imageUrl={product.imageUrl || (product as any).image}
                    locale={locale}
                    hasVariations={Boolean(
                      product.hasVariations ||
                        (product.variants && product.variants.length > 0) ||
                        (product.variations && product.variations.length > 0)
                    )}
                    variants={product.variants || product.variations}
                    stock={product.stock}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav activeTab="home" />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-xs font-bold text-[#6B6B6B]">
          ক্যাটালগ লোড হচ্ছে...
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
