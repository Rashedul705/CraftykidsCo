'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Search,
  Phone,
  MessageCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Trash2,
  AlertCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import { IncompleteOrderRecord } from '@/lib/incomplete-orders-store';
import { StatusPill } from '@/components/ui/Pill';
import { formatBDT } from '@/lib/utils';

interface IncompleteOrdersManagerProps {
  onRefreshOrders?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export function IncompleteOrdersManager({ onRefreshOrders, onNavigateTab }: IncompleteOrdersManagerProps) {
  const [incompletes, setIncompletes] = useState<IncompleteOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_CONTACT' | 'FOLLOWED_UP' | 'CONVERTED'>('ALL');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<IncompleteOrderRecord | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchIncompleteOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/incomplete-orders');
      const data = await res.json();
      if (data.success && data.incompleteOrders) {
        setIncompletes(data.incompleteOrders);
      }
    } catch (err) {
      console.error('Failed to load incomplete orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncompleteOrders();
  }, []);

  const handleConvert = async (item: IncompleteOrderRecord) => {
    try {
      setActionLoadingId(item.id);
      const res = await fetch('/api/incomplete-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, action: 'convert' }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(`Success! Converted into live Order #${data.order?.orderNumber || 'New'}`);
        await fetchIncompleteOrders();
        if (onRefreshOrders) onRefreshOrders();
      } else {
        setFeedback(`Failed: ${data.message || 'Could not convert order'}`);
      }
    } catch (err: any) {
      setFeedback('Error converting order');
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleStatusChange = async (id: string, newStatus: IncompleteOrderRecord['status']) => {
    try {
      const res = await fetch('/api/incomplete-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setIncompletes((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: newStatus, isFollowedUp: true } : o))
        );
        setFeedback(`Status updated to ${newStatus}`);
        setTimeout(() => setFeedback(null), 2500);
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to dismiss this abandoned checkout?')) return;
    try {
      const res = await fetch(`/api/incomplete-orders?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setIncompletes((prev) => prev.filter((o) => o.id !== id));
        if (selectedRecord?.id === id) setSelectedRecord(null);
      }
    } catch {}
  };

  const filtered = useMemo(() => {
    return incompletes.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchPhone = item.phone.includes(q);
        const matchName = item.customerName?.toLowerCase().includes(q);
        const matchAddress = item.address?.toLowerCase().includes(q);
        if (!matchPhone && !matchName && !matchAddress) return false;
      }
      return true;
    });
  }, [incompletes, statusFilter, searchQuery]);

  const metrics = useMemo(() => {
    const total = incompletes.length;
    const pending = incompletes.filter((i) => i.status === 'PENDING_CONTACT').length;
    const converted = incompletes.filter((i) => i.status === 'CONVERTED').length;
    const potential = incompletes
      .filter((i) => i.status !== 'DISMISSED')
      .reduce((s, i) => s + (i.totalAmount || 0), 0);
    return { total, pending, converted, potential };
  }, [incompletes]);

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

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
          <span className="text-xs font-medium text-[#6B6B6B] block">Total Incomplete</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-heading font-black text-2xl text-[#2B2B2B]">{metrics.total}</span>
            <span className="text-[11px] text-[#6B6B6B]">Checkouts</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
          <span className="text-xs font-medium text-[#6B6B6B] block">Pending Follow-up</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-heading font-black text-2xl text-[#D6403B]">{metrics.pending}</span>
            <span className="text-[11px] font-bold text-[#D6403B]">Needs call</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
          <span className="text-xs font-medium text-[#6B6B6B] block">Recovered / Converted</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-heading font-black text-2xl text-[#1F6B43]">{metrics.converted}</span>
            <span className="text-[11px] text-[#1F6B43] font-bold">
              {metrics.total > 0 ? `${Math.round((metrics.converted / metrics.total) * 100)}% rate` : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
          <span className="text-xs font-medium text-[#6B6B6B] block">Potential Value</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-heading font-black text-2xl text-[#2B2B2B]">৳{metrics.potential.toLocaleString()}</span>
            <span className="text-[11px] text-[#6B6B6B]">In carts</span>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-[#EFE9E0] shadow-xs overflow-hidden">
        {/* Filter and Search Bar */}
        <div className="p-4 sm:p-5 border-b border-[#EFE9E0] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { key: 'ALL', label: `All (${incompletes.length})` },
                { key: 'PENDING_CONTACT', label: `Needs Action (${metrics.pending})` },
                { key: 'FOLLOWED_UP', label: 'Followed up' },
                { key: 'CONVERTED', label: `Converted (${metrics.converted})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    statusFilter === tab.key
                      ? 'bg-[#FDE3E1] text-[#9B2420]'
                      : 'text-[#6B6B6B] hover:bg-[#FAF7F2] hover:text-[#2B2B2B]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchIncompleteOrders}
              className="inline-flex items-center gap-1.5 text-xs text-[#6B6B6B] hover:text-[#2B2B2B] font-semibold self-end sm:self-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
            <input
              type="text"
              placeholder="Search by phone number, customer name, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] focus:bg-white focus:outline-[#D6403B] transition-colors"
            />
          </div>
        </div>

        {/* Table of Incomplete Checkouts */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF7F2] text-[#6B6B6B] border-b border-[#EFE9E0] text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Shopper</th>
                <th className="py-3 px-4">Cart Items</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Time Ago</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9E0]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6B6B6B]">
                    Loading incomplete checkouts...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6B6B6B]">
                    <div className="max-w-xs mx-auto space-y-1">
                      <ShoppingBag className="w-8 h-8 text-[#C23631]/40 mx-auto" />
                      <p className="font-bold text-[#2B2B2B]">No incomplete checkouts found</p>
                      <p className="text-[11px]">When visitors enter a phone number in checkout and don&apos;t complete, they will appear here automatically.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const whatsappMsg = encodeURIComponent(
                    `আসসালামু আলাইকুম ${item.customerName || ''}, CraftyKidsCo থেকে যোগাযোগ করা হচ্ছে। আপনার কার্টে পছন্দের খেলনা/রং যোগ করা রয়েছে (মোট: ৳${item.totalAmount})। কোনো সহায়তার প্রয়োজন হলে আমাদের জানাতে পারেন!`
                  );

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#FAF7F2]/60 transition-colors cursor-pointer"
                      onClick={() => setSelectedRecord(item)}
                    >
                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-[#2B2B2B] block text-xs">
                            {item.customerName || 'Guest Shopper'}
                          </span>
                          <span className="font-mono text-xs text-[#D6403B] font-semibold block">
                            {item.phone}
                          </span>
                          {item.district && (
                            <span className="text-[11px] text-[#6B6B6B] block">
                              {item.district} {item.address ? `• ${item.address.slice(0, 20)}...` : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1">
                          {item.items && item.items.length > 0 ? (
                            item.items.map((it, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-xs text-[#2B2B2B]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D6403B] shrink-0" />
                                <span className="truncate">{it.title}</span>
                                <span className="text-[#6B6B6B] shrink-0">×{it.quantity}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-[#6B6B6B] italic">Cart items summary</span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-xs text-[#2B2B2B] block">৳{item.totalAmount}</span>
                        <span className="text-[10px] text-[#6B6B6B]">incl. ৳{item.deliveryCharge || 60} delivery</span>
                      </td>

                      {/* Time ago */}
                      <td className="py-3.5 px-4 text-[#6B6B6B] text-[11px]">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span className="block text-[10px]">
                          {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </td>

                      {/* Status pill */}
                      <td className="py-3.5 px-4">
                        {item.status === 'CONVERTED' ? (
                          <StatusPill variant="green" dot>
                            Converted
                          </StatusPill>
                        ) : item.status === 'FOLLOWED_UP' ? (
                          <StatusPill variant="blue" dot>
                            Followed up
                          </StatusPill>
                        ) : item.status === 'DISMISSED' ? (
                          <StatusPill variant="red">
                            Dismissed
                          </StatusPill>
                        ) : (
                          <StatusPill variant="yellow" dot>
                            Needs call
                          </StatusPill>
                        )}
                      </td>

                      {/* Quick Actions (Part B8 Spec: Call, WhatsApp, Convert to order) */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Call Button */}
                          <a
                            href={`tel:${item.phone}`}
                            className="p-2 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] text-[#2B2B2B] hover:bg-[#EFE9E0] hover:text-[#1F6B43] transition-colors"
                            title={`Call ${item.phone}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>

                          {/* WhatsApp Button */}
                          <a
                            href={`https://wa.me/880${item.phone.replace(/^0+/, '')}?text=${whatsappMsg}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleStatusChange(item.id, 'FOLLOWED_UP')}
                            className="p-2 rounded-xl bg-[#DDF3E6] border border-[#BDE7CC] text-[#1F6B43] hover:bg-[#C9EBDA] transition-colors"
                            title="Send WhatsApp Message"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>

                          {/* Convert to Order Button */}
                          {item.status !== 'CONVERTED' && (
                            <button
                              onClick={() => handleConvert(item)}
                              disabled={actionLoadingId === item.id}
                              className="px-2.5 py-1.5 rounded-xl bg-[#D6403B] text-white text-[11px] font-bold hover:bg-[#B5322E] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Convert to live order"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Convert</span>
                            </button>
                          )}

                          {/* Dismiss */}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 rounded-xl hover:bg-[#FDE3E1] text-[#6B6B6B] hover:text-[#9B2420] transition-colors"
                            title="Dismiss"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Side Detail Modal / Drawer */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#EFE9E0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
              <div>
                <span className="text-[10px] text-[#6B6B6B] block">Abandoned Checkout Details</span>
                <h3 className="font-heading font-black text-lg text-[#2B2B2B]">
                  {selectedRecord.customerName || 'Shopper'} • {selectedRecord.phone}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#6B6B6B] hover:text-[#2B2B2B]"
              >
                ✕
              </button>
            </div>

            {/* Address & Info */}
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-bold text-[#2B2B2B]">Delivery Details:</span>
                <span className="text-[#6B6B6B]">{selectedRecord.district || 'Dhaka'}</span>
              </div>
              <p className="text-[#6B6B6B]">{selectedRecord.address || 'Address was not completed before leaving'}</p>
              {selectedRecord.notes && (
                <p className="text-[#D6403B] text-[11px] mt-1 font-medium italic">
                  Note: {selectedRecord.notes}
                </p>
              )}
            </div>

            {/* Cart Items */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-[#2B2B2B] block">Cart Snapshot:</span>
              <div className="divide-y divide-[#EFE9E0] border border-[#EFE9E0] rounded-xl overflow-hidden">
                {selectedRecord.items.map((it, idx) => (
                  <div key={idx} className="p-2.5 bg-white flex justify-between items-center">
                    <div>
                      <span className="font-bold text-[#2B2B2B] block">{it.title}</span>
                      {it.variationTitle && <span className="text-[11px] text-[#6B6B6B]">{it.variationTitle}</span>}
                      <span className="text-[#6B6B6B]"> × {it.quantity}</span>
                    </div>
                    <span className="font-bold text-[#2B2B2B]">৳{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-between font-black text-sm text-[#D6403B]">
                <span>Total Cart Value:</span>
                <span>৳{selectedRecord.totalAmount}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <a
                href={`tel:${selectedRecord.phone}`}
                className="py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] font-bold text-xs text-[#2B2B2B] hover:bg-[#EFE9E0] flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-[#1F6B43]" /> Call Customer
              </a>

              <a
                href={`https://wa.me/880${selectedRecord.phone.replace(/^0+/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleStatusChange(selectedRecord.id, 'FOLLOWED_UP')}
                className="py-2.5 rounded-xl bg-[#DDF3E6] border border-[#BDE7CC] font-bold text-xs text-[#1F6B43] hover:bg-[#C9EBDA] flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Message
              </a>
            </div>

            {selectedRecord.status !== 'CONVERTED' ? (
              <button
                onClick={() => {
                  handleConvert(selectedRecord);
                  setSelectedRecord(null);
                }}
                className="w-full py-2.5 rounded-xl bg-[#D6403B] text-white text-xs font-bold hover:bg-[#B5322E] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <UserCheck className="w-4 h-4" /> Convert to Confirmed Order
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-[#DDF3E6] text-[#1F6B43] text-center font-bold text-xs">
                ✓ Already converted to active order
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default IncompleteOrdersManager;
