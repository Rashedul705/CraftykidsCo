'use client';

import React from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export default function FaqPage() {
  const faqs = [
    {
      q: 'মোমের রঙগুলো কি সত্যিই শিশুদের জন্য শতভাগ নিরাপদ?',
      a: 'হ্যাঁ, আমাদের প্রতিটি রঙ প্রাকৃতিক মৌচাকের মোম (Beeswax) এবং ফুড-গ্রেড নিরাপদ পিগমেন্ট দিয়ে তৈরি। এতে কোনো ক্ষতিকর লেড, প্যারাফিন বা রাসায়নিক পদার্থ নেই।',
    },
    {
      q: 'হাত বা জামায় মোমের দাগ লাগলে কি ধুয়ে ফেলা যায়?',
      a: 'অবশ্যই! আমাদের ওয়াশেবল রেঞ্জের সকল মোম সাধারণ সাবান পানি দিয়ে শিশুর ত্বক, পোশাক বা মেঝের দাগ থেকে সহজেই পরিষ্কার করা যায়।',
    },
    {
      q: 'ঢাকার বাইরে ডেলিভারি কত দিনে পাওয়া যাবে?',
      a: 'স্টিডফাস্ট কুরিয়ারের মাধ্যমে আমরা ঢাকার বাইরে ৪৮ থেকে ৭২ ঘণ্টার মধ্যে হোম ডেলিভারি নিশ্চিত করি।',
    },
    {
      q: 'আমি কি পণ্য চেক করে টাকা দিতে পারব?',
      a: 'হ্যাঁ, আমাদের সব পণ্যেই ক্যাশ অন ডেলিভারি (COD) সুবিধা রয়েছে। ডেলিভারি ম্যানের সামনে প্যাকেট চেক করে টাকা পরিশোধ করতে পারবেন।',
    },
    {
      q: 'স্কুল বা বাল্ক অর্ডারের জন্য কোনো বিশেষ ডিসকাউন্ট আছে কি?',
      a: 'হ্যাঁ, প্রি-স্কুল, ডে-কেয়ার বা আর্ট স্কুলের জন্য আমরা বিশেষ বাল্ক রেট প্রদান করি। আমাদের সাথে হোয়াটসঅ্যাপ বা ফোনে যোগাযোগ করতে পারেন।',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 md:pb-12 text-[#2B2B2B]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B]">
            সাধারণ জিজ্ঞাসা (Frequently Asked Questions)
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B]">
            অভিভাবকদের বহুল জিজ্ঞাসিত কিছু প্রশ্নের সহজ উত্তর
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((f, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#EFE9E0] p-5 shadow-sm space-y-2"
            >
              <h3 className="font-heading font-bold text-sm sm:text-base text-[#2B2B2B] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#FF6B6B] flex-shrink-0" />
                {f.q}
              </h3>
              <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed pl-6">
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </main>

      <MobileBottomNav activeTab="home" />
    </div>
  );
}
