'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  Truck,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Plus,
  Minus,
  Check,
  Gift,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getProductBySlug, getAllProducts } from '@/lib/store';
import { formatBDT } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

function ProductContent() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || 'rongdhonu-natural-wax-crayons-24-shades';
  const { addItem } = useCart();

  const product = getProductBySlug(slug) || getAllProducts()[0];
  const [selectedVariationIndex, setSelectedVariationIndex] = useState<number>(1); // 24 color by default
  const [quantity, setQuantity] = useState<number>(1);
  const [addedToast, setAddedToast] = useState<boolean>(false);
  const [locale, setLocale] = useState<'bn' | 'en'>('bn');

  const variations = product.variations || [];
  const currentVariation = variations[selectedVariationIndex];

  const currentPrice = currentVariation
    ? currentVariation.salePrice || currentVariation.price
    : product.baseSalePrice || product.basePrice;

  const currentOriginalPrice = currentVariation
    ? currentVariation.price
    : product.basePrice;

  const currentStock = currentVariation ? currentVariation.stock : 25;
  const isOutOfStock = currentStock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addItem({
      id: currentVariation
        ? `${product.id}-${currentVariation.sku}`
        : `${product.id}-default`,
      productId: product.id,
      productSlug: product.slug,
      title: product.titleEn,
      titleBn: product.titleBn,
      imageUrl: product.imageUrl,
      price: currentPrice,
      quantity,
      variationSku: currentVariation?.sku,
      variationTitle: currentVariation?.titleEn,
      variationTitleBn: currentVariation?.titleBn,
    });

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Breadcrumb */}
      <div className="text-xs text-[#6B6B6B] flex items-center gap-1.5">
        <Link href="/" className="hover:text-[#FF6B6B]">হোম</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[#FF6B6B]">সব পণ্য</Link>
        <span>/</span>
        <span className="font-bold text-[#2B2B2B] truncate max-w-xs">{product.titleBn}</span>
      </div>

      {/* Product Main Container */}
      <div className="bg-white rounded-[32px] border border-[#EFE9E0] p-6 sm:p-8 lg:p-10 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left: Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-[24px] overflow-hidden bg-[#FAF7F2] border border-[#EFE9E0] shadow-inner">
            <Image
              src={product.imageUrl}
              alt={product.titleBn}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              <Badge label="১০০% বিষাক্ত নয়" type="safe" />
              <Badge label={`${product.targetAgeMin}+ বছর`} type="age" />
            </div>
          </div>

          {/* Thumbnail previews */}
          <div className="flex gap-3">
            {[product.imageUrl, 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=400&q=80'].map(
              (img, idx) => (
                <div
                  key={idx}
                  className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#FF6B6B] cursor-pointer bg-[#FAF7F2]"
                >
                  <Image src={img} alt="Thumbnail" fill className="object-cover" />
                </div>
              )
            )}
          </div>
        </div>

        {/* Right: Product Details & Variation Switcher */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#2D7A3E] mb-2">
              <span className="inline-flex items-center gap-1 bg-[#EBF8EE] px-3 py-1 rounded-full border border-[#C4EDCD]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#7BD389]" />
                {isOutOfStock ? 'স্টক শেষ' : `ইন স্টক (${currentStock}টি বাকি)`}
              </span>
              <span className="text-[#6B6B6B]">SKU: {currentVariation?.sku || 'RK-DEF-01'}</span>
            </div>

            <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2B2B] leading-tight">
              {locale === 'bn' ? product.titleBn : product.titleEn}
            </h1>

            {/* Price */}
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-[#FF6B6B]">
                {formatBDT(currentPrice, { locale })}
              </span>
              {currentOriginalPrice > currentPrice && (
                <span className="text-lg line-through text-[#6B6B6B]">
                  {formatBDT(currentOriginalPrice, { locale })}
                </span>
              )}
              {currentOriginalPrice > currentPrice && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EBF8EE] text-[#2D7A3E]">
                  সাশ্রয় {formatBDT(currentOriginalPrice - currentPrice, { locale })}
                </span>
              )}
            </div>
          </div>

          {/* Variation Picker (Colors / Size) */}
          {variations.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-[#EFE9E0]">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#2B2B2B]">রঙের সেট / ভ্যারিয়েশন নির্বাচন করুন:</span>
                <span className="text-[#FF6B6B]">
                  {currentVariation?.titleBn || currentVariation?.titleEn}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {variations.map((v, idx) => {
                  const isSelected = selectedVariationIndex === idx;
                  return (
                    <button
                      key={v.sku}
                      onClick={() => setSelectedVariationIndex(idx)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-2 border-[#FF6B6B] bg-[#FFF5F5] shadow-sm'
                          : 'border-[#EFE9E0] bg-[#FAF7F2] hover:border-[#FF6B6B]'
                      }`}
                    >
                      <span className="text-xs font-bold text-[#2B2B2B] line-clamp-1">
                        {v.titleBn}
                      </span>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-sm font-black text-[#FF6B6B]">
                          ৳{v.salePrice || v.price}
                        </span>
                        <span className="text-[10px] text-[#6B6B6B]">
                          স্টক: {v.stock}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector & Action Buttons */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-[#2B2B2B]">পরিমাণ:</span>
              <div className="flex items-center bg-[#FAF7F2] border border-[#EFE9E0] rounded-full p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#2B2B2B] hover:text-[#FF6B6B] shadow-sm cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-bold text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#2B2B2B] hover:text-[#FF6B6B] shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleBuyNow}
                disabled={isOutOfStock}
              >
                <ShoppingBag className="w-5 h-5" />
                {isOutOfStock ? 'স্টক শেষ' : 'এখনই অর্ডার করুন (ক্যাশ অন ডেলিভারি)'}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="sm:w-auto"
              >
                {addedToast ? (
                  <>
                    <Check className="w-5 h-5 text-[#2D7A3E]" />
                    যোগ হয়েছে!
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    কার্টে রাখুন
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Trust Assurances */}
          <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EFE9E0] grid grid-cols-2 gap-3 text-xs font-medium text-[#2B2B2B]">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#5BC0EB]" />
              <span>সারা বাংলাদেশে হোম ডেলিভারি</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#7BD389]" />
              <span>১০০% ক্যাশ অন ডেলিভারি</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#FFC93C]" />
              <span>৭ দিনে সহজ রিটার্ন সুবিধা</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF6B6B]" />
              <span>খাদ্য-মানের প্রাকৃতিক মোম</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buy Together and Save Combo Offer Section */}
      <div className="bg-[#FFF5F5] border-2 border-[#FFD9D9] rounded-[28px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FF6B6B] text-white">
            <Gift className="w-3.5 h-3.5" />
            একসাথে কিনুন এবং আরও বেশি সাশ্রয় করুন!
          </span>
          <h3 className="font-heading font-black text-xl sm:text-2xl text-[#2B2B2B]">
            {product.titleBn} + আর্ট স্কেচ প্যাড কম্বো
          </h3>
          <p className="text-xs sm:text-sm text-[#6B6B6B]">
            মোমের রঙের সাথে প্রিমিয়াম আর্ট বুকলেট কিনলে পাচ্ছেন অতিরিক্ত ৳১৫০ ডিসকাউন্ট।
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-2xl font-black text-[#FF6B6B]">৳৪৫০</span>
            <span className="block text-xs line-through text-[#6B6B6B]">৳৬০০</span>
          </div>
          <Button size="md" variant="primary" onClick={handleAddToCart}>
            কম্বোটি কার্টে নিন
          </Button>
        </div>
      </div>

      {/* MOBILE STICKY BUY BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-[#EFE9E0] p-3 px-4 flex items-center justify-between gap-3 shadow-[0_-8px_25px_rgba(43,43,43,0.1)]">
        <div>
          <span className="text-xs text-[#6B6B6B] block">মোট মূল্য:</span>
          <span className="text-xl font-black text-[#FF6B6B]">
            {formatBDT(currentPrice * quantity, { locale })}
          </span>
        </div>

        <Button
          variant="primary"
          size="md"
          className="flex-1 max-w-[220px]"
          onClick={handleBuyNow}
          disabled={isOutOfStock}
        >
          <ShoppingBag className="w-4 h-4" />
          {isOutOfStock ? 'স্টক শেষ' : 'এখনই অর্ডার করুন'}
        </Button>
      </div>
    </main>
  );
}

export default function SingleProductPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-28 md:pb-16 text-[#2B2B2B]">
      <Header />
      <Suspense fallback={<div className="p-12 text-center text-xs">লোড হচ্ছে...</div>}>
        <ProductContent />
      </Suspense>
    </div>
  );
}
