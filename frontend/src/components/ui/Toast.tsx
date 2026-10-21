'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  undoAction?: () => void;
  undoLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, 'id'>) => string;
  success: (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) => string;
  error: (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) => string;
  warning: (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) => string;
  info: (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, NodeJS.Timeout>>({});

  const dismiss = useCallback((id: string) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ duration, ...rest }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      // If undo action exists, default to 10 seconds (10000ms)
      const finalDuration = rest.undoAction ? (duration ?? 10000) : (duration ?? 5000);

      const item: ToastItem = { id, duration: finalDuration, ...rest };
      setToasts((prev) => [...prev, item]);

      if (finalDuration > 0) {
        timersRef.current[id] = setTimeout(() => {
          dismiss(id);
        }, finalDuration);
      }
      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) =>
      toast({ type: 'success', message, ...options }),
    [toast]
  );

  const error = useCallback(
    (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) =>
      toast({ type: 'error', message, ...options }),
    [toast]
  );

  const warning = useCallback(
    (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) =>
      toast({ type: 'warning', message, ...options }),
    [toast]
  );

  const info = useCallback(
    (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) =>
      toast({ type: 'info', message, ...options }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss }}>
      {children}
      {/* Toast Container bottom-right */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [remainingSecs, setRemainingSecs] = useState(
    item.undoAction ? Math.round((item.duration || 10000) / 1000) : 0
  );

  React.useEffect(() => {
    if (!item.undoAction || remainingSecs <= 0) return;
    const interval = setInterval(() => {
      setRemainingSecs((s) => (s > 1 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [item.undoAction, remainingSecs]);

  const config = {
    success: {
      bg: 'bg-[#DDF3E6] border-[#BDE7CC] text-[#1F6B43]',
      icon: <CheckCircle2 className="w-5 h-5 text-[#1F6B43] shrink-0" />,
    },
    error: {
      bg: 'bg-[#FDE3E1] border-[#F8BEBA] text-[#9B2420]',
      icon: <AlertCircle className="w-5 h-5 text-[#9B2420] shrink-0" />,
    },
    warning: {
      bg: 'bg-[#FFF3CC] border-[#FFE28A] text-[#7A4E00]',
      icon: <AlertTriangle className="w-5 h-5 text-[#7A4E00] shrink-0" />,
    },
    info: {
      bg: 'bg-[#DDF1FB] border-[#BEE4F7] text-[#0B5F85]',
      icon: <Info className="w-5 h-5 text-[#0B5F85] shrink-0" />,
    },
  }[item.type];

  return (
    <div
      className={cn(
        'pointer-events-auto p-4 rounded-[14px] border shadow-md flex items-start gap-3 transition-all transform animate-in slide-in-from-bottom-2',
        config.bg
      )}
      role="status"
    >
      {config.icon}
      <div className="flex-1 min-w-0">
        {item.title && <h4 className="font-bold text-sm mb-0.5">{item.title}</h4>}
        <p className="text-xs sm:text-sm font-medium leading-relaxed">{item.message}</p>

        {item.undoAction && (
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => {
                item.undoAction?.();
                onDismiss();
              }}
              className="px-2.5 py-1 text-xs font-bold bg-white text-[#2B2B2B] border border-[#EFE9E0] rounded-[8px] hover:bg-[#FAF7F2] inline-flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <RotateCcw className="w-3 h-3 text-[#D6403B]" />
              {item.undoLabel || 'Undo'} ({remainingSecs}s)
            </button>
          </div>
        )}

        {item.onAction && (
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => {
                item.onAction?.();
                onDismiss();
              }}
              className="px-3 py-1.5 text-xs font-bold bg-[#D6403B] text-white rounded-[8px] hover:bg-[#C23631] inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              {item.actionIcon}
              {item.actionLabel || 'Action'}
            </button>
          </div>
        )}
      </div>

      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="p-1 rounded-full hover:bg-black/5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
