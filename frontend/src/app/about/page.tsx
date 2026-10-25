'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Heart,
  ShieldCheck,
  Award,
  Truck,
  RotateCcw,
  Smile,
  CheckCircle2,
  ChevronRight,
  Leaf,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { BRAND_CONFIG } from '@/lib/brand';
import { defaultSiteSettings } from '@/lib/site-settings';

export default function AboutPage() {
  const [aboutData, setAboutData] = useState(defaultSiteSettings.customPages!.about);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/site-settings');
        const data = await res.json();
        if (data?.success && data?.settings?.customPages?.about) {
          setAboutData({
            ...defaultSiteSettings.customPages!.about,
            ...data.settings.customPages.about,
          });
        }
      } catch (err) {
        console.warn('Could not load dynamic about settings, using defaults');
      }
    }
    loadSettings();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 md:pb-12 text-[#2B2B2B]">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-[#6B6B6B] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#D6403B] transition-colors">
            হোম
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#AAAAAA]" />
          <span className="font-bold text-[#2B2B2B]">আমাদের সম্পর্কে</span>
        </nav>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D6403B]/10 text-[#D6403B] font-bold text-xs">
            <Heart className="w-3.5 h-3.5 text-[#D6403B]" />
            <span>{aboutData.badge}</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl lg:text-5xl text-[#2B2B2B] tracking-tight leading-tight">
            {aboutData.headline}
          </h1>
          <p className="text-xs sm:text-base text-[#6B6B6B] leading-relaxed max-w-2xl mx-auto">
            {aboutData.subtitle}
          </p>
        </div>

        {/* Key Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-[#EFE9E0] p-5 text-center shadow-xs space-y-1">
            <div className="font-heading font-black text-2xl sm:text-3xl text-[#D6403B]">{aboutData.stat1Val}</div>
            <p className="text-xs font-bold text-[#2B2B2B]">{aboutData.stat1Label}</p>
            <p className="text-[11px] text-[#6B6B6B]">ক্ষতিকর প্যারাফিন মুক্ত</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#EFE9E0] p-5 text-center shadow-xs space-y-1">
            <div className="font-heading font-black text-2xl sm:text-3xl text-[#1F6B43]">{aboutData.stat2Val}</div>
            <p className="text-xs font-bold text-[#2B2B2B]">{aboutData.stat2Label}</p>
            <p className="text-[11px] text-[#6B6B6B]">শিশুদের মুখে দিলেও নিরাপদ</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#EFE9E0] p-5 text-center shadow-xs space-y-1">
            <div className="font-heading font-black text-2xl sm:text-3xl text-[#5BC0EB]">{aboutData.stat3Val}</div>
            <p className="text-xs font-bold text-[#2B2B2B]">{aboutData.stat3Label}</p>
            <p className="text-[11px] text-[#6B6B6B]">সারা বাংলাদেশ জুড়ে</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#EFE9E0] p-5 text-center shadow-xs space-y-1">
            <div className="font-heading font-black text-2xl sm:text-3xl text-[#FFB800]">{aboutData.stat4Val}</div>
            <p className="text-xs font-bold text-[#2B2B2B]">{aboutData.stat4Label}</p>
            <p className="text-[11px] text-[#6B6B6B]">ক্যাশ অন ডেলিভারি সুবিধা</p>
          </div>
        </div>

        {/* The Story Section */}
        <div className="bg-white rounded-[28px] border border-[#EFE9E0] p-6 sm:p-10 shadow-sm space-y-6">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D6403B] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>আমাদের শুরুর গল্প</span>
            </div>
            <h2 className="font-heading font-black text-xl sm:text-2xl text-[#2B2B2B]">
              {aboutData.storyTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-[#4A4A4A] leading-relaxed">
            <p>{aboutData.storyPara1}</p>
            <p>{aboutData.storyPara2}</p>
          </div>
        </div>

        {/* 4 Core Pillars */}
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="font-heading font-black text-xl sm:text-2xl text-[#2B2B2B]">
              আমাদের ৪টি মূল ভিত্তি ও বৈশিষ্ট্য
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6B6B]">
              প্রতিটি পণ্যে আমরা যে ৪টি বিষয়ে আপসহীন
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-white border border-[#EFE9E0] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#D6403B]/10 text-[#D6403B] flex items-center justify-center">
                <Leaf className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-[#2B2B2B]">
                {aboutData.pillar1Title}
              </h3>
              <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">
                {aboutData.pillar1Desc}
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-white border border-[#EFE9E0] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#1F6B43]/10 text-[#1F6B43] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-[#2B2B2B]">
                {aboutData.pillar2Title}
              </h3>
              <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">
                {aboutData.pillar2Desc}
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-white border border-[#EFE9E0] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#5BC0EB]/15 text-[#0284C7] flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-[#2B2B2B]">
                {aboutData.pillar3Title}
              </h3>
              <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">
                {aboutData.pillar3Desc}
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-2xl bg-white border border-[#EFE9E0] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFB800]/15 text-[#D97706] flex items-center justify-center">
                <Smile className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-[#2B2B2B]">
                {aboutData.pillar4Title}
              </h3>
              <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">
                {aboutData.pillar4Desc}
              </p>
            </div>
          </div>
        </div>

        {/* Our Commitments to Customers */}
        <div className="bg-[#FAF0E6]/60 rounded-[28px] border border-[#E8D9C8] p-6 sm:p-8 space-y-4">
          <h3 className="font-heading font-black text-lg text-[#2B2B2B] text-center sm:text-left">
            অভিভাবকদের কাছে আমাদের ৩টি প্রতিশ্রুতি
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm text-[#4A4A4A]">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#D6403B] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[#2B2B2B] font-bold">প্যাকেট চেক করে টাকা পরিশোধ</strong>
                <span>ডেলিভারির সময় প্রোডাক্ট দেখে নেওয়ার পূর্ণ অধিকার।</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <RotateCcw className="w-5 h-5 text-[#1F6B43] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[#2B2B2B] font-bold">৭ দিনের সহজ রিপ্লেসমেন্ট</strong>
                <span>পণ্য ক্ষতিগ্রস্ত বা ত্রুটিপূর্ণ পেলে সম্পূর্ণ বিনামূল্যে পরিবর্তন।</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Truck className="w-5 h-5 text-[#5BC0EB] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[#2B2B2B] font-bold">দ্রুততম হোম ডেলিভারি</strong>
                <span>২৪ থেকে ৭২ ঘণ্টার মধ্যে স্টিডফাস্ট কুরিয়ারে সুরক্ষিত হোম ডেলিভারি।</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="rounded-[28px] bg-gradient-to-r from-[#D6403B] to-[#BF3430] text-white p-8 sm:p-10 text-center space-y-4 shadow-md">
          <h2 className="font-heading font-black text-xl sm:text-3xl text-white">
            {aboutData.ctaHeading}
          </h2>
          <p className="text-xs sm:text-sm text-white/90 max-w-xl mx-auto">
            {aboutData.ctaSubtitle}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/shop"
              className="px-6 py-3 rounded-xl bg-white text-[#D6403B] hover:bg-[#FAF7F2] font-black text-xs sm:text-sm shadow-xs transition-colors"
            >
              সব পণ্য দেখুন
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs sm:text-sm transition-colors"
            >
              আমাদের সাথে যোগাযোগ করুন
            </Link>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav activeTab="home" />
    </div>
  );
}
