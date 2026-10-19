'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CheckCircle,
  Truck,
  PackageCheck,
  ArrowRight,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { getOrderByIdOrNumber, getAllOrders } from '@/lib/store';

function ConfirmationContent() {
  const params = useParams();
  const id = (params?.id as string) || 'RK-1001';

  const [order, setOrder] = React.useState<any>(() => getOrderByIdOrNumber(id) || getAllOrders()[0]);

  React.useEffect(() => {
    if (id) {
      fetch(`/api/orders/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.order) {
            setOrder(data.order);
          }
        })
        .catch(() => {});
    }
  }, [id]);

  if (!order) {
    return <div className="p-12 text-center text-xs">অর্ডার লোড হচ্ছে...</div>;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Success Hero Card */}
      <div className="bg-white rounded-[32px] border border-[#EFE9E0] p-6 sm:p-10 text-center shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#EBF8EE] border border-[#C4EDCD] text-[#2D7A3E] flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7BD389]">
            অর্ডার সফলভাবে সম্পন্ন হয়েছে!
          </span>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B]">
            ধন্যবাদ, {order.customerName}!
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B]">
            আপনার অর্ডার নম্বর: <strong className="text-[#FF6B6B] font-mono text-base">{order.orderNumber}</strong>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] max-w-md mx-auto text-xs text-[#2B2B2B] flex items-center justify-between">
          <div className="text-left">
            <span className="text-[#6B6B6B] block">পেমেন্ট মেথড:</span>
            <strong className="text-sm">ক্যাশ অন ডেলিভারি (COD)</strong>
          </div>
          <div className="text-right">
            <span className="text-[#6B6B6B] block">সর্বমোট প্রদেয়:</span>
            <strong className="text-lg text-[#FF6B6B]">৳{order.totalAmount}</strong>
          </div>
        </div>
      </div>

      {/* Order Details & Delivery info card */}
      <div className="bg-white rounded-[28px] border border-[#EFE9E0] p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
          <h2 className="font-heading font-bold text-base text-[#2B2B2B] flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-[#5BC0EB]" />
            অর্ডারের বিবরণ ও ঠিকানা
          </h2>
          <Link
            href={`/track?order=${order.orderNumber}&phone=${order.customerPhone}`}
            className="text-xs font-bold text-[#FF6B6B] hover:underline flex items-center gap-1"
          >
            লাইভ ট্র্যাক করুন <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2 p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0]">
            <span className="font-bold text-[#6B6B6B] block">ডেলিভারি ঠিকানা:</span>
            <p className="font-semibold text-[#2B2B2B]">{order.fullAddress}</p>
            <p className="text-[#6B6B6B]">জেলা: {order.district}</p>
            <p className="text-[#6B6B6B]">মোবাইল: {order.customerPhone}</p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0]">
            <span className="font-bold text-[#6B6B6B] block">ডেলিভারি তথ্য:</span>
            <p className="font-semibold text-[#2B2B2B]">স্টিডফাস্ট কুরিয়ার সার্ভিস</p>
            <p className="text-[#6B6B6B]">
              আনুমানিক সময়: {order.district.toLowerCase().includes('dhaka') ? '২৪-৪৮ ঘণ্টা' : '২-৩ দিন'}
            </p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF9E6] text-[#A67800]">
              স্ট্যাটাস: {order.status}
            </span>
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-3 pt-2">
          <h3 className="font-heading font-bold text-sm text-[#2B2B2B]">অর্ডারের আইটেম</h3>
          <div className="divide-y divide-[#EFE9E0] border border-[#EFE9E0] rounded-2xl overflow-hidden">
            {order.items.map((item: any) => (
              <div key={item.id} className="p-3 bg-white flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-[#2B2B2B] block">{item.title}</span>
                  {item.variationTitle && (
                    <span className="text-[#6B6B6B]">{item.variationTitle}</span>
                  )}
                  <span className="text-[#6B6B6B]"> × {item.quantity}</span>
                </div>
                <span className="font-black text-[#2B2B2B]">৳{item.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#EFE9E0]">
          <Link
            href={`/track?order=${order.orderNumber}&phone=${order.customerPhone}`}
            className="flex-1"
          >
            <Button variant="primary" size="md" fullWidth>
              <Truck className="w-4 h-4" />
              অর্ডার ট্র্যাক করুন
            </Button>
          </Link>

          <Link href="/" className="flex-1">
            <Button variant="outline" size="md" fullWidth>
              হোমে ফিরে যান
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2B2B2B] flex flex-col justify-between">
      <div>
        <Header />
        <Suspense fallback={<div className="p-12 text-center text-xs">লোড হচ্ছে...</div>}>
          <ConfirmationContent />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
