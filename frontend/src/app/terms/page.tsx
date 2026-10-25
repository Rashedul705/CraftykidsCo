'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Scale,
  ShoppingBag,
  Truck,
  RotateCcw,
  AlertTriangle,
  HelpCircle,
  PhoneCall,
  Mail,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { BRAND_CONFIG } from '@/lib/brand';

export default function TermsPage() {
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
            ব্যবহারের শর্তাবলী (Terms of Service)
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B]">
            সর্বশেষ আপডেট: ২৫ অক্টোবর, ২০২৬ • {BRAND_CONFIG.name} ওয়েবসাইট ব্রাউজিং ও কেনাকাটার পূর্ণাঙ্গ নিয়মাবলী।
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
          <p>
            <strong>{BRAND_CONFIG.name}</strong> ওয়েবসাইটে আপনাকে স্বাগতম। এই সাইটটি ব্রাউজ করা, অ্যাকাউন্ট তৈরি করা বা যেকোনো পণ্য অর্ডার করার ক্ষেত্রে নিচের শর্তাবলী প্রযোজ্য হবে। আমাদের সেবা গ্রহণের মাধ্যমে আপনি এই সকল শর্তাবলী মেনে নিতে সম্মত হচ্ছেন।
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6 text-xs sm:text-sm text-[#4A4A4A]">
          {/* 1. General Agreement */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#D6403B]">
              <FileCheck className="w-5 h-5 shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                ১. সাধারণ শর্ত ও গ্রাহক যোগ্যতা
              </h2>
            </div>
            <p className="leading-relaxed">
              এই ওয়েবসাইট থেকে কেনাকাটা করার জন্য গ্রাহককে কমপক্ষে ১৮ বছর বা তদূর্ধ্ব বয়সী হতে হবে অথবা পিতামাতা/অভিভাবকের সরাসরি তত্ত্বাবধানে অর্ডার করতে হবে। সঠিক নাম, কার্যকর মোবাইল নম্বর এবং সঠিক ডেলিভারি ঠিকানা প্রদান করা গ্রাহকের দায়িত্ব।
            </p>
          </section>

          {/* 2. Products & Pricing */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#1F6B43]">
              <ShoppingBag className="w-5 h-5 shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                ২. পণ্যের বিবরণ ও মূল্য নির্ধারণ (BDT / ৳)
              </h2>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-[#555555] pl-1">
              <li>ওয়েবসাইটে প্রদর্শিত সকল পণ্যের মূল্য বাংলাদেশী টাকায় (BDT ৳) নির্ধারিত।</li>
              <li>আমরা প্রতিটি পণ্যের ছবি ও বিবরণ যথাসম্ভব নিখুঁতভাবে উপস্থাপন করি। ডিসপ্লে বা আলোর পার্থক্যের কারণে রঙের সামান্য তফাৎ পরিলক্ষিত হতে পারে।</li>
              <li>পণ্য স্টক থাকা সাপেক্ষে বিক্রয় করা হয়। কোনো পণ্যের স্টক হঠাৎ ফুরিয়ে গেলে আমরা তাৎক্ষণিকভাবে গ্রাহককে অবগত করি।</li>
            </ul>
          </section>

          {/* 3. Orders & Confirmation */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
              ৩. অর্ডার প্রক্রিয়া ও নিশ্চয়তা
            </h2>
            <p className="leading-relaxed">
              ওয়েবসাইটে অর্ডার প্লেস করার পর আমাদের স্বয়ংক্রিয় সিস্টেম বা প্রতিনিধি কর্তৃক ফোন/এসএমএস-এর মাধ্যমে অর্ডার যাচাই করা হতে পারে। ভুল বা অসম্পূর্ণ তথ্য থাকলে অথবা যোগাযোগের অনুপলব্ধতায় অর্ডার সাময়িকভাবে স্থগিত বা বাতিল করার অধিকার {BRAND_CONFIG.name} সংরক্ষণ করে।
            </p>
          </section>

          {/* 4. Payment & COD */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
              ৪. মূল্য পরিশোধ ও ক্যাশ অন ডেলিভারি (COD)
            </h2>
            <p className="leading-relaxed">
              সারা বাংলাদেশে আমাদের সবচেয়ে জনপ্রিয় পেমেন্ট মাধ্যম <strong>ক্যাশ অন ডেলিভারি (COD)</strong>। গ্রাহক পণ্য হাতে পেয়ে মূল্য পরিশোধ করতে পারবেন। এছাড়া বিকাশ, নগদ, মাস্টারকার্ড বা ভিসা কার্ডের মাধ্যমে অগ্রিম ডিজিটাল পেমেন্ট করার সুযোগ রয়েছে।
            </p>
          </section>

          {/* 5. Shipping & Delivery */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#5BC0EB]">
              <Truck className="w-5 h-5 shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                ৫. ডেলিভারি নীতিমালা ও সময়সীমা
              </h2>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-[#555555] pl-1">
              <li><strong>ঢাকার ভেতরে:</strong> ডেলিভারি চার্জ মাত্র ৳৬০, সময় আনুমানিক ২৪ থেকে ৪৮ ঘণ্টা।</li>
              <li><strong>ঢাকার বাইরে (সকল জেলায়):</strong> ডেলিভারি চার্জ ৳১২০, সময় আনুমানিক ৪৮ থেকে ৭২ ঘণ্টা।</li>
              <li><strong>ফ্রি ডেলিভারি:</strong> ৳১,০০০ বা তার বেশি টাকার কেনাকাটায় সারা বাংলাদেশে ফ্রি ডেলিভারি প্রযোজ্য।</li>
              <li>প্রাকৃতিক দুর্যোগ, রাজনৈতিক অস্থিরতা বা কুরিয়ার সংক্রান্ত অনিবার্য কারণে ডেলিভারিতে সাময়িক বিলম্ব হতে পারে।</li>
            </ul>
          </section>

          {/* 6. Return & Replacement */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#FF6B6B]">
              <RotateCcw className="w-5 h-5 shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                ৬. ৭ দিনের রিটার্ন ও রিপ্লেসমেন্ট পলিসি
              </h2>
            </div>
            <p className="leading-relaxed">
              ডেলিভারি পাওয়ার পর পণ্য ভাঙা, ক্ষতিগ্রস্ত বা ভুল পণ্য এলে ৭ দিনের মধ্যে ছবি বা আনবক্সিং প্রমাণসহ আমাদের জানালে আমরা <strong>সম্পূর্ণ বিনামূল্যে রিপ্লেসমেন্ট</strong> করে দেব। শিশুদের স্বাস্থ্য ও হাইজিন সুরক্ষার স্বার্থে খোলা বা ব্যবহৃত রঙ/ক্লে সাধারণ ফেরতযোগ্য নয়, তবে যেকোনো উৎপাদনজনিত ত্রুটির ক্ষেত্রে আমরা পূর্ণ সহায়তা প্রদান করি।
            </p>
          </section>

          {/* 7. Safety & Parental Supervision */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#D97706]">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                ৭. নিরাপদ ব্যবহার ও অভিভাবকের সতর্কতা
              </h2>
            </div>
            <p className="leading-relaxed">
              আমাদের সকল মোমের রঙ ও পণ্য ১০০% প্রাকৃতিক ও নন-টক্সিক। তবুও ৩ বছরের নিচের শিশুদের ক্ষেত্রে যেকোনো ছোট বস্তু গলায় আটকে যাওয়ার (Choking Hazard) ঝুঁকি এড়াতে সার্বক্ষণিক অভিভাবকের প্রত্যক্ষ তত্ত্বাবধানে খেলনা ও রঙ ব্যবহার করার অনুরোধ জানানো হচ্ছে।
            </p>
          </section>

          {/* 8. Intellectual Property */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
              ৮. মেধা-স্বত্ব ও কপিরাইট
            </h2>
            <p className="leading-relaxed">
              {BRAND_CONFIG.name}-এর লোগো, ব্র্যান্ড নাম, পণ্যের ছবি, ভিডিও, টেক্সট এবং গ্রাফিক্স বাংলাদেশ কপিরাইট ও ট্রেডমার্ক আইন অনুযায়ী সংরক্ষিত। কর্তৃপক্ষের লিখিত অনুমতি ছাড়া এগুলো অননুমোদিতভাবে অনুলিপি বা বাণিজ্যিক উদ্দেশ্যে ব্যবহার সম্পূর্ণ নিষিদ্ধ।
            </p>
          </section>

          {/* 9. Governing Law */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
              ৯. প্রযোজ্য আইন ও সরকারি নীতিমালা
            </h2>
            <p className="leading-relaxed">
              এই শর্তাবলী গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের ‘ডিজিটাল কমার্স পরিচালনা নির্দেশিকা ২০২১’ এবং ‘ভোক্তা অধিকার সংরক্ষণ আইন ২০০৯’-এর সাথে সামঞ্জস্য রেখে পরিচালিত হয়।
            </p>
          </section>

          {/* 10. Contact */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-4">
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
              ১০. যোগাযোগ ও গ্রাহক সেবা
            </h2>
            <p className="leading-relaxed">
              ব্যবহারের শর্তাবলী সংক্রান্ত যেকোনো প্রশ্ন বা ব্যাখ্যার প্রয়োজনে আমাদের কাস্টমার সাপোর্ট টিমের সাথে যোগাযোগ করতে পারেন:
            </p>
            <div className="pt-1 flex flex-wrap gap-4 text-xs font-semibold text-[#2B2B2B]">
              <a
                href={`tel:${BRAND_CONFIG.defaultHotline.replace(/[^\d+]/g, '')}`}
                className="flex items-center gap-1.5 hover:text-[#D6403B] transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#D6403B]" />
                <span>হটলাইন: {BRAND_CONFIG.defaultHotline}</span>
              </a>
              <a
                href={`mailto:${BRAND_CONFIG.defaultEmail}`}
                className="flex items-center gap-1.5 hover:text-[#D6403B] transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#D6403B]" />
                <span>ইমেইল: {BRAND_CONFIG.defaultEmail}</span>
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
