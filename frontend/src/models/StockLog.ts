import mongoose, { Schema, Document, Model } from 'mongoose';

export type StockLogReason =
  | 'order'
  | 'cancel'
  | 'return'
  | 'restock'
  | 'manual_edit'
  | 'bulk_edit';

export interface IStockLog extends Document {
  productId: mongoose.Types.ObjectId | string;
  variantId?: mongoose.Types.ObjectId | string | null;
  change: number; // positive (+) or negative (-) integer
  stockBefore: number;
  stockAfter: number;
  reason: StockLogReason;
  orderId?: string;
  adminId?: string;
  note?: string;
  createdAt: Date;
}

const StockLogSchema = new Schema<IStockLog>(
  {
    productId: { type: Schema.Types.Mixed, required: true, index: true },
    variantId: { type: Schema.Types.Mixed, default: null, index: true },
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

// Composite indexes for common stock history queries
StockLogSchema.index({ productId: 1, createdAt: -1 });
StockLogSchema.index({ productId: 1, variantId: 1, createdAt: -1 });
StockLogSchema.index({ reason: 1, createdAt: -1 });

if (process.env.NODE_ENV !== 'production' && mongoose.models && (mongoose.models as any).StockLog) {
  delete (mongoose.models as any).StockLog;
}

export const StockLog: Model<IStockLog> =
  mongoose.models.StockLog || mongoose.model<IStockLog>('StockLog', StockLogSchema);

export default StockLog;
