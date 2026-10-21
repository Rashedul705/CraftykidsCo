'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { formatBDT, normalizeBDPhone } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { createOrder } from '@/lib/store';

import { calculateDelivery, defaultDeliverySettings, DeliverySettings } from '@/lib/delivery-store';

const BANGLADESH_DISTRICTS = [
  'Dhaka (ঢাকা)',
  'Gazipur (গাজীপুর)',
  'Narayanganj (নারায়ণগঞ্জ)',
  'Chittagong (চট্টগ্রাম)',
  'Sylhet (সিলেট)',
  'Rajshahi (রাজশাহী)',
  'Khulna (খুলনা)',
  'Barisal (বরিশাল)',
  'Rangpur (রংপুর)',
  'Mymensingh (ময়মনসিংহ)',
  'Cumilla (কুমিল্লা)',
  'Bogra (বগুড়া)',
  'Cox\'s Bazar (কক্সবাজার)',
  'Jessore (যশোর)',
  'Kushtia (কুষ্টিয়া)',
  'Tangail (টাঙ্গাইল)',
  'Other District (অন্যান্য জেলা)',
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, discountAmount, couponCode, clearCart } = useCart();

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [district, setDistrict] = useState(''); // Empty by default: user must choose their city!
  const [fullAddress, setFullAddress] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BKASH' | 'NAGAD'>('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live delivery settings loaded from admin panel
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(defaultDeliverySettings);

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

  // Automatic delivery charge calculation based on selected district and subtotal
  const deliveryCalc = useMemo(() => {
    return calculateDelivery(district, subtotal, deliverySettings);
  }, [district, subtotal, deliverySettings]);

  const isInsideDhaka = district.includes('Dhaka') || district.includes('ঢাকা');
  const isFreeDelivery = deliveryCalc.isFree;
  const isDeliveryCalculated = deliveryCalc.isCalculated;
  const deliveryCharge = deliveryCalc.charge;
  const grandTotal = Math.max(0, subtotal - discountAmount + (isDeliveryCalculated ? deliveryCharge : 0));

  // Auto-save checkout details as an incomplete order as soon as a valid phone number is entered (Part A4 / B8 Spec)
  const recordIncompleteCheckout = async (phoneToSave: string) => {
    const cleanPhone = phoneToSave.replace(/[^\d]/g, '');
    if (cleanPhone.length >= 11) {
      try {
        await fetch('/api/incomplete-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            customerName: customerName.trim() || undefined,
            district: district.split(' ')[0],
            address: fullAddress.trim() || undefined,
            subtotal,
            deliveryCharge,
            totalAmount: grandTotal,
            items: items.map((i) => ({
              title: i.titleBn || i.title,
              variationTitle: i.variationTitleBn || i.variationTitle,
              price: i.price,
              quantity: i.quantity,
              imageUrl: i.imageUrl,
            })),
          }),
        });
      } catch {
        // silent auto-save
      }
    }
  };

  const handlePhoneBlur = () => {
    if (customerPhone.length >= 11) {
      recordIncompleteCheckout(customerPhone);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!customerName.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার নাম লিখুন।');
      return;
    }

    const normalizedPhone = normalizeBDPhone(customerPhone);
    if (!normalizedPhone) {
      setErrorMessage('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।');
      return;
    }

    if (!fullAddress.trim() || fullAddress.length < 8) {
      setErrorMessage('অনুগ্রহ করে সম্পূর্ণ ঠিকানা (বাসা/রোড/এলাকা) বিস্তারিত লিখুন।');
      return;
    }

    if (!district || district.trim() === '') {
      setErrorMessage('অনুগ্রহ করে ডেলিভারি চার্জ হিসাব করার জন্য আপনার জেলা নির্বাচন করুন।');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('আপনার কার্ট খালি আছে। আগে পণ্য কার্টে যোগ করুন।');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: normalizedPhone,
        district: isInsideDhaka ? 'Dhaka' : district.split(' ')[0],
        fullAddress: fullAddress.trim(),
        customerNote: customerNote.trim() || undefined,
        paymentMethod,
        couponCode: couponCode || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          title: i.titleBn || i.title,
          variationSku: i.variationSku,
          variationTitle: i.variationTitleBn || i.variationTitle,
          price: Math.round(i.price),
          quantity: i.quantity,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (res.ok && resData.success && resData.order) {
        clearCart();
        router.push(`/order/confirmation/${resData.order.orderNumber}`);
        return;
      }

      if (!res.ok) {
        setErrorMessage(resData.message || 'অর্ডার সম্পন্ন করতে সমস্যা হয়েছে।');
        setIsSubmitting(false);
        return;
      }

      // Fallback
      const newOrder = createOrder({
        customerName: customerName.trim(),
        customerPhone: normalizedPhone,
        district: isInsideDhaka ? 'Dhaka' : district.split(' ')[0],
        fullAddress: fullAddress.trim(),
        customerNote: customerNote.trim() || undefined,
        subtotal,
        deliveryCharge,
        discountAmount,
        totalAmount: grandTotal,
        couponCode: couponCode || undefined,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        paymentMethod,
        items: items.map((i) => ({
          id: i.id,
          productId: i.productId,
          title: i.titleBn,
          variationTitle: i.variationTitleBn,
          price: i.price,
          quantity: i.quantity,
          total: i.price * i.quantity,
        })),
      });

      clearCart();
      router.push(`/order/confirmation/${newOrder.orderNumber}`);
    } catch (err: unknown) {
      // Fallback on network error
      try {
        const newOrder = createOrder({
          customerName: customerName.trim(),
          customerPhone: normalizedPhone,
          district: isInsideDhaka ? 'Dhaka' : district.split(' ')[0],
          fullAddress: fullAddress.trim(),
          customerNote: customerNote.trim() || undefined,
          subtotal,
          deliveryCharge,
          discountAmount,
          totalAmount: grandTotal,
          couponCode: couponCode || undefined,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          paymentMethod,
          items: items.map((i) => ({
            id: i.id,
            productId: i.productId,
            title: i.titleBn,
            variationTitle: i.variationTitleBn,
            price: i.price,
            quantity: i.quantity,
            total: i.price * i.quantity,
          })),
        });
        clearCart();
        router.push(`/order/confirmation/${newOrder.orderNumber}`);
      } catch {
        setErrorMessage('অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16 text-[#2B2B2B]">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Breadcrumb & Title */}
        <div>
          <div className="text-xs text-[#6B6B6B] flex items-center gap-1.5 mb-1">
            <Link href="/cart" className="hover:text-[#FF6B6B]">কার্ট</Link>
            <span>/</span>
            <span className="font-bold text-[#2B2B2B]">সহজ চেকআউট</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B]">
            সহজ এক-পৃষ্ঠার চেকআউট (লগইন ছাড়াই সরাসরি অর্ডার)
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1">
            নিচের ফর্মটি পূরণ করে অর্ডার নিশ্চিত করুন। পণ্য হাতে পেয়ে চেক করে টাকা দিন।
          </p>
        </div>

        {errorMessage && (
          <div className="bg-[#FFF0F0] border border-[#FFD6D6] rounded-2xl p-4 text-xs font-bold text-[#FF6B6B] flex items-center gap-2 shadow-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Form: Delivery details & Payment method */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery address section */}
            <div className="bg-white rounded-[28px] border border-[#EFE9E0] p-6 shadow-sm space-y-4">
              <h2 className="font-heading font-bold text-lg text-[#2B2B2B] flex items-center gap-2 pb-3 border-b border-[#EFE9E0]">
                <Truck className="w-5 h-5 text-[#FF6B6B]" />
                ১. ডেলিভারির তথ্য দিন
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#2B2B2B] block">
                    আপনার সম্পূর্ণ নাম <span className="text-[#FF6B6B]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="উদা: ফারহানা রহমান"
                    className="w-full px-4 py-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] text-sm focus:outline-none focus:border-[#FF6B6B]"
                  />
                </div>

                {/* Customer Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#2B2B2B] block">
                    মোবাইল নম্বর <span className="text-[#FF6B6B]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    onBlur={handlePhoneBlur}
                    placeholder="017XXXXXXXX (১১ ডিজিট)"
                    className="w-full px-4 py-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] text-sm focus:outline-none focus:border-[#FF6B6B]"
                  />
                </div>
              </div>

              {/* District */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2B2B2B] block">
                  জেলা নির্বাচন করুন <span className="text-[#FF6B6B]">*</span>
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] text-sm focus:outline-none focus:border-[#FF6B6B] font-medium cursor-pointer"
                >
                  <option value="">-- জেলা নির্বাচন করুন (Select District) --</option>
                  {BANGLADESH_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-[#6B6B6B] block">
                  {!district ? (
                    'ডেলিভারি চার্জ জানার জন্য অনুগ্রহ করে আপনার জেলা নির্বাচন করুন'
                  ) : deliveryCalc.isFree ? (
                    <span className="text-[#1F6B43] font-bold">অভিনন্দন! আপনার অর্ডারে ফ্রি ডেলিভারি প্রযোজ্য।</span>
                  ) : (
                    `ডেলিভারি চার্জ: ৳${deliveryCharge} (${deliveryCalc.descriptionBn})`
                  )}
                </span>
              </div>

              {/* Full Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2B2B2B] block">
                  সম্পূর্ণ ডেলিভারি ঠিকানা <span className="text-[#FF6B6B]">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="বাসা নম্বর, রোড নম্বর, এলাকা বা থানার নাম বিস্তারিত লিখুন..."
                  className="w-full px-4 py-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] text-sm focus:outline-none focus:border-[#FF6B6B]"
                />
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6B6B6B] block">
                  বিশেষ নির্দেশনা বা নোট (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="যেমন: বিকেলে ডেলিভারি দিন..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] text-xs focus:outline-none focus:border-[#FF6B6B]"
                />
              </div>
            </div>

            {/* Payment method section */}
            <div className="bg-white rounded-[28px] border border-[#EFE9E0] p-6 shadow-sm space-y-4">
              <h2 className="font-heading font-bold text-lg text-[#2B2B2B] flex items-center gap-2 pb-3 border-b border-[#EFE9E0]">
                <CreditCard className="w-5 h-5 text-[#FFC93C]" />
                ২. মূল্য পরিশোধের পদ্ধতি নির্বাচন করুন
              </h2>

              <div className="space-y-3">
                {/* Cash on delivery (active & recommended) */}
                <label
                  className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-2 border-[#FF6B6B] bg-[#FFF5F5] shadow-sm'
                      : 'border-[#EFE9E0] bg-[#FAF7F2] hover:border-[#FF6B6B]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="accent-[#FF6B6B] w-4 h-4"
                    />
                    <div>
                      <span className="font-heading font-bold text-sm text-[#2B2B2B] block">
                        ক্যাশ অন ডেলিভারি (Cash on Delivery)
                      </span>
                      <span className="text-xs text-[#6B6B6B]">
                        পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ নিশ্চিন্তে টাকা দিন।
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#EBF8EE] text-[#2D7A3E]">
                    জনপ্রিয়
                  </span>
                </label>

                {/* bKash (Mock / Real) */}
                <label
                  className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'BKASH'
                      ? 'border-2 border-[#FF6B6B] bg-[#FFF5F5] shadow-sm'
                      : 'border-[#EFE9E0] bg-[#FAF7F2] hover:border-[#FF6B6B]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'BKASH'}
                      onChange={() => setPaymentMethod('BKASH')}
                      className="accent-[#FF6B6B] w-4 h-4"
                    />
                    <div>
                      <span className="font-heading font-bold text-sm text-[#2B2B2B] block">
                        বিকাশ অনলাইন পেমেন্ট (bKash Payment)
                      </span>
                      <span className="text-xs text-[#6B6B6B]">
                        সরাসরি বিকাশ গেটওয়ে দিয়ে নিরাপদ পেমেন্ট।
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#E2136E]">bKash</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Summary & Submit Order */}
          <div className="space-y-4 sticky top-24">
            <div className="bg-white rounded-[28px] border border-[#EFE9E0] p-6 shadow-sm space-y-4">
              <h3 className="font-heading font-bold text-base text-[#2B2B2B] pb-3 border-b border-[#EFE9E0]">
                অর্ডারের আইটেমসমূহ ({items.length})
              </h3>

              {/* Order items miniature list */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {items.map((i) => (
                  <div key={i.id} className="flex justify-between items-center text-xs">
                    <div className="pr-2">
                      <span className="font-bold text-[#2B2B2B] block truncate max-w-[170px]">
                        {i.titleBn}
                      </span>
                      <span className="text-[#6B6B6B]">
                        {i.variationTitleBn || 'ডিফল্ট'} × {i.quantity}
                      </span>
                    </div>
                    <span className="font-black text-[#2B2B2B]">
                      ৳{i.price * i.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculation */}
              <div className="pt-3 border-t border-[#EFE9E0] space-y-2 text-xs text-[#6B6B6B]">
                <div className="flex justify-between">
                  <span>সাবটোটাল:</span>
                  <span className="font-bold text-[#2B2B2B]">৳{subtotal}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>ডেলিভারি চার্জ:</span>
                  <div>
                    {!isDeliveryCalculated ? (
                      <span className="text-[11px] font-bold text-[#D6403B] bg-[#FDE3E1] px-2.5 py-0.5 rounded-full">
                        জেলা নির্বাচন করুন
                      </span>
                    ) : isFreeDelivery ? (
                      <span className="font-bold text-[#1F6B43]">ফ্রি (৳০)</span>
                    ) : (
                      <span className="font-bold text-[#2B2B2B]">৳{deliveryCharge}</span>
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
                    {!isDeliveryCalculated && (
                      <span className="text-[10px] text-[#6B6B6B] font-normal block">
                        (ডেলিভারি চার্জ জেলা নির্বাচনের পর যুক্ত হবে)
                      </span>
                    )}
                  </div>
                  <span className="text-3xl text-[#FF6B6B]">৳{grandTotal}</span>
                </div>
              </div>

              {/* Place Order CTA Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isSubmitting || items.length === 0}
              >
                {isSubmitting ? (
                  'Processing Order...'
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    Order Now
                  </>
                )}
              </Button>

              <div className="space-y-1.5 pt-2 text-[11px] text-[#6B6B6B] text-center">
                <div className="flex items-center justify-center gap-1.5 text-[#2D7A3E] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>কোনো অগ্রিম টাকা দিতে হবে না</span>
                </div>
                <p>পণ্য পেয়ে ডেলিভারি ম্যানের কাছে চেক করে টাকা পরিশোধ করবেন।</p>
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* Centralized Footer */}
      <Footer />
    </div>
  );
}
