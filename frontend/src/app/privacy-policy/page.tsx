'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  UserCheck,
  Database,
  FileText,
  Mail,
  PhoneCall,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { BRAND_CONFIG } from '@/lib/brand';

export default function PrivacyPolicyPage() {
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
            গোপনীয়তা নীতিমালা (Privacy Policy)
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B]">
            সর্বশেষ আপডেট: ২৫ অক্টোবর, ২০২৬ • {BRAND_CONFIG.name} গ্রাহকের তথ্যের সর্বোচ্চ সুরক্ষায় প্রতিশ্রুতিবদ্ধ।
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
          <p>
            <strong>{BRAND_CONFIG.name}</strong>-এ আপনার এবং আপনার পরিবারের ব্যক্তিগত তথ্যের নিরাপত্তা আমাদের কাছে অত্যন্ত গুরুত্বপূর্ণ। এই গোপনীয়তা নীতিমালায় ব্যাখ্যা করা হয়েছে যে কীভাবে আমরা আপনার তথ্য সংগ্রহ, সংরক্ষণ, ব্যবহার ও সুরক্ষিত রাখি। আমাদের ওয়েবসাইট ভিজিট বা যেকোনো পণ্য অর্ডার করার মাধ্যমে আপনি এই নীতিমালার শর্তাবলীতে সম্মতি জানাচ্ছেন।
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6 text-xs sm:text-sm text-[#4A4A4A]">
          {/* Section 1 */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#D6403B]">
              <Database className="w-5 h-5 shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                ১. আমরা যেসকল তথ্য সংগ্রহ করি
              </h2>
            </div>
            <p className="leading-relaxed">
              আপনার অর্ডার সফলভাবে সম্পন্ন ও ডেলিভারি করার জন্য আমরা কেবল প্রয়োজনীয় তথ্য সংগ্রহ করি:
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-[#555555] pl-1">
              <li>
                <strong>ব্যক্তিগত তথ্য:</strong> নাম, মোবাইল নম্বর, পূর্ণাঙ্গ ডেলিভারি ঠিকানা (জেলা, থানা ও এলাকা), এবং ঐচ্ছিক ইমেইল অ্যাড্রেস।
              </li>
              <li>
                <strong>অর্ডার বিবরণ:</strong> নির্বাচিত পণ্য, ভ্যারিয়েন্ট, পরিমাণ এবং অর্ডারের ট্র্যাকিং সংক্রান্ত তথ্য।
              </li>
              <li>
                <strong>ব্রাউজিং ও ডিভাইস তথ্য:</strong> ব্রাউজারের ধরণ, আইপি অ্যাড্রেস এবং ওয়েবসাইট পারফরম্যান্স উন্নত করতে সাধারণ অ্যানালিটিক্স ডেটা।
              </li>
              <li>
                <strong>পেমেন্ট সংক্রান্ত তথ্য:</strong> ক্যাশ অন ডেলিভারিতে কোনো কার্ড তথ্য লাগে না। বিকাশ বা কার্ডে অনলাইন পেমেন্ট হলেও পিন বা পাসওয়ার্ড কখনোই আমাদের সার্ভারে সংরক্ষিত হয় না।
              </li>
            </ul>
          </section>

          {/* Section 2: Children Privacy */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#1F6B43]">
              <UserCheck className="w-5 h-5 shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                ২. শিশুদের তথ্যের বিশেষ সুরক্ষা (Children's Privacy)
              </h2>
            </div>
            <p className="leading-relaxed">
              যদিও আমাদের পণ্য শিশুদের জন্য নির্মিত, তবে আমাদের ওয়েবসাইট শুধুমাত্র ১৮ বছর বা তদূর্ধ্ব বয়সী অভিভাবক ও প্রাপ্তবয়স্কদের ব্যবহারের জন্য। আমরা সচেতনভাবে কোনো অপ্রাপ্তবয়স্ক শিশুর ব্যক্তিগত তথ্য সংগ্রহ করি না। পিতামাতা বা অভিভাবকের মাধ্যমেই যেকোনো অর্ডার এবং যোগাযোগ সম্পন্ন হতে হবে।
            </p>
          </section>

          {/* Section 3: Usage */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#5BC0EB]">
              <FileText className="w-5 h-5 shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                ৩. তথ্যের ব্যবহার ও উদ্দেশ্য
              </h2>
            </div>
            <p className="leading-relaxed">
              আমরা সংগৃহীত তথ্য শুধুমাত্র নিম্নলিখিত বৈধ উদ্দেশ্যে ব্যবহার করি:
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-[#555555] pl-1">
              <li>আপনার অর্ডার প্রসেস করা ও কুরিয়ার পার্টনারের মাধ্যমে সঠিক ঠিকানায় পৌঁছানো।</li>
              <li>অর্ডারের কনফার্মেশন ও ডেলিভারি স্ট্যাটাস এসএমএস বা ফোন কলের মাধ্যমে জানানো।</li>
              <li>পণ্য সংক্রান্ত যেকোনো রিপ্লেসমেন্ট বা গ্রাহক সেবা প্রদান করা।</li>
              <li>গ্রাহকের চাহিদা অনুযায়ী ওয়েবসাইটটির ব্রাউজিং অভিজ্ঞতা সহজ ও গতিশীল রাখা।</li>
            </ul>
          </section>

          {/* Section 4: Third Party Disclosure */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#FFB800]">
              <EyeOff className="w-5 h-5 text-[#D97706] shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                ৪. তৃতীয় পক্ষের সাথে তথ্য শেয়ার না করার নিশ্চয়তা
              </h2>
            </div>
            <p className="leading-relaxed">
              আমরা আপনার তথ্য কোনো বাণিজ্যিক বিজ্ঞাপনী সংস্থা বা তৃতীয় পক্ষের কাছে বিক্রয়, ভাড়া বা অপব্যবহার করি না। শুধুমাত্র পণ্য আপনার ঠিকানায় ডেলিভারি নিশ্চিত করতে আমাদের লজিস্টিক পার্টনার (স্টিডফাস্ট কুরিয়ার)-এর সাথে আপনার নাম, ঠিকানা ও ফোন নম্বর শেয়ার করা হয়।
            </p>
          </section>

          {/* Section 5: Data Security */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#D6403B]">
              <Lock className="w-5 h-5 shrink-0" />
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
                ৫. তথ্য নিরাপত্তা ও সুরক্ষা ব্যবস্থা (Security Measures)
              </h2>
            </div>
            <p className="leading-relaxed">
              আমাদের ওয়েবসাইট সর্বাধুনিক SSL (Secure Sockets Layer) এনক্রিপশন প্রযুক্তি দ্বারা সুরক্ষিত। আপনার ব্যক্তিগত তথ্য নিরাপদ সার্ভারে সংরক্ষিত থাকে এবং অনুমোদিত নির্দিষ্ট টিম সদস্য ব্যতীত কারো এতে অ্যাক্সেস থাকে না।
            </p>
          </section>

          {/* Section 6: Cookies */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
              ৬. কুকিজ ও ট্র্যাকিং নীতি (Cookies)
            </h2>
            <p className="leading-relaxed">
              আপনার কার্ট মেমোরি সংরক্ষণ ও ওয়েবসাইট গতিশীল রাখার জন্য আমরা ব্রাউজার কুকিজ ব্যবহার করি। আপনি চাইলে আপনার ব্রাউজার সেটিংস থেকে যেকোনো সময় কুকিজ নিষ্ক্রিয় করতে পারেন।
            </p>
          </section>

          {/* Section 7: User Rights & Contact */}
          <section className="bg-white rounded-2xl border border-[#EFE9E0] p-6 sm:p-7 shadow-xs space-y-4">
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2B2B]">
              ৭. আপনার অধিকার ও যোগাযোগ
            </h2>
            <p className="leading-relaxed">
              আপনার সংরক্ষিত তথ্যের কোনো পরিবর্তন, সংশোধন বা ডাটাবেজ থেকে মুছে ফেলার জন্য আপনি সরাসরি আমাদের কাস্টমার কেয়ারে যোগাযোগ করতে পারেন।
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-[#2B2B2B]">
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
