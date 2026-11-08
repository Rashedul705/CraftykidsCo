import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBundleTier extends Document {
  minQuantity: number;
  discountPercent: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const BundleTierSchema = new Schema<IBundleTier>(
  {
    minQuantity: { type: Number, required: true, min: 1, unique: true },
    discountPercent: { type: Number, required: true, min: 0, max: 100 },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== 'production' && mongoose.models && (mongoose.models as any).BundleTier) {
  delete (mongoose.models as any).BundleTier;
}

export const BundleTier: Model<IBundleTier> =
  mongoose.models.BundleTier || mongoose.model<IBundleTier>('BundleTier', BundleTierSchema);

