'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Tag,
  Trash2,
  Edit3,
  Calendar,
  CheckCircle,
  X,
  Percent,
  Banknote,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { CouponRecord } from '@/lib/coupons-store';
import { StatusPill } from '@/components/ui/Pill';

export function CouponsManager() {
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // New coupon form
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(500);
  const [maxDiscount, setMaxDiscount] = useState<number>(150);
  const [usageLimit, setUsageLimit] = useState<number>(200);
  const [endDate, setEndDate] = useState('2026-12-31');
  const [descriptionBn, setDescriptionBn] = useState('');

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/coupons');
      const data = await res.json();
      if (data.success && data.coupons) {
        setCoupons(data.coupons);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: !currentStatus } : c))
        );
        setFeedback(`Coupon status updated!`);
        setTimeout(() => setFeedback(null), 2500);
      }
    } catch {}
  };

  const handleDelete = async (id: string, couponCode: string) => {
    if (!confirm(`Are you sure you want to delete coupon ${couponCode}?`)) return;
    try {
      const res = await fetch(`/api/coupons?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        setFeedback(`Coupon ${couponCode} deleted.`);
        setTimeout(() => setFeedback(null), 2500);
      }
    } catch {}
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) return;

    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discountType,
          discountValue: Number(discountValue),
          minOrderAmount: Number(minOrderAmount || 0),
          maxDiscount: discountType === 'percentage' && maxDiscount ? Number(maxDiscount) : undefined,
          usageLimit: usageLimit ? Number(usageLimit) : undefined,
          endDate,
          descriptionBn: descriptionBn.trim() || `${discountValue}${discountType === 'percentage' ? '%' : '৳'} discount on orders above ৳${minOrderAmount}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCoupons((prev) => [data.coupon, ...prev]);
        setShowAddModal(false);
        setCode('');
        setDescriptionBn('');
        setFeedback(`Coupon "${data.coupon.code}" created successfully!`);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {}
  };

  const filtered = useMemo(() => {
    return coupons.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return c.code.toLowerCase().includes(q) || c.descriptionBn.toLowerCase().includes(q);
      }
      return true;
    });
  }, [coupons, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {feedback && (
        <div className="p-3.5 rounded-[12px] bg-[#DDF3E6] border border-[#BDE7CC] text-xs font-bold text-[#1F6B43] flex items-center justify-between shadow-xs">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-[#6B6B6B] hover:text-[#2B2B2B]">
            ✕
          </button>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
          <input
            type="text"
            placeholder="Search coupon codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-[#EFE9E0] focus:outline-[#D6403B]"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-[#D6403B] text-white text-xs font-bold hover:bg-[#B5322E] flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> + Create Coupon
        </button>
      </div>

      {/* Grid of Coupon Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-[#6B6B6B]">Loading coupons...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-[#6B6B6B]">No coupons found.</div>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs space-y-4 transition-all ${
                c.isActive ? 'border-[#EFE9E0]' : 'border-[#EFE9E0] opacity-60 bg-[#FAF7F2]/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-base font-black text-[#D6403B] tracking-wide block">
                    {c.code}
                  </span>
                  <span className="text-[11px] text-[#6B6B6B] block mt-0.5">
                    {c.discountType === 'percentage'
                      ? `${c.discountValue}% Off ${c.maxDiscount ? `(up to ৳${c.maxDiscount})` : ''}`
                      : `৳${c.discountValue} Flat Discount`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(c.id, c.isActive)}
                    className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      c.isActive ? 'bg-[#D6403B]' : 'bg-[#EFE9E0]'
                    }`}
                    title={c.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <div
                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                        c.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => handleDelete(c.id, c.code)}
                    className="p-1 rounded text-[#6B6B6B] hover:text-[#D6403B]"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#2B2B2B] font-medium leading-relaxed">
                {c.descriptionBn}
              </p>

              <div className="pt-2 border-t border-[#EFE9E0] flex items-center justify-between text-[11px] text-[#6B6B6B]">
                <div>
                  <span>Min Spend: </span>
                  <strong className="text-[#2B2B2B]">৳{c.minOrderAmount}</strong>
                </div>
                <div>
                  <span>Used: </span>
                  <strong className="text-[#2B2B2B]">
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                  </strong>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Coupon Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCoupon}
            className="bg-white rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-xl border border-[#EFE9E0]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
              <h3 className="font-heading font-black text-lg text-[#2B2B2B]">Create New Promo Code</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#6B6B6B]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">Coupon Code (English Letters/Numbers):</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EIDJOY15"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl border border-[#EFE9E0] uppercase font-mono font-bold focus:outline-[#D6403B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#2B2B2B] block mb-1">Discount Type:</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#2B2B2B] block mb-1">Discount Value:</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#2B2B2B] block mb-1">Min Order Amount (৳):</label>
                  <input
                    type="number"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2B2B2B] block mb-1">Max Discount Cap (৳):</label>
                  <input
                    type="number"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(Number(e.target.value))}
                    disabled={discountType !== 'percentage'}
                    className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B] disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">Usage Limit (Total uses):</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B]"
                />
              </div>

              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">Bangla Explanation Label:</label>
                <input
                  type="text"
                  placeholder="যেমন: ১০% ছাড় (সর্বোচ্চ ৳১৫০), সর্বনিম্ন ৳৫০০ অর্ডারে"
                  value={descriptionBn}
                  onChange={(e) => setDescriptionBn(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-[#EFE9E0] text-xs font-bold text-[#6B6B6B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#D6403B] text-white text-xs font-bold hover:bg-[#B5322E]"
              >
                Save Coupon
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
export default CouponsManager;
