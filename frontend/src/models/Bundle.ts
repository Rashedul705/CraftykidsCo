import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBundleItem {
  productId: mongoose.Types.ObjectId;
  variationSku?: string;
  quantity: number;
}

export interface IBundle extends Document {
  titleBn: string;
  titleEn: string;
  slug: string;
  descriptionBn?: string;
  descriptionEn?: string;
  price: number; // Integer BDT
  originalPrice: number; // Integer BDT
  discountPercent?: number;
  imageUrl?: string;
  items: IBundleItem[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BundleItemSchema = new Schema<IBundleItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variationSku: { type: String },
    quantity: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

const BundleSchema = new Schema<IBundle>(
  {
    titleBn: { type: String, required: true },
    titleEn: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    descriptionBn: { type: String },
    descriptionEn: { type: String },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    discountPercent: { type: Number },
    imageUrl: { type: String },
    items: [BundleItemSchema],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Bundle: Model<IBundle> =
  mongoose.models.Bundle || mongoose.model<IBundle>('Bundle', BundleSchema);
export default Bundle;
