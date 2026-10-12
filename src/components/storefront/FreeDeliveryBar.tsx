'use client';

import React from 'react';
import { Truck, Sparkles } from 'lucide-react';
import { formatBDT } from '@/lib/utils';

interface FreeDeliveryBarProps {
  currentSubtotal: number;
  freeDeliveryThreshold?: number;
  locale?: 'bn' | 'en';
}

export function FreeDeliveryBar({
  currentSubtotal,
  freeDeliveryThreshold = 1000,
  locale = 'bn',
}: FreeDeliveryBarProps) {
  const remaining = Math.max(0, freeDeliveryThreshold - currentSubtotal);
  const percentage = Math.min(100, Math.round((currentSubtotal / freeDeliveryThreshold) * 100));
  const isUnlocked = remaining === 0;

  return (
    <div className="bg-white border border-[#EFE9E0] rounded-[18px] p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm mb-2 font-medium">
        <div className="flex items-center gap-2">
          {isUnlocked ? (
            <Sparkles className="w-5 h-5 text-[#FFC93C]" />
          ) : (
            <Truck className="w-5 h-5 text-[#5BC0EB]" />
          )}
          <span className="font-semibold text-[#2B2B2B]">
            {isUnlocked ? (
              <span className="text-[#2D7A3E]">
                {locale === 'bn'
                  ? '🎉 অভিনন্দন! আপনি ফ্রি ডেলিভারি পাচ্ছেন!'
                  : '🎉 Congratulations! You unlocked Free Delivery!'}
              </span>
            ) : (
              <span>
                {locale === 'bn' ? (
                  <>
                    আর মাত্র <strong className="text-[#FF6B6B]">{formatBDT(remaining, { locale })}</strong> যোগ করলেই{' '}
                    <strong className="text-[#2D7A3E]">ফ্রি ডেলিভারি!</strong>
                  </>
                ) : (
                  <>
                    Add <strong className="text-[#FF6B6B]">{formatBDT(remaining, { locale })}</strong> more for{' '}
                    <strong className="text-[#2D7A3E]">Free Delivery!</strong>
                  </>
                )}
              </span>
            )}
          </span>
        </div>
        <span className="text-xs font-bold text-[#6B6B6B]">{percentage}%</span>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-[#FAF7F2] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#EFE9E0]">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isUnlocked ? 'bg-[#7BD389]' : 'bg-gradient-to-r from-[#FFC93C] to-[#FF6B6B]'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
