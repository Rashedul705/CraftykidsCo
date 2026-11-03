'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  MessageSquare,
  ShieldAlert,
  BookOpen,
  HelpCircle,
  BarChart3,
  CheckCircle,
  Plus,
  Trash2,
  ExternalLink,
  Phone,
  Save,
  Truck,
  TrendingUp,
  Loader2,
  Search,
  RefreshCw,
  DollarSign,
  Calendar,
  Boxes,
  Percent,
} from 'lucide-react';
import { StatusPill } from '@/components/ui/Pill';

interface AnalyticsData {
  range: string;
  totalOrders: number;
  financials: {
    grossRevenue: number;
    cogs: number;
    deliveryCollected: number;
    discountsGiven: number;
    netProfit: number;
    profitMargin: number;
  };
  logistics: {
    deliveredCount: number;
    deliveredRevenue: number;
    inTransitCount: number;
    inTransitAmount: number;
    pendingCount: number;
    pendingAmount: number;
    confirmedCount: number;
    confirmedAmount: number;
    returnedCount: number;
    returnedLoss: number;
    cancelledCount: number;
    cancelledAmount: number;
    returnRate: number;
  };
  topProducts: Array<{
    title: string;
    unitsSold: number;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
  }>;
  dailyTrend: Array<{
    date: string;
    label: string;
    revenue: number;
    ordersCount: number;
  }>;
}

interface SystemSettingsManagerProps {
  activeTab: 'payments-sms' | 'block-list' | 'blog' | 'faq-policies' | 'reports';
  onNavigateTab?: (tab: string) => void;
}

export function SystemSettingsManager({ activeTab, onNavigateTab }: SystemSettingsManagerProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  // Payments & SMS states
  const [codEnabled, setCodEnabled] = useState(true);
  const [bkashNumber, setBkashNumber] = useState('01712345678');
  const [nagadNumber, setNagadNumber] = useState('01812345678');
  const [storeBrandName, setStoreBrandName] = useState('CraftyKidsCo');
  const [supportPhone, setSupportPhone] = useState('+880 1712-345678');
  const [supportEmail, setSupportEmail] = useState('support@craftykidsco.com');

  // Blocklist states
  const [blockList, setBlockList] = useState<Array<{ id: string; phone: string; reason: string; date: string }>>([]);
  const [isLoadingBlockList, setIsLoadingBlockList] = useState(false);
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);
  const [blockSearchQuery, setBlockSearchQuery] = useState('');
  const [newBlockPhone, setNewBlockPhone] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');

  const fetchBlockList = useCallback(async (search = '') => {
    setIsLoadingBlockList(true);
    try {
      const url = search ? `/api/blocklist?q=${encodeURIComponent(search)}` : '/api/blocklist';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          setBlockList(data.items);
        }
      }
    } catch (err) {
      console.error('Failed to load blocklist:', err);
    } finally {
      setIsLoadingBlockList(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'block-list') {
      fetchBlockList(blockSearchQuery);
    }
  }, [activeTab, fetchBlockList, blockSearchQuery]);

  // Reports & Analytics states
  const [selectedRange, setSelectedRange] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  const fetchReportsAnalytics = useCallback(async (range = '30d') => {
    setIsLoadingReports(true);
    try {
      const res = await fetch(`/api/reports/analytics?range=${range}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAnalyticsData(data);
        }
      }
    } catch (err) {
      console.error('Failed to load reports analytics:', err);
    } finally {
      setIsLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReportsAnalytics(selectedRange);
    }
  }, [activeTab, selectedRange, fetchReportsAnalytics]);

  // Blog states
  const [blogs, setBlogs] = useState<Array<{ id: string; title: string; category: string; date: string; status: string }>>([
    { id: 'blog-1', title: 'শিশুদের জন্য নিরাপদ মোমের রং চেনার ৫টি উপায়', category: 'Parenting Guide', date: 'Oct 14, 2026', status: 'Published' },
    { id: 'blog-2', title: 'মন্টেসরি কাঠের খেলনা শিশুর মস্তিষ্কের বিকাশে কীভাবে সহায়তা করে?', category: 'Child Development', date: 'Oct 08, 2026', status: 'Published' },
    { id: 'blog-3', title: 'ন্যাচারাল মৌচাকের মোম কেন শিশুদের জন্য শতভাগ নিরাপদ', category: 'Product Insight', date: 'Oct 02, 2026', status: 'Published' },
  ]);

  // FAQs states
  const [faqs, setFaqs] = useState<Array<{ id: string; question: string; answer: string; category: string }>>([
    {
      id: 'faq-1',
      question: 'CraftyKidsCo মোমের রঙ কি সত্যিই শতভাগ শিশু-নিরাপদ?',
      answer: 'হ্যাঁ, আমাদের প্রতিটি রঙ প্রাকৃতিক মৌচাকের মোম (Beeswax) এবং ফুড-গ্রেড অরগানিক পিগমেন্ট দিয়ে তৈরি। ক্ষতিকর প্যারাফিন বা ভারী ধাতু সম্পূর্ণ মুক্ত।',
      category: 'নিরাপত্তা',
    },
    {
      id: 'faq-2',
      question: 'ডেলিভারি পেতে কতদিন সময় লাগবে?',
      answer: 'ঢাকা সিটির ভেতরে ২৪ থেকে ৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে যেকোনো জেলায় ২ থেকে ৪ কার্যদিবসের মধ্যে স্টিডফাস্ট কুরিয়ারের মাধ্যমে ডেলিভারি সম্পন্ন হয়।',
      category: 'ডেলিভারি',
    },
    {
      id: 'faq-3',
      question: 'পণ্য পছন্দ না হলে বা ক্ষতিগ্রস্ত হলে কি রিটার্ন করা যাবে?',
      answer: 'হ্যাঁ, পণ্য পাওয়ার ৭ দিনের মধ্যে আমাদের হোয়াটসঅ্যাপে জানালে সম্পূর্ণ ফ্রিতে এক্সচেঞ্জ বা শতভাগ রিফান্ড প্রদান করা হয়।',
      category: 'রিটার্ন ও রিফান্ড',
    },
  ]);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('System settings saved successfully!');
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockPhone.trim()) return;
    setIsSubmittingBlock(true);

    try {
      const res = await fetch('/api/blocklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: newBlockPhone.trim(),
          reason: newBlockReason.trim() || 'High return risk / Repeated fake orders',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'নম্বরটি সফলভাবে ব্লকলিস্টে যুক্ত করা হয়েছে।');
        setNewBlockPhone('');
        setNewBlockReason('');
        fetchBlockList(blockSearchQuery);
      } else {
        showToast(data.message || 'ব্লকলিস্টে যোগ করতে সমস্যা হয়েছে');
      }
    } catch {
      showToast('সার্ভার এরর: ব্লকলিস্টে যোগ করা যায়নি');
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  const handleUnblock = async (id: string, phone: string) => {
    if (!confirm(`${phone} নম্বরটি কি ব্লকলিস্ট থেকে মুক্ত করতে চান?`)) return;

    try {
      const res = await fetch(`/api/blocklist?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'নম্বরটি ব্লকলিস্ট থেকে মুছে ফেলা হয়েছে');
        setBlockList((prev) => prev.filter((b) => b.id !== id));
      } else {
        showToast(data.message || 'আনব্লক করতে সমস্যা হয়েছে');
      }
    } catch {
      showToast('সার্ভার এরর');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast */}
      {feedback && (
        <div className="p-3.5 rounded-[12px] bg-[#DDF3E6] border border-[#BDE7CC] text-xs font-bold text-[#1F6B43] flex items-center justify-between shadow-xs">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-[#6B6B6B] hover:text-[#2B2B2B]">
            ✕
          </button>
        </div>
      )}

      {/* VIEW: PAYMENTS & SMS */}
      {activeTab === 'payments-sms' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Brand Info */}
          <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
            <h3 className="font-heading font-black text-base text-[#2B2B2B]">Storefront Brand Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">Brand Name:</label>
                <input
                  type="text"
                  value={storeBrandName}
                  onChange={(e) => setStoreBrandName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B]"
                />
              </div>
              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">Customer Support Phone:</label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B]"
                />
              </div>
              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">Support Email:</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B]"
                />
              </div>
            </div>
          </div>

          {/* Payment Gateways */}
          <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
            <h3 className="font-heading font-black text-base text-[#2B2B2B] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#D6403B]" /> Payment Methods Configuration
            </h3>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] flex items-center justify-between">
                <div>
                  <strong className="text-sm text-[#2B2B2B] block">Cash on Delivery (COD)</strong>
                  <span className="text-[#6B6B6B]">Allow customers to pay cash when Steadfast delivers the parcel.</span>
                </div>
                <input
                  type="checkbox"
                  checked={codEnabled}
                  onChange={(e) => setCodEnabled(e.target.checked)}
                  className="w-4 h-4 text-[#D6403B] rounded cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[#EFE9E0] space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs text-[#2B2B2B]">bKash Payment Gateway</strong>
                    <StatusPill variant="green" dot>Active</StatusPill>
                  </div>
                  <label className="text-[11px] text-[#6B6B6B] block">Merchant Number / Account:</label>
                  <input
                    type="text"
                    value={bkashNumber}
                    onChange={(e) => setBkashNumber(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#EFE9E0] font-mono text-xs focus:outline-[#D6403B]"
                  />
                </div>

                <div className="p-4 rounded-xl border border-[#EFE9E0] space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs text-[#2B2B2B]">Nagad Payment Gateway</strong>
                    <StatusPill variant="green" dot>Active</StatusPill>
                  </div>
                  <label className="text-[11px] text-[#6B6B6B] block">Merchant Number / Account:</label>
                  <input
                    type="text"
                    value={nagadNumber}
                    onChange={(e) => setNagadNumber(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#EFE9E0] font-mono text-xs focus:outline-[#D6403B]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SMS & Courier Gateway status */}
          <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
            <h3 className="font-heading font-black text-base text-[#2B2B2B] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#1F6B43]" /> SMS &amp; Courier Service Status
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-[#2B2B2B]">SMS Gateway (BulkSMSBD)</strong>
                  <StatusPill variant="green" dot>Connected</StatusPill>
                </div>
                <p className="text-[#6B6B6B]">Live Balance: <strong className="text-[#1F6B43]">৳2,450.00</strong></p>
                <p className="text-[#6B6B6B]">Approved Sender Mask: <strong className="font-mono text-[#2B2B2B]">CraftyKids</strong></p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-[#2B2B2B]">Courier Gateway (Steadfast)</strong>
                  <StatusPill variant="green" dot>Connected</StatusPill>
                </div>
                <p className="text-[#6B6B6B]">API Key: <strong className="font-mono text-[#2B2B2B]">stf_••••••••281</strong></p>
                <p className="text-[#6B6B6B]">Secret: <strong className="font-mono text-[#2B2B2B]">sec_••••••••419</strong></p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#D6403B] text-white text-xs font-bold hover:bg-[#B5322E] flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" /> Save System Settings
              </button>
            </div>
          </div>
        </form>
      )}

      {/* VIEW: BLOCK LIST */}
      {activeTab === 'block-list' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-heading font-black text-base text-[#2B2B2B] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#D6403B]" /> Restrict Suspicious Numbers (Fraud Shield)
              </h3>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                মোট {blockList.length}টি নম্বর ব্লকড
              </span>
            </div>
            <p className="text-xs text-[#6B6B6B]">
              ব্লকলিস্টে থাকা ফোন নম্বরগুলো স্টোরফ্রন্টে কোনো ক্যাশ অন ডেলিভারি (COD) অর্ডার করতে পারবে না। এটি ডাটাবেজে স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকে এবং চেকআউটে তাৎক্ষণিকভাবে ইন্টারসেপ্ট করে।
            </p>

            <form onSubmit={handleAddBlock} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                placeholder="মোবাইল নম্বর (যেমন: 017XXXXXXXX)"
                value={newBlockPhone}
                onChange={(e) => setNewBlockPhone(e.target.value)}
                className="p-2.5 rounded-xl border border-[#EFE9E0] text-xs font-mono focus:outline-[#D6403B]"
              />
              <input
                type="text"
                placeholder="ব্লক করার কারণ (যেমন: ফেক অর্ডার / কুরিয়ার পার্সেল প্রত্যাখ্যান)"
                value={newBlockReason}
                onChange={(e) => setNewBlockReason(e.target.value)}
                className="flex-1 p-2.5 rounded-xl border border-[#EFE9E0] text-xs focus:outline-[#D6403B]"
              />
              <button
                type="submit"
                disabled={isSubmittingBlock || !newBlockPhone.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#D6403B] text-white text-xs font-bold hover:bg-[#B5322E] shrink-0 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmittingBlock ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> সংরক্ষণ হচ্ছে...
                  </>
                ) : (
                  '+ Block Number'
                )}
              </button>
            </form>
          </div>

          {/* Search & Table */}
          <div className="bg-white rounded-2xl border border-[#EFE9E0] shadow-xs overflow-hidden space-y-3 p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-[#EFE9E0]">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#6B6B6B]" />
                <input
                  type="text"
                  placeholder="নম্বর বা কারণ দিয়ে খুঁজুন..."
                  value={blockSearchQuery}
                  onChange={(e) => setBlockSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] text-xs focus:outline-[#D6403B]"
                />
              </div>

              <button
                onClick={() => fetchBlockList(blockSearchQuery)}
                disabled={isLoadingBlockList}
                className="p-2 rounded-xl border border-[#EFE9E0] hover:bg-[#FAF7F2] text-xs font-bold text-[#6B6B6B] flex items-center gap-1 self-end sm:self-auto"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBlockList ? 'animate-spin text-[#D6403B]' : ''}`} />
                রিলোড
              </button>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF7F2] text-[#6B6B6B] border-b border-[#EFE9E0] text-[11px] font-semibold">
                    <th className="py-3 px-4">Blocked Phone</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Date Added</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE9E0]">
                  {isLoadingBlockList && blockList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[#6B6B6B]">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#D6403B] mb-2" />
                        ব্লকলিস্ট লোড হচ্ছে...
                      </td>
                    </tr>
                  ) : blockList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[#6B6B6B]">
                        কোনো নম্বর ব্লকলিস্টে পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    blockList.map((item) => (
                      <tr key={item.id} className="hover:bg-[#FAF7F2]/50">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#D6403B]">{item.phone}</td>
                        <td className="py-3.5 px-4 text-[#2B2B2B]">{item.reason}</td>
                        <td className="py-3.5 px-4 text-[#6B6B6B]">{item.date}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleUnblock(item.id, item.phone)}
                            className="px-2.5 py-1 rounded-lg border border-[#EFE9E0] hover:bg-[#DDF3E6] hover:text-[#1F6B43] text-[11px] font-bold"
                          >
                            Unblock
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: BLOG */}
      {activeTab === 'blog' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-black text-lg text-[#2B2B2B]">Parenting &amp; Safety Blog Posts</h3>
              <p className="text-xs text-[#6B6B6B]">Educational articles for parents about child development and safety.</p>
            </div>
            <button
              onClick={() => showToast('Blog article editor opened.')}
              className="px-4 py-2 rounded-xl bg-[#D6403B] text-white text-xs font-bold hover:bg-[#B5322E] flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> + Write Article
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogs.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-[#EFE9E0] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#D6403B]">{b.category}</span>
                  <StatusPill variant="green" dot>{b.status}</StatusPill>
                </div>
                <h4 className="font-heading font-bold text-sm text-[#2B2B2B] leading-snug">{b.title}</h4>
                <div className="pt-2 border-t border-[#EFE9E0] flex items-center justify-between text-[11px] text-[#6B6B6B]">
                  <span>{b.date}</span>
                  <button onClick={() => showToast('Article editing modal')} className="text-[#D6403B] font-bold hover:underline">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: FAQ & POLICIES */}
      {activeTab === 'faq-policies' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-black text-lg text-[#2B2B2B]">Frequently Asked Questions &amp; Policies</h3>
              <p className="text-xs text-[#6B6B6B]">Manage customer trust FAQs, return policies, and safety standards.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab?.('page-editor')}
                className="px-3.5 py-2 rounded-xl bg-white border border-[#EFE9E0] text-[#2B2B2B] hover:bg-[#FAF7F2] text-xs font-bold transition-colors"
              >
                পেজ এডিটর (Page Editor)
              </button>
              <button
                onClick={() => showToast('Add FAQ modal opened.')}
                className="px-4 py-2 rounded-xl bg-[#D6403B] text-white text-xs font-bold hover:bg-[#B5322E] flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> + Add FAQ
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.id} className="bg-white rounded-2xl border border-[#EFE9E0] p-5 shadow-xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#D6403B] text-[11px]">{f.category}</span>
                  <button onClick={() => showToast('FAQ updated.')} className="text-[#6B6B6B] hover:text-[#2B2B2B] text-[11px]">
                    Edit
                  </button>
                </div>
                <h4 className="font-heading font-bold text-sm text-[#2B2B2B]">{f.question}</h4>
                <p className="text-[#6B6B6B] leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: REPORTS (REAL MONGODB FINANCIAL & PROFIT ANALYTICS) */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Header & Range Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-[#EFE9E0] p-5 shadow-xs">
            <div>
              <h3 className="font-heading font-black text-base sm:text-lg text-[#2B2B2B] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#D6403B]" /> আর্থিক রিপোর্ট ও নিট প্রফিট (Financial Analytics)
              </h3>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                রিয়েল MongoDB অর্ডার এবং প্রতিটি পণ্যের ক্রয়মূল্য (COGS) থেকে স্বয়ংক্রিয়ভাবে হিসাবকৃত।
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center rounded-xl bg-[#FAF7F2] p-1 border border-[#EFE9E0] text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedRange('today')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    selectedRange === 'today'
                      ? 'bg-[#D6403B] text-white shadow-xs'
                      : 'text-[#6B6B6B] hover:text-[#2B2B2B]'
                  }`}
                >
                  আজ (Today)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRange('7d')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    selectedRange === '7d'
                      ? 'bg-[#D6403B] text-white shadow-xs'
                      : 'text-[#6B6B6B] hover:text-[#2B2B2B]'
                  }`}
                >
                  বিগত ৭ দিন
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRange('30d')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    selectedRange === '30d'
                      ? 'bg-[#D6403B] text-white shadow-xs'
                      : 'text-[#6B6B6B] hover:text-[#2B2B2B]'
                  }`}
                >
                  বিগত ৩০ দিন
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRange('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    selectedRange === 'all'
                      ? 'bg-[#D6403B] text-white shadow-xs'
                      : 'text-[#6B6B6B] hover:text-[#2B2B2B]'
                  }`}
                >
                  সর্বমোট (All Time)
                </button>
              </div>

              <button
                type="button"
                onClick={() => fetchReportsAnalytics(selectedRange)}
                disabled={isLoadingReports}
                className="p-2.5 rounded-xl border border-[#EFE9E0] hover:bg-[#FAF7F2] text-[#6B6B6B] transition-colors"
                title="রিপোর্ট রিলোড করুন"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingReports ? 'animate-spin text-[#D6403B]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoadingReports && !analyticsData && (
            <div className="bg-white rounded-2xl border border-[#EFE9E0] p-12 text-center shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin text-[#D6403B] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#6B6B6B]">আর্থিক এনালিটিক্স হিসাব করা হচ্ছে...</p>
            </div>
          )}

          {analyticsData && (
            <>
              {/* PRIMARY FINANCIAL KPI CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Gross Revenue */}
                <div className="bg-white rounded-2xl border border-[#EFE9E0] p-5 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between text-[#6B6B6B] text-xs font-medium">
                    <span>মোট রেভিনিউ (Gross Sales)</span>
                    <TrendingUp className="w-4 h-4 text-[#1F6B43]" />
                  </div>
                  <div className="mt-2">
                    <span className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B] block">
                      ৳{analyticsData.financials.grossRevenue.toLocaleString('bn-BD')}
                    </span>
                    <span className="text-[11px] font-bold text-[#6B6B6B] mt-1 block">
                      মোট {analyticsData.totalOrders}টি অর্ডার থেকে
                    </span>
                  </div>
                </div>

                {/* COGS (Cost of Goods Sold) */}
                <div className="bg-white rounded-2xl border border-[#EFE9E0] p-5 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between text-[#6B6B6B] text-xs font-medium">
                    <span>পণ্য ক্রয়/উৎপাদন খরচ (COGS)</span>
                    <Boxes className="w-4 h-4 text-[#B76E00]" />
                  </div>
                  <div className="mt-2">
                    <span className="font-heading font-black text-2xl sm:text-3xl text-[#B76E00] block">
                      ৳{analyticsData.financials.cogs.toLocaleString('bn-BD')}
                    </span>
                    <span className="text-[11px] font-bold text-[#6B6B6B] mt-1 block">
                      পণ্যের কাঁচামাল ও উৎপাদন খরচ
                    </span>
                  </div>
                </div>

                {/* Net Profit */}
                <div className="bg-white rounded-2xl border border-[#C4EDCD] bg-gradient-to-br from-white to-[#F0FAF2] p-5 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between text-[#1F6B43] text-xs font-medium">
                    <span>প্রকৃত নিট লাভ (Net Profit)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#DDF3E6] text-[#1F6B43] border border-[#BDE7CC]">
                      {analyticsData.financials.profitMargin}% মার্জিন
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="font-heading font-black text-2xl sm:text-3xl text-[#1F6B43] block">
                      ৳{analyticsData.financials.netProfit.toLocaleString('bn-BD')}
                    </span>
                    <span className="text-[11px] font-bold text-[#2D7A3E] mt-1 block">
                      বিক্রি থেকে খরচ ও রিটার্ন বাদ দিয়ে
                    </span>
                  </div>
                </div>

                {/* Collected / Delivered Sales */}
                <div className="bg-white rounded-2xl border border-[#EFE9E0] p-5 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between text-[#6B6B6B] text-xs font-medium">
                    <span>কালেক্টেড ক্যাশ (Delivered)</span>
                    <CheckCircle className="w-4 h-4 text-[#0B5F85]" />
                  </div>
                  <div className="mt-2">
                    <span className="font-heading font-black text-2xl sm:text-3xl text-[#0B5F85] block">
                      ৳{analyticsData.logistics.deliveredRevenue.toLocaleString('bn-BD')}
                    </span>
                    <span className="text-[11px] font-bold text-[#0B5F85] mt-1 block">
                      {analyticsData.logistics.deliveredCount}টি ডেলিভারি সম্পন্ন
                    </span>
                  </div>
                </div>
              </div>

              {/* SECONDARY LOGISTICS & RISK METRICS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* In Transit */}
                <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
                  <span className="text-xs font-medium text-[#6B6B6B] block">কুরিয়ারে চলমান ক্যাশ</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-heading font-black text-xl text-[#0B5F85]">
                      ৳{analyticsData.logistics.inTransitAmount.toLocaleString('bn-BD')}
                    </span>
                    <span className="text-[11px] font-bold text-[#0B5F85]">
                      {analyticsData.logistics.inTransitCount} পার্সেল
                    </span>
                  </div>
                </div>

                {/* Pending & Confirmed */}
                <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
                  <span className="text-xs font-medium text-[#6B6B6B] block">অপেক্ষমান ও প্রসেসিং</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-heading font-black text-xl text-[#B76E00]">
                      ৳{(analyticsData.logistics.pendingAmount + analyticsData.logistics.confirmedAmount).toLocaleString('bn-BD')}
                    </span>
                    <span className="text-[11px] font-bold text-[#B76E00]">
                      {analyticsData.logistics.pendingCount + analyticsData.logistics.confirmedCount}টি অর্ডার
                    </span>
                  </div>
                </div>

                {/* Return Rate */}
                <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
                  <span className="text-xs font-medium text-[#6B6B6B] block">কুরিয়ার রিটার্ন রেট</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className={`font-heading font-black text-xl ${analyticsData.logistics.returnRate > 10 ? 'text-[#D6403B]' : 'text-[#1F6B43]'}`}>
                      {analyticsData.logistics.returnRate}%
                    </span>
                    <span className="text-[11px] text-[#6B6B6B]">
                      {analyticsData.logistics.returnedCount}টি ফেরত
                    </span>
                  </div>
                </div>

                {/* Returned & Cancelled Losses */}
                <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
                  <span className="text-xs font-medium text-[#6B6B6B] block">বাতিল ও রিটার্ন লস</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-heading font-black text-xl text-[#D6403B]">
                      ৳{analyticsData.logistics.returnedLoss.toLocaleString('bn-BD')}
                    </span>
                    <span className="text-[11px] text-[#D6403B]">
                      {analyticsData.logistics.cancelledCount}টি বাতিল
                    </span>
                  </div>
                </div>
              </div>

              {/* DAILY SALES TREND (IF AVAILABLE) */}
              {analyticsData.dailyTrend && analyticsData.dailyTrend.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-[#2B2B2B]">দৈনিক সেলস ট্রেন্ড (Daily Revenue Trend)</h4>
                      <p className="text-xs text-[#6B6B6B]">প্রতিদিনের মোট বিক্রির পরিমাণ</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto pt-2">
                    <div className="flex items-end gap-3 min-w-[500px] h-36 border-b border-[#EFE9E0] pb-2 px-2">
                      {analyticsData.dailyTrend.map((day, idx) => {
                        const maxRev = Math.max(...analyticsData.dailyTrend.map((d) => d.revenue), 1);
                        const heightPercent = Math.max(12, Math.round((day.revenue / maxRev) * 100));
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                            {/* Hover tooltip */}
                            <div className="absolute -top-9 bg-[#2B2B2B] text-white text-[10px] font-bold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md">
                              ৳{day.revenue.toLocaleString('bn-BD')} ({day.ordersCount} অর্ডার)
                            </div>
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className="w-full max-w-[36px] rounded-t-lg bg-[#FF6B6B] hover:bg-[#D6403B] transition-all cursor-pointer"
                            />
                            <span className="text-[10px] font-bold text-[#6B6B6B] truncate w-full text-center">
                              {day.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TOP PRODUCTS BY REAL REVENUE & PROFIT TABLE */}
              <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-[#2B2B2B]">
                      সর্বাধিক বিক্রিত পণ্য ও প্রফিট মার্জিন (Top Products by Revenue &amp; Margin)
                    </h4>
                    <p className="text-xs text-[#6B6B6B]">রিয়েল পণ্যের ক্রয়মূল্য বাদ দিয়ে প্রতিটি পণ্যে নিট লাভ</p>
                  </div>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAF7F2] border-b border-[#EFE9E0] text-[11px] text-[#6B6B6B]">
                        <th className="py-3 px-3">পণ্যের নাম (Product Name)</th>
                        <th className="py-3 px-3">বিক্রির সংখ্যা</th>
                        <th className="py-3 px-3">মোট রেভিনিউ</th>
                        <th className="py-3 px-3">মোট ক্রয় খরচ (COGS)</th>
                        <th className="py-3 px-3">নিট প্রফিট</th>
                        <th className="py-3 px-3 text-right">প্রফিট মার্জিন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE9E0]">
                      {analyticsData.topProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[#6B6B6B]">
                            এই সময়ে কোনো বিক্রিত পণ্য পাওয়া যায়নি।
                          </td>
                        </tr>
                      ) : (
                        analyticsData.topProducts.map((p, idx) => (
                          <tr key={idx} className="hover:bg-[#FAF7F2]/50">
                            <td className="py-3.5 px-3 font-bold text-[#2B2B2B] max-w-xs truncate">
                              {p.title}
                            </td>
                            <td className="py-3.5 px-3 font-semibold text-[#2B2B2B]">
                              {p.unitsSold} টি
                            </td>
                            <td className="py-3.5 px-3 font-bold text-[#2B2B2B]">
                              ৳{p.revenue.toLocaleString('bn-BD')}
                            </td>
                            <td className="py-3.5 px-3 font-medium text-[#B76E00]">
                              ৳{p.cost.toLocaleString('bn-BD')}
                            </td>
                            <td className="py-3.5 px-3 font-bold text-[#1F6B43]">
                              ৳{p.profit.toLocaleString('bn-BD')}
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EBF8EE] text-[#2D7A3E] border border-[#C4EDCD]">
                                {p.margin}%
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
export default SystemSettingsManager;
