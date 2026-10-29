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

const variantSchema = new mongoose.Schema(
  {
    optionValue: { type: String, required: true },
    detail: { type: String, default: '' },
    sku: { type: String, required: true, trim: true },
    regularPrice: { type: Number, required: true },
    salePrice: { type: Number, default: null },
    stock: { type: Number, default: 0, min: 0 },
    lowStockAlert: { type: Number, default: 5 },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  {
    _id: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

variantSchema.virtual('stockStatus').get(function () {
  const stock = typeof this.stock === 'number' ? this.stock : 0;
  const alert = typeof this.lowStockAlert === 'number' ? this.lowStockAlert : 5;
  if (stock === 0) return 'out';
  if (stock <= alert) return 'low';
  return 'in_stock';
});

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    titleBn: { type: String, required: true },
    titleEn: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    hasVariations: { type: Boolean, default: false, index: true },
    regularPrice: { type: Number },
    salePrice: { type: Number, default: null },
    sku: { type: String },
    stock: { type: Number, default: 100 },
    lowStockAlert: { type: Number, default: 5 },
    optionName: { type: String, default: 'Set Options' },
    variants: [variantSchema],
    price: { type: Number },
    basePrice: { type: Number },
    baseSalePrice: { type: Number },
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
    variations: [variantSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('totalStock').get(function () {
  if (this.hasVariations && Array.isArray(this.variants) && this.variants.length > 0) {
    return this.variants
      .filter((v) => v.isActive !== false)
      .reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  }
  return typeof this.stock === 'number' ? this.stock : 0;
});

productSchema.virtual('stockStatus').get(function () {
  const total =
    this.hasVariations && Array.isArray(this.variants) && this.variants.length > 0
      ? this.variants
          .filter((v) => v.isActive !== false)
          .reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
      : typeof this.stock === 'number'
      ? this.stock
      : 0;
  const alert = typeof this.lowStockAlert === 'number' ? this.lowStockAlert : 5;
  if (total === 0) return 'out';
  if (total <= alert) return 'low';
  return 'in_stock';
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
