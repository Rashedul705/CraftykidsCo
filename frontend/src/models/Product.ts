import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISafetyBadge {
  code: string;
  nameBn: string;
  nameEn: string;
  color?: string;
  description?: string;
}

export interface IProductVariation {
  sku: string;
  titleBn?: string;
  titleEn?: string;
  attributes: Record<string, string>; // e.g. { colorSet: '24', ageGroup: '2+' }
  price: number; // Integer BDT
  salePrice?: number | null; // Integer BDT
  stockQuantity: number;
  imageUrl?: string;
  isActive: boolean;
}

export interface IProductImage {
  url: string;
  altText?: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface IProduct extends Document {
  titleBn: string;
  titleEn: string;
  slug: string;
  descriptionBn?: string;
  descriptionEn?: string;
  categoryIds: mongoose.Types.ObjectId[];
  primaryCategorySlug: string;
  basePrice: number; // Integer BDT
  baseSalePrice?: number | null; // Integer BDT
  isVariable: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  targetAgeMin?: number;
  targetAgeMax?: number;
  lowStockThreshold: number;
  safetyBadges: ISafetyBadge[];
  images: IProductImage[];
  variations: IProductVariation[];
  seoTitle?: string;
  seoDescription?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SafetyBadgeSchema = new Schema<ISafetyBadge>(
  {
    code: { type: String, required: true },
    nameBn: { type: String, required: true },
    nameEn: { type: String, required: true },
    color: { type: String, default: '#7BD389' },
    description: { type: String },
  },
  { _id: false }
);

const ProductImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    altText: { type: String },
    isPrimary: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProductVariationSchema = new Schema<IProductVariation>(
  {
    sku: { type: String, required: true },
    titleBn: { type: String },
    titleEn: { type: String },
    attributes: { type: Schema.Types.Mixed, default: {} },
    price: { type: Number, required: true }, // Integer BDT
    salePrice: { type: Number, default: null }, // Integer BDT
    stockQuantity: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const ProductSchema = new Schema<IProduct>(
  {
    titleBn: { type: String, required: true },
    titleEn: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    descriptionBn: { type: String },
    descriptionEn: { type: String },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category', index: true }],
    primaryCategorySlug: { type: String, required: true, index: true },
    basePrice: { type: Number, required: true }, // Integer BDT
    baseSalePrice: { type: Number, default: null }, // Integer BDT
    isVariable: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false, index: true },
    isNewArrival: { type: Boolean, default: false, index: true },
    targetAgeMin: { type: Number, index: true },
    targetAgeMax: { type: Number, index: true },
    lowStockThreshold: { type: Number, default: 5 },
    safetyBadges: [SafetyBadgeSchema],
    images: [ProductImageSchema],
    variations: [ProductVariationSchema],
    seoTitle: { type: String },
    seoDescription: { type: String },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Indexes
ProductSchema.index({ 'variations.sku': 1 });
ProductSchema.index({ primaryCategorySlug: 1, isActive: 1 });
ProductSchema.index({ targetAgeMin: 1, targetAgeMax: 1 });
ProductSchema.index({ basePrice: 1, isActive: 1 });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export default Product;
