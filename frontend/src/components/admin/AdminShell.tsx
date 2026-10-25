'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  ExternalLink,
  Menu,
  X,
  LogOut,
  Shield,
  UserCheck,
  Package,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { BRAND_NAME } from '@/lib/brand';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export type AdminRole = 'admin' | 'order_handler' | 'product_manager';

export interface AdminNavItem {
  id: string;
  label: string;
  allowedRoles?: AdminRole[];
}

export interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { id: 'dashboard', label: 'Dashboard', allowedRoles: ['admin', 'order_handler', 'product_manager'] },
      { id: 'reports', label: 'Reports', allowedRoles: ['admin'] },
    ],
  },
  {
    title: 'SALES',
    items: [
      { id: 'orders', label: 'Orders', allowedRoles: ['admin', 'order_handler'] },
      { id: 'incomplete-orders', label: 'Incomplete orders', allowedRoles: ['admin', 'order_handler'] },
      { id: 'customers', label: 'Customers', allowedRoles: ['admin', 'order_handler'] },
      { id: 'coupons', label: 'Coupons', allowedRoles: ['admin'] },
      { id: 'sms-campaigns', label: 'SMS campaigns', allowedRoles: ['admin'] },
    ],
  },
  {
    title: 'CATALOG',
    items: [
      { id: 'products', label: 'Products', allowedRoles: ['admin', 'product_manager'] },
      { id: 'categories', label: 'Categories and attributes', allowedRoles: ['admin', 'product_manager'] },
      { id: 'bundles', label: 'Bundles', allowedRoles: ['admin', 'product_manager'] },
      { id: 'stock', label: 'Stock', allowedRoles: ['admin', 'product_manager'] },
    ],
  },
  {
    title: 'SHIPPING',
    items: [
      { id: 'steadfast', label: 'Steadfast courier', allowedRoles: ['admin'] },
      { id: 'delivery-charges', label: 'Delivery charges', allowedRoles: ['admin'] },
      { id: 'print-settings', label: 'Print & stickers', allowedRoles: ['admin', 'order_handler'] },
      { id: 'block-list', label: 'Block list', allowedRoles: ['admin'] },
    ],
  },
  {
    title: 'CONTENT',
    items: [
      { id: 'messages', label: 'Messages', allowedRoles: ['admin', 'order_handler'] },
      { id: 'page-editor', label: 'Page editor', allowedRoles: ['admin'] },
      { id: 'home-sections', label: 'Home sections', allowedRoles: ['admin'] },
      { id: 'faq-policies', label: 'FAQ and policies', allowedRoles: ['admin'] },
      { id: 'blog', label: 'Blog', allowedRoles: ['admin'] },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'staff', label: 'Staff and roles', allowedRoles: ['admin'] },
      { id: 'payments-sms', label: 'Payments and SMS', allowedRoles: ['admin'] },
    ],
  },
];

export const TAB_METADATA: Record<string, { title: string; helper: string; mainAction?: { label: string; action: string } }> = {
  dashboard: {
    title: 'Dashboard',
    helper: "Monitor today's sales, pending orders, and urgent tasks",
    mainAction: { label: '+ Create order', action: 'create_order' },
  },
  reports: {
    title: 'Reports',
    helper: 'Financial summaries, revenue trends, and return analytics',
  },
  orders: {
    title: 'Orders',
    helper: 'Click any order to see details and act on it',
    mainAction: { label: '+ Create order', action: 'create_order' },
  },
  'incomplete-orders': {
    title: 'Incomplete orders',
    helper: 'Call or WhatsApp shoppers who abandoned checkout',
  },
  customers: {
    title: 'Customers',
    helper: 'Customer history, total orders, and past delivery success rate',
  },
  coupons: {
    title: 'Coupons',
    helper: 'Manage promotional discount codes and track redemptions',
    mainAction: { label: '+ Add coupon', action: 'add_coupon' },
  },
  'sms-campaigns': {
    title: 'SMS campaigns',
    helper: 'Create targeted promotional SMS campaigns with opt-out protection',
    mainAction: { label: '+ New campaign', action: 'new_campaign' },
  },
  products: {
    title: 'Products',
    helper: 'Manage child-safe crayons, toys, and variation sets',
    mainAction: { label: '+ Add product', action: 'add_product' },
  },
  categories: {
    title: 'Categories and attributes',
    helper: 'Organize category tree and child-safe product attributes',
    mainAction: { label: '+ Add category', action: 'add_category' },
  },
  bundles: {
    title: 'Bundles',
    helper: 'Manage multi-item gift sets and automated bundle stock limits',
    mainAction: { label: '+ Create bundle', action: 'create_bundle' },
  },
  stock: {
    title: 'Stock',
    helper: 'Monitor real-time product quantities and inline delta updates',
  },
  steadfast: {
    title: 'Steadfast courier',
    helper: 'Live Steadfast API sync, parcel tracking, and balance inspection',
  },
  'delivery-charges': {
    title: 'Delivery charges',
    helper: 'Set standard delivery charges and estimated transit times by district',
  },
  'print-settings': {
    title: 'Print & Stickers',
    helper: 'Configure thermal label defaults, A4 sheet layouts, brand headers, and alignment tests',
  },
  'block-list': {
    title: 'Block list',
    helper: 'Prevent repeat COD returns and fake orders by blocking phone numbers',
  },
  messages: {
    title: 'Messages',
    helper: 'Customer contact messages, WhatsApp instant replies, and resolution history',
  },
  'page-editor': {
    title: 'Page editor',
    helper: 'Edit Contact Us, About Us, Privacy Policy, and Terms of Service page contents',
  },
  blog: {
    title: 'Blog',
    helper: 'Educational articles on child art, natural beeswax, and parenting',
    mainAction: { label: '+ New post', action: 'new_post' },
  },
  'faq-policies': {
    title: 'FAQ and policies',
    helper: 'Customer service answers, return guidelines, and delivery terms',
  },
  'home-sections': {
    title: 'Home sections',
    helper: 'Toggle, reorder, and configure storefront homepage showcases',
  },
  staff: {
    title: 'Staff and roles',
    helper: 'Configure access permissions for Order Handlers and Product Managers',
    mainAction: { label: '+ Add staff', action: 'add_staff' },
  },
  'payments-sms': {
    title: 'Payments and SMS',
    helper: 'Manage bKash, COD settings, and SMS gateway credentials',
  },
};

export interface AdminShellProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onMainAction?: (actionKey: string) => void;
  onLogout: () => void;
  userRole?: AdminRole;
  onRoleChange?: (role: AdminRole) => void;
  children: React.ReactNode;
}

export function AdminShell({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onMainAction,
  onLogout,
  userRole = 'admin',
  onRoleChange,
  children,
}: AdminShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter navigation items by role
  const visibleSections = ADMIN_NAV_SECTIONS.map((section) => ({
    title: section.title,
    items: section.items.filter((item) => !item.allowedRoles || item.allowedRoles.includes(userRole)),
  })).filter((section) => section.items.length > 0);

  const activeMeta = TAB_METADATA[activeTab] || {
    title: activeTab.replace('-', ' '),
    helper: 'Admin management panel',
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#EFE9E0]">
          <button
            onClick={() => {
              onTabChange('dashboard');
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-2.5 text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#D6403B] text-white flex items-center justify-center font-bold text-sm shrink-0">
              CK
            </div>
            <div>
              <span className="font-fredoka font-bold text-base text-[#2B2B2B] block leading-tight">
                {BRAND_NAME}
              </span>
              <span className="text-xs text-[#6B6B6B]">Admin panel</span>
            </div>
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-[#6B6B6B] hover:text-[#2B2B2B] rounded-lg cursor-pointer"
            aria-label="Close admin menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grouped Navigation Links */}
        <nav className="mt-4 space-y-3">
          {visibleSections.map((sec) => (
            <div key={sec.title} className="space-y-0.5">
              <span className="text-[10px] font-bold text-[#6B6B6B] tracking-wider uppercase px-3 block mb-1">
                {sec.title}
              </span>
              {sec.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded-[10px] text-xs sm:text-[13px] transition-colors cursor-pointer flex items-center justify-between',
                      isActive
                        ? 'bg-[#FDE3E1] text-[#9B2420] font-bold'
                        : 'text-[#2B2B2B] hover:bg-[#FAF7F2] font-medium'
                    )}
                  >
                    <span>{item.label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#9B2420] shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Role Switcher & User Profile */}
      <div className="pt-4 border-t border-[#EFE9E0] space-y-3 mt-6">
        {/* Interactive Role Switcher */}
        <div className="bg-[#FAF7F2] p-2.5 rounded-[12px] border border-[#EFE9E0]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Staff Role
            </span>
            <span
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-bold',
                userRole === 'admin'
                  ? 'bg-[#DDF3E6] text-[#1F6B43]'
                  : userRole === 'order_handler'
                  ? 'bg-[#DDF1FB] text-[#0B5F85]'
                  : 'bg-[#FFF3CC] text-[#7A4E00]'
              )}
            >
              {userRole === 'admin'
                ? 'Super Admin'
                : userRole === 'order_handler'
                ? 'Order Handler'
                : 'Product Manager'}
            </span>
          </div>
          {onRoleChange && (
            <select
              aria-label="Select staff role"
              value={userRole}
              onChange={(e) => onRoleChange(e.target.value as AdminRole)}
              className="w-full bg-white border border-[#EFE9E0] text-[#2B2B2B] text-xs rounded-[8px] py-1.5 px-2 outline-none focus:border-[#D6403B] cursor-pointer"
            >
              <option value="admin">Super Admin (All access)</option>
              <option value="order_handler">Order Handler (Orders & Customers only)</option>
              <option value="product_manager">Product Manager (Catalog & Stock only)</option>
            </select>
          )}
        </div>

        {/* User Card & Logout */}
        <div className="flex items-center justify-between px-1">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-[#2B2B2B] truncate">
              {userRole === 'admin'
                ? 'System Admin'
                : userRole === 'order_handler'
                ? 'Order Specialist'
                : 'Catalog Manager'}
            </p>
            <p className="text-[11px] text-[#6B6B6B] truncate">staff@craftykidsco.com</p>
          </div>
          <button
            onClick={onLogout}
            title="Log out"
            aria-label="Log out"
            className="p-2 rounded-[10px] text-[#6B6B6B] hover:text-[#9B2420] hover:bg-[#FDE3E1] transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col lg:flex-row text-[#2B2B2B] admin-body">
      {/* Mobile Top Bar (< lg) */}
      <div className="lg:hidden bg-white border-b border-[#EFE9E0] px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-[10px] border border-[#EFE9E0] text-[#2B2B2B] hover:bg-[#FAF7F2] cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-[8px] bg-[#D6403B] text-white flex items-center justify-center font-bold text-xs">
              CK
            </span>
            <span className="font-fredoka font-bold text-sm text-[#2B2B2B]">{BRAND_NAME}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="px-2.5 py-1.5 rounded-[8px] border border-[#EFE9E0] text-xs font-semibold text-[#2B2B2B] hover:bg-[#FAF7F2]"
          >
            Store
          </Link>
          {activeMeta.mainAction && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onMainAction?.(activeMeta.mainAction!.action)}
            >
              {activeMeta.mainAction.label}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-[232px] max-w-[85vw] bg-white border-r border-[#EFE9E0] p-5 flex flex-col justify-between overflow-y-auto shadow-2xl z-50">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Persistent Left Sidebar (232px, white) */}
      <aside className="w-[232px] shrink-0 bg-white border-r border-[#EFE9E0] min-h-screen p-5 hidden lg:flex flex-col justify-between sticky top-0 h-screen overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Main Content Area (Fills the screen, 32px padding) */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar on Each Page */}
        <header className="bg-white border-b border-[#EFE9E0] px-6 sm:px-8 py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-fredoka text-[#2B2B2B] tracking-tight">
              {activeMeta.title}
            </h1>
            <p className="text-xs text-[#6B6B6B] mt-0.5">{activeMeta.helper}</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Global Search */}
            <div className="relative flex-1 sm:w-64 md:w-80">
              <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search orders, phone, products..."
                className="w-full bg-[#FAF7F2] border border-[#EFE9E0] rounded-[12px] pl-9 pr-3.5 py-2 text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#6B6B6B]/60 focus:bg-white focus:border-[#D6403B] focus:ring-1 focus:ring-[#D6403B] outline-none transition-colors min-h-[40px]"
              />
            </div>

            {/* View Storefront Link */}
            <Link
              href="/"
              target="_blank"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] border border-[#EFE9E0] bg-white hover:bg-[#FAF7F2] text-xs font-semibold text-[#2B2B2B] transition-colors shrink-0 min-h-[40px]"
            >
              <span>Storefront</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#6B6B6B]" />
            </Link>

            {/* Main Action Button */}
            {activeMeta.mainAction && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onMainAction?.(activeMeta.mainAction!.action)}
                className="shrink-0 min-h-[40px]"
              >
                {activeMeta.mainAction.label}
              </Button>
            )}
          </div>
        </header>

        {/* Content Body with 32px Padding (p-6 sm:p-8) */}
        <main className="flex-1 p-6 sm:p-8 w-full max-w-full space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
