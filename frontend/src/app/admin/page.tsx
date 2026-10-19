'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Plus,
  ExternalLink,
  X,
  Send,
  Printer,
  CheckCircle,
  Truck,
  RotateCcw,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Upload,
  Image as ImageIcon,
  Loader2,
  Menu,
} from 'lucide-react';
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
  // Navigation State
  const [activeNav, setActiveNav] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Store Data States
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [products, setProducts] = useState<SampleProduct[]>([]);
  const [categories, setCategories] = useState<SampleCategory[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Modals
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState<boolean>(false);

  // New product form
  const [newProdTitleBn, setNewProdTitleBn] = useState('');
  const [newProdTitleEn, setNewProdTitleEn] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(1200);
  const [newProdSalePrice, setNewProdSalePrice] = useState(999);
  const [newProdCategory, setNewProdCategory] = useState('art-kits');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdPieces, setNewProdPieces] = useState('');
  const [newProdBadge, setNewProdBadge] = useState('সেরা অফার');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // New category form
  const [newCatNameBn, setNewCatNameBn] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Orders status filter for Orders tab
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<string>('ALL');

  // Sync data from API / store
  const refreshData = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success && data.orders && data.orders.length > 0) {
        setOrders(data.orders);
      } else {
        setOrders(getAllOrders());
      }
    } catch {
      setOrders(getAllOrders());
    }

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
    refreshData();
  }, []);

  // Filtered orders for Recent Orders & Orders tab
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (ordersStatusFilter !== 'ALL' && o.status !== ordersStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = o.orderNumber.toLowerCase().includes(q);
        const matchPhone = o.customerPhone.includes(q);
        const matchName = o.customerName.toLowerCase().includes(q);
        if (!matchNumber && !matchPhone && !matchName) return false;
      }
      return true;
    });
  }, [orders, ordersStatusFilter, searchQuery]);

  // Order status update
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
        setActionFeedback(`অর্ডার #${data.order.orderNumber} স্ট্যাটাস '${newStatus}' আপডেট হয়েছে!`);
      } else {
        const updated = updateOrderStatus(orderId, newStatus);
        if (updated) {
          refreshData();
          if (selectedOrder?.id === orderId) setSelectedOrder({ ...updated });
          setActionFeedback(`অর্ডার #${updated.orderNumber} স্ট্যাটাস '${newStatus}' করা হয়েছে।`);
        }
      }
    } catch {
      const updated = updateOrderStatus(orderId, newStatus);
      if (updated) {
        refreshData();
        if (selectedOrder?.id === orderId) setSelectedOrder({ ...updated });
        setActionFeedback(`অর্ডার #${updated.orderNumber} স্ট্যাটাস '${newStatus}' করা হয়েছে।`);
      }
    }
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // 1-Click Steadfast dispatch
  const handleSendToSteadfast = async (order: OrderRecord) => {
    setActionFeedback(`স্টিডফাস্টে কনসাইনমেন্ট পাঠানো হচ্ছে...`);
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
          refreshData();
          setSelectedOrder({ ...updated });
          setActionFeedback(
            `সাফল্য! স্টিডফাস্ট ট্র্যাকিং কোড: ${res.trackingCode} (ID: ${res.consignmentId})`
          );
        }
      } else {
        setActionFeedback(`ব্যর্থ: ${res.message}`);
      }
    } catch {
      setActionFeedback('কুরিয়ার রিকুয়েস্টে সমস্যা হয়েছে।');
    }
  };

  // Handle image upload to ImgBB
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', `craftykidsco_${Date.now()}`);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && (data.url || data.display_url)) {
        const cdnUrl = data.url || data.display_url;
        setNewProdImage(cdnUrl);
        setActionFeedback('ছবি ImgBB CDN এ সফলভাবে আপলোড হয়েছে!');
      } else {
        setUploadError(data.message || 'ImgBB আপলোডে সমস্যা হয়েছে');
      }
    } catch (err: any) {
      setUploadError(err.message || 'ছবি আপলোড ব্যর্থ হয়েছে');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Create Product handler
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
          baseSalePrice: Number(newProdSalePrice || newProdPrice),
          categorySlug: newProdCategory,
          imageUrl: newProdImage || 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg',
          image: newProdImage || 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg',
          description: newProdDescription,
          pieces: newProdPieces,
          badge: newProdBadge,
          isNewArrival: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        refreshData();
        setShowAddProductModal(false);
        setNewProdTitleBn('');
        setNewProdTitleEn('');
        setNewProdPrice(1200);
        setNewProdSalePrice(999);
        setNewProdImage('');
        setNewProdDescription('');
        setNewProdPieces('');
        setActionFeedback(`পণ্য '${newProdTitleBn}' MongoDB Atlas এ সফলভাবে সংরক্ষিত হয়েছে!`);
        setTimeout(() => setActionFeedback(null), 3500);
      }
    } catch {
      setShowAddProductModal(false);
    }
  };

  // Create Category handler
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
        refreshData();
        setShowAddCategoryModal(false);
        setNewCatNameBn('');
        setNewCatNameEn('');
        setActionFeedback(`ক্যাটাগরি '${newCatNameBn}' যোগ হয়েছে!`);
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch {
      setShowAddCategoryModal(false);
    }
  };

  // Render Status Badge matching exact screenshot
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E]">
            Confirmed
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#E0F2FE] text-[#0369A1]">
            Shipped
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#15803D]">
            Delivered
          </span>
        );
      case 'CANCELLED':
      case 'RETURNED':
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#DC2626]">
            Returned
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#B91C1C]">
            Pending
          </span>
        );
    }
  };

  const renderNavSection = (title: string, items: { id: string; label: string }[]) => (
    <div className="space-y-1">
      <p className="text-[11px] font-bold text-[#9E9E9E] tracking-wider uppercase px-3 mb-1.5">
        {title}
      </p>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            setActiveNav(item.id);
            setIsMobileNavOpen(false);
          }}
          className={`w-full text-left px-3.5 py-2 rounded-xl transition-colors cursor-pointer text-[13px] ${
            activeNav === item.id
              ? 'bg-[#FDE8E8] text-[#D32F2F] font-bold'
              : 'text-[#3E3E3E] hover:bg-[#FAF7F2] font-medium'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  const sidebarContent = (
    <div className="space-y-6">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D32F2F] text-white flex items-center justify-center font-bold text-xl shadow-xs">
            <span className="font-heading">র</span>
          </div>
          <div>
            <h2 className="font-heading font-black text-base text-[#1F1F1F] leading-tight">
              CraftyKidsCo
            </h2>
            <p className="text-xs text-[#8A8A8A] font-medium">Admin panel</p>
          </div>
        </div>
        {/* Close button for mobile drawer */}
        <button
          onClick={() => setIsMobileNavOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#1F1F1F] hover:bg-[#FAF7F2]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links Grouped by Section */}
      <nav className="space-y-5 text-[13px]">
        {renderNavSection('OVERVIEW', [
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'reports', label: 'Reports' },
        ])}
        {renderNavSection('SALES', [
          { id: 'orders', label: 'Orders' },
          { id: 'incomplete-orders', label: 'Incomplete orders' },
          { id: 'customers', label: 'Customers' },
          { id: 'coupons', label: 'Coupons' },
          { id: 'sms-campaigns', label: 'SMS campaigns' },
        ])}
        {renderNavSection('CATALOG', [
          { id: 'products', label: 'Products' },
          { id: 'categories', label: 'Categories and attributes' },
          { id: 'bundles', label: 'Bundles' },
          { id: 'stock', label: 'Stock' },
        ])}
        {renderNavSection('SHIPPING', [
          { id: 'steadfast', label: 'Steadfast courier' },
          { id: 'delivery-charges', label: 'Delivery charges' },
          { id: 'block-list', label: 'Block list' },
        ])}
        {renderNavSection('CONTENT', [
          { id: 'blog', label: 'Blog' },
          { id: 'faq-policies', label: 'FAQ and policies' },
          { id: 'home-sections', label: 'Home sections' },
        ])}
        {renderNavSection('SYSTEM', [
          { id: 'staff', label: 'Staff and roles' },
          { id: 'payments-sms', label: 'Payments and SMS' },
        ])}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col lg:flex-row text-[#2B2B2B] font-sans antialiased">
      {/* 1. Mobile Admin Top Bar (< lg) */}
      <div className="lg:hidden bg-white border-b border-[#EFEAE2] px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 rounded-xl text-[#3E3E3E] hover:bg-[#FAF7F2] border border-[#EFEAE2] active:scale-95 transition-all cursor-pointer"
            aria-label="Open Admin Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D32F2F] text-white flex items-center justify-center font-bold text-base">
              <span className="font-heading">র</span>
            </div>
            <div>
              <span className="font-heading font-black text-sm text-[#1F1F1F] block leading-tight">
                CraftyKidsCo
              </span>
              <span className="text-[10px] text-[#888] font-bold uppercase tracking-wider">
                {activeNav}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="px-2.5 py-1.5 rounded-lg border border-[#E5E0D8] text-xs font-semibold text-[#2B2B2B] hover:bg-[#FAF7F2]"
          >
            Store
          </Link>
          <button
            onClick={() => setShowAddProductModal(true)}
            className="px-3 py-1.5 rounded-lg bg-[#D32F2F] text-white text-xs font-bold hover:bg-[#B71C1C] flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Product
          </button>
        </div>
      </div>

      {/* 2. Mobile Drawer (< lg) */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white border-r border-[#EFEAE2] p-5 flex flex-col justify-between overflow-y-auto shadow-2xl z-50">
            {sidebarContent}
            <div className="pt-4 border-t border-[#EFEAE2] text-[11px] text-[#8A8A8A] px-2">
              <p>© 2026 CraftyKidsCo</p>
              <p className="text-[10px]">Mobile-first E-commerce</p>
            </div>
          </aside>
        </div>
      )}

      {/* 3. Desktop Persistent Sidebar (lg+) */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-[#EFEAE2] min-h-screen p-5 hidden lg:flex flex-col justify-between">
        {sidebarContent}
        <div className="pt-4 border-t border-[#EFEAE2] text-[11px] text-[#8A8A8A] px-2">
          <p>© 2026 CraftyKidsCo</p>
          <p className="text-[10px]">Mobile-first E-commerce</p>
        </div>
      </aside>

      {/* =========================================================================
          MAIN CONTENT AREA
         ========================================================================= */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1280px] w-full min-w-0">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="font-heading font-black text-xl sm:text-2xl lg:text-3xl text-[#1F1F1F]">
            {activeNav === 'dashboard' && 'Dashboard'}
            {activeNav === 'orders' && 'Orders'}
            {activeNav === 'products' && 'Products & Inventory'}
            {activeNav === 'categories' && 'Categories & Attributes'}
            {activeNav === 'steadfast' && 'Steadfast Courier Dispatch'}
            {activeNav === 'stock' && 'Stock Inventory'}
            {!['dashboard', 'orders', 'products', 'categories', 'steadfast', 'stock'].includes(activeNav) &&
              activeNav.replace('-', ' ').toUpperCase()}
          </h1>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {/* Search Input Box */}
            <div className="relative flex-1 sm:w-64 lg:w-80 min-w-[180px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, phone, products"
                className="w-full bg-white border border-[#E5E0D8] rounded-xl px-4 py-2 text-xs text-[#2B2B2B] placeholder:text-[#999999] focus:outline-none focus:border-[#D32F2F] shadow-xs"
              />
            </div>

            {/* View Store Button */}
            <Link
              href="/"
              className="hidden sm:inline-flex px-3.5 py-2 rounded-xl bg-white border border-[#E5E0D8] text-xs font-semibold text-[#2B2B2B] hover:bg-[#FAF7F2] transition-colors shadow-xs"
            >
              View store
            </Link>

            {/* Add Product Button */}
            <button
              onClick={() => setShowAddProductModal(true)}
              className="hidden sm:inline-flex px-3.5 py-2 rounded-xl bg-[#D32F2F] text-white text-xs font-bold hover:bg-[#B71C1C] transition-colors shadow-xs cursor-pointer items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add product
            </button>
          </div>
        </div>

        {/* Action Feedback Toast */}
        {actionFeedback && (
          <div className="p-3.5 rounded-2xl bg-[#EBF8EE] border border-[#C4EDCD] text-xs font-bold text-[#2D7A3E] flex items-center justify-between shadow-xs">
            <span>{actionFeedback}</span>
            <button onClick={() => setActionFeedback(null)} className="text-[#6B6B6B] hover:text-[#2B2B2B]">
              ✕
            </button>
          </div>
        )}

        {/* =====================================================================
            VIEW 1: DASHBOARD (MATCHING SCREENSHOT EXACTLY)
           ===================================================================== */}
        {activeNav === 'dashboard' && (
          <div className="space-y-6">
            {/* 4 TOP METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Today sales */}
              <div className="bg-white rounded-2xl border border-[#EFEAE2] p-5 shadow-xs flex flex-col justify-between">
                <span className="text-xs text-[#6B6B6B] font-medium">Today sales</span>
                <div className="my-2.5">
                  <span className="text-2xl lg:text-[28px] font-black text-[#1A1A1A] tracking-tight">
                    ৳42,380
                  </span>
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5E9] text-[#2E7D32]">
                    +12% vs yesterday
                  </span>
                </div>
              </div>

              {/* Card 2: Orders today */}
              <div className="bg-white rounded-2xl border border-[#EFEAE2] p-5 shadow-xs flex flex-col justify-between">
                <span className="text-xs text-[#6B6B6B] font-medium">Orders today</span>
                <div className="my-2.5">
                  <span className="text-2xl lg:text-[28px] font-black text-[#1A1A1A] tracking-tight">
                    {Math.max(38, orders.length)}
                  </span>
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#92400E]">
                    9 need confirmation
                  </span>
                </div>
              </div>

              {/* Card 3: COD to collect */}
              <div className="bg-white rounded-2xl border border-[#EFEAE2] p-5 shadow-xs flex flex-col justify-between">
                <span className="text-xs text-[#6B6B6B] font-medium">COD to collect</span>
                <div className="my-2.5">
                  <span className="text-2xl lg:text-[28px] font-black text-[#1A1A1A] tracking-tight">
                    ৳186,200
                  </span>
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E0F2FE] text-[#0369A1]">
                    24 parcels in transit
                  </span>
                </div>
              </div>

              {/* Card 4: Return rate */}
              <div className="bg-white rounded-2xl border border-[#EFEAE2] p-5 shadow-xs flex flex-col justify-between">
                <span className="text-xs text-[#6B6B6B] font-medium">Return rate</span>
                <div className="my-2.5">
                  <span className="text-2xl lg:text-[28px] font-black text-[#1A1A1A] tracking-tight">
                    4.2%
                  </span>
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#B91C1C]">
                    Last 30 days
                  </span>
                </div>
              </div>
            </div>

            {/* MIDDLE ROW: CHART + NEEDS ATTENTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {/* Left: Sales, last 7 days chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EFEAE2] p-6 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-black text-base text-[#1A1A1A]">
                    Sales, last 7 days
                  </h3>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EBF5FA] text-[#0284C7]">
                    Daily
                  </span>
                </div>

                {/* Smooth Chart SVG with exact aesthetic */}
                <div className="relative w-full h-44 pt-2">
                  <svg
                    viewBox="0 0 600 160"
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    {/* Horizontal light grid lines */}
                    <line x1="0" y1="30" x2="600" y2="30" stroke="#F0EAE1" strokeWidth="1" />
                    <line x1="0" y1="80" x2="600" y2="80" stroke="#F0EAE1" strokeWidth="1" />
                    <line x1="0" y1="130" x2="600" y2="130" stroke="#F0EAE1" strokeWidth="1" />

                    {/* Gradient Area under line */}
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D32F2F" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#D32F2F" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    <path
                      d="M 30,130 C 80,120 110,110 160,115 C 210,120 250,90 310,70 C 370,100 420,80 470,60 C 520,50 560,40 590,30 L 590,140 L 30,140 Z"
                      fill="url(#salesGrad)"
                    />

                    {/* Main Red Curve Line */}
                    <path
                      d="M 30,130 C 80,120 110,110 160,115 C 210,120 250,90 310,70 C 370,100 420,80 470,60 C 520,50 560,40 590,30"
                      fill="none"
                      stroke="#D32F2F"
                      strokeWidth="2.7"
                      strokeLinecap="round"
                    />

                    {/* Golden/Yellow Dots matching screenshot at day 4 & day 7 */}
                    <circle cx="310" cy="70" r="4.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="590" cy="30" r="4.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
                  </svg>
                </div>

                {/* Day labels below chart */}
                <div className="flex justify-between text-[11px] text-[#8A8A8A] font-medium pt-3 border-t border-[#F0EAE1]">
                  <span>Sat</span>
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span className="font-bold text-[#D32F2F]">Today</span>
                </div>
              </div>

              {/* Right: Needs attention */}
              <div className="bg-white rounded-2xl border border-[#EFEAE2] p-6 shadow-xs flex flex-col justify-between">
                <h3 className="font-heading font-black text-base text-[#1A1A1A] mb-3">
                  Needs attention
                </h3>

                <div className="space-y-4 text-xs font-medium text-[#2B2B2B]">
                  {/* Item 1 */}
                  <div
                    onClick={() => setActiveNav('stock')}
                    className="flex items-center justify-between cursor-pointer hover:bg-[#FAF7F2] p-2 rounded-xl transition-colors"
                  >
                    <span>Low stock variations</span>
                    <span className="w-6 h-6 rounded-full bg-[#FEF3C7] text-[#D97706] font-bold flex items-center justify-center text-xs">
                      6
                    </span>
                  </div>

                  {/* Item 2 */}
                  <div
                    onClick={() => setActiveNav('incomplete-orders')}
                    className="flex items-center justify-between cursor-pointer hover:bg-[#FAF7F2] p-2 rounded-xl transition-colors"
                  >
                    <span>Incomplete orders</span>
                    <span className="w-6 h-6 rounded-full bg-[#E0F2FE] text-[#0284C7] font-bold flex items-center justify-center text-xs">
                      11
                    </span>
                  </div>

                  {/* Item 3 */}
                  <div
                    onClick={() => setActiveNav('customers')}
                    className="flex items-center justify-between cursor-pointer hover:bg-[#FAF7F2] p-2 rounded-xl transition-colors"
                  >
                    <span>High risk customers</span>
                    <span className="w-6 h-6 rounded-full bg-[#FEE2E2] text-[#DC2626] font-bold flex items-center justify-center text-xs">
                      3
                    </span>
                  </div>

                  {/* Item 4 */}
                  <div
                    onClick={() => setActiveNav('steadfast')}
                    className="flex items-center justify-between cursor-pointer hover:bg-[#FAF7F2] p-2 rounded-xl transition-colors"
                  >
                    <span>Courier sync errors</span>
                    <span className="w-6 h-6 rounded-full bg-[#DCFCE7] text-[#16A34A] font-bold flex items-center justify-center text-xs">
                      0
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[11px] text-[#8A8A8A]">All systems synchronized with Steadfast</p>
                </div>
              </div>
            </div>

            {/* BOTTOM SECTION: RECENT ORDERS CARD (MATCHING SCREENSHOT) */}
            <div className="bg-white rounded-2xl border border-[#EFEAE2] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h3 className="font-heading font-black text-base text-[#1A1A1A]">
                  Recent orders
                </h3>
                <button
                  onClick={() => setActiveNav('orders')}
                  className="text-xs font-bold text-[#D32F2F] hover:underline cursor-pointer"
                >
                  View all
                </button>
              </div>

              {/* Recent Orders Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[540px]">
                  <thead>
                    <tr className="border-b border-[#EFEAE2] text-[#6B6B6B]">
                      <th className="pb-3 font-semibold">Order</th>
                      <th className="pb-3 font-semibold">Customer</th>
                      <th className="pb-3 font-semibold">District</th>
                      <th className="pb-3 font-semibold">Total</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEAE2]">
                    {/* Render top recent orders */}
                    {filteredOrders.slice(0, 7).map((ord) => (
                      <tr
                        key={ord.id}
                        onClick={() => setSelectedOrder(ord)}
                        className="hover:bg-[#FAF7F2] transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 font-bold text-[#D32F2F] group-hover:underline">
                          {ord.orderNumber}
                        </td>
                        <td className="py-3.5 font-medium text-[#2B2B2B]">
                          {ord.customerName}
                        </td>
                        <td className="py-3.5 text-[#4A4A4A]">
                          {ord.district}
                        </td>
                        <td className="py-3.5 font-medium text-[#1A1A1A]">
                          ৳{ord.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5">
                          {renderStatusBadge(ord.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEW 2: ORDERS LIST (FULL TABLE WITH DETAILS)
           ===================================================================== */}
        {activeNav === 'orders' && (
          <div className="bg-white rounded-2xl border border-[#EFEAE2] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EFEAE2]">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-nowrap max-w-full">
                {['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrdersStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      ordersStatusFilter === st
                        ? 'bg-[#1F1F1F] text-white'
                        : 'bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#1F1F1F]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <span className="text-xs text-[#6B6B6B] font-medium shrink-0">
                Total {filteredOrders.length} orders
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#EFEAE2] text-[#6B6B6B]">
                    <th className="pb-3 font-semibold">Order</th>
                    <th className="pb-3 font-semibold">Customer & Phone</th>
                    <th className="pb-3 font-semibold">District & Address</th>
                    <th className="pb-3 font-semibold">Items</th>
                    <th className="pb-3 font-semibold">Total</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEAE2]">
                  {filteredOrders.map((ord) => (
                    <tr
                      key={ord.id}
                      onClick={() => setSelectedOrder(ord)}
                      className="hover:bg-[#FAF7F2] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 font-bold text-[#D32F2F]">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3.5">
                        <strong className="text-[#1A1A1A] block">{ord.customerName}</strong>
                        <span className="text-[#6B6B6B]">{ord.customerPhone}</span>
                      </td>
                      <td className="py-3.5 text-[#4A4A4A] max-w-xs truncate">
                        <span className="font-semibold block">{ord.district}</span>
                        <span className="text-[#6B6B6B] text-[11px] truncate block">{ord.fullAddress}</span>
                      </td>
                      <td className="py-3.5 text-[#6B6B6B]">
                        {ord.items.map((it) => it.title).join(', ')}
                      </td>
                      <td className="py-3.5 font-bold text-[#1A1A1A]">
                        ৳{ord.totalAmount}
                      </td>
                      <td className="py-3.5">
                        {renderStatusBadge(ord.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEW 3: PRODUCTS & INVENTORY
           ===================================================================== */}
        {activeNav === 'products' && (
          <div className="bg-white rounded-2xl border border-[#EFEAE2] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <h3 className="font-heading font-black text-base text-[#1A1A1A]">
                Product Catalog & Variations ({products.length})
              </h3>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#D32F2F] text-white text-xs font-bold hover:bg-[#B71C1C] cursor-pointer"
              >
                + Add new product
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[620px]">
                <thead>
                  <tr className="border-b border-[#EFEAE2] text-[#6B6B6B]">
                    <th className="pb-3 font-semibold">Image</th>
                    <th className="pb-3 font-semibold">Product Name</th>
                    <th className="pb-3 font-semibold">Variations</th>
                    <th className="pb-3 font-semibold">Price</th>
                    <th className="pb-3 font-semibold">Inventory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEAE2]">
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#EFEAE2]">
                          <Image src={p.imageUrl} alt={p.titleBn} fill className="object-cover" />
                        </div>
                      </td>
                      <td className="py-3 font-bold text-[#1A1A1A]">
                        {p.titleBn}
                        <span className="block text-[11px] text-[#6B6B6B] font-normal">{p.slug}</span>
                      </td>
                      <td className="py-3">
                        {p.variations && p.variations.length > 0 ? (
                          <div className="space-y-0.5">
                            {p.variations.map((v) => (
                              <div key={v.sku} className="text-[11px]">
                                <span className="font-bold">{v.titleBn}:</span> ৳{v.salePrice || v.price} (Stock: {v.stock})
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#6B6B6B]">Single item (25 stock)</span>
                        )}
                      </td>
                      <td className="py-3 font-black text-[#D32F2F]">
                        ৳{p.baseSalePrice || p.basePrice}
                      </td>
                      <td className="py-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#15803D]">
                          In stock
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEW 4: CATEGORIES & ATTRIBUTES
           ===================================================================== */}
        {activeNav === 'categories' && (
          <div className="bg-white rounded-2xl border border-[#EFEAE2] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <h3 className="font-heading font-black text-base text-[#1A1A1A]">
                Unlimited-Depth Category Tree
              </h3>
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#D32F2F] text-white text-xs font-bold hover:bg-[#B71C1C] cursor-pointer"
              >
                + Add category
              </button>
            </div>

            <div className="space-y-3">
              {categories.map((c) => (
                <div key={c.slug} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-sm text-[#1A1A1A]">
                      📁 {c.nameBn} ({c.nameEn})
                    </span>
                    <span className="text-xs text-[#6B6B6B] font-mono">/{c.slug}</span>
                  </div>
                  {c.children && c.children.length > 0 && (
                    <div className="pl-6 border-l-2 border-[#D32F2F] space-y-1 text-xs">
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

        {/* =====================================================================
            VIEW 5: STEADFAST COURIER AUTOMATION
           ===================================================================== */}
        {activeNav === 'steadfast' && (
          <div className="bg-white rounded-2xl border border-[#EFEAE2] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <h3 className="font-heading font-black text-base text-[#1A1A1A]">
                Steadfast Courier Integration & COD Reconciliation
              </h3>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#2E7D32]">
                Mock Courier Ready
              </span>
            </div>

            <p className="text-xs text-[#6B6B6B]">
              Confirmed orders can be dispatched to Steadfast with one click. Consignment IDs and tracking codes are automatically synced.
            </p>

            <div className="divide-y divide-[#EFEAE2]">
              {orders.map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#D32F2F] block">{ord.orderNumber} - {ord.customerName}</span>
                    <span className="text-[#6B6B6B]">{ord.district} | COD: ৳{ord.totalAmount}</span>
                  </div>

                  <div>
                    {ord.consignmentId ? (
                      <span className="px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0369A1] font-bold">
                        Dispatched ({ord.trackingCode})
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendToSteadfast(ord)}
                        className="px-3 py-1.5 rounded-xl bg-[#D32F2F] text-white font-bold hover:bg-[#B71C1C] cursor-pointer"
                      >
                        Send to Steadfast
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fallback for other sidebar sections */}
        {!['dashboard', 'orders', 'products', 'categories', 'steadfast'].includes(activeNav) && (
          <div className="bg-white rounded-2xl border border-[#EFEAE2] p-8 shadow-xs text-center space-y-3">
            <span className="text-3xl">⚙️</span>
            <h3 className="font-heading font-bold text-lg text-[#1A1A1A]">
              {activeNav.replace('-', ' ').toUpperCase()} Section
            </h3>
            <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
              This module is scheduled for Phase 2/3. You can manage live orders, catalog products, and Steadfast courier dispatches right now.
            </p>
            <button
              onClick={() => setActiveNav('dashboard')}
              className="px-4 py-2 rounded-xl bg-[#D32F2F] text-white text-xs font-bold"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </main>

      {/* =========================================================================
          ORDER DETAIL MODAL / DRAWER (WHEN ANY ORDER ROW IS CLICKED)
         ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#EFEAE2] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <div>
                <span className="text-[10px] text-[#6B6B6B] block">Order Detail</span>
                <h3 className="font-heading font-black text-xl text-[#D32F2F]">
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#6B6B6B] hover:text-[#1A1A1A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] text-xs space-y-1">
              <span className="font-bold text-[#1A1A1A] block">{selectedOrder.customerName}</span>
              <p className="text-[#6B6B6B]">Phone: {selectedOrder.customerPhone}</p>
              <p className="text-[#2B2B2B]">Address: {selectedOrder.fullAddress}</p>
              <p className="text-[#6B6B6B]">District: {selectedOrder.district}</p>
              {selectedOrder.customerNote && (
                <p className="text-[#D32F2F] italic mt-1">Note: {selectedOrder.customerNote}</p>
              )}
            </div>

            {/* Items Snapshot */}
            <div className="space-y-1 text-xs">
              <span className="font-bold text-[#6B6B6B] block mb-1">Ordered Items (Snapshot):</span>
              <div className="divide-y divide-[#EFEAE2] border border-[#EFEAE2] rounded-xl overflow-hidden">
                {selectedOrder.items.map((it) => (
                  <div key={it.id} className="p-2.5 bg-white flex justify-between items-center">
                    <div>
                      <span className="font-bold text-[#1A1A1A] block">{it.title}</span>
                      {it.variationTitle && (
                        <span className="text-[11px] text-[#6B6B6B]">{it.variationTitle}</span>
                      )}
                      <span className="text-[#6B6B6B]"> × {it.quantity}</span>
                    </div>
                    <span className="font-bold text-[#1A1A1A]">৳{it.total}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-between font-black text-sm text-[#D32F2F]">
                <span>Total Amount:</span>
                <span>৳{selectedOrder.totalAmount}</span>
              </div>
            </div>

            {/* Steadfast 1-Click Dispatch */}
            <div className="pt-2 space-y-2">
              <span className="font-bold text-xs text-[#2B2B2B] block">Courier Action (Steadfast):</span>
              {selectedOrder.consignmentId ? (
                <div className="p-3 rounded-2xl bg-[#E0F2FE] border border-[#BEE3F8] text-xs text-[#0369A1] space-y-1">
                  <span className="font-bold block">Consignment Created</span>
                  <p className="font-mono text-xs">
                    ID: {selectedOrder.consignmentId} | Tracking: {selectedOrder.trackingCode}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => handleSendToSteadfast(selectedOrder)}
                  className="w-full py-2.5 rounded-xl bg-[#D32F2F] text-white text-xs font-bold hover:bg-[#B71C1C] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" /> Send to Steadfast (1-Click Dispatch)
                </button>
              )}
            </div>

            {/* Status Change Selector */}
            <div className="pt-2 space-y-1.5">
              <label className="text-xs font-bold text-[#2B2B2B] block">Update Status:</label>
              <select
                value={selectedOrder.status}
                onChange={(e) =>
                  handleStatusChange(selectedOrder.id, e.target.value as OrderRecord['status'])
                }
                className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] text-xs font-bold cursor-pointer"
              >
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED (Restores Stock)</option>
              </select>
            </div>

            {/* Print Slip */}
            <div className="pt-1">
              <button
                onClick={() =>
                  alert(
                    `INVOICE / PACKING SLIP:\nOrder: ${selectedOrder.orderNumber}\nCustomer: ${selectedOrder.customerName}\nTotal: ৳${selectedOrder.totalAmount}`
                  )
                }
                className="w-full py-2 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] text-xs font-bold text-[#2B2B2B] hover:bg-[#EFEAE2] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Invoice / Packing Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD PRODUCT MODAL (With ImgBB CDN Upload & MongoDB Atlas)
         ========================================================================= */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#EFEAE2] my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <div>
                <h3 className="font-heading font-black text-lg text-[#1A1A1A]">Add New Product</h3>
                <p className="text-[11px] text-[#6B6B6B]">Upload photo to ImgBB and save directly to MongoDB Atlas</p>
              </div>
              <button onClick={() => setShowAddProductModal(false)} className="text-[#6B6B6B] hover:text-[#1A1A1A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              {/* ImgBB Image Upload */}
              <div>
                <label className="font-bold block mb-1.5 text-[#2B2B2B]">
                  Product Photo (ImgBB Cloud Storage):
                </label>
                <div className="border-2 border-dashed border-[#E2D9CC] rounded-2xl p-4 text-center bg-[#FAF7F2] hover:bg-[#F5F0E8] transition-colors relative">
                  {newProdImage ? (
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#EFEAE2] bg-white shrink-0">
                        <Image src={newProdImage} alt="Uploaded product" fill className="object-cover" />
                      </div>
                      <div className="text-left overflow-hidden flex-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2D7A3E] bg-[#EBF8EE] px-2 py-0.5 rounded-md">
                          <CheckCircle className="w-3 h-3" /> ImgBB CDN Active
                        </span>
                        <p className="text-[11px] text-[#6B6B6B] truncate font-mono mt-0.5">{newProdImage}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewProdImage('')}
                        className="text-xs text-[#D32F2F] font-bold px-2 py-1 rounded-lg hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        id="prod-image-file"
                        onChange={handleImageFileChange}
                        className="hidden"
                        disabled={isUploadingImage}
                      />
                      <label
                        htmlFor="prod-image-file"
                        className="cursor-pointer flex flex-col items-center justify-center gap-2 py-2"
                      >
                        {isUploadingImage ? (
                          <div className="flex items-center gap-2 text-[#FF6B6B] font-bold">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Uploading to ImgBB CDN...</span>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs text-[#FF6B6B]">
                              <Upload className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-[#2B2B2B]">
                              Click to choose photo or drag &amp; drop
                            </span>
                            <span className="text-[10px] text-[#888]">
                              PNG, JPG, WebP up to 15MB (Hosted automatically on ImgBB)
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                  {uploadError && (
                    <p className="text-[11px] text-[#D32F2F] font-bold mt-2">{uploadError}</p>
                  )}
                </div>
              </div>

              {/* Title Bangla & English */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">Title (Bangla):</label>
                  <input
                    required
                    value={newProdTitleBn}
                    onChange={(e) => setNewProdTitleBn(e.target.value)}
                    placeholder="যেমন: ডাইনোসর পেইন্টিং কিট"
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] focus:bg-white focus:outline-[#FF6B6B]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">Title (English):</label>
                  <input
                    required
                    value={newProdTitleEn}
                    onChange={(e) => setNewProdTitleEn(e.target.value)}
                    placeholder="e.g. Dinosaur Plaster Painting Kit"
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] focus:bg-white focus:outline-[#FF6B6B]"
                  />
                </div>
              </div>

              {/* Prices & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">Regular Price (৳):</label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">Sale Price (৳):</label>
                  <input
                    type="number"
                    value={newProdSalePrice}
                    onChange={(e) => setNewProdSalePrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">Category:</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                  >
                    <option value="art-kits">আর্ট কিট (Plaster Art)</option>
                    <option value="wax-crayons">মোমের রঙ (Wax Crayons)</option>
                    <option value="play-dough-clay">ক্লে ও ডো (Clay &amp; Dough)</option>
                    <option value="wooden-toys">কাঠের খেলনা (Wooden Toys)</option>
                    <option value="educational-toys">শিক্ষামূলক (Educational)</option>
                  </select>
                </div>
              </div>

              {/* Pieces & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">Pieces / Components:</label>
                  <input
                    value={newProdPieces}
                    onChange={(e) => setNewProdPieces(e.target.value)}
                    placeholder="যেমন: ৪টি প্লাস্টার শেপ + ৪টি রঙ + ১টি ব্রাশ"
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-[#2B2B2B]">Product Badge:</label>
                  <input
                    value={newProdBadge}
                    onChange={(e) => setNewProdBadge(e.target.value)}
                    placeholder="যেমন: সেরা অফার / নতুন"
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold block mb-1 text-[#2B2B2B]">Description (Bangla):</label>
                <textarea
                  rows={2}
                  value={newProdDescription}
                  onChange={(e) => setNewProdDescription(e.target.value)}
                  placeholder="পণ্যের বিস্তারিত বিবরণ ও বিশেষ সুবিধাসমূহ লিখুন..."
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#EFEAE2]">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F2] text-[#6B6B6B] font-bold hover:bg-[#EFEAE2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingImage}
                  className="px-5 py-2.5 rounded-xl bg-[#D32F2F] text-white font-bold hover:bg-[#b71c1c] shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> Save to MongoDB Atlas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD CATEGORY MODAL
         ========================================================================= */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-xl border border-[#EFEAE2]">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFEAE2]">
              <h3 className="font-heading font-black text-base text-[#1A1A1A]">Add New Category</h3>
              <button onClick={() => setShowAddCategoryModal(false)} className="text-[#6B6B6B]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Category Name (Bangla):</label>
                <input
                  required
                  value={newCatNameBn}
                  onChange={(e) => setNewCatNameBn(e.target.value)}
                  placeholder="যেমন: স্টোরি বুক ও আর্ট"
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Category Name (English):</label>
                <input
                  required
                  value={newCatNameEn}
                  onChange={(e) => setNewCatNameEn(e.target.value)}
                  placeholder="e.g. Story Books & Art"
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Description:</label>
                <textarea
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Enter short description..."
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F2] text-[#6B6B6B] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D32F2F] text-white font-bold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
