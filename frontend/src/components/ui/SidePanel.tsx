'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export function SidePanel({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'lg',
}: SidePanelProps) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const widthClasses = {
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 flex pl-10 max-w-full">
        <div
          className={cn(
            'w-screen bg-white shadow-2xl flex flex-col border-l border-[#EFE9E0] animate-in slide-in-from-right duration-200',
            widthClasses[width]
          )}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#EFE9E0] flex items-center justify-between shrink-0 bg-[#FAF7F2]">
            <div>
              <h2 className="text-lg font-bold text-[#2B2B2B]">{title}</h2>
              {subtitle && <p className="text-xs text-[#6B6B6B] mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close side panel"
              className="p-2 text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-black/5 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[#2B2B2B]">{children}</div>

          {/* Fixed Footer Actions */}
          {footer && (
            <div className="p-4 sm:p-5 border-t border-[#EFE9E0] bg-[#FAF7F2] shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
