'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItemData } from '@/lib/store';

interface CartContextType {
  items: CartItemData[];
  cartCount: number;
  subtotal: number;
  couponCode: string;
  discountAmount: number;
  appliedCoupon: string | null;
  addItem: (item: CartItemData) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  applyCouponCode: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemData[]>([
    {
      id: 'prod-crayons-24-CRAYON-24',
      productId: 'prod-crayons-24',
      productSlug: 'rongdhonu-natural-wax-crayons-24-shades',
      title: 'Rongdhonu Natural Wax Crayons - 24 Shade Box',
      titleBn: 'রংধনু ন্যাচারাল মোমের রঙ - ২৪ শেড',
      imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
      price: 299,
      quantity: 1,
      variationSku: 'CRAYON-24',
      variationTitle: '24 Colors Classic Box',
      variationTitleBn: '২৪ রঙের ক্লাসিক সেট',
    },
    {
      id: 'prod-triangular-12',
      productId: 'prod-triangular-12',
      productSlug: 'toddler-triangular-grip-crayons-12',
      title: 'Toddler Triangular Grip Chunky Crayons 12 Set',
      titleBn: 'টডলার ট্রায়াঙ্গুলার গ্রিপ মোম ১২ রঙ',
      imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
      price: 220,
      quantity: 1,
    },
  ]);

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Recalculate discount if items change
  useEffect(() => {
    if (!appliedCoupon) {
      setDiscountAmount(0);
      return;
    }

    if (appliedCoupon === 'RONG10') {
      if (subtotal >= 500) {
        const disc = Math.min(Math.round(subtotal * 0.1), 150);
        setDiscountAmount(disc);
      } else {
        setDiscountAmount(0);
        setAppliedCoupon(null);
      }
    } else if (appliedCoupon === 'FREE60') {
      if (subtotal >= 600) {
        setDiscountAmount(60);
      } else {
        setDiscountAmount(0);
        setAppliedCoupon(null);
      }
    }
  }, [subtotal, appliedCoupon]);

  const addItem = (newItem: CartItemData) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === newItem.id);
      if (existing) {
        return prev.map((i) =>
          i.id === newItem.id ? { ...i, quantity: i.quantity + newItem.quantity } : i
        );
      }
      return [...prev, newItem];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItemData[]
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const applyCouponCode = (code: string): { success: boolean; message: string } => {
    const clean = code.trim().toUpperCase();
    if (clean === 'RONG10') {
      if (subtotal < 500) {
        return { success: false, message: 'RONG10 কুপনের জন্য কমপক্ষে ৳৫০০ টাকার অর্ডার প্রয়োজন।' };
      }
      setAppliedCoupon('RONG10');
      const disc = Math.min(Math.round(subtotal * 0.1), 150);
      setDiscountAmount(disc);
      return { success: true, message: `অভিনন্দন! ১০% (৳${disc}) ডিসকাউন্ট যোগ হয়েছে!` };
    }

    if (clean === 'FREE60') {
      if (subtotal < 600) {
        return { success: false, message: 'FREE60 কুপনের জন্য কমপক্ষে ৳৬০০ টাকার অর্ডার প্রয়োজন।' };
      }
      setAppliedCoupon('FREE60');
      setDiscountAmount(60);
      return { success: true, message: 'অভিনন্দন! ৳৬০ ছাড় যোগ হয়েছে!' };
    }

    return { success: false, message: 'কুপন কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ।' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        subtotal,
        couponCode: appliedCoupon || '',
        discountAmount,
        appliedCoupon,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        applyCouponCode,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
