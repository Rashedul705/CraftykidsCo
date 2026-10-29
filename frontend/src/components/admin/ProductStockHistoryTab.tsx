'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  History,
  RotateCcw,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ExternalLink,
  Calendar,
  Layers,
  FileText,
  User,
  Package,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export interface StockLogItem {
  _id: string;
  id?: string;
  productId: string;
  variantId: string | null;
  variationName: string;
  variationDetail?: string;
  variationSku?: string;
  variationImage?: string;
  change: number;
  stockBefore: number;
  stockAfter: number;
  reason: 'order' | 'cancel' | 'return' | 'restock' | 'manual_edit' | 'bulk_edit';
  orderId?: string | null;
  adminId?: string;
  note?: string;
  createdAt: string | Date;
}

export interface ProductStockHistoryTabProps {
  productId: string;
  product: any;
  onProductUpdated?: (updatedProduct: any) => void;
}

export function ProductStockHistoryTab({
  productId,
  product,
  onProductUpdated,
}: ProductStockHistoryTabProps) {
  const { success, error: toastError } = useToast();

  const [logs, setLogs] = useState<StockLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [selectedVariation, setSelectedVariation] = useState<string>('ALL');
  const [selectedReason, setSelectedReason] = useState<string>('ALL');

  // Restock Modal State
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState<{
    id: string | null;
    name: string;
    sku: string;
    currentStock: number;
  } | null>(null);
  const [restockQty, setRestockQty] = useState<number | ''>(10);
  const [restockNote, setRestockNote] = useState<string>('');
  const [isSubmittingRestock, setIsSubmittingRestock] = useState(false);

  // Variations list from current product
  const variants = useMemo(() => {
    return (product?.variants || product?.variations || []) as any[];
  }, [product]);

  const isVariable = Boolean(product?.hasVariations || (variants && variants.length > 0));

  // Fetch logs
  const fetchLogs = useCallback(
    async (showLoading = true) => {
      if (!productId) return;
      if (showLoading) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const queryParams = new URLSearchParams();
        if (selectedVariation !== 'ALL') queryParams.set('variantId', selectedVariation);
        if (selectedReason !== 'ALL') queryParams.set('reason', selectedReason);

        const res = await fetch(`/api/products/${productId}/stock-logs?${queryParams.toString()}`);
        const data = await res.json();

        if (data.success && Array.isArray(data.logs)) {
          setLogs(data.logs);
        } else {
          setLogs([]);
        }
      } catch (err) {
        console.error('Error fetching stock logs:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [productId, selectedVariation, selectedReason]
  );

  useEffect(() => {
    fetchLogs(true);
  }, [fetchLogs]);

  // Open Restock Modal for a specific variant or simple product
  const handleOpenRestock = (variant?: any) => {
    if (variant) {
      const varId = String(variant._id || variant.id || variant.sku);
      setRestockTarget({
        id: varId,
        name: variant.optionValue || variant.titleEn || variant.titleBn || 'Variation',
        sku: variant.sku || '',
        currentStock: Number(variant.stock ?? variant.stockQuantity ?? 0),
      });
    } else {
      setRestockTarget({
        id: null,
        name: product?.titleBn || product?.titleEn || 'Simple Product',
        sku: product?.sku || '',
        currentStock: Number(product?.stock ?? 0),
      });
    }
    setRestockQty(10);
    setRestockNote('');
    setIsRestockOpen(true);
  };

  // Submit Restock
  const handleConfirmRestock = async () => {
    if (!restockTarget || !restockQty || Number(restockQty) <= 0) {
      toastError('দয়া করে সঠিক রিস্টক পরিমাণ উল্লেখ করুন (Please enter a valid restock quantity >= 1)');
      return;
    }

    setIsSubmittingRestock(true);
    try {
      const payload: any = {
        quantity: Math.floor(Number(restockQty)),
        note: restockNote.trim(),
        reason: 'restock',
      };

      if (restockTarget.id) {
        payload.variantId = restockTarget.id;
      }

      const res = await fetch(`/api/products/${productId}/stock-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        success(data.message || `সফলভাবে +${restockQty} ইউনিট রিস্টক করা হয়েছে!`);
        setIsRestockOpen(false);
        // Refresh logs immediately
        await fetchLogs(false);
        // Notify parent if updated product was returned
        if (data.product && onProductUpdated) {
          onProductUpdated(data.product);
        }
      } else {
        toastError(data.message || 'রিস্টক করতে সমস্যা হয়েছে।');
      }
    } catch {
      toastError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmittingRestock(false);
    }
  };

  // Helper formatting for date
  const formatDate = (dateVal: string | Date) => {
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return String(dateVal);
    }
  };

  // Reason badge styling and Bengali labels
  const getReasonBadge = (reason: StockLogItem['reason']) => {
    switch (reason) {
      case 'restock':
        return {
          label: 'রিস্টক (Restock)',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'order':
        return {
          label: 'অর্ডার বিক্রয় (Order)',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500',
        };
      case 'cancel':
        return {
          label: 'অর্ডার বাতিল (Cancel)',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'return':
        return {
          label: 'অর্ডার ফেরত (Return)',
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
          dot: 'bg-teal-500',
        };
      case 'manual_edit':
        return {
          label: 'ম্যানুয়াল এডিট (Manual)',
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          dot: 'bg-sky-500',
        };
      case 'bulk_edit':
        return {
          label: 'বাল্ক এডিট (Bulk)',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500',
        };
      default:
        return {
          label: reason,
          bg: 'bg-gray-100 text-gray-700 border-gray-200',
          dot: 'bg-gray-400',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Per-Variation Restock Strip */}
      <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EFE9E0]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D6403B]"></span>
              <h3 className="text-base sm:text-lg font-bold font-fredoka text-[#2B2B2B] flex items-center gap-2">
                <span>স্টক হিস্টোরি ও রিস্টক কন্ট্রোল (Stock History &amp; Restock)</span>
              </h3>
            </div>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              সকল অর্ডার কর্তন, অর্ডার বাতিল রিস্টোরেশন, রিস্টক এবং ম্যানুয়াল এডিটের বিস্তারিত অডিট রেকর্ড
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(false)}
              disabled={isRefreshing || isLoading}
              className="text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>রিফ্রেশ (Refresh)</span>
            </Button>
          </div>
        </div>

        {/* Variations Restock Quick Actions */}
        <div>
          <div className="text-xs font-bold text-[#2B2B2B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-[#D6403B]" />
            <span>
              {isVariable ? 'ভ্যারিয়েশন ভিত্তিক রিস্টক বাটন (Restock Per Variation)' : 'পণ্য রিস্টক বাটন (Product Restock)'}
            </span>
          </div>

          {isVariable ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {variants.map((v: any, idx: number) => {
                const varStock = Number(v.stock ?? v.stockQuantity ?? 0);
                const isLow = varStock > 0 && varStock <= (product?.lowStockAlert || 5);
                const isOut = varStock === 0;

                return (
                  <div
                    key={v._id || v.id || v.sku || idx}
                    className="p-3 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] transition flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {v.imageUrl ? (
                        <div className="w-9 h-9 rounded-lg overflow-hidden border border-[#EFE9E0] relative shrink-0 bg-white">
                          <Image src={v.imageUrl} alt="" fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-white border border-[#EFE9E0] flex items-center justify-center text-[#8C8C8C] shrink-0 text-[10px] font-bold">
                          {idx + 1}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#1A1A1A] truncate">
                          {v.optionValue || v.titleEn || v.titleBn}
                        </div>
                        <div className="text-[11px] text-[#6B6B6B] flex items-center gap-1.5">
                          <span>স্টক:</span>
                          <span
                            className={`font-bold ${
                              isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-700'
                            }`}
                          >
                            {varStock}
                          </span>
                          {v.sku && <span className="text-[#8C8C8C] text-[10px]">({v.sku})</span>}
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenRestock(v)}
                      className="text-xs shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-[#2B2B2B] hover:bg-[#D6403B] text-white"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Restock</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2]">
              <div>
                <span className="text-xs font-bold text-[#1A1A1A]">
                  বর্তমান মোট স্টক: <span className="text-emerald-700 font-extrabold text-sm">{product?.stock ?? 0}</span> ইউনিট
                </span>
                <p className="text-[11px] text-[#6B6B6B]">
                  সরাসরি স্টক যোগ করতে নিচের Restock বাটনে ক্লিক করুন
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleOpenRestock()}
                className="text-xs flex items-center gap-1.5 bg-[#2B2B2B] hover:bg-[#D6403B]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Restock Product</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#D6403B]" />
            <span className="text-xs font-bold text-[#2B2B2B] uppercase tracking-wider">
              ফিল্টার ও অনুসন্ধান (Filters)
            </span>
            <span className="text-[11px] font-semibold text-[#6B6B6B] bg-[#FAF7F2] px-2 py-0.5 rounded-full border border-[#EFE9E0]">
              {logs.length} টি রেকর্ড পাওয়া গেছে
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter by Variation */}
            {isVariable && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-[#6B6B6B]">ভ্যারিয়েশন:</span>
                <select
                  value={selectedVariation}
                  onChange={(e) => setSelectedVariation(e.target.value)}
                  className="text-xs bg-[#FAF7F2] border border-[#EFE9E0] rounded-lg px-2.5 py-1.5 text-[#2B2B2B] focus:outline-none focus:ring-1 focus:ring-[#D6403B]"
                >
                  <option value="ALL">সকল ভ্যারিয়েশন (All)</option>
                  {variants.map((v: any) => (
                    <option key={v._id || v.id || v.sku} value={String(v._id || v.id || v.sku)}>
                      {v.optionValue || v.titleEn || v.titleBn || v.sku}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter by Reason */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#6B6B6B]">কারণ (Reason):</span>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="text-xs bg-[#FAF7F2] border border-[#EFE9E0] rounded-lg px-2.5 py-1.5 text-[#2B2B2B] focus:outline-none focus:ring-1 focus:ring-[#D6403B]"
              >
                <option value="ALL">সকল কারণ (All Reasons)</option>
                <option value="restock">রিস্টক (Restock)</option>
                <option value="order">অর্ডার বিক্রয় (Order)</option>
                <option value="cancel">অর্ডার বাতিল (Cancel)</option>
                <option value="return">অর্ডার ফেরত (Return)</option>
                <option value="manual_edit">ম্যানুয়াল এডিট (Manual Edit)</option>
                <option value="bulk_edit">বাল্ক এডিট (Bulk Edit)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Stock History Table */}
      <div className="bg-white rounded-2xl border border-[#EFE9E0] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead>
              <tr className="bg-[#FAF7F2] text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider border-b border-[#EFE9E0]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Variation</th>
                <th className="py-3 px-4 text-center">Change (+/-)</th>
                <th className="py-3 px-4 text-center">Before</th>
                <th className="py-3 px-4 text-center">After</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Order Link</th>
                <th className="py-3 px-4">Admin</th>
                <th className="py-3 px-4">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9E0]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#8C8C8C]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#D6403B]" />
                      <span className="text-xs">স্টক হিস্টোরি লোড হচ্ছে...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#8C8C8C]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <History className="w-8 h-8 text-[#CCC]" />
                      <span className="text-xs font-semibold text-[#6B6B6B]">
                        কোন স্টক হিস্টোরি রেকর্ড পাওয়া যায়নি
                      </span>
                      <span className="text-[11px] text-[#8C8C8C]">
                        রিস্টক করলে বা কোন অর্ডার সম্পন্ন হলে স্বয়ংক্রিয়ভাবে এখানে লগ যুক্ত হবে।
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const reasonBadge = getReasonBadge(log.reason);
                  const isPositive = log.change > 0;
                  const isZero = log.change === 0;

                  return (
                    <tr
                      key={log._id || log.id}
                      className="hover:bg-[#FAF7F2]/60 transition-colors"
                    >
                      {/* 1. Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-[#1A1A1A]">
                          <Calendar className="w-3.5 h-3.5 text-[#8C8C8C]" />
                          <span>{formatDate(log.createdAt)}</span>
                        </div>
                      </td>

                      {/* 2. Variation */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {log.variationImage && (
                            <div className="w-7 h-7 rounded border border-[#EFE9E0] overflow-hidden relative shrink-0 bg-white">
                              <Image src={log.variationImage} alt="" fill className="object-cover" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-[#1A1A1A] block truncate max-w-[150px]">
                              {log.variationName}
                            </span>
                            {log.variationSku && (
                              <span className="text-[10px] text-[#8C8C8C] block font-mono">
                                {log.variationSku}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Change (+/-) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-extrabold font-mono ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isZero
                              ? 'bg-gray-100 text-gray-700 border border-gray-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {isPositive && <ArrowUpRight className="w-3 h-3" />}
                          {!isPositive && !isZero && <ArrowDownRight className="w-3 h-3" />}
                          <span>{isPositive ? `+${log.change}` : log.change}</span>
                        </span>
                      </td>

                      {/* 4. Before */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-xs font-semibold text-[#6B6B6B]">
                        {log.stockBefore}
                      </td>

                      {/* 5. After */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-xs font-bold text-[#1A1A1A]">
                        {log.stockAfter}
                      </td>

                      {/* 6. Reason */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${reasonBadge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${reasonBadge.dot}`}></span>
                          <span>{reasonBadge.label}</span>
                        </span>
                      </td>

                      {/* 7. Order link */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.orderId ? (
                          <Link
                            href={`/admin?tab=orders&search=${encodeURIComponent(log.orderId)}`}
                            className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#D6403B] hover:underline"
                            title="View Order"
                          >
                            <span>#{log.orderId.slice(-6)}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-[#CCC]">-</span>
                        )}
                      </td>

                      {/* 8. Admin */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[11px] text-[#6B6B6B]">
                          <User className="w-3 h-3 text-[#8C8C8C]" />
                          <span className="truncate max-w-[120px]" title={log.adminId}>
                            {log.adminId || 'System'}
                          </span>
                        </div>
                      </td>

                      {/* 9. Note */}
                      <td className="py-3 px-4">
                        <span
                          className="text-xs text-[#4A4A4A] line-clamp-2 max-w-[220px]"
                          title={log.note}
                        >
                          {log.note || '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Restock Modal */}
      <Modal
        isOpen={isRestockOpen}
        onClose={() => setIsRestockOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#D6403B]" />
            <span>রিস্টক করুন (Restock Inventory)</span>
          </div>
        }
        description={`আইটেম: "${restockTarget?.name}" ${
          restockTarget?.sku ? `(SKU: ${restockTarget?.sku})` : ''
        }`}
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRestockOpen(false)}
              disabled={isSubmittingRestock}
            >
              বাতিল (Cancel)
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmRestock}
              disabled={isSubmittingRestock || !restockQty || Number(restockQty) <= 0}
              className="bg-[#D6403B] hover:bg-[#b53430] text-white flex items-center gap-1.5"
            >
              {isSubmittingRestock ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>রিস্টক হচ্ছে...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>রিস্টক কনফার্ম করুন (Add Stock)</span>
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          {/* Current vs Projected Stock Preview */}
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#6B6B6B] block">বর্তমান স্টক:</span>
              <span className="text-base font-bold text-[#1A1A1A]">
                {restockTarget?.currentStock ?? 0} ইউনিট
              </span>
            </div>
            <div className="text-center font-bold text-[#8C8C8C] text-sm">&rarr;</div>
            <div>
              <span className="text-[11px] font-semibold text-[#6B6B6B] block">রিস্টকের পর মোট:</span>
              <span className="text-base font-extrabold text-emerald-700">
                {(restockTarget?.currentStock ?? 0) + (Number(restockQty) || 0)} ইউনিট
              </span>
            </div>
          </div>

          {/* Restock Quantity Input */}
          <div>
            <label className="text-xs font-bold text-[#2B2B2B] block mb-1.5">
              কত ইউনিট যোগ করতে চান? (Quantity to Add) *
            </label>
            <Input
              type="number"
              min={1}
              step={1}
              value={restockQty}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 0);
                setRestockQty(val);
              }}
              placeholder="যেমন: 25"
              className="text-sm font-semibold"
            />

            {/* Quick Increment Buttons */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-[#8C8C8C]">কুইক সিলেক্ট:</span>
              {[5, 10, 25, 50, 100].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setRestockQty(amt)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                    restockQty === amt
                      ? 'bg-[#D6403B] text-white border-[#D6403B]'
                      : 'bg-white text-[#6B6B6B] border-[#EFE9E0] hover:border-[#D6403B]'
                  }`}
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="text-xs font-bold text-[#2B2B2B] block mb-1.5">
              নোট বা কারণ (Optional Note)
            </label>
            <Input
              type="text"
              value={restockNote}
              onChange={(e) => setRestockNote(e.target.value)}
              placeholder="যেমন: নতুন চালানের স্টক বা ওয়্যারহাউজ ট্রান্সফার"
              className="text-xs"
            />
            <p className="text-[10px] text-[#8C8C8C] mt-1">
              এই নোটটি অডিট ট্রেইল হিসেবে স্টক হিস্টোরিতে সংরক্ষিত থাকবে।
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ProductStockHistoryTab;
