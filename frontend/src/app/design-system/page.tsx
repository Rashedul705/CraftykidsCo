'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Palette,
  ShieldCheck,
  Type,
  Truck,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Layers,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/storefront/ProductCard';
import { FreeDeliveryBar } from '@/components/storefront/FreeDeliveryBar';
import { StarDoodle, CloudDoodle, CrayonStrokeDivider } from '@/components/decorations/CrayonDoodles';
import { formatBDT } from '@/lib/utils';
import { MockCourierProvider } from '@/core/courier';
import { getPaymentProvider } from '@/core/payment';

export default function DesignSystemPage() {
  const [locale, setLocale] = useState<'bn' | 'en'>('bn');
  const [cartSubtotal, setCartSubtotal] = useState(720);
  const [courierStatus, setCourierStatus] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const colors = [
    { name: 'Coral Primary', hex: '#FF6B6B', role: 'Main CTA & accents', textDark: false },
    { name: 'Sunny Yellow', hex: '#FFC93C', role: 'Secondary buttons, stars', textDark: true },
    { name: 'Sky Blue', hex: '#5BC0EB', role: 'Age badges, shipping icon', textDark: true },
    { name: 'Soft Green', hex: '#7BD389', role: 'Non-toxic badges & success', textDark: true },
    { name: 'Warm Off-White', hex: '#FAF7F2', role: 'Page background & alternate cards', textDark: true },
    { name: 'Soft Border', hex: '#EFE9E0', role: 'Card & divider borders', textDark: true },
    { name: 'Dark Warm Gray', hex: '#2B2B2B', role: 'Primary readable body text', textDark: false },
    { name: 'Muted Gray', hex: '#6B6B6B', role: 'Secondary metadata & subtitles', textDark: false },
  ];

  const testMockCourier = async () => {
    const courier = new MockCourierProvider();
    const res = await courier.createConsignment({
      orderId: 'ORD-101',
      orderNumber: 'RK-5001',
      customerName: 'Ayesha Rahman',
      customerPhone: '01712345678',
      customerAddress: 'House 14, Road 5, Dhanmondi, Dhaka',
      district: 'Dhaka',
      codAmount: 890,
    });
    setCourierStatus(`Steadfast Consignment: ${res.consignmentId} | Tracking: ${res.trackingCode} | Charge: ৳${res.courierCharge}`);
  };

  const testMockPayment = async () => {
    const bkash = getPaymentProvider('BKASH');
    const res = await bkash.initiatePayment({
      orderId: 'ORD-101',
      orderNumber: 'RK-5001',
      amount: 890,
      customerName: 'Ayesha Rahman',
      customerPhone: '01712345678',
    });
    setPaymentStatus(`Payment Trx: ${res.transactionId} (${res.message})`);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <header className="max-w-5xl mx-auto flex items-center justify-between pb-6 border-b border-[#EFE9E0]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B6B] flex items-center justify-center text-white font-bold text-xl shadow-md">
            র
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-[#2B2B2B]">
              CraftyKidsCo Design System
            </h1>
            <p className="text-xs text-[#6B6B6B]">
              Phase 0 Deliverable • Playful, Trustworthy & Mobile-First
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocale(locale === 'bn' ? 'en' : 'bn')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#EFE9E0] bg-white text-xs font-bold text-[#2B2B2B] hover:border-[#FF6B6B] transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-[#5BC0EB]" />
            {locale === 'bn' ? 'English' : 'বাংলা'}
          </button>
          <Link
            href="/"
            className="text-xs font-bold text-[#FF6B6B] hover:underline flex items-center gap-1"
          >
            Storefront Preview <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-8 space-y-12">
        {/* SECTION 1: Brand Colors */}
        <section className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#EFE9E0] shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-[#FF6B6B]">
            <Palette className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider uppercase">Color Tokens</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-[#2B2B2B]">
            Harmonious Playful Color Palette
          </h2>
          <p className="text-sm text-[#6B6B6B] mt-1 mb-6">
            Light and airy base tones with curated child-safe accents. Avoids harsh primaries so product photos shine.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {colors.map((c) => (
              <div
                key={c.name}
                className="rounded-2xl p-4 border border-[#EFE9E0] flex flex-col justify-between h-28 shadow-sm transition-transform hover:-translate-y-1"
                style={{ backgroundColor: c.hex }}
              >
                <div className={`font-bold text-sm ${c.textDark ? 'text-[#2B2B2B]' : 'text-white'}`}>
                  {c.name}
                </div>
                <div className="flex items-baseline justify-between">
                  <span className={`text-xs font-mono font-bold ${c.textDark ? 'text-[#2B2B2B]/75' : 'text-white/80'}`}>
                    {c.hex}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: Typography & Bilingual Showcase */}
        <section className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#EFE9E0] shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-[#5BC0EB]">
            <Type className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider uppercase">Typography</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-[#2B2B2B]">
            Friendly Headings & High-Legibility Body
          </h2>
          <p className="text-sm text-[#6B6B6B] mt-1 mb-6">
            Headings: Fredoka / Baloo 2. Body: Nunito (English) + Hind Siliguri (Bangla). Mobile minimum 16px.
          </p>

          <div className="space-y-4 bg-[#FAF7F2] p-5 rounded-2xl border border-[#EFE9E0]">
            <div>
              <span className="text-xs font-semibold text-[#6B6B6B]">H1 Display Heading (Bangla / English)</span>
              <p className="font-heading text-2xl sm:text-3xl font-bold text-[#2B2B2B]">
                {locale === 'bn'
                  ? 'বাচ্চাদের সৃজনশীল কল্পনায় যোগ করুন নিরাপদ মোমের রঙ!'
                  : 'Spark Imagination with 100% Child-Safe Natural Wax Crayons!'}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-[#6B6B6B]">Body Paragraph (Bangla / English)</span>
              <p className="text-base text-[#2B2B2B] leading-relaxed">
                {locale === 'bn'
                  ? 'আমাদের সকল মোমের রঙ শতভাগ প্রাকৃতিক মৌচাকের মোম ও ফুড-গ্রেড পিগমেন্ট দিয়ে তৈরি। শিশুর কোমল ত্বকে নিরাপদ এবং দেয়াল বা কাপড় থেকে সহজে পানি দিয়ে পরিষ্কারযোগ্য।'
                  : 'All our wax crayons are handmade from pure beeswax and skin-safe food-grade pigments. Gentle on tender hands, break-resistant, and easily washable with water.'}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-[#6B6B6B]">Currency Formatting (Integer BDT)</span>
              <div className="flex gap-4 items-center mt-1">
                <span className="text-2xl font-black text-[#FF6B6B]">
                  {formatBDT(350, { locale })}
                </span>
                <span className="text-base line-through text-[#6B6B6B]">
                  {formatBDT(420, { locale })}
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EBF8EE] text-[#2D7A3E]">
                  {locale === 'bn' ? 'সাশ্রয় ৳৭০' : 'Save ৳70'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Buttons, Badges & Decorative SVGs */}
        <section className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#EFE9E0] shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-[#7BD389]">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider uppercase">Interactive Primitives</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-[#2B2B2B]">
            Buttons, Safety Badges & Doodles
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Buttons */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg text-[#2B2B2B]">Button Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">
                  <ShoppingBag className="w-4 h-4" />
                  Primary Coral CTA
                </Button>
                <Button variant="secondary">
                  <Sparkles className="w-4 h-4" />
                  Sunny Yellow
                </Button>
                <Button variant="outline">Outline Button</Button>
              </div>
            </div>

            {/* Badges */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg text-[#2B2B2B]">Safety & Age Badges</h3>
              <div className="flex flex-wrap gap-2">
                <Badge label="১০০% বিষাক্ত নয় (Non-toxic)" type="safe" />
                <Badge label="খাদ্য মানের মোম" type="safe" />
                <Badge label="২+ বছর (Ages 2+)" type="age" />
                <Badge label="৩+ বছর (Ages 3+)" type="age" />
                <Badge label="কম্বো অফার" type="deal" />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#EFE9E0]">
            <h3 className="font-heading font-semibold text-sm text-[#6B6B6B] mb-2">Hand-Drawn Playful Doodles</h3>
            <div className="flex items-center gap-6">
              <StarDoodle className="w-8 h-8 text-[#FFC93C]" />
              <CloudDoodle className="w-12 h-8 text-[#5BC0EB]" />
              <div className="flex-1">
                <CrayonStrokeDivider color="#FF6B6B" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Live Storefront Components Preview */}
        <section className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#EFE9E0] shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-[#FFC93C]">
            <Layers className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider uppercase">Catalog Components</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-[#2B2B2B]">
            Product Card & Free Delivery Progress Bar
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="md:col-span-1">
              <ProductCard
                id="mock-1"
                slug="rongdhonu-crayons-24"
                title="CraftyKidsCo ন্যাচারাল মোমের রঙ (Mom er Color) - ২৪ শেড"
                price={350}
                salePrice={299}
                imageUrl="https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80"
                ageBadgeText="২+ বছর"
                safetyBadgeText="১০০% নিরাপদ"
                locale={locale}
                onQuickAdd={() => setCartSubtotal((prev) => prev + 299)}
              />
            </div>

            <div className="md:col-span-2 space-y-6 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="font-heading font-bold text-lg text-[#2B2B2B]">
                  Interactive Free Delivery Indicator
                </h3>
                <p className="text-sm text-[#6B6B6B]">
                  Psychological progress bar that motivates parents to add an extra coloring book or clay tub.
                </p>
                <FreeDeliveryBar currentSubtotal={cartSubtotal} freeDeliveryThreshold={1000} locale={locale} />

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setCartSubtotal(450)}
                    className="px-3 py-1.5 text-xs font-bold bg-[#FAF7F2] border border-[#EFE9E0] rounded-lg hover:border-[#FF6B6B]"
                  >
                    Set Subtotal ৳450
                  </button>
                  <button
                    onClick={() => setCartSubtotal(850)}
                    className="px-3 py-1.5 text-xs font-bold bg-[#FAF7F2] border border-[#EFE9E0] rounded-lg hover:border-[#FF6B6B]"
                  >
                    Set Subtotal ৳850
                  </button>
                  <button
                    onClick={() => setCartSubtotal(1150)}
                    className="px-3 py-1.5 text-xs font-bold bg-[#FAF7F2] border border-[#EFE9E0] rounded-lg hover:border-[#FF6B6B]"
                  >
                    Set Subtotal ৳1,150 (Unlocked!)
                  </button>
                </div>
              </div>

              {/* Courier & Payment Mocks verification */}
              <div className="bg-[#FAF7F2] border border-[#EFE9E0] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-sm text-[#2B2B2B]">
                    External Service Mock Tester
                  </span>
                  <span className="text-xs bg-[#EBF8EE] text-[#2D7A3E] font-bold px-2 py-0.5 rounded-full">
                    Active & Mocked
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={testMockCourier}>
                    <Truck className="w-3.5 h-3.5" /> Test Steadfast Dispatch
                  </Button>
                  <Button size="sm" variant="outline" onClick={testMockPayment}>
                    <Sparkles className="w-3.5 h-3.5" /> Test bKash / Payment
                  </Button>
                </div>
                {courierStatus && (
                  <div className="text-xs font-mono text-[#2D7A3E] bg-white p-2 rounded-lg border border-[#C4EDCD]">
                    {courierStatus}
                  </div>
                )}
                {paymentStatus && (
                  <div className="text-xs font-mono text-[#197AA5] bg-white p-2 rounded-lg border border-[#BFE4F7]">
                    {paymentStatus}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
