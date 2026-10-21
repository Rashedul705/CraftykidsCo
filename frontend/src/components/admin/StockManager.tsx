'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Search,
  Filter,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  PackageCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { SampleProduct } from '@/lib/sample-data';
import { StatusPill } from '@/components/ui/Pill';

interface StockManagerProps {
  products: SampleProduct[];
  onRefresh?: () => void;
}

interface FlattenedStockItem {
  id: string; // product id or variation id
  productId: string;
  productSlug: string;
  titleBn: string;
  titleEn: string;
  variationTitle?: string;
  sku: string;
  stock: number;
  price: number;
  imageUrl: string;
  isVariation: boolean;
  isBottleNeck?: boolean;
}

export function StockManager({ products, onRefresh }: StockManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [localStock, setLocalStock] = useState<Record<string, number>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Flatten products and variations into single unified inventory table
  const inventoryItems = useMemo(() => {
    const items: FlattenedStockItem[] = [];

    products.forEach((p) => {
      if (p.variations && p.variations.length > 0) {
        p.variations.forEach((v) => {
          const key = `${p.id || p.slug}_${v.sku || v.titleEn}`;
          const currentStock = localStock[key] !== undefined ? localStock[key] : v.stock;
          items.push({
            id: key,
            productId: p.id || p.slug,
            productSlug: p.slug,
            titleBn: p.titleBn,
            titleEn: p.titleEn,
            variationTitle: v.titleBn || v.titleEn,
            sku: v.sku || 'VAR-SKU',
            stock: currentStock,
            price: v.price || p.baseSalePrice || p.basePrice,
            imageUrl: v.imageUrl || p.imageUrl,
            isVariation: true,
          });
        });
      } else {
        const key = p.id || p.slug;
        const currentStock = localStock[key] !== undefined ? localStock[key] : ((p as any).stock ?? 25);
        items.push({
          id: key,
          productId: p.id || p.slug,
          productSlug: p.slug,
          titleBn: p.titleBn,
          titleEn: p.titleEn,
          sku: (p as any).sku || p.slug.toUpperCase(),
          stock: currentStock,
          price: p.baseSalePrice || p.basePrice,
          imageUrl: p.imageUrl,
          isVariation: false,
        });
      }
    });

    return items;
  }, [products, localStock]);

  const filtered = useMemo(() => {
    return inventoryItems.filter((item) => {
      if (stockFilter === 'LOW' && (item.stock > 5 || item.stock === 0)) return false;
      if (stockFilter === 'OUT' && item.stock > 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitleBn = item.titleBn.toLowerCase().includes(q);
        const matchTitleEn = item.titleEn.toLowerCase().includes(q);
        const matchVar = item.variationTitle?.toLowerCase().includes(q);
        const matchSku = item.sku.toLowerCase().includes(q);
        if (!matchTitleBn && !matchTitleEn && !matchVar && !matchSku) return false;
      }

      return true;
    });
  }, [inventoryItems, stockFilter, searchQuery]);

  const handleUpdateStock = async (item: FlattenedStockItem, newStock: number) => {
    const finalStock = Math.max(0, newStock);
    setLocalStock((prev) => ({ ...prev, [item.id]: finalStock }));
    setSavingKey(item.id);

    try {
      const res = await fetch(`/api/products/${item.productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variationSku: item.isVariation ? item.sku : undefined,
          stock: finalStock,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(`Stock updated: ${item.variationTitle || item.titleBn} → ${finalStock} units`);
        setTimeout(() => setFeedback(null), 2000);
      }
    } catch {
      // rollback or ignore
    } finally {
      setSavingKey(null);
    }
  };

  const metrics = useMemo(() => {
    const total = inventoryItems.length;
    const low = inventoryItems.filter((i) => i.stock > 0 && i.stock <= 5).length;
    const out = inventoryItems.filter((i) => i.stock === 0).length;
    const inStock = total - low - out;
    return { total, low, out, inStock };
  }, [inventoryItems]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-3.5 rounded-[12px] bg-[#DDF3E6] border border-[#BDE7CC] text-xs font-bold text-[#1F6B43] flex items-center justify-between shadow-xs">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-[#6B6B6B] hover:text-[#2B2B2B]">
            ✕
          </button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
          <span className="text-xs font-medium text-[#6B6B6B] block">Total Variations</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-heading font-black text-2xl text-[#2B2B2B]">{metrics.total}</span>
            <span className="text-[11px] text-[#6B6B6B]">SKUs tracked</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
          <span className="text-xs font-medium text-[#6B6B6B] block">Healthy Stock</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-heading font-black text-2xl text-[#1F6B43]">{metrics.inStock}</span>
            <span className="text-[11px] font-bold text-[#1F6B43]">&gt; 5 units</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
          <span className="text-xs font-medium text-[#6B6B6B] block">Low Stock Alert</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-heading font-black text-2xl text-[#7A4E00]">{metrics.low}</span>
            <span className="text-[11px] font-bold text-[#7A4E00]">1-5 units left</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
          <span className="text-xs font-medium text-[#6B6B6B] block">Out of Stock</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-heading font-black text-2xl text-[#D6403B]">{metrics.out}</span>
            <span className="text-[11px] font-bold text-[#D6403B]">0 units</span>
          </div>
        </div>
      </div>

      {/* Main Stock Table Card */}
      <div className="bg-white rounded-2xl border border-[#EFE9E0] shadow-xs overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-[#EFE9E0] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { key: 'ALL', label: `All Items (${inventoryItems.length})` },
                { key: 'LOW', label: `Low Stock (${metrics.low})` },
                { key: 'OUT', label: `Out of Stock (${metrics.out})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStockFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    stockFilter === tab.key
                      ? 'bg-[#FDE3E1] text-[#9B2420]'
                      : 'text-[#6B6B6B] hover:bg-[#FAF7F2] hover:text-[#2B2B2B]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {onRefresh && (
              <button
                onClick={onRefresh}
                className="inline-flex items-center gap-1.5 text-xs text-[#6B6B6B] hover:text-[#2B2B2B] font-semibold self-end sm:self-auto cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sync
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
            <input
              type="text"
              placeholder="Search by product name, variation, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] focus:bg-white focus:outline-[#D6403B] transition-colors"
            />
          </div>
        </div>

        {/* Inventory List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF7F2] text-[#6B6B6B] border-b border-[#EFE9E0] text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Item &amp; Variation</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Inline Stock Adjuster</th>
                <th className="py-3 px-4 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9E0]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6B6B6B]">
                    No inventory records match your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    {/* Item & Image */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#EFE9E0] shrink-0">
                          <Image
                            src={item.imageUrl || 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg'}
                            alt={item.titleBn}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="space-y-0.5 max-w-xs">
                          <span className="font-bold text-[#2B2B2B] block truncate">{item.titleBn}</span>
                          {item.variationTitle ? (
                            <span className="text-[11px] text-[#D6403B] font-semibold block">
                              Option: {item.variationTitle}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#6B6B6B] block">Main Product</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-3.5 px-4 font-mono text-xs text-[#6B6B6B]">
                      {item.sku}
                    </td>

                    {/* Unit Price */}
                    <td className="py-3.5 px-4 font-bold text-[#2B2B2B]">
                      ৳{item.price}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-4">
                      {item.stock === 0 ? (
                        <StatusPill variant="red" dot>
                          Out of stock
                        </StatusPill>
                      ) : item.stock <= 5 ? (
                        <StatusPill variant="yellow" dot>
                          Low: {item.stock} left
                        </StatusPill>
                      ) : (
                        <StatusPill variant="green" dot>
                          In stock ({item.stock})
                        </StatusPill>
                      )}
                    </td>

                    {/* Inline Stock Stepper */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0]">
                        <button
                          onClick={() => handleUpdateStock(item, item.stock - 1)}
                          disabled={item.stock <= 0 || savingKey === item.id}
                          className="w-7 h-7 rounded-lg bg-white border border-[#EFE9E0] flex items-center justify-center text-[#2B2B2B] hover:bg-[#FDE3E1] hover:text-[#9B2420] disabled:opacity-40 cursor-pointer"
                          title="Decrease by 1"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <input
                          type="number"
                          min={0}
                          value={item.stock}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setLocalStock((prev) => ({ ...prev, [item.id]: val }));
                          }}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            handleUpdateStock(item, val);
                          }}
                          className="w-14 text-center font-heading font-black text-xs text-[#2B2B2B] bg-transparent focus:outline-none"
                        />

                        <button
                          onClick={() => handleUpdateStock(item, item.stock + 1)}
                          disabled={savingKey === item.id}
                          className="w-7 h-7 rounded-lg bg-white border border-[#EFE9E0] flex items-center justify-center text-[#2B2B2B] hover:bg-[#DDF3E6] hover:text-[#1F6B43] cursor-pointer"
                          title="Increase by 1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Quick Restock */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleUpdateStock(item, item.stock + 10)}
                        className="px-2.5 py-1.5 rounded-xl bg-white border border-[#EFE9E0] hover:border-[#D6403B] hover:text-[#D6403B] text-[11px] font-bold text-[#6B6B6B] transition-colors cursor-pointer"
                      >
                        +10 Units
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default StockManager;
