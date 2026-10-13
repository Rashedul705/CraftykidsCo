'use client';

import React from 'react';
import Link from 'next/link';
import { Truck, RotateCcw, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 md:pb-12 text-[#2B2B2B]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <div className="text-xs text-[#6B6B6B] flex items-center gap-1.5 mb-1">
            <Link href="/" className="hover:text-[#FF6B6B]">হোম</Link>
            <span>/</span>
            <span className="font-bold text-[#2B2B2B]">পলিসি ও শর্তাবলী</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B]">
            ডেলিভারি, রিটার্ন ও রিফান্ড নীতিমালা
          </h1>
        </div>

        {/* Delivery Policy */}
        <section className="bg-white rounded-[28px] border border-[#EFE9E0] p-6 sm:p-8 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-[#5BC0EB]">
            <Truck className="w-5 h-5" />
            <h2 className="font-heading font-bold text-lg text-[#2B2B2B]">ডেলিভারি নীতিমালা</h2>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-[#6B6B6B] leading-relaxed list-disc list-inside">
            <li>ঢাকার ভেতরে ডেলিভারি চার্জ মাত্র ৳৬০ এবং আনুমানিক সময় ২৪ থেকে ৪৮ ঘণ্টা।</li>
            <li>ঢাকার বাইরে বাংলাদেশের যেকোনো জেলায় ডেলিভারি চার্জ ৳১২০ এবং সময় ২ থেকে ৩ কর্মদিবস।</li>
            <li>৳১,০০০ বা তার বেশি টাকার অর্ডারে সারা বাংলাদেশে সম্পূর্ণ <strong>ফ্রি ডেলিভারি</strong>।</li>
            <li>আমরা বিশ্বস্ত পার্টনার <strong>স্টিডফাস্ট কুরিয়ার</strong>-এর মাধ্যমে ক্যাশ অন ডেলিভারি নিশ্চিত করি।</li>
          </ul>
        </section>

        {/* Return & Refund Policy */}
        <section className="bg-white rounded-[28px] border border-[#EFE9E0] p-6 sm:p-8 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-[#FF6B6B]">
            <RotateCcw className="w-5 h-5" />
            <h2 className="font-heading font-bold text-lg text-[#2B2B2B]">রিটার্ন ও রিপ্লেসমেন্ট পলিসি</h2>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-[#6B6B6B] leading-relaxed list-disc list-inside">
            <li>পণ্য হাতে পাওয়ার পর প্যাকেজ চেক করার পূর্ণ সুযোগ রয়েছে।</li>
            <li>কোনো পণ্য ক্ষতিগ্রস্ত বা ত্রুটিপূর্ণ হলে ডেলিভারির ৭ দিনের মধ্যে আমাদের জানালে আমরা সম্পূর্ণ বিনামূল্যে রিপ্লেসমেন্ট করে দেব।</li>
            <li>যেহেতু এটি শিশুদের স্পর্শকাতর পণ্য, খোলা বা ব্যবহৃত মোম হাইজিন কারণে ফেরতের অযোগ্য হতে পারে, যদি না তা উৎপাদনে ত্রুটিপূর্ণ হয়।</li>
          </ul>
        </section>
      </main>

      {/* Centralized Footer */}
      <Footer />

      <MobileBottomNav activeTab="home" />
    </div>
  );
}
