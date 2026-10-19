'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Search, PhoneCall, Heart, Gift, Sparkles, Globe } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatBDT } from '@/lib/utils';

interface HeaderProps {
  locale?: 'bn' | 'en';
  onToggleLocale?: () => void;
}

export function Header({ locale = 'bn', onToggleLocale }: HeaderProps) {
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {/* 1. Top Announcement Bar */}
      <div className="bg-[#1F1F1F] text-white py-1.5 px-4 text-xs font-medium border-b border-black/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-block w-2 h-2 rounded-full bg-[#E53935] animate-pulse shrink-0" />
            <span className="text-[#E0E0E0] truncate text-[11px] sm:text-xs">
              {activeLocale === 'bn'
                ? 'দেশজুড়ে দ্রুত হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি!'
                : 'Nationwide Fast Home Delivery & Cash on Delivery!'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#B0B0B0] shrink-0">
            <a
              href="tel:+8801700000000"
              className="hidden sm:flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#E53935]" />
              <span>হটলাইন: 01700-000000</span>
            </a>
            <button
              onClick={toggle}
              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-[11px] sm:text-xs"
            >
              <Globe className="w-3 h-3 text-[#FFC107]" />
              <span>{activeLocale === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Branding & Search Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#EFE9E0] shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand Logo - ALWAYS in English CraftyKidsCo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink min-w-0 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-[#E53935] flex items-center justify-center text-white font-black text-lg sm:text-2xl shadow-[0_4px_12px_rgba(229,57,53,0.3)] group-hover:scale-105 transition-transform shrink-0">
              C
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-black text-base sm:text-2xl text-[#222222] tracking-tight leading-none truncate">
                CraftyKidsCo
              </span>
              <span className="text-[8px] sm:text-[10px] font-bold text-[#888888] tracking-wider uppercase mt-0.5 truncate">
                Safe Colors & Creative Toys
              </span>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-xl mx-2 hidden sm:flex relative items-center"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="খেলনা, মোমের রঙ বা আর্ট কিট খুঁজুন..."
              className="w-full pl-4 pr-11 py-2 rounded-full border border-[#DFD7CC] bg-[#FAF8F5] text-sm text-[#222222] focus:bg-white focus:outline-none focus:border-[#E53935] focus:ring-2 focus:ring-[#E53935]/15 transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 p-1.5 rounded-full bg-[#E53935] text-white hover:bg-[#D32F2F] transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Right Actions: Hotline, Wishlist & Cart */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/shop"
              className="p-2 rounded-full hover:bg-[#FAF7F2] text-[#555] transition-colors hidden md:flex items-center justify-center"
              title="পছন্দের তালিকা"
            >
              <Heart className="w-5 h-5 text-[#666] hover:text-[#E53935]" />
            </Link>

            <Link
              href="/cart"
              className="flex items-center gap-1.5 sm:gap-2 py-1.5 px-2.5 sm:px-3.5 rounded-full bg-[#E53935] hover:bg-[#D32F2F] text-white shadow-[0_3px_10px_rgba(229,57,53,0.25)] transition-all shrink-0"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-[#E53935] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden lg:flex flex-col text-left leading-tight">
                <span className="text-[10px] font-semibold text-white/80">কার্ট</span>
                <span className="text-xs font-black">{formatBDT(subtotal, { locale: activeLocale })}</span>
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
              placeholder="খেলনা, মোমের রঙ বা আর্ট কিট খুঁজুন..."
              className="w-full pl-3.5 pr-9 py-2 rounded-full border border-[#DFD7CC] bg-[#FAF8F5] text-sm text-[#222222] focus:bg-white focus:outline-none focus:border-[#E53935] transition-all"
            />
            <button
              type="submit"
              className="absolute right-1 p-1.5 rounded-full bg-[#E53935] text-white hover:bg-[#D32F2F] transition-colors"
              aria-label="Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* 3. Secondary Category Bar */}
        <div className="bg-[#FAF7F2] border-t border-[#EFE9E0]/80 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-6 sm:gap-8 h-10 text-xs sm:text-sm font-bold text-[#444] whitespace-nowrap">
            <Link href="/" className="text-[#E53935] hover:text-[#C62828] flex items-center gap-1">
              {activeLocale === 'bn' ? 'হোম' : 'Home'}
            </Link>
            <Link href="/category/wax-crayons" className="hover:text-[#E53935] transition-colors">
              {activeLocale === 'bn' ? 'মোমের রঙ' : 'Wax Crayons'}
            </Link>
            <Link href="/category/play-dough-clay" className="hover:text-[#E53935] transition-colors">
              {activeLocale === 'bn' ? 'ক্লে ও ডো' : 'Clay & Dough'}
            </Link>
            <Link href="/category/sketchbooks" className="hover:text-[#E53935] transition-colors">
              {activeLocale === 'bn' ? 'ড্রয়িং খাতা' : 'Drawing Books'}
            </Link>
            <Link href="/category/wooden-toys" className="hover:text-[#E53935] transition-colors">
              {activeLocale === 'bn' ? 'কাঠের খেলনা' : 'Wooden Toys'}
            </Link>
            <Link href="/category/puzzles" className="hover:text-[#E53935] transition-colors">
              {activeLocale === 'bn' ? 'পাজল গেম' : 'Puzzles'}
            </Link>
            <Link href="/category/art-kits" className="hover:text-[#E53935] transition-colors">
              {activeLocale === 'bn' ? 'আর্ট কিট' : 'Art Kits'}
            </Link>
            <Link href="/shop" className="text-[#E53935] flex items-center gap-1 font-extrabold hover:underline">
              <Gift className="w-3.5 h-3.5" />
              {activeLocale === 'bn' ? 'অফারসমূহ' : 'Offers'}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
