'use client';

import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="min-h-screen px-4 text-center flex items-center justify-center py-8">
        <div
          className={cn(
            'inline-block w-full bg-white rounded-[16px] border border-[#EFE9E0] text-left align-middle shadow-xl transform transition-all duration-200 relative p-6 z-10',
            maxWidthClasses[maxWidth]
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-[#EFE9E0]">
            <div>
              <h3 className="text-lg font-bold text-[#2B2B2B]">{title}</h3>
              {description && <p className="text-xs text-[#6B6B6B] mt-1">{description}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-[#FAF7F2] rounded-full transition-colors cursor-pointer shrink-0 ml-4"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          {children && <div className="py-4 text-[#2B2B2B] text-sm">{children}</div>}

          {/* Footer */}
          {footer && (
            <div className="pt-3 border-t border-[#EFE9E0] flex items-center justify-end gap-2.5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemCount?: number;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemCount,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {isDestructive && (
            <div className="w-7 h-7 rounded-full bg-[#FDE3E1] text-[#9B2420] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          )}
          <span>{title}</span>
        </div>
      }
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDestructive ? 'destructive' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        <p className="text-sm text-[#2B2B2B]">{message}</p>
        {typeof itemCount === 'number' && (
          <p className="text-xs font-semibold text-[#6B6B6B] bg-[#FAF7F2] p-2.5 rounded-[10px] border border-[#EFE9E0]">
            Affected items: <span className="text-[#2B2B2B] font-bold">{itemCount}</span>
          </p>
        )}
      </div>
    </Modal>
  );
}
