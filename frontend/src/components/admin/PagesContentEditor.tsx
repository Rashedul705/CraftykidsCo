'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  PhoneCall,
  Save,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Heart,
  ShieldCheck,
  Scale,
  RefreshCw,
  HelpCircle,
  Clock,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import { defaultSiteSettings, CustomPagesSettings } from '@/lib/site-settings';

export function PagesContentEditor() {
  const [activeTab, setActiveTab] = useState<'contact' | 'about' | 'privacy' | 'terms'>('contact');
  const [pagesData, setPagesData] = useState<CustomPagesSettings>(defaultSiteSettings.customPages!);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/site-settings');
      const data = await res.json();
      if (data?.success && data?.settings?.customPages) {
        setPagesData({
          ...defaultSiteSettings.customPages!,
          ...data.settings.customPages,
          contact: {
            ...defaultSiteSettings.customPages!.contact,
            ...(data.settings.customPages.contact || {}),
          },
          about: {
            ...defaultSiteSettings.customPages!.about,
            ...(data.settings.customPages.about || {}),
          },
          privacy: {
            ...defaultSiteSettings.customPages!.privacy,
            ...(data.settings.customPages.privacy || {}),
          },
          terms: {
            ...defaultSiteSettings.customPages!.terms,
            ...(data.settings.customPages.terms || {}),
          },
        });
      }
    } catch (err) {
      console.error('Error fetching custom pages settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customPages: pagesData,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        showToast('পেজের সকল কন্টেন্ট সফলভাবে সংরক্ষণ করা হয়েছে!');
      } else {
        alert(data.message || 'সংরক্ষণ ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      alert('সার্ভার এরর: সংরক্ষণ করা সম্ভব হয়নি।');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-[#1F6B43] text-white text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-black text-xl text-[#2B2B2B] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#D6403B]" />
            <span>পেজ কন্টেন্ট এডিটর (Page Content Editor)</span>
          </h2>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            যোগাযোগ (Contact), আমাদের সম্পর্কে (About), প্রাইভেসি পলিসি ও শর্তাবলী পেজের লেখা ও তথ্য সরাসরি এডিট করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSettings}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#EFE9E0] hover:bg-[#FAF7F2] text-xs font-bold text-[#2B2B2B] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>রিলোড</span>
          </button>
          <button
            onClick={() => handleSave()}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-[#D6403B] hover:bg-[#BF3430] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#EFE9E0]">
        <button
          onClick={() => setActiveTab('contact')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'contact'
              ? 'bg-[#2B2B2B] text-white shadow-xs'
              : 'bg-white text-[#6B6B6B] hover:text-[#2B2B2B] border border-[#EFE9E0]'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>যোগাযোগ পেজ (Contact)</span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'about'
              ? 'bg-[#2B2B2B] text-white shadow-xs'
              : 'bg-white text-[#6B6B6B] hover:text-[#2B2B2B] border border-[#EFE9E0]'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>আমাদের সম্পর্কে (About Us)</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'privacy'
              ? 'bg-[#2B2B2B] text-white shadow-xs'
              : 'bg-white text-[#6B6B6B] hover:text-[#2B2B2B] border border-[#EFE9E0]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>গোপনীয়তা নীতিমালা (Privacy)</span>
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'terms'
              ? 'bg-[#2B2B2B] text-white shadow-xs'
              : 'bg-white text-[#6B6B6B] hover:text-[#2B2B2B] border border-[#EFE9E0]'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>ব্যবহারের শর্তাবলী (Terms)</span>
        </button>
      </div>

      {/* TAB 1: CONTACT US PAGE EDITING */}
      {activeTab === 'contact' && (
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
            <div>
              <h3 className="font-heading font-black text-base text-[#2B2B2B]">
                যোগাযোগ পেজের তথ্য ও টেক্সট
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                হটলাইন, WhatsApp নম্বর, শোরুম ঠিকানা ও খোলার সময় নির্ধারণ করুন (ইমেইল অপশন সম্পূর্ণ বাদ দেওয়া হয়েছে)।
              </p>
            </div>
            <a
              href="/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl border border-[#EFE9E0] hover:bg-[#FAF7F2] text-xs font-bold text-[#D6403B] flex items-center gap-1.5 transition-colors"
            >
              <span>লাইভ পেজ দেখুন</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2B2B2B]">
                পেজ শিরোনাম (Headline)
              </label>
              <input
                type="text"
                value={pagesData.contact.headline}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    contact: { ...pagesData.contact, headline: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs focus:outline-none focus:border-[#D6403B]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2B2B2B]">
                সাব-টাইটেল (Subtitle)
              </label>
              <input
                type="text"
                value={pagesData.contact.subtitle}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    contact: { ...pagesData.contact, subtitle: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs focus:outline-none focus:border-[#D6403B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2B2B2B] flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-[#D6403B]" />
                <span>সরাসরি হটলাইন নম্বর (Hotline Phone)</span>
              </label>
              <input
                type="text"
                value={pagesData.contact.phone}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    contact: { ...pagesData.contact, phone: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs font-mono font-bold focus:outline-none focus:border-[#D6403B]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2B2B2B] flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                <span>WhatsApp নম্বর</span>
              </label>
              <input
                type="text"
                value={pagesData.contact.whatsapp}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    contact: { ...pagesData.contact, whatsapp: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs font-mono font-bold focus:outline-none focus:border-[#D6403B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2B2B2B] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#1F6B43]" />
                <span>শোরুম ও অফিস ঠিকানা (Location)</span>
              </label>
              <input
                type="text"
                value={pagesData.contact.location}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    contact: { ...pagesData.contact, location: e.target.value },
                  })
                }
                placeholder="তেরখাদিয়া, রাজপাড়া, রাজশাহী।"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs font-bold focus:outline-none focus:border-[#D6403B]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2B2B2B] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#1F6B43]" />
                <span>খোলার সময়সূচী (Opening Hours)</span>
              </label>
              <input
                type="text"
                value={pagesData.contact.openingHours}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    contact: { ...pagesData.contact, openingHours: e.target.value },
                  })
                }
                placeholder="ওপেন ২৪ ঘণ্টা"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs font-bold focus:outline-none focus:border-[#D6403B]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2B2B2B]">
              WhatsApp সাপোর্ট ব্যানার টেক্সট
            </label>
            <textarea
              rows={2}
              value={pagesData.contact.noticeBannerText}
              onChange={(e) =>
                setPagesData({
                  ...pagesData,
                  contact: { ...pagesData.contact, noticeBannerText: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs focus:outline-none focus:border-[#D6403B]"
            />
          </div>
        </div>
      )}

      {/* TAB 2: ABOUT US PAGE EDITING */}
      {activeTab === 'about' && (
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
            <div>
              <h3 className="font-heading font-black text-base text-[#2B2B2B]">
                আমাদের সম্পর্কে (About Us) পেজের কন্টেন্ট
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                ব্র্যান্ড হিস্ট্রি, মিশন, পরিসংখ্যান এবং ৪টি মূল স্তম্ভ পরিবর্তন করুন।
              </p>
            </div>
            <a
              href="/about"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl border border-[#EFE9E0] hover:bg-[#FAF7F2] text-xs font-bold text-[#D6403B] flex items-center gap-1.5 transition-colors"
            >
              <span>লাইভ পেজ দেখুন</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Hero Section */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#D6403B]">হিরো সেকশন</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#2B2B2B]">টপ ব্যাজ</label>
                <input
                  type="text"
                  value={pagesData.about.badge}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, badge: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#EFE9E0] text-xs"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-bold text-[#2B2B2B]">মূল শিরোনাম</label>
                <input
                  type="text"
                  value={pagesData.about.headline}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, headline: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#EFE9E0] text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#2B2B2B]">সাবটাইটেল</label>
              <textarea
                rows={2}
                value={pagesData.about.subtitle}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    about: { ...pagesData.about, subtitle: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-[#EFE9E0] text-xs"
              />
            </div>
          </div>

          {/* Stats Bar */}
          <div className="space-y-3 pt-3 border-t border-[#EFE9E0]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#D6403B]">৪টি মূল পরিসংখ্যান</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold">স্ট্যাট ১</label>
                <input
                  type="text"
                  value={pagesData.about.stat1Val}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, stat1Val: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#EFE9E0] text-xs font-bold"
                />
                <input
                  type="text"
                  value={pagesData.about.stat1Label}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, stat1Label: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#EFE9E0] text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold">স্ট্যাট ২</label>
                <input
                  type="text"
                  value={pagesData.about.stat2Val}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, stat2Val: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#EFE9E0] text-xs font-bold"
                />
                <input
                  type="text"
                  value={pagesData.about.stat2Label}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, stat2Label: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#EFE9E0] text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold">স্ট্যাট ৩</label>
                <input
                  type="text"
                  value={pagesData.about.stat3Val}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, stat3Val: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#EFE9E0] text-xs font-bold"
                />
                <input
                  type="text"
                  value={pagesData.about.stat3Label}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, stat3Label: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#EFE9E0] text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold">স্ট্যাট ৪</label>
                <input
                  type="text"
                  value={pagesData.about.stat4Val}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, stat4Val: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#EFE9E0] text-xs font-bold"
                />
                <input
                  type="text"
                  value={pagesData.about.stat4Label}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, stat4Label: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#EFE9E0] text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Story Paragraphs */}
          <div className="space-y-3 pt-3 border-t border-[#EFE9E0]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#D6403B]">ব্র্যান্ডের শুরুর গল্প</h4>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#2B2B2B]">গল্পের শিরোনাম</label>
              <input
                type="text"
                value={pagesData.about.storyTitle}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    about: { ...pagesData.about, storyTitle: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-[#EFE9E0] text-xs"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#2B2B2B]">প্রথম অনুচ্ছেদ</label>
                <textarea
                  rows={4}
                  value={pagesData.about.storyPara1}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, storyPara1: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#EFE9E0] text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#2B2B2B]">দ্বিতীয় অনুচ্ছেদ</label>
                <textarea
                  rows={4}
                  value={pagesData.about.storyPara2}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, storyPara2: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#EFE9E0] text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRIVACY POLICY EDITING */}
      {activeTab === 'privacy' && (
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
            <div>
              <h3 className="font-heading font-black text-base text-[#2B2B2B]">
                গোপনীয়তা নীতিমালা (Privacy Policy)
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                গ্রাহকের তথ্যের সুরক্ষা ও পলিসি সংক্রান্ত বিষয়সমূহ সরাসরি আপডেট করুন।
              </p>
            </div>
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl border border-[#EFE9E0] hover:bg-[#FAF7F2] text-xs font-bold text-[#D6403B] flex items-center gap-1.5 transition-colors"
            >
              <span>লাইভ পেজ দেখুন</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2B2B2B]">শিরোনাম</label>
              <input
                type="text"
                value={pagesData.privacy.headline}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    privacy: { ...pagesData.privacy, headline: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2B2B2B]">সর্বশেষ আপডেট তারিখ</label>
              <input
                type="text"
                value={pagesData.privacy.lastUpdated}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    privacy: { ...pagesData.privacy, lastUpdated: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2B2B2B]">ভূমিকা (Intro)</label>
            <textarea
              rows={2}
              value={pagesData.privacy.introText}
              onChange={(e) =>
                setPagesData({
                  ...pagesData,
                  privacy: { ...pagesData.privacy, introText: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs"
            />
          </div>

          {/* Privacy Sections */}
          <div className="space-y-4 pt-3 border-t border-[#EFE9E0]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#D6403B]">পলিসি সেকশনসমূহ</h4>

            {/* Sec 1 */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <input
                type="text"
                value={pagesData.privacy.section1Title}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    privacy: { ...pagesData.privacy, section1Title: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
              />
              <textarea
                rows={3}
                value={pagesData.privacy.section1Content}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    privacy: { ...pagesData.privacy, section1Content: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs"
              />
            </div>

            {/* Sec 2 */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <input
                type="text"
                value={pagesData.privacy.section2Title}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    privacy: { ...pagesData.privacy, section2Title: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
              />
              <textarea
                rows={3}
                value={pagesData.privacy.section2Content}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    privacy: { ...pagesData.privacy, section2Content: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs"
              />
            </div>

            {/* Sec 3 */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <input
                type="text"
                value={pagesData.privacy.section3Title}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    privacy: { ...pagesData.privacy, section3Title: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
              />
              <textarea
                rows={3}
                value={pagesData.privacy.section3Content}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    privacy: { ...pagesData.privacy, section3Content: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs"
              />
            </div>

            {/* Sec 4 */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <input
                type="text"
                value={pagesData.privacy.section4Title}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    privacy: { ...pagesData.privacy, section4Title: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
              />
              <textarea
                rows={3}
                value={pagesData.privacy.section4Content}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    privacy: { ...pagesData.privacy, section4Content: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TERMS OF SERVICE EDITING */}
      {activeTab === 'terms' && (
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
            <div>
              <h3 className="font-heading font-black text-base text-[#2B2B2B]">
                ব্যবহারের শর্তাবলী (Terms of Service)
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                অর্ডার, পেমেন্ট, ডেলিভারি ও রিপ্লেসমেন্ট সম্পর্কিত ভোক্তা শর্তাবলী এডিট করুন।
              </p>
            </div>
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl border border-[#EFE9E0] hover:bg-[#FAF7F2] text-xs font-bold text-[#D6403B] flex items-center gap-1.5 transition-colors"
            >
              <span>লাইভ পেজ দেখুন</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2B2B2B]">শিরোনাম</label>
              <input
                type="text"
                value={pagesData.terms.headline}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, headline: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2B2B2B]">সর্বশেষ আপডেট তারিখ</label>
              <input
                type="text"
                value={pagesData.terms.lastUpdated}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, lastUpdated: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2B2B2B]">ভূমিকা (Intro)</label>
            <textarea
              rows={2}
              value={pagesData.terms.introText}
              onChange={(e) =>
                setPagesData({
                  ...pagesData,
                  terms: { ...pagesData.terms, introText: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs"
            />
          </div>

          {/* Terms Sections */}
          <div className="space-y-4 pt-3 border-t border-[#EFE9E0]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#D6403B]">শর্তাবলীর সেকশনসমূহ</h4>

            {/* Sec 1 */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <input
                type="text"
                value={pagesData.terms.section1Title}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section1Title: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
              />
              <textarea
                rows={2}
                value={pagesData.terms.section1Content}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section1Content: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs"
              />
            </div>

            {/* Sec 2 */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <input
                type="text"
                value={pagesData.terms.section2Title}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section2Title: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
              />
              <textarea
                rows={2}
                value={pagesData.terms.section2Content}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section2Content: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs"
              />
            </div>

            {/* Sec 5: Delivery */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <input
                type="text"
                value={pagesData.terms.section5Title}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section5Title: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
              />
              <textarea
                rows={3}
                value={pagesData.terms.section5Content}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section5Content: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs"
              />
            </div>

            {/* Sec 6: Return */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <input
                type="text"
                value={pagesData.terms.section6Title}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section6Title: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
              />
              <textarea
                rows={3}
                value={pagesData.terms.section6Content}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section6Content: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
