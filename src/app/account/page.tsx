'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Phone,
  ShieldCheck,
  Package,
  Heart,
  MapPin,
  CheckCircle2,
  ArrowRight,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Button } from '@/components/ui/Button';
import { getAllOrders } from '@/lib/store';
import { normalizeBDPhone } from '@/lib/utils';

export default function CustomerAccountPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [phoneInput, setPhoneInput] = useState('01711223344');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [mockSentOtp, setMockSentOtp] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [orders, setOrders] = useState<any[]>(() => getAllOrders());

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const normalized = normalizeBDPhone(phoneInput);
    if (!normalized) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।');
      return;
    }

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', phone: normalized }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMockSentOtp(data.mockCode || '5824');
        setOtpSent(true);
      } else {
        setErrorMsg(data.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে।');
      }
    } catch {
      // Fallback
      setMockSentOtp('5824');
      setOtpSent(true);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const normalized = normalizeBDPhone(phoneInput);

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          phone: normalized || phoneInput,
          code: otpCode.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsLoggedIn(true);
        // Fetch orders for this phone
        try {
          const ordRes = await fetch(`/api/orders?phone=${normalized}`);
          const ordData = await ordRes.json();
          if (ordData.success && ordData.orders) {
            setOrders(ordData.orders);
          }
        } catch {}
      } else {
        setErrorMsg(data.message || 'ভুল ওটিপি কোড।');
      }
    } catch {
      if (otpCode.trim() === mockSentOtp || otpCode.trim() === '5824') {
        setIsLoggedIn(true);
      } else {
        setErrorMsg('ভুল ওটিপি কোড।');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 md:pb-12 text-[#2B2B2B]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {!isLoggedIn ? (
          /* OTP Login Card */
          <div className="bg-white rounded-[32px] border border-[#EFE9E0] p-6 sm:p-10 max-w-md mx-auto shadow-sm space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF3E6] border border-[#FFE4CC] text-[#FF6B6B] flex items-center justify-center mx-auto shadow-sm">
              <User className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h1 className="font-heading font-black text-2xl text-[#2B2B2B]">
                গ্রাহক লগইন ও রেজিস্ট্রেশন
              </h1>
              <p className="text-xs text-[#6B6B6B]">
                কোনো পাসওয়ার্ড ছাড়াই শুধু মোবাইল নম্বর ও ওটিপি দিয়ে সরাসরি লগইন করুন।
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-[#FFF0F0] text-xs font-bold text-[#FF6B6B]">
                {errorMsg}
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="text-left space-y-1.5">
                  <label className="text-xs font-bold text-[#2B2B2B] block">মোবাইল নম্বর:</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6B6B6B]" />
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] text-sm focus:outline-none focus:border-[#FF6B6B]"
                    />
                  </div>
                </div>

                <Button type="submit" variant="primary" size="md" fullWidth>
                  ওটিপি (OTP) কোড পাঠান
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 rounded-2xl bg-[#EBF8EE] border border-[#C4EDCD] text-xs text-[#2D7A3E] space-y-1">
                  <span className="font-bold flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    SMS পাঠানো হয়েছে: {phoneInput}
                  </span>
                  <p className="font-mono font-bold text-sm text-[#2D7A3E]">
                    টেস্টিং ওটিপি কোড: {mockSentOtp}
                  </p>
                </div>

                <div className="text-left space-y-1.5">
                  <label className="text-xs font-bold text-[#2B2B2B] block">৪-ডিজিটের ওটিপি লিখুন:</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="5824"
                    className="w-full text-center tracking-widest text-xl font-bold py-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] focus:outline-none focus:border-[#FF6B6B]"
                  />
                </div>

                <Button type="submit" variant="primary" size="md" fullWidth>
                  যাচাই করে লগইন করুন
                </Button>

                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-xs text-[#6B6B6B] hover:text-[#FF6B6B] font-bold"
                >
                  নম্বর পরিবর্তন করুন
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Logged In Customer Profile */
          <div className="space-y-6">
            {/* Profile banner */}
            <div className="bg-white rounded-[28px] border border-[#EFE9E0] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FF6B6B] text-white flex items-center justify-center font-bold text-xl shadow-md">
                  তা
                </div>
                <div>
                  <h1 className="font-heading font-black text-xl text-[#2B2B2B]">তানজিলা হক</h1>
                  <span className="text-xs text-[#6B6B6B]">{phoneInput} • ঢাকা, বাংলাদেশ</span>
                </div>
              </div>

              <button
                onClick={() => setIsLoggedIn(false)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#EFE9E0] bg-[#FAF7F2] text-xs font-bold text-[#6B6B6B] hover:text-[#FF6B6B]"
              >
                <LogOut className="w-3.5 h-3.5" /> লগআউট
              </button>
            </div>

            {/* My Orders Section */}
            <div className="bg-white rounded-[28px] border border-[#EFE9E0] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
                <h2 className="font-heading font-bold text-base text-[#2B2B2B] flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#5BC0EB]" />
                  আমার অর্ডারসমূহ ({orders.length})
                </h2>
              </div>

              <div className="space-y-3">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-black text-[#2B2B2B]">
                          {ord.orderNumber}
                        </strong>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF8EE] text-[#2D7A3E]">
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-[#6B6B6B] mt-1">
                        {ord.items.map((i: any) => i.title).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-black text-sm text-[#FF6B6B]">
                          ৳{ord.totalAmount}
                        </span>
                        <span className="block text-[10px] text-[#6B6B6B]">{ord.paymentMethod}</span>
                      </div>

                      <Link href={`/track?order=${ord.orderNumber}`}>
                        <Button size="sm" variant="outline">
                          ট্র্যাক
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Centralized Footer */}
      <Footer />

      <MobileBottomNav activeTab="account" />
    </div>
  );
}
