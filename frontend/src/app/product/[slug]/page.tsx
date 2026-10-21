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
  PackageCheck,
  Heart,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/storefront/ProductCard';
import { StatusPill } from '@/components/ui/Pill';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { BRAND_CONFIG } from '@/lib/brand';
import { getProductBySlug, getAllProducts } from '@/lib/store';
import { SampleProduct, getProductMedia, ProductVideo } from '@/lib/sample-data';
import { formatBDT, toBanglaDigits } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

// Helper to extract clean short name and included description from variation titles
// Rule from Part A1: "Do not repeat the product name inside each option. Show only what is different (for example '১২ পিস সেট')"
function parseVariationDetails(
  titleBn: string,
  titleEn?: string,
  productTitleBn?: string,
  productTitleEn?: string
) {
  let name = titleBn;
  let included = '';

  // Extract from parentheses if available
  const matchBn = titleBn.match(/^([^(]+)(?:\((.+)\))?/);
  if (matchBn) {
    name = matchBn[1].trim();
    included = matchBn[2]?.trim() || '';
  }

  // If the extracted name matches or contains the product title, then what was in parentheses is the actual variation!
  if (
    productTitleBn &&
    (name.toLowerCase().includes(productTitleBn.toLowerCase().replace(/[-–—]/g, ' ').trim()) ||
      productTitleBn.toLowerCase().includes(name.toLowerCase()))
  ) {
    if (included) {
      name = included;
      included = '';
    }
  }

  // If name has "12 piece" or "24 piece" or "48 piece", format nicely into Bangla
  if (/12\s*piece/i.test(name) || /১২\s*পিস/.test(name)) {
    name = '১২ পিস সেট';
    if (!included) included = '১২টি শেপ + ৬টি রঙ + ১ ব্রাশ';
  } else if (/24\s*piece/i.test(name) || /২৪\s*পিস/.test(name)) {
    name = '২৪ পিস মেগা বক্স';
    if (!included) included = '২৪টি শেপ + ১২টি রঙ + ২ ব্রাশ';
  } else if (/48\s*piece/i.test(name) || /৪৮\s*পিস/.test(name) || /36\s*piece/i.test(name) || /৩৬\s*পিস/.test(name)) {
    name = '৩৬ পিস ডিলাক্স গিফট সেট';
    if (!included) included = 'সম্পূর্ণ কালেকশন বক্স + সব কালার';
  }

  // Fallback to titleEn parentheses if included is still empty
  if (!included && titleEn) {
    const matchEn = titleEn.match(/\((.+)\)/);
    if (matchEn && matchEn[1]) {
      included = matchEn[1].trim();
    }
  }

  if (!included) {
    included = 'সব সরঞ্জাম বক্সের ভেতরে অন্তর্ভুক্ত';
  }

  return { name, included };
}

function getEffectiveVariations(product: SampleProduct) {
  if (product.variations && product.variations.length > 0) {
    return product.variations;
  }
  const base = product.baseSalePrice || product.basePrice || 990;
  const original = product.basePrice || Math.round(base * 1.25);
  const img = product.imageUrl || '';
  const gallery = product.galleryImages || [];
  const slug = product.slug || '';

  if (slug.includes('fruit')) {
    return [
      {
        sku: 'SWEET-FRUIT-STARTER',
        titleBn: 'স্টার্টার প্যাক (৬টি ফল + ৪টি রঙ + ১ ব্রাশ)',
        titleEn: 'Starter Pack (6 Fruits + 4 Colors + 1 Brush)',
        price: 1200,
        salePrice: 990,
        stock: 35,
        imageUrl: img,
        badge: 'জনপ্রিয়',
      },
      {
        sku: 'SWEET-FRUIT-MEGA',
        titleBn: 'মেগা আর্ট বক্স (১২টি ফল + ৮টি রঙ + ২ ব্রাশ + প্যালেট)',
        titleEn: 'Mega Art Box (12 Fruits + 8 Colors + 2 Brushes + Palette)',
        price: 1800,
        salePrice: 1450,
        stock: 18,
        imageUrl: gallery[1] || img,
        badge: 'সেরা অফার',
      },
      {
        sku: 'SWEET-FRUIT-DELUXE',
        titleBn: 'ডিলাক্স গিফট বক্স (১৮টি ফল + ১২ রঙ + ৪ ব্রাশ)',
        titleEn: 'Deluxe Family Gift Box (18 Fruits + 12 Colors + 4 Brushes)',
        price: 2400,
        salePrice: 1890,
        stock: 5,
        imageUrl: gallery[2] || img,
        badge: '৳৫১০ সাশ্রয়',
      },
    ];
  }

  if (slug.includes('paint') || slug.includes('kit') || product.categorySlug === 'art-kits') {
    return [
      {
        sku: `${product.slug.slice(0, 8).toUpperCase()}-STARTER`,
        titleBn: '১২ পিস সেট (১২টি শেপ + ৬টি রঙ + ১ ব্রাশ)',
        titleEn: '12 Piece Set (12 Shapes + 6 Colors + 1 Brush)',
        price: original,
        salePrice: base,
        stock: 30,
        imageUrl: img,
        badge: 'জনপ্রিয়',
      },
      {
        sku: `${product.slug.slice(0, 8).toUpperCase()}-MEGA`,
        titleBn: '২৪ পিস মেগা বক্স (২৪টি শেপ + ১২টি রঙ + ২ ব্রাশ)',
        titleEn: '24 Piece Mega Box (24 Shapes + 12 Colors + 2 Brushes)',
        price: Math.round(original * 1.5),
        salePrice: Math.round(base * 1.45),
        stock: 15,
        imageUrl: gallery[1] || img,
        badge: 'সেরা অফার',
      },
      {
        sku: `${product.slug.slice(0, 8).toUpperCase()}-DELUXE`,
        titleBn: '৩৬ পিস ডিলাক্স গিফট সেট (সম্পূর্ণ কালেকশন)',
        titleEn: '36 Piece Deluxe Gift Box (Complete Collection Set)',
        price: Math.round(original * 2.0),
        salePrice: Math.round(base * 1.85),
        stock: 6,
        imageUrl: gallery[2] || img,
        badge: 'অতিরিক্ত ছাড়',
      },
    ];
  }

  if (slug.includes('crayon') || product.categorySlug === 'wax-crayons') {
    return [
      {
        sku: 'CRAYON-12',
        titleBn: '১২ রঙের স্টার্টার প্যাক (১২টি চকচকে মোমের রঙ)',
        titleEn: '12 Colors Starter Pack (12 Wax Crayons)',
        price: original,
        salePrice: base,
        stock: 45,
        imageUrl: img,
      },
      {
        sku: 'CRAYON-24',
        titleBn: '২৪ রঙের ক্লাসিক বক্স (২৪টি প্রাকৃতিক মোমের শেড)',
        titleEn: '24 Colors Classic Box (24 Natural Shades)',
        price: Math.round(original * 1.7),
        salePrice: Math.round(base * 1.6),
        stock: 6,
        imageUrl: gallery[1] || img,
        badge: 'জনপ্রিয়',
      },
      {
        sku: 'CRAYON-36',
        titleBn: '৩৬ রঙের মেগা কালেকশন (৩৬টি প্রিমিয়াম রঙ + বক্স)',
        titleEn: '36 Colors Mega Artist Collection (36 Colors + Box)',
        price: Math.round(original * 2.3),
        salePrice: Math.round(base * 2.1),
        stock: 25,
        imageUrl: gallery[2] || img,
      },
    ];
  }

  return [
    {
      sku: `${product.slug.slice(0, 8).toUpperCase()}-STD`,
      titleBn: 'স্ট্যান্ডার্ড প্যাক (১টি মূল সেট)',
      titleEn: 'Standard Pack (1 Unit)',
      price: original,
      salePrice: base,
      stock: 40,
      imageUrl: img,
    },
    {
      sku: `${product.slug.slice(0, 8).toUpperCase()}-COMBO-2`,
      titleBn: '২-প্যাক সুপার সেভার কম্বো (২টি সেট + গিফট)',
      titleEn: '2-Pack Super Saver Combo (2 Units + Gift)',
      price: Math.round(original * 1.9),
      salePrice: Math.round(base * 1.8),
      stock: 18,
      imageUrl: gallery[1] || img,
      badge: 'সেরা সাশ্রয়',
    },
    {
      sku: `${product.slug.slice(0, 8).toUpperCase()}-GIFT-3`,
      titleBn: '৩-প্যাক ফ্যামিলি মেগা সেট (৩টি সম্পূর্ণ সেট)',
      titleEn: '3-Pack Family Mega Gift Set (3 Complete Sets)',
      price: Math.round(original * 2.8),
      salePrice: Math.round(base * 2.5),
      stock: 7,
      imageUrl: gallery[2] || img,
      badge: 'মাত্র ৭টি বাকি',
    },
  ];
}

function ProductContent() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const slug = (params?.slug as string) || 'car-painting-kit---12-piece-set-english';
  const { addItem } = useCart();

  const allProducts = getAllProducts();
  const initialProduct: SampleProduct = getProductBySlug(slug) || allProducts[0];
  const [product, setProduct] = useState<SampleProduct>(initialProduct);

  // Sync when slug changes or fetch latest from DB
  useEffect(() => {
    const memProd = getProductBySlug(slug);
    if (memProd) {
      setProduct(memProd);
    }
    let isMounted = true;
    fetch(`/api/products/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.success && data?.product) {
          setProduct((prev) => ({ ...prev, ...data.product }));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Media: Images + Videos
  const { images: galleryImages, videos: productVideos } = useMemo(() => {
    return getProductMedia(product);
  }, [product]);

  // Gallery Active Image & Video Modal
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);
  const [activeVideoModal, setActiveVideoModal] = useState<ProductVideo | null>(null);

  // Variations list
  const variations = useMemo(() => {
    if (product.variations && product.variations.length > 0) {
      return product.variations;
    }
    return getEffectiveVariations(product);
  }, [product]);

  // Default to first available option
  const firstAvailableIndex = useMemo(() => {
    const idx = variations.findIndex((v) => (v.stock ?? 1) > 0);
    return idx !== -1 ? idx : 0;
  }, [variations]);

  const [selectedVariationIndex, setSelectedVariationIndex] = useState<number>(firstAvailableIndex);
  const [variationError, setVariationError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedVariationIndex(firstAvailableIndex);
    setVariationError(null);
  }, [firstAvailableIndex, slug]);

  const currentVariation = variations[selectedVariationIndex] || variations[0];

  // Price calculations
  const currentPrice = currentVariation
    ? currentVariation.salePrice || currentVariation.price
    : product.baseSalePrice || product.basePrice;

  const currentOriginalPrice = currentVariation
    ? currentVariation.price
    : product.basePrice;

  const discountPercent =
    currentOriginalPrice > currentPrice
      ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)
      : 0;

  // Stock status
  const currentStock = currentVariation ? currentVariation.stock ?? 20 : 20;
  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock <= 10;

  // Quantity state
  const [quantity, setQuantity] = useState<number>(1);
  const [addedToast, setAddedToast] = useState<boolean>(false);

  // Below fold tabs
  const [activeTab, setActiveTab] = useState<'desc' | 'box' | 'videos' | 'reviews' | 'faq'>('desc');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Recently Viewed state
  const [recentlyViewed, setRecentlyViewed] = useState<SampleProduct[]>([]);

  // When variation changes, update active image if variation has custom image
  const handleSelectVariation = (idx: number) => {
    const chosen = variations[idx];
    if ((chosen?.stock ?? 1) <= 0) return; // cannot select out of stock option

    setSelectedVariationIndex(idx);
    setVariationError(null);

    if (chosen?.imageUrl) {
      const foundIdx = galleryImages.findIndex((img) => img === chosen.imageUrl);
      if (foundIdx !== -1) {
        setActiveImageIndex(foundIdx);
      }
    }
  };

  // Next / Prev Image Navigation
  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
  };

  // Track Recently Viewed & Meta pixel
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
    if (isOutOfStock) return;

    addItem({
      id: currentVariation
        ? `${product.id}-${currentVariation.sku}`
        : `${product.id}-default`,
      productId: product.id,
      productSlug: product.slug,
      title: product.titleEn,
      titleBn: product.titleBn,
      imageUrl: currentVariation?.imageUrl || galleryImages[0] || product.imageUrl,
      price: currentPrice,
      quantity,
      variationSku: currentVariation?.sku,
      variationTitle: currentVariation?.titleEn,
      variationTitleBn: currentVariation?.titleBn,
    });

    setAddedToast(true);
    toast.success(`'${product.titleBn}' কার্টে যোগ করা হয়েছে!`);
    setTimeout(() => setAddedToast(false), 2500);
  };

  // Direct Buy Now handler -> Adds to Cart & Routes directly to Checkout
  const handleBuyNow = () => {
    if (isOutOfStock) return;

    addItem({
      id: currentVariation
        ? `${product.id}-${currentVariation.sku}`
        : `${product.id}-default`,
      productId: product.id,
      productSlug: product.slug,
      title: product.titleEn,
      titleBn: product.titleBn,
      imageUrl: currentVariation?.imageUrl || galleryImages[0] || product.imageUrl,
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
    const sketchbook = allProducts.find((p) => p.categorySlug === 'sketchbooks') || allProducts[1];
    if (sketchbook) {
      addItem({
        id: `${sketchbook.id}-combo`,
        productId: sketchbook.id,
        productSlug: sketchbook.slug,
        title: sketchbook.titleEn,
        titleBn: sketchbook.titleBn,
        imageUrl: sketchbook.imageUrl,
        price: sketchbook.baseSalePrice || 350,
        quantity: 1,
      });
      toast.success('কম্বো প্যাকেজ কার্টে যোগ করা হয়েছে!');
    }
  };

  // Share handler
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      toast.info('পণ্যটির লিংক কপি করা হয়েছে!');
    }
  };

  // Related products
  const relatedProducts = useMemo(() => {
    return allProducts
      .filter((p) => p.slug !== product.slug)
      .slice(0, 4);
  }, [allProducts, product.slug]);

  // Selected variation short name for live total
  const selectedParsed = useMemo(() => {
    if (!currentVariation) return { name: 'স্ট্যান্ডার্ড প্যাক', included: '' };
    return parseVariationDetails(
      currentVariation.titleBn,
      currentVariation.titleEn,
      product.titleBn,
      product.titleEn
    );
  }, [currentVariation]);

  // Structured data
  const productSchema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.titleBn,
    alternateName: product.titleEn,
    image: galleryImages,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: BRAND_CONFIG.name,
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="text-xs text-[#6B6B6B] flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-[#D6403B] flex items-center gap-1 font-medium">
            <Home className="w-3.5 h-3.5" /> হোম
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#D6403B] font-medium">
            সব পণ্য
          </Link>
          <span>/</span>
          {product.categorySlug && (
            <>
              <Link href={`/category/${product.categorySlug}`} className="hover:text-[#D6403B] capitalize font-medium">
                {product.categorySlug.replace('-', ' ')}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="font-bold text-[#2B2B2B] truncate max-w-xs">{product.titleBn}</span>
        </div>

        {/* =====================================================================
            PRODUCT HERO SECTION: 2 COLUMNS (LEFT GALLERY, RIGHT BUYING PANEL)
           ===================================================================== */}
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 sm:p-7 lg:p-8 shadow-xs grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
          
          {/* ================================================================
              LEFT: GALLERY (MAIN IMAGE + SINGLE THUMBNAIL ROW WITH VIDEOS)
             ================================================================ */}
          <div className="space-y-4">
            {/* Top Share & Badge Row */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#6B6B6B] bg-[#FAF7F2] px-2.5 py-0.5 rounded-full border border-[#EFE9E0]">
                  ছবি {toBanglaDigits(activeImageIndex + 1)} / {toBanglaDigits(galleryImages.length)}
                </span>
                {productVideos.length > 0 && (
                  <span className="text-[11px] font-bold text-[#1F6B43] bg-[#DDF3E6] px-2.5 py-0.5 rounded-full">
                    {toBanglaDigits(productVideos.length)}টি ভিডিও আছে
                  </span>
                )}
              </div>

              {/* Share action */}
              <button
                onClick={handleShare}
                className="p-1.5 rounded-full hover:bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#D6403B] transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
                title="শেয়ার করুন"
              >
                <Share2 className="w-4 h-4" />
                <span>শেয়ার</span>
              </button>
            </div>

            {/* Main Stage Image (Never empty black box, never autoplay) */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#EFE9E0] shadow-inner group flex items-center justify-center">
              <Image
                src={galleryImages[activeImageIndex] || product.imageUrl}
                alt={product.titleBn}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Discount Badge */}
              {discountPercent > 0 && (
                <div className="absolute top-3.5 right-3.5 z-10">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D6403B] text-white shadow-sm">
                    {toBanglaDigits(discountPercent)}% ছাড়
                  </span>
                </div>
              )}

              {/* Zoom Trigger Button */}
              <button
                onClick={() => setIsZoomOpen(true)}
                className="absolute bottom-3.5 right-3.5 p-2 rounded-xl bg-white/90 hover:bg-white text-[#2B2B2B] shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-1.5 text-xs font-bold z-10"
                title="ছবি বড় করে দেখুন"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">বড় করুন</span>
              </button>

              {/* Prev / Next Navigation Arrows */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-[#2B2B2B] shadow-sm flex items-center justify-center transition-all opacity-80 hover:opacity-100 z-20 cursor-pointer"
                    title="পূর্ববর্তী ছবি"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-[#2B2B2B] shadow-sm flex items-center justify-center transition-all opacity-80 hover:opacity-100 z-20 cursor-pointer"
                    title="পরবর্তী ছবি"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* ================================================================
                SINGLE ROW OF THUMBNAILS (PHOTOS + VIDEOS IN THE SAME ROW)
                Rule: "Do NOT add separate 'All media / Photos / Videos' tabs.
                Videos appear as thumbnails in the same row with a play icon and length."
               ================================================================ */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {/* Photo Thumbnails */}
              {galleryImages.map((img, idx) => {
                const isActive = activeImageIndex === idx;
                return (
                  <button
                    key={`img-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#FAF7F2] border-2 transition-all cursor-pointer flex-shrink-0 group ${
                      isActive
                        ? 'border-[#D6403B] shadow-sm ring-2 ring-[#D6403B]/20 scale-95'
                        : 'border-[#EFE9E0] hover:border-[#D6403B]/60 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt={`থাম্বনেইল ${idx + 1}`} fill className="object-cover" />
                  </button>
                );
              })}

              {/* Video Thumbnails in the same row */}
              {productVideos.map((vid, vIdx) => (
                <button
                  key={vid.id || `vid-${vIdx}`}
                  type="button"
                  onClick={() => setActiveVideoModal(vid)}
                  className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-black border-2 border-[#FFC93C] hover:border-[#D6403B] transition-all cursor-pointer flex-shrink-0 group shadow-2xs"
                  title={`${vid.titleBn} (ভিডিও দেখতে ক্লিক করুন)`}
                >
                  {/* Poster Thumbnail */}
                  <Image
                    src={vid.thumbnailUrl || galleryImages[vIdx] || product.imageUrl}
                    alt={vid.titleBn}
                    fill
                    className="object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                  />

                  {/* Play Center Icon */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 z-10">
                    <div className="w-6 h-6 rounded-full bg-[#D6403B] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Duration badge */}
                  {vid.duration && (
                    <span className="absolute bottom-0.5 right-0.5 bg-black/85 text-white text-[8px] font-mono px-1 rounded">
                      {vid.duration}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Quick Demo Video Strip */}
            {productVideos.length > 0 && (
              <div
                onClick={() => setActiveVideoModal(productVideos[0])}
                className="rounded-2xl bg-[#DDF1FB]/40 border border-[#BEE4F7] p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#DDF1FB]/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#0B5F85] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[#0B5F85] truncate">
                      বাচ্চাদের খেলার বাস্তব ভিডিও ডেমো দেখুন
                    </h4>
                    <p className="text-[11px] text-[#6B6B6B] truncate">
                      ভিডিও দেখতে এখানে ট্যাপ করুন ({productVideos[0].duration})
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0B5F85] whitespace-nowrap px-3 py-1 bg-white rounded-full border border-[#BEE4F7]">
                  প্লে করুন
                </span>
              </div>
            )}
          </div>

          {/* ================================================================
              RIGHT: BUYING PANEL (IN EXACT ORDER SPECIFIED BY SPEC A1)
             ================================================================ */}
          <div className="space-y-4 sm:space-y-5">
            
            {/* 1. Stock badge and SKU */}
            <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
              {isOutOfStock ? (
                <StatusPill variant="red">
                  <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                  স্টক শেষ
                </StatusPill>
              ) : isLowStock ? (
                <StatusPill variant="yellow">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  মাত্র {toBanglaDigits(currentStock)}টি বাকি - দ্রুত অর্ডার করুন!
                </StatusPill>
              ) : (
                <StatusPill variant="green">
                  <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                  স্টকে আছে, এখনই অর্ডার করুন
                </StatusPill>
              )}

              <span className="text-xs font-mono text-[#6B6B6B]">
                SKU: {currentVariation?.sku || product.slug.slice(0, 10).toUpperCase()}
              </span>
            </div>

            {/* 2. Title in Bangla (large), English title below in grey */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#2B2B2B] leading-snug">
                {product.titleBn}
              </h1>
              {product.titleEn && (
                <p className="text-sm text-[#6B6B6B] mt-1 font-medium">
                  {product.titleEn}
                </p>
              )}
            </div>

            {/* 3. Rating row: stars, average, "N টি রিভিউ দেখুন" link that scrolls to reviews */}
            {(product.reviewCount || 48) > 0 && (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <div className="flex items-center text-[#FFC93C]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current text-[#FFC93C]" />
                  ))}
                </div>
                <span className="font-bold text-[#2B2B2B]">{product.rating || 4.9}</span>
                <span className="text-[#D1D5DB]">•</span>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('reviews-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                    setActiveTab('reviews');
                  }}
                  className="text-[#C23631] hover:underline font-medium cursor-pointer"
                >
                  {toBanglaDigits(product.reviewCount || 48)}টি রিভিউ দেখুন
                </button>
              </div>
            )}

            {/* 4. Compact price: large sale price in red, old price struck through, no big box */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#C23631]">
                {formatBDT(currentPrice, { locale: 'bn' })}
              </span>
              {currentOriginalPrice > currentPrice && (
                <span className="text-base sm:text-lg text-[#6B6B6B] line-through font-normal">
                  {formatBDT(currentOriginalPrice, { locale: 'bn' })}
                </span>
              )}
              {discountPercent > 0 && (
                <StatusPill variant="red">
                  {toBanglaDigits(discountPercent)}% ছাড়
                </StatusPill>
              )}
            </div>

            {/* 5. Variation selector */}
            {variations.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-[#EFE9E0]">
                {/* Heading & Option count */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[#2B2B2B]">
                    সেট বাছুন:
                  </span>
                  <span className="text-xs text-[#6B6B6B] font-medium">
                    {toBanglaDigits(variations.length)}টি অপশন
                  </span>
                </div>

                {/* Variation Cards Grid with radiogroup */}
                <div
                  role="radiogroup"
                  aria-label="সেট বাছুন"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
                >
                  {variations.map((v, idx) => {
                    const isSelected = selectedVariationIndex === idx;
                    const vPrice = v.salePrice || v.price;
                    const vStock = v.stock ?? 20;
                    const vOutOfStock = vStock <= 0;
                    const vLowStock = vStock > 0 && vStock <= 10;
                    const parsed = parseVariationDetails(
                      v.titleBn,
                      v.titleEn,
                      product.titleBn,
                      product.titleEn
                    );

                    return (
                      <div
                        key={v.sku || `var-${idx}`}
                        role="radio"
                        aria-checked={isSelected}
                        aria-disabled={vOutOfStock}
                        onClick={() => !vOutOfStock && handleSelectVariation(idx)}
                        className={`relative p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[96px] ${
                          vOutOfStock
                            ? 'opacity-50 cursor-not-allowed bg-gray-50 border-[#EFE9E0]'
                            : isSelected
                            ? 'border-2 border-[#D6403B] bg-[#FDE3E1]/40 shadow-xs cursor-pointer'
                            : 'border-[#EFE9E0] bg-white hover:border-[#D6403B]/60 cursor-pointer'
                        }`}
                      >
                        {/* Top: Name + Selection Circle / Tick Indicator */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 pr-1">
                            <p className="text-xs sm:text-sm font-bold text-[#2B2B2B] leading-snug">
                              {parsed.name}
                            </p>
                            <p className="text-[11px] text-[#6B6B6B] leading-tight mt-0.5 line-clamp-2">
                              {parsed.included}
                            </p>
                          </div>

                          {/* Corner Indicator: red circle with tick if selected, empty circle if not */}
                          <div className="shrink-0 mt-0.5">
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-[#D6403B] text-white flex items-center justify-center shadow-xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-[#D1D5DB] bg-white" />
                            )}
                          </div>
                        </div>

                        {/* Bottom: Price + Stock label */}
                        <div className="mt-3 pt-2 border-t border-[#EFE9E0] flex items-baseline justify-between gap-1">
                          <span className="text-sm font-extrabold text-[#C23631]">
                            {formatBDT(vPrice, { locale: 'bn' })}
                          </span>

                          <span className="text-[10px] font-bold">
                            {vOutOfStock ? (
                              <span className="text-[#9B2420]">স্টক শেষ</span>
                            ) : vLowStock ? (
                              <span className="text-[#7A4E00]">
                                মাত্র {toBanglaDigits(vStock)}টি বাকি
                              </span>
                            ) : (
                              <span className="text-[#1F6B43]">স্টকে আছে</span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {variationError && (
                  <p className="text-xs font-bold text-[#D6403B] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {variationError}
                  </p>
                )}
              </div>
            )}

            {/* 6. Quantity stepper and live total line */}
            <div className="space-y-2 pt-2 border-t border-[#EFE9E0]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2B2B2B]">অর্ডারের পরিমাণ:</span>
                <div className="flex items-center bg-[#FAF7F2] border border-[#EFE9E0] rounded-full p-1 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#2B2B2B] hover:text-[#D6403B] shadow-2xs cursor-pointer disabled:opacity-40 transition-colors"
                    title="কমান"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm">
                    {toBanglaDigits(quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                    disabled={quantity >= currentStock}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#2B2B2B] hover:text-[#D6403B] shadow-2xs cursor-pointer disabled:opacity-40 transition-colors"
                    title="বাড়ান"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Live Total Line (e.g., "১২ পিস সেট x ১, মোট ৳৯৯৯") */}
              <div className="bg-[#FAF7F2] rounded-xl px-3 py-2 border border-[#EFE9E0] text-xs font-medium text-[#2B2B2B] flex items-center justify-between">
                <span>
                  {selectedParsed.name} x {toBanglaDigits(quantity)}
                </span>
                <span className="font-bold text-sm text-[#C23631]">
                  মোট {formatBDT(currentPrice * quantity, { locale: 'bn' })}
                </span>
              </div>
            </div>

            {/* 7. Action Buttons: "এখনই অর্ডার করুন" (solid) vs "কার্টে যোগ করুন" (outlined) */}
            <div className="space-y-2.5 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Primary Action: এখনই অর্ডার করুন (Solid Primary #D6403B) */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="py-3.5 px-4 rounded-xl bg-[#D6403B] hover:bg-[#BF3430] active:scale-[0.98] text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>এখনই অর্ডার করুন</span>
                </button>

                {/* 2. Secondary Action: কার্টে যোগ করুন (Outlined Primary) */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`py-3.5 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer border-2 border-[#D6403B] text-[#D6403B] bg-transparent hover:bg-[#FDE3E1]/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {addedToast ? (
                    <>
                      <Check className="w-4 h-4 text-[#1F6B43]" />
                      <span className="text-[#1F6B43]">কার্টে যোগ হয়েছে!</span>
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

            {/* 8. "কথা বলে অর্ডার করতে চান?" strip with WhatsApp and Call buttons */}
            <div className="bg-[#DDF3E6] border border-[#BDE6CE] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5 text-center sm:text-left">
                <span className="font-bold text-[#1F6B43] text-sm block">
                  কথা বলে অর্ডার করতে চান?
                </span>
                <span className="text-[#1F6B43]/80 text-xs">
                  আমাদের প্রতিনিধি সরাসরি ফোনে বা হোয়াটসঅ্যাপে সহায়তা করবেন
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`https://wa.me/${BRAND_CONFIG.defaultWhatsapp}?text=${encodeURIComponent(
                    `আসসালামু আলাইকুম, আমি '${product.titleBn}' অর্ডার করতে চাই। লিংক: https://craftykidsco.com/product/${product.slug}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>

                <a
                  href={`tel:${BRAND_CONFIG.defaultHotline}`}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#1F6B43]/30 text-[#1F6B43] hover:bg-[#FAF7F2] font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Phone className="w-4 h-4" /> কল করুন
                </a>
              </div>
            </div>

            {/* 9. Trust block, two columns: delivery, COD, return, safety */}
            <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EFE9E0] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#2B2B2B]">
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-[#0B5F85] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[#2B2B2B]">সারা বাংলাদেশে হোম ডেলিভারি</strong>
                  <span className="text-[#6B6B6B] text-[11px]">
                    ঢাকা ৳{toBanglaDigits(BRAND_CONFIG.defaultDeliveryDhaka)}, বাইরে ৳{toBanglaDigits(BRAND_CONFIG.defaultDeliveryOutside)}। ৳{toBanglaDigits(BRAND_CONFIG.freeDeliveryThreshold)}+ এ ফ্রি!
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#1F6B43] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[#2B2B2B]">১০০% ক্যাশ অন ডেলিভারি</strong>
                  <span className="text-[#6B6B6B] text-[11px]">পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ নিশ্চিন্তে টাকা দিন</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <RotateCcw className="w-4 h-4 text-[#7A4E00] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[#2B2B2B]">{toBanglaDigits(BRAND_CONFIG.defaultReturnDays)} দিনে সহজ রিটার্ন সুবিধা</strong>
                  <span className="text-[#6B6B6B] text-[11px]">ভাঙা বা নষ্ট পেলে দ্রুত বিনামূল্যে পরিবর্তন</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#D6403B] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[#2B2B2B]">১০০% ফুড-গ্রেড ও নন-টক্সিক</strong>
                  <span className="text-[#6B6B6B] text-[11px]">শিশুর নরম ত্বক ও স্বাস্থ্যের জন্য সম্পূর্ণ নিরাপদ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            BELOW THE FOLD: STICKY TABS (বিবরণ, বাক্সে কী আছে, ডেমো ভিডিও, রিভিউ, প্রশ্নোত্তর)
           ===================================================================== */}
        <div id="reviews-section" className="bg-white rounded-2xl border border-[#EFE9E0] p-5 sm:p-8 shadow-xs space-y-6">
          {/* Tabs Navigation Header */}
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[#EFE9E0] scrollbar-none text-xs sm:text-sm font-bold sticky top-16 bg-white z-20 pt-1">
            {[
              { id: 'desc', label: 'বিবরণ' },
              { id: 'box', label: 'বাক্সে কী আছে' },
              { id: 'videos', label: `ডেমো ভিডিও (${toBanglaDigits(productVideos.length)})` },
              { id: 'reviews', label: `রিভিউ (${toBanglaDigits(product.reviewCount || 48)})` },
              { id: 'faq', label: 'প্রশ্নোত্তর' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#D6403B] text-white shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-[#FAF7F2]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: বিবরণ (Description) */}
          {activeTab === 'desc' && (
            <div className="space-y-6 text-xs sm:text-sm text-[#2B2B2B] leading-relaxed">
              <p className="text-sm sm:text-base leading-relaxed text-[#2B2B2B]">
                {product.description ||
                  `${product.titleBn} শিশুদের সৃজনশীলতা, কল্পনাশক্তি ও আনন্দময় সময়ের জন্য বিশেষভাবে প্রস্তুত করা হয়েছে। এটি শিশুদের জন্য সম্পূর্ণ নন-টক্সিক ও নিরাপদ।`}
              </p>

              {/* 3 Pillars Box */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-1">
                  <strong className="text-sm font-bold text-[#2B2B2B] block">🎨 কী এবং কীভাবে তৈরি?</strong>
                  <p className="text-xs text-[#6B6B6B]">
                    ১০০% খাঁটি প্রাকৃতিক মোম ও ফুড-গ্রেড পিগমেন্ট। ক্ষতিকর সিন্থেটিক কেমিক্যাল ও ভারী ধাতু মুক্ত।
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-1">
                  <strong className="text-sm font-bold text-[#2B2B2B] block">👶 কার জন্য উপযুক্ত?</strong>
                  <p className="text-xs text-[#6B6B6B]">
                    {toBanglaDigits(product.targetAgeMin || 2)} থেকে {toBanglaDigits(product.targetAgeMax || 8)} বছর বয়সী শিশুদের হ্যান্ড-আই কোঅর্ডিনেশন ও মেধার বিকাশের জন্য উপযুক্ত।
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-1">
                  <strong className="text-sm font-bold text-[#2B2B2B] block">🛡️ কেন অভিভাবকেরা নিশ্চিন্ত?</strong>
                  <p className="text-xs text-[#6B6B6B]">
                    বাচ্চা মুখে দিলেও কোনো ভয় নেই, এবং সাধারণ সাবান পানিতেই কাপড় বা ফ্লোরের দাগ সহজে উঠে যায়।
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: বাক্সে কী আছে (What's in the Box & Specs) */}
          {activeTab === 'box' && (
            <div className="space-y-5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#2B2B2B]">
                    <PackageCheck className="w-4 h-4 text-[#D6403B]" />
                    <span>প্যাকেজে অন্তর্ভুক্ত উপাদানসমূহ:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#6B6B6B] list-disc list-inside">
                    <li>প্রিমিয়াম কোয়ালিটি মোল্ডেড মোমের শেপ ও কালার সেট</li>
                    <li>১০০% নিরাপদ নন-টক্সিক ওয়াটার কালার বোতল ও রঙ</li>
                    <li>শিশুদের উপযোগী নরম গ্রিপ ফাইন আর্ট ব্রাশ</li>
                    <li>রঙ মেলানোর কালার প্যালেট ও ডেমো গাইডবুক</li>
                    <li>নিরাপদ গিফট প্যাকেজিং বক্স</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#2B2B2B]">
                    <ShieldCheck className="w-4 h-4 text-[#1F6B43]" />
                    <span>টেকনিক্যাল স্পেসিফিকেশন:</span>
                  </div>
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-[#EFE9E0]">
                      <tr>
                        <td className="py-1.5 font-bold text-[#2B2B2B]">কাঁচামাল</td>
                        <td className="py-1.5 text-[#6B6B6B]">প্রাকৃতিক মৌমাছির মোম ও ফুড কালার</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-bold text-[#2B2B2B]">উপযুক্ত বয়স</td>
                        <td className="py-1.5 text-[#6B6B6B]">
                          {toBanglaDigits(product.targetAgeMin || 2)}+ থেকে {toBanglaDigits(product.targetAgeMax || 8)} বছর
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-bold text-[#2B2B2B]">নিরাপত্তা মান</td>
                        <td className="py-1.5 text-[#6B6B6B]">১০০% নন-টক্সিক সার্টিফাইড</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ডেমো ভিডিও (Demo Videos with Modal Player) */}
          {activeTab === 'videos' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-base text-[#2B2B2B]">
                  পণ্য ব্যবহারের ভিডিও ও আনবক্সিং ডেমো
                </h4>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  নিচের যেকোনো ভিডিওতে ক্লিক করে সরাসরি বড় পর্দায় দেখুন:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {productVideos.map((vid, idx) => (
                  <div
                    key={vid.id || idx}
                    onClick={() => setActiveVideoModal(vid)}
                    className="rounded-2xl border border-[#EFE9E0] overflow-hidden bg-[#FAF7F2] p-3 space-y-2.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
                      <Image
                        src={vid.thumbnailUrl || galleryImages[idx] || product.imageUrl}
                        alt={vid.titleBn}
                        fill
                        className="object-cover opacity-75 group-hover:opacity-50 transition-opacity"
                      />
                      <div className="w-10 h-10 rounded-full bg-[#D6403B] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform z-10">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                        {vid.duration}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <strong className="text-xs font-bold text-[#2B2B2B] truncate">
                        {vid.titleBn}
                      </strong>
                      <span className="text-[10px] font-bold text-[#D6403B] bg-[#FDE3E1] px-2 py-0.5 rounded-full shrink-0">
                        ভিডিও {toBanglaDigits(idx + 1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: রিভিউ (Customer Reviews) */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFE9E0]">
                <div>
                  <h3 className="font-bold text-lg text-[#2B2B2B]">
                    গ্রাহকদের রিভিউ ও রেটিং ({toBanglaDigits(product.reviewCount || 48)})
                  </h3>
                  <p className="text-xs text-[#6B6B6B]">
                    আমাদের সম্মানিত ক্রেতাদের বাস্তব অনুভূতি ও ছবির অভিজ্ঞতা
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center text-[#FFC93C]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current text-[#FFC93C]" />
                    ))}
                  </div>
                  <span className="font-bold text-base text-[#2B2B2B]">
                    {product.rating || 4.9} / ৫.০
                  </span>
                </div>
              </div>

              {/* Review Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(product.reviews || [
                  {
                    id: 'rev-1',
                    author: 'আফসানা রহমান',
                    location: 'মিরপুর, ঢাকা',
                    rating: 5,
                    date: '২ দিন আগে',
                    comment: 'পণ্যটির ফিনিশিং ও রঙ অসাধারণ! আমার ৪ বছরের মেয়ে খুবই খুশি। কাপড় থেকেও সহজে রঙ উঠে যাচ্ছে।',
                    isVerified: true,
                  },
                  {
                    id: 'rev-2',
                    author: 'তাহসিন মাহমুদ',
                    location: 'চট্টগ্রাম',
                    rating: 5,
                    date: '৫ দিন আগে',
                    comment: 'খুব দ্রুত ডেলিভারি পেয়েছি। প্যাকেজিং খুবই চমৎকার এবং সম্পূর্ণ অক্ষত অবস্থায় এসেছে। ১০০% রেকমেন্ডেড।',
                    isVerified: true,
                  },
                  {
                    id: 'rev-3',
                    author: 'সাবিহা সুলতানা',
                    location: 'উত্তরা, ঢাকা',
                    rating: 5,
                    date: '১ সপ্তাহ আগে',
                    comment: 'মোমের রঙগুলো মুখে দেওয়ার ভয় নেই তাই নিশ্চিন্তে দিয়েছি। বাচ্চার সৃজনশীলতা চর্চায় দারুণ কিট!',
                    isVerified: true,
                  },
                ]).map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-[#FFC93C]">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                        <span className="text-[11px] text-[#6B6B6B]">{rev.date}</span>
                      </div>

                      <p className="text-xs text-[#2B2B2B] leading-relaxed italic">
                        &quot;{rev.comment}&quot;
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#EFE9E0] flex items-center justify-between text-[11px]">
                      <div>
                        <strong className="text-[#2B2B2B] block">{rev.author}</strong>
                        {rev.location && <span className="text-[#6B6B6B]">{rev.location}</span>}
                      </div>
                      {rev.isVerified && (
                        <StatusPill variant="green" size="sm">
                          ভেরিফাইড
                        </StatusPill>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: প্রশ্নোত্তর (FAQ) */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              {(product.faqs || [
                {
                  question: 'বাচ্চা মুখে দিলে কি কোনো ক্ষতি হবে?',
                  answer:
                    'না, আমাদের সব রঙ ও উপাদান ১০০% ফুড-গ্রেড ও প্রাকৃতিকভাবে তৈরি। এতে কোনো ক্ষতিকর রাসায়নিক বা সীসা নেই।',
                },
                {
                  question: 'কাপড়ে বা দেওয়ালে রঙ লাগলে কীভাবে তুলব?',
                  answer:
                    'এটি সম্পূর্ণ ওয়াশেবল রঙ। সাধারণ পানিতে সাবান দিয়ে ধুয়ে নিলেই কাপড় বা মেঝে থেকে সহজেই উঠে যায়।',
                },
                {
                  question: 'পণ্য পছন্দ না হলে কি রিটার্ন করা যাবে?',
                  answer:
                    `জি, ডেলিভারির ${toBanglaDigits(BRAND_CONFIG.defaultReturnDays)} দিনের মধ্যে কোনো ত্রুটি থাকলে সরাসরি সম্পূর্ণ মূল্য ফেরত বা ফ্রি রিপ্লেসমেন্ট সুবিধা রয়েছে।`,
                },
              ]).map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#EFE9E0] bg-[#FAF7F2] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full p-4 text-left font-bold text-xs sm:text-sm text-[#2B2B2B] flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    {openFaqIndex === idx ? (
                      <ChevronUp className="w-4 h-4 shrink-0 text-[#D6403B]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    )}
                  </button>
                  {openFaqIndex === idx && (
                    <div className="p-4 pt-0 text-xs sm:text-sm text-[#6B6B6B] leading-relaxed border-t border-[#EFE9E0] bg-white">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =====================================================================
            "একসাথে কিনলে ছাড়" BUNDLE STRIP
           ===================================================================== */}
        <div className="bg-[#FAF7F2] border border-[#EFE9E0] rounded-2xl p-5 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D6403B] text-white shadow-xs">
              <Gift className="w-3.5 h-3.5" />
              একসাথে কিনলে ছাড়!
            </span>
            <h3 className="font-bold text-xl sm:text-2xl text-[#2B2B2B]">
              {product.titleBn} + আর্ট স্কেচ প্যাড কম্বো
            </h3>
            <p className="text-xs sm:text-sm text-[#6B6B6B] max-w-lg">
              পণ্যটির সাথে ড্রয়িং স্কেচ প্যাড একসাথে নিলে পাচ্ছেন অতিরিক্ত ৳১৫০ ছাড় ও আকর্ষণীয় গিফট প্যাকেজিং।
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#C23631]">৳৪৫০</span>
              <span className="block text-xs line-through text-[#6B6B6B]">৳৬০০</span>
            </div>
            <button
              type="button"
              onClick={handleAddCombo}
              className="py-3 px-5 rounded-xl bg-[#D6403B] hover:bg-[#BF3430] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              কম্বো কার্টে যোগ করুন
            </button>
          </div>
        </div>

        {/* =====================================================================
            RELATED PRODUCTS (4)
           ===================================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xl text-[#2B2B2B]">
              সম্পর্কিত অন্যান্য পণ্য
            </h3>
            <Link href="/shop" className="text-xs font-bold text-[#D6403B] hover:underline flex items-center gap-1">
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
                ageBadgeText={`${toBanglaDigits(p.targetAgeMin || 3)}+ বছর`}
                safetyBadgeText="১০০% নিরাপদ"
                locale="bn"
              />
            ))}
          </div>
        </div>

        {/* =====================================================================
            RECENTLY VIEWED PRODUCTS
           ===================================================================== */}
        {recentlyViewed.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-[#EFE9E0]">
            <h3 className="font-bold text-lg text-[#2B2B2B]">
              সম্প্রতি দেখা পণ্য
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
                  locale="bn"
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Centralized Footer */}
      <Footer />

      {/* =========================================================================
          LIGHTBOX ZOOM MODAL
         ========================================================================= */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-[#D6403B] p-2 cursor-pointer z-10"
              title="বন্ধ করুন"
            >
              <X className="w-7 h-7" />
            </button>
            <div className="relative w-full aspect-square max-h-[80vh] rounded-2xl overflow-hidden bg-white shadow-2xl">
              <Image
                src={galleryImages[activeImageIndex] || product.imageUrl}
                alt={product.titleBn}
                fill
                className="object-contain"
              />
            </div>
            <div className="mt-3 flex items-center gap-2 overflow-x-auto max-w-full pb-1">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 relative transition-all ${
                    activeImageIndex === i
                      ? 'border-[#D6403B] scale-105'
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
          VIDEO MODAL (Rule: Never empty black box inline, opens in modal on tap)
         ========================================================================= */}
      {activeVideoModal && (
        <Modal
          isOpen={!!activeVideoModal}
          onClose={() => setActiveVideoModal(null)}
          title={activeVideoModal.titleBn}
          description={`দৈর্ঘ্য: ${activeVideoModal.duration}`}
          maxWidth="lg"
        >
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
            <video
              src={activeVideoModal.url}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MOBILE STICKY "ORDER NOW" BUY BAR (Rule: Option name, total price, order button)
         ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-[#EFE9E0] py-2 px-3 flex items-center justify-between gap-2 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] pb-safe">
        {/* Quick Product Thumb & Live Total Price */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#EFE9E0] shrink-0">
            <Image
              src={galleryImages[0] || product.imageUrl}
              alt={product.titleBn}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-[#2B2B2B] truncate leading-tight">
              {selectedParsed.name}
            </span>
            <span className="text-xs font-extrabold text-[#C23631]">
              মোট {formatBDT(currentPrice * quantity, { locale: 'bn' })}
            </span>
          </div>
        </div>

        {/* Action Buttons: Add to Cart + Buy Now */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="p-2.5 rounded-xl bg-[#FAF7F2] text-[#D6403B] border border-[#EFE9E0] font-bold text-xs flex items-center justify-center active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="কার্টে যোগ করুন"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="py-2.5 px-3.5 rounded-xl bg-[#D6403B] hover:bg-[#BF3430] text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="whitespace-nowrap">{isOutOfStock ? 'স্টক শেষ' : 'এখনই অর্ডার করুন'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SingleProductPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-[#6B6B6B]">লোড হচ্ছে...</div>}>
      <ProductContent />
    </Suspense>
  );
}
