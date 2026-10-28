'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Star,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  X,
  Send,
  Tag,
  Copy,
  Check,
  Flame,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ProductCard } from '@/components/storefront/ProductCard';
import { sampleCategories, sampleProducts, SampleCategory } from '@/lib/sample-data';
import { toBanglaDigits } from '@/lib/utils';
import { BRAND_CONFIG } from '@/lib/brand';
import { SiteSettings, defaultSiteSettings, HeroSlide } from '@/lib/site-settings';
import { useToast } from '@/components/ui/Toast';
import { isProductOutOfStock, sortProductsByStockAndRecency } from '@/lib/product-utils';

export default function HomePage() {
  const [locale, setLocale] = useState<'bn' | 'en'>('bn');
  const toast = useToast();
  const [couponCopied, setCouponCopied] = useState(false);
  const [subscriberInput, setSubscriberInput] = useState('');
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [categories, setCategories] = useState<SampleCategory[]>(sampleCategories);
  const [products, setProducts] = useState<any[]>(sampleProducts);
  const [, setIsLoading] = useState<boolean>(true);

  const heroSlides: HeroSlide[] =
    settings.heroSlides && settings.heroSlides.length > 0
      ? settings.heroSlides.filter((s) => s.isActive !== false)
      : defaultSiteSettings.heroSlides;

  // Hero Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  const safeCurrentSlide = currentSlide < heroSlides.length ? currentSlide : 0;
  const [isHovered, setIsHovered] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Auto-play timer for Hero Slider
  useEffect(() => {
    if (isHovered || isZoomModalOpen || heroSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHovered, isZoomModalOpen, heroSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    if (touchStart - touchEnd > 50) nextSlide();
    if (touchStart - touchEnd < -50) prevSlide();
    setTouchStart(null);
  };

  const toggleLocale = () => {
    setLocale((prev) => (prev === 'bn' ? 'en' : 'bn'));
  };

  // Copy coupon handler
  const handleCopyCoupon = (code: string = 'CRAFTY10') => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(code);
      setCouponCopied(true);
      toast.success(`Coupon code '${code}' copied! Use at checkout.`);
      setTimeout(() => setCouponCopied(false), 3000);
    }
  };

  const handleCouponSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (subscriberInput.trim()) {
      handleCopyCoupon('CRAFTY10');
      setSubscriberInput('');
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/site-settings');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.settings) {
            setSettings(data.settings);
          }
        }
      } catch (err) {
        console.warn('Could not fetch dynamic site settings:', err);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.categories || data.data || []);
          if (items.length > 0) {
            setCategories(items);
          }
        }
      } catch (err) {
        console.warn('Could not fetch categories from API:', err);
      }
    };

    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.products || data.data || []);
          if (items.length > 0) {
            setProducts(items);
          }
        }
      } catch (err) {
        console.warn('Could not fetch products from API, using fallback data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
    fetchCategories();
    fetchProducts();
  }, []);

  // Sorted Products Rule:
  // 1. In-stock products first, stock out products last
  // 2. Recently added products first within each group
  const sortedProducts = useMemo(() => {
    return sortProductsByStockAndRecency(products);
  }, [products]);

  // 1. New Arrival Products (4 cards)
  const newArrivalProducts = useMemo(() => {
    const filtered = sortedProducts.filter((p) => p.isNewArrival || p.badge === 'New');
    const source = filtered.length >= 4 ? filtered : sortedProducts;
    return source.slice(0, 4);
  }, [sortedProducts]);

  // 2. Trending Now Products (4 cards)
  const trendingProducts = useMemo(() => {
    const filtered = sortedProducts.filter(
      (p) => p.isBestSeller || p.badge === 'Popular' || p.badge === 'Best Seller'
    );
    const source = filtered.length > 0 ? filtered : sortedProducts;
    return source.slice(0, 4);
  }, [sortedProducts]);

  // 3. Category-Based Products: Show ALL categories which have product
  const categoriesWithProducts = useMemo(() => {
    return categories
      .map((cat) => {
        const catSlug = cat.slug;
        const catProducts = sortedProducts.filter((p) => {
          if (p.categorySlug === catSlug || p.primaryCategorySlug === catSlug || p.category === catSlug) {
            return true;
          }
          if (
            p.category &&
            typeof p.category === 'string' &&
            cat.nameEn &&
            p.category.toLowerCase() === cat.nameEn.toLowerCase()
          ) {
            return true;
          }
          // Slug matching fallbacks for core categories
          if (catSlug === 'art-kits' && p.slug && (p.slug.includes('paint') || p.slug.includes('kit'))) {
            return true;
          }
          if (
            catSlug === 'wax-crayons' &&
            p.slug &&
            (p.slug.includes('crayon') || p.slug.includes('washable'))
          ) {
            return true;
          }
          if (catSlug === 'play-dough-clay' && p.slug && (p.slug.includes('dough') || p.slug.includes('clay'))) {
            return true;
          }
          if (
            catSlug === 'educational-toys' &&
            p.slug &&
            (p.slug.includes('edu') || p.slug.includes('blocks') || p.slug.includes('wooden'))
          ) {
            return true;
          }
          if (catSlug === 'wooden-toys' && p.slug && (p.slug.includes('wooden') || p.slug.includes('blocks'))) {
            return true;
          }
          if (
            catSlug === 'sketchbooks' &&
            p.slug &&
            (p.slug.includes('book') || p.slug.includes('sketch') || p.slug.includes('paper'))
          ) {
            return true;
          }
          if (catSlug === 'puzzles' && p.slug && (p.slug.includes('puzzle') || p.slug.includes('game'))) {
            return true;
          }
          return false;
        });

        return {
          category: cat,
          products: catProducts,
        };
      })
      .filter((item) => item.products.length > 0);
  }, [categories, sortedProducts]);

  const isBn = locale === 'bn';

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2B2B2B]">
      {/* 1. Top Bar, 2. Header, 3. Category Menu Bar */}
      <Header
        locale={locale}
        onToggleLocale={toggleLocale}
        announcement={settings.announcement}
        settings={settings}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-10 sm:space-y-14">
        {/* ========================================================================= */}
        {/* 1. Hero Banner Slider (Admin Managed)                                      */}
        {/* ========================================================================= */}
        <section
          className="relative overflow-hidden rounded-2xl border border-[#EFE9E0] select-none group bg-white shadow-xs"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Slides Container */}
          <div className="relative w-full min-h-[440px] sm:min-h-[460px] lg:min-h-[480px]">
            {heroSlides.map((slide, idx) => {
              const isActive = idx === safeCurrentSlide;
              return (
                <div
                  key={slide.id}
                  className={`transition-opacity duration-700 ease-in-out ${
                    isActive
                      ? 'opacity-100 z-10 relative'
                      : 'opacity-0 z-0 absolute inset-0 pointer-events-none'
                  } bg-gradient-to-r ${slide.bgGradient || 'from-[#FFF7ED] to-[#FFEDD5]'} p-6 sm:p-10 lg:p-12 h-full flex flex-col justify-center`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Banner Text Content */}
                    <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#2B2B2B] font-bold text-xs shadow-2xs border border-[#EFE9E0]">
                        <Sparkles className="w-3.5 h-3.5 text-[#D6403B]" />
                        <span>{isBn ? slide.tagBn : slide.tagEn}</span>
                      </div>

                      <h1 className="font-heading font-black text-2xl sm:text-4xl lg:text-5xl text-[#2B2B2B] leading-tight tracking-tight">
                        {isBn ? slide.titleBn : slide.titleEn}
                        <span className="block text-xl sm:text-3xl lg:text-4xl mt-1.5 text-[#D6403B]">
                          {slide.titleBnHighlight}
                        </span>
                      </h1>

                      <p className="text-sm sm:text-base text-[#6B6B6B] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                        {isBn ? slide.descBn : slide.descEn}
                      </p>

                      {/* Primary and Secondary CTA Buttons in English */}
                      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                        <Link
                          href={slide.ctaPrimaryHref || '/shop'}
                          className="px-7 sm:px-8 py-3.5 rounded-xl bg-[#D6403B] hover:bg-[#BF3430] text-white font-bold text-sm sm:text-base shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <span>{slide.ctaPrimaryText || 'Order Now'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                          href={slide.ctaSecondaryHref || '/category/wax-crayons'}
                          className="px-6 py-3.5 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#EFE9E0] text-[#2B2B2B] font-bold text-sm sm:text-base shadow-2xs transition-all cursor-pointer"
                        >
                          {slide.ctaSecondaryText || 'View Details'}
                        </Link>
                      </div>
                    </div>

                    {/* Banner Hero Photo with Zoom Lightbox */}
                    <div className="lg:col-span-5 relative">
                      <div
                        className="relative w-full aspect-4/3 sm:aspect-16/10 lg:aspect-square rounded-2xl overflow-hidden shadow-sm border-2 border-white group/image cursor-pointer"
                        onClick={() => setIsZoomModalOpen(true)}
                        title="ছবি বড় করে দেখুন"
                      >
                        <div className="relative w-full h-full overflow-hidden bg-white">
                          <Image
                            src={slide.imageUrl}
                            alt={slide.titleBn}
                            fill
                            priority={idx === 0}
                            className={`object-cover transition-transform duration-[6000ms] ease-out ${
                              isActive ? 'scale-110' : 'scale-100'
                            } group-hover/image:scale-115`}
                          />
                        </div>

                        {/* Floating Bottom Card Over Image */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end justify-between p-4 pointer-events-none">
                          <div className="bg-white/95 backdrop-blur-xs rounded-xl p-3 shadow-xs border border-white/60 max-w-[85%]">
                            <p className="text-xs font-bold text-[#D6403B]">
                              {slide.badgeTop}
                            </p>
                            <p className="text-[11px] text-[#6B6B6B] font-medium mt-0.5 truncate">
                              {slide.badgeBottom}
                            </p>
                          </div>

                          <div className="bg-black/60 text-white p-2 rounded-xl flex items-center gap-1 shadow-xs shrink-0">
                            <Maximize2 className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Slider Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[#2B2B2B] hover:text-[#D6403B] shadow-sm flex items-center justify-center transition-all opacity-80 hover:opacity-100 z-20 cursor-pointer"
            title="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[#2B2B2B] hover:text-[#D6403B] shadow-sm flex items-center justify-center transition-all opacity-80 hover:opacity-100 z-20 cursor-pointer"
            title="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Bottom Slider Dots Indicator */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
            {heroSlides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(i)}
                className={`rounded-full transition-all cursor-pointer ${
                  safeCurrentSlide === i
                    ? 'w-6 h-2 bg-[#D6403B] shadow-xs'
                    : 'w-2 h-2 bg-white/70 hover:bg-white'
                }`}
                title={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </section>

        {/* Fullscreen Hero Image Zoom Modal */}
        {isZoomModalOpen && heroSlides[safeCurrentSlide] && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
              <button
                onClick={() => setIsZoomModalOpen(false)}
                className="absolute -top-12 right-0 text-white hover:text-[#D6403B] p-2 cursor-pointer z-10"
                title="Close"
              >
                <X className="w-7 h-7" />
              </button>
              <div className="relative w-full aspect-square max-h-[80vh] rounded-2xl overflow-hidden bg-white shadow-2xl">
                <Image
                  src={heroSlides[safeCurrentSlide].imageUrl}
                  alt={heroSlides[safeCurrentSlide].titleBn}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. CHOOSE CATEGORY BASE PRODUCT                                           */}
        {/* ========================================================================= */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-[#2B2B2B]">
                Choose by Category
              </h2>
              <p className="text-xs sm:text-sm text-[#6B6B6B]">
                {isBn
                  ? 'শিশুর বয়স ও আগ্রহ অনুযায়ী পছন্দের বিভাগ বেছে নিয়ে কেনাকাটা করুন'
                  : 'Select your preferred category based on your child’s age and interest'}
              </p>
            </div>
            <Link
              href="/shop"
              className="text-xs sm:text-sm font-bold text-[#D6403B] hover:text-[#BF3430] flex items-center gap-1 border border-[#EFE9E0] px-3.5 py-1.5 rounded-full hover:bg-white transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Row of circular category buttons */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4">
            {categoriesWithProducts.map(({ category }) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="group flex flex-col items-center text-center transition-transform hover:-translate-y-1"
              >
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 border-2 border-[#EFE9E0] group-hover:border-[#D6403B] transition-all flex items-center justify-center relative overflow-hidden shadow-2xs"
                  style={{ backgroundColor: category.badgeColor || '#FAF7F2' }}
                >
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <Image
                      src={category.imageUrl}
                      alt={category.nameBn}
                      fill
                      sizes="80px"
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </div>
                <span className="mt-2 text-xs font-bold text-[#2B2B2B] group-hover:text-[#D6403B] transition-colors line-clamp-1">
                  {isBn ? category.nameBn : category.nameEn}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. NEW ARRIVAL (Recently added first, stock out last)                      */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#E8F7FD] flex items-center justify-center text-[#0B5F85]">
                <Sparkles className="w-4 h-4 text-[#0B5F85]" />
              </div>
              <div>
                <h2 className="font-heading font-black text-xl sm:text-2xl text-[#2B2B2B]">
                  New Arrivals
                </h2>
                <p className="text-xs sm:text-sm text-[#6B6B6B]">
                  {isBn
                    ? 'আমাদের সদ্য যুক্ত হওয়া ক্রিয়েটিভ কালেকশন'
                    : 'Our freshly curated creative toys and art supplies'}
                </p>
              </div>
            </div>
            <Link
              href="/shop?filter=new"
              className="text-xs sm:text-sm font-bold text-[#D6403B] hover:text-[#BF3430] flex items-center gap-1 border border-[#EFE9E0] px-3.5 py-1.5 rounded-full hover:bg-white transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {newArrivalProducts.map((product) => (
              <ProductCard
                key={product.id || product.slug}
                id={product.id || product.slug}
                slug={product.slug || product.id}
                title={product.titleBn || product.title}
                titleEn={product.titleEn}
                price={product.basePrice ?? product.price}
                salePrice={product.baseSalePrice ?? product.salePrice}
                badge={product.badge}
                ageBadgeText={`${toBanglaDigits(product.targetAgeMin || 3)}+ বছর`}
                safetyBadgeText="১০০% নিরাপদ"
                rating={product.rating}
                imageUrl={product.imageUrl || product.image}
                locale={locale}
                hasVariations={!!(product.variations && product.variations.length > 0)}
                stock={product.stock}
                isOutOfStock={isProductOutOfStock(product)}
              />
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. TRENDING NOW (Recently added first, stock out last)                     */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FEE2E2] flex items-center justify-center text-[#DC2626]">
                <Flame className="w-4 h-4 text-[#DC2626]" />
              </div>
              <div>
                <h2 className="font-heading font-black text-xl sm:text-2xl text-[#2B2B2B]">
                  Trending Now
                </h2>
                <p className="text-xs sm:text-sm text-[#6B6B6B]">
                  {isBn
                    ? 'অভিভাবকদের সবচেয়ে পছন্দের খেলনা ও রঙ'
                    : 'Most popular collections loved by parents and kids'}
                </p>
              </div>
            </div>
            <Link
              href="/shop?filter=trending"
              className="text-xs sm:text-sm font-bold text-[#D6403B] hover:text-[#BF3430] flex items-center gap-1 border border-[#EFE9E0] px-3.5 py-1.5 rounded-full hover:bg-white transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {trendingProducts.map((product) => (
              <ProductCard
                key={product.id || product.slug}
                id={product.id || product.slug}
                slug={product.slug || product.id}
                title={product.titleBn || product.title}
                titleEn={product.titleEn}
                price={product.basePrice ?? product.price}
                salePrice={product.baseSalePrice ?? product.salePrice}
                badge={product.badge}
                ageBadgeText={`${toBanglaDigits(product.targetAgeMin || 3)}+ বছর`}
                safetyBadgeText="১০০% নিরাপদ"
                rating={product.rating}
                imageUrl={product.imageUrl || product.image}
                locale={locale}
                hasVariations={!!(product.variations && product.variations.length > 0)}
                stock={product.stock}
                isOutOfStock={isProductOutOfStock(product)}
              />
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. CATEGORY BASE PRODUCTS - SHOW ALL CATEGORIES WHICH HAVE PRODUCT         */}
        {/* ========================================================================= */}
        {categoriesWithProducts.map(({ category, products: catProducts }) => (
          <section
            key={category.slug}
            id={`cat-${category.slug}`}
            className="space-y-4 scroll-mt-20 pt-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-black text-xl sm:text-2xl text-[#2B2B2B]">
                  {isBn ? category.nameBn : category.nameEn}
                </h2>
                <p className="text-xs sm:text-sm text-[#6B6B6B]">
                  {category.description ||
                    (isBn
                      ? `${category.nameBn} এর নিরাপদ ও শিক্ষামূলক পণ্যসমূহ`
                      : `Safe and creative collections for ${category.nameEn}`)}
                </p>
              </div>
              <Link
                href={`/category/${category.slug}`}
                className="text-xs sm:text-sm font-bold text-[#D6403B] hover:text-[#BF3430] flex items-center gap-1 border border-[#EFE9E0] px-3.5 py-1.5 rounded-full hover:bg-white transition-colors"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Product Grid: recently added first, stock out last */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {catProducts.slice(0, 8).map((product) => (
                <ProductCard
                  key={product.id || product.slug}
                  id={product.id || product.slug}
                  slug={product.slug || product.id}
                  title={product.titleBn || product.title}
                  titleEn={product.titleEn}
                  price={product.basePrice ?? product.price}
                  salePrice={product.baseSalePrice ?? product.salePrice}
                  badge={product.badge}
                  ageBadgeText={`${toBanglaDigits(product.targetAgeMin || 3)}+ বছর`}
                  safetyBadgeText="১০০% নিরাপদ"
                  rating={product.rating}
                  imageUrl={product.imageUrl || product.image}
                  locale={locale}
                  hasVariations={!!(product.variations && product.variations.length > 0)}
                  stock={product.stock}
                  isOutOfStock={isProductOutOfStock(product)}
                />
              ))}
            </div>
          </section>
        ))}



        {/* ========================================================================= */}
        {/* 7. Why Buy From Us (Food-grade, fast shipping, returns, support)           */}
        {/* ========================================================================= */}
        <section className="space-y-6 pt-2">
          <div className="text-center">
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B]">
              {isBn ? `কেন ${BRAND_CONFIG.name}?` : `Why Choose ${BRAND_CONFIG.name}?`}
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1 max-w-2xl mx-auto">
              {isBn
                ? 'বাংলাদেশের সচেতন অভিভাবকদের আস্থার প্রথম ও নির্ভরযোগ্য পছন্দ'
                : 'Bangladesh’s most trusted brand for safe, non-toxic creative childhood tools'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#EFE9E0] p-5 text-center flex flex-col items-center space-y-2.5 shadow-xs">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#DDF3E6] text-[#1F6B43]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-[#2B2B2B]">
                {isBn ? '১০০% ফুড-গ্রেড ও নিরাপদ' : '100% Food-Grade Safe'}
              </h3>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                {isBn
                  ? 'কোনো ক্ষতিকর রাসায়নিক বা ভারী ধাতু নেই, শিশুর ত্বক ও মুখের জন্য সম্পূর্ণ নিরাপদ'
                  : 'Zero heavy metals or toxins, completely safe for children’s hands and mouth'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#EFE9E0] p-5 text-center flex flex-col items-center space-y-2.5 shadow-xs">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#DDF1FB] text-[#0B5F85]">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-[#2B2B2B]">
                {isBn ? 'সারা দেশে দ্রুত ডেলিভারি' : 'Fast Nationwide Shipping'}
              </h3>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                {isBn
                  ? 'ঢাকা শহরে ২৪-৪৮ ঘণ্টা এবং ঢাকার বাইরে ৩-৪ দিনে বিশ্বস্ত হোম ডেলিভারি সেবা'
                  : 'Fast doorstep delivery across all 64 districts with verified courier tracking'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#EFE9E0] p-5 text-center flex flex-col items-center space-y-2.5 shadow-xs">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#FFF3CC] text-[#7A4E00]">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-[#2B2B2B]">
                {isBn
                  ? `${toBanglaDigits(BRAND_CONFIG.defaultReturnDays)} দিনে সহজ রিটার্ন`
                  : `${BRAND_CONFIG.defaultReturnDays}-Day Easy Return`}
              </h3>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                {isBn
                  ? 'পণ্য ভাঙা বা নষ্ট থাকলে কোনো ঝামেলা ছাড়া দ্রুত বিনামূল্যে রিপ্লেসমেন্ট সুবিধা'
                  : 'Instant hassle-free replacement for any damaged or defective item'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#EFE9E0] p-5 text-center flex flex-col items-center space-y-2.5 shadow-xs">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#FDE3E1] text-[#9B2420]">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-[#2B2B2B]">
                {isBn ? '২৪/৭ আন্তরিক সাপোর্ট' : 'Dedicated Support'}
              </h3>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                {isBn
                  ? 'হোয়াটসঅ্যাপ বা ফোনে যেকোনো তথ্য ও অর্ডার সংক্রান্ত সহায়তায় আমাদের টিম সদা প্রস্তুত'
                  : 'Direct WhatsApp and phone assistance ready to help with orders anytime'}
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. Customer Reviews                                                       */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B]">
              {isBn ? 'সন্তুষ্ট অভিভাবকদের মতামত' : 'Parent Reviews & Feedback'}
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1">
              {isBn
                ? 'আমাদের প্রোডাক্ট ব্যবহার করে সম্মানিত ক্রেতারা কী বলছেন'
                : 'Genuine feedback from parents across Bangladesh'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-[#EFE9E0] p-5 sm:p-6 space-y-3 shadow-xs flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center text-[#FFC93C] gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-[#2B2B2B] leading-relaxed italic">
                  &ldquo;প্লাস্টার আর্ট কিট পেয়ে আমার বাচ্চা ভীষণ আনন্দিত! স্ক্রিন টাইম এক নিমিষে ভুলে গিয়ে রঙ করায় মেতে উঠেছে। কোয়ালিটি দারুণ।&rdquo;
                </p>
              </div>
              <div className="pt-2 border-t border-[#EFE9E0] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-[#2B2B2B]">সায়মা আহমেদ</h4>
                  <span className="text-[11px] text-[#6B6B6B]">৪ বছরের বাচ্চার মা, ধানমন্ডি</span>
                </div>
                <span className="text-[10px] bg-[#DDF3E6] text-[#1F6B43] font-bold px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#EFE9E0] p-5 sm:p-6 space-y-3 shadow-xs flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center text-[#FFC93C] gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-[#2B2B2B] leading-relaxed italic">
                  &ldquo;মোমের রঙগুলো সত্যিই মুখে দেওয়ার ভয় নেই, সবচেয়ে ভালো লাগা সাধারণ পানিতেই মেঝে বা জামা থেকে রঙ উঠে যায়। শতভাগ নিরাপদ।&rdquo;
                </p>
              </div>
              <div className="pt-2 border-t border-[#EFE9E0] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-[#2B2B2B]">ফারহান সাদিক</h4>
                  <span className="text-[11px] text-[#6B6B6B]">৩ বছরের বাচ্চার বাবা, চট্টগ্রাম</span>
                </div>
                <span className="text-[10px] bg-[#DDF3E6] text-[#1F6B43] font-bold px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#EFE9E0] p-5 sm:p-6 space-y-3 shadow-xs flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center text-[#FFC93C] gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-[#2B2B2B] leading-relaxed italic">
                  &ldquo;জন্মদিনের গিফটের জন্য ৩টি সেট অর্ডার করেছিলাম। সুন্দর প্যাকিং এবং এক দিনের মধ্যেই ঢাকায় ডেলিভারি পেয়েছি। অসাধারণ সার্ভিস!&rdquo;
                </p>
              </div>
              <div className="pt-2 border-t border-[#EFE9E0] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-[#2B2B2B]">নুসরাত জাহান</h4>
                  <span className="text-[11px] text-[#6B6B6B]">উত্তরা, ঢাকা</span>
                </div>
                <span className="text-[10px] bg-[#DDF3E6] text-[#1F6B43] font-bold px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 9. Welcome Coupon Code Signup (Controlled via Admin Panel)                */}
        {/* ========================================================================= */}
        {settings.welcomeOffer?.enabled !== false && (
          <section className="rounded-2xl bg-white border border-[#EFE9E0] p-6 sm:p-8 max-w-4xl mx-auto shadow-xs text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF3CC] text-[#7A4E00] text-xs font-bold">
              <Tag className="w-3.5 h-3.5" />
              <span>{settings.welcomeOffer?.tag || 'Special Welcome Offer'}</span>
            </div>

            <div className="space-y-1">
              <h3 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B]">
                {isBn
                  ? (settings.welcomeOffer?.titleBn || 'প্রথম অর্ডারে ১০% বিশেষ ছাড়!')
                  : (settings.welcomeOffer?.titleEn || 'Get 10% Off On Your First Order!')}
              </h3>
              <p className="text-xs sm:text-sm text-[#6B6B6B] max-w-lg mx-auto">
                {isBn
                  ? (settings.welcomeOffer?.descBn ||
                      'আপনার মোবাইল নম্বর দিয়ে প্রথম অর্ডারের জন্য প্রোমো কোড সংগ্রহ করুন এবং চেকআউটে সরাসরি ছাড় উপভোগ করুন')
                  : (settings.welcomeOffer?.descEn ||
                      'Enter your phone number to claim your first order promo code at checkout')}
              </p>
            </div>

            {/* Coupon Code Pill & Copy Button */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <div className="flex items-center gap-2 bg-[#FAF7F2] border-2 border-dashed border-[#D6403B] px-4 py-2 rounded-xl">
                <span className="text-xs font-bold text-[#6B6B6B] uppercase">Coupon Code:</span>
                <span className="font-mono font-black text-lg text-[#D6403B] tracking-wider">
                  {settings.welcomeOffer?.couponCode || 'CRAFTY10'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCoupon(settings.welcomeOffer?.couponCode || 'CRAFTY10')}
                  className="p-1 rounded hover:bg-black/5 text-[#6B6B6B] hover:text-[#D6403B] transition-colors cursor-pointer"
                  title="Copy Code"
                >
                  {couponCopied ? <Check className="w-4 h-4 text-[#1F6B43]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Input Form */}
            <form
              onSubmit={handleCouponSignup}
              className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto pt-2"
            >
              <input
                type="text"
                value={subscriberInput}
                onChange={(e) => setSubscriberInput(e.target.value)}
                placeholder={isBn ? 'মোবাইল নম্বর লিখুন (যেমন: 01700-000000)' : 'Phone number (e.g., 01700-000000)'}
                className="w-full px-4 py-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] text-xs sm:text-sm text-[#2B2B2B] focus:bg-white focus:outline-none focus:border-[#D6403B]"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#D6403B] hover:bg-[#BF3430] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                Get Code
              </button>
            </form>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 10. Bulk Orders Banner (School & Kindergarten)                            */}
        {/* ========================================================================= */}
        {settings.bulkOrderBanner?.enabled !== false && (
          <section className="rounded-2xl bg-[#FFF3CC]/40 border border-[#FFE28A] p-6 sm:p-8 text-center space-y-4 max-w-3xl mx-auto shadow-2xs">
            <div>
              <h3 className="font-heading font-black text-xl sm:text-2xl text-[#2B2B2B]">
                {settings.bulkOrderBanner?.titleBn || 'স্কুল ও কিন্ডারগার্টেন বাল্ক অর্ডার'}
              </h3>
              <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1 max-w-xl mx-auto">
                {settings.bulkOrderBanner?.descBn ||
                  'আপনার স্কুলের আর্ট ক্লাস বা জন্মদিনের রিটার্ন গিফটের জন্য বিশেষ মূল্যে ক্রাফট কিট নিতে যোগাযোগ করুন'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <a
                href={`https://wa.me/${BRAND_CONFIG.defaultWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{settings.bulkOrderBanner?.ctaText || 'Order via WhatsApp'}</span>
              </a>
            </div>
          </section>
        )}
      </main>

      {/* 11. Centralized Footer */}
      <Footer />

      {/* Mobile Sticky Navigation */}
      <MobileBottomNav locale={locale} activeTab="home" />
    </div>
  );
}
