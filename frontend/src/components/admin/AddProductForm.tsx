'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Upload,
  Plus,
  Trash2,
  X,
  Check,
  Loader2,
  ExternalLink,
  ImageIcon,
  Sparkles,
  HelpCircle,
  Video,
} from 'lucide-react';
import { SampleCategory } from '@/lib/sample-data';

interface AddProductFormProps {
  onCancel: () => void;
  onSuccess: (createdProduct: any) => void;
  categories: SampleCategory[];
}

interface VariationRow {
  id: string;
  colorSet: string;
  ageGroup: string;
  sku: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

export default function AddProductForm({
  onCancel,
  onSuccess,
  categories,
}: AddProductFormProps) {
  // Photos & Media
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [uploadSlotIndex, setUploadSlotIndex] = useState<number | null>(null);

  // Basic Information
  const [titleBn, setTitleBn] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [shortDescBn, setShortDescBn] = useState('');
  const [shortDescEn, setShortDescEn] = useState('');
  const [fullDescBn, setFullDescBn] = useState('');
  const [whatsInTheBox, setWhatsInTheBox] = useState('');

  // Pricing & Stock
  const [regularPrice, setRegularPrice] = useState<number | ''>(1200);
  const [salePrice, setSalePrice] = useState<number | ''>(999);
  const [costPerItem, setCostPerItem] = useState<number | ''>('');
  const [sku, setSku] = useState('');
  const [stockQuantity, setStockQuantity] = useState<number | ''>(25);
  const [lowStockAlert, setLowStockAlert] = useState<number | ''>(5);

  // Variations
  const [colorOptions, setColorOptions] = useState<string[]>(['12 colors', '24 colors', '48 colors']);
  const [newColorInput, setNewColorInput] = useState('');
  const [isAddingColor, setIsAddingColor] = useState(false);

  const [ageOptions, setAgeOptions] = useState<string[]>(['2-3 yrs', '3-5 yrs', '5-8 yrs']);
  const [newAgeInput, setNewAgeInput] = useState('');
  const [isAddingAge, setIsAddingAge] = useState(false);

  const [variations, setVariations] = useState<VariationRow[]>([
    { id: 'var-1', colorSet: '12 colors', ageGroup: '2-3 yrs', sku: '', price: 999, stock: 25, imageUrl: '' },
    { id: 'var-2', colorSet: '12 colors', ageGroup: '3-5 yrs', sku: '', price: 999, stock: 25, imageUrl: '' },
    { id: 'var-3', colorSet: '24 colors', ageGroup: '2-3 yrs', sku: '', price: 1450, stock: 15, imageUrl: '' },
    { id: 'var-4', colorSet: '24 colors', ageGroup: '3-5 yrs', sku: '', price: 1450, stock: 15, imageUrl: '' },
  ]);

  // Shipping & Search
  const [weight, setWeight] = useState<number | ''>(0);
  const [packageSize, setPackageSize] = useState('');
  const [handlingTime, setHandlingTime] = useState<number | ''>(1);
  const [seoTitle, setSeoTitle] = useState('');
  const [urlSlug, setUrlSlug] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Publish Status
  const [status, setStatus] = useState<'Published' | 'Draft'>('Published');

  // Organize
  const [categorySlug, setCategorySlug] = useState(categories[0]?.slug || 'art-kits');
  const [subCategory, setSubCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [brand, setBrand] = useState('CraftyKidsCo');

  // Kids Essentials
  const [safetyBadges, setSafetyBadges] = useState<string[]>(['Non-toxic']);
  const [targetAge, setTargetAge] = useState<string>('2+');
  const [productBadge, setProductBadge] = useState('');

  // Show on Store Toggles
  const [showInNewArrivals, setShowInNewArrivals] = useState(true);
  const [featureInTrending, setFeatureInTrending] = useState(false);
  const [allowCashOnDelivery, setAllowCashOnDelivery] = useState(true);
  const [requiresGiftWrap, setRequiresGiftWrap] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill URL Slug and SEO title when Title (English) changes
  const handleTitleEnChange = (val: string) => {
    setTitleEn(val);
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    setUrlSlug(generatedSlug);
    if (!seoTitle) {
      setSeoTitle(val);
    }
  };

  // ImgBB Upload handler
  const handleFileUpload = async (file: File, targetIndex?: number) => {
    try {
      setIsUploadingImage(true);
      if (targetIndex !== undefined) setUploadSlotIndex(targetIndex);

      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', `product_${Date.now()}`);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && (data.url || data.display_url)) {
        const cdnUrl = data.url || data.display_url;
        if (targetIndex !== undefined && targetIndex < images.length) {
          // Replace existing slot
          const updated = [...images];
          updated[targetIndex] = cdnUrl;
          setImages(updated);
        } else {
          // Append new image
          setImages((prev) => (prev.length < 6 ? [...prev, cdnUrl] : prev));
        }
      } else {
        alert(data.message || 'Image upload failed. Please try again.');
      }
    } catch (err: any) {
      alert('Error uploading image: ' + err.message);
    } finally {
      setIsUploadingImage(false);
      setUploadSlotIndex(null);
    }
  };

  // Remove photo from gallery
  const handleRemoveImage = (indexToRemove: number) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  // Add tag chip on Enter key
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Add Color Option
  const handleAddColorOption = () => {
    if (newColorInput.trim() && !colorOptions.includes(newColorInput.trim())) {
      setColorOptions([...colorOptions, newColorInput.trim()]);
      setNewColorInput('');
      setIsAddingColor(false);
    }
  };

  // Add Age Option
  const handleAddAgeOption = () => {
    if (newAgeInput.trim() && !ageOptions.includes(newAgeInput.trim())) {
      setAgeOptions([...ageOptions, newAgeInput.trim()]);
      setNewAgeInput('');
      setIsAddingAge(false);
    }
  };

  // Generate Variations Matrix
  const handleGenerateVariations = () => {
    const rows: VariationRow[] = [];
    const baseSlug = urlSlug || 'prod';
    const baseP = Number(salePrice || regularPrice || 999);
    const baseStock = Number(stockQuantity || 25);

    colorOptions.forEach((col) => {
      ageOptions.forEach((age) => {
        const cleanCol = col.replace(/\s+/g, '-').toLowerCase();
        const cleanAge = age.replace(/\s+/g, '-').toLowerCase();
        rows.push({
          id: `var-${cleanCol}-${cleanAge}-${Date.now()}`,
          colorSet: col,
          ageGroup: age,
          sku: `${baseSlug.substring(0, 8).toUpperCase()}-${cleanCol}-${cleanAge}`,
          price: baseP,
          stock: baseStock,
          imageUrl: images[0] || '',
        });
      });
    });

    setVariations(rows);
  };

  // Update a single variation row
  const updateVariationRow = (id: string, field: keyof VariationRow, value: any) => {
    setVariations(
      variations.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  // Submit Handler
  const handleSubmit = async (submitStatus: 'Published' | 'Draft' = status) => {
    if (!titleBn.trim() || !titleEn.trim()) {
      alert('Product title in both Bangla and English is required.');
      return;
    }

    if (!regularPrice) {
      alert('Please enter a regular price for the product.');
      return;
    }

    const effectiveSlug =
      urlSlug.trim() ||
      titleEn
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

    const primaryImage =
      images[0] || 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg';

    // Map variations to schema format
    const formattedVariations = variations.map((v) => ({
      sku: v.sku,
      titleBn: `${titleBn} (${v.colorSet}, ${v.ageGroup})`,
      titleEn: `${titleEn} (${v.colorSet}, ${v.ageGroup})`,
      price: Number(v.price),
      salePrice: Number(v.price),
      stock: Number(v.stock),
      stockQuantity: Number(v.stock),
      imageUrl: v.imageUrl || primaryImage,
      isActive: true,
      attributes: {
        colorSet: v.colorSet,
        ageGroup: v.ageGroup,
      },
    }));

    const payload = {
      titleBn: titleBn.trim(),
      titleEn: titleEn.trim(),
      title: titleEn.trim(),
      slug: effectiveSlug,
      basePrice: Number(regularPrice),
      price: Number(regularPrice),
      baseSalePrice: salePrice ? Number(salePrice) : Number(regularPrice),
      salePrice: salePrice ? Number(salePrice) : Number(regularPrice),
      costPerItem: costPerItem ? Number(costPerItem) : undefined,
      sku: sku.trim() || `${effectiveSlug.substring(0, 10).toUpperCase()}-001`,
      stock: Number(stockQuantity || 25),
      lowStockAlert: Number(lowStockAlert || 5),
      categorySlug,
      category: categories.find((c) => c.slug === categorySlug)?.nameEn || 'Art Kits',
      subCategory,
      tags,
      brand,
      shortDescriptionBn: shortDescBn.trim(),
      shortDescriptionEn: shortDescEn.trim(),
      description: fullDescBn.trim() || shortDescBn.trim(),
      descriptionBn: fullDescBn.trim() || shortDescBn.trim(),
      descriptionEn: shortDescEn.trim(),
      pieces: whatsInTheBox.trim(),
      imageUrl: primaryImage,
      image: primaryImage,
      galleryImages: images.length > 0 ? images : [primaryImage],
      videoUrl: videoUrl.trim() || undefined,
      weight: Number(weight || 0),
      packageSize: packageSize.trim(),
      handlingTime: Number(handlingTime || 1),
      seoTitle: seoTitle.trim() || titleEn.trim(),
      seoDescription: seoDescription.trim() || shortDescEn.trim(),
      safetyBadges,
      targetAge,
      targetAgeMin: parseInt(targetAge.replace(/\D/g, ''), 10) || 2,
      badge: productBadge.trim() || 'New',
      isNewArrival: showInNewArrivals,
      isBestSeller: featureInTrending,
      allowCashOnDelivery,
      requiresGiftWrap,
      isVariable: formattedVariations.length > 0,
      variations: formattedVariations,
      isActive: submitStatus === 'Published',
    };

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.product || payload);
      } else {
        alert(data.message || 'Failed to publish product');
      }
    } catch (err: any) {
      alert('Error creating product: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find subcategories for selected category
  const selectedCatObj = categories.find((c) => c.slug === categorySlug);
  const currentSubCats = selectedCatObj?.children || [];

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* =====================================================================
          TOP BREADCRUMB & HEADER BAR
         ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8A8A8A] font-semibold">
            <span>Products</span>
            <span>/</span>
            <span className="text-[#1A1A1A] font-bold">Add new</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#1A1A1A] mt-1">
            Add new product
          </h1>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#E5E0D8] text-xs font-bold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FAF7F2] transition-colors cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('Published')}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Publish product</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          CARD 1: PHOTOS AND VIDEO
         ===================================================================== */}
      <div className="bg-white rounded-3xl border border-[#EFEAE2] p-6 shadow-xs space-y-4">
        <div>
          <h2 className="font-heading font-black text-base text-[#1A1A1A]">
            Photos and video
          </h2>
          <p className="text-xs text-[#8A8A8A] mt-0.5">
            First photo is the cover. Up to 7 images. Drag to reorder.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          {/* Main Upload Dropzone (Left 5 cols) */}
          <label className="md:col-span-5 rounded-2xl border-2 border-dashed border-[#E5E0D8] bg-[#FAF8F5] hover:bg-[#F5EFE6] transition-all p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[170px] group">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#EFEAE2] flex items-center justify-center text-[#D32F2F] shadow-2xs group-hover:scale-105 transition-transform">
              {isUploadingImage && uploadSlotIndex === null ? (
                <Loader2 className="w-6 h-6 animate-spin text-[#D32F2F]" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>
            <span className="font-bold text-xs text-[#1A1A1A] mt-3 block">
              Click to upload or drag and drop
            </span>
            <span className="text-[10px] text-[#8A8A8A] mt-1 block">
              PNG, JPG, WebP, up to 10MB
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploadingImage}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </label>

          {/* 6 Thumbnail Slots (Right 7 cols: 3x2 grid) */}
          <div className="md:col-span-7 grid grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
              const imgUrl = images[slotIdx];
              return (
                <div
                  key={slotIdx}
                  className="relative aspect-square rounded-2xl border border-[#EFEAE2] bg-[#FAF8F5] overflow-hidden flex flex-col items-center justify-center group"
                >
                  {imgUrl ? (
                    <>
                      <Image
                        src={imgUrl}
                        alt={`Photo ${slotIdx + 1}`}
                        fill
                        className="object-cover"
                      />
                      {slotIdx === 0 && (
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-[#1A1A1A]/80 text-white text-[9px] font-bold tracking-wider uppercase z-10">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(slotIdx)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 hover:bg-black text-white transition-opacity z-10 cursor-pointer"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-[#F5EFE6] transition-colors p-2 text-center">
                      {isUploadingImage && uploadSlotIndex === slotIdx ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#D32F2F]" />
                      ) : (
                        <span className="text-xs font-bold text-[#8A8A8A] flex items-center gap-1 group-hover:text-[#D32F2F]">
                          <Plus className="w-3.5 h-3.5" /> Add
                        </span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingImage}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, slotIdx);
                        }}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Video URL support */}
        <div className="pt-2 border-t border-[#EFEAE2] flex items-center gap-2">
          <Video className="w-4 h-4 text-[#8A8A8A]" />
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Product Short Video MP4 URL (optional, for video player demo)"
            className="flex-1 text-xs bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl px-3 py-2 focus:outline-hidden focus:border-[#D32F2F]"
          />
        </div>
      </div>

      {/* =====================================================================
          CARD 2: BASIC INFORMATION
         ===================================================================== */}
      <div className="bg-white rounded-3xl border border-[#EFEAE2] p-6 shadow-xs space-y-4">
        <div>
          <h2 className="font-heading font-black text-base text-[#1A1A1A]">
            Basic information
          </h2>
          <p className="text-xs text-[#8A8A8A] mt-0.5">
            Name and description in both languages
          </p>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* Row 1: Bangla & English Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">
                Title (Bangla) <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
                placeholder="যেমন: ছোটদের মোমের রঙ সেট"
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs focus:outline-hidden focus:border-[#D32F2F]"
              />
            </div>
            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">
                Title (English) <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={titleEn}
                onChange={(e) => handleTitleEnChange(e.target.value)}
                placeholder="e.g. Toddler Starter Painting Kit"
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs focus:outline-hidden focus:border-[#D32F2F]"
              />
            </div>
          </div>

          {/* Row 2: Short Description (Bangla) */}
          <div>
            <label className="font-bold text-[#1A1A1A] block mb-1">
              Short description (Bangla)
            </label>
            <textarea
              rows={2}
              value={shortDescBn}
              onChange={(e) => setShortDescBn(e.target.value)}
              placeholder="এক নজরে কি কি পাবে..."
              className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs resize-none focus:outline-hidden focus:border-[#D32F2F]"
            />
          </div>

          {/* Row 3: Short Description (English) */}
          <div>
            <label className="font-bold text-[#1A1A1A] block mb-1">
              Short description (English)
            </label>
            <textarea
              rows={2}
              value={shortDescEn}
              onChange={(e) => setShortDescEn(e.target.value)}
              placeholder="One or two lines about the product"
              className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs resize-none focus:outline-hidden focus:border-[#D32F2F]"
            />
          </div>

          {/* Row 4: Full Description (Bangla) */}
          <div>
            <label className="font-bold text-[#1A1A1A] block mb-1">
              Full description (Bangla)
            </label>
            <textarea
              rows={4}
              value={fullDescBn}
              onChange={(e) => setFullDescBn(e.target.value)}
              placeholder="বিস্তারিত বিবরণ ও কেন এটি শিশুর জন্য বিশেষ..."
              className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs resize-none focus:outline-hidden focus:border-[#D32F2F]"
            />
          </div>

          {/* Row 5: What's in the box */}
          <div>
            <label className="font-bold text-[#1A1A1A] block mb-1">
              What's in the box
            </label>
            <input
              value={whatsInTheBox}
              onChange={(e) => setWhatsInTheBox(e.target.value)}
              placeholder="যেমন: ১২টি মোমের রঙ + ১টি ড্রয়িং খাতা"
              className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs focus:outline-hidden focus:border-[#D32F2F]"
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          CARD 3: PRICING AND STOCK
         ===================================================================== */}
      <div className="bg-white rounded-3xl border border-[#EFEAE2] p-6 shadow-xs space-y-4">
        <div>
          <h2 className="font-heading font-black text-base text-[#1A1A1A]">
            Pricing and stock
          </h2>
          <p className="text-xs text-[#8A8A8A] mt-0.5">
            Set default pricing. Variations can override these.
          </p>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* Row 1: Regular, Sale, Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">
                Regular price (৳) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A] font-bold">
                  ৳
                </span>
                <input
                  type="number"
                  required
                  value={regularPrice}
                  onChange={(e) => setRegularPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs font-bold focus:outline-hidden focus:border-[#D32F2F]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">
                Sale price (৳)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A] font-bold">
                  ৳
                </span>
                <input
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs font-bold focus:outline-hidden focus:border-[#D32F2F]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">
                Cost per item (৳)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A] font-bold">
                  ৳
                </span>
                <input
                  type="number"
                  value={costPerItem}
                  onChange={(e) => setCostPerItem(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs font-bold focus:outline-hidden focus:border-[#D32F2F]"
                />
              </div>
            </div>
          </div>

          {/* Row 2: SKU, Stock quantity, Low stock alert */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">SKU</label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Auto or type"
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs font-mono focus:outline-hidden focus:border-[#D32F2F]"
              />
            </div>

            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">
                Stock quantity
              </label>
              <input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs font-bold focus:outline-hidden focus:border-[#D32F2F]"
              />
            </div>

            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">
                Low stock alert at
              </label>
              <input
                type="number"
                value={lowStockAlert}
                onChange={(e) => setLowStockAlert(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs font-bold focus:outline-hidden focus:border-[#D32F2F]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          CARD 4: VARIATIONS
         ===================================================================== */}
      <div className="bg-white rounded-3xl border border-[#EFEAE2] p-6 shadow-xs space-y-4">
        <div>
          <h2 className="font-heading font-black text-base text-[#1A1A1A]">
            Variations
          </h2>
          <p className="text-xs text-[#8A8A8A] mt-0.5">
            Add options like color and age group to generate SKUs with separate pricing, stock and photo.
          </p>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* Option 1: Color set */}
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFEAE2] space-y-2">
            <span className="font-bold text-[#1A1A1A] block">Color set</span>
            <div className="flex flex-wrap items-center gap-2">
              {colorOptions.map((opt) => (
                <span
                  key={opt}
                  className="px-3 py-1.5 rounded-xl bg-[#FDE8E8] border border-[#F8B4B4] text-[#D32F2F] font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                >
                  <span>{opt}</span>
                  <button
                    type="button"
                    onClick={() => setColorOptions(colorOptions.filter((c) => c !== opt))}
                    className="hover:text-black cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {isAddingColor ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newColorInput}
                    onChange={(e) => setNewColorInput(e.target.value)}
                    placeholder="e.g. 48 colors"
                    className="px-2.5 py-1 text-xs rounded-xl bg-white border border-[#EFEAE2] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddColorOption}
                    className="px-2.5 py-1 rounded-xl bg-[#D32F2F] text-white font-bold text-xs"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingColor(false)}
                    className="text-[#8A8A8A] p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingColor(true)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E0D8] text-[#6B6B6B] hover:text-[#1A1A1A] font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add color
                </button>
              )}
            </div>
          </div>

          {/* Option 2: Age group */}
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFEAE2] space-y-2">
            <span className="font-bold text-[#1A1A1A] block">Age group</span>
            <div className="flex flex-wrap items-center gap-2">
              {ageOptions.map((opt) => (
                <span
                  key={opt}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#EFEAE2] text-[#2B2B2B] font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                >
                  <span>{opt}</span>
                  <button
                    type="button"
                    onClick={() => setAgeOptions(ageOptions.filter((a) => a !== opt))}
                    className="hover:text-red-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {isAddingAge ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newAgeInput}
                    onChange={(e) => setNewAgeInput(e.target.value)}
                    placeholder="e.g. 8+ yrs"
                    className="px-2.5 py-1 text-xs rounded-xl bg-white border border-[#EFEAE2] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddAgeOption}
                    className="px-2.5 py-1 rounded-xl bg-[#D32F2F] text-white font-bold text-xs"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingAge(false)}
                    className="text-[#8A8A8A] p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingAge(true)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E0D8] text-[#6B6B6B] hover:text-[#1A1A1A] font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add age
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E0D8] text-[#1A1A1A] font-bold text-xs hover:bg-[#FAF8F5] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add another option</span>
            </button>
            <button
              type="button"
              onClick={handleGenerateVariations}
              className="px-4 py-2 rounded-xl bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate variations</span>
            </button>
          </div>

          {/* Variations Matrix Table */}
          {variations.length > 0 && (
            <div className="pt-2 space-y-2">
              <div className="overflow-x-auto border border-[#EFEAE2] rounded-2xl bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-[#EFEAE2] text-[#8A8A8A] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Color set</th>
                      <th className="py-2.5 px-3">Age</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Price (৳)</th>
                      <th className="py-2.5 px-3">Stock</th>
                      <th className="py-2.5 px-3">Photo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEAE2]">
                    {variations.map((v) => (
                      <tr key={v.id} className="hover:bg-[#FAF8F5]">
                        <td className="py-2 px-3 font-bold text-[#1A1A1A]">{v.colorSet}</td>
                        <td className="py-2 px-3 text-[#6B6B6B]">{v.ageGroup}</td>
                        <td className="py-2 px-3">
                          <input
                            value={v.sku}
                            onChange={(e) => updateVariationRow(v.id, 'sku', e.target.value)}
                            className="w-28 p-1.5 rounded-lg bg-[#FAF8F5] border border-[#EFEAE2] text-[11px] font-mono"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={v.price}
                            onChange={(e) => updateVariationRow(v.id, 'price', Number(e.target.value))}
                            className="w-20 p-1.5 rounded-lg bg-[#FAF8F5] border border-[#EFEAE2] text-[11px] font-bold"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={v.stock}
                            onChange={(e) => updateVariationRow(v.id, 'stock', Number(e.target.value))}
                            className="w-16 p-1.5 rounded-lg bg-[#FAF8F5] border border-[#EFEAE2] text-[11px]"
                          />
                        </td>
                        <td className="py-2 px-3">
                          {v.imageUrl ? (
                            <img
                              src={v.imageUrl}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover border border-[#EFEAE2]"
                            />
                          ) : (
                            <span className="text-[10px] text-[#8A8A8A]">+ Photo</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-[#8A8A8A]">
                {variations.length} variations generated. Click photo to customize per-variation image.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          CARD 5: SHIPPING AND SEARCH
         ===================================================================== */}
      <div className="bg-white rounded-3xl border border-[#EFEAE2] p-6 shadow-xs space-y-4">
        <div>
          <h2 className="font-heading font-black text-base text-[#1A1A1A]">
            Shipping and search
          </h2>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* Row 1: Weight, Package size, Handling time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">
                Weight (grams)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs focus:outline-hidden focus:border-[#D32F2F]"
              />
            </div>
            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">
                Package size (cm)
              </label>
              <input
                value={packageSize}
                onChange={(e) => setPackageSize(e.target.value)}
                placeholder="L x W x H"
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs focus:outline-hidden focus:border-[#D32F2F]"
              />
            </div>
            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">
                Handling time (days)
              </label>
              <input
                type="number"
                value={handlingTime}
                onChange={(e) => setHandlingTime(e.target.value ? Number(e.target.value) : '')}
                placeholder="1"
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs focus:outline-hidden focus:border-[#D32F2F]"
              />
            </div>
          </div>

          {/* Row 2: SEO Title & URL slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">SEO title</label>
              <input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Shown on Google"
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs focus:outline-hidden focus:border-[#D32F2F]"
              />
            </div>
            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">URL slug</label>
              <input
                value={urlSlug}
                onChange={(e) => setUrlSlug(e.target.value)}
                placeholder="beeswax-crayons-kit"
                className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs font-mono focus:outline-hidden focus:border-[#D32F2F]"
              />
            </div>
          </div>

          {/* Row 3: SEO Description */}
          <div>
            <label className="font-bold text-[#1A1A1A] block mb-1">
              SEO description
            </label>
            <textarea
              rows={2}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Up to 160 characters"
              className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs resize-none focus:outline-hidden focus:border-[#D32F2F]"
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          CARD 6: PUBLISH
         ===================================================================== */}
      <div className="bg-white rounded-3xl border border-[#EFEAE2] p-6 shadow-xs space-y-4">
        <div>
          <h2 className="font-heading font-black text-base text-[#1A1A1A]">
            Publish
          </h2>
        </div>

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-[#1A1A1A] block mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs font-bold focus:outline-hidden focus:border-[#D32F2F] cursor-pointer"
            >
              <option value="Published">Published (Active on store)</option>
              <option value="Draft">Draft (Hidden from store)</option>
            </select>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('Published')}
              className="w-full py-3 rounded-xl bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Publish product</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('Draft')}
              className="w-full py-2.5 rounded-xl bg-white border border-[#E5E0D8] text-[#1A1A1A] font-bold text-xs hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            >
              Save as draft
            </button>
          </div>

          <div className="pt-1 text-center">
            <span className="text-[11px] text-[#8A8A8A] hover:text-[#D32F2F] cursor-pointer flex items-center justify-center gap-1 font-semibold">
              <ExternalLink className="w-3 h-3" /> Preview on store
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          CARD 7: ORGANIZE
         ===================================================================== */}
      <div className="bg-white rounded-3xl border border-[#EFEAE2] p-6 shadow-xs space-y-4">
        <div>
          <h2 className="font-heading font-black text-base text-[#1A1A1A]">
            Organize
          </h2>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* Category */}
          <div>
            <label className="font-bold text-[#1A1A1A] block mb-1">Category</label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs font-bold focus:outline-hidden focus:border-[#D32F2F] cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nameEn} ({c.nameBn})
                </option>
              ))}
            </select>
          </div>

          {/* Sub-category */}
          <div>
            <label className="font-bold text-[#1A1A1A] block mb-1">
              Sub-category
            </label>
            <select
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs focus:outline-hidden focus:border-[#D32F2F] cursor-pointer"
            >
              <option value="">Select sub-category</option>
              {currentSubCats.map((sub) => (
                <option key={sub.slug} value={sub.slug}>
                  {sub.nameEn} ({sub.nameBn})
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="font-bold text-[#1A1A1A] block mb-1">Tags</label>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type and press enter"
              className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs focus:outline-hidden focus:border-[#D32F2F]"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#EFEAE2] text-[11px] font-medium flex items-center gap-1"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-[#8A8A8A] hover:text-[#D32F2F]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Brand */}
          <div>
            <label className="font-bold text-[#1A1A1A] block mb-1">Brand</label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Acme"
              className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs focus:outline-hidden focus:border-[#D32F2F]"
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          CARD 8: KIDS ESSENTIALS
         ===================================================================== */}
      <div className="bg-white rounded-3xl border border-[#EFEAE2] p-6 shadow-xs space-y-4">
        <div>
          <h2 className="font-heading font-black text-base text-[#1A1A1A]">
            Kids essentials
          </h2>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* Safety Badges */}
          <div>
            <label className="font-bold text-[#1A1A1A] block mb-1.5">
              Safety badges
            </label>
            <div className="flex flex-wrap gap-2">
              {['Non-toxic', 'BPA free', 'Washable', 'Food-grade'].map((badge) => {
                const active = safetyBadges.includes(badge);
                return (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => {
                      if (active) {
                        setSafetyBadges(safetyBadges.filter((b) => b !== badge));
                      } else {
                        setSafetyBadges([...safetyBadges, badge]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      active
                        ? 'bg-[#FDE8E8] text-[#D32F2F] border border-[#F8B4B4]'
                        : 'bg-white border border-[#E5E0D8] text-[#6B6B6B] hover:text-[#1A1A1A]'
                    }`}
                  >
                    {badge}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Age */}
          <div>
            <label className="font-bold text-[#1A1A1A] block mb-1.5">
              Target age
            </label>
            <div className="flex items-center gap-2">
              {['1+', '2+', '3+', '5+', '8+'].map((age) => {
                const active = targetAge === age;
                return (
                  <button
                    key={age}
                    type="button"
                    onClick={() => setTargetAge(age)}
                    className={`w-9 h-9 rounded-full font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${
                      active
                        ? 'bg-[#D32F2F] text-white shadow-xs'
                        : 'bg-white border border-[#E5E0D8] text-[#6B6B6B] hover:text-[#1A1A1A]'
                    }`}
                  >
                    {age}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Badge Text */}
          <div>
            <label className="font-bold text-[#1A1A1A] block mb-1">
              Product badge text
            </label>
            <input
              value={productBadge}
              onChange={(e) => setProductBadge(e.target.value)}
              placeholder="যেমন: সেরা উপহার"
              className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs focus:outline-hidden focus:border-[#D32F2F]"
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          CARD 9: SHOW ON STORE (TOGGLES)
         ===================================================================== */}
      <div className="bg-white rounded-3xl border border-[#EFEAE2] p-6 shadow-xs space-y-4">
        <div>
          <h2 className="font-heading font-black text-base text-[#1A1A1A]">
            Show on store
          </h2>
        </div>

        <div className="divide-y divide-[#EFEAE2] text-xs">
          {/* Toggle 1: Show in New arrivals */}
          <div className="py-3 flex items-center justify-between">
            <span className="font-bold text-[#1A1A1A]">Show in New arrivals</span>
            <button
              type="button"
              onClick={() => setShowInNewArrivals(!showInNewArrivals)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                showInNewArrivals ? 'bg-[#D32F2F]' : 'bg-[#E5E0D8]'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  showInNewArrivals ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Toggle 2: Feature in Trending now */}
          <div className="py-3 flex items-center justify-between">
            <span className="font-bold text-[#1A1A1A]">Feature in Trending now</span>
            <button
              type="button"
              onClick={() => setFeatureInTrending(!featureInTrending)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                featureInTrending ? 'bg-[#D32F2F]' : 'bg-[#E5E0D8]'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  featureInTrending ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Toggle 3: Allow cash on delivery */}
          <div className="py-3 flex items-center justify-between">
            <span className="font-bold text-[#1A1A1A]">Allow cash on delivery</span>
            <button
              type="button"
              onClick={() => setAllowCashOnDelivery(!allowCashOnDelivery)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                allowCashOnDelivery ? 'bg-[#D32F2F]' : 'bg-[#E5E0D8]'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  allowCashOnDelivery ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Toggle 4: Requires gift wrap option */}
          <div className="py-3 flex items-center justify-between">
            <span className="font-bold text-[#1A1A1A]">Requires gift wrap option</span>
            <button
              type="button"
              onClick={() => setRequiresGiftWrap(!requiresGiftWrap)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                requiresGiftWrap ? 'bg-[#D32F2F]' : 'bg-[#E5E0D8]'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  requiresGiftWrap ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
