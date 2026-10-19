'use client';

import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
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
  AlertCircle,
  Zap,
  ArrowRight,
  Share2,
  Home,
  ChevronLeft,
  ChevronRight,
  Film,
  Camera,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getProductBySlug, getAllProducts } from '@/lib/store';
import { SampleProduct, getProductMedia, ProductVideo } from '@/lib/sample-data';
import { formatBDT } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

function ProductContent() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || 'craftykidsco-natural-wax-crayons-24-shades';
  const { addItem, cartCount } = useCart();

  const allProducts = getAllProducts();
  const product: SampleProduct = getProductBySlug(slug) || allProducts[0];

  // 1 Main Image, 4-5 Supporting Images, 1-2 Product Short Videos
  const { images: galleryImages, videos: productVideos } = useMemo(() => {
    return getProductMedia(product);
  }, [product]);

  // Unified Media State: type 'image' or 'video'
  type MediaType = 'image' | 'video';
  const [activeMedia, setActiveMedia] = useState<{ type: MediaType; index: number }>({
    type: 'image',
    index: 0,
  });
  const [mediaFilter, setMediaFilter] = useState<'all' | 'images' | 'videos'>('all');
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const mainVideoRef = useRef<HTMLVideoElement | null>(null);

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
  const [activeTab, setActiveTab] = useState<'desc' | 'videos' | 'specs' | 'care' | 'delivery' | 'faq'>('desc');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Recently Viewed state
  const [recentlyViewed, setRecentlyViewed] = useState<SampleProduct[]>([]);

  // When variation changes, update active image if variation has custom image
  const handleSelectVariation = (idx: number) => {
    setSelectedVariationIndex(idx);
    setVariationError(null);
    const chosen = variations[idx];
    if (chosen?.imageUrl) {
      const foundIdx = galleryImages.findIndex((img) => img === chosen.imageUrl);
      if (foundIdx !== -1) {
        setActiveMedia({ type: 'image', index: foundIdx });
      }
    }
  };

  // Next / Prev Media Navigation
  const handlePrevMedia = () => {
    if (activeMedia.type === 'image') {
      if (activeMedia.index > 0) {
        setActiveMedia({ type: 'image', index: activeMedia.index - 1 });
      } else {
        // cycle to last video if available, else last image
        if (productVideos.length > 0) {
          setActiveMedia({ type: 'video', index: productVideos.length - 1 });
        } else {
          setActiveMedia({ type: 'image', index: galleryImages.length - 1 });
        }
      }
    } else {
      if (activeMedia.index > 0) {
        setActiveMedia({ type: 'video', index: activeMedia.index - 1 });
      } else {
        setActiveMedia({ type: 'image', index: galleryImages.length - 1 });
      }
    }
  };

  const handleNextMedia = () => {
    if (activeMedia.type === 'image') {
      if (activeMedia.index < galleryImages.length - 1) {
        setActiveMedia({ type: 'image', index: activeMedia.index + 1 });
      } else {
        if (productVideos.length > 0) {
          setActiveMedia({ type: 'video', index: 0 });
        } else {
          setActiveMedia({ type: 'image', index: 0 });
        }
      }
    } else {
      if (activeMedia.index < productVideos.length - 1) {
        setActiveMedia({ type: 'video', index: activeMedia.index + 1 });
      } else {
        setActiveMedia({ type: 'image', index: 0 });
      }
    }
  };

  // Track Recently Viewed & JSON-LD
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ckc_recently_viewed');
        const list: string[] = stored ? JSON.parse(stored) : [];
        if (!list.includes(product.slug)) {
          const updated = [product.slug, ...list.filter((s) => s !== product.slug)].slice(0, 6);
          localStorage.setItem('ckc_recently_viewed', JSON.stringify(updated));
        }

        const recentItems = list
          .filter((s) => s !== product.slug)
          .map((s) => getProductBySlug(s))
          .filter(Boolean) as SampleProduct[];
        setRecentlyViewed(recentItems.slice(0, 4));
      } catch {}

      if ((window as any).fbq) {
        (window as any).fbq('track', 'ViewContent', {
          content_name: product.titleEn,
          content_category: product.categorySlug,
          value: currentPrice,
          currency: 'BDT',
        });
      }
    }
  }, [product.slug, currentPrice, product.titleEn, product.categorySlug]);

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

    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'AddToCart', {
        content_name: product.titleEn,
        value: currentPrice * quantity,
        currency: 'BDT',
      });
    }

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  // Direct Buy Now handler -> Adds to Cart & Routes directly to Checkout
  const handleBuyNow = () => {
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

    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', {
        content_name: product.titleEn,
        value: currentPrice * quantity,
        currency: 'BDT',
      });
    }

    router.push('/checkout');
  };

  // Add Combo Bundle
  const handleAddCombo = () => {
    handleAddToCart();
    const sketchbook = allProducts.find((p) => p.categorySlug === 'sketchbooks');
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
    setTimeout(() => setAddedToast(false), 2500);
  };

  // Share link handler
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      if (navigator.share) {
        navigator.share({
          title: product.titleBn,
          text: `${product.titleBn} - CraftyKidsCo`,
          url: window.location.href,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    }
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

  const activeVideo = activeMedia.type === 'video' ? productVideos[activeMedia.index] : null;

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-28 md:pb-16 text-[#2B2B2B]">
      <Header />

      {/* SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="text-xs text-[#6B6B6B] flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-[#E53935] flex items-center gap-1 font-medium">
            <Home className="w-3.5 h-3.5" /> হোম
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#E53935] font-medium">
            সব পণ্য
          </Link>
          <span>/</span>
          {product.categorySlug && (
            <>
              <Link href={`/category/${product.categorySlug}`} className="hover:text-[#E53935] capitalize font-medium">
                {product.categorySlug.replace('-', ' ')}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="font-bold text-[#2B2B2B] truncate max-w-xs">{product.titleBn}</span>
        </div>

        {/* =====================================================================
            1 & 2: REDESIGNED MEDIA GALLERY + CORE BUY BOX
           ===================================================================== */}
        <div className="bg-white rounded-3xl sm:rounded-[32px] border border-[#EFEAE2] p-4 sm:p-7 lg:p-9 shadow-[0_4px_25px_rgba(43,43,43,0.04)] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* ================================================================
              LEFT: REDESIGNED MULTI-IMAGE & SHORT VIDEO GALLERY (col-span-7)
             ================================================================ */}
          <div className="lg:col-span-7 space-y-4">
            {/* Top Media Filters Strip */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMediaFilter('all')}
                  className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                    mediaFilter === 'all'
                      ? 'bg-[#1F1F1F] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#666] hover:text-black'
                  }`}
                >
                  সব মিডিয়া ({galleryImages.length + productVideos.length})
                </button>
                <button
                  onClick={() => {
                    setMediaFilter('images');
                    if (activeMedia.type === 'video') setActiveMedia({ type: 'image', index: 0 });
                  }}
                  className={`px-3 py-1 rounded-full font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    mediaFilter === 'images'
                      ? 'bg-[#E53935] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#666] hover:text-[#E53935]'
                  }`}
                >
                  <Camera className="w-3 h-3" />
                  <span>ছবি ({galleryImages.length})</span>
                </button>
                <button
                  onClick={() => {
                    setMediaFilter('videos');
                    setActiveMedia({ type: 'video', index: 0 });
                  }}
                  className={`px-3 py-1 rounded-full font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    mediaFilter === 'videos'
                      ? 'bg-[#E53935] text-white shadow-xs'
                      : 'bg-[#FFF3E6] text-[#E53935] hover:bg-[#FFE0B2]'
                  }`}
                >
                  <Film className="w-3 h-3" />
                  <span>শর্ট ভিডিও ({productVideos.length})</span>
                </button>
              </div>

              {/* Share & Counter */}
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-[11px] font-bold text-[#888] bg-[#FAF7F2] px-2.5 py-0.5 rounded-full border border-[#EFEAE2]">
                  {activeMedia.type === 'image'
                    ? `📷 ছবি ${activeMedia.index + 1} / ${galleryImages.length}`
                    : `🎥 ভিডিও ${activeMedia.index + 1} / ${productVideos.length}`}
                </span>
                <button
                  onClick={handleShare}
                  className="p-1.5 rounded-full hover:bg-[#FAF7F2] text-[#666] hover:text-[#E53935] transition-colors cursor-pointer"
                  title="শেয়ার করুন"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                {copiedLink && (
                  <span className="text-[10px] text-[#2E7D32] font-bold bg-[#E8F5E9] px-2 py-0.5 rounded-full">
                    লিংক কপি হয়েছে!
                  </span>
                )}
              </div>
            </div>

            {/* Main Stage Display (Image or Video) */}
            <div className="relative aspect-square sm:aspect-[4/3] lg:aspect-square w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#FAF7F2] border border-[#EFEAE2] shadow-inner group flex items-center justify-center">
              {activeMedia.type === 'video' && activeVideo ? (
                /* --- INLINE VIDEO PLAYER --- */
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <video
                    ref={mainVideoRef}
                    key={activeVideo.url}
                    src={activeVideo.url}
                    controls
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-contain"
                  />

                  {/* Video Title Overlay Tag */}
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-bold shadow-md">
                    <span className="w-2 h-2 rounded-full bg-[#E53935] animate-pulse" />
                    <span>{activeVideo.titleBn}</span>
                    <span className="text-white/60 text-[10px]">({activeVideo.duration})</span>
                  </div>

                  {/* Audio Toggle Button */}
                  <button
                    onClick={() => {
                      if (mainVideoRef.current) {
                        mainVideoRef.current.muted = !isMuted;
                        setIsMuted(!isMuted);
                      }
                    }}
                    className="absolute bottom-3 right-14 z-20 p-2 rounded-full bg-black/75 backdrop-blur-md text-white hover:bg-black transition-colors"
                    title={isMuted ? 'সাউন্ড চালু করুন' : 'সাউন্ড মিউট করুন'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  {/* Switch to Photos Button */}
                  <button
                    onClick={() => setActiveMedia({ type: 'image', index: 0 })}
                    className="absolute top-3 right-3 z-20 bg-white/90 hover:bg-white text-[#2B2B2B] p-1.5 rounded-full shadow-md transition-colors"
                    title="ছবিতে ফিরে যান"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* --- HIGH-RES IMAGE STAGE --- */
                <>
                  <Image
                    src={galleryImages[activeMedia.index] || product.imageUrl}
                    alt={product.titleBn}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 55vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Overlays: Safety & Age Badges */}
                  <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-10 pointer-events-none">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5E9]/95 backdrop-blur-xs text-[#2E7D32] border border-[#C8E6C9] shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" /> ১০০% নন-টক্সিক ও নিরাপদ
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#E0F2FE]/95 backdrop-blur-xs text-[#0369A1] border border-[#BAE6FD] shadow-xs">
                      {product.targetAgeMin}+ বছর বয়সীদের জন্য
                    </span>
                  </div>

                  {/* Discount Badge */}
                  {discountPercent > 0 && (
                    <div className="absolute top-3.5 right-3.5 z-10">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-[#E53935] text-white shadow-md">
                        -{discountPercent}% ছাড়
                      </span>
                    </div>
                  )}

                  {/* Floating Media Pill on Mobile */}
                  <div className="absolute bottom-3.5 left-3.5 z-10 sm:hidden">
                    <span className="text-[10px] font-bold text-white bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full">
                      {activeMedia.index + 1} / {galleryImages.length}
                    </span>
                  </div>

                  {/* Zoom Lightbox Trigger Button */}
                  <button
                    onClick={() => setIsZoomOpen(true)}
                    className="absolute bottom-3.5 right-3.5 p-2 rounded-xl bg-white/90 hover:bg-white text-[#2B2B2B] shadow-md transition-all duration-200 cursor-pointer flex items-center gap-1 text-xs font-bold z-10"
                    title="জুম করে দেখুন"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">জুম</span>
                  </button>
                </>
              )}

              {/* Prev / Next Navigation Arrows */}
              <button
                onClick={handlePrevMedia}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-[#2B2B2B] shadow-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 z-20 cursor-pointer"
                title="পূর্ববর্তী"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMedia}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-[#2B2B2B] shadow-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 z-20 cursor-pointer"
                title="পরবর্তী"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* ================================================================
                THUMBNAILS ROW: 1 Main + 4-5 Supporting Images + 1-2 Short Videos
               ================================================================ */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {/* IMAGE THUMBNAILS */}
              {galleryImages.map((img, idx) => {
                const isActive = activeMedia.type === 'image' && activeMedia.index === idx;
                if (mediaFilter === 'videos') return null;
                return (
                  <button
                    key={`img-${idx}`}
                    onClick={() => setActiveMedia({ type: 'image', index: idx })}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#FAF7F2] border-2 transition-all cursor-pointer flex-shrink-0 group ${
                      isActive
                        ? 'border-[#E53935] shadow-md ring-2 ring-[#E53935]/20 scale-95'
                        : 'border-[#EFEAE2] hover:border-[#E53935]/60 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                    {idx === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5">
                        মেইন
                      </span>
                    )}
                  </button>
                );
              })}

              {/* VIDEO THUMBNAILS (1-2 Short Videos) */}
              {productVideos.map((vid, vIdx) => {
                const isActive = activeMedia.type === 'video' && activeMedia.index === vIdx;
                if (mediaFilter === 'images') return null;
                return (
                  <button
                    key={vid.id || `vid-${vIdx}`}
                    onClick={() => setActiveMedia({ type: 'video', index: vIdx })}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-black border-2 transition-all cursor-pointer flex-shrink-0 group ${
                      isActive
                        ? 'border-[#E53935] shadow-md ring-2 ring-[#E53935]/20 scale-95'
                        : 'border-[#FFC93C] hover:border-[#E53935]'
                    }`}
                    title={vid.titleBn}
                  >
                    {/* Background poster/preview */}
                    <Image
                      src={vid.thumbnailUrl || galleryImages[vIdx] || product.imageUrl}
                      alt={vid.titleBn}
                      fill
                      className="object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                    />

                    {/* Glowing Red Play Center Icon */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 z-10">
                      <div className="w-6 h-6 rounded-full bg-[#E53935] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </div>
                      <span className="text-[9px] font-black text-white drop-shadow-md">
                        ভিডিও {vIdx + 1}
                      </span>
                    </div>

                    {/* Duration badge */}
                    {vid.duration && (
                      <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-mono px-1 rounded">
                        {vid.duration}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ================================================================
                DEDICATED SHORT VIDEO SHOWCASE BANNER
               ================================================================ */}
            <div className="rounded-2xl bg-gradient-to-r from-[#FFF5F5] via-[#FFF9F0] to-[#E8F7FD] border border-[#FFCDD2] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E53935] text-white flex items-center justify-center shadow-sm shrink-0">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-[#1F1F1F]">
                    বাচ্চাদের খেলার রিয়েল ডেমো ভিডিও দেখুন!
                  </h4>
                  <p className="text-[11px] text-[#666]">
                    কীভাবে ব্যবহার করতে হয় ও আনবক্সিং অভিজ্ঞতা সরাসরি ভিডিওতে দেখুন
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {productVideos.map((v, i) => (
                  <button
                    key={v.id || i}
                    onClick={() => setActiveMedia({ type: 'video', index: i })}
                    className="px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF7F2] border border-[#E53935]/40 text-[#E53935] text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>ভিডিও {i + 1} ({v.duration})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ================================================================
              RIGHT: REDESIGNED BUY BOX & HIGH-CONVERSION ACTIONS (col-span-5)
             ================================================================ */}
          <div className="lg:col-span-5 space-y-5">
            {/* Scarcity & Stock Badges */}
            <div className="flex items-center justify-between gap-2 text-xs">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
                  <AlertCircle className="w-3.5 h-3.5" /> স্টক শেষ (শীঘ্রই আসছে)
                </span>
              ) : isLowStock ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] animate-pulse">
                  <Clock className="w-3.5 h-3.5" /> মাত্র {currentStock}টি স্টকে বাকি - দ্রুত অর্ডার করুন!
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ইন স্টক (রেডি টু শিপ)
                </span>
              )}

              <span className="text-[#8A8A8A] font-mono text-[11px]">
                SKU: {currentVariation?.sku || product.slug.slice(0, 10).toUpperCase()}
              </span>
            </div>

            {/* Product Title */}
            <div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#1F1F1F] leading-snug">
                {product.titleBn}
              </h1>
              <span className="text-xs text-[#777] font-medium tracking-wide mt-1 block">
                {product.titleEn}
              </span>

              {/* Rating & Social Proof */}
              <div className="mt-2.5 flex items-center gap-2 text-xs flex-wrap">
                <div className="flex items-center text-[#F59E0B]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className="font-bold text-[#1A1A1A]">{product.rating || 4.9}</span>
                <span className="text-[#888]">
                  ({product.reviewCount || 48} জন অভিভাবকের রেটিং)
                </span>
                <span className="text-[#CCC]">•</span>
                <span className="text-[#2E7D32] font-semibold bg-[#E8F5E9] px-2 py-0.5 rounded-full text-[11px]">
                  ✓ ৯৮% পজিটিভ মতামত
                </span>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="p-4 rounded-2xl bg-[#FFF8F6] border border-[#FADCD5] flex items-baseline justify-between gap-3 flex-wrap">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl sm:text-4xl font-black text-[#E53935]">
                  {formatBDT(currentPrice)}
                </span>
                {currentOriginalPrice > currentPrice && (
                  <span className="text-base text-[#888] line-through font-semibold">
                    {formatBDT(currentOriginalPrice)}
                  </span>
                )}
              </div>

              {currentOriginalPrice > currentPrice && (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#E53935] text-white shadow-xs">
                  সাশ্রয় ৳{currentOriginalPrice - currentPrice} (-{discountPercent}%)
                </span>
              )}
            </div>

            {/* Variant Selector (If Variable Product) */}
            {variations.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-[#EFEAE2]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1A1A1A]">
                    সাইজ বা ভ্যারিয়েন্ট নির্বাচন করুন:
                  </span>
                  <span className="font-bold text-[#E53935]">
                    {currentVariation?.titleBn}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {variations.map((v, idx) => {
                    const isSelected = selectedVariationIndex === idx;
                    return (
                      <button
                        key={v.sku}
                        type="button"
                        onClick={() => handleSelectVariation(idx)}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-2 border-[#E53935] bg-[#FDE8E8]/40 shadow-xs ring-1 ring-[#E53935]/20'
                            : 'border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#E53935]/60'
                        }`}
                      >
                        <span className="text-xs font-bold text-[#1F1F1F] truncate">
                          {v.titleBn}
                        </span>
                        <div className="mt-1 flex items-baseline justify-between text-[11px]">
                          <span className="font-black text-[#E53935]">
                            ৳{v.salePrice || v.price}
                          </span>
                          <span className="text-[#888]">
                            {v.stock <= 10 ? `বাকি ${v.stock}` : 'স্টকে আছে'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {variationError && (
                  <p className="text-xs font-bold text-[#E53935] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {variationError}
                  </p>
                )}
              </div>
            )}

            {/* Quantity Stepper */}
            <div className="space-y-2 pt-2 border-t border-[#EFEAE2]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1A1A]">অর্ডারের পরিমাণ:</span>
                <div className="flex items-center bg-[#FAF7F2] border border-[#E5E0D8] rounded-full p-1 shadow-inner">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#2B2B2B] hover:text-[#E53935] shadow-xs cursor-pointer disabled:opacity-40 transition-colors"
                    title="কমান"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                    disabled={quantity >= currentStock}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#2B2B2B] hover:text-[#E53935] shadow-xs cursor-pointer disabled:opacity-40 transition-colors"
                    title="বাড়ান"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* High-Impact Action CTAs */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Direct Order Now (Cash on Delivery) */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="py-3.5 px-4 rounded-2xl bg-[#E53935] hover:bg-[#D32F2F] active:scale-[0.98] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(229,57,53,0.35)] hover:shadow-[0_6px_22px_rgba(229,57,53,0.45)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>সরাসরি অর্ডার করুন</span>
                </button>

                {/* 2. Add to Cart */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                    addedToast
                      ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]'
                      : 'bg-[#FFC93C] hover:bg-[#F6BA22] active:scale-[0.98] text-[#1F1F1F] border-[#FFC93C] shadow-sm'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {addedToast ? (
                    <>
                      <Check className="w-4 h-4 text-[#2E7D32]" />
                      <span>কার্টে যুক্ত হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>কার্টে যোগ করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Direct WhatsApp & Hotline Ordering */}
            <div className="bg-[#E8F5E9]/60 border border-[#C8E6C9] rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5 text-center sm:text-left">
                <span className="font-bold text-[#1B5E20] block">
                  সরাসরি কথা বলে বা হোয়াটসঅ্যাপে অর্ডার করতে চান?
                </span>
                <span className="text-[#2E7D32] text-[11px]">
                  আমাদের প্রতিনিধি আপনাকে অর্ডার ও ডেলিভারি বুঝিয়ে দেবেন
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={`https://wa.me/8801700000000?text=${encodeURIComponent(
                    `আসসালামু আলাইকুম, আমি '${product.titleBn}' অর্ডার করতে চাই। লিংক: https://craftykidsco.com/product/${product.slug}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> হোয়াটসঅ্যাপ
                </a>

                <a
                  href="tel:+8801700000000"
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#C8E6C9] text-[#1B5E20] hover:bg-[#F1F8F2] font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" /> কল করুন
                </a>
              </div>
            </div>

            {/* 4 Guarantees & Trust Assurances */}
            <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EFEAE2] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#2B2B2B]">
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-[#0284C7] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[#1A1A1A]">সারা বাংলাদেশে হোম ডেলিভারি</strong>
                  <span className="text-[#6B6B6B] text-[11px]">ঢাকা ৳৬০ (২৪-৪৮ ঘণ্টা), বাইরে ৳১২০। ৳১০০০+ এ ফ্রি!</span>
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
                  <span className="text-[#6B6B6B] text-[11px]">ভাঙা বা নষ্ট পেলে দ্রুত বিনামূল্যে পরিবর্তন</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#E53935] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[#1A1A1A]">১০০% ফুড-গ্রেড ও নন-টক্সিক</strong>
                  <span className="text-[#6B6B6B] text-[11px]">শিশুর নরম ত্বক ও স্পর্শের জন্য সম্পূর্ণ নিরাপদ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            3: PRODUCT DETAILS TABS (DESCRIPTION, VIDEOS, SPECS, CARE, FAQ)
           ===================================================================== */}
        <div className="bg-white rounded-3xl sm:rounded-[28px] border border-[#EFEAE2] p-5 sm:p-8 shadow-xs space-y-6">
          {/* Tabs Navigation Header */}
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[#EFEAE2] scrollbar-none text-xs sm:text-sm font-bold">
            {[
              { id: 'desc', label: 'বিস্তারিত বিবরণ' },
              { id: 'videos', label: `ভিডিও ও ডেমো (${productVideos.length})` },
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
                    ? 'bg-[#E53935] text-white shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FAF7F2]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: DESCRIPTION */}
          {activeTab === 'desc' && (
            <div className="space-y-5 text-xs sm:text-sm text-[#4A4A4A] leading-relaxed">
              <p className="text-sm sm:text-base font-normal leading-relaxed text-[#333]">
                {product.description ||
                  `${product.titleBn} শিশুদের সৃজনশীলতা, কল্পনাশক্তি ও আনন্দময় সময়ের জন্য বিশেষভাবে প্রস্তুত করা হয়েছে। এটি শিশুদের জন্য সম্পূর্ণ নন-টক্সিক ও নিরাপদ।`}
              </p>

              {/* 3 Pillars Box */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] space-y-1">
                  <strong className="text-sm font-bold text-[#1A1A1A] block">🎨 কী এবং কীভাবে তৈরি?</strong>
                  <p className="text-xs text-[#6B6B6B]">
                    ১০০% খাঁটি পরিবেশবান্ধব কাঁচামাল ও ফুড-গ্রেড পিগমেন্ট। ক্ষতিকর সিন্থেটিক কেমিক্যাল ও ভারী ধাতু মুক্ত।
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] space-y-1">
                  <strong className="text-sm font-bold text-[#1A1A1A] block">👶 কার জন্য উপযুক্ত?</strong>
                  <p className="text-xs text-[#6B6B6B]">
                    {product.targetAgeMin} থেকে {product.targetAgeMax} বছর বয়সী শিশুদের হ্যান্ড-আই কোঅর্ডিনেশন ও মেধার বিকাশের জন্য উপযুক্ত।
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] space-y-1">
                  <strong className="text-sm font-bold text-[#1A1A1A] block">🛡️ কেন অভিভাবকেরা নিশ্চিন্ত?</strong>
                  <p className="text-xs text-[#6B6B6B]">
                    বাচ্চা মুখে দিলেও কোনো ভয় নেই, এবং সাধারণ সাবান পানিতেই কাপড় বা ফ্লোরের দাগ সহজে উঠে যায়।
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VIDEOS & DEMOS SHOWCASE */}
          {activeTab === 'videos' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-heading font-black text-lg text-[#1F1F1F]">
                  পণ্য ব্যবহারের ভিডিও ও আনবক্সিং ডেমো
                </h4>
                <p className="text-xs text-[#666] mt-0.5">
                  নিচের ভিডিওগুলোতে পণ্যটির বাস্তব আকার, কোয়ালিটি এবং শিশুদের খেলার অভিজ্ঞতা দেখুন:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {productVideos.map((vid, idx) => (
                  <div
                    key={vid.id || idx}
                    className="rounded-2xl border border-[#EFEAE2] overflow-hidden bg-[#FAF7F2] p-3 space-y-3 shadow-xs"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
                      <video
                        src={vid.url}
                        controls
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-xs sm:text-sm font-bold text-[#1F1F1F] block">
                          {vid.titleBn}
                        </strong>
                        <span className="text-[11px] text-[#777]">{vid.title}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#E53935] bg-[#FFF3E6] px-2 py-0.5 rounded-full">
                        {vid.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SPECIFICATIONS */}
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
                        <td className="py-3 px-4 font-bold text-[#1A1A1A] w-1/3 bg-[#FAF7F2]/40">উপাদান</td>
                        <td className="py-3 px-4 text-[#4A4A4A]">প্রাকৃতিক মৌচাকের মোম, ফুড কালার ও নন-টক্সিক উপাদান</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-bold text-[#1A1A1A] w-1/3 bg-[#FAF7F2]/40">বয়সসীমা</td>
                        <td className="py-3 px-4 text-[#4A4A4A]">{product.targetAgeMin}+ বছর থেকে {product.targetAgeMax} বছর</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-bold text-[#1A1A1A] w-1/3 bg-[#FAF7F2]/40">সার্টিফিকেশন</td>
                        <td className="py-3 px-4 text-[#4A4A4A]">১০০% নন-টক্সিক ও শিশুদের জন্য নিরাপদ সার্টিফাইড</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: CARE INSTRUCTIONS */}
          {activeTab === 'care' && (
            <div className="space-y-3 text-xs sm:text-sm text-[#4A4A4A] leading-relaxed">
              <p>
                {product.careInstructions ||
                  'সরাসরি তীব্র রোদে বা আগুনের কাছে রাখবেন না। সাধারণ ঘরের তাপমাত্রায় ছায়াযুক্ত স্থানে রাখুন।'}
              </p>
              <div className="p-4 rounded-2xl bg-[#E8F5E9]/60 border border-[#C8E6C9] text-xs text-[#1B5E20] space-y-1">
                <strong className="font-bold block">💡 পরিষ্কার করার সহজ উপায়:</strong>
                <p>
                  শিশুর জামা বা ফ্লোরে রঙ লাগলে কুসুম গরম পানি ও মৃদু কাপড় ধোয়ার সাবান দিয়ে আলতোভাবে ঘষলেই দাগ উঠে যায়।
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: DELIVERY & RETURNS */}
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

          {/* TAB 6: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              {(product.faqs || [
                {
                  question: 'বাচ্চা মুখে দিলে কি কোনো ক্ষতি হবে?',
                  answer: 'না, আমাদের মোমের রঙ ও আর্ট উপাদানগুলো ১০০% খাদ্য-মানের ও প্রাকৃতিক উপাদান দিয়ে তৈরি, এতে কোনো ক্ষতিকর কেমিক্যাল বা বিষাক্ত পদার্থ নেই।'
                },
                {
                  question: 'কাপড়ে বা দেওয়ালে রঙ লাগলে কীভাবে তুলব?',
                  answer: 'এটি সম্পূর্ণ ওয়াশেবল রঙ। সাধারণ পানিতে সাবান দিয়ে ধুয়ে নিলেই কাপড় বা মেঝে থেকে সহজেই উঠে যায়।'
                },
                {
                  question: 'পণ্য পছন্দ না হলে কি রিটার্ন করা যাবে?',
                  answer: 'জি, ডেলিভারির ৭ দিনের মধ্যে কোনো ত্রুটি থাকলে সরাসরি সম্পূর্ণ মূল্য ফেরত বা রিপ্লেসমেন্ট সুবিধা রয়েছে।'
                }
              ]).map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#EFEAE2] bg-[#FAF7F2] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full p-4 text-left font-bold text-xs sm:text-sm text-[#1A1A1A] flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    {openFaqIndex === idx ? <ChevronUp className="w-4 h-4 shrink-0 text-[#E53935]" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                  </button>
                  {openFaqIndex === idx && (
                    <div className="p-4 pt-0 text-xs sm:text-sm text-[#666] leading-relaxed border-t border-[#EFEAE2]/60 bg-white">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =====================================================================
            4: CUSTOMER REVIEWS
           ===================================================================== */}
        {product.reviews && product.reviews.length > 0 && (
          <div className="bg-white rounded-3xl sm:rounded-[28px] border border-[#EFEAE2] p-5 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFEAE2]">
              <div>
                <h3 className="font-heading font-black text-xl text-[#1A1A1A]">
                  অভিভাবকদের বাস্তব অভিজ্ঞতা ও রিভিউ ({product.reviews.length})
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
            5: FREQUENTLY BOUGHT TOGETHER / COMBO OFFER
           ===================================================================== */}
        <div className="bg-gradient-to-r from-[#FFF5F5] via-[#FFF9F0] to-[#FFF5F5] border-2 border-[#FFCDD2] rounded-3xl sm:rounded-[28px] p-5 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E53935] text-white shadow-xs">
              <Gift className="w-3.5 h-3.5" />
              একসাথে কিনুন এবং আরও বেশি সাশ্রয় করুন!
            </span>
            <h3 className="font-heading font-black text-xl sm:text-2xl text-[#1A1A1A]">
              {product.titleBn} + আর্ট স্কেচ প্যাড কম্বো
            </h3>
            <p className="text-xs sm:text-sm text-[#6B6B6B] max-w-lg">
              পণ্যটির সাথে প্রিমিয়াম আর্ট ও ড্রয়িং স্কেচ প্যাড একসাথে নিলে পাচ্ছেন অতিরিক্ত ৳১৫০ ছাড় ও আকর্ষণীয় গিফট প্যাকেজিং।
            </p>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-[#E53935]">৳৪৫০</span>
              <span className="block text-xs line-through text-[#8A8A8A]">৳৬০০</span>
            </div>
            <button
              onClick={handleAddCombo}
              className="py-3 px-5 rounded-2xl bg-[#E53935] hover:bg-[#D32F2F] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              কম্বোটি কার্টে নিন
            </button>
          </div>
        </div>

        {/* =====================================================================
            6: RELATED PRODUCTS GRID
           ===================================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-xl text-[#1A1A1A]">
              সম্পর্কিত অন্যান্য পণ্যসমূহ
            </h3>
            <Link href="/shop" className="text-xs font-bold text-[#E53935] hover:underline flex items-center gap-1">
              সব পণ্য দেখুন <ArrowRight className="w-3.5 h-3.5" />
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
            7: RECENTLY VIEWED PRODUCTS
           ===================================================================== */}
        {recentlyViewed.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-[#EFEAE2]">
            <h3 className="font-heading font-black text-lg text-[#1A1A1A]">
              সম্প্রতি দেখা পণ্যসমূহ
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

      {/* Centralized Footer */}
      <Footer />

      {/* =========================================================================
          LIGHTBOX ZOOM MODAL (FOR HIGH-RES PHOTO INSPECTION)
         ========================================================================= */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-[#E53935] p-2 cursor-pointer z-10"
              title="বন্ধ করুন"
            >
              <X className="w-7 h-7" />
            </button>
            <div className="relative w-full aspect-square max-h-[80vh] rounded-2xl overflow-hidden bg-white shadow-2xl">
              <Image
                src={galleryImages[activeMedia.index] || product.imageUrl}
                alt={product.titleBn}
                fill
                className="object-contain"
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveMedia({ type: 'image', index: i })}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 relative transition-all ${
                    activeMedia.type === 'image' && activeMedia.index === i
                      ? 'border-[#E53935] scale-105'
                      : 'border-white/40 opacity-70'
                  }`}
                >
                  <Image src={img} alt="Thumbnail" fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MOBILE STICKY "ORDER NOW" BUY BAR (CONVERSION BOOSTER)
         ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-[#EFEAE2] py-2 px-3 flex items-center justify-between gap-2 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] pb-safe">
        {/* Quick Product Thumb & Price */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#EFEAE2] shrink-0">
            <Image
              src={galleryImages[0] || product.imageUrl}
              alt={product.titleBn}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-[#1F1F1F] truncate leading-tight">
              {product.titleBn}
            </span>
            <span className="text-xs font-black text-[#E53935]">
              {formatBDT(currentPrice)}
            </span>
          </div>
        </div>

        {/* Action Buttons: Add to Cart + Buy Now */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="p-2.5 rounded-xl bg-[#FFF8F6] text-[#E53935] border border-[#FADCD5] font-bold text-xs flex items-center justify-center active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="কার্টে যোগ"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>

          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="py-2.5 px-3.5 rounded-xl bg-[#E53935] hover:bg-[#D32F2F] text-white font-black text-xs flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="whitespace-nowrap">{isOutOfStock ? 'স্টক শেষ' : 'অর্ডার করুন'}</span>
          </button>
        </div>
      </div>
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
