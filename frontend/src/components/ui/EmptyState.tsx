import React from 'react';
import { PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'w-full py-12 px-6 flex flex-col items-center justify-center text-center bg-white border border-[#EFE9E0] rounded-[16px]',
        className
      )}
    >
      <div className="w-14 h-14 rounded-full bg-[#FAF7F2] border border-[#EFE9E0] flex items-center justify-center text-[#6B6B6B] mb-4">
        {icon || <PackageOpen className="w-7 h-7 text-[#6B6B6B]" />}
      </div>

      <h3 className="text-lg font-bold text-[#2B2B2B] mb-1">{title}</h3>
      <p className="text-sm text-[#6B6B6B] max-w-sm mb-6 leading-relaxed">{description}</p>

      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
