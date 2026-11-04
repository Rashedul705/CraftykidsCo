import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  productId: any;
  productSlug?: string;
  productTitle?: string;
  productImage?: string;
  userId?: mongoose.Types.ObjectId;
  authorName: string;
  customerPhone?: string;
  rating: number; // 1 to 5
  comment: string;
  photos: string[];
  isVerified: boolean;
  isApproved: boolean;
  adminNote?: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.Mixed, required: true, index: true },
    productSlug: { type: String, index: true },
    productTitle: { type: String },
    productImage: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', sparse: true },
    authorName: { type: String, required: true, trim: true },
    customerPhone: { type: String, trim: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    photos: { type: [String], default: [] },
    isVerified: { type: Boolean, default: false, index: true },
    isApproved: { type: Boolean, default: false, index: true },
    adminNote: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

ReviewSchema.index({ productSlug: 1, isApproved: 1, createdAt: -1 });
ReviewSchema.index({ productId: 1, isApproved: 1, createdAt: -1 });

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
export default Review;
