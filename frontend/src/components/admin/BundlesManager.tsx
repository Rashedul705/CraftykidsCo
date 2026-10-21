'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Package,
  Layers,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Check,
  AlertCircle,
  Calendar,
  DollarSign,
  Percent,
  Sparkles,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  X,
  Upload,
  Loader2,
  RefreshCw,
  Gift,
} from 'lucide-react';
import { BundleRecord, BundleItem, computeBundleFinancials, calculateBundleStock } from '@/lib/bundles-store';
import { SampleProduct } from '@/lib/sample-data';

interface BundlesManagerProps {
  products: SampleProduct[];
  userRole?: string;
  onNavigateTab?: (tab: string) => void;
}

export function BundlesManager({ products, userRole = 'admin', onNavigateTab }: BundlesManagerProps) {
  const [bundles, setBundles] = useState<BundleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<string>('all');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Edit / Create Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<BundleRecord | null>(null);
  const [deletingBundle, setDeletingBundle] = useState<BundleRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [titleBn, setTitleBn] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [slug, setSlug] = useState('');
  const [descriptionBn, setDescriptionBn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [pricingMode, setPricingMode] = useState<'fixed' | 'percent' | 'amount'>('fixed');
  const [pricingValue, setPricingValue] = useState<number>(699);
  const [status, setStatus] = useState<'active' | 'draft' | 'scheduled'>('active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [suitableAge, setSuitableAge] = useState('২-৬ বছর');
  const [occasion, setOccasion] = useState('birthday');
  const [badge, setBadge] = useState('২০% সাশ্রয়');
  const [displayLocations, setDisplayLocations] = useState<string[]>(['bundles', 'home', 'product-pages']);
  const [hideWhenOutOfStock, setHideWhenOutOfStock] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Bundle Items Form Rows
  const [formItems, setFormItems] = useState<BundleItem[]>([]);

  // Feedback helper
  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Fetch bundles
  const fetchBundles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bundles');
      const data = await res.json();
      if (data.success && data.bundles) {
        setBundles(data.bundles);
      }
    } catch (err) {
      console.error('Failed to load bundles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBundles();
  }, []);

  // Compute live financials for form
  const formFinancials = useMemo(() => {
    return computeBundleFinancials(formItems, pricingMode, pricingValue);
  }, [formItems, pricingMode, pricingValue]);

  // Compute live stock limit for form
  const formStock = useMemo(() => {
    return calculateBundleStock(formItems);
  }, [formItems]);

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingBundle(null);
    setTitleBn('');
    setTitleEn('');
    setSlug('');
    setDescriptionBn('');
    setDescriptionEn('');
    setImageUrl('');
    setPricingMode('fixed');
    setPricingValue(699);
    setStatus('active');
    setStartDate('');
    setEndDate('');
    setSuitableAge('২-৬ বছর');
    setOccasion('birthday');
    setBadge('২৫% সাশ্রয়');
    setDisplayLocations(['bundles', 'home', 'product-pages']);
    setHideWhenOutOfStock(true);
    setIsFeatured(false);

    // Initial 2 items if products available
    if (products.length >= 2) {
      const p1 = products[0];
      const p2 = products[1];
      setFormItems([
        {
          productId: p1.id,
          productTitleBn: p1.titleBn,
          productTitleEn: p1.titleEn,
          variationSku: p1.variations?.[0]?.sku,
          variationTitle: p1.variations?.[0]?.titleEn,
          quantity: 1,
          unitPrice: p1.baseSalePrice || p1.basePrice,
          costPrice: Math.round((p1.baseSalePrice || p1.basePrice) * 0.45),
          stock: p1.variations?.[0]?.stock || 25,
          imageUrl: p1.imageUrl,
        },
        {
          productId: p2.id,
          productTitleBn: p2.titleBn,
          productTitleEn: p2.titleEn,
          quantity: 1,
          unitPrice: p2.baseSalePrice || p2.basePrice,
          costPrice: Math.round((p2.baseSalePrice || p2.basePrice) * 0.45),
          stock: 20,
          imageUrl: p2.imageUrl,
        },
      ]);
    } else {
      setFormItems([]);
    }

    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (bundle: BundleRecord) => {
    setEditingBundle(bundle);
    setTitleBn(bundle.titleBn);
    setTitleEn(bundle.titleEn);
    setSlug(bundle.slug);
    setDescriptionBn(bundle.descriptionBn || '');
    setDescriptionEn(bundle.descriptionEn || '');
    setImageUrl(bundle.imageUrl);
    setPricingMode(bundle.pricingMode || 'fixed');
    setPricingValue(bundle.pricingValue || bundle.bundlePrice);
    setStatus(bundle.status);
    setStartDate(bundle.startDate || '');
    setEndDate(bundle.endDate || '');
    setSuitableAge(bundle.suitableAge || '২-৬ বছর');
    setOccasion(bundle.occasion || 'birthday');
    setBadge(bundle.badge || '');
    setDisplayLocations(bundle.displayLocations || ['bundles', 'home']);
    setHideWhenOutOfStock(bundle.hideWhenOutOfStock ?? true);
    setIsFeatured(!!bundle.isFeatured);
    setFormItems(bundle.items || []);
    setIsFormOpen(true);
  };

  // Auto-slug generator
  const handleTitleEnChange = (val: string) => {
    setTitleEn(val);
    if (!editingBundle) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      );
    }
  };

  // Form item manipulation
  const handleAddItemRow = () => {
    const firstProd = products[0];
    if (!firstProd) return;
    const newItem: BundleItem = {
      productId: firstProd.id,
      productTitleBn: firstProd.titleBn,
      productTitleEn: firstProd.titleEn,
      quantity: 1,
      unitPrice: firstProd.baseSalePrice || firstProd.basePrice,
      costPrice: Math.round((firstProd.baseSalePrice || firstProd.basePrice) * 0.45),
      stock: 25,
      imageUrl: firstProd.imageUrl,
    };
    setFormItems([...formItems, newItem]);
  };

  const handleUpdateItemRow = (index: number, updates: Partial<BundleItem>) => {
    setFormItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    handleUpdateItemRow(index, {
      productId: prod.id,
      productTitleBn: prod.titleBn,
      productTitleEn: prod.titleEn,
      variationSku: prod.variations?.[0]?.sku || undefined,
      variationTitle: prod.variations?.[0]?.titleEn || undefined,
      unitPrice: prod.baseSalePrice || prod.basePrice,
      costPrice: Math.round((prod.baseSalePrice || prod.basePrice) * 0.45),
      stock: prod.variations?.[0]?.stock || 25,
      imageUrl: prod.imageUrl,
    });
  };

  const handleRemoveItemRow = (index: number) => {
    setFormItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Bundle Form (Create or Edit)
  const handleSubmitBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleBn.trim() || !titleEn.trim()) {
      showFeedback('Please provide both Bangla and English bundle titles.', 'error');
      return;
    }
    if (formItems.length === 0) {
      showFeedback('Please add at least one product item to the bundle.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        titleBn,
        titleEn,
        slug: slug.trim() || titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        descriptionBn,
        descriptionEn,
        imageUrl: imageUrl || formItems[0]?.imageUrl || '',
        items: formItems,
        pricingMode,
        pricingValue,
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        suitableAge,
        occasion,
        badge,
        displayLocations,
        hideWhenOutOfStock,
        isFeatured,
      };

      if (editingBundle) {
        const res = await fetch('/api/bundles', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingBundle.id, ...payload }),
        });
        const data = await res.json();
        if (data.success) {
          showFeedback('Bundle updated successfully!');
          setIsFormOpen(false);
          fetchBundles();
        } else {
          showFeedback(data.error || 'Failed to update bundle', 'error');
        }
      } else {
        const res = await fetch('/api/bundles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          showFeedback('New bundle created successfully!');
          setIsFormOpen(false);
          fetchBundles();
        } else {
          showFeedback(data.error || 'Failed to create bundle', 'error');
        }
      }
    } catch (err: any) {
      showFeedback(err.message || 'Error saving bundle', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Instant Toggle Active / Draft
  const handleToggleActive = async (bundle: BundleRecord) => {
    try {
      const res = await fetch('/api/bundles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bundle.id, action: 'toggle-active' }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message);
        setBundles((prev) =>
          prev.map((b) => (b.id === bundle.id ? { ...b, status: b.status === 'active' ? 'draft' : 'active' } : b))
        );
      }
    } catch (err) {
      showFeedback('Failed to toggle status', 'error');
    }
  };

  // Delete Bundle
  const handleDeleteBundle = async () => {
    if (!deletingBundle) return;
    try {
      const res = await fetch(`/api/bundles?id=${deletingBundle.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('Bundle deleted successfully.');
        setBundles((prev) => prev.filter((b) => b.id !== deletingBundle.id));
        setDeletingBundle(null);
      }
    } catch (err) {
      showFeedback('Failed to delete bundle', 'error');
    }
  };

  // Filter & Search
  const filteredBundles = useMemo(() => {
    return bundles.filter((b) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle =
          b.titleBn.toLowerCase().includes(q) ||
          b.titleEn.toLowerCase().includes(q) ||
          b.slug.toLowerCase().includes(q);
        const matchesItem = b.items?.some(
          (item) =>
            item.productTitleBn.toLowerCase().includes(q) ||
            item.productTitleEn.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesItem) return false;
      }

      // Tab filter
      const { setsAvailable } = calculateBundleStock(b.items);
      if (activeFilterTab === 'active') return b.status === 'active';
      if (activeFilterTab === 'draft') return b.status === 'draft';
      if (activeFilterTab === 'scheduled') return b.status === 'scheduled';
      if (activeFilterTab === 'low-stock') return setsAvailable > 0 && setsAvailable <= 10;
      if (activeFilterTab === 'out-of-stock') return setsAvailable === 0;
      return true;
    });
  }, [bundles, searchQuery, activeFilterTab]);

  // Aggregate stats
  const totalBundlesCount = bundles.length;
  const activeCount = bundles.filter((b) => b.status === 'active').length;
  const lowOrOutStockCount = bundles.filter((b) => {
    const { setsAvailable } = calculateBundleStock(b.items);
    return setsAvailable <= 10;
  }).length;
  const avgDiscount =
    totalBundlesCount > 0
      ? Math.round(bundles.reduce((s, b) => s + (b.discountPercent || 0), 0) / totalBundlesCount)
      : 0;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border text-sm font-semibold transition-all ${
            feedback.type === 'success'
              ? 'bg-[#DDF3E6] text-[#1F6B43] border-[#1F6B43]/20'
              : 'bg-[#FDE3E1] text-[#9B2420] border-[#9B2420]/20'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Top Bar with Title & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-fredoka text-[#2B2B2B] flex items-center gap-2">
            <Gift className="w-6 h-6 text-[#D6403B]" />
            Bundles & Gift Sets
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
            Manage multi-item gift sets, savings rates, and automated component stock limits.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#D6403B] hover:bg-[#C23631] text-white text-sm font-bold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create bundle</span>
        </button>
      </div>

      {/* Four Small Number Cards on Top */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B6B] text-xs font-semibold">
            <span>Total Bundles</span>
            <Layers className="w-4 h-4 text-[#D6403B]" />
          </div>
          <div className="mt-2 text-2xl font-black font-fredoka text-[#2B2B2B]">
            {totalBundlesCount}
          </div>
          <div className="mt-1 text-[11px] text-[#6B6B6B]">
            Across all categories
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B6B] text-xs font-semibold">
            <span>Active on Store</span>
            <span className="w-2 h-2 rounded-full bg-[#1F6B43]" />
          </div>
          <div className="mt-2 text-2xl font-black font-fredoka text-[#1F6B43]">
            {activeCount}
          </div>
          <div className="mt-1 text-[11px] text-[#6B6B6B]">
            Live for customers to buy
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B6B] text-xs font-semibold">
            <span>Low / Out of Stock</span>
            <AlertCircle className="w-4 h-4 text-[#C23631]" />
          </div>
          <div className="mt-2 text-2xl font-black font-fredoka text-[#C23631]">
            {lowOrOutStockCount}
          </div>
          <div className="mt-1 text-[11px] text-[#6B6B6B]">
            Constituent item stock low
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B6B] text-xs font-semibold">
            <span>Avg. Customer Savings</span>
            <Percent className="w-4 h-4 text-[#0B5F85]" />
          </div>
          <div className="mt-2 text-2xl font-black font-fredoka text-[#0B5F85]">
            {avgDiscount}%
          </div>
          <div className="mt-1 text-[11px] text-[#6B6B6B]">
            Savings incentive vs separate
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-[#EFE9E0] shadow-xs overflow-hidden">
        {/* Filter Tabs and Search Bar */}
        <div className="p-4 border-b border-[#EFE9E0] flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs font-semibold">
            {[
              { id: 'all', label: 'All', count: bundles.length },
              { id: 'active', label: 'Active', count: activeCount },
              { id: 'draft', label: 'Draft', count: bundles.filter((b) => b.status === 'draft').length },
              { id: 'low-stock', label: 'Low stock', count: bundles.filter((b) => {
                const s = calculateBundleStock(b.items).setsAvailable;
                return s > 0 && s <= 10;
              }).length },
              { id: 'out-of-stock', label: 'Out of stock', count: bundles.filter((b) => calculateBundleStock(b.items).setsAvailable === 0).length },
              { id: 'scheduled', label: 'Scheduled', count: bundles.filter((b) => b.status === 'scheduled').length },
            ].map((tab) => {
              const active = activeFilterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilterTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#2B2B2B] text-white shadow-xs'
                      : 'text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-[#FAF7F2]'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    active ? 'bg-white/20 text-white' : 'bg-[#FAF7F2] text-[#6B6B6B]'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bundles or items..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] text-[#2B2B2B] placeholder-[#6B6B6B] focus:outline-none focus:border-[#D6403B]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#2B2B2B]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bundles Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-[#6B6B6B]">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#D6403B]" />
              <p className="text-xs">Loading bundles and calculating component stock...</p>
            </div>
          ) : filteredBundles.length === 0 ? (
            <div className="p-12 text-center text-[#6B6B6B] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] flex items-center justify-center mx-auto text-[#6B6B6B]">
                <Gift className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#2B2B2B]">No bundles found</p>
              <p className="text-xs max-w-sm mx-auto">
                {searchQuery
                  ? 'No bundles matched your search. Try a different keyword.'
                  : 'Get started by creating your first promotional gift bundle.'}
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D6403B] text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create bundle</span>
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EFE9E0] bg-[#FAF7F2]/60 text-[#6B6B6B] uppercase font-semibold text-[11px] tracking-wider">
                  <th className="py-3 px-4">Bundle</th>
                  <th className="py-3 px-3">Included Items</th>
                  <th className="py-3 px-3">Price & Savings</th>
                  <th className="py-3 px-3">Sets Available</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Store Toggle</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE9E0]">
                {filteredBundles.map((b) => {
                  const stockInfo = calculateBundleStock(b.items);
                  const isOutOfStock = stockInfo.setsAvailable === 0;
                  const isLowStock = stockInfo.setsAvailable > 0 && stockInfo.setsAvailable <= 10;

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-[#FAF7F2]/40 transition-colors group"
                    >
                      {/* Bundle Name & Photo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#EFE9E0] shrink-0">
                            {b.imageUrl ? (
                              <Image
                                src={b.imageUrl}
                                alt={b.titleBn}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#6B6B6B]">
                                <Gift className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#2B2B2B] text-sm group-hover:text-[#D6403B] transition-colors">
                                {b.titleBn}
                              </span>
                              {b.isFeatured && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF3CC] text-[#7A4E00]">
                                  Featured
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#6B6B6B] block">
                              {b.titleEn}
                            </span>
                            <span className="text-[10px] text-[#6B6B6B] font-mono">
                              {b.items.length} items • Slug: /{b.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Included Items preview */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          {b.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 text-[11px] text-[#2B2B2B]"
                            >
                              <span className="w-4 h-4 rounded-md bg-[#FAF7F2] border border-[#EFE9E0] text-[10px] font-mono flex items-center justify-center text-[#6B6B6B] shrink-0">
                                {item.quantity}x
                              </span>
                              <span className="truncate max-w-[180px]">
                                {item.productTitleBn}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Price & Savings */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-black text-sm text-[#C23631]">
                              ৳{b.bundlePrice}
                            </span>
                            <span className="text-[11px] text-[#6B6B6B] line-through">
                              ৳{b.originalPrice}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded-md bg-[#DDF3E6] text-[#1F6B43] font-bold">
                              {b.discountPercent}% OFF
                            </span>
                            <span className="text-[#6B6B6B]">
                              Save ৳{b.savingsAmount}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Sets Available Now (Calculated from items) */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono font-bold text-sm ${
                                isOutOfStock
                                  ? 'text-[#C23631]'
                                  : isLowStock
                                  ? 'text-[#B45309]'
                                  : 'text-[#1F6B43]'
                              }`}
                            >
                              {stockInfo.setsAvailable} sets
                            </span>
                          </div>
                          {stockInfo.limitingItem && (
                            <p className="text-[10px] text-[#6B6B6B] leading-tight">
                              Limited by:{' '}
                              <span className="font-semibold text-[#2B2B2B]">
                                {stockInfo.limitingItem.productTitleBn}
                              </span>{' '}
                              ({stockInfo.limitingItem.stock} left)
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status Pill */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {b.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#DDF3E6] text-[#1F6B43]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1F6B43]" />
                            Active
                          </span>
                        ) : b.status === 'scheduled' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#DDF1FB] text-[#0B5F85]">
                            <Clock className="w-3 h-3" />
                            Scheduled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFF3CC] text-[#7A4E00]">
                            Draft
                          </span>
                        )}
                      </td>

                      {/* Store Toggle */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(b)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            b.status === 'active' ? 'bg-[#1F6B43]' : 'bg-[#E5E7EB]'
                          }`}
                          title={b.status === 'active' ? 'Click to make Draft' : 'Click to make Active'}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              b.status === 'active' ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(b)}
                            className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-[#FAF7F2] transition-colors"
                            title="Edit Bundle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingBundle(b)}
                            className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#DC2626] hover:bg-[#FDE3E1]/40 transition-colors"
                            title="Delete Bundle"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* =========================================================================
          CREATE / EDIT BUNDLE MODAL (TWO COLUMNS AS PER B6 SPEC)
         ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#EFE9E0] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#EFE9E0] flex items-center justify-between bg-[#FAF7F2]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D6403B]/10 flex items-center justify-center text-[#D6403B]">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-lg text-[#2B2B2B]">
                    {editingBundle ? 'Edit Gift Bundle' : 'Create New Gift Bundle'}
                  </h3>
                  <p className="text-xs text-[#6B6B6B]">
                    Multi-item combo with automatic inventory limit calculation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-xl bg-white border border-[#EFE9E0] flex items-center justify-center text-[#6B6B6B] hover:text-[#2B2B2B] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Two-Column Form Body */}
            <form onSubmit={handleSubmitBundle} className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column (8 Columns): Details, Items Table, Pricing, Stock */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Basic Details */}
                  <div className="bg-[#FAF7F2]/60 rounded-2xl p-4 border border-[#EFE9E0] space-y-3.5">
                    <h4 className="font-bold text-sm text-[#2B2B2B] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#D6403B]" />
                      Bundle Details
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                          Bangla Title <span className="text-[#C23631]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={titleBn}
                          onChange={(e) => setTitleBn(e.target.value)}
                          placeholder="যেমন: ছোট আর্টিস্ট মেগা গিফট কম্বো"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                          English Title <span className="text-[#C23631]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={titleEn}
                          onChange={(e) => handleTitleEnChange(e.target.value)}
                          placeholder="e.g. Little Artist Mega Gift Bundle"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                          URL Slug
                        </label>
                        <input
                          type="text"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          placeholder="little-artist-mega-gift-bundle"
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                          Photo Image URL
                        </label>
                        <input
                          type="text"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://... or leave empty to use first item image"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                        Bangla Description
                      </label>
                      <textarea
                        rows={2}
                        value={descriptionBn}
                        onChange={(e) => setDescriptionBn(e.target.value)}
                        placeholder="একটি গিফট বক্সে পাচ্ছেন: ২৪ কালার ন্যাচারাল মোমের রঙ + ৫ রঙের নন-টক্সিক প্লে-ডো..."
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                      />
                    </div>
                  </div>

                  {/* Included Items Table */}
                  <div className="bg-[#FAF7F2]/60 rounded-2xl p-4 border border-[#EFE9E0] space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-[#2B2B2B] flex items-center gap-2">
                          <Package className="w-4 h-4 text-[#D6403B]" />
                          Constituent Products & Quantities
                        </h4>
                        <p className="text-[11px] text-[#6B6B6B]">
                          Select the individual products that make up this bundle.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddItemRow}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#EFE9E0] text-xs font-bold text-[#2B2B2B] hover:border-[#D6403B] hover:text-[#D6403B] transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add product</span>
                      </button>
                    </div>

                    {formItems.length === 0 ? (
                      <div className="p-6 text-center text-[#6B6B6B] border border-dashed border-[#EFE9E0] rounded-xl">
                        No products added yet. Click &quot;Add product&quot; above.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-[#EFE9E0] text-[#6B6B6B] font-semibold text-[11px]">
                              <th className="pb-2">Product</th>
                              <th className="pb-2 w-20">Quantity</th>
                              <th className="pb-2 w-24">Unit Price</th>
                              <th className="pb-2 w-24">Line Total</th>
                              <th className="pb-2 w-24">Live Stock</th>
                              <th className="pb-2 w-10 text-right"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EFE9E0]">
                            {formItems.map((item, idx) => {
                              const lineTotal = (item.unitPrice || 0) * (item.quantity || 1);
                              return (
                                <tr key={idx} className="group">
                                  <td className="py-2.5 pr-2">
                                    <select
                                      value={item.productId}
                                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                                    >
                                      {products.map((p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.titleBn} (৳{p.baseSalePrice || p.basePrice})
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-2.5 pr-2">
                                    <input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) =>
                                        handleUpdateItemRow(idx, {
                                          quantity: Math.max(1, parseInt(e.target.value) || 1),
                                        })
                                      }
                                      className="w-full px-2 py-1.5 text-xs font-mono rounded-xl bg-white border border-[#EFE9E0] text-center"
                                    />
                                  </td>
                                  <td className="py-2.5 pr-2">
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#6B6B6B]">৳</span>
                                      <input
                                        type="number"
                                        min="0"
                                        value={item.unitPrice}
                                        onChange={(e) =>
                                          handleUpdateItemRow(idx, {
                                            unitPrice: Math.max(0, parseInt(e.target.value) || 0),
                                          })
                                        }
                                        className="w-full pl-5 pr-2 py-1.5 text-xs font-mono rounded-xl bg-white border border-[#EFE9E0]"
                                      />
                                    </div>
                                  </td>
                                  <td className="py-2.5 pr-2 font-mono font-bold text-[#2B2B2B]">
                                    ৳{lineTotal}
                                  </td>
                                  <td className="py-2.5 pr-2">
                                    <span className="font-mono text-[11px] text-[#6B6B6B]">
                                      {item.stock} in stock
                                    </span>
                                  </td>
                                  <td className="py-2.5 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItemRow(idx)}
                                      className="p-1 rounded-md text-[#6B6B6B] hover:text-[#DC2626]"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Bundle Pricing Calculation */}
                  <div className="bg-[#FAF7F2]/60 rounded-2xl p-4 border border-[#EFE9E0] space-y-4">
                    <h4 className="font-bold text-sm text-[#2B2B2B] flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-[#D6403B]" />
                      Bundle Pricing & Live Margins
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Pricing Mode */}
                      <div>
                        <label className="block text-xs font-semibold text-[#2B2B2B] mb-1.5">
                          Pricing Mode
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'fixed', label: 'Fixed Price' },
                            { id: 'percent', label: 'Percent Off' },
                            { id: 'amount', label: 'Amount Off' },
                          ].map((mode) => (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() => setPricingMode(mode.id as any)}
                              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                                pricingMode === mode.id
                                  ? 'bg-[#2B2B2B] text-white border-[#2B2B2B]'
                                  : 'bg-white text-[#6B6B6B] border-[#EFE9E0] hover:border-[#2B2B2B]'
                              }`}
                            >
                              {mode.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Pricing Value Input */}
                      <div>
                        <label className="block text-xs font-semibold text-[#2B2B2B] mb-1.5">
                          {pricingMode === 'fixed'
                            ? 'Bundle Sale Price (৳ BDT)'
                            : pricingMode === 'percent'
                            ? 'Discount Percentage (%)'
                            : 'Discount Amount (৳ BDT)'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={pricingValue}
                            onChange={(e) => setPricingValue(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl bg-white border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Live Financial Metrics Banner */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white rounded-xl p-3.5 border border-[#EFE9E0]">
                      <div>
                        <span className="text-[10px] text-[#6B6B6B] block">Price if Separate</span>
                        <span className="font-mono font-black text-sm text-[#2B2B2B]">
                          ৳{formFinancials.originalPrice}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6B6B6B] block">Bundle Price</span>
                        <span className="font-mono font-black text-sm text-[#C23631]">
                          ৳{formFinancials.bundlePrice}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6B6B6B] block">Customer Saves</span>
                        <span className="font-mono font-black text-sm text-[#1F6B43]">
                          ৳{formFinancials.savingsAmount} ({formFinancials.discountPercent}%)
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6B6B6B] block">Shop Margin</span>
                        <span className="font-mono font-black text-sm text-[#0B5F85]">
                          ৳{formFinancials.profitMargin} ({formFinancials.profitMarginPercent}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Automated Stock Limit */}
                  <div className="bg-[#FAF7F2]/60 rounded-2xl p-4 border border-[#EFE9E0] space-y-3">
                    <h4 className="font-bold text-sm text-[#2B2B2B] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#D6403B]" />
                      Automated Inventory Limits
                    </h4>

                    <div className="bg-white p-3.5 rounded-xl border border-[#EFE9E0] flex items-center justify-between">
                      <div>
                        <span className="text-xs text-[#6B6B6B] block">Sets Available Right Now</span>
                        <span className="text-xl font-black font-mono text-[#1F6B43]">
                          {formStock.setsAvailable} sets
                        </span>
                        {formStock.limitingItem && (
                          <span className="text-[11px] text-[#6B6B6B] block mt-0.5">
                            Stock limited by: <strong className="text-[#2B2B2B]">{formStock.limitingItem.productTitleBn}</strong> ({formStock.limitingItem.stock} items left in stock)
                          </span>
                        )}
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#DDF1FB] text-[#0B5F85]">
                        Auto-computed
                      </span>
                    </div>

                    <label className="flex items-center gap-2.5 text-xs text-[#2B2B2B] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hideWhenOutOfStock}
                        onChange={(e) => setHideWhenOutOfStock(e.target.checked)}
                        className="rounded border-[#EFE9E0] text-[#D6403B] focus:ring-[#D6403B]"
                      />
                      <span>Hide the bundle automatically when any constituent product goes out of stock</span>
                    </label>
                  </div>
                </div>

                {/* Right Column (4 Columns): Sidebar controls */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Status & Timing */}
                  <div className="bg-[#FAF7F2]/60 rounded-2xl p-4 border border-[#EFE9E0] space-y-3.5">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#6B6B6B]">
                      Publish Status
                    </h4>

                    <div>
                      <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                      >
                        <option value="active">Active (Live on store)</option>
                        <option value="draft">Draft (Hidden)</option>
                        <option value="scheduled">Scheduled (Limited offer)</option>
                      </select>
                    </div>

                    {status === 'scheduled' && (
                      <div className="space-y-2 pt-2 border-t border-[#EFE9E0]">
                        <div>
                          <label className="block text-[11px] text-[#6B6B6B] mb-0.5">Start Date</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-[#EFE9E0]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#6B6B6B] mb-0.5">End Date</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-[#EFE9E0]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Target Audience & Badges */}
                  <div className="bg-[#FAF7F2]/60 rounded-2xl p-4 border border-[#EFE9E0] space-y-3.5">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#6B6B6B]">
                      Tags & Display
                    </h4>

                    <div>
                      <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                        Suitable Age Group
                      </label>
                      <input
                        type="text"
                        value={suitableAge}
                        onChange={(e) => setSuitableAge(e.target.value)}
                        placeholder="যেমন: ২-৬ বছর"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#EFE9E0]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                        Gift Occasion
                      </label>
                      <select
                        value={occasion}
                        onChange={(e) => setOccasion(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#EFE9E0]"
                      >
                        <option value="birthday">Birthday Gift (জন্মদিন)</option>
                        <option value="eid">Eid Special (ঈদ স্পেশাল)</option>
                        <option value="school">School Start (স্কুল প্রস্তুতি)</option>
                        <option value="everyday">Everyday Creativity (দৈনন্দিন উপহার)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                        Badge Text
                      </label>
                      <input
                        type="text"
                        value={badge}
                        onChange={(e) => setBadge(e.target.value)}
                        placeholder="যেমন: ২৫% সাশ্রয়, বেস্ট ভ্যালু"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#EFE9E0]"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-xs text-[#2B2B2B] pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="rounded border-[#EFE9E0] text-[#D6403B] focus:ring-[#D6403B]"
                      />
                      <span className="font-semibold">Show as Featured Hero Bundle</span>
                    </label>
                  </div>

                  {/* Visibility Locations */}
                  <div className="bg-[#FAF7F2]/60 rounded-2xl p-4 border border-[#EFE9E0] space-y-2.5">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#6B6B6B]">
                      Where it shows
                    </h4>

                    {[
                      { id: 'bundles', label: 'Bundles & Gift sets page' },
                      { id: 'home', label: 'Homepage special offers' },
                      { id: 'product-pages', label: 'Buy together & save strip' },
                    ].map((loc) => {
                      const checked = displayLocations.includes(loc.id);
                      return (
                        <label key={loc.id} className="flex items-center gap-2 text-xs text-[#2B2B2B] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDisplayLocations([...displayLocations, loc.id]);
                              } else {
                                setDisplayLocations(displayLocations.filter((l) => l !== loc.id));
                              }
                            }}
                            className="rounded border-[#EFE9E0] text-[#D6403B] focus:ring-[#D6403B]"
                          />
                          <span>{loc.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="mt-6 pt-4 border-t border-[#EFE9E0] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B6B6B] hover:text-[#2B2B2B]"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      setStatus('draft');
                      handleSubmitBundle(e as any);
                    }}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl border border-[#EFE9E0] bg-white text-xs font-bold text-[#2B2B2B] hover:bg-[#FAF7F2]"
                  >
                    Save as draft
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#D6403B] hover:bg-[#C23631] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{editingBundle ? 'Update Bundle' : 'Publish Bundle'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBundle && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#FDE3E1]">
            <div className="flex items-center gap-3 text-[#DC2626]">
              <div className="w-10 h-10 rounded-2xl bg-[#FDE3E1] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-[#9B2420]" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-[#2B2B2B]">
                  Delete Bundle Confirmation
                </h3>
                <span className="text-[11px] text-[#6B6B6B]">This bundle will be permanently removed.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] text-xs space-y-1">
              <span className="font-bold text-[#2B2B2B] block">{deletingBundle.titleBn}</span>
              <p className="text-[11px] text-[#6B6B6B]">{deletingBundle.titleEn}</p>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#EFE9E0]">
              <button
                type="button"
                onClick={() => setDeletingBundle(null)}
                className="px-4 py-2 rounded-xl bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#2B2B2B] text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBundle}
                className="px-5 py-2 rounded-xl bg-[#DC2626] text-white text-xs font-bold hover:bg-[#B91C1C]"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
