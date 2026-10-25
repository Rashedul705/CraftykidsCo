'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Scale,
  ShoppingBag,
  Truck,
  RotateCcw,
  AlertTriangle,
  PhoneCall,
  ChevronRight,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { BRAND_CONFIG } from '@/lib/brand';
import { defaultSiteSettings } from '@/lib/site-settings';

export default function TermsPage() {
  const [termsData, setTermsData] = useState(defaultSiteSettings.customPages!.terms);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/site-settings');
        const data = await res.json();
        if (data?.success && data?.settings?.customPages?.terms) {
          setTermsData({
            ...defaultSiteSettings.customPages!.terms,
            ...data.settings.customPages.terms,
          });
        }
      } catch (err) {
        console.warn('Could not load dynamic terms settings, using defaults');
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
          <span className="font-bold text-[#2B2B2B]">ব্যবহারের শর্তাবলী</span>
        </nav>

        {/* Page Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5BC0EB]/15 text-[#0284C7] font-bold text-xs">
            <Scale className="w-3.5 h-3.5" />
            <span>স্বচ্ছতা ও বিশ্বস্ততার নীতিমালা</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#2B2B2B] tracking-tight">
            {termsData.headline}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B]">
            সর্বশেষ আপডেট: {termsData.lastUpdated} • {BRAND_CONFIG.name} ওয়েবসাইট ব্রাউজিং ও কেনাকাটার পূর্ণাঙ্গ নিয়মাবলী।
          </p>

          {/* Policy Navigation Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Link
              href="/policies"
              className="px-3.5 py-1.5 rounded-full bg-white border border-[#EFE9E0] hover:border-[#D6403B] text-xs font-bold text-[#6B6B6B] hover:text-[#D6403B] transition-colors"
            >
              ডেলিভারি ও রিটার্ন
            </Link>
            <Link
              href="/privacy-policy"
              className="px-3.5 py-1.5 rounded-full bg-white border border-[#EFE9E0] hover:border-[#D6403B] text-xs font-bold text-[#6B6B6B] hover:text-[#D6403B] transition-colors"
            >
              গোপনীয়তা নীতিমালা
            </Link>
            <span className="px-3.5 py-1.5 rounded-full bg-[#D6403B] text-white text-xs font-bold shadow-xs">
              ব্যবহারের শর্তাবলী
            </span>
          </div>
        </div>

        {/* Intro */}
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs text-xs sm:text-sm text-[#4A4A4A] leading-relaxed">
          <p>{termsData.introText}</p>
        </div>

        {/* Sections */}
        <div className="space-y-6 text-xs sm:text-sm text-[#4A4A4A]">
          {/* 1. General Agreement */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#D6403B]">
              <FileCheck className="w-5 h-5 shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                {termsData.section1Title}
              </h2>
            </div>
            <p className="leading-relaxed">{termsData.section1Content}</p>
          </section>

          {/* 2. Products & Pricing */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#1F6B43]">
              <ShoppingBag className="w-5 h-5 shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                {termsData.section2Title}
              </h2>
            </div>
            <p className="leading-relaxed">{termsData.section2Content}</p>
          </section>

          {/* 3. Orders & Confirmation */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
              {termsData.section3Title}
            </h2>
            <p className="leading-relaxed">{termsData.section3Content}</p>
          </section>

          {/* 4. Payment & COD */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
              {termsData.section4Title}
            </h2>
            <p className="leading-relaxed">{termsData.section4Content}</p>
          </section>

          {/* 5. Shipping & Delivery */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#5BC0EB]">
              <Truck className="w-5 h-5 shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                {termsData.section5Title}
              </h2>
            </div>
            <p className="leading-relaxed">{termsData.section5Content}</p>
          </section>

          {/* 6. Return & Replacement */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#FF6B6B]">
              <RotateCcw className="w-5 h-5 shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                {termsData.section6Title}
              </h2>
            </div>
            <p className="leading-relaxed">{termsData.section6Content}</p>
          </section>

          {/* 7. Safety & Parental Supervision */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#D97706]">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                {termsData.section7Title}
              </h2>
            </div>
            <p className="leading-relaxed">{termsData.section7Content}</p>
          </section>

          {/* 8. Intellectual Property */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
              {termsData.section8Title}
            </h2>
            <p className="leading-relaxed">{termsData.section8Content}</p>
          </section>

          {/* 9. Governing Law */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
              {termsData.section9Title}
            </h2>
            <p className="leading-relaxed">{termsData.section9Content}</p>
          </section>

          {/* 10. Contact */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-4">
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
              {termsData.section10Title}
            </h2>
            <p className="leading-relaxed">{termsData.section10Content}</p>
            <div className="pt-1 flex flex-wrap gap-4 text-xs font-semibold text-[#2B2B2B]">
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
