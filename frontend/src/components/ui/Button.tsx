import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-full cursor-pointer';

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#FF6B6B] hover:bg-[#FA5252] text-white shadow-[0_4px_14px_rgba(255,107,107,0.35)] hover:shadow-[0_6px_20px_rgba(255,107,107,0.45)] hover:-translate-y-0.5',
    secondary:
      'bg-[#FFC93C] hover:bg-[#F6BA22] text-[#2B2B2B] shadow-[0_4px_14px_rgba(255,201,60,0.35)] hover:-translate-y-0.5',
    outline:
      'bg-white border-2 border-[#EFE9E0] text-[#2B2B2B] hover:border-[#FF6B6B] hover:text-[#FF6B6B]',
    ghost: 'text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-black/5',
  };

  return (
    <button
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
