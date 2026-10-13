'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  Truck,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Plus,
  Minus,
  Check,
  Gift,
  Star,
  Play,
  Maximize2,
  X,
  Phone,
  MessageCircle,
  HelpCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  CreditCard,
  AlertCircle,
  Zap,
  ArrowRight,
  Share2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getProductBySlug, getAllProducts } from '@/lib/store';
import { SampleProduct } from '@/lib/sample-data';
import { formatBDT } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

function ProductContent() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || 'craftykidsco-natural-wax-crayons-24-shades';
  const { addItem } = useCart();

  const allProducts = getAllProducts();
  const product: SampleProduct = getProductBySlug(slug) || allProducts[0];

  // Gallery state
  const galleryImages = useMemo(() => {
    if (product.galleryImages && product.galleryImages.length > 0) {
      return product.galleryImages;
    }
    return [product.imageUrl];
  }, [product]);

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);

  // Variation state
  const variations = product.variations || [];
  const [selectedVariationIndex, setSelectedVariationIndex] = useState<number>(() => {
    return variations.length > 0 ? 0 : -1;
  });
  const [variationError, setVariationError] = useState<string | null>(null);

  const currentVariation = variations[selectedVariationIndex];

  // Price calculations
  const currentPrice = currentVariation
    ? currentVariation.salePrice || currentVariation.price
    : product.baseSalePrice || product.basePrice;

  const currentOriginalPrice = currentVariation
    ? currentVariation.price
    : product.basePrice;

  const discountPercent = currentOriginalPrice > currentPrice
    ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)
    : 0;

  // Stock status
  const currentStock = currentVariation ? currentVariation.stock : 25;
  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock <= 10;

  // Quantity state
  const [quantity, setQuantity] = useState<number>(1);
  const [addedToast, setAddedToast] = useState<boolean>(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'care' | 'delivery' | 'faq'>('desc');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Recently Viewed state
  const [recentlyViewed, setRecentlyViewed] = useState<SampleProduct[]>([]);

  // When variation changes, update main image if variation has custom image
  const handleSelectVariation = (idx: number) => {
    setSelectedVariationIndex(idx);
    setVariationError(null);
    const chosen = variations[idx];
    if (chosen?.imageUrl) {
      const foundIdx = galleryImages.findIndex((img) => img === chosen.imageUrl);
      if (foundIdx !== -1) {
        setActiveImageIndex(foundIdx);
      }
    }
  };

  // Track Recently Viewed & JSON-LD / Pixel Simulation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ckc_recently_viewed');
        const list: string[] = stored ? JSON.parse(stored) : [];
        if (!list.includes(product.slug)) {
          const updated = [product.slug, ...list.filter((s) => s !== product.slug)].slice(0, 6);
          localStorage.setItem('ckc_recently_viewed', JSON.stringify(updated));
        }

        // Load items for display
        const recentItems = list
          .filter((s) => s !== product.slug)
          .map((s) => getProductBySlug(s))
          .filter(Boolean) as SampleProduct[];
        setRecentlyViewed(recentItems.slice(0, 4));
      } catch {}

      // Meta Pixel / Conversion API hook simulation
      if ((window as any).fbq) {
        (window as any).fbq('track', 'ViewContent', {
          content_name: product.titleEn,
          content_category: product.categorySlug,
          value: currentPrice,
          currency: 'BDT',
        });
      }
    }
  }, [product.slug, currentPrice]);

  // Add to Cart handler
  const handleAddToCart = () => {
    if (variations.length > 0 && selectedVariationIndex === -1) {
      setVariationError('অনুগ্রহ করে আগে সেটের সাইজ বা রঙ বেছে নিন');
      return;
    }
    if (isOutOfStock) return;

    addItem({
      id: currentVariation
        ? `${product.id}-${currentVariation.sku}`
        : `${product.id}-default`,
      productId: product.id,
      productSlug: product.slug,
      title: product.titleEn,
      titleBn: product.titleBn,
      imageUrl: currentVariation?.imageUrl || product.imageUrl,
      price: currentPrice,
      quantity,
      variationSku: currentVariation?.sku,
      variationTitle: currentVariation?.titleEn,
      variationTitleBn: currentVariation?.titleBn,
    });

    // Tracking
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'AddToCart', {
        content_name: product.titleEn,
        value: currentPrice * quantity,
        currency: 'BDT',
      });
    }

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  // Order Now handler (Direct Checkout)
  const handleBuyNow = () => {
    if (variations.length > 0 && selectedVariationIndex === -1) {
      setVariationError('অনুগ্রহ করে আগে সেটের সাইজ বা রঙ বেছে নিন');
      return;
    }
    handleAddToCart();
    router.push('/checkout');
  };

  // Add Combo to Cart
  const handleAddCombo = () => {
    handleAddToCart();
    const sketchbook = allProducts.find((p) => p.slug.includes('sketchbook')) || allProducts[1];
    if (sketchbook) {
      addItem({
        id: `${sketchbook.id}-combo`,
        productId: sketchbook.id,
        productSlug: sketchbook.slug,
        title: sketchbook.titleEn,
        titleBn: sketchbook.titleBn,
        imageUrl: sketchbook.imageUrl,
        price: sketchbook.baseSalePrice || sketchbook.basePrice,
        quantity: 1,
      });
    }
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  // Related products
  const relatedProducts = useMemo(() => {
    return allProducts.filter((p) => p.slug !== product.slug).slice(0, 4);
  }, [allProducts, product.slug]);

  // Product JSON-LD Schema
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.titleEn,
    alternateName: product.titleBn,
    image: galleryImages,
    description: product.description || product.titleBn,
    brand: {
      '@type': 'Brand',
      name: 'CraftyKidsCo',
    },
    offers: {
      '@type': 'Offer',
      price: currentPrice,
      priceCurrency: 'BDT',
      availability: isOutOfStock
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating || 4.9,
      reviewCount: product.reviewCount || 48,
    },
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-28 md:pb-16 text-[#2B2B2B]">
      <Header />

      {/* SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-8">
        {/* Breadcrumb */}
        <div className="text-xs text-[#6B6B6B] flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-[#D32F2F]">হোম</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#D32F2F]">সব পণ্য</Link>
          <span>/</span>
          <span className="font-bold text-[#2B2B2B] truncate max-w-xs">{product.titleBn}</span>
        </div>

        {/* =====================================================================
            1 & 2: MEDIA GALLERY + CORE PRODUCT BUY BOX
           ===================================================================== */}
        <div className="bg-white rounded-[32px] border border-[#EFEAE2] p-5 sm:p-8 lg:p-10 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* LEFT: GALLERY & VIDEO */}
          <div className="space-y-4">
            {/* Main Stage Image / Video */}
            <div className="relative aspect-square rounded-[24px] overflow-hidden bg-[#FAF7F2] border border-[#EFEAE2] shadow-inner group">
              {isPlayingVideo && product.videoUrl ? (
                <div className="relative w-full h-full bg-black">
                  <video
                    src={product.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => setIsPlayingVideo(false)}
                    className="absolute top-3 right-3 bg-white/90 text-[#2B2B2B] p-1.5 rounded-full shadow-md z-10"
                    title="ছবিতে ফিরে যান"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Image
                    src={galleryImages[activeImageIndex] || product.imageUrl}
                    alt={product.titleBn}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Overlays: Safety & Age Badges */}
                  <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-10 pointer-events-none">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" /> ১০০% বিষাক্ত নয়
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] shadow-xs">
                      {product.targetAgeMin}+ বছর বয়সী
                    </span>
                  </div>

                  {/* Discount Badge */}
                  {discountPercent > 0 && (
                    <div className="absolute top-3.5 right-3.5 z-10">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-[#D32F2F] text-white shadow-xs">
                        -{discountPercent}% ছাড়
                      </span>
                    </div>
                  )}

                  {/* Zoom Lightbox Trigger Button */}
                  <button
                    onClick={() => setIsZoomOpen(true)}
                    className="absolute bottom-3.5 right-3.5 p-2 rounded-xl bg-white/90 hover:bg-white text-[#2B2B2B] shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-1 text-xs font-bold z-10"
                    title="জুম করে দেখুন"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">জুম</span>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails Row (Images + Video Preview Button) */}
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsPlayingVideo(false);
                    setActiveImageIndex(idx);
                  }}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#FAF7F2] border-2 transition-all cursor-pointer flex-shrink-0 ${
                    !isPlayingVideo && activeImageIndex === idx
                      ? 'border-[#D32F2F] shadow-sm scale-95'
                      : 'border-[#EFEAE2] hover:border-[#D32F2F]/60'
                  }`}
                >
                  <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}

              {/* Video Play Thumbnail Button */}
              {product.videoUrl && (
                <button
                  onClick={() => setIsPlayingVideo(true)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#FFF3E6] border-2 flex flex-col items-center justify-center gap-1 cursor-pointer flex-shrink-0 transition-all ${
                    isPlayingVideo
                      ? 'border-[#D32F2F] shadow-sm'
                      : 'border-[#FFE0B2] hover:border-[#D32F2F]'
                  }`}
                  title="ভিডিও দেখুন"
                >
                  <div className="w-7 h-7 rounded-full bg-[#D32F2F] text-white flex items-center justify-center shadow-xs">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                  <span className="text-[10px] font-bold text-[#D32F2F]">ভিডিও</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: CORE PRODUCT DETAILS & ACTION BOX */}
          <div className="space-y-6">
            <div>
              {/* Brand & Stock Status Badge */}
              <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
                    <AlertCircle className="w-3.5 h-3.5" /> স্টক শেষ (বর্তমানে নেই)
                  </span>
                ) : isLowStock ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] animate-pulse">
                    <Clock className="w-3.5 h-3.5" /> মাত্র {currentStock}টি বাকি - দ্রুত অর্ডার করুন!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> স্টকে আছে (ইন স্টক)
                  </span>
                )}

                <span className="text-[#8A8A8A] font-mono text-[11px]">
                  SKU: {currentVariation?.sku || 'CKC-CRAYON'}
                </span>
              </div>

              {/* Product Title */}
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#1F1F1F] leading-snug">
                {product.titleBn}
              </h1>

              {/* Rating & Social Proof Snippet */}
              <div className="mt-2 flex items-center gap-2 text-xs">
                <div className="flex items-center text-[#F59E0B]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className="font-bold text-[#1A1A1A]">{product.rating || 4.9}</span>
                <span className="text-[#8A8A8A]">
                  ({product.reviewCount || 48} জন অভিভাবকের রেটিং)
                </span>
                <span className="text-[#8A8A8A]">•</span>
                <span className="text-[#2E7D32] font-semibold">৯৮% পজিটিভ রিভিউ</span>
              </div>

              {/* Price & Savings */}
              <div className="mt-4 flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-black text-[#D32F2F]">
                  {formatBDT(currentPrice)}
                </span>
                {currentOriginalPrice > currentPrice && (
                  <span className="text-lg text-[#8A8A8A] line-through font-semibold">
                    {formatBDT(currentOriginalPrice)}
                  </span>
                )}
                {currentOriginalPrice > currentPrice && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FDE8E8] text-[#D32F2F] border border-[#FBD5D5]">
                    সাশ্রয় ৳{currentOriginalPrice - currentPrice} (-{discountPercent}%)
                  </span>
                )}
              </div>
            </div>

            {/* Variant Selector (If Variable Product) */}
            {variations.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-[#EFEAE2]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1A1A1A]">
                    সেট সাইজ বা ভ্যারিয়েন্ট বাছাই করুন:
                  </span>
                  <span className="font-bold text-[#D32F2F]">
                    {currentVariation?.titleBn}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {variations.map((v, idx) => {
                    const isSelected = selectedVariationIndex === idx;
                    return (
                      <button
                        key={v.sku}
                        type="button"
                        onClick={() => handleSelectVariation(idx)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-2 border-[#D32F2F] bg-[#FDE8E8]/40 shadow-xs ring-1 ring-[#D32F2F]/20'
                            : 'border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#D32F2F]/60'
                        }`}
                      >
                        <span className="text-xs font-bold text-[#1F1F1F] line-clamp-1">
                          {v.titleBn}
                        </span>
                        <div className="mt-1 flex items-baseline justify-between">
                          <span className="text-sm font-black text-[#D32F2F]">
                            ৳{v.salePrice || v.price}
                          </span>
                          <span className="text-[10px] text-[#6B6B6B]">
                            {v.stock <= 10 ? `বাকি: ${v.stock}টি` : 'ইন স্টক'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {variationError && (
                  <p className="text-xs font-bold text-[#D32F2F] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {variationError}
                  </p>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-2 pt-2 border-t border-[#EFEAE2]">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-[#1A1A1A]">পরিমাণ:</span>
                <div className="flex items-center bg-[#FAF7F2] border border-[#E5E0D8] rounded-full p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#2B2B2B] hover:text-[#D32F2F] shadow-xs cursor-pointer disabled:opacity-40"
                    title="কমান"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                    disabled={quantity >= currentStock}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#2B2B2B] hover:text-[#D32F2F] shadow-xs cursor-pointer disabled:opacity-40"
                    title="বাড়ান"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Button 1: Buy Now (Direct Checkout) */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="py-3.5 px-4 rounded-2xl bg-[#D32F2F] hover:bg-[#B71C1C] active:scale-[0.98] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Buy Now</span>
                </button>

                {/* Button 2: Add to cart */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`py-3.5 px-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                    addedToast
                      ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]'
                      : 'bg-[#FFC107] hover:bg-[#FFB300] active:scale-[0.98] text-[#1A1A1A] border-[#FFB300] shadow-sm'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {addedToast ? (
                    <>
                      <Check className="w-4 h-4 text-[#2E7D32]" />
                      <span>Added to cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Direct WhatsApp & Call Order Box (Directly under buttons) */}
            <div className="bg-[#E8F5E9]/50 border border-[#C8E6C9] rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5 text-center sm:text-left">
                <span className="font-bold text-[#1B5E20] block">
                  অর্ডার করতে দ্বিধা বা যেকোনো প্রশ্নে কথা বলুন:
                </span>
                <span className="text-[#2E7D32] text-[11px]">
                  আমাদের টিম আপনাকে অর্ডার বুঝিয়ে দিতে সরাসরি সাহায্য করবে
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={`https://wa.me/8801711223344?text=${encodeURIComponent(
                    `আসসালামু আলাইকুম, আমি '${product.titleBn}' সম্পর্কে জানতে ও অর্ডার করতে চাই।`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> হোয়াটসঅ্যাপ
                </a>

                <a
                  href="tel:01711223344"
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#C8E6C9] text-[#1B5E20] hover:bg-[#F1F8F2] font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" /> কল করুন
                </a>
              </div>
            </div>

            {/* Trust Assurances (4 Guarantees) */}
            <div className="space-y-4 pt-1">
              <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EFEAE2] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#2B2B2B]">
                <div className="flex items-start gap-2.5">
                  <Truck className="w-4 h-4 text-[#0284C7] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#1A1A1A]">সারা বাংলাদেশে হোম ডেলিভারি</strong>
                    <span className="text-[#6B6B6B] text-[11px]">ঢাকা ৳৬০ (২৪-৪৮ ঘণ্টা), বাইরে ৳১২০ (২-৩ দিন)। ৳১০০০+ এ ফ্রি</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#2E7D32] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#1A1A1A]">১০০% ক্যাশ অন ডেলিভারি</strong>
                    <span className="text-[#6B6B6B] text-[11px]">পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ নিশ্চিন্তে টাকা দিন</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <RotateCcw className="w-4 h-4 text-[#D97706] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#1A1A1A]">৭ দিনে সহজ রিটার্ন সুবিধা</strong>
                    <span className="text-[#6B6B6B] text-[11px]">কোনো সমস্যা থাকলে ৭ দিনে পরিবর্তন বা ফেরত নিন</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#D32F2F] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#1A1A1A]">খাদ্য-মানের প্রাকৃতিক মোম</strong>
                    <span className="text-[#6B6B6B] text-[11px]">১০০% ক্ষতিকর কেমিক্যাল ও বিষাক্ত পদার্থ মুক্ত</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            4: DETAILED PRODUCT TABS (DESCRIPTION, SPECS, CARE, DELIVERY, FAQ)
           ===================================================================== */}
        <div className="bg-white rounded-[28px] border border-[#EFEAE2] p-6 sm:p-8 shadow-xs space-y-6">
          {/* Tabs Navigation Header */}
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[#EFEAE2] scrollbar-none text-xs sm:text-sm font-bold">
            {[
              { id: 'desc', label: 'বিস্তারিত বিবরণ' },
              { id: 'specs', label: 'স্পেসিফিকেশন' },
              { id: 'care', label: 'ব্যবহার ও যত্নের নিয়ম' },
              { id: 'delivery', label: 'ডেলিভারি ও রিটার্ন' },
              { id: 'faq', label: 'সাধারণ প্রশ্নোত্তর (FAQ)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#D32F2F] text-white shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FAF7F2]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: DESCRIPTION */}
          {activeTab === 'desc' && (
            <div className="space-y-4 text-xs sm:text-sm text-[#4A4A4A] leading-relaxed">
              <p>
                {product.description ||
                  `${product.titleBn} শিশুদের সৃজনশীলতা ও আনন্দময় ড্রয়িংয়ের জন্য বিশেষভাবে ডিজাইন করা হয়েছে। এটি সম্পূর্ণ নন-টক্সিক ও নিরাপদ।`}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] space-y-1">
                  <strong className="text-sm font-bold text-[#1A1A1A] block">🎨 কী এবং কীভাবে তৈরি?</strong>
                  <p className="text-xs text-[#6B6B6B]">
                    ১০০% খাঁটি মৌচাকের মোম ও প্রাকৃতিক ফুড-গ্রেড রঙ। ক্ষতিকর প্যারাফিন বা সিন্থেটিক কেমিক্যালমুক্ত।
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] space-y-1">
                  <strong className="text-sm font-bold text-[#1A1A1A] block">👶 কার জন্য উপযুক্ত?</strong>
                  <p className="text-xs text-[#6B6B6B]">
                    ২ বছর থেকে ৮ বছর বয়সী শিশুদের প্রাথমিক মোটর স্কিল ও সঠিক গ্রিপিংয়ের জন্য পারফেক্ট।
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] space-y-1">
                  <strong className="text-sm font-bold text-[#1A1A1A] block">🛡️ কেন অভিভাবকেরা ভালোবাসেন?</strong>
                  <p className="text-xs text-[#6B6B6B]">
                    বাচ্চা মুখে দিলেও কোনো ভয় নেই, এবং সাধারণ সাবান পানিতেই কাপড়ের দাগ উঠে যায়।
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SPECIFICATIONS */}
          {activeTab === 'specs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <tbody className="divide-y divide-[#EFEAE2]">
                  {product.specifications ? (
                    product.specifications.map((spec, i) => (
                      <tr key={i} className="hover:bg-[#FAF7F2]/60">
                        <td className="py-3 px-4 font-bold text-[#1A1A1A] w-1/3 bg-[#FAF7F2]/40">
                          {spec.label}
                        </td>
                        <td className="py-3 px-4 text-[#4A4A4A]">{spec.value}</td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td className="py-3 px-4 font-bold text-[#1A1A1A] w-1/3">উপাদান</td>
                        <td className="py-3 px-4 text-[#4A4A4A]">প্রাকৃতিক মৌচাকের মোম ও ফুড কালার</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-bold text-[#1A1A1A]">বয়সসীমা</td>
                        <td className="py-3 px-4 text-[#4A4A4A]">{product.targetAgeMin}+ বছর</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: CARE INSTRUCTIONS */}
          {activeTab === 'care' && (
            <div className="space-y-3 text-xs sm:text-sm text-[#4A4A4A] leading-relaxed">
              <p>
                {product.careInstructions ||
                  'সরাসরি তীব্র রোদে বা আগুনের কাছে রাখবেন না। সাধারণ ঘরের তাপমাত্রায় ছায়াযুক্ত স্থানে রাখুন।'}
              </p>
              <div className="p-4 rounded-2xl bg-[#E8F5E9]/50 border border-[#C8E6C9] text-xs text-[#1B5E20] space-y-1">
                <strong className="font-bold block">💡 পরিষ্কার করার টিপস:</strong>
                <p>
                  শিশুর জামা বা ফ্লোরে রঙ লাগলে কুসুম গরম পানি ও মৃদু কাপড় ধোয়ার সাবান দিয়ে আলতোভাবে ঘষলে দাগ উঠে যায়।
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: DELIVERY & RETURNS */}
          {activeTab === 'delivery' && (
            <div className="space-y-4 text-xs sm:text-sm text-[#4A4A4A] leading-relaxed">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] space-y-1.5">
                  <strong className="font-bold text-[#1A1A1A] block">🚚 ডেলিভারি সময় ও চার্জ:</strong>
                  <ul className="space-y-1 text-xs list-disc pl-4 text-[#6B6B6B]">
                    <li>ঢাকা সিটির ভেতর: <strong>৳৬০</strong> (২৪ থেকে ৪৮ ঘণ্টা)</li>
                    <li>ঢাকার বাইরে সারা বাংলাদেশ: <strong>৳১২০</strong> (২ থেকে ৩ দিন)</li>
                    <li><strong>৳১,০০০ বা তার বেশি</strong> অর্ডারে ডেলিভারি চার্জ সম্পূর্ণ ফ্রি!</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] space-y-1.5">
                  <strong className="font-bold text-[#1A1A1A] block">🔄 রিটার্ন ও রিপ্লেসমেন্ট শর্ত:</strong>
                  <ul className="space-y-1 text-xs list-disc pl-4 text-[#6B6B6B]">
                    <li>পণ্য হাতে পাওয়ার পর ৭ দিনের মধ্যে যেকোনো সমস্যায় বিনামূল্যে রিটার্ন।</li>
                    <li>ভাঙা বা নষ্ট পণ্য পেলে সাথে সাথে নতুন পণ্য পাঠিয়ে দেওয়া হবে।</li>
                    <li>কুরিয়ার বয় থাকাকালীন পার্সেল খুলে চেক করতে পারবেন।</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FAQ ACCORDION */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              {(product.faqs || [
                {
                  question: 'বাচ্চা মুখে দিলে কি কোনো বিষাক্ত ক্ষতি হবে?',
                  answer: 'না, আমাদের উপাদান ১০০% প্রাকৃতিক ফুড-গ্রেড মোম দিয়ে তৈরি। কোনো টক্সিন বা কেমিক্যাল নেই।'
                },
                {
                  question: 'কাপড়ে লাগলে কি ধুলে উঠবে?',
                  answer: 'হ্যাঁ, এটি ওয়াশেবল। সাবান পানিতে সহজেই পরিষ্কার করা যায়।'
                }
              ]).map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-[#EFEAE2] rounded-2xl overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-[#1A1A1A] hover:bg-[#FAF7F2] cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-[#D32F2F] flex-shrink-0" />
                        {faq.question}
                      </span>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-[#6B6B6B] border-t border-[#EFEAE2]/60 bg-[#FAF7F2]/40">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =====================================================================
            5: SOCIAL PROOF & VERIFIED CUSTOMER REVIEWS
           ===================================================================== */}
        {product.reviews && product.reviews.length > 0 && (
          <div className="bg-white rounded-[28px] border border-[#EFEAE2] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFEAE2]">
              <div>
                <h3 className="font-heading font-black text-xl text-[#1A1A1A]">
                  গ্রাহক রিভিউ ও বাস্তব অভিজ্ঞতা ({product.reviews.length})
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  সবগুলো রিভিউ আমাদের আসল ক্রেতাদের পাঠানো ছবি ও মতামত থেকে সংগৃহীত
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center text-[#F59E0B]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="font-black text-base text-[#1A1A1A]">
                  {product.rating || 4.9} / ৫.০
                </span>
              </div>
            </div>

            {/* Review Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {product.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-[#F59E0B]">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <span className="text-[11px] text-[#8A8A8A]">{rev.date}</span>
                    </div>

                    <p className="text-xs text-[#2B2B2B] leading-relaxed italic">
                      &quot;{rev.comment}&quot;
                    </p>

                    {/* Customer Photos */}
                    {rev.photos && rev.photos.length > 0 && (
                      <div className="flex gap-2 pt-1">
                        {rev.photos.map((ph, pi) => (
                          <div
                            key={pi}
                            className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#E5E0D8]"
                          >
                            <Image src={ph} alt="Customer photo" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#E5E0D8]/60 flex items-center justify-between text-[11px]">
                    <div>
                      <strong className="text-[#1A1A1A] block">{rev.author}</strong>
                      {rev.location && <span className="text-[#8A8A8A]">{rev.location}</span>}
                    </div>
                    {rev.isVerified && (
                      <span className="px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] font-bold text-[10px]">
                        ✓ ভেরিফাইড ক্রেতা
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            6: FREQUENTLY BOUGHT TOGETHER / COMBO OFFER
           ===================================================================== */}
        <div className="bg-gradient-to-r from-[#FFF5F5] via-[#FFF9F0] to-[#FFF5F5] border-2 border-[#FFCDD2] rounded-[28px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D32F2F] text-white shadow-xs">
              <Gift className="w-3.5 h-3.5" />
              একসাথে কিনুন এবং আরও বেশি সাশ্রয় করুন!
            </span>
            <h3 className="font-heading font-black text-xl sm:text-2xl text-[#1A1A1A]">
              {product.titleBn} + আর্ট স্কেচ প্যাড কম্বো
            </h3>
            <p className="text-xs sm:text-sm text-[#6B6B6B] max-w-lg">
              মোমের রঙের সাথে প্রিমিয়াম আর্ট ও ড্রয়িং স্কেচ প্যাড একসাথে নিলে পাচ্ছেন অতিরিক্ত ৳১৫০ ছাড় ও ফ্রি গিফট বক্স।
            </p>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-[#D32F2F]">৳৪৫০</span>
              <span className="block text-xs line-through text-[#8A8A8A]">৳৬০০</span>
            </div>
            <button
              onClick={handleAddCombo}
              className="py-3 px-5 rounded-2xl bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              কম্বোটি কার্টে নিন
            </button>
          </div>
        </div>

        {/* =====================================================================
            RELATED PRODUCTS GRID
           ===================================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-xl text-[#1A1A1A]">
              সম্পর্কিত পণ্যসমূহ (Related Products)
            </h3>
            <Link href="/shop" className="text-xs font-bold text-[#D32F2F] hover:underline flex items-center gap-1">
              সব দেখুন <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.slug}
                id={p.slug}
                slug={p.slug}
                title={p.titleBn}
                price={p.basePrice}
                salePrice={p.baseSalePrice}
                imageUrl={p.imageUrl}
                ageBadgeText={`${p.targetAgeMin}+ বছর`}
                safetyBadgeText="১০০% নিরাপদ"
              />
            ))}
          </div>
        </div>

        {/* =====================================================================
            RECENTLY VIEWED PRODUCTS (FROM LOCALSTORAGE)
           ===================================================================== */}
        {recentlyViewed.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-[#EFEAE2]">
            <h3 className="font-heading font-black text-lg text-[#1A1A1A]">
              সম্প্রতি দেখা পণ্যসমূহ (Recently Viewed)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {recentlyViewed.map((p) => (
                <ProductCard
                  key={p.slug}
                  id={p.slug}
                  slug={p.slug}
                  title={p.titleBn}
                  price={p.basePrice}
                  salePrice={p.baseSalePrice}
                  imageUrl={p.imageUrl}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          LIGHTBOX ZOOM MODAL
         ========================================================================= */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-[#D32F2F] p-2 cursor-pointer z-10"
              title="বন্ধ করুন"
            >
              <X className="w-7 h-7" />
            </button>
            <div className="relative w-full aspect-square max-h-[80vh] rounded-2xl overflow-hidden bg-white">
              <Image
                src={galleryImages[activeImageIndex] || product.imageUrl}
                alt={product.titleBn}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MOBILE STICKY "ORDER NOW" BUY BAR (CONVERSION BOOSTER)
         ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-[#EFEAE2] p-3 px-4 flex items-center justify-between gap-3 shadow-[0_-8px_25px_rgba(0,0,0,0.08)]">
        <div>
          <span className="text-[11px] text-[#6B6B6B] block">মোট মূল্য:</span>
          <span className="text-xl font-black text-[#D32F2F]">
            {formatBDT(currentPrice * quantity)}
          </span>
        </div>

        <button
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className="flex-1 max-w-[210px] py-3 px-4 rounded-xl bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>{isOutOfStock ? 'স্টক শেষ' : 'Buy Now'}</span>
        </button>
      </div>

      <MobileBottomNav activeTab="shop" />
    </div>
  );
}

export default function SingleProductPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs">লোড হচ্ছে...</div>}>
      <ProductContent />
    </Suspense>
  );
}
