const mongoose = require('mongoose');

const specificationSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false });

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  id: { type: String },
  author: { type: String, required: true },
  location: { type: String },
  rating: { type: Number, default: 5 },
  date: { type: String },
  comment: { type: String, required: true },
  isVerified: { type: Boolean, default: true }
}, { _id: false });

const variationSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  titleBn: { type: String },
  titleEn: { type: String },
  price: { type: Number, required: true },
  salePrice: { type: Number },
  stock: { type: Number, default: 50 },
  imageUrl: { type: String }
}, { _id: false });

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  titleBn: { type: String, required: true },
  titleEn: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  price: { type: Number, required: true },
  basePrice: { type: Number, required: true },
  salePrice: { type: Number, required: true },
  baseSalePrice: { type: Number, required: true },
  category: { type: String, default: 'General' },
  categorySlug: { type: String, required: true, index: true },
  description: { type: String },
  pieces: { type: String },
  badge: { type: String },
  rating: { type: Number, default: 4.9 },
  reviewsCount: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  image: { type: String, required: true },
  imageUrl: { type: String, required: true },
  galleryImages: [{ type: String }],
  accentColor: { type: String },
  tagColor: { type: String },
  isNewArrival: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  targetAgeMin: { type: Number, default: 2 },
  targetAgeMax: { type: Number, default: 8 },
  safetyBadges: [{ type: String }],
  specifications: [specificationSchema],
  careInstructions: { type: String },
  faqs: [faqSchema],
  reviews: [reviewSchema],
  variations: [variationSchema],
  stock: { type: Number, default: 100 }
}, {
  timestamps: true
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
