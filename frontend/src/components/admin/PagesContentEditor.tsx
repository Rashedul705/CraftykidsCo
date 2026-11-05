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
  Clock,
  MapPin,
  MessageCircle,
  RotateCcw,
  BookOpen,
  Award,
  Leaf,
  Smile,
  Truck,
  Database,
  Lock,
  EyeOff,
  UserCheck,
  ShoppingBag,
  AlertTriangle,
  FileCheck,
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
        showToast('Page content saved successfully!');
      } else {
        alert(data.message || 'Failed to save changes.');
      }
    } catch (err) {
      alert('Server error: Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetCurrentTab = () => {
    const tabName =
      activeTab === 'contact'
        ? 'Contact Page'
        : activeTab === 'about'
        ? 'About Us Page'
        : activeTab === 'privacy'
        ? 'Privacy Policy Page'
        : 'Terms of Service Page';

    if (confirm(`Are you sure you want to restore ${tabName} to the live website default content?`)) {
      setPagesData((prev) => ({
        ...prev,
        [activeTab]: { ...defaultSiteSettings.customPages![activeTab] },
      }));
      showToast(`${tabName} restored to default. Click 'Save Changes' to apply.`);
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
            যোগাযোগ (Contact), আমাদের সম্পর্কে (About), প্রাইভেসি পলিসি (Privacy) ও শর্তাবলী (Terms) পেজের প্রতিটি লেখা লাইভ ওয়েবসাইটের সাথে শতভাগ মিল রেখে সরাসরি এডিট করুন।
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResetCurrentTab}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#EFE9E0] hover:bg-[#FAF7F2] text-xs font-bold text-[#6B6B6B] hover:text-[#D6403B] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Restore current tab to official live default content"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#D6403B]" />
            <span>Restore Default</span>
          </button>
          <button
            type="button"
            onClick={loadSettings}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#EFE9E0] hover:bg-[#FAF7F2] text-xs font-bold text-[#2B2B2B] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-[#D6403B] hover:bg-[#BF3430] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#EFE9E0]">
        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'contact'
              ? 'bg-[#2B2B2B] text-white shadow-xs'
              : 'bg-white text-[#6B6B6B] hover:text-[#2B2B2B] border border-[#EFE9E0]'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Contact</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('about')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'about'
              ? 'bg-[#2B2B2B] text-white shadow-xs'
              : 'bg-white text-[#6B6B6B] hover:text-[#2B2B2B] border border-[#EFE9E0]'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>About Us</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'privacy'
              ? 'bg-[#2B2B2B] text-white shadow-xs'
              : 'bg-white text-[#6B6B6B] hover:text-[#2B2B2B] border border-[#EFE9E0]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Privacy Policy</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'terms'
              ? 'bg-[#2B2B2B] text-white shadow-xs'
              : 'bg-white text-[#6B6B6B] hover:text-[#2B2B2B] border border-[#EFE9E0]'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Terms of Service</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CONTACT US PAGE EDITING                                            */}
      {/* ========================================================================= */}
      {activeTab === 'contact' && (
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
            <div>
              <h3 className="font-heading font-black text-base text-[#2B2B2B]">
                যোগাযোগ পেজের তথ্য ও টেক্সট (Contact Us Content)
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                হটলাইন, WhatsApp নম্বর, শোরুম ঠিকানা, খোলার সময় ও ফর্মের টেক্সট লাইভ ওয়েবসাইটের সাথে মিলিয়ে পরিবর্তন করুন।
              </p>
            </div>
            <a
              href="/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl border border-[#EFE9E0] hover:bg-[#FAF7F2] text-xs font-bold text-[#D6403B] flex items-center gap-1.5 transition-colors"
            >
              <span>View Live Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* 1. Hero Header */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#D6403B] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>১. পেজ হিরো সেকশন</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#2B2B2B]">টপ ব্যাজ টেক্সট</label>
                <input
                  type="text"
                  value={pagesData.contact.badge || 'আমরা আপনার সহায়তায় সদা প্রস্তুত'}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      contact: { ...pagesData.contact, badge: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs focus:outline-none focus:border-[#D6403B]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-[#2B2B2B]">পেজ শিরোনাম (Headline)</label>
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
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2B2B2B]">সাব-টাইটেল (Subtitle)</label>
              <textarea
                rows={2}
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

          {/* 2. Direct Contacts (Phone, WhatsApp, Location, Hours) */}
          <div className="space-y-4 pt-4 border-t border-[#EFE9E0]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#D6403B] flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>২. সরাসরি যোগাযোগ কার্ডসমূহ (Hotline, WhatsApp & Office)</span>
            </h4>

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
          </div>

          {/* 3. Form & Side Banner Text */}
          <div className="space-y-4 pt-4 border-t border-[#EFE9E0]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#D6403B] flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>৩. মেসেজ ফর্ম ও সাইড সাপোর্ট ব্যানার</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#2B2B2B]">ফর্মের শিরোনাম (Form Title)</label>
                <input
                  type="text"
                  value={pagesData.contact.formTitle || 'আমাদের বার্তা পাঠান (Send Us a Message)'}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      contact: { ...pagesData.contact, formTitle: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs focus:outline-none focus:border-[#D6403B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#2B2B2B]">ফর্ম সাব-টাইটেল (Form Subtitle)</label>
                <input
                  type="text"
                  value={pagesData.contact.formSubtitle || 'আপনার মতামত বা প্রশ্ন লিখে পাঠান, আমাদের কাস্টমার কেয়ার টিম দ্রুত আপনার সাথে যোগাযোগ করবে।'}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      contact: { ...pagesData.contact, formSubtitle: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs focus:outline-none focus:border-[#D6403B]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2B2B2B]">
                WhatsApp সাপোর্ট ব্যানার টেক্সট (Side Priority Card)
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ABOUT US PAGE EDITING                                              */}
      {/* ========================================================================= */}
      {activeTab === 'about' && (
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
            <div>
              <h3 className="font-heading font-black text-base text-[#2B2B2B]">
                আমাদের সম্পর্কে (About Us) পেজের কন্টেন্ট
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                হিরো সেকশন, ৪টি মূল পরিসংখ্যান, শুরুর গল্প, ৪টি মূল স্তম্ভ এবং নিচের সিএটিএ ব্যানার সরাসরি পরিবর্তন করুন।
              </p>
            </div>
            <a
              href="/about"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl border border-[#EFE9E0] hover:bg-[#FAF7F2] text-xs font-bold text-[#D6403B] flex items-center gap-1.5 transition-colors"
            >
              <span>View Live Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* 1. Hero Section */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#D6403B] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>১. হিরো সেকশন</span>
            </h4>
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
                  className="w-full px-3 py-2 rounded-xl border border-[#EFE9E0] text-xs font-bold"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-bold text-[#2B2B2B]">মূল শিরোনাম (Headline)</label>
                <input
                  type="text"
                  value={pagesData.about.headline}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, headline: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#EFE9E0] text-xs font-bold"
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

          {/* 2. Stats Bar */}
          <div className="space-y-3 pt-3 border-t border-[#EFE9E0]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#D6403B] flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>২. ৪টি মূল পরিসংখ্যান (Key Stats Bar)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1 p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0]">
                <label className="block text-[11px] font-bold text-[#D6403B]">স্ট্যাট ১ (মান ও বিবরণ)</label>
                <input
                  type="text"
                  value={pagesData.about.stat1Val}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, stat1Val: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold text-[#D6403B]"
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
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-[11px] font-bold"
                />
              </div>

              <div className="space-y-1 p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0]">
                <label className="block text-[11px] font-bold text-[#1F6B43]">স্ট্যাট ২ (মান ও বিবরণ)</label>
                <input
                  type="text"
                  value={pagesData.about.stat2Val}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, stat2Val: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold text-[#1F6B43]"
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
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-[11px] font-bold"
                />
              </div>

              <div className="space-y-1 p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0]">
                <label className="block text-[11px] font-bold text-[#0284C7]">স্ট্যাট ৩ (মান ও বিবরণ)</label>
                <input
                  type="text"
                  value={pagesData.about.stat3Val}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, stat3Val: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold text-[#0284C7]"
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
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-[11px] font-bold"
                />
              </div>

              <div className="space-y-1 p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0]">
                <label className="block text-[11px] font-bold text-[#D97706]">স্ট্যাট ৪ (মান ও বিবরণ)</label>
                <input
                  type="text"
                  value={pagesData.about.stat4Val}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, stat4Val: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold text-[#D97706]"
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
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-[11px] font-bold"
                />
              </div>
            </div>
          </div>

          {/* 3. Story Paragraphs */}
          <div className="space-y-3 pt-3 border-t border-[#EFE9E0]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#D6403B] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>৩. ব্র্যান্ডের শুরুর গল্প (The Story)</span>
            </h4>
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
                className="w-full px-3 py-2 rounded-xl border border-[#EFE9E0] text-xs font-bold"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#2B2B2B]">প্রথম অনুচ্ছেদ</label>
                <textarea
                  rows={5}
                  value={pagesData.about.storyPara1}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, storyPara1: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#EFE9E0] text-xs leading-relaxed"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#2B2B2B]">দ্বিতীয় অনুচ্ছেদ</label>
                <textarea
                  rows={5}
                  value={pagesData.about.storyPara2}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, storyPara2: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#EFE9E0] text-xs leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* 4. 4 Core Pillars */}
          <div className="space-y-4 pt-3 border-t border-[#EFE9E0]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#D6403B] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>৪. আমাদের ৪টি মূল ভিত্তি ও বৈশিষ্ট্য (4 Core Pillars)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pillar 1 */}
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
                <div className="flex items-center gap-2 text-[#D6403B] font-bold text-xs">
                  <Leaf className="w-4 h-4" />
                  <span>ভিত্তি ১</span>
                </div>
                <input
                  type="text"
                  value={pagesData.about.pillar1Title}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, pillar1Title: e.target.value },
                    })
                  }
                  placeholder="১০০% প্রাকৃতিক ও পরিবেশবান্ধব"
                  className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
                />
                <textarea
                  rows={3}
                  value={pagesData.about.pillar1Desc}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, pillar1Desc: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
                />
              </div>

              {/* Pillar 2 */}
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
                <div className="flex items-center gap-2 text-[#1F6B43] font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>ভিত্তি ২</span>
                </div>
                <input
                  type="text"
                  value={pagesData.about.pillar2Title}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, pillar2Title: e.target.value },
                    })
                  }
                  placeholder="ফুড-গ্রেড পিগমেন্ট নিরাপত্তা"
                  className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
                />
                <textarea
                  rows={3}
                  value={pagesData.about.pillar2Desc}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, pillar2Desc: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
                />
              </div>

              {/* Pillar 3 */}
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
                <div className="flex items-center gap-2 text-[#0284C7] font-bold text-xs">
                  <Award className="w-4 h-4" />
                  <span>ভিত্তি ৩</span>
                </div>
                <input
                  type="text"
                  value={pagesData.about.pillar3Title}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, pillar3Title: e.target.value },
                    })
                  }
                  placeholder="মোটর স্কিল ও স্ক্রিন-ফ্রি শৈশব"
                  className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
                />
                <textarea
                  rows={3}
                  value={pagesData.about.pillar3Desc}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, pillar3Desc: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
                />
              </div>

              {/* Pillar 4 */}
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
                <div className="flex items-center gap-2 text-[#D97706] font-bold text-xs">
                  <Smile className="w-4 h-4" />
                  <span>ভিত্তি ৪</span>
                </div>
                <input
                  type="text"
                  value={pagesData.about.pillar4Title}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, pillar4Title: e.target.value },
                    })
                  }
                  placeholder="সহজ গ্রিপ ও ভাঙন-প্রতিরোধী নকশা"
                  className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
                />
                <textarea
                  rows={3}
                  value={pagesData.about.pillar4Desc}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, pillar4Desc: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* 5. CTA Banner */}
          <div className="space-y-3 pt-3 border-t border-[#EFE9E0]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#D6403B] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>৫. নিচের কল-টু-অ্যাকশন (CTA) ব্যানার</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#2B2B2B]">ব্যানার শিরোনাম</label>
                <input
                  type="text"
                  value={pagesData.about.ctaHeading}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, ctaHeading: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#EFE9E0] text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#2B2B2B]">ব্যানার সাব-টাইটেল</label>
                <input
                  type="text"
                  value={pagesData.about.ctaSubtitle}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      about: { ...pagesData.about, ctaSubtitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#EFE9E0] text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PRIVACY POLICY EDITING                                             */}
      {/* ========================================================================= */}
      {activeTab === 'privacy' && (
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
            <div>
              <h3 className="font-heading font-black text-base text-[#2B2B2B]">
                গোপনীয়তা নীতিমালা (Privacy Policy)
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                গ্রাহকের তথ্যের সুরক্ষা ও পলিসি সংক্রান্ত সকল ৭টি সেকশন সরাসরি আপডেট করুন।
              </p>
            </div>
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl border border-[#EFE9E0] hover:bg-[#FAF7F2] text-xs font-bold text-[#D6403B] flex items-center gap-1.5 transition-colors"
            >
              <span>View Live Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Header & Intro */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#D6403B]">হেডার ও ভূমিকা</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#2B2B2B]">শিরোনাম (Headline)</label>
                <input
                  type="text"
                  value={pagesData.privacy.headline}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      privacy: { ...pagesData.privacy, headline: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs font-bold"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs font-bold font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2B2B2B]">ভূমিকা বক্স (Introductory Text)</label>
              <textarea
                rows={3}
                value={pagesData.privacy.introText}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    privacy: { ...pagesData.privacy, introText: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* All 7 Privacy Sections */}
          <div className="space-y-4 pt-3 border-t border-[#EFE9E0]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#D6403B]">
              পলিসি সেকশনসমূহ (৭টি পূর্ণাঙ্গ সেকশন)
            </h4>

            {/* Sec 1: Information Collection */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <div className="flex items-center gap-2 text-[#D6403B] font-bold text-xs">
                <Database className="w-4 h-4" />
                <span>সেকশন ১</span>
              </div>
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
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
              />
            </div>

            {/* Sec 2: Children's Privacy */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <div className="flex items-center gap-2 text-[#1F6B43] font-bold text-xs">
                <UserCheck className="w-4 h-4" />
                <span>সেকশন ২</span>
              </div>
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
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
              />
            </div>

            {/* Sec 3: Purpose of Usage */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <div className="flex items-center gap-2 text-[#0284C7] font-bold text-xs">
                <FileText className="w-4 h-4" />
                <span>সেকশন ৩</span>
              </div>
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
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
              />
            </div>

            {/* Sec 4: No Third-Party Sharing */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <div className="flex items-center gap-2 text-[#D97706] font-bold text-xs">
                <EyeOff className="w-4 h-4" />
                <span>সেকশন ৪</span>
              </div>
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
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
              />
            </div>

            {/* Sec 5: Security & SSL */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <div className="flex items-center gap-2 text-[#D6403B] font-bold text-xs">
                <Lock className="w-4 h-4" />
                <span>সেকশন ৫</span>
              </div>
              <input
                type="text"
                value={pagesData.privacy.section5Title}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    privacy: { ...pagesData.privacy, section5Title: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
              />
              <textarea
                rows={3}
                value={pagesData.privacy.section5Content}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    privacy: { ...pagesData.privacy, section5Content: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
              />
            </div>

            {/* Sec 6: Cookies Policy */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <div className="flex items-center gap-2 text-[#2B2B2B] font-bold text-xs">
                <FileText className="w-4 h-4" />
                <span>সেকশন ৬</span>
              </div>
              <input
                type="text"
                value={pagesData.privacy.section6Title}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    privacy: { ...pagesData.privacy, section6Title: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
              />
              <textarea
                rows={3}
                value={pagesData.privacy.section6Content}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    privacy: { ...pagesData.privacy, section6Content: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
              />
            </div>

            {/* Sec 7: User Rights & Hotline */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <div className="flex items-center gap-2 text-[#1F6B43] font-bold text-xs">
                <PhoneCall className="w-4 h-4" />
                <span>সেকশন ৭</span>
              </div>
              <input
                type="text"
                value={pagesData.privacy.section7Title}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    privacy: { ...pagesData.privacy, section7Title: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
              />
              <textarea
                rows={3}
                value={pagesData.privacy.section7Content}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    privacy: { ...pagesData.privacy, section7Content: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TERMS OF SERVICE EDITING                                           */}
      {/* ========================================================================= */}
      {activeTab === 'terms' && (
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
            <div>
              <h3 className="font-heading font-black text-base text-[#2B2B2B]">
                ব্যবহারের শর্তাবলী (Terms of Service)
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                অর্ডার, পেমেন্ট, ডেলিভারি, রিপ্লেসমেন্ট ও আইনি শর্তাবলী সংক্রান্ত সকল ১০টি সেকশন সরাসরি এডিট করুন।
              </p>
            </div>
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl border border-[#EFE9E0] hover:bg-[#FAF7F2] text-xs font-bold text-[#D6403B] flex items-center gap-1.5 transition-colors"
            >
              <span>View Live Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Header & Intro */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#D6403B]">হেডার ও ভূমিকা</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#2B2B2B]">শিরোনাম (Headline)</label>
                <input
                  type="text"
                  value={pagesData.terms.headline}
                  onChange={(e) =>
                    setPagesData({
                      ...pagesData,
                      terms: { ...pagesData.terms, headline: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs font-bold"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs font-bold font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2B2B2B]">ভূমিকা বক্স (Introductory Text)</label>
              <textarea
                rows={3}
                value={pagesData.terms.introText}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, introText: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* All 10 Terms Sections */}
          <div className="space-y-4 pt-3 border-t border-[#EFE9E0]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#D6403B]">
              শর্তাবলীর সেকশনসমূহ (১০টি পূর্ণাঙ্গ সেকশন)
            </h4>

            {/* Sec 1: General Agreement */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <div className="flex items-center gap-2 text-[#D6403B] font-bold text-xs">
                <FileCheck className="w-4 h-4" />
                <span>সেকশন ১</span>
              </div>
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
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
              />
            </div>

            {/* Sec 2: Products & Pricing */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <div className="flex items-center gap-2 text-[#1F6B43] font-bold text-xs">
                <ShoppingBag className="w-4 h-4" />
                <span>সেকশন ২</span>
              </div>
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
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
              />
            </div>

            {/* Sec 3: Orders & Confirmation */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <div className="flex items-center gap-2 text-[#0284C7] font-bold text-xs">
                <FileText className="w-4 h-4" />
                <span>সেকশন ৩</span>
              </div>
              <input
                type="text"
                value={pagesData.terms.section3Title}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section3Title: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
              />
              <textarea
                rows={2}
                value={pagesData.terms.section3Content}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section3Content: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
              />
            </div>

            {/* Sec 4: Payment & COD */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <div className="flex items-center gap-2 text-[#D97706] font-bold text-xs">
                <FileCheck className="w-4 h-4" />
                <span>সেকশন ৪</span>
              </div>
              <input
                type="text"
                value={pagesData.terms.section4Title}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section4Title: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
              />
              <textarea
                rows={2}
                value={pagesData.terms.section4Content}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section4Content: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
              />
            </div>

            {/* Sec 5: Shipping & Delivery */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <div className="flex items-center gap-2 text-[#0284C7] font-bold text-xs">
                <Truck className="w-4 h-4" />
                <span>সেকশন ৫</span>
              </div>
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
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
              />
            </div>

            {/* Sec 6: Return & Replacement */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <div className="flex items-center gap-2 text-[#D6403B] font-bold text-xs">
                <RotateCcw className="w-4 h-4" />
                <span>সেকশন ৬</span>
              </div>
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
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
              />
            </div>

            {/* Sec 7: Safety & Parental Supervision */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <div className="flex items-center gap-2 text-[#D97706] font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>সেকশন ৭</span>
              </div>
              <input
                type="text"
                value={pagesData.terms.section7Title}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section7Title: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
              />
              <textarea
                rows={3}
                value={pagesData.terms.section7Content}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section7Content: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
              />
            </div>

            {/* Sec 8: Intellectual Property */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <div className="flex items-center gap-2 text-[#2B2B2B] font-bold text-xs">
                <FileText className="w-4 h-4" />
                <span>সেকশন ৮</span>
              </div>
              <input
                type="text"
                value={pagesData.terms.section8Title}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section8Title: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
              />
              <textarea
                rows={3}
                value={pagesData.terms.section8Content}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section8Content: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
              />
            </div>

            {/* Sec 9: Governing Law */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <div className="flex items-center gap-2 text-[#1F6B43] font-bold text-xs">
                <Scale className="w-4 h-4" />
                <span>সেকশন ৯</span>
              </div>
              <input
                type="text"
                value={pagesData.terms.section9Title}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section9Title: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
              />
              <textarea
                rows={3}
                value={pagesData.terms.section9Content}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section9Content: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
              />
            </div>

            {/* Sec 10: Contact */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
              <div className="flex items-center gap-2 text-[#D6403B] font-bold text-xs">
                <PhoneCall className="w-4 h-4" />
                <span>সেকশন ১০</span>
              </div>
              <input
                type="text"
                value={pagesData.terms.section10Title}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section10Title: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs font-bold"
              />
              <textarea
                rows={3}
                value={pagesData.terms.section10Content}
                onChange={(e) =>
                  setPagesData({
                    ...pagesData,
                    terms: { ...pagesData.terms, section10Content: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
