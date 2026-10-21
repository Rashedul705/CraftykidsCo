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
  Edit3,
  Trash2,
  Filter,
  Minus,
  LogOut,
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
import { HomeSectionsEditor } from '@/components/admin/HomeSectionsEditor';
import CategoriesAttributesEditor from '@/components/admin/CategoriesAttributesEditor';
import AddProductForm from '@/components/admin/AddProductForm';
import OrdersManager from '@/components/admin/OrdersManager';
import { BundlesManager } from '@/components/admin/BundlesManager';
import { DashboardView } from '@/components/admin/DashboardView';
import { SmsCampaignsManager } from '@/components/admin/SmsCampaignsManager';
import { IncompleteOrdersManager } from '@/components/admin/IncompleteOrdersManager';
import { CustomersManager } from '@/components/admin/CustomersManager';
import { CouponsManager } from '@/components/admin/CouponsManager';
import { StockManager } from '@/components/admin/StockManager';
import { DeliveryChargesManager } from '@/components/admin/DeliveryChargesManager';
import { StaffRolesManager } from '@/components/admin/StaffRolesManager';
import { SystemSettingsManager } from '@/components/admin/SystemSettingsManager';
import { AdminShell, AdminRole } from '@/components/admin/AdminShell';
import { StatusPill } from '@/components/ui/Pill';

const VALID_ADMIN_TABS = [
  'dashboard',
  'reports',
  'orders',
  'incomplete-orders',
  'customers',
  'coupons',
  'sms-campaigns',
  'products',
  'categories',
  'bundles',
  'stock',
  'steadfast',
  'delivery-charges',
  'block-list',
  'blog',
  'faq-policies',
  'home-sections',
  'staff',
  'payments-sms',
];

export default function AdminDashboardPage() {
  // Navigation State with URL & LocalStorage persistence
  const [activeNav, setActiveNav] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [productViewMode, setProductViewMode] = useState<'list' | 'add' | 'edit'>('list');

  // Unified Tab Change Handler that keeps URL & localStorage in sync
  const handleNavChange = (tabId: string, customMode?: 'list' | 'add' | 'edit') => {
    setActiveNav(tabId);
    if (customMode) {
      setProductViewMode(customMode);
    } else if (tabId === 'products') {
      setProductViewMode('list');
    }
    setIsMobileNavOpen(false);

    try {
      localStorage.setItem('craftykidsco_admin_tab', tabId);
      const newUrl = new URL(window.location.href);
      if (tabId === 'dashboard') {
        newUrl.searchParams.delete('tab');
      } else {
        newUrl.searchParams.set('tab', tabId);
      }
      window.history.pushState({ tab: tabId }, '', newUrl.toString());
    } catch {}
  };

  // Store Data States
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [products, setProducts] = useState<SampleProduct[]>([]);
  const [categories, setCategories] = useState<SampleCategory[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<{ email: string; name?: string; role?: string } | null>(null);
  const [userRole, setUserRole] = useState<AdminRole>('admin');

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

  // Edit & Delete Product States
  const [editingProduct, setEditingProduct] = useState<SampleProduct | null>(null);

  // Delete Product Confirmation State
  const [deletingProduct, setDeletingProduct] = useState<SampleProduct | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Product Catalog Search & Category Filter
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');

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
    // 1. Verify admin session
    fetch('/api/admin/me')
      .then((res) => {
        if (!res.ok) {
          window.location.href = '/admin/login';
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setAdminUser(data.user);
          if (data.user.role === 'order_handler' || data.user.role === 'product_manager') {
            setUserRole(data.user.role);
          }
        }
      })
      .catch(() => {});

    // 2. Refresh dashboard data
    refreshData();

    // 3. Restore active tab from URL query parameter or localStorage
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabFromUrl = urlParams.get('tab');
      const hashFromUrl = window.location.hash.replace('#', '');
      const savedTab = localStorage.getItem('craftykidsco_admin_tab');

      const targetTab = tabFromUrl || (hashFromUrl && VALID_ADMIN_TABS.includes(hashFromUrl) ? hashFromUrl : savedTab);

      if (targetTab && VALID_ADMIN_TABS.includes(targetTab)) {
        setActiveNav(targetTab);
        if (!tabFromUrl && targetTab !== 'dashboard') {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('tab', targetTab);
          window.history.replaceState({ tab: targetTab }, '', newUrl.toString());
        }
      }
    } catch (err) {
      console.warn('Failed to restore active tab:', err);
    }

    // 4. Handle browser back / forward navigation
    const handlePopState = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab') || 'dashboard';
        if (VALID_ADMIN_TABS.includes(tab)) {
          setActiveNav(tab);
        }
      } catch {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('craftykidsco_admin_tab');
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {}
    window.location.href = '/admin/login';
  };

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

  // Filtered products for Catalog tab
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (productCategoryFilter !== 'ALL' && p.categorySlug !== productCategoryFilter) return false;
      if (productSearchQuery.trim()) {
        const q = productSearchQuery.toLowerCase();
        const matchTitleBn = p.titleBn?.toLowerCase().includes(q);
        const matchTitleEn = p.titleEn?.toLowerCase().includes(q);
        const matchSlug = p.slug?.toLowerCase().includes(q);
        if (!matchTitleBn && !matchTitleEn && !matchSlug) return false;
      }
      return true;
    });
  }, [products, productCategoryFilter, productSearchQuery]);

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

  // Steadfast Balance & Courier States
  const [steadfastBalance, setSteadfastBalance] = useState<number | null>(null);
  const [isFetchingSteadfastBalance, setIsFetchingSteadfastBalance] = useState(false);

  const fetchSteadfastBalance = async () => {
    try {
      setIsFetchingSteadfastBalance(true);
      const resp = await fetch('/api/courier/balance');
      const data = await resp.json();
      if (data.success && data.balance !== undefined) {
        setSteadfastBalance(data.balance);
      }
    } catch {
      // ignore
    } finally {
      setIsFetchingSteadfastBalance(false);
    }
  };

  useEffect(() => {
    if (activeNav === 'steadfast') {
      fetchSteadfastBalance();
    }
  }, [activeNav]);

  // 1-Click Steadfast live dispatch via backend API
  const handleSendToSteadfast = async (order: OrderRecord) => {
    setActionFeedback(`স্টিডফাস্ট লাইভ সার্ভারে কনসাইনমেন্ট পাঠানো হচ্ছে...`);

    try {
      const resp = await fetch('/api/courier/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerAddress: order.fullAddress,
          district: order.district,
          codAmount: order.totalAmount,
          customerNote: order.customerNote,
        }),
      });

      const res = await resp.json();

      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id || o.orderNumber === order.orderNumber
              ? {
                  ...o,
                  courier: 'STEADFAST',
                  consignmentId: res.consignmentId,
                  trackingCode: res.trackingCode,
                  status: 'SHIPPED',
                }
              : o
          )
        );

        assignCourierToOrder(order.id, res.consignmentId, res.trackingCode);
        setSelectedOrder({
          ...order,
          courier: 'STEADFAST',
          consignmentId: res.consignmentId,
          trackingCode: res.trackingCode,
          status: 'SHIPPED',
        });
        await refreshData();
        setActionFeedback(
          `সাফল্য! স্টিডফাস্ট পার্সেল ট্র্যাকিং নম্বর: ${res.trackingCode} (Consignment: #${res.consignmentId})`
        );
        fetchSteadfastBalance();
      } else {
        setActionFeedback(`ব্যর্থ: ${res.message || 'স্টিডফাস্ট কনসাইনমেন্ট তৈরি করা যায়নি'}`);
      }
    } catch {
      setActionFeedback('কুরিয়ার রিকুয়েস্টে সমস্যা হয়েছে।');
    }
    setTimeout(() => setActionFeedback(null), 5000);
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

  // Open Edit Product Page
  const handleOpenEditProduct = (p: SampleProduct) => {
    setEditingProduct(p);
    setProductViewMode('edit');
  };



  // Confirm delete product permanently
  const handleConfirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    setIsDeletingProduct(true);

    try {
      const targetId = deletingProduct.id || deletingProduct.slug;
      const res = await fetch(`/api/products/${targetId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        refreshData();
        setActionFeedback(`পণ্য '${deletingProduct.titleBn}' সফলভাবে মুছে ফেলা হয়েছে!`);
        setTimeout(() => setActionFeedback(null), 3500);
      } else {
        setActionFeedback(data.message || 'ডিলিট করতে সমস্যা হয়েছে');
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch {
      setActionFeedback('পণ্য ডিলিট করতে ব্যর্থ হয়েছে');
      setTimeout(() => setActionFeedback(null), 3000);
    } finally {
      setIsDeletingProduct(false);
      setDeletingProduct(null);
    }
  };

  // Quick inline stock delta adjustment (+1 / -1)
  const handleQuickStockChange = async (p: SampleProduct, delta: number) => {
    const current = (p as any).stock ?? 25;
    const nextStock = Math.max(0, current + delta);
    const targetId = p.id || p.slug;

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((item) =>
        item.id === p.id || item.slug === p.slug ? { ...item, stock: nextStock } : item
      )
    );

    try {
      const res = await fetch(`/api/products/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: nextStock }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback(`স্টক আপডেট: ${p.titleBn} (${nextStock} টি)`);
        setTimeout(() => setActionFeedback(null), 2000);
      }
    } catch (err) {
      console.error('Quick stock update failed:', err);
      refreshData();
    }
  };

  // Render Status Badge using design tokens
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <StatusPill variant="yellow" dot>
            Confirmed
          </StatusPill>
        );
      case 'SHIPPED':
        return (
          <StatusPill variant="blue" dot>
            Shipped
          </StatusPill>
        );
      case 'DELIVERED':
        return (
          <StatusPill variant="green" dot>
            Delivered
          </StatusPill>
        );
      case 'CANCELLED':
      case 'RETURNED':
        return (
          <StatusPill variant="red" dot>
            {status === 'CANCELLED' ? 'Cancelled' : 'Returned'}
          </StatusPill>
        );
      case 'PENDING':
      default:
        return (
          <StatusPill variant="yellow" dot>
            Pending
          </StatusPill>
        );
    }
  };

  return (
    <AdminShell
      activeTab={activeNav}
      onTabChange={(tabId) => handleNavChange(tabId)}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onMainAction={(actionKey) => {
        if (actionKey === 'add_product') {
          handleNavChange('products', 'add');
        } else if (actionKey === 'create_order') {
          handleNavChange('orders');
        } else if (actionKey === 'add_category') {
          setShowAddCategoryModal(true);
        }
      }}
      onLogout={handleLogout}
      userRole={userRole}
      onRoleChange={setUserRole}
    >
      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div className="p-3.5 rounded-[12px] bg-[#DDF3E6] border border-[#BDE7CC] text-xs font-bold text-[#1F6B43] flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-[#6B6B6B] hover:text-[#2B2B2B]">
            ✕
          </button>
        </div>
      )}

        {/* =====================================================================
            VIEW 1: DASHBOARD (PART B3 SPECIFICATION)
           ===================================================================== */}
        {activeNav === 'dashboard' && (
          <DashboardView
            orders={orders}
            products={products}
            onNavigateTab={handleNavChange}
            onSelectOrder={setSelectedOrder}
            onStatusChange={handleStatusChange}
            onSendToSteadfast={handleSendToSteadfast}
            userRole={userRole}
          />
        )}

        {/* =====================================================================
            VIEW 2: ORDERS MANAGEMENT & INSPECTOR (SPLIT VIEW)
           ===================================================================== */}
        {activeNav === 'orders' && (
          <OrdersManager
            orders={orders}
            onRefresh={refreshData}
            onStatusChange={handleStatusChange}
            onSendToSteadfast={handleSendToSteadfast}
            products={products}
          />
        )}

        {/* =====================================================================
            VIEW: SMS CAMPAIGNS (PART B7 SPECIFICATION)
           ===================================================================== */}
        {activeNav === 'sms-campaigns' && (
          <SmsCampaignsManager />
        )}

        {/* =====================================================================
            VIEW 3: PRODUCTS & INVENTORY
           ===================================================================== */}
        {activeNav === 'products' && (
          productViewMode === 'add' || productViewMode === 'edit' ? (
            <AddProductForm
              key={productViewMode === 'edit' ? (editingProduct?.id || editingProduct?.slug || 'edit') : 'add'}
              initialProduct={productViewMode === 'edit' ? editingProduct : null}
              onCancel={() => {
                setProductViewMode('list');
                setEditingProduct(null);
              }}
              onSuccess={(saved) => {
                refreshData();
                setProductViewMode('list');
                setEditingProduct(null);
                setActionFeedback(
                  productViewMode === 'edit'
                    ? `Product "${saved?.titleBn || saved?.titleEn || 'Product'}" updated successfully!`
                    : `Product "${saved?.titleBn || saved?.titleEn || 'New Product'}" published successfully!`
                );
                setTimeout(() => setActionFeedback(null), 4000);
              }}
              categories={categories}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-[#EFEAE2] p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EFEAE2]">
                <div>
                  <h3 className="font-heading font-black text-base text-[#1A1A1A]">
                    Product Catalog & Variations ({filteredProducts.length})
                  </h3>
                  <p className="text-xs text-[#6B6B6B]">
                    Manage prices, inventory stocks, and catalog items in MongoDB Atlas
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setProductViewMode('add')}
                    className="px-3.5 py-2 rounded-xl bg-[#D32F2F] text-white text-xs font-bold hover:bg-[#B71C1C] flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>
              </div>

            {/* Product Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
                <input
                  type="text"
                  placeholder="Search products by title or slug..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] focus:bg-white focus:outline-[#D32F2F]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-[#8A8A8A]" />
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="p-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] font-semibold text-[#2B2B2B] cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="art-kits">Art Kits (আর্ট কিট)</option>
                  <option value="wax-crayons">Wax Crayons (মোমের রঙ)</option>
                  <option value="play-dough-clay">Clay &amp; Dough (ক্লে ও ডো)</option>
                  <option value="wooden-toys">Wooden Toys (কাঠের খেলনা)</option>
                  <option value="educational-toys">Educational (শিক্ষামূলক)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#EFEAE2] text-[#6B6B6B]">
                    <th className="pb-3 font-semibold">Image</th>
                    <th className="pb-3 font-semibold">Product Name</th>
                    <th className="pb-3 font-semibold">Price</th>
                    <th className="pb-3 font-semibold">Inventory / Stock</th>
                    <th className="pb-3 font-semibold text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEAE2]">
                  {filteredProducts.map((p) => {
                    const currentStock = (p as any).stock ?? 25;
                    const isOutOfStock = currentStock <= 0;
                    const isLowStock = currentStock > 0 && currentStock <= 5;

                    return (
                      <tr key={p.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                        <td className="py-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#EFEAE2] shrink-0">
                            <Image src={p.imageUrl} alt={p.titleBn} fill className="object-cover" />
                          </div>
                        </td>
                        <td className="py-3 font-bold text-[#1A1A1A]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{p.titleBn}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E5E0D8] text-[#666]">
                              {p.categorySlug}
                            </span>
                            {(p as any).badge && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                                {(p as any).badge}
                              </span>
                            )}
                          </div>
                          <span className="block text-[11px] text-[#6B6B6B] font-normal">{p.titleEn}</span>
                          <span className="block text-[10px] font-mono text-[#8A8A8A]">{p.slug}</span>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-col">
                            <span className="font-black text-[#D32F2F] text-sm">
                              ৳{p.baseSalePrice || p.basePrice}
                            </span>
                            {p.baseSalePrice && p.baseSalePrice < p.basePrice && (
                              <span className="text-[10px] text-[#8A8A8A] line-through">
                                ৳{p.basePrice}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isOutOfStock
                                  ? 'bg-[#FEE2E2] text-[#DC2626]'
                                  : isLowStock
                                  ? 'bg-[#FEF3C7] text-[#B45309]'
                                  : 'bg-[#DCFCE7] text-[#15803D]'
                              }`}
                            >
                              {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low (${currentStock})` : `In Stock (${currentStock})`}
                            </span>

                            {/* Quick Stock Counter +/- */}
                            <div className="inline-flex items-center border border-[#E5E0D8] rounded-lg bg-white overflow-hidden shadow-2xs">
                              <button
                                onClick={() => handleQuickStockChange(p, -1)}
                                disabled={currentStock <= 0}
                                className="px-1.5 py-0.5 hover:bg-[#FAF7F2] text-[#666] disabled:opacity-30 cursor-pointer transition-colors"
                                title="Decrease stock by 1"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-1.5 text-[11px] font-bold text-[#1A1A1A] min-w-[20px] text-center">
                                {currentStock}
                              </span>
                              <button
                                onClick={() => handleQuickStockChange(p, 1)}
                                className="px-1.5 py-0.5 hover:bg-[#FAF7F2] text-[#666] cursor-pointer transition-colors"
                                title="Increase stock by 1"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right pr-2">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 rounded-lg bg-[#F0FDF4] text-[#16A34A] hover:bg-[#DCFCE7] transition-colors cursor-pointer border border-[#BBF7D0]"
                              title="Edit Product"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => setDeletingProduct(p)}
                              className="p-1.5 rounded-lg bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer border border-[#FECACA]"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* View on storefront */}
                            <Link
                              href={`/product/${p.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-lg bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#EFEAE2] transition-colors cursor-pointer border border-[#EFEAE2]"
                              title="View on Storefront"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

        {/* =====================================================================
            VIEW 4: CATEGORIES & ATTRIBUTES
           ===================================================================== */}
        {activeNav === 'categories' && (
          <CategoriesAttributesEditor onCategoriesChanged={refreshData} />
        )}

        {/* =====================================================================
            VIEW: BUNDLES & GIFT SETS (PART B6)
           ===================================================================== */}
        {activeNav === 'bundles' && (
          <BundlesManager
            products={products}
            userRole={userRole}
            onNavigateTab={handleNavChange}
          />
        )}

        {/* =====================================================================
            VIEW 5: STEADFAST COURIER AUTOMATION
           ===================================================================== */}
        {activeNav === 'steadfast' && (
          <div className="bg-white rounded-2xl border border-[#EFEAE2] p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EFEAE2] gap-3">
              <div>
                <h3 className="font-heading font-black text-base text-[#1A1A1A]">
                  Steadfast Courier Integration &amp; COD Reconciliation
                </h3>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  অফিসিয়াল Steadfast Live Gateway (Packzy API v1) এর সাথে সংযুক্ত।
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]">
                  <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></span>
                  <span>Steadfast Live Connected</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#F3F4F6] text-[#1F2937] border border-[#E5E7EB]">
                  <span>ব্যালেন্স: ৳{steadfastBalance !== null ? steadfastBalance.toLocaleString() : '...'}</span>
                  <button
                    onClick={fetchSteadfastBalance}
                    disabled={isFetchingSteadfastBalance}
                    title="ব্যালেন্স রিফ্রেশ করুন"
                    className="hover:text-[#D32F2F] cursor-pointer text-xs"
                  >
                    🔄
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#EFEAE2]">
                <span className="text-[11px] text-[#6B6B6B] block">মোট অর্ডার</span>
                <strong className="text-lg font-heading font-black text-[#1A1A1A]">{orders.length}</strong>
              </div>
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#EFEAE2]">
                <span className="text-[11px] text-[#6B6B6B] block">Steadfast ডিসপ্যাচড</span>
                <strong className="text-lg font-heading font-black text-[#0369A1]">
                  {orders.filter((o) => o.consignmentId).length}
                </strong>
              </div>
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#EFEAE2]">
                <span className="text-[11px] text-[#6B6B6B] block">ডিসপ্যাচ পেন্ডিং</span>
                <strong className="text-lg font-heading font-black text-[#D32F2F]">
                  {orders.filter((o) => !o.consignmentId).length}
                </strong>
              </div>
            </div>

            <div className="divide-y divide-[#EFEAE2]">
              {orders.map((ord, idx) => (
                <div key={ord.id || ord.orderNumber || `stf-ord-${idx}`} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
                  <div>
                    <span className="font-bold text-[#D32F2F] block text-sm">
                      {ord.orderNumber} &bull; {ord.customerName}
                    </span>
                    <span className="text-[#6B6B6B] block mt-0.5">
                      {ord.customerPhone} &bull; {ord.district} &bull; COD: ৳{ord.totalAmount}
                    </span>
                    <span className="text-[11px] text-[#8A8A8A] block mt-0.5">
                      {ord.fullAddress}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {ord.consignmentId ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://steadfast.com.bd/t/${ord.trackingCode || ord.consignmentId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#E0F2FE] text-[#0369A1] font-bold hover:bg-[#BAE6FD] transition-colors inline-flex items-center gap-1.5"
                          title="Steadfast লাইভ ট্র্যাকিং পেজ দেখুন"
                        >
                          <span>ট্র্যাকিং: {ord.trackingCode}</span>
                          <span className="text-[10px]">↗</span>
                        </a>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSendToSteadfast(ord)}
                        className="px-4 py-2 rounded-xl bg-[#D32F2F] text-white font-bold hover:bg-[#B71C1C] cursor-pointer shadow-xs transition-colors"
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

        {/* VIEW 6: HOME SECTIONS & STOREFRONT CUSTOMIZER */}
        {activeNav === 'home-sections' && (
          <HomeSectionsEditor onSaved={refreshData} />
        )}

        {/* VIEW 7: INCOMPLETE ORDERS (PART B8) */}
        {activeNav === 'incomplete-orders' && (
          <IncompleteOrdersManager onRefreshOrders={refreshData} onNavigateTab={handleNavChange} />
        )}

        {/* VIEW 8: CUSTOMERS DIRECTORY & RISK (PART B8) */}
        {activeNav === 'customers' && (
          <CustomersManager
            orders={orders}
            onSelectOrder={setSelectedOrder}
            onNavigateTab={handleNavChange}
          />
        )}

        {/* VIEW 9: COUPONS (PART B8) */}
        {activeNav === 'coupons' && (
          <CouponsManager />
        )}

        {/* VIEW 10: STOCK ADJUSTER (PART B8) */}
        {activeNav === 'stock' && (
          <StockManager products={products} onRefresh={refreshData} />
        )}

        {/* VIEW 11: DELIVERY CHARGES (PART B8) */}
        {activeNav === 'delivery-charges' && (
          <DeliveryChargesManager />
        )}

        {/* VIEW 12: STAFF AND ROLES (PART B8) */}
        {activeNav === 'staff' && (
          <StaffRolesManager />
        )}

        {/* VIEW 13: SYSTEM SETTINGS (PAYMENTS, SMS, BLOCKLIST, BLOG, FAQ, REPORTS) */}
        {['payments-sms', 'block-list', 'blog', 'faq-policies', 'reports'].includes(activeNav) && (
          <SystemSettingsManager activeTab={activeNav as any} onNavigateTab={handleNavChange} />
        )}
      {/* View ends */}

      {/* =========================================================================
          ORDER DETAIL MODAL / DRAWER (WHEN ANY ORDER ROW IS CLICKED FROM OTHER VIEWS)
         ========================================================================= */}
      {selectedOrder && activeNav !== 'orders' && (
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
                {selectedOrder.items.map((it, idx) => (
                  <div key={it.id || `${it.productId}-${idx}`} className="p-2.5 bg-white flex justify-between items-center">
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
              {selectedOrder.consignmentId || selectedOrder.trackingCode ? (
                <div className="p-3.5 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] text-xs text-[#0369A1] space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-xs text-[#0369A1]">
                      <Truck className="w-3.5 h-3.5 text-[#0284C7]" />
                      স্টিডফাস্ট পার্সেল প্রস্তুত (Dispatched)
                    </span>
                    <a
                      href={`https://steadfast.com.bd/t/${selectedOrder.trackingCode || selectedOrder.consignmentId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[11px] text-[#0284C7] hover:underline inline-flex items-center gap-1"
                    >
                      ট্র্যাক করুন <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-[#BAE6FD]/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#64748B] block font-semibold">
                        পার্সেল / ট্র্যাকিং কোড
                      </span>
                      <span className="font-mono text-sm font-black text-[#0C4A6E]">
                        {selectedOrder.trackingCode || selectedOrder.consignmentId}
                      </span>
                    </div>
                    {selectedOrder.consignmentId && (
                      <div className="text-right">
                        <span className="text-[10px] text-[#64748B] block font-semibold">
                          কনসাইনমেন্ট
                        </span>
                        <span className="text-[10px] text-[#0284C7] font-mono font-bold block">
                          #{selectedOrder.consignmentId}
                        </span>
                      </div>
                    )}
                  </div>
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



      {/* =========================================================================
          DELETE PRODUCT CONFIRMATION MODAL
         ========================================================================= */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#FECACA]">
            <div className="flex items-center gap-3 text-[#DC2626]">
              <div className="w-10 h-10 rounded-2xl bg-[#FEF2F2] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-[#DC2626]" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-[#1A1A1A]">
                  Delete Product Confirmation
                </h3>
                <span className="text-[11px] text-[#6B6B6B]">This action cannot be undone</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] text-xs space-y-1">
              <span className="font-bold text-[#1A1A1A] block">{deletingProduct.titleBn}</span>
              <p className="text-[11px] text-[#6B6B6B]">{deletingProduct.titleEn}</p>
              <p className="text-[10px] font-mono text-[#8A8A8A]">Slug: {deletingProduct.slug}</p>
            </div>

            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Are you sure you want to permanently delete this product? It will be removed from MongoDB Atlas and will no longer appear on the storefront.
            </p>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#EFEAE2]">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={isDeletingProduct}
                className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#1A1A1A] font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                disabled={isDeletingProduct}
                className="px-5 py-2.5 rounded-xl bg-[#DC2626] text-white font-bold hover:bg-[#B91C1C] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeletingProduct && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
