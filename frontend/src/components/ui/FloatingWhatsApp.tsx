'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, MessageCircle } from 'lucide-react';
import { BRAND_CONFIG } from '@/lib/brand';

export function FloatingWhatsApp() {
  const pathname = usePathname();
  const [showAdvisorBubble, setShowAdvisorBubble] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState(BRAND_CONFIG.defaultWhatsapp);

  // Do not render on admin panel
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  // Fetch dynamic whatsapp from site-settings if configured
  useEffect(() => {
    fetch('/api/site-settings')
      .then((res) => res.json())
      .then((data) => {
        const customNumber =
          data?.settings?.contact?.whatsapp ||
          data?.settings?.contact?.phone ||
          data?.settings?.supportPhone;
        if (customNumber) {
          const cleaned = customNumber.replace(/[\s\-\(\)\+]/g, '');
          if (cleaned.length >= 10) {
            setWhatsappNumber(cleaned.startsWith('88') ? cleaned : `88${cleaned}`);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Show advisor speech bubble after 2.5 seconds on the page
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDismissed) {
        setShowAdvisorBubble(true);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isDismissed, pathname]);

  // Construct context-aware message based on current page
  let greetingMessage =
    'আসসালামু আলাইকুম! আমার বাচ্চার বয়স অনুযায়ী সেরা নিরাপদ খেলনা ও মোমের রঙের পরামর্শ নিতে চাচ্ছি।';

  if (pathname?.startsWith('/product/')) {
    const slug = pathname.replace('/product/', '');
    greetingMessage = `আসসালামু আলাইকুম! আমি CraftyKidsCo-এর এই পণ্যটি দেখছি: https://craftykidsco.com${pathname}। এটি আমার বাচ্চার বয়সের জন্য উপযুক্ত হবে কিনা জানতে চাই।`;
  } else if (pathname?.startsWith('/category/')) {
    greetingMessage = `আসসালামু আলাইকুম! আমি এই ক্যাটাগরির পণ্যগুলো দেখছি: https://craftykidsco.com${pathname}। বাচ্চার বয়স অনুযায়ী কোন আইটেমটি সবচেয়ে ভালো হবে?`;
  }

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    greetingMessage
  )}`;

  return (
    <aside
      aria-label="Parenting & Product Advice WhatsApp"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex flex-col items-end"
    >
      {/* Interactive Advisor Speech Bubble */}
      {showAdvisorBubble && !isDismissed && (
        <div className="mb-2.5 max-w-[260px] sm:max-w-xs bg-white border border-[#EFE9E0] rounded-2xl p-3.5 shadow-lg text-xs animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
          <button
            type="button"
            onClick={() => {
              setShowAdvisorBubble(false);
              setIsDismissed(true);
            }}
            className="absolute top-2 right-2 text-[#6B6B6B] hover:text-[#2B2B2B] p-1 rounded-full hover:bg-[#FAF7F2] transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1F6B43] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
            <span>অভিভাবক সহায়তা অনলাইনে</span>
          </div>

          <p className="text-[#2B2B2B] font-medium leading-relaxed pr-3">
            বাচ্চার বয়স অনুযায়ী সেরা খেলনা বা রং বাছতে কনফিউজড? সরাসরি আমাদের সাথে কথা বলুন! 💬
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 font-bold text-[#20BA5A] hover:underline text-[11px]"
          >
            চ্যাট শুরু করুন &rarr;
          </a>
        </div>
      )}

      {/* Main WhatsApp Floating Pill Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="flex items-center gap-2.5 px-3.5 py-2.5 md:px-4 md:py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_25px_rgba(37,211,102,0.55)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
      >
        {/* WhatsApp Official Vector Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          className="w-5 h-5 fill-current shrink-0"
          aria-hidden="true"
        >
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
        </svg>

        {/* Text */}
        <span className="font-heading font-bold text-xs sm:text-sm tracking-tight whitespace-nowrap">
          বাচ্চার বয়স ও খেলনা পরামর্শ
        </span>
      </a>
    </aside>
  );
}
