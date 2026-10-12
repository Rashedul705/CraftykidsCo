import React from 'react';
import { ShieldCheck, Sparkles, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafetyBadgeProps {
  label: string;
  type?: 'safe' | 'age' | 'deal';
  className?: string;
}

export function Badge({ label, type = 'safe', className }: SafetyBadgeProps) {
  if (type === 'safe') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF8EE] text-[#2D7A3E] border border-[#C4EDCD]',
          className
        )}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-[#7BD389]" />
        {label}
      </span>
    );
  }

  if (type === 'age') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F7FD] text-[#197AA5] border border-[#BFE4F7]',
          className
        )}
      >
        <Smile className="w-3.5 h-3.5 text-[#5BC0EB]" />
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF9E6] text-[#A67800] border border-[#FFE899]',
        className
      )}
    >
      <Sparkles className="w-3.5 h-3.5 text-[#FFC93C]" />
      {label}
    </span>
  );
}
