'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Gift,
  Plus,
  Search,
  Edit,
  Trash2,
  Check,
  AlertCircle,
  Package,
  Layers,
  Sparkles,
  CheckCircle2,
  X,
  Loader2,
  Eye,
  Settings2,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

interface GiftItemRecord {
  _id?: string;
  id?: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  categoryId: string;
  categoryName: string;
  showInSuggestions: boolean;
  isCompulsory: boolean;
  suggestionMessage: string;
  isActive: boolean;
  sortOrder: number;
}

interface GiftCategoryRecord {
  _id?: string;
  id?: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export function GiftPackagesManager() {
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Items State
  const [items, setItems] = useState<GiftItemRecord[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Categories State
  const [categories, setCategories] = useState<GiftCategoryRecord[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Item Form Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GiftItemRecord | null>(null);
  const [deletingItem, setDeletingItem] = useState<GiftItemRecord | null>(null);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  // Item Form Fields
  const [itemName, setItemName] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [itemPrice, setItemPrice] = useState<number>(100);
  const [itemStock, setItemStock] = useState<number>(20);
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemShowInSuggestions, setItemShowInSuggestions] = useState(false);
  const [itemIsCompulsory, setItemIsCompulsory] = useState(false);
  const [itemSuggestionMessage, setItemSuggestionMessage] = useState('');
  const [itemIsActive, setItemIsActive] = useState(true);
  const [itemSortOrder, setItemSortOrder] = useState(0);

  // Upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      if (itemName) {
        formData.append('name', `gift_${itemName.replace(/[^a-zA-Z0-9_-]/g, '_')}`);
      }

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setItemImage(data.url);
        setFeedback({ message: 'ছবি সফলভাবে আপলোড হয়েছে!', type: 'success' });
      } else {
        setUploadError(data.message || 'ছবি আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      }
    } catch (err: any) {
      setUploadError(err.message || 'ছবি আপলোডে ত্রুটি হয়েছে।');
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  // Inline stock editing map { itemId: stockValue }
  const [inlineStock, setInlineStock] = useState<Record<string, number>>({});
  const [savingStockId, setSavingStockId] = useState<string | null>(null);

  // Category Form Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<GiftCategoryRecord | null>(null);
  const [deletingCat, setDeletingCat] = useState<GiftCategoryRecord | null>(null);
  const [catName, setCatName] = useState('');
  const [catSortOrder, setCatSortOrder] = useState(0);
  const [catIsActive, setCatIsActive] = useState(true);
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // 1. Fetch Items
  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const res = await fetch('/api/gift-items', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.items) {
        setItems(data.items);
        const stockMap: Record<string, number> = {};
        data.items.forEach((it: any) => {
          stockMap[it._id || it.id] = it.stock;
        });
        setInlineStock(stockMap);
      }
    } catch (err: any) {
      console.error('Failed to load gift items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  // 2. Fetch Categories
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch('/api/gift-categories', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.categories) {
        setCategories(data.categories);
        if (!itemCategoryId && data.categories.length > 0) {
          setItemCategoryId(data.categories[0]._id || data.categories[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load gift categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  // Quick Inline Stock Update
  const handleQuickStockUpdate = async (itemId: string) => {
    const newStock = inlineStock[itemId];
    if (newStock === undefined || newStock < 0) return;

    setSavingStockId(itemId);
    try {
      const res = await fetch('/api/gift-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, stock: newStock }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('Stock updated successfully!');
        setItems((prev) =>
          prev.map((it) => ((it._id || it.id) === itemId ? { ...it, stock: newStock } : it))
        );
      } else {
        showFeedback(data.message || 'Failed to update stock', 'error');
      }
    } catch (err: any) {
      showFeedback(err.message || 'Error updating stock', 'error');
    } finally {
      setSavingStockId(null);
    }
  };

  // Open Create Item
  const handleOpenCreateItem = () => {
    setEditingItem(null);
    setItemName('');
    setItemImage('');
    setUploadError(null);
    setItemPrice(100);
    setItemStock(20);
    setItemCategoryId(categories[0]?._id || categories[0]?.id || 'general');
    setItemShowInSuggestions(false);
    setItemIsCompulsory(false);
    setItemSuggestionMessage('');
    setItemIsActive(true);
    setItemSortOrder(items.length + 1);
    setIsItemModalOpen(true);
  };

  // Open Edit Item
  const handleOpenEditItem = (item: GiftItemRecord) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemImage(item.image || '');
    setUploadError(null);
    setItemPrice(item.price);
    setItemStock(item.stock);
    setItemCategoryId(item.categoryId);
    setItemShowInSuggestions(!!item.showInSuggestions);
    setItemIsCompulsory(!!item.isCompulsory);
    setItemSuggestionMessage(item.suggestionMessage || '');
    setItemIsActive(item.isActive !== false);
    setItemSortOrder(item.sortOrder || 0);
    setIsItemModalOpen(true);
  };

  // Submit Item Form
  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      showFeedback('Item name is required', 'error');
      return;
    }

    setIsSubmittingItem(true);
    try {
      const selectedCat = categories.find((c) => (c._id || c.id) === itemCategoryId);
      const payload: any = {
        name: itemName.trim(),
        image: itemImage,
        price: Number(itemPrice) || 0,
        stock: Number(itemStock) || 0,
        categoryId: itemCategoryId,
        categoryName: selectedCat ? selectedCat.name : 'General',
        showInSuggestions: itemShowInSuggestions,
        isCompulsory: itemIsCompulsory,
        suggestionMessage: itemSuggestionMessage.trim(),
        isActive: itemIsActive,
        sortOrder: Number(itemSortOrder) || 0,
      };

      if (editingItem) {
        payload.id = editingItem._id || editingItem.id;
      }

      const res = await fetch('/api/gift-items', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(editingItem ? 'Gift item updated!' : 'Gift item created!');
        setIsItemModalOpen(false);
        fetchItems();
      } else {
        showFeedback(data.message || 'Failed to save gift item', 'error');
      }
    } catch (err: any) {
      showFeedback(err.message || 'Error saving item', 'error');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    try {
      const id = deletingItem._id || deletingItem.id;
      const res = await fetch(`/api/gift-items?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showFeedback('Gift item deleted');
        setDeletingItem(null);
        fetchItems();
      } else {
        showFeedback(data.message || 'Failed to delete gift item', 'error');
      }
    } catch (err: any) {
      showFeedback(err.message || 'Error deleting item', 'error');
    }
  };

  // Toggle Item Active
  const handleToggleItemActive = async (item: GiftItemRecord) => {
    try {
      const id = item._id || item.id;
      const res = await fetch('/api/gift-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !item.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Item ${!item.isActive ? 'activated' : 'deactivated'}`);
        fetchItems();
      }
    } catch (err: any) {
      showFeedback(err.message || 'Error toggling item', 'error');
    }
  };

  // Category Actions
  const handleOpenCreateCat = () => {
    setEditingCat(null);
    setCatName('');
    setCatSortOrder(categories.length + 1);
    setCatIsActive(true);
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (cat: GiftCategoryRecord) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatSortOrder(cat.sortOrder || 0);
    setCatIsActive(cat.isActive !== false);
    setIsCatModalOpen(true);
  };

  const handleSubmitCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showFeedback('Category name is required', 'error');
      return;
    }
    setIsSubmittingCat(true);
    try {
      const payload: any = {
        name: catName.trim(),
        sortOrder: Number(catSortOrder) || 0,
        isActive: catIsActive,
      };
      if (editingCat) {
        payload.id = editingCat._id || editingCat.id;
      }
      const res = await fetch('/api/gift-categories', {
        method: editingCat ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(editingCat ? 'Category updated!' : 'Category created!');
        setIsCatModalOpen(false);
        fetchCategories();
      } else {
        showFeedback(data.message || 'Failed to save category', 'error');
      }
    } catch (err: any) {
      showFeedback(err.message || 'Error saving category', 'error');
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleDeleteCat = async () => {
    if (!deletingCat) return;
    try {
      const id = deletingCat._id || deletingCat.id;
      const res = await fetch(`/api/gift-categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showFeedback('Category deleted');
        setDeletingCat(null);
        fetchCategories();
      } else {
        showFeedback(data.message || 'Failed to delete category', 'error');
      }
    } catch (err: any) {
      showFeedback(err.message || 'Error deleting category', 'error');
    }
  };

  const filteredItems = items.filter((it) => {
    if (selectedCategoryFilter !== 'all' && it.categoryId !== selectedCategoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return it.name.toLowerCase().includes(q) || it.categoryName.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-fredoka text-[#2B2B2B] flex items-center gap-2">
            <Gift className="w-6 h-6 text-[#D6403B]" />
            Custom Gift Packages & Inventory
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
            Manage broken-down gift items with independent stock, categories, suggestions, and compulsory items.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'items' ? (
            <button
              type="button"
              onClick={handleOpenCreateItem}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D6403B] hover:bg-[#C23631] text-white text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Gift Item</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenCreateCat}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D6403B] hover:bg-[#C23631] text-white text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-[#EFE9E0] gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'items'
              ? 'border-[#D6403B] text-[#D6403B]'
              : 'border-transparent text-[#6B6B6B] hover:text-[#2B2B2B]'
          }`}
        >
          Gift Items Inventory ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'border-[#D6403B] text-[#D6403B]'
              : 'border-transparent text-[#6B6B6B] hover:text-[#2B2B2B]'
          }`}
        >
          Gift Categories ({categories.length})
        </button>
      </div>

      {/* VIEW 1: GIFT ITEMS */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#A8A8A8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search gift items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] text-[#2B2B2B] focus:outline-none focus:border-[#D6403B]"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id || cat.id} value={cat._id || cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[#EFE9E0] overflow-hidden shadow-xs">
            {loadingItems ? (
              <div className="p-12 text-center text-[#6B6B6B] flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#D6403B]" />
                <span>Loading gift items...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-12 text-center text-[#6B6B6B]">
                <Package className="w-10 h-10 text-[#C4BFB7] mx-auto mb-2" />
                <p className="font-semibold text-sm">No gift items found</p>
                <p className="text-xs text-[#8C8C8C] mt-1">
                  Add items to your custom gift builder inventory.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#EFE9E0] bg-[#FAF7F2] text-[#6B6B6B] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Stock (Quick Edit)</th>
                      <th className="py-3 px-4">Rules & Badges</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE9E0]">
                    {filteredItems.map((item) => {
                      const id = item._id || item.id || '';
                      return (
                        <tr key={id} className="hover:bg-[#FAF7F2]/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#EFE9E0] overflow-hidden relative shrink-0">
                                {item.image ? (
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <Gift className="w-5 h-5 text-[#C4BFB7] m-auto mt-2.5" />
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-[#2B2B2B] text-sm block">
                                  {item.name}
                                </span>
                                {item.suggestionMessage && (
                                  <p className="text-[11px] text-[#8C8C8C] italic line-clamp-1">
                                    "{item.suggestionMessage}"
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-[#6B6B6B] font-medium">
                            {item.categoryName || 'General'}
                          </td>

                          <td className="py-3 px-4 font-bold text-[#2B2B2B]">
                            ৳{item.price}
                          </td>

                          {/* Quick inline stock update */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={inlineStock[id] ?? item.stock}
                                onChange={(e) =>
                                  setInlineStock({
                                    ...inlineStock,
                                    [id]: parseInt(e.target.value, 10) || 0,
                                  })
                                }
                                className={`w-16 px-2 py-1 text-xs rounded border text-center font-bold ${
                                  (inlineStock[id] ?? item.stock) <= 0
                                    ? 'bg-[#FFF0F0] border-[#FFD5D5] text-[#D6403B]'
                                    : 'bg-[#FAF7F2] border-[#EFE9E0] text-[#2B2B2B]'
                                }`}
                              />
                              {(inlineStock[id] !== undefined && inlineStock[id] !== item.stock) && (
                                <button
                                  type="button"
                                  disabled={savingStockId === id}
                                  onClick={() => handleQuickStockUpdate(id)}
                                  className="p-1 rounded bg-[#1F6B43] text-white hover:bg-[#185535] text-[10px] font-bold transition-all cursor-pointer"
                                  title="Save Stock"
                                >
                                  {savingStockId === id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                              {(inlineStock[id] ?? item.stock) <= 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FDE3E1] text-[#9B2420]">
                                  OOS
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1.5">
                              {item.isCompulsory && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF4E5] text-[#B76E00] border border-[#FFE2B3]">
                                  Compulsory
                                </span>
                              )}
                              {item.showInSuggestions && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F4FD] text-[#0A66C2] border border-[#C5E2FB]">
                                  Suggested
                                </span>
                              )}
                              {!item.isCompulsory && !item.showInSuggestions && (
                                <span className="text-[#A8A8A8] text-[11px]">Regular</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleItemActive(item)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                                item.isActive
                                  ? 'bg-[#DDF3E6] text-[#1F6B43] border-[#1F6B43]/20'
                                  : 'bg-[#F2F2F2] text-[#6B6B6B] border-[#D9D9D9]'
                              }`}
                            >
                              {item.isActive ? 'Active' : 'Disabled'}
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditItem(item)}
                                className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingItem(item)}
                                className="p-1.5 rounded-lg text-[#D6403B] hover:text-[#9B2420] hover:bg-[#FFF0F0] transition-colors cursor-pointer"
                                title="Delete"
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: GIFT CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#EFE9E0] overflow-hidden shadow-xs">
            {loadingCategories ? (
              <div className="p-12 text-center text-[#6B6B6B] flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#D6403B]" />
                <span>Loading categories...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="p-12 text-center text-[#6B6B6B]">
                <Layers className="w-10 h-10 text-[#C4BFB7] mx-auto mb-2" />
                <p className="font-semibold text-sm">No categories yet</p>
                <p className="text-xs text-[#8C8C8C] mt-1">
                  Create categories (e.g. Gift Boxes, Ribbons, Toys) to organize items.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EFE9E0] bg-[#FAF7F2] text-[#6B6B6B] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Category Name</th>
                    <th className="py-3 px-4">Sort Order</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE9E0]">
                  {categories.map((cat) => {
                    const id = cat._id || cat.id || '';
                    return (
                      <tr key={id} className="hover:bg-[#FAF7F2]/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#2B2B2B] text-sm">
                          {cat.name}
                        </td>
                        <td className="py-3 px-4 text-[#6B6B6B]">
                          {cat.sortOrder ?? 0}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              cat.isActive
                                ? 'bg-[#DDF3E6] text-[#1F6B43] border-[#1F6B43]/20'
                                : 'bg-[#F2F2F2] text-[#6B6B6B] border-[#D9D9D9]'
                            }`}
                          >
                            {cat.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditCat(cat)}
                              className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingCat(cat)}
                              className="p-1.5 rounded-lg text-[#D6403B] hover:text-[#9B2420] hover:bg-[#FFF0F0] transition-colors cursor-pointer"
                              title="Delete"
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
      )}

      {/* CREATE / EDIT ITEM MODAL */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#EFE9E0] max-w-lg w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsItemModalOpen(false)}
              className="absolute top-4 right-4 text-[#8C8C8C] hover:text-[#2B2B2B] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-fredoka text-[#2B2B2B] mb-4">
              {editingItem ? 'Edit Gift Item' : 'Add New Gift Item'}
            </h3>

            <form onSubmit={handleSubmitItem} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Premium Pine Wood Gift Box"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                />
              </div>

              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">
                  Item Image (ছবি আপলোড বা URL)
                </label>

                {/* Hidden file input for uploading from computer */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {itemImage ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#EFE9E0] shrink-0 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={itemImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setItemImage('')}
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="ছবি মুছুন"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-[#FAF7F2] border-2 border-dashed border-[#EFE9E0] flex items-center justify-center text-[#A0A0A0] shrink-0">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 space-y-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="px-3.5 py-2 rounded-xl bg-white border border-[#D6403B] text-[#D6403B] hover:bg-[#D6403B] hover:text-white font-bold text-xs flex items-center gap-2 shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>আপলোড হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>কম্পিউটার থেকে ছবি আপলোড করুন</span>
                          </>
                        )}
                      </button>
                      <p className="text-[11px] text-[#7A7A7A]">
                        JPG, PNG, WebP সমর্থিত
                      </p>
                    </div>
                  </div>

                  {uploadError && (
                    <p className="text-xs text-[#D6403B] flex items-center gap-1 font-medium bg-[#FDE8E7] px-2.5 py-1.5 rounded-lg border border-[#F5C2C0]">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {uploadError}
                    </p>
                  )}

                  {/* Fallback direct URL input */}
                  <div>
                    <input
                      type="url"
                      value={itemImage}
                      onChange={(e) => setItemImage(e.target.value)}
                      placeholder="অথবা সরাসরি ইমেজ লিংক (URL) লিখুন: https://..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#2B2B2B] block mb-1">
                    Price (৳) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2B2B2B] block mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={itemStock}
                    onChange={(e) => setItemStock(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#2B2B2B] block mb-1">
                    Category *
                  </label>
                  <select
                    value={itemCategoryId}
                    onChange={(e) => setItemCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                  >
                    {categories.length === 0 && (
                      <option value="general">সাধারণ উপহার (General)</option>
                    )}
                    {categories.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#2B2B2B] block mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={itemSortOrder}
                    onChange={(e) => setItemSortOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                  />
                </div>
              </div>

              {/* Checkboxes: Compulsory & Suggestions */}
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EFE9E0] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemIsCompulsory}
                    onChange={(e) => setItemIsCompulsory(e.target.checked)}
                    className="rounded text-[#D6403B] focus:ring-[#D6403B]"
                  />
                  <div>
                    <span className="font-bold text-[#2B2B2B]">Compulsory (Strongly Recommended)</span>
                    <p className="text-[11px] text-[#6B6B6B]">
                      Shows a popup if missing when customer adds package to cart
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={itemShowInSuggestions}
                    onChange={(e) => setItemShowInSuggestions(e.target.checked)}
                    className="rounded text-[#D6403B] focus:ring-[#D6403B]"
                  />
                  <div>
                    <span className="font-bold text-[#2B2B2B]">Show in suggestions ("You may also need")</span>
                    <p className="text-[11px] text-[#6B6B6B]">
                      Displays prominently in the package builder suggestions area
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">
                  Suggestion / Warning Message
                </label>
                <textarea
                  rows={2}
                  value={itemSuggestionMessage}
                  onChange={(e) => setItemSuggestionMessage(e.target.value)}
                  placeholder="e.g. Without this gift box the package cannot be arranged nicely"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="itemIsActive"
                  checked={itemIsActive}
                  onChange={(e) => setItemIsActive(e.target.checked)}
                  className="rounded text-[#D6403B] focus:ring-[#D6403B]"
                />
                <label htmlFor="itemIsActive" className="font-bold text-[#2B2B2B] cursor-pointer">
                  Active (visible on builder)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#EFE9E0]">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[#2B2B2B] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingItem}
                  className="px-5 py-2 rounded-xl bg-[#D6403B] hover:bg-[#C23631] text-white font-bold cursor-pointer flex items-center gap-2"
                >
                  {isSubmittingItem && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Save Changes' : 'Create Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#EFE9E0] max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCatModalOpen(false)}
              className="absolute top-4 right-4 text-[#8C8C8C] hover:text-[#2B2B2B] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-fredoka text-[#2B2B2B] mb-4">
              {editingCat ? 'Edit Gift Category' : 'Add Gift Category'}
            </h3>

            <form onSubmit={handleSubmitCat} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Gift Boxes & Packaging"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                />
              </div>

              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={catSortOrder}
                  onChange={(e) => setCatSortOrder(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="catIsActive"
                  checked={catIsActive}
                  onChange={(e) => setCatIsActive(e.target.checked)}
                  className="rounded text-[#D6403B] focus:ring-[#D6403B]"
                />
                <label htmlFor="catIsActive" className="font-bold text-[#2B2B2B] cursor-pointer">
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#EFE9E0]">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[#2B2B2B] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCat}
                  className="px-5 py-2 rounded-xl bg-[#D6403B] hover:bg-[#C23631] text-white font-bold cursor-pointer flex items-center gap-2"
                >
                  {isSubmittingCat && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCat ? 'Save' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ITEM CONFIRMATION */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#EFE9E0] max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-[#FFF0F0] text-[#D6403B] flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-[#2B2B2B]">Delete Gift Item?</h4>
            <p className="text-xs text-[#6B6B6B] mt-1 mb-5">
              Are you sure you want to delete "<strong>{deletingItem.name}</strong>"? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 rounded-xl bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[#2B2B2B] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                className="px-4 py-2 rounded-xl bg-[#D6403B] hover:bg-[#C23631] text-white text-xs font-bold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CATEGORY CONFIRMATION */}
      {deletingCat && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#EFE9E0] max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-[#FFF0F0] text-[#D6403B] flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-[#2B2B2B]">Delete Gift Category?</h4>
            <p className="text-xs text-[#6B6B6B] mt-1 mb-5">
              Are you sure you want to delete "<strong>{deletingCat.name}</strong>"?
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingCat(null)}
                className="px-4 py-2 rounded-xl bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[#2B2B2B] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCat}
                className="px-4 py-2 rounded-xl bg-[#D6403B] hover:bg-[#C23631] text-white text-xs font-bold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

