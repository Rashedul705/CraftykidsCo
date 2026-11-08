import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGiftCategory extends Document {
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GiftCategorySchema = new Schema<IGiftCategory>(
  {
    name: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== 'production' && mongoose.models && (mongoose.models as any).GiftCategory) {
  delete (mongoose.models as any).GiftCategory;
}

export const GiftCategory: Model<IGiftCategory> =
  mongoose.models.GiftCategory || mongoose.model<IGiftCategory>('GiftCategory', GiftCategorySchema);

