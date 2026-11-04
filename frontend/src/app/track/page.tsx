'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
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
  Loader2,
  MapPin,
  Phone,
  ShoppingBag,
  RotateCcw,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Button } from '@/components/ui/Button';
import { getOrderByIdOrNumber, getOrdersByPhone, OrderRecord } from '@/lib/store';

function TrackContent() {
  const searchParams = useSearchParams();
  // Support orderId, order, order_id, or id from QR codes and SMS tracking links
  const initialOrder =
    searchParams.get('orderId') ||
    searchParams.get('order') ||
    searchParams.get('order_id') ||
    searchParams.get('id') ||
    '';
  const initialPhone = searchParams.get('phone') || '';

  const [orderQuery, setOrderQuery] = useState(initialOrder);
  const [phoneQuery, setPhoneQuery] = useState(initialPhone);
  const [foundOrder, setFoundOrder] = useState<OrderRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPayingOnline, setIsPayingOnline] = useState(false);

  const handlePayOnline = async (orderNumber: string) => {
    setIsPayingOnline(true);
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, paymentMethod: 'BKASH' }),
      });
      const data = await res.json();
      setIsPayingOnline(false);
      if (data.success && data.paymentURL) {
        window.location.href = data.paymentURL;
      }
    } catch {
      setIsPayingOnline(false);
    }
  };

  const performSearch = useCallback(async (orderParam: string, phoneParam: string) => {
    const q = orderParam.trim();
    const p = phoneParam.trim();

    if (!q && !p) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      // 1. If order query provided, search by Order ID / Number
      if (q) {
        try {
          const res = await fetch(`/api/orders/${encodeURIComponent(q)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.order) {
              setFoundOrder(data.order);
              setIsLoading(false);
              return;
            }
          }
        } catch (apiErr) {
          console.warn('API lookup by order failed, trying local store:', apiErr);
        }

        // Fallback to local store
        const localOrd = getOrderByIdOrNumber(q);
        if (localOrd) {
          setFoundOrder(localOrd);
          setIsLoading(false);
          return;
        }
      }

      // 2. If phone query provided, search by Phone Number
      if (p) {
        try {
          const res = await fetch(`/api/orders?phone=${encodeURIComponent(p)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.orders && data.orders.length > 0) {
              setFoundOrder(data.orders[0]);
              setIsLoading(false);
              return;
            }
          }
        } catch (apiErr) {
          console.warn('API lookup by phone failed, trying local store:', apiErr);
        }

        const localOrders = getOrdersByPhone(p);
        if (localOrders.length > 0) {
          setFoundOrder(localOrders[0]);
          setIsLoading(false);
          return;
        }
      }

      setFoundOrder(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-search on page load if query params are present in the URL (e.g. from QR scan)
  useEffect(() => {
    if (initialOrder || initialPhone) {
      setOrderQuery(initialOrder);
      setPhoneQuery(initialPhone);
      performSearch(initialOrder, initialPhone);
    }
  }, [initialOrder, initialPhone, performSearch]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    performSearch(orderQuery, phoneQuery);
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
      case 'PENDING':
        return 0;
      case 'CONFIRMED':
        return 1;
      case 'PROCESSING':
        return 2;
      case 'SHIPPED':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = foundOrder ? getStepIndex(foundOrder.status) : 0;
  const isTerminated =
    foundOrder?.status === 'CANCELLED' || foundOrder?.status === 'RETURNED';

  // Mask phone number for customer privacy (e.g. 01712***678)
  const formatMaskedPhone = (phone: string) => {
    if (!phone || phone.length < 7) return phone;
    return `${phone.slice(0, 5)}***${phone.slice(-3)}`;
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Title */}
      <div className="text-center space-y-1">
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B]">
          অর্ডার ট্র্যাকিং (Live Order Tracking)
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6B6B]">
          আপনার ইনভয়েসের QR কোড স্ক্যান করে অথবা অর্ডার/মোবাইল নম্বর দিয়ে লাইভ অগ্রগতি দেখুন।
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-[28px] border border-[#EFE9E0] p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#2B2B2B] block">অর্ডার নম্বর:</label>
              <input
                type="text"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="যেমন: RK-1001 বা RK-1007"
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

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            disabled={isLoading || (!orderQuery.trim() && !phoneQuery.trim())}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                ট্র্যাকিং তথ্য খোঁজা হচ্ছে...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                ট্র্যাক অর্ডার (Track Order)
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-white rounded-[28px] border border-[#EFE9E0] p-8 text-center space-y-3 shadow-sm animate-pulse">
          <div className="w-12 h-12 rounded-full bg-[#FAF7F2] flex items-center justify-center mx-auto text-[#FF6B6B]">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <p className="font-heading font-bold text-sm text-[#2B2B2B]">
            অর্ডারের সর্বশেষ স্ট্যাটাস লোড হচ্ছে...
          </p>
        </div>
      )}

      {/* Tracking Result */}
      {!isLoading && foundOrder && (
        <div className="bg-white rounded-[28px] border border-[#EFE9E0] p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EFE9E0] gap-2">
            <div>
              <span className="text-xs text-[#6B6B6B] block">অর্ডার আইডি:</span>
              <span className="font-heading font-black text-xl text-[#FF6B6B]">
                {foundOrder.orderNumber}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  foundOrder.status === 'DELIVERED'
                    ? 'bg-[#EBF8EE] text-[#2D7A3E] border border-[#C4EDCD]'
                    : foundOrder.status === 'CANCELLED' || foundOrder.status === 'RETURNED'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-[#FFF8E6] text-[#B76E00] border border-[#FFE0A3]'
                }`}
              >
                {foundOrder.status === 'PENDING'
                  ? 'অপেক্ষমান (Pending)'
                  : foundOrder.status === 'CONFIRMED'
                  ? 'কনফার্মড (Confirmed)'
                  : foundOrder.status === 'PROCESSING'
                  ? 'প্রসেসিং (Processing)'
                  : foundOrder.status === 'SHIPPED'
                  ? 'কুরিয়ারে হস্তান্তর (Shipped)'
                  : foundOrder.status === 'DELIVERED'
                  ? 'ডেলিভারি সম্পন্ন (Delivered)'
                  : foundOrder.status === 'CANCELLED'
                  ? 'বাতিল (Cancelled)'
                  : foundOrder.status === 'RETURNED'
                  ? 'রিটার্ন (Returned)'
                  : foundOrder.status}
              </span>

              {foundOrder.courier && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8F7FD] text-[#197AA5] border border-[#BFE4F7] flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" /> স্টিডফাস্ট কুরিয়ার
                </span>
              )}
            </div>
          </div>

          {/* Stepper Progress Bar (if not cancelled/returned) */}
          {!isTerminated ? (
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
          ) : (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-xs text-rose-800">
              <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div>
                <span className="font-bold block">
                  {foundOrder.status === 'CANCELLED' ? 'অর্ডারটি বাতিল করা হয়েছে' : 'পার্সেলটি রিটার্ন এসেছে'}
                </span>
                <span className="text-rose-600">
                  কোনো প্রশ্ন থাকলে অনুগ্রহ করে আমাদের হেল্পলাইনে যোগাযোগ করুন।
                </span>
              </div>
            </div>
          )}

          {/* Courier Consignment info (if shipped) */}
          {(foundOrder.consignmentId || foundOrder.trackingCode) && (
            <div className="p-4 rounded-2xl bg-[#E8F7FD] border border-[#BFE4F7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                {foundOrder.trackingCode && (
                  <span className="font-bold text-[#197AA5] block">
                    স্টিডফাস্ট ট্র্যাকিং কোড: {foundOrder.trackingCode}
                  </span>
                )}
                {foundOrder.consignmentId && (
                  <span className="text-[#197AA5]/80 block">
                    কনসাইনমেন্ট নম্বর: {foundOrder.consignmentId}
                  </span>
                )}
              </div>
              <a
                href={`https://steadfast.com.bd/t/${foundOrder.trackingCode || foundOrder.consignmentId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-[#197AA5] text-white hover:bg-[#15668a] transition-colors self-start sm:self-auto"
              >
                স্টিডফাস্টে লাইভ ট্র্যাক <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Order Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Delivery Details */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2 text-xs">
              <span className="font-heading font-bold text-[#2B2B2B] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FF6B6B]" /> ডেলিভারি ঠিকানা
              </span>
              <div className="space-y-1 text-[#6B6B6B]">
                <p className="font-bold text-[#2B2B2B]">{foundOrder.customerName}</p>
                <p className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-[#6B6B6B]" /> {formatMaskedPhone(foundOrder.customerPhone)}
                </p>
                <p>{foundOrder.fullAddress}, {foundOrder.district}</p>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2 text-xs">
              <span className="font-heading font-bold text-[#2B2B2B] flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#FF6B6B]" /> পেমেন্ট ও চালানের সারসংক্ষেপ
              </span>
              <div className="space-y-1 text-[#6B6B6B]">
                <div className="flex justify-between">
                  <span>সাবটোটাল:</span>
                  <span className="font-bold text-[#2B2B2B]">৳{foundOrder.subtotal?.toLocaleString('bn-BD') || foundOrder.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>ডেলিভারি চার্জ:</span>
                  <span className="font-bold text-[#2B2B2B]">৳{foundOrder.deliveryCharge?.toLocaleString('bn-BD') || foundOrder.deliveryCharge}</span>
                </div>
                {foundOrder.discountAmount ? (
                  <div className="flex justify-between text-green-700">
                    <span>ডিসকাউন্ট:</span>
                    <span className="font-bold">-৳{foundOrder.discountAmount?.toLocaleString('bn-BD') || foundOrder.discountAmount}</span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-[#EFE9E0] pt-1.5 font-bold text-[#2B2B2B] text-sm">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span className="text-[#FF6B6B]">৳{foundOrder.totalAmount?.toLocaleString('bn-BD') || foundOrder.totalAmount}</span>
                </div>
              </div>

              {/* Payment Status */}
              <div className="mt-3 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] flex items-center justify-between text-xs">
                <span className="text-[#6B6B6B]">পেমেন্ট অবস্থা:</span>
                {foundOrder.paymentStatus === 'PAID' ? (
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    পরিশোধিত (Paid)
                  </span>
                ) : (
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    বকেয়া (COD - ডেলিভারির সময় প্রদেয়)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Items List */}
          {foundOrder.items && foundOrder.items.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="font-heading font-bold text-xs text-[#6B6B6B] uppercase tracking-wider">
                অর্ডারের পণ্যসমূহ ({foundOrder.items.length}টি)
              </h3>
              <div className="divide-y divide-[#EFE9E0] border border-[#EFE9E0] rounded-2xl overflow-hidden">
                {foundOrder.items.map((item, idx) => {
                  const itemImg = item.imageUrl || (item as any).image;
                  return (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs bg-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] flex items-center justify-center overflow-hidden flex-shrink-0">
                          {itemImg ? (
                            <img src={itemImg} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-4 h-4 text-[#6B6B6B]" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-[#2B2B2B] block line-clamp-1">{item.title}</span>
                          <span className="text-[11px] text-[#6B6B6B]">পরিমাণ: {item.quantity} টি</span>
                        </div>
                      </div>
                      <span className="font-bold text-[#2B2B2B]">
                        ৳{(item.price * item.quantity).toLocaleString('bn-BD')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline details (Safely guarded) */}
          <div className="space-y-3 pt-2">
            <h3 className="font-heading font-bold text-sm text-[#2B2B2B]">
              অর্ডার টাইমলাইন ও হিস্ট্রি
            </h3>
            <div className="space-y-3">
              {(foundOrder.timeline || []).length > 0 ? (
                (foundOrder.timeline || []).map((entry, idx) => (
                  <div key={idx} className="flex gap-3 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B] mt-1 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-[#2B2B2B] block">{entry.note}</span>
                      <span className="text-[11px] text-[#6B6B6B]">{entry.timestamp}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#6B6B6B]">কোনো পূর্ববর্তী টাইমলাইন নোট নেই।</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Order Found */}
      {!isLoading && hasSearched && !foundOrder && (
        <div className="bg-white rounded-[28px] border border-[#EFE9E0] p-8 text-center space-y-3 shadow-sm">
          <AlertCircle className="w-10 h-10 text-[#FF6B6B] mx-auto" />
          <h3 className="font-heading font-bold text-base text-[#2B2B2B]">
            কোনো অর্ডার খুঁজে পাওয়া যায়নি
          </h3>
          <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
            দয়া করে সঠিক অর্ডার নম্বর (যেমন: RK-1001 বা RK-1007) অথবা অর্ডার দেওয়ার সময় ব্যবহৃত ফোন নম্বর দিয়ে আবার চেষ্টা করুন।
          </p>
        </div>
      )}
    </main>
  );
}

export default function OrderTrackingPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 md:pb-12 text-[#2B2B2B]">
      <Header />
      <Suspense fallback={<div className="p-12 text-center text-xs text-[#6B6B6B]">ট্র্যাকিং লোড হচ্ছে...</div>}>
        <TrackContent />
      </Suspense>
      <Footer />
      <MobileBottomNav activeTab="home" />
    </div>
  );
}
