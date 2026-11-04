const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
    productSlug: { type: String, index: true },
    productTitle: { type: String },
    productImage: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', sparse: true },
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

reviewSchema.index({ productSlug: 1, isApproved: 1, createdAt: -1 });
reviewSchema.index({ productId: 1, isApproved: 1, createdAt: -1 });

module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);

