'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { formatBDT } from '@/lib/utils';

function PaymentGatewayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderNumber = searchParams.get('orderNumber') || '';
  const paymentID = searchParams.get('paymentID') || '';
  const initialMethod = (searchParams.get('method') || 'BKASH').toUpperCase();

  const isNagad = initialMethod === 'NAGAD';
  const brandColor = isNagad ? '#F7941E' : '#E2136E';
  const brandName = isNagad ? 'Nagad' : 'bKash';

  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);

  // Payment Form Steps: 1: Phone, 2: OTP, 3: PIN, 4: Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [trxID, setTrxID] = useState<string>('');

  // Fetch Order
  useEffect(() => {
    if (!orderNumber) return;

    fetch(`/api/orders/${orderNumber}`)
      .then((res) => res.json())
      .then((data) => {
        setIsLoadingOrder(false);
        if (data.success && data.order) {
          setOrderDetails(data.order);
          setPhoneNumber(data.order.customerPhone || '');
        }
      })
      .catch(() => setIsLoadingOrder(false));
  }, [orderNumber]);

  // Execute Payment
  const executePayment = async (overrideTrxID?: string) => {
    setIsProcessing(true);
    setErrorMessage(null);

    const generatedTrxID =
      overrideTrxID ||
      `${isNagad ? 'NGD' : 'BKS'}${Math.floor(10000000 + Math.random() * 90000000)}`;

    try {
      const res = await fetch('/api/payment/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentID,
          orderNumber,
          paymentMethod: isNagad ? 'NAGAD' : 'BKASH',
          trxID: generatedTrxID,
          customerMsisdn: phoneNumber,
        }),
      });

      const data = await res.json();
      setIsProcessing(false);

      if (data.success) {
        setTrxID(generatedTrxID);
        setStep(4);
        setTimeout(() => {
          router.push(`/order/confirmation/${orderNumber}?paid=true&trxID=${generatedTrxID}`);
        }, 2500);
      } else {
        setErrorMessage(data.message || 'পেমেন্ট ব্যর্থ হয়েছে।');
      }
    } catch {
      setIsProcessing(false);
      setErrorMessage('সার্ভার যোগাযোগে সমস্যা হয়েছে।');
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.replace(/\D/g, '') || phoneNumber.length < 11) {
      setErrorMessage('সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন।');
      return;
    }
    setErrorMessage(null);
    setOtp('123456'); // Pre-fill mock OTP for smooth sandbox testing
    setStep(2);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setErrorMessage('সঠিক ভেরিফিকেশন কোড দিন।');
      return;
    }
    setErrorMessage(null);
    setStep(3);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setErrorMessage('আপনার গোপন পিন দিন।');
      return;
    }
    executePayment();
  };

  const handleInstantSuccess = () => {
    executePayment();
  };

  const totalAmount = orderDetails?.totalAmount || 0;

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
      {/* Container Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden">
        {/* Brand Header */}
        <div
          className="p-5 text-white flex items-center justify-between"
          style={{ backgroundColor: brandColor }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-xl tracking-wide">{brandName}</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Payment Gateway
              </span>
            </div>
            <p className="text-xs text-white/90 mt-0.5">Merchant: CraftyKidsCo Online Store</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-white/80 block">Invoice Amount</span>
            <span className="text-xl font-black">{formatBDT(totalAmount)}</span>
          </div>
        </div>

        {/* Invoice Info Bar */}
        <div className="bg-stone-50 px-5 py-2.5 border-b border-stone-200 flex items-center justify-between text-xs text-stone-600">
          <span>
            Order: <strong className="text-stone-900 font-mono">{orderNumber}</strong>
          </span>
          <span className="flex items-center gap-1 text-emerald-700 font-bold">
            <Lock className="w-3 h-3" /> 256-bit Secure
          </span>
        </div>

        {/* Gateway Body */}
        <div className="p-6 space-y-5">
          {isLoadingOrder ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#D6403B]" />
              <span className="text-xs">অর্ডারের তথ্য প্রস্তুত হচ্ছে...</span>
            </div>
          ) : step === 1 ? (
            /* STEP 1: Phone Number */
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="font-bold text-base text-stone-900">
                  আপনার {brandName} অ্যাকাউন্ট নাম্বার দিন
                </h3>
                <p className="text-xs text-stone-500">
                  পেমেন্ট সম্পন্ন করতে আপনার ১১ ডিজিটের একাউন্ট নাম্বার লিখুন
                </p>
              </div>

              <div>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full text-center text-lg font-mono tracking-wider p-3 rounded-xl border-2 border-stone-200 focus:border-[#E2136E] focus:outline-none"
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/order/confirmation/${orderNumber}`)}
                  className="flex-1 py-3 rounded-xl border border-stone-300 text-stone-600 font-bold text-xs hover:bg-stone-50 cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl text-white font-bold text-xs cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: brandColor }}
                >
                  <span>পরবর্তী ধাপ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : step === 2 ? (
            /* STEP 2: OTP Verification */
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="font-bold text-base text-stone-900">ভেরিফিকেশন কোড (OTP) দিন</h3>
                <p className="text-xs text-stone-500">
                  <strong className="font-mono text-stone-800">{phoneNumber}</strong> নাম্বারে পাঠানো ৬ ডিজিটের কোডটি লিখুন
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="1 2 3 4 5 6"
                  className="w-full text-center text-xl font-mono tracking-widest p-3 rounded-xl border-2 border-stone-200 focus:border-[#E2136E] focus:outline-none"
                />
                <span className="text-[11px] text-stone-400 block text-center mt-1">
                  (টেস্টিং সুবিধার জন্য কোড স্বয়ংক্রিয়ভাবে বসানো হয়েছে)
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border border-stone-300 text-stone-600 font-bold text-xs hover:bg-stone-50 cursor-pointer flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>পূর্ববর্তী</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl text-white font-bold text-xs cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: brandColor }}
                >
                  <span>যাচাই করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : step === 3 ? (
            /* STEP 3: PIN Confirmation */
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="font-bold text-base text-stone-900">আপনার {brandName} পিন দিন</h3>
                <p className="text-xs text-stone-500">
                  পেমেন্ট চূড়ান্ত অনুমোদন করতে আপনার ৫ ডিজিটের পিন নাম্বার দিন
                </p>
              </div>

              <div>
                <input
                  type="password"
                  maxLength={5}
                  required
                  autoFocus
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="• • • • •"
                  className="w-full text-center text-2xl font-mono tracking-widest p-3 rounded-xl border-2 border-stone-200 focus:border-[#E2136E] focus:outline-none"
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl border border-stone-300 text-stone-600 font-bold text-xs hover:bg-stone-50 cursor-pointer flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>পূর্ববর্তী</span>
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-xs cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: brandColor }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>প্রসেসিং হচ্ছে...</span>
                    </>
                  ) : (
                    <span>পেমেন্ট নিশ্চিত করুন</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* STEP 4: Success & Auto Redirect */
            <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-stone-900">পেমেন্ট সফল হয়েছে!</h3>
                <p className="text-xs text-stone-500">
                  আপনার TrxID: <strong className="font-mono text-stone-900">{trxID}</strong>
                </p>
                <p className="text-xs text-emerald-700 font-medium pt-1">
                  স্বয়ংক্রিয়ভাবে অর্ডার কনফার্মেশন পেজে নিয়ে যাওয়া হচ্ছে...
                </p>
              </div>
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#D6403B]" />
            </div>
          )}

          {/* Instant Sandbox Bypass for Developers & Testing */}
          {step < 4 && (
            <div className="pt-4 border-t border-dashed border-stone-200 text-center">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleInstantSuccess}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>১-ক্লিকে সফল পেমেন্ট টেস্ট করুন (Instant Simulation)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 text-center text-[11px] text-stone-400">
          CraftyKidsCo Automated Payment System • Secured by SSL &amp; PCI-DSS
        </div>
      </div>
    </div>
  );
}

export default function PaymentGatewayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#D6403B]" />
        </div>
      }
    >
      <PaymentGatewayContent />
    </Suspense>
  );
}

