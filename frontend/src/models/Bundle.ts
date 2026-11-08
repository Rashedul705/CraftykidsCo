import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBundleItem {
  productId: string;
  productTitleBn: string;
  productTitleEn: string;
  variationSku?: string;
  variationTitle?: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  stock: number;
  imageUrl: string;
}

export interface IBundle extends Document {
  id: string;
  slug: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  imageUrl: string;
  galleryImages: string[];
  items: IBundleItem[];
  pricingMode: 'fixed' | 'percent' | 'amount';
  pricingValue: number;
  bundlePrice: number;
  originalPrice: number;
  discountPercent: number;
  savingsAmount: number;
  totalCost: number;
  profitMargin: number;
  profitMarginPercent: number;
  status: 'active' | 'draft' | 'scheduled';
  startDate?: string;
  endDate?: string;
  suitableAge: string;
  occasion: string;
  badge: string;
  displayLocations: string[];
  hideWhenOutOfStock: boolean;
  isFeatured: boolean;
  showOnHome?: boolean;
  showOnProductPage?: boolean;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

const BundleItemSchema = new Schema<IBundleItem>(
  {
    productId: { type: String, required: true },
    productTitleBn: { type: String, default: '' },
    productTitleEn: { type: String, default: '' },
    variationSku: { type: String, default: '' },
    variationTitle: { type: String, default: '' },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, default: 0 },
    costPrice: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    imageUrl: { type: String, default: '' },
  },
  { _id: false }
);

const BundleSchema = new Schema<IBundle>(
  {
    id: { type: String, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    titleBn: { type: String, required: true },
    titleEn: { type: String, required: true },
    descriptionBn: { type: String, default: '' },
    descriptionEn: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    galleryImages: [{ type: String }],
    items: [BundleItemSchema],
    pricingMode: { type: String, enum: ['fixed', 'percent', 'amount'], default: 'fixed' },
    pricingValue: { type: Number, default: 0 },
    bundlePrice: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    savingsAmount: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 },
    profitMarginPercent: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'draft', 'scheduled'], default: 'active', index: true },
    startDate: { type: String },
    endDate: { type: String },
    suitableAge: { type: String, default: '২-৬ বছর' },
    occasion: { type: String, default: 'everyday' },
    badge: { type: String, default: 'স্পেশাল কম্বো' },
    displayLocations: [{ type: String, default: 'bundles' }],
    hideWhenOutOfStock: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    showOnHome: { type: Boolean, default: false, index: true },
    showOnProductPage: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== 'production' && mongoose.models && (mongoose.models as any).Bundle) {
  delete (mongoose.models as any).Bundle;
}

export const Bundle: Model<IBundle> =
  mongoose.models.Bundle || mongoose.model<IBundle>('Bundle', BundleSchema);

export const CuratedBundle = Bundle;
export type ICuratedBundle = IBundle;
export default Bundle;
