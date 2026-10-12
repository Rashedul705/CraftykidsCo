'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ShoppingBag, Check } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatBDT } from '@/lib/utils';

export interface ProductCardProps {
  id: string;
  slug: string;
  title: string;
  titleEn?: string;
  price: number;
  salePrice?: number | null;
  ageBadgeText?: string;
  safetyBadgeText?: string;
  imageUrl: string;
  hoverImageUrl?: string;
  locale?: 'bn' | 'en';
  onQuickAdd?: (id: string) => void;
}

export function ProductCard({
  id,
  title,
  price,
  salePrice,
  ageBadgeText = '২+ বছর',
  safetyBadgeText = '১০০% নিরাপদ',
  imageUrl,
  hoverImageUrl,
  locale = 'bn',
  onQuickAdd,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [added, setAdded] = useState(false);

  const displayImage = isHovered && hoverImageUrl ? hoverImageUrl : imageUrl;
  const discountPercent = salePrice
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    setAdded(true);
    if (onQuickAdd) onQuickAdd(id);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      className="group relative bg-white border border-[#EFE9E0] rounded-[22px] overflow-hidden p-3 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(43,43,43,0.08)] hover:-translate-y-1 flex flex-col justify-between"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top badges */}
      <div className="absolute top-5 left-5 right-5 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex flex-col gap-1 items-start">
          {safetyBadgeText && <Badge label={safetyBadgeText} type="safe" />}
          {discountPercent > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#FF6B6B] text-white shadow-sm">
              -{discountPercent}%
            </span>
          )}
        </div>
        {ageBadgeText && <Badge label={ageBadgeText} type="age" />}
      </div>

      {/* Product Image */}
      <div className="relative w-full aspect-square rounded-[18px] bg-[#FAF7F2] overflow-hidden mb-3">
        <Image
          src={displayImage}
          alt={title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Product Info */}
      <div className="flex flex-col flex-1 px-1">
        <h3 className="font-heading font-semibold text-base sm:text-lg text-[#2B2B2B] group-hover:text-[#FF6B6B] transition-colors line-clamp-2 min-h-[44px]">
          {title}
        </h3>

        {/* Pricing */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black text-[#FF6B6B]">
            {formatBDT(salePrice || price, { locale })}
          </span>
          {salePrice && (
            <span className="text-sm font-medium text-[#6B6B6B] line-through">
              {formatBDT(price, { locale })}
            </span>
          )}
        </div>

        {/* Quick Add Button */}
        <button
          onClick={handleAdd}
          className={`mt-3 w-full py-2.5 px-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
            added
              ? 'bg-[#7BD389] text-white'
              : 'bg-[#FFC93C] hover:bg-[#F6BA22] text-[#2B2B2B] shadow-[0_3px_10px_rgba(255,201,60,0.35)]'
          }`}
        >
          {added ? (
            <>
              <Check className="w-4 h-4" />
              {locale === 'bn' ? 'যোগ হয়েছে!' : 'Added!'}
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              {locale === 'bn' ? 'কার্টে যোগ করুন' : 'Quick Add'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
