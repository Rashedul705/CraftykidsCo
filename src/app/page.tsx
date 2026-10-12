'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  ShieldCheck,
  Truck,
  HeartHandshake,
  Star,
  Sparkles,
  ArrowRight,
  Globe,
  CheckCircle2,
  PhoneCall,
  Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/storefront/ProductCard';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { StarDoodle, CloudDoodle, CrayonStrokeDivider } from '@/components/decorations/CrayonDoodles';
import { formatBDT } from '@/lib/utils';
import { sampleCategories, sampleProducts } from '@/lib/sample-data';

export default function HomePage() {
  const [locale, setLocale] = useState<'bn' | 'en'>('bn');
  const [cartCount, setCartCount] = useState(1);

  const toggleLocale = () => {
    setLocale((prev) => (prev === 'bn' ? 'en' : 'bn'));
  };

  const handleQuickAdd = () => {
    setCartCount((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 md:pb-12 text-[#2B2B2B]">
      {/* Top Banner Notice */}
      <div className="bg-[#FF6B6B] text-white py-2 px-4 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-[#FFC93C]" />
        <span>
          {locale === 'bn'
            ? '🚚 সারা বাংলাদেশে দ্রুত ডেলিভারি • ৳১,০০০ টাকার অর্ডারে ফ্রি ডেলিভারি!'
            : '🚚 Fast nationwide delivery • Free shipping on orders over ৳1,000!'}
        </span>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EFE9E0] transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF6B6B] to-[#FFC93C] flex items-center justify-center text-white font-extrabold text-2xl shadow-[0_4px_12px_rgba(255,107,107,0.35)] group-hover:scale-105 transition-transform">
              র
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-black text-xl sm:text-2xl text-[#2B2B2B] leading-none tracking-tight">
                {locale === 'bn' ? 'রংধনু কিডস' : 'Rongdhonu Kids'}
              </span>
              <span className="text-[11px] font-bold text-[#6B6B6B] tracking-wide">
                {locale === 'bn' ? 'নিরাপদ মোমের রঙ ও খেলনা' : 'Safe Wax Crayons & Toys'}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 font-bold text-sm text-[#2B2B2B]">
            <Link href="/" className="text-[#FF6B6B] hover:text-[#FA5252]">
              {locale === 'bn' ? 'হোম' : 'Home'}
            </Link>
            <Link href="/shop" className="hover:text-[#FF6B6B] transition-colors">
              {locale === 'bn' ? 'মোমের রঙ (Crayons)' : 'Wax Crayons'}
            </Link>
            <Link href="/shop" className="hover:text-[#FF6B6B] transition-colors">
              {locale === 'bn' ? 'শিক্ষণীয় খেলনা' : 'Educational Toys'}
            </Link>
            <Link href="/bundles" className="hover:text-[#FF6B6B] transition-colors flex items-center gap-1">
              <Gift className="w-4 h-4 text-[#FF6B6B]" />
              {locale === 'bn' ? 'গিফট কম্বো' : 'Gift Combos'}
            </Link>
            <Link href="/track" className="hover:text-[#FF6B6B] transition-colors">
              {locale === 'bn' ? 'অর্ডার ট্র্যাক' : 'Track Order'}
            </Link>
          </nav>

          {/* Actions: Lang toggle & Cart */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#EFE9E0] bg-[#FAF7F2] hover:bg-white text-xs font-bold text-[#2B2B2B] transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#5BC0EB]" />
              {locale === 'bn' ? 'English' : 'বাংলা'}
            </button>

            <Link
              href="/cart"
              className="relative p-2.5 rounded-full bg-[#FAF7F2] border border-[#EFE9E0] hover:border-[#FF6B6B] text-[#2B2B2B] transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FF6B6B] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* 1. HERO BANNER: One main offer and one clear button */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FFFDF9] to-[#FAF7F2] pt-8 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#EFE9E0]">
        <div className="absolute top-10 left-10 pointer-events-none opacity-40">
          <StarDoodle className="w-12 h-12 text-[#FFC93C]" />
        </div>
        <div className="absolute bottom-6 right-8 pointer-events-none opacity-40">
          <CloudDoodle className="w-20 h-12 text-[#5BC0EB]" />
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF8EE] border border-[#C4EDCD] text-xs font-bold text-[#2D7A3E]">
              <ShieldCheck className="w-4 h-4 text-[#7BD389]" />
              {locale === 'bn' ? '১০০% বিষাক্ত নয় ও শিশুর ত্বকে নিরাপদ' : '100% Non-Toxic & Child-Safe'}
            </div>

            <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-[#2B2B2B] leading-[1.18] tracking-tight">
              {locale === 'bn' ? (
                <>
                  ছোটদের প্রথম আঁকাআঁকিতে{' '}
                  <span className="text-[#FF6B6B] underline decoration-[#FFC93C] decoration-wavy">
                    নিরাপদ মোমের রঙ
                  </span>
                </>
              ) : (
                <>
                  Safe & Pure{' '}
                  <span className="text-[#FF6B6B] underline decoration-[#FFC93C] decoration-wavy">
                    Natural Wax Crayons
                  </span>{' '}
                  for Little Artists
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-[#6B6B6B] leading-relaxed max-w-xl mx-auto md:mx-0">
              {locale === 'bn'
                ? 'খাদ্য-মানের প্রাকৃতিক মোম দিয়ে হাতে তৈরি মোমের রঙ (Mom er color), যা সহজে ভাঙবে না এবং পানি দিয়ে সহজেই ধুয়ে পরিষ্কার করা যায়।'
                : 'Handcrafted with food-grade beeswax and skin-safe mineral pigments. Break-resistant, ergonomic triangular grip, and 100% washable.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start pt-2">
              <Link href="/shop" className="w-full sm:w-auto">
                <Button size="lg" variant="primary" className="w-full sm:w-auto">
                  <ShoppingBag className="w-5 h-5" />
                  {locale === 'bn' ? 'পণ্যগুলো দেখুন • ৳২৯৯ থেকে' : 'Order Now • From ৳299'}
                </Button>
              </Link>
              <Link href="/bundles" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Gift className="w-4 h-4 text-[#FF6B6B]" />
                  {locale === 'bn' ? 'গিফট কম্বো অফার' : 'View Gift Combos'}
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-6 pt-4 text-xs font-bold text-[#6B6B6B]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#7BD389]" />
                <span>ক্যাশ অন ডেলিভারি</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#7BD389]" />
                <span>স্টিডফাস্ট কুরিয়ার</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#7BD389]" />
                <span>সহজ রিটার্ন</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="relative">
            <div className="relative rounded-[32px] overflow-hidden bg-white p-4 shadow-[0_20px_50px_rgba(43,43,43,0.08)] border border-[#EFE9E0] group">
              <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden bg-[#FAF7F2]">
                <Image
                  src="https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1000&q=80"
                  alt="Rongdhonu Natural Wax Crayons"
                  fill
                  priority
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-[#FF6B6B] text-white shadow-md">
                    ২৫% ছাড় অফার
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between px-2">
                <div>
                  <h3 className="font-heading font-bold text-lg text-[#2B2B2B]">
                    {locale === 'bn' ? 'রংধনু ২৪ কালার স্পেশাল গিফট প্যাক' : '24 Shade Deluxe Wax Crayon Box'}
                  </h3>
                  <p className="text-xs text-[#6B6B6B]">
                    {locale === 'bn' ? 'সাথে থাকছে ফ্রি ড্রয়িং বুকলেট' : 'Includes Free Coloring Booklet'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#FF6B6B]">৳২৯৯</span>
                  <span className="block text-xs line-through text-[#6B6B6B]">৳৩৯৯</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY CARDS: Round icons or colorful tiles */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B]">
            {locale === 'bn' ? 'পছন্দের ক্যাটাগরি বেছে নিন' : 'Shop by Category'}
          </h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {locale === 'bn'
              ? 'মোমের রঙ, শিক্ষণীয় খেলনা এবং শিশুদের ক্রিয়েটিভ সামগ্রী'
              : 'Safe art supplies, educational toys, and play essentials'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {sampleCategories.map((cat, idx) => {
            const bgGradients = [
              'bg-[#FFF3E6] border-[#FFE4CC] hover:bg-[#FFE8D6]',
              'bg-[#E8F7FD] border-[#BFE4F7] hover:bg-[#DBF2FC]',
              'bg-[#EBF8EE] border-[#C4EDCD] hover:bg-[#D8F3DC]',
              'bg-[#FFF9E6] border-[#FFE899] hover:bg-[#FFF3CC]',
            ];
            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className={`p-5 rounded-[22px] border transition-all text-center flex flex-col items-center justify-center gap-3 group shadow-sm hover:shadow-md hover:-translate-y-1 ${
                  bgGradients[idx % bgGradients.length]
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-sm flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                  <Image
                    src={cat.imageUrl}
                    alt={cat.nameBn}
                    width={56}
                    height={56}
                    className="object-cover rounded-xl"
                  />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#2B2B2B]">
                    {locale === 'bn' ? cat.nameBn : cat.nameEn}
                  </h3>
                  <span className="text-xs text-[#6B6B6B] flex items-center justify-center gap-1 mt-1 group-hover:text-[#FF6B6B]">
                    {locale === 'bn' ? 'পণ্য দেখুন' : 'Browse'} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}

          {/* Combo Tile */}
          <Link
            href="/bundles"
            className="p-5 rounded-[22px] border bg-[#FFF0F0] border-[#FFD6D6] hover:bg-[#FFE5E5] transition-all text-center flex flex-col items-center justify-center gap-3 group shadow-sm hover:shadow-md hover:-translate-y-1"
          >
            <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform text-[#FF6B6B]">
              <Gift className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#2B2B2B]">
                {locale === 'bn' ? 'স্পেশাল কম্বো অফার' : 'Special Combos'}
              </h3>
              <span className="text-xs text-[#FF6B6B] font-bold flex items-center justify-center gap-1 mt-1">
                {locale === 'bn' ? '৩০% পর্যন্ত সাশ্রয়' : 'Up to 30% Off'}
              </span>
            </div>
          </Link>
        </div>
      </section>

      <CrayonStrokeDivider color="#FFC93C" />

      {/* 3. BEST SELLERS: Products with variations & quick add */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#FF6B6B] text-xs font-bold uppercase tracking-wider">
              <Star className="w-4 h-4 fill-current" />
              <span>{locale === 'bn' ? 'অভিভাবকদের সেরা পছন্দ' : 'Parents’ Top Choice'}</span>
            </div>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B] mt-1">
              {locale === 'bn' ? 'সবচেয়ে জনপ্রিয় পণ্যগুলো' : 'Best Selling Products'}
            </h2>
          </div>
          <Link href="/shop">
            <Button variant="outline" size="sm">
              {locale === 'bn' ? 'সবগুলো দেখুন' : 'View All'} <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {sampleProducts.map((p) => (
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
              onQuickAdd={handleQuickAdd}
            />
          ))}
        </div>
      </section>

      {/* 4. SHOP BY AGE: Crucial for parents */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-y border-[#EFE9E0] my-8">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B]">
            {locale === 'bn' ? 'সন্তানের বয়স অনুযায়ী কিনুন' : 'Shop by Child Age'}
          </h2>
          <p className="text-sm text-[#6B6B6B] mt-1 mb-8 max-w-lg mx-auto">
            {locale === 'bn'
              ? 'প্রতিটি বয়সের জন্য নিরাপদ উপাদান ও উপযোগী সাইজের গ্রিপ নির্বাচন করুন'
              : 'Choose age-tailored grip ergonomics and non-toxic safety certifications'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { age: '১ - ৩ বছর', ageEn: '1 - 3 Years', desc: 'মোটা ট্রায়াঙ্গুলার গ্রিপ, ভাঙবে না', color: '#FFF3E6' },
              { age: '৩ - ৫ বছর', ageEn: '3 - 5 Years', desc: 'সহজে ধোয়া মোম ও নরম প্লে-ডো', color: '#E8F7FD' },
              { age: '৫ - ৮ বছর', ageEn: '5 - 8 Years', desc: '২৪/৩৬ শেড আর্টিস্ট সেট ও খাতা', color: '#EBF8EE' },
              { age: '৮+ বছর', ageEn: '8+ Years', desc: 'স্কুল আর্ট কিট ও ক্রিয়েটিভ প্রজেক্ট', color: '#FFF9E6' },
            ].map((item) => (
              <div
                key={item.age}
                className="p-5 rounded-[22px] border border-[#EFE9E0] flex flex-col items-center text-center justify-between transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer"
                style={{ backgroundColor: item.color }}
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center font-heading font-black text-lg text-[#2B2B2B] mb-2">
                  👶
                </div>
                <h3 className="font-heading font-bold text-lg text-[#2B2B2B]">
                  {locale === 'bn' ? item.age : item.ageEn}
                </h3>
                <p className="text-xs text-[#6B6B6B] mt-1">
                  {item.desc}
                </p>
                <span className="mt-3 text-xs font-bold text-[#FF6B6B] flex items-center gap-1">
                  {locale === 'bn' ? 'পণ্য দেখুন' : 'Explore'} <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. GIFT SETS AND COMBO OFFERS */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-[#FFF5F5] to-[#FFF9F0] border-2 border-[#FFD9D9] rounded-[28px] p-6 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FF6B6B] text-white">
                <Gift className="w-3.5 h-3.5" />
                {locale === 'bn' ? 'স্পেশাল বার্থডে ও ঈদ গিফট বক্স' : 'Special Gift Box Combo'}
              </span>

              <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B]">
                {locale === 'bn'
                  ? 'ছোট আর্টিস্ট মেগা গিফট কম্বো'
                  : 'Little Artist Mega Gift Bundle'}
              </h2>

              <p className="text-sm sm:text-base text-[#6B6B6B] leading-relaxed">
                {locale === 'bn'
                  ? 'একটি বক্সে পাচ্ছেন: ২৪ কালার ন্যাচারাল মোমের রঙ + ৬ রঙের প্লে-ডো + আর্ট প্যাড ও কাটার সেট। জন্মদিনের দারুণ উপহার!'
                  : 'Includes: 24 Shade Natural Beeswax Crayons + 6-Color Play Dough Tub + Heavyweight Sketch Pad & Shape Cutters.'}
              </p>

              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-3xl font-black text-[#FF6B6B]">৳৬৯৯</span>
                <span className="text-base line-through text-[#6B6B6B]">৳৮৯০</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EBF8EE] text-[#2D7A3E]">
                  সাশ্রয় ৳১৯১
                </span>
              </div>

              <div className="pt-2">
                <Button size="md" variant="primary" onClick={handleQuickAdd}>
                  <ShoppingBag className="w-4 h-4" />
                  {locale === 'bn' ? 'কম্বোটি অর্ডার করুন' : 'Claim Combo Offer'}
                </Button>
              </div>
            </div>

            <div className="relative aspect-video rounded-[22px] overflow-hidden border border-[#EFE9E0] shadow-md">
              <Image
                src="https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80"
                alt="Little Artist Mega Gift Bundle"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. WHY BUY FROM US: Trust, Safety & Delivery */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B]">
            {locale === 'bn' ? 'অভিভাবকরা কেন রংধনু কিডস বেছে নেন?' : 'Why Parents Trust Rongdhonu Kids'}
          </h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {locale === 'bn'
              ? 'শিশুর নিরাপত্তা ও আনন্দের প্রতিটি খুঁটিনাটিতে আমরা আপসহীন'
              : 'Zero compromises on child safety, non-toxic purity, and fast service'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            {
              icon: ShieldCheck,
              title: locale === 'bn' ? '১০০% বিষাক্ত নয়' : '100% Non-Toxic',
              desc: locale === 'bn' ? 'খাদ্য-মানের মোম ও প্রাকৃতিক স্কিন-সেফ রং' : 'Food-grade beeswax and skin-safe mineral pigments',
              color: 'text-[#7BD389]',
              bg: 'bg-[#EBF8EE]',
            },
            {
              icon: Truck,
              title: locale === 'bn' ? 'সারা দেশে দ্রুত ডেলিভারি' : 'Steadfast Delivery',
              desc: locale === 'bn' ? 'ঢাকার ভেতরে ২৪-৪৮ ঘণ্টা, বাইরে ৭২ ঘণ্টায় ডেলিভারি' : 'Reliable delivery across all 64 districts in Bangladesh',
              color: 'text-[#5BC0EB]',
              bg: 'bg-[#E8F7FD]',
            },
            {
              icon: HeartHandshake,
              title: locale === 'bn' ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery',
              desc: locale === 'bn' ? 'পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ নিশ্চিন্তে টাকা দিন' : 'Pay only after receiving and checking your package',
              color: 'text-[#FFC93C]',
              bg: 'bg-[#FFF9E6]',
            },
            {
              icon: PhoneCall,
              title: locale === 'bn' ? 'সহজ রিটার্ন ও সহায়তা' : 'Easy Returns',
              desc: locale === 'bn' ? 'কোনো সমস্যা হলে ৭ দিনের ভেতর রিপ্লেসমেন্ট সুবিধা' : 'Friendly support via phone and WhatsApp',
              color: 'text-[#FF6B6B]',
              bg: 'bg-[#FFF0F0]',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-[24px] border border-[#EFE9E0] shadow-sm flex flex-col items-center text-center gap-3 transition-transform hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-heading font-bold text-lg text-[#2B2B2B]">{item.title}</h3>
                <p className="text-xs text-[#6B6B6B] leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. CUSTOMER REVIEWS */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-t border-[#EFE9E0]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B]">
              {locale === 'bn' ? 'সন্তুষ্ট অভিভাবকদের মতামত' : 'What Happy Parents Say'}
            </h2>
            <div className="flex items-center justify-center gap-1 mt-2 text-[#FFC93C]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
              <span className="text-xs font-bold text-[#2B2B2B] ml-2">৪.৯/৫ (৪৫০+ রিভিউ)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'ফারিহা জাহান (ঢাকা)',
                review:
                  'আমার ৩ বছরের মেয়ের জন্য নিয়েছিলাম। রঙগুলো সত্যিই অনেক স্মুথ এবং হাত বা কাপড়ে লাগলে সহজেই পানি দিয়ে ধুয়ে ফেলা যায়। প্লাস কোন গন্ধ নেই!',
                product: '২৪ শেড ন্যাচারাল মোমের রঙ',
              },
              {
                name: 'মাহমুদুল হাসান (চট্টগ্রাম)',
                review:
                  'স্টিডফাস্টে ২ দিনে ডেলিভারি পেয়েছি। প্রোডাক্টের প্যাকেজিং দারুণ এবং বাচ্চার গ্রিপিংয়ের জন্য ট্রায়াঙ্গুলার শেপটা পারফেক্ট। মোম সহজে ভাঙে না।',
                product: 'টডলার ট্রায়াঙ্গুলার মোম ১২ প্যাক',
              },
              {
                name: 'ডা. নাজিয়া সুলতানা (সিলেট)',
                review:
                  'খেলনা ও রঙের উপাদান নিয়ে আমি সবসময় সতর্ক থাকি। রংধনু কিডসের ফুড-গ্রেড ন্যাচারাল উপাদানের কনসেপ্ট সত্যিই প্রশংসনীয়। অনেক শুভকামনা রইল!',
                product: 'ছোট আর্টিস্ট গিফট কম্বো',
              },
            ].map((rev, idx) => (
              <div
                key={idx}
                className="bg-[#FAF7F2] p-5 rounded-[22px] border border-[#EFE9E0] flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex text-[#FFC93C]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-[#2B2B2B] italic">“{rev.review}”</p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#EFE9E0]/60">
                  <span className="font-heading font-bold text-sm text-[#2B2B2B] block">
                    {rev.name}
                  </span>
                  <span className="text-xs text-[#6B6B6B]">{rev.product}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. NEWSLETTER SIGNUP */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="bg-[#FFF9E6] border border-[#FFE899] rounded-[28px] p-6 sm:p-10">
          <StarDoodle className="w-8 h-8 text-[#FFC93C] mx-auto mb-2" />
          <h2 className="font-heading font-black text-2xl text-[#2B2B2B]">
            {locale === 'bn' ? '১০% ডিসকাউন্ট ভাউচার পান!' : 'Get 10% Off Your First Order!'}
          </h2>
          <p className="text-sm text-[#6B6B6B] mt-1 mb-6">
            {locale === 'bn'
              ? 'আপনার ফোন নম্বর দিন এবং প্রথম অর্ডারে RONG10 কুপন কোড ব্যবহার করুন।'
              : 'Join our family newsletter for creative parenting tips, free coloring pages & offers.'}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert(locale === 'bn' ? 'ধন্যবাদ! আপনার কুপন কোড: RONG10' : 'Thank you! Your coupon code is: RONG10');
            }}
            className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
          >
            <input
              type="tel"
              placeholder="01XXXXXXXXX"
              className="flex-1 px-4 py-3 rounded-full bg-white border border-[#EFE9E0] text-sm text-[#2B2B2B] focus:outline-none focus:border-[#FF6B6B]"
              required
            />
            <Button type="submit" variant="primary" size="md">
              {locale === 'bn' ? 'ভাউচার নিন' : 'Claim Voucher'}
            </Button>
          </form>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-white border-t border-[#EFE9E0] pt-12 pb-8 px-4 sm:px-6 lg:px-8 text-sm text-[#6B6B6B]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FF6B6B] text-white flex items-center justify-center font-bold text-lg">
                র
              </div>
              <span className="font-heading font-bold text-xl text-[#2B2B2B]">
                {locale === 'bn' ? 'রংধনু কিডস' : 'Rongdhonu Kids'}
              </span>
            </div>
            <p className="text-xs leading-relaxed">
              {locale === 'bn'
                ? 'বাংলাদেশের শিশুদের জন্য শতভাগ নিরাপদ প্রাকৃতিক মোমের রঙ (Mom er color), শিক্ষণীয় খেলনা ও ক্রিয়েটিভ সামগ্রী।'
                : 'Bangladesh’s premier destination for safe natural wax crayons, brain toys, and joy.'}
            </p>
          </div>

          <div>
            <h4 className="font-heading font-bold text-[#2B2B2B] mb-3">ক্যাটাগরি</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/shop" className="hover:text-[#FF6B6B]">মোমের রঙ (Crayons)</Link></li>
              <li><Link href="/shop" className="hover:text-[#FF6B6B]">শিক্ষণীয় খেলনা</Link></li>
              <li><Link href="/shop" className="hover:text-[#FF6B6B]">মডেলিং ক্লে ও ডো</Link></li>
              <li><Link href="/bundles" className="hover:text-[#FF6B6B]">গিফট কম্বো অফার</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-[#2B2B2B] mb-3">সহায়তা ও নীতি</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/policies" className="hover:text-[#FF6B6B]">ডেলিভারি ও রিটার্ন পলিসি</Link></li>
              <li><Link href="/track" className="hover:text-[#FF6B6B]">অর্ডার ট্র্যাকিং</Link></li>
              <li><Link href="/faq" className="hover:text-[#FF6B6B]">সাধারণ জিজ্ঞাসা (FAQ)</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-[#2B2B2B] mb-3">যোগাযোগ</h4>
            <p className="text-xs leading-relaxed">
              ফোন / WhatsApp: +৮৮০ ১৭XXXXXXXXX<br />
              ইমেইল: hello@rongdhonukids.com<br />
              ঢাকা, বাংলাদেশ
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 border-t border-[#EFE9E0] text-center text-xs">
          © ২০২৬ রংধনু কিডস (Rongdhonu Kids). সর্বস্বত্ব সংরক্ষিত। Designed for Bangladeshi Kids & Parents.
        </div>
      </footer>

      {/* 10. MOBILE BOTTOM NAVIGATION */}
      <MobileBottomNav cartCount={cartCount} locale={locale} activeTab="home" />
    </div>
  );
}
