'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Globe, Gift, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface HeaderProps {
  locale?: 'bn' | 'en';
  onToggleLocale?: () => void;
}

export function Header({ locale = 'bn', onToggleLocale }: HeaderProps) {
  const { cartCount } = useCart();
  const [internalLocale, setInternalLocale] = useState<'bn' | 'en'>(locale);

  const toggle = () => {
    if (onToggleLocale) {
      onToggleLocale();
    } else {
      setInternalLocale((prev) => (prev === 'bn' ? 'en' : 'bn'));
    }
  };

  const activeLocale = onToggleLocale ? locale : internalLocale;

  return (
    <>
      {/* Top Banner Notice */}
      <div className="bg-[#FF6B6B] text-white py-2 px-4 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#FFC93C]" />
        <span>
          {activeLocale === 'bn'
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
                {activeLocale === 'bn' ? 'রংধনু কিডস' : 'Rongdhonu Kids'}
              </span>
              <span className="text-[11px] font-bold text-[#6B6B6B] tracking-wide">
                {activeLocale === 'bn' ? 'নিরাপদ মোমের রঙ ও খেলনা' : 'Safe Wax Crayons & Toys'}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 font-bold text-sm text-[#2B2B2B]">
            <Link href="/" className="hover:text-[#FF6B6B] transition-colors">
              {activeLocale === 'bn' ? 'হোম' : 'Home'}
            </Link>
            <Link href="/shop" className="hover:text-[#FF6B6B] transition-colors">
              {activeLocale === 'bn' ? 'সব পণ্য' : 'All Products'}
            </Link>
            <Link href="/category/wax-crayons" className="hover:text-[#FF6B6B] transition-colors">
              {activeLocale === 'bn' ? 'মোমের রঙ (Crayons)' : 'Wax Crayons'}
            </Link>
            <Link href="/category/educational-toys" className="hover:text-[#FF6B6B] transition-colors">
              {activeLocale === 'bn' ? 'শিক্ষণীয় খেলনা' : 'Educational Toys'}
            </Link>
            <Link href="/track" className="hover:text-[#FF6B6B] transition-colors">
              {activeLocale === 'bn' ? 'অর্ডার ট্র্যাক' : 'Track Order'}
            </Link>
            <Link href="/admin" className="text-xs px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#EFE9E0] text-[#6B6B6B] hover:text-[#FF6B6B]">
              Admin Panel
            </Link>
          </nav>

          {/* Actions: Lang toggle & Cart */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#EFE9E0] bg-[#FAF7F2] hover:bg-white text-xs font-bold text-[#2B2B2B] transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#5BC0EB]" />
              {activeLocale === 'bn' ? 'English' : 'বাংলা'}
            </button>

            <Link
              href="/cart"
              className="relative p-2.5 rounded-full bg-[#FAF7F2] border border-[#EFE9E0] hover:border-[#FF6B6B] text-[#2B2B2B] transition-colors flex items-center justify-center"
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
    </>
  );
}
