import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIncompleteOrder extends Document {
  phone: string;
  customerName?: string;
  district?: string;
  address?: string;
  cartData: Record<string, unknown>;
  subtotal: number;
  ipAddress?: string;
  isFollowedUp: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IncompleteOrderSchema = new Schema<IIncompleteOrder>(
  {
    phone: { type: String, required: true, index: true },
    customerName: { type: String },
    district: { type: String },
    address: { type: String },
    cartData: { type: Schema.Types.Mixed, default: {} },
    subtotal: { type: Number, default: 0 },
    ipAddress: { type: String },
    isFollowedUp: { type: Boolean, default: false, index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const IncompleteOrder: Model<IIncompleteOrder> =
  mongoose.models.IncompleteOrder ||
  mongoose.model<IIncompleteOrder>('IncompleteOrder', IncompleteOrderSchema);
export default IncompleteOrder;
