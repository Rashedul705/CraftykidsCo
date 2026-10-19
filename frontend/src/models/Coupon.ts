import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICouponUsage {
  orderId: string;
  phone: string;
  usedAt: Date;
}

export interface ICoupon extends Document {
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountVal: number;
  minOrderVal: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  expiresAt?: Date;
  isActive: boolean;
  usages: ICouponUsage[];
  createdAt: Date;
  updatedAt: Date;
}

const CouponUsageSchema = new Schema<ICouponUsage>(
  {
    orderId: { type: String, required: true },
    phone: { type: String, required: true },
    usedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    discountType: { type: String, enum: ['PERCENT', 'FIXED'], required: true },
    discountVal: { type: Number, required: true },
    minOrderVal: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    usageLimit: { type: Number },
    usageCount: { type: Number, default: 0 },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    usages: [CouponUsageSchema],
  },
  { timestamps: true }
);

export const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
export default Coupon;
