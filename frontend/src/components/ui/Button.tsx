import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'secondary' | 'whatsapp' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      disabled = false,
      icon,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-[12px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6403B] focus-visible:ring-offset-2 select-none active:scale-[0.99]';

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs min-h-[36px] gap-1.5 rounded-[10px]',
      md: 'px-5 py-2.5 text-sm sm:text-base min-h-[44px] gap-2 rounded-[12px]',
      lg: 'px-7 py-3 text-base sm:text-lg min-h-[48px] gap-2.5 rounded-[12px]',
    };

    const variantStyles = {
      // Primary solid button #D6403B
      primary:
        'bg-[#D6403B] hover:bg-[#BF3430] text-white shadow-none border border-transparent font-semibold',
      // Outlined primary (e.g., "কার্টে যোগ করুন")
      outline:
        'bg-white hover:bg-[#FDE3E1]/40 border-2 border-[#D6403B] text-[#D6403B] font-semibold',
      // Secondary neutral card-like button
      secondary:
        'bg-white hover:bg-[#FAF7F2] border border-[#EFE9E0] text-[#2B2B2B]',
      // WhatsApp direct contact
      whatsapp:
        'bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold',
      // Destructive button
      destructive:
        'bg-[#FDE3E1] hover:bg-[#F9D0CE] text-[#9B2420] border border-[#F7C6C3] font-semibold',
      // Ghost button
      ghost:
        'bg-transparent hover:bg-[#EFE9E0]/60 text-[#2B2B2B]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
