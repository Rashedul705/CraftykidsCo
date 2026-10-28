'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Layout,
  PhoneCall,
  Share2,
  Search,
  BarChart3,
  Code,
  Save,
  CheckCircle2,
  ExternalLink,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Globe,
  MessageCircle,
  ShieldCheck,
  Check,
  Copy,
  Image as ImageIcon,
  Upload,
  X,
  Layers,
  ArrowUp,
  ArrowDown,
  ShoppingBag,
  Heart,
  User,
  Gift,
  RotateCcw,
} from 'lucide-react';
import {
  SiteSettings,
  defaultSiteSettings,
  NavMenuItem,
  NavSettings,
  ContactSettings,
  SocialMediaSettings,
  SeoSettings,
  AnalyticsSettings,
  PixelSettings,
  BrandingSettings,
} from '@/lib/site-settings';
import { Button } from '@/components/ui/Button';

type TabKey = 'branding' | 'nav' | 'footer' | 'contact' | 'social' | 'seo' | 'ga4' | 'pixel';

const TABS: Array<{ id: TabKey; label: string; icon: React.ElementType; desc: string }> = [
  { id: 'branding', label: 'Logo & Favicon', icon: Sparkles, desc: 'হেডার, ফুটার লোগো ও ফ্যাভিকন' },
  { id: 'nav', label: 'Navigation', icon: Compass, desc: 'হেডার ও মেনু সেটিংস' },
  { id: 'footer', label: 'Footer', icon: Layout, desc: 'ফুটার ও পেমেন্ট ব্যাজ' },
  { id: 'contact', label: 'Contact', icon: PhoneCall, desc: 'হটলাইন ও কাস্টমার সাপোর্ট' },
  { id: 'social', label: 'Social Media', icon: Share2, desc: 'সোশ্যাল মিডিয়া প্রোফাইল লিঙ্ক' },
  { id: 'seo', label: 'SEO', icon: Search, desc: 'সার্চ ইঞ্জিন মেটা ও ওপেন গ্রাফ' },
  { id: 'ga4', label: 'GA4 & GTM', icon: BarChart3, desc: 'গুগল এনালিটিক্স ও ট্যাগ ম্যানেজার' },
  { id: 'pixel', label: 'Meta Pixel', icon: Code, desc: 'ফেসবুক পিক্সেল ও কনভার্সন ট্র্যাকিং' },
];

export function SiteSettingsManager() {
  const [activeTab, setActiveTab] = useState<TabKey>('branding');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCapiToken, setShowCapiToken] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [uploadingTarget, setUploadingTarget] = useState<'header' | 'footer' | 'favicon' | null>(null);

  // Complete settings state initialized with defaults
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast('ক্লিপবোর্ডে কপি করা হয়েছে!');
  };

  // Load existing settings from API
  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/site-settings');
      const data = await res.json();
      if (data?.success && data?.settings) {
        setSettings({
          ...defaultSiteSettings,
          ...data.settings,
          branding: { ...defaultSiteSettings.branding!, ...(data.settings.branding || {}) },
          announcement: { ...defaultSiteSettings.announcement, ...(data.settings.announcement || {}) },
          footer: { ...defaultSiteSettings.footer, ...(data.settings.footer || {}) },
          nav: {
            ...defaultSiteSettings.nav!,
            ...(data.settings.nav || {}),
            menuItems: Array.isArray(data.settings.nav?.menuItems) && data.settings.nav.menuItems.length > 0
              ? data.settings.nav.menuItems
              : defaultSiteSettings.nav!.menuItems,
          },
          contact: { ...defaultSiteSettings.contact!, ...(data.settings.contact || {}) },
          social: { ...defaultSiteSettings.social!, ...(data.settings.social || {}) },
          seo: { ...defaultSiteSettings.seo!, ...(data.settings.seo || {}) },
          analytics: { ...defaultSiteSettings.analytics!, ...(data.settings.analytics || {}) },
          pixel: { ...defaultSiteSettings.pixel!, ...(data.settings.pixel || {}) },
        });
      }
    } catch (err) {
      console.error('Failed to load site settings:', err);
      showToast('সেটিংস লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Save changes via PUT /api/site-settings
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data?.success) {
        showToast('সকল সাইট সেটিংস সফলভাবে সেভ করা হয়েছে!');
      } else {
        alert(data.message || 'সেটিংস সেভ করতে ব্যর্থ হয়েছে।');
      }
    } catch {
      alert('সার্ভার এরর: সেটিংস সেভ করা সম্ভব হয়নি।');
    } finally {
      setIsSaving(false);
    }
  };

  // State updater helpers
  const updateBranding = (patch: Partial<BrandingSettings>) => {
    setSettings((prev) => {
      const nextBranding = { ...(prev.branding || defaultSiteSettings.branding!), ...patch };
      const nextNav = patch.headerLogoUrl !== undefined
        ? { ...(prev.nav || defaultSiteSettings.nav!), logoUrl: patch.headerLogoUrl }
        : prev.nav;
      const nextFooter = patch.footerLogoUrl !== undefined
        ? { ...prev.footer, logoUrl: patch.footerLogoUrl }
        : prev.footer;
      const nextSeo = patch.faviconUrl !== undefined
        ? { ...(prev.seo || defaultSiteSettings.seo!), faviconUrl: patch.faviconUrl }
        : prev.seo;

      return {
        ...prev,
        branding: nextBranding,
        nav: nextNav,
        footer: nextFooter,
        seo: nextSeo,
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'header' | 'footer' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploadingTarget(target);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', `craftykids_${target}_${Date.now()}`);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data?.success && data?.url) {
        if (target === 'header') {
          updateBranding({ headerLogoUrl: data.url });
        } else if (target === 'footer') {
          updateBranding({ footerLogoUrl: data.url });
        } else if (target === 'favicon') {
          updateBranding({ faviconUrl: data.url });
        }
        showToast('ছবি সফলভাবে আপলোড হয়েছে!');
      } else {
        alert(data?.message || 'ছবি আপলোড করতে ব্যর্থ হয়েছে। সরাসরি ইমেজ লিঙ্ক ব্যবহার করতে পারেন।');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('ছবি আপলোডের সময় সমস্যা হয়েছে। সরাসরি ইমেজ লিঙ্ক ব্যবহার করতে পারেন।');
    } finally {
      setUploadingTarget(null);
    }
  };

  const updateNav = (patch: Partial<NavSettings>) => {
    setSettings((prev) => {
      const nextNav = { ...(prev.nav || defaultSiteSettings.nav!), ...patch };
      const nextBranding = patch.logoUrl !== undefined
        ? { ...(prev.branding || defaultSiteSettings.branding!), headerLogoUrl: patch.logoUrl }
        : prev.branding;
      return {
        ...prev,
        nav: nextNav,
        branding: nextBranding,
      };
    });
  };

  const updateAnnouncement = (patch: Partial<SiteSettings['announcement']>) => {
    setSettings((prev) => ({
      ...prev,
      announcement: { ...prev.announcement, ...patch },
    }));
  };

  const updateFooter = (patch: Partial<SiteSettings['footer']>) => {
    setSettings((prev) => {
      const nextFooter = { ...prev.footer, ...patch };
      const nextBranding = patch.logoUrl !== undefined
        ? { ...(prev.branding || defaultSiteSettings.branding!), footerLogoUrl: patch.logoUrl }
        : prev.branding;
      return {
        ...prev,
        footer: nextFooter,
        branding: nextBranding,
      };
    });
  };

  const updateContact = (patch: Partial<ContactSettings>) => {
    setSettings((prev) => ({
      ...prev,
      contact: { ...(prev.contact || defaultSiteSettings.contact!), ...patch },
    }));
  };

  const updateSocial = (patch: Partial<SocialMediaSettings>) => {
    setSettings((prev) => ({
      ...prev,
      social: { ...(prev.social || defaultSiteSettings.social!), ...patch },
    }));
  };

  const updateSeo = (patch: Partial<SeoSettings>) => {
    setSettings((prev) => {
      const nextSeo = { ...(prev.seo || defaultSiteSettings.seo!), ...patch };
      const nextBranding = patch.faviconUrl !== undefined
        ? { ...(prev.branding || defaultSiteSettings.branding!), faviconUrl: patch.faviconUrl }
        : prev.branding;
      return {
        ...prev,
        seo: nextSeo,
        branding: nextBranding,
      };
    });
  };

  const updateAnalytics = (patch: Partial<AnalyticsSettings>) => {
    setSettings((prev) => ({
      ...prev,
      analytics: { ...(prev.analytics || defaultSiteSettings.analytics!), ...patch },
    }));
  };

  const updatePixel = (patch: Partial<PixelSettings>) => {
    setSettings((prev) => ({
      ...prev,
      pixel: { ...(prev.pixel || defaultSiteSettings.pixel!), ...patch },
    }));
  };

  // Navigation menu item helpers
  const handleAddMenuItem = () => {
    const newItem: NavMenuItem = {
      id: `menu-${Date.now()}`,
      labelBn: 'নতুন মেনু',
      labelEn: 'New Menu',
      href: '/shop',
      enabled: true,
    };
    const current = settings.nav?.menuItems || defaultSiteSettings.nav!.menuItems;
    updateNav({ menuItems: [...current, newItem] });
  };

  const handleUpdateMenuItem = (id: string, patch: Partial<NavMenuItem>) => {
    const current = settings.nav?.menuItems || defaultSiteSettings.nav!.menuItems;
    updateNav({
      menuItems: current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  };

  const handleDeleteMenuItem = (id: string) => {
    const current = settings.nav?.menuItems || defaultSiteSettings.nav!.menuItems;
    updateNav({ menuItems: current.filter((item) => item.id !== id) });
  };

  const handleMoveMenuItem = (index: number, direction: 'up' | 'down') => {
    const current = [...(settings.nav?.menuItems || defaultSiteSettings.nav!.menuItems)];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= current.length) return;
    const [moved] = current.splice(index, 1);
    current.splice(targetIndex, 0, moved);
    updateNav({ menuItems: current });
  };

  const handleResetNavToDefault = () => {
    if (confirm('আপনি কি নেভিগেশন মেনু স্টোরফ্রন্টের মূল ৮টি ডিফল্ট লিঙ্কে রিস্টোর করতে চান?')) {
      updateNav({ menuItems: [...defaultSiteSettings.nav!.menuItems] });
      showToast('নেভিগেশন মেনু সফলভাবে ডিফল্ট ৮টি লিঙ্কে রিস্টোর করা হয়েছে!');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <RefreshCw className="w-8 h-8 text-[#D6403B] animate-spin" />
        <p className="text-sm text-[#6B6B6B] font-semibold">সাইট সেটিংস লোড হচ্ছে...</p>
      </div>
    );
  }

  const currentBranding = settings.branding || defaultSiteSettings.branding!;
  const currentNav = settings.nav || defaultSiteSettings.nav!;
  const currentFooter = settings.footer || defaultSiteSettings.footer;
  const currentContact = settings.contact || defaultSiteSettings.contact!;
  const currentSocial = settings.social || defaultSiteSettings.social!;
  const currentSeo = settings.seo || defaultSiteSettings.seo!;
  const currentAnalytics = settings.analytics || defaultSiteSettings.analytics!;
  const currentPixel = settings.pixel || defaultSiteSettings.pixel!;

  return (
    <div className="space-y-6 max-w-6xl pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-[#1F6B43] text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-[24px] p-6 border border-[#EFE9E0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#D6403B]/10 text-[#D6403B] font-bold text-[11px]">
              Storefront & System Config
            </span>
            <span className="text-xs text-[#888888]">• Auto-syncs to Database</span>
          </div>
          <h2 className="text-xl font-black text-[#2B2B2B]">Site Settings</h2>
          <p className="text-xs text-[#6B6B6B]">
            ওয়েবসাইটের হেডার নেভিগেশন, ফুটার, কন্টাক্ট নম্বর, সোশ্যাল মিডিয়া, এসইও (SEO), গুগল এনালিটিক্স ও মেটা পিক্সেল কনফিগার করুন।
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={loadSettings}
            disabled={isSaving}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>রিলোড</span>
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সেভ করুন'}</span>
          </Button>
        </div>
      </div>

      {/* Modern Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#EFE9E0] no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border-b-2 ${
                isActive
                  ? 'border-[#D6403B] text-[#D6403B] bg-white shadow-xs'
                  : 'border-transparent text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-white/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#D6403B]' : 'text-[#888888]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 0: BRANDING (LOGOS & FAVICON)
         ========================================================================= */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          {/* Header Logo Section */}
          <div className="bg-white rounded-[20px] p-6 border border-[#EFE9E0] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EFE9E0]">
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm text-[#2B2B2B] flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#D6403B]" />
                  <span>হেডার লোগো (Header Logo)</span>
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  ওয়েবসাইটের মূল মেনু বারের বাম পাশে প্রদর্শিত প্রধান ব্র্যান্ড লোগো।
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FAF7F2] text-[#6B6B6B] border border-[#EFE9E0] self-start sm:self-auto">
                Header Branding
              </span>
            </div>

            {/* Live Header Logo Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider block">
                  লাইভ হেডার প্রিভিউ (Live Header Preview)
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#6B6B6B] border border-[#EFE9E0]">
                  {currentBranding.showBrandTextHeader !== false ? '✓ ব্র্যান্ড টেক্সট দৃশ্যমান' : '✗ টেক্সট লুকানো (শুধু লোগো)'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#EFE9E0] shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {currentBranding.headerLogoUrl ? (
                    <img
                      src={currentBranding.headerLogoUrl}
                      alt={currentBranding.logoAlt || currentBranding.brandName || 'Header Logo'}
                      className="h-9 sm:h-10 w-auto max-w-[200px] object-contain"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#D6403B] flex items-center justify-center text-white font-extrabold text-xl shadow-xs shrink-0">
                      C
                    </div>
                  )}
                  {currentBranding.showBrandTextHeader !== false && (
                    <span className="font-heading font-black text-xl text-[#2B2B2B] tracking-tight leading-none">
                      {currentBranding.brandName || 'CraftyKidsCo'}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#888888] hidden sm:inline-block bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-[#EFE9E0]">
                  {currentBranding.headerLogoUrl ? '✓ কাস্টম লোগো সক্রিয়' : 'ডিফল্ট সিগনেচার ব্যাজ'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4 pt-2 text-xs">
              <div>
                <label className="block font-semibold text-[#2B2B2B] mb-1">
                  হেডার লোগো ইমেজ লিঙ্ক (Image URL) অথবা কম্পিউটার থেকে আপলোড
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="url"
                    value={currentBranding.headerLogoUrl || ''}
                    onChange={(e) => updateBranding({ headerLogoUrl: e.target.value })}
                    placeholder="https://.../logo.png অথবা /logo.png"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] font-mono text-[11px] focus:outline-none focus:border-[#D6403B]"
                  />

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="relative cursor-pointer">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                        onChange={(e) => handleFileUpload(e, 'header')}
                        disabled={uploadingTarget === 'header'}
                        className="sr-only"
                      />
                      <span className="px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE9E0] text-[#2B2B2B] font-bold border border-[#EFE9E0] flex items-center gap-1.5 transition-colors cursor-pointer text-xs">
                        {uploadingTarget === 'header' ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D6403B]" />
                            <span>আপলোড হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-[#D6403B]" />
                            <span>ছবি আপলোড</span>
                          </>
                        )}
                      </span>
                    </label>

                    {currentBranding.headerLogoUrl && (
                      <button
                        type="button"
                        onClick={() => updateBranding({ headerLogoUrl: '' })}
                        className="px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold border border-red-200 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                        title="লোগো মুছে ডিফল্ট ব্যাজে ফিরে যান"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>রিসেট</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Brand Name, Alt Text, and Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block font-bold text-[#2B2B2B] mb-1">
                    ব্র্যান্ডের মূল নাম (Brand Name)
                  </label>
                  <input
                    type="text"
                    value={currentBranding.brandName || 'CraftyKidsCo'}
                    onChange={(e) => updateBranding({ brandName: e.target.value })}
                    placeholder="যেমন: CraftyKidsCo"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#EFE9E0] font-bold text-[#2B2B2B] focus:outline-none focus:border-[#D6403B]"
                  />
                  <p className="text-[11px] text-[#888888] mt-1">
                    লোগোর পাশে বড় অক্ষরে প্রদর্শিত ব্র্যান্ড নাম।
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-[#2B2B2B] mb-1">
                    লোগো Alt Text (এসইও এর জন্য)
                  </label>
                  <input
                    type="text"
                    value={currentBranding.logoAlt || currentBranding.brandName || 'CraftyKidsCo'}
                    onChange={(e) => updateBranding({ logoAlt: e.target.value })}
                    placeholder="যেমন: CraftyKidsCo Logo"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                  />
                  <p className="text-[11px] text-[#888888] mt-1">
                    সার্চ ইঞ্জিন (Google SEO) ও স্ক্রিন রিডারের জন্য অল্টারনেটিভ টেক্সট।
                  </p>
                </div>

                <div className="sm:col-span-2 flex flex-col justify-center p-3.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2]">
                  <label className="flex items-start gap-2.5 cursor-pointer font-bold text-xs text-[#2B2B2B]">
                    <input
                      type="checkbox"
                      checked={currentBranding.showBrandTextHeader !== false}
                      onChange={(e) => updateBranding({ showBrandTextHeader: e.target.checked })}
                      className="w-4 h-4 accent-[#D6403B] rounded shrink-0 mt-0.5"
                    />
                    <div>
                      <span className="block text-[#2B2B2B]">
                        লোগোর পাশে ব্র্যান্ড টেক্সট ({currentBranding.brandName || 'CraftyKidsCo'}) দেখান
                      </span>
                      <span className="text-[10px] font-normal text-[#6B6B6B] block mt-0.5">
                        টিক চিহ্ন অন থাকলে লোগো ইমেজের পাশে ব্র্যান্ডের নাম দৃশ্যমান থাকবে।
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <p className="text-[11px] text-[#888888] pt-1">
                💡 <span className="font-semibold text-[#6B6B6B]">পরামর্শ:</span> স্বচ্ছ ব্যাকগ্রাউন্ডের (Transparent PNG বা SVG) ফাইল ব্যবহার করা সবচেয়ে ভালো। প্রস্তাবিত উচ্চতা: 36px - 48px।
              </p>
            </div>
          </div>

          {/* Footer Logo Section */}
          <div className="bg-white rounded-[20px] p-6 border border-[#EFE9E0] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EFE9E0]">
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm text-[#2B2B2B] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#D6403B]" />
                  <span>ফুটার লোগো (Footer Logo)</span>
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  ওয়েবসাইটের নিচের গাঢ় রঙের ফুটারে প্রদর্শিত ব্র্যান্ড লোগো।
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#2B2B2B] text-white self-start sm:self-auto">
                Footer Branding
              </span>
            </div>

            {/* Live Footer Logo Preview on dark background */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider block">
                লাইভ ফুটার প্রিভিউ (Dark Background Preview)
              </span>
              <div className="p-5 rounded-2xl bg-[#2B2B2B] text-white border border-black/20 shadow-md flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {currentBranding.footerLogoUrl || currentBranding.headerLogoUrl ? (
                    <img
                      src={currentBranding.footerLogoUrl || currentBranding.headerLogoUrl}
                      alt={currentBranding.logoAlt || 'Footer Logo'}
                      className="h-8 sm:h-9 w-auto max-w-[200px] object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-[#D6403B] text-white flex items-center justify-center font-extrabold text-lg shrink-0">
                      C
                    </div>
                  )}
                  {currentBranding.showBrandTextFooter !== false && (
                    <span className="font-heading font-black text-xl text-white tracking-tight">
                      {currentBranding.brandName || 'CraftyKidsCo'}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#A0A0A0] hidden sm:inline-block bg-white/10 px-3 py-1 rounded-lg">
                  {currentBranding.footerLogoUrl
                    ? '✓ কাস্টম ফুটার লোগো'
                    : currentBranding.headerLogoUrl
                    ? 'হেডার লোগো অনুকরণ করছে'
                    : 'ডিফল্ট সিগনেচার ব্যাজ'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-3 pt-2 text-xs">
              <label className="block font-semibold text-[#2B2B2B]">
                ফুটার লোগো ইমেজ লিঙ্ক (Image URL) অথবা কম্পিউটার থেকে আপলোড
              </label>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="url"
                  value={currentBranding.footerLogoUrl || ''}
                  onChange={(e) => updateBranding({ footerLogoUrl: e.target.value })}
                  placeholder="https://.../footer-logo-white.png"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] font-mono text-[11px] focus:outline-none focus:border-[#D6403B]"
                />

                <div className="flex items-center gap-2 shrink-0">
                  <label className="relative cursor-pointer">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                      onChange={(e) => handleFileUpload(e, 'footer')}
                      disabled={uploadingTarget === 'footer'}
                      className="sr-only"
                    />
                    <span className="px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE9E0] text-[#2B2B2B] font-bold border border-[#EFE9E0] flex items-center gap-1.5 transition-colors cursor-pointer text-xs">
                      {uploadingTarget === 'footer' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D6403B]" />
                          <span>আপলোড হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-[#D6403B]" />
                          <span>ছবি আপলোড</span>
                        </>
                      )}
                    </span>
                  </label>

                  {currentBranding.headerLogoUrl && !currentBranding.footerLogoUrl && (
                    <button
                      type="button"
                      onClick={() => updateBranding({ footerLogoUrl: currentBranding.headerLogoUrl })}
                      className="px-3 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE9E0] text-[#0B5F85] font-bold border border-[#EFE9E0] transition-colors cursor-pointer text-xs"
                      title="হেডার লোগো ফুটারেও ব্যবহার করুন"
                    >
                      হেডার লোগো কপি
                    </button>
                  )}

                  {currentBranding.footerLogoUrl && (
                    <button
                      type="button"
                      onClick={() => updateBranding({ footerLogoUrl: '' })}
                      className="px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold border border-red-200 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                      title="লোগো মুছে ডিফল্টে ফিরে যান"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>রিসেট</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#2B2B2B]">
                  <input
                    type="checkbox"
                    checked={currentBranding.showBrandTextFooter !== false}
                    onChange={(e) => updateBranding({ showBrandTextFooter: e.target.checked })}
                    className="w-4 h-4 accent-[#D6403B] rounded"
                  />
                  <span>ফুটারে ব্র্যান্ডের নাম টেক্সট (CraftyKidsCo) দেখান</span>
                </label>
              </div>

              <p className="text-[11px] text-[#888888] pt-1">
                💡 <span className="font-semibold text-[#6B6B6B]">পরামর্শ:</span> ফুটার ব্যাকগ্রাউন্ড গাঢ় রঙের (`#2B2B2B`), তাই সাদা বা হালকা রঙের ট্রান্সপারেন্ট লোগো সবচেয়ে উজ্জ্বল দেখাবে।
              </p>
            </div>
          </div>

          {/* Favicon & Browser Icon Section */}
          <div className="bg-white rounded-[20px] p-6 border border-[#EFE9E0] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EFE9E0]">
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm text-[#2B2B2B] flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#D6403B]" />
                  <span>ওয়েবসাইট ফ্যাভিকন (Favicon & Browser Tab Icon)</span>
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  ব্রাউজার ট্যাব, বুকমার্ক বার, গুগল সার্চ রেজাল্ট এবং মোবাইল শর্টকাটে প্রদর্শিত আইকন।
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#1F6B43]/10 text-[#1F6B43]">
                Browser Favicon
              </span>
            </div>

            {/* Realistic Browser Tab Mockup */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider block">
                ব্রাউজার ট্যাব প্রিভিউ (Browser Tab Preview)
              </span>
              <div className="rounded-2xl border border-[#EFE9E0] overflow-hidden bg-[#ECE8DF] shadow-xs max-w-xl">
                {/* Browser top chrome */}
                <div className="px-3 pt-2 pb-0 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 pr-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] inline-block"></span>
                  </div>

                  {/* Active Tab */}
                  <div className="bg-white rounded-t-lg px-3 py-1.5 flex items-center gap-2 shadow-xs max-w-[260px] border-t border-x border-[#E0D8CB]">
                    <img
                      src={currentBranding.faviconUrl || '/favicon.ico'}
                      alt="Favicon"
                      className="w-4 h-4 object-contain rounded-xs shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/favicon.ico';
                      }}
                    />
                    <span className="text-[11px] font-semibold text-[#2B2B2B] truncate">
                      CraftyKidsCo | শিশুদের নিরাপদ মোমের রঙ...
                    </span>
                    <span className="text-[#888888] text-[10px] hover:text-black cursor-default pl-1">
                      ×
                    </span>
                  </div>
                </div>

                {/* Browser Address Bar simulation */}
                <div className="bg-white px-3 py-2 border-t border-[#E0D8CB] flex items-center gap-2 text-[11px] text-[#6B6B6B]">
                  <span className="text-gray-400">🔒</span>
                  <span className="font-mono text-gray-500">https://craftykidsco.com</span>
                </div>
              </div>
            </div>

            {/* Favicon Controls */}
            <div className="space-y-3 pt-2 text-xs">
              <label className="block font-semibold text-[#2B2B2B]">
                ফ্যাভিকন ফাইল পাথ (Favicon URL) অথবা কম্পিউটার থেকে আপলোড
              </label>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={currentBranding.faviconUrl || '/favicon.ico'}
                  onChange={(e) => updateBranding({ faviconUrl: e.target.value })}
                  placeholder="/favicon.ico অথবা https://.../favicon.png"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] font-mono text-[11px] focus:outline-none focus:border-[#D6403B]"
                />

                <div className="flex items-center gap-2 shrink-0">
                  <label className="relative cursor-pointer">
                    <input
                      type="file"
                      accept=".ico,.png,.svg,.webp,.jpg"
                      onChange={(e) => handleFileUpload(e, 'favicon')}
                      disabled={uploadingTarget === 'favicon'}
                      className="sr-only"
                    />
                    <span className="px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE9E0] text-[#2B2B2B] font-bold border border-[#EFE9E0] flex items-center gap-1.5 transition-colors cursor-pointer text-xs">
                      {uploadingTarget === 'favicon' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D6403B]" />
                          <span>আপলোড হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-[#D6403B]" />
                          <span>ফ্যাভিকন আপলোড</span>
                        </>
                      )}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => updateBranding({ faviconUrl: '/favicon.ico' })}
                    className="px-3 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE9E0] text-[#2B2B2B] font-bold border border-[#EFE9E0] transition-colors cursor-pointer text-xs"
                    title="সাইটের বর্তমান মূল ফ্যাভিকনে রিসেট করুন"
                  >
                    ডিফল্ট /favicon.ico
                  </button>
                </div>
              </div>

              {/* Quick Select Preset Icons */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span className="font-semibold text-[#6B6B6B]">প্রিসেট সিলেক্ট:</span>
                <button
                  type="button"
                  onClick={() => updateBranding({ faviconUrl: '/favicon.ico' })}
                  className={`px-2.5 py-1 rounded-lg border font-mono ${
                    currentBranding.faviconUrl === '/favicon.ico'
                      ? 'bg-[#D6403B]/10 border-[#D6403B] text-[#D6403B] font-bold'
                      : 'bg-[#FAF7F2] border-[#EFE9E0] text-[#6B6B6B] hover:text-[#2B2B2B]'
                  }`}
                >
                  /favicon.ico
                </button>
                <button
                  type="button"
                  onClick={() => updateBranding({ faviconUrl: '/favicon.svg' })}
                  className={`px-2.5 py-1 rounded-lg border font-mono ${
                    currentBranding.faviconUrl === '/favicon.svg'
                      ? 'bg-[#D6403B]/10 border-[#D6403B] text-[#D6403B] font-bold'
                      : 'bg-[#FAF7F2] border-[#EFE9E0] text-[#6B6B6B] hover:text-[#2B2B2B]'
                  }`}
                >
                  /favicon.svg (ভেক্টর)
                </button>
                <button
                  type="button"
                  onClick={() => updateBranding({ faviconUrl: '/icon.png' })}
                  className={`px-2.5 py-1 rounded-lg border font-mono ${
                    currentBranding.faviconUrl === '/icon.png'
                      ? 'bg-[#D6403B]/10 border-[#D6403B] text-[#D6403B] font-bold'
                      : 'bg-[#FAF7F2] border-[#EFE9E0] text-[#6B6B6B] hover:text-[#2B2B2B]'
                  }`}
                >
                  /icon.png (PNG)
                </button>
              </div>

              <div className="pt-2">
                <label className="block font-semibold text-[#2B2B2B] mb-1">
                  Apple Touch Icon (আইফোন ও আইপ্যাডের হোমস্ক্রিন আইকন)
                </label>
                <input
                  type="text"
                  value={currentBranding.appleTouchIconUrl || '/apple-icon.png'}
                  onChange={(e) => updateBranding({ appleTouchIconUrl: e.target.value })}
                  placeholder="/apple-icon.png"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EFE9E0] font-mono text-[11px] focus:outline-none focus:border-[#D6403B]"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>ব্রাউজার ক্যাশ সতর্কতা:</strong> ব্রাউজার ফ্যাভিকন খুব শক্তিশালীভাবে মেমোরিতে ক্যাশ করে রাখে। সেভ করার পর নতুন আইকনটি দেখতে না পেলে কিবোর্ডে <strong>Cmd + Shift + R</strong> (ম্যাক) অথবা <strong>Ctrl + Shift + R</strong> (উইন্ডোজ) চেপে ব্রাউজার হার্ড রিফ্রেশ করুন।
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 1: NAVIGATION & HEADER
         ========================================================================= */}
      {activeTab === 'nav' && (
        <div className="space-y-6">
          {/* =========================================================================
              LIVE STOREFRONT NAVBAR PREVIEW (EXACT REPLICA OF STOREFRONT)
             ========================================================================= */}
          <div className="bg-white rounded-[20px] p-6 border border-[#EFE9E0] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EFE9E0]">
              <div>
                <h3 className="font-bold text-sm text-[#2B2B2B] flex items-center gap-2">
                  <Layout className="w-4 h-4 text-[#D6403B]" />
                  <span>লাইভ স্টোরফ্রন্ট নেভিগেশন বার প্রিভিউ (Storefront Navbar Preview)</span>
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  স্টোরফ্রন্টের মূল হেডার ও নিচের ক্যাটাগরি মেনু বার হুবহু দেখতে এমন হবে (নিচের মেনু এডিট করলে সাথে সাথে প্রিভিউ পরিবর্তিত হবে)।
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('branding')}
                  className="text-xs font-bold text-[#D6403B] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>লোগো ও ব্র্যান্ড টেক্সট সেটিংস</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Visual Frame of the Navbar */}
            <div className="rounded-2xl border border-[#EFE9E0] shadow-sm overflow-hidden bg-white">
              {/* 1. Top Announcement Bar */}
              {settings.announcement.enabled && (
                <div className="bg-[#2B2B2B] text-white py-1.5 px-3 sm:px-4 text-[11px] font-medium flex items-center justify-between border-b border-black/10">
                  <div className="flex items-center gap-3 text-xs text-[#E0E0E0] truncate">
                    <span className="flex items-center gap-1.5">
                      <PhoneCall className="w-3 h-3 text-[#D6403B] shrink-0" />
                      <span>হটলাইন: {settings.announcement.hotline || '01731-376498'}</span>
                    </span>
                    <span className="hidden sm:inline text-white/20">|</span>
                    <span className="flex items-center gap-1 text-[#25D366] shrink-0">
                      <MessageCircle className="w-3 h-3" />
                      <span>হোয়াটসঅ্যাপ: {settings.announcement.whatsapp || '01731-376498'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[#CCCCCC] text-[10px] sm:text-[11px] shrink-0">
                    {currentNav.showTrackOrder !== false && (
                      <span className="inline">অর্ডার ট্র্যাক করুন</span>
                    )}
                    {currentNav.showTrackOrder !== false && currentNav.showContact !== false && (
                      <span className="inline text-white/30">•</span>
                    )}
                    {currentNav.showContact !== false && (
                      <span className="inline">Contact Us</span>
                    )}
                  </div>
                </div>
              )}

              {/* 2. Main Header (Logo, Search, Cart) */}
              <div className="p-3 sm:p-4 bg-white flex items-center justify-between gap-3 border-b border-[#EFE9E0]">
                {/* Logo & Brand text */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {currentBranding.headerLogoUrl ? (
                    <img
                      src={currentBranding.headerLogoUrl}
                      alt={currentBranding.logoAlt || 'Logo'}
                      className="h-8 sm:h-9 w-auto max-w-[140px] object-contain"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-[#D6403B] flex items-center justify-center text-white font-extrabold text-lg shadow-xs shrink-0">
                      C
                    </div>
                  )}
                  {currentBranding.showBrandTextHeader !== false && (
                    <span className="font-heading font-black text-lg sm:text-xl text-[#2B2B2B] tracking-tight leading-none">
                      {currentBranding.brandName || 'CraftyKidsCo'}
                    </span>
                  )}
                </div>

                {/* Search Bar Replica */}
                <div className="flex-1 max-w-md mx-2 hidden sm:flex relative items-center">
                  <div className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] text-xs text-[#6B6B6B]">
                    খেলনা, মোমের রঙ বা আর্ট কিট খুঁজুন...
                  </div>
                  <div className="absolute right-1 p-1.5 rounded-lg bg-[#D6403B] text-white">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Right Actions: Wishlist, Login, Cart */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="p-2 rounded-xl text-[#6B6B6B] hidden md:flex items-center justify-center">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div className="p-2 rounded-xl text-[#6B6B6B] hidden sm:flex items-center justify-center gap-1 text-xs font-bold">
                    <User className="w-4 h-4" />
                    <span>লগইন</span>
                  </div>
                  <div className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-[#D6403B] text-white shadow-xs">
                    <div className="relative">
                      <ShoppingBag className="w-4 h-4" />
                      <span className="absolute -top-2 -right-2 bg-white text-[#D6403B] text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-xs">
                        2
                      </span>
                    </div>
                    <div className="hidden sm:flex flex-col text-left leading-tight">
                      <span className="text-[9px] text-white/80">Cart</span>
                      <span className="text-[11px] font-extrabold">৳১,৬০০</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Secondary Category Menu Bar (Exact replica showing currentNav.menuItems) */}
              <div className="bg-[#FAF7F2] px-4 py-2 border-t border-[#EFE9E0] overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-5 sm:gap-7 text-xs font-bold text-[#2B2B2B] whitespace-nowrap">
                  {currentNav.menuItems
                    .filter((item) => item.enabled !== false)
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-1 cursor-default ${
                          item.isHighlight
                            ? 'text-[#D6403B] font-extrabold'
                            : 'hover:text-[#D6403B]'
                        }`}
                      >
                        {item.badge && <span className="text-xs">{item.badge}</span>}
                        <span>{item.labelBn}</span>
                      </div>
                    ))}
                  {currentNav.menuItems.filter((item) => item.enabled !== false).length === 0 && (
                    <span className="text-xs text-gray-400 italic">কোনো মেনু লিঙ্ক সক্রিয় নেই</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 1. Main Navigation Menu Links Editor */}
          <div className="bg-white rounded-[20px] p-6 border border-[#EFE9E0] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EFE9E0]">
              <div>
                <h3 className="font-bold text-sm text-[#2B2B2B] flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#D6403B]" />
                  <span>প্রধান নেভিগেশন মেনু লিঙ্ক (Storefront Menu Items)</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#6B6B6B] border border-[#EFE9E0]">
                    মোট {currentNav.menuItems.length}টি লিঙ্ক
                  </span>
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  স্টোরফ্রন্টের মূল ক্যাটাগরি ও পেজ লিঙ্কগুলো সাজান, নতুন লিঙ্ক যুক্ত করুন অথবা ডিফল্ট ৮টি লিঙ্কে রিস্টোর করুন।
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleResetNavToDefault}
                  className="flex items-center gap-1 text-xs cursor-pointer"
                  title="স্টোরফ্রন্টের মূল ৮টি ডিফল্ট লিঙ্ক ফিরিয়ে আনুন"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ডিফল্ট ৮টি লিঙ্ক</span>
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAddMenuItem}
                  className="flex items-center gap-1 text-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন মেনু লিঙ্ক</span>
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {currentNav.menuItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    item.enabled
                      ? 'border-[#EFE9E0] bg-[#FAF7F2]'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    {/* Index & Reorder Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="w-6 h-6 rounded-lg bg-white border border-[#EFE9E0] text-[11px] font-bold flex items-center justify-center text-[#6B6B6B]">
                        {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMoveMenuItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded-md hover:bg-white text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                        title="উপরে সরান"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveMenuItem(index, 'down')}
                        disabled={index === currentNav.menuItems.length - 1}
                        className="p-1 rounded-md hover:bg-white text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                        title="নিচে সরান"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1 w-full text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#6B6B6B] mb-0.5">
                          লেবেল (বাংলা)
                        </label>
                        <input
                          type="text"
                          value={item.labelBn}
                          onChange={(e) => handleUpdateMenuItem(item.id, { labelBn: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#6B6B6B] mb-0.5">
                          Label (English)
                        </label>
                        <input
                          type="text"
                          value={item.labelEn}
                          onChange={(e) => handleUpdateMenuItem(item.id, { labelEn: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#6B6B6B] mb-0.5">
                          লিঙ্ক URL (Href)
                        </label>
                        <input
                          type="text"
                          value={item.href}
                          onChange={(e) => handleUpdateMenuItem(item.id, { href: e.target.value })}
                          placeholder="/category/..."
                          className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white text-[#0B5F85] font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#6B6B6B] mb-0.5">
                          ব্যাজ / ইমোজি (Badge)
                        </label>
                        <input
                          type="text"
                          value={item.badge || ''}
                          onChange={(e) => handleUpdateMenuItem(item.id, { badge: e.target.value })}
                          placeholder="যেমন: 🎁 অথবা Hot"
                          className="w-full px-3 py-1.5 rounded-lg border border-[#EFE9E0] bg-white"
                        />
                      </div>
                    </div>

                    {/* Actions: Highlight, Enabled, Delete */}
                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      <label className="flex items-center gap-1.5 text-xs text-[#2B2B2B] cursor-pointer" title="মেনুতে লাল রঙে হাইলাইট করুন">
                        <input
                          type="checkbox"
                          checked={item.isHighlight || false}
                          onChange={(e) => handleUpdateMenuItem(item.id, { isHighlight: e.target.checked })}
                          className="w-4 h-4 accent-[#D6403B] rounded"
                        />
                        <span className="text-[11px] font-medium text-[#D6403B]">হাইলাইট</span>
                      </label>

                      <label className="flex items-center gap-1.5 text-xs text-[#2B2B2B] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(e) => handleUpdateMenuItem(item.id, { enabled: e.target.checked })}
                          className="w-4 h-4 accent-[#D6403B] rounded"
                        />
                        <span className="text-[11px] font-bold">সক্রিয়</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleDeleteMenuItem(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Top Bar Settings */}
          <div className="bg-white rounded-[20px] p-6 border border-[#EFE9E0] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm text-[#2B2B2B] flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-[#D6403B]" />
                  <span>টপ বার সেটিংস (Top Bar Settings)</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      settings.announcement.enabled ? 'bg-[#1F6B43]/10 text-[#1F6B43]' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {settings.announcement.enabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  ওয়েবসাইটের একদম উপরে হটলাইন, হোয়াটসঅ্যাপ ও জরুরি যোগাযোগের কালো বার।
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.announcement.enabled}
                  onChange={(e) => updateAnnouncement({ enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1F6B43]"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                  টপ বার হটলাইন নম্বর (Hotline)
                </label>
                <input
                  type="text"
                  value={settings.announcement.hotline}
                  onChange={(e) => {
                    updateAnnouncement({ hotline: e.target.value });
                    updateNav({ hotline: e.target.value });
                  }}
                  placeholder="01731-376498"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                />
                <p className="text-[11px] text-[#888888] mt-1">
                  টপ বারে ক্লিক করলে সরাসরি কল করার নম্বর।
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                  টপ বার WhatsApp নম্বর
                </label>
                <input
                  type="text"
                  value={settings.announcement.whatsapp}
                  onChange={(e) => {
                    updateAnnouncement({ whatsapp: e.target.value });
                    updateNav({ whatsapp: e.target.value });
                  }}
                  placeholder="01731-376498"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                />
                <p className="text-[11px] text-[#888888] mt-1">
                  টপ বারে হোয়াটসঅ্যাপ চ্যাট ওপেন করার নম্বর।
                </p>
              </div>
            </div>
          </div>

          {/* 3. Header Extra Controls */}
          <div className="bg-white rounded-[20px] p-6 border border-[#EFE9E0] shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#2B2B2B]">হেডার কন্ট্রোল ও ফিচার টগল</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] cursor-pointer">
                <div>
                  <span className="font-bold text-[#2B2B2B] block">ট্র্যাক অর্ডার বাটন</span>
                  <span className="text-[11px] text-[#6B6B6B]">টপ বারে 'Track Order' লিংক</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentNav.showTrackOrder !== false}
                  onChange={(e) => updateNav({ showTrackOrder: e.target.checked })}
                  className="w-4 h-4 accent-[#D6403B] rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] cursor-pointer">
                <div>
                  <span className="font-bold text-[#2B2B2B] block">কন্টাক্ট বাটন</span>
                  <span className="text-[11px] text-[#6B6B6B]">টপ বারে 'Contact Us' লিংক</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentNav.showContact !== false}
                  onChange={(e) => updateNav({ showContact: e.target.checked })}
                  className="w-4 h-4 accent-[#D6403B] rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] cursor-pointer">
                <div>
                  <span className="font-bold text-[#2B2B2B] block">উইশলিস্ট আইকন</span>
                  <span className="text-[11px] text-[#6B6B6B]">পছন্দের তালিকা শর্টকাট</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentNav.showWishlist}
                  onChange={(e) => updateNav({ showWishlist: e.target.checked })}
                  className="w-4 h-4 accent-[#D6403B] rounded"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: FOOTER
         ========================================================= */}
      {activeTab === 'footer' && (
        <div className="space-y-6">
          {/* Footer Brand Logo */}
          <div className="bg-white rounded-[20px] p-6 border border-[#EFE9E0] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm text-[#2B2B2B] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#D6403B]" />
                  <span>ফুটার লোগো (Footer Logo)</span>
                </h3>
                <p className="text-xs text-[#6B6B6B]">ফুটারে প্রদর্শিত ব্র্যান্ড লোগো পরিবর্তন ও আপলোড করুন।</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('branding')}
                className="text-xs font-bold text-[#D6403B] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>সম্পূর্ণ লোগো সেটিংসে যান</span>
                <span>→</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="p-3 rounded-xl bg-[#2B2B2B] text-white flex items-center justify-center shrink-0">
                {currentBranding.footerLogoUrl || currentBranding.headerLogoUrl ? (
                  <img
                    src={currentBranding.footerLogoUrl || currentBranding.headerLogoUrl}
                    alt="Footer Logo"
                    className="h-8 w-auto max-w-[140px] object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#D6403B] text-white flex items-center justify-center font-extrabold text-base">
                    C
                  </div>
                )}
              </div>
              <div className="flex-1 w-full space-y-1.5 text-xs">
                <label className="font-semibold text-[#2B2B2B] block">ফুটার লোগো লিঙ্ক (Image URL)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={currentBranding.footerLogoUrl || ''}
                    onChange={(e) => updateBranding({ footerLogoUrl: e.target.value })}
                    placeholder="https://.../footer-logo.png"
                    className="flex-1 px-3 py-2 rounded-xl border border-[#EFE9E0] font-mono text-[11px] focus:outline-none focus:border-[#D6403B]"
                  />
                  <label className="relative cursor-pointer shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'footer')}
                      disabled={uploadingTarget === 'footer'}
                      className="sr-only"
                    />
                    <span className="px-3 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE9E0] text-[#2B2B2B] font-bold border border-[#EFE9E0] flex items-center gap-1 text-xs cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-[#D6403B]" />
                      <span>{uploadingTarget === 'footer' ? 'আপলোড হচ্ছে...' : 'আপলোড'}</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[20px] p-6 border border-[#EFE9E0] shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#2B2B2B]">ফুটার ইনফরমেশন ও কন্টেন্ট</h3>
            <p className="text-xs text-[#6B6B6B]">
              ওয়েবসাইটের নিচের ফুটারে প্রদর্শিত সংক্ষিপ্ত পরিচিতি, ঠিকানা ও কপিরাইট টেক্সট।
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#2B2B2B] mb-1">
                  ব্র্যান্ড সংক্ষিপ্ত বিবরণ (About Short Text - বাংলা)
                </label>
                <textarea
                  rows={2}
                  value={currentFooter.aboutBn}
                  onChange={(e) => updateFooter({ aboutBn: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#2B2B2B] mb-1">
                    কাস্টমার সার্ভিস ফোন / হটলাইন
                  </label>
                  <input
                    type="text"
                    value={currentFooter.phone}
                    onChange={(e) => updateFooter({ phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2B2B2B] mb-1">
                    সাপোর্ট ইমেইল এড্রেস
                  </label>
                  <input
                    type="email"
                    value={currentFooter.email}
                    onChange={(e) => updateFooter({ email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#2B2B2B] mb-1">
                  অফিস / ওয়্যারহাউজ ঠিকানা
                </label>
                <input
                  type="text"
                  value={currentFooter.address}
                  onChange={(e) => updateFooter({ address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#2B2B2B] mb-1">
                  কপিরাইট নোটিশ (Copyright Text)
                </label>
                <input
                  type="text"
                  value={currentFooter.copyrightText}
                  onChange={(e) => updateFooter({ copyrightText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                />
              </div>
            </div>

            {/* Payment badges toggle */}
            <div className="pt-4 border-t border-[#EFE9E0] flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-[#2B2B2B] block">পেমেন্ট মেথড ব্যাজ (Payment Badges)</span>
                <span className="text-[11px] text-[#6B6B6B]">ফুটারে bKash, Nagad, Visa, Mastercard ও COD ব্যাজ প্রদর্শন</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-white border border-[#EFE9E0] text-[10px] font-black">bKash</span>
                <span className="px-2 py-0.5 rounded bg-[#D6403B] text-white text-[10px] font-black">Nagad</span>
                <span className="px-2 py-0.5 rounded bg-[#1A1F71] text-white text-[10px] font-bold">VISA</span>
                <span className="px-2 py-0.5 rounded bg-[#444] text-white text-[10px] font-bold">COD</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: CONTACT & SUPPORT
         ========================================================================= */}
      {activeTab === 'contact' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[20px] p-6 border border-[#EFE9E0] shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#2B2B2B]">গ্রাহক সেবা ও যোগাযোগ তথ্য</h3>
            <p className="text-xs text-[#6B6B6B]">
              সারা দেশের কাস্টমারদের সহায়তায় সরাসরি কল, হোয়াটসঅ্যাপ ও সাপোর্ট চ্যানেল কনফিগার করুন।
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#2B2B2B] mb-1">
                  প্রধান হটলাইন নম্বর (Click-to-Call)
                </label>
                <div className="relative">
                  <PhoneCall className="w-4 h-4 absolute left-3 top-3 text-[#D6403B]" />
                  <input
                    type="text"
                    value={currentContact.hotline}
                    onChange={(e) => updateContact({ hotline: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#2B2B2B] mb-1">
                  অফিসিয়াল WhatsApp নম্বর (Direct Chat)
                </label>
                <div className="relative">
                  <MessageCircle className="w-4 h-4 absolute left-3 top-3 text-[#25D366]" />
                  <input
                    type="text"
                    value={currentContact.whatsapp}
                    onChange={(e) => updateContact({ whatsapp: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#2B2B2B] mb-1">
                  সাপোর্ট ইমেইল (Customer Email)
                </label>
                <input
                  type="email"
                  value={currentContact.email}
                  onChange={(e) => updateContact({ email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#2B2B2B] mb-1">
                  সেবা সময়সূচী (Opening Hours)
                </label>
                <input
                  type="text"
                  value={currentContact.openingHours}
                  onChange={(e) => updateContact({ openingHours: e.target.value })}
                  placeholder="সকাল ৯:০০ - রাত ১০:০০ (প্রতিদিন)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-[#2B2B2B] mb-1">
                  স্টোর / ওয়্যারহাউজ পূর্ণাঙ্গ ঠিকানা
                </label>
                <input
                  type="text"
                  value={currentContact.address}
                  onChange={(e) => updateContact({ address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-[#2B2B2B] mb-1">
                  জরুরি নোটিশ / ডেলিভারি আপডেট (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={currentContact.emergencyNotice || ''}
                  onChange={(e) => updateContact({ emergencyNotice: e.target.value })}
                  placeholder="e.g. ঈদের ছুটির কারণে ১২ তারিখের পর সকল ডেলিভারি শুরু হবে।"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                />
              </div>
            </div>

            {/* Floating WhatsApp Widget Settings */}
            <div className="pt-4 border-t border-[#EFE9E0] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-[#2B2B2B] block">
                    ফ্লোটিং WhatsApp উইজেট (Floating WhatsApp Button)
                  </span>
                  <span className="text-[11px] text-[#6B6B6B]">
                    স্ক্রিনের নিচের ডান কোণে ভাসমান WhatsApp চ্যাট বাটন দেখাবে
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentContact.enableFloatingWhatsApp}
                    onChange={(e) => updateContact({ enableFloatingWhatsApp: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                </label>
              </div>

              {currentContact.enableFloatingWhatsApp && (
                <div>
                  <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                    ডিফল্ট মেসেজ প্রম্পট (Customer Default Message)
                  </label>
                  <input
                    type="text"
                    value={currentContact.whatsappDefaultMessage || ''}
                    onChange={(e) => updateContact({ whatsappDefaultMessage: e.target.value })}
                    placeholder="হ্যালো CraftyKidsCo, আমি পণ্য সম্পর্কে জানতে চাই।"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: SOCIAL MEDIA LINKS
         ========================================================================= */}
      {activeTab === 'social' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[20px] p-6 border border-[#EFE9E0] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EFE9E0]">
              <div>
                <h3 className="font-bold text-sm text-[#2B2B2B]">সোশ্যাল মিডিয়া প্রোফাইল ও গ্রুপ লিঙ্ক</h3>
                <p className="text-xs text-[#6B6B6B]">
                  গ্রাহকদের সাথে এনগেজমেন্ট বাড়াতে অফিসিয়াল সোশ্যাল হ্যান্ডেলসমূহ যুক্ত করুন।
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-[#2B2B2B]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentSocial.showInHeader}
                    onChange={(e) => updateSocial({ showInHeader: e.target.checked })}
                    className="w-4 h-4 accent-[#D6403B] rounded"
                  />
                  <span>হেডারে দেখান</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentSocial.showInFooter}
                    onChange={(e) => updateSocial({ showInFooter: e.target.checked })}
                    className="w-4 h-4 accent-[#D6403B] rounded"
                  />
                  <span>ফুটারে দেখান</span>
                </label>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Facebook Page */}
              <div>
                <label className="block font-semibold text-[#2B2B2B] mb-1">Facebook Page URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={currentSocial.facebookPage}
                    onChange={(e) => updateSocial({ facebookPage: e.target.value })}
                    placeholder="https://facebook.com/craftykidsco.bd"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] font-mono text-[11px] focus:outline-none focus:border-[#D6403B]"
                  />
                  {currentSocial.facebookPage && (
                    <a
                      href={currentSocial.facebookPage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] text-[#0B5F85] font-bold hover:bg-[#EFE9E0] flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>টেস্ট</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Facebook Group */}
              <div>
                <label className="block font-semibold text-[#2B2B2B] mb-1">
                  Facebook Community / Group URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={currentSocial.facebookGroup}
                    onChange={(e) => updateSocial({ facebookGroup: e.target.value })}
                    placeholder="https://facebook.com/groups/craftykidsco"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] font-mono text-[11px] focus:outline-none focus:border-[#D6403B]"
                  />
                  {currentSocial.facebookGroup && (
                    <a
                      href={currentSocial.facebookGroup}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] text-[#0B5F85] font-bold hover:bg-[#EFE9E0] flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>টেস্ট</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Instagram */}
              <div>
                <label className="block font-semibold text-[#2B2B2B] mb-1">Instagram Profile URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={currentSocial.instagram}
                    onChange={(e) => updateSocial({ instagram: e.target.value })}
                    placeholder="https://instagram.com/craftykidsco"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] font-mono text-[11px] focus:outline-none focus:border-[#D6403B]"
                  />
                  {currentSocial.instagram && (
                    <a
                      href={currentSocial.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] text-[#0B5F85] font-bold hover:bg-[#EFE9E0] flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>টেস্ট</span>
                    </a>
                  )}
                </div>
              </div>

              {/* YouTube */}
              <div>
                <label className="block font-semibold text-[#2B2B2B] mb-1">YouTube Channel URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={currentSocial.youtube}
                    onChange={(e) => updateSocial({ youtube: e.target.value })}
                    placeholder="https://youtube.com/@craftykidsco"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] font-mono text-[11px] focus:outline-none focus:border-[#D6403B]"
                  />
                  {currentSocial.youtube && (
                    <a
                      href={currentSocial.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] text-[#0B5F85] font-bold hover:bg-[#EFE9E0] flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>টেস্ট</span>
                    </a>
                  )}
                </div>
              </div>

              {/* TikTok */}
              <div>
                <label className="block font-semibold text-[#2B2B2B] mb-1">TikTok Profile URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={currentSocial.tiktok}
                    onChange={(e) => updateSocial({ tiktok: e.target.value })}
                    placeholder="https://tiktok.com/@craftykidsco"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] font-mono text-[11px] focus:outline-none focus:border-[#D6403B]"
                  />
                  {currentSocial.tiktok && (
                    <a
                      href={currentSocial.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] text-[#0B5F85] font-bold hover:bg-[#EFE9E0] flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>টেস্ট</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: SEO (SEARCH ENGINE OPTIMIZATION)
         ========================================================================= */}
      {activeTab === 'seo' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[20px] p-6 border border-[#EFE9E0] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
              <div>
                <h3 className="font-bold text-sm text-[#2B2B2B]">সার্চ ইঞ্জিন অপ্টিমাইজেশন (SEO & Meta Tags)</h3>
                <p className="text-xs text-[#6B6B6B]">
                  গুগল সার্চ ও সোশ্যাল মিডিয়া শেয়ারে ওয়েবসাইটের শিরোনাম, বিবরণ ও প্রিভিউ ছবি।
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-[#2B2B2B] cursor-pointer">
                <span>Google Indexing (Robots)</span>
                <input
                  type="checkbox"
                  checked={currentSeo.allowRobotsIndex}
                  onChange={(e) => updateSeo({ allowRobotsIndex: e.target.checked })}
                  className="w-4 h-4 accent-[#1F6B43] rounded"
                />
              </label>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-[#2B2B2B]">
                    ডিফল্ট মেটা টাইটেল (Meta Title - বাংলা)
                  </label>
                  <span className="text-[10px] text-[#888888]">
                    {currentSeo.metaTitleBn.length} অক্ষর (অনুকূল: ৫০-৬০)
                  </span>
                </div>
                <input
                  type="text"
                  value={currentSeo.metaTitleBn}
                  onChange={(e) => updateSeo({ metaTitleBn: e.target.value })}
                  placeholder="CraftyKidsCo | শিশুদের নিরাপদ মোমের রঙ ও খেলনা"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-[#2B2B2B]">
                    Default Meta Title (English)
                  </label>
                  <span className="text-[10px] text-[#888888]">
                    {currentSeo.metaTitleEn.length} chars
                  </span>
                </div>
                <input
                  type="text"
                  value={currentSeo.metaTitleEn}
                  onChange={(e) => updateSeo({ metaTitleEn: e.target.value })}
                  placeholder="CraftyKidsCo | Safe Child Crayons & Educational Toys Bangladesh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-[#2B2B2B]">
                    মেটা বিবরণী (Meta Description - বাংলা)
                  </label>
                  <span className="text-[10px] text-[#888888]">
                    {currentSeo.metaDescriptionBn.length} অক্ষর (অনুকূল: ১৫০-১৬০)
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={currentSeo.metaDescriptionBn}
                  onChange={(e) => updateSeo({ metaDescriptionBn: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#2B2B2B] mb-1">
                  কীওয়ার্ডসমূহ (Keywords - কমা দিয়ে আলাদা করুন)
                </label>
                <input
                  type="text"
                  value={currentSeo.metaKeywords}
                  onChange={(e) => updateSeo({ metaKeywords: e.target.value })}
                  placeholder="CraftyKidsCo, মোমের রঙ, beeswax crayons bd, safe toys, plaster art kit"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#2B2B2B] mb-1">
                    ক্যানোনিকাল সাইট URL (Base Site URL)
                  </label>
                  <input
                    type="url"
                    value={currentSeo.siteUrl}
                    onChange={(e) => updateSeo({ siteUrl: e.target.value })}
                    placeholder="https://craftykidsco.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] font-mono text-[11px] focus:outline-none focus:border-[#D6403B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2B2B2B] mb-1">
                    ওপেন গ্রাফ শেয়ার ছবি URL (OG Image for Facebook/WhatsApp)
                  </label>
                  <input
                    type="url"
                    value={currentSeo.ogImageUrl}
                    onChange={(e) => updateSeo({ ogImageUrl: e.target.value })}
                    placeholder="https://.../og-preview.jpg"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] font-mono text-[11px] focus:outline-none focus:border-[#D6403B]"
                  />
                </div>
              </div>

              {/* Favicon quick setting */}
              <div className="pt-3 border-t border-[#EFE9E0] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#2B2B2B]">
                    ওয়েবসাইট ফ্যাভিকন (Browser Favicon)
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('branding')}
                    className="text-xs font-bold text-[#D6403B] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>লোগো ও ফ্যাভিকন সেটিংসে যান →</span>
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentBranding.faviconUrl || '/favicon.ico'}
                    onChange={(e) => updateBranding({ faviconUrl: e.target.value })}
                    placeholder="/favicon.ico"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-[#EFE9E0] font-mono text-[11px] focus:outline-none focus:border-[#D6403B]"
                  />
                  <label className="relative cursor-pointer shrink-0">
                    <input
                      type="file"
                      accept=".ico,.png,.svg,.webp"
                      onChange={(e) => handleFileUpload(e, 'favicon')}
                      disabled={uploadingTarget === 'favicon'}
                      className="sr-only"
                    />
                    <span className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE9E0] text-[#2B2B2B] font-bold border border-[#EFE9E0] flex items-center gap-1 text-xs cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-[#D6403B]" />
                      <span>{uploadingTarget === 'favicon' ? 'আপলোড হচ্ছে...' : 'আপলোড'}</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Google SERP Preview Card */}
              <div className="pt-3 border-t border-[#EFE9E0]">
                <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider block mb-2">
                  গুগল সার্চ রেজাল্ট প্রিভিউ (Google Search Preview)
                </span>
                <div className="p-4 rounded-xl bg-white border border-[#EFE9E0] shadow-xs space-y-1 max-w-xl">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#4D5156]">
                    {currentBranding.faviconUrl ? (
                      <img
                        src={currentBranding.faviconUrl}
                        alt="Favicon"
                        className="w-4 h-4 rounded-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/favicon.ico';
                        }}
                      />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-[#D6403B] text-white flex items-center justify-center font-bold text-[9px]">
                        C
                      </span>
                    )}
                    <span className="truncate">{currentSeo.siteUrl || 'https://craftykidsco.com'}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-[#1A0DAB] hover:underline cursor-pointer">
                    {currentSeo.metaTitleBn || 'CraftyKidsCo | শিশুদের নিরাপদ মোমের রঙ ও খেলনা'}
                  </h4>
                  <p className="text-xs text-[#4D5156] line-clamp-2 leading-relaxed">
                    {currentSeo.metaDescriptionBn ||
                      'বাংলাদেশের শিশুদের জন্য ১০০% নিরাপদ খাদ্য-গ্রেড মৌচাকের মোমে তৈরি রঙ, ওয়াশেবল প্লাস্টার পেইন্টিং কিট এবং খেলনা।'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: GOOGLE ANALYTICS 4 (GA4) & GTM
         ========================================================================= */}
      {activeTab === 'ga4' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[20px] p-6 border border-[#EFE9E0] shadow-xs space-y-5">
            <div>
              <h3 className="font-bold text-sm text-[#2B2B2B]">গুগল এনালিটিক্স ৪ (GA4) ও গুগল ট্যাগ ম্যানেজার (GTM)</h3>
              <p className="text-xs text-[#6B6B6B]">
                ওয়েবসাইটে রিয়েল-টাইম ভিজিটর ট্র্যাকিং, ট্র্যাফিক সোর্স ও সেলস ফানেল পরিমাপ করতে গুগল আইডি যুক্ত করুন।
              </p>
            </div>

            {/* GA4 Card */}
            <div className="p-5 rounded-2xl border border-[#EFE9E0] bg-[#FAF7F2] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#2B2B2B]">Google Analytics 4 (GA4)</h4>
                    <span className="text-[11px] text-[#6B6B6B]">Measurement ID (e.g. G-XXXXXXXXXX)</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentAnalytics.ga4Enabled}
                    onChange={(e) => updateAnalytics({ ga4Enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A73E8]"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#2B2B2B] mb-1">
                    GA4 Measurement ID
                  </label>
                  <input
                    type="text"
                    value={currentAnalytics.ga4MeasurementId}
                    onChange={(e) => updateAnalytics({ ga4MeasurementId: e.target.value.trim().toUpperCase() })}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] bg-white font-mono text-xs focus:outline-none focus:border-[#1A73E8]"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#EFE9E0] bg-white w-full cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentAnalytics.debugMode}
                      onChange={(e) => updateAnalytics({ debugMode: e.target.checked })}
                      className="w-4 h-4 accent-[#1A73E8] rounded"
                    />
                    <div>
                      <span className="font-bold text-[#2B2B2B] block text-[11px]">Debug Mode (DebugView)</span>
                      <span className="text-[10px] text-[#888888]">রিয়েলটাইম টেস্টিংয়ের জন্য চালু রাখুন</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* GTM Card */}
            <div className="p-5 rounded-2xl border border-[#EFE9E0] bg-[#FAF7F2] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                    <Code className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#2B2B2B]">Google Tag Manager (GTM)</h4>
                    <span className="text-[11px] text-[#6B6B6B]">Container ID (e.g. GTM-XXXXXXX)</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentAnalytics.gtmEnabled}
                    onChange={(e) => updateAnalytics({ gtmEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D97706]"></div>
                </label>
              </div>

              <div className="text-xs">
                <label className="block font-semibold text-[#2B2B2B] mb-1">
                  GTM Container ID
                </label>
                <input
                  type="text"
                  value={currentAnalytics.gtmContainerId}
                  onChange={(e) => updateAnalytics({ gtmContainerId: e.target.value.trim().toUpperCase() })}
                  placeholder="GTM-XXXXXXX"
                  className="w-full max-w-md px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] bg-white font-mono text-xs focus:outline-none focus:border-[#D97706]"
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 rounded-xl bg-[#E8F0FE]/40 border border-[#E8F0FE] text-xs text-[#1A73E8] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <HelpCircle className="w-4 h-4" />
                <span>Measurement ID কীভাবে পাবেন?</span>
              </div>
              <p className="text-[11px] text-[#4B5563]">
                analytics.google.com-এ গিয়ে Admin &gt; Data Streams &gt; Web নির্বাচন করুন। সেখানে 'G-' দিয়ে শুরু হওয়া Measurement ID টি কপি করে এখানে বসিয়ে দিন।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: META PIXEL & CAPI
         ========================================================================= */}
      {activeTab === 'pixel' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[20px] p-6 border border-[#EFE9E0] shadow-xs space-y-5">
            <div>
              <h3 className="font-bold text-sm text-[#2B2B2B]">Meta (Facebook) Pixel ও Conversions API (CAPI)</h3>
              <p className="text-xs text-[#6B6B6B]">
                ফেসবুক বিজ্ঞাপন প্রচারণার ট্র্যাকিং, রিটার্গেটিং ও রোয়াস (ROAS) অপ্টিমাইজেশনের জন্য পিক্সেল কোড যুক্ত করুন।
              </p>
            </div>

            {/* Pixel Card */}
            <div className="p-5 rounded-2xl border border-[#EFE9E0] bg-[#FAF7F2] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center">
                    <Code className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#2B2B2B]">Meta Pixel Dataset / ID</h4>
                    <span className="text-[11px] text-[#6B6B6B]">Numeric ID (e.g. 123456789012345)</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentPixel.pixelEnabled}
                    onChange={(e) => updatePixel({ pixelEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1877F2]"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#2B2B2B] mb-1">
                    Meta Pixel ID
                  </label>
                  <input
                    type="text"
                    value={currentPixel.pixelId}
                    onChange={(e) => updatePixel({ pixelId: e.target.value.replace(/\D/g, '') })}
                    placeholder="123456789012345"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] bg-white font-mono text-xs focus:outline-none focus:border-[#1877F2]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2B2B2B] mb-1">
                    টেস্ট ইভেন্ট কোড (Test Event Code - ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={currentPixel.testEventCode}
                    onChange={(e) => updatePixel({ testEventCode: e.target.value.trim() })}
                    placeholder="TEST12345"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] bg-white font-mono text-xs focus:outline-none focus:border-[#1877F2]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-[#2B2B2B] mb-1">
                    Conversions API (CAPI) Access Token
                  </label>
                  <div className="relative">
                    <input
                      type={showCapiToken ? 'text' : 'password'}
                      value={currentPixel.capiToken}
                      onChange={(e) => updatePixel({ capiToken: e.target.value.trim() })}
                      placeholder="EAA..."
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#EFE9E0] bg-white font-mono text-xs focus:outline-none focus:border-[#1877F2]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCapiToken(!showCapiToken)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showCapiToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Event Triggers */}
              <div className="pt-3 border-t border-[#EFE9E0] space-y-2">
                <span className="text-[11px] font-bold text-[#2B2B2B] block">
                  স্বয়ংক্রিয় ইভেন্ট ট্র্যাকিং কনফিগারেশন:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentPixel.trackPageView}
                      onChange={(e) => updatePixel({ trackPageView: e.target.checked })}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                    <span>PageView</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentPixel.trackAddToCart}
                      onChange={(e) => updatePixel({ trackAddToCart: e.target.checked })}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                    <span>AddToCart</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentPixel.trackInitiateCheckout}
                      onChange={(e) => updatePixel({ trackInitiateCheckout: e.target.checked })}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                    <span>InitiateCheckout</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentPixel.trackPurchase}
                      onChange={(e) => updatePixel({ trackPurchase: e.target.checked })}
                      className="w-4 h-4 accent-[#1877F2] rounded"
                    />
                    <span>Purchase</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Instruction */}
            <div className="p-4 rounded-xl bg-[#1877F2]/5 border border-[#1877F2]/20 text-xs text-[#1877F2] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <HelpCircle className="w-4 h-4" />
                <span>Pixel ID কোথায় পাবেন?</span>
              </div>
              <p className="text-[11px] text-[#4B5563]">
                business.facebook.com &gt; Events Manager-এ গিয়ে আপনার পিক্সেল ডেটাসেট নির্বাচন করুন। সেখানে Settings ট্যাবে আপনার Pixel ID ও Conversions API জেনারেট অপশন পেয়ে যাবেন।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Actions Bar on scroll */}
      <div className="sticky bottom-4 z-40 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-[#EFE9E0] shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
          <span className="w-2 h-2 rounded-full bg-[#1F6B43] animate-pulse"></span>
          <span>ট্যাব: <strong>{TABS.find((t) => t.id === activeTab)?.label}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={loadSettings}
            disabled={isSaving}
          >
            রিসেট
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
