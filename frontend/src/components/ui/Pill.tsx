import React from 'react';
import { cn } from '@/lib/utils';

export type PillVariant = 'yellow' | 'blue' | 'green' | 'red' | 'neutral';

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: PillVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  dot?: boolean;
}

const variantStyles: Record<PillVariant, { bg: string; text: string; dotColor: string }> = {
  // Yellow pill: bg #FFF3CC, text #7A4E00
  yellow: {
    bg: 'bg-[#FFF3CC]',
    text: 'text-[#7A4E00]',
    dotColor: 'bg-[#7A4E00]',
  },
  // Blue pill: bg #DDF1FB, text #0B5F85
  blue: {
    bg: 'bg-[#DDF1FB]',
    text: 'text-[#0B5F85]',
    dotColor: 'bg-[#0B5F85]',
  },
  // Green pill: bg #DDF3E6, text #1F6B43
  green: {
    bg: 'bg-[#DDF3E6]',
    text: 'text-[#1F6B43]',
    dotColor: 'bg-[#1F6B43]',
  },
  // Red pill: bg #FDE3E1, text #9B2420
  red: {
    bg: 'bg-[#FDE3E1]',
    text: 'text-[#9B2420]',
    dotColor: 'bg-[#9B2420]',
  },
  // Neutral soft pill
  neutral: {
    bg: 'bg-[#F0ECE4]',
    text: 'text-[#555555]',
    dotColor: 'bg-[#777777]',
  },
};

export function StatusPill({
  children,
  variant = 'yellow',
  size = 'md',
  icon,
  dot = false,
  className,
  ...props
}: PillProps) {
  const styles = variantStyles[variant];

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs gap-1.5',
    md: 'px-3 py-1 text-xs sm:text-sm gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full select-none shrink-0 tracking-normal',
        styles.bg,
        styles.text,
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', styles.dotColor)}
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

// Alias for convenience
export const Pill = StatusPill;
