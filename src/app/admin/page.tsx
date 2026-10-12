'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Truck,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Send,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  getAllOrders,
  getAllProducts,
  updateOrderStatus,
  assignCourierToOrder,
  OrderRecord,
} from '@/lib/store';
import { sampleCategories } from '@/lib/sample-data';
import { formatBDT } from '@/lib/utils';
import { getCourierProvider } from '@/core/courier';

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<OrderRecord[]>(getAllOrders());
  const [products] = useState(getAllProducts());
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories'>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Metrics
  const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const shippedCount = orders.filter((o) => o.status === 'SHIPPED').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = o.orderNumber.toLowerCase().includes(q);
      const matchPhone = o.customerPhone.includes(q);
      const matchName = o.customerName.toLowerCase().includes(q);
      if (!matchNumber && !matchPhone && !matchName) return false;
    }
    return true;
  });

  const handleStatusChange = (orderId: string, newStatus: OrderRecord['status']) => {
    const updated = updateOrderStatus(orderId, newStatus);
    if (updated) {
      setOrders([...getAllOrders()]);
      if (selectedOrder?.id === orderId) setSelectedOrder({ ...updated });
      setActionFeedback(`অর্ডার ${updated.orderNumber} এর স্ট্যাটাস '${newStatus}' করা হয়েছে।`);
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const handleSendToSteadfast = async (order: OrderRecord) => {
    setActionFeedback(`স্টিডফাস্টে কনসাইনমেন্ট ক্রিয়েট করা হচ্ছে...`);
    const courier = getCourierProvider();

    try {
      const res = await courier.createConsignment({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.fullAddress,
        district: order.district,
        codAmount: order.totalAmount,
        customerNote: order.customerNote,
      });

      if (res.success) {
        const updated = assignCourierToOrder(order.id, res.consignmentId, res.trackingCode);
        if (updated) {
          setOrders([...getAllOrders()]);
          setSelectedOrder({ ...updated });
          setActionFeedback(
            `সাফল্য! স্টিডফাস্ট ট্র্যাকিং কোড: ${res.trackingCode} (কনসাইনমেন্ট: ${res.consignmentId})`
          );
        }
      } else {
        setActionFeedback(`ব্যর্থ: ${res.message}`);
      }
    } catch {
      setActionFeedback('কুরিয়ার রিকুয়েস্টে ত্রুটি হয়েছে।');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2B2B2B]">
      {/* Top Admin Bar */}
      <header className="bg-white border-b border-[#EFE9E0] sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-[#FF6B6B] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              র
            </div>
            <div>
              <span className="font-heading font-black text-lg text-[#2B2B2B] leading-none block">
                রংধনু এডমিন প্যানেল
              </span>
              <span className="text-[10px] text-[#6B6B6B] font-bold">Rongdhonu Kids Operations</span>
            </div>
          </Link>
          <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EBF8EE] text-[#2D7A3E]">
            Role: Admin
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-bold text-[#FF6B6B] hover:underline flex items-center gap-1"
          >
            স্টোরফ্রন্ট ভিজিট করুন <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-[22px] border border-[#EFE9E0] shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-[#6B6B6B]">মোট বিক্রয় (Sales)</span>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-[#FF6B6B]">
              ৳{totalSales}
            </div>
            <span className="text-[11px] text-[#2D7A3E] font-semibold mt-1">সব মিলিয়ে {orders.length}টি অর্ডার</span>
          </div>

          <div className="bg-white p-5 rounded-[22px] border border-[#EFE9E0] shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-[#6B6B6B]">অপেক্ষমান (Pending)</span>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-[#FFC93C]">
              {pendingCount}
            </div>
            <span className="text-[11px] text-[#6B6B6B] mt-1">কনফার্মেশনের অপেক্ষায়</span>
          </div>

          <div className="bg-white p-5 rounded-[22px] border border-[#EFE9E0] shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-[#6B6B6B]">কুরিয়ারে হস্তান্তর (Shipped)</span>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-[#5BC0EB]">
              {shippedCount}
            </div>
            <span className="text-[11px] text-[#6B6B6B] mt-1">স্টিডফাস্টে ইন-ট্রানজিট</span>
          </div>

          <div className="bg-white p-5 rounded-[22px] border border-[#EFE9E0] shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-[#6B6B6B]">সফল ডেলিভারি</span>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-[#7BD389]">
              {deliveredCount}
            </div>
            <span className="text-[11px] text-[#2D7A3E] mt-1">ক্যাশ অন ডেলিভারি সম্পন্ন</span>
          </div>
        </div>

        {/* Action Feedback Alert */}
        {actionFeedback && (
          <div className="p-3.5 rounded-2xl bg-[#EBF8EE] border border-[#C4EDCD] text-xs font-bold text-[#2D7A3E] flex items-center justify-between">
            <span>{actionFeedback}</span>
            <button onClick={() => setActionFeedback(null)} className="text-[#6B6B6B] hover:text-[#2B2B2B]">
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-[#EFE9E0] pb-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#FF6B6B] text-white shadow-sm'
                : 'bg-white text-[#6B6B6B] hover:text-[#2B2B2B]'
            }`}
          >
            অর্ডার তালিকা ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#FF6B6B] text-white shadow-sm'
                : 'bg-white text-[#6B6B6B] hover:text-[#2B2B2B]'
            }`}
          >
            পণ্য ও স্টক ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-[#FF6B6B] text-white shadow-sm'
                : 'bg-white text-[#6B6B6B] hover:text-[#2B2B2B]'
            }`}
          >
            ক্যাটাগরি ট্রি
          </button>
        </div>

        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Orders Table */}
            <div className="lg:col-span-2 bg-white rounded-[28px] border border-[#EFE9E0] p-6 shadow-sm space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#6B6B6B]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="অর্ডার নম্বর, ফোন বা নাম দিয়ে খুঁজুন..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-full bg-[#FAF7F2] border border-[#EFE9E0] focus:outline-none focus:border-[#FF6B6B]"
                  />
                </div>

                {/* Status pills */}
                <div className="flex gap-1.5 overflow-x-auto text-xs">
                  {['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap cursor-pointer ${
                        statusFilter === st
                          ? 'bg-[#2B2B2B] text-white'
                          : 'bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#2B2B2B]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EFE9E0] text-[#6B6B6B]">
                      <th className="pb-3 font-bold">অর্ডার নম্বর</th>
                      <th className="pb-3 font-bold">গ্রাহক ও ফোন</th>
                      <th className="pb-3 font-bold">জেলা</th>
                      <th className="pb-3 font-bold">মূল্য</th>
                      <th className="pb-3 font-bold">স্ট্যাটাস</th>
                      <th className="pb-3 font-bold text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE9E0]">
                    {filteredOrders.map((ord) => (
                      <tr
                        key={ord.id}
                        onClick={() => setSelectedOrder(ord)}
                        className={`hover:bg-[#FAF7F2] transition-colors cursor-pointer ${
                          selectedOrder?.id === ord.id ? 'bg-[#FFF9F0]' : ''
                        }`}
                      >
                        <td className="py-3 font-mono font-bold text-[#FF6B6B]">
                          {ord.orderNumber}
                        </td>
                        <td className="py-3">
                          <span className="font-bold text-[#2B2B2B] block">{ord.customerName}</span>
                          <span className="text-[#6B6B6B]">{ord.customerPhone}</span>
                        </td>
                        <td className="py-3 text-[#2B2B2B]">{ord.district}</td>
                        <td className="py-3 font-black text-[#2B2B2B]">৳{ord.totalAmount}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.status === 'CONFIRMED'
                                ? 'bg-[#FFF3E6] text-[#A65E00]'
                                : ord.status === 'SHIPPED'
                                ? 'bg-[#E8F7FD] text-[#197AA5]'
                                : ord.status === 'DELIVERED'
                                ? 'bg-[#EBF8EE] text-[#2D7A3E]'
                                : 'bg-[#FFF9E6] text-[#8C6D00]'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(ord);
                            }}
                            className="p-1 rounded-lg hover:bg-black/5 text-[#FF6B6B]"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Order Detail Panel */}
            <div className="bg-white rounded-[28px] border border-[#EFE9E0] p-6 shadow-sm space-y-4 sticky top-20">
              {selectedOrder ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
                    <div>
                      <span className="text-[10px] text-[#6B6B6B] block">বিস্তারিত দেখুন</span>
                      <h3 className="font-heading font-black text-lg text-[#2B2B2B]">
                        {selectedOrder.orderNumber}
                      </h3>
                    </div>
                    {/* Customer Risk Indicator */}
                    <div className="p-2 rounded-xl bg-[#EBF8EE] border border-[#C4EDCD] text-[11px] text-[#2D7A3E] font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>ডেলিভারি সাকসেস রেট: ৯৬% (নিরাপদ)</span>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] text-xs space-y-1">
                    <span className="font-bold text-[#2B2B2B] block">{selectedOrder.customerName}</span>
                    <p className="text-[#6B6B6B]">{selectedOrder.customerPhone}</p>
                    <p className="text-[#2B2B2B] font-medium">{selectedOrder.fullAddress}</p>
                    {selectedOrder.customerNote && (
                      <p className="text-[#FF6B6B] italic mt-1">নোট: {selectedOrder.customerNote}</p>
                    )}
                  </div>

                  {/* Order items */}
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-[#6B6B6B] block mb-1">অর্ডারের পণ্য:</span>
                    {selectedOrder.items.map((it) => (
                      <div key={it.id} className="flex justify-between py-1 border-b border-[#EFE9E0]/50">
                        <span>
                          {it.title} × {it.quantity}
                        </span>
                        <span className="font-bold">৳{it.total}</span>
                      </div>
                    ))}
                    <div className="pt-2 flex justify-between font-black text-sm text-[#FF6B6B]">
                      <span>সর্বমোট:</span>
                      <span>৳{selectedOrder.totalAmount}</span>
                    </div>
                  </div>

                  {/* 1-Click Steadfast Courier Button */}
                  <div className="pt-2 space-y-2">
                    <span className="font-bold text-xs text-[#2B2B2B] block">
                      কুরিয়ার অ্যাকশন (Steadfast):
                    </span>
                    {selectedOrder.consignmentId ? (
                      <div className="p-3 rounded-2xl bg-[#E8F7FD] border border-[#BFE4F7] text-xs text-[#197AA5] space-y-1">
                        <span className="font-bold block">
                          কুরিয়ার কনসাইনমেন্ট সম্পন্ন (Steadfast)
                        </span>
                        <p className="font-mono text-xs">
                          ID: {selectedOrder.consignmentId} | ট্র্যাকিং: {selectedOrder.trackingCode}
                        </p>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="md"
                        fullWidth
                        onClick={() => handleSendToSteadfast(selectedOrder)}
                      >
                        <Send className="w-4 h-4" />
                        স্টিডফাস্টে পাঠান (১-ক্লিক ডিসপ্যাচ)
                      </Button>
                    )}
                  </div>

                  {/* Status Dropdown */}
                  <div className="pt-2 space-y-1.5">
                    <label className="text-xs font-bold text-[#2B2B2B] block">
                      স্ট্যাটাস পরিবর্তন করুন:
                    </label>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) =>
                        handleStatusChange(
                          selectedOrder.id,
                          e.target.value as OrderRecord['status']
                        )
                      }
                      className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] text-xs font-bold cursor-pointer"
                    >
                      <option value="PENDING">PENDING (অপেক্ষমান)</option>
                      <option value="CONFIRMED">CONFIRMED (কনফার্মড)</option>
                      <option value="PROCESSING">PROCESSING (প্রসেসিং)</option>
                      <option value="SHIPPED">SHIPPED (কুরিয়ারে হস্তান্তর)</option>
                      <option value="DELIVERED">DELIVERED (ডেলিভারি সম্পন্ন)</option>
                      <option value="CANCELLED">CANCELLED (বাতিল)</option>
                    </select>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-xs text-[#6B6B6B]">
                  তালিকা থেকে যেকোনো অর্ডার সিলেক্ট করুন
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS & STOCK */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-[28px] border border-[#EFE9E0] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
              <h2 className="font-heading font-bold text-lg text-[#2B2B2B]">
                পণ্য ক্যাটালগ ও স্টক লেভেল
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EFE9E0] text-[#6B6B6B]">
                    <th className="pb-3 font-bold">ছবি</th>
                    <th className="pb-3 font-bold">পণ্যের নাম</th>
                    <th className="pb-3 font-bold">ভ্যারিয়েশনসমূহ</th>
                    <th className="pb-3 font-bold">মূল্য</th>
                    <th className="pb-3 font-bold">স্টক স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE9E0]">
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#EFE9E0]">
                          <Image src={p.imageUrl} alt={p.titleBn} fill className="object-cover" />
                        </div>
                      </td>
                      <td className="py-3 font-bold text-[#2B2B2B]">
                        {p.titleBn}
                        <span className="block text-[11px] text-[#6B6B6B] font-normal">{p.slug}</span>
                      </td>
                      <td className="py-3">
                        {p.variations ? (
                          <div className="space-y-0.5">
                            {p.variations.map((v) => (
                              <div key={v.sku} className="text-[11px]">
                                <span className="font-bold">{v.titleBn}:</span> ৳{v.salePrice || v.price} (স্টক: {v.stock})
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#6B6B6B]">একক পণ্য (Single)</span>
                        )}
                      </td>
                      <td className="py-3 font-black text-[#FF6B6B]">
                        ৳{p.baseSalePrice || p.basePrice}
                      </td>
                      <td className="py-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#EBF8EE] text-[#2D7A3E]">
                          পর্যাপ্ত স্টক আছে
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORY TREE */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-[28px] border border-[#EFE9E0] p-6 shadow-sm space-y-4">
            <h2 className="font-heading font-bold text-lg text-[#2B2B2B] pb-3 border-b border-[#EFE9E0]">
              সীমাহীন গভীরতার ক্যাটাগরি ট্রি (Unlimited Depth Tree)
            </h2>

            <div className="space-y-3">
              {sampleCategories.map((c) => (
                <div key={c.slug} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-sm text-[#2B2B2B]">
                      📁 {c.nameBn} ({c.nameEn})
                    </span>
                    <span className="text-xs text-[#6B6B6B] font-mono">/{c.slug}</span>
                  </div>
                  {c.children && c.children.length > 0 && (
                    <div className="pl-6 border-l-2 border-[#FF6B6B] space-y-1 text-xs">
                      {c.children.map((sub) => (
                        <div key={sub.slug} className="text-[#6B6B6B]">
                          ↳ {sub.nameBn} ({sub.nameEn})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
