const mongoose = require('mongoose');

const attributeOptionSchema = new mongoose.Schema(
  {
    labelBn: { type: String, required: true },
    labelEn: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const attributeSchema = new mongoose.Schema(
  {
    id: { type: String },
    code: { type: String, required: true, unique: true, index: true },
    nameBn: { type: String, required: true },
    nameEn: { type: String, required: true },
    type: { type: String, default: 'select' },
    categories: [{ type: String, default: 'ALL' }],
    options: [attributeOptionSchema],
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Attribute || mongoose.model('Attribute', attributeSchema);
