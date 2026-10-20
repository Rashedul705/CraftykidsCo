'use client';

import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  Gift,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  X,
  Send,
  PhoneCall,
  Mail,
  MapPin,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ProductCard } from '@/components/storefront/ProductCard';
import { sampleCategories, sampleProducts } from '@/lib/sample-data';
import { formatBDT } from '@/lib/utils';
import { SiteSettings, defaultSiteSettings, HeroSlide } from '@/lib/site-settings';

export default function HomePage() {
  const [locale, setLocale] = useState<'bn' | 'en'>('bn');
  const [emailSub, setEmailSub] = useState('');
  const [subSuccess, setSubSuccess] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);

  const heroSlides: HeroSlide[] =
    settings.heroSlides && settings.heroSlides.length > 0
      ? settings.heroSlides.filter((s) => s.isActive !== false)
      : defaultSiteSettings.heroSlides;

  // Hero Slider & Zoom State
  const [currentSlide, setCurrentSlide] = useState(0);
  const safeCurrentSlide = currentSlide < heroSlides.length ? currentSlide : 0;
  const [isHovered, setIsHovered] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Auto-play timer for Hero Slider (pauses on hover or zoom modal)
  useEffect(() => {
    if (isHovered || isZoomModalOpen || heroSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
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

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailSub.trim()) {
      setSubSuccess(true);
      setTimeout(() => setSubSuccess(false), 3000);
      setEmailSub('');
    }
  };

  const [products, setProducts] = useState<any[]>(sampleProducts);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
    fetchProducts();
  }, []);

  // Filter products for various sections (Max 4 products in a row)
  const newArrivalProducts = products.filter((p) => p.isNewArrival).slice(0, 4);
  const bestSellerProducts = products.filter((p) => p.isBestSeller).slice(0, 4);

  const artKitShowcaseProducts = products
    .filter((p) => p.categorySlug === 'art-kits' || (p.slug && (p.slug.includes('paint') || p.slug.includes('kit'))))
    .slice(0, 4);

  const crayonShowcaseProducts = products
    .filter((p) => p.categorySlug === 'wax-crayons')
    .slice(0, 4);

  const clayShowcaseProducts = products
    .filter((p) => p.categorySlug === 'play-dough-clay')
    .slice(0, 4);

  const educationalShowcaseProducts = products
    .filter((p) => p.categorySlug === 'educational-toys' || p.categorySlug === 'wooden-toys')
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#222222] font-sans">
      {/* 1. Header with CraftyKidsCo English branding & Navigation */}
      <Header locale={locale} onToggleLocale={toggleLocale} announcement={settings.announcement} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-10 sm:space-y-12">
        {/* ========================================================================= */}
        {/* 2. Hero Campaign Slider with Continuous Ken-Burns Zoom & Interactive Zoom */}
        {/* ========================================================================= */}
        <section
          className="relative overflow-hidden rounded-3xl sm:rounded-[36px] shadow-[0_8px_30px_rgba(43,43,43,0.06)] border border-[#EFEAE2] select-none group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Slides Container */}
          <div className="relative w-full min-h-[500px] sm:min-h-[460px] lg:min-h-[480px]">
            {heroSlides.map((slide, idx) => {
              const isActive = idx === safeCurrentSlide;
              return (
                <div
                  key={slide.id}
                  className={`transition-opacity duration-700 ease-in-out ${
                    isActive
                      ? 'opacity-100 z-10 relative'
                      : 'opacity-0 z-0 absolute inset-0 pointer-events-none'
                  } bg-gradient-to-r ${slide.bgGradient} p-6 sm:p-10 lg:p-12 h-full flex flex-col justify-center`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Banner Text Content */}
                    <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-left">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-xs text-[#222] font-bold text-xs shadow-xs border border-white/60">
                        <Sparkles className="w-3.5 h-3.5" style={{ color: slide.accentColor }} />
                        <span>{locale === 'bn' ? slide.tagBn : slide.tagEn}</span>
                      </div>

                      <h1 className="font-heading font-black text-2xl sm:text-4xl lg:text-5xl text-[#222222] leading-tight tracking-tight">
                        {locale === 'bn' ? slide.titleBn : slide.titleEn}
                        <span
                          className="block text-xl sm:text-3xl lg:text-4xl mt-1.5"
                          style={{ color: slide.accentColor }}
                        >
                          {slide.titleBnHighlight}
                        </span>
                      </h1>

                      <p className="text-sm sm:text-base text-[#555555] max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                        {locale === 'bn' ? slide.descBn : slide.descEn}
                      </p>

                      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                        <Link
                          href={slide.ctaPrimaryHref}
                          className="px-7 sm:px-8 py-3.5 rounded-full text-white font-black text-sm sm:text-base shadow-[0_4px_18px_rgba(229,57,53,0.35)] hover:shadow-[0_6px_24px_rgba(229,57,53,0.45)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                          style={{ backgroundColor: slide.accentColor }}
                        >
                          <span>{slide.ctaPrimaryText}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                          href={slide.ctaSecondaryHref}
                          className="px-6 py-3.5 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#DFD7CC] text-[#333] font-bold text-sm sm:text-base shadow-xs hover:border-[#999] transition-all"
                        >
                          {slide.ctaSecondaryText}
                        </Link>
                      </div>
                    </div>

                    {/* Banner Hero Photo with Continuous Ken-Burns Zoom In & Interactive Hover Zoom */}
                    <div className="lg:col-span-5 relative">
                      <div
                        className="relative w-full aspect-4/3 sm:aspect-16/10 lg:aspect-square rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border-4 border-white group/image cursor-pointer"
                        onClick={() => setIsZoomModalOpen(true)}
                        title="Click to Zoom"
                      >
                        <div className="relative w-full h-full overflow-hidden bg-white">
                          <Image
                            src={slide.imageUrl}
                            alt={slide.titleBn}
                            fill
                            priority={idx === 0}
                            className={`object-cover transition-transform duration-[6500ms] ease-out ${
                              isActive ? 'scale-115' : 'scale-100'
                            } group-hover/image:scale-125 transition-all duration-700`}
                          />
                        </div>

                        {/* Floating Bottom Card Over Image */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end justify-between p-4 sm:p-5 pointer-events-none">
                          <div className="bg-white/95 backdrop-blur-xs rounded-xl p-3 shadow-md border border-white/60 max-w-[85%]">
                            <p className="text-xs font-bold" style={{ color: slide.accentColor }}>
                              {slide.badgeTop}
                            </p>
                            <p className="text-[11px] text-[#555] font-medium mt-0.5">
                              {slide.badgeBottom}
                            </p>
                          </div>

                          {/* Zoom In Badge Indicator */}
                          <div className="bg-black/60 backdrop-blur-xs text-white p-2 rounded-xl flex items-center gap-1 shadow-md shrink-0">
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold hidden sm:inline">Zoom</span>
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
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-[#2B2B2B] hover:text-[#E53935] shadow-lg flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-110 z-20 cursor-pointer"
            title="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-[#2B2B2B] hover:text-[#E53935] shadow-lg flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-110 z-20 cursor-pointer"
            title="Next Slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Bottom Slider Dots Indicator with active progress */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
            {heroSlides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(i)}
                className={`rounded-full transition-all cursor-pointer ${
                  safeCurrentSlide === i
                    ? 'w-7 sm:w-8 h-2 bg-[#E53935] shadow-sm'
                    : 'w-2 h-2 bg-white/70 hover:bg-white'
                }`}
                title={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </section>

        {/* Fullscreen Hero Image Zoom Modal */}
        {isZoomModalOpen && heroSlides[safeCurrentSlide] && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
              <button
                onClick={() => setIsZoomModalOpen(false)}
                className="absolute -top-12 right-0 text-white hover:text-[#E53935] p-2 cursor-pointer z-10"
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
              <div className="mt-3 flex items-center gap-2">
                {heroSlides.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 relative transition-all ${
                      safeCurrentSlide === idx ? 'border-[#E53935] scale-105' : 'border-white/40 opacity-70'
                    }`}
                  >
                    <Image src={s.imageUrl} alt="Thumbnail" fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. Shop by Category Circular Icons ("ক্যাটাগরি অনুযায়ী কিনুন")               */}
        {/* ========================================================================= */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-[#222222]">
                ক্যাটাগরি অনুযায়ী কিনুন
              </h2>
              <p className="text-xs sm:text-sm text-[#777777]">আপনার পছন্দের বিভাগ বেছে নিন</p>
            </div>
            <Link
              href="/shop"
              className="text-xs sm:text-sm font-bold text-[#E53935] hover:text-[#C62828] flex items-center gap-1 border border-[#E53935]/20 px-3 py-1.5 rounded-full hover:bg-[#E53935]/5 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Row of 8 circular category buttons with pastel tints */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4">
            {sampleCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="group flex flex-col items-center text-center transition-transform hover:-translate-y-1"
              >
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 border-2 border-transparent group-hover:border-[#E53935] transition-all flex items-center justify-center relative overflow-hidden shadow-xs"
                  style={{ backgroundColor: cat.badgeColor || '#FFE8D6' }}
                >
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <Image
                      src={cat.imageUrl}
                      alt={cat.nameBn}
                      fill
                      sizes="80px"
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </div>
                <span className="mt-2 text-xs font-bold text-[#333333] group-hover:text-[#E53935] transition-colors line-clamp-1">
                  {cat.nameBn}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. Section 1: "নতুন পণ্য" (New Arrivals - 5 products grid)                  */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-[#222222]">
                নতুন পণ্য
              </h2>
              <p className="text-xs sm:text-sm text-[#777777]">আমাদের সদ্য যুক্ত হওয়া কালেকশন</p>
            </div>
            <Link
              href="/shop"
              className="text-xs sm:text-sm font-bold text-[#E53935] hover:text-[#C62828] flex items-center gap-1 border border-[#E53935]/20 px-3 py-1.5 rounded-full hover:bg-[#E53935]/5 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 4-Column Grid (Max 4 products in a row) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {newArrivalProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                slug={product.slug || product.id}
                title={locale === 'bn' ? (product.titleBn || product.title) : (product.titleEn || product.title)}
                price={product.basePrice ?? product.price}
                salePrice={product.baseSalePrice ?? product.salePrice}
                badge={product.badge}
                rating={product.rating}
                imageUrl={product.imageUrl || product.image}
                locale={locale}
              />
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. Section 2: "জনপ্রিয় পণ্য" (Best Sellers - 5 products grid)               */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-[#222222]">
                জনপ্রিয় পণ্য
              </h2>
              <p className="text-xs sm:text-sm text-[#777777]">অভিভাবকদের সবচেয়ে পছন্দের খেলনা ও রঙ</p>
            </div>
            <Link
              href="/shop"
              className="text-xs sm:text-sm font-bold text-[#E53935] hover:text-[#C62828] flex items-center gap-1 border border-[#E53935]/20 px-3 py-1.5 rounded-full hover:bg-[#E53935]/5 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 4-Column Grid (Max 4 products in a row) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {bestSellerProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                slug={product.slug || product.id}
                title={locale === 'bn' ? (product.titleBn || product.title) : (product.titleEn || product.title)}
                price={product.basePrice ?? product.price}
                salePrice={product.baseSalePrice ?? product.salePrice}
                badge={product.badge}
                rating={product.rating}
                imageUrl={product.imageUrl || product.image}
                locale={locale}
              />
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. Category Showcase: "প্লাস্টার আর্ট কিট" (Plaster Painting Kits)          */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-[#222222]">
                {locale === 'bn' ? 'প্লাস্টার আর্ট ও পেইন্টিং কিট' : 'Plaster Painting Kits'}
              </h2>
              <p className="text-xs sm:text-sm text-[#777777]">
                {locale === 'bn' ? 'ক্রিয়েট • পেইন্ট • প্লে - শিশুদের স্ক্রিন-ফ্রি ক্রিয়েটিভ আর্ট বক্স' : 'Create • Paint • Play - Screen-free creative activity for kids'}
              </p>
            </div>
            <Link
              href="/category/art-kits"
              className="text-xs sm:text-sm font-bold text-[#E53935] hover:text-[#C62828] flex items-center gap-1 border border-[#E53935]/20 px-3 py-1.5 rounded-full hover:bg-[#E53935]/5 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Left Category Highlight Card */}
            <div className="lg:col-span-1 rounded-2xl bg-[#FFF3E0] border border-[#FFE0B2] p-5 sm:p-6 flex flex-col justify-between text-center lg:text-left relative overflow-hidden group">
              <div className="space-y-3 z-10">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#E65100] bg-white/80 px-2.5 py-0.5 rounded-full inline-block">
                  Paint & Play
                </span>
                <h3 className="font-heading font-black text-xl sm:text-2xl text-[#222222] leading-snug">
                  {locale === 'bn' ? 'প্লাস্টার পেইন্টিং' : 'Plaster Kits'}
                </h3>
                <p className="text-xs text-[#666666] leading-relaxed">
                  {locale === 'bn' ? 'রঙ, ব্রাশ ও থ্রিডি প্লাস্টার শেপ নিয়ে সম্পূর্ণ ক্রাফট বক্স' : 'Complete 3D plaster shapes, non-toxic colors & brush set'}
                </p>
              </div>

              <div className="relative w-full h-44 sm:h-52 lg:h-auto lg:aspect-square my-3 sm:my-4 rounded-xl overflow-hidden shadow-xs">
                <Image
                  src="https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg"
                  alt="Plaster Painting Kits Collection"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              <Link
                href="/category/art-kits"
                className="w-full py-2.5 px-4 rounded-lg bg-[#E53935] hover:bg-[#D32F2F] text-white font-bold text-xs sm:text-sm text-center shadow-xs transition-colors"
              >
                {locale === 'bn' ? 'সব পণ্য দেখুন' : 'Shop All'}
              </Link>
            </div>

            {/* Right 4 Products */}
            <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {artKitShowcaseProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug || product.id}
                  title={locale === 'bn' ? (product.titleBn || product.title) : (product.titleEn || product.title)}
                  price={product.basePrice ?? product.price}
                  salePrice={product.baseSalePrice ?? product.salePrice}
                  badge={product.badge}
                  rating={product.rating}
                  imageUrl={product.imageUrl || product.image}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. Category Showcase 1: "মোমের রঙ" (Wax Crayons Category)                  */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-[#222222]">
                মোমের রঙ
              </h2>
              <p className="text-xs sm:text-sm text-[#777777]">ফুড-গ্রেড ন্যাচারাল উপাদান ও ভাইব্রেন্ট রঙ</p>
            </div>
            <Link
              href="/category/wax-crayons"
              className="text-xs sm:text-sm font-bold text-[#E53935] hover:text-[#C62828] flex items-center gap-1 border border-[#E53935]/20 px-3 py-1.5 rounded-full hover:bg-[#E53935]/5 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Left Category Highlight Card */}
            <div className="lg:col-span-1 rounded-2xl bg-[#FFE8D6] border border-[#FAD4BA] p-5 sm:p-6 flex flex-col justify-between text-center lg:text-left relative overflow-hidden group">
              <div className="space-y-3 z-10">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#D84315] bg-white/70 px-2.5 py-0.5 rounded-full inline-block">
                  Crayons Series
                </span>
                <h3 className="font-heading font-black text-xl sm:text-2xl text-[#222222] leading-snug">
                  মোমের রঙ
                </h3>
                <p className="text-xs text-[#666666] leading-relaxed">
                  শিশুর হাতের উপযোগী গ্রিপ ও ওয়াশেবল মোমের রঙের সম্পূর্ণ রেঞ্জ
                </p>
              </div>

              <div className="relative w-full h-44 sm:h-52 lg:h-auto lg:aspect-square my-3 sm:my-4 rounded-xl overflow-hidden shadow-xs">
                <Image
                  src="https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=500&q=80"
                  alt="Wax Crayons Collection"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              <Link
                href="/category/wax-crayons"
                className="w-full py-2.5 px-4 rounded-lg bg-[#E53935] hover:bg-[#D32F2F] text-white font-bold text-xs sm:text-sm text-center shadow-xs transition-colors"
              >
                View All Products
              </Link>
            </div>

            {/* Right 4 Products */}
            <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {crayonShowcaseProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug || product.id}
                  title={locale === 'bn' ? (product.titleBn || product.title) : (product.titleEn || product.title)}
                  price={product.basePrice ?? product.price}
                  salePrice={product.baseSalePrice ?? product.salePrice}
                  badge={product.badge}
                  rating={product.rating}
                  imageUrl={product.imageUrl || product.image}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. Category Showcase 2: "আর্টক্লে" (Play Dough & Modeling Clay)             */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-[#222222]">
                আর্টক্লে
              </h2>
              <p className="text-xs sm:text-sm text-[#777777]">সফট, গন্ধহীন ও নন-টক্সিক রঙিন মডেলিং ক্লে</p>
            </div>
            <Link
              href="/category/play-dough-clay"
              className="text-xs sm:text-sm font-bold text-[#E53935] hover:text-[#C62828] flex items-center gap-1 border border-[#E53935]/20 px-3 py-1.5 rounded-full hover:bg-[#E53935]/5 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Left Category Highlight Card on Pastel Blue */}
            <div className="lg:col-span-1 rounded-2xl bg-[#E1F5FE] border border-[#B3E5FC] p-5 sm:p-6 flex flex-col justify-between text-center lg:text-left relative overflow-hidden group">
              <div className="space-y-3 z-10">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0277BD] bg-white/70 px-2.5 py-0.5 rounded-full inline-block">
                  Clay & Dough
                </span>
                <h3 className="font-heading font-black text-xl sm:text-2xl text-[#222222] leading-snug">
                  আর্টক্লে
                </h3>
                <p className="text-xs text-[#666666] leading-relaxed">
                  হাতে জড়াবে না, শুকাতে সময় নেবে না এবং সহজে আকার তৈরি উপযোগী
                </p>
              </div>

              <div className="relative w-full h-44 sm:h-52 lg:h-auto lg:aspect-square my-3 sm:my-4 rounded-xl overflow-hidden shadow-xs">
                <Image
                  src="https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=500&q=80"
                  alt="Play Dough Collection"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              <Link
                href="/category/play-dough-clay"
                className="w-full py-2.5 px-4 rounded-lg bg-[#E53935] hover:bg-[#D32F2F] text-white font-bold text-xs sm:text-sm text-center shadow-xs transition-colors"
              >
                View All Products
              </Link>
            </div>

            {/* Right 4 Products */}
            <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {clayShowcaseProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug || product.id}
                  title={locale === 'bn' ? (product.titleBn || product.title) : (product.titleEn || product.title)}
                  price={product.basePrice ?? product.price}
                  salePrice={product.baseSalePrice ?? product.salePrice}
                  badge={product.badge}
                  rating={product.rating}
                  imageUrl={product.imageUrl || product.image}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. Category Showcase 3: "শিক্ষণীয় খেলনা" (Educational & Wooden Toys)        */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-[#222222]">
                শিক্ষণীয় খেলনা
              </h2>
              <p className="text-xs sm:text-sm text-[#777777]">বাচ্চাদের একাগ্রতা ও বুদ্ধিমত্তা বাড়ানোর কাঠের খেলনা</p>
            </div>
            <Link
              href="/category/educational-toys"
              className="text-xs sm:text-sm font-bold text-[#E53935] hover:text-[#C62828] flex items-center gap-1 border border-[#E53935]/20 px-3 py-1.5 rounded-full hover:bg-[#E53935]/5 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Left Category Highlight Card on Pastel Pink */}
            <div className="lg:col-span-1 rounded-2xl bg-[#FCE4EC] border border-[#F8BBD0] p-5 sm:p-6 flex flex-col justify-between text-center lg:text-left relative overflow-hidden group">
              <div className="space-y-3 z-10">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#C2185B] bg-white/70 px-2.5 py-0.5 rounded-full inline-block">
                  Montessori Toys
                </span>
                <h3 className="font-heading font-black text-xl sm:text-2xl text-[#222222] leading-snug">
                  শিক্ষণীয় খেলনা
                </h3>
                <p className="text-xs text-[#666666] leading-relaxed">
                  স্ক্রিন টাইম কমিয়ে মেধা ও মনোযোগ বাড়াতে সহায়ক মন্টেসরি মেথড গেমস
                </p>
              </div>

              <div className="relative w-full h-44 sm:h-52 lg:h-auto lg:aspect-square my-3 sm:my-4 rounded-xl overflow-hidden shadow-xs">
                <Image
                  src="https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=500&q=80"
                  alt="Educational Toys Collection"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              <Link
                href="/category/educational-toys"
                className="w-full py-2.5 px-4 rounded-lg bg-[#E53935] hover:bg-[#D32F2F] text-white font-bold text-xs sm:text-sm text-center shadow-xs transition-colors"
              >
                View All Products
              </Link>
            </div>

            {/* Right 4 Products */}
            <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {educationalShowcaseProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug || product.id}
                  title={locale === 'bn' ? (product.titleBn || product.title) : (product.titleEn || product.title)}
                  price={product.basePrice ?? product.price}
                  salePrice={product.baseSalePrice ?? product.salePrice}
                  badge={product.badge}
                  rating={product.rating}
                  imageUrl={product.imageUrl || product.image}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 9. Promotional Banners Row                                                */}
        {/* ========================================================================= */}
        {settings.promoBanners && settings.promoBanners.filter((b) => b.enabled !== false).length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {settings.promoBanners
              .filter((b) => b.enabled !== false)
              .map((banner) => (
                <div
                  key={banner.id}
                  className={`rounded-2xl border border-[#DFD7CC] p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-5 shadow-xs bg-gradient-to-r ${banner.bgGradient || 'from-[#FFF7ED] to-[#FFEDD5]'}`}
                >
                  <div className="space-y-2.5 flex-1">
                    {banner.tag && (
                      <span className="text-xs font-black uppercase text-[#E53935] bg-white/90 px-3 py-1 rounded-full shadow-xs inline-block">
                        {banner.tag}
                      </span>
                    )}
                    <h3 className="font-heading font-black text-xl sm:text-2xl text-[#222222]">
                      {banner.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#555555] max-w-sm leading-relaxed">
                      {banner.desc}
                    </p>
                    <div className="pt-1">
                      <Link
                        href={banner.link || '/shop'}
                        className="inline-block px-6 py-2.5 rounded-full bg-[#E53935] hover:bg-[#D32F2F] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
                      >
                        {banner.buttonText || 'Shop Now'}
                      </Link>
                    </div>
                  </div>
                  {banner.imageUrl && (
                    <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shrink-0 border-2 border-white/80 shadow-md">
                      <Image
                        src={banner.imageUrl}
                        alt={banner.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
          </section>
        )}

        {/* ========================================================================= */}
        {/* 10. Value Propositions: "কেন CraftyKidsCo?"                                */}
        {/* ========================================================================= */}
        <section className="space-y-6 pt-4">
          <div className="text-center">
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#222222]">
              {locale === 'bn' ? settings.whyLoveUs?.headingBn || 'কেন CraftyKidsCo' : settings.whyLoveUs?.headingEn || 'Why CraftyKidsCo'}
            </h2>
            <p className="text-xs sm:text-sm text-[#777777] mt-1 max-w-2xl mx-auto">
              {settings.whyLoveUs?.subtitleBn || 'বাংলাদেশের সচেতন অভিভাবকদের আস্থার প্রথম পছন্দ'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(settings.whyLoveUs?.cards || defaultSiteSettings.whyLoveUs.cards).map((card, idx) => {
              const bgColors = ['bg-[#E8F5E9] text-[#2E7D32]', 'bg-[#E3F2FD] text-[#1976D2]', 'bg-[#FFF8E1] text-[#F57F17]', 'bg-[#FCE4EC] text-[#C2185B]'];
              return (
                <div key={card.id || idx} className="bg-white rounded-2xl border border-[#EBE5DC] p-5 text-center flex flex-col items-center space-y-2.5 shadow-xs">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgColors[idx % bgColors.length]}`}>
                    {idx === 0 && <ShieldCheck className="w-6 h-6" />}
                    {idx === 1 && <Sparkles className="w-6 h-6" />}
                    {idx === 2 && <RotateCcw className="w-6 h-6" />}
                    {idx === 3 && <Headphones className="w-6 h-6" />}
                  </div>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-[#222]">
                    {card.titleBn}
                  </h3>
                  <p className="text-xs text-[#666] leading-relaxed">
                    {card.descBn}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 11. Customer Reviews: "সন্তুষ্ট অভিভাবকদের মতামত"                         */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#222222]">
              {locale === 'bn' ? settings.testimonials?.headingBn || 'হ্যাপি প্যারেন্টস রিভিউ' : settings.testimonials?.headingEn || 'Happy Parents Reviews'}
            </h2>
            <p className="text-xs sm:text-sm text-[#777777] mt-1">
              {settings.testimonials?.subtitleBn || 'আমাদের প্রোডাক্ট ব্যবহার করে অভিভাবকরা কী বলছেন'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(settings.testimonials?.reviews || defaultSiteSettings.testimonials.reviews).map((rev) => (
              <div key={rev.id} className="bg-white rounded-2xl border border-[#EBE5DC] p-5 sm:p-6 space-y-3 shadow-xs flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center text-[#FFB300] gap-0.5">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-[#444] leading-relaxed italic">
                    &ldquo;{rev.reviewBn}&rdquo;
                  </p>
                </div>
                <div className="pt-2 border-t border-[#F0EBE3] flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-[#222]">{rev.name}</h4>
                    <span className="text-[11px] text-[#888]">{rev.kidAge}</span>
                  </div>
                  {rev.verified && (
                    <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] font-bold px-2 py-0.5 rounded-full">
                      Verified Buyer
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 12. School & Bulk Orders Banner                                           */}
        {/* ========================================================================= */}
        {settings.bulkOrderBanner?.enabled !== false && (
          <section className="rounded-2xl bg-[#FFFDE7] border border-[#FFF59D] p-6 sm:p-8 text-center space-y-4 max-w-3xl mx-auto shadow-xs">
            <div>
              <h3 className="font-heading font-black text-xl sm:text-2xl text-[#222222]">
                {settings.bulkOrderBanner?.titleBn || 'স্কুল ও কিন্ডারগার্টেন বাল্ক অর্ডার'}
              </h3>
              <p className="text-xs sm:text-sm text-[#666666] mt-1 max-w-xl mx-auto">
                {settings.bulkOrderBanner?.descBn || 'আপনার স্কুলের আর্ট ক্লাস বা জন্মদিনের রিটার্ন গিফটের জন্য বিশেষ মূল্যে ক্রাফট কিট নিতে যোগাযোগ করুন'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <a
                href={`https://wa.me/${(settings.bulkOrderBanner?.whatsappNumber || '8801711223344').replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{settings.bulkOrderBanner?.ctaText || 'Contact on WhatsApp'}</span>
              </a>
            </div>
          </section>
        )}
      </main>

      {/* Centralized Footer */}
      <Footer />

      {/* Mobile Sticky Navigation */}
      <MobileBottomNav locale={locale} activeTab="home" />
    </div>
  );
}
