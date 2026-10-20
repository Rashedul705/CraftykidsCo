'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Loader2,
  ExternalLink,
  CheckCircle,
  Eye,
  X,
  Star,
  Image as ImageIcon,
  ShieldCheck,
  Truck,
  RotateCcw as RotateIcon,
  Headphones,
  Send,
  Sliders,
  Layers,
  PhoneCall,
  Mail,
  MapPin,
  Heart,
  Award,
} from 'lucide-react';
import {
  SiteSettings,
  defaultSiteSettings,
  HeroSlide,
  TrustBadge,
  PromoBanner,
  WhyLoveCard,
  ParentReview,
  ShowcaseSectionConfig,
} from '@/lib/site-settings';

interface HomeSectionsEditorProps {
  onSaved?: () => void;
}

export function HomeSectionsEditor({ onSaved }: HomeSectionsEditorProps) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');
  const [activeTab, setActiveTab] = useState<
    'hero' | 'announcement' | 'trust' | 'showcases' | 'promos' | 'whylove' | 'reviews' | 'bulk' | 'footer'
  >('hero');

  // Hero Slide Modal State (for adding or editing a slide)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isNewSlide, setIsNewSlide] = useState(false);
  const [isUploadingSlideImg, setIsUploadingSlideImg] = useState(false);

  // Review Modal State (for adding or editing a review)
  const [editingReview, setEditingReview] = useState<ParentReview | null>(null);
  const [isNewReview, setIsNewReview] = useState(false);

  // Promo Banner Image Upload State
  const [uploadingPromoIdx, setUploadingPromoIdx] = useState<number | null>(null);

  // Fetch current settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/site-settings');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.settings) {
            setSettings(data.settings);
          }
        }
      } catch (err) {
        console.warn('Could not load site settings from API:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback(msg);
    setFeedbackType(type);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Save all settings to API / MongoDB Atlas
  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        showNotification('সব হোমপেজ সেকশন সফলভাবে সেভ ও আপডেট হয়েছে!');
        if (onSaved) onSaved();
      } else {
        showNotification(data.message || 'সেভ করতে সমস্যা হয়েছে', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'সেভ ব্যর্থ হয়েছে', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to initial default settings
  const handleResetToDefaults = () => {
    if (confirm('আপনি কি নিশ্চিত যে সব হোমপেজ সেকশন ডিফল্ট অবস্থায় ফিরিয়ে নিতে চান?')) {
      setSettings(defaultSiteSettings);
      showNotification('ডিফল্ট সেকশন ডাটা লোড করা হয়েছে। পরিবর্তন কার্যকর করতে Save এ ক্লিক করুন।');
    }
  };

  // =========================================================================
  // HERO SLIDES ACTIONS
  // =========================================================================
  const handleOpenAddSlide = () => {
    setIsNewSlide(true);
    setEditingSlide({
      id: `slide-${Date.now()}`,
      tagBn: 'নতুন ক্রাফট • স্পেশাল কালেকশন',
      tagEn: 'New Arrival • Special Collection',
      titleBn: 'শিশুর কল্পনার রঙে রঙিন হোক প্রতিটি দিন',
      titleBnHighlight: 'প্রিমিয়াম ক্রাফট ও অ্যাক্টিভিটি কিট',
      titleEn: 'Spark Imagination with Creative Play',
      subtitleBn: 'নিরাপদ, নন-টক্সিক ও শিশুদের জন্য তৈরি',
      descBn: 'শিশুদের প্রথম শৈশবে আনন্দের সাথে সৃজনশীল মেধা বিকাশের সেরা উপকরণ।',
      descEn: 'Safe, screen-free tactile exploration for young artists.',
      imageUrl: 'https://i.ibb.co/HDV4JVJz/craftykidsco-sweet-fruit.jpg',
      badgeTop: '★ ১০০% নন-টক্সিক ও ওয়াশেবল',
      badgeBottom: 'স্ক্রিন-ফ্রি ক্রিয়েটিভ প্লে',
      ctaPrimaryText: 'Shop Now',
      ctaPrimaryHref: '/shop',
      ctaSecondaryText: 'Explore All',
      ctaSecondaryHref: '/shop',
      bgGradient: 'from-[#FFF5EB] via-[#FFF9F0] to-[#FFE8E8]',
      borderColor: '#F3E5D8',
      accentColor: '#E53935',
      isActive: true,
    });
  };

  const handleOpenEditSlide = (slide: HeroSlide) => {
    setIsNewSlide(false);
    setEditingSlide({ ...slide });
  };

  const handleSaveSlideModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;

    if (isNewSlide) {
      setSettings((prev) => ({
        ...prev,
        heroSlides: [...prev.heroSlides, editingSlide],
      }));
      showNotification('নতুন হিরো ব্যানার স্লাইড যোগ হয়েছে!');
    } else {
      setSettings((prev) => ({
        ...prev,
        heroSlides: prev.heroSlides.map((s) => (s.id === editingSlide.id ? editingSlide : s)),
      }));
      showNotification('হিরো ব্যানার স্লাইড আপডেট হয়েছে!');
    }
    setEditingSlide(null);
  };

  const handleDeleteSlide = (id: string) => {
    if (settings.heroSlides.length <= 1) {
      alert('কমপক্ষে একটি স্লাইড থাকা আবশ্যক!');
      return;
    }
    if (confirm('আপনি কি এই ব্যানার স্লাইডটি ডিলিট করতে চান?')) {
      setSettings((prev) => ({
        ...prev,
        heroSlides: prev.heroSlides.filter((s) => s.id !== id),
      }));
      showNotification('ব্যানার স্লাইডটি ডিলিট করা হয়েছে');
    }
  };

  const handleToggleSlideActive = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      heroSlides: prev.heroSlides.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)),
    }));
  };

  // Upload image to ImgBB CDN for Hero Slide
  const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingSlide) return;

    setIsUploadingSlideImg(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', `hero_slide_${Date.now()}`);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && (data.url || data.display_url)) {
        const cdnUrl = data.url || data.display_url;
        setEditingSlide({ ...editingSlide, imageUrl: cdnUrl });
        showNotification('স্লাইড ছবি ImgBB CDN-এ সফলভাবে আপলোড হয়েছে!');
      } else {
        alert(data.message || 'ছবি আপলোডে সমস্যা হয়েছে');
      }
    } catch (err: any) {
      alert(err.message || 'ছবি আপলোড ব্যর্থ হয়েছে');
    } finally {
      setIsUploadingSlideImg(false);
    }
  };

  // =========================================================================
  // PROMO BANNERS IMAGE UPLOAD
  // =========================================================================
  const handlePromoBannerImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPromoIdx(index);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', `promo_banner_${index}_${Date.now()}`);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && (data.url || data.display_url)) {
        const cdnUrl = data.url || data.display_url;
        setSettings((prev) => {
          const updated = [...prev.promoBanners];
          if (updated[index]) {
            updated[index] = { ...updated[index], imageUrl: cdnUrl };
          }
          return { ...prev, promoBanners: updated };
        });
        showNotification(`প্রোমো ব্যানার ${index + 1}-এর ছবি আপলোড হয়েছে!`);
      } else {
        alert(data.message || 'ছবি আপলোডে সমস্যা হয়েছে');
      }
    } catch (err: any) {
      alert(err.message || 'ছবি আপলোড ব্যর্থ হয়েছে');
    } finally {
      setUploadingPromoIdx(null);
    }
  };

  // =========================================================================
  // TESTIMONIALS ACTIONS
  // =========================================================================
  const handleOpenAddReview = () => {
    setIsNewReview(true);
    setEditingReview({
      id: `rev-${Date.now()}`,
      name: '',
      kidAge: 'মা (৪ বছর বয়সী সন্তানের)',
      rating: 5,
      reviewBn: '',
      verified: true,
      productName: 'সুইট ফ্রুট পেইন্টিং কিট',
    });
  };

  const handleSaveReviewModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview || !editingReview.name || !editingReview.reviewBn) {
      alert('নাম এবং রিভিউ বিবরণ পূরণ করুন');
      return;
    }

    if (isNewReview) {
      setSettings((prev) => ({
        ...prev,
        testimonials: {
          ...prev.testimonials,
          reviews: [...prev.testimonials.reviews, editingReview],
        },
      }));
      showNotification('নতুন রিভিউ সফলভাবে যুক্ত হয়েছে!');
    } else {
      setSettings((prev) => ({
        ...prev,
        testimonials: {
          ...prev.testimonials,
          reviews: prev.testimonials.reviews.map((r) => (r.id === editingReview.id ? editingReview : r)),
        },
      }));
      showNotification('প্যারেন্ট রিভিউ আপডেট হয়েছে!');
    }
    setEditingReview(null);
  };

  const handleDeleteReview = (id: string) => {
    if (confirm('আপনি কি এই রিভিউটি মুছে ফেলতে চান?')) {
      setSettings((prev) => ({
        ...prev,
        testimonials: {
          ...prev.testimonials,
          reviews: prev.testimonials.reviews.filter((r) => r.id !== id),
        },
      }));
      showNotification('রিভিউ ডিলিট করা হয়েছে');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-[#EFEAE2] p-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#D32F2F] mx-auto" />
        <p className="text-xs text-[#6B6B6B] font-bold">হোমপেজ সেকশন কনফিগারেশন লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Global Action Bar */}
      <div className="bg-white rounded-3xl border border-[#EFEAE2] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
            <span className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider">
              Storefront Content Engine
            </span>
          </div>
          <h2 className="font-heading font-black text-xl sm:text-2xl text-[#1A1A1A] mt-0.5">
            হোমপেজ সেকশন কাস্টমাইজেশন (Home Sections)
          </h2>
          <p className="text-xs text-[#6B6B6B] mt-1">
            হিরো ব্যানার, টপ অ্যানাউন্সমেন্ট, প্রোডাক্ট শোকেস, রিভিউ ও অফার ব্যানারসমূহ রিয়েল-টাইমে এডিট করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
          <Link
            href="/"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E5E0D8] text-xs font-bold text-[#2B2B2B] hover:bg-[#EFEAE2] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="লাইভ হোমপেজ নতুন ট্যাবে দেখুন"
          >
            <Eye className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>লাইভ প্রিভিউ</span>
            <ExternalLink className="w-3 h-3 text-[#8A8A8A]" />
          </Link>

          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E5E0D8] text-xs font-bold text-[#6B6B6B] hover:text-[#DC2626] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>সব পরিবর্তন সেভ করুন</span>
          </button>
        </div>
      </div>

      {/* Floating feedback alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border shadow-sm ${
            feedbackType === 'success'
              ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
          }`}
        >
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 2. Sub-Tabs Navigation (Horizontal Scrollable) */}
      <div className="bg-white rounded-2xl border border-[#EFEAE2] p-2 shadow-xs overflow-x-auto flex items-center gap-1.5">
        {[
          { id: 'hero', label: '🎪 হিরো ব্যানার (Slider)' },
          { id: 'announcement', label: '📢 টপ অ্যানাউন্সমেন্ট' },
          { id: 'trust', label: '🛡️ ট্রাস্ট ব্যাজ (Features)' },
          { id: 'showcases', label: '🛍️ প্রোডাক্ট শোকেস' },
          { id: 'promos', label: '🎨 প্রোমো ব্যানার' },
          { id: 'whylove', label: '💖 কেন CraftyKidsCo?' },
          { id: 'reviews', label: '⭐ প্যারেন্টস রিভিউ' },
          { id: 'bulk', label: '🏫 স্কুল ও বাল্ক অফার' },
          { id: 'footer', label: '📑 ফুটার ও ঠিকানা' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#D32F2F] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#EFEAE2]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =====================================================================
          TAB 1: HERO CAROUSEL SLIDES
         ===================================================================== */}
      {activeTab === 'hero' && (
        <div className="bg-white rounded-3xl border border-[#EFEAE2] p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#EFEAE2] gap-3">
            <div>
              <h3 className="font-heading font-black text-base text-[#1A1A1A]">
                হিরো স্লাইডার ও ব্যানার কালেকশন ({settings.heroSlides.length})
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                হোমপেজের মূল ব্যানারে প্রদর্শিত স্লাইডগুলোর ছবি, শিরোনাম, অফার ট্যাগ ও বাটন পরিবর্তন করুন।
              </p>
            </div>
            <button
              onClick={handleOpenAddSlide}
              className="px-4 py-2 rounded-xl bg-[#D32F2F] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#B71C1C] shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন স্লাইড যোগ করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.heroSlides.map((slide, idx) => (
              <div
                key={slide.id}
                className={`p-4 rounded-2xl border transition-all ${
                  slide.isActive !== false ? 'border-[#EFEAE2] bg-[#FAF7F2]' : 'border-[#E5E0D8] bg-gray-50 opacity-60'
                } flex flex-col justify-between space-y-3`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white shadow-xs bg-white">
                    <Image src={slide.imageUrl} alt={slide.titleBn} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#D32F2F] border border-[#EFEAE2]">
                        Slide {idx + 1}
                      </span>
                      {slide.isActive !== false ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A]">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                          Hidden
                        </span>
                      )}
                    </div>
                    <h4 className="font-heading font-black text-xs text-[#1A1A1A] mt-1.5 line-clamp-1">
                      {slide.titleBn}
                    </h4>
                    <p className="text-[11px] text-[#D32F2F] font-bold line-clamp-1">{slide.titleBnHighlight}</p>
                    <p className="text-[10px] text-[#8A8A8A] line-clamp-1">{slide.tagBn}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EFEAE2] flex items-center justify-between">
                  <button
                    onClick={() => handleToggleSlideActive(slide.id)}
                    className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] font-semibold cursor-pointer"
                  >
                    {slide.isActive !== false ? 'Hide Slide' : 'Show Slide'}
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditSlide(slide)}
                      className="p-1.5 rounded-lg bg-[#F0FDF4] text-[#16A34A] hover:bg-[#DCFCE7] border border-[#BBF7D0] cursor-pointer"
                      title="Edit Slide"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="p-1.5 rounded-lg bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2] border border-[#FECACA] cursor-pointer"
                      title="Delete Slide"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: TOP ANNOUNCEMENT & CONTACT BAR
         ===================================================================== */}
      {activeTab === 'announcement' && (
        <div className="bg-white rounded-3xl border border-[#EFEAE2] p-5 sm:p-6 shadow-xs space-y-4 max-w-3xl">
          <div className="pb-3 border-b border-[#EFEAE2]">
            <h3 className="font-heading font-black text-base text-[#1A1A1A]">
              টপ অ্যানাউন্সমেন্ট বার ও কন্টাক্ট ইনফো
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              ওয়েবসাইটের একদম উপরে কালো অ্যানাউন্সমেন্ট বারের টেক্সট এবং হটলাইন নাম্বার কনফিগার করুন।
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]">
              <input
                type="checkbox"
                id="ann-enabled"
                checked={settings.announcement?.enabled !== false}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    announcement: { ...prev.announcement, enabled: e.target.checked },
                  }))
                }
                className="w-4 h-4 text-[#D32F2F] rounded"
              />
              <label htmlFor="ann-enabled" className="font-bold text-[#1A1A1A] cursor-pointer">
                টপ অ্যানাউন্সমেন্ট বার চালু রাখুন (Show Announcement Bar)
              </label>
            </div>

            <div>
              <label className="font-bold block mb-1 text-[#2B2B2B]">অ্যানাউন্সমেন্ট টেক্সট (বাংলা):</label>
              <input
                value={settings.announcement?.textBn || ''}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    announcement: { ...prev.announcement, textBn: e.target.value },
                  }))
                }
                className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                placeholder="যেমন: দেশজুড়ে দ্রুত হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি!"
              />
            </div>

            <div>
              <label className="font-bold block mb-1 text-[#2B2B2B]">অ্যানাউন্সমেন্ট টেক্সট (English):</label>
              <input
                value={settings.announcement?.textEn || ''}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    announcement: { ...prev.announcement, textEn: e.target.value },
                  }))
                }
                className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                placeholder="e.g. Nationwide Fast Home Delivery & Cash on Delivery!"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-bold block mb-1 text-[#2B2B2B]">হটলাইন ফোন নম্বর:</label>
                <input
                  value={settings.announcement?.hotline || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      announcement: { ...prev.announcement, hotline: e.target.value },
                    }))
                  }
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                  placeholder="01700-000000"
                />
              </div>
              <div>
                <label className="font-bold block mb-1 text-[#2B2B2B]">সাপোর্ট ইমেইল:</label>
                <input
                  value={settings.announcement?.email || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      announcement: { ...prev.announcement, email: e.target.value },
                    }))
                  }
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                  placeholder="support@craftykidsco.com"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: TRUST BADGES (FEATURES)
         ===================================================================== */}
      {activeTab === 'trust' && (
        <div className="bg-white rounded-3xl border border-[#EFEAE2] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#EFEAE2]">
            <h3 className="font-heading font-black text-base text-[#1A1A1A]">
              ৪টি ট্রাস্ট ও সেফটি ব্যাজ (Trust Badges)
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              হিরো সেকশনের নিচে প্রদর্শিত ৪টি নির্ভরতার বৈশিষ্ট্যের লেখা এবং সক্রিয়তা পরিবর্তন করুন।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {settings.trustBadges.map((badge, idx) => (
              <div key={badge.id} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#D32F2F]">ফিচার #{idx + 1}</span>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#2B2B2B]">
                    <input
                      type="checkbox"
                      checked={badge.enabled !== false}
                      onChange={(e) => {
                        const updated = [...settings.trustBadges];
                        updated[idx] = { ...updated[idx], enabled: e.target.checked };
                        setSettings((prev) => ({ ...prev, trustBadges: updated }));
                      }}
                      className="w-3.5 h-3.5 text-[#D32F2F] rounded"
                    />
                    <span>চালু রাখুন</span>
                  </label>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">শিরোনাম (বাংলা):</label>
                  <input
                    value={badge.titleBn}
                    onChange={(e) => {
                      const updated = [...settings.trustBadges];
                      updated[idx] = { ...updated[idx], titleBn: e.target.value };
                      setSettings((prev) => ({ ...prev, trustBadges: updated }));
                    }}
                    className="w-full p-2 rounded-xl bg-white border border-[#EFEAE2]"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">বিবরণ (বাংলা):</label>
                  <input
                    value={badge.descBn}
                    onChange={(e) => {
                      const updated = [...settings.trustBadges];
                      updated[idx] = { ...updated[idx], descBn: e.target.value };
                      setSettings((prev) => ({ ...prev, trustBadges: updated }));
                    }}
                    className="w-full p-2 rounded-xl bg-white border border-[#EFEAE2]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: PRODUCT SHOWCASES / CATEGORY SECTIONS
         ===================================================================== */}
      {activeTab === 'showcases' && (
        <div className="bg-white rounded-3xl border border-[#EFEAE2] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#EFEAE2]">
            <h3 className="font-heading font-black text-base text-[#1A1A1A]">
              প্রোডাক্ট শোকেস ও ক্যাটাগরি সেকশন কন্ট্রোল
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              হোমপেজে কোন কোন ক্যাটাগরি সেকশনগুলো দেখানো হবে এবং তাদের শিরোনাম ও সাবটাইটেল পরিবর্তন করুন।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {(
              [
                { key: 'newArrivals', label: 'নতুন কালেকশন (New Arrivals)' },
                { key: 'bestSellers', label: 'জনপ্রিয় পণ্য (Best Sellers)' },
                { key: 'artKits', label: '৩ডি প্লাস্টার পেইন্টিং কিট (Plaster Art)' },
                { key: 'waxCrayons', label: 'মোমের রঙ (Natural Beeswax Crayons)' },
                { key: 'playDough', label: 'মডেলিং ক্লে ও প্লে-ডো (Clay & Dough)' },
                { key: 'educationalToys', label: 'শিক্ষামূলক কাঠের খেলনা (Wooden Toys)' },
              ] as const
            ).map((sec) => {
              const cfg = (settings.showcases as any)[sec.key] as ShowcaseSectionConfig;
              return (
                <div key={sec.key} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-[#EFEAE2]">
                    <span className="font-bold text-[#1A1A1A]">{sec.label}</span>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#D32F2F]">
                      <input
                        type="checkbox"
                        checked={cfg?.enabled !== false}
                        onChange={(e) => {
                          setSettings((prev) => ({
                            ...prev,
                            showcases: {
                              ...prev.showcases,
                              [sec.key]: {
                                ...cfg,
                                enabled: e.target.checked,
                              },
                            },
                          }));
                        }}
                        className="w-3.5 h-3.5 text-[#D32F2F] rounded"
                      />
                      <span>{cfg?.enabled !== false ? 'দৃশ্যমান' : 'লুকানো'}</span>
                    </label>
                  </div>

                  <div>
                    <label className="font-bold block mb-1 text-[#2B2B2B]">শিরোনাম (বাংলা):</label>
                    <input
                      value={cfg?.titleBn || ''}
                      onChange={(e) => {
                        setSettings((prev) => ({
                          ...prev,
                          showcases: {
                            ...prev.showcases,
                            [sec.key]: {
                              ...cfg,
                              titleBn: e.target.value,
                            },
                          },
                        }));
                      }}
                      className="w-full p-2 rounded-xl bg-white border border-[#EFEAE2]"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1 text-[#2B2B2B]">সাবটাইটেল (বাংলা):</label>
                    <input
                      value={cfg?.subtitleBn || ''}
                      onChange={(e) => {
                        setSettings((prev) => ({
                          ...prev,
                          showcases: {
                            ...prev.showcases,
                            [sec.key]: {
                              ...cfg,
                              subtitleBn: e.target.value,
                            },
                          },
                        }));
                      }}
                      className="w-full p-2 rounded-xl bg-white border border-[#EFEAE2]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: PROMOTIONAL BANNERS
         ===================================================================== */}
      {activeTab === 'promos' && (
        <div className="bg-white rounded-3xl border border-[#EFEAE2] p-5 sm:p-6 shadow-xs space-y-5">
          <div className="pb-3 border-b border-[#EFEAE2]">
            <h3 className="font-heading font-black text-base text-[#1A1A1A]">
              ২টি মিডল প্রোমোশনাল ব্যানার (Promotional Banners)
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              হোমপেজের মাঝের ২টি আকর্ষণীয় অফার ব্যানারের ছবি (ImgBB CDN), টাইটেল, ডেসক্রিপশন ও বাটন লিংক কনফিগার করুন।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {settings.promoBanners.map((banner, idx) => (
              <div key={banner.id} className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-[#EFEAE2]">
                  <span className="font-bold text-[#D32F2F]">ব্যানার #{idx + 1}</span>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#2B2B2B]">
                    <input
                      type="checkbox"
                      checked={banner.enabled !== false}
                      onChange={(e) => {
                        const updated = [...settings.promoBanners];
                        updated[idx] = { ...updated[idx], enabled: e.target.checked };
                        setSettings((prev) => ({ ...prev, promoBanners: updated }));
                      }}
                      className="w-3.5 h-3.5 text-[#D32F2F] rounded"
                    />
                    <span>চালু রাখুন</span>
                  </label>
                </div>

                {/* Banner Photo Preview & Upload */}
                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">ব্যানার ছবি (ImgBB CDN):</label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#EFEAE2] bg-white shrink-0">
                      {banner.imageUrl ? (
                        <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <label className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E0D8] text-xs font-bold text-[#2B2B2B] hover:bg-[#EFEAE2] flex items-center gap-1.5 cursor-pointer shadow-xs">
                      {uploadingPromoIdx === idx ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#D32F2F]" />
                      ) : (
                        <Upload className="w-4 h-4 text-[#D32F2F]" />
                      )}
                      <span>নতুন ছবি আপলোড (ImgBB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePromoBannerImageUpload(idx, e)}
                        disabled={uploadingPromoIdx === idx}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">ট্যাগ / ব্যাজ (Tag):</label>
                  <input
                    value={banner.tag}
                    onChange={(e) => {
                      const updated = [...settings.promoBanners];
                      updated[idx] = { ...updated[idx], tag: e.target.value };
                      setSettings((prev) => ({ ...prev, promoBanners: updated }));
                    }}
                    className="w-full p-2 rounded-xl bg-white border border-[#EFEAE2]"
                    placeholder="যেমন: কম্বো সেভার অফার"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">শিরোনাম (Title):</label>
                  <input
                    value={banner.title}
                    onChange={(e) => {
                      const updated = [...settings.promoBanners];
                      updated[idx] = { ...updated[idx], title: e.target.value };
                      setSettings((prev) => ({ ...prev, promoBanners: updated }));
                    }}
                    className="w-full p-2 rounded-xl bg-white border border-[#EFEAE2]"
                    placeholder="যেমন: প্লাস্টার আর্ট ও ক্রেয়ন মেগা কম্বো"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">বিবরণ (Description):</label>
                  <textarea
                    rows={2}
                    value={banner.desc}
                    onChange={(e) => {
                      const updated = [...settings.promoBanners];
                      updated[idx] = { ...updated[idx], desc: e.target.value };
                      setSettings((prev) => ({ ...prev, promoBanners: updated }));
                    }}
                    className="w-full p-2 rounded-xl bg-white border border-[#EFEAE2] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold block mb-1 text-[#2B2B2B]">বাটন টেক্সট:</label>
                    <input
                      value={banner.buttonText}
                      onChange={(e) => {
                        const updated = [...settings.promoBanners];
                        updated[idx] = { ...updated[idx], buttonText: e.target.value };
                        setSettings((prev) => ({ ...prev, promoBanners: updated }));
                      }}
                      className="w-full p-2 rounded-xl bg-white border border-[#EFEAE2]"
                      placeholder="Shop Now"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1 text-[#2B2B2B]">বাটন লিংক (URL):</label>
                    <input
                      value={banner.link}
                      onChange={(e) => {
                        const updated = [...settings.promoBanners];
                        updated[idx] = { ...updated[idx], link: e.target.value };
                        setSettings((prev) => ({ ...prev, promoBanners: updated }));
                      }}
                      className="w-full p-2 rounded-xl bg-white border border-[#EFEAE2]"
                      placeholder="/shop"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 6: WHY PARENTS LOVE US
         ===================================================================== */}
      {activeTab === 'whylove' && (
        <div className="bg-white rounded-3xl border border-[#EFEAE2] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#EFEAE2]">
            <h3 className="font-heading font-black text-base text-[#1A1A1A]">
              'কেন CraftyKidsCo?' সেকশন কাস্টমাইজেশন
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              অভিভাবকদের আস্থার কারণ হিসেবে উল্লেখিত ৪টি কার্ডের টাইটেল ও বিস্তারিত এডিট করুন।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold block mb-1 text-[#2B2B2B]">মূল শিরোনাম (বাংলা):</label>
              <input
                value={settings.whyLoveUs.headingBn}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    whyLoveUs: { ...prev.whyLoveUs, headingBn: e.target.value },
                  }))
                }
                className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
              />
            </div>
            <div>
              <label className="font-bold block mb-1 text-[#2B2B2B]">সাবটাইটেল (বাংলা):</label>
              <input
                value={settings.whyLoveUs.subtitleBn}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    whyLoveUs: { ...prev.whyLoveUs, subtitleBn: e.target.value },
                  }))
                }
                className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            {settings.whyLoveUs.cards.map((card, idx) => (
              <div key={card.id || idx} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] space-y-2">
                <span className="font-bold text-[#D32F2F]">কার্ড #{idx + 1}</span>
                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">শিরোনাম:</label>
                  <input
                    value={card.titleBn}
                    onChange={(e) => {
                      const updated = [...settings.whyLoveUs.cards];
                      updated[idx] = { ...updated[idx], titleBn: e.target.value };
                      setSettings((prev) => ({
                        ...prev,
                        whyLoveUs: { ...prev.whyLoveUs, cards: updated },
                      }));
                    }}
                    className="w-full p-2 rounded-xl bg-white border border-[#EFEAE2]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">বিবরণ:</label>
                  <textarea
                    rows={2}
                    value={card.descBn}
                    onChange={(e) => {
                      const updated = [...settings.whyLoveUs.cards];
                      updated[idx] = { ...updated[idx], descBn: e.target.value };
                      setSettings((prev) => ({
                        ...prev,
                        whyLoveUs: { ...prev.whyLoveUs, cards: updated },
                      }));
                    }}
                    className="w-full p-2 rounded-xl bg-white border border-[#EFEAE2] resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 7: CUSTOMER REVIEWS & TESTIMONIALS
         ===================================================================== */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-3xl border border-[#EFEAE2] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#EFEAE2] gap-3">
            <div>
              <h3 className="font-heading font-black text-base text-[#1A1A1A]">
                হ্যাপি প্যারেন্টস রিভিউ ({settings.testimonials.reviews.length})
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                হোমপেজে প্রদর্শিত বাবা-মায়ের রিভিউ ও রেটিং যোগ, এডিট বা ডিলিট করুন।
              </p>
            </div>
            <button
              onClick={handleOpenAddReview}
              className="px-4 py-2 rounded-xl bg-[#D32F2F] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#B71C1C] shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন রিভিউ যোগ করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {settings.testimonials.reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex text-[#FFB300] gap-0.5">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    {rev.verified && (
                      <span className="text-[10px] bg-[#DCFCE7] text-[#16A34A] font-bold px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#444] italic leading-relaxed line-clamp-3">&ldquo;{rev.reviewBn}&rdquo;</p>
                </div>

                <div className="pt-2 border-t border-[#EFEAE2] flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-[#1A1A1A]">{rev.name}</h5>
                    <span className="text-[10px] text-[#8A8A8A] block">{rev.kidAge}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteReview(rev.id)}
                    className="p-1.5 rounded-lg bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2] cursor-pointer"
                    title="Delete Review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 8: SCHOOL & BULK ORDERS BANNER
         ===================================================================== */}
      {activeTab === 'bulk' && (
        <div className="bg-white rounded-3xl border border-[#EFEAE2] p-5 sm:p-6 shadow-xs space-y-4 max-w-3xl">
          <div className="pb-3 border-b border-[#EFEAE2]">
            <h3 className="font-heading font-black text-base text-[#1A1A1A]">
              স্কুল, ডে-কেয়ার ও বাল্ক অর্ডার ব্যানার
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              হোমপেজের নিচের দিকে হলুদ বক্সের বড় প্রোমোশনাল কল-আউট কনফিগার করুন।
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]">
              <input
                type="checkbox"
                id="bulk-enabled"
                checked={settings.bulkOrderBanner?.enabled !== false}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    bulkOrderBanner: { ...prev.bulkOrderBanner, enabled: e.target.checked },
                  }))
                }
                className="w-4 h-4 text-[#D32F2F] rounded"
              />
              <label htmlFor="bulk-enabled" className="font-bold text-[#1A1A1A] cursor-pointer">
                বাল্ক অর্ডার ব্যানার চালু রাখুন (Show Bulk Order Banner)
              </label>
            </div>

            <div>
              <label className="font-bold block mb-1 text-[#2B2B2B]">ব্যানার শিরোনাম:</label>
              <input
                value={settings.bulkOrderBanner?.titleBn || ''}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    bulkOrderBanner: { ...prev.bulkOrderBanner, titleBn: e.target.value },
                  }))
                }
                className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
              />
            </div>

            <div>
              <label className="font-bold block mb-1 text-[#2B2B2B]">বিবরণ:</label>
              <textarea
                rows={2}
                value={settings.bulkOrderBanner?.descBn || ''}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    bulkOrderBanner: { ...prev.bulkOrderBanner, descBn: e.target.value },
                  }))
                }
                className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1 text-[#2B2B2B]">বাটন টেক্সট:</label>
                <input
                  value={settings.bulkOrderBanner?.ctaText || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      bulkOrderBanner: { ...prev.bulkOrderBanner, ctaText: e.target.value },
                    }))
                  }
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1 text-[#2B2B2B]">হোয়াটসঅ্যাপ নম্বর (Country code সহ):</label>
                <input
                  value={settings.bulkOrderBanner?.whatsappNumber || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      bulkOrderBanner: { ...prev.bulkOrderBanner, whatsappNumber: e.target.value },
                    }))
                  }
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 9: FOOTER & CONTACT INFO
         ===================================================================== */}
      {activeTab === 'footer' && (
        <div className="bg-white rounded-3xl border border-[#EFEAE2] p-5 sm:p-6 shadow-xs space-y-4 max-w-3xl">
          <div className="pb-3 border-b border-[#EFEAE2]">
            <h3 className="font-heading font-black text-base text-[#1A1A1A]">
              ফুটার ও ব্র্যান্ড কন্টাক্ট ইনফো
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              ওয়েবসাইটের ফুটারে দৃশ্যমান ব্র্যান্ড পরিচিতি, ফোন, ইমেইল ও অফিসের ঠিকানা।
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold block mb-1 text-[#2B2B2B]">ব্র্যান্ড পরিচিতি (About CraftyKidsCo):</label>
              <textarea
                rows={2}
                value={settings.footer?.aboutBn || ''}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    footer: { ...prev.footer, aboutBn: e.target.value },
                  }))
                }
                className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1 text-[#2B2B2B]">ফোন নম্বর:</label>
                <input
                  value={settings.footer?.phone || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      footer: { ...prev.footer, phone: e.target.value },
                    }))
                  }
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1 text-[#2B2B2B]">ইমেইল:</label>
                <input
                  value={settings.footer?.email || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      footer: { ...prev.footer, email: e.target.value },
                    }))
                  }
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold block mb-1 text-[#2B2B2B]">অফিসের ঠিকানা:</label>
              <input
                value={settings.footer?.address || ''}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    footer: { ...prev.footer, address: e.target.value },
                  }))
                }
                className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
              />
            </div>

            <div>
              <label className="font-bold block mb-1 text-[#2B2B2B]">কপিরাইট টেক্সট:</label>
              <input
                value={settings.footer?.copyrightText || ''}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    footer: { ...prev.footer, copyrightText: e.target.value },
                  }))
                }
                className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT OR ADD HERO SLIDE (WITH IMGBB CDN UPLOAD)
         ========================================================================= */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-xl w-full p-6 space-y-4 shadow-2xl border border-[#EFEAE2] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <div>
                <span className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider block">
                  Hero Banner Configuration
                </span>
                <h3 className="font-heading font-black text-lg text-[#1A1A1A]">
                  {isNewSlide ? 'Add New Hero Slide' : 'Edit Hero Slide'}
                </h3>
              </div>
              <button
                onClick={() => setEditingSlide(null)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#6B6B6B] hover:text-[#1A1A1A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlideModal} className="space-y-4 text-xs">
              {/* Slide Image Preview & ImgBB Upload */}
              <div>
                <label className="font-bold block mb-1.5 text-[#2B2B2B]">Slide Photo (ImgBB CDN):</label>
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2]">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-white shadow-xs shrink-0 bg-white">
                    <Image src={editingSlide.imageUrl} alt="Slide Preview" fill className="object-cover" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D32F2F] text-white font-bold cursor-pointer hover:bg-[#B71C1C] transition-colors shadow-xs">
                      {isUploadingSlideImg ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>ImgBB CDN এ ছবি আপলোড</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleSlideImageUpload}
                        disabled={isUploadingSlideImg}
                      />
                    </label>
                    <p className="text-[10px] text-[#8A8A8A]">ছবি সরাসরি ImgBB CDN এ হাই-স্পিড সার্ভারে আপলোড হবে</p>
                  </div>
                </div>
              </div>

              {/* Tag / Eyebrow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">Top Tag (বাংলা):</label>
                  <input
                    required
                    value={editingSlide.tagBn}
                    onChange={(e) => setEditingSlide({ ...editingSlide, tagBn: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">Top Tag (English):</label>
                  <input
                    required
                    value={editingSlide.tagEn}
                    onChange={(e) => setEditingSlide({ ...editingSlide, tagEn: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                  />
                </div>
              </div>

              {/* Title & Highlight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">মূল শিরোনাম (বাংলা):</label>
                  <input
                    required
                    value={editingSlide.titleBn}
                    onChange={(e) => setEditingSlide({ ...editingSlide, titleBn: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">রঙিন হাইলাইট অংশ:</label>
                  <input
                    required
                    value={editingSlide.titleBnHighlight}
                    onChange={(e) => setEditingSlide({ ...editingSlide, titleBnHighlight: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold block mb-1 text-[#2B2B2B]">বিবরণ (বাংলা):</label>
                <textarea
                  rows={2}
                  value={editingSlide.descBn}
                  onChange={(e) => setEditingSlide({ ...editingSlide, descBn: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] resize-none"
                />
              </div>

              {/* Badges on image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">ছবির ওপর ব্যাজ (টপ):</label>
                  <input
                    value={editingSlide.badgeTop}
                    onChange={(e) => setEditingSlide({ ...editingSlide, badgeTop: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">ছবির ওপর ব্যাজ (বটম):</label>
                  <input
                    value={editingSlide.badgeBottom}
                    onChange={(e) => setEditingSlide({ ...editingSlide, badgeBottom: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">Primary বাটন টেক্সট ও লিংক:</label>
                  <div className="flex gap-2">
                    <input
                      value={editingSlide.ctaPrimaryText}
                      onChange={(e) => setEditingSlide({ ...editingSlide, ctaPrimaryText: e.target.value })}
                      className="w-1/2 p-2 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                      placeholder="Text"
                    />
                    <input
                      value={editingSlide.ctaPrimaryHref}
                      onChange={(e) => setEditingSlide({ ...editingSlide, ctaPrimaryHref: e.target.value })}
                      className="w-1/2 p-2 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                      placeholder="/category/..."
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">Secondary বাটন টেক্সট ও লিংক:</label>
                  <div className="flex gap-2">
                    <input
                      value={editingSlide.ctaSecondaryText}
                      onChange={(e) => setEditingSlide({ ...editingSlide, ctaSecondaryText: e.target.value })}
                      className="w-1/2 p-2 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                      placeholder="Text"
                    />
                    <input
                      value={editingSlide.ctaSecondaryHref}
                      onChange={(e) => setEditingSlide({ ...editingSlide, ctaSecondaryHref: e.target.value })}
                      className="w-1/2 p-2 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                      placeholder="/shop"
                    />
                  </div>
                </div>
              </div>

              {/* Accent Color */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]">
                <span className="font-bold text-[#2B2B2B]">অ্যাকসেন্ট কালার (বাটন ও হাইলাইট রঙ):</span>
                <input
                  type="color"
                  value={editingSlide.accentColor}
                  onChange={(e) => setEditingSlide({ ...editingSlide, accentColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-[#EFEAE2]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#EFEAE2]">
                <button
                  type="button"
                  onClick={() => setEditingSlide(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#1A1A1A] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D32F2F] text-white font-bold hover:bg-[#B71C1C] cursor-pointer"
                >
                  {isNewSlide ? 'Add Slide' : 'Update Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW PARENT REVIEW
         ========================================================================= */}
      {editingReview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#EFEAE2]">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFEAE2]">
              <h3 className="font-heading font-black text-base text-[#1A1A1A]">
                {isNewReview ? 'নতুন প্যারেন্ট রিভিউ যোগ করুন' : 'Edit Review'}
              </h3>
              <button onClick={() => setEditingReview(null)} className="text-[#6B6B6B]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReviewModal} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1 text-[#2B2B2B]">অভিভাবকের নাম:</label>
                <input
                  required
                  value={editingReview.name}
                  onChange={(e) => setEditingReview({ ...editingReview, name: e.target.value })}
                  placeholder="যেমন: নুসরাত জাহান"
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-[#2B2B2B]">পরিচয় / বাচ্চার বয়স:</label>
                <input
                  required
                  value={editingReview.kidAge}
                  onChange={(e) => setEditingReview({ ...editingReview, kidAge: e.target.value })}
                  placeholder="যেমন: মা (৪ বছর বয়সী সন্তানের), ধানমন্ডি"
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-[#2B2B2B]">রেটিং (১ থেকে ৫ স্টার):</label>
                <select
                  value={editingReview.rating}
                  onChange={(e) => setEditingReview({ ...editingReview, rating: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                  <option value={3}>⭐⭐⭐ (3 Stars)</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1 text-[#2B2B2B]">রিভিউ টেক্সট:</label>
                <textarea
                  rows={3}
                  required
                  value={editingReview.reviewBn}
                  onChange={(e) => setEditingReview({ ...editingReview, reviewBn: e.target.value })}
                  placeholder="অভিভাবকের মতামত লিখুন..."
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]">
                <input
                  type="checkbox"
                  id="rev-verified"
                  checked={editingReview.verified}
                  onChange={(e) => setEditingReview({ ...editingReview, verified: e.target.checked })}
                  className="w-4 h-4 text-[#D32F2F] rounded"
                />
                <label htmlFor="rev-verified" className="font-bold text-[#1A1A1A] cursor-pointer">
                  Verified Buyer ব্যাজ যুক্ত করুন
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#EFEAE2]">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F2] text-[#6B6B6B] font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#D32F2F] text-white font-bold">
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
