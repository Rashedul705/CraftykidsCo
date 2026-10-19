'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Check, Heart, Star, Zap } from 'lucide-react';
import { formatBDT } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

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
  onQuickAdd?: (id: string) => void;
}

export function ProductCard({
  id,
  slug,
  title,
  price,
  salePrice,
  badge,
  ageBadgeText,
  safetyBadgeText,
  rating = 4.9,
  imageUrl,
  locale = 'bn',
  onQuickAdd,
}: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const discountPercent = salePrice
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  const currentPrice = salePrice || price;

  // 1. Add to Cart Handler (Stays on page with feedback)
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    setAdded(true);
    if (onQuickAdd) onQuickAdd(id);
    setTimeout(() => setAdded(false), 1500);
  };

  // 2. Order Now Handler (Adds to cart & navigates directly to checkout)
  const handleOrderNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    router.push('/checkout');
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const displayBadge = badge || (discountPercent > 0 ? `-${discountPercent}%` : ageBadgeText || safetyBadgeText);

  return (
    <div className="group relative bg-white border border-[#EBE5DC] rounded-2xl overflow-hidden p-2.5 sm:p-3 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 flex flex-col justify-between">
      {/* Top action badges */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        {/* Left Badge: Cyan / Teal Pill */}
        {displayBadge ? (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E0F7FA] text-[#00796B] border border-[#B2EBF2] shadow-xs pointer-events-auto">
            {displayBadge}
          </span>
        ) : (
          <span />
        )}

        {/* Right: Wishlist Heart */}
        <button
          type="button"
          onClick={handleWishlist}
          className={`w-7 h-7 rounded-full bg-white/95 border border-[#E5E0D8] flex items-center justify-center shadow-xs transition-colors pointer-events-auto cursor-pointer ${
            isWishlisted ? 'text-[#E53935]' : 'text-[#888] hover:text-[#E53935]'
          }`}
          aria-label="Wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Product Image Link */}
      <Link href={`/product/${slug}`} className="block relative w-full aspect-square rounded-xl bg-[#FAF8F5] overflow-hidden mb-2.5">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      {/* Info & Action */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          {/* Subtle Rating */}
          <div className="flex items-center gap-1 text-[11px] text-[#888] mb-1">
            <div className="flex items-center text-[#FFB300]">
              <Star className="w-3 h-3 fill-current" />
            </div>
            <span className="font-bold text-[#444]">{rating}</span>
            <span className="text-[#AAA]">• নিরাপদ</span>
          </div>

          {/* Product Title */}
          <Link href={`/product/${slug}`} className="block">
            <h3 className="font-heading font-bold text-xs sm:text-sm text-[#222222] group-hover:text-[#E53935] transition-colors line-clamp-2 min-h-[34px] sm:min-h-[38px] leading-snug">
              {title}
            </h3>
          </Link>
        </div>

        {/* Price & Two Action Buttons */}
        <div className="mt-2.5">
          {/* Pricing */}
          <div className="flex items-baseline gap-2 mb-2.5">
            <span className="text-base sm:text-lg font-black text-[#E53935]">
              {formatBDT(currentPrice, { locale })}
            </span>
            {salePrice && (
              <span className="text-xs font-semibold text-[#999999] line-through">
                {formatBDT(price, { locale })}
              </span>
            )}
          </div>

          {/* TWO BUTTONS: Add to Cart & Order Now */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {/* Button 1: Add to Cart */}
            <button
              type="button"
              onClick={handleAddToCart}
              className={`py-2 px-1.5 sm:px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all duration-200 cursor-pointer border ${
                added
                  ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]'
                  : 'bg-[#FAF8F5] border-[#DFD7CC] hover:bg-[#F2ECE4] text-[#333333] active:scale-[0.98]'
              }`}
              title="Add to Cart"
            >
              {added ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span className="text-[11px] sm:text-xs">Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 text-[#555]" />
                  <span className="text-[11px] sm:text-xs">Add to Cart</span>
                </>
              )}
            </button>

            {/* Button 2: Order Now */}
            <button
              type="button"
              onClick={handleOrderNow}
              className="py-2 px-1.5 sm:px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all duration-200 cursor-pointer bg-[#E53935] hover:bg-[#D32F2F] active:scale-[0.98] text-white shadow-xs"
              title="Order Now"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="text-[11px] sm:text-xs">Order Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
