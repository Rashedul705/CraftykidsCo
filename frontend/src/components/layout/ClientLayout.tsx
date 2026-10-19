'use client';

import React from 'react';
import { CartProvider } from '@/context/CartContext';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
