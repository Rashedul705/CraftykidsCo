'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Filter, SlidersHorizontal, ArrowUpDown, Search, RotateCcw, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getAllProducts } from '@/lib/store';
import { sampleCategories } from '@/lib/sample-data';
import { useCart } from '@/context/CartContext';

export default function ShopPage() {
  const { addItem } = useCart();
  const [locale, setLocale] = useState<'bn' | 'en'>('bn');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('best_selling');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

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

        // Age group filter
        if (selectedAge !== 'all') {
          const minAge = product.targetAgeMin || 0;
          if (selectedAge === '1-3' && minAge > 3) return false;
          if (selectedAge === '3-5' && (minAge < 2 || minAge > 5)) return false;
          if (selectedAge === '5+' && minAge < 4) return false;
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

  const handleQuickAdd = (productId: string) => {
    const product = allProducts.find((p) => p.slug === productId || p.id === productId);
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
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#FF6B6B] text-white shadow-sm'
                : 'bg-white border border-[#EFE9E0] text-[#2B2B2B] hover:border-[#FF6B6B]'
            }`}
          >
            {locale === 'bn' ? 'সব পণ্য (All)' : 'All Products'}
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

            {/* Age Filter */}
            <div className="space-y-3">
              <span className="font-heading font-bold text-sm text-[#2B2B2B] block">
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
                আমাদের প্রতিটি ক্রেয়ন ফুড-গ্রেড মোম দিয়ে তৈরি এবং নন-টক্সিক সার্টিফাইড।
              </p>
            </div>
          </aside>

          {/* Main Catalog Section */}
          <div className="lg:col-span-3 space-y-4">
            {/* Top Toolbar: Result count & Sort dropdown */}
            <div className="bg-white border border-[#EFE9E0] rounded-[18px] p-3 px-4 flex items-center justify-between shadow-sm">
              <span className="text-xs font-bold text-[#6B6B6B]">
                {locale === 'bn'
                  ? `মোট ${filteredProducts.length}টি পণ্য পাওয়া গেছে`
                  : `Showing ${filteredProducts.length} products`}
              </span>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#2B2B2B] focus:outline-none cursor-pointer"
                >
                  <option value="best_selling">জনপ্রিয়তা অনুযায়ী (Best Selling)</option>
                  <option value="price_asc">দাম: কম থেকে বেশি (Price: Low to High)</option>
                  <option value="price_desc">দাম: বেশি থেকে কম (Price: High to Low)</option>
                  <option value="newest">নতুন পণ্য (Newest)</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map((p) => (
                  <ProductCard
                    key={p.slug}
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
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[24px] border border-[#EFE9E0] p-12 text-center space-y-4">
                <span className="text-4xl block">🔍</span>
                <h3 className="font-heading font-bold text-lg text-[#2B2B2B]">
                  {locale === 'bn' ? 'কোনো পণ্য খুঁজে পাওয়া যায়নি' : 'No products found'}
                </h3>
                <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
                  অন্য কোনো ফিল্টার বা সার্চ টার্ম চেষ্টা করে দেখুন।
                </p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 rounded-full bg-[#FF6B6B] text-white font-bold text-xs"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Centralized Footer */}
      <Footer />

      <MobileBottomNav activeTab="shop" locale={locale} />
    </div>
  );
}
