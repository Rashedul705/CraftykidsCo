'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  Copy,
  AlertCircle,
  Clock,
  ArrowLeft,
  Eye,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { SampleCategory, getVideoEmbedInfo } from '@/lib/sample-data';
import { BRAND_NAME } from '@/lib/brand';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/Pill';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input, Textarea, Select, FormField } from '@/components/ui/Input';
import {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export interface AddProductFormProps {
  onCancel: () => void;
  onSuccess: (createdProduct: any) => void;
  categories: SampleCategory[];
  initialProduct?: any | null;
}

export interface VariationRow {
  id: string;
  name: string;
  detail?: string;
  sku: string;
  price: number;
  salePrice: number;
  stock: number;
  imageUrl?: string;
}

export default function AddProductForm({
  onCancel,
  onSuccess,
  categories,
  initialProduct,
}: AddProductFormProps) {
  const { success, error: toastError, warning } = useToast();
  const isEditing = Boolean(initialProduct);

  // Field validation errors map
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Unsaved changes confirmation dialog
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Autosave status
  const [lastAutosaved, setLastAutosaved] = useState<string | null>(null);

  // ==========================================
  // FORM STATES
  // ==========================================

  // 1. Photos & Video
  const [images, setImages] = useState<string[]>(() => {
    if (initialProduct?.galleryImages && initialProduct.galleryImages.length > 0) {
      return initialProduct.galleryImages;
    }
    if (initialProduct?.imageUrl || initialProduct?.image) {
      return [initialProduct.imageUrl || initialProduct.image];
    }
    return [];
  });
  const [videoUrl, setVideoUrl] = useState<string>(() => {
    return initialProduct?.videoUrl || initialProduct?.videos?.[0]?.url || '';
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // 2. Basic Information
  const [titleBn, setTitleBn] = useState(() => initialProduct?.titleBn || '');
  const [titleEn, setTitleEn] = useState(() => initialProduct?.titleEn || initialProduct?.title || '');
  const [shortDescBn, setShortDescBn] = useState(() => initialProduct?.shortDescriptionBn || '');
  const [shortDescEn, setShortDescEn] = useState(() => initialProduct?.shortDescriptionEn || '');
  const [fullDescBn, setFullDescBn] = useState(() => initialProduct?.descriptionBn || initialProduct?.description || '');
  const [whatsInTheBox, setWhatsInTheBox] = useState(() => initialProduct?.pieces || '');

  // 3. Pricing and Stock
  const [regularPrice, setRegularPrice] = useState<number | ''>(
    () => initialProduct?.basePrice ?? initialProduct?.price ?? 1200
  );
  const [salePrice, setSalePrice] = useState<number | ''>(
    () => initialProduct?.baseSalePrice ?? initialProduct?.salePrice ?? 999
  );
  const [costPrice, setCostPrice] = useState<number | ''>(() => initialProduct?.costPerItem || '');
  const [sku, setSku] = useState(() => initialProduct?.sku || '');
  const [stockQuantity, setStockQuantity] = useState<number | ''>(
    () => initialProduct?.stock ?? 25
  );
  const [lowStockAlert, setLowStockAlert] = useState<number | ''>(
    () => initialProduct?.lowStockAlert ?? 5
  );

  // 4. Variations
  const [hasVariations, setHasVariations] = useState<boolean>(() => {
    if (initialProduct?.variations && initialProduct.variations.length > 0) {
      return true;
    }
    return Boolean(initialProduct?.isVariable);
  });
  const [optionGroupTitle, setOptionGroupTitle] = useState('Set Options');
  const [optionValues, setOptionValues] = useState<string[]>(() => {
    if (initialProduct?.variations && initialProduct.variations.length > 0) {
      return initialProduct.variations.map((v: any) => v.attributes?.colorSet || v.titleEn || v.name);
    }
    return [];
  });
  const [newOptionInput, setNewOptionInput] = useState('');

  const [variations, setVariations] = useState<VariationRow[]>(() => {
    if (initialProduct?.variations && initialProduct.variations.length > 0) {
      return initialProduct.variations.map((v: any, idx: number) => {
        let initialDetail = v.detail || v.whatsInIt || v.descriptionBn || v.attributes?.detail || '';
        let initialName = v.name || v.attributes?.colorSet || v.titleEn || v.titleBn || `Option ${idx + 1}`;
        if (!initialDetail && v.titleBn) {
          const match = v.titleBn.match(/^([^(]+)\((.+)\)/);
          if (match && match[2]) {
            initialDetail = match[2].trim();
            initialName = match[1].trim();
          }
        }
        return {
          id: v.id || `var-${idx + 1}`,
          name: initialName,
          detail: initialDetail,
          sku: v.sku || '',
          price: Number(v.price || regularPrice || 1200),
          salePrice: Number(v.salePrice || salePrice || 999),
          stock: Number(v.stockQuantity ?? v.stock ?? 25),
          imageUrl: v.imageUrl || '',
        };
      });
    }
    return [];
  });

  // 5. Shipping & Search
  const [weightGrams, setWeightGrams] = useState<number | ''>(() => initialProduct?.weight || 350);
  const [packageSize, setPackageSize] = useState(() => initialProduct?.packageSize || '20 x 15 x 5 cm');
  const [seoTitle, setSeoTitle] = useState(() => initialProduct?.seoTitle || initialProduct?.titleEn || '');
  const [urlSlug, setUrlSlug] = useState(() => initialProduct?.slug || '');
  const [seoDescription, setSeoDescription] = useState(() => initialProduct?.seoDescription || '');

  // 6. Right Sidebar: Publish & Organize
  const [publishStatus, setPublishStatus] = useState<'Published' | 'Draft'>(
    () => (initialProduct?.isActive === false ? 'Draft' : 'Published')
  );
  const [categorySlug, setCategorySlug] = useState(
    () => initialProduct?.categorySlug || initialProduct?.primaryCategorySlug || categories[0]?.slug || 'wax-crayons'
  );
  const [subCategory, setSubCategory] = useState(() => initialProduct?.subCategory || '');
  const [tags, setTags] = useState<string[]>(() => initialProduct?.tags || ['crayons', 'non-toxic']);
  const [tagInput, setTagInput] = useState('');
  const [brand, setBrand] = useState(() => initialProduct?.brand || BRAND_NAME);

  // 7. Right Sidebar: Kids Details
  const [safetyBadges, setSafetyBadges] = useState<string[]>(() => {
    if (initialProduct?.safetyBadges && initialProduct.safetyBadges.length > 0) {
      return initialProduct.safetyBadges.map((b: any) =>
        typeof b === 'string' ? b : b.nameEn || b.code
      );
    }
    return ['100% Non-toxic', 'Food-grade Beeswax', 'Washable'];
  });
  const [targetAge, setTargetAge] = useState<string>(
    () => initialProduct?.targetAge || (initialProduct?.targetAgeMin ? `${initialProduct.targetAgeMin}+` : '2+')
  );
  const [badgeText, setBadgeText] = useState(() => initialProduct?.badge || 'New');

  // 8. Right Sidebar: Show on Store Toggles
  const [showInNewArrivals, setShowInNewArrivals] = useState(() => initialProduct?.isNewArrival ?? true);
  const [featureInTrending, setFeatureInTrending] = useState(() => initialProduct?.isBestSeller ?? true);
  const [allowCashOnDelivery, setAllowCashOnDelivery] = useState(() => initialProduct?.allowCashOnDelivery ?? true);
  const [showStockLeft, setShowStockLeft] = useState(() => initialProduct?.showStockLeft ?? true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mark form as dirty when any field changes
  const markDirty = () => setIsDirty(true);

  // Auto-generate URL Slug & SEO Title from English Title
  const handleTitleEnChange = (val: string) => {
    setTitleEn(val);
    markDirty();
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    setUrlSlug(generatedSlug);
    if (!seoTitle || seoTitle === titleEn) {
      setSeoTitle(val);
    }
  };

  // Auto-generate SKU if empty
  const getEffectiveSku = () => {
    if (sku.trim()) return sku.trim();
    const cleanPrefix = (urlSlug || titleEn || 'CKC')
      .replace(/[^\w]/g, '')
      .substring(0, 8)
      .toUpperCase();
    return `CKC-${cleanPrefix}-001`;
  };

  // Upload image to cloud storage interface
  const handlePhotoUpload = async (file: File) => {
    try {
      setIsUploadingImage(true);
      markDirty();

      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', `craftykidsco_${Date.now()}`);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && (data.url || data.display_url)) {
        const cdnUrl = data.url || data.display_url;
        setImages((prev) => (prev.length < 8 ? [...prev, cdnUrl] : prev));
        success('Photo uploaded successfully.');
      } else {
        toastError(data.message || 'Image upload failed. Please try again.');
      }
    } catch {
      toastError('Connection error uploading image.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Remove photo
  const handleRemovePhoto = (idx: number) => {
    markDirty();
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Upload variation specific photo
  const [uploadingVarId, setUploadingVarId] = useState<string | null>(null);
  const handleVariationPhotoUpload = async (varId: string, file: File) => {
    try {
      setUploadingVarId(varId);
      markDirty();

      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', `craftykidsco_var_${Date.now()}`);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && (data.url || data.display_url)) {
        const cdnUrl = data.url || data.display_url;
        updateVariationRow(varId, 'imageUrl', cdnUrl);
        setImages((prev) => (prev.includes(cdnUrl) ? prev : [...prev, cdnUrl]));
        success('Variation photo uploaded successfully.');
      } else {
        toastError(data.message || 'Image upload failed. Please try again.');
      }
    } catch {
      toastError('Connection error uploading image.');
    } finally {
      setUploadingVarId(null);
    }
  };

  // Add Variation Option Tag
  const handleAddOptionTag = () => {
    if (!newOptionInput.trim()) return;
    if (!optionValues.includes(newOptionInput.trim())) {
      setOptionValues([...optionValues, newOptionInput.trim()]);
      markDirty();
    }
    setNewOptionInput('');
  };

  // Remove Variation Option Tag
  const handleRemoveOptionTag = (val: string) => {
    setOptionValues(optionValues.filter((v) => v !== val));
    markDirty();
  };

  // Generate Variations Matrix Table
  const handleGenerateVariations = () => {
    const baseSlug = urlSlug || 'prod';
    const baseRegular = Number(regularPrice || 1200);
    const baseSale = Number(salePrice || regularPrice || 999);
    const baseStock = Number(stockQuantity || 25);

    const generated: VariationRow[] = optionValues.map((opt, idx) => {
      const cleanSlug = opt.replace(/\s+/g, '-').toLowerCase();
      const existing = variations.find((v) => v.name.toLowerCase() === opt.toLowerCase());

      // Smart default detail if matched
      let autoDetail = existing?.detail || '';
      if (!autoDetail) {
        if (/12/i.test(opt) || /১২/i.test(opt)) autoDetail = '১২টি শেপ + ৬টি রঙ + ১ ব্রাশ';
        else if (/24/i.test(opt) || /২৪/i.test(opt)) autoDetail = '২৪টি শেপ + ১২টি রঙ + ২ ব্রাশ';
        else if (/36|48/i.test(opt) || /৩৬|৪৮/i.test(opt)) autoDetail = 'সম্পূর্ণ কালেকশন বক্স + সব কালার';
      }

      return {
        id: existing?.id || `var-${cleanSlug}-${Date.now()}-${idx}`,
        name: opt,
        detail: autoDetail,
        sku: existing?.sku || `${baseSlug.substring(0, 8).toUpperCase()}-${cleanSlug.toUpperCase()}`,
        price: existing?.price || baseRegular,
        salePrice: existing?.salePrice || baseSale,
        stock: existing?.stock ?? baseStock,
        imageUrl: existing?.imageUrl || images[0] || '',
      };
    });

    setVariations(generated);
    markDirty();
    success(`Generated ${generated.length} variations successfully.`);
  };

  // Copy Price to All Variation Rows
  const handleCopyPriceToAll = () => {
    if (variations.length === 0) return;
    const targetPrice = Number(salePrice || variations[0]?.salePrice || 999);
    const targetRegular = Number(regularPrice || variations[0]?.price || 1200);

    setVariations(
      variations.map((v) => ({
        ...v,
        price: targetRegular,
        salePrice: targetPrice,
      }))
    );
    markDirty();
    success(`Copied sale price (৳${targetPrice}) to all variation rows.`);
  };

  // Add Single Custom Variation Row
  const handleAddCustomRow = () => {
    const nextIdx = variations.length + 1;
    setVariations([
      ...variations,
      {
        id: `var-custom-${Date.now()}`,
        name: `Option ${nextIdx}`,
        detail: '',
        sku: `${getEffectiveSku()}-OPT${nextIdx}`,
        price: Number(regularPrice || 1200),
        salePrice: Number(salePrice || 999),
        stock: Number(stockQuantity || 20),
        imageUrl: images[0] || '',
      },
    ]);
    markDirty();
  };

  // Update Variation Row
  const updateVariationRow = (id: string, field: keyof VariationRow, value: any) => {
    setVariations(variations.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
    markDirty();
  };

  // Delete Variation Row
  const deleteVariationRow = (id: string) => {
    setVariations(variations.filter((v) => v.id !== id));
    markDirty();
  };

  // Tag Management
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
        markDirty();
      }
      setTagInput('');
    }
  };

  // Autosave Draft every 30 seconds
  useEffect(() => {
    if (isEditing) return; // Do not overwrite new product draft if editing existing product

    const timer = setInterval(() => {
      if (isDirty && (titleBn || titleEn)) {
        const draft = {
          titleBn,
          titleEn,
          regularPrice,
          salePrice,
          categorySlug,
          videoUrl,
          timestamp: new Date().toLocaleTimeString(),
        };
        try {
          localStorage.setItem('craftykidsco_product_draft', JSON.stringify(draft));
          setLastAutosaved(draft.timestamp);
        } catch {}
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [isDirty, isEditing, titleBn, titleEn, regularPrice, salePrice, categorySlug, videoUrl]);

  // Warn before browser unload if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle Cancel with confirmation if dirty
  const handleCancelClick = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      onCancel();
    }
  };

  // Form Submission
  const handleSubmit = async (submitStatus: 'Published' | 'Draft' = publishStatus) => {
    const errors: Record<string, string> = {};

    if (!titleBn.trim()) {
      errors.titleBn = 'Product title in Bangla is required (e.g., কার পেইন্টিং কিট).';
    }
    if (!titleEn.trim()) {
      errors.titleEn = 'Product title in English is required for URLs and search.';
    }
    if (!regularPrice) {
      errors.regularPrice = 'Please enter a regular price for the product.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toastError('Please fix the highlighted required fields.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    const effectiveSlug =
      urlSlug.trim() ||
      titleEn.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') ||
      `product-${Date.now()}`;
    const primaryImage = images[0] || 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg';

    const effectiveSku = getEffectiveSku();

    const formattedVariations =
      hasVariations && variations.length > 0
        ? variations.map((v) => {
            const optionName = v.name.trim();
            const optionDetail = (v.detail || '').trim();
            return {
              id: v.id,
              name: optionName,
              detail: optionDetail,
              whatsInIt: optionDetail,
              descriptionBn: optionDetail,
              sku: v.sku || `${effectiveSku}-${optionName.replace(/\s+/g, '-').toUpperCase()}`,
              titleBn: optionDetail ? `${optionName} (${optionDetail})` : optionName,
              titleEn: `${titleEn} (${optionName})`,
              price: Number(v.price),
              salePrice: Number(v.salePrice || v.price),
              stock: Number(v.stock),
              stockQuantity: Number(v.stock),
              imageUrl: v.imageUrl || primaryImage,
              isActive: true,
              attributes: {
                colorSet: optionName,
                detail: optionDetail,
              },
            };
          })
        : [];

    const allGalleryImages = [...images];
    formattedVariations.forEach((v) => {
      if (v.imageUrl && !allGalleryImages.includes(v.imageUrl)) {
        allGalleryImages.push(v.imageUrl);
      }
    });
    if (allGalleryImages.length === 0) {
      allGalleryImages.push(primaryImage);
    }

    const payload = {
      titleBn: titleBn.trim(),
      titleEn: titleEn.trim(),
      title: titleEn.trim(),
      slug: effectiveSlug,
      basePrice: Number(regularPrice),
      price: Number(regularPrice),
      baseSalePrice: salePrice ? Number(salePrice) : Number(regularPrice),
      salePrice: salePrice ? Number(salePrice) : Number(regularPrice),
      costPerItem: costPrice ? Number(costPrice) : undefined,
      sku: effectiveSku,
      stock: Number(stockQuantity || 25),
      lowStockAlert: Number(lowStockAlert || 5),
      categorySlug,
      category: categories.find((c) => c.slug === categorySlug)?.nameEn || 'Wax Crayons',
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
      galleryImages: allGalleryImages,
      videoUrl: videoUrl.trim(),
      weight: Number(weightGrams || 350),
      packageSize: packageSize.trim(),
      seoTitle: seoTitle.trim() || titleEn.trim(),
      seoDescription: seoDescription.trim() || shortDescEn.trim(),
      safetyBadges,
      targetAge,
      targetAgeMin: parseInt(targetAge.replace(/\D/g, ''), 10) || 2,
      badge: badgeText.trim() || 'New',
      isNewArrival: showInNewArrivals,
      isBestSeller: featureInTrending,
      allowCashOnDelivery,
      showStockLeft,
      isVariable: formattedVariations.length > 0,
      variations: formattedVariations,
      isActive: submitStatus === 'Published',
    };

    const targetId = initialProduct?.id || initialProduct?.slug || initialProduct?._id;

    try {
      const endpoint = isEditing ? `/api/products/${targetId}` : '/api/products';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsDirty(false);
        try {
          localStorage.removeItem('craftykidsco_product_draft');
        } catch {}
        success(isEditing ? 'Product updated successfully.' : 'Product published successfully.');
        onSuccess(data.product || payload);
      } else {
        toastError(data.message || 'Failed to save product.');
      }
    } catch {
      toastError('Connection error saving product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EFE9E0]">
        <div>
          <button
            onClick={handleCancelClick}
            className="text-xs font-semibold text-[#6B6B6B] hover:text-[#2B2B2B] flex items-center gap-1.5 mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
          </button>
          <h2 className="text-2xl sm:text-3xl font-bold font-fredoka text-[#2B2B2B]">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h2>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Configure child-safe toy specifications, multi-variation pricing, and catalog tags
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={handleCancelClick}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={isSubmitting}
            onClick={() => handleSubmit('Draft')}
          >
            Save as draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            onClick={() => handleSubmit('Published')}
          >
            <Check className="w-4 h-4" />
            <span>{isEditing ? 'Save changes' : 'Publish product'}</span>
          </Button>
        </div>
      </div>

      {/* Field Errors Alert Banner */}
      {Object.keys(formErrors).length > 0 && (
        <div className="p-4 rounded-[16px] bg-[#FDE3E1] border border-[#F8BEBA] text-xs text-[#9B2420] space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Please correct the following errors before publishing:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-6">
            {Object.values(formErrors).map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* =========================================================================
          TWO-COLUMN FULL PAGE WORKSPACE
          Left (8 cols): Form sections
          Right (4 cols, sticky): Quick controls, publish status, badges
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =====================================================================
            LEFT COLUMN (8 cols): Main Form Sections
           ===================================================================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Photos & Video */}
          <Card>
            <CardHeader>
              <CardTitle>Photos and video</CardTitle>
              <p className="text-xs text-[#6B6B6B]">
                First photo is the cover. Up to 8 photos. Drag or click to add photos.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Upload Slot */}
                <label className="aspect-square rounded-[16px] border-2 border-dashed border-[#EFE9E0] bg-[#FAF7F2] hover:bg-[#F3EFE8] transition-colors p-4 flex flex-col items-center justify-center text-center cursor-pointer group">
                  {isUploadingImage ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[#D6403B]" />
                  ) : (
                    <Upload className="w-6 h-6 text-[#6B6B6B] group-hover:scale-105 transition-transform" />
                  )}
                  <span className="font-semibold text-xs text-[#2B2B2B] mt-2 block">Upload photo</span>
                  <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">PNG, JPG, WebP</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file);
                    }}
                  />
                </label>

                {/* Existing Gallery Slots */}
                {images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-[16px] border border-[#EFE9E0] overflow-hidden bg-white group"
                  >
                    <Image src={imgUrl} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#2B2B2B] text-white text-[9px] font-bold uppercase tracking-wider z-10">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-[#9B2420] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white cursor-pointer z-10"
                      aria-label="Remove photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Video URL Field */}
              <div className="pt-2 border-t border-[#EFE9E0]">
                <Input
                  id="prod-video"
                  label="Demo video URL (optional)"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    markDirty();
                  }}
                  placeholder="https://youtube.com/shorts/... or https://youtube.com/watch?v=... or MP4 link"
                  helperText="Supports YouTube links (watch, shorts, embed), Vimeo, or direct MP4/WebM videos. Leave blank if product has no video."
                />

                {videoUrl.trim() && (() => {
                  const embedInfo = getVideoEmbedInfo(videoUrl);
                  return (
                    <div className="mt-2.5 p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-black shrink-0 border border-[#EFE9E0] flex items-center justify-center">
                            {embedInfo.thumbnailUrl ? (
                              <img
                                src={embedInfo.thumbnailUrl}
                                alt="Video Thumbnail"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Video className="w-5 h-5 text-white/80" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-xs font-bold text-[#1F6B43]">
                                {embedInfo.type === 'youtube'
                                  ? '✓ YouTube Video Detected'
                                  : embedInfo.type === 'vimeo'
                                  ? '✓ Vimeo Video Detected'
                                  : '✓ Direct Video Link'}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#6B6B6B] truncate max-w-sm mt-0.5">
                              {videoUrl}
                            </p>
                          </div>
                        </div>

                        <a
                          href={videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-xs font-bold text-[#0B5F85] bg-white rounded-lg border border-[#BEE4F7] hover:bg-[#DDF1FB] transition-colors shrink-0"
                        >
                          Open Video ↗
                        </a>
                      </div>

                      <p className="text-[11px] text-[#0B5F85] font-semibold bg-[#DDF1FB]/60 px-2.5 py-1 rounded-lg">
                        💡 Remember to click &quot;{isEditing ? 'Save changes' : 'Publish product'}&quot; in the top bar to save this video to your storefront.
                      </p>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* 2. Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic information</CardTitle>
              <p className="text-xs text-[#6B6B6B]">
                Enter product titles and descriptions in both Bangla and English
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="prod-title-bn"
                  label="Title (Bangla)"
                  value={titleBn}
                  onChange={(e) => {
                    setTitleBn(e.target.value);
                    markDirty();
                  }}
                  placeholder="যেমন: কার পেইন্টিং কিট - ১২ পিস"
                  error={formErrors.titleBn}
                  required
                />

                <Input
                  id="prod-title-en"
                  label="Title (English)"
                  value={titleEn}
                  onChange={(e) => handleTitleEnChange(e.target.value)}
                  placeholder="e.g., Car Painting Kit - 12 Piece Set"
                  error={formErrors.titleEn}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                  id="prod-short-bn"
                  label="Short description (Bangla)"
                  value={shortDescBn}
                  onChange={(e) => {
                    setShortDescBn(e.target.value);
                    markDirty();
                  }}
                  placeholder="পণ্যটির এক লাইনের সংক্ষেপ বিবরণ..."
                  rows={2}
                />

                <Textarea
                  id="prod-short-en"
                  label="Short description (English)"
                  value={shortDescEn}
                  onChange={(e) => {
                    setShortDescEn(e.target.value);
                    markDirty();
                  }}
                  placeholder="One sentence summary for product cards and previews..."
                  rows={2}
                />
              </div>

              <Textarea
                id="prod-full-bn"
                label="Full description (Bangla)"
                value={fullDescBn}
                onChange={(e) => {
                  setFullDescBn(e.target.value);
                  markDirty();
                }}
                placeholder="পণ্যের বিস্তারিত বিবরণ: উপাদান, ব্যবহারের নিয়ম, কোন বয়সের জন্য উপযোগী..."
                rows={4}
              />

              <Input
                id="prod-whats-in-the-box"
                label="What is in the box"
                value={whatsInTheBox}
                onChange={(e) => {
                  setWhatsInTheBox(e.target.value);
                  markDirty();
                }}
                placeholder="যেমন: ১২টি মোমের রং, ২টি আর্ট শিট, ১টি ব্রাশ"
                helperText="Displayed in the 'বাক্সে কী আছে' tab on the storefront product page"
              />
            </CardContent>
          </Card>

          {/* 3. Pricing and Stock */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing and stock</CardTitle>
              <p className="text-xs text-[#6B6B6B]">
                Default prices for products without variations. Amounts stored as integers.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  type="number"
                  id="prod-reg-price"
                  label="Regular price (৳)"
                  value={regularPrice}
                  onChange={(e) => {
                    setRegularPrice(e.target.value === '' ? '' : Number(e.target.value));
                    markDirty();
                  }}
                  error={formErrors.regularPrice}
                  required
                />

                <Input
                  type="number"
                  id="prod-sale-price"
                  label="Sale price (৳)"
                  value={salePrice}
                  onChange={(e) => {
                    setSalePrice(e.target.value === '' ? '' : Number(e.target.value));
                    markDirty();
                  }}
                  helperText="Customer pays this discounted price"
                />

                <Input
                  type="number"
                  id="prod-cost-price"
                  label="Cost price (private ৳)"
                  value={costPrice}
                  onChange={(e) => {
                    setCostPrice(e.target.value === '' ? '' : Number(e.target.value));
                    markDirty();
                  }}
                  helperText="Visible only to Admins for profit calculation"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  id="prod-sku"
                  label="SKU"
                  value={sku}
                  onChange={(e) => {
                    setSku(e.target.value);
                    markDirty();
                  }}
                  placeholder={getEffectiveSku()}
                  helperText="Auto-generated if left blank"
                />

                <Input
                  type="number"
                  id="prod-stock"
                  label="Stock quantity"
                  value={stockQuantity}
                  onChange={(e) => {
                    setStockQuantity(e.target.value === '' ? '' : Number(e.target.value));
                    markDirty();
                  }}
                />

                <Input
                  type="number"
                  id="prod-low-alert"
                  label="Low stock alert level"
                  value={lowStockAlert}
                  onChange={(e) => {
                    setLowStockAlert(e.target.value === '' ? '' : Number(e.target.value));
                    markDirty();
                  }}
                  helperText="Triggers warning in admin dashboard"
                />
              </div>
            </CardContent>
          </Card>

          {/* 4. Variations Matrix */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle>Variations</CardTitle>
                  <label className="inline-flex items-center gap-2 cursor-pointer bg-[#FAF7F2] px-3 py-1 rounded-full border border-[#EFE9E0] text-xs font-bold text-[#2B2B2B] hover:bg-[#F5EFE6] transition-colors">
                    <input
                      type="checkbox"
                      checked={hasVariations}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setHasVariations(checked);
                        markDirty();
                        if (checked && variations.length === 0) {
                          setVariations([
                            {
                              id: `var-${Date.now()}-1`,
                              name: '12 Piece Set',
                              detail: '১২টি শেপ + ৬টি রঙ + ১ ব্রাশ',
                              sku: `${getEffectiveSku()}-12PCS`,
                              price: Number(regularPrice || 1200),
                              salePrice: Number(salePrice || 999),
                              stock: Number(stockQuantity || 25),
                              imageUrl: images[0] || '',
                            },
                          ]);
                          setOptionValues(['12 Piece Set']);
                        }
                      }}
                      className="rounded border-[#D1D5DB] text-[#D6403B] focus:ring-[#D6403B] w-4 h-4"
                    />
                    <span>This product has multiple variations</span>
                  </label>
                </div>
                <p className="text-xs text-[#6B6B6B] mt-1">
                  {hasVariations
                    ? 'Configure multiple options (different sizes, colors, piece counts) with individual photos, prices, and stocks.'
                    : 'Currently single product (no variations). Turn on the checkbox above if this product has multiple sizes or options.'}
                </p>
              </div>

              {hasVariations && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={handleCopyPriceToAll}>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy price to all rows</span>
                  </Button>
                  <Button size="sm" variant="primary" onClick={handleGenerateVariations}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate variations</span>
                  </Button>
                </div>
              )}
            </CardHeader>

            {hasVariations ? (
              <CardContent className="space-y-4">
                {/* Option Values Tags Input */}
                <div className="p-3.5 bg-[#FAF7F2] rounded-[16px] border border-[#EFE9E0] space-y-2">
                  <label className="text-xs font-semibold text-[#2B2B2B] block">
                    Option values for {optionGroupTitle} (e.g., 12 Piece, 24 Piece, 48 Piece)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {optionValues.map((opt) => (
                      <span
                        key={opt}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#EFE9E0] text-xs font-medium text-[#2B2B2B]"
                      >
                        <span>{opt}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionTag(opt)}
                          className="text-[#6B6B6B] hover:text-[#9B2420]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newOptionInput}
                        onChange={(e) => setNewOptionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddOptionTag();
                          }
                        }}
                        placeholder="+ Add option value"
                        className="bg-white border border-[#EFE9E0] rounded-full px-3 py-1 text-xs text-[#2B2B2B] outline-none focus:border-[#D6403B] w-36"
                      />
                      <Button size="sm" variant="secondary" onClick={handleAddOptionTag}>
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Variations Table with Photo Column */}
                <TableContainer>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Photo</TableHead>
                        <TableHead>Option</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            <span>What&apos;s in it (Detail)</span>
                            <span className="text-[10px] text-[#8C8C8C] font-normal">(কী কী আছে)</span>
                          </div>
                        </TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Regular (৳)</TableHead>
                        <TableHead>Sale (৳)</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="py-6 text-center text-[#6B6B6B]">
                            No variations added yet. Click &quot;Generate variations&quot; or &quot;+ Add custom variation row&quot;.
                          </TableCell>
                        </TableRow>
                      ) : (
                        variations.map((v) => (
                          <TableRow key={v.id}>
                            {/* Photo Column */}
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {v.imageUrl ? (
                                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#EFE9E0] bg-[#FAF7F2] group shrink-0 shadow-2xs">
                                    <Image src={v.imageUrl} alt={v.name} fill className="object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => updateVariationRow(v.id, 'imageUrl', '')}
                                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                      title="Remove photo"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <label
                                    className="w-10 h-10 rounded-lg border border-dashed border-[#D1D5DB] hover:border-[#D6403B] bg-white hover:bg-[#FAF7F2] flex items-center justify-center cursor-pointer text-[#6B6B6B] hover:text-[#D6403B] transition-colors shrink-0"
                                    title="Upload photo for this variation"
                                  >
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleVariationPhotoUpload(v.id, file);
                                      }}
                                    />
                                    {uploadingVarId === v.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D6403B]" />
                                    ) : (
                                      <ImageIcon className="w-3.5 h-3.5" />
                                    )}
                                  </label>
                                )}
                              </div>
                            </TableCell>

                            <TableCell>
                              <input
                                type="text"
                                value={v.name}
                                onChange={(e) => updateVariationRow(v.id, 'name', e.target.value)}
                                placeholder="e.g. ১২ পিস সেট"
                                className="bg-transparent border border-transparent hover:border-[#EFE9E0] focus:border-[#D6403B] rounded-[8px] px-2 py-1 text-xs font-semibold text-[#2B2B2B] outline-none w-28 focus:bg-white"
                              />
                            </TableCell>
                            <TableCell>
                              <input
                                type="text"
                                value={v.detail || ''}
                                onChange={(e) => updateVariationRow(v.id, 'detail', e.target.value)}
                                placeholder="যেমন: ১২টি শেপ + ৬টি রঙ + ১ ব্রাশ"
                                className="bg-transparent border border-transparent hover:border-[#EFE9E0] focus:border-[#D6403B] rounded-[8px] px-2 py-1 text-xs text-[#2B2B2B] outline-none w-44 sm:w-56 focus:bg-white"
                                title="What's included in this set (shown under option title on storefront product page)"
                              />
                            </TableCell>
                            <TableCell>
                              <input
                                type="text"
                                value={v.sku}
                                onChange={(e) => updateVariationRow(v.id, 'sku', e.target.value)}
                                placeholder={`${getEffectiveSku()}-OPT`}
                                className="bg-transparent border border-transparent hover:border-[#EFE9E0] focus:border-[#D6403B] rounded-[8px] px-2 py-1 text-xs font-mono text-[#6B6B6B] outline-none w-24 focus:bg-white"
                              />
                            </TableCell>
                            <TableCell>
                              <input
                                type="number"
                                value={v.price}
                                onChange={(e) => updateVariationRow(v.id, 'price', Number(e.target.value))}
                                className="bg-transparent border border-transparent hover:border-[#EFE9E0] focus:border-[#D6403B] rounded-[8px] px-2 py-1 text-xs text-[#2B2B2B] outline-none w-16 focus:bg-white"
                              />
                            </TableCell>
                            <TableCell>
                              <input
                                type="number"
                                value={v.salePrice}
                                onChange={(e) => updateVariationRow(v.id, 'salePrice', Number(e.target.value))}
                                className="bg-transparent border border-transparent hover:border-[#EFE9E0] focus:border-[#D6403B] rounded-[8px] px-2 py-1 text-xs font-bold text-[#C23631] outline-none w-16 focus:bg-white"
                              />
                            </TableCell>
                            <TableCell>
                              <input
                                type="number"
                                value={v.stock}
                                onChange={(e) => updateVariationRow(v.id, 'stock', Number(e.target.value))}
                                className="bg-transparent border border-transparent hover:border-[#EFE9E0] focus:border-[#D6403B] rounded-[8px] px-2 py-1 text-xs text-[#2B2B2B] outline-none w-14 focus:bg-white"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <button
                                type="button"
                                onClick={() => deleteVariationRow(v.id)}
                                className="p-1 rounded text-[#6B6B6B] hover:text-[#9B2420] hover:bg-[#FDE3E1] transition-colors cursor-pointer"
                                aria-label="Delete variation"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <div className="flex justify-end">
                  <Button size="sm" variant="ghost" onClick={handleAddCustomRow}>
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add custom variation row</span>
                  </Button>
                </div>
              </CardContent>
            ) : (
              <CardContent>
                <div className="p-4 bg-[#FAF7F2] rounded-xl border border-dashed border-[#EFE9E0] text-center text-xs text-[#6B6B6B]">
                  This product is currently configured as a single item with no variations. To add multiple sets, sizes, or color options with individual photos and pricing, check <strong>&quot;This product has multiple variations&quot;</strong> above.
                </div>
              </CardContent>
            )}
          </Card>

          {/* 5. Shipping & Search */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping and search</CardTitle>
              <p className="text-xs text-[#6B6B6B]">
                Package dimensions, shipping weights, and SEO metadata
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="number"
                  id="prod-weight"
                  label="Weight (grams)"
                  value={weightGrams}
                  onChange={(e) => {
                    setWeightGrams(e.target.value === '' ? '' : Number(e.target.value));
                    markDirty();
                  }}
                  helperText="Used for Steadfast courier parcel calculation"
                />

                <Input
                  id="prod-package-size"
                  label="Package size"
                  value={packageSize}
                  onChange={(e) => {
                    setPackageSize(e.target.value);
                    markDirty();
                  }}
                  placeholder="e.g., 20 x 15 x 5 cm"
                />
              </div>

              <Input
                id="prod-url-slug"
                label="URL slug"
                value={urlSlug}
                onChange={(e) => {
                  setUrlSlug(e.target.value);
                  markDirty();
                }}
                helperText="Auto-generated from English title: /product/[slug]"
              />

              <Input
                id="prod-seo-title"
                label="SEO title"
                value={seoTitle}
                onChange={(e) => {
                  setSeoTitle(e.target.value);
                  markDirty();
                }}
                placeholder={titleEn}
              />

              <Textarea
                id="prod-seo-desc"
                label="SEO description"
                value={seoDescription}
                onChange={(e) => {
                  setSeoDescription(e.target.value);
                  markDirty();
                }}
                placeholder="Meta description for Google search results..."
                rows={2}
              />
            </CardContent>
          </Card>
        </div>

        {/* =====================================================================
            RIGHT SIDEBAR (4 cols, sticky top-6): Controls & Badges
           ===================================================================== */}
        <div className="lg:col-span-4 space-y-6 sticky top-6">
          {/* Card 1: Publish Status */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Publish</CardTitle>
                <StatusPill variant={publishStatus === 'Published' ? 'green' : 'neutral'} dot>
                  {publishStatus}
                </StatusPill>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {lastAutosaved && (
                <div className="text-[11px] text-[#6B6B6B] flex items-center gap-1.5 bg-[#FAF7F2] p-2 rounded-[10px] border border-[#EFE9E0]">
                  <Clock className="w-3.5 h-3.5 text-[#4CAF7A]" />
                  <span>Draft autosaved at {lastAutosaved}</span>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  fullWidth
                  variant="primary"
                  isLoading={isSubmitting}
                  onClick={() => handleSubmit('Published')}
                >
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? 'Save changes' : 'Publish product'}</span>
                </Button>

                <Button
                  fullWidth
                  variant="secondary"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit('Draft')}
                >
                  Save as draft
                </Button>
              </div>

              {urlSlug && (
                <div className="pt-2 border-t border-[#EFE9E0]">
                  <Link
                    href={`/product/${urlSlug}`}
                    target="_blank"
                    className="text-xs text-[#0B5F85] hover:underline font-semibold flex items-center justify-center gap-1.5"
                  >
                    <span>Preview on store</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Organize */}
          <Card>
            <CardHeader>
              <CardTitle>Organize</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                id="prod-cat"
                label="Category"
                value={categorySlug}
                onChange={(e) => {
                  setCategorySlug(e.target.value);
                  markDirty();
                }}
              >
                {categories.map((c) => (
                  <option key={c.id || c.slug} value={c.slug}>
                    {c.nameEn || c.nameBn}
                  </option>
                ))}
              </Select>

              <Input
                id="prod-subcat"
                label="Sub category (optional)"
                value={subCategory}
                onChange={(e) => {
                  setSubCategory(e.target.value);
                  markDirty();
                }}
                placeholder="e.g., Washable Beeswax"
              />

              <Input
                id="prod-brand"
                label="Brand name"
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  markDirty();
                }}
                placeholder={BRAND_NAME}
              />

              {/* Tag Chips */}
              <div>
                <label className="text-xs font-semibold text-[#2B2B2B] block mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF7F2] border border-[#EFE9E0] text-xs text-[#2B2B2B]"
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTags(tags.filter((item) => item !== t));
                          markDirty();
                        }}
                        className="text-[#6B6B6B] hover:text-[#9B2420]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type tag and press Enter"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Kids Details */}
          <Card>
            <CardHeader>
              <CardTitle>Kids details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                id="prod-age"
                label="Suitable age"
                value={targetAge}
                onChange={(e) => {
                  setTargetAge(e.target.value);
                  markDirty();
                }}
              >
                <option value="1+">1+ বছর (Toddlers 1+)</option>
                <option value="2+">২+ বছর (Ages 2+)</option>
                <option value="3+">৩+ বছর (Ages 3+)</option>
                <option value="5+">৫+ বছর (Ages 5+)</option>
                <option value="All">সকল বয়স (All Ages)</option>
              </Select>

              <Input
                id="prod-badge-text"
                label="Card badge text"
                value={badgeText}
                onChange={(e) => {
                  setBadgeText(e.target.value);
                  markDirty();
                }}
                placeholder="New, সেরা অফার, ৫০% ছাড়"
              />

              {/* Safety Badges Checkboxes */}
              <div>
                <label className="text-xs font-semibold text-[#2B2B2B] block mb-2">
                  Safety badges
                </label>
                <div className="space-y-2">
                  {[
                    '100% Non-toxic',
                    'Food-grade Beeswax',
                    'Washable with Water',
                    'BPA & Lead Free',
                  ].map((badge) => {
                    const isChecked = safetyBadges.includes(badge);
                    return (
                      <label
                        key={badge}
                        className="flex items-center gap-2 text-xs text-[#2B2B2B] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSafetyBadges(safetyBadges.filter((b) => b !== badge));
                            } else {
                              setSafetyBadges([...safetyBadges, badge]);
                            }
                            markDirty();
                          }}
                          className="rounded-[4px] accent-[#D6403B] cursor-pointer"
                        />
                        <span>{badge}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Show on Store Toggles */}
          <Card>
            <CardHeader>
              <CardTitle>Show on store</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-[#2B2B2B]">New products showcase</span>
                <input
                  type="checkbox"
                  checked={showInNewArrivals}
                  onChange={(e) => {
                    setShowInNewArrivals(e.target.checked);
                    markDirty();
                  }}
                  className="rounded-[4px] accent-[#D6403B] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-[#2B2B2B]">Trending now section</span>
                <input
                  type="checkbox"
                  checked={featureInTrending}
                  onChange={(e) => {
                    setFeatureInTrending(e.target.checked);
                    markDirty();
                  }}
                  className="rounded-[4px] accent-[#D6403B] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-[#2B2B2B]">Allow cash on delivery</span>
                <input
                  type="checkbox"
                  checked={allowCashOnDelivery}
                  onChange={(e) => {
                    setAllowCashOnDelivery(e.target.checked);
                    markDirty();
                  }}
                  className="rounded-[4px] accent-[#D6403B] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-[#2B2B2B]">Show stock left badge</span>
                <input
                  type="checkbox"
                  checked={showStockLeft}
                  onChange={(e) => {
                    setShowStockLeft(e.target.checked);
                    markDirty();
                  }}
                  className="rounded-[4px] accent-[#D6403B] cursor-pointer"
                />
              </label>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Discard Changes Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => {
          setShowCancelConfirm(false);
          setIsDirty(false);
          onCancel();
        }}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes in this product form. If you leave now, your current modifications will be lost."
        confirmLabel="Discard & leave"
        cancelLabel="Continue editing"
        isDestructive={true}
      />
    </div>
  );
}
