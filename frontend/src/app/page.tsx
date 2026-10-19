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

export default function HomePage() {
  const [locale, setLocale] = useState<'bn' | 'en'>('bn');
  const [emailSub, setEmailSub] = useState('');
  const [subSuccess, setSubSuccess] = useState(false);

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
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/products');
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.data || []);
          if (items.length > 0) {
            setProducts(items);
          }
        }
      } catch (err) {
        console.warn('Could not fetch products from mock API, using fallback data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products for various sections (Max 4 products in a row)
  const newArrivalProducts = products.filter((p) => p.isNewArrival).slice(0, 4);
  const bestSellerProducts = products.filter((p) => p.isBestSeller).slice(0, 4);

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
      <Header locale={locale} onToggleLocale={toggleLocale} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-10 sm:space-y-12">
        {/* ========================================================================= */}
        {/* 2. Hero Campaign Banner (as shown in wireframe)                           */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#FFF5EB] border border-[#F3E5D8] p-6 sm:p-10 lg:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Banner Text Content */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0F7FA] text-[#00838F] font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#00ACC1]" />
                <span>New Promotion • নতুন অফার</span>
              </div>

              <h1 className="font-heading font-black text-2xl sm:text-4xl lg:text-5xl text-[#222222] leading-tight tracking-tight">
                [ক্যাম্পেইন ব্যানারের হেডলাইন]
                <span className="block text-[#E53935] text-xl sm:text-3xl lg:text-4xl mt-1">
                  ছোট্ট সোনামণিদের জন্য নিরাপদ মোমের রঙ ও খেলনা
                </span>
              </h1>

              <p className="text-sm sm:text-base text-[#666666] max-w-xl mx-auto lg:mx-0 leading-relaxed">
                ১০০% প্রাকৃতিক খাদ্য-মানের মোম এবং নন-টক্সিক উপাদান দিয়ে তৈরি। CraftyKidsCo দিচ্ছে শিশুদের সৃজনশীল কল্পনায় রঙিন আনন্দের ছোঁয়া।
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/shop"
                  className="px-8 py-3.5 rounded-full bg-[#E53935] hover:bg-[#D32F2F] active:scale-95 text-white font-bold text-sm sm:text-base shadow-[0_4px_16px_rgba(229,57,53,0.3)] transition-all flex items-center gap-2"
                >
                  <span>অর্ডার করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/category/wax-crayons"
                  className="px-6 py-3.5 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#DFD7CC] text-[#333] font-bold text-sm sm:text-base transition-colors"
                >
                  মোমের রঙ দেখুন
                </Link>
              </div>

              {/* Slider Dots Indicator */}
              <div className="flex items-center justify-center lg:justify-start gap-2 pt-4">
                <span className="w-6 h-2 rounded-full bg-[#E53935] transition-all" />
                <span className="w-2 h-2 rounded-full bg-[#DFD7CC]" />
                <span className="w-2 h-2 rounded-full bg-[#DFD7CC]" />
              </div>
            </div>

            {/* Banner Real Photo */}
            <div className="lg:col-span-5 relative">
              <div className="relative w-full aspect-4/3 sm:aspect-16/10 lg:aspect-square rounded-2xl overflow-hidden shadow-lg border-4 border-white">
                <Image
                  src="https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1000&q=80"
                  alt="CraftyKidsCo Safe Toys and Colors"
                  fill
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end p-4 sm:p-6">
                  <div className="bg-white/95 backdrop-blur-xs rounded-xl p-3 shadow-md border border-white/60">
                    <p className="text-xs font-bold text-[#E53935]">★ ১০০% ফুড-গ্রেড ন্যাচারাল মোম</p>
                    <p className="text-[11px] text-[#555]">শিশুর ত্বকের জন্য সম্পূর্ণ নিরাপদ ও ওয়াশেবল</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

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
              <span>সব দেখুন</span>
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
              <span>সব দেখুন</span>
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
              <span>সব দেখুন</span>
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
        {/* 6. Category Showcase 1: "মোমের রঙ" (Wax Crayons Category)                  */}
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
              <span>সব দেখুন</span>
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
                সব পণ্য দেখুন
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
              <span>সব দেখুন</span>
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
                সব পণ্য দেখুন
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
              <span>সব দেখুন</span>
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
                সব পণ্য দেখুন
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
        {/* 9. Dual Promo Banners Row (as shown in wireframe)                         */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Promo Banner (Minty Greenish) */}
          <div className="rounded-2xl bg-[#E8F5E9] border border-[#C8E6C9] p-6 sm:p-8 flex flex-col justify-between items-center text-center space-y-4">
            <div>
              <span className="text-xs font-black uppercase text-[#2E7D32] bg-white/80 px-3 py-1 rounded-full">
                কম্বো সেভার অফার
              </span>
              <h3 className="font-heading font-black text-xl sm:text-2xl text-[#222222] mt-3">
                [অফার ব্যানার]
              </h3>
              <p className="text-xs sm:text-sm text-[#555555] max-w-sm mx-auto mt-1">
                মোমের রঙ + প্লে-ডো + ড্রয়িং খাতার মেগা কম্বো প্যাকে পান আকর্ষণীয় ২৫% পর্যন্ত ছাড়!
              </p>
            </div>
            <Link
              href="/shop"
              className="px-6 py-2.5 rounded-full bg-[#E53935] hover:bg-[#D32F2F] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
            >
              শপ নাও
            </Link>
          </div>

          {/* Right Promo Banner (Pastel Peach/Yellow) */}
          <div className="rounded-2xl bg-[#FFF8E1] border border-[#FFE082] p-6 sm:p-8 flex flex-col justify-between items-center text-center space-y-4">
            <div>
              <span className="text-xs font-black uppercase text-[#F57F17] bg-white/80 px-3 py-1 rounded-full">
                ফ্রি ডেলিভারি অফার
              </span>
              <h3 className="font-heading font-black text-xl sm:text-2xl text-[#222222] mt-3">
                [ফ্রি ডেলিভারি ব্যানার]
              </h3>
              <p className="text-xs sm:text-sm text-[#555555] max-w-sm mx-auto mt-1">
                যেকোনো ৳১,০০০ বা তার বেশি টাকার অর্ডারে সারা বাংলাদেশে সম্পূর্ণ ফ্রি হোম ডেলিভারি!
              </p>
            </div>
            <Link
              href="/shop"
              className="px-6 py-2.5 rounded-full bg-[#E53935] hover:bg-[#D32F2F] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
            >
              অর্ডার করুন
            </Link>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 10. Value Propositions / Trust Badges: "কেন CraftyKidsCo?"                 */}
        {/* (Note: Brand name is ALWAYS in English CraftyKidsCo)                      */}
        {/* ========================================================================= */}
        <section className="space-y-6 pt-4">
          <div className="text-center">
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#222222]">
              কেন CraftyKidsCo
            </h2>
            <p className="text-xs sm:text-sm text-[#777777] mt-1">
              বাংলাদেশের সচেতন অভিভাবকদের আস্থার প্রথম পছন্দ
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#EBE5DC] p-5 text-center flex flex-col items-center space-y-2.5 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-[#222]">
                ১০০% নিরাপদ ও নন-টক্সিক
              </h3>
              <p className="text-xs text-[#666]">
                ফুড-গ্রেড ন্যাচারাল উপাদান দিয়ে তৈরি, ক্ষতিকারক কেমিক্যালমুক্ত
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#EBE5DC] p-5 text-center flex flex-col items-center space-y-2.5 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-[#222]">
                দ্রুত হোম ডেলিভারি
              </h3>
              <p className="text-xs text-[#666]">
                স্টেডফাস্ট কুরিয়ারের মাধ্যমে ২-৩ দিনের মধ্যে দেশের যেকোনো প্রান্তে পৌঁছে দেওয়া হয়
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#EBE5DC] p-5 text-center flex flex-col items-center space-y-2.5 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#FFF8E1] text-[#F57F17] flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-[#222]">
                ক্যাশ অন ডেলিভারি
              </h3>
              <p className="text-xs text-[#666]">
                পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধের ১০০% নির্ভরতা
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#EBE5DC] p-5 text-center flex flex-col items-center space-y-2.5 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#FCE4EC] text-[#C2185B] flex items-center justify-center">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-[#222]">
                সহজ রিটার্ন ও সাপোর্ট
              </h3>
              <p className="text-xs text-[#666]">
                যেকোনো প্রয়োজনে আমাদের ডেডিকেটেড কাস্টমার হেল্পলাইন সবসময় পাশে আছে
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 11. Customer Reviews: "সন্তুষ্ট অভিভাবকদের মতামত"                         */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#222222]">
              সন্তুষ্ট অভিভাবকদের মতামত
            </h2>
            <p className="text-xs sm:text-sm text-[#777777] mt-1">
              আমাদের প্রোডাক্ট ব্যবহার করে অভিভাবকরা কী বলছেন
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-[#EBE5DC] p-5 sm:p-6 space-y-3 shadow-xs">
              <div className="flex items-center text-[#FFB300] gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-[#444] leading-relaxed italic">
                &ldquo;আমার ৩ বছরের বাচ্চার জন্য CraftyKidsCo এর ২৪ কালারের মোমের রঙ নিয়েছি। রঙগুলো খুব উজ্জ্বল এবং কাপড় বা মেঝেতে লাগলে খুব সহজে মুছে যায়!&rdquo;
              </p>
              <div className="pt-2 border-t border-[#F0EBE3] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-[#222]">নুসরাত জাহান</h4>
                  <span className="text-[11px] text-[#888]">ধানমন্ডি, ঢাকা</span>
                </div>
                <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] font-bold px-2 py-0.5 rounded-full">
                  Verified Buyer
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#EBE5DC] p-5 sm:p-6 space-y-3 shadow-xs">
              <div className="flex items-center text-[#FFB300] gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-[#444] leading-relaxed italic">
                &ldquo;কাঠের লার্নিং পাজল এবং প্লে-ডো সেটটির কোয়ালিটি সত্যি অসাধারণ। ফিনিশিং খুব মসৃণ, কোথাও ধারালো ভাব নেই। বাচ্চার স্ক্রিন টাইম অনেক কমেছে।&rdquo;
              </p>
              <div className="pt-2 border-t border-[#F0EBE3] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-[#222]">তানভীর আহমেদ</h4>
                  <span className="text-[11px] text-[#888]">খুলশী, চট্টগ্রাম</span>
                </div>
                <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] font-bold px-2 py-0.5 rounded-full">
                  Verified Buyer
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#EBE5DC] p-5 sm:p-6 space-y-3 shadow-xs">
              <div className="flex items-center text-[#FFB300] gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-[#444] leading-relaxed italic">
                &ldquo;খেলনা ও রঙের উপাদান নিয়ে আমি সবসময় খুঁতখুঁতে থাকি। CraftyKidsCo ফুড-গ্রেড প্রাকৃতিক উপাদান ব্যবহারের নিশ্চয়তা দেওয়ায় নির্দ্বিধায় কিনেছি। ধন্যবাদ!&rdquo;
              </p>
              <div className="pt-2 border-t border-[#F0EBE3] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-[#222]">ডা. ফারহানা কবির</h4>
                  <span className="text-[11px] text-[#888]">উত্তরা, ঢাকা</span>
                </div>
                <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] font-bold px-2 py-0.5 rounded-full">
                  Verified Buyer
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 12. Newsletter Callout Box ("অফার ও আপডেট পেতে যুক্ত থাকুন")                */}
        {/* ========================================================================= */}
        <section className="rounded-2xl bg-[#FFFDE7] border border-[#FFF59D] p-6 sm:p-8 text-center space-y-4 max-w-3xl mx-auto shadow-xs">
          <div>
            <h3 className="font-heading font-black text-xl sm:text-2xl text-[#222222]">
              অফার ও আপডেট পেতে যুক্ত থাকুন
            </h3>
            <p className="text-xs sm:text-sm text-[#666666] mt-1">
              CraftyKidsCo এর নতুন খেলনা ও স্পেশাল ছাড় সম্পর্কে সবার আগে জানতে আপনার মোবাইল বা ইমেইল দিন
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="flex max-w-md mx-auto items-center gap-2">
            <input
              type="text"
              value={emailSub}
              onChange={(e) => setEmailSub(e.target.value)}
              placeholder="মোবাইল নম্বর অথবা ইমেইল..."
              className="flex-1 px-4 py-2.5 rounded-full border border-[#E0D8A8] bg-white text-xs sm:text-sm text-[#222] focus:outline-none focus:border-[#E53935]"
              required
            />
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#E53935] hover:bg-[#D32F2F] text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer shrink-0"
            >
              যুক্ত হোন
            </button>
          </form>

          {subSuccess && (
            <p className="text-xs font-bold text-[#2E7D32]">
              ধন্যবাদ! আপনাকে আমাদের ভিআইপি অফার তালিকায় যুক্ত করা হয়েছে।
            </p>
          )}
        </section>
      </main>

      {/* Centralized Footer */}
      <Footer />

      {/* Mobile Sticky Navigation */}
      <MobileBottomNav locale={locale} activeTab="home" />
    </div>
  );
}
