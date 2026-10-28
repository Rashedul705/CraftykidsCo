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
  applyCouponAsync: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount (clearing any old hardcoded demo items)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('craftykidsco_cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Remove legacy hardcoded dummy demo items if present
          const validItems = parsed.filter(
            (it) => it.id !== 'prod-crayons-24-CRAYON-24' && it.id !== 'prod-triangular-12'
          );
          setItems(validItems);
        }
      }
    } catch {}
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('craftykidsco_cart', JSON.stringify(items));
      } catch {}
    }
  }, [items, isLoaded]);

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Recalculate discount if items change or re-verify active status with server
  useEffect(() => {
    if (!appliedCoupon) {
      setDiscountAmount(0);
      return;
    }

    let isMounted = true;
    fetch(`/api/coupons?code=${encodeURIComponent(appliedCoupon)}&subtotal=${subtotal}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.valid) {
          setDiscountAmount(data.discountAmount);
        } else {
          // Coupon was disabled by admin or is no longer valid
          setDiscountAmount(0);
          setAppliedCoupon(null);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
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
    try {
      localStorage.removeItem('craftykidsco_cart');
    } catch {}
  };

  const applyCouponCode = (code: string): { success: boolean; message: string } => {
    applyCouponAsync(code);
    return { success: true, message: 'কুপন যাচাই করা হচ্ছে...' };
  };

  const applyCouponAsync = async (code: string): Promise<{ success: boolean; message: string }> => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      return { success: false, message: 'অনুগ্রহ করে কুপন কোড লিখুন।' };
    }

    try {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(clean)}&subtotal=${subtotal}`);
      const data = await res.json();
      if (data.success && data.valid) {
        setAppliedCoupon(clean);
        setDiscountAmount(data.discountAmount);
        return { success: true, message: data.message || `কুপন ${clean} সফলভাবে যুক্ত হয়েছে!` };
      }

      // If coupon is disabled or invalid, clear any applied coupon
      setAppliedCoupon(null);
      setDiscountAmount(0);
      return {
        success: false,
        message: data.message || `Coupon "${clean}" is currently inactive.`,
      };
    } catch {
      return { success: false, message: 'Failed to validate coupon. Please try again.' };
    }
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
        applyCouponAsync,
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
