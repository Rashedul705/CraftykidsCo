'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Package,
  ArrowRight,
  Loader2,
  Trash2,
  Percent,
  Info,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useCart } from '@/context/CartContext';

interface ProductItem {
  _id?: string;
  id: string;
  titleBn?: string;
  titleEn?: string;
  title?: string;
  imageUrl?: string;
  image?: string;
  price?: number;
  regularPrice?: number;
  salePrice?: number;
  stock?: number;
  totalStock?: number;
  bundleEligible?: boolean;
}

interface BundleTier {
  _id?: string;
  id?: string;
  minQuantity: number;
  discountPercent: number;
  isActive: boolean;
}

export default function BuildYourBundlePage() {
  const { addItem } = useCart();
  const router = useRouter();
  const [locale, setLocale] = useState<'bn' | 'en'>('bn');

  // Catalog Products
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Settings & Tiers
  const [tiers, setTiers] = useState<BundleTier[]>([]);
  const [maxDiscountPercent, setMaxDiscountPercent] = useState<number>(20);
  const [showOutOfStockMode, setShowOutOfStockMode] = useState<'greyed' | 'hidden'>('greyed');

  // Customer Selections: { productId: quantity }
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [calculating, setCalculating] = useState(false);
  const [calcData, setCalcData] = useState<any>(null);
  const [addedToast, setAddedToast] = useState(false);

  // 1. Fetch Tiers & Settings
  useEffect(() => {
    Promise.all([
      fetch('/api/bundle-tiers').then((r) => r.json()),
      fetch('/api/bundle-settings').then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
    ])
      .then(([tiersRes, settingsRes, prodRes]) => {
        if (tiersRes.success && tiersRes.tiers) {
          setTiers(tiersRes.tiers.filter((t: any) => t.isActive));
        }
        if (settingsRes.success && settingsRes.setting) {
          setMaxDiscountPercent(settingsRes.setting.maxDiscountPercent ?? 20);
          setShowOutOfStockMode(settingsRes.setting.showOutOfStockMode ?? 'greyed');
        }
        if (prodRes.success && prodRes.products) {
          // Filter only bundleEligible !== false
          const eligible = prodRes.products.filter(
            (p: any) => p.bundleEligible !== false
          );
          setProducts(eligible);
        }
      })
      .catch((err) => console.error('Error loading bundle builder data:', err))
      .finally(() => setLoadingProducts(false));
  }, []);

  // 2. Trigger server-side calculation whenever selections change
  useEffect(() => {
    const items = Object.entries(selectedQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (items.length === 0) {
      setCalcData(null);
      return;
    }

    setCalculating(true);
    fetch('/api/custom-bundle/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
      .then((res) => res.json())
      .then((data) => {
        setCalcData(data);
      })
      .catch((err) => console.error('Calculation error:', err))
      .finally(() => setCalculating(false));
  }, [selectedQuantities]);

  // Update item quantity in builder
  const handleSetQuantity = (productId: string, newQty: number, maxStock: number) => {
    const bounded = Math.max(0, Math.min(newQty, maxStock));
    setSelectedQuantities((prev) => {
      const next = { ...prev };
      if (bounded === 0) {
        delete next[productId];
      } else {
        next[productId] = bounded;
      }
      return next;
    });
  };

  // Add Bundle to Cart
  const handleAddToCart = () => {
    if (!calcData || !calcData.items || calcData.items.length === 0) return;

    const bundleGroupId = `cb-${Date.now()}`;
    const tierPercent = calcData.discountPercent || 0;

    // Add each line as part of the custom bundle group
    calcData.items.forEach((item: any) => {
      addItem({
        id: `${item.productId}-${bundleGroupId}`,
        productId: item.productId,
        productSlug: item.productId,
        title: item.title,
        titleBn: item.titleBn || item.title,
        imageUrl: item.imageUrl,
        price: item.finalUnitPrice, // Discounted unit price
        quantity: item.quantity,
        isBundle: true,
        bundleItemsSummary: `Custom Bundle (${tierPercent}% Tier Discount)`,
        originalUnitPrice: item.originalUnitPrice,
        discountAmount: item.lineDiscount,
        finalPrice: item.finalUnitPrice,
        bundleType: 'custom',
        bundleGroupId,
        tierPercentApplied: tierPercent,
      });
    });

    setAddedToast(true);
    setTimeout(() => {
      setAddedToast(false);
      router.push('/cart');
    }, 1200);
  };

  // Visible Products based on out-of-stock mode
  const visibleProducts = useMemo(() => {
    return products.filter((p) => {
      const stock = typeof p.totalStock === 'number' ? p.totalStock : (p.stock ?? 0);
      if (showOutOfStockMode === 'hidden' && stock <= 0) {
        return false;
      }
      return true;
    });
  }, [products, showOutOfStockMode]);

  const totalSelectedUnits = calcData?.totalQuantity ?? 0;

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-32 md:pb-16 text-[#2B2B2B]">
      <Header locale={locale} onToggleLocale={() => setLocale(locale === 'bn' ? 'en' : 'bn')} />

      {/* Added to cart toast */}
      {addedToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#1F6B43] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-sm animate-in fade-in slide-in-from-top-4">
          <Check className="w-5 h-5" />
          <span>কাস্টম বান্ডেল কার্টে যুক্ত হয়েছে! রিডাইরেক্ট করা হচ্ছে...</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Banner / Title */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE9E0] mb-8 shadow-xs relative overflow-hidden">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF0E6] text-[#A04000] border border-[#F0D5BE] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#D6403B]" />
              Build Your Own Bundle
            </span>
            <h1 className="text-2xl sm:text-4xl font-bold font-fredoka text-[#2B2B2B]">
              পছন্দমতো প্রোডাক্ট বেছে নিন ও স্পেশাল ছাড় পান!
            </h1>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mt-2">
              যত বেশি আইটেম যোগ করবেন, তত বেশি ডিসকাউন্ট উপভোগ করবেন। যেকোনো প্রোডাক্ট ২ বা ততোধিক নিলেই আকর্ষণীয় টায়ার ছাড় প্রযোজ্য হবে।
            </p>

            {/* Configured Tiers Bar */}
            {tiers.length > 0 && (
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
                {tiers.map((t) => (
                  <div
                    key={t._id || t.id}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      totalSelectedUnits >= t.minQuantity
                        ? 'bg-[#EBF8EE] border-[#C4EDCD] text-[#1F6B43]'
                        : 'bg-[#FAF7F2] border-[#EFE9E0] text-[#6B6B6B]'
                    }`}
                  >
                    <span>{t.minQuantity}+ আইটেমে {t.discountPercent}% ছাড়</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Progress Banner */}
        {calcData?.progressMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FFF8E7] border border-[#FFE8A3] text-xs sm:text-sm font-bold text-[#8F5B00] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#E68A00] shrink-0" />
              <span>{calcData.progressMessage}</span>
            </div>
            {calcData.discountPercent > 0 && (
              <span className="px-3 py-1 rounded-full bg-[#1F6B43] text-white text-xs font-bold">
                {calcData.discountPercent}% ছাড় সক্রিয়
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* PRODUCT CATALOG GRID (8 COLS) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#2B2B2B]">
                উপলব্ধ পণ্যসমূহ ({visibleProducts.length})
              </h2>
              <span className="text-xs text-[#8C8C8C]">
                সেল মূল্যের ওপরও টায়ার ডিসকাউন্ট প্রযোজ্য
              </span>
            </div>

            {loadingProducts ? (
              <div className="p-16 text-center text-[#6B6B6B] flex items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#D6403B]" />
                <span>পণ্য লোড হচ্ছে...</span>
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#EFE9E0] p-12 text-center text-[#6B6B6B]">
                <Package className="w-10 h-10 text-[#C4BFB7] mx-auto mb-2" />
                <p className="font-semibold text-sm">কোনো বান্ডেল উপযোগী পণ্য পাওয়া যায়নি</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {visibleProducts.map((product) => {
                  const id = product._id?.toString() || product.id;
                  const availableStock = typeof product.totalStock === 'number'
                    ? product.totalStock
                    : (product.stock ?? 0);
                  const isOutOfStock = availableStock <= 0;
                  const qty = selectedQuantities[id] || 0;

                  // Price
                  const hasSale =
                    typeof product.salePrice === 'number' &&
                    product.salePrice > 0 &&
                    typeof product.regularPrice === 'number' &&
                    product.salePrice < product.regularPrice;
                  const currentPrice = hasSale
                    ? product.salePrice
                    : product.salePrice || product.price || product.regularPrice || 0;

                  const title = product.titleBn || product.titleEn || product.title || 'Product';
                  const img = product.imageUrl || product.image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400';

                  return (
                    <div
                      key={id}
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
                        <Image
                          src={img}
                          alt={title}
                          fill
                          className="object-cover"
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FDE3E1] text-[#9B2420] border border-[#9B2420]/20">
                              স্টক আউট (Out of stock)
                            </span>
                          </div>
                        )}
                        {hasSale && !isOutOfStock && (
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D6403B] text-white">
                              Sale
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-xs sm:text-sm text-[#2B2B2B] line-clamp-2 leading-tight">
                            {title}
                          </h3>

                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="font-bold text-sm text-[#D6403B]">
                              ৳{currentPrice}
                            </span>
                            {hasSale && (
                              <span className="text-[11px] text-[#8C8C8C] line-through">
                                ৳{product.regularPrice}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="mt-3 pt-2.5 border-t border-[#EFE9E0]">
                          {isOutOfStock ? (
                            <button
                              type="button"
                              disabled
                              className="w-full py-1.5 rounded-xl bg-[#E5E5E5] text-[#8C8C8C] text-xs font-bold cursor-not-allowed"
                            >
                              Out of stock
                            </button>
                          ) : qty === 0 ? (
                            <button
                              type="button"
                              onClick={() => handleSetQuantity(id, 1, availableStock)}
                              className="w-full py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#D6403B] text-[#2B2B2B] hover:text-white border border-[#EFE9E0] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>বান্ডেলে যোগ করুন</span>
                            </button>
                          ) : (
                            <div className="flex items-center justify-between bg-[#FAF7F2] rounded-xl p-1 border border-[#D6403B]/30">
                              <button
                                type="button"
                                onClick={() => handleSetQuantity(id, qty - 1, availableStock)}
                                className="w-7 h-7 rounded-lg bg-white text-[#2B2B2B] hover:bg-[#FFF0F0] hover:text-[#D6403B] flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-bold text-xs text-[#2B2B2B] px-2">
                                {qty}
                              </span>
                              <button
                                type="button"
                                disabled={qty >= availableStock}
                                onClick={() => handleSetQuantity(id, qty + 1, availableStock)}
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
            )}
          </div>

          {/* SUMMARY PANEL (DESKTOP RIGHT 4 COLS, MOBILE STICKY BOTTOM) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl border border-[#EFE9E0] p-5 shadow-xs lg:sticky lg:top-24 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E0]">
                <h3 className="font-bold text-base text-[#2B2B2B] flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#D6403B]" />
                  <span>আপনার কাস্টম বান্ডেল</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF0E6] text-[#A04000]">
                  {totalSelectedUnits} আইটেম
                </span>
              </div>

              {/* Selected Items List */}
              {!calcData || calcData.items?.length === 0 ? (
                <div className="py-8 text-center text-[#8C8C8C] text-xs">
                  <Package className="w-8 h-8 text-[#C4BFB7] mx-auto mb-2" />
                  <span>বান্ডেল শুরু করতে পণ্য নির্বাচন করুন</span>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto divide-y divide-[#EFE9E0] text-xs pr-1">
                  {calcData.items.map((it: any) => (
                    <div key={it.productId} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#FAF7F2] border border-[#EFE9E0] overflow-hidden relative shrink-0">
                          {it.imageUrl && (
                            <Image src={it.imageUrl} alt={it.title} fill className="object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-[#2B2B2B] block truncate">
                            {it.title}
                          </span>
                          <span className="text-[11px] text-[#6B6B6B]">
                            {it.quantity} &times; ৳{it.finalUnitPrice}
                            {it.discountPerUnit > 0 && (
                              <span className="text-[#8C8C8C] line-through ml-1">
                                ৳{it.originalUnitPrice}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-[#2B2B2B]">
                          ৳{it.lineTotal}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSetQuantity(it.productId, 0, 9999)}
                          className="text-[#8C8C8C] hover:text-[#D6403B] p-1 cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Financial Breakdown */}
              {calcData && calcData.items?.length > 0 && (
                <div className="pt-3 border-t border-[#EFE9E0] space-y-2 text-xs">
                  <div className="flex justify-between text-[#6B6B6B]">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-[#2B2B2B]">৳{calcData.subtotal}</span>
                  </div>

                  {calcData.discountAmount > 0 && (
                    <div className="flex justify-between text-[#1F6B43] font-bold">
                      <span>Tier Discount ({calcData.discountPercent}%):</span>
                      <span>- ৳{calcData.discountAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-base font-bold text-[#2B2B2B] pt-2 border-t border-[#EFE9E0]">
                    <span>Final Total:</span>
                    <span className="text-lg text-[#D6403B]">৳{calcData.finalTotal}</span>
                  </div>
                </div>
              )}

              {/* Add to Cart CTA */}
              <button
                type="button"
                disabled={!calcData || calcData.items?.length === 0 || calculating}
                onClick={handleAddToCart}
                className="w-full py-3.5 rounded-2xl bg-[#D6403B] hover:bg-[#C23631] disabled:opacity-50 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {calculating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>বান্ডেল কার্টে যোগ করুন • ৳{calcData?.finalTotal ?? 0}</span>
                  </>
                )}
              </button>

              <div className="text-[11px] text-[#8C8C8C] text-center flex items-center justify-center gap-1">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>বান্ডেল অর্ডারে কুপন কোড প্রযোজ্য নয়</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}

