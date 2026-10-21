'use client';

import React, { useState } from 'react';
import { Truck, CheckCircle, Save, ShieldAlert, Sparkles, MapPin } from 'lucide-react';
import { StatusPill } from '@/components/ui/Pill';

export function DeliveryChargesManager() {
  const [dhakaRate, setDhakaRate] = useState(60);
  const [suburbsRate, setSuburbsRate] = useState(100);
  const [outsideDhakaRate, setOutsideDhakaRate] = useState(120);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(1000);
  const [codFee, setCodFee] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Simulate or save to site-settings
      await new Promise((r) => setTimeout(r, 600));
      setFeedback('Delivery rates and free shipping threshold updated successfully!');
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback('Failed to update delivery rates');
    } finally {
      setIsSaving(false);
    }
  };

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
          Configure nationwide courier delivery charges calculated at checkout and displayed in the product page trust block.
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

        {/* Free Shipping & COD Surcharge Card */}
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
          <h4 className="font-heading font-bold text-sm text-[#2B2B2B]">Special Policies &amp; Thresholds</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0]">
              <label className="font-bold text-[#2B2B2B] block">Free Delivery Threshold (৳):</label>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#2B2B2B]">৳</span>
                <input
                  type="number"
                  min={0}
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                  className="w-full p-2 bg-white rounded-xl border border-[#EFE9E0] font-bold text-sm focus:outline-[#D6403B]"
                />
              </div>
              <span className="text-[11px] text-[#6B6B6B] block">
                Orders equal or exceeding this value get automatic free delivery across Bangladesh.
              </span>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0]">
              <label className="font-bold text-[#2B2B2B] block">Cash on Delivery (COD) Fee (৳):</label>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#2B2B2B]">৳</span>
                <input
                  type="number"
                  min={0}
                  value={codFee}
                  onChange={(e) => setCodFee(Number(e.target.value))}
                  className="w-full p-2 bg-white rounded-xl border border-[#EFE9E0] font-bold text-sm focus:outline-[#D6403B]"
                />
              </div>
              <span className="text-[11px] text-[#6B6B6B] block">
                Set to 0 for free COD without extra handling fees.
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#D6403B] text-white text-xs font-bold hover:bg-[#B5322E] flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Delivery Settings'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
export default DeliveryChargesManager;
