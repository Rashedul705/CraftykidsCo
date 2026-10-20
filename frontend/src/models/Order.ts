import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItemSnapshot {
  productId: any;
  id?: string;
  variationSku?: string;
  bundleId?: any;
  title?: string;
  titleBn?: string;
  titleEn?: string;
  variationTitle?: string;
  variationTitleBn?: string;
  variationTitleEn?: string;
  price?: number;
  unitPrice?: number; // Integer BDT snapshot
  quantity: number;
  total?: number;
  totalPrice?: number; // Integer BDT snapshot
  imageUrl?: string;
}

export interface IOrderStatusHistory {
  status: string;
  note?: string;
  changedBy?: string;
  timestamp: any;
}

export interface IOrder extends Document {
  id?: string;
  orderNumber: string; // e.g. CKC-20261013-0001
  userId?: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  district: string;
  area?: string;
  fullAddress: string;
  customerNote?: string;
  subtotal: number; // Integer BDT
  deliveryCharge: number; // Integer BDT
  discountAmount: number; // Integer BDT
  totalAmount: number; // Integer BDT
  couponCode?: string;
  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'RETURNED';
  paymentStatus: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'COD' | 'BKASH' | 'NAGAD' | 'CARD';
  courier?: string;
  consignmentId?: string;
  trackingCode?: string;
  source?: string;
  internalNote?: string;
  ipAddress?: string;
  items: IOrderItemSnapshot[];
  statusHistory?: IOrderStatusHistory[];
  timeline?: { status: string; timestamp: string; note?: string }[];
  shipmentId?: mongoose.Types.ObjectId;
  paymentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSnapshotSchema = new Schema<IOrderItemSnapshot>(
  {
    productId: { type: Schema.Types.Mixed, required: true },
    id: { type: String },
    variationSku: { type: String },
    bundleId: { type: Schema.Types.Mixed },
    title: { type: String },
    titleBn: { type: String, default: '' },
    titleEn: { type: String, default: '' },
    variationTitle: { type: String },
    variationTitleBn: { type: String },
    variationTitleEn: { type: String },
    price: { type: Number },
    unitPrice: { type: Number },
    quantity: { type: Number, required: true, min: 1 },
    total: { type: Number },
    totalPrice: { type: Number },
    imageUrl: { type: String },
  },
  { _id: true }
);

const OrderStatusHistorySchema = new Schema<IOrderStatusHistory>(
  {
    status: { type: String, required: true },
    note: { type: String },
    changedBy: { type: String, default: 'SYSTEM' },
    timestamp: { type: Schema.Types.Mixed, default: Date.now },
  },
  { _id: false }
);

const TimelineSchema = new Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: String, required: true },
    note: { type: String }
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    id: { type: String },
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', sparse: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true, index: true },
    district: { type: String, required: true },
    area: { type: String },
    fullAddress: { type: String, required: true },
    customerNote: { type: String },
    subtotal: { type: Number, required: true },
    deliveryCharge: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    couponCode: { type: String },
    status: {
      type: String,
      enum: [
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'RETURNED',
      ],
      default: 'PENDING',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'UNPAID',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'BKASH', 'NAGAD', 'CARD'],
      default: 'COD',
      index: true,
    },
    courier: { type: String },
    consignmentId: { type: String },
    trackingCode: { type: String },
    source: { type: String, default: 'website' },
    internalNote: { type: String },
    ipAddress: { type: String, index: true },
    items: [OrderItemSnapshotSchema],
    statusHistory: [OrderStatusHistorySchema],
    timeline: [TimelineSchema],
    shipmentId: { type: Schema.Types.ObjectId, ref: 'Shipment' },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
  },
  { timestamps: true }
);

// Compound indexes for admin queries
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ customerPhone: 1, createdAt: -1 });

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
