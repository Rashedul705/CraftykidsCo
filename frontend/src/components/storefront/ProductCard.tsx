'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Check, Heart, Star, Zap } from 'lucide-react';
import { formatBDT, toBanglaDigits } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { trackAddToCart, trackInitiateCheckout } from '@/lib/analytics';

export interface ProductCardProps {
  id: string;
  slug: string;
  title: string;
  titleEn?: string;
  price: number;
  salePrice?: number | null;
  badge?: string;
  ageBadgeText?: string;
  safetyBadgeText?: string;
  rating?: number;
  reviewCount?: number;
  imageUrl: string;
  locale?: 'bn' | 'en';
  hasVariations?: boolean;
  variants?: any[];
  lowestPrice?: number;
  stock?: number;
  isOutOfStock?: boolean;
  onQuickAdd?: (id: string) => void;
}

export function ProductCard({
  id,
  slug,
  title,
  titleEn,
  price,
  salePrice,
  badge,
  ageBadgeText,
  safetyBadgeText,
  rating = 4.9,
  imageUrl,
  locale = 'bn',
  hasVariations = false,
  variants,
  lowestPrice,
  stock,
  isOutOfStock = false,
  onQuickAdd,
}: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const outOfStock = Boolean(isOutOfStock || (typeof stock === 'number' && stock <= 0));
  const isBn = locale === 'bn';
  const discountPercent = salePrice
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  const currentPrice = salePrice || price;

  // Calculate lowest price if hasVariations (Section 7 Requirement: "Product cards on listings show the lowest price as 'From ৳1200'")
  const effectiveLowestPrice = React.useMemo(() => {
    if (!hasVariations) return currentPrice;
    if (typeof lowestPrice === 'number' && lowestPrice > 0) return lowestPrice;
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const activeVars = variants.filter((v: any) => v.isActive !== false);
      const list = activeVars.length > 0 ? activeVars : variants;
      const prices = list
        .map((v: any) => Number((v.salePrice && v.salePrice > 0) ? v.salePrice : (v.regularPrice ?? v.price ?? currentPrice)))
        .filter((p: number) => !isNaN(p) && p > 0);
      if (prices.length > 0) return Math.min(...prices);
    }
    return currentPrice;
  }, [hasVariations, lowestPrice, variants, currentPrice]);

  // 1. Add to Cart Handler (Stays on page with feedback)
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (outOfStock) return;

    if (hasVariations) {
      router.push(`/product/${slug}`);
      return;
    }

    addItem({
      id: `${id}-${Date.now()}`,
      productId: id,
      productSlug: slug,
      title: title,
      titleBn: title,
      imageUrl: imageUrl,
      price: currentPrice,
      quantity: 1,
    });

    trackAddToCart({
      id,
      title: titleEn || title,
      price: currentPrice,
      quantity: 1,
    });

    setAdded(true);
    if (onQuickAdd) onQuickAdd(id);
    setTimeout(() => setAdded(false), 1500);
  };

  // 2. Order Now Handler (Adds to cart & navigates directly to checkout)
  const handleOrderNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (outOfStock) return;

    if (hasVariations) {
      router.push(`/product/${slug}`);
      return;
    }

    addItem({
      id: `${id}-${Date.now()}`,
      productId: id,
      productSlug: slug,
      title: title,
      titleBn: title,
      imageUrl: imageUrl,
      price: currentPrice,
      quantity: 1,
    });

    trackAddToCart({
      id,
      title: titleEn || title,
      price: currentPrice,
      quantity: 1,
    });

    trackInitiateCheckout(
      [
        {
          id,
          title: titleEn || title,
          price: currentPrice,
          quantity: 1,
        },
      ],
      currentPrice
    );

    router.push('/checkout');
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const displayBadge = outOfStock
    ? 'Stock Out'
    : badge ||
      (discountPercent > 0
        ? isBn
          ? `${toBanglaDigits(discountPercent)}% ছাড়`
          : `-${discountPercent}%`
        : ageBadgeText || safetyBadgeText);

  return (
    <div
      className={`group relative bg-white border border-[#EFE9E0] rounded-2xl overflow-hidden p-2.5 sm:p-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between ${
        outOfStock ? 'opacity-90' : ''
      }`}
    >
      {/* Top action badges */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-10 flex items-center justify-between pointer-events-none">
        {/* Left Badge: Soft Cyan Pill or Red Stock Out Pill */}
        {displayBadge ? (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border shadow-2xs pointer-events-auto ${
              outOfStock
                ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]'
                : 'bg-[#DDF1FB] text-[#0B5F85] border-[#BEE4F7]'
            }`}
          >
            {displayBadge}
          </span>
        ) : (
          <span />
        )}

        {/* Right: Wishlist Heart */}
        <button
          type="button"
          onClick={handleWishlist}
          className={`w-7 h-7 rounded-full bg-white/95 border border-[#EFE9E0] flex items-center justify-center shadow-2xs transition-colors pointer-events-auto cursor-pointer ${
            isWishlisted ? 'text-[#D6403B]' : 'text-[#6B6B6B] hover:text-[#D6403B]'
          }`}
          aria-label="Wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Product Image Link */}
      <Link
        href={`/product/${slug}`}
        className="block relative w-full aspect-square rounded-xl bg-[#FAF7F2] overflow-hidden mb-2.5"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
              outOfStock ? 'grayscale-[25%]' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-[#BDB5A8]">
            🎨
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-black/75 text-white font-bold text-xs px-3 py-1 rounded-full shadow-sm tracking-wide">
              Stock Out
            </span>
          </div>
        )}
      </Link>

      {/* Info & Action */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          {/* Subtle Rating */}
          <div className="flex items-center gap-1 text-[11px] text-[#6B6B6B] mb-1">
            <div className="flex items-center text-[#FFC93C]">
              <Star className="w-3 h-3 fill-current" />
            </div>
            <span className="font-bold text-[#2B2B2B]">{rating}</span>
            <span className="text-[#D1D5DB]">•</span>
            <span className="text-[#1F6B43] font-medium">{isBn ? 'নিরাপদ' : 'Safe'}</span>
          </div>

          {/* Product Title */}
          <Link href={`/product/${slug}`} className="block">
            <h3 className="font-bold text-xs sm:text-sm text-[#2B2B2B] group-hover:text-[#D6403B] transition-colors line-clamp-2 min-h-[34px] sm:min-h-[38px] leading-snug">
              {title}
            </h3>
          </Link>
        </div>

        {/* Price & Action Buttons */}
        <div className="mt-2.5">
          {/* Pricing */}
          <div className="flex items-baseline gap-1.5 mb-2 flex-wrap">
            {hasVariations && (
              <span className="text-xs text-[#6B6B6B] font-bold">
                From
              </span>
            )}
            <span className="text-base sm:text-lg font-extrabold text-[#C23631]">
              {formatBDT(hasVariations ? effectiveLowestPrice : currentPrice, { locale })}
            </span>
            {!hasVariations && salePrice && (
              <span className="text-xs text-[#6B6B6B] line-through font-normal">
                {formatBDT(price, { locale })}
              </span>
            )}
          </div>

          {/* TWO BUTTONS: Add to Cart & Order Now (English Labels) */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {/* Button 1: Add to Cart / Select Options / Stock Out */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock}
              className={`py-2 px-1.5 sm:px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all duration-200 border ${
                outOfStock
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : added
                  ? 'bg-[#DDF3E6] border-[#BDE6CE] text-[#1F6B43] cursor-pointer'
                  : 'bg-[#FAF7F2] border-[#EFE9E0] hover:bg-[#F2ECE4] text-[#2B2B2B] active:scale-[0.98] cursor-pointer'
              }`}
              title={outOfStock ? 'Stock Out' : 'Add to Cart'}
            >
              {outOfStock ? (
                <span className="text-[11px] sm:text-xs text-gray-400">Stock Out</span>
              ) : added ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#1F6B43]" />
                  <span className="text-[11px] sm:text-xs">Added!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 text-[#6B6B6B]" />
                  <span className="text-[11px] sm:text-xs">
                    {hasVariations ? 'Select Options' : 'Add to Cart'}
                  </span>
                </>
              )}
            </button>

            {/* Button 2: Order Now / Stock Out */}
            <button
              type="button"
              onClick={handleOrderNow}
              disabled={outOfStock}
              className={`py-2 px-1.5 sm:px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all duration-200 shadow-2xs ${
                outOfStock
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#D6403B] hover:bg-[#BF3430] active:scale-[0.98] text-white cursor-pointer'
              }`}
              title={outOfStock ? 'Stock Out' : 'Order Now'}
            >
              <span className="text-[11px] sm:text-xs">
                {outOfStock ? 'Stock Out' : 'Order Now'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
