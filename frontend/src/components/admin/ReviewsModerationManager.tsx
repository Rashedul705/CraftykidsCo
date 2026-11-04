'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Camera,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  MessageSquare,
  AlertTriangle,
  Phone,
  Eye,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { toBanglaDigits } from '@/lib/utils';

interface AdminReview {
  id: string;
  productId: string;
  productSlug?: string;
  productTitle: string;
  productImage?: string;
  authorName: string;
  customerPhone?: string;
  rating: number;
  comment: string;
  photos: string[];
  isVerified: boolean;
  isApproved: boolean;
  adminNote?: string;
  createdAt: string;
}

export default function ReviewsModerationManager() {
  const { success, error, warning } = useToast();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [counts, setCounts] = useState<{ pending: number; approved: number; total: number }>({
    pending: 0,
    approved: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Lightbox for reviewing uploaded customer photos
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; author: string; title: string } | null>(null);

  // Delete Confirmation Modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/admin/reviews?status=${activeTab}&search=${encodeURIComponent(searchQuery.trim())}`
      );
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        if (data.counts) setCounts(data.counts);
      } else {
        error(data.message || 'রিভিউ লোড করা যায়নি।');
      }
    } catch {
      error('সার্ভারে যোগাযোগ করা যায়নি।');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReviews();
  };

  // Approve or Reject review
  const handleModerateReview = async (id: string, isApproved: boolean) => {
    try {
      setUpdatingId(id);
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          isApproved,
          adminNote: isApproved ? 'APPROVED' : 'REJECTED',
        }),
      });

      const data = await res.json();
      setUpdatingId(null);

      if (data.success) {
        success(isApproved ? 'রিভিউ অনুমোদিত হয়েছে (ওয়েবসাইটে প্রদর্শিত হবে)।' : 'রিভিউ রিজেক্ট করা হয়েছে।');
        fetchReviews();
      } else {
        error(data.message || 'অপারেশন ব্যর্থ হয়েছে।');
      }
    } catch {
      setUpdatingId(null);
      error('সার্ভার এরর');
    }
  };

  // Delete review permanently
  const handleDeleteReview = async () => {
    if (!deleteConfirmId) return;
    try {
      setUpdatingId(deleteConfirmId);
      const res = await fetch(`/api/admin/reviews?id=${deleteConfirmId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      setUpdatingId(null);
      setDeleteConfirmId(null);

      if (data.success) {
        success('রিভিউ মুছে ফেলা হয়েছে।');
        fetchReviews();
      } else {
        error(data.message || 'রিভিউ মুছতে ব্যর্থ হয়েছে।');
      }
    } catch {
      setUpdatingId(null);
      error('সার্ভার এরর');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP METRICS BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Card */}
        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              অনুমোদনের অপেক্ষায় (Pending)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-950">
              {toBanglaDigits(counts.pending)}
            </span>
            <span className="text-xs text-amber-700">টি নতুন রিভিউ</span>
          </div>
          <p className="text-[11px] text-amber-700/80 mt-1">
            ক্রেতাদের জমা দেওয়া রিভিউ ও ক্রাফট ছবি যাচাই করুন
          </p>
        </div>

        {/* Approved Card */}
        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              অনুমোদিত রিভিউ (Published)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-950">
              {toBanglaDigits(counts.approved)}
            </span>
            <span className="text-xs text-emerald-700">টি লাইভ রয়েছে</span>
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1">
            স্টোরফ্রন্ট প্রোডাক্ট পেজে সক্রিয়ভাবে প্রদর্শিত হচ্ছে
          </p>
        </div>

        {/* Total Card */}
        <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
              মোট সংগৃহীত রিভিউ
            </span>
            <MessageSquare className="w-4 h-4 text-[#D6403B]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#2B2B2B]">
              {toBanglaDigits(counts.total)}
            </span>
            <span className="text-xs text-[#6B6B6B]">টি রিভিউ</span>
          </div>
          <p className="text-[11px] text-[#6B6B6B] mt-1">
            অভিভাবকদের রেটিং ও শিশুদের আঁকা ছবির সংগ্রহ
          </p>
        </div>
      </div>

      {/* 2. FILTER TABS & SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'pending', label: 'অনুমোদনের অপেক্ষায়', count: counts.pending, dot: true },
              { id: 'approved', label: 'অনুমোদিত', count: counts.approved },
              { id: 'rejected', label: 'বাতিলকৃত' },
              { id: 'all', label: 'সব রিভিউ', count: counts.total },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-[#D6403B] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-stone-200/60'
                }`}
              >
                {tab.dot && tab.count && tab.count > 0 ? (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                ) : null}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {toBanglaDigits(tab.count)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ক্রেতার নাম, ফোন বা মন্তব্য..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] text-xs text-[#2B2B2B] focus:outline-none focus:border-[#D6403B]"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer transition-colors"
            >
              খুঁজুন
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                fetchReviews();
              }}
              className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
              title="রিফ্রেশ"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </form>
        </div>

        {/* 3. REVIEWS LIST */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-stone-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#D6403B]" />
            <span className="text-xs font-semibold">রিভিউ তালিকা লোড হচ্ছে...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <MessageSquare className="w-10 h-10 text-stone-300 mx-auto" />
            <h4 className="font-bold text-sm text-[#2B2B2B]">কোনো রিভিউ পাওয়া যায়নি</h4>
            <p className="text-xs text-[#6B6B6B]">
              নির্বাচিত ট্যাবে বর্তমানে কোনো রিভিউ জমা নেই।
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => {
              const isBusy = updatingId === rev.id;

              return (
                <div
                  key={rev.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    !rev.isApproved && rev.adminNote !== 'REJECTED'
                      ? 'bg-amber-50/30 border-amber-200'
                      : rev.isApproved
                      ? 'bg-white border-[#EFE9E0]'
                      : 'bg-stone-50 border-stone-200 opacity-70'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Left Details */}
                    <div className="space-y-2.5 flex-1 min-w-0">
                      {/* Customer Info & Status Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#2B2B2B]">{rev.authorName}</span>

                        {rev.customerPhone && (
                          <span className="text-xs font-mono text-[#6B6B6B] bg-[#FAF7F2] px-2 py-0.5 rounded-full border border-[#EFE9E0] flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-[#D6403B]" />
                            {rev.customerPhone}
                          </span>
                        )}

                        {rev.isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            ভেরিফাইড ক্রেতা
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 text-[10px] font-medium">
                            অযাচাইকৃত ফোন
                          </span>
                        )}

                        {/* Status Label */}
                        {rev.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            অনুমোদিত (Live)
                          </span>
                        ) : rev.adminNote === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            <XCircle className="w-3 h-3 text-rose-700" />
                            বাতিলকৃত (Hidden)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            অনুমোদনের অপেক্ষায়
                          </span>
                        )}
                      </div>

                      {/* Product Target & Rating */}
                      <div className="flex items-center gap-3 text-xs flex-wrap">
                        <Link
                          href={`/product/${rev.productSlug || rev.productId}`}
                          target="_blank"
                          className="font-semibold text-[#0B5F85] hover:underline flex items-center gap-1"
                        >
                          <span>{rev.productTitle}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <span className="text-stone-300">•</span>
                        <div className="flex items-center gap-1 text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                              }`}
                            />
                          ))}
                          <span className="text-[#2B2B2B] font-bold ml-1 text-xs">
                            {toBanglaDigits(rev.rating)}/৫
                          </span>
                        </div>
                        <span className="text-stone-300">•</span>
                        <span className="text-[11px] text-[#8C8C8C]">
                          {new Date(rev.createdAt).toLocaleString('bn-BD', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>

                      {/* Review Comment */}
                      <p className="text-xs sm:text-sm text-[#2B2B2B] leading-relaxed bg-[#FAF7F2] p-3 rounded-xl border border-[#EFE9E0]">
                        &quot;{rev.comment}&quot;
                      </p>

                      {/* Photos List */}
                      {rev.photos && rev.photos.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold text-[#6B6B6B] flex items-center gap-1">
                            <Camera className="w-3 h-3 text-[#D6403B]" />
                            ক্রেতার আপলোড করা ক্রাফটের ছবি ({toBanglaDigits(rev.photos.length)}টি):
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            {rev.photos.map((photoUrl, pIdx) => (
                              <div
                                key={pIdx}
                                onClick={() =>
                                  setLightboxPhoto({
                                    url: photoUrl,
                                    author: rev.authorName,
                                    title: rev.productTitle,
                                  })
                                }
                                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#EFE9E0] bg-black/5 cursor-pointer group hover:border-[#D6403B] transition-colors"
                              >
                                <Image
                                  src={photoUrl}
                                  alt="Craft preview"
                                  fill
                                  unoptimized
                                  className="object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                                  <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Moderation Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#EFE9E0]">
                      {!rev.isApproved ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleModerateReview(rev.id, true)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          {isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>অনুমোদন করুন</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleModerateReview(rev.id, false)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>হাইড করুন</span>
                        </button>
                      )}

                      {rev.adminNote !== 'REJECTED' && !rev.isApproved && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleModerateReview(rev.id, false)}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>বাতিল করুন</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setDeleteConfirmId(rev.id)}
                        className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="স্থায়ীভাবে মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. LIGHTBOX MODAL */}
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
                <span className="text-xs text-[#6B6B6B]">{lightboxPhoto.title}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-[#EFE9E0]">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="font-bold text-base text-[#2B2B2B]">রিভিউ ডিলিট কনফার্মেশন</h4>
            </div>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              আপনি কি নিশ্চিত যে এই রিভিউটি স্থায়ীভাবে মুছে ফেলতে চান? এই কাজটি আর পূর্বাবস্থায় ফিরিয়ে আনা যাবে না।
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EFE9E0]">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:bg-stone-100"
              >
                না, রাখুন
              </button>
              <button
                type="button"
                onClick={handleDeleteReview}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

