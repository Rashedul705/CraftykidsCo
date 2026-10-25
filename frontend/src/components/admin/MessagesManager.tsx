'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  PhoneCall,
  MessageCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Reply,
  RefreshCw,
  Send,
  X,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { StatusPill } from '@/components/ui/Pill';

export interface ContactMessageItem {
  id: string;
  name: string;
  phone: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  replyNote?: string;
  repliedAt?: string;
  repliedBy?: string;
  createdAt: string;
}

export function MessagesManager() {
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'replied'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reply Modal State
  const [replyingMessage, setReplyingMessage] = useState<ContactMessageItem | null>(null);
  const [replyNoteText, setReplyNoteText] = useState('');
  const [isSavingReply, setIsSavingReply] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contact-messages');
      const data = await res.json();
      if (data?.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to load contact messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  // Update status or reply
  const handleUpdateStatus = async (
    id: string,
    newStatus: 'unread' | 'read' | 'replied',
    replyNote?: string
  ) => {
    try {
      const res = await fetch('/api/contact-messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: newStatus,
          replyNote,
          repliedBy: 'Admin',
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  status: newStatus,
                  replyNote: replyNote !== undefined ? replyNote : m.replyNote,
                  repliedAt: newStatus === 'replied' ? new Date().toISOString() : m.repliedAt,
                }
              : m
          )
        );
        showToast(newStatus === 'replied' ? 'রিপ্লাই সফলভাবে সংরক্ষিত হয়েছে!' : 'স্ট্যাটাস আপডেট হয়েছে।');
      }
    } catch (err) {
      alert('স্ট্যাটাস আপডেট করা সম্ভব হয়নি।');
    }
  };

  // Delete message
  const handleDelete = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই বার্তাটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/contact-messages?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data?.success) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        showToast('বার্তাটি মুছে ফেলা হয়েছে।');
      }
    } catch (err) {
      alert('বার্তা মুছে ফেলা সম্ভব হয়নি।');
    }
  };

  // Open Reply Modal
  const openReplyModal = (msg: ContactMessageItem) => {
    setReplyingMessage(msg);
    setReplyNoteText(msg.replyNote || '');
  };

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingMessage) return;
    setIsSavingReply(true);
    await handleUpdateStatus(replyingMessage.id, 'replied', replyNoteText);
    setIsSavingReply(false);
    setReplyingMessage(null);
  };

  // Counters
  const totalCount = messages.length;
  const unreadCount = messages.filter((m) => m.status === 'unread').length;
  const repliedCount = messages.filter((m) => m.status === 'replied').length;

  // Filtered List
  const filteredMessages = messages.filter((m) => {
    if (filterStatus === 'unread' && m.status !== 'unread') return false;
    if (filterStatus === 'replied' && m.status !== 'replied') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.name?.toLowerCase().includes(q);
      const matchPhone = m.phone?.includes(q);
      const matchSubject = m.subject?.toLowerCase().includes(q);
      const matchMsg = m.message?.toLowerCase().includes(q);
      return matchName || matchPhone || matchSubject || matchMsg;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-[#1F6B43] text-white text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-black text-xl text-[#2B2B2B] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#D6403B]" />
            <span>গ্রাহক মেসেজ ও ইনবক্স (Contact Messages & Replies)</span>
          </h2>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Contact Us পেজ থেকে আসা বার্তাগুলো দেখুন, WhatsApp এ সরাসরি উত্তর দিন ও রিপ্লাই সংরক্ষণ করুন।
          </p>
        </div>

        <button
          onClick={loadMessages}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white border border-[#EFE9E0] hover:bg-[#FAF7F2] text-xs font-bold text-[#2B2B2B] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>রিফ্রেশ করুন</span>
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setFilterStatus('all')}
          className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all ${
            filterStatus === 'all'
              ? 'border-[#2B2B2B] shadow-sm ring-2 ring-[#2B2B2B]/10'
              : 'border-[#EFE9E0] hover:border-[#CCCCCC]'
          }`}
        >
          <div className="text-xs font-bold text-[#6B6B6B]">মোট বার্তা (Total)</div>
          <div className="font-heading font-black text-2xl text-[#2B2B2B] mt-1">{totalCount}</div>
          <div className="text-[11px] text-[#888888] mt-0.5">সকল ইনবক্স মেসেজ</div>
        </div>

        <div
          onClick={() => setFilterStatus('unread')}
          className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all ${
            filterStatus === 'unread'
              ? 'border-[#D6403B] shadow-sm ring-2 ring-[#D6403B]/10'
              : 'border-[#EFE9E0] hover:border-[#CCCCCC]'
          }`}
        >
          <div className="text-xs font-bold text-[#D6403B] flex items-center justify-between">
            <span>অপঠিত বার্তা (Unread)</span>
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#D6403B] animate-ping" />
            )}
          </div>
          <div className="font-heading font-black text-2xl text-[#D6403B] mt-1">{unreadCount}</div>
          <div className="text-[11px] text-[#6B6B6B] mt-0.5">উত্তর দেওয়ার অপেক্ষায় রয়েছে</div>
        </div>

        <div
          onClick={() => setFilterStatus('replied')}
          className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all ${
            filterStatus === 'replied'
              ? 'border-[#1F6B43] shadow-sm ring-2 ring-[#1F6B43]/10'
              : 'border-[#EFE9E0] hover:border-[#CCCCCC]'
          }`}
        >
          <div className="text-xs font-bold text-[#1F6B43]">উত্তর দেওয়া হয়েছে (Replied)</div>
          <div className="font-heading font-black text-2xl text-[#1F6B43] mt-1">{repliedCount}</div>
          <div className="text-[11px] text-[#6B6B6B] mt-0.5">সম্পন্ন হওয়া বার্তা</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-[#2B2B2B] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#2B2B2B]'
            }`}
          >
            সবগুলো ({totalCount})
          </button>
          <button
            onClick={() => setFilterStatus('unread')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'unread'
                ? 'bg-[#D6403B] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#2B2B2B]'
            }`}
          >
            অপঠিত ({unreadCount})
          </button>
          <button
            onClick={() => setFilterStatus('replied')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'replied'
                ? 'bg-[#1F6B43] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#2B2B2B]'
            }`}
          >
            উত্তর দেওয়া হয়েছে ({repliedCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[#999999] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="নাম, ফোন বা বার্তা খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] text-xs text-[#2B2B2B] focus:bg-white focus:outline-none focus:border-[#D6403B] transition-all"
          />
        </div>
      </div>

      {/* Message Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#6B6B6B] bg-white rounded-2xl border border-[#EFE9E0]">
            মেসেজ লোড হচ্ছে...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center space-y-2 bg-white rounded-2xl border border-[#EFE9E0]">
            <MessageSquare className="w-8 h-8 text-[#CCCCCC] mx-auto" />
            <h4 className="font-heading font-bold text-sm text-[#2B2B2B]">কোনো বার্তা পাওয়া যায়নি</h4>
            <p className="text-xs text-[#6B6B6B]">
              {searchQuery ? 'আপনার সার্চের সাথে কোনো ফলাফল মেলেনি।' : 'ইনবক্সে কোনো নতুন বার্তা নেই।'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const cleanPhone = msg.phone.replace(/[^\d]/g, '');
            const waNumber = cleanPhone.startsWith('880')
              ? cleanPhone
              : cleanPhone.startsWith('0')
              ? `88${cleanPhone}`
              : `880${cleanPhone}`;

            const waReplyText = encodeURIComponent(
              `হ্যালো ${msg.name}! CraftyKidsCo কাস্টমার সাপোর্ট থেকে যোগাযোগ করছি। আপনার জিজ্ঞাসা: "${msg.subject}"-এর ব্যাপারে:`
            );

            return (
              <div
                key={msg.id}
                className={`p-5 rounded-2xl bg-white border transition-all space-y-3.5 shadow-xs ${
                  msg.status === 'unread'
                    ? 'border-[#D6403B]/40 bg-gradient-to-r from-white via-white to-[#FFF5F5]'
                    : 'border-[#EFE9E0]'
                }`}
              >
                {/* Header Row: Name, Phone, Status badge, Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#F5F1EB]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] flex items-center justify-center font-bold text-sm text-[#2B2B2B]">
                      {msg.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm text-[#2B2B2B]">
                          {msg.name}
                        </span>
                        <span className="font-mono text-xs text-[#6B6B6B] font-semibold">
                          {msg.phone}
                        </span>
                      </div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#EFE9E0] text-[10px] font-bold text-[#555555]">
                        {msg.subject || 'সাধারণ জিজ্ঞাসা'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {msg.status === 'unread' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEE2E2] text-[#DC2626] text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                        অপঠিত
                      </span>
                    ) : msg.status === 'replied' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#16A34A] text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        উত্তর দেওয়া হয়েছে
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F3F4F6] text-[#4B5563] text-[11px] font-bold">
                        পঠিত
                      </span>
                    )}

                    <span className="text-[11px] text-[#888888] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(msg.createdAt).toLocaleDateString('bn-BD', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Message Body */}
                <div className="text-xs sm:text-sm text-[#333333] leading-relaxed whitespace-pre-wrap bg-[#FAF7F2]/50 p-3.5 rounded-xl border border-[#F0EBE3]">
                  {msg.message}
                </div>

                {/* If already replied: display admin reply box */}
                {msg.replyNote && (
                  <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] space-y-1">
                    <div className="flex items-center justify-between font-bold text-[11px] text-[#15803D]">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        অ্যাডমিন নোট / রিপ্লাই:
                      </span>
                      {msg.repliedAt && (
                        <span className="text-[10px] text-[#166534]/70">
                          {new Date(msg.repliedAt).toLocaleDateString('bn-BD')}
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.replyNote}</p>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* Left Action Buttons: WhatsApp, Call, Reply */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Direct WhatsApp Reply */}
                    <a
                      href={`https://wa.me/${waNumber}?text=${waReplyText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-xs transition-colors shadow-xs"
                      title="WhatsApp-এ সরাসরি উত্তর পাঠান"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp-এ মেসেজ দিন</span>
                    </a>

                    {/* Direct Call */}
                    <a
                      href={`tel:${msg.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#EFE9E0] hover:bg-[#FAF7F2] text-[#2B2B2B] font-bold text-xs transition-colors shadow-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-[#D6403B]" />
                      <span>কল দিন</span>
                    </a>

                    {/* Reply / Note modal trigger */}
                    <button
                      onClick={() => openReplyModal(msg)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D6403B] hover:bg-[#BF3430] text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>{msg.replyNote ? 'রিপ্লাই সম্পাদন করুন' : 'রিপ্লাই ও স্ট্যাটাস লিখুন'}</span>
                    </button>
                  </div>

                  {/* Right Actions: Mark as unread/read, Delete */}
                  <div className="flex items-center gap-2 text-xs">
                    {msg.status === 'unread' ? (
                      <button
                        onClick={() => handleUpdateStatus(msg.id, 'read')}
                        className="text-[#6B6B6B] hover:text-[#2B2B2B] font-medium underline"
                      >
                        পঠিত মার্ক করুন
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(msg.id, 'unread')}
                        className="text-[#6B6B6B] hover:text-[#2B2B2B] font-medium underline"
                      >
                        অপঠিত মার্ক করুন
                      </button>
                    )}

                    <span className="text-[#CCCCCC]">•</span>

                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="text-[#DC2626] hover:text-[#B91C1C] flex items-center gap-1 font-bold cursor-pointer"
                      title="বার্তা মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>মুছুন</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply Modal */}
      {replyingMessage && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#EFEAE2]">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <div>
                <span className="text-[10px] text-[#6B6B6B] block">কাস্টমার রিপ্লাই ও সমাধান</span>
                <h3 className="font-heading font-black text-lg text-[#2B2B2B]">
                  {replyingMessage.name} ({replyingMessage.phone})
                </h3>
              </div>
              <button
                onClick={() => setReplyingMessage(null)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#EFE9E0] flex items-center justify-center text-[#6B6B6B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#555555] bg-[#FAF7F2] p-3 rounded-xl border border-[#EFE9E0] space-y-1">
              <span className="font-bold text-[#2B2B2B] block">মূল বার্তা:</span>
              <p className="whitespace-pre-wrap">{replyingMessage.message}</p>
            </div>

            <form onSubmit={submitReply} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#2B2B2B]">
                  অ্যাডমিন রিপ্লাই / অ্যাকশন নোট (Admin Resolution Note)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="উদাঃ গ্রাহককে হোয়াটসঅ্যাপে স্পেশাল প্রাইস কোটেশন ও পণ্যের লিংক পাঠানো হয়েছে..."
                  value={replyNoteText}
                  onChange={(e) => setReplyNoteText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] text-xs text-[#2B2B2B] focus:outline-none focus:border-[#D6403B] transition-all"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href={`https://wa.me/${
                    replyingMessage.phone.startsWith('880')
                      ? replyingMessage.phone
                      : `880${replyingMessage.phone.replace(/[^\d]/g, '')}`
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#25D366] hover:underline flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp এ সরাসরি চ্যাট করুন</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReplyingMessage(null)}
                    className="px-4 py-2 rounded-xl border border-[#EFE9E0] text-xs font-bold text-[#6B6B6B] hover:bg-[#FAF7F2]"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingReply}
                    className="px-5 py-2 rounded-xl bg-[#1F6B43] hover:bg-[#165534] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingReply ? 'সংরক্ষণ হচ্ছে...' : 'রিপ্লাই ও সম্পন্ন মার্ক করুন'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
