'use client';

import React, { Suspense } from 'react';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/components/ui/Toast';
import { FloatingWhatsApp } from '@/components/ui/FloatingWhatsApp';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <CartProvider>
        {children}
        <Suspense fallback={null}>
          <FloatingWhatsApp />
        </Suspense>
      </CartProvider>
    </ToastProvider>
  );
}
