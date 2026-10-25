'use client';

import React from 'react';
import Link from 'next/link';
import { PhoneCall, MapPin, Truck, ShieldCheck, MessageCircle } from 'lucide-react';
import { BRAND_CONFIG } from '@/lib/brand';

export function Footer() {
  return (
    <footer className="bg-[#2B2B2B] text-[#D0D0D0] text-xs sm:text-sm mt-16 pt-12 pb-24 md:pb-12 border-t border-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Column 1: Brand Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#D6403B] text-white flex items-center justify-center font-extrabold text-lg">
              C
            </div>
            <span className="font-heading font-black text-xl text-white tracking-tight">
              {BRAND_CONFIG.name}
            </span>
          </div>
          {/* Kept in Bengali as requested */}
          <p className="text-xs text-[#AAAAAA] leading-relaxed">
            শিশুদের সুস্থ শৈশব ও সৃজনশীল মেধা বিকাশে ১০০% নিরাপদ নন-টক্সিক মোমের রঙ ও শিক্ষণীয় খেলনার নির্ভরযোগ্য ব্র্যান্ড।
          </p>
          <div className="space-y-1.5 text-xs text-[#CCCCCC] pt-1">
            <a
              href={`tel:${BRAND_CONFIG.defaultHotline.replace(/[^\d+]/g, '')}`}
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#D6403B]" />
              <span>Hotline: {BRAND_CONFIG.defaultHotline}</span>
            </a>
            <a
              href={`https://wa.me/${BRAND_CONFIG.defaultWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#25D366] hover:text-[#34D399] transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span>WhatsApp: {BRAND_CONFIG.defaultHotline}</span>
            </a>
            <p className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#D6403B] shrink-0 mt-0.5" />
              <span>{BRAND_CONFIG.defaultAddress}</span>
            </p>
          </div>
        </div>

        {/* Column 2: Popular Categories */}
        <div className="space-y-2.5">
          <h4 className="font-bold text-white text-sm">Popular Categories</h4>
          <ul className="space-y-1.5 text-xs text-[#AAAAAA]">
            <li>
              <Link href="/category/wax-crayons" className="hover:text-white transition-colors">
                Natural Wax Crayons
              </Link>
            </li>
            <li>
              <Link href="/category/play-dough-clay" className="hover:text-white transition-colors">
                Modeling Play-Dough & Clay
              </Link>
            </li>
            <li>
              <Link href="/category/wooden-toys" className="hover:text-white transition-colors">
                Wooden Educational Toys
              </Link>
            </li>
            <li>
              <Link href="/category/sketchbooks" className="hover:text-white transition-colors">
                Drawing Books & Art Pads
              </Link>
            </li>
            <li>
              <Link href="/bundles" className="hover:text-white transition-colors">
                Special Gift Sets & Combos
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Customer Care & Policies */}
        <div className="space-y-2.5">
          <h4 className="font-bold text-white text-sm">Customer Care & Policies</h4>
          <ul className="space-y-1.5 text-xs text-[#AAAAAA]">
            <li>
              <Link href="/shop" className="hover:text-white transition-colors">
                All Products & Catalog
              </Link>
            </li>
            <li>
              <Link href="/track" className="hover:text-white transition-colors">
                Track Your Order
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/policies" className="hover:text-white transition-colors">
                Delivery & Return Policy
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white transition-colors">
                Frequently Asked Questions (FAQ)
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Delivery & Security */}
        <div className="space-y-2.5">
          <h4 className="font-bold text-white text-sm">Delivery & Security</h4>
          {/* Kept in Bengali as requested */}
          <p className="text-xs text-[#AAAAAA] leading-relaxed">
            দ্রুততম হোম ডেলিভারি সার্ভিসের মাধ্যমে সারা বাংলাদেশে নিরাপদে পণ্য পৌঁছে দেওয়া হয়।
          </p>
          <div className="pt-2 space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#FDE3E1] bg-[#D6403B]/20 border border-[#D6403B]/30 px-3 py-1.5 rounded-full">
              <Truck className="w-3.5 h-3.5 text-[#D6403B]" />
              <span>100% Cash on Delivery (COD)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#A5D6A7]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Food-Grade & Non-Toxic Certified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright, Legal Links & Payment Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 mt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#888888]">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <p>© 2026 {BRAND_CONFIG.name}. All rights reserved.</p>
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-[#AAAAAA]">
            <Link href="/about" className="hover:text-white transition-colors">
              About Us
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
            <span>•</span>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="px-2.5 py-0.5 rounded bg-white text-[#222222] font-black text-[10px]">bKash</span>
          <span className="px-2.5 py-0.5 rounded bg-[#D6403B] text-white font-black text-[10px]">Nagad</span>
          <span className="px-2.5 py-0.5 rounded bg-[#1A1F71] text-white font-bold text-[10px]">VISA</span>
          <span className="px-2.5 py-0.5 rounded bg-[#EB001B] text-white font-bold text-[10px]">Mastercard</span>
          <span className="px-2.5 py-0.5 rounded bg-[#444444] text-white font-bold text-[10px]">Cash on Delivery</span>
        </div>
      </div>
    </footer>
  );
}
