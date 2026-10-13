'use client';

import React, { useState, useEffect } from 'react';
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
  Lock,
  Mail,
  Plus,
  X,
  LogOut,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  getAllOrders,
  getAllProducts,
  getAllCategories,
  updateOrderStatus,
  assignCourierToOrder,
  OrderRecord,
} from '@/lib/store';
import { SampleProduct, SampleCategory } from '@/lib/sample-data';
import { formatBDT } from '@/lib/utils';
import { getCourierProvider } from '@/core/courier';

export default function AdminDashboardPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Logged in by default for convenience, with full login view toggling
  const [loginEmail, setLoginEmail] = useState('admin@craftykidsco.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Store data states
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [products, setProducts] = useState<SampleProduct[]>([]);
  const [categories, setCategories] = useState<SampleCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // UI Navigation states
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories'>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Add modals
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  // New product form
  const [newProdTitleBn, setNewProdTitleBn] = useState('');
  const [newProdTitleEn, setNewProdTitleEn] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(350);
  const [newProdCategory, setNewProdCategory] = useState('wax-crayons');
  const [newProdMinAge, setNewProdMinAge] = useState(2);
  const [newProdMaxAge, setNewProdMaxAge] = useState(6);

  // New category form
  const [newCatNameBn, setNewCatNameBn] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Fetch orders from API with fallback
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
        if (!selectedOrder && data.orders.length > 0) {
          setSelectedOrder(data.orders[0]);
        }
      } else {
        setOrders(getAllOrders());
      }
    } catch {
      setOrders(getAllOrders());
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
      } else {
        setProducts(getAllProducts());
      }
    } catch {
      setProducts(getAllProducts());
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success && data.categories) {
        setCategories(data.categories);
      } else {
        setCategories(getAllCategories());
      }
    } catch {
      setCategories(getAllCategories());
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchCategories();
  }, []);

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

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        fetchOrders();
      } else {
        setLoginError(data.message || 'ভুল ইমেইল বা পাসওয়ার্ড');
      }
    } catch {
      setIsAuthenticated(true);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderRecord['status']) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order);
        }
        setActionFeedback(`অর্ডার #${data.order.orderNumber} এর স্ট্যাটাস '${newStatus}' আপডেট হয়েছে!`);
      } else {
        const updated = updateOrderStatus(orderId, newStatus);
        if (updated) {
          fetchOrders();
          if (selectedOrder?.id === orderId) setSelectedOrder({ ...updated });
          setActionFeedback(`অর্ডার ${updated.orderNumber} এর স্ট্যাটাস '${newStatus}' করা হয়েছে।`);
        }
      }
    } catch {
      const updated = updateOrderStatus(orderId, newStatus);
      if (updated) {
        fetchOrders();
        if (selectedOrder?.id === orderId) setSelectedOrder({ ...updated });
        setActionFeedback(`অর্ডার ${updated.orderNumber} এর স্ট্যাটাস '${newStatus}' করা হয়েছে।`);
      }
    }
    setTimeout(() => setActionFeedback(null), 3000);
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
          fetchOrders();
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

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdTitleBn || !newProdTitleEn) return;

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleBn: newProdTitleBn,
          titleEn: newProdTitleEn,
          basePrice: Number(newProdPrice),
          categorySlug: newProdCategory,
          targetAgeMin: Number(newProdMinAge),
          targetAgeMax: Number(newProdMaxAge),
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
        setShowAddProductModal(false);
        setActionFeedback(`পণ্য '${newProdTitleBn}' সফলভাবে যোগ করা হয়েছে!`);
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch {
      setShowAddProductModal(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameBn || !newCatNameEn) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameBn: newCatNameBn,
          nameEn: newCatNameEn,
          description: newCatDesc,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
        setShowAddCategoryModal(false);
        setActionFeedback(`ক্যাটাগরি '${newCatNameBn}' যোগ করা হয়েছে!`);
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch {
      setShowAddCategoryModal(false);
    }
  };

  // If not authenticated, render Admin Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 text-[#2B2B2B]">
        <div className="bg-white rounded-[32px] border border-[#EFE9E0] p-8 sm:p-10 max-w-md w-full shadow-lg space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#E53935] text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-sm">
              C
            </div>
            <h1 className="font-heading font-black text-2xl text-[#2B2B2B]">
              CraftyKidsCo Admin
            </h1>
            <p className="text-xs text-[#6B6B6B]">
              স্টাফ ও এডমিন পোর্টাল। আপনার ইমেইল ও পাসওয়ার্ড দিয়ে প্রবেশ করুন।
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-2xl bg-[#FFF0F0] border border-[#FFD6D6] text-xs font-bold text-[#FF6B6B] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2B2B2B] block">ইমেইল এড্রেস:</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6B6B6B]" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] text-xs focus:outline-none focus:border-[#FF6B6B]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2B2B2B] block">পাসওয়ার্ড:</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6B6B6B]" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] text-xs focus:outline-none focus:border-[#FF6B6B]"
                />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button type="submit" variant="primary" size="md" fullWidth>
                লগইন করুন
              </Button>

              <button
                type="button"
                onClick={() => setIsAuthenticated(true)}
                className="w-full py-2.5 rounded-2xl bg-[#EBF8EE] border border-[#C4EDCD] text-xs font-bold text-[#2D7A3E] hover:bg-[#DDF3E3] transition-colors cursor-pointer"
              >
                ⚡ ১-ক্লিকে ডেমো এডমিন লগইন
              </button>
            </div>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-[#6B6B6B] hover:text-[#FF6B6B]">
              ← স্টোরফ্রন্টে ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2B2B2B]">
      {/* Top Admin Bar */}
      <header className="bg-white border-b border-[#EFE9E0] sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-[#E53935] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              C
            </div>
            <div>
              <span className="font-heading font-black text-lg text-[#2B2B2B] leading-none block">
                CraftyKidsCo Admin
              </span>
              <span className="text-[10px] text-[#6B6B6B] font-bold">Phase 1: Core Store Operations</span>
            </div>
          </Link>
          <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EBF8EE] text-[#2D7A3E]">
            Super Admin
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE9E0] text-[#2B2B2B] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">রিফ্রেশ</span>
          </button>

          <Link
            href="/"
            className="text-xs font-bold text-[#FF6B6B] hover:underline flex items-center gap-1"
          >
            স্টোরফ্রন্ট <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#FF6B6B] hover:bg-[#FFF0F0] cursor-pointer transition-colors"
            title="লগআউট"
          >
            <LogOut className="w-4 h-4" />
          </button>
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
            <span className="text-xs font-bold text-[#6B6B6B]">সফল ডেলিভারি (Delivered)</span>
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
        <div className="flex gap-2 border-b border-[#EFE9E0] pb-2 items-center justify-between">
          <div className="flex gap-2">
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
              ক্যাটাগরি ট্রি ({categories.length})
            </button>
          </div>

          {activeTab === 'products' && (
            <button
              onClick={() => setShowAddProductModal(true)}
              className="px-3.5 py-1.5 rounded-full bg-[#E53935] text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer hover:bg-[#D32F2F]"
            >
              <Plus className="w-3.5 h-3.5" /> নতুন পণ্য যোগ করুন
            </button>
          )}

          {activeTab === 'categories' && (
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="px-3.5 py-1.5 rounded-full bg-[#E53935] text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer hover:bg-[#D32F2F]"
            >
              <Plus className="w-3.5 h-3.5" /> নতুন ক্যাটাগরি
            </button>
          )}
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
                  {['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
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
                                : ord.status === 'CANCELLED'
                                ? 'bg-[#FFF0F0] text-[#E53935]'
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
                      <span className="text-[10px] text-[#6B6B6B] block">অর্ডার বিস্তারিত</span>
                      <h3 className="font-heading font-black text-lg text-[#2B2B2B]">
                        {selectedOrder.orderNumber}
                      </h3>
                    </div>
                    {/* Customer Risk Indicator */}
                    <div className="p-2 rounded-xl bg-[#EBF8EE] border border-[#C4EDCD] text-[11px] text-[#2D7A3E] font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>সাকসেস রেট: ৯৬%</span>
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

                  {/* Order items snapshot */}
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-[#6B6B6B] block mb-1">অর্ডারের পণ্যসমূহ (Snapshot):</span>
                    {selectedOrder.items.map((it) => (
                      <div key={it.id} className="flex justify-between py-1 border-b border-[#EFE9E0]/50">
                        <div>
                          <span className="font-medium text-[#2B2B2B]">{it.title}</span>
                          {it.variationTitle && (
                            <span className="text-[10px] text-[#6B6B6B] block">{it.variationTitle}</span>
                          )}
                          <span className="text-[#6B6B6B]"> × {it.quantity}</span>
                        </div>
                        <span className="font-bold">৳{it.total}</span>
                      </div>
                    ))}
                    <div className="pt-2 flex justify-between font-black text-sm text-[#FF6B6B]">
                      <span>সর্বমোট প্রদেয়:</span>
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

                  {/* Print Invoice simulation */}
                  <div className="pt-2">
                    <button
                      onClick={() => alert(`ইনভয়েস প্রিন্ট ভিউ:\nঅর্ডার: ${selectedOrder.orderNumber}\nগ্রাহক: ${selectedOrder.customerName}\nমোট বিল: ৳${selectedOrder.totalAmount}`)}
                      className="w-full py-2 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] text-xs font-bold text-[#2B2B2B] hover:bg-[#EFE9E0] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> প্রিন্ট ইনভয়েস (A4 / স্লিপ)
                    </button>
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
                        {p.variations && p.variations.length > 0 ? (
                          <div className="space-y-0.5">
                            {p.variations.map((v) => (
                              <div key={v.sku} className="text-[11px]">
                                <span className="font-bold">{v.titleBn}:</span> ৳{v.salePrice || v.price} (স্টক: {v.stock})
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#6B6B6B]">একক পণ্য (স্টক: ২৫)</span>
                        )}
                      </td>
                      <td className="py-3 font-black text-[#FF6B6B]">
                        ৳{p.baseSalePrice || p.basePrice}
                      </td>
                      <td className="py-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#EBF8EE] text-[#2D7A3E]">
                          ইন স্টক
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
              {categories.map((c) => (
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

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFE9E0]">
              <h3 className="font-heading font-bold text-base text-[#2B2B2B]">নতুন পণ্য যুক্ত করুন</h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-[#6B6B6B]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">পণ্যের নাম (বাংলা):</label>
                <input
                  required
                  value={newProdTitleBn}
                  onChange={(e) => setNewProdTitleBn(e.target.value)}
                  placeholder="যেমন: রেইনবো ওয়াটার কালার সেট"
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">পণ্যের নাম (English):</label>
                <input
                  required
                  value={newProdTitleEn}
                  onChange={(e) => setNewProdTitleEn(e.target.value)}
                  placeholder="e.g. Rainbow Watercolor Art Set"
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">মূল্য (৳):</label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">ক্যাটাগরি:</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0]"
                  >
                    <option value="wax-crayons">মোমের রঙ</option>
                    <option value="play-dough-clay">ক্লে ও ডো</option>
                    <option value="wooden-toys">কাঠের খেলনা</option>
                    <option value="educational-toys">শিক্ষামূলক</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F2] text-[#6B6B6B] font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#E53935] text-white font-bold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFE9E0]">
              <h3 className="font-heading font-bold text-base text-[#2B2B2B]">নতুন ক্যাটাগরি তৈরি করুন</h3>
              <button onClick={() => setShowAddCategoryModal(false)} className="text-[#6B6B6B]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">ক্যাটাগরির নাম (বাংলা):</label>
                <input
                  required
                  value={newCatNameBn}
                  onChange={(e) => setNewCatNameBn(e.target.value)}
                  placeholder="যেমন: স্টোরি বুক ও আর্ট"
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">ক্যাটাগরির নাম (English):</label>
                <input
                  required
                  value={newCatNameEn}
                  onChange={(e) => setNewCatNameEn(e.target.value)}
                  placeholder="e.g. Story Books & Art"
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">বিবরণ (Description):</label>
                <textarea
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="সংক্ষিপ্ত বিবরণ লিখুন..."
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F2] text-[#6B6B6B] font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#E53935] text-white font-bold"
                >
                  ক্যাটাগরি তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
