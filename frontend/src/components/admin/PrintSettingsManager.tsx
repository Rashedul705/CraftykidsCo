'use client';

import React, { useState, useEffect } from 'react';
import {
  Printer,
  FileText,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Save,
  HelpCircle,
  Tag,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { defaultSiteSettings } from '@/lib/site-settings';

export function PrintSettingsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Print Settings State
  const [companyName, setCompanyName] = useState('CraftyKidsCo');
  const [tagline, setTagline] = useState('শিশুদের নিরাপদ প্রাকৃতিক রঙ ও শিক্ষামূলক খেলনা');
  const [phone, setPhone] = useState('01711-223344');
  const [supportPhone, setSupportPhone] = useState('01711-223344');
  const [whatsapp, setWhatsapp] = useState('8801711223344');
  const [website, setWebsite] = useState('craftykidsco.com');
  const [facebookPage, setFacebookPage] = useState('fb.com/craftykidsco.bd');
  const [logoUrl, setLogoUrl] = useState('/icons/icon-192x192.png');
  const [returnPolicyText, setReturnPolicyText] = useState(
    'পণ্য পাওয়ার পর কোনো সমস্যা থাকলে ৩ দিনের মধ্যে সাপোর্ট নম্বরে যোগাযোগ করুন।'
  );
  const [showReceiverDetails, setShowReceiverDetails] = useState(true);
  const [showCollectAmount, setShowCollectAmount] = useState(true);
  const [showFragileTag, setShowFragileTag] = useState(false);
  const [defaultStickerSize, setDefaultStickerSize] = useState<'100x150' | '75x50' | 'sheet4' | 'sheet8'>('100x150');

  useEffect(() => {
    fetch('/api/site-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings?.print) {
          const p = data.settings.print;
          if (p.companyName !== undefined) setCompanyName(p.companyName);
          if (p.tagline !== undefined) setTagline(p.tagline);
          if (p.phone !== undefined) setPhone(p.phone);
          if (p.supportPhone !== undefined) setSupportPhone(p.supportPhone);
          if (p.whatsapp !== undefined) setWhatsapp(p.whatsapp);
          if (p.website !== undefined) setWebsite(p.website);
          if (p.facebookPage !== undefined) setFacebookPage(p.facebookPage);
          if (p.logoUrl !== undefined) setLogoUrl(p.logoUrl);
          if (p.returnPolicyText !== undefined) setReturnPolicyText(p.returnPolicyText);
          if (p.showReceiverDetails !== undefined) setShowReceiverDetails(p.showReceiverDetails);
          if (p.showCollectAmount !== undefined) setShowCollectAmount(p.showCollectAmount);
          if (p.showFragileTag !== undefined) setShowFragileTag(p.showFragileTag);
          if (p.defaultStickerSize !== undefined) setDefaultStickerSize(p.defaultStickerSize);
        }
      })
      .catch((err) => console.warn('Failed to fetch print settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedFeedback(false);

    try {
      const payload = {
        print: {
          companyName,
          tagline,
          phone,
          supportPhone,
          whatsapp,
          website,
          facebookPage,
          logoUrl,
          returnPolicyText,
          showReceiverDetails,
          showCollectAmount,
          showFragileTag,
          defaultStickerSize,
        },
      };

      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 3000);
      }
    } catch (err) {
      console.error('Error saving print settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const isPhoneMissing = !phone.trim();

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Missing Phone Warning Banner */}
      {isPhoneMissing && (
        <div className="p-4 rounded-2xl bg-[#FFF3CC] border border-[#FFE28A] text-[#7A4E00] flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-[#B45309]" />
          <div className="text-xs sm:text-sm font-semibold">
            <span className="font-bold">সতর্কবার্তা:</span> Company phone is missing. Add your phone number below so it prints properly on courier stickers and customer invoices.
          </div>
        </div>
      )}

      {/* Success Banner */}
      {savedFeedback && (
        <div className="p-4 rounded-2xl bg-[#DDF3E6] border border-[#BDE7CC] text-[#1F6B43] flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">প্রিন্ট সেটিংস সফলভাবে সংরক্ষিত হয়েছে! (Saved)</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: Brand & Header Values */}
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#EFE9E0]">
            <Printer className="w-5 h-5 text-[#D6403B]" />
            <div>
              <h3 className="font-heading font-black text-base text-[#2B2B2B]">
                প্রিন্ট ব্র্যান্ড ও পরিচিতি (Brand & Company Details)
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                এই তথ্যগুলো ইনভয়েস ও পার্সেল স্টিকারের হেডার এবং ফুটার অংশে প্রদর্শিত হবে।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-[#2B2B2B] block mb-1">Company / Brand Name:</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="CraftyKidsCo"
                className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B] font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-[#2B2B2B] block mb-1">Tagline (ট্যাগলাইন):</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="শিশুদের নিরাপদ প্রাকৃতিক রঙ ও শিক্ষামূলক খেলনা"
                className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B] font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-[#2B2B2B] block mb-1">
                Company Phone (স্টিকারে প্রেরকের ফোন) <span className="text-[#D6403B]">*</span>:
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01711-223344"
                className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B] font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-[#2B2B2B] block mb-1">Support Phone (ইনভয়েসের কাস্টমার কেয়ার):</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="01711-223344"
                className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B] font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-[#2B2B2B] block mb-1">WhatsApp Number (হোয়াটসঅ্যাপ):</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="8801711223344"
                className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B] font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-[#2B2B2B] block mb-1">Website URL:</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="craftykidsco.com"
                className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B] font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-[#2B2B2B] block mb-1">Facebook Page URL:</label>
              <input
                type="text"
                value={facebookPage}
                onChange={(e) => setFacebookPage(e.target.value)}
                placeholder="fb.com/craftykidsco.bd"
                className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B] font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-[#2B2B2B] block mb-1">Return Policy Sentence (ইনভয়েসের রিটার্ন নীতি):</label>
              <textarea
                rows={2}
                value={returnPolicyText}
                onChange={(e) => setReturnPolicyText(e.target.value)}
                placeholder="পণ্য পাওয়ার পর কোনো সমস্যা থাকলে ৩ দিনের মধ্যে সাপোর্ট নম্বরে যোগাযোগ করুন।"
                className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B] font-medium text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Parcel Sticker Options (Pure B&W Thermal) */}
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#EFE9E0]">
            <Tag className="w-5 h-5 text-[#D6403B]" />
            <div>
              <h3 className="font-heading font-black text-base text-[#2B2B2B]">
                পার্সেল স্টিকার কনফিগারেশন (100 x 150 mm Thermal Label)
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                থার্মাল প্রিন্টারের জন্য পিওর ব্ল্যাক অ্যান্ড হোয়াইট অপশন ও টগল নিয়ন্ত্রণ করুন।
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Toggle 1: Show Receiver Details */}
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#EFE9E0] hover:bg-[#FAF7F2] cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-xs sm:text-sm text-[#2B2B2B] block">
                  Show receiver details on sticker (প্রাপকের ঠিকানা ও ফোন)
                </span>
                <span className="text-[11px] text-[#6B6B6B]">
                  স্টিকারে গ্রাহকের নাম, মোবাইল নম্বর এবং সম্পূর্ণ ডেলিভারি ঠিকানা প্রদর্শন করুন (Default: On)
                </span>
              </div>
              <input
                type="checkbox"
                checked={showReceiverDetails}
                onChange={(e) => setShowReceiverDetails(e.target.checked)}
                className="w-4 h-4 accent-[#D6403B] cursor-pointer"
              />
            </label>

            {/* Toggle 2: Show Collect Amount */}
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#EFE9E0] hover:bg-[#FAF7F2] cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-xs sm:text-sm text-[#2B2B2B] block">
                  Show collect amount on sticker (ক্যাশ কালেক্ট বার)
                </span>
                <span className="text-[11px] text-[#6B6B6B]">
                  ক্যাশ অন ডেলিভারি অর্ডারে বড় বোল্ড কালো বারে টাকার পরিমাণ বা পেইড অর্ডারে &quot;পেইড&quot; দেখান (Default: On)
                </span>
              </div>
              <input
                type="checkbox"
                checked={showCollectAmount}
                onChange={(e) => setShowCollectAmount(e.target.checked)}
                className="w-4 h-4 accent-[#D6403B] cursor-pointer"
              />
            </label>

            {/* Toggle 3: Show Fragile Tag */}
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#EFE9E0] hover:bg-[#FAF7F2] cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-xs sm:text-sm text-[#2B2B2B] block">
                  Show fragile tag (সাবধানে রাখুন ট্যাগ)
                </span>
                <span className="text-[11px] text-[#6B6B6B]">
                  প্লাস্টার মডেল ও ভঙ্গুর পণ্যের স্টিকারের ফুটারে &quot;সাবধানে রাখুন (FRAGILE)&quot; বক্স প্রিন্ট করুন (Default: Off)
                </span>
              </div>
              <input
                type="checkbox"
                checked={showFragileTag}
                onChange={(e) => setShowFragileTag(e.target.checked)}
                className="w-4 h-4 accent-[#D6403B] cursor-pointer"
              />
            </label>
          </div>

          {/* Default Sticker Size */}
          <div className="pt-3 border-t border-[#EFE9E0]">
            <label className="font-bold text-xs text-[#2B2B2B] block mb-2">
              Default Sticker Size &amp; Layout Preference:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <label
                className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-colors ${
                  defaultStickerSize === '100x150'
                    ? 'border-[#D6403B] bg-[#FFF6F5] text-[#D6403B] font-bold'
                    : 'border-[#EFE9E0] bg-white text-[#2B2B2B]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span>100 x 150 mm</span>
                  <input
                    type="radio"
                    name="stickerSize"
                    value="100x150"
                    checked={defaultStickerSize === '100x150'}
                    onChange={() => setDefaultStickerSize('100x150')}
                    className="accent-[#D6403B]"
                  />
                </div>
                <span className="text-[10px] text-[#6B6B6B] font-normal">
                  Thermal Standard (Default)
                </span>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-colors ${
                  defaultStickerSize === '75x50'
                    ? 'border-[#D6403B] bg-[#FFF6F5] text-[#D6403B] font-bold'
                    : 'border-[#EFE9E0] bg-white text-[#2B2B2B]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span>75 x 50 mm</span>
                  <input
                    type="radio"
                    name="stickerSize"
                    value="75x50"
                    checked={defaultStickerSize === '75x50'}
                    onChange={() => setDefaultStickerSize('75x50')}
                    className="accent-[#D6403B]"
                  />
                </div>
                <span className="text-[10px] text-[#6B6B6B] font-normal">
                  Compact Label
                </span>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-colors ${
                  defaultStickerSize === 'sheet4'
                    ? 'border-[#D6403B] bg-[#FFF6F5] text-[#D6403B] font-bold'
                    : 'border-[#EFE9E0] bg-white text-[#2B2B2B]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span>A4 Sheet (4-Up)</span>
                  <input
                    type="radio"
                    name="stickerSize"
                    value="sheet4"
                    checked={defaultStickerSize === 'sheet4'}
                    onChange={() => setDefaultStickerSize('sheet4')}
                    className="accent-[#D6403B]"
                  />
                </div>
                <span className="text-[10px] text-[#6B6B6B] font-normal">
                  2 x 2 grid (Inkjet/Laser)
                </span>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-colors ${
                  defaultStickerSize === 'sheet8'
                    ? 'border-[#D6403B] bg-[#FFF6F5] text-[#D6403B] font-bold'
                    : 'border-[#EFE9E0] bg-white text-[#2B2B2B]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span>A4 Sheet (8-Up)</span>
                  <input
                    type="radio"
                    name="stickerSize"
                    value="sheet8"
                    checked={defaultStickerSize === 'sheet8'}
                    onChange={() => setDefaultStickerSize('sheet8')}
                    className="accent-[#D6403B]"
                  />
                </div>
                <span className="text-[10px] text-[#6B6B6B] font-normal">
                  2 x 4 grid (Compact)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 3: Live Alignment & Test Print Buttons */}
        <div className="bg-[#FAF7F2] rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#EFE9E0]">
            <Sparkles className="w-5 h-5 text-[#D6403B]" />
            <div>
              <h3 className="font-heading font-black text-base text-[#2B2B2B]">
                টেস্ট প্রিন্ট ও এলাইনমেন্ট পরীক্ষা (Test Prints)
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                আসল পার্সেল প্রিন্ট করার আগে আপনার থার্মাল বা নরমাল লেজার/ইঙ্কজেট প্রিন্টারের মার্জিন এবং বারকোড স্ক্যানার যাচাই করুন।
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/api/print/sticker?test=1&size=100x150"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-white border border-[#EFE9E0] hover:bg-[#FAF7F2] text-xs font-bold text-[#2B2B2B] inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#D6403B]" />
              <span>Test Print (Thermal 100x150 mm)</span>
            </a>

            <a
              href="/api/print/sticker?test=1&sheet=4"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-white border border-[#EFE9E0] hover:bg-[#FAF7F2] text-xs font-bold text-[#2B2B2B] inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-[#0B5F85]" />
              <span>Test Print (A4 Sheet 4-Up)</span>
            </a>

            <a
              href="/api/print/sticker?test=1&sheet=8"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-white border border-[#EFE9E0] hover:bg-[#FAF7F2] text-xs font-bold text-[#2B2B2B] inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-[#0B5F85]" />
              <span>Test Print (A4 Sheet 8-Up)</span>
            </a>

            <a
              href="/api/print/invoice?ids=sample"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-white border border-[#EFE9E0] hover:bg-[#FAF7F2] text-xs font-bold text-[#2B2B2B] inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#1F6B43]" />
              <span>Test Customer Invoice (A4)</span>
            </a>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="submit" variant="primary" isLoading={saving} className="px-6 py-2.5 text-sm font-bold">
            <Save className="w-4 h-4 mr-1.5" />
            Save Print Settings
          </Button>
        </div>
      </form>
    </div>
  );
}

export default PrintSettingsManager;
