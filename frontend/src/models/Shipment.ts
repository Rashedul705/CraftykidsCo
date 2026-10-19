import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IShipment extends Document {
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  courier: string; // 'STEADFAST'
  consignmentId?: string;
  trackingCode?: string;
  status: 'IN_REVIEW' | 'PENDING' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  codAmount: number; // Integer BDT
  courierCharge: number; // Integer BDT
  rawResponse?: Record<string, unknown>;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ShipmentSchema = new Schema<IShipment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderNumber: { type: String, required: true },
    courier: { type: String, default: 'STEADFAST' },
    consignmentId: { type: String, sparse: true, index: true },
    trackingCode: { type: String, sparse: true, index: true },
    status: {
      type: String,
      enum: ['IN_REVIEW', 'PENDING', 'DELIVERED', 'CANCELLED', 'RETURNED'],
      default: 'IN_REVIEW',
      index: true,
    },
    codAmount: { type: Number, required: true },
    courierCharge: { type: Number, default: 0 },
    rawResponse: { type: Schema.Types.Mixed },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

export const Shipment: Model<IShipment> =
  mongoose.models.Shipment || mongoose.model<IShipment>('Shipment', ShipmentSchema);
export default Shipment;
