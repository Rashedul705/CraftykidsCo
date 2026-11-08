'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Gift,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Package,
  ArrowRight,
  Loader2,
  Trash2,
  Sparkles,
  Info,
  X,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useCart } from '@/context/CartContext';

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

export default function GiftBuilderPage() {
  const { addItem } = useCart();
  const router = useRouter();
  const [locale, setLocale] = useState<'bn' | 'en'>('bn');

  // Gift Inventory Data
  const [items, setItems] = useState<GiftItemRecord[]>([]);
  const [categories, setCategories] = useState<GiftCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Items in builder: { itemId: quantity }
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

  // Compulsory Missing Items Modal State
  const [isCompulsoryModalOpen, setIsCompulsoryModalOpen] = useState(false);
  const [missingCompulsoryItems, setMissingCompulsoryItems] = useState<GiftItemRecord[]>([]);
  const [addedToast, setAddedToast] = useState(false);

  // Fetch Categories & Active Gift Items
  useEffect(() => {
    Promise.all([
      fetch('/api/gift-categories', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/gift-items?active=true', { cache: 'no-store' }).then((r) => r.json()),
    ])
      .then(([catRes, itemsRes]) => {
        if (catRes.success && catRes.categories) {
          setCategories(catRes.categories.filter((c: any) => c.isActive !== false));
        }
        if (itemsRes.success && itemsRes.items) {
          setItems(itemsRes.items);
        }
      })
      .catch((err) => console.error('Error fetching gift builder data:', err))
      .finally(() => setLoading(false));
  }, []);

  // Update item quantity
  const handleSetQuantity = (itemId: string, newQty: number, maxStock: number) => {
    const bounded = Math.max(0, Math.min(newQty, maxStock));
    setSelectedQuantities((prev) => {
      const next = { ...prev };
      if (bounded === 0) {
        delete next[itemId];
      } else {
        next[itemId] = bounded;
      }
      return next;
    });
  };

  // Selected Items with details
  const selectedItemsList = useMemo(() => {
    return Object.entries(selectedQuantities)
      .map(([id, qty]) => {
        const item = items.find((it) => (it._id || it.id) === id);
        if (!item || qty <= 0) return null;
        return {
          ...item,
          quantity: qty,
          lineTotal: item.price * qty,
        };
      })
      .filter(Boolean) as (GiftItemRecord & { quantity: number; lineTotal: number })[];
  }, [selectedQuantities, items]);

  const packageTotal = useMemo(() => {
    return selectedItemsList.reduce((sum, it) => sum + it.lineTotal, 0);
  }, [selectedItemsList]);

  const totalPackageUnits = useMemo(() => {
    return selectedItemsList.reduce((sum, it) => sum + it.quantity, 0);
  }, [selectedItemsList]);

  // Suggestions: items with showInSuggestions: true, in stock (> 0), and NOT yet selected
  const suggestionItems = useMemo(() => {
    return items.filter(
      (it) =>
        it.showInSuggestions &&
        it.stock > 0 &&
        !selectedQuantities[it._id || it.id || '']
    );
  }, [items, selectedQuantities]);

  // Group all items by category, plus any items in "General" or whose category was deleted/missing
  const categorizedSections = useMemo(() => {
    const sections: { id: string; name: string; items: GiftItemRecord[] }[] = [];
    const usedItemIds = new Set<string>();

    // 1. Group by existing active categories
    categories.forEach((cat) => {
      const catId = cat._id || cat.id || '';
      const catItems = items.filter(
        (it) =>
          it.categoryId === catId ||
          (it.categoryName && it.categoryName.toLowerCase() === cat.name.toLowerCase())
      );
      if (catItems.length > 0) {
        sections.push({
          id: catId,
          name: cat.name,
          items: catItems,
        });
        catItems.forEach((it) => usedItemIds.add(it._id || it.id || ''));
      }
    });

    // 2. Any items that did not match a known category (e.g. general, orphaned, or when categories is empty)
    const remainingItems = items.filter((it) => !usedItemIds.has(it._id || it.id || ''));
    if (remainingItems.length > 0) {
      const remainingByCatName: Record<string, GiftItemRecord[]> = {};
      remainingItems.forEach((it) => {
        const groupName =
          it.categoryName && it.categoryName !== 'General' && it.categoryName !== 'general'
            ? it.categoryName
            : 'উপহার সামগ্রী (Gift Items)';
        if (!remainingByCatName[groupName]) {
          remainingByCatName[groupName] = [];
        }
        remainingByCatName[groupName].push(it);
      });

      Object.entries(remainingByCatName).forEach(([groupName, groupItems], idx) => {
        sections.push({
          id: `extra-cat-${idx}`,
          name: groupName,
          items: groupItems,
        });
      });
    }

    return sections;
  }, [categories, items]);

  // Click "Add package to cart"
  const handleProceedAddToCart = () => {
    if (selectedItemsList.length === 0) return;

    // Check for missing compulsory items that are in-stock
    // Note: Out of stock compulsory items must not appear in the popup!
    const missing = items.filter(
      (it) =>
        it.isCompulsory &&
        it.stock > 0 &&
        !selectedQuantities[it._id || it.id || '']
    );

    if (missing.length > 0) {
      setMissingCompulsoryItems(missing);
      setIsCompulsoryModalOpen(true);
      return;
    }

    // No compulsory items missing -> Add directly to cart
    commitPackageToCart();
  };

  // Final commit to cart
  const commitPackageToCart = () => {
    const packageGroupId = `giftpkg-${Date.now()}`;

    selectedItemsList.forEach((it) => {
      const itId = it._id || it.id || '';
      addItem({
        id: `${itId}-${packageGroupId}`,
        productId: itId,
        productSlug: itId,
        title: it.name,
        titleBn: it.name,
        imageUrl: it.image,
        price: it.price,
        quantity: it.quantity,
        isBundle: false, // Gift packages do NOT have bundle discounts
        isGiftPackage: true,
        packageGroupId,
        giftItemId: itId,
        giftItemName: it.name,
        originalUnitPrice: it.price,
        finalPrice: it.price,
        bundleType: 'none',
        bundleItemsSummary: `Custom Gift Package`,
      });
    });

    setIsCompulsoryModalOpen(false);
    setAddedToast(true);
    setTimeout(() => {
      setAddedToast(false);
      router.push('/cart');
    }, 1200);
  };

  // Add a missing compulsory item from modal
  const handleAddMissingItem = (item: GiftItemRecord) => {
    const id = item._id || item.id || '';
    handleSetQuantity(id, 1, item.stock);
    setMissingCompulsoryItems((prev) => prev.filter((it) => (it._id || it.id) !== id));
  };

  // Add all missing compulsory items from modal
  const handleAddAllMissing = () => {
    const next = { ...selectedQuantities };
    missingCompulsoryItems.forEach((it) => {
      const id = it._id || it.id || '';
      if (!next[id]) {
        next[id] = 1;
      }
    });
    setSelectedQuantities(next);
    setMissingCompulsoryItems([]);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-32 md:pb-16 text-[#2B2B2B]">
      <Header locale={locale} onToggleLocale={() => setLocale(locale === 'bn' ? 'en' : 'bn')} />

      {/* Added toast */}
      {addedToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#1F6B43] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-sm animate-in fade-in slide-in-from-top-4">
          <Check className="w-5 h-5" />
          <span>গিফট প্যাকেজ কার্টে যোগ করা হয়েছে! কার্টে নেওয়া হচ্ছে...</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE9E0] mb-8 shadow-xs relative overflow-hidden">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF0E6] text-[#A04000] border border-[#F0D5BE] mb-3">
              <Gift className="w-3.5 h-3.5 text-[#D6403B]" />
              Custom Gift Package Builder
            </span>
            <h1 className="text-2xl sm:text-4xl font-bold font-fredoka text-[#2B2B2B]">
              নিজের মতো করে সাজিয়ে নিন পারফেক্ট উপহার
            </h1>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mt-2">
              পছন্দসই গিফট বক্স, রিবন ও উপহারের আইটেম বেছে নিয়ে তৈরি করুন ইউনিক গিফট প্যাকেজ। কোনো বাধ্যবাধকতা নেই, নিজের ইচ্ছেমতো আইটেম যোগ করুন।
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ITEMS SELECTION AREA (8 COLS) */}
          <div className="lg:col-span-8 space-y-8">
            {/* "You May Also Need" Suggestions Area */}
            {suggestionItems.length > 0 && (
              <div className="bg-[#FFFDF9] rounded-3xl p-5 border border-[#FFE8A3] shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D6403B]" />
                  <h3 className="font-bold text-sm text-[#2B2B2B]">
                    আপনার প্যাকেজের সাথে আরও প্রয়োজন হতে পারে (You May Also Need)
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {suggestionItems.map((sug) => {
                    const sugId = sug._id || sug.id || '';
                    return (
                      <div
                        key={sugId}
                        className="bg-white rounded-2xl p-3 border border-[#EFE9E0] flex flex-col justify-between shadow-2xs hover:border-[#D6403B] transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] overflow-hidden relative shrink-0">
                            {sug.image && (
                              <Image src={sug.image} alt={sug.name} fill className="object-cover" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-[#2B2B2B] block truncate">
                              {sug.name}
                            </span>
                            <span className="font-bold text-xs text-[#D6403B]">
                              ৳{sug.price}
                            </span>
                          </div>
                        </div>

                        {sug.suggestionMessage && (
                          <p className="text-[10px] text-[#8C8C8C] italic mt-1.5 line-clamp-1">
                            "{sug.suggestionMessage}"
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSetQuantity(sugId, 1, sug.stock)}
                          className="mt-2.5 w-full py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#D6403B] text-[#2B2B2B] hover:text-white border border-[#EFE9E0] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>প্যাকেজে যোগ করুন</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Items by Category */}
            {loading ? (
              <div className="p-16 text-center text-[#6B6B6B] flex items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#D6403B]" />
                <span>উপহার আইটেম লোড হচ্ছে...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#EFE9E0] p-12 text-center text-[#6B6B6B]">
                <Package className="w-10 h-10 text-[#C4BFB7] mx-auto mb-2" />
                <p className="font-semibold text-sm">কোনো গিফট আইটেম পাওয়া যায়নি</p>
              </div>
            ) : (
              categorizedSections.map((section) => {
                return (
                  <div key={section.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D6403B]" />
                      <h3 className="font-bold text-base text-[#2B2B2B] font-fredoka">
                        {section.name}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {section.items.map((item) => {
                        const itId = item._id || item.id || '';
                        const isOutOfStock = item.stock <= 0;
                        const qty = selectedQuantities[itId] || 0;

                        return (
                          <div
                            key={itId}
                            className={`bg-white rounded-2xl border transition-all flex flex-col overflow-hidden ${
                              isOutOfStock
                                ? 'border-[#E5E5E5] opacity-60 bg-[#F9F9F9]'
                                : qty > 0
                                ? 'border-[#D6403B] shadow-sm'
                                : 'border-[#EFE9E0] hover:border-[#D6403B]/40 shadow-xs'
                            }`}
                          >
                            {/* Image */}
                            <div className="aspect-square relative overflow-hidden bg-[#FAF7F2]">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              ) : (
                                <Gift className="w-8 h-8 text-[#C4BFB7] m-auto mt-12" />
                              )}
                              {isOutOfStock && (
                                <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center">
                                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-[#FDE3E1] text-[#9B2420] border border-[#9B2420]/20">
                                    স্টক আউট (Out of stock)
                                  </span>
                                </div>
                              )}
                              {item.isCompulsory && !isOutOfStock && (
                                <div className="absolute top-2 left-2">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF4E5] text-[#B76E00] border border-[#FFE2B3]">
                                    প্রস্তাবিত
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="p-3.5 flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="font-bold text-xs sm:text-sm text-[#2B2B2B] line-clamp-2 leading-tight">
                                  {item.name}
                                </h4>

                                <div className="mt-1 font-bold text-sm text-[#D6403B]">
                                  ৳{item.price}
                                </div>

                                {item.suggestionMessage && (
                                  <p className="text-[10px] text-[#8C8C8C] italic mt-1 line-clamp-1">
                                    "{item.suggestionMessage}"
                                  </p>
                                )}
                              </div>

                              {/* Quantity Controls */}
                              <div className="mt-3 pt-2.5 border-t border-[#EFE9E0]">
                                {isOutOfStock ? (
                                  <button
                                    type="button"
                                    disabled
                                    className="w-full py-1.5 rounded-xl bg-[#E5E5E5] text-[#8C8C8C] text-xs font-bold cursor-not-allowed"
                                  >
                                    স্টক নেই
                                  </button>
                                ) : qty === 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSetQuantity(itId, 1, item.stock)}
                                    className="w-full py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#D6403B] text-[#2B2B2B] hover:text-white border border-[#EFE9E0] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>যোগ করুন</span>
                                  </button>
                                ) : (
                                  <div className="flex items-center justify-between bg-[#FAF7F2] rounded-xl p-1 border border-[#D6403B]/30">
                                    <button
                                      type="button"
                                      onClick={() => handleSetQuantity(itId, qty - 1, item.stock)}
                                      className="w-7 h-7 rounded-lg bg-white text-[#2B2B2B] hover:bg-[#FFF0F0] hover:text-[#D6403B] flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="font-bold text-xs text-[#2B2B2B] px-2">
                                      {qty}
                                    </span>
                                    <button
                                      type="button"
                                      disabled={qty >= item.stock}
                                      onClick={() => handleSetQuantity(itId, qty + 1, item.stock)}
                                      className="w-7 h-7 rounded-lg bg-white text-[#2B2B2B] hover:bg-[#FFF0F0] hover:text-[#D6403B] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* LIVE "YOUR PACKAGE" SUMMARY (4 COLS DESKTOP, STICKY BOTTOM MOBILE) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl border border-[#EFE9E0] p-5 shadow-xs lg:sticky lg:top-24 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
                <h3 className="font-bold text-base text-[#2B2B2B] flex items-center gap-2">
                  <Gift className="w-5 h-5 text-[#D6403B]" />
                  <span>আপনার প্যাকেজ (Your Package)</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF0E6] text-[#A04000]">
                  {totalPackageUnits} আইটেম
                </span>
              </div>

              {/* Items List */}
              {selectedItemsList.length === 0 ? (
                <div className="py-8 text-center text-[#8C8C8C] text-xs">
                  <Package className="w-8 h-8 text-[#C4BFB7] mx-auto mb-2" />
                  <span>প্যাকেজ শুরু করতে পছন্দমতো আইটেম বেছে নিন</span>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto divide-y divide-[#EFE9E0] text-xs pr-1">
                  {selectedItemsList.map((it) => {
                    const itId = it._id || it.id || '';
                    return (
                      <div key={itId} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-[#FAF7F2] border border-[#EFE9E0] overflow-hidden relative shrink-0">
                            {it.image && (
                              <Image src={it.image} alt={it.name} fill className="object-cover" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-[#2B2B2B] block truncate">
                              {it.name}
                            </span>
                            <span className="text-[11px] text-[#6B6B6B]">
                              {it.quantity} &times; ৳{it.price}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-[#2B2B2B]">
                            ৳{it.lineTotal}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSetQuantity(itId, 0, 9999)}
                            className="text-[#8C8C8C] hover:text-[#D6403B] p-1 cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total */}
              {selectedItemsList.length > 0 && (
                <div className="pt-3 border-t border-[#EFE9E0] space-y-2 text-xs">
                  <div className="flex justify-between text-base font-bold text-[#2B2B2B]">
                    <span>প্যাকেজ মোট মূল্য:</span>
                    <span className="text-lg text-[#D6403B]">৳{packageTotal}</span>
                  </div>
                </div>
              )}

              {/* Add Package to Cart Button */}
              <button
                type="button"
                disabled={selectedItemsList.length === 0}
                onClick={handleProceedAddToCart}
                className="w-full py-3.5 rounded-2xl bg-[#D6403B] hover:bg-[#C23631] disabled:opacity-50 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>প্যাকেজ কার্টে যোগ করুন • ৳{packageTotal}</span>
              </button>

              <div className="text-[11px] text-[#8C8C8C] text-center flex items-center justify-center gap-1">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>গিফট প্যাকেজে কুপন কোড ব্যবহার করা যাবে</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* COMPULSORY MISSING ITEMS POPUP (Strongly Recommended) */}
      {isCompulsoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EFE9E0] max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsCompulsoryModalOpen(false)}
              className="absolute top-4 right-4 text-[#8C8C8C] hover:text-[#2B2B2B] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3 text-[#B76E00]">
              <Sparkles className="w-6 h-6" />
              <h3 className="text-lg font-bold font-fredoka text-[#2B2B2B]">
                প্যাকেজে কিছু গুরুত্বপূর্ণ আইটেম বাকি রয়েছে!
              </h3>
            </div>

            <p className="text-xs text-[#6B6B6B] mb-4">
              একটি সুন্দর উপহার সেট সম্পূর্ণ করতে নিচের আইটেমগুলো যুক্ত করার জন্য সুপারিশ করা হচ্ছে:
            </p>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {missingCompulsoryItems.map((item) => {
                const itId = item._id || item.id || '';
                return (
                  <div
                    key={itId}
                    className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#FFE8A3] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#EFE9E0] overflow-hidden relative shrink-0">
                        {item.image && (
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-[#2B2B2B] block truncate">
                          {item.name}
                        </span>
                        <span className="font-bold text-[#D6403B]">
                          ৳{item.price}
                        </span>
                        {item.suggestionMessage && (
                          <p className="text-[10px] text-[#8F5B00] italic mt-0.5">
                            "{item.suggestionMessage}"
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddMissingItem(item)}
                      className="px-3 py-1.5 rounded-xl bg-[#D6403B] hover:bg-[#C23631] text-white text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="mt-5 pt-4 border-t border-[#EFE9E0] flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => commitPackageToCart()}
                className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE9E0] text-[#6B6B6B] hover:text-[#2B2B2B] text-xs font-bold cursor-pointer order-2 sm:order-1"
              >
                No thanks, continue
              </button>

              {missingCompulsoryItems.length > 1 && (
                <button
                  type="button"
                  onClick={handleAddAllMissing}
                  className="px-4 py-2.5 rounded-xl bg-[#FAF0E6] hover:bg-[#F0D5BE] text-[#A04000] text-xs font-bold cursor-pointer order-1 sm:order-2"
                >
                  Add all ({missingCompulsoryItems.length})
                </button>
              )}

              <button
                type="button"
                onClick={() => commitPackageToCart()}
                className="px-5 py-2.5 rounded-xl bg-[#1F6B43] hover:bg-[#185535] text-white text-xs font-bold cursor-pointer order-1 sm:order-3"
              >
                Proceed to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <MobileBottomNav />
    </div>
  );
}

