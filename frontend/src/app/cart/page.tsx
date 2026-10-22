'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  Tag,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { FreeDeliveryBar } from '@/components/storefront/FreeDeliveryBar';
import { Button } from '@/components/ui/Button';
import { formatBDT } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const {
    items,
    subtotal,
    cartCount,
    updateQuantity,
    removeItem,
    couponCode,
    discountAmount,
    applyCouponCode,
    applyCouponAsync,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [locale, setLocale] = useState<'bn' | 'en'>('bn');
  const [deliverySettings, setDeliverySettings] = useState({ freeDeliveryThreshold: 1000 });

  React.useEffect(() => {
    fetch('/api/delivery-charges')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setDeliverySettings(data.settings);
        }
      })
      .catch(() => {});
  }, []);

  // Delivery estimation based on live threshold
  const isFreeDelivery = subtotal >= (deliverySettings.freeDeliveryThreshold || 1000);
  const grandTotal = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = await applyCouponAsync(couponInput);
    setCouponFeedback(res);
    if (res.success) {
      setCouponInput('');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 md:pb-12 text-[#2B2B2B]">
      <Header locale={locale} onToggleLocale={() => setLocale(locale === 'bn' ? 'en' : 'bn')} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Breadcrumb & Title */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-[#6B6B6B] flex items-center gap-1.5 mb-1">
              <Link href="/" className="hover:text-[#FF6B6B]">হোম</Link>
              <span>/</span>
              <span className="font-bold text-[#2B2B2B]">শপিং কার্ট</span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B]">
              {locale === 'bn' ? `আপনার কার্ট (${cartCount}টি আইটেম)` : `Your Shopping Cart (${cartCount})`}
            </h1>
          </div>

          <Link href="/shop" className="text-xs font-bold text-[#FF6B6B] hover:underline flex items-center gap-1">
            Continue Shopping <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left: Free delivery progress bar & Item list */}
            <div className="lg:col-span-2 space-y-4">
              {/* Free delivery progress bar */}
              <FreeDeliveryBar currentSubtotal={subtotal} freeDeliveryThreshold={1000} locale={locale} />

              {/* Items Card List */}
              <div className="bg-white rounded-[28px] border border-[#EFE9E0] p-4 sm:p-6 divide-y divide-[#EFE9E0] shadow-sm">
                {items.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Item Image */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#EFE9E0] shrink-0">
                        <Image
                          src={item.imageUrl}
                          alt={item.titleBn}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Item Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-bold text-sm sm:text-base text-[#2B2B2B] truncate">
                          {item.titleBn}
                        </h3>
                        {item.variationTitleBn && (
                          <span className="text-xs text-[#FF6B6B] font-semibold block">
                            {item.variationTitleBn}
                          </span>
                        )}
                        <div className="text-xs sm:text-sm font-black text-[#2B2B2B] mt-0.5">
                          ৳{item.price}
                        </div>
                      </div>
                    </div>

                    {/* Quantity controls & Line total */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 pl-[74px] sm:pl-0">
                      <div className="flex items-center bg-[#FAF7F2] border border-[#EFE9E0] rounded-full p-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#2B2B2B] hover:text-[#FF6B6B] shadow-sm cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-bold text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#2B2B2B] hover:text-[#FF6B6B] shadow-sm cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-sm text-[#FF6B6B]">
                          ৳{item.price * item.quantity}
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-xs text-[#6B6B6B] hover:text-[#FF6B6B] mt-0.5 p-1 inline-flex items-center gap-1 cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Summary & Checkout button */}
            <div className="space-y-4">
              {/* Coupon card */}
              <div className="bg-white rounded-[24px] border border-[#EFE9E0] p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 font-heading font-bold text-sm text-[#2B2B2B]">
                  <Tag className="w-4 h-4 text-[#FF6B6B]" />
                  <span>কুপন ও ডিসকাউন্ট কোড</span>
                </div>

                {couponCode ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[#EBF8EE] border border-[#C4EDCD] text-xs">
                    <div>
                      <span className="font-bold text-[#2D7A3E] block">
                        কোড: {couponCode}
                      </span>
                      <span className="text-[#2D7A3E]">৳{discountAmount} সাশ্রয় হয়েছে</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs font-bold text-[#FF6B6B] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="RONG10 বা FREE60"
                      className="flex-1 px-3 py-2 text-xs rounded-full bg-[#FAF7F2] border border-[#EFE9E0] uppercase font-bold focus:outline-none focus:border-[#FF6B6B]"
                    />
                    <Button type="submit" size="sm" variant="outline">
                      Apply
                    </Button>
                  </form>
                )}

                {couponFeedback && (
                  <div
                    className={`text-xs p-2 rounded-xl ${
                      couponFeedback.success
                        ? 'bg-[#EBF8EE] text-[#2D7A3E]'
                        : 'bg-[#FFF0F0] text-[#FF6B6B]'
                    }`}
                  >
                    {couponFeedback.message}
                  </div>
                )}
              </div>

              {/* Order calculation breakdown */}
              <div className="bg-white rounded-[24px] border border-[#EFE9E0] p-6 shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-base text-[#2B2B2B] pb-3 border-b border-[#EFE9E0]">
                  অর্ডার সামারি
                </h3>

                <div className="space-y-2.5 text-xs text-[#6B6B6B]">
                  <div className="flex justify-between">
                    <span>পণ্যগুলোর মোট মূল্য:</span>
                    <span className="font-bold text-[#2B2B2B]">৳{subtotal}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>ডেলিভারি চার্জ:</span>
                    <div>
                      {isFreeDelivery ? (
                        <span className="font-bold text-[#1F6B43]">ফ্রি (৳0)</span>
                      ) : (
                        <span className="text-[11px] font-semibold text-[#6B6B6B] bg-[#FAF7F2] border border-[#EFE9E0] px-2 py-0.5 rounded-full">
                          চেকআউটে নির্ধারিত হবে
                        </span>
                      )}
                    </div>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#2D7A3E]">
                      <span>কুপন ছাড় ({couponCode}):</span>
                      <span className="font-bold">-৳{discountAmount}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#EFE9E0] flex justify-between items-baseline text-sm font-black text-[#2B2B2B]">
                    <div>
                      <span className="block text-[#2B2B2B]">সর্বমোট প্রদেয়:</span>
                      {!isFreeDelivery && (
                        <span className="text-[10px] text-[#6B6B6B] font-normal block">
                          (ডেলিভারি চার্জ চেকআউটে যুক্ত হবে)
                        </span>
                      )}
                    </div>
                    <span className="text-2xl text-[#FF6B6B]">৳{grandTotal}</span>
                  </div>
                </div>

                <Link href="/checkout" className="block pt-2">
                  <Button variant="primary" size="lg" fullWidth>
                    <ShoppingBag className="w-5 h-5" />
                    Proceed to Checkout
                  </Button>
                </Link>

                <div className="text-center text-[11px] text-[#6B6B6B] flex items-center justify-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#7BD389]" />
                  <span>কোনো অগ্রিম পেমেন্ট ছাড়াই অর্ডার সম্পন্ন করুন</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border border-[#EFE9E0] p-12 text-center space-y-4 max-w-lg mx-auto">
            <span className="text-5xl block">🛒</span>
            <h2 className="font-heading font-black text-2xl text-[#2B2B2B]">
              আপনার কার্ট বর্তমানে খালি আছে
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              আপনার সোনামণির জন্য প্রাকৃতিক মোমের রঙ বা খেলনা যুক্ত করতে কেনাকাটা শুরু করুন।
            </p>
            <div className="pt-2">
              <Link href="/shop">
                <Button variant="primary" size="md">
                  Shop Now
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Centralized Footer */}
      <Footer />

      <MobileBottomNav activeTab="cart" locale={locale} />
    </div>
  );
}
