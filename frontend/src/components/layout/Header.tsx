'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  PhoneCall,
  Heart,
  Gift,
  Clock,
  Truck,
  User,
  Globe,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatBDT } from '@/lib/utils';
import { BRAND_CONFIG } from '@/lib/brand';
import { SiteSettings, defaultSiteSettings } from '@/lib/site-settings';

interface HeaderProps {
  locale?: 'bn' | 'en';
  onToggleLocale?: () => void;
  announcement?: SiteSettings['announcement'];
}

export function Header({
  locale = 'bn',
  onToggleLocale,
  announcement = defaultSiteSettings.announcement,
}: HeaderProps) {
  const { cartCount, subtotal } = useCart();
  const router = useRouter();
  const [internalLocale, setInternalLocale] = useState<'bn' | 'en'>(locale);
  const [searchQuery, setSearchQuery] = useState('');

  const toggle = () => {
    if (onToggleLocale) {
      onToggleLocale();
    } else {
      setInternalLocale((prev) => (prev === 'bn' ? 'en' : 'bn'));
    }
  };

  const activeLocale = onToggleLocale ? locale : internalLocale;
  const isBn = activeLocale === 'bn';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {/* 1. Top Bar (phone, hours, track order, language toggle) */}
      <div className="bg-[#2B2B2B] text-white py-1.5 px-3 sm:px-4 text-xs font-medium border-b border-black/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Hotline & Service Hours */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs text-[#E0E0E0] min-w-0">
            <a
              href={`tel:${BRAND_CONFIG.defaultHotline.replace(/[^\d+]/g, '')}`}
              className="flex items-center gap-1.5 hover:text-white transition-colors truncate"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#D6403B] shrink-0" />
              <span>{isBn ? `হটলাইন: ${BRAND_CONFIG.defaultHotline}` : `Hotline: ${BRAND_CONFIG.defaultHotline}`}</span>
            </a>

            <div className="hidden md:flex items-center gap-1 text-[#AAAAAA] text-[11px]">
              <Clock className="w-3 h-3 text-[#FFC93C]" />
              <span>{isBn ? 'সকাল ৯টা – রাত ১০টা' : '9 AM – 10 PM'}</span>
            </div>
          </div>

          {/* Right: Track Order & Language Toggle */}
          <div className="flex items-center gap-3 text-xs text-[#CCCCCC] shrink-0">
            <Link
              href="/track"
              className="hidden sm:flex items-center gap-1 hover:text-white transition-colors text-[11px] sm:text-xs"
            >
              <Truck className="w-3.5 h-3.5 text-[#5BC0EB]" />
              <span>{isBn ? 'অর্ডার ট্র্যাক করুন' : 'Track Order'}</span>
            </Link>

            <span className="hidden sm:inline text-white/30">•</span>

            <button
              onClick={toggle}
              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-[11px] sm:text-xs font-bold"
            >
              <Globe className="w-3.5 h-3.5 text-[#FFC93C]" />
              <span>{isBn ? 'English' : 'বাংলা'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Branding & Search Header: logo, wide search bar, wishlist, login, cart with total */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#EFE9E0] shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-3">
          {/* Brand Logo - CraftyKidsCo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#D6403B] flex items-center justify-center text-white font-extrabold text-lg sm:text-xl shadow-xs group-hover:scale-105 transition-transform shrink-0">
              C
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-black text-lg sm:text-2xl text-[#2B2B2B] tracking-tight leading-none">
                {BRAND_CONFIG.name}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-[#6B6B6B] tracking-wider uppercase mt-0.5">
                {isBn ? 'শিশুদের নিরাপদ মোমের রঙ ও খেলনা' : 'Safe Colors & Creative Toys'}
              </span>
            </div>
          </Link>

          {/* Desktop Wide Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-xl mx-2 hidden sm:flex relative items-center"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? 'খেলনা, মোমের রঙ বা আর্ট কিট খুঁজুন...' : 'Search crayons, clay or art kits...'}
              className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] text-sm text-[#2B2B2B] placeholder-[#6B6B6B] focus:bg-white focus:outline-none focus:border-[#D6403B] focus:ring-2 focus:ring-[#D6403B]/15 transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 p-2 rounded-lg bg-[#D6403B] text-white hover:bg-[#BF3430] transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Right Actions: Wishlist, Login, Cart with Total */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Wishlist */}
            <Link
              href="/shop"
              className="p-2.5 rounded-xl hover:bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#D6403B] transition-colors hidden md:flex items-center justify-center"
              title={isBn ? 'উইশলিস্ট' : 'Wishlist'}
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Login / Account */}
            <Link
              href="/account"
              className="p-2.5 rounded-xl hover:bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#D6403B] transition-colors hidden sm:flex items-center justify-center gap-1.5 text-xs font-bold"
              title={isBn ? 'লগইন বা অ্যাকাউন্ট' : 'Login / Account'}
            >
              <User className="w-5 h-5" />
              <span className="hidden lg:inline">{isBn ? 'লগইন' : 'Login'}</span>
            </Link>

            {/* Cart with Total */}
            <Link
              href="/cart"
              className="flex items-center gap-2 py-2 px-3 sm:px-3.5 rounded-xl bg-[#D6403B] hover:bg-[#BF3430] text-white shadow-xs transition-all shrink-0 cursor-pointer"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-[#D6403B] text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-[10px] font-medium text-white/80">{isBn ? 'কার্ট' : 'Cart'}</span>
                <span className="text-xs font-extrabold">{formatBDT(subtotal, { locale: activeLocale })}</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Mobile Search Input (< sm) */}
        <div className="px-3 pb-2.5 sm:hidden">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? 'খেলনা, মোমের রঙ বা আর্ট কিট খুঁজুন...' : 'Search crayons, clay or art kits...'}
              className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] text-sm text-[#2B2B2B] focus:bg-white focus:outline-none focus:border-[#D6403B] transition-all"
            />
            <button
              type="submit"
              className="absolute right-1 p-1.5 rounded-lg bg-[#D6403B] text-white hover:bg-[#BF3430] transition-colors"
              aria-label="Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* 3. Secondary Category Menu Bar */}
        <div className="bg-[#FAF7F2] border-t border-[#EFE9E0] overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-6 sm:gap-8 h-10 text-xs sm:text-sm font-bold text-[#2B2B2B] whitespace-nowrap">
            <Link href="/" className="text-[#D6403B] hover:text-[#BF3430] flex items-center gap-1">
              {isBn ? 'হোম' : 'Home'}
            </Link>
            <Link href="/category/wax-crayons" className="hover:text-[#D6403B] transition-colors">
              {isBn ? 'মোমের রঙ' : 'Wax Crayons'}
            </Link>
            <Link href="/category/play-dough-clay" className="hover:text-[#D6403B] transition-colors">
              {isBn ? 'ক্লে ও ডো' : 'Clay & Dough'}
            </Link>
            <Link href="/category/sketchbooks" className="hover:text-[#D6403B] transition-colors">
              {isBn ? 'ড্রয়িং খাতা' : 'Drawing Books'}
            </Link>
            <Link href="/category/wooden-toys" className="hover:text-[#D6403B] transition-colors">
              {isBn ? 'কাঠের খেলনা' : 'Wooden Toys'}
            </Link>
            <Link href="/category/puzzles" className="hover:text-[#D6403B] transition-colors">
              {isBn ? 'পাজল গেম' : 'Puzzles'}
            </Link>
            <Link href="/category/art-kits" className="hover:text-[#D6403B] transition-colors">
              {isBn ? 'আর্ট কিট' : 'Art Kits'}
            </Link>
            <Link href="/shop" className="text-[#D6403B] flex items-center gap-1 font-extrabold hover:underline">
              <Gift className="w-3.5 h-3.5" />
              {isBn ? 'অফারসমূহ' : 'Offers'}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
