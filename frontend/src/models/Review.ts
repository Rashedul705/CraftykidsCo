import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  authorName: string;
  rating: number; // 1 to 5
  comment: string;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', sparse: true },
    authorName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

ReviewSchema.index({ productId: 1, isApproved: 1, createdAt: -1 });

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
export default Review;
