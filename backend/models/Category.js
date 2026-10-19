const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
  slug: { type: String, required: true },
  nameBn: { type: String, required: true },
  nameEn: { type: String, required: true }
}, { _id: false });

const categorySchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true },
  nameBn: { type: String, required: true },
  nameEn: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String, required: true },
  badgeColor: { type: String, default: '#FFE8D6' },
  children: [subCategorySchema]
}, {
  timestamps: true
});

module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);
