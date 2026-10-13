'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Button } from '@/components/ui/Button';
import { getOrderByIdOrNumber, getOrdersByPhone, OrderRecord } from '@/lib/store';

function TrackContent() {
  const searchParams = useSearchParams();
  const initialOrder = searchParams.get('order') || '';
  const initialPhone = searchParams.get('phone') || '';

  const [orderQuery, setOrderQuery] = useState(initialOrder);
  const [phoneQuery, setPhoneQuery] = useState(initialPhone);
  const [foundOrder, setFoundOrder] = useState<OrderRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialOrder) {
      const ord = getOrderByIdOrNumber(initialOrder);
      if (ord) setFoundOrder(ord);
      setHasSearched(true);
    }
  }, [initialOrder]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setHasSearched(true);

    const q = orderQuery.trim();
    const p = phoneQuery.trim();

    if (q) {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data.success && data.order) {
          setFoundOrder(data.order);
          return;
        }
      } catch {}

      const localOrd = getOrderByIdOrNumber(q);
      if (localOrd) {
        setFoundOrder(localOrd);
        return;
      }
    }

    if (p) {
      try {
        const res = await fetch(`/api/orders?phone=${encodeURIComponent(p)}`);
        const data = await res.json();
        if (data.success && data.orders && data.orders.length > 0) {
          setFoundOrder(data.orders[0]);
          return;
        }
      } catch {}

      const localOrders = getOrdersByPhone(p);
      if (localOrders.length > 0) {
        setFoundOrder(localOrders[0]);
        return;
      }
    }

    setFoundOrder(null);
  };

  const statusSteps = [
    { key: 'PENDING', label: 'অর্ডার গৃহীত' },
    { key: 'CONFIRMED', label: 'কনফার্মেশন' },
    { key: 'PROCESSING', label: 'প্যাকেজিং' },
    { key: 'SHIPPED', label: 'স্টিডফাস্টে হস্তান্তর' },
    { key: 'DELIVERED', label: 'ডেলিভারি সম্পন্ন' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'CONFIRMED': return 1;
      case 'PROCESSING': return 2;
      case 'SHIPPED': return 3;
      case 'DELIVERED': return 4;
      default: return 0;
    }
  };

  const currentStep = foundOrder ? getStepIndex(foundOrder.status) : 0;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Title */}
      <div className="text-center space-y-1">
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B]">
          অর্ডার ট্র্যাকিং (Order Tracking)
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6B6B]">
          আপনার অর্ডার নম্বর (যেমন: RK-1001) অথবা মোবাইল নম্বর দিয়ে লাইভ স্ট্যাটাস দেখুন।
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-[28px] border border-[#EFE9E0] p-6 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#2B2B2B] block">অর্ডার নম্বর:</label>
              <input
                type="text"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="RK-1001 বা RK-1002"
                className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] text-sm focus:outline-none focus:border-[#FF6B6B] font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#2B2B2B] block">অথবা মোবাইল নম্বর:</label>
              <input
                type="tel"
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] text-sm focus:outline-none focus:border-[#FF6B6B]"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="md" fullWidth>
            <Search className="w-4 h-4" />
            স্ট্যাটাস দেখুন
          </Button>
        </form>
      </div>

      {/* Tracking Result */}
      {foundOrder ? (
        <div className="bg-white rounded-[28px] border border-[#EFE9E0] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EFE9E0] gap-2">
            <div>
              <span className="text-xs text-[#6B6B6B] block">অর্ডার আইডি:</span>
              <span className="font-heading font-black text-xl text-[#FF6B6B]">
                {foundOrder.orderNumber}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EBF8EE] text-[#2D7A3E] border border-[#C4EDCD]">
                {foundOrder.status}
              </span>
              {foundOrder.courier && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8F7FD] text-[#197AA5] border border-[#BFE4F7] flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" /> স্টিডফাস্ট কুরিয়ার
                </span>
              )}
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="space-y-2">
            <span className="font-heading font-bold text-xs text-[#6B6B6B] block">
              ডেলিভারি অগ্রগতি:
            </span>
            <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center">
              {statusSteps.map((step, idx) => {
                const isPassed = idx <= currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div key={step.key} className="space-y-1.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        isPassed ? 'bg-[#7BD389]' : 'bg-[#EFE9E0]'
                      }`}
                    />
                    <span
                      className={`text-[10px] sm:text-xs font-bold block ${
                        isCurrent
                          ? 'text-[#FF6B6B]'
                          : isPassed
                          ? 'text-[#2D7A3E]'
                          : 'text-[#6B6B6B]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Courier Consignment info (if shipped) */}
          {foundOrder.consignmentId && (
            <div className="p-4 rounded-2xl bg-[#E8F7FD] border border-[#BFE4F7] flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-[#197AA5] block">
                  স্টিডফাস্ট ট্র্যাকিং কোড: {foundOrder.trackingCode}
                </span>
                <span className="text-[#197AA5]/80">
                  কনসাইনমেন্ট নম্বর: {foundOrder.consignmentId}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-[#197AA5]">
                ইন-ট্রানজিট
              </span>
            </div>
          )}

          {/* Timeline details */}
          <div className="space-y-3 pt-2">
            <h3 className="font-heading font-bold text-sm text-[#2B2B2B]">
              অর্ডার টাইমলাইন ও হিস্ট্রি
            </h3>
            <div className="space-y-3">
              {foundOrder.timeline.map((entry, idx) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B] mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-[#2B2B2B] block">{entry.note}</span>
                    <span className="text-[11px] text-[#6B6B6B]">{entry.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : hasSearched ? (
        <div className="bg-white rounded-[28px] border border-[#EFE9E0] p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-[#FF6B6B] mx-auto" />
          <h3 className="font-heading font-bold text-base text-[#2B2B2B]">
            কোনো অর্ডার খুঁজে পাওয়া যায়নি
          </h3>
          <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
            দয়া করে সঠিক অর্ডার নম্বর (যেমন: RK-1001) বা অর্ডার দেওয়ার সময় ব্যবহৃত ফোন নম্বর দিয়ে আবার চেষ্টা করুন।
          </p>
        </div>
      ) : null}
    </main>
  );
}

export default function OrderTrackingPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 md:pb-12 text-[#2B2B2B]">
      <Header />
      <Suspense fallback={<div className="p-12 text-center text-xs">লোড হচ্ছে...</div>}>
        <TrackContent />
      </Suspense>
      {/* Centralized Footer */}
      <Footer />
      <MobileBottomNav activeTab="home" />
    </div>
  );
}
