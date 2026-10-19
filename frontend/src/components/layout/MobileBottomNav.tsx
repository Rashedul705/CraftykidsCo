'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Grid, ShoppingBag, User } from 'lucide-react';

interface MobileBottomNavProps {
  cartCount?: number;
  locale?: 'bn' | 'en';
  activeTab?: 'home' | 'shop' | 'cart' | 'account';
}

export function MobileBottomNav({
  cartCount = 2,
  locale = 'bn',
  activeTab = 'home',
}: MobileBottomNavProps) {
  const navItems = [
    {
      id: 'home',
      label: locale === 'bn' ? 'হোম' : 'Home',
      icon: Home,
      href: '/',
    },
    {
      id: 'shop',
      label: locale === 'bn' ? 'শপ' : 'Shop',
      icon: Grid,
      href: '/shop',
    },
    {
      id: 'cart',
      label: locale === 'bn' ? 'কার্ট' : 'Cart',
      icon: ShoppingBag,
      href: '/cart',
      badge: cartCount > 0 ? cartCount : undefined,
    },
    {
      id: 'account',
      label: locale === 'bn' ? 'অ্যাকাউন্ট' : 'Account',
      icon: User,
      href: '/account',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-[#EFE9E0] px-4 py-2 pb-safe shadow-[0_-4px_20px_rgba(43,43,43,0.06)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative ${
                isActive ? 'text-[#FF6B6B] font-bold' : 'text-[#6B6B6B] hover:text-[#2B2B2B]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 bg-[#FF6B6B] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-[#FF6B6B] rounded-full mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
