import mongoose, { Schema, Document, Model } from 'mongoose';

export type VariantStockStatus = 'in_stock' | 'low' | 'out';

export interface ISafetyBadge {
  code: string;
  nameBn: string;
  nameEn: string;
  color?: string;
  description?: string;
}

export interface IVariant {
  _id?: string | mongoose.Types.ObjectId;
  id?: string;
  optionValue: string; // e.g. "12 Piece Set"
  detail?: string; // e.g. "12 shapes + 6 colors + 1 brush" (Bangla allowed)
  sku: string; // unique across the whole store
  regularPrice: number; // required
  salePrice?: number | null; // null means no discount
  stock: number; // integer, min 0
  lowStockAlert: number; // default 5
  image?: string; // variant image url
  isActive: boolean; // default true
  stockStatus?: VariantStockStatus; // virtual / computed on read
  // Backward compatibility:
  imageUrl?: string;
  titleBn?: string;
  titleEn?: string;
  price?: number;
  badge?: string;
}

// Keep legacy alias for existing components
export type IProductVariation = IVariant;

export interface IProductImage {
  url: string;
  altText?: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface IProduct extends Document {
  id?: string;
  title?: string;
  titleBn: string;
  titleEn: string;
  slug: string;
  hasVariations: boolean;
  regularPrice?: number;
  salePrice?: number | null;
  basePrice: number; // Legacy alias for regularPrice
  baseSalePrice?: number | null; // Legacy alias for salePrice
  price?: number;
  costPerItem?: number;
  sku?: string;
  stock?: number;
  lowStockAlert?: number;
  optionName?: string;
  variants?: IVariant[];
  variations?: any[]; // Legacy alias for variants
  totalStock?: number; // Virtual / computed
  stockStatus?: VariantStockStatus; // Virtual / computed
  category?: string;
  categorySlug?: string;
  primaryCategorySlug?: string;
  subCategory?: string;
  brand?: string;
  tags?: string[];
  description?: string;
  descriptionBn?: string;
  descriptionEn?: string;
  shortDescriptionBn?: string;
  shortDescriptionEn?: string;
  pieces?: string;
  boxItems?: string[];
  materials?: string;
  safetyStandards?: string;
  ageAppropriate?: string;
  badge?: string;
  rating?: number;
  reviewsCount?: number;
  reviewCount?: number;
  image?: string;
  imageUrl?: string;
  galleryImages?: string[];
  accentColor?: string;
  tagColor?: string;
  isVariable?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  targetAge?: string;
  targetAgeMin?: number;
  targetAgeMax?: number;
  safetyBadges?: any[];
  specifications?: any[];
  careInstructions?: string;
  faqs?: any[];
  reviews?: any[];
  videoUrl?: string;
  weight?: number;
  packageSize?: string;
  handlingTime?: string;
  seoTitle?: string;
  seoDescription?: string;
  allowCashOnDelivery?: boolean;
  showStockLeft?: boolean;
  requiresGiftWrap?: boolean;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const VariantSchema = new Schema<IVariant>(
  {
    optionValue: { type: String, required: true },
    detail: { type: String, default: '' },
    sku: { type: String, required: true, trim: true },
    regularPrice: { type: Number, required: true },
    salePrice: { type: Number, default: null },
    stock: { type: Number, default: 0, min: 0 },
    lowStockAlert: { type: Number, default: 5 },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  {
    _id: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

VariantSchema.virtual('stockStatus').get(function (this: any) {
  const stock = typeof this.stock === 'number' ? this.stock : 0;
  const alert = typeof this.lowStockAlert === 'number' ? this.lowStockAlert : 5;
  if (stock === 0) return 'out';
  if (stock <= alert) return 'low';
  return 'in_stock';
});

const ProductSchema = new Schema<IProduct>(
  {
    id: { type: String, unique: true, sparse: true, index: true },
    title: { type: String },
    titleBn: { type: String, required: true },
    titleEn: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    hasVariations: { type: Boolean, default: false, index: true },
    regularPrice: { type: Number },
    price: { type: Number },
    basePrice: { type: Number },
    salePrice: { type: Number, default: null },
    baseSalePrice: { type: Number, default: null },
    costPerItem: { type: Number },
    sku: { type: String },
    stock: { type: Number, default: 100 },
    lowStockAlert: { type: Number, default: 5 },
    optionName: { type: String, default: 'Set Options' },
    variants: [VariantSchema],
    category: { type: String },
    categorySlug: { type: String, index: true },
    primaryCategorySlug: { type: String, index: true },
    subCategory: { type: String },
    brand: { type: String },
    tags: [{ type: String }],
    description: { type: String },
    descriptionBn: { type: String },
    descriptionEn: { type: String },
    shortDescriptionBn: { type: String },
    shortDescriptionEn: { type: String },
    pieces: { type: String },
    boxItems: [{ type: String }],
    materials: { type: String },
    safetyStandards: { type: String },
    ageAppropriate: { type: String },
    badge: { type: String },
    rating: { type: Number, default: 4.9 },
    reviewsCount: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    image: { type: String },
    imageUrl: { type: String },
    galleryImages: [{ type: String }],
    accentColor: { type: String },
    tagColor: { type: String },
    isVariable: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false, index: true },
    isNewArrival: { type: Boolean, default: false, index: true },
    targetAge: { type: String },
    targetAgeMin: { type: Number, index: true },
    targetAgeMax: { type: Number, index: true },
    safetyBadges: { type: Schema.Types.Mixed, default: [] },
    specifications: { type: Schema.Types.Mixed, default: [] },
    careInstructions: { type: String },
    faqs: { type: Schema.Types.Mixed, default: [] },
    reviews: { type: Schema.Types.Mixed, default: [] },
    variations: { type: Schema.Types.Mixed, default: [] },
    videoUrl: { type: String },
    weight: { type: Number },
    packageSize: { type: String },
    handlingTime: { type: String },
    seoTitle: { type: String },
    seoDescription: { type: String },
    allowCashOnDelivery: { type: Boolean, default: true },
    showStockLeft: { type: Boolean, default: true },
    requiresGiftWrap: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    strict: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: totalStock = sum of stock of active variants
ProductSchema.virtual('totalStock').get(function (this: any) {
  if (this.hasVariations && Array.isArray(this.variants) && this.variants.length > 0) {
    return this.variants
      .filter((v: any) => v.isActive !== false)
      .reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0);
  }
  return typeof this.stock === 'number' ? this.stock : 0;
});

// Virtual: stockStatus per product
ProductSchema.virtual('stockStatus').get(function (this: any) {
  const total =
    this.hasVariations && Array.isArray(this.variants) && this.variants.length > 0
      ? this.variants
          .filter((v: any) => v.isActive !== false)
          .reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0)
      : typeof this.stock === 'number'
      ? this.stock
      : 0;
  const alert = typeof this.lowStockAlert === 'number' ? this.lowStockAlert : 5;
  if (total === 0) return 'out';
  if (total <= alert) return 'low';
  return 'in_stock';
});

// Indexes
ProductSchema.index({ categorySlug: 1, isActive: 1 });
ProductSchema.index({ isBestSeller: 1, isNewArrival: 1 });
ProductSchema.index({ 'variants.sku': 1 });

if (process.env.NODE_ENV !== 'production' && mongoose.models && mongoose.models.Product) {
  delete (mongoose.models as any).Product;
}

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export default Product;
