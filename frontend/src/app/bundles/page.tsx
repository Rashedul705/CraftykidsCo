'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Gift,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Check,
  ChevronDown,
  Info,
  X,
  Plus,
  ShieldCheck,
  Star,
  ArrowRight,
  Heart,
  Package,
  Layers,
  Clock,
  SlidersHorizontal,
  Loader2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useCart } from '@/context/CartContext';
import { BRAND_CONFIG } from '@/lib/brand';
import {
  BundleRecord,
  BundleItem,
  getAllBundles,
  calculateBundleStock,
} from '@/lib/bundles-store';
import { sampleProducts, SampleProduct } from '@/lib/sample-data';

export default function BundlesPage() {
  const { addItem } = useCart();

  // Bundles Data
  const [bundles, setBundles] = useState<BundleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Sort State
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('featured');

  // Featured Bundle Add-on options
  const [featuredGiftWrap, setFeaturedGiftWrap] = useState(false);
  const [featuredGiftCard, setFeaturedGiftCard] = useState(false);
  const [featuredCardRecipient, setFeaturedCardRecipient] = useState('');
  const [featuredCardMessage, setFeaturedCardMessage] = useState('');

  // Cart Feedback
  const [addedItemKey, setAddedItemKey] = useState<string | null>(null);

  // Quick View / Detailed Modal
  const [detailModalBundle, setDetailModalBundle] = useState<BundleRecord | null>(null);

  // =========================================================================
  // "নিজের সেট নিজে বানান" (CUSTOM BUNDLE BUILDER) STATE
  // =========================================================================
  const builderPool: SampleProduct[] = useMemo(() => {
    return sampleProducts.slice(0, 8);
  }, []);

  const [customSelectedProducts, setCustomSelectedProducts] = useState<SampleProduct[]>([]);
  const [customGiftWrap, setCustomGiftWrap] = useState(false);
  const [customGiftCard, setCustomGiftCard] = useState(false);
  const [customCardName, setCustomCardName] = useState('');
  const [customCardNote, setCustomCardNote] = useState('');

  // Load bundles from API or fallback
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/bundles');
        const data = await res.json();
        if (data.success && data.bundles && data.bundles.length > 0) {
          setBundles(data.bundles);
        } else {
          setBundles(getAllBundles());
        }
      } catch {
        setBundles(getAllBundles());
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter & Sort logic
  const filteredAndSortedBundles = useMemo(() => {
    let result = bundles.filter((b) => b.status === 'active');

    // Filter Chips
    if (selectedFilter === 'birthday') {
      result = result.filter((b) => b.occasion === 'birthday');
    } else if (selectedFilter === 'toddler') {
      result = result.filter(
        (b) => b.suitableAge.includes('১') || b.suitableAge.includes('২')
      );
    } else if (selectedFilter === 'kids') {
      result = result.filter(
        (b) => b.suitableAge.includes('৩') || b.suitableAge.includes('৪') || b.suitableAge.includes('৫') || b.suitableAge.includes('৬')
      );
    } else if (selectedFilter === 'school') {
      result = result.filter(
        (b) => b.suitableAge.includes('৬') || b.suitableAge.includes('৭') || b.suitableAge.includes('৮') || b.occasion === 'school'
      );
    } else if (selectedFilter === 'under-700') {
      result = result.filter((b) => b.bundlePrice <= 700);
    } else if (selectedFilter === 'above-1000') {
      result = result.filter((b) => b.bundlePrice >= 1000);
    }

    // Sort
    if (selectedSort === 'price-asc') {
      result.sort((a, b) => a.bundlePrice - b.bundlePrice);
    } else if (selectedSort === 'price-desc') {
      result.sort((a, b) => b.bundlePrice - a.bundlePrice);
    } else if (selectedSort === 'savings') {
      result.sort((a, b) => b.savingsAmount - a.savingsAmount);
    }

    return result;
  }, [bundles, selectedFilter, selectedSort]);

  // Featured Bundle (First featured or first active bundle)
  const featuredBundle = useMemo(() => {
    return bundles.find((b) => b.isFeatured && b.status === 'active') || bundles[0] || null;
  }, [bundles]);

  // Add Bundle to Cart
  const handleAddBundleToCart = (
    bundle: BundleRecord,
    withWrap = false,
    withCard = false,
    cardTo = '',
    cardMsg = ''
  ) => {
    const stockInfo = calculateBundleStock(bundle.items);
    if (stockInfo.setsAvailable <= 0) return;

    let finalPrice = bundle.bundlePrice;
    if (withWrap) finalPrice += BRAND_CONFIG.giftWrapPrice;
    if (withCard) finalPrice += BRAND_CONFIG.giftCardPrice;

    const bundleSummary = bundle.items
      .map((i) => `${i.productTitleBn} (${i.quantity}টি)`)
      .join(' + ');

    const itemKey = `${bundle.id}-${withWrap ? 'wrap' : 'nowrap'}-${withCard ? 'card' : 'nocard'}`;

    addItem({
      id: itemKey,
      productId: bundle.id,
      productSlug: bundle.slug,
      title: bundle.titleEn,
      titleBn: bundle.titleBn,
      imageUrl: bundle.imageUrl,
      price: finalPrice,
      quantity: 1,
      isBundle: true,
      bundleItemsSummary: bundleSummary,
      giftWrap: withWrap,
      giftMessage: withCard && cardTo ? `To: ${cardTo} - ${cardMsg}` : undefined,
    });

    setAddedItemKey(bundle.id);
    setTimeout(() => setAddedItemKey(null), 2000);
  };

  // Toggle item in Custom Bundle Builder
  const handleToggleCustomProduct = (prod: SampleProduct) => {
    if (customSelectedProducts.some((p) => p.id === prod.id)) {
      setCustomSelectedProducts(customSelectedProducts.filter((p) => p.id !== prod.id));
    } else {
      if (customSelectedProducts.length < 3) {
        setCustomSelectedProducts([...customSelectedProducts, prod]);
      }
    }
  };

  // Compute Custom Bundle Totals
  const customRegularTotal = customSelectedProducts.reduce(
    (sum, p) => sum + (p.baseSalePrice || p.basePrice),
    0
  );
  // 15% discount when 3 items picked
  const isCustomComplete = customSelectedProducts.length === 3;
  const customDiscountPercent = isCustomComplete ? 15 : 0;
  const customDiscountAmount = Math.round((customRegularTotal * customDiscountPercent) / 100);
  let customFinalPrice = customRegularTotal - customDiscountAmount;
  if (customGiftWrap) customFinalPrice += BRAND_CONFIG.giftWrapPrice;
  if (customGiftCard) customFinalPrice += BRAND_CONFIG.giftCardPrice;

  // Add Custom Bundle to Cart
  const handleAddCustomBundleToCart = () => {
    if (!isCustomComplete) return;

    const summary = customSelectedProducts.map((p) => p.titleBn).join(' + ');
    const customKey = `custom-bundle-${Date.now()}`;

    addItem({
      id: customKey,
      productId: 'custom-bundle',
      productSlug: 'custom-gift-set',
      title: 'Custom Build-Your-Own Gift Box (3 Items)',
      titleBn: 'কাস্টম গিফট বক্স (৩টি পছন্দসই খেলনা)',
      imageUrl: customSelectedProducts[0]?.imageUrl || '',
      price: customFinalPrice,
      quantity: 1,
      isBundle: true,
      bundleItemsSummary: summary,
      giftWrap: customGiftWrap,
      giftMessage: customGiftCard && customCardName ? `To: ${customCardName} - ${customCardNote}` : undefined,
    });

    setAddedItemKey('custom-bundle');
    setTimeout(() => setAddedItemKey(null), 2500);
    setCustomSelectedProducts([]);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 md:pb-16 text-[#2B2B2B]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
        {/* =====================================================================
            1. PAGE TITLE & EXPLANATION
           ===================================================================== */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#D6403B] text-white shadow-xs">
            <Gift className="w-3.5 h-3.5" />
            গিফট সেট ও স্পেশাল কম্বো বান্ডেল
          </span>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#2B2B2B] tracking-tight">
            একসাথে কিনুন এবং ৩০% পর্যন্ত সাশ্রয় করুন
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">
            বাচ্চাদের জন্মদিন, ঈদ বা যেকোনো উপহারের জন্য শিশুর উপযোগী নিরাপদ রঙের বক্স ও শিক্ষণীয় খেলনার প্রিমিয়াম প্যাকেজ।
          </p>
        </div>

        {/* =====================================================================
            2. ONE LARGE FEATURED BUNDLE SHOWCASE
           ===================================================================== */}
        {featuredBundle && (
          <div className="bg-white rounded-3xl border border-[#EFE9E0] overflow-hidden shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Left Photo & Badges (5 cols) */}
              <div className="lg:col-span-5 relative min-h-[300px] sm:min-h-[400px] bg-[#FAF7F2] overflow-hidden">
                {featuredBundle.imageUrl && featuredBundle.imageUrl.trim() ? (
                  <Image
                    src={featuredBundle.imageUrl.trim()}
                    alt={featuredBundle.titleBn}
                    fill
                    priority
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">🎁</div>
                )}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#D6403B] text-white shadow-sm flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    আজকের সেরা ডিল
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-[#FFF3CC] text-[#7A4E00] shadow-xs">
                    {featuredBundle.badge || 'স্পেশাল কম্বো'}
                  </span>
                </div>
              </div>

              {/* Right Content & Actions (7 cols) */}
              <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#6B6B6B] mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FAF7F2] border border-[#EFE9E0] font-semibold">
                        বয়স: {featuredBundle.suitableAge}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[#1F6B43] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ১০০% শিশু-নিরাপদ
                      </span>
                    </div>
                    <h2 className="font-heading font-black text-xl sm:text-2xl text-[#2B2B2B]">
                      {featuredBundle.titleBn}
                    </h2>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">
                      {featuredBundle.titleEn}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">
                    {featuredBundle.descriptionBn}
                  </p>

                  {/* Inside Items List */}
                  <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EFE9E0] space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B2B2B] flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-[#D6403B]" />
                      এই গিফট বক্সে যা যা থাকছে:
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {featuredBundle.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-[#EFE9E0] text-xs"
                        >
                          <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-[#FAF7F2] shrink-0 border border-[#EFE9E0]">
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt={item.productTitleBn}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-[#6B6B6B] m-auto" />
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <span className="font-bold text-[#2B2B2B] block truncate">
                              {item.productTitleBn}
                            </span>
                            <span className="text-[10px] text-[#6B6B6B]">
                              পরিমাণ: {item.quantity}টি • আলাদা মূল্য ৳{item.unitPrice}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Optional Gift Wrap & Greeting Card Addons */}
                  <div className="pt-2 border-t border-[#EFE9E0] space-y-3">
                    <span className="text-xs font-bold text-[#2B2B2B] block">
                      উপহারের অতিরিক্ত সুবিধা (ঐচ্ছিক):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                        featuredGiftWrap ? 'bg-[#FAF7F2] border-[#D6403B]' : 'bg-white border-[#EFE9E0]'
                      }`}>
                        <input
                          type="checkbox"
                          checked={featuredGiftWrap}
                          onChange={(e) => setFeaturedGiftWrap(e.target.checked)}
                          className="mt-0.5 rounded text-[#D6403B] focus:ring-[#D6403B]"
                        />
                        <div>
                          <span className="font-bold text-[#2B2B2B] block">
                            প্রিমিয়াম গিফট র‍্যাপ (+৳{BRAND_CONFIG.giftWrapPrice})
                          </span>
                          <span className="text-[10px] text-[#6B6B6B]">
                            রঙিন রিবন ও দৃষ্টিনন্দন উপহার বাক্সে মোড়ানো
                          </span>
                        </div>
                      </label>

                      <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                        featuredGiftCard ? 'bg-[#FAF7F2] border-[#D6403B]' : 'bg-white border-[#EFE9E0]'
                      }`}>
                        <input
                          type="checkbox"
                          checked={featuredGiftCard}
                          onChange={(e) => setFeaturedGiftCard(e.target.checked)}
                          className="mt-0.5 rounded text-[#D6403B] focus:ring-[#D6403B]"
                        />
                        <div>
                          <span className="font-bold text-[#2B2B2B] block">
                            শুভেচ্ছা কার্ড (+৳{BRAND_CONFIG.giftCardPrice})
                          </span>
                          <span className="text-[10px] text-[#6B6B6B]">
                            শিশুর নামসহ হাতে লেখা উইশ কার্ড
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Greeting Card inputs if checked */}
                    {featuredGiftCard && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-[#FAF7F2] rounded-xl border border-[#EFE9E0] animate-in fade-in">
                        <input
                          type="text"
                          placeholder="কার নামে বার্তা লিখবেন (উদা: আরিয়ান)"
                          value={featuredCardRecipient}
                          onChange={(e) => setFeaturedCardRecipient(e.target.value)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-white border border-[#EFE9E0]"
                        />
                        <input
                          type="text"
                          placeholder="আপনার শুভেচ্ছা বার্তা লিখুন"
                          value={featuredCardMessage}
                          onChange={(e) => setFeaturedCardMessage(e.target.value)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-white border border-[#EFE9E0]"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing & CTA Line */}
                <div className="pt-4 border-t border-[#EFE9E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black font-fredoka text-[#C23631]">
                        ৳
                        {featuredBundle.bundlePrice +
                          (featuredGiftWrap ? BRAND_CONFIG.giftWrapPrice : 0) +
                          (featuredGiftCard ? BRAND_CONFIG.giftCardPrice : 0)}
                      </span>
                      <span className="text-xs line-through text-[#6B6B6B]">
                        ৳{featuredBundle.originalPrice}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#DDF3E6] text-[#1F6B43]">
                        সাশ্রয় ৳{featuredBundle.savingsAmount}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#1F6B43] flex items-center gap-1 font-semibold mt-1">
                      <span className="w-2 h-2 rounded-full bg-[#1F6B43] inline-block" />
                      স্টকে রেডি আছে (সীমিত স্টক)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleAddBundleToCart(
                        featuredBundle,
                        featuredGiftWrap,
                        featuredGiftCard,
                        featuredCardRecipient,
                        featuredCardMessage
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#D6403B] hover:bg-[#C23631] text-white text-sm font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {addedItemKey === featuredBundle.id
                        ? 'Added to Cart!'
                        : 'Order Combo Now'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            3. FILTER CHIPS & SORT DROPDOWN
           ===================================================================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          {/* Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs font-semibold">
            {[
              { id: 'all', label: 'সবগুলো গিফট সেট' },
              { id: 'birthday', label: '🎂 জন্মদিনের গিফট' },
              { id: 'toddler', label: '👶 ১-৩ বছর (টডলার)' },
              { id: 'kids', label: '🎨 ৩-৬ বছর (কিডস)' },
              { id: 'school', label: '🎒 ৬+ বছর (স্কুল ও আর্ট)' },
              { id: 'under-700', label: '৳700 এর নিচে' },
              { id: 'above-1000', label: '৳1000+ মেগা সেট' },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedFilter(chip.id)}
                className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  selectedFilter === chip.id
                    ? 'bg-[#2B2B2B] text-white shadow-xs'
                    : 'bg-white text-[#6B6B6B] border border-[#EFE9E0] hover:text-[#2B2B2B]'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <span className="text-xs text-[#6B6B6B]">সর্ট করুন:</span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-white border border-[#EFE9E0] text-[#2B2B2B] focus:outline-none focus:border-[#D6403B]"
            >
              <option value="featured">জনপ্রিয়তা অনুযায়ী</option>
              <option value="savings">সর্বোচ্চ সাশ্রয়</option>
              <option value="price-asc">দাম: কম থেকে বেশি</option>
              <option value="price-desc">দাম: বেশি থেকে কম</option>
            </select>
          </div>
        </div>

        {/* =====================================================================
            4. GRID OF BUNDLE CARDS
           ===================================================================== */}
        <div>
          {loading ? (
            <div className="p-16 text-center text-[#6B6B6B]">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#D6403B]" />
              <p className="text-xs">বান্ডেল প্যাকেজ লোড হচ্ছে...</p>
            </div>
          ) : filteredAndSortedBundles.length === 0 ? (
            <div className="p-16 text-center text-[#6B6B6B] bg-white rounded-2xl border border-[#EFE9E0] space-y-3">
              <Gift className="w-10 h-10 text-[#6B6B6B] mx-auto" />
              <p className="text-sm font-bold text-[#2B2B2B]">কোনো বান্ডেল পাওয়া যায়নি</p>
              <p className="text-xs">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।</p>
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className="px-4 py-2 rounded-xl bg-[#2B2B2B] text-white text-xs font-bold"
              >
                সব বান্ডেল দেখুন
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedBundles.map((b) => {
                const stockInfo = calculateBundleStock(b.items);
                const isOutOfStock = stockInfo.setsAvailable <= 0;

                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl border border-[#EFE9E0] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Photo & Badges */}
                      <div className="relative aspect-4/3 bg-[#FAF7F2] overflow-hidden">
                        {b.imageUrl && b.imageUrl.trim() ? (
                          <Image
                            src={b.imageUrl.trim()}
                            alt={b.titleBn}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">🎁</div>
                        )}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#D6403B] text-white shadow-xs">
                            {b.badge || `${b.discountPercent}% সাশ্রয়`}
                          </span>
                        </div>
                        <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 backdrop-blur-xs text-[#2B2B2B] shadow-xs">
                          {b.suitableAge}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="font-heading font-black text-base text-[#2B2B2B] group-hover:text-[#D6403B] transition-colors line-clamp-1">
                            {b.titleBn}
                          </h3>
                          <span className="text-xs text-[#6B6B6B] block line-clamp-1">
                            {b.titleEn}
                          </span>
                        </div>

                        {/* Included items with small thumbnails */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
                            প্যাকেজের ভেতরে যা থাকছে ({b.items.length}টি আইটেম):
                          </span>
                          <div className="space-y-1">
                            {b.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-xs text-[#2B2B2B] bg-[#FAF7F2] p-1.5 rounded-lg"
                              >
                                <span className="w-5 h-5 rounded-md bg-white border border-[#EFE9E0] text-[10px] font-mono flex items-center justify-center font-bold text-[#D6403B] shrink-0">
                                  {item.quantity}x
                                </span>
                                <span className="truncate text-[11px] font-semibold">
                                  {item.productTitleBn}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Price & CTA */}
                    <div className="p-5 pt-0 space-y-3">
                      <div className="pt-3 border-t border-[#EFE9E0] flex items-baseline justify-between">
                        <div>
                          <span className="text-xl font-black font-fredoka text-[#C23631]">
                            ৳{b.bundlePrice}
                          </span>
                          <span className="text-xs line-through text-[#6B6B6B] ml-2">
                            ৳{b.originalPrice}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#1F6B43] font-bold">
                          সাশ্রয় ৳{b.savingsAmount}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailModalBundle(b)}
                          className="py-2 px-3 rounded-xl border border-[#EFE9E0] text-xs font-bold text-[#2B2B2B] hover:bg-[#FAF7F2] transition-colors text-center"
                        >
                          বিস্তারিত
                        </button>

                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleAddBundleToCart(b)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all ${
                            isOutOfStock
                              ? 'bg-[#EFE9E0] text-[#6B6B6B] cursor-not-allowed'
                              : 'bg-[#D6403B] hover:bg-[#C23631] text-white active:scale-95 cursor-pointer'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>
                            {isOutOfStock
                              ? 'Stock Out'
                              : addedItemKey === b.id
                              ? 'Added!'
                              : 'Add to Cart'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =====================================================================
            5. "নিজের সেট নিজে বানান" (CUSTOM BUNDLE BUILDER)
           ===================================================================== */}
        <div className="bg-white rounded-3xl border-2 border-[#D6403B]/20 p-6 sm:p-10 shadow-xs space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF3CC] text-[#7A4E00]">
              <Sparkles className="w-3.5 h-3.5" />
              কাস্টম বান্ডেল বিল্ডার
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B]">
              নিজের সেট নিজে বানান
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6B6B]">
              পছন্দমতো যেকোনো ৩টি পণ্য বাছাই করুন এবং সাথে সাথে ইনস্ট্যান্ট <strong>১৫% এক্সট্রা ছাড়</strong> উপভোগ করুন!
            </p>
          </div>

          {/* Progress Bar Line */}
          <div className="max-w-md mx-auto space-y-2 bg-[#FAF7F2] p-4 rounded-2xl border border-[#EFE9E0]">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#2B2B2B]">
                {customSelectedProducts.length} / ৩টি বাছাই হয়েছে
              </span>
              <span className={isCustomComplete ? 'text-[#1F6B43]' : 'text-[#D6403B]'}>
                {isCustomComplete
                  ? '✓ সম্পূর্ণ! ১৫% ছাড় যোগ হয়েছে'
                  : `আর ${3 - customSelectedProducts.length}টি যোগ করলে ১৫% ছাড় পাবেন!`}
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#EFE9E0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D6403B] rounded-full transition-all duration-300"
                style={{
                  width: `${(customSelectedProducts.length / 3) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Products Picker Carousel / Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {builderPool.map((prod) => {
              const isSelected = customSelectedProducts.some((p) => p.id === prod.id);

              return (
                <div
                  key={prod.id}
                  onClick={() => handleToggleCustomProduct(prod)}
                  className={`relative bg-[#FAF7F2] rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#D6403B] ring-2 ring-[#D6403B]/20 bg-white shadow-xs'
                      : 'border-[#EFE9E0] hover:border-[#D6403B]/40'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-white border border-[#EFE9E0]">
                      {prod.imageUrl && prod.imageUrl.trim() ? (
                        <Image
                          src={prod.imageUrl.trim()}
                          alt={prod.titleBn}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🎨</div>
                      )}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#D6403B] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#2B2B2B] line-clamp-1">
                        {prod.titleBn}
                      </h4>
                      <span className="font-black font-fredoka text-xs text-[#C23631]">
                        ৳{prod.baseSalePrice || prod.basePrice}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`mt-2.5 w-full py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
                      isSelected
                        ? 'bg-[#1F6B43] text-white'
                        : 'bg-white border border-[#EFE9E0] text-[#2B2B2B]'
                    }`}
                  >
                    {isSelected ? '✓ বাছাই করা হয়েছে' : '+ সেটে যোগ করুন'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Selected Set Summary Box */}
          {customSelectedProducts.length > 0 && (
            <div className="bg-[#FAF7F2] rounded-2xl p-5 border border-[#EFE9E0] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-[#2B2B2B]">
                    আপনার কাস্টম গিফট সেট:
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    {customSelectedProducts.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#EFE9E0] text-xs font-semibold text-[#2B2B2B]"
                      >
                        {p.titleBn}
                        <button
                          type="button"
                          onClick={() => handleToggleCustomProduct(p)}
                          className="text-[#6B6B6B] hover:text-[#DC2626]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-baseline gap-2 justify-end">
                    <span className="text-2xl font-black font-fredoka text-[#C23631]">
                      ৳{customFinalPrice}
                    </span>
                    {isCustomComplete && (
                      <span className="text-xs line-through text-[#6B6B6B]">
                        ৳{customRegularTotal}
                      </span>
                    )}
                  </div>
                  {isCustomComplete && (
                    <span className="text-[11px] font-bold text-[#1F6B43]">
                      ১৫% বান্ডেল ছাড় (সাশ্রয় ৳{customDiscountAmount})
                    </span>
                  )}
                </div>
              </div>

              {/* Addons for custom set */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#EFE9E0]">
                <label className="flex items-center gap-2 text-xs text-[#2B2B2B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customGiftWrap}
                    onChange={(e) => setCustomGiftWrap(e.target.checked)}
                    className="rounded text-[#D6403B] focus:ring-[#D6403B]"
                  />
                  <span>প্রিমিয়াম গিফট বক্স র‍্যাপ (+৳{BRAND_CONFIG.giftWrapPrice})</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-[#2B2B2B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customGiftCard}
                    onChange={(e) => setCustomGiftCard(e.target.checked)}
                    className="rounded text-[#D6403B] focus:ring-[#D6403B]"
                  />
                  <span>হাতে লেখা শুভেচ্ছা কার্ড (+৳{BRAND_CONFIG.giftCardPrice})</span>
                </label>
              </div>

              {customGiftCard && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="শিশুর নাম লিখুন"
                    value={customCardName}
                    onChange={(e) => setCustomCardName(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl bg-white border border-[#EFE9E0]"
                  />
                  <input
                    type="text"
                    placeholder="আপনার বার্তা লিখুন"
                    value={customCardNote}
                    onChange={(e) => setCustomCardNote(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl bg-white border border-[#EFE9E0]"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={!isCustomComplete}
                  onClick={handleAddCustomBundleToCart}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all ${
                    isCustomComplete
                      ? 'bg-[#D6403B] hover:bg-[#C23631] text-white cursor-pointer active:scale-95'
                      : 'bg-[#EFE9E0] text-[#6B6B6B] cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {addedItemKey === 'custom-bundle'
                      ? 'কাস্টম বান্ডেল যোগ হয়েছে!'
                      : isCustomComplete
                      ? 'কাস্টম সেট কার্টে যোগ করুন'
                      : `আর ${3 - customSelectedProducts.length}টি পণ্য যোগ করুন`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* =========================================================================
          6. DETAILED BUNDLE MODAL ("বিস্তারিত")
         ========================================================================= */}
      {detailModalBundle && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-[#EFE9E0] relative animate-in zoom-in-95 my-auto">
            <button
              type="button"
              onClick={() => setDetailModalBundle(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#EFE9E0] flex items-center justify-center text-[#6B6B6B] hover:text-[#2B2B2B]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#EFE9E0] shrink-0">
                {detailModalBundle.imageUrl && detailModalBundle.imageUrl.trim() ? (
                  <Image
                    src={detailModalBundle.imageUrl.trim()}
                    alt={detailModalBundle.titleBn}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🎁</div>
                )}
              </div>
              <div className="space-y-1 pr-6">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D6403B] text-white">
                  {detailModalBundle.badge}
                </span>
                <h3 className="font-heading font-black text-lg text-[#2B2B2B]">
                  {detailModalBundle.titleBn}
                </h3>
                <p className="text-xs text-[#6B6B6B]">{detailModalBundle.titleEn}</p>
              </div>
            </div>

            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              {detailModalBundle.descriptionBn}
            </p>

            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2B2B2B]">
                বান্ডেলের সম্পূর্ণ উপাদান ও মূল্য তালিকা:
              </h4>
              <div className="divide-y divide-[#EFE9E0] border border-[#EFE9E0] rounded-xl overflow-hidden">
                {detailModalBundle.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 flex items-center justify-between text-xs bg-[#FAF7F2]/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-white border border-[#EFE9E0] font-mono font-bold flex items-center justify-center text-[10px] text-[#D6403B]">
                        {item.quantity}x
                      </span>
                      <div>
                        <span className="font-bold text-[#2B2B2B] block">
                          {item.productTitleBn}
                        </span>
                        <span className="text-[10px] text-[#6B6B6B]">{item.productTitleEn}</span>
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-[#2B2B2B]">
                      ৳{item.unitPrice * item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#EFE9E0] flex items-center justify-between">
              <div>
                <span className="text-2xl font-black font-fredoka text-[#C23631]">
                  ৳{detailModalBundle.bundlePrice}
                </span>
                <span className="text-xs line-through text-[#6B6B6B] ml-2">
                  ৳{detailModalBundle.originalPrice}
                </span>
                <span className="block text-[11px] text-[#1F6B43] font-bold">
                  সাশ্রয় ৳{detailModalBundle.savingsAmount} ({detailModalBundle.discountPercent}% OFF)
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleAddBundleToCart(detailModalBundle);
                  setDetailModalBundle(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#D6403B] hover:bg-[#C23631] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centralized Storefront Footer */}
      <Footer />

      <MobileBottomNav activeTab="shop" />
    </div>
  );
}
