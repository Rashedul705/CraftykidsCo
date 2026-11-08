import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBundleSetting extends Document {
  maxDiscountPercent: number;
  showOutOfStockMode: 'greyed' | 'hidden';
  createdAt: Date;
  updatedAt: Date;
}

const BundleSettingSchema = new Schema<IBundleSetting>(
  {
    maxDiscountPercent: { type: Number, default: 20, min: 0, max: 100 },
    showOutOfStockMode: { type: String, enum: ['greyed', 'hidden'], default: 'greyed' },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== 'production' && mongoose.models && (mongoose.models as any).BundleSetting) {
  delete (mongoose.models as any).BundleSetting;
}

export const BundleSetting: Model<IBundleSetting> =
  mongoose.models.BundleSetting || mongoose.model<IBundleSetting>('BundleSetting', BundleSettingSchema);

