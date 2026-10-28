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
    if (product?.variations && product.variations.length > 0) {
      return product.variations;
    }
    return [];
  }, [product]);

  // Default to first available option
  const firstAvailableIndex = useMemo(() => {
    if (variations.length === 0) return 0;
    const idx = variations.findIndex((v) => (v.stock ?? 1) > 0);
    return idx !== -1 ? idx : 0;
  }, [variations]);

  const [selectedVariationIndex, setSelectedVariationIndex] = useState<number>(firstAvailableIndex);
  const [variationError, setVariationError] = useState<string | null>(null);

  // Variation quantities state (sku/id -> quantity)
  const [variationQuantities, setVariationQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    setSelectedVariationIndex(firstAvailableIndex);
    setVariationError(null);
    setOverrideHeroImage(null);
    if (variations.length > 0) {
      const activeV = variations[firstAvailableIndex];
      const key = activeV?.sku || activeV?.id || `var-${firstAvailableIndex}`;
      setVariationQuantities({ [key]: 1 });
    } else {
      setVariationQuantities({});
    }
  }, [firstAvailableIndex, slug, variations]);

  // Active selected variations list (all variations with qty > 0)
  const selectedVariationsList = useMemo(() => {
    if (variations.length === 0) return [];
    return variations
      .filter((v, idx) => {
        const key = v.sku || v.id || `var-${idx}`;
        return (variationQuantities[key] || 0) > 0;
      })
      .map((v, idx) => {
        const key = v.sku || v.id || `var-${idx}`;
        const name =
          (v as any).name ||
          (v.titleEn ? v.titleEn.split('(')[0]?.trim() : '') ||
          v.titleBn?.split('(')[0]?.trim() ||
          'Item';
        return {
          variation: v,
          name,
          quantity: variationQuantities[key] || 1,
          index: idx,
        };
      });
  }, [variations, variationQuantities]);

  const currentVariation = variations.length > 0
    ? (selectedVariationsList[0]?.variation || variations[selectedVariationIndex] || variations[0])
    : null;

  // Single quantity state (for products without variations)
  const [quantity, setQuantity] = useState<number>(1);
  const [addedToast, setAddedToast] = useState<boolean>(false);

  // Total quantity across selected variations (or single quantity)
  const totalSelectedCount = useMemo(() => {
    if (variations.length === 0) return quantity;
    return selectedVariationsList.reduce((acc, item) => acc + item.quantity, 0);
  }, [variations.length, quantity, selectedVariationsList]);

  // Total calculated price
  const totalSelectedPrice = useMemo(() => {
    if (variations.length === 0) {
      const p = product?.salePrice || product?.baseSalePrice || product?.price || product?.basePrice || 0;
      return p * quantity;
    }
    return selectedVariationsList.reduce((acc, item) => {
      const p = item.variation.salePrice || item.variation.price;
      return acc + p * item.quantity;
    }, 0);
  }, [variations.length, product, quantity, selectedVariationsList]);

  // Total original price (before discount)
  const totalOriginalPrice = useMemo(() => {
    if (variations.length === 0) {
      const p = product?.price || product?.basePrice || product?.salePrice || 0;
      return p * quantity;
    }
    return selectedVariationsList.reduce((acc, item) => {
      const p = item.variation.price || item.variation.salePrice;
      return acc + p * item.quantity;
    }, 0);
  }, [variations.length, product, quantity, selectedVariationsList]);

  // Base display prices
  const currentPrice = currentVariation
    ? currentVariation.salePrice || currentVariation.price
    : product?.salePrice || product?.baseSalePrice || product?.price || product?.basePrice || 0;

  const currentOriginalPrice = currentVariation
    ? currentVariation.price
    : product?.price || product?.basePrice || currentPrice;

  const discountPercent =
    totalOriginalPrice > totalSelectedPrice
      ? Math.round(((totalOriginalPrice - totalSelectedPrice) / totalOriginalPrice) * 100)
      : 0;

  // Short description computation
  const displayShortDesc = useMemo(() => {
    if (!product) return '';
    return (
      product.shortDescriptionBn?.trim() ||
      product.shortDescriptionEn?.trim() ||
      (product.description ? product.description.split('\n')[0].slice(0, 180) : '')
    );
  }, [product]);

  // Stock status
  const currentStock = currentVariation ? (currentVariation.stock ?? 20) : (product?.stock ?? 20);
  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock <= 10;

  // Below fold tabs
  const [activeTab, setActiveTab] = useState<'desc' | 'box' | 'videos' | 'faq'>('desc');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Recently Viewed state
  const [recentlyViewed, setRecentlyViewed] = useState<SampleProduct[]>([]);

  // Check if all available variations are currently selected
  const isAllVariationsSelected = useMemo(() => {
    if (variations.length <= 1) return false;
    const available = variations.filter((v) => (v.stock ?? 1) > 0);
    return (
      available.length > 0 &&
      available.every((v, idx) => {
        const key = v.sku || v.id || `var-${idx}`;
        return (variationQuantities[key] || 0) > 0;
      })
    );
  }, [variations, variationQuantities]);

  // Select all or reset variations
  const handleSelectAllVariations = () => {
    if (isAllVariationsSelected) {
      const first = variations[firstAvailableIndex];
      const key = first?.sku || first?.id || `var-${firstAvailableIndex}`;
      setVariationQuantities({ [key]: 1 });
      toast.info('প্রথম ভ্যারিয়েন্টে রিসেট করা হয়েছে');
    } else {
      const next: Record<string, number> = {};
      variations.forEach((v, idx) => {
        if ((v.stock ?? 1) > 0) {
          const key = v.sku || v.id || `var-${idx}`;
          next[key] = variationQuantities[key] || 1;
        }
      });
      setVariationQuantities(next);
      toast.success('সব ভ্যারিয়েন্ট একসাথে সিলেক্ট করা হয়েছে!');
    }
  };

  // Toggle variation selection (checkbox click or card tap)
  const handleToggleVariation = (idx: number) => {
    const chosen = variations[idx];
    if (!chosen || (chosen.stock ?? 1) <= 0) return;

    setSelectedVariationIndex(idx);
    const key = chosen.sku || chosen.id || `var-${idx}`;
    const isCurrentlyChecked = (variationQuantities[key] || 0) > 0;

    // If selecting, switch hero image to this variation if it has an image
    if (!isCurrentlyChecked && chosen.imageUrl) {
      setOverrideHeroImage(chosen.imageUrl);
      const foundIdx = galleryImages.findIndex((img) => img === chosen.imageUrl);
      if (foundIdx !== -1) {
        setActiveImageIndex(foundIdx);
      }
    }

    setVariationQuantities((prev) => {
      const current = prev[key] || 0;
      const next = { ...prev };
      if (current > 0) {
        const count = Object.values(prev).filter((q) => q > 0).length;
        if (count > 1) {
          delete next[key];
        } else {
          toast.info('কমপক্ষে একটি ভ্যারিয়েন্ট সিলেক্ট থাকতে হবে');
          return prev;
        }
      } else {
        next[key] = 1;
      }
      return next;
    });
    setVariationError(null);
  };

  // Update quantity of an individual variation
  const handleUpdateVariationQty = (idx: number, delta: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const chosen = variations[idx];
    if (!chosen || (chosen.stock ?? 1) <= 0) return;

    const key = chosen.sku || chosen.id || `var-${idx}`;
    const maxStock = chosen.stock ?? 99;

    setVariationQuantities((prev) => {
      const current = prev[key] || 0;
      const nextQty = current + delta;

      if (nextQty <= 0) {
        const count = Object.values(prev).filter((q) => q > 0).length;
        if (count > 1) {
          const next = { ...prev };
          delete next[key];
          return next;
        } else {
          return prev;
        }
      }

      if (nextQty > maxStock) {
        toast.info(`সর্বোচ্চ স্টক ${toBanglaDigits(maxStock)}টি`);
        return prev;
      }

      return {
        ...prev,
        [key]: nextQty,
      };
    });
  };

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

      if ((window as any).fbq) {
        (window as any).fbq('track', 'ViewContent', {
          content_name: product.titleEn,
          content_category: product.categorySlug,
          value: currentPrice,
          currency: 'BDT',
        });
      }
    }
  }, [product?.slug, currentPrice, product?.titleEn, product?.categorySlug]);

  // Add to Cart handler
  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;

    if (variations.length > 0) {
      if (selectedVariationsList.length === 0) {
        toast.error('অনুগ্রহ করে কমপক্ষে একটি ভ্যারিয়েন্ট সিলেক্ট করুন');
        return;
      }
      selectedVariationsList.forEach(({ variation: v, quantity: qty }) => {
        addItem({
          id: `${product.id}-${v.sku || v.id}`,
          productId: product.id,
          productSlug: product.slug,
          title: product.titleEn,
          titleBn: product.titleBn,
          imageUrl: v.imageUrl || galleryImages[0] || product.imageUrl,
          price: v.salePrice || v.price,
          quantity: qty,
          variationSku: v.sku,
          variationTitle: v.titleEn,
          variationTitleBn: v.titleBn,
        });
      });
      setAddedToast(true);
      if (selectedVariationsList.length > 1) {
        toast.success(`${toBanglaDigits(selectedVariationsList.length)}টি ভ্যারিয়েন্ট কার্টে যোগ করা হয়েছে!`);
      } else {
        toast.success(`'${selectedVariationsList[0].variation.titleBn || product.titleBn}' কার্টে যোগ করা হয়েছে!`);
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

    setAddedToast(true);
    toast.success(`'${product.titleBn}' কার্টে যোগ করা হয়েছে!`);
    setTimeout(() => setAddedToast(false), 2500);
  };

  // Direct Buy Now handler -> Adds to Cart & Routes directly to Checkout
  const handleBuyNow = () => {
    if (!product || isOutOfStock) return;

    if (variations.length > 0) {
      if (selectedVariationsList.length === 0) {
        toast.error('অনুগ্রহ করে কমপক্ষে একটি ভ্যারিয়েন্ট সিলেক্ট করুন');
        return;
      }
      selectedVariationsList.forEach(({ variation: v, quantity: qty }) => {
        addItem({
          id: `${product.id}-${v.sku || v.id}`,
          productId: product.id,
          productSlug: product.slug,
          title: product.titleEn,
          titleBn: product.titleBn,
          imageUrl: v.imageUrl || galleryImages[0] || product.imageUrl,
          price: v.salePrice || v.price,
          quantity: qty,
          variationSku: v.sku,
          variationTitle: v.titleEn,
          variationTitleBn: v.titleBn,
        });
      });

      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'InitiateCheckout', {
          content_name: product.titleEn,
          value: totalSelectedPrice,
          currency: 'BDT',
        });
      }

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

    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', {
        content_name: product.titleEn,
        value: currentPrice * quantity,
        currency: 'BDT',
      });
    }

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
      currentVariation.titleBn,
      currentVariation.titleEn,
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
              <Image
                src={overrideHeroImage || galleryImages[activeImageIndex] || product.imageUrl}
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
                    unoptimized
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

            {/* 2. Title in Bangla (large, easy to read), English title below in grey */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2B2B2B] leading-tight">
                {product.titleBn}
              </h1>
              {product.titleEn && (
                <p className="text-sm sm:text-base text-[#6B6B6B] mt-1.5 font-medium">
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

            {/* 4. Compact price: large sale price in red, old price struck through */}
            {/* 4. Compact price: large sale price in red, old price struck through */}
            <div className="flex items-baseline gap-3 pt-1 flex-wrap">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#C23631]">
                {formatBDT(totalSelectedPrice > 0 ? totalSelectedPrice : currentPrice, { locale: 'bn' })}
              </span>
              {totalOriginalPrice > (totalSelectedPrice > 0 ? totalSelectedPrice : currentPrice) && (
                <span className="text-lg sm:text-xl text-[#757575] line-through font-medium">
                  {formatBDT(totalOriginalPrice, { locale: 'bn' })}
                </span>
              )}
              {discountPercent > 0 && (
                <StatusPill variant="red">
                  {toBanglaDigits(discountPercent)}% ছাড়
                </StatusPill>
              )}
              {variations.length > 0 && selectedVariationsList.length > 1 && (
                <span className="text-xs font-bold text-[#D6403B] bg-[#FDE3E1] px-2.5 py-1 rounded-full border border-[#D6403B]/20">
                  মোট {toBanglaDigits(totalSelectedCount)}টি আইটেম
                </span>
              )}
            </div>

            {/* 5. Variation selector: Checkbox multi-select layout */}
            {variations.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-[#EFE9E0]">
                {/* Heading & Helper Badge + Select All Button */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-bold text-[#2B2B2B]">
                      Select Set:
                    </span>
                    <span className="text-xs text-[#6B6B6B] font-medium bg-[#FAF7F2] px-2 py-0.5 rounded-full border border-[#EFE9E0]">
                      {variations.length} {variations.length === 1 ? 'option' : 'options'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] sm:text-xs font-semibold text-[#D6403B] bg-[#FDE3E1]/70 px-2.5 py-1 rounded-full border border-[#D6403B]/25 flex items-center gap-1.5 shadow-2xs">
                      <Check className="w-3.5 h-3.5 stroke-[3] text-[#D6403B]" />
                      <span>Check (✓) to select multiple</span>
                    </span>

                    {variations.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSelectAllVariations}
                        className="text-xs font-bold text-[#555] hover:text-[#D6403B] hover:bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#EFE9E0] transition-colors cursor-pointer"
                      >
                        {isAllVariationsSelected ? 'Reset' : 'Select All'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Variation Cards: Checkbox items */}
                <div
                  role="group"
                  aria-label="Select Set"
                  className="space-y-2.5"
                >
                  {variations.map((v, idx) => {
                    const varKey = v.sku || v.id || `var-${idx}`;
                    const varQty = variationQuantities[varKey] || 0;
                    const isSelected = varQty > 0;
                    const vPrice = v.salePrice || v.price;
                    const vStock = v.stock ?? 20;
                    const vOutOfStock = vStock <= 0;
                    const vLowStock = vStock > 0 && vStock <= 10;
                    const parsed = parseVariationDetails(
                      v.titleBn,
                      v.titleEn,
                      product.titleBn,
                      product.titleEn,
                      (v as any).detail || (v as any).whatsInIt || (v as any).descriptionBn || (v as any).attributes?.detail,
                      (v as any).name || (v as any).attributes?.colorSet
                    );

                    return (
                      <div
                        key={varKey}
                        role="checkbox"
                        aria-checked={isSelected}
                        aria-disabled={vOutOfStock}
                        onClick={() => {
                          if (vOutOfStock) return;
                          handleToggleVariation(idx);
                        }}
                        className={`w-full p-3 sm:p-4 rounded-2xl border text-left transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          vOutOfStock
                            ? 'opacity-50 cursor-not-allowed bg-gray-50 border-[#EFE9E0]'
                            : isSelected
                            ? 'border-2 border-[#D6403B] bg-[#FDE3E1]/25 shadow-xs cursor-pointer ring-2 ring-[#D6403B]/10'
                            : 'border-[#EFE9E0] bg-white hover:border-[#D6403B]/60 hover:bg-[#FAF7F2]/40 cursor-pointer shadow-2xs'
                        }`}
                      >
                        {/* Left: Checkbox Icon + Image + Title & description */}
                        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                          {/* Modern Square Checkbox */}
                          <div className="shrink-0">
                            {isSelected ? (
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-[#D6403B] text-white flex items-center justify-center border-2 border-[#D6403B] shadow-xs transition-transform active:scale-95">
                                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg border-2 border-gray-300 bg-white hover:border-[#D6403B] transition-colors" />
                            )}
                          </div>

                          {/* Variation Thumbnail */}
                          {v.imageUrl && (
                            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#EFE9E0] shrink-0 shadow-2xs">
                              <Image src={v.imageUrl} alt={parsed.name} fill className="object-cover" />
                            </div>
                          )}

                          {/* Title & Included Details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base sm:text-lg font-bold text-[#2B2B2B] leading-tight">
                                {parsed.name}
                              </h3>
                              {v.badge && (
                                <span className="text-[10px] font-bold text-[#D6403B] bg-[#FDE3E1] px-2 py-0.5 rounded-full">
                                  {v.badge}
                                </span>
                              )}
                            </div>

                            {parsed.included && (
                              <p className="text-xs sm:text-sm text-[#555] leading-snug mt-1 font-siliguri">
                                {parsed.included}
                              </p>
                            )}

                            {/* Stock note */}
                            <div className="mt-1 flex items-center gap-2 text-xs">
                              {vOutOfStock ? (
                                <span className="font-bold text-[#9B2420]">স্টক শেষ</span>
                              ) : vLowStock ? (
                                <span className="font-bold text-[#7A4E00]">
                                  মাত্র {toBanglaDigits(vStock)}টি বাকি
                                </span>
                              ) : (
                                <span className="font-medium text-[#1F6B43]">স্টকে আছে</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Price + Quantity Stepper */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EFE9E0]/80 shrink-0">
                          <div className="text-left sm:text-right">
                            <div className="flex items-baseline gap-1.5 sm:justify-end">
                              <span className="text-lg sm:text-xl font-black text-[#C23631]">
                                {formatBDT(vPrice, { locale: 'bn' })}
                              </span>
                              {v.price > vPrice && (
                                <span className="text-xs sm:text-sm text-[#888] line-through font-medium">
                                  {formatBDT(v.price, { locale: 'bn' })}
                                </span>
                              )}
                            </div>
                            {isSelected && varQty > 1 && (
                              <p className="text-[11px] font-semibold text-[#666] sm:text-right">
                                Subtotal ({varQty}): ৳{(vPrice * varQty).toLocaleString()}
                              </p>
                            )}
                          </div>

                          {/* Individual Quantity Stepper on checked card */}
                          {isSelected ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center border border-[#D6403B]/30 bg-white rounded-xl shadow-2xs overflow-hidden"
                            >
                              <button
                                type="button"
                                onClick={(e) => handleUpdateVariationQty(idx, -1, e)}
                                disabled={varQty <= 1 && totalSelectedCount <= 1}
                                className="p-1.5 sm:p-2 hover:bg-[#FDE3E1]/40 text-[#2B2B2B] hover:text-[#D6403B] transition-colors cursor-pointer disabled:opacity-40"
                                title="কমান"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2.5 sm:px-3 text-xs sm:text-sm font-black text-[#2B2B2B] min-w-[28px] text-center font-siliguri">
                                {toBanglaDigits(varQty)}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleUpdateVariationQty(idx, 1, e)}
                                disabled={varQty >= vStock}
                                className="p-1.5 sm:p-2 hover:bg-[#FDE3E1]/40 text-[#2B2B2B] hover:text-[#D6403B] transition-colors cursor-pointer disabled:opacity-40"
                                title="বাড়ান"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-[#888] bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#EFE9E0] hidden sm:inline-block">
                              + টিক দিন
                            </span>
                          )}
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

            {/* 6. Quantity stepper (for products without variations) and live total line */}
            <div className="space-y-2.5 pt-3 border-t border-[#EFE9E0]">
              {/* Show single stepper only if product has NO variations */}
              {variations.length === 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm sm:text-base font-bold text-[#2B2B2B]">অর্ডারের পরিমাণ:</span>
                  <div className="flex items-center bg-[#FAF7F2] border border-[#EFE9E0] rounded-full p-1.5 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
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
                      disabled={quantity >= currentStock}
                      className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#2B2B2B] hover:text-[#D6403B] shadow-2xs cursor-pointer disabled:opacity-40 transition-colors"
                      title="বাড়ান"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Live Total Line */}
              <div className="bg-[#FAF7F2] rounded-xl px-4 py-3 border border-[#EFE9E0] text-sm sm:text-base font-medium text-[#2B2B2B] flex items-center justify-between gap-2 flex-wrap">
                <span className="truncate max-w-md flex items-center gap-1.5 flex-wrap">
                  {variations.length > 0 ? (
                    selectedVariationsList.length > 0 ? (
                      <span>
                        Selected <strong className="font-bold text-[#D6403B]">{totalSelectedCount}</strong> {totalSelectedCount === 1 ? 'item' : 'items'} (
                        {selectedVariationsList
                          .map((s) => `${s.name || s.variation.name} × ${s.quantity}`)
                          .join(', ')}
                        )
                      </span>
                    ) : (
                      <span className="text-[#D6403B] font-bold">
                        Please select at least 1 option
                      </span>
                    )
                  ) : (
                    <span>
                      {product.titleEn || product.titleBn} × <strong className="font-bold text-base sm:text-lg">{quantity}</strong>
                    </span>
                  )}
                </span>
                <span className="font-black text-base sm:text-xl text-[#C23631] shrink-0">
                  Total ৳{totalSelectedPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 7. Action Buttons: "Order Now" vs "Add to Cart" */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Primary Action: Order Now */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock || (variations.length > 0 && selectedVariationsList.length === 0)}
                  className="py-4 px-6 rounded-xl bg-[#D6403B] hover:bg-[#BF3430] active:scale-[0.98] text-white font-black text-base sm:text-lg flex items-center justify-center shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>
                    {isOutOfStock
                      ? 'Stock Out'
                      : variations.length > 0 && selectedVariationsList.length === 0
                      ? 'ভ্যারিয়েন্ট বাছুন'
                      : 'Order Now'}
                  </span>
                </button>

                {/* 2. Secondary Action: Add to Cart */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || (variations.length > 0 && selectedVariationsList.length === 0)}
                  className={`py-4 px-6 rounded-xl font-black text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer border-2 border-[#D6403B] text-[#D6403B] bg-transparent hover:bg-[#FDE3E1]/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {addedToast ? (
                    <>
                      <Check className="w-5 h-5 text-[#1F6B43]" />
                      <span className="text-[#1F6B43]">Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      <span>{isOutOfStock ? 'Stock Out' : 'Add to Cart'}</span>
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
                      <Image
                        src={vid.thumbnailUrl || galleryImages[idx] || product.imageUrl}
                        alt={vid.titleBn}
                        fill
                        unoptimized
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
              {variations.length > 0
                ? selectedVariationsList.length > 1
                  ? `${totalSelectedCount} items selected`
                  : selectedVariationsList[0]
                    ? `${selectedVariationsList[0].name} × ${selectedVariationsList[0].quantity}`
                    : selectedParsed.name
                : product?.titleEn || product?.titleBn}
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
            disabled={isOutOfStock}
            className="p-2.5 rounded-xl bg-[#FAF7F2] text-[#D6403B] border border-[#EFE9E0] font-bold text-xs flex items-center justify-center active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="Add to Cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="py-2.5 px-3.5 rounded-xl bg-[#D6403B] hover:bg-[#BF3430] text-white font-bold text-xs flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
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
