'use client';

import React from 'react';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/components/ui/Toast';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <CartProvider>{children}</CartProvider>
    </ToastProvider>
  );
}
