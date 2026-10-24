'use client';

import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle, Save, ShieldAlert, Sparkles, MapPin, AlertTriangle, Check, Gift } from 'lucide-react';

export function DeliveryChargesManager() {
  const [dhakaRate, setDhakaRate] = useState(60);
  const [suburbsRate, setSuburbsRate] = useState(100);
  const [outsideDhakaRate, setOutsideDhakaRate] = useState(120);
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(true);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(1000);
  const [codFee, setCodFee] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Fetch current live rates on mount
  useEffect(() => {
    fetch('/api/delivery-charges')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setDhakaRate(data.settings.dhakaRate);
          setSuburbsRate(data.settings.suburbsRate);
          setOutsideDhakaRate(data.settings.outsideDhakaRate);
          if (data.settings.freeShippingEnabled !== undefined) {
            setFreeShippingEnabled(Boolean(data.settings.freeShippingEnabled));
          }
          if (data.settings.freeDeliveryThreshold !== undefined) {
            setFreeShippingThreshold(data.settings.freeDeliveryThreshold);
          }
          if (data.settings.codFee !== undefined) {
            setCodFee(data.settings.codFee);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/delivery-charges', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dhakaRate,
          suburbsRate,
          outsideDhakaRate,
          freeShippingEnabled,
          freeDeliveryThreshold: freeShippingThreshold,
          codFee,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback('ডেলিভারি চার্জ ও ফ্রি শিপিং পলিসি সফলভাবে আপডেট হয়েছে! (Settings saved)');
      } else {
        setFeedback('Failed: ' + (data.message || 'Could not update rates'));
      }
      setTimeout(() => setFeedback(null), 3500);
    } catch {
      setFeedback('Failed to update delivery rates');
    } finally {
      setIsSaving(false);
    }
  };

  const presetThresholds = [500, 800, 1000, 1200, 1500, 2000];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast */}
      {feedback && (
        <div className="p-3.5 rounded-[12px] bg-[#DDF3E6] border border-[#BDE7CC] text-xs font-bold text-[#1F6B43] flex items-center justify-between shadow-xs">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-[#6B6B6B] hover:text-[#2B2B2B]">
            ✕
          </button>
        </div>
      )}

      {/* Intro info card */}
      <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-2">
        <h3 className="font-heading font-black text-lg text-[#2B2B2B] flex items-center gap-2">
          <Truck className="w-5 h-5 text-[#D6403B]" /> Shipping &amp; Delivery Zone Rates
        </h3>
        <p className="text-xs text-[#6B6B6B] leading-relaxed">
          সারাদেশের ডেলিভারি চার্জ, ফ্রি শিপিং অফার এবং ক্যাশ অন ডেলিভারি (COD) পলিসি এখান থেকে নিয়ন্ত্রণ করুন।
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* District Zones Table */}
        <div className="bg-white rounded-2xl border border-[#EFE9E0] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#EFE9E0] bg-[#FAF7F2]">
            <h4 className="font-heading font-bold text-sm text-[#2B2B2B]">Geographic Delivery Zones</h4>
          </div>

          <div className="divide-y divide-[#EFE9E0] text-xs">
            {/* Dhaka */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-[#2B2B2B] block">ঢাকা সিটি (Inside Dhaka)</span>
                <span className="text-[#6B6B6B] block">ঢাকা উত্তর ও দক্ষিণ সিটি করপোরেশন এর আওতাধীন এলাকা</span>
                <span className="text-[11px] text-[#1F6B43] font-medium">ডেলিভারি সময়: ২৪ - ৪৮ ঘণ্টা</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#2B2B2B]">৳</span>
                <input
                  type="number"
                  min={0}
                  value={dhakaRate}
                  onChange={(e) => setDhakaRate(Number(e.target.value))}
                  className="w-24 p-2 rounded-xl border border-[#EFE9E0] font-bold text-sm text-[#2B2B2B] focus:outline-[#D6403B]"
                />
              </div>
            </div>

            {/* Suburbs */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-[#2B2B2B] block">ঢাকা উপশহর (Suburbs)</span>
                <span className="text-[#6B6B6B] block">গাজীপুর, নারায়ণগঞ্জ, সাভার, কেরানীগঞ্জ</span>
                <span className="text-[11px] text-[#0B5F85] font-medium">ডেলিভারি সময়: ৪৮ - ৭২ ঘণ্টা</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#2B2B2B]">৳</span>
                <input
                  type="number"
                  min={0}
                  value={suburbsRate}
                  onChange={(e) => setSuburbsRate(Number(e.target.value))}
                  className="w-24 p-2 rounded-xl border border-[#EFE9E0] font-bold text-sm text-[#2B2B2B] focus:outline-[#D6403B]"
                />
              </div>
            </div>

            {/* Outside Dhaka */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-[#2B2B2B] block">ঢাকার বাইরে (Outside Dhaka)</span>
                <span className="text-[#6B6B6B] block">চট্টগ্রাম, সিলেট, রাজশাহী, খুলনা সহ সারাদেশের ৬১টি জেলা</span>
                <span className="text-[11px] text-[#7A4E00] font-medium">ডেলিভারি সময়: ২ - ৪ দিন (Steadfast Courier)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#2B2B2B]">৳</span>
                <input
                  type="number"
                  min={0}
                  value={outsideDhakaRate}
                  onChange={(e) => setOutsideDhakaRate(Number(e.target.value))}
                  className="w-24 p-2 rounded-xl border border-[#EFE9E0] font-bold text-sm text-[#2B2B2B] focus:outline-[#D6403B]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Free Shipping & Special Policies Card */}
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-6">
          <div className="border-b border-[#EFE9E0] pb-3">
            <h4 className="font-heading font-bold text-base text-[#2B2B2B] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D6403B]" /> Special Policies &amp; Thresholds
            </h4>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              ফ্রি ডেলিভারি অফার এবং অতিরিক্ত হ্যান্ডলিং চার্জ নির্ধারণ করুন
            </p>
          </div>

          {/* 1. Free Shipping Availability Toggle */}
          <div className="bg-[#FAF7F2] rounded-2xl border border-[#EFE9E0] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-[#D6403B]" />
                  <span className="font-bold text-sm text-[#2B2B2B]">
                    ফ্রি ডেলিভারি সুবিধা (Free Shipping Option)
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      freeShippingEnabled
                        ? 'bg-[#EBF8EE] text-[#1F6B43] border border-[#BDE7CC]'
                        : 'bg-[#F2F2F2] text-[#6B6B6B] border border-[#E0E0E0]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        freeShippingEnabled ? 'bg-[#1F6B43]' : 'bg-[#999999]'
                      }`}
                    />
                    {freeShippingEnabled ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Disabled)'}
                  </span>
                </div>
                <p className="text-xs text-[#6B6B6B]">
                  স্টোরে কি ফ্রি শিপিং অপশন চালু থাকবে? চালু থাকলে কাস্টমার নির্দিষ্ট শর্ত বা সীমার উপর ফ্রি ডেলিভারি পাবেন।
                </p>
              </div>

              {/* Toggle Switch Button */}
              <button
                type="button"
                onClick={() => setFreeShippingEnabled(!freeShippingEnabled)}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  freeShippingEnabled ? 'bg-[#1F6B43]' : 'bg-[#D1D5DB]'
                }`}
                aria-pressed={freeShippingEnabled}
                aria-label="Toggle Free Shipping"
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    freeShippingEnabled ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* If Free Shipping is ENABLED */}
            {freeShippingEnabled ? (
              <div className="pt-4 border-t border-[#EFE9E0] space-y-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-xs text-[#2B2B2B] flex items-center justify-between">
                    <span>ফ্রি ডেলিভারির ন্যূনতম অর্ডার সীমা (Free Delivery Threshold Limit):</span>
                    <span className="text-[11px] font-semibold text-[#1F6B43]">
                      বর্তমান সীমা: ৳{freeShippingThreshold}
                    </span>
                  </label>

                  <div className="flex items-center gap-2 max-w-sm">
                    <span className="font-bold text-[#2B2B2B] text-base">৳</span>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={freeShippingThreshold}
                      onChange={(e) => setFreeShippingThreshold(Math.max(0, Number(e.target.value)))}
                      className="w-full p-2.5 bg-white rounded-xl border border-[#EFE9E0] font-bold text-sm text-[#2B2B2B] focus:outline-[#D6403B] shadow-2xs"
                      placeholder="e.g. 1000"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-[#6B6B6B] block">দ্রুত সীমা নির্বাচন করুন (Quick Presets):</span>
                  <div className="flex flex-wrap gap-2">
                    {presetThresholds.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFreeShippingThreshold(preset)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
                          freeShippingThreshold === preset
                            ? 'bg-[#D6403B] text-white border-[#D6403B] shadow-xs'
                            : 'bg-white text-[#2B2B2B] border-[#EFE9E0] hover:bg-[#FAF7F2] hover:border-[#D6403B]/40'
                        }`}
                      >
                        ৳{preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-[#EBF8EE] border border-[#BDE7CC] rounded-xl text-xs text-[#1F6B43] flex items-start gap-2">
                  <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#1F6B43]" />
                  <span>
                    কার্টে পণ্যের মোট মূল্য <strong>৳{freeShippingThreshold}</strong> বা তার বেশি হলে কাস্টমারকে কোনো ডেলিভারি চার্জ দিতে হবে না (স্বয়ংক্রিয় ফ্রি ডেলিভারি)।
                  </span>
                </div>
              </div>
            ) : (
              /* If Free Shipping is DISABLED */
              <div className="pt-4 border-t border-[#EFE9E0]">
                <div className="p-4 bg-[#FFF4E5] border border-[#FFE2B8] rounded-xl text-xs text-[#7A4E00] flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#D97706]" />
                  <div className="space-y-1">
                    <strong className="block text-[#92400E] font-bold">
                      ফ্রি ডেলিভারি সুবিধা বন্ধ রয়েছে (Free Shipping is Disabled)
                    </strong>
                    <p className="leading-relaxed text-[#7A4E00]">
                      স্টোরে কোনো ফ্রি ডেলিভারি অফার কার্যকর থাকবে না। কার্টের সাইজ যাই হোক না কেন, কাস্টমারদের জন্য নির্ধারিত জোন রেট (ঢাকা <strong>৳{dhakaRate}</strong>, উপশহর <strong>৳{suburbsRate}</strong>, ঢাকার বাইরে <strong>৳{outsideDhakaRate}</strong>) বাধ্যতামূলকভাবে প্রযোজ্য হবে।
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Cash on Delivery (COD) Fee Card */}
          <div className="space-y-2 p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] text-xs">
            <label className="font-bold text-[#2B2B2B] block">Cash on Delivery (COD) Fee (৳):</label>
            <div className="flex items-center gap-2 max-w-sm">
              <span className="font-bold text-[#2B2B2B] text-base">৳</span>
              <input
                type="number"
                min={0}
                value={codFee}
                onChange={(e) => setCodFee(Number(e.target.value))}
                className="w-full p-2.5 bg-white rounded-xl border border-[#EFE9E0] font-bold text-sm focus:outline-[#D6403B] shadow-2xs"
              />
            </div>
            <span className="text-[11px] text-[#6B6B6B] block">
              ক্যাশ অন ডেলিভারি অর্ডারে অতিরিক্ত কোনো হ্যান্ডলিং ফি না চাইলে ০ রাখুন (Free COD)।
            </span>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#D6403B] text-white text-xs font-bold hover:bg-[#B5322E] flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'সংরক্ষণ করা হচ্ছে...' : 'সেটিংস সেভ করুন (Save Settings)'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default DeliveryChargesManager;

