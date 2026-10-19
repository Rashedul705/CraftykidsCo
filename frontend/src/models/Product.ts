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
  id?: string;
  title?: string;
  titleBn: string;
  titleEn: string;
  slug: string;
  price?: number;
  basePrice: number; // Integer BDT
  salePrice?: number | null; // Integer BDT
  baseSalePrice?: number | null; // Integer BDT
  category?: string;
  categorySlug?: string;
  primaryCategorySlug?: string;
  description?: string;
  descriptionBn?: string;
  descriptionEn?: string;
  pieces?: string;
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
  targetAgeMin?: number;
  targetAgeMax?: number;
  safetyBadges?: any[];
  specifications?: any[];
  careInstructions?: string;
  faqs?: any[];
  reviews?: any[];
  variations?: any[];
  stock?: number;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    id: { type: String },
    title: { type: String },
    titleBn: { type: String, required: true },
    titleEn: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    price: { type: Number },
    basePrice: { type: Number, required: true },
    salePrice: { type: Number },
    baseSalePrice: { type: Number },
    category: { type: String },
    categorySlug: { type: String, index: true },
    primaryCategorySlug: { type: String, index: true },
    description: { type: String },
    descriptionBn: { type: String },
    descriptionEn: { type: String },
    pieces: { type: String },
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
    targetAgeMin: { type: Number, index: true },
    targetAgeMax: { type: Number, index: true },
    safetyBadges: { type: Schema.Types.Mixed, default: [] },
    specifications: { type: Schema.Types.Mixed, default: [] },
    careInstructions: { type: String },
    faqs: { type: Schema.Types.Mixed, default: [] },
    reviews: { type: Schema.Types.Mixed, default: [] },
    variations: { type: Schema.Types.Mixed, default: [] },
    stock: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Indexes
ProductSchema.index({ slug: 1 });
ProductSchema.index({ categorySlug: 1, isActive: 1 });
ProductSchema.index({ isBestSeller: 1, isNewArrival: 1 });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export default Product;
