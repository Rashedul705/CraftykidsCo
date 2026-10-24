import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISafetyBadge {
  code: string;
  nameBn: string;
  nameEn: string;
  color?: string;
  description?: string;
}

export interface IProductVariation {
  id?: string;
  sku: string;
  name?: string;
  detail?: string;
  whatsInIt?: string;
  descriptionBn?: string;
  titleBn?: string;
  titleEn?: string;
  attributes?: Record<string, string>; // e.g. { colorSet: '24', detail: '...' }
  price: number; // Integer BDT
  salePrice?: number | null; // Integer BDT
  stock?: number;
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
  id?: string;
  title?: string;
  titleBn: string;
  titleEn: string;
  slug: string;
  price?: number;
  basePrice: number; // Integer BDT
  salePrice?: number | null; // Integer BDT
  baseSalePrice?: number | null; // Integer BDT
  costPerItem?: number;
  sku?: string;
  stock?: number;
  lowStockAlert?: number;
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
  variations?: any[];
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

const ProductSchema = new Schema<IProduct>(
  {
    id: { type: String, unique: true, sparse: true, index: true },
    title: { type: String },
    titleBn: { type: String, required: true },
    titleEn: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    price: { type: Number },
    basePrice: { type: Number, required: true },
    salePrice: { type: Number },
    baseSalePrice: { type: Number },
    costPerItem: { type: Number },
    sku: { type: String },
    stock: { type: Number, default: 100 },
    lowStockAlert: { type: Number, default: 5 },
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
  { timestamps: true, strict: false }
);

// Indexes
ProductSchema.index({ slug: 1 });
ProductSchema.index({ categorySlug: 1, isActive: 1 });
ProductSchema.index({ isBestSeller: 1, isNewArrival: 1 });

if (process.env.NODE_ENV !== 'production' && mongoose.models && mongoose.models.Product) {
  delete (mongoose.models as any).Product;
}

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export default Product;
