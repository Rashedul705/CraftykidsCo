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
import { SampleProduct, getProductMedia, ProductVideo, getVideoEmbedInfo } from '@/lib/sample-data';
import { formatBDT, toBanglaDigits } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { trackViewContent, trackAddToCart, trackInitiateCheckout } from '@/lib/analytics';

// Helper to extract clean short name and included description from variation titles
// Rule from Part A1: "Do not repeat the product name inside each option. Show only what is different (for example '১২ পিস সেট')"
function parseVariationDetails(
  titleBn: string,
  titleEn?: string,
  productTitleBn?: string,
  productTitleEn?: string,
  explicitDetail?: string,
  explicitName?: string
) {
  let name = (explicitName || titleBn || '').trim();
  let included = (explicitDetail || '').trim();

  // If name has parentheses (e.g. "১২ পিস সেট (১২টি শেপ + ৬টি রঙ + ১ ব্রাশ)"), extract clean name and detail
  if (name.includes('(')) {
    const match = name.match(/^([^(]+)(?:\((.+)\))?/);
    if (match) {
      name = match[1].trim();
      if (!included && match[2]) {
        included = match[2].trim();
      }
    }
  }

  // Also check titleBn parentheses if included is still empty
  if (!included && titleBn && titleBn.includes('(')) {
    const matchBn = titleBn.match(/^([^(]+)(?:\((.+)\))?/);
    if (matchBn) {
      if (!name) name = matchBn[1].trim();
      if (matchBn[2]) included = matchBn[2].trim();
    }
  }

  // If the extracted name matches or contains the product title, then what was in parentheses is the actual variation!
  if (
    !explicitName &&
    productTitleBn &&
    (name.toLowerCase().includes(productTitleBn.toLowerCase().replace(/[-–—]/g, ' ').trim()) ||
      productTitleBn.toLowerCase().includes(name.toLowerCase()))
  ) {
    if (included && !explicitDetail) {
      name = included;
      included = '';
    }
  }

  // If name has "12 piece" or "24 piece" or "48 piece", format nicely into Bangla
  if (!explicitName && (/12\s*piece/i.test(name) || /১২\s*পিস/.test(name))) {
    name = '১২ পিস সেট';
    if (!included) included = '১২টি শেপ + ৬টি রঙ + ১টি ব্রাশ';
  } else if (!explicitName && (/24\s*piece/i.test(name) || /২৪\s*পিস/.test(name))) {
    name = '২৪ পিস মেগা বক্স';
    if (!included) included = '২৪টি শেপ + ১২টি রঙ + ২টি ব্রাশ';
  } else if (!explicitName && (/48\s*piece/i.test(name) || /৪৮\s*পিস/.test(name) || /36\s*piece/i.test(name) || /৩৬\s*পিস/.test(name))) {
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
  return [];
}

function ProductContent() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const slug = (params?.slug as string) || 'car-painting-kit---12-piece-set-english';
  const { addItem } = useCart();

  const allProducts = getAllProducts();
  const initialProduct: SampleProduct | null = getProductBySlug(slug) || null;
  const [product, setProduct] = useState<SampleProduct | null>(initialProduct);
  const [isLoading, setIsLoading] = useState<boolean>(!initialProduct);
  const [notFound, setNotFound] = useState<boolean>(false);

  const [deliverySettings, setDeliverySettings] = useState<{
    dhakaRate?: number;
    outsideDhakaRate?: number;
    freeShippingEnabled?: boolean;
    freeDeliveryThreshold?: number;
  }>({
    dhakaRate: BRAND_CONFIG.defaultDeliveryDhaka,
    outsideDhakaRate: BRAND_CONFIG.defaultDeliveryOutside,
    freeShippingEnabled: true,
    freeDeliveryThreshold: BRAND_CONFIG.freeDeliveryThreshold,
  });

  useEffect(() => {
    fetch('/api/delivery-charges')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setDeliverySettings(data.settings);
        }
      })
      .catch(() => {});
  }, []);

  // Sync when slug changes or fetch latest from DB
  useEffect(() => {
    let isMounted = true;
    const memProd = getProductBySlug(slug);
    if (memProd) {
      setProduct(memProd);
      setIsLoading(false);
    }
    fetch(`/api/products/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          if (data?.success && data?.product) {
            setProduct(data.product);
            setNotFound(false);
          } else if (!memProd) {
            setNotFound(true);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          if (!memProd) setNotFound(true);
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Media: Images + Videos
  const { images: galleryImages, videos: productVideos } = useMemo(() => {
    if (!product) return { images: [], videos: [] };
    return getProductMedia(product);
  }, [product]);

  // Gallery Active Image & Video Modal
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [overrideHeroImage, setOverrideHeroImage] = useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);
  const [activeVideoModal, setActiveVideoModal] = useState<ProductVideo | null>(null);
  const [activeHighlightVideoIndex, setActiveHighlightVideoIndex] = useState<number>(0);

  // Dynamic What's in the Box List
  const boxItemsList: string[] = useMemo(() => {
    if (product?.boxItems && Array.isArray(product.boxItems) && product.boxItems.length > 0) {
      return product.boxItems;
    }
    if (product?.pieces) {
      if (product.pieces.includes('\n')) {
        return product.pieces.split('\n').map((s) => s.trim()).filter(Boolean);
      }
      if (product.pieces.includes('+')) {
        return product.pieces.split('+').map((s) => s.trim()).filter(Boolean);
      }
      if (product.pieces.includes(',')) {
        return product.pieces.split(',').map((s) => s.trim()).filter(Boolean);
      }
      return [product.pieces.trim()];
    }
    return [
      'প্রিমিয়াম কোয়ালিটি মোল্ডেড মোমের শেপ ও কালার সেট',
      '১০০% নিরাপদ নন-টক্সিক ওয়াটার কালার বোতল ও রঙ',
      'শিশুদের উপযোগী নরম গ্রিপ ফাইন আর্ট ব্রাশ',
      'রঙ মেলানোর কালার প্যালেট ও ডেমো গাইডবুক',
      'নিরাপদ গিফট প্যাকেজিং বক্স',
    ];
  }, [product]);

  // Dynamic FAQ list
  const faqsList = useMemo(() => {
    if (product?.faqs && Array.isArray(product.faqs) && product.faqs.length > 0) {
      return product.faqs.filter((f) => f && f.question && f.answer);
    }
    return [
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
    ];
  }, [product]);

  // Variations list - Only products that explicitly have variations
  const variations = useMemo(() => {
    if (product?.variants && product.variants.length > 0) {
      return product.variants;
    }
    if (product?.variations && product.variations.length > 0) {
      return product.variations;
    }
    return [];
  }, [product]);

  const isVariable = variations.length > 0;

  // Default to first available in-stock option
  // Default to first available in-stock option
  const firstAvailableIndex = useMemo(() => {
    if (variations.length === 0) return 0;
    const idx = variations.findIndex((v) => v.isActive !== false && Number(v.stock ?? (v as any).stockQuantity ?? 0) > 0);
    return idx !== -1 ? idx : 0;
  }, [variations]);

  const [selectedVariationIndex, setSelectedVariationIndex] = useState<number>(firstAvailableIndex);
  const [variationQuantities, setVariationQuantities] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [addedToast, setAddedToast] = useState<boolean>(false);

  useEffect(() => {
    setSelectedVariationIndex(firstAvailableIndex);
    setOverrideHeroImage(null);
    setQuantity(1);
    if (variations.length > 0) {
      const activeV = variations[firstAvailableIndex];
      const key = activeV?.sku || activeV?.id || (activeV as any)?._id || `var-${firstAvailableIndex}`;
      setVariationQuantities({ [key]: 1 });
    } else {
      setVariationQuantities({});
    }
  }, [firstAvailableIndex, slug, variations]);

  // Selected variations list (all variations with qty > 0)
  const selectedVariationsList = useMemo(() => {
    if (variations.length === 0) return [];
    return variations
      .map((v, idx) => {
        const key = v.sku || v.id || (v as any)._id || `var-${idx}`;
        const qty = variationQuantities[key] || 0;
        const vRegular = Number(v.regularPrice || v.price || 0);
        const vSale = Number(v.salePrice && v.salePrice > 0 ? v.salePrice : vRegular);
        const vPrice = vSale > 0 ? vSale : vRegular;
        return {
          key,
          variation: v,
          quantity: qty,
          index: idx,
          price: vPrice,
        };
      })
      .filter((item) => item.quantity > 0);
  }, [variations, variationQuantities]);

  const currentVariation = isVariable
    ? (selectedVariationsList[0]?.variation || variations[selectedVariationIndex] || variations[0])
    : null;

  // Total selected count
  const totalSelectedCount = useMemo(() => {
    if (!isVariable) return quantity;
    return selectedVariationsList.reduce((acc, item) => acc + item.quantity, 0);
  }, [isVariable, quantity, selectedVariationsList]);

  // Stock status (Section 7 Requirement)
  const currentStock = isVariable
    ? Number(currentVariation?.stock ?? (currentVariation as any)?.stockQuantity ?? 0)
    : Number(product?.stock ?? 0);

  const lowStockAlert = isVariable
    ? Number(currentVariation?.lowStockAlert ?? product?.lowStockAlert ?? 5)
    : Number(product?.lowStockAlert ?? 5);

  const isAllOutOfStock = isVariable
    ? variations.every((v) => v.isActive === false || Number(v.stock ?? (v as any).stockQuantity ?? 0) <= 0)
    : currentStock <= 0;

  const isCurrentOutOfStock = isVariable
    ? (currentVariation ? (currentVariation.isActive === false || currentStock <= 0) : true)
    : currentStock <= 0;

  const isOutOfStock = isAllOutOfStock || (!isVariable && currentStock <= 0);
  const isLowStock = !isOutOfStock && currentStock > 0 && currentStock <= lowStockAlert;

  // Starting price for variable products
  const minPrice = useMemo(() => {
    if (!isVariable || variations.length === 0) return 0;
    const prices = variations.map((v) => {
      const vRegular = Number(v.regularPrice || v.price || 0);
      const vSale = Number(v.salePrice && v.salePrice > 0 ? v.salePrice : vRegular);
      return vSale > 0 ? vSale : vRegular;
    });
    return Math.min(...prices);
  }, [isVariable, variations]);

  // Price calculations
  const regularPrice = isVariable
    ? Number(currentVariation?.regularPrice ?? currentVariation?.price ?? 0)
    : Number(product?.regularPrice ?? product?.basePrice ?? product?.price ?? 0);

  const salePrice = isVariable
    ? (currentVariation?.salePrice && Number(currentVariation.salePrice) > 0 && Number(currentVariation.salePrice) < regularPrice ? Number(currentVariation.salePrice) : null)
    : (product?.salePrice && Number(product.salePrice) > 0 && Number(product.salePrice) < regularPrice ? Number(product.salePrice) : (product?.baseSalePrice && Number(product.baseSalePrice) > 0 && Number(product.baseSalePrice) < regularPrice ? Number(product.baseSalePrice) : null));

  const activePrice = salePrice ? salePrice : regularPrice;
  const currentPrice = activePrice;
  const currentOriginalPrice = regularPrice;

  // Total selected price
  const totalSelectedPrice = useMemo(() => {
    if (!isVariable) return activePrice * quantity;
    return selectedVariationsList.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [isVariable, activePrice, quantity, selectedVariationsList]);

  const discountPercent =
    (salePrice && regularPrice > salePrice)
      ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
      : 0;

  // Multi-set variation checkbox toggle handler
  const handleToggleVariation = (idx: number) => {
    const chosen = variations[idx];
    const vStock = Number(chosen.stock ?? (chosen as any).stockQuantity ?? 0);
    if (chosen.isActive === false || vStock <= 0) return;

    setSelectedVariationIndex(idx);
    const key = chosen.sku || chosen.id || (chosen as any)._id || `var-${idx}`;
    const isCurrentlyChecked = (variationQuantities[key] || 0) > 0;

    if (!isCurrentlyChecked && (chosen.imageUrl || (chosen as any).image)) {
      setOverrideHeroImage(chosen.imageUrl || (chosen as any).image);
    }

    setVariationQuantities((prev) => {
      const current = prev[key] || 0;
      const next = { ...prev };
      if (current > 0) {
        delete next[key];
      } else {
        next[key] = 1;
      }
      return next;
    });
  };

  // Multi-set variation quantity updater
  const handleUpdateVariationQty = (idx: number, delta: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const chosen = variations[idx];
    const vStock = Number(chosen.stock ?? (chosen as any).stockQuantity ?? 0);
    if (chosen.isActive === false || vStock <= 0) return;

    const key = chosen.sku || chosen.id || (chosen as any)._id || `var-${idx}`;

    setVariationQuantities((prev) => {
      const current = prev[key] || 0;
      const nextQty = current + delta;

      if (nextQty <= 0) {
        const next = { ...prev };
        delete next[key];
        return next;
      }

      if (nextQty > vStock) {
        toast.info(`সর্বোচ্চ স্টক ${toBanglaDigits(vStock)}টি`);
        return prev;
      }

      return {
        ...prev,
        [key]: nextQty,
      };
    });
  };

  // Short description computation
  const displayShortDesc = useMemo(() => {
    if (!product) return '';
    return (
      product.shortDescriptionBn?.trim() ||
      product.shortDescriptionEn?.trim() ||
      (product.description ? product.description.split('\n')[0].slice(0, 180) : '')
    );
  }, [product]);

  // Below fold tabs
  const [activeTab, setActiveTab] = useState<'desc' | 'box' | 'videos' | 'faq'>('desc');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Recently Viewed state
  const [recentlyViewed, setRecentlyViewed] = useState<SampleProduct[]>([]);

  // Next / Prev Image Navigation
  const handlePrevImage = () => {
    setOverrideHeroImage(null);
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
  };

  const handleNextImage = () => {
    setOverrideHeroImage(null);
    setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
  };

  // Track Recently Viewed & Meta pixel
  useEffect(() => {
    if (!product) return;
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

      // Unified Meta Pixel & CAPI ViewContent tracking
      trackViewContent({
        id: product.id,
        title: product.titleEn || product.titleBn,
        category: product.categorySlug,
        price: activePrice || currentPrice,
        variantTitle: currentVariation?.titleEn || currentVariation?.optionValue,
        sku: currentVariation?.sku || (product as any).sku,
      });
    }
  }, [product?.slug, currentPrice, activePrice, currentVariation?.sku, product?.titleEn, product?.categorySlug]);

  // Add to Cart handler
  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;

    if (isVariable) {
      if (selectedVariationsList.length === 0) {
        toast.error('অনুগ্রহ করে কমপক্ষে একটি ভ্যারিয়েন্ট সিলেক্ট করুন');
        return;
      }

      selectedVariationsList.forEach(({ variation: v, quantity: qty, price: vPrice }) => {
        const vSku = v.sku || '';
        const vTitle = v.optionValue || v.titleEn || '';
        const vTitleBn = v.optionValue || v.titleBn || v.titleEn || '';
        const vImg = v.imageUrl || (v as any).image || galleryImages[0] || product.imageUrl;

        addItem({
          id: `${product.id}-${v.id || (v as any)._id || v.sku}`,
          productId: product.id,
          productSlug: product.slug,
          title: product.titleEn,
          titleBn: product.titleBn,
          imageUrl: vImg,
          price: vPrice,
          quantity: qty,
          variationSku: vSku,
          variationTitle: vTitle,
          variationTitleBn: vTitleBn,
        });

        // Track AddToCart with CAPI
        trackAddToCart({
          id: product.id,
          title: product.titleEn || product.titleBn,
          category: product.categorySlug,
          price: vPrice,
          quantity: qty,
          variantTitle: vTitleBn || vTitle,
          sku: vSku,
        });
      });

      setAddedToast(true);
      if (selectedVariationsList.length > 1) {
        toast.success(`${toBanglaDigits(selectedVariationsList.length)}টি ভ্যারিয়েন্ট কার্টে যোগ করা হয়েছে!`);
      } else {
        toast.success(`'${selectedVariationsList[0].variation.optionValue || selectedVariationsList[0].variation.titleBn || product.titleBn}' কার্টে যোগ করা হয়েছে!`);
      }
      setTimeout(() => setAddedToast(false), 2500);
      return;
    }

    addItem({
      id: `${product.id}-default`,
      productId: product.id,
      productSlug: product.slug,
      title: product.titleEn,
      titleBn: product.titleBn,
      imageUrl: galleryImages[0] || product.imageUrl,
      price: currentPrice,
      quantity,
    });

    // Track AddToCart with CAPI
    trackAddToCart({
      id: product.id,
      title: product.titleEn || product.titleBn,
      category: product.categorySlug,
      price: currentPrice,
      quantity,
      sku: (product as any).sku,
    });

    setAddedToast(true);
    toast.success(`'${product.titleBn}' কার্টে যোগ করা হয়েছে!`);
    setTimeout(() => setAddedToast(false), 2500);
  };

  // Direct Buy Now handler -> Adds to Cart & Routes directly to Checkout
  const handleBuyNow = () => {
    if (!product || isOutOfStock) return;

    if (isVariable) {
      if (selectedVariationsList.length === 0) {
        toast.error('অনুগ্রহ করে কমপক্ষে একটি ভ্যারিয়েন্ট সিলেক্ট করুন');
        return;
      }

      const checkoutItems: any[] = [];
      selectedVariationsList.forEach(({ variation: v, quantity: qty, price: vPrice }) => {
        const vSku = v.sku || '';
        const vTitle = v.optionValue || v.titleEn || '';
        const vTitleBn = v.optionValue || v.titleBn || v.titleEn || '';
        const vImg = v.imageUrl || (v as any).image || galleryImages[0] || product.imageUrl;

        addItem({
          id: `${product.id}-${v.id || (v as any)._id || v.sku}`,
          productId: product.id,
          productSlug: product.slug,
          title: product.titleEn,
          titleBn: product.titleBn,
          imageUrl: vImg,
          price: vPrice,
          quantity: qty,
          variationSku: vSku,
          variationTitle: vTitle,
          variationTitleBn: vTitleBn,
        });

        // Track AddToCart with CAPI
        trackAddToCart({
          id: product.id,
          title: product.titleEn || product.titleBn,
          category: product.categorySlug,
          price: vPrice,
          quantity: qty,
          variantTitle: vTitleBn || vTitle,
          sku: vSku,
        });

        checkoutItems.push({
          id: `${product.id}-${v.id || (v as any)._id || v.sku}`,
          title: `${product.titleBn} (${vTitleBn || vTitle})`,
          price: vPrice,
          quantity: qty,
          sku: vSku,
        });
      });

      trackInitiateCheckout(checkoutItems, totalSelectedPrice);
      router.push('/checkout');
      return;
    }

    addItem({
      id: `${product.id}-default`,
      productId: product.id,
      productSlug: product.slug,
      title: product.titleEn,
      titleBn: product.titleBn,
      imageUrl: galleryImages[0] || product.imageUrl,
      price: currentPrice,
      quantity,
    });

    // Track AddToCart & InitiateCheckout with CAPI
    trackAddToCart({
      id: product.id,
      title: product.titleEn || product.titleBn,
      category: product.categorySlug,
      price: currentPrice,
      quantity,
      sku: (product as any).sku,
    });
    trackInitiateCheckout(
      [
        {
          id: `${product.id}-default`,
          title: product.titleBn,
          price: currentPrice,
          quantity,
          sku: (product as any).sku,
        },
      ],
      currentPrice * quantity
    );

    router.push('/checkout');
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
    if (!product) return [];
    return allProducts
      .filter((p) => p.slug !== product.slug)
      .slice(0, 4);
  }, [allProducts, product?.slug]);

  // Selected variation short name for live total
  const selectedParsed = useMemo(() => {
    if (!currentVariation || !product) return { name: 'স্ট্যান্ডার্ড প্যাক', included: '' };
    return parseVariationDetails(
      currentVariation.titleBn || currentVariation.optionValue || '',
      currentVariation.titleEn || currentVariation.optionValue || '',
      product.titleBn,
      product.titleEn,
      (currentVariation as any).detail || (currentVariation as any).whatsInIt || (currentVariation as any).descriptionBn || (currentVariation as any).attributes?.detail,
      (currentVariation as any).name || (currentVariation as any).attributes?.colorSet
    );
  }, [currentVariation, product?.titleBn, product?.titleEn]);

  if (isLoading || !product) {
    if (notFound) {
      return (
        <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
          <Header />
          <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center">
            <h2 className="text-3xl font-extrabold text-[#2B2B2B] mb-3">পণ্যটি পাওয়া যায়নি</h2>
            <p className="text-lg text-[#666666] mb-8 max-w-md">আপনি যে পণ্যটি খুঁজছেন তা মুছে ফেলা হয়েছে বা লিংকটি সঠিক নয়।</p>
            <Link href="/shop" className="px-8 py-3.5 rounded-full bg-[#D6403B] text-white font-bold text-base hover:bg-[#BF3430] transition-colors shadow-sm">
              সকল পণ্য দেখুন
            </Link>
          </div>
          <Footer />
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 w-full animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 aspect-square bg-[#EFE9E0] rounded-3xl" />
            <div className="lg:col-span-5 space-y-5">
              <div className="h-10 bg-[#EFE9E0] rounded-xl w-3/4" />
              <div className="h-6 bg-[#EFE9E0] rounded-lg w-1/2" />
              <div className="h-14 bg-[#EFE9E0] rounded-xl w-1/3" />
              <div className="h-44 bg-[#EFE9E0] rounded-2xl" />
              <div className="h-14 bg-[#EFE9E0] rounded-2xl" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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
              {Boolean(overrideHeroImage?.trim() || galleryImages[activeImageIndex]?.trim() || product.imageUrl?.trim()) ? (
                <Image
                  src={(overrideHeroImage?.trim() || galleryImages[activeImageIndex]?.trim() || product.imageUrl?.trim()) as string}
                  alt={product.titleBn}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl text-[#BDB5A8]">
                  🎨
                </div>
              )}

              {/* Discount Badge */}
              {discountPercent > 0 && (
                <div className="absolute top-3.5 right-3.5 z-10">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D6403B] text-white shadow-sm">
                    {toBanglaDigits(discountPercent)}% ছাড়
                  </span>
                </div>
              )}

              {/* Watch Video Demo Trigger Button on Main Stage */}
              {productVideos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveVideoModal(productVideos[0])}
                  className="absolute bottom-3.5 left-3.5 px-3 py-2 rounded-xl bg-black/80 hover:bg-[#D6403B] text-white shadow-md transition-all duration-200 cursor-pointer flex items-center gap-2 text-xs font-bold z-10 group/btn"
                  title="ভিডিও ডেমো দেখতে ক্লিক করুন"
                >
                  <div className="w-4 h-4 rounded-full bg-[#D6403B] group-hover/btn:bg-white text-white group-hover/btn:text-[#D6403B] flex items-center justify-center transition-colors">
                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                  </div>
                  <span>ভিডিও ডেমো দেখুন</span>
                </button>
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

            {/* Single row of thumbnails (Photos + Videos) */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {/* Photo Thumbnails */}
              {galleryImages.map((img, idx) => {
                if (!img || !img.trim()) return null;
                const isActive = activeImageIndex === idx;
                return (
                  <button
                    key={`img-${idx}`}
                    type="button"
                    onClick={() => {
                      setOverrideHeroImage(null);
                      setActiveImageIndex(idx);
                    }}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#FAF7F2] border-2 transition-all cursor-pointer flex-shrink-0 group ${
                      isActive && !overrideHeroImage
                        ? 'border-[#D6403B] shadow-sm ring-2 ring-[#D6403B]/20 scale-95'
                        : 'border-[#EFE9E0] hover:border-[#D6403B]/60 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <Image src={img.trim()} alt={`থাম্বনেইল ${idx + 1}`} fill className="object-cover" />
                  </button>
                );
              })}

              {/* Video Thumbnails in the same row */}
              {productVideos.map((vid, vIdx) => {
                const vidThumb = vid.thumbnailUrl?.trim() || galleryImages[vIdx]?.trim() || product.imageUrl?.trim();
                return (
                  <button
                    key={vid.id || `vid-${vIdx}`}
                    type="button"
                    onClick={() => setActiveVideoModal(vid)}
                    className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-black border-2 border-[#FFC93C] hover:border-[#D6403B] transition-all cursor-pointer flex-shrink-0 group shadow-2xs"
                    title={`${vid.titleBn} (ভিডিও দেখতে ক্লিক করুন)`}
                  >
                    {/* Poster Thumbnail */}
                    {vidThumb ? (
                      <Image
                        src={vidThumb}
                        alt={vid.titleBn}
                        fill
                        unoptimized
                        className="object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full bg-stone-900" />
                    )}

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
                );
              })}
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
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FDE2E1] text-[#D6403B]">
                  <AlertCircle className="w-3.5 h-3.5" />
                  স্টক শেষ
                </span>
              ) : isLowStock ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706]">
                  <Clock className="w-3.5 h-3.5" />
                  মাত্র {toBanglaDigits(currentStock)}টি বাকি
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E6F4EA] text-[#137333]">
                  স্টকে আছে, এখনই অর্ডার করুন
                </span>
              )}

              <span className="text-xs font-mono text-[#6B6B6B]">
                SKU: {currentVariation?.sku || product.slug.slice(0, 10).toUpperCase()}
              </span>
            </div>

            {/* 2. Title in Bangla (large, easy to read), English title below in grey */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1A1A1A] leading-tight">
                {product.titleBn}
              </h1>
              {product.titleEn && (
                <p className="text-sm sm:text-base text-[#6B6B6B] mt-1 font-medium">
                  {product.titleEn}
                </p>
              )}
            </div>

            {/* 3. Rating row: stars and average */}
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <div className="flex items-center text-[#FFC93C]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current text-[#FFC93C]" />
                ))}
              </div>
              <span className="font-bold text-[#2B2B2B]">{product.rating || 4.9}</span>
              <span className="text-[#6B6B6B] text-xs font-medium">/ ৫.০</span>
            </div>

            {/* Short Description */}
            {displayShortDesc && (
              <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-[#FAF7F2] to-[#FFF9F3] border border-[#EFE9E0] text-sm sm:text-base text-[#3A3A3A] leading-relaxed shadow-2xs">
                <p className="font-medium leading-relaxed">
                  {displayShortDesc}
                </p>
              </div>
            )}

            {/* 4. Price Display */}
            {isVariable ? (
              <div className="flex items-baseline gap-2 pt-1 flex-wrap">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#B93834] font-siliguri">
                  {formatBDT(minPrice, { locale: 'bn' })}
                </span>
                <span className="text-sm sm:text-base font-semibold text-[#6B6B6B]">
                  থেকে শুরু
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-3 pt-1 flex-wrap">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#B93834]">
                  {formatBDT(activePrice, { locale: 'bn' })}
                </span>
                {salePrice && regularPrice > salePrice && (
                  <span className="text-lg sm:text-xl text-[#757575] line-through font-medium">
                    {formatBDT(regularPrice, { locale: 'bn' })}
                  </span>
                )}
                {discountPercent > 0 && (
                  <StatusPill variant="red">
                    {toBanglaDigits(discountPercent)}% ছাড়
                  </StatusPill>
                )}
              </div>
            )}

            {/* 5. Variation Cards Selector (Matching User Mockup) */}
            {isVariable && (
              <div className="space-y-3 pt-3 border-t border-[#EFEAE2]">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-[#1A1A1A]">
                      {product.optionName || 'Select Set'}
                    </span>
                    <span className="text-xs font-medium text-[#555] bg-[#EFEAE2] px-2.5 py-0.5 rounded-full">
                      {variations.length} options
                    </span>
                  </div>
                  <span className="text-xs font-medium text-[#9B2C2C] bg-[#FDE8E8] px-3 py-1 rounded-full">
                    Tick more than one set and set a quantity for each
                  </span>
                </div>

                {/* Variation Cards */}
                <div className="space-y-3">
                  {variations.map((v, idx) => {
                    const key = v.sku || v.id || (v as any)._id || `var-${idx}`;
                    const varQty = variationQuantities[key] || 0;
                    const isSelected = varQty > 0;
                    const vStock = Number(v.stock ?? (v as any).stockQuantity ?? 0);
                    const isOutOfStockVar = v.isActive === false || vStock <= 0;
                    const isLowStockVar = !isOutOfStockVar && vStock > 0 && vStock <= (v.lowStockAlert || 10);
                    const vRegularPrice = Number(v.regularPrice || v.price || 0);
                    const vSalePrice = Number(v.salePrice && v.salePrice > 0 ? v.salePrice : vRegularPrice);
                    const vPrice = vSalePrice > 0 ? vSalePrice : vRegularPrice;

                    // Number badge (e.g. 12, 24, 48)
                    const pieceMatch = (v.optionValue || v.titleEn || v.titleBn || '').match(/\d+/);
                    const pieceNum = pieceMatch ? pieceMatch[0] : (idx + 1);

                    // Badge background color palette matching mockup:
                    // 1st: navy #1E295B, 2nd: purple #522766, 3rd: slate #71717A
                    const badgeBgColors = [
                      'bg-[#1E295B]',
                      'bg-[#522766]',
                      'bg-[#71717A]',
                      'bg-[#0B5F85]',
                      'bg-[#83284F]',
                    ];
                    const badgeBg = isOutOfStockVar ? 'bg-[#71717A]' : badgeBgColors[idx % badgeBgColors.length];

                    const optTitle = v.optionValue || v.titleEn || v.titleBn || `Option ${idx + 1}`;
                    const optDetail = v.detail || (v as any).whatsInIt || (v as any).descriptionBn || (v as any).attributes?.detail;

                    return (
                      <div
                        key={key}
                        onClick={() => {
                          if (isOutOfStockVar) return;
                          handleToggleVariation(idx);
                        }}
                        className={`rounded-2xl transition-all border p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isOutOfStockVar
                            ? 'bg-[#FAF7F2]/80 border-[#EFEAE2] opacity-75 cursor-not-allowed'
                            : isSelected
                            ? 'bg-white border-2 border-[#B93834] shadow-xs cursor-pointer'
                            : 'bg-white border border-[#EFEAE2] hover:border-[#B93834]/50 cursor-pointer shadow-2xs'
                        }`}
                      >
                        {/* Left: Checkbox + Piece Badge + Title & Bengali details */}
                        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                          {/* Checkbox */}
                          <div className="shrink-0">
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-md bg-[#B93834] text-white flex items-center justify-center shadow-xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className={`w-5 h-5 rounded-md border-2 ${isOutOfStockVar ? 'border-gray-300 bg-gray-100' : 'border-gray-300 bg-white hover:border-[#B93834]'}`} />
                            )}
                          </div>

                          {/* Dark Square Number Badge */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white shrink-0 ${badgeBg} shadow-2xs select-none`}>
                            {pieceNum}
                          </div>

                          {/* Title, Details & Stock Status */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-base text-[#1A1A1A] leading-snug">
                                {optTitle}
                              </h3>
                              {v.badge && (
                                <span className="text-[10px] font-bold text-[#D6403B] bg-[#FDE2E1] px-2 py-0.5 rounded-full">
                                  {v.badge}
                                </span>
                              )}
                            </div>

                            {optDetail && (
                              <p className="text-xs text-[#555] font-siliguri mt-0.5 leading-relaxed">
                                {optDetail}
                              </p>
                            )}

                            {/* Stock Indicator */}
                            <div className="mt-1">
                              {isOutOfStockVar ? (
                                <span className="inline-block text-xs font-bold text-[#D6403B] bg-[#FDE2E1] px-2 py-0.5 rounded-md">
                                  স্টক শেষ
                                </span>
                              ) : isLowStockVar ? (
                                <span className="text-xs font-bold text-[#DC2626]">
                                  মাত্র {toBanglaDigits(vStock)}টি বাকি
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-[#16A34A]">
                                  স্টকে আছে
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Prices + Quantity Stepper (if selected) or Stock Out Badge */}
                        <div className="flex items-center justify-between sm:justify-end gap-3.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EFEAE2] shrink-0">
                          {/* Prices */}
                          <div className="text-left sm:text-right">
                            <div className="flex items-baseline gap-1.5 sm:justify-end">
                              <span className={`text-lg sm:text-xl font-black ${isOutOfStockVar ? 'text-[#71717A] line-through' : 'text-[#B93834]'}`}>
                                {formatBDT(vPrice, { locale: 'bn' })}
                              </span>
                              {!isOutOfStockVar && vRegularPrice > vPrice && (
                                <span className="text-xs text-[#71717A] line-through block">
                                  {formatBDT(vRegularPrice, { locale: 'bn' })}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity Stepper (if selected and in stock) */}
                          {isSelected && !isOutOfStockVar && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center border border-[#EFEAE2] rounded-lg bg-white overflow-hidden shadow-2xs"
                            >
                              <button
                                type="button"
                                onClick={(e) => handleUpdateVariationQty(idx, -1, e)}
                                disabled={varQty <= 1 && totalSelectedCount <= 1}
                                className="w-8 h-8 flex items-center justify-center text-sm font-bold text-[#2B2B2B] hover:bg-[#FAF7F2] active:bg-[#FDE8E8] transition-colors cursor-pointer disabled:opacity-40"
                                title="কমান"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 text-center text-sm font-bold text-[#1A1A1A] select-none">
                                {varQty}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleUpdateVariationQty(idx, 1, e)}
                                disabled={varQty >= vStock}
                                className="w-8 h-8 flex items-center justify-center text-sm font-bold text-[#2B2B2B] hover:bg-[#FAF7F2] active:bg-[#FDE8E8] transition-colors cursor-pointer disabled:opacity-40"
                                title="বাড়ান"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Out of stock badge on right */}
                          {isOutOfStockVar && (
                            <span className="text-xs font-bold text-[#D6403B] bg-[#FDE2E1] px-2.5 py-1 rounded-md">
                              স্টক শেষ
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selection Summary Box ("Your selection (X sets)") */}
                {selectedVariationsList.length > 0 && (
                  <div className="bg-[#FAF8F5] border border-[#EFEAE2] rounded-2xl p-4 sm:p-5 mt-4 space-y-3">
                    <h4 className="font-bold text-sm sm:text-base text-[#1A1A1A]">
                      Your selection ({totalSelectedCount} {totalSelectedCount === 1 ? 'set' : 'sets'})
                    </h4>
                    <div className="space-y-2">
                      {selectedVariationsList.map((item) => (
                        <div key={item.key} className="flex items-center justify-between text-sm">
                          <span className="text-[#333]">
                            {item.variation.optionValue || item.variation.titleEn || item.variation.titleBn} × {item.quantity}
                          </span>
                          <span className="font-semibold text-[#1A1A1A]">
                            ৳{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-[#EFEAE2] pt-2" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-[#1A1A1A]">Total</span>
                      <span className="text-xl sm:text-2xl font-black text-[#B93834]">
                        ৳{totalSelectedPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. Quantity stepper for non-variable products only */}
            {!isVariable && (
              <div className="space-y-2.5 pt-3 border-t border-[#EFEAE2]">
                <div className="flex items-center justify-between">
                  <span className="text-sm sm:text-base font-bold text-[#2B2B2B]">অর্ডারের পরিমাণ:</span>
                  <div className="flex items-center bg-[#FAF7F2] border border-[#EFE9E0] rounded-full p-1.5 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#2B2B2B] hover:text-[#D6403B] shadow-2xs cursor-pointer disabled:opacity-40 transition-colors"
                      title="কমান"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-extrabold text-lg sm:text-xl font-siliguri tracking-wider">
                      {toBanglaDigits(quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                      disabled={quantity >= currentStock || isOutOfStock}
                      className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#2B2B2B] hover:text-[#D6403B] shadow-2xs cursor-pointer disabled:opacity-40 transition-colors"
                      title="বাড়ান"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Live Total Line for non-variable product */}
                <div className="bg-[#FAF7F2] rounded-xl px-4 py-3 border border-[#EFE9E0] text-sm sm:text-base font-medium text-[#2B2B2B] flex items-center justify-between gap-2 flex-wrap">
                  <span className="truncate max-w-md flex items-center gap-1.5">
                    <span className="text-[#555]">
                      {product.titleBn || product.titleEn}{' '}
                      × <strong className="font-bold text-base sm:text-lg text-[#2B2B2B]">{quantity}</strong>
                    </span>
                  </span>
                  <span className="font-black text-base sm:text-xl text-[#C23631] shrink-0">
                    Total ৳{(activePrice * quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* 7. Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Primary Action: Order Now */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock || (isVariable && totalSelectedCount === 0)}
                  className="py-3.5 px-6 rounded-xl bg-[#B93834] hover:bg-[#A32F2C] active:scale-[0.98] text-white font-bold text-base flex items-center justify-center shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{isOutOfStock ? 'Stock Out' : 'Order Now'}</span>
                </button>

                {/* 2. Secondary Action: Add to Cart */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || (isVariable && totalSelectedCount === 0)}
                  className="py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer border-2 border-[#B93834] text-[#B93834] hover:bg-[#B93834]/5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addedToast ? (
                    <>
                      <Check className="w-5 h-5 text-[#1F6B43]" />
                      <span className="text-[#1F6B43]">কার্টে যোগ হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      <span>
                        {isOutOfStock
                          ? 'Stock Out'
                          : isVariable
                          ? `Add ${totalSelectedCount > 0 ? `${totalSelectedCount} set${totalSelectedCount > 1 ? 's' : ''}` : ''} to Cart`
                          : 'Add to Cart'}
                      </span>
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
                    ঢাকা ৳{deliverySettings.dhakaRate ?? BRAND_CONFIG.defaultDeliveryDhaka}, বাইরে ৳{deliverySettings.outsideDhakaRate ?? BRAND_CONFIG.defaultDeliveryOutside}।
                    {deliverySettings.freeShippingEnabled !== false && ` ৳${deliverySettings.freeDeliveryThreshold ?? BRAND_CONFIG.freeDeliveryThreshold}+ এ ফ্রি!`}
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
            PRODUCT VIDEO DEMO HIGHLIGHT (Prominent Embedded Showcase)
           ===================================================================== */}
        {productVideos.length > 0 && (() => {
          const mainVideo = productVideos[activeHighlightVideoIndex] || productVideos[0];
          const embedInfo = getVideoEmbedInfo(mainVideo.url);
          return (
            <div className="bg-gradient-to-br from-[#FFF9F3] via-[#FAF7F2] to-white rounded-2xl border-2 border-[#FFE8D6] p-5 sm:p-7 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D6403B] text-white flex items-center justify-center shadow-md shrink-0">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#D6403B] bg-[#FDE8E7] px-2 py-0.5 rounded-full">
                        রিয়েল ভিডিও
                      </span>
                      <span className="text-xs text-[#6B6B6B]">Product Video / আসল ভিডিও</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#2B2B2B]">
                      প্রোডাক্ট রিয়েল ভিডিও (Real Product Video)
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  {productVideos.length > 1 && (
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#EFE9E0] shadow-2xs">
                      {productVideos.map((vid, vIdx) => {
                        const isSelected = (activeHighlightVideoIndex === vIdx) || (!productVideos[activeHighlightVideoIndex] && vIdx === 0);
                        return (
                          <button
                            key={vid.id || vIdx}
                            type="button"
                            onClick={() => setActiveHighlightVideoIndex(vIdx)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#D6403B] text-white shadow-2xs'
                                : 'text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-[#FAF7F2]'
                            }`}
                          >
                            ভিডিও {toBanglaDigits(vIdx + 1)}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveVideoModal(mainVideo)}
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#D6403B] hover:text-[#B02824] bg-white px-4 py-2 rounded-xl border border-[#EFE9E0] hover:border-[#D6403B] shadow-2xs transition-all cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>ফুল স্ক্রিনে দেখুন</span>
                  </button>
                </div>
              </div>

              {/* Video Player Frame */}
              <div className="relative aspect-video max-w-3xl mx-auto rounded-2xl overflow-hidden bg-black shadow-lg border border-[#EFE9E0]">
                {embedInfo.isEmbed ? (
                  <iframe
                    key={mainVideo.url}
                    src={embedInfo.embedUrl.replace('autoplay=1', 'autoplay=0')}
                    title={mainVideo.titleBn}
                    className="w-full h-full border-0"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    key={mainVideo.url}
                    src={mainVideo.url}
                    controls
                    poster={mainVideo.thumbnailUrl}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>
          );
        })()}

        {/* =====================================================================
            BELOW THE FOLD: STICKY TABS (বিবরণ, বাক্সে কী আছে, ডেমো ভিডিও, রিভিউ, প্রশ্নোত্তর)
           ===================================================================== */}
        <div id="reviews-section" className="bg-white rounded-2xl border border-[#EFE9E0] p-5 sm:p-8 shadow-xs space-y-6">
          {/* Tabs Navigation Header */}
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[#EFE9E0] scrollbar-none text-sm sm:text-base font-bold sticky top-16 bg-white z-20 pt-1">
            {[
              { id: 'desc', label: 'বিবরণ' },
              { id: 'box', label: 'বাক্সে কী আছে' },
              ...(productVideos.length > 0 ? [{ id: 'videos', label: `ডেমো ভিডিও (${toBanglaDigits(productVideos.length)})` }] : []),
              { id: 'faq', label: `প্রশ্নোত্তর (${toBanglaDigits(faqsList.length)})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
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
            </div>
          )}

          {/* TAB 2: বাক্সে কী আছে (What's in the Box) */}
          {activeTab === 'box' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-bold text-sm text-[#2B2B2B]">
                <PackageCheck className="w-4 h-4 text-[#D6403B]" />
                <span>প্যাকেজে অন্তর্ভুক্ত উপাদানসমূহ:</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm">
                {boxItemsList.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D6403B] shrink-0 mt-1.5" />
                    <span className="text-[#2B2B2B] leading-relaxed font-medium">{item}</span>
                  </li>
                ))}
              </ul>
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
                      {(vid.thumbnailUrl?.trim() || galleryImages[idx]?.trim() || product.imageUrl?.trim()) ? (
                        <Image
                          src={(vid.thumbnailUrl?.trim() || galleryImages[idx]?.trim() || product.imageUrl?.trim()) as string}
                          alt={vid.titleBn}
                          fill
                          unoptimized
                          className="object-cover opacity-75 group-hover:opacity-50 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-full bg-stone-900" />
                      )}
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

          {/* TAB: প্রশ্নোত্তর (FAQ) */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              {faqsList.map((faq, idx) => (
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
            RELATED PRODUCTS (4)
           ===================================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xl text-[#2B2B2B]">
              Related Products
            </h3>
            <Link href="/shop" className="text-xs font-bold text-[#D6403B] hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
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
              Recently Viewed Products
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
            <div className="relative w-full aspect-square max-h-[80vh] rounded-2xl overflow-hidden bg-white shadow-2xl flex items-center justify-center">
              {(galleryImages[activeImageIndex]?.trim() || product.imageUrl?.trim()) ? (
                <Image
                  src={(galleryImages[activeImageIndex]?.trim() || product.imageUrl?.trim()) as string}
                  alt={product.titleBn}
                  fill
                  className="object-contain"
                />
              ) : (
                <span className="text-6xl">🎨</span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2 overflow-x-auto max-w-full pb-1">
              {galleryImages.map((img, i) => {
                if (!img || !img.trim()) return null;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 relative transition-all ${
                      activeImageIndex === i
                        ? 'border-[#D6403B] scale-105'
                        : 'border-white/40 opacity-70'
                    }`}
                  >
                    <Image src={img.trim()} alt="Thumbnail" fill className="object-cover" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIDEO MODAL (Supports YouTube, Vimeo, and Direct Video Files)
         ========================================================================= */}
      {activeVideoModal && (() => {
        const videoInfo = getVideoEmbedInfo(activeVideoModal.url);
        return (
          <Modal
            isOpen={!!activeVideoModal}
            onClose={() => setActiveVideoModal(null)}
            title={activeVideoModal.titleBn}
            description={activeVideoModal.duration ? `দৈর্ঘ্য: ${activeVideoModal.duration}` : undefined}
            maxWidth="lg"
          >
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
              {videoInfo.isEmbed ? (
                <iframe
                  src={videoInfo.embedUrl}
                  title={activeVideoModal.titleBn}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <video
                  src={activeVideoModal.url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </Modal>
        );
      })()}

      {/* =========================================================================
          MOBILE STICKY "ORDER NOW" BUY BAR (Rule: Option name, total price, order button)
         ========================================================================= */}
      {/* =========================================================================
          MOBILE STICKY "ORDER NOW" BUY BAR (Rule: Option name, total price, order button)
         ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-[#EFE9E0] py-2 px-3 flex items-center justify-between gap-2 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] pb-safe">
        {/* Quick Product Thumb & Live Total Price */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#EFE9E0] shrink-0 flex items-center justify-center">
            {(overrideHeroImage?.trim() || currentVariation?.imageUrl?.trim() || galleryImages[0]?.trim() || product.imageUrl?.trim()) ? (
              <Image
                src={(overrideHeroImage?.trim() || currentVariation?.imageUrl?.trim() || galleryImages[0]?.trim() || product.imageUrl?.trim()) as string}
                alt={product.titleBn}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-sm">🎨</span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-[#2B2B2B] truncate leading-tight">
              {isVariable
                ? selectedVariationsList.length > 1
                  ? `${toBanglaDigits(totalSelectedCount)}টি সেট নির্বাচিত`
                  : (selectedVariationsList[0]?.variation.optionValue || selectedVariationsList[0]?.variation.titleBn || currentVariation?.optionValue || product.titleBn)
                : product?.titleBn || product?.titleEn}
            </span>
            <span className="text-xs font-extrabold text-[#C23631]">
              Total ৳{totalSelectedPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons: Add to Cart + Buy Now */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || (isVariable && totalSelectedCount === 0)}
            className="p-2.5 rounded-xl bg-[#FAF7F2] text-[#D6403B] border border-[#EFE9E0] font-bold text-xs flex items-center justify-center active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="Add to Cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock || (isVariable && totalSelectedCount === 0)}
            className="py-2.5 px-3.5 rounded-xl bg-[#B93834] hover:bg-[#A32F2C] text-white font-bold text-xs flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="whitespace-nowrap">{isOutOfStock ? 'Stock Out' : 'Order Now'}</span>
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
