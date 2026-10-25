'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  UserCheck,
  Database,
  FileText,
  PhoneCall,
  ChevronRight,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { BRAND_CONFIG } from '@/lib/brand';
import { defaultSiteSettings } from '@/lib/site-settings';

export default function PrivacyPolicyPage() {
  const [privacyData, setPrivacyData] = useState(defaultSiteSettings.customPages!.privacy);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/site-settings');
        const data = await res.json();
        if (data?.success && data?.settings?.customPages?.privacy) {
          setPrivacyData({
            ...defaultSiteSettings.customPages!.privacy,
            ...data.settings.customPages.privacy,
          });
        }
      } catch (err) {
        console.warn('Could not load dynamic privacy settings, using defaults');
      }
    }
    loadSettings();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 md:pb-12 text-[#2B2B2B]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-[#6B6B6B] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#D6403B] transition-colors">
            হোম
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#AAAAAA]" />
          <span className="font-bold text-[#2B2B2B]">গোপনীয়তা নীতিমালা</span>
        </nav>

        {/* Page Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1F6B43]/10 text-[#1F6B43] font-bold text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>১০০% ডাটা নিরাপত্তা ও গোপনীয়তা গ্যারান্টি</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#2B2B2B] tracking-tight">
            {privacyData.headline}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B]">
            সর্বশেষ আপডেট: {privacyData.lastUpdated} • {BRAND_CONFIG.name} গ্রাহকের তথ্যের সর্বোচ্চ সুরক্ষায় প্রতিশ্রুতিবদ্ধ।
          </p>

          {/* Policy Navigation Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Link
              href="/policies"
              className="px-3.5 py-1.5 rounded-full bg-white border border-[#EFE9E0] hover:border-[#D6403B] text-xs font-bold text-[#6B6B6B] hover:text-[#D6403B] transition-colors"
            >
              ডেলিভারি ও রিটার্ন
            </Link>
            <span className="px-3.5 py-1.5 rounded-full bg-[#D6403B] text-white text-xs font-bold shadow-xs">
              গোপনীয়তা নীতিমালা
            </span>
            <Link
              href="/terms"
              className="px-3.5 py-1.5 rounded-full bg-white border border-[#EFE9E0] hover:border-[#D6403B] text-xs font-bold text-[#6B6B6B] hover:text-[#D6403B] transition-colors"
            >
              ব্যবহারের শর্তাবলী
            </Link>
          </div>
        </div>

        {/* Introduction Box */}
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs text-xs sm:text-sm text-[#4A4A4A] leading-relaxed space-y-2">
          <p>{privacyData.introText}</p>
        </div>

        {/* Sections */}
        <div className="space-y-6 text-xs sm:text-sm text-[#4A4A4A]">
          {/* Section 1 */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#D6403B]">
              <Database className="w-5 h-5 shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                {privacyData.section1Title}
              </h2>
            </div>
            <p className="leading-relaxed">{privacyData.section1Content}</p>
          </section>

          {/* Section 2 */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#1F6B43]">
              <UserCheck className="w-5 h-5 shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                {privacyData.section2Title}
              </h2>
            </div>
            <p className="leading-relaxed">{privacyData.section2Content}</p>
          </section>

          {/* Section 3 */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#5BC0EB]">
              <FileText className="w-5 h-5 shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                {privacyData.section3Title}
              </h2>
            </div>
            <p className="leading-relaxed">{privacyData.section3Content}</p>
          </section>

          {/* Section 4 */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#FFB800]">
              <EyeOff className="w-5 h-5 text-[#D97706] shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                {privacyData.section4Title}
              </h2>
            </div>
            <p className="leading-relaxed">{privacyData.section4Content}</p>
          </section>

          {/* Section 5 */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#D6403B]">
              <Lock className="w-5 h-5 shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                {privacyData.section5Title}
              </h2>
            </div>
            <p className="leading-relaxed">{privacyData.section5Content}</p>
          </section>

          {/* Section 6 */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
              {privacyData.section6Title}
            </h2>
            <p className="leading-relaxed">{privacyData.section6Content}</p>
          </section>

          {/* Section 7 */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-4">
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
              {privacyData.section7Title}
            </h2>
            <p className="leading-relaxed">{privacyData.section7Content}</p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-[#2B2B2B]">
              <a
                href={`tel:${BRAND_CONFIG.defaultHotline.replace(/[^\d+]/g, '')}`}
                className="flex items-center gap-1.5 hover:text-[#D6403B] transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#D6403B]" />
                <span>হটলাইন: {BRAND_CONFIG.defaultHotline}</span>
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
      <MobileBottomNav activeTab="home" />
    </div>
  );
}
