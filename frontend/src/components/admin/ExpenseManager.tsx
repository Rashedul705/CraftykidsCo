'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Layers,
  PieChart,
  DollarSign,
  Receipt,
  Megaphone,
  Box,
  Truck,
  Users,
  Building,
  Laptop,
  HelpCircle,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ExpenseItem {
  _id: string;
  title: string;
  category:
    | 'FB_ADS'
    | 'PACKAGING'
    | 'COURIER'
    | 'SALARY'
    | 'OFFICE_RENT'
    | 'SOFTWARE_SMS'
    | 'OTHER';
  amount: number;
  date: string;
  paymentMethod: string;
  note?: string;
  receiptUrl?: string;
  recordedBy?: string;
  createdAt?: string;
}

export interface ExpenseManagerProps {
  onNavigateTab?: (tab: string) => void;
  externalTriggerAdd?: boolean;
  onResetExternalTrigger?: () => void;
}

export const CATEGORY_INFO: Record<
  string,
  { label: string; labelEn: string; color: string; bg: string; border: string; icon: any }
> = {
  FB_ADS: {
    label: 'বিজ্ঞাপন (Meta Ads)',
    labelEn: 'Facebook / Meta Ads',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Megaphone,
  },
  PACKAGING: {
    label: 'প্যাকেজিং ও বক্স',
    labelEn: 'Boxes, bubblewrap & tape',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: Box,
  },
  COURIER: {
    label: 'কুরিয়ার ও যাতায়াত',
    labelEn: 'Excess courier / transport',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: Truck,
  },
  SALARY: {
    label: 'স্টাফ বেতন ও কমিশন',
    labelEn: 'Salaries & allowance',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: Users,
  },
  OFFICE_RENT: {
    label: 'অফিস ও গুদাম ভাড়া',
    labelEn: 'Rent & electricity',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: Building,
  },
  SOFTWARE_SMS: {
    label: 'সফটওয়্যার ও SMS প্যাক',
    labelEn: 'SMS gateway & tools',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    icon: Laptop,
  },
  OTHER: {
    label: 'অন্যান্য খরচ',
    labelEn: 'Miscellaneous',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    icon: HelpCircle,
  },
};

export function ExpenseManager({
  onNavigateTab,
  externalTriggerAdd,
  onResetExternalTrigger,
}: ExpenseManagerProps) {
  // State
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  );

  // Analytics for P&L comparison
  const [analytics, setAnalytics] = useState<{
    grossRevenue: number;
    cogs: number;
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    totalOrders: number;
  } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<string>('FB_ADS');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>('bKash');
  const [formNote, setFormNote] = useState<string>('');

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Open modal if external trigger fired (e.g. from header action)
  useEffect(() => {
    if (externalTriggerAdd) {
      setIsModalOpen(true);
      onResetExternalTrigger?.();
    }
  }, [externalTriggerAdd, onResetExternalTrigger]);

  // Fetch expenses and financial analytics
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [expRes, anaRes] = await Promise.all([
        fetch(`/api/expenses?range=${selectedRange}${selectedCategory !== 'ALL' ? `&category=${selectedCategory}` : ''}`),
        fetch(`/api/reports/analytics?range=${selectedRange}`),
      ]);

      if (expRes.ok) {
        const expData = await expRes.json();
        if (expData.success) {
          setExpenses(expData.expenses || []);
        }
      }

      if (anaRes.ok) {
        const anaData = await anaRes.json();
        if (anaData.success && anaData.financials) {
          setAnalytics({
            grossRevenue: anaData.financials.grossRevenue || 0,
            cogs: anaData.financials.cogs || 0,
            grossProfit: anaData.financials.grossProfit || 0,
            netProfit: anaData.financials.netProfit || 0,
            profitMargin: anaData.financials.profitMargin || 0,
            totalOrders: anaData.totalOrders || 0,
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to load expenses or analytics:', err);
      showToast('ডাটা লোড করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedRange, selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered Expenses for Search
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses;
    const q = searchQuery.toLowerCase().trim();
    return expenses.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.note && e.note.toLowerCase().includes(q)) ||
        e.paymentMethod.toLowerCase().includes(q) ||
        (CATEGORY_INFO[e.category]?.label || '').toLowerCase().includes(q)
    );
  }, [expenses, searchQuery]);

  // Total Expenses Calculated for selected list
  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [filteredExpenses]);

  // Breakdown by category
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of Object.keys(CATEGORY_INFO)) {
      map[cat] = 0;
    }
    for (const exp of expenses) {
      const cat = exp.category || 'OTHER';
      map[cat] = (map[cat] || 0) + (Number(exp.amount) || 0);
    }
    return map;
  }, [expenses]);

  // Submit Add Expense
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('খরচের বিবরণ আবশ্যক', 'error');
      return;
    }
    const numAmt = Number(formAmount);
    if (!numAmt || numAmt <= 0) {
      showToast('সঠিক টাকার পরিমাণ দিন', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          category: formCategory,
          amount: Math.round(numAmt),
          date: formDate ? new Date(formDate) : new Date(),
          paymentMethod: formPaymentMethod,
          note: formNote.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('ব্যয় সফলভাবে রেকর্ড করা হয়েছে।');
        setIsModalOpen(false);
        setFormTitle('');
        setFormAmount('');
        setFormNote('');
        setFormDate(new Date().toISOString().split('T')[0]);
        loadData();
      } else {
        showToast(data.message || 'ব্যয় রেকর্ড করতে ব্যর্থ হয়েছে', 'error');
      }
    } catch {
      showToast('সার্ভার এরর: ব্যয় যুক্ত করা যায়নি', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই ব্যয়ের রেকর্ডটি মুছে ফেলতে চান?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('ব্যয়ের রেকর্ড মুছে ফেলা হয়েছে।');
        setExpenses((prev) => prev.filter((item) => item._id !== id));
        loadData();
      } else {
        showToast(data.message || 'মুছতে ব্যর্থ হয়েছে', 'error');
      }
    } catch {
      showToast('সার্ভার এরর: মুছা সম্ভব হয়নি', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold animate-in fade-in slide-in-from-bottom-2 ${
            feedback.type === 'success'
              ? 'bg-[#1F6B43] text-white border-[#1F6B43]'
              : 'bg-[#D6403B] text-white border-[#D6403B]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Top Header & Range Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-[#EFE9E0] p-5 shadow-xs">
        <div>
          <h3 className="font-heading font-black text-base sm:text-lg text-[#2B2B2B] flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#D6403B]" /> ব্যালেন্স শিট ও খরচ ব্যবস্থাপনা (Operational Expenses & P&L)
          </h3>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            মেটা অ্যাডস, প্যাকেজিং, বেতন এবং অন্যান্য পরিচালন ব্যয় ট্র্যাক করে রিয়েল নিট প্রফিট হিসাব করুন।
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
              আজ
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
              ৭ দিন
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
              ৩০ দিন
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
              সব সময়
            </button>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-[#EFE9E0] hover:bg-[#FAF7F2] text-[#6B6B6B] transition-colors"
            title="ডাটা রিলোড করুন"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#D6403B]' : ''}`} />
          </button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl flex items-center gap-1.5 text-xs font-bold"
          >
            <Plus className="w-4 h-4" /> ব্যয় যোগ করুন
          </Button>
        </div>
      </div>

      {/* PROFIT & LOSS (P&L) FINANCIAL KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Gross Revenue */}
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-[#6B6B6B] text-xs font-medium">
            <span>মোট বিক্রয় (Gross Sales)</span>
            <TrendingUp className="w-4 h-4 text-[#1F6B43]" />
          </div>
          <div className="mt-2">
            <span className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B] block">
              ৳{(analytics?.grossRevenue || 0).toLocaleString('bn-BD')}
            </span>
            <span className="text-[11px] font-bold text-[#6B6B6B] mt-1 block">
              মোট {analytics?.totalOrders || 0}টি অর্ডার থেকে
            </span>
          </div>
        </div>

        {/* COGS (Cost of Goods Sold) */}
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-[#6B6B6B] text-xs font-medium">
            <span>পণ্য ক্রয় খরচ (COGS)</span>
            <Box className="w-4 h-4 text-[#B76E00]" />
          </div>
          <div className="mt-2">
            <span className="font-heading font-black text-2xl sm:text-3xl text-[#B76E00] block">
              ৳{(analytics?.cogs || 0).toLocaleString('bn-BD')}
            </span>
            <span className="text-[11px] font-bold text-[#6B6B6B] mt-1 block">
              কাঁচামাল ও উৎপাদন ব্যয়
            </span>
          </div>
        </div>

        {/* Total Operational Expenses (OPEX) */}
        <div className="bg-white rounded-2xl border border-[#FED7D7] bg-gradient-to-br from-white to-[#FFF5F5] p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-[#D6403B] text-xs font-medium">
            <span>পরিচালন ব্যয় (Total OPEX)</span>
            <Receipt className="w-4 h-4 text-[#D6403B]" />
          </div>
          <div className="mt-2">
            <span className="font-heading font-black text-2xl sm:text-3xl text-[#D6403B] block">
              -৳{totalExpenseAmount.toLocaleString('bn-BD')}
            </span>
            <span className="text-[11px] font-bold text-[#C53030] mt-1 block">
              অ্যাড, বক্স, বেতন ও অন্যান্য
            </span>
          </div>
        </div>

        {/* True Net Business Profit */}
        {(() => {
          const rev = analytics?.grossRevenue || 0;
          const cogs = analytics?.cogs || 0;
          const trueNet = rev - cogs - totalExpenseAmount;
          const trueMargin = rev > 0 ? Number(((trueNet / rev) * 100).toFixed(1)) : 0;
          const isProfitable = trueNet >= 0;

          return (
            <div
              className={`rounded-2xl border p-5 shadow-xs relative overflow-hidden ${
                isProfitable
                  ? 'border-[#C4EDCD] bg-gradient-to-br from-white to-[#F0FAF2]'
                  : 'border-[#FEB2B2] bg-gradient-to-br from-white to-[#FFF5F5]'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-medium">
                <span className={isProfitable ? 'text-[#1F6B43]' : 'text-[#C53030]'}>
                  প্রকৃত নিট লাভ (True Net Profit)
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                    isProfitable
                      ? 'bg-[#DDF3E6] text-[#1F6B43] border-[#BDE7CC]'
                      : 'bg-[#FED7D7] text-[#C53030] border-[#FEB2B2]'
                  }`}
                >
                  {trueMargin}% মার্জিন
                </span>
              </div>
              <div className="mt-2">
                <span
                  className={`font-heading font-black text-2xl sm:text-3xl block ${
                    isProfitable ? 'text-[#1F6B43]' : 'text-[#C53030]'
                  }`}
                >
                  {isProfitable ? '৳' : '-৳'}
                  {Math.abs(trueNet).toLocaleString('bn-BD')}
                </span>
                <span className="text-[11px] font-bold text-[#6B6B6B] mt-1 block">
                  বিক্রি থেকে COGS ও সব ব্যয় বাদ দিয়ে
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* CATEGORY BREAKDOWN CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
        {Object.entries(CATEGORY_INFO).map(([catKey, info]) => {
          const Icon = info.icon;
          const amount = categoryTotals[catKey] || 0;
          const isSelected = selectedCategory === catKey;

          return (
            <button
              key={catKey}
              type="button"
              onClick={() => setSelectedCategory(isSelected ? 'ALL' : catKey)}
              className={`text-left p-3 rounded-2xl border transition-all ${
                isSelected
                  ? 'ring-2 ring-[#D6403B] border-[#D6403B] bg-white shadow-sm'
                  : 'bg-white border-[#EFE9E0] hover:border-[#D6403B]/40 hover:bg-[#FAF7F2]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`p-1.5 rounded-lg ${info.bg} ${info.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {isSelected && <span className="text-[10px] font-black text-[#D6403B]">ফিল্টার</span>}
              </div>
              <span className="text-[11px] font-bold text-[#2B2B2B] block truncate leading-tight">
                {info.label}
              </span>
              <span className="text-xs font-black text-[#2B2B2B] mt-1 block">
                ৳{amount.toLocaleString('bn-BD')}
              </span>
            </button>
          );
        })}
      </div>

      {/* EXPENSE LIST & FILTER TABLE */}
      <div className="bg-white rounded-2xl border border-[#EFE9E0] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h4 className="font-heading font-black text-sm text-[#2B2B2B] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D6403B]" /> ব্যয়ের তালিকা (Expense Entries)
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF7F2] text-[#6B6B6B] border border-[#EFE9E0]">
              {filteredExpenses.length}টি এন্ট্রি
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
              <input
                type="text"
                placeholder="খরচের বিবরণ খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D6403B] w-48 sm:w-60"
              />
            </div>

            {/* Category Filter Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] font-semibold text-[#2B2B2B] focus:outline-none"
            >
              <option value="ALL">সকল ক্যাটাগরি</option>
              {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#EFE9E0] text-[11px] text-[#6B6B6B]">
                <th className="py-3 px-3">তারিখ</th>
                <th className="py-3 px-3">খরচের বিবরণ / টাইটেল</th>
                <th className="py-3 px-3">ক্যাটাগরি</th>
                <th className="py-3 px-3">পেমেন্ট মাধ্যম</th>
                <th className="py-3 px-3">এন্ট্রি করেছেন</th>
                <th className="py-3 px-3 text-right">পরিমাণ (BDT)</th>
                <th className="py-3 px-3 text-center">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9E0]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#D6403B] mx-auto mb-2" />
                    <span className="text-[#6B6B6B]">খরচের তালিকা লোড হচ্ছে...</span>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6B6B6B]">
                    <Receipt className="w-8 h-8 text-[#CCC] mx-auto mb-2 opacity-50" />
                    <p className="font-bold">এই সময়ে কোনো খরচ রেকর্ড করা হয়নি।</p>
                    <p className="text-[11px] text-[#888] mt-0.5">
                      ফেসবুক বিজ্ঞাপন, প্যাকিং বক্স বা কর্মচারীদের বেতন যোগ করতে &quot;+ ব্যয় যোগ করুন&quot; বাটনে ক্লিক করুন।
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const catInfo = CATEGORY_INFO[exp.category] || CATEGORY_INFO.OTHER;
                  const Icon = catInfo.icon;
                  const dateStr = new Date(exp.date || exp.createdAt || Date.now()).toLocaleDateString(
                    'en-GB',
                    { day: 'numeric', month: 'short', year: 'numeric' }
                  );

                  return (
                    <tr key={exp._id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                      <td className="py-3.5 px-3 font-medium text-[#6B6B6B] whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-[#2B2B2B] block">{exp.title}</span>
                        {exp.note && (
                          <span className="text-[11px] text-[#6B6B6B] block mt-0.5 max-w-sm truncate">
                            নোট: {exp.note}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${catInfo.bg} ${catInfo.color} ${catInfo.border}`}
                        >
                          <Icon className="w-3 h-3" />
                          {catInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-[#444]">
                        <span className="px-2 py-0.5 rounded-lg bg-[#FAF7F2] border border-[#EFE9E0] text-[10px]">
                          {exp.paymentMethod || 'Cash'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-[#6B6B6B]">
                        {exp.recordedBy || 'Admin'}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-heading font-black text-sm text-[#D6403B]">
                          ৳{Number(exp.amount).toLocaleString('bn-BD')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp._id)}
                          disabled={deletingId === exp._id}
                          className="p-1.5 rounded-lg text-[#999] hover:text-[#D6403B] hover:bg-red-50 transition-colors"
                          title="রেকর্ড মুছে ফেলুন"
                        >
                          {deletingId === exp._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D6403B]" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl border border-[#EFE9E0] shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-2 rounded-xl text-[#6B6B6B] hover:bg-[#FAF7F2]"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-heading font-black text-lg text-[#2B2B2B] flex items-center gap-2 mb-1">
              <Plus className="w-5 h-5 text-[#D6403B]" /> নতুন ব্যয় যুক্ত করুন
            </h3>
            <p className="text-xs text-[#6B6B6B] mb-5">
              ব্যবসায়িক পরিচালন খরচ রেকর্ড করুন যাতে ব্যালেন্স শিটে সঠিক নিট প্রফিট প্রতিফলিত হয়।
            </p>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#2B2B2B] block mb-1">
                  খরচের বিবরণ / টাইটেল <span className="text-[#D6403B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: Meta Ads Boost, 1000 Pcs Craft Boxes"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D6403B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#2B2B2B] block mb-1">
                    ক্যাটাগরি <span className="text-[#D6403B]">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D6403B] font-semibold"
                  >
                    {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2B2B2B] block mb-1">
                    টাকার পরিমাণ (BDT) <span className="text-[#D6403B]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="৳ 2500"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D6403B] font-bold text-[#D6403B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#2B2B2B] block mb-1">তারিখ</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D6403B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2B2B2B] block mb-1">
                    পেমেন্ট মাধ্যম
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D6403B]"
                  >
                    <option value="bKash">bKash (বিকাশ)</option>
                    <option value="Bank Transfer">ব্যাংক ট্রান্সফার (Bank)</option>
                    <option value="Cash">নগদ ক্যাশ (Cash)</option>
                    <option value="Card">ক্রেডিট/ডেবিট কার্ড (Card)</option>
                    <option value="Nagad">Nagad (নগদ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#2B2B2B] block mb-1">
                  নোট / রসিদ তথ্য (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  placeholder="অ্যাড ক্যাম্পেইন আইডি, ভেন্ডর নাম অথবা ইনভয়েস নম্বর..."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D6403B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B6B6B] hover:bg-[#FAF7F2]"
                >
                  বাতিল
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  className="rounded-xl px-5 text-xs font-bold flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> সংরক্ষণ হচ্ছে...
                    </>
                  ) : (
                    'ব্যয় নিশ্চিত করুন'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpenseManager;

