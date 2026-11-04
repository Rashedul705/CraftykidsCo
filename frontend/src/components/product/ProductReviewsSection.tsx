'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import {
  Star,
  Camera,
  CheckCircle2,
  X,
  Upload,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { toBanglaDigits } from '@/lib/utils';

interface ReviewItem {
  id: string;
  productId: string;
  productSlug?: string;
  productTitle?: string;
  authorName: string;
  customerPhone?: string;
  rating: number;
  comment: string;
  photos: string[];
  isVerified: boolean;
  createdAt: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingCounts: Record<number, number>;
  verifiedCount: number;
  totalPhotos: number;
  photos: { url: string; authorName: string; rating: number; reviewId: string }[];
}

interface ProductReviewsSectionProps {
  productId?: string;
  productSlug: string;
  productTitle: string;
  productImage?: string;
}

export default function ProductReviewsSection({
  productId,
  productSlug,
  productTitle,
  productImage,
}: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'with-photos' | 'verified'>('all');

  // Review Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formRating, setFormRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Lightbox Modal for Photo Gallery
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; author: string; rating: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Reviews
  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/reviews?productSlug=${encodeURIComponent(productSlug)}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (productSlug) {
      fetchReviews();
    }
  }, [productSlug]);

  // Handle Photo Selection with client-side compression to lightweight base64
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 3 - formPhotos.length;
    if (remainingSlots <= 0) return;

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);

          setFormPhotos((prev) => (prev.length < 3 ? [...prev, compressed] : prev));
        };
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit Review Form
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);

    if (!formName.trim()) {
      setFormMessage({ type: 'error', text: 'অনুগ্রহ করে আপনার নাম লিখুন।' });
      return;
    }
    if (!formComment.trim() || formComment.trim().length < 5) {
      setFormMessage({ type: 'error', text: 'কমপক্ষে ৫ অক্ষরে আপনার অনুভূতি লিখুন।' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productId || productSlug,
          productSlug,
          productTitle,
          productImage,
          authorName: formName.trim(),
          customerPhone: formPhone.trim(),
          rating: formRating,
          comment: formComment.trim(),
          photos: formPhotos,
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (data.success) {
        setFormMessage({
          type: 'success',
          text: data.message || 'আপনার রিভিউটি সফলভাবে জমা হয়েছে। যাচাইয়ের পর এটি প্রদর্শিত হবে।',
        });
        // Reset form after delay
        setTimeout(() => {
          setFormName('');
          setFormPhone('');
          setFormComment('');
          setFormPhotos([]);
          setIsFormOpen(false);
          setFormMessage(null);
          fetchReviews();
        }, 2200);
      } else {
        setFormMessage({ type: 'error', text: data.message || 'সাবমিট ব্যর্থ হয়েছে।' });
      }
    } catch {
      setIsSubmitting(false);
      setFormMessage({ type: 'error', text: 'সার্ভারে যোগাযোগ করা যায়নি।' });
    }
  };

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    if (activeFilter === 'with-photos') {
      return reviews.filter((r) => r.photos && r.photos.length > 0);
    }
    if (activeFilter === 'verified') {
      return reviews.filter((r) => r.isVerified);
    }
    return reviews;
  }, [reviews, activeFilter]);

  const ratingDescriptions: Record<number, string> = {
    1: 'খুব সাধারণ (১/৫)',
    2: 'চলনসই (২/৫)',
    3: 'ভালো কিট (৩/৫)',
    4: 'খুব সুন্দর ও পছন্দ হয়েছে (৪/৫)',
    5: 'অসাধারণ! বাচ্চার অত্যন্ত পছন্দের (৫/৫)',
  };

  return (
    <div className="space-y-6 pt-1">
      {/* 1. RATING SUMMARY & WRITE REVIEW CTA CARD */}
      <div className="bg-[#FAF7F2] rounded-2xl border border-[#EFE9E0] p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Big Score & Breakdown */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="text-center sm:text-left shrink-0">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-heading font-black text-4xl sm:text-5xl text-[#2B2B2B]">
                  {stats?.averageRating ? toBanglaDigits(stats.averageRating) : '৫.০'}
                </span>
                <span className="text-xs text-[#6B6B6B] block">/ ৫.০</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-1 mt-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-[#6B6B6B] mt-1 font-medium">
                {stats?.totalReviews ? toBanglaDigits(stats.totalReviews) : '০'} জন অভিভাবকের মতামত
              </p>
            </div>

            {/* Vertical Divider on Desktop */}
            <div className="hidden sm:block w-[1px] h-16 bg-[#EFE9E0]" />

            {/* Rating distribution progress bars */}
            <div className="w-full sm:w-48 space-y-1.5 text-xs">
              {[5, 4, 3, 2, 1].map((ratingLevel) => {
                const count = stats?.ratingCounts?.[ratingLevel] || 0;
                const total = stats?.totalReviews || 1;
                const percentage = Math.round((count / total) * 100);

                return (
                  <div key={ratingLevel} className="flex items-center gap-2">
                    <span className="w-5 text-right font-bold text-[#6B6B6B] text-[11px]">
                      {toBanglaDigits(ratingLevel)}★
                    </span>
                    <div className="flex-1 h-2 bg-stone-200/70 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-6 text-left text-[10px] text-[#8C8C8C] font-mono">
                      {toBanglaDigits(count)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Write Review Trigger Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-full bg-[#D6403B] hover:bg-[#b8332f] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>আপনার রিভিউ ও ছবি দিন</span>
            </button>
          </div>
        </div>

        {/* 2. REAL CUSTOMER CRAFT PHOTO CAROUSEL / STRIP */}
        {stats?.photos && stats.photos.length > 0 && (
          <div className="mt-6 pt-5 border-t border-[#EFE9E0] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2B2B2B] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D6403B]" />
                ছোটমণিদের তৈরি আসল ক্রাফট গ্যালারি ({toBanglaDigits(stats.photos.length)}টি ছবি)
              </span>
              <span className="text-[11px] text-[#6B6B6B]">ছবিতে ক্লিক করে বড় দেখুন</span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              {stats.photos.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() =>
                    setLightboxPhoto({
                      url: item.url,
                      author: item.authorName,
                      rating: item.rating,
                    })
                  }
                  className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-[#EFE9E0] bg-black/5 shrink-0 cursor-pointer group shadow-2xs hover:shadow-xs transition-all"
                >
                  <Image
                    src={item.url}
                    alt={`${item.authorName}'s craft`}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5 font-bold">
                    <span>{toBanglaDigits(item.rating)}★</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. REVIEWS FEED FILTER PILLS */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-b border-[#EFE9E0] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#2B2B2B] text-white shadow-xs'
                : 'bg-white text-[#6B6B6B] border border-[#EFE9E0] hover:bg-[#FAF7F2]'
            }`}
          >
            সব রিভিউ ({toBanglaDigits(reviews.length)})
          </button>
          {stats?.totalPhotos ? (
            <button
              type="button"
              onClick={() => setActiveFilter('with-photos')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'with-photos'
                  ? 'bg-[#2B2B2B] text-white shadow-xs'
                  : 'bg-white text-[#6B6B6B] border border-[#EFE9E0] hover:bg-[#FAF7F2]'
              }`}
            >
              <Camera className="w-3 h-3 text-[#D6403B]" />
              ছবির সাথে ({toBanglaDigits(stats.totalPhotos)})
            </button>
          ) : null}
          {stats?.verifiedCount ? (
            <button
              type="button"
              onClick={() => setActiveFilter('verified')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'verified'
                  ? 'bg-[#2B2B2B] text-white shadow-xs'
                  : 'bg-white text-[#6B6B6B] border border-[#EFE9E0] hover:bg-[#FAF7F2]'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              ভেরিফাইড ক্রেতা ({toBanglaDigits(stats.verifiedCount)})
            </button>
          ) : null}
        </div>
      </div>

      {/* 4. REVIEWS FEED LIST */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-stone-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#D6403B]" />
          <span className="text-xs font-medium">রিভিউ লোড হচ্ছে...</span>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-10 text-center bg-[#FAF7F2]/60 rounded-2xl border border-dashed border-[#EFE9E0] p-6 space-y-2">
          <MessageSquare className="w-8 h-8 mx-auto text-stone-300" />
          <h5 className="font-bold text-sm text-[#2B2B2B]">এখনো কোনো রিভিউ দেওয়া হয়নি</h5>
          <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
            আপনার ছোট্ট সোনামণি এই কিট দিয়ে কী তৈরি করল তা সবার সাথে শেয়ার করতে প্রথম রিভিউটি আপনিই লিখুন!
          </p>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D6403B] text-white text-xs font-bold hover:bg-[#b8332f] transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>রিভিউ লিখুন</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EFE9E0] shadow-2xs space-y-3"
            >
              {/* Header: Name, Stars, Verified Badge, Date */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#EFE9E0] text-[#D6403B] font-bold text-xs flex items-center justify-center uppercase">
                    {rev.authorName.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-[#2B2B2B]">
                        {rev.authorName}
                      </span>
                      {rev.isVerified && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          ভেরিফাইড ক্রেতা
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] text-[#8C8C8C] whitespace-nowrap">
                  {new Date(rev.createdAt).toLocaleDateString('bn-BD', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {/* Review Comment */}
              <p className="text-xs sm:text-sm text-[#2B2B2B] leading-relaxed">
                {rev.comment}
              </p>

              {/* Photos Gallery Thumbnails */}
              {rev.photos && rev.photos.length > 0 && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {rev.photos.map((photoUrl, pIdx) => (
                    <div
                      key={pIdx}
                      onClick={() =>
                        setLightboxPhoto({
                          url: photoUrl,
                          author: rev.authorName,
                          rating: rev.rating,
                        })
                      }
                      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#EFE9E0] bg-black/5 cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <Image
                        src={photoUrl}
                        alt={`${rev.authorName}'s craft ${pIdx + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 5. WRITE REVIEW MODAL */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#EFE9E0] overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#EFE9E0] flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <h3 className="font-heading font-black text-base text-[#2B2B2B]">
                  রিভিউ ও ক্রাফট ছবি দিন
                </h3>
                <p className="text-[11px] text-[#6B6B6B] truncate max-w-xs">{productTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitReview} className="p-5 sm:p-6 space-y-4">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-bold text-[#2B2B2B] mb-1">
                  আপনার রেটিং নির্বাচন করুন:
                </label>
                <div className="flex items-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setFormRating(star)}
                      className="p-1 cursor-pointer focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= (hoverRating || formRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-semibold text-[#D6403B]">
                    {ratingDescriptions[hoverRating || formRating]}
                  </span>
                </div>
              </div>

              {/* Author Name */}
              <div>
                <label className="block text-xs font-bold text-[#2B2B2B] mb-1">
                  আপনার নাম <span className="text-[#D6403B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="যেমন: ফারহানা ইসলাম"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs sm:text-sm text-[#2B2B2B] focus:outline-none focus:border-[#D6403B] bg-[#FAF7F2]"
                />
              </div>

              {/* Phone for Verification */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#2B2B2B]">
                    মোবাইল নাম্বার (অর্ডার যাচাইয়ের জন্য)
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> গোপনীয় রাখা হবে
                  </span>
                </div>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="017XXXXXXXX (যে নাম্বার দিয়ে অর্ডার করেছিলেন)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs sm:text-sm text-[#2B2B2B] focus:outline-none focus:border-[#D6403B] bg-[#FAF7F2]"
                />
                <p className="text-[10px] text-[#6B6B6B] mt-1">
                  * আমাদের স্টোর থেকে পণ্য কিনে থাকলে ভেরিফাইড ক্রেতা ব্যাজ দেওয়া হবে।
                </p>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-xs font-bold text-[#2B2B2B] mb-1">
                  আপনার অভিজ্ঞতা ও মন্তব্য <span className="text-[#D6403B]">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="বাচ্চা কেমন মজা পেল, রঙের গুণমান কেমন লাগল, ডেলিভারি কেমন ছিল ইত্যাদি লিখুন..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs sm:text-sm text-[#2B2B2B] focus:outline-none focus:border-[#D6403B] bg-[#FAF7F2]"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-[#2B2B2B] mb-1">
                  বাচ্চার পেইন্টিং / ক্রাফটের ছবি যুক্ত করুন (সর্বোচ্চ ৩টি)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                <div className="flex items-center gap-2 flex-wrap">
                  {formPhotos.map((photoData, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#EFE9E0]"
                    >
                      <Image
                        src={photoData}
                        alt={`Selected craft ${idx + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormPhotos((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {formPhotos.length < 3 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 rounded-xl border border-dashed border-stone-300 hover:border-[#D6403B] bg-[#FAF7F2] hover:bg-[#FAF7F2]/80 flex flex-col items-center justify-center text-stone-500 cursor-pointer transition-colors"
                    >
                      <Camera className="w-5 h-5 text-stone-400" />
                      <span className="text-[9px] font-bold mt-0.5">+ছবি দিন</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Notification Message */}
              {formMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    formMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {formMessage.text}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EFE9E0]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold text-[#6B6B6B] hover:bg-stone-100 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-[#D6403B] hover:bg-[#b8332f] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>জমা হচ্ছে...</span>
                    </>
                  ) : (
                    <span>রিভিউ জমা দিন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. LIGHTBOX MODAL */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-square w-full bg-black">
              <Image
                src={lightboxPhoto.url}
                alt={lightboxPhoto.author}
                fill
                unoptimized
                className="object-contain"
              />
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center text-sm font-bold hover:bg-black/80 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 bg-white flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-[#2B2B2B] block">
                  {lightboxPhoto.author}
                </span>
                <span className="text-xs text-[#6B6B6B]">ভেরিফাইড ক্রেতার তৈরি ক্রাফট</span>
              </div>
              <div className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{toBanglaDigits(lightboxPhoto.rating)} রেটিং</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
