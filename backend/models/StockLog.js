const mongoose = require('mongoose');

const stockLogSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
    variantId: { type: mongoose.Schema.Types.Mixed, default: null, index: true },
    change: { type: Number, required: true },
    stockBefore: { type: Number, required: true },
    stockAfter: { type: Number, required: true },
    reason: {
      type: String,
      required: true,
      enum: ['order', 'cancel', 'return', 'restock', 'manual_edit', 'bulk_edit'],
      index: true,
    },
    orderId: { type: String, index: true },
    adminId: { type: String },
    note: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'stockLogs',
  }
);

stockLogSchema.index({ productId: 1, createdAt: -1 });
stockLogSchema.index({ productId: 1, variantId: 1, createdAt: -1 });
stockLogSchema.index({ reason: 1, createdAt: -1 });

module.exports = mongoose.models.StockLog || mongoose.model('StockLog', stockLogSchema);
