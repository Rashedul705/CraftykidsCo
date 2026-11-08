'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  PhoneCall,
  Heart,
  Truck,
  User,
  MessageCircle,
  X,
  Menu,
  Gift,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatBDT } from '@/lib/utils';
import { BRAND_CONFIG } from '@/lib/brand';
import { SiteSettings, defaultSiteSettings } from '@/lib/site-settings';

export interface HeaderProps {
  locale?: 'bn' | 'en';
  onToggleLocale?: () => void;
  announcement?: SiteSettings['announcement'];
  logoUrl?: string;
  settings?: SiteSettings;
}

const fallbackNavItems = [
  { id: 'nav-home', labelBn: 'Home', labelEn: 'Home', href: '/' },
  { id: 'nav-shop', labelBn: 'Shop', labelEn: 'Shop', href: '/shop' },
  { id: 'nav-bundles', labelBn: 'কম্বো ও বান্ডেল', labelEn: 'Bundles', href: '/bundles' },
  { id: 'nav-build-bundle', labelBn: 'বান্ডেল বিল্ডার', labelEn: 'Build Bundle', href: '/build-your-bundle' },
  { id: 'nav-gift-builder', labelBn: 'গিফট বিল্ডার', labelEn: 'Gift Builder', href: '/gift-builder' },
  { id: 'nav-about', labelBn: 'About', labelEn: 'About', href: '/about' },
  { id: 'nav-contact', labelBn: 'Contact', labelEn: 'Contact', href: '/contact' },
];

function HeaderContent({
  locale = 'bn',
  onToggleLocale,
  announcement = defaultSiteSettings.announcement,
  logoUrl,
  settings: propSettings,
}: HeaderProps) {
  const { cartCount, subtotal } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  const [internalLocale, setInternalLocale] = useState<'bn' | 'en'>(locale);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(propSettings || null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (propSettings) {
      setSiteSettings(propSettings);
    } else {
      fetch('/api/site-settings')
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data?.settings) {
            setSiteSettings(data.settings);
          }
        })
        .catch(() => {});
    }
  }, [propSettings]);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  // Close search & mobile menu on route change
  useEffect(() => {
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close search on Escape or outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        isSearchOpen &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        // Only close if click is not on the search toggle button
        const target = e.target as HTMLElement;
        if (!target.closest('[data-search-toggle]')) {
          setIsSearchOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  const activeLocale = onToggleLocale ? locale : internalLocale;
  const isBn = activeLocale === 'bn';

  const headerLogo =
    logoUrl ||
    siteSettings?.branding?.headerLogoUrl ||
    siteSettings?.nav?.logoUrl ||
    '';
  const showBrandText = siteSettings?.branding?.showBrandTextHeader !== false;
  const brandName = siteSettings?.branding?.brandName || BRAND_CONFIG.name;
  const logoAlt = siteSettings?.branding?.logoAlt || brandName;

  const showTopBar = siteSettings?.announcement?.enabled !== false;
  const topHotline =
    siteSettings?.announcement?.hotline ||
    siteSettings?.nav?.hotline ||
    siteSettings?.contact?.hotline ||
    BRAND_CONFIG.defaultHotline;
  const topWhatsapp =
    siteSettings?.announcement?.whatsapp ||
    siteSettings?.nav?.whatsapp ||
    siteSettings?.contact?.whatsapp ||
    BRAND_CONFIG.defaultWhatsapp;
  const showTrackOrder = siteSettings?.nav?.showTrackOrder !== false;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const isLinkActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Nav items from settings or fallback
  const navItems =
    Array.isArray(siteSettings?.nav?.menuItems) && siteSettings.nav.menuItems.length > 0
      ? siteSettings.nav.menuItems.filter((item) => item.enabled !== false)
      : fallbackNavItems;

  return (
    <>
      {/* 1. Top Bar (Hotline, WhatsApp, Track Order) */}
      {showTopBar && (
        <div className="bg-[#2B2B2B] text-white py-1.5 px-3 sm:px-4 text-xs font-medium border-b border-black/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            {/* Left: Hotline & WhatsApp */}
            <div className="flex items-center gap-3 sm:gap-4 text-xs text-[#E0E0E0] min-w-0">
              <a
                href={`tel:${topHotline.replace(/[^\d+]/g, '')}`}
                className="flex items-center gap-1.5 hover:text-white transition-colors truncate"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#D6403B] shrink-0" />
                <span>{isBn ? `হটলাইন: ${topHotline}` : `Hotline: ${topHotline}`}</span>
              </a>

              <span className="hidden sm:inline text-white/20">|</span>

              <a
                href={`https://wa.me/${topWhatsapp.replace(/[^\d+]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#25D366] hover:text-[#34D399] font-semibold transition-colors truncate"
                title="Chat with us on WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{isBn ? `হোয়াটসঅ্যাপ: ${topWhatsapp}` : `WhatsApp: ${topWhatsapp}`}</span>
              </a>
            </div>

            {/* Right: Customize Gift Builder & Track Order */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-[#CCCCCC] shrink-0">
              <Link
                href="/gift-builder"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D6403B] hover:bg-[#B93834] text-white font-bold text-[11px] sm:text-xs shadow-2xs hover:shadow-xs transition-all border border-white/20 cursor-pointer"
                title="Customize Gift Builder"
              >
                <Gift className="w-3.5 h-3.5 text-[#FFD166]" />
                <span>{isBn ? 'কাস্টমাইজ গিফট বিল্ডার' : 'Customize Gift Builder'}</span>
              </Link>

              <span className="hidden sm:inline text-white/20">|</span>

              {showTrackOrder && (
                <Link
                  href="/track"
                  className="flex items-center gap-1 hover:text-white transition-colors text-[11px] sm:text-xs"
                >
                  <Truck className="w-3.5 h-3.5 text-[#5BC0EB]" />
                  <span>{isBn ? 'অর্ডার ট্র্যাক করুন' : 'Track Order'}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Navigation Bar (Single unified row: Logo, Nav Links, Small Search Icon, Wishlist, Account, Cart) */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#EFE9E0] shadow-xs transition-all relative">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-4">
          {/* Left: Mobile Hamburger Toggle + Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 -ml-1 rounded-xl text-[#2B2B2B] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
              {headerLogo ? (
                <img
                  src={headerLogo}
                  alt={logoAlt}
                  className="h-8 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#D6403B] flex items-center justify-center text-white font-extrabold text-lg sm:text-xl shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  C
                </div>
              )}
              {showBrandText && (
                <span className="font-heading font-black text-lg sm:text-2xl text-[#2B2B2B] tracking-tight leading-none min-w-0">
                  {brandName}
                </span>
              )}
            </Link>
          </div>

          {/* Center: Desktop Navigation Links (Home, About, Contact, Shop) on the SAME LINE */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 font-bold text-sm text-[#2B2B2B]">
            {navItems.map((item) => {
              const label = item.labelEn || item.labelBn;
              const active = isLinkActive(item.href);
              return (
                <Link
                  key={item.id || item.href}
                  href={item.href}
                  className={`relative py-1.5 transition-colors whitespace-nowrap ${
                    active
                      ? 'text-[#D6403B] font-extrabold'
                      : 'text-[#2B2B2B] hover:text-[#D6403B]'
                  }`}
                >
                  <span>{label}</span>
                  {active && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#D6403B] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Small Search (Icon only), Wishlist, Login/Account, Cart */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Search Icon Button (Small, Icon Only) */}
            <button
              type="button"
              data-search-toggle="true"
              onClick={() => setIsSearchOpen((prev) => !prev)}
              className={`p-2 sm:p-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
                isSearchOpen
                  ? 'bg-[#FAF7F2] text-[#D6403B]'
                  : 'text-[#2B2B2B] hover:bg-[#FAF7F2] hover:text-[#D6403B]'
              }`}
              title={isBn ? 'অনুসন্ধান' : 'Search'}
              aria-label="Search"
            >
              {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>

            {/* Wishlist */}
            <Link
              href="/shop"
              className="p-2 sm:p-2.5 rounded-xl hover:bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#D6403B] transition-colors hidden sm:flex items-center justify-center"
              title={isBn ? 'উইশলিস্ট' : 'Wishlist'}
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Login / Account */}
            <Link
              href="/account"
              className="p-2 sm:p-2.5 rounded-xl hover:bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#D6403B] transition-colors hidden sm:flex items-center justify-center gap-1.5 text-xs font-bold"
              title={isBn ? 'লগইন বা অ্যাকাউন্ট' : 'Login / Account'}
            >
              <User className="w-5 h-5" />
              <span className="hidden lg:inline">{isBn ? 'লগইন' : 'Login'}</span>
            </Link>

            {/* Cart with Total */}
            <Link
              href="/cart"
              className="flex items-center gap-2 py-2 px-3 sm:px-3.5 rounded-xl bg-[#D6403B] hover:bg-[#BF3430] text-white shadow-xs transition-all shrink-0 cursor-pointer ml-1"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-[#D6403B] text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-[10px] font-medium text-white/80">Cart</span>
                <span className="text-xs font-extrabold">{formatBDT(subtotal, { locale: activeLocale })}</span>
              </div>
            </Link>
          </div>
        </div>

        {/* 3. Dropdown Search Bar (Revealed when Small Search Icon is clicked) */}
        {isSearchOpen && (
          <div
            ref={searchContainerRef}
            className="absolute top-full left-0 right-0 bg-white border-b border-[#EFE9E0] shadow-md px-4 py-3 z-50 transition-all"
          >
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isBn
                      ? 'খেলনা, মোমের রঙ বা আর্ট কিট খুঁজুন...'
                      : 'Search crayons, clay or art kits...'
                  }
                  className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] text-sm text-[#2B2B2B] placeholder-[#6B6B6B] focus:bg-white focus:outline-none focus:border-[#D6403B] focus:ring-2 focus:ring-[#D6403B]/15 transition-all"
                />
                <div className="absolute right-1.5 flex items-center gap-1">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-[#D6403B] hover:bg-[#BF3430] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isBn ? 'খুঁজুন' : 'Search'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-[#6B6B6B] hover:text-[#2B2B2B] cursor-pointer"
                    aria-label="Close search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. Mobile Navigation Drawer (For mobile screens < md) */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#EFE9E0] bg-white px-4 py-3 space-y-2 shadow-lg">
            <div className="space-y-1">
              {navItems.map((item) => {
                const label = item.labelEn || item.labelBn;
                const active = isLinkActive(item.href);
                return (
                  <Link
                    key={item.id || item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                      active
                        ? 'bg-[#D6403B]/10 text-[#D6403B]'
                        : 'text-[#2B2B2B] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#EFE9E0] flex items-center justify-between text-xs font-semibold text-[#6B6B6B] px-1">
              <Link
                href="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-1.5 hover:text-[#D6403B] py-1"
              >
                <User className="w-4 h-4" />
                <span>{isBn ? 'লগইন / অ্যাকাউন্ট' : 'Account'}</span>
              </Link>
              <Link
                href="/gift-builder"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-1.5 text-[#D6403B] hover:text-[#B93834] py-1 font-bold"
              >
                <Gift className="w-4 h-4 text-[#D6403B]" />
                <span>{isBn ? 'গিফট বিল্ডার' : 'Gift Builder'}</span>
              </Link>
              <Link
                href="/track"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-1.5 hover:text-[#D6403B] py-1"
              >
                <Truck className="w-4 h-4 text-[#5BC0EB]" />
                <span>{isBn ? 'অর্ডার ট্র্যাক' : 'Track Order'}</span>
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

function HeaderFallback({
  announcement = defaultSiteSettings.announcement,
  logoUrl,
  settings: propSettings,
}: HeaderProps) {
  const headerLogo =
    logoUrl ||
    propSettings?.branding?.headerLogoUrl ||
    propSettings?.nav?.logoUrl ||
    '';
  const brandName = propSettings?.branding?.brandName || BRAND_CONFIG.name;
  const showBrandText = propSettings?.branding?.showBrandTextHeader !== false;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#EFE9E0] shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {headerLogo ? (
              <img
                src={headerLogo}
                alt={brandName}
                className="h-8 sm:h-10 w-auto object-contain shrink-0"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#D6403B] flex items-center justify-center text-white font-extrabold text-lg sm:text-xl shrink-0">
                C
              </div>
            )}
            {showBrandText && (
              <span className="font-heading font-black text-lg sm:text-2xl text-[#2B2B2B] tracking-tight leading-none">
                {brandName}
              </span>
            )}
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 font-bold text-sm text-[#2B2B2B]">
          {fallbackNavItems.map((item) => (
            <Link key={item.id} href={item.href} className="py-1.5 text-[#2B2B2B]">
              {item.labelEn}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-stone-50" />
        </div>
      </div>
    </header>
  );
}

export function Header(props: HeaderProps) {
  return (
    <Suspense fallback={<HeaderFallback {...props} />}>
      <HeaderContent {...props} />
    </Suspense>
  );
}

export default Header;

