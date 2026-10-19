'use client';

import React from 'react';
import Link from 'next/link';
import { PhoneCall, Mail, MapPin, Truck, ShieldCheck, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#191919] text-[#B0B0B0] text-xs sm:text-sm mt-16 pt-12 pb-24 md:pb-12 border-t border-[#2A2A2A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Column 1: Brand Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E53935] text-white flex items-center justify-center font-black text-lg">
              C
            </div>
            <span className="font-heading font-black text-xl text-white tracking-tight">
              CraftyKidsCo
            </span>
          </div>
          <p className="text-xs text-[#888888] leading-relaxed">
            শিশুদের সুস্থ শৈশব ও সৃজনশীল মেধা বিকাশে ১০০% নিরাপদ নন-টক্সিক মোমের রঙ ও শিক্ষণীয় খেলনার নির্ভরযোগ্য ব্র্যান্ড।
          </p>
          <div className="space-y-1.5 text-xs text-[#AAAAAA] pt-1">
            <p className="flex items-center gap-2">
              <PhoneCall className="w-3.5 h-3.5 text-[#E53935]" />
              <span>+৮৮০ ১৭১১-২২৩৩৪৪</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#E53935]" />
              <span>support@craftykidsco.com</span>
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#E53935]" />
              <span>ধানমন্ডি, ঢাকা, বাংলাদেশ</span>
            </p>
          </div>
        </div>

        {/* Column 2: Popular Categories */}
        <div className="space-y-2.5">
          <h4 className="font-bold text-white text-sm">জনপ্রিয় ক্যাটাগরি</h4>
          <ul className="space-y-1.5 text-xs text-[#888888]">
            <li>
              <Link href="/category/wax-crayons" className="hover:text-white transition-colors">
                মোমের রঙ (Natural Crayons)
              </Link>
            </li>
            <li>
              <Link href="/category/play-dough-clay" className="hover:text-white transition-colors">
                মডেলিং প্লে-ডো ও আর্টক্লে
              </Link>
            </li>
            <li>
              <Link href="/category/wooden-toys" className="hover:text-white transition-colors">
                কাঠের শিক্ষণীয় খেলনা
              </Link>
            </li>
            <li>
              <Link href="/category/sketchbooks" className="hover:text-white transition-colors">
                ড্রয়িং খাতা ও আর্ট প্যাড
              </Link>
            </li>
            <li>
              <Link href="/bundles" className="hover:text-white transition-colors">
                স্পেশাল গিফট সেট ও কম্বো
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Customer Care & Links */}
        <div className="space-y-2.5">
          <h4 className="font-bold text-white text-sm">কাস্টমার কেয়ার ও সহায়তা</h4>
          <ul className="space-y-1.5 text-xs text-[#888888]">
            <li>
              <Link href="/shop" className="hover:text-white transition-colors">
                সব পণ্য ও ক্যাটালগ
              </Link>
            </li>
            <li>
              <Link href="/track" className="hover:text-white transition-colors">
                অর্ডার ট্র্যাক করুন
              </Link>
            </li>
            <li>
              <Link href="/checkout" className="hover:text-white transition-colors">
                সহজ এক-পৃষ্ঠার চেকআউট
              </Link>
            </li>
            <li>
              <Link href="/policies" className="hover:text-white transition-colors">
                ডেলিভারি ও রিটার্ন পলিসি
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white transition-colors">
                সাধারণ প্রশ্নোত্তর (FAQ)
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-white transition-colors">
                আমার অ্যাকাউন্ট (লগইন)
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-white transition-colors">
                এডমিন প্যানেল
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Delivery Partner & Assurances */}
        <div className="space-y-2.5">
          <h4 className="font-bold text-white text-sm">ডেলিভারি ও নিরাপত্তা</h4>
          <p className="text-xs text-[#888888] leading-relaxed">
            Steadfast Courier এর মাধ্যমে সারা বাংলাদেশে দ্রুততম হোম ডেলিভারি সেবা।
          </p>
          <div className="pt-2 space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#E53935] bg-[#E53935]/10 border border-[#E53935]/30 px-3 py-1.5 rounded-full">
              <Truck className="w-3.5 h-3.5" />
              <span>১০০% ক্যাশ অন ডেলিভারি (COD)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#A5D6A7]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>১০০% ফুড-গ্রেড ও নন-টক্সিক সার্টিফাইড</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Payment Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 mt-8 border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#777]">
        <p>© ২০২৬ CraftyKidsCo. সর্বস্বত্ব সংরক্ষিত।</p>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-sm bg-white text-[#222] font-black text-[10px]">bKash</span>
          <span className="px-2 py-0.5 rounded-sm bg-[#E53935] text-white font-black text-[10px]">Nagad</span>
          <span className="px-2 py-0.5 rounded-sm bg-[#1A1F71] text-white font-bold text-[10px]">VISA</span>
          <span className="px-2 py-0.5 rounded-sm bg-[#EB001B] text-white font-bold text-[10px]">Mastercard</span>
          <span className="px-2 py-0.5 rounded-sm bg-[#333333] text-white font-bold text-[10px]">COD</span>
        </div>
      </div>
    </footer>
  );
}
