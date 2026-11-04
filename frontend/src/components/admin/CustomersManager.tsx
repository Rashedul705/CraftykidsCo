'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Phone,
  MessageCircle,
  ShieldCheck,
  AlertTriangle,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  UserCheck,
  Trash2,
  Loader2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { OrderRecord } from '@/lib/store';
import { StatusPill } from '@/components/ui/Pill';
import Can from '@/components/auth/Can';

export interface CustomerAggregated {
  phone: string;
  name: string;
  district: string;
  address: string;
  orderCount: number;
  totalSpent: number;
  deliveredCount: number;
  returnedCount: number;
  cancelledCount: number;
  successRate: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  orders: OrderRecord[];
  lastOrderDate: string;
}

interface CustomersManagerProps {
  orders: OrderRecord[];
  onSelectOrder?: (order: OrderRecord) => void;
  onNavigateTab?: (tab: string) => void;
  onRefreshData?: () => void;
}

export function CustomersManager({
  orders,
  onSelectOrder,
  onNavigateTab,
  onRefreshData,
}: CustomersManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'REPEAT' | 'LOW' | 'HIGH'>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAggregated | null>(null);

  // Bulk & Single Delete States
  const [selectedCustomerPhones, setSelectedCustomerPhones] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerAggregated | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Group orders by clean customer phone
  const customers = useMemo(() => {
    const map = new Map<string, CustomerAggregated>();

    orders.forEach((o) => {
      const cleanPhone = (o.customerPhone || '').trim();
      if (!cleanPhone) return;

      const existing = map.get(cleanPhone);
      const isDelivered = o.status === 'DELIVERED';
      const isReturned = o.status === 'RETURNED';
      const isCancelled = o.status === 'CANCELLED';

      if (!existing) {
        map.set(cleanPhone, {
          phone: cleanPhone,
          name: o.customerName || 'Anonymous',
          district: o.district || 'Dhaka',
          address: o.fullAddress || '',
          orderCount: 1,
          totalSpent: Number(o.totalAmount || 0),
          deliveredCount: isDelivered ? 1 : 0,
          returnedCount: isReturned ? 1 : 0,
          cancelledCount: isCancelled ? 1 : 0,
          successRate: isDelivered ? 100 : isReturned ? 0 : 100,
          riskLevel: isReturned ? 'HIGH' : 'LOW',
          orders: [o],
          lastOrderDate: o.createdAt,
        });
      } else {
        existing.orderCount += 1;
        existing.totalSpent += Number(o.totalAmount || 0);
        if (isDelivered) existing.deliveredCount += 1;
        if (isReturned) existing.returnedCount += 1;
        if (isCancelled) existing.cancelledCount += 1;
        existing.orders.push(o);

        const finalized = existing.deliveredCount + existing.returnedCount;
        existing.successRate = finalized > 0 ? Math.round((existing.deliveredCount / finalized) * 100) : 100;

        if (existing.returnedCount > 0 || existing.successRate < 60) {
          existing.riskLevel = 'HIGH';
        } else if (existing.cancelledCount > 0 || existing.successRate < 80) {
          existing.riskLevel = 'MODERATE';
        } else {
          existing.riskLevel = 'LOW';
        }

        if (new Date(o.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = o.createdAt;
          if (o.customerName) existing.name = o.customerName;
          if (o.fullAddress) existing.address = o.fullAddress;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (riskFilter === 'REPEAT' && c.orderCount < 2) return false;
      if (riskFilter === 'LOW' && c.riskLevel !== 'LOW') return false;
      if (riskFilter === 'HIGH' && c.riskLevel !== 'HIGH') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchPhone = c.phone.includes(q);
        const matchName = c.name.toLowerCase().includes(q);
        const matchDistrict = c.district.toLowerCase().includes(q);
        if (!matchPhone && !matchName && !matchDistrict) return false;
      }
      return true;
    });
  }, [customers, riskFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = customers.length;
    const repeat = customers.filter((c) => c.orderCount > 1).length;
    const highRisk = customers.filter((c) => c.riskLevel === 'HIGH').length;
    const totalRev = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgAov = orders.length > 0 ? Math.round(totalRev / orders.length) : 0;
    return { total, repeat, highRisk, avgAov };
  }, [customers, orders]);

  // Checkbox selection handlers
  const toggleSelectCustomer = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCustomerPhones((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]
    );
  };

  const toggleSelectAll = () => {
    if (filtered.length > 0 && selectedCustomerPhones.length === filtered.length) {
      setSelectedCustomerPhones([]);
    } else {
      setSelectedCustomerPhones(filtered.map((c) => c.phone));
    }
  };

  // Perform Bulk / Single Customer Deletion
  const handleExecuteDeleteCustomers = async (phonesToDelete: string[]) => {
    if (!phonesToDelete || phonesToDelete.length === 0) return;
    setIsBulkDeleting(true);

    try {
      const res = await fetch('/api/customers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phones: phonesToDelete }),
      });

      const data = await res.json();
      if (data.success) {
        if (onRefreshData) {
          onRefreshData();
        }
        setActionFeedback(data.message || `${phonesToDelete.length} জন গ্রাহক সফলভাবে মুছে ফেলা হয়েছে!`);
        setSelectedCustomerPhones((prev) => prev.filter((p) => !phonesToDelete.includes(p)));
        setShowBulkDeleteModal(false);
        setCustomerToDelete(null);
        setTimeout(() => setActionFeedback(null), 3500);
      } else {
        setActionFeedback(data.message || 'গ্রাহক মুছে ফেলতে সমস্যা হয়েছে');
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch {
      setActionFeedback('গ্রাহক ডিলিট করতে সার্ভার ত্রুটি হয়েছে');
      setTimeout(() => setActionFeedback(null), 3000);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // List of customers currently selected for modal
  const selectedCustomerList = useMemo(() => {
    if (customerToDelete) return [customerToDelete];
    return customers.filter((c) => selectedCustomerPhones.includes(c.phone));
  }, [customers, selectedCustomerPhones, customerToDelete]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="fixed top-5 right-5 z-50 bg-[#1A1A1A] text-white text-xs px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-2 animate-fade-in font-sans">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* 4 Top Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
          <span className="text-xs font-medium text-[#6B6B6B] block">Total Customers</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-heading font-black text-2xl text-[#2B2B2B]">{stats.total}</span>
            <span className="text-[11px] text-[#6B6B6B]">In registry</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
          <span className="text-xs font-medium text-[#6B6B6B] block">Repeat Customers</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-heading font-black text-2xl text-[#1F6B43]">{stats.repeat}</span>
            <span className="text-[11px] font-bold text-[#1F6B43]">
              {stats.total > 0 ? `${Math.round((stats.repeat / stats.total) * 100)}% repeat` : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
          <span className="text-xs font-medium text-[#6B6B6B] block">Average Order Value</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-heading font-black text-2xl text-[#2B2B2B]">৳{stats.avgAov}</span>
            <span className="text-[11px] text-[#6B6B6B]">Per order</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
          <span className="text-xs font-medium text-[#6B6B6B] block">High Risk Profiles</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-heading font-black text-2xl text-[#D6403B]">{stats.highRisk}</span>
            <span className="text-[11px] font-bold text-[#D6403B]">Return history</span>
          </div>
        </div>
      </div>

      {/* Bulk Action Sticky Floating Bar */}
      {selectedCustomerPhones.length > 0 && (
        <div className="bg-[#1A1A1A] text-white px-4 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl border border-white/10 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-300">
              ✓ {selectedCustomerPhones.length} জন গ্রাহক নির্বাচিত
            </span>
            <button
              type="button"
              onClick={() => setSelectedCustomerPhones([])}
              className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
            >
              সব নির্বাচন বাতিল
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Can permission="customers.delete">
              <button
                type="button"
                onClick={() => {
                  setCustomerToDelete(null);
                  setShowBulkDeleteModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>নির্বাচিত ({selectedCustomerPhones.length}) গ্রাহক ডিলিট করুন</span>
              </button>
            </Can>
          </div>
        </div>
      )}

      {/* Directory Card */}
      <div className="bg-white rounded-2xl border border-[#EFE9E0] shadow-xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 sm:p-5 border-b border-[#EFE9E0] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { key: 'ALL', label: `All (${customers.length})` },
                { key: 'REPEAT', label: `Repeat Buyers (${stats.repeat})` },
                { key: 'LOW', label: 'Low Risk (Safe)' },
                { key: 'HIGH', label: `High Risk (${stats.highRisk})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setRiskFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    riskFilter === tab.key
                      ? 'bg-[#FDE3E1] text-[#9B2420]'
                      : 'text-[#6B6B6B] hover:bg-[#FAF7F2] hover:text-[#2B2B2B]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
            <input
              type="text"
              placeholder="Search customers by name, phone number, or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] focus:bg-white focus:outline-[#D6403B] transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF7F2] text-[#6B6B6B] border-b border-[#EFE9E0] text-[11px] uppercase tracking-wider font-semibold">
                {/* 1. Checkbox for Select All */}
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    aria-label="Select all customers"
                    checked={filtered.length > 0 && selectedCustomerPhones.length === filtered.length}
                    onChange={toggleSelectAll}
                    className="rounded accent-[#D6403B] cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Total Spend</th>
                <th className="py-3 px-4">Delivery Success</th>
                <th className="py-3 px-4">Risk Badge</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9E0]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#6B6B6B]">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isChecked = selectedCustomerPhones.includes(c.phone);

                  return (
                    <tr
                      key={c.phone}
                      className={`hover:bg-[#FAF7F2]/60 transition-colors cursor-pointer ${
                        isChecked ? 'bg-[#FAF7F2]/80' : ''
                      }`}
                      onClick={() => setSelectedCustomer(c)}
                    >
                      {/* 1. Checkbox */}
                      <td
                        className="py-3.5 px-3 text-center"
                        onClick={(e) => toggleSelectCustomer(c.phone, e)}
                      >
                        <input
                          type="checkbox"
                          aria-label={`Select customer ${c.name}`}
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded accent-[#D6403B] cursor-pointer"
                        />
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-[#2B2B2B] block text-xs">{c.name}</span>
                          <span className="font-mono text-xs text-[#D6403B] font-semibold block">{c.phone}</span>
                        </div>
                      </td>

                      {/* District */}
                      <td className="py-3.5 px-4 text-[#6B6B6B]">{c.district || 'Dhaka'}</td>

                      {/* Orders count */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#2B2B2B]">{c.orderCount}</span>
                        {c.orderCount > 1 && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-[#DDF3E6] text-[#1F6B43] font-bold">
                            Repeat
                          </span>
                        )}
                      </td>

                      {/* Total spend */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#2B2B2B]">৳{c.totalSpent.toLocaleString()}</span>
                      </td>

                      {/* Success rate */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#2B2B2B]">{c.successRate}%</span>
                          <span className="text-[10px] text-[#6B6B6B]">
                            ({c.deliveredCount} deliv{c.returnedCount > 0 ? `, ${c.returnedCount} ret` : ''})
                          </span>
                        </div>
                      </td>

                      {/* Risk Badge */}
                      <td className="py-3.5 px-4">
                        {c.riskLevel === 'LOW' ? (
                          <StatusPill variant="green" dot>
                            Low Risk
                          </StatusPill>
                        ) : c.riskLevel === 'MODERATE' ? (
                          <StatusPill variant="yellow" dot>
                            Moderate Risk
                          </StatusPill>
                        ) : (
                          <StatusPill variant="red" dot>
                            High Risk
                          </StatusPill>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`tel:${c.phone}`}
                            className="p-1.5 rounded-lg bg-[#FAF7F2] border border-[#EFE9E0] text-[#2B2B2B] hover:bg-[#EFE9E0]"
                            title="Call"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/880${c.phone.replace(/^0+/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#DDF3E6] border border-[#BDE7CC] text-[#1F6B43] hover:bg-[#C9EBDA]"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => setSelectedCustomer(c)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#EFE9E0] text-[11px] font-bold text-[#2B2B2B] hover:bg-[#EFE9E0] cursor-pointer"
                          >
                            History
                          </button>

                          {/* Single Delete Customer Button */}
                          <Can permission="customers.delete">
                            <button
                              onClick={() => {
                                setCustomerToDelete(c);
                                setShowBulkDeleteModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                              title="Delete Customer & History"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Order History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-2xl w-full p-6 space-y-5 shadow-xl border border-[#EFE9E0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
              <div>
                <span className="text-[10px] text-[#6B6B6B] block">Customer Profile &amp; History</span>
                <h3 className="font-heading font-black text-xl text-[#2B2B2B]">
                  {selectedCustomer.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#6B6B6B] hover:text-[#2B2B2B]"
              >
                ✕
              </button>
            </div>

            {/* Profile Summary Card */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-[#6B6B6B] block">Phone:</span>
                <strong className="text-[#D6403B] font-mono text-xs">{selectedCustomer.phone}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#6B6B6B] block">Total Orders:</span>
                <strong>{selectedCustomer.orderCount} orders</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#6B6B6B] block">Total Spent:</span>
                <strong>৳{selectedCustomer.totalSpent.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#6B6B6B] block">Delivery Success:</span>
                <strong className={selectedCustomer.successRate >= 80 ? 'text-[#1F6B43]' : 'text-[#D6403B]'}>
                  {selectedCustomer.successRate}%
                </strong>
              </div>
            </div>

            {/* Order History Timeline List */}
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-sm text-[#2B2B2B]">
                Order History ({selectedCustomer.orders.length})
              </h4>

              <div className="space-y-3">
                {selectedCustomer.orders.map((ord) => (
                  <div
                    key={ord.id || ord.orderNumber}
                    className="p-4 rounded-xl border border-[#EFE9E0] bg-white hover:border-[#D6403B] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-black text-xs text-[#2B2B2B]">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[11px] text-[#6B6B6B]">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[#6B6B6B]">
                        {ord.items.map((i) => `${i.title} (×${i.quantity})`).join(', ')}
                      </p>
                      {ord.trackingCode && (
                        <span className="text-[10px] text-[#0B5F85] font-mono block">
                          Steadfast Tracking: {ord.trackingCode}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="font-bold text-[#2B2B2B] block">৳{ord.totalAmount}</span>
                        <span className="text-[10px] text-[#6B6B6B]">{ord.paymentMethod}</span>
                      </div>

                      <div>
                        {ord.status === 'DELIVERED' ? (
                          <StatusPill variant="green" dot>
                            Delivered
                          </StatusPill>
                        ) : ord.status === 'SHIPPED' ? (
                          <StatusPill variant="blue" dot>
                            Shipped
                          </StatusPill>
                        ) : ord.status === 'RETURNED' ? (
                          <StatusPill variant="red" dot>
                            Returned
                          </StatusPill>
                        ) : (
                          <StatusPill variant="yellow" dot>
                            {ord.status}
                          </StatusPill>
                        )}
                      </div>

                      {onSelectOrder && (
                        <button
                          onClick={() => {
                            setSelectedCustomer(null);
                            onSelectOrder(ord);
                          }}
                          className="p-1.5 rounded-lg bg-[#FAF7F2] text-[#2B2B2B] hover:bg-[#EFE9E0]"
                          title="View in Orders"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CUSTOMER(S) CONFIRMATION MODAL
         ========================================================================= */}
      {showBulkDeleteModal && selectedCustomerList.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#FECACA]">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <div className="flex items-center gap-3 text-[#DC2626]">
                <div className="w-10 h-10 rounded-2xl bg-[#FEF2F2] flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-[#DC2626]" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-[#1A1A1A]">
                    {customerToDelete
                      ? 'গ্রাহক রেকর্ড ডিলিট কনফার্মেশন'
                      : `বাল্ক ডিলিট (${selectedCustomerList.length} জন গ্রাহক)`}
                  </h3>
                  <span className="text-[11px] text-[#6B6B6B]">এই কাজটি পূর্বাবস্থায় ফিরিয়ে আনা সম্ভব নয়</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowBulkDeleteModal(false);
                  setCustomerToDelete(null);
                }}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#1A1A1A] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span>সতর্কতা: স্থায়ীভাবে মুছে ফেলা হবে</span>
              </div>
              <p className="text-[11px] text-[#B91C1C] leading-relaxed">
                নির্বাচিত গ্রাহকদের মুছে ফেললে তাদের প্রোফাইল এবং সম্পর্কিত সকল অর্ডার রেকর্ড ডাটাবেজ থেকে স্থায়ীভাবে মুছে যাবে।
              </p>
            </div>

            {/* List of Customers to be deleted */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#6B6B6B] block">
                যে গ্রাহকদের মুছে ফেলা হবে ({selectedCustomerList.length} জন):
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] divide-y divide-[#EFEAE2]">
                {selectedCustomerList.map((c) => (
                  <div key={c.phone} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#1A1A1A] block">{c.name}</span>
                      <span className="font-mono text-[11px] text-[#D6403B]">{c.phone}</span>
                    </div>
                    <div className="text-right text-[11px] text-[#6B6B6B]">
                      <span className="font-semibold">{c.orderCount} টি অর্ডার</span>
                      <span className="block text-[#1A1A1A] font-bold">৳{c.totalSpent.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#EFEAE2]">
              <button
                type="button"
                onClick={() => {
                  setShowBulkDeleteModal(false);
                  setCustomerToDelete(null);
                }}
                disabled={isBulkDeleting}
                className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#1A1A1A] font-bold text-xs cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={() =>
                  handleExecuteDeleteCustomers(
                    customerToDelete ? [customerToDelete.phone] : selectedCustomerPhones
                  )
                }
                disabled={isBulkDeleting}
                className="px-5 py-2.5 rounded-xl bg-[#DC2626] text-white font-bold text-xs hover:bg-[#B91C1C] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
              >
                {isBulkDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {customerToDelete
                    ? 'হ্যাঁ, গ্রাহক ডিলিট করুন'
                    : `হ্যাঁ, ${selectedCustomerList.length} জন গ্রাহক ডিলিট করুন`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomersManager;
